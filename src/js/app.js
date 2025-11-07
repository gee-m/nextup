// @order: 100
// @category: app
// @description: Main application entry point - initialization and event listeners

/**
 * Application Initialization and Event Listeners
 *
 * This module contains:
 * - init(): Application initialization sequence
 * - setupEventListeners(): Wire up all DOM event handlers
 * - updateShortcutsHelp(): Update keyboard shortcut help text
 *
 * Load Order: This file has @order: 100 to ensure it loads LAST,
 * after all mixin methods have been added to the app object.
 */

Object.assign(app, {
    /**
     * Initialize the application
     *
     * Sequence:
     * 1. Load data from localStorage
     * 2. Repair corrupted working task states
     * 3. Center viewBox on tasks (first-time users only)
     * 4. Setup DOM event listeners
     * 5. Update UI help text
     * 6. Initial render
     */
    async init() {
        const data = localStorage.getItem('taskTree');
        const parsed = data ? JSON.parse(data) : null;
        const hasStoredViewBox = parsed && parsed.viewBoxX !== undefined && parsed.viewBoxY !== undefined;

        // Initialize IndexedDB image store
        await this.initImageStore();

        this.loadFromStorage();

        // Auto-repair any corrupted working task states on load (silent mode)
        this.repairWorkingTasks(true);

        // Center viewBox on tasks ONLY if no saved viewBox position exists
        // (for first-time users or migrating from old version)
        if (!hasStoredViewBox && this.tasks.length > 0) {
            const centerX = this.tasks.reduce((sum, t) => sum + t.x, 0) / this.tasks.length;
            const centerY = this.tasks.reduce((sum, t) => sum + t.y, 0) / this.tasks.length;
            this.viewBox.x = centerX - this.viewBox.width / 2;
            this.viewBox.y = centerY - this.viewBox.height / 2;
        }

        this.setupEventListeners();
        this.updateShortcutsHelp();
        this.updateStatusBar();
        this.render();
    },

    /**
     * Update keyboard shortcuts help text in UI
     *
     * Updates:
     * - #shortcuts-help element with platform-specific modifiers
     * - Button tooltips with keyboard hints
     */
    updateShortcutsHelp() {
        // Update the shortcuts help text with platform-specific modifiers
        const mod = this.getModifierKey();
        const shift = this.getShiftKey();

        const helpElement = document.getElementById('shortcuts-help');
        if (helpElement) {
            helpElement.textContent = `Double-click: edit | ${mod}+Dbl-click: create | ${shift}+Double-click: hide/show | ${mod}+Drag: reparent | Right-click: menu | ${mod}+Click: multi-select | Backspace: delete | Middle-click: cycle | ${mod}+K: link | P: priority | J: jump | ${shift}+Drag: subtree | ${mod}+C: copy | ${mod}+V: paste (auto-detects image) | ${mod}+Z: undo`;
        }

        // Update tooltips with platform-specific text
        const jumpBtn = document.getElementById('jump-to-working-btn');
        if (jumpBtn) {
            jumpBtn.title = 'Jump to working task (J)';
        }
    },

    /**
     * Setup all DOM event listeners
     *
     * Event categories:
     * - Mouse: click, dblclick, mousedown, mousemove, mouseup, contextmenu
     * - Keyboard: keydown for all shortcuts
     * - Wheel: zoom with mouse wheel/trackpad
     * - Window: resize to adjust viewBox
     * - Modals: click outside to close
     */
    setupEventListeners() {
        const container = document.getElementById('canvas-container');
        const svg = document.getElementById('canvas');

        // ========================================
        // Mouse Events (delegate to mouse.js handlers)
        // ========================================
        svg.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        svg.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        svg.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));

        // ========================================
        // Double-Click Events
        // ========================================
        svg.addEventListener('dblclick', (e) => {
            if (this.editingTaskId !== null) return; // Already editing

            // Check if double-clicking on arrow dot (reset to default position)
            if (e.target.classList && e.target.classList.contains('arrow-dot')) {
                const dotType = e.target.getAttribute('data-dot-type');
                const taskId = parseInt(e.target.getAttribute('data-task-id'));
                const relatedId = parseInt(e.target.getAttribute('data-related-id'));

                // For source dots: taskId is parent, relatedId is child
                // For target dots: taskId is child, relatedId is parent
                const dotInfo = {
                    type: dotType,
                    taskId: taskId
                };

                if (dotType === 'source') {
                    dotInfo.childId = relatedId;
                } else {
                    dotInfo.parentId = relatedId;
                }

                this.resetArrowPosition(dotInfo);

                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Check if double-clicking on curve control dot (remove this control point)
            // ONLY works when Ctrl is held
            if (e.target.classList && e.target.classList.contains('curve-dot') && (e.ctrlKey || e.metaKey)) {
                const linkType = e.target.getAttribute('data-link-type');
                const taskId = parseInt(e.target.getAttribute('data-task-id'));
                const relatedId = parseInt(e.target.getAttribute('data-related-id'));
                const pointIndex = parseInt(e.target.getAttribute('data-point-index'));

                this.removeControlPoint({
                    linkType: linkType,
                    taskId: taskId,
                    relatedTaskId: relatedId,
                    pointIndex: pointIndex
                });

                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Check if double-clicking on an image (open modal viewer)
            if (e.target.classList && e.target.classList.contains('task-image')) {
                const taskId = parseInt(e.target.dataset.taskId);
                const task = this.tasks.find(t => t.id === taskId);
                if (task && task.imageId) {
                    const blobUrl = this.imageCache.get(task.imageId);
                    if (blobUrl) {
                        this.openImageModal(task, blobUrl);
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }
            }

            // Try to find task-node by traversing up DOM
            let element = e.target;
            while (element && element !== svg) {
                if (element.dataset && element.dataset.id && element.classList?.contains('task-node')) {
                    const taskId = parseInt(element.dataset.id);

                    if (e.ctrlKey || e.metaKey) {
                        // Ctrl+double click on node: create child task
                        this.addChildTask(taskId);
                    } else if (e.shiftKey) {
                        // Shift+double click: hide/show the node itself
                        this.toggleHiddenSelf(taskId);
                    } else {
                        // Normal double click: edit task name
                        this.startEditing(taskId);
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                element = element.parentElement;
            }

            // Ctrl+double-click on empty space: create root task at cursor
            if (e.ctrlKey || e.metaKey) {
                const pt = this.getSVGPoint(e);
                this.addRootTaskAtPosition(pt.x, pt.y);
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // ========================================
        // Middle Mouse Button (cycle status)
        // ========================================
        svg.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse button
                const node = e.target.closest('.task-node');
                if (node) {
                    const taskId = parseInt(node.dataset.id);
                    this.cycleStatus(taskId);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });

        // ========================================
        // Click Events (selection, multi-select)
        // ========================================
        svg.addEventListener('click', (e) => {
            const node = e.target.closest('.task-node');

            if (node) {
                const taskId = parseInt(node.dataset.id);

                // Alt+click: Delete node
                if (e.altKey && !e.ctrlKey && !e.metaKey) {
                    this.deleteTask(taskId);
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                // Ctrl+click: Multi-select (toggle selection)
                if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                    if (this.selectedTaskIds.has(taskId)) {
                        this.selectedTaskIds.delete(taskId);
                    } else {
                        this.selectedTaskIds.add(taskId);
                    }
                    this.lastClickedTaskId = taskId;
                    requestAnimationFrame(() => this.render());
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                // Plain left-click: Select only this node (clear others)
                if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
                    this.selectedTaskIds.clear();
                    this.selectedTaskIds.add(taskId);
                    this.lastClickedTaskId = taskId;
                    requestAnimationFrame(() => this.render());
                    return;
                }

                // Shift+click: Reserved for future use
                if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // Currently unused - available for future feature
                    // For now, treat as regular click
                    this.selectedTaskIds.clear();
                    this.selectedTaskIds.add(taskId);
                    this.lastClickedTaskId = taskId;
                    requestAnimationFrame(() => this.render());
                    return;
                }
            }

            // Click on arrow: select it (arrows can be <path> or <line> elements)
            if ((e.target.tagName === 'path' || e.target.tagName === 'line') && e.target.classList.contains('link')) {
                const arrow = e.target;
                if (arrow.dataset.type && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // Select the arrow
                    if (arrow.dataset.type === 'parent') {
                        this.selectedLine = {
                            type: 'parent',
                            taskId: parseInt(arrow.dataset.taskId),
                            parentId: parseInt(arrow.dataset.parentId)
                        };

                        // Update timestamp to prioritize this arrow's dots
                        this.updateArrowTimestamp(parseInt(arrow.dataset.taskId), parseInt(arrow.dataset.parentId));
                    } else if (arrow.dataset.type === 'dependency') {
                        this.selectedLine = {
                            type: 'dependency',
                            from: parseInt(arrow.dataset.from),
                            to: parseInt(arrow.dataset.to)
                        };
                    }
                    this.selectedTaskIds.clear(); // Clear node selection
                    this.render();
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
        });

        // ========================================
        // Context Menu (right-click)
        // ========================================
        svg.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const node = e.target.closest('.task-node');
            if (node) {
                // Right-click on node
                const taskId = parseInt(node.dataset.id);
                this.showNodeMenu(e, taskId);
            } else {
                // Right-click on empty space
                this.showEmptySpaceMenu(e);
            }
        });

        // Close menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            const menu = document.querySelector('.node-menu');
            if (menu) {
                if (!e.target.closest('.node-menu')) {
                    this.closeMenu();
                }
            }
        });

        // ========================================
        // Keyboard Events (shortcuts)
        // ========================================

        // Backspace/Delete to delete selected node(s) or line
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when modal is open
            const anyModalOpen = document.querySelector('.modal.show');
            if (anyModalOpen) return;

            if (e.key === 'Backspace' && this.editingTaskId === null) {
                if (this.selectedTaskIds.size > 0) {
                    e.preventDefault();
                    // Delete all selected tasks
                    const selectedArray = Array.from(this.selectedTaskIds);
                    if (selectedArray.length === 1) {
                        this.deleteTask(selectedArray[0]);
                    } else {
                        this.deleteMultipleTasks(selectedArray);
                    }
                } else if (this.selectedLine) {
                    e.preventDefault();
                    this.deleteLine(this.selectedLine);
                }
            }

            // Escape to clear selection
            if (e.key === 'Escape' && this.editingTaskId === null) {
                // Check if any modal is open - if so, let the modal's handler handle it
                const anyModalOpen = document.querySelector('.modal.show');
                if (!anyModalOpen && (this.selectedTaskIds.size > 0 || this.selectedLine)) {
                    this.selectedTaskIds.clear();
                    this.selectedLine = null;
                    this.render();
                }
            }

            // P to cycle priority of hovered task (or selected if not hovering)
            if ((e.key === 'p' || e.key === 'P') && this.editingTaskId === null) {
                if (this.hoveredTaskId !== null) {
                    // Hovering over a task - change its priority
                    e.preventDefault();
                    this.cyclePriority(this.hoveredTaskId);
                } else if (this.selectedTaskIds.size > 0) {
                    // Not hovering - fall back to selected task(s)
                    e.preventDefault();
                    const selectedArray = Array.from(this.selectedTaskIds);
                    selectedArray.forEach(id => this.cyclePriority(id));
                }
            }

            // Ctrl+Alt+A to toggle arrow routing mode
            if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && e.altKey && this.editingTaskId === null) {
                e.preventDefault();
                // Toggle between 'direct' and 'orthogonal'
                this.arrowRoutingMode = this.arrowRoutingMode === 'direct' ? 'orthogonal' : 'direct';
                const modeName = this.arrowRoutingMode === 'direct' ? 'Direct' : 'Orthogonal';
                this.showToast(`Arrow routing: ${modeName}`, 'info', 2000);
                this.saveToStorage();
                this.render();
            }
        });

        // ========================================
        // Window Resize
        // ========================================
        window.addEventListener('resize', () => {
            this.viewBox.width = window.innerWidth;
            this.viewBox.height = window.innerHeight - 60;
            this.render();
        });

        // ========================================
        // Modal Click-Outside Handlers
        // ========================================
        document.getElementById('import-modal').addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.hideImportModal();
            }
        });

        document.getElementById('confirm-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirm-modal') {
                this.hideConfirm();
            }
        });

        document.getElementById('alert-modal').addEventListener('click', (e) => {
            if (e.target.id === 'alert-modal') {
                this.hideAlert();
            }
        });

        document.getElementById('create-home-modal').addEventListener('click', (e) => {
            if (e.target.id === 'create-home-modal') {
                this.hideCreateHomeModal();
            }
        });

        document.getElementById('manage-homes-modal').addEventListener('click', (e) => {
            if (e.target.id === 'manage-homes-modal') {
                this.hideManageHomesModal();
            }
        });

        // Enter key to create home from modal
        document.getElementById('home-name-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.createHomeFromModal();
            }
        });

        // ========================================
        // Mouse Wheel Zoom (zooms toward cursor position)
        // ========================================
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Get cursor position in SVG coordinates BEFORE zoom
            const cursorBeforeZoom = this.getSVGPoint(e);

            // Normalize deltaY based on deltaMode
            // deltaMode: 0 = pixels, 1 = lines, 2 = pages
            let delta = e.deltaY;
            if (e.deltaMode === 1) delta *= 33;  // Lines to pixels
            if (e.deltaMode === 2) delta *= 100; // Pages to pixels

            // Clamp to prevent extreme jumps
            delta = Math.max(-100, Math.min(100, delta));

            // Scale zoom change proportionally to delta magnitude
            const zoomChange = (delta / 100) * this.wheelZoomSpeed;
            const zoomFactor = 1 + zoomChange;

            const oldZoomLevel = this.zoomLevel;
            this.zoomLevel = Math.max(
                this.minZoom,
                Math.min(this.maxZoom, this.zoomLevel * zoomFactor)
            );

            // Calculate how viewBox dimensions change
            const oldWidth = this.viewBox.width;
            const oldHeight = this.viewBox.height;
            const newWidth = window.innerWidth / this.zoomLevel;
            const newHeight = (window.innerHeight - 60) / this.zoomLevel;

            // Calculate cursor position as ratio in old viewBox
            const cursorRatioX = (cursorBeforeZoom.x - this.viewBox.x) / oldWidth;
            const cursorRatioY = (cursorBeforeZoom.y - this.viewBox.y) / oldHeight;

            // Adjust viewBox position to keep cursor at same SVG coordinate
            this.viewBox.x = cursorBeforeZoom.x - (cursorRatioX * newWidth);
            this.viewBox.y = cursorBeforeZoom.y - (cursorRatioY * newHeight);
            this.viewBox.width = newWidth;
            this.viewBox.height = newHeight;

            this.updateZoomDisplay();
            this.render();

            // Debounce saveToStorage for smooth zooming
            clearTimeout(this._zoomSaveTimeout);
            this._zoomSaveTimeout = setTimeout(() => {
                this.saveToStorage();
            }, 500);
        }, { passive: false });

        // ========================================
        // Keyboard Shortcuts (Zoom, Undo/Redo, Copy/Paste, etc.)
        // ========================================
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when modal is open
            const anyModalOpen = document.querySelector('.modal.show');
            if (anyModalOpen) return;

            if (this.editingTaskId !== null) return; // Don't run shortcuts while editing text

            // Arrow keys = move selected nodes 1 pixel
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (this.selectedTaskIds.size > 0) {
                    e.preventDefault();

                    const selectedTasks = Array.from(this.selectedTaskIds)
                        .map(id => this.tasks.find(t => t.id === id))
                        .filter(t => t);

                    if (selectedTasks.length === 0) return;

                    // Save snapshot for undo
                    const taskNames = selectedTasks.map(t => this.truncateTitle(t.title || 'Untitled', 20)).join(', ');
                    this.saveSnapshot(`Move ${selectedTasks.length} task(s): ${taskNames}`);

                    // Move all selected tasks by 1 pixel
                    selectedTasks.forEach(task => {
                        if (e.key === 'ArrowUp') task.y -= 1;
                        else if (e.key === 'ArrowDown') task.y += 1;
                        else if (e.key === 'ArrowLeft') task.x -= 1;
                        else if (e.key === 'ArrowRight') task.x += 1;
                    });

                    this.render();
                    this.saveToStorage();
                }
            }

            // Ctrl/Cmd + Plus/Equals = zoom in
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                this.zoomIn();
            }

            // Ctrl/Cmd + Minus = zoom out
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            }

            // Ctrl/Cmd + 0 = reset zoom
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                this.resetZoom();
            }

            // Ctrl/Cmd + 1 = zoom to fit
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                this.zoomToFit();
            }

            // Ctrl/Cmd + Z = undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }

            // Ctrl/Cmd + Shift + Z or Ctrl + Y = redo
            if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
                (e.ctrlKey && e.key.toLowerCase() === 'y')) {
                e.preventDefault();
                this.redo();
            }

            // Ctrl/Cmd + C = copy subtree
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (this.selectedTaskIds.size === 1) {
                    const taskId = Array.from(this.selectedTaskIds)[0];
                    this.copySubtree(taskId);
                } else if (this.selectedTaskIds.size > 1) {
                    this.showToast('⚠️ Select a single node to copy its subtree', 'warning', 2000);
                } else {
                    this.showToast('⚠️ Select a task first to copy', 'warning', 2000);
                }
            }

            // Ctrl/Cmd + V = smart paste (auto-detect image vs subtree)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                // Smart paste: check clipboard for image first, then fall back to subtree
                this.smartPaste();
            }

            // Ctrl/Cmd + K = attach link to selected node
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (this.selectedTaskIds.size === 1) {
                    const taskId = Array.from(this.selectedTaskIds)[0];
                    this.attachLink(taskId);
                } else if (this.selectedTaskIds.size > 1) {
                    this.showToast('⚠️ Select a single node to attach a link', 'warning');
                } else {
                    this.showToast('⚠️ Select a task first to attach a link', 'warning');
                }
            }

            // J = show working tasks menu / jump to working task
            if ((e.key === 'j' || e.key === 'J') && this.editingTaskId === null && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                // Check if dropdown is already open
                const existingDropdown = document.getElementById('working-tasks-dropdown');
                if (existingDropdown) {
                    // J pressed again while menu open → jump to default
                    this.jumpToWorkingTask();
                    existingDropdown.remove();
                } else {
                    // Open the dropdown menu
                    this.showWorkingTasksDropdown(null, true); // true = keyboard mode
                }
            }

            // T = toggle timer window (expand/minimize)
            if ((e.key === 't' || e.key === 'T') && this.editingTaskId === null && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                if (this.timerState.isRunning) {
                    this.toggleTimerWindow();
                } else {
                    this.showToast('⏱️ No timer running. Middle-click a task to start working.', 'info', 2000);
                }
            }

            // Number keys (0-9) = jump to home with that keybind
            if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[0-9]$/.test(e.key)) {
                // Find home with this keybind
                const home = this.homes.find(h => h.keybind === e.key);
                if (home) {
                    e.preventDefault();
                    this.jumpToHome(home.id);
                }
            }
        });
    },

    clearAllData() {
        this.showConfirm(
            'Clear All Data',
            'Delete ALL tasks and reset everything? This can be undone with Ctrl+Z.',
            () => {
                this.saveSnapshot('Cleared all data');
                localStorage.removeItem('taskTree');
                this.tasks = [];
                this.taskIdCounter = 0;
                this.editingTaskId = null;

                this.updateStatusBar();
                this.render();
            }
        );
    }
});

console.log('✓ App initialization loaded');

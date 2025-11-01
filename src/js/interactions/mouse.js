/**
 * @module interactions/mouse
 * @order 25
 * @category interactions
 *
 * Mouse event handlers for canvas interactions
 */

export const MouseMixin = {
    onCanvasMouseDown(e) {
        // Don't start drag if we're editing
        if (this.editingTaskId !== null) return;

        // Don't interfere with line clicks - let the click handler deal with them
        if (e.target.tagName === 'line' && e.target.classList.contains('link')) {
            return; // Exit early, allow click event to fire
        }

        if (e.target.closest('.task-node')) {
            const node = e.target.closest('.task-node');
            const taskId = parseInt(node.dataset.id);

            if (e.button === 0) { // Left click
                if (e.ctrlKey || e.metaKey) {
                    // Prepare for potential reparent drag (will activate on mousemove >5px)
                    // If no drag occurs, click event will handle multi-select
                    this.dragMode = 'reparent-pending';
                    this.selectedNode = taskId;
                    const pt = this.getSVGPoint(e);
                    this.dragStart = { x: pt.x, y: pt.y };
                    this.dragStartOriginal = { x: pt.x, y: pt.y };
                } else if (e.altKey) {
                    // Start dependency drag
                    this.dragMode = 'dependency';
                    this.selectedNode = taskId;
                    this.createTempLine(e);
                    // Create custom cursor arrow
                    this.cursorArrow = this.createCursorArrow();
                    // For dependency: reverse the line so it shows (cursor → source)
                    // This matches the final arrow direction: prerequisite → dependent
                    const task = this.tasks.find(t => t.id === taskId);
                    if (task && this.tempLine) {
                        const pt = this.getSVGPoint(e);
                        this.tempLine.setAttribute('x1', pt.x);
                        this.tempLine.setAttribute('y1', pt.y);
                        this.tempLine.setAttribute('x2', task.x);
                        this.tempLine.setAttribute('y2', task.y);
                    }
                } else if (e.shiftKey) {
                    // Prepare for potential subtree drag (will activate on mousemove >5px)
                    this.dragMode = 'subtree-pending';
                    this.selectedNode = taskId;
                    const pt = this.getSVGPoint(e);
                    this.dragStart = { x: pt.x, y: pt.y };
                    this.dragStartOriginal = { x: pt.x, y: pt.y };
                } else {
                    // Start node drag
                    this.dragMode = 'node';
                    this.selectedNode = taskId;
                    const task = this.tasks.find(t => t.id === taskId);
                    const pt = this.getSVGPoint(e);
                    this.dragStart = { x: pt.x - task.x, y: pt.y - task.y };
                    this.dragOriginalPos = { x: task.x, y: task.y };

                    // Save snapshot BEFORE drag starts (captures original position)
                    if (this.selectedTaskIds.size > 1) {
                        this.saveSnapshot(`Move ${this.selectedTaskIds.size} tasks`);
                    } else {
                        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
                        this.saveSnapshot(`Move task '${truncatedTitle}'`);
                    }
                }
            }
            e.preventDefault();
            e.stopPropagation();
        } else {
            // Clicked on empty space
            if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
                // Ctrl+Drag on empty space: prepare for box selection (Windows standard)
                const pt = this.getSVGPoint(e);
                this.dragMode = 'box-select';
                this.boxSelectStart = { x: pt.x, y: pt.y };
                this.isBoxSelecting = true;
                e.preventDefault();
            } else {
                // Pan canvas - use screen coordinates (stable, unlike SVG coords which change with viewBox)
                this.dragMode = 'canvas';
                this.dragStart = { x: e.clientX, y: e.clientY };
                const pt = this.getSVGPoint(e);
                this.dragStartOriginal = { x: pt.x, y: pt.y }; // Track original for click detection (SVG coords)
                document.getElementById('canvas-container').classList.add('dragging');
                e.preventDefault();
            }
        }
    },

    onCanvasMouseMove(e) {
        // Always track mouse position for Ctrl+V paste at cursor
        const pt = this.getSVGPoint(e);
        this.lastMousePosition = { x: pt.x, y: pt.y };

        if (!this.dragMode) return;

        e.preventDefault();

        if (this.dragMode === 'box-select' && this.boxSelectStart) {
            // Draw visual feedback for box selection
            const minX = Math.min(this.boxSelectStart.x, pt.x);
            const minY = Math.min(this.boxSelectStart.y, pt.y);
            const maxX = Math.max(this.boxSelectStart.x, pt.x);
            const maxY = Math.max(this.boxSelectStart.y, pt.y);

            // Remove existing selection box
            const existingBox = document.querySelector('#box-selection-rect');
            if (existingBox) existingBox.remove();

            // Create new selection box
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.id = 'box-selection-rect';
            rect.setAttribute('x', minX);
            rect.setAttribute('y', minY);
            rect.setAttribute('width', maxX - minX);
            rect.setAttribute('height', maxY - minY);
            rect.setAttribute('fill', 'rgba(33, 150, 243, 0.1)');
            rect.setAttribute('stroke', '#2196f3');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('stroke-dasharray', '5,5');
            rect.setAttribute('pointer-events', 'none');
            document.getElementById('canvas').appendChild(rect);

            return;
        } else if (this.dragMode === 'node' && this.selectedNode !== null) {
            const task = this.tasks.find(t => t.id === this.selectedNode);
            if (task) {
                const newX = pt.x - this.dragStart.x;
                const newY = pt.y - this.dragStart.y;

                // Check if we're dragging a selected node
                if (this.selectedTaskIds.has(this.selectedNode)) {
                    // Move all selected nodes together, maintaining relative positions
                    const dx = newX - task.x;
                    const dy = newY - task.y;

                    this.selectedTaskIds.forEach(selectedId => {
                        const selectedTask = this.tasks.find(t => t.id === selectedId);
                        if (selectedTask) {
                            selectedTask.x += dx;
                            selectedTask.y += dy;
                            selectedTask.vx = 0;
                            selectedTask.vy = 0;
                        }
                    });
                } else {
                    // Dragging an unselected node - move just this one
                    task.x = newX;
                    task.y = newY;
                    task.vx = 0;
                    task.vy = 0;
                }
                this.render();
            }
        } else if (this.dragMode === 'subtree-pending' && this.selectedNode !== null) {
            // Check if moved >5px to activate subtree drag (vs shift+click for selection)
            const distance = Math.sqrt(
                Math.pow(pt.x - this.dragStartOriginal.x, 2) +
                Math.pow(pt.y - this.dragStartOriginal.y, 2)
            );

            if (distance >= 5) {
                // Activate full subtree drag
                this.dragMode = 'subtree';
                const taskId = this.selectedNode;

                // Get all descendants
                this.draggedSubtree = [taskId, ...this.getDescendants(taskId)];

                // Store original positions
                this.subtreeOriginalPositions = {};
                this.draggedSubtree.forEach(id => {
                    const t = this.tasks.find(t => t.id === id);
                    this.subtreeOriginalPositions[id] = { x: t.x, y: t.y };
                });

                const task = this.tasks.find(t => t.id === taskId);
                this.dragStart = { x: pt.x - task.x, y: pt.y - task.y };
                this.dragOriginalPos = { x: task.x, y: task.y };

                // Save snapshot BEFORE drag starts (captures original position)
                const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
                this.saveSnapshot(`Move subtree '${truncatedTitle}'`);
            }
        } else if (this.dragMode === 'subtree' && this.selectedNode !== null) {
            // Calculate offset from original root position
            const newX = pt.x - this.dragStart.x;
            const newY = pt.y - this.dragStart.y;

            const dx = newX - this.dragOriginalPos.x;
            const dy = newY - this.dragOriginalPos.y;

            // Move entire subtree by same offset
            this.draggedSubtree.forEach(id => {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.x = this.subtreeOriginalPositions[id].x + dx;
                    task.y = this.subtreeOriginalPositions[id].y + dy;
                    task.vx = 0;
                    task.vy = 0;
                }
            });

            this.render();
        } else if (this.dragMode === 'reparent-pending' && this.selectedNode !== null) {
            // Check if moved >5px to activate reparent drag (vs Ctrl+click for multi-select)
            const distance = Math.sqrt(
                Math.pow(pt.x - this.dragStartOriginal.x, 2) +
                Math.pow(pt.y - this.dragStartOriginal.y, 2)
            );

            if (distance >= 5) {
                // Activate reparent drag mode
                this.dragMode = 'reparent';
                this.createTempLine(e);
                // Create custom cursor arrow
                this.cursorArrow = this.createCursorArrow();
                // Initialize line from source to cursor (A → B drag direction)
                const task = this.tasks.find(t => t.id === this.selectedNode);
                if (task && this.tempLine) {
                    this.tempLine.setAttribute('x1', task.x);
                    this.tempLine.setAttribute('y1', task.y);
                    this.tempLine.setAttribute('x2', pt.x);
                    this.tempLine.setAttribute('y2', pt.y);
                }
            }
        } else if (this.dragMode === 'reparent' && this.tempLine) {
            // Get source task for cursor arrow rotation
            const sourceTask = this.tasks.find(t => t.id === this.selectedNode);
            if (sourceTask) {
                this.updateCursorArrow(e.clientX, e.clientY, sourceTask);
            }

            // Update line from source to cursor (green line for reparenting)
            // INTUITIVE FEEDBACK: Arrow follows drag direction A → B
            // (Result: B becomes parent of A, but arrow follows hand motion for UX)
            this.tempLine.setAttribute('x1', sourceTask.x);
            this.tempLine.setAttribute('y1', sourceTask.y);
            this.tempLine.setAttribute('x2', pt.x);
            this.tempLine.setAttribute('y2', pt.y);
        } else if ((this.dragMode === 'dependency') && this.tempLine) {
            // Get source task for cursor arrow rotation
            const sourceTask = this.tasks.find(t => t.id === this.selectedNode);
            if (sourceTask) {
                this.updateCursorArrow(e.clientX, e.clientY, sourceTask);
            }

            // For dependency: update START point (cursor) not end point (source)
            // This shows the reversed direction: cursor (prereq) → source (dependent)
            this.tempLine.setAttribute('x1', pt.x);
            this.tempLine.setAttribute('y1', pt.y);
        } else if (this.dragMode === 'canvas') {
            // Calculate delta in screen coordinates (stable)
            const screenDx = e.clientX - this.dragStart.x;
            const screenDy = e.clientY - this.dragStart.y;

            // Convert screen pixels to SVG units for viewBox movement
            // Account for zoom: when zoomed in, panning is slower (more precise)
            // when zoomed out, panning is faster (cover more ground)
            const svg = document.getElementById('canvas');
            const actualViewBoxWidth = this.viewBox.width / this.zoomLevel; // Current rendered viewBox size
            const scale = actualViewBoxWidth / svg.clientWidth; // SVG units per screen pixel
            const svgDx = screenDx * scale;
            const svgDy = screenDy * scale;

            // Move viewBox (opposite direction: drag right = look left)
            this.viewBox.x -= svgDx;
            this.viewBox.y -= svgDy;

            // Update dragStart for next frame (screen coords)
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.render();
        }
    },

    onCanvasMouseUp(e) {
        if (this.dragMode === 'dependency') {
            // Use elementFromPoint to find what's actually under cursor (not e.target)
            const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
            const targetNode = elementUnderCursor ? elementUnderCursor.closest('.task-node') : null;
            if (targetNode && this.tempLine) {
                const targetId = parseInt(targetNode.dataset.id);

                // Check if dragging FROM a selected node (multi-source mode)
                if (this.selectedTaskIds.has(this.selectedNode)) {
                    // Source is selected (with others): all selected → target
                    // target depends on each selected node
                    this.selectedTaskIds.forEach(sourceId => {
                        if (sourceId !== targetId) {
                            this.addDependency({ dependentId: targetId, prerequisiteId: sourceId });
                        }
                    });
                } else if (this.selectedTaskIds.has(targetId)) {
                    // Target is selected (with others): source → all selected
                    // each selected depends on source
                    this.selectedTaskIds.forEach(depId => {
                        if (depId !== this.selectedNode) {
                            this.addDependency({ dependentId: depId, prerequisiteId: this.selectedNode });
                        }
                    });
                } else {
                    // Single source/target mode: source → target
                    if (targetId !== this.selectedNode) {
                        this.addDependency({ dependentId: targetId, prerequisiteId: this.selectedNode });
                    }
                }
            }
            this.removeTempLine();
        } else if (this.dragMode === 'reparent') {
            // Complete reparent: Make source a child of target
            const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
            const targetNode = elementUnderCursor ? elementUnderCursor.closest('.task-node') : null;
            if (targetNode && this.tempLine) {
                const targetId = parseInt(targetNode.dataset.id);

                // Reparent source to target (source becomes child of target)
                if (targetId !== this.selectedNode) {
                    this.reparentTask({ taskId: this.selectedNode, newParentId: targetId });
                }
            }
            this.removeTempLine();
        } else if (this.dragMode === 'reparent-pending') {
            // Ctrl+click without dragging - don't interfere, let click event handle multi-select
            // Don't do anything here, just clear the dragMode
        } else if (this.dragMode === 'subtree-pending') {
            // Shift+click without dragging - clear pending mode
            // Don't do anything here, just clear the dragMode
        } else if (this.dragMode === 'subtree' && this.selectedNode !== null) {
            const task = this.tasks.find(t => t.id === this.selectedNode);
            if (task) {
                const movedDistance = Math.sqrt(
                    Math.pow(task.x - this.dragOriginalPos.x, 2) +
                    Math.pow(task.y - this.dragOriginalPos.y, 2)
                );

                // Save to storage if we actually moved (snapshot was saved in mousedown)
                if (movedDistance >= 5) {
                    this.saveToStorage();
                } else {
                    // Didn't move enough - remove the snapshot we created in mousedown
                    if (this.undoStack.length > 0) {
                        this.undoStack.pop();
                    }
                }
            }

            // Clean up subtree drag state
            this.draggedSubtree = [];
            this.subtreeOriginalPositions = {};
        } else if (this.dragMode === 'node' && this.selectedNode !== null) {
            const task = this.tasks.find(t => t.id === this.selectedNode);
            if (task) {
                const movedDistance = Math.sqrt(
                    Math.pow(task.x - this.dragOriginalPos.x, 2) +
                    Math.pow(task.y - this.dragOriginalPos.y, 2)
                );

                // Save to storage if we actually moved (snapshot was saved in mousedown)
                if (movedDistance >= 5) {
                    this.saveToStorage();
                } else {
                    // Didn't move enough - remove the snapshot we created in mousedown
                    if (this.undoStack.length > 0) {
                        this.undoStack.pop();
                    }
                }
            }
        } else if (this.dragMode === 'canvas') {
            // Don't create undo snapshot for canvas panning - it's a viewport navigation
            // action, not a content modification. Creating a snapshot would clear the
            // redo stack, preventing users from redoing after panning to look around.
            // Use debounced save to prevent performance issues from frequent localStorage writes
            this.debouncedSaveToStorage(500);
        } else if (this.dragMode === 'box-select' && this.boxSelectStart) {
            // Complete box selection
            const pt = this.getSVGPoint(e);
            const minX = Math.min(this.boxSelectStart.x, pt.x);
            const minY = Math.min(this.boxSelectStart.y, pt.y);
            const maxX = Math.max(this.boxSelectStart.x, pt.x);
            const maxY = Math.max(this.boxSelectStart.y, pt.y);

            // Find all nodes whose centers fall within the box
            const selectedInBox = this.tasks.filter(task => {
                return !task.hidden && task.x >= minX && task.x <= maxX && task.y >= minY && task.y <= maxY;
            });

            // Add to selection (additive - Shift+drag means add to existing selection)
            selectedInBox.forEach(task => {
                this.selectedTaskIds.add(task.id);
            });

            // Remove the selection box visual
            const boxElement = document.querySelector('#box-selection-rect');
            if (boxElement) boxElement.remove();

            // Render to show highlights on selected nodes
            this.render();
        }

        // Clear selection when clicking canvas (not when panning)
        const wasCanvasDrag = this.dragMode === 'canvas';

        // Remove custom cursor arrow if it exists
        this.removeCursorArrow();

        this.dragMode = null;
        this.selectedNode = null;
        this.isBoxSelecting = false;
        this.boxSelectStart = null;

        if (wasCanvasDrag) {
            // Only clear selection if we didn't actually pan (click without movement)
            const pt = this.getSVGPoint(e);
            const panDistance = Math.sqrt(
                Math.pow(pt.x - this.dragStartOriginal.x, 2) +
                Math.pow(pt.y - this.dragStartOriginal.y, 2)
            );

            // If pan distance < 5px, treat as a click on canvas and clear selection
            if (panDistance < 5) {
                this.selectedTaskIds.clear();
                this.selectedLine = null;
                this.render();
            }
        }
        document.getElementById('canvas-container').classList.remove('dragging');
    }
};

console.log('[mouse.js] Mouse event handlers loaded');

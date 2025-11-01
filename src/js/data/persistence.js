/**
 * @order 11
 * @category Data
 * @description localStorage persistence layer
 *
 * This module provides:
 * - saveToStorage() - Saves complete app state to localStorage
 * - loadFromStorage() - Loads app state from localStorage on init
 *
 * PERSISTED STATE (Complete list):
 * - tasks: Array of all task objects
 * - taskIdCounter: Next available task ID
 * - workingTasksByRoot: Multi-project working state tracking
 * - darkMode, zoomLevel, viewBox position: View state
 * - homes, homeIdCounter: Named bookmarks system
 * - All user preferences/configuration (textLengthThreshold, charWidth, etc.)
 * - undoStack, redoStack: Undo/redo history
 *
 * ERROR HANDLING:
 * - QuotaExceededError: Automatically trims undo history to last 10 and retries
 * - Shows toast notification when history is trimmed
 *
 * MIGRATION:
 * - loadFromStorage() includes migration logic for old "origin" system → "Homes" system
 * - Uses ?? operator for proper defaults (handles null/undefined correctly)
 */

/**
 * Save complete app state to localStorage
 * Automatically called after every state modification
 * Handles QuotaExceededError by trimming undo history
 */
app.saveToStorage = function() {
    try {
        localStorage.setItem('taskTree', JSON.stringify({
            // Task data
            tasks: this.tasks,
            taskIdCounter: this.taskIdCounter,
            // Multi-project working state
            workingTasksByRoot: this.workingTasksByRoot,
            // View state
            darkMode: this.darkMode,
            zoomLevel: this.zoomLevel,
            viewBoxX: this.viewBox.x,
            viewBoxY: this.viewBox.y,
            // Homes - named bookmarks
            homes: this.homes,
            homeIdCounter: this.homeIdCounter,
            // User preferences & configuration
            textLengthThreshold: this.textLengthThreshold,
            charWidth: this.charWidth,
            nodePadding: this.nodePadding,
            wheelZoomSpeed: this.wheelZoomSpeed,
            minNodeWidth: this.minNodeWidth,
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight,
            showDeleteConfirmation: this.showDeleteConfirmation,
            autoHideCompletedNodes: this.autoHideCompletedNodes,
            enableMultiline: this.enableMultiline,
            maxNodeWidth: this.maxNodeWidth,
            maxNodeHeight: this.maxNodeHeight,
            lineHeight: this.lineHeight,
            wordWrap: this.wordWrap,
            arrowStyle: this.arrowStyle,
            arrowCurvature: this.arrowCurvature,
            // Undo/redo history
            undoStack: this.undoStack,
            redoStack: this.redoStack
        }));
    } catch (e) {
        // Handle quota exceeded error
        if (e.name === 'QuotaExceededError') {
            // Trim undo history and try again
            this.undoStack = this.undoStack.slice(-10); // Keep only last 10
            this.redoStack = [];
            try {
                localStorage.setItem('taskTree', JSON.stringify({
                    tasks: this.tasks,
                    taskIdCounter: this.taskIdCounter,
                    workingTasksByRoot: this.workingTasksByRoot,
                    darkMode: this.darkMode,
                    zoomLevel: this.zoomLevel,
                    viewBoxX: this.viewBox.x,
                    viewBoxY: this.viewBox.y,
                    homes: this.homes,
                    homeIdCounter: this.homeIdCounter,
                    textLengthThreshold: this.textLengthThreshold,
                    charWidth: this.charWidth,
                    nodePadding: this.nodePadding,
                    wheelZoomSpeed: this.wheelZoomSpeed,
                    minNodeWidth: this.minNodeWidth,
                    fontFamily: this.fontFamily,
                    fontWeight: this.fontWeight,
                    showDeleteConfirmation: this.showDeleteConfirmation,
                    autoHideCompletedNodes: this.autoHideCompletedNodes,
                    enableMultiline: this.enableMultiline,
                    maxNodeWidth: this.maxNodeWidth,
                    maxNodeHeight: this.maxNodeHeight,
                    lineHeight: this.lineHeight,
                    wordWrap: this.wordWrap,
                    arrowStyle: this.arrowStyle,
                    arrowCurvature: this.arrowCurvature,
                    undoStack: this.undoStack,
                    redoStack: this.redoStack
                }));
                this.showToast('Undo history trimmed due to storage limits', 'error', 3000);
            } catch (e2) {
                console.error('Storage error:', e2);
            }
        }
    }
};

/**
 * Load complete app state from localStorage
 * Called once during app.init()
 * Includes migration logic for old data formats
 */
app.loadFromStorage = function() {
    const data = localStorage.getItem('taskTree');
    if (data) {
        const parsed = JSON.parse(data);
        // Task data
        this.tasks = parsed.tasks || [];
        this.taskIdCounter = parsed.taskIdCounter || 0;
        // Multi-project working state
        this.workingTasksByRoot = parsed.workingTasksByRoot || {};
        // View state
        this.darkMode = parsed.darkMode || false;
        this.zoomLevel = parsed.zoomLevel || 1;
        // Restore viewBox position if saved
        if (parsed.viewBoxX !== undefined && parsed.viewBoxY !== undefined) {
            this.viewBox.x = parsed.viewBoxX;
            this.viewBox.y = parsed.viewBoxY;
        }
        // Homes - load and migrate from old origin system
        this.homes = parsed.homes || [];
        this.homeIdCounter = parsed.homeIdCounter || 1;

        // MIGRATION: Convert old origin system to "Origin Home"
        if (parsed.originMarked && this.homes.length === 0) {
            this.homes.push({
                id: this.homeIdCounter++,
                name: "Origin Home",
                centerX: parsed.originX || 0,
                centerY: parsed.originY || 0,
                zoomLevel: parsed.originZoomLevel || 1,
                timestamp: Date.now()
            });
            // Save immediately to persist migration
            setTimeout(() => {
                this.saveToStorage();
                this.showToast('✓ Migrated to Homes system', 'info', 2000);
            }, 100);
        }

        // User preferences & configuration (use ?? for proper defaults)
        this.textLengthThreshold = parsed.textLengthThreshold ?? 80;
        this.charWidth = parsed.charWidth ?? 8.5;
        this.nodePadding = parsed.nodePadding ?? 15;
        this.wheelZoomSpeed = parsed.wheelZoomSpeed ?? 0.18;
        this.minNodeWidth = parsed.minNodeWidth ?? 100;
        this.fontFamily = parsed.fontFamily ?? "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace";
        this.fontWeight = parsed.fontWeight ?? 700;
        this.showDeleteConfirmation = parsed.showDeleteConfirmation ?? true;
        this.autoHideCompletedNodes = parsed.autoHideCompletedNodes ?? true;
        this.enableMultiline = parsed.enableMultiline ?? true;
        this.maxNodeWidth = parsed.maxNodeWidth ?? 600;
        this.maxNodeHeight = parsed.maxNodeHeight ?? 0;
        this.lineHeight = parsed.lineHeight ?? 20;
        this.wordWrap = parsed.wordWrap ?? true;
        this.arrowStyle = parsed.arrowStyle ?? 'straight';
        this.arrowCurvature = parsed.arrowCurvature ?? 0.25;
        // Undo/redo history
        this.undoStack = parsed.undoStack || [];
        this.redoStack = parsed.redoStack || [];

        // Update dark mode button and apply dark mode
        const darkModeBtn = document.getElementById('darkModeToggle');
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            if (darkModeBtn) darkModeBtn.textContent = '☀️ Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            if (darkModeBtn) darkModeBtn.textContent = '🌙 Dark Mode';
        }

        // Update zoom display
        this.updateZoomDisplay();

        // Update text length input
        const textLengthInput = document.getElementById('textLengthInput');
        if (textLengthInput) {
            textLengthInput.value = this.textLengthThreshold;
        }
    }
};

/**
 * Debounced save for performance optimization
 * Used for operations that happen frequently (like canvas panning, zooming)
 * Waits 'delay' ms after last call before actually saving
 * Prevents excessive localStorage writes during rapid interactions
 * @param {number} delay - Milliseconds to wait before saving (default: 500)
 */
app.debouncedSaveToStorage = function(delay = 500) {
    // Clear existing timer if any
    if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
    }

    // Set new timer
    this.saveDebounceTimer = setTimeout(() => {
        this.saveToStorage();
        this.saveDebounceTimer = null;
    }, delay);
};

console.log('[persistence.js] localStorage persistence layer loaded');

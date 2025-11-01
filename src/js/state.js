// @order: 1
// @category: core
// @description: Application state object - contains all app state and methods

/**
 * Main application state object.
 *
 * All modules extend this object by adding methods via the mixin pattern.
 *
 * Structure:
 * - Core data: tasks, IDs, selection state
 * - Viewport: viewBox, zoom level
 * - Interaction: drag state, editing, selection
 * - Configuration: sizing, fonts, behavior
 * - Features: homes/bookmarks, undo/redo, multi-project
 */
const app = {
    // ========================================
    // Core Data
    // ========================================
    tasks: [],                   // Array of all task objects
    taskIdCounter: 0,            // Unique ID generator for tasks

    // ========================================
    // Viewport & Navigation
    // ========================================
    viewBox: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight - 60 },
    zoomLevel: 1,                // Current zoom level (0.2 to 4)
    minZoom: 0.2,                // Minimum zoom level
    maxZoom: 4,                  // Maximum zoom level
    zoomSpeed: 0.1,              // Keyboard zoom increment (Ctrl +/-)
    wheelZoomSpeed: 0.18,        // Wheel/trackpad zoom speed

    // ========================================
    // Selection State
    // ========================================
    selectedNode: null,          // Legacy single selection (deprecated)
    selectedTaskIds: new Set(),  // Multi-select: Set of task IDs
    lastClickedTaskId: null,     // For Shift+Click range selection
    hoveredTaskId: null,         // For hover-based priority changes
    lastWorkingTaskId: null,     // Track last selected/cycled working task for Jump button
    selectedLine: null,          // Selected relationship line {type: 'parent'|'dependency', taskId, parentId/depId}

    // ========================================
    // Box Selection
    // ========================================
    boxSelectStart: null,        // {x, y} when Shift+Click+Drag starts on empty space
    isBoxSelecting: false,       // True during box selection drag

    // ========================================
    // Drag State
    // ========================================
    dragMode: null,              // Current drag mode: 'node'|'subtree'|'reparent'|'dependency'|'pan'|'box-select'
    dragStart: { x: 0, y: 0 },   // Mouse position when drag started (SVG coords)
    dragOriginalPos: { x: 0, y: 0 }, // Original position for click detection
    tempLine: null,              // Temporary line during dependency/reparent drag
    draggedSubtree: [],          // Array of task IDs being dragged together (subtree mode)
    subtreeOriginalPositions: {},// Original positions for subtree drag {taskId: {x, y}}
    previewNode: null,           // Preview node during reparent drag
    cursorArrow: null,           // Custom arrow cursor during relationship drags

    // ========================================
    // UI State
    // ========================================
    darkMode: false,             // Dark theme enabled
    editingTaskId: null,         // Task currently being edited inline (null if not editing)

    // ========================================
    // Text & Typography Configuration
    // ========================================
    textLengthThreshold: 80,     // Character limit before truncation
    charWidth: 8.5,              // Pixels per character for width calculation
    nodePadding: 15,             // Left/right padding inside task rectangles
    minNodeWidth: 100,           // Minimum rectangle width
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
    fontWeight: 700,             // Font weight: 400=normal, 500=medium, 600=semibold, 700=bold

    // ========================================
    // Multiline Text Configuration
    // ========================================
    enableMultiline: true,       // Master toggle for multiline text support
    maxNodeWidth: 600,           // Maximum node width before wrapping
    maxNodeHeight: 0,            // Maximum node height (0 = unlimited)
    lineHeight: 20,              // Vertical spacing between lines (pixels)
    wordWrap: true,              // Wrap on word boundaries (vs character boundaries)

    // ========================================
    // Visual Styling
    // ========================================
    arrowStyle: 'straight',      // Arrow path style: 'straight' or 'curved'
    arrowCurvature: 0.25,        // Curve intensity for curved arrows (0.1 to 0.5)

    // ========================================
    // Homes/Bookmarks
    // ========================================
    homes: [],                   // Array of {id, name, centerX, centerY, zoomLevel, timestamp, keybind}
    homeIdCounter: 1,            // Unique ID generator for homes

    // ========================================
    // Platform Detection
    // ========================================
    isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
    isWindows: navigator.platform.toUpperCase().indexOf('WIN') >= 0,
    isLinux: navigator.platform.toUpperCase().indexOf('LINUX') >= 0,

    // ========================================
    // Undo/Redo System
    // ========================================
    undoStack: [],               // Array of {tasks: [], description: string, timestamp: number}
    redoStack: [],               // Array for redo operations
    maxUndoSteps: 50,            // Maximum undo history depth
    isUndoing: false,            // Flag to prevent saveSnapshot during undo/redo
    lastSnapshotTime: 0,         // For 2-second edit grouping
    lastSnapshotTaskId: null,    // For grouping edits to same task

    // ========================================
    // Performance
    // ========================================
    saveDebounceTimer: null,     // Timer for debounced saves (canvas pan, etc.)

    // ========================================
    // User Preferences
    // ========================================
    showDeleteConfirmation: true,  // Show confirmation dialog when deleting tasks
    autoHideCompletedNodes: true,  // Auto-hide nodes when task and parent are done

    // ========================================
    // Multi-Project Support
    // ========================================
    workingTasksByRoot: {},      // { [rootTaskId]: workingTaskId } - one working task per project/root

    // ========================================
    // Copy/Paste
    // ========================================
    copiedSubtree: null,         // Clipboard for copying/pasting subtrees (not persisted)
    lastMousePosition: { x: 0, y: 0 }, // Track last mouse position for Ctrl+V paste location

    // ========================================
    // Methods will be added by module mixins
    // ========================================
    // Utils: platform.js, svg.js, cycle-detection.js
    // Data: persistence.js, undo-redo.js, import-export.js, clipboard.js
    // Core: tasks.js, status.js, relationships.js
    // Rendering: golden-path.js, indicators.js, nodes.js, links.js, render.js
    // Interactions: mouse.js, keyboard.js, drag.js, edit.js
    // UI: modals.js, context-menu.js, status-bar.js, settings.js, shortcuts.js, test-checklist.js, toast.js
    // Navigation: viewport.js, homes.js, jump.js, text-lock.js
};

console.log('✓ App state initialized');

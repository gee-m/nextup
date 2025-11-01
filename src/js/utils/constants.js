/**
 * @module utils/constants
 * @order 8
 * @category Utils
 *
 * Application-wide constants
 * Eliminates magic numbers and provides single source of truth
 */

/**
 * Interaction Constants
 * Controls how user input is interpreted
 */
app.INTERACTION = {
    /**
     * Minimum pixels to move before drag activates
     * Used to distinguish between click and drag
     */
    DRAG_THRESHOLD_PX: 5,

    /**
     * Delay before click menu appears (ms)
     * Allows time for double-click detection
     */
    CLICK_DELAY_MS: 200,

    /**
     * Maximum time between clicks for double-click (ms)
     */
    DOUBLE_CLICK_MAX_MS: 300,

    /**
     * Paste offset distance (px)
     * How far to offset pasted tasks from original
     */
    PASTE_OFFSET_X: 100,
    PASTE_OFFSET_Y: 100,
};

/**
 * Animation Durations (milliseconds)
 * Controls timing for smooth viewport animations
 */
app.ANIMATION = {
    /** Zoom out duration for viewport animation */
    ZOOM_OUT_MS: 300,

    /** Pan/move duration for viewport animation */
    PAN_MS: 500,

    /** Zoom in duration for viewport animation */
    ZOOM_IN_MS: 500,

    /** Total animation time (zoom out + pan + zoom in) */
    TOTAL_MS: 1300,

    /**
     * Easing function for smooth animations
     * Ease-in-out quadratic curve
     * @param {number} t - Progress from 0 to 1
     * @returns {number} Eased value
     */
    EASING: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

/**
 * UI Display Constants
 * Controls visual presentation
 */
app.UI = {
    /**
     * Default title truncation length
     * Note: Some contexts use app.textLengthThreshold from config
     */
    TITLE_MAX_LENGTH: 30,

    /**
     * Toast message durations by severity (ms)
     */
    TOAST_DURATION: {
        SUCCESS: 2000,   // Quick confirmation
        INFO: 3000,      // Standard information
        WARNING: 3000,   // User attention needed
        ERROR: 4000,     // Critical issues need more time
    },

    /**
     * Modal z-index for layering
     */
    MODAL_Z_INDEX: 1000,

    /**
     * Dropdown z-index (higher than modal)
     */
    DROPDOWN_Z_INDEX: 1100,
};

/**
 * Canvas/Rendering Constants
 * Controls how tasks are displayed
 */
app.CANVAS = {
    /**
     * Default viewBox dimensions
     */
    DEFAULT_WIDTH: 2000,
    DEFAULT_HEIGHT: 1500,

    /**
     * Zoom limits
     */
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 3.0,

    /**
     * Grid snap distance (px)
     * Currently unused but reserved for future grid feature
     */
    GRID_SNAP: 10,
};

/**
 * Data/Storage Constants
 */
app.STORAGE = {
    /**
     * localStorage key prefix
     */
    KEY_PREFIX: 'task-tree-',

    /**
     * Maximum undo/redo stack size
     * Note: App has maxUndoSteps config that may override
     */
    MAX_UNDO_STEPS: 50,

    /**
     * Undo snapshot grouping time window (ms)
     * Edits within this window get grouped into one undo step
     */
    UNDO_GROUP_WINDOW_MS: 2000,
};

/**
 * Feature Flags
 * Quick toggles for experimental features
 */
app.FEATURES = {
    /**
     * Enable performance logging
     */
    DEBUG_PERFORMANCE: false,

    /**
     * Enable verbose console logging
     */
    DEBUG_VERBOSE: false,
};

console.log('[constants.js] Application constants loaded');

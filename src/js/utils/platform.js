/**
 * @order 5
 * @category Utils
 * @description Platform detection and keyboard symbol utilities
 *
 * This module provides:
 * - Platform detection (Mac, Windows, Linux)
 * - Platform-specific keyboard modifier symbols (⌘, Ctrl, ⌥, Alt, ⇧)
 * - Helper functions to get correct key names/symbols for UI display
 *
 * All functions are added as methods to the app object.
 */

// Platform detection (set once on app initialization)
// These are properties on the app object (not functions)
app.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
app.isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
app.isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;

/**
 * Get platform-specific modifier key symbol/name
 * @param {boolean} short - If true, returns symbol (⌘/Ctrl); if false, returns name (Cmd/Ctrl)
 * @returns {string} Modifier key representation
 */
app.getModifierKey = function(short = false) {
    // Returns the primary modifier key symbol/name for current platform
    // short = true: Returns '⌘' or 'Ctrl'
    // short = false: Returns 'Cmd' or 'Ctrl'
    if (this.isMac) {
        return short ? '⌘' : 'Cmd';
    }
    return 'Ctrl';
};

/**
 * Get platform-specific alt key symbol/name
 * @param {boolean} short - If true, returns symbol (⌥/Alt); if false, returns name (Option/Alt)
 * @returns {string} Alt key representation
 */
app.getAltKey = function(short = false) {
    // Returns the Alt/Option key symbol/name for current platform
    // short = true: Returns '⌥' or 'Alt'
    // short = false: Returns 'Option' or 'Alt'
    if (this.isMac) {
        return short ? '⌥' : 'Option';
    }
    return 'Alt';
};

/**
 * Get platform-specific shift key symbol/name
 * @param {boolean} short - If true, returns symbol (⇧/Shift); if false, returns name (Shift)
 * @returns {string} Shift key representation
 */
app.getShiftKey = function(short = false) {
    // Returns the Shift key symbol/name for current platform
    // short = true: Returns '⇧' or 'Shift'
    // short = false: Returns 'Shift' (same on all platforms)
    return short && this.isMac ? '⇧' : 'Shift';
};

console.log('[platform.js] Platform detection and keyboard utilities loaded');

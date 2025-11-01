/**
 * @module navigation/text-lock
 * @order 43
 * @category navigation
 *
 * Text expansion and lock controls
 *
 * NOTE: Text expansion functions remain in task-tree.html (lines 7776-7807)
 * This file documents the text expansion architecture.
 *
 * KEY FUNCTIONS:
 *
 * updateTextLengthThreshold() - Line 7776-7785
 * - Updates text length threshold from input
 * - Reads value from settings form
 * - Updates app.textLengthThreshold
 * - Saves to localStorage
 * - Re-renders canvas
 *
 * expandText(taskId) - Line 7787-7795
 * - Expands truncated text temporarily
 * - Sets task.textExpanded = true
 * - Re-renders to show full text
 * - Used for:
 *   - Clicking on truncated text
 *   - Selecting task
 *   - Editing task
 *
 * toggleTextLock(taskId) - Line 7797-7807
 * - Toggles persistent text expansion
 * - Sets task.textLocked = true/false
 * - Saves to localStorage
 * - Re-renders canvas
 * - Shows lock/unlock icon (🔒/🔓)
 * - Disabled for working tasks (always expanded)
 *
 * TEXT EXPANSION LOGIC:
 *
 * A task's text is expanded (full text shown) if ANY of:
 * 1. task.currentlyWorking = true (working tasks always expanded)
 * 2. task.textLocked = true (user explicitly locked expansion)
 * 3. task.textExpanded = true AND task is selected (temporary expansion)
 *
 * A task's text is truncated if:
 * - task.title.length > textLengthThreshold
 * - AND charsOverLimit > 5 (don't truncate for minor overflow)
 * - AND NOT expanded (none of above conditions met)
 *
 * LOCK BUTTON:
 * - Appears on expanded long text
 * - Positioned to left of task node
 * - Shows 🔒 (locked) or 🔓 (unlocked)
 * - Click to toggle lock state
 * - Disabled for working tasks (cursor: not-allowed, opacity: 0.4)
 * - Gray background circle for visibility
 *
 * TRUNCATION THRESHOLD:
 * - Default: 60 characters
 * - Configurable in settings
 * - Only truncates if >5 chars over threshold
 * - Shows "..." at end
 * - Multiline: truncates last visible line
 *
 * INTERACTION:
 * - Clicking truncated text expands it
 * - Selecting task expands text temporarily
 * - Lock persists across selection changes
 * - Working tasks always show full text
 * - Editing always shows full text
 *
 * USE CASES:
 * - Long task descriptions
 * - URLs in task text (before extraction)
 * - Multiline notes
 * - Keep important tasks expanded
 * - Declutter canvas with truncation
 */

export const TextLockMixin = {
    // Placeholder - actual functions stay in main HTML file
    // This module serves as text expansion documentation
};

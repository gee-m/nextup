/**
 * @module ui/shortcuts
 * @order 34
 * @category ui
 *
 * Keyboard shortcuts modal
 *
 * NOTE: Shortcuts functions remain in task-tree.html due to size.
 * This file documents the shortcuts modal architecture.
 *
 * KEY FUNCTIONS:
 *
 * showShortcutsModal() - Line 5324-5445
 * - Generates comprehensive shortcuts reference
 * - Organized into categories:
 *   - ✏️ Editing: Task creation, editing, deletion
 *   - 🎯 Selection: Selecting, multi-selecting, clearing
 *   - 📊 Status & Priority: Status changes, priority cycling
 *   - 🔗 Relationships: Reparenting, dependencies, subtree movement
 *   - 🚀 Navigation: Movement, zooming, jumping, collapsing
 *   - 🔗 Links: Link attachment, opening links
 *   - ⏮️ Undo/Redo: Undo and redo operations
 * - Displays platform-specific modifier keys (Ctrl vs Cmd)
 * - Shows Pro Tips for advanced workflows
 * - Keyboard navigation: Number keys 1-9 to jump to sections
 *
 * hideShortcutsModal() - Line 5447-5460
 * - Closes modal
 * - Removes event listeners
 *
 * updateShortcutsHelp() - Line 1459-1474
 * - Updates condensed shortcuts help in top-right corner
 * - Shows most important shortcuts only
 * - Platform-aware (Windows/Mac key symbols)
 *
 * SHORTCUT CATEGORIES:
 * Each category has:
 * - category: Name with emoji
 * - items: Array of {keys, description}
 * - tip: Optional Pro Tip for advanced usage
 *
 * Example Pro Tips:
 * - Link auto-detection when editing
 * - Multi-select workflows for bulk operations
 * - Flow state pattern (done → parent)
 * - Box selection for region operations
 */

export const ShortcutsMixin = {
    // Placeholder - actual functions stay in main HTML file
    // This module serves as shortcuts architecture documentation
};

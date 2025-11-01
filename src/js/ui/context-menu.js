/**
 * @module ui/context-menu
 * @order 31
 * @category ui
 *
 * Right-click context menus for tasks and empty space
 *
 * NOTE: Context menu functions remain in task-tree.html (lines 4604-5279)
 * due to their size and complexity. This file documents the architecture.
 *
 * KEY FUNCTIONS:
 *
 * showNodeMenu() - Line 4604-4905
 * - Shows task-specific context menu on right-click
 * - Menu items:
 *   - Edit (E)
 *   - Toggle Done (D)
 *   - Toggle Working (W)
 *   - Set Priority (high/medium/normal) (P)
 *   - Create Child (Tab)
 *   - Copy Task (Ctrl+C)
 *   - Paste as Child (Ctrl+V)
 *   - Hide/Show Descendants (H)
 *   - Collapse if Complete
 *   - Attach Link
 *   - Remove All Links
 *   - Delete Task (Del)
 * - Shows different options based on:
 *   - Task status (done/working/pending)
 *   - Whether task has children
 *   - Whether task has links
 *   - Whether clipboard has data
 * - Positioned at cursor with viewport boundary detection
 *
 * showEmptySpaceMenu() - Line 4907-5131
 * - Shows canvas context menu on right-click empty space
 * - Menu items:
 *   - Create Root Task (Enter)
 *   - Paste Here (Ctrl+V)
 *   - Select All (Ctrl+A)
 *   - Zoom In (+)
 *   - Zoom Out (-)
 *   - Fit to Screen (F)
 *   - Create Home (Ctrl+B)
 *   - Mark Origin (M)
 *   - Toggle Dark Mode (T)
 *   - Clear Completed
 *   - Settings
 *   - Shortcuts (?)
 *   - Export Data
 *   - Import Data
 *   - Load Test Checklist (dev)
 * - Context-aware: some items only show if applicable
 * - Positioned at cursor
 *
 * closeMenu() - Line 5133-5143
 * - Closes any open context menu
 * - Removes menu DOM element
 *
 * LINK-RELATED FUNCTIONS:
 *
 * copyTaskText() - Line 5145-5154
 * - Copies task text to clipboard
 *
 * attachLink() - Line 5156-5183
 * - Shows prompt to attach URL to task
 * - Validates URL format
 * - Adds to task.links array
 * - Shows toast notification
 *
 * openLink() - Line 5185-5192
 * - Opens URL in new tab
 * - Handles single link directly
 * - Shows dropdown for multiple links
 *
 * removeAllLinks() - Line 5194-5210
 * - Shows confirmation dialog
 * - Clears task.links array
 *
 * showLinksDropdown() - Line 5212-5274
 * - Shows dropdown menu at badge location
 * - Lists all links with shortened URLs
 * - Click to open link in new tab
 * - Positioned relative to link badge
 *
 * closeLinksDropdown() - Line 5276-5279
 * - Closes links dropdown
 */

export const ContextMenuMixin = {
    // Placeholder - actual functions stay in main HTML file
    // This module serves as context menu architecture documentation
};

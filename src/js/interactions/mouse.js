/**
 * @module interactions/mouse
 * @order 25
 * @category interactions
 *
 * Mouse event handlers for canvas interactions
 *
 * NOTE: These functions remain in task-tree.html (lines 3995-4419) due to their
 * complexity and tight integration with the app state. This file serves as
 * documentation of the mouse interaction architecture.
 *
 * KEY FUNCTIONS:
 *
 * onCanvasMouseDown(e) - Line 3995-4080
 * - Handles left-click on tasks and empty space
 * - Determines drag mode based on modifiers:
 *   - No modifier: 'node' drag (move single task)
 *   - Shift: 'subtree-pending' → 'subtree' drag (move entire subtree)
 *   - Ctrl/Cmd: 'reparent-pending' → 'reparent' drag (change parent)
 *   - Alt: 'dependency' drag (create dependency link)
 *   - Ctrl+empty space: 'box-select' (multi-select rectangle)
 *   - Empty space: 'canvas' drag (pan viewport)
 * - Saves undo snapshots BEFORE drag starts
 * - Creates temp lines and cursor arrows for relationship drags
 *
 * onCanvasMouseMove(e) - Line 4082-4266
 * - Tracks mouse position for Ctrl+V paste at cursor
 * - Handles different drag modes:
 *   - box-select: Draws selection rectangle
 *   - node: Moves single task or multi-selected tasks
 *   - subtree-pending: Activates subtree drag after 5px movement
 *   - subtree: Moves entire subtree preserving relative positions
 *   - reparent-pending: Activates reparent drag after 5px movement
 *   - reparent: Updates temp line from source to cursor
 *   - dependency: Updates temp line from cursor to source (reversed)
 *   - canvas: Pans viewport using screen coordinates
 * - Updates cursor arrow rotation during relationship drags
 *
 * onCanvasMouseUp(e) - Line 4268-4419
 * - Completes drag operations:
 *   - dependency: Creates dependency link (supports multi-select)
 *   - reparent: Changes task parent
 *   - subtree/node: Saves to storage if moved >5px, otherwise removes undo snapshot
 *   - box-select: Selects all tasks within rectangle
 *   - canvas: Detects click vs drag (<5px = click, shows context menu)
 * - Cleans up temp lines, cursor arrows, drag state
 * - Shows context menus for click events
 *
 * DRAG MODE STATE MACHINE:
 * - Pending modes (reparent-pending, subtree-pending) allow distinguishing
 *   between modifier+click (for selection/menu) and modifier+drag (for relationships)
 * - 5px threshold prevents accidental drags from hand tremor
 * - Screen coordinates used for canvas panning (stable under zoom)
 * - SVG coordinates used for task positioning (zoom-aware)
 */

export const MouseMixin = {
    // Placeholder - actual functions stay in main HTML file
    // This module serves as architecture documentation
};

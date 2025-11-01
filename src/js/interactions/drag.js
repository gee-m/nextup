/**
 * @module interactions/drag
 * @order 27
 * @category interactions
 *
 * Drag mode logic and state management
 *
 * NOTE: Drag logic is integrated into mouse.js handlers (onCanvasMouseDown,
 * onCanvasMouseMove, onCanvasMouseUp). This file documents the drag architecture.
 *
 * DRAG MODES:
 *
 * 1. node - Move single task
 *    - Trigger: Left-click drag (no modifier)
 *    - Behavior: Moves single task or all selected tasks together
 *    - State: dragStart (offset from cursor to task center)
 *    - Snapshot: Saved at mousedown
 *
 * 2. subtree - Move entire subtree
 *    - Trigger: Shift+drag (activates after 5px movement)
 *    - Behavior: Moves root task and all descendants preserving relative positions
 *    - State: draggedSubtree (array of IDs), subtreeOriginalPositions (map)
 *    - Snapshot: Saved when activated (not at mousedown)
 *
 * 3. reparent - Change parent relationship
 *    - Trigger: Ctrl/Cmd+drag (activates after 5px movement)
 *    - Behavior: Makes source task a child of target task
 *    - Visual: Green solid temp line, cursor arrow
 *    - State: tempLine, cursorArrow
 *    - Snapshot: Saved in reparentTask()
 *
 * 4. dependency - Create dependency link
 *    - Trigger: Alt+drag
 *    - Behavior: Creates dependency from source (prerequisite) to target (dependent)
 *    - Visual: Blue dashed temp line (reversed: cursor → source), cursor arrow
 *    - State: tempLine, cursorArrow
 *    - Supports: Multi-select (all selected → target OR source → all selected)
 *    - Snapshot: Saved in addDependency()
 *
 * 5. box-select - Multi-select rectangle
 *    - Trigger: Ctrl/Cmd+drag on empty space
 *    - Behavior: Selects all tasks within drawn rectangle
 *    - Visual: Blue dashed rectangle overlay
 *    - State: boxSelectStart (SVG coords)
 *
 * 6. canvas - Pan viewport
 *    - Trigger: Drag on empty space (no modifier)
 *    - Behavior: Moves viewBox to pan around canvas
 *    - Coordinates: Screen coordinates (stable under zoom)
 *    - Visual: 'dragging' class on canvas-container (grab cursor)
 *
 * PENDING MODES:
 * - reparent-pending, subtree-pending: Allow distinguishing click vs drag
 * - If <5px movement → treated as click (multi-select or context menu)
 * - If ≥5px movement → activates full drag mode
 *
 * CLICK DETECTION:
 * - Uses dragStartOriginal (SVG coords at mousedown)
 * - Calculates distance at mouseup
 * - <5px = click, ≥5px = drag
 * - Click events: context menu, multi-select toggle
 */

export const DragMixin = {
    // Placeholder - drag logic integrated into mouse handlers
    // This module serves as architecture documentation
};

/**
 * @module navigation/jump
 * @order 42
 * @category navigation
 *
 * Jump to working tasks with smart defaults
 *
 * NOTE: Jump functions remain in task-tree.html (lines 7082-7381)
 * This file documents the jump navigation architecture.
 *
 * KEY FUNCTIONS:
 *
 * jumpToWorkingTask(taskId) - Line 7082-7217
 * - Animates viewport to center on working task
 * - Smooth easing animation (60 steps)
 * - Updates viewBox during transition
 * - Updates parent link arrows during animation (golden path)
 * - Tracks lastWorkingTaskId for smart defaults
 * - Shows toast notification with task name
 * - Adjusts zoom if needed
 *
 * showWorkingTasksDropdown() - Line 7219-7381
 * - Shows dropdown of all working tasks
 * - One per root graph (multi-project support)
 * - Menu features:
 *   - Numbered items (1-9) for keyboard selection
 *   - "(last)" indicator for lastWorkingTaskId
 *   - Task name + root path
 *   - Click to jump to task
 *   - Keyboard: Press number key to jump
 *   - ESC to close
 * - Positioned below "Jump to Working" button
 * - Keyboard handler for 1-9 and J keys
 * - Smart behavior:
 *   - Single working task: Jump directly (no dropdown)
 *   - Multiple tasks: Show dropdown
 *   - Press J again: Jump to last selected
 *
 * SMART DEFAULT BEHAVIOR:
 * - lastWorkingTaskId tracks most recently jumped-to task
 * - Updated on:
 *   - jumpToWorkingTask() call
 *   - Selecting task from dropdown
 *   - Middle-clicking task (cycleStatus → working)
 * - Used for:
 *   - J key double-press (open menu → press J again → jump to last)
 *   - Default menu item highlighting
 *
 * KEYBOARD NAVIGATION:
 * - J: Open working tasks menu
 * - J (again): Jump to last selected working task
 * - 1-9: Jump to numbered task in menu
 * - ESC: Close menu
 *
 * MULTI-PROJECT SUPPORT:
 * - Finds one working task per root graph
 * - Uses workingTasksByRoot map for O(1) lookup
 * - Shows root path for context
 * - Allows working on multiple independent projects
 *
 * ANIMATION:
 * - 60-step smooth easing
 * - Updates viewBox each frame (updateViewBoxOnly)
 * - Updates parent links during animation
 * - Golden path arrows animate smoothly
 * - 16ms per frame (~60 FPS)
 *
 * VIEWPORT ADJUSTMENT:
 * - Centers task in viewport
 * - Adjusts zoom if task is too small/large
 * - Maintains reasonable zoom range (0.5-2.0)
 * - Preserves zoom if task already visible
 */

export const JumpMixin = {
    // Placeholder - actual functions stay in main HTML file
    // This module serves as jump navigation documentation
};

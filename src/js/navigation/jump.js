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
    jumpToWorkingTask(taskId = null, animate = true) {
        let workingTask = null;
        if (taskId) {
            workingTask = this.tasks.find(t => t.id === taskId && t.currentlyWorking);
            if (workingTask) {
                this.lastWorkingTaskId = taskId;
            }
        } else if (this.lastWorkingTaskId) {
            workingTask = this.tasks.find(t => t.id === this.lastWorkingTaskId && t.currentlyWorking);
        }

        if (!workingTask) {
            workingTask = this.tasks.find(t => t.currentlyWorking);
        }

        if (!workingTask) {
            this.showToast('No task is currently being worked on', 'warning');
            return;
        }

        if (this.tasks.length === 0) return;

        const wasHidden = workingTask.hidden;
        if (wasHidden) {
            workingTask.hidden = false;
        }

        const targetZoom = 1.2;
        const taskTitle = this.truncateTitle(workingTask.title);

        if (animate) {
            // Use utility function for smooth three-phase animation
            const startZoom = this.zoomLevel;
            const overviewZoom = Math.min(startZoom, targetZoom) * 0.5;

            this.animateViewportTo(workingTask.x, workingTask.y, targetZoom, {
                overviewZoom: overviewZoom,
                onComplete: () => {
                    this.updateZoomDisplay();
                    this.saveToStorage();
                    this.showToast(`🎯 Jumped to "${taskTitle}"`, 'success');
                }
            });
        } else {
            // Instant jump without animation
            this.jumpToPosition(workingTask.x, workingTask.y, targetZoom);
            this.updateZoomDisplay();
            this.saveToStorage();
            this.showToast(`🎯 Jumped to "${taskTitle}"`, 'success');
        }
    },

    showWorkingTasksDropdown(event, keyboardMode = false) {
        if (event) event.stopPropagation();
        const workingTasks = this.tasks.filter(t => t.currentlyWorking);
        if (workingTasks.length === 0) {
            this.showToast('No task is currently being worked on', 'warning');
            return;
        }
        if (workingTasks.length === 1 && !keyboardMode) {
            this.jumpToWorkingTask();
            return;
        }
        const dropdown = document.createElement('div');
        dropdown.id = 'working-tasks-dropdown';
        const bgColor = this.darkMode ? '#1e293b' : 'white';
        const borderColor = this.darkMode ? '#475569' : '#ccc';
        dropdown.style.cssText = `position:fixed;bottom:60px;right:10px;background:${bgColor};border:1px solid ${borderColor};border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:3000;min-width:250px;max-height:400px;overflow-y:auto;`;

        const header = document.createElement('div');
        header.style.cssText = `padding:10px 12px;border-bottom:1px solid ${borderColor};display:flex;justify-content:space-between;align-items:center;`;
        const headerTitle = document.createElement('span');
        const textColor = this.darkMode ? '#f1f5f9' : '#333';
        headerTitle.style.cssText = `font-weight:600;font-size:13px;color:${textColor};`;
        headerTitle.textContent = 'Working On:';
        const headerHint = document.createElement('span');
        const hintColor = this.darkMode ? '#94a3b8' : '#999';
        headerHint.style.cssText = `font-size:11px;color:${hintColor};font-weight:400;`;
        headerHint.textContent = 'Press 1-9 or J';
        header.appendChild(headerTitle);
        header.appendChild(headerHint);
        dropdown.appendChild(header);

        workingTasks.forEach((task, index) => {
            const item = document.createElement('div');
            const truncatedTitle = task.title.length > 35 ? task.title.substring(0, 32) + '...' : task.title;
            const isLast = task.id === this.lastWorkingTaskId;
            const number = index + 1;
            const itemTextColor = this.darkMode ? '#e2e8f0' : '#333';
            const lastBg = isLast ? (this.darkMode ? 'rgba(59,130,246,0.2)' : 'rgba(33,150,243,0.1)') : 'transparent';
            const borderLeftColor = isLast ? '#2196f3' : 'transparent';
            item.style.cssText = `padding:10px 12px;cursor:pointer;font-size:13px;color:${itemTextColor};background:${lastBg};border-left:3px solid ${borderLeftColor};display:flex;align-items:center;gap:10px;`;

            const badge = document.createElement('span');
            const badgeBg = this.darkMode ? 'rgba(59,130,246,0.4)' : 'rgba(33,150,243,0.2)';
            const badgeColor = this.darkMode ? '#93c5fd' : '#1565c0';
            badge.style.cssText = `background:${badgeBg};color:${badgeColor};padding:2px 7px;border-radius:3px;font-size:11px;font-weight:600;min-width:18px;text-align:center;`;
            badge.textContent = number;

            const text = document.createElement('span');
            text.textContent = `🔄 ${truncatedTitle}${isLast ? ' (last)' : ''}`;
            item.appendChild(badge);
            item.appendChild(text);

            const hoverBg = this.darkMode ? 'rgba(59,130,246,0.3)' : 'rgba(33,150,243,0.2)';
            item.onmouseover = () => { item.style.background = hoverBg; };
            item.onmouseout = () => { item.style.background = lastBg; };
            item.onclick = () => {
                this.jumpToWorkingTask(task.id);
                dropdown.remove();
            };
            dropdown.appendChild(item);
        });

        const keyboardHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                dropdown.remove();
                document.removeEventListener('keydown', keyboardHandler);
                document.removeEventListener('click', closeDropdown);
                return;
            }
            if (/^[1-9]$/.test(e.key)) {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (index < workingTasks.length) {
                    this.jumpToWorkingTask(workingTasks[index].id);
                    dropdown.remove();
                    document.removeEventListener('keydown', keyboardHandler);
                    document.removeEventListener('click', closeDropdown);
                }
            }
        };

        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && e.target.id !== 'jump-dropdown-btn') {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
                document.removeEventListener('keydown', keyboardHandler);
            }
        };

        document.body.appendChild(dropdown);
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
            document.addEventListener('keydown', keyboardHandler);
        }, 10);
    }
};

console.log('[jump.js] Jump to working task navigation loaded');

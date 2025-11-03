/**
 * @order 16
 * @category Core Domain Logic
 * @description Task status management - working state, completion, priority, visibility
 *
 * Functions extracted from task-tree.html (lines 1981-2564):
 * - cycleStatus() - Cycle task status: pending → working → done → pending
 * - toggleDone() - Toggle done status with flow state
 * - toggleWorking() - Toggle working state only (no status change)
 * - setPriority() - Set task priority (high/medium/normal)
 * - cyclePriority() - Cycle through priority levels
 * - selectNode() - Select a task node (single selection)
 * - toggleHiddenSelf() - Hide/show the task itself
 * - toggleHidden() - Hide/show all descendants
 * - getHiddenChildrenCount() - Count hidden children
 * - autoCollapseCompleted() - Auto-hide completed subtrees
 * - clearCompleted() - Remove all done tasks
 * - toggleDarkMode() - Toggle dark mode
 * - repairWorkingTasks() - Fix multiple working tasks bug
 */

export const StatusMixin = {
    cycleStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;

        if (task.status === 'pending' && !task.currentlyWorking) {
            // Pending → Working
            this.saveSnapshot(`Started working on '${truncatedTitle}'`);

            // Multi-project: Only clear working in SAME root tree
            const root = this.getRootTask(taskId);
            const rootId = root ? root.id : null;

            const previousWorkingId = this.workingTasksByRoot[rootId];
            if (previousWorkingId) {
                const prevTask = this.tasks.find(t => t.id === previousWorkingId);
                if (prevTask) {
                    prevTask.currentlyWorking = false;
                    if (!prevTask.textLocked) {
                        prevTask.textExpanded = false;
                    }
                }
            }

            task.currentlyWorking = true;
            if (rootId) {
                this.workingTasksByRoot[rootId] = taskId;
            }
            // Track this as the last working task for Jump button
            this.lastWorkingTaskId = taskId;
        } else if (task.currentlyWorking) {
            // Working → Done
            this.saveSnapshot(`Marked '${truncatedTitle}' as done`);

            const root = this.getRootTask(taskId);
            const rootId = root ? root.id : null;

            task.currentlyWorking = false;
            task.status = 'done';

            // Update working log
            if (rootId) {
                delete this.workingTasksByRoot[rootId];
            }

            // Collapse text if unlocked
            if (!task.textLocked) {
                task.textExpanded = false;
            }

            // Flow state: Auto-start working on parent task to maintain momentum
            if (task.mainParent !== null) {
                const parent = this.tasks.find(t => t.id === task.mainParent);
                if (parent && parent.status !== 'done') {
                    // Clear any previous working task in same root tree
                    const previousWorkingId = this.workingTasksByRoot[rootId];
                    if (previousWorkingId && previousWorkingId !== parent.id) {
                        const prevTask = this.tasks.find(t => t.id === previousWorkingId);
                        if (prevTask) {
                            prevTask.currentlyWorking = false;
                            if (!prevTask.textLocked) {
                                prevTask.textExpanded = false;
                            }
                        }
                    }

                    parent.currentlyWorking = true;
                    // Update working log for parent
                    if (rootId) {
                        this.workingTasksByRoot[rootId] = parent.id;
                    }
                    // Track parent as the last working task for Jump button
                    this.lastWorkingTaskId = parent.id;
                    const parentTitle = parent.title.length > 30 ? parent.title.substring(0, 27) + '...' : parent.title;
                    this.showToast(`⬆️ Now working on parent: ${parentTitle}`, 'info', 3000);
                }
            }
        } else if (task.status === 'done') {
            // Done → Pending
            this.saveSnapshot(`Marked '${truncatedTitle}' as pending`);
            task.status = 'pending';
        }

        this.autoCollapseCompleted(taskId);
        this.updateStatusBar();
        this.saveToStorage();
        this.render();
    },

    toggleDone(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
        const wasWorking = task.currentlyWorking;

        if (task.status === 'done') {
            // Done → Pending
            this.saveSnapshot(`Marked '${truncatedTitle}' as pending`);
            task.status = 'pending';
        } else {
            // Pending/Working → Done
            this.saveSnapshot(`Marked '${truncatedTitle}' as done`);

            const root = this.getRootTask(taskId);
            const rootId = root ? root.id : null;

            task.currentlyWorking = false;  // Stop working when marking done
            task.status = 'done';

            // Update working log
            if (rootId && wasWorking) {
                delete this.workingTasksByRoot[rootId];
            }

            // Flow state: Auto-start working on parent task to maintain momentum
            if (wasWorking && task.mainParent !== null) {
                const parent = this.tasks.find(t => t.id === task.mainParent);
                if (parent && parent.status !== 'done') {
                    // Clear any previous working task in same root tree
                    const previousWorkingId = this.workingTasksByRoot[rootId];
                    if (previousWorkingId && previousWorkingId !== parent.id) {
                        const prevTask = this.tasks.find(t => t.id === previousWorkingId);
                        if (prevTask) {
                            prevTask.currentlyWorking = false;
                            if (!prevTask.textLocked) {
                                prevTask.textExpanded = false;
                            }
                        }
                    }

                    parent.currentlyWorking = true;
                    // Update working log for parent
                    if (rootId) {
                        this.workingTasksByRoot[rootId] = parent.id;
                    }
                    const parentTitle = parent.title.length > 30 ? parent.title.substring(0, 27) + '...' : parent.title;
                    this.showToast(`⬆️ Now working on parent: ${parentTitle}`, 'info', 3000);
                }
            }
        }

        // Check if parent subtree is all done
        this.autoCollapseCompleted(taskId);
        this.saveToStorage();
        this.updateStatusBar();
        this.render();
    },

    toggleWorking(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const root = this.getRootTask(taskId);
        const rootId = root ? root.id : null;

        if (task.currentlyWorking) {
            // Stop working on this task
            task.currentlyWorking = false;
            if (rootId) {
                delete this.workingTasksByRoot[rootId];
            }
            // Collapse text if unlocked
            if (!task.textLocked) {
                task.textExpanded = false;
            }
        } else {
            // Start working - unwork previous in same root only
            const previousWorkingId = this.workingTasksByRoot[rootId];
            if (previousWorkingId) {
                const prevTask = this.tasks.find(t => t.id === previousWorkingId);
                if (prevTask) {
                    prevTask.currentlyWorking = false;
                    if (!prevTask.textLocked) {
                        prevTask.textExpanded = false;
                    }
                }
            }

            task.currentlyWorking = true;
            if (rootId) {
                this.workingTasksByRoot[rootId] = taskId;
            }
            // Track this as the last working task for Jump button
            this.lastWorkingTaskId = taskId;
        }
        this.saveToStorage();
        this.updateStatusBar();
        this.render();
    },

    setPriority(taskId, priority) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
        const priorityLabel = priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : 'Normal';

        this.saveSnapshot(`Set priority of '${truncatedTitle}' to ${priorityLabel}`);

        task.priority = priority;
        this.saveToStorage();
        this.render();

        // Show toast notification
        const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟠' : '⚪';
        this.showToast(`${emoji} Priority set to ${priorityLabel}`, 'success', 2000);
    },

    cyclePriority(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Cycle: null/normal → medium → high → normal
        const nextPriority = !task.priority || task.priority === 'normal' ? 'medium' :
                             task.priority === 'medium' ? 'high' : 'normal';

        this.setPriority(taskId, nextPriority);
    },

    setArrowRouting(taskId, routing) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
        const routingLabel = routing === 'direct' ? 'Direct' : routing === 'orthogonal' ? 'Orthogonal' : 'Inherit';

        this.saveSnapshot(`Set arrow routing of '${truncatedTitle}' to ${routingLabel}`);

        task.arrowRouting = routing;
        this.saveToStorage();
        this.render();

        // Show toast notification
        const emoji = routing === 'direct' ? '↗️' : routing === 'orthogonal' ? '↪️' : '⚙️';
        this.showToast(`${emoji} Arrow routing set to ${routingLabel}`, 'success', 2000);
    },

    /**
     * Get effective arrow routing mode for a node's OUTGOING arrows (to its children)
     * If node has 'inherit' or no setting, walks up parent chain until finding a setting
     * Falls back to global arrowRoutingMode if no ancestor has a setting
     * @param {Object} task - Parent task whose outgoing arrow style to determine
     * @returns {string} 'direct' or 'orthogonal'
     */
    getEffectiveArrowRouting(task) {
        // If task has explicit routing (not 'inherit'), use it
        if (task.arrowRouting && task.arrowRouting !== 'inherit') {
            return task.arrowRouting;
        }

        // Otherwise, walk up parent chain to find a setting
        let current = task.mainParent;
        while (current !== null) {
            const parent = this.tasks.find(t => t.id === current);
            if (!parent) break;

            if (parent.arrowRouting && parent.arrowRouting !== 'inherit') {
                return parent.arrowRouting;
            }

            current = parent.mainParent;
        }

        // No parent has a setting, use global default
        return this.arrowRoutingMode;
    },

    selectNode(taskId) {
        // Single-node selection (clears others)
        this.selectedTaskIds.clear();
        this.selectedTaskIds.add(taskId);
        this.lastClickedTaskId = taskId;

        // If selecting a working task, track it for Jump button
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.currentlyWorking) {
            this.lastWorkingTaskId = taskId;
            console.log(`[selectNode] Updated lastWorkingTaskId to ${taskId} (${task.title})`);
        } else if (task) {
            console.log(`[selectNode] Task ${taskId} (${task.title}) is not working, not updating lastWorkingTaskId`);
        }

        // Defer render to next frame to avoid breaking double-click
        requestAnimationFrame(() => this.render());
    },

    toggleHiddenSelf(taskId) {
        // Hide/show the node itself (not its children)
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.mainParent === null) {
            // Can't hide root tasks - they have no parent
            return;
        }

        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
        this.saveSnapshot(task.hidden ? `Showed '${truncatedTitle}'` : `Hid '${truncatedTitle}'`);

        task.hidden = !task.hidden;

        this.saveToStorage();
        this.render();
    },

    toggleHidden(taskId) {
        // Toggle all descendants (children stay hidden as a group)
        const descendants = this.getDescendants(taskId);

        // Check if any are currently hidden
        const anyHidden = descendants.some(id => {
            const child = this.tasks.find(t => t.id === id);
            return child && child.hidden;
        });

        // Save snapshot
        const task = this.tasks.find(t => t.id === taskId);
        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
        this.saveSnapshot(anyHidden ? `Showed children of '${truncatedTitle}'` : `Hid children of '${truncatedTitle}'`);

        // Toggle: if any are hidden, show all; if all shown, hide all
        descendants.forEach(id => {
            const child = this.tasks.find(t => t.id === id);
            if (child) {
                child.hidden = !anyHidden;
            }
        });

        // If we're showing children again, make sure the parent is visible too
        if (anyHidden) {
            if (task) {
                task.hidden = false;
            }
        }

        this.saveToStorage();
        this.render();
    },

    getHiddenChildrenCount(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return 0;

        return task.children.filter(childId => {
            const child = this.tasks.find(t => t.id === childId);
            return child && child.hidden;
        }).length;
    },

    autoCollapseCompleted(clickedTaskId) {
        // Skip if auto-hide is disabled
        if (!this.autoHideCompletedNodes) {
            return;
        }

        // Only process the clicked task and its affected relatives, not all tasks
        const task = clickedTaskId ? this.tasks.find(t => t.id === clickedTaskId) : null;
        if (!task) return;

        // Check if any children are manually hidden via toggleHidden
        const hasManuallyHiddenChildren = task.children.some(childId => {
            const child = this.tasks.find(t => t.id === childId);
            return child && child.hidden;
        });

        // If task has manually hidden children, skip auto-hide for this task
        if (hasManuallyHiddenChildren) {
            return;
        }

        // Part 1: Hide completed children if task is done and all children are done
        if (task.children.length > 0 && task.status === 'done') {
            const allChildrenDone = task.children.every(childId => {
                const child = this.tasks.find(t => t.id === childId);
                return child && child.status === 'done';
            });

            // Hide all children if they're all done
            if (allChildrenDone) {
                task.children.forEach(childId => {
                    const child = this.tasks.find(t => t.id === childId);
                    if (child) child.hidden = true;
                });
            }
        }

        // Part 2: Hide the task itself ONLY if it has a parent AND that parent is done
        // Root tasks (no parent) are NEVER auto-hidden
        // Tasks inside non-completed parents are NEVER auto-hidden
        if (task.status === 'done' && task.mainParent !== null) {
            const parent = this.tasks.find(t => t.id === task.mainParent);
            if (parent && parent.status === 'done') {
                task.hidden = true;
            }
        }

        // Also process parent if it needs to be collapsed
        if (task.mainParent !== null) {
            const parent = this.tasks.find(t => t.id === task.mainParent);
            if (parent) {
                this.autoCollapseCompleted(parent.id);
            }
        }
    },

    clearCompleted() {
        this.tasks = this.tasks.filter(t => t.status !== 'done');
        this.saveToStorage();
        this.render();
    },

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        const btn = document.getElementById('darkModeToggle');
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            btn.textContent = '☀️ Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            btn.textContent = '🌙 Dark Mode';
        }
        this.saveToStorage();
        this.render();
    },

    /**
     * Toggle debug Ctrl mode - all clicks/drags act as if Ctrl is pressed
     * Useful for testing Ctrl+drag features without holding Ctrl
     */
    toggleDebugCtrlMode() {
        this.debugCtrlMode = !this.debugCtrlMode;
        const btn = document.getElementById('debugCtrlToggle');
        if (this.debugCtrlMode) {
            btn.textContent = '🔧 Debug: Ctrl ON';
            btn.style.background = '#ff9800';
            btn.style.color = 'white';
            btn.style.fontWeight = 'bold';
            this.showToast('🔧 Debug mode ON: All clicks/drags act as Ctrl+click/drag', 'info', 3000);
        } else {
            btn.textContent = '🔧 Debug: Ctrl OFF';
            btn.style.background = '';
            btn.style.color = '';
            btn.style.fontWeight = '';
            this.showToast('Debug mode OFF', 'info', 2000);
        }
        // Don't save to storage - debug mode should not persist
    },

    repairWorkingTasks(silent = false) {
        // Detect and fix data corruption where multiple tasks are marked as working
        const workingTasks = this.tasks.filter(t => t.currentlyWorking);

        if (workingTasks.length === 0) {
            if (!silent) {
                this.showToast('✓ No issues found - data is clean', 'success', 2000);
            }
            return;
        }

        if (workingTasks.length === 1) {
            // Single working task - just verify workingTasksByRoot is correct
            const task = workingTasks[0];
            const root = this.getRootTask(task.id);
            const rootId = root ? root.id : null;

            if (rootId && this.workingTasksByRoot[rootId] !== task.id) {
                this.workingTasksByRoot[rootId] = task.id;
                this.saveToStorage();
                if (!silent) {
                    this.showToast('✓ Fixed working task tracking', 'success', 2000);
                }
            } else if (!silent) {
                this.showToast('✓ No issues found - data is clean', 'success', 2000);
            }
            return;
        }

        // Multiple working tasks - this is the bug!
        this.saveSnapshot('Repaired multiple working tasks');

        // Group working tasks by root
        const workingByRoot = {};
        for (const task of workingTasks) {
            const root = this.getRootTask(task.id);
            const rootId = root ? root.id : null;
            if (!workingByRoot[rootId]) {
                workingByRoot[rootId] = [];
            }
            workingByRoot[rootId].push(task);
        }

        let fixedCount = 0;

        // For each root tree, keep only the first working task
        for (const rootId in workingByRoot) {
            const tasksInRoot = workingByRoot[rootId];
            if (tasksInRoot.length > 1) {
                // Keep first, clear the rest
                for (let i = 1; i < tasksInRoot.length; i++) {
                    tasksInRoot[i].currentlyWorking = false;
                    if (!tasksInRoot[i].textLocked) {
                        tasksInRoot[i].textExpanded = false;
                    }
                    fixedCount++;
                }
                // Update workingTasksByRoot to point to the kept task
                this.workingTasksByRoot[rootId] = tasksInRoot[0].id;
            }
        }

        this.saveToStorage();
        this.updateStatusBar();
        this.render();

        if (!silent) {
            const taskWord = fixedCount === 1 ? 'task' : 'tasks';
            this.showToast(`✓ Fixed ${fixedCount} ${taskWord} marked as working`, 'success', 3000);
        }
    }
};

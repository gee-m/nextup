/**
 * @module utils/task-helpers
 * @order 9
 * @category Utils
 *
 * Task manipulation and validation utilities
 * Centralizes common task operations to eliminate code duplication
 */

export const TaskHelpersMixin = {
    /**
     * Validate task has finite coordinates
     * Prevents NaN/Infinity rendering bugs
     *
     * @param {Object} task - Task object to validate
     * @returns {boolean} true if coordinates are valid, false otherwise
     */
    validateTaskCoordinates(task) {
        if (!task) {
            console.error('[VALIDATION] Cannot validate null/undefined task');
            return false;
        }

        if (!isFinite(task.x) || !isFinite(task.y)) {
            console.error(
                `[VALIDATION] Task ${task.id} "${task.title || 'Untitled'}" has invalid coords: (${task.x}, ${task.y})`
            );
            return false;
        }

        return true;
    },

    /**
     * Truncate title to maximum length with ellipsis
     *
     * @param {string} title - Task title to truncate
     * @param {number} maxLength - Maximum characters (default 30)
     * @returns {string} Truncated title with '...' if needed
     */
    truncateTitle(title, maxLength = 30) {
        if (!title) return '';
        if (typeof title !== 'string') return String(title);
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength - 3) + '...';
    },

    /**
     * Find task by ID with null safety
     * Prevents crashes from undefined task access
     *
     * @param {Array} tasks - Tasks array
     * @param {number} id - Task ID to find
     * @returns {Object|null} Task object or null if not found
     */
    findTaskById(tasks, id) {
        if (!tasks || !Array.isArray(tasks)) {
            console.warn('[TASK-HELPERS] findTaskById called with invalid tasks array');
            return null;
        }
        return tasks.find(t => t.id === id) || null;
    },

    /**
     * Get safe task title for display
     * Handles null/undefined tasks and empty titles
     *
     * @param {Object} task - Task object
     * @param {number} maxLength - Max length before truncation (default 30)
     * @returns {string} Safe display title
     */
    getTaskDisplayTitle(task, maxLength = 30) {
        if (!task) return 'Untitled';
        if (!task.title || task.title.trim() === '') return 'Untitled';
        return this.truncateTitle(task.title, maxLength);
    },

    /**
     * Get all ancestor tasks (parents, grandparents, etc.)
     * Useful for hierarchy traversal
     *
     * @param {Array} tasks - All tasks
     * @param {Object} task - Starting task
     * @returns {Array} Array of ancestor tasks (parent first, root last)
     */
    getAncestors(tasks, task) {
        const ancestors = [];
        let current = task;

        while (current && current.mainParent !== null) {
            const parent = this.findTaskById(tasks, current.mainParent);
            if (!parent) break; // Circular reference protection
            if (ancestors.includes(parent)) break; // Additional safety
            ancestors.push(parent);
            current = parent;
        }

        return ancestors;
    },

    /**
     * Get all descendant tasks (children, grandchildren, etc.)
     * Useful for subtree operations
     *
     * @param {Array} tasks - All tasks
     * @param {Object} task - Starting task
     * @param {boolean} includeHidden - Include hidden descendants (default false)
     * @returns {Array} Array of descendant tasks
     */
    getDescendants(tasks, task, includeHidden = false) {
        const descendants = [];
        const toProcess = [...(task.children || [])];
        const processed = new Set();

        while (toProcess.length > 0) {
            const childId = toProcess.shift();

            // Circular reference protection
            if (processed.has(childId)) continue;
            processed.add(childId);

            const child = this.findTaskById(tasks, childId);
            if (!child) continue;
            if (!includeHidden && child.hidden) continue;

            descendants.push(child);

            // Add grandchildren
            if (child.children) {
                toProcess.push(...child.children);
            }
        }

        return descendants;
    },

    /**
     * Check if task has any incomplete children
     * Used for status indicators
     *
     * @param {Array} tasks - All tasks
     * @param {Object} task - Parent task to check
     * @returns {boolean} true if has incomplete children
     */
    hasIncompleteChildren(tasks, task) {
        if (!task.children || task.children.length === 0) return false;

        for (const childId of task.children) {
            const child = this.findTaskById(tasks, childId);
            if (!child) continue;
            if (child.hidden) continue;
            if (child.status !== 'done') return true;
        }

        return false;
    },

    /**
     * Count visible children by status
     * Used for progress indicators
     *
     * @param {Array} tasks - All tasks
     * @param {Object} task - Parent task
     * @returns {Object} { total, done, pending, working }
     */
    countChildrenByStatus(tasks, task) {
        const counts = { total: 0, done: 0, pending: 0, working: 0 };

        if (!task.children) return counts;

        for (const childId of task.children) {
            const child = this.findTaskById(tasks, childId);
            if (!child || child.hidden) continue;

            counts.total++;
            if (child.currentlyWorking) {
                counts.working++;
            } else if (child.status === 'done') {
                counts.done++;
            } else {
                counts.pending++;
            }
        }

        return counts;
    },

    /**
     * Format task path for display (e.g., "Root > Parent > Task")
     * Used in status bar and tooltips
     *
     * @param {Array} tasks - All tasks
     * @param {Object} task - Task to format path for
     * @param {string} separator - Path separator (default ' > ')
     * @param {number} maxTitleLength - Max length per title (default 20)
     * @returns {string} Formatted path string
     */
    formatTaskPath(tasks, task, separator = ' > ', maxTitleLength = 20) {
        const ancestors = this.getAncestors(tasks, task);
        const path = [...ancestors.reverse(), task];

        return path
            .map(t => this.truncateTitle(t.title || 'Untitled', maxTitleLength))
            .join(separator);
    },
};

console.log('[task-helpers.js] Task validation and manipulation helpers loaded');

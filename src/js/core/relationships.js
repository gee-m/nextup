/**
 * @order 17
 * @category Core Domain Logic
 * @description Task relationship management - parent-child, dependencies, cycle detection
 *
 * Functions extracted from task-tree.html (lines 4421-4602):
 * - reparentTask() - Change task's parent via Ctrl+drag
 * - addDependency() - Add dependency via Alt+drag (toggle if exists)
 * - removeDependency() - Remove specific dependency
 * - deleteLine() - Delete parent or dependency link
 * - wouldCreateCycle() - Check if dependency would create cycle
 */

export const RelationshipsMixin = {
    reparentTask({ taskId, newParentId }) {
        const task = this.tasks.find(t => t.id === taskId);
        const newParent = this.tasks.find(t => t.id === newParentId);

        if (!task || !newParent) return;

        // Can't reparent to self or to own descendant
        if (taskId === newParentId || this.getDescendants(taskId).includes(newParentId)) {
            this.showAlert('Cannot Reparent', 'Cannot reparent to self or descendant!');
            return;
        }

        // Handle working task log if task is currently working
        if (task.currentlyWorking) {
            const oldRoot = this.getRootTask(taskId);

            // Will get new root after reparenting below, so we just remove from old root now
            if (oldRoot) {
                delete this.workingTasksByRoot[oldRoot.id];
            }
        }

        // Remove from old parent's children
        if (task.mainParent !== null) {
            const oldParent = this.tasks.find(t => t.id === task.mainParent);
            if (oldParent) {
                oldParent.children = oldParent.children.filter(id => id !== taskId);
            }
        }

        // Set new parent
        task.mainParent = newParentId;
        newParent.children.push(taskId);

        // Update working log if task is still working (after reparenting)
        if (task.currentlyWorking) {
            const newRoot = this.getRootTask(taskId);
            if (newRoot) {
                this.workingTasksByRoot[newRoot.id] = taskId;
            }
        }

        // Clean up redundant dependencies
        // Remove newParent from task's dependencies (task depending on its parent is redundant)
        task.dependencies = task.dependencies.filter(id => id !== newParentId);

        // Remove task from newParent's dependencies (parent depending on child would be circular)
        newParent.dependencies = newParent.dependencies.filter(id => id !== taskId);

        this.saveToStorage();
        this.updateStatusBar();
        this.render();
    },

    addDependency({ dependentId, prerequisiteId }) {
        const dependent = this.tasks.find(t => t.id === dependentId);
        if (!dependent) return;

        // Check if dependency already exists (toggle behavior)
        const existingIndex = dependent.dependencies.indexOf(prerequisiteId);
        if (existingIndex !== -1) {
            // Dependency exists, remove it
            const prerequisite = this.tasks.find(t => t.id === prerequisiteId);
            const depTitle = dependent.title.length > 20 ? dependent.title.substring(0, 17) + '...' : dependent.title;
            const preTitle = prerequisite.title.length > 20 ? prerequisite.title.substring(0, 17) + '...' : prerequisite.title;
            this.saveSnapshot(`Removed dependency: '${depTitle}' no longer depends on '${preTitle}'`);
            dependent.dependencies.splice(existingIndex, 1);
            this.saveToStorage();
            this.render();
            return;
        }

        // Prevent circular dependencies
        if (this.wouldCreateCycle(dependentId, prerequisiteId)) {
            this.showAlert('Cannot Create Dependency', 'Cannot create circular dependency!');
            return;
        }

        // Add new dependency
        const prerequisite = this.tasks.find(t => t.id === prerequisiteId);
        const depTitle = dependent.title.length > 20 ? dependent.title.substring(0, 17) + '...' : dependent.title;
        const preTitle = prerequisite.title.length > 20 ? prerequisite.title.substring(0, 17) + '...' : prerequisite.title;
        this.saveSnapshot(`Added dependency: '${depTitle}' depends on '${preTitle}'`);
        dependent.dependencies.push(prerequisiteId);
        this.saveToStorage();
        this.render();
    },

    removeDependency(fromId, toId) {
        const from = this.tasks.find(t => t.id === fromId);
        if (from) {
            const to = this.tasks.find(t => t.id === toId);
            const fromTitle = from.title.length > 20 ? from.title.substring(0, 17) + '...' : from.title;
            const toTitle = to.title.length > 20 ? to.title.substring(0, 17) + '...' : to.title;
            this.saveSnapshot(`Removed dependency: '${fromTitle}' no longer depends on '${toTitle}'`);
            from.dependencies = from.dependencies.filter(id => id !== toId);
            this.saveToStorage();
            this.render();
        }
    },

    deleteLine(lineData) {
        if (lineData.type === 'parent') {
            // Remove parent-child relationship
            const task = this.tasks.find(t => t.id === lineData.taskId);
            if (task) {
                if (task.mainParent === lineData.parentId) {
                    // Remove main parent - child becomes root
                    task.mainParent = null;
                }
                // Also try to remove from otherParents
                task.otherParents = task.otherParents.filter(id => id !== lineData.parentId);

                // Remove from parent's children list
                const parent = this.tasks.find(t => t.id === lineData.parentId);
                if (parent) {
                    parent.children = parent.children.filter(id => id !== lineData.taskId);
                }

                this.saveToStorage();
                this.selectedLine = null;
                this.render();
            }
        } else if (lineData.type === 'dependency') {
            // Remove dependency
            this.removeDependency(lineData.from, lineData.to);
            this.selectedLine = null;
        }
    },

    wouldCreateCycle(fromId, toId) {
        // Check if adding dependency from->to would create a cycle
        const visited = new Set();
        const queue = [toId];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === fromId) return true;
            if (visited.has(current)) continue;

            visited.add(current);
            const task = this.tasks.find(t => t.id === current);
            if (task) {
                queue.push(...task.dependencies);
            }
        }

        return false;
    }
};

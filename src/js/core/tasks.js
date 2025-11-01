/**
 * @order 15
 * @category Core Domain Logic
 * @description Task CRUD operations - creation, deletion, and tree traversal
 *
 * Functions extracted from task-tree.html (lines 1878-2453):
 * - addChildTask() - Create child task and auto-start editing
 * - createChildAtPosition() - Create child at specific coordinates
 * - addRootTaskAtPosition() - Create root task at specific coordinates
 * - deleteTask() - Delete task and all descendants with confirmation
 * - deleteMultipleTasks() - Bulk delete selected tasks
 * - getDescendants() - Recursively get all descendants
 * - getRootTask() - Find root task of tree
 * - getAncestors() - Get all ancestors up to root
 * - getPathToRoot() - Get title path from task to root
 */

export const TasksMixin = {
    addChildTask(parentId) {
        this.saveSnapshot(`Created child task 'New Task'`);

        const parent = this.tasks.find(t => t.id === parentId);

        // DEFENSIVE: Check parent coordinates
        if (!parent) {
            console.error(`addChildTask: parent ${parentId} not found!`);
            return;
        }
        if (!isFinite(parent.x) || !isFinite(parent.y)) {
            console.error(`addChildTask: parent ${parentId} has invalid coords: (${parent.x}, ${parent.y})`);
            console.trace('Stack trace:');
        }

        const task = {
            id: this.taskIdCounter++,
            title: 'New Task',
            x: parent.x + Math.random() * 200 - 100,
            y: parent.y + 150 + Math.random() * 50,
            vx: 0,
            vy: 0,
            mainParent: parentId,
            otherParents: [],
            children: [],
            dependencies: [],
            status: 'pending',
            hidden: false,
            currentlyWorking: false,
            textExpanded: false,
            textLocked: false,
            links: [],  // Array of URLs attached to this task
            priority: 'normal'  // Priority: 'high', 'medium', 'normal'
        };

        parent.children.push(task.id);
        this.tasks.push(task);
        this.saveToStorage();
        this.updateStatusBar();
        this.render();

        // Auto-start editing the new task
        setTimeout(() => this.startEditing(task.id), 50);
    },

    createChildAtPosition({ parentId, x, y }) {
        const parent = this.tasks.find(t => t.id === parentId);
        if (!parent) return;

        // DEFENSIVE: Log and validate coordinates
        if (!isFinite(x) || !isFinite(y)) {
            console.error(`createChildAtPosition called with invalid coords: (${x}, ${y})`);
            console.trace('Stack trace:');
            // Use parent coords as fallback
            x = parent.x + 100;
            y = parent.y + 100;
        }

        this.saveSnapshot(`Created child task`);

        const task = {
            id: this.taskIdCounter++,
            title: '',  // Empty - user will edit immediately
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            mainParent: parentId,
            otherParents: [],
            children: [],
            dependencies: [],
            status: 'pending',
            hidden: false,
            currentlyWorking: false,
            textExpanded: false,
            textLocked: false,
            links: [],  // Array of URLs attached to this task
            priority: 'normal'  // Priority: 'high', 'medium', 'normal'
        };

        parent.children.push(task.id);
        this.tasks.push(task);
        this.saveToStorage();
        this.updateStatusBar();
        this.render();

        // Auto-start editing the new task
        setTimeout(() => this.startEditing(task.id), 50);
        this.showToast('Child task created', 'success', 2000);
    },

    addRootTaskAtPosition(x, y) {
        // DEFENSIVE: Log and validate coordinates
        if (!isFinite(x) || !isFinite(y)) {
            console.error(`addRootTaskAtPosition called with invalid coords: (${x}, ${y})`);
            console.trace('Stack trace:');
            // Use default coordinates as fallback
            x = 400;
            y = 300;
        }

        this.saveSnapshot(`Created root task`);

        const newTask = {
            id: this.taskIdCounter++,
            title: '',  // Empty - user will edit immediately
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            mainParent: null,
            otherParents: [],
            children: [],
            dependencies: [],
            status: 'pending',
            currentlyWorking: false,
            hidden: false,
            textExpanded: false,
            textLocked: false,
            links: [],  // Array of URLs attached to this task
            priority: 'normal'  // Priority: 'high', 'medium', 'normal'
        };

        this.tasks.push(newTask);
        this.saveToStorage();
        this.render();

        // Auto-start editing the new task
        setTimeout(() => this.startEditing(newTask.id), 50);
        this.showToast('Root task created', 'success', 2000);
    },

    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const taskTitle = task ? task.title : 'task';

        const performDelete = () => {
            // Save snapshot before deletion
            const truncatedTitle = taskTitle.length > 30 ? taskTitle.substring(0, 27) + '...' : taskTitle;
            this.saveSnapshot(`Deleted task '${truncatedTitle}'`);

            const descendants = this.getDescendants(taskId);
            const toDelete = [taskId, ...descendants];

            // Remove from parents' children arrays
            this.tasks.forEach(task => {
                task.children = task.children.filter(id => !toDelete.includes(id));
                task.dependencies = task.dependencies.filter(id => !toDelete.includes(id));
                task.otherParents = task.otherParents.filter(id => !toDelete.includes(id));
            });

            // Remove tasks
            this.tasks = this.tasks.filter(t => !toDelete.includes(t.id));

            // Clean up working log if deleted task was working
            Object.keys(this.workingTasksByRoot).forEach(rootId => {
                if (toDelete.includes(this.workingTasksByRoot[rootId])) {
                    delete this.workingTasksByRoot[rootId];
                }
            });

            this.saveToStorage();
            this.updateStatusBar();
            this.render();
        };

        if (this.showDeleteConfirmation) {
            this.showConfirm(
                'Delete Task',
                'Delete this task and all its children? This can be undone with Ctrl+Z.',
                performDelete
            );
        } else {
            performDelete();
        }
    },

    deleteMultipleTasks(taskIds) {
        // Delete multiple selected tasks with confirmation
        const performDelete = () => {
            this.saveSnapshot(`Deleted ${taskIds.length} tasks`);

            // Collect all tasks to delete (including descendants of each selected task)
            let toDelete = new Set();
            taskIds.forEach(taskId => {
                toDelete.add(taskId);
                this.getDescendants(taskId).forEach(descendantId => {
                    toDelete.add(descendantId);
                });
            });
            const toDeleteArray = Array.from(toDelete);

            // Remove from parents' children arrays
            this.tasks.forEach(task => {
                task.children = task.children.filter(id => !toDeleteArray.includes(id));
                task.dependencies = task.dependencies.filter(id => !toDeleteArray.includes(id));
                task.otherParents = task.otherParents.filter(id => !toDeleteArray.includes(id));
            });

            // Remove tasks
            this.tasks = this.tasks.filter(t => !toDeleteArray.includes(t.id));
            this.selectedTaskIds.clear();

            this.saveToStorage();
            this.updateStatusBar();
            this.render();
        };

        if (this.showDeleteConfirmation) {
            this.showConfirm(
                `Delete ${taskIds.length} Tasks`,
                `Delete ${taskIds.length} selected tasks and all their children? This can be undone with Ctrl+Z.`,
                performDelete
            );
        } else {
            performDelete();
        }
    },

    getDescendants(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return [];

        let descendants = [];
        task.children.forEach(childId => {
            descendants.push(childId);
            descendants = descendants.concat(this.getDescendants(childId));
        });
        return descendants;
    },

    getRootTask(taskId) {
        // Find the root task of the tree containing this task
        let task = this.tasks.find(t => t.id === taskId);
        if (!task) return null;

        // Traverse up the parent chain to find root
        while (task.mainParent !== null) {
            task = this.tasks.find(t => t.id === task.mainParent);
            if (!task) return null;
        }
        return task;
    },

    getAncestors(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.mainParent === null) return [];

        const ancestors = [task.mainParent];
        ancestors.push(...this.getAncestors(task.mainParent));
        return ancestors;
    },

    getPathToRoot(taskId) {
        const path = [];
        let currentId = taskId;

        while (currentId !== null) {
            const task = this.tasks.find(t => t.id === currentId);
            if (!task) break;
            path.unshift(task.title);
            currentId = task.mainParent;
        }

        return path;
    },

    getSubtreeSize(taskId) {
        // Count the number of nodes in a subtree (including root)
        let count = 0;
        const counted = new Set();

        const countNode = (id) => {
            if (counted.has(id)) return;
            const task = this.tasks.find(t => t.id === id);
            if (!task) return;

            counted.add(id);
            count++;
            task.children.forEach(childId => countNode(childId));
        };

        countNode(taskId);
        return count;
    }
};

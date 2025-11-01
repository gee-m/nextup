/**
 * @module rendering/golden-path
 * @order 20
 * @category rendering
 *
 * Golden path visualization - tracks working task ancestors and children
 */

export const GoldenPathMixin = {
    getWorkingTaskPath() {
        // Returns ancestor and descendant paths for the currently working task
        // Used for golden path visualization
        const workingTask = this.tasks.find(t => t.currentlyWorking);
        if (!workingTask) {
            return { workingTaskId: null, ancestorPath: new Set(), directChildren: [] };
        }

        // Build full ancestor path (working task → root)
        // This includes the working task itself AND all ancestors
        const ancestorPath = new Set();
        ancestorPath.add(workingTask.id);  // Include working task itself
        let current = workingTask.mainParent;
        while (current !== null) {
            ancestorPath.add(current);
            const parent = this.tasks.find(t => t.id === current);
            current = parent ? parent.mainParent : null;
        }

        // Get direct children with their completion status
        const directChildren = workingTask.children.map(childId => {
            const child = this.tasks.find(t => t.id === childId);
            return {
                id: childId,
                isDone: child ? child.status === 'done' : false
            };
        });

        return {
            workingTaskId: workingTask.id,
            ancestorPath,
            directChildren
        };
    }
};

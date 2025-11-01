/**
 * @module ui/status-bar
 * @order 32
 * @category ui
 *
 * Bottom status bar showing working task context
 */

export const StatusBarMixin = {
    updateStatusBar() {
        const workingTask = this.tasks.find(t => t.currentlyWorking);
        const statusBar = document.getElementById('status-bar');
        const container = document.getElementById('canvas-container');
        const jumpBtn = document.getElementById('jump-to-working-btn');

        // Always show the status bar
        statusBar.classList.add('show');
        container.classList.add('has-status-bar');

        if (!workingTask) {
            // Show default message
            const pathEl = document.getElementById('status-path');
            pathEl.innerHTML = '<span class="status-task">No task selected</span>';

            const childrenEl = document.getElementById('status-children');
            childrenEl.textContent = '| Middle-click a task to start working on it';

            // Hide jump button when no working task
            if (jumpBtn) jumpBtn.classList.add('hidden');
            return;
        }

        // Show jump button when there's a working task
        if (jumpBtn) jumpBtn.classList.remove('hidden');

        // Get full path
        const path = this.getPathToRoot(workingTask.id);

        // Compress if too long
        let pathDisplay;
        if (path.length > 4) {
            // Root > ... > Parent > Current
            pathDisplay = `${path[0]} > ... > ${path[path.length - 2]} > `;
        } else if (path.length > 1) {
            pathDisplay = path.slice(0, -1).join(' > ') + ' > ';
        } else {
            pathDisplay = '';
        }

        // Add current task in yellow with priority indicator
        const pathEl = document.getElementById('status-path');
        const priorityEmoji = workingTask.priority === 'high' ? ' 🔴' : workingTask.priority === 'medium' ? ' 🟠' : '';
        pathEl.innerHTML = pathDisplay + `<span class="status-task">${workingTask.title}${priorityEmoji}</span>`;

        // Children info with percentage and incomplete list
        const childrenEl = document.getElementById('status-children');
        const childCount = workingTask.children.length;

        if (childCount > 0) {
            const completeCount = workingTask.children.filter(childId => {
                const child = this.tasks.find(t => t.id === childId);
                return child && child.status === 'done';
            }).length;

            const percentage = Math.round((completeCount / childCount) * 100);

            const incompleteChildren = workingTask.children
                .filter(childId => {
                    const child = this.tasks.find(t => t.id === childId);
                    return child && child.status !== 'done';
                })
                .map(childId => {
                    const child = this.tasks.find(t => t.id === childId);
                    return child ? child.title : '';
                });

            let childText = `| Children: ${completeCount}/${childCount} (${percentage}%)`;
            if (incompleteChildren.length > 0) {
                childText += ` | Incomplete: ${incompleteChildren.join(', ')}`;
                childrenEl.innerHTML = childText + ' <span class="status-warning">⚠</span>';
            } else {
                childrenEl.innerHTML = childText;
            }
        } else {
            childrenEl.textContent = '| No children';
        }
    }
};

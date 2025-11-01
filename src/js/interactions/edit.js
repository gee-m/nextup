/**
 * @module interactions/edit
 * @order 28
 * @category interactions
 *
 * Inline text editing for task nodes
 */

export const EditMixin = {
    startEditing(taskId) {
        this.editingTaskId = taskId;
        this.render();

        // Focus the input after render
        setTimeout(() => {
            const input = document.getElementById('edit-input');
            if (input) {
                input.focus();
                input.select();
            }
        }, 10);
    },

    finishEditing(save = true) {
        if (this.editingTaskId === null) return;

        if (save) {
            const input = document.getElementById('edit-input');
            if (input) {
                const task = this.tasks.find(t => t.id === this.editingTaskId);
                if (task) {
                    let newTitle = input.value.trim() || 'Untitled';

                    // Extract URLs from text and add to links array
                    const foundURLs = this.extractURLsFromText(newTitle);
                    if (foundURLs.length > 0) {
                        // Initialize links array if doesn't exist
                        if (!task.links) task.links = [];

                        // Add new links (avoid duplicates)
                        let newLinksCount = 0;
                        foundURLs.forEach(url => {
                            if (this.isValidURL(url) && !task.links.includes(url)) {
                                task.links.push(url);
                                newLinksCount++;
                            }
                        });

                        // Remove URLs from visible text
                        newTitle = this.removeURLsFromText(newTitle) || 'Untitled';

                        // Show toast notification
                        if (newLinksCount > 0) {
                            const plural = newLinksCount > 1 ? 's' : '';
                            this.showToast(`🔗 Added ${newLinksCount} link${plural}`, 'success', 3000);
                        }
                    }

                    // Save snapshot with 2-second grouping for edits to same task
                    const truncatedTitle = newTitle.length > 30 ? newTitle.substring(0, 27) + '...' : newTitle;
                    this.saveSnapshot(`Edited task '${truncatedTitle}'`, this.editingTaskId);
                    task.title = newTitle;
                }
            }
        }

        this.editingTaskId = null;
        this.saveToStorage();
        this.updateStatusBar();
        this.render();
    },

    resizeEditingBox() {
        // Dynamically resize the editing textarea and its container rectangle
        // Called on every keystroke (oninput event) during editing

        if (this.editingTaskId === null) return;

        const textarea = document.getElementById('edit-input');
        if (!textarea) return;

        // Get current text from textarea
        const currentText = textarea.value || '';

        // Calculate new dimensions based on current text
        const { rectWidth, rectHeight, lines } = this.calculateTextBoxDimensions(currentText);

        // Find the task node and its child elements
        const taskNode = document.querySelector(`.task-node[data-id="${this.editingTaskId}"]`);
        if (!taskNode) return;

        const rect = taskNode.querySelector('rect');
        const foreignObject = taskNode.querySelector('foreignObject');

        if (!rect || !foreignObject) return;

        // Update rectangle dimensions (centered at 0,0)
        rect.setAttribute('x', -rectWidth / 2);
        rect.setAttribute('y', -rectHeight / 2);
        rect.setAttribute('width', rectWidth);
        rect.setAttribute('height', rectHeight);

        // Update foreignObject (container for textarea)
        foreignObject.setAttribute('x', -rectWidth / 2);
        foreignObject.setAttribute('y', -rectHeight / 2 + 5);
        foreignObject.setAttribute('width', rectWidth);
        foreignObject.setAttribute('height', rectHeight - 10);

        // Update textarea rows for better UX
        textarea.rows = Math.max(2, lines.length);
    }
};

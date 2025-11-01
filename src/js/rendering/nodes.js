/**
 * @module rendering/nodes
 * @order 22
 * @category rendering
 *
 * Task node rendering - SVG generation for task rectangles with text
 */

export const NodesMixin = {
    calculateTaskDimensions(task) {
        // Helper: Calculate task dimensions with multiline support
        const padding = this.nodePadding;
        const charWidth = this.charWidth;
        const minWidth = this.minNodeWidth;

        // Determine display text (same logic as main rendering)
        const charsOverLimit = task.title.length - this.textLengthThreshold;
        const shouldTruncate = charsOverLimit > 5;
        const shouldExpand = task.currentlyWorking || task.textLocked || (task.textExpanded && this.selectedTaskIds.has(task.id));
        const displayTitle = (shouldTruncate && !shouldExpand) ? task.title.substring(0, this.textLengthThreshold) + '...' : task.title;

        // Use full text for multiline, truncated for single-line
        const textForSizing = this.enableMultiline ? task.title : displayTitle;

        // Wrap text into lines (subtract padding to ensure text fits within available space)
        const availableWidth = this.maxNodeWidth - padding * 2;
        const lines = this.wrapText(textForSizing, availableWidth, charWidth, this.wordWrap);

        // Calculate width
        const longestLineWidth = Math.max(...lines.map(line => line.length * charWidth + padding * 2));
        const rectWidth = Math.max(minWidth, Math.min(this.maxNodeWidth, longestLineWidth));

        // Calculate height (use fixed vertical padding, not nodePadding)
        const verticalPadding = 10;
        const calculatedHeight = lines.length * this.lineHeight + verticalPadding * 2;
        const rectHeight = this.maxNodeHeight > 0
            ? Math.min(this.maxNodeHeight, calculatedHeight)
            : calculatedHeight;

        return { rectWidth, rectHeight, lines };
    },

    calculateTextBoxDimensions(text) {
        // Helper method to calculate rectangle dimensions for given text
        // Returns { rectWidth, rectHeight, lines }
        // Used by both render() and resizeEditingBox() for consistent sizing

        const padding = this.nodePadding;
        const charWidth = this.charWidth;
        const minWidth = this.minNodeWidth;

        // Wrap text into lines based on max width (subtract padding to ensure text fits within available space)
        const availableWidth = this.maxNodeWidth - padding * 2;
        const lines = this.wrapText(text, availableWidth, charWidth, this.wordWrap);

        // Calculate width: minimum of (maxNodeWidth OR longest line width OR minWidth)
        const longestLineWidth = Math.max(...lines.map(line => line.length * charWidth + padding * 2));
        const rectWidth = Math.max(minWidth, Math.min(this.maxNodeWidth, longestLineWidth));

        // Calculate height: lines * lineHeight + vertical padding
        const verticalPadding = 10;
        const calculatedHeight = lines.length * this.lineHeight + verticalPadding * 2;

        // Apply max height constraint if configured
        const rectHeight = this.maxNodeHeight > 0
            ? Math.min(this.maxNodeHeight, calculatedHeight)
            : calculatedHeight;

        return { rectWidth, rectHeight, lines };
    }
};

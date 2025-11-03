/**
 * @module interactions/snapping
 * @order 27
 * @category interactions
 *
 * Alignment snapping for node positioning
 * Provides visual feedback and snap-to-align behavior when dragging nodes
 */

export const SnappingMixin = {
    /**
     * Calculate snap position for a dragged node
     * Returns adjusted position and snap lines to display
     *
     * @param {number} draggedX - Proposed X position of dragged node center
     * @param {number} draggedY - Proposed Y position of dragged node center
     * @param {number} draggedWidth - Width of dragged node
     * @param {number} draggedHeight - Height of dragged node
     * @param {Set<number>} excludeIds - Task IDs to exclude from snapping (e.g., dragged tasks)
     * @returns {{x: number, y: number, snapLines: Array}} Adjusted position and snap lines
     */
    calculateSnapping(draggedX, draggedY, draggedWidth, draggedHeight, excludeIds = new Set()) {
        if (!this.enableSnapping) {
            return { x: draggedX, y: draggedY, snapLines: [] };
        }

        const threshold = this.snapThreshold;
        const snapLines = [];

        // Calculate dragged node bounds
        const dragged = {
            left: draggedX - draggedWidth / 2,
            right: draggedX + draggedWidth / 2,
            top: draggedY - draggedHeight / 2,
            bottom: draggedY + draggedHeight / 2,
            centerX: draggedX,
            centerY: draggedY
        };

        let snapX = null;
        let snapY = null;
        let minDistX = threshold;
        let minDistY = threshold;
        let snapLineX = null;
        let snapLineY = null;

        // Check all other tasks (only those visible in viewport)
        for (const task of this.tasks) {
            if (excludeIds.has(task.id) || task.hidden) continue;

            // Skip tasks outside the viewport
            const margin = 100; // Extra margin to include near-viewport tasks
            if (task.x < this.viewBox.x - margin ||
                task.x > this.viewBox.x + this.viewBox.width + margin ||
                task.y < this.viewBox.y - margin ||
                task.y > this.viewBox.y + this.viewBox.height + margin) {
                continue;
            }

            const dims = this.calculateTaskDimensions(task);
            const other = {
                left: task.x - dims.width / 2,
                right: task.x + dims.width / 2,
                top: task.y - dims.height / 2,
                bottom: task.y + dims.height / 2,
                centerX: task.x,
                centerY: task.y
            };

            // Check vertical alignments (affects X position)
            const verticalChecks = [
                // Edge alignments
                { pos: other.left, dragPos: dragged.left, type: 'left-edge', line: other.left },
                { pos: other.right, dragPos: dragged.right, type: 'right-edge', line: other.right },
                { pos: other.left, dragPos: dragged.right, type: 'right-to-left', line: other.left },
                { pos: other.right, dragPos: dragged.left, type: 'left-to-right', line: other.right },
                // Center alignment
                { pos: other.centerX, dragPos: dragged.centerX, type: 'center-x', line: other.centerX, isCenter: true }
            ];

            for (const check of verticalChecks) {
                const dist = Math.abs(check.pos - check.dragPos);
                if (dist < minDistX) {
                    minDistX = dist;
                    const offset = check.pos - check.dragPos;
                    snapX = draggedX + offset;
                    snapLineX = {
                        type: 'vertical',
                        position: check.line,
                        alignType: check.isCenter ? 'center' : 'edge'
                    };
                }
            }

            // Check horizontal alignments (affects Y position)
            const horizontalChecks = [
                // Edge alignments
                { pos: other.top, dragPos: dragged.top, type: 'top-edge', line: other.top },
                { pos: other.bottom, dragPos: dragged.bottom, type: 'bottom-edge', line: other.bottom },
                { pos: other.top, dragPos: dragged.bottom, type: 'bottom-to-top', line: other.top },
                { pos: other.bottom, dragPos: dragged.top, type: 'top-to-bottom', line: other.bottom },
                // Center alignment
                { pos: other.centerY, dragPos: dragged.centerY, type: 'center-y', line: other.centerY, isCenter: true }
            ];

            for (const check of horizontalChecks) {
                const dist = Math.abs(check.pos - check.dragPos);
                if (dist < minDistY) {
                    minDistY = dist;
                    const offset = check.pos - check.dragPos;
                    snapY = draggedY + offset;
                    snapLineY = {
                        type: 'horizontal',
                        position: check.line,
                        alignType: check.isCenter ? 'center' : 'edge'
                    };
                }
            }
        }

        // Build snap lines array
        if (snapLineX) snapLines.push(snapLineX);
        if (snapLineY) snapLines.push(snapLineY);

        return {
            x: snapX !== null ? snapX : draggedX,
            y: snapY !== null ? snapY : draggedY,
            snapLines
        };
    }
};

console.log('[snapping.js] Alignment snapping loaded');

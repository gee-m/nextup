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

        // PERF: Distance threshold for equi-distance checks (only check nearby nodes)
        const EQUIDIST_MAX_DISTANCE = 800; // Only check nodes within 800px
        const ALIGNMENT_THRESHOLD = 50; // How close Y coords must be for horizontal alignment (and vice versa)

        // Collect nearby tasks for equi-distance checking
        const nearbyTasks = [];

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
                centerY: task.y,
                task: task,
                dims: dims
            };

            // PERF: Collect for equi-distance checks only if within distance threshold
            const distance = Math.sqrt(
                Math.pow(task.x - draggedX, 2) +
                Math.pow(task.y - draggedY, 2)
            );
            if (distance < EQUIDIST_MAX_DISTANCE) {
                nearbyTasks.push(other);
            }

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

        // ========================================
        // Equi-distance Spacing Detection
        // ========================================

        // Try horizontal equi-distance (nodes aligned horizontally)
        const equidistHorizontal = this.findEquiDistanceSnap(
            nearbyTasks,
            dragged,
            'horizontal',
            ALIGNMENT_THRESHOLD,
            threshold
        );

        // Try vertical equi-distance (nodes aligned vertically)
        const equidistVertical = this.findEquiDistanceSnap(
            nearbyTasks,
            dragged,
            'vertical',
            ALIGNMENT_THRESHOLD,
            threshold
        );

        // Prioritize: equi-distance > edge/center alignment
        // (But only if equi-distance snap is closer than current snap)
        if (equidistHorizontal && equidistHorizontal.distance < minDistX) {
            snapX = equidistHorizontal.snapX;
            snapLineX = equidistHorizontal.snapLine;
        }

        if (equidistVertical && equidistVertical.distance < minDistY) {
            snapY = equidistVertical.snapY;
            snapLineY = equidistVertical.snapLine;
        }

        // Build snap lines array
        if (snapLineX) snapLines.push(snapLineX);
        if (snapLineY) snapLines.push(snapLineY);

        return {
            x: snapX !== null ? snapX : draggedX,
            y: snapY !== null ? snapY : draggedY,
            snapLines
        };
    },

    /**
     * Find equi-distance snap position
     * Detects when the dragged node can be placed to create equal spacing between nodes
     *
     * @param {Array} nearbyTasks - Tasks to check (already filtered by distance)
     * @param {Object} dragged - Dragged node bounds
     * @param {string} orientation - 'horizontal' or 'vertical'
     * @param {number} alignmentThreshold - How close perpendicular coords must be
     * @param {number} snapThreshold - How close to snap position before snapping
     * @returns {Object|null} {snapX|snapY, distance, snapLine} or null
     */
    findEquiDistanceSnap(nearbyTasks, dragged, orientation, alignmentThreshold, snapThreshold) {
        if (nearbyTasks.length < 2) return null; // Need at least 2 other nodes

        const isHorizontal = orientation === 'horizontal';

        // Filter to aligned nodes and sort by position
        const aligned = nearbyTasks.filter(other => {
            if (isHorizontal) {
                // For horizontal: nodes with similar Y coordinate
                return Math.abs(other.centerY - dragged.centerY) < alignmentThreshold;
            } else {
                // For vertical: nodes with similar X coordinate
                return Math.abs(other.centerX - dragged.centerX) < alignmentThreshold;
            }
        }).sort((a, b) => {
            return isHorizontal ? (a.centerX - b.centerX) : (a.centerY - b.centerY);
        });

        if (aligned.length < 2) return null;

        // Check all consecutive pairs for equal spacing opportunities
        let bestSnap = null;
        let bestDistance = snapThreshold;

        for (let i = 0; i < aligned.length - 1; i++) {
            const nodeA = aligned[i];
            const nodeB = aligned[i + 1];

            const posA = isHorizontal ? nodeA.centerX : nodeA.centerY;
            const posB = isHorizontal ? nodeB.centerX : nodeB.centerY;
            const spacing = posB - posA;

            // Candidate positions where dragged node would create equal spacing
            const candidates = [
                { pos: posA - spacing, type: 'before' },  // C--A--B pattern
                { pos: posA + spacing / 2, type: 'between' }, // A--C--B pattern (if spacing allows)
                { pos: posB + spacing, type: 'after' }    // A--B--C pattern
            ];

            for (const candidate of candidates) {
                const draggedPos = isHorizontal ? dragged.centerX : dragged.centerY;
                const distance = Math.abs(candidate.pos - draggedPos);

                if (distance < bestDistance) {
                    bestDistance = distance;

                    // Calculate which nodes form the equi-distance group
                    let nodes;
                    if (candidate.type === 'before') {
                        nodes = [{ pos: candidate.pos }, { pos: posA }, { pos: posB }];
                    } else if (candidate.type === 'between') {
                        nodes = [{ pos: posA }, { pos: candidate.pos }, { pos: posB }];
                    } else {
                        nodes = [{ pos: posA }, { pos: posB }, { pos: candidate.pos }];
                    }

                    bestSnap = {
                        snapX: isHorizontal ? candidate.pos : dragged.centerX,
                        snapY: isHorizontal ? dragged.centerY : candidate.pos,
                        distance: distance,
                        snapLine: {
                            type: 'equidistance',
                            orientation: orientation,
                            nodes: nodes,
                            spacing: Math.abs(spacing),
                            alignmentPos: isHorizontal ? nodeA.centerY : nodeA.centerX
                        }
                    };
                }
            }
        }

        return bestSnap;
    }
};

console.log('[snapping.js] Alignment snapping loaded');

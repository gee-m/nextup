/**
 * @module utils/geometry
 * @order 9
 * @category Utils
 *
 * Geometry utilities for arrow snap points and edge calculations
 */

export const GeometryMixin = {
    /**
     * Constrain a point to the nearest edge of a rectangle
     * Returns which edge and the normalized position (0-1) along that edge
     *
     * @param {number} mouseX - Mouse X position in SVG coordinates
     * @param {number} mouseY - Mouse Y position in SVG coordinates
     * @param {number} rectX - Rectangle center X
     * @param {number} rectY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {{edge: string, normalized: number}} Edge and normalized position
     */
    constrainToRectEdge(mouseX, mouseY, rectX, rectY, rectWidth, rectHeight) {
        // DEFENSIVE: Check for invalid inputs
        if (!isFinite(mouseX) || !isFinite(mouseY) || !isFinite(rectX) || !isFinite(rectY) ||
            !isFinite(rectWidth) || !isFinite(rectHeight)) {
            console.warn('[constrainToRectEdge] Invalid inputs:', { mouseX, mouseY, rectX, rectY, rectWidth, rectHeight });
            return { edge: 'top', normalized: 0.5 };
        }

        // Rectangle bounds
        const left = rectX - rectWidth / 2;
        const right = rectX + rectWidth / 2;
        const top = rectY - rectHeight / 2;
        const bottom = rectY + rectHeight / 2;

        // Calculate distances to each edge
        const distToTop = Math.abs(mouseY - top);
        const distToBottom = Math.abs(mouseY - bottom);
        const distToLeft = Math.abs(mouseX - left);
        const distToRight = Math.abs(mouseX - right);

        // Find closest edge
        const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);

        let edge, normalized;

        if (minDist === distToTop) {
            edge = 'top';
            // Normalized position along top edge (0 = left, 1 = right)
            normalized = (mouseX - left) / rectWidth;
        } else if (minDist === distToBottom) {
            edge = 'bottom';
            // Normalized position along bottom edge (0 = left, 1 = right)
            normalized = (mouseX - left) / rectWidth;
        } else if (minDist === distToLeft) {
            edge = 'left';
            // Normalized position along left edge (0 = top, 1 = bottom)
            normalized = (mouseY - top) / rectHeight;
        } else {
            edge = 'right';
            // Normalized position along right edge (0 = top, 1 = bottom)
            normalized = (mouseY - top) / rectHeight;
        }

        // Clamp normalized to [0, 1]
        normalized = Math.max(0, Math.min(1, normalized));

        return { edge, normalized };
    },

    /**
     * Convert edge + normalized position back to absolute SVG coordinates
     *
     * @param {string} edge - 'top', 'right', 'bottom', or 'left'
     * @param {number} normalized - Position along edge (0-1)
     * @param {number} rectX - Rectangle center X
     * @param {number} rectY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {{x: number, y: number}} Absolute position
     */
    denormalizeEdgePosition(edge, normalized, rectX, rectY, rectWidth, rectHeight) {
        // DEFENSIVE: Check for invalid inputs
        if (!isFinite(normalized) || !isFinite(rectX) || !isFinite(rectY) ||
            !isFinite(rectWidth) || !isFinite(rectHeight)) {
            console.warn('[denormalizeEdgePosition] Invalid inputs:', { edge, normalized, rectX, rectY, rectWidth, rectHeight });
            return { x: rectX, y: rectY };
        }

        // Clamp normalized to [0, 1]
        normalized = Math.max(0, Math.min(1, normalized));

        const left = rectX - rectWidth / 2;
        const right = rectX + rectWidth / 2;
        const top = rectY - rectHeight / 2;
        const bottom = rectY + rectHeight / 2;

        let x, y;

        switch (edge) {
            case 'top':
                x = left + normalized * rectWidth;
                y = top;
                break;
            case 'bottom':
                x = left + normalized * rectWidth;
                y = bottom;
                break;
            case 'left':
                x = left;
                y = top + normalized * rectHeight;
                break;
            case 'right':
                x = right;
                y = top + normalized * rectHeight;
                break;
            default:
                console.warn('[denormalizeEdgePosition] Unknown edge:', edge);
                x = rectX;
                y = rectY;
        }

        return { x, y };
    },

    /**
     * Get all 8 snap positions for a rectangle (4 corners + 4 midpoints)
     *
     * @param {number} rectX - Rectangle center X
     * @param {number} rectY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {Array<{edge: string, normalized: number}>} Array of snap positions
     */
    getSnapPositions(rectX, rectY, rectWidth, rectHeight) {
        // DEFENSIVE: Guard against invalid inputs
        if (!isFinite(rectX) || !isFinite(rectY) || !isFinite(rectWidth) || !isFinite(rectHeight)) {
            console.warn('[getSnapPositions] Invalid inputs:', { rectX, rectY, rectWidth, rectHeight });
            return [];
        }

        return [
            // Top edge
            { edge: 'top', normalized: 0.0 },   // Top-left corner
            { edge: 'top', normalized: 0.5 },   // Top midpoint
            { edge: 'top', normalized: 1.0 },   // Top-right corner

            // Right edge
            { edge: 'right', normalized: 0.5 }, // Right midpoint

            // Bottom edge
            { edge: 'bottom', normalized: 1.0 }, // Bottom-right corner
            { edge: 'bottom', normalized: 0.5 }, // Bottom midpoint
            { edge: 'bottom', normalized: 0.0 }, // Bottom-left corner

            // Left edge
            { edge: 'left', normalized: 0.5 }   // Left midpoint
        ];
    },

    /**
     * Find nearest snap position within threshold
     *
     * @param {{edge: string, normalized: number}} currentPos - Current position
     * @param {Array<{edge: string, normalized: number}>} snapPositions - Available snap positions
     * @param {number} rectX - Rectangle center X
     * @param {number} rectY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @param {number} threshold - Snap threshold in pixels (default 3)
     * @returns {{edge: string, normalized: number}|null} Snap position or null
     */
    findNearestSnap(currentPos, snapPositions, rectX, rectY, rectWidth, rectHeight, threshold = 3) {
        // DEFENSIVE: Validate inputs
        if (!currentPos || !snapPositions || !Array.isArray(snapPositions)) {
            console.warn('[findNearestSnap] Invalid inputs:', { currentPos, snapPositions });
            return null;
        }

        // Convert current position to absolute coordinates
        const currentAbsolute = this.denormalizeEdgePosition(
            currentPos.edge, currentPos.normalized,
            rectX, rectY, rectWidth, rectHeight
        );

        let nearestSnap = null;
        let minDistance = Infinity;

        // Find snaps on the same edge only
        const sameEdgeSnaps = snapPositions.filter(snap => snap.edge === currentPos.edge);

        sameEdgeSnaps.forEach(snap => {
            const snapAbsolute = this.denormalizeEdgePosition(
                snap.edge, snap.normalized,
                rectX, rectY, rectWidth, rectHeight
            );

            const distance = Math.sqrt(
                Math.pow(snapAbsolute.x - currentAbsolute.x, 2) +
                Math.pow(snapAbsolute.y - currentAbsolute.y, 2)
            );

            if (distance <= threshold && distance < minDistance) {
                minDistance = distance;
                nearestSnap = snap;
            }
        });

        return nearestSnap;
    },

    /**
     * Check if a point is within radius of another point
     * PERF: Uses squared distance to avoid Math.sqrt()
     *
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @param {number} radius - Detection radius in pixels
     * @returns {boolean} True if within radius
     */
    isPointNearPosition(x1, y1, x2, y2, radius) {
        // DEFENSIVE: Check for NaN
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2) || !isFinite(radius)) {
            return false;
        }

        // PERF: Compare squared distances to avoid Math.sqrt()
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSquared = radius * radius;

        return distanceSquared <= radiusSquared;
    },

    /**
     * Calculate pixel distance between two edge positions
     * Used for snap threshold detection
     *
     * @param {{edge: string, normalized: number}} pos1 - First position
     * @param {{edge: string, normalized: number}} pos2 - Second position
     * @param {number} rectX - Rectangle center X
     * @param {number} rectY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {number} Distance in pixels
     */
    calculateEdgeDistance(pos1, pos2, rectX, rectY, rectWidth, rectHeight) {
        // DEFENSIVE: Validate inputs
        if (!pos1 || !pos2) {
            console.warn('[calculateEdgeDistance] Invalid positions:', { pos1, pos2 });
            return Infinity;
        }

        const abs1 = this.denormalizeEdgePosition(pos1.edge, pos1.normalized, rectX, rectY, rectWidth, rectHeight);
        const abs2 = this.denormalizeEdgePosition(pos2.edge, pos2.normalized, rectX, rectY, rectWidth, rectHeight);

        const dx = abs2.x - abs1.x;
        const dy = abs2.y - abs1.y;

        return Math.sqrt(dx * dx + dy * dy);
    }
};

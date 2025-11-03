/**
 * @module rendering/links
 * @order 23
 * @category rendering
 *
 * Link rendering - Lines, arrows, curved paths, temp drag lines
 */

export const LinksMixin = {
    /**
     * Create curved line with control point (quadratic bezier)
     *
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} cx - Control point X
     * @param {number} cy - Control point Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {string} className - CSS class
     * @returns {SVGPathElement} Curved path element
     */
    createCurvedLine(x1, y1, cx, cy, x2, y2, className) {
        // Defensive: Check for invalid coordinates
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(cx) || !isFinite(cy) || !isFinite(x2) || !isFinite(y2)) {
            console.warn(`createCurvedLine called with invalid coordinates`);
            // Return dummy path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M 0 0');
            path.setAttribute('class', className);
            path.setAttribute('fill', 'none');
            path.style.display = 'none';
            return path;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        // Quadratic bezier: M start Q control end
        const d = `M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`;

        path.setAttribute('d', d);
        path.setAttribute('class', className);
        path.setAttribute('fill', 'none');

        // Store coordinates for later reference
        path.setAttribute('data-x1', x1);
        path.setAttribute('data-y1', y1);
        path.setAttribute('data-cx', cx);
        path.setAttribute('data-cy', cy);
        path.setAttribute('data-x2', x2);
        path.setAttribute('data-y2', y2);

        return path;
    },

    /**
     * Create curved line through control points using Catmull-Rom spline
     * Simple, clean curve passing through all specified points
     *
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {Array<{x: number, y: number}>} controlPoints - Points ON the curve
     * @param {string} className - CSS class
     * @returns {SVGPathElement} Curved path element
     */
    createMultiSegmentCurvedLine(x1, y1, x2, y2, controlPoints, className) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', className);
        path.setAttribute('fill', 'none');

        // Defensive: Check for invalid coordinates
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
            console.warn(`createMultiSegmentCurvedLine: invalid coordinates`);
            path.setAttribute('d', 'M 0 0');
            path.style.display = 'none';
            return path;
        }

        // No control points - straight line
        if (!controlPoints || !Array.isArray(controlPoints) || controlPoints.length === 0) {
            path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
            return path;
        }

        // Build complete curve path: start -> control points -> end
        const points = [
            { x: x1, y: y1 },
            ...controlPoints,
            { x: x2, y: y2 }
        ];

        // Generate Catmull-Rom spline through all points
        let pathData = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            // Catmull-Rom to cubic bezier conversion
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;

            pathData += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
        }

        path.setAttribute('d', pathData);
        return path;
    },

    createLine(x1, y1, x2, y2, className) {
        // Defensive: Check for NaN or invalid coordinates
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
            console.warn(`createLine called with invalid coordinates: (${x1},${y1}) to (${x2},${y2})`);
            // Return a dummy line at origin to avoid breaking render
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', 0);
            line.setAttribute('y2', 0);
            line.setAttribute('class', className);
            line.style.display = 'none'; // Hide invalid lines
            return line;
        }

        // Dispatch to appropriate renderer based on arrow style
        if (this.arrowStyle === 'curved') {
            return this.createCurvedPath(x1, y1, x2, y2, className);
        } else {
            // Default: straight line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', className);
            return line;
        }
    },

    createCurvedPath(x1, y1, x2, y2, className) {
        // Defensive: Check for NaN or invalid coordinates
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
            console.warn(`createCurvedPath called with invalid coordinates: (${x1},${y1}) to (${x2},${y2})`);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M 0 0');
            path.setAttribute('class', className);
            path.setAttribute('fill', 'none');
            path.style.display = 'none';
            return path;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        // Calculate curve control points
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Curve intensity based on distance and user setting
        const curveAmount = distance * this.arrowCurvature;

        // Create perpendicular offset for smooth curve
        // Use perpendicular direction to curve sideways
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;

        // Control points offset perpendicular to the line
        const offsetX = Math.cos(perpAngle) * curveAmount;
        const offsetY = Math.sin(perpAngle) * curveAmount;

        // Midpoint for control
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        // Quadratic bezier curve through offset midpoint
        const d = `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY}, ${x2} ${y2}`;

        path.setAttribute('d', d);
        path.setAttribute('class', className);
        path.setAttribute('fill', 'none'); // Paths need fill=none to show stroke

        return path;
    },

    getLineEndAtRectEdge(x1, y1, x2, y2, rectWidth, rectHeight) {
        // Calculate line endpoint at rectangle edge for pixel-perfect arrows
        // Direction vector from point 1 to point 2
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            // Same point, no direction
            return { x: x2, y: y2 };
        }

        // Normalize to unit vector
        const ux = dx / distance;
        const uy = dy / distance;

        // Rectangle half-dimensions (rect is centered at x2, y2)
        const halfWidth = rectWidth / 2;
        const halfHeight = rectHeight / 2;

        // Find which edge the line hits first
        // Compare using cross-multiplication to avoid division
        const absUx = Math.abs(ux);
        const absUy = Math.abs(uy);

        let edgeDistance;
        if (absUx * halfHeight > absUy * halfWidth) {
            // Hit vertical edge (left/right) first
            // Guard against division by zero (perfectly vertical line)
            if (absUx === 0) {
                edgeDistance = 0;
            } else {
                edgeDistance = halfWidth / absUx;
            }
        } else {
            // Hit horizontal edge (top/bottom) first
            // Guard against division by zero (perfectly horizontal line)
            if (absUy === 0) {
                edgeDistance = 0;
            } else {
                edgeDistance = halfHeight / absUy;
            }
        }

        // Calculate endpoint at rectangle edge
        return {
            x: x2 - ux * edgeDistance,
            y: y2 - uy * edgeDistance
        };
    },

    createCursorArrow() {
        // Create SVG element for custom cursor
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('cursor-arrow');
        svg.setAttribute('width', '24px');
        svg.setAttribute('height', '24px');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.left = '0px';
        svg.style.top = '0px';
        svg.style.width = '24px';
        svg.style.height = '24px';

        // Create arrowhead path (pointing RIGHT by default, rotation will be applied)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M2,12 L22,12 M22,12 L15,5 M22,12 L15,19');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('fill', 'none');

        svg.appendChild(path);
        document.body.appendChild(svg);

        // Hide default cursor
        const container = document.getElementById('canvas-container');
        container.classList.add('dragging-relationship');

        return svg;
    },

    removeCursorArrow() {
        if (this.cursorArrow) {
            this.cursorArrow.remove();
            this.cursorArrow = null;
        }
        // Restore default cursor
        const container = document.getElementById('canvas-container');
        container.classList.remove('dragging-relationship');
    },

    updateCursorArrow(clientX, clientY, sourceTask) {
        if (!this.cursorArrow || !sourceTask) return;

        // Position the arrow at cursor (offset slightly so it doesn't block elementFromPoint)
        this.cursorArrow.style.left = `${clientX - 12}px`;
        this.cursorArrow.style.top = `${clientY - 12}px`;

        // Calculate rotation angle from source to cursor
        const pt = this.getSVGPoint({ clientX, clientY });
        const dx = pt.x - sourceTask.x;
        const dy = pt.y - sourceTask.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI); // Convert to degrees

        // Apply rotation (rotate around center of SVG)
        this.cursorArrow.style.transform = `rotate(${angle}deg)`;
        this.cursorArrow.style.transformOrigin = '12px 12px';
    },

    createTempLine(e) {
        const task = this.tasks.find(t => t.id === this.selectedNode);
        const svg = document.getElementById('canvas');
        this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.tempLine.classList.add('temp-line');

        // Style based on drag mode
        if (this.dragMode === 'reparent') {
            // Solid green line for reparenting
            this.tempLine.style.strokeDasharray = 'none';
            this.tempLine.style.stroke = '#28a745';
            // No arrowhead - cursor arrow already shows direction
        } else {
            // Dashed blue line for dependency
            this.tempLine.style.strokeDasharray = '5,5';
            this.tempLine.style.stroke = '#007bff';
            // No arrowhead - cursor arrow already shows direction
        }

        this.tempLine.setAttribute('x1', task.x);
        this.tempLine.setAttribute('y1', task.y);
        this.tempLine.setAttribute('x2', task.x);
        this.tempLine.setAttribute('y2', task.y);
        svg.appendChild(this.tempLine);
    },

    removeTempLine() {
        if (this.tempLine) {
            this.tempLine.remove();
            this.tempLine = null;
        }
    },

    markOrigin() {
        // Create or update "Origin Home" to current view
        const originHome = this.homes.find(h => h.name === "Origin Home");

        if (originHome) {
            // Update existing Origin Home
            this.updateHome(originHome.id);
        } else {
            // Create new Origin Home
            this.createHome("Origin Home");
        }
    },

    /**
     * Render arrow dot (for dragging arrow endpoints)
     *
     * @param {number} x - Dot center X
     * @param {number} y - Dot center Y
     * @param {string} dotType - 'source' or 'target'
     * @param {number} taskId - Task ID
     * @param {number} relatedTaskId - Parent or child ID
     * @param {boolean} isHovered - Is mouse hovering over this dot?
     * @param {boolean} isDragging - Is this dot being dragged?
     * @param {boolean} hasCustomPosition - True if arrow has custom position (blue), false if default (green)
     * @returns {SVGCircleElement} The dot element
     */
    renderArrowDot(x, y, dotType, taskId, relatedTaskId, isHovered, isDragging, hasCustomPosition) {
        // DEFENSIVE: Validate coordinates
        if (!isFinite(x) || !isFinite(y)) {
            console.warn('[renderArrowDot] Invalid coordinates:', { x, y });
            return null;
        }

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

        // Determine size based on state
        let size = this.arrowDotSize || 10;
        if (isDragging) {
            size = this.arrowDotDragSize || 14;
        } else if (isHovered) {
            size = this.arrowDotHoverSize || 12;
        }

        // Color: Green if at default position, Blue if customized
        const fillColor = hasCustomPosition ? '#2196f3' : '#4caf50';  // Blue = custom, Green = default

        // Position and styling
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', size);
        dot.setAttribute('fill', fillColor);
        dot.setAttribute('stroke', 'white');
        dot.setAttribute('stroke-width', '2');
        dot.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');
        dot.classList.add('arrow-dot');
        dot.setAttribute('data-dot-type', dotType);
        dot.setAttribute('data-task-id', taskId);
        dot.setAttribute('data-related-id', relatedTaskId);

        // Higher z-index
        dot.style.pointerEvents = 'all';
        dot.style.cursor = isDragging ? 'grabbing' : 'grab';

        return dot;
    },

    /**
     * Render snap indicators (8 positions: 4 corners + 4 midpoints)
     *
     * @param {number} rectX - Rectangle center X
     * @param {number} rectY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @param {string} currentEdge - Current edge ('top', 'right', 'bottom', 'left')
     * @param {number} currentNormalized - Current normalized position (0-1)
     * @returns {Array<SVGCircleElement>} Array of snap indicator elements
     */
    renderSnapIndicators(rectX, rectY, rectWidth, rectHeight, currentEdge, currentNormalized) {
        // DEFENSIVE: Validate inputs
        if (!isFinite(rectX) || !isFinite(rectY) || !isFinite(rectWidth) || !isFinite(rectHeight)) {
            console.warn('[renderSnapIndicators] Invalid inputs:', { rectX, rectY, rectWidth, rectHeight });
            return [];
        }

        const indicators = [];
        const snapPositions = this.getSnapPositions(rectX, rectY, rectWidth, rectHeight);
        const threshold = this.arrowSnapThreshold || 3;

        snapPositions.forEach(snap => {
            const pos = this.denormalizeEdgePosition(snap.edge, snap.normalized, rectX, rectY, rectWidth, rectHeight);

            const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            indicator.setAttribute('cx', pos.x);
            indicator.setAttribute('cy', pos.y);
            indicator.setAttribute('r', 6);

            // Check if this is the snap position we're near
            const isNearSnap = snap.edge === currentEdge &&
                Math.abs(snap.normalized - currentNormalized) * (snap.edge === 'top' || snap.edge === 'bottom' ? rectWidth : rectHeight) < threshold;

            if (isNearSnap) {
                indicator.setAttribute('fill', '#4caf50');  // Green
                indicator.setAttribute('stroke', '#2e7d32');
            } else {
                indicator.setAttribute('fill', '#9e9e9e');  // Gray
                indicator.setAttribute('stroke', '#757575');
            }

            indicator.setAttribute('stroke-width', '1');
            indicator.classList.add('snap-indicator');
            indicator.style.pointerEvents = 'none';

            indicators.push(indicator);
        });

        return indicators;
    }
};

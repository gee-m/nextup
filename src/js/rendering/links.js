/**
 * @module rendering/links
 * @order 23
 * @category rendering
 *
 * Link rendering - Lines, arrows, curved paths, temp drag lines
 */

export const LinksMixin = {
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
    }
};

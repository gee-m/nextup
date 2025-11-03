/**
 * @module interactions/curve-control-v2
 * @order 29
 * @category interactions
 *
 * Miro-style bezier curve control for links
 * Simple, professional multi-point curve editing
 */

export const CurveControlMixin = {
    /**
     * Setup curve control listeners
     */
    setupCurveControlListeners() {
        console.log('✓ Curve control v2 listeners setup');
    },

    /**
     * Check if mouse is near any curve and update hover state
     * Shows control point dots when hovering over curved lines
     */
    updateCurveDotHover(mouseX, mouseY) {
        // Skip if editing or dragging
        if (this.editingTaskId !== null || this.dragMode !== null || this.arrowDotDrag.active) {
            this.hoveredCurveDot = null;
            return;
        }

        if (!isFinite(mouseX) || !isFinite(mouseY)) {
            return;
        }

        // Find nearby curve
        const result = this.findCurveNearMouse(mouseX, mouseY);

        if (result !== this.hoveredCurveDot) {
            this.hoveredCurveDot = result;
            // Always render when hover state changes (to show OR hide dots)
            this.render();
        }
    },

    /**
     * Find curve near mouse and determine interaction type
     * Returns: { taskId, parentId, controlPoints: [...], nearestPointIndex, addNewPoint, mouseX, mouseY }
     */
    findCurveNearMouse(mouseX, mouseY) {
        const hoverRadius = 30;
        const controlPointSnapRadius = 15;

        // Check all parent links
        for (const task of this.tasks) {
            if (task.hidden) continue;

            // Check main parent
            if (task.mainParent !== null) {
                const parent = this.tasks.find(t => t.id === task.mainParent);
                if (!parent || parent.hidden) continue;

                const result = this.checkCurveProximity(
                    mouseX, mouseY,
                    parent, task, task.mainParent,
                    hoverRadius, controlPointSnapRadius
                );
                if (result) return result;
            }

            // Check other parents
            for (const parentId of task.otherParents || []) {
                const parent = this.tasks.find(t => t.id === parentId);
                if (!parent || parent.hidden) continue;

                const result = this.checkCurveProximity(
                    mouseX, mouseY,
                    parent, task, parentId,
                    hoverRadius, controlPointSnapRadius
                );
                if (result) return result;
            }
        }

        return null;
    },

    /**
     * Check if mouse is near a specific link's curve
     */
    checkCurveProximity(mouseX, mouseY, parent, task, parentId, hoverRadius, snapRadius) {
        const arrowEnd = this.getArrowEndpoint(parent, task, 'target');

        // Get control points for this link
        const controlPoints = this.getCurvePoints(task.id, parentId);

        // Build complete curve path (start -> control points -> end)
        const curvePath = [
            { x: parent.x, y: parent.y },
            ...controlPoints,
            { x: arrowEnd.x, y: arrowEnd.y }
        ];

        // Check if near existing control point first (priority)
        for (let i = 0; i < controlPoints.length; i++) {
            const cp = controlPoints[i];
            const dist = Math.sqrt((mouseX - cp.x) ** 2 + (mouseY - cp.y) ** 2);
            if (dist < snapRadius) {
                return {
                    taskId: task.id,
                    parentId: parentId,
                    controlPoints: controlPoints,
                    nearestPointIndex: i,
                    addNewPoint: false,
                    mouseX: mouseX,
                    mouseY: mouseY
                };
            }
        }

        // Check if near the curve itself
        if (this.isNearCurvePath(mouseX, mouseY, curvePath, hoverRadius)) {
            // Find closest point on curve to add new control point
            const closest = this.findClosestPointOnCurvePath(mouseX, mouseY, curvePath);

            // Don't show curve control point if near arrow endpoints
            // (those areas are for arrow snap dots, not curve control)
            const distToStart = Math.sqrt((mouseX - parent.x) ** 2 + (mouseY - parent.y) ** 2);
            const distToEnd = Math.sqrt((mouseX - arrowEnd.x) ** 2 + (mouseY - arrowEnd.y) ** 2);
            const endpointExclusionRadius = 30; // Same as hoverRadius

            if (distToStart < endpointExclusionRadius || distToEnd < endpointExclusionRadius) {
                // Too close to endpoints - don't show curve control dot
                return null;
            }

            // Calculate insertion index:
            // curvePath = [parent, ...controlPoints, child]
            // segmentIndex 0 = parent->first control point (insert at index 0)
            // segmentIndex 1 = first->second control point (insert at index 1)
            // etc.
            const insertIndex = closest.segmentIndex;

            return {
                taskId: task.id,
                parentId: parentId,
                controlPoints: controlPoints,
                nearestPointIndex: null,
                addNewPoint: true,
                insertIndex: insertIndex,  // NEW: where to insert in controlPoints array
                mouseX: closest.x,
                mouseY: closest.y
            };
        }

        return null;
    },

    /**
     * Get control points for a link
     * Returns array of {x, y} points ON the curve
     */
    getCurvePoints(taskId, parentId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.curveControlPoints) return [];

        const points = task.curveControlPoints[parentId];
        if (!points || !Array.isArray(points)) return [];

        // Return just x, y coordinates
        return points.map(p => ({ x: p.x, y: p.y }));
    },

    /**
     * Check if mouse is near curve path
     * Samples along Catmull-Rom spline
     */
    isNearCurvePath(mouseX, mouseY, points, radius) {
        if (points.length < 2) return false;

        const radiusSquared = radius * radius;
        const samples = 50;

        // Sample along curve
        for (let i = 0; i < points.length - 1; i++) {
            for (let s = 0; s <= samples; s++) {
                const t = s / samples;
                const p = this.sampleCatmullRom(points, i, t);

                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                if (dx * dx + dy * dy < radiusSquared) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Find closest point on curve path to mouse
     * Returns { x, y, segmentIndex } where segmentIndex indicates which segment (0 to points.length-2)
     */
    findClosestPointOnCurvePath(mouseX, mouseY, points) {
        if (points.length < 2) return { x: mouseX, y: mouseY, segmentIndex: 0 };

        let closest = null;
        let minDist = Infinity;
        let closestSegment = 0;
        const samples = 50;

        for (let i = 0; i < points.length - 1; i++) {
            for (let s = 0; s <= samples; s++) {
                const t = s / samples;
                const p = this.sampleCatmullRom(points, i, t);

                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = dx * dx + dy * dy;

                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                    closestSegment = i;
                }
            }
        }

        return { ...closest, segmentIndex: closestSegment };
    },

    /**
     * Sample point on Catmull-Rom curve at segment i, parameter t
     */
    sampleCatmullRom(points, segmentIndex, t) {
        const p0 = points[Math.max(0, segmentIndex - 1)];
        const p1 = points[segmentIndex];
        const p2 = points[segmentIndex + 1];
        const p3 = points[Math.min(points.length - 1, segmentIndex + 2)];

        // Catmull-Rom to Bezier conversion
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;

        // Cubic bezier evaluation
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;

        return {
            x: mt3 * p1.x + 3 * mt2 * t * c1x + 3 * mt * t2 * c2x + t3 * p2.x,
            y: mt3 * p1.y + 3 * mt2 * t * c1y + 3 * mt * t2 * c2y + t3 * p2.y
        };
    },

    /**
     * Start dragging a curve control point
     */
    startCurveDotDrag(hoverInfo) {
        if (!hoverInfo) return;

        this.saveSnapshot('Adjust curve');

        this.curveDotDrag = {
            active: true,
            taskId: hoverInfo.taskId,
            parentId: hoverInfo.parentId,
            controlPoints: [...hoverInfo.controlPoints], // Copy array
            editingIndex: hoverInfo.nearestPointIndex,
            isNewPoint: hoverInfo.addNewPoint,
            initialX: hoverInfo.mouseX,
            initialY: hoverInfo.mouseY
        };

        // If adding new point, insert it at the correct position
        if (hoverInfo.addNewPoint) {
            const newPoint = {
                x: hoverInfo.mouseX,
                y: hoverInfo.mouseY
            };

            // Insert at the correct position along the curve
            const insertIdx = hoverInfo.insertIndex || 0;
            this.curveDotDrag.controlPoints.splice(insertIdx, 0, newPoint);
            this.curveDotDrag.editingIndex = insertIdx;
        }

        const canvasContainer = document.getElementById('canvas-container');
        canvasContainer.style.cursor = 'grabbing';
    },

    /**
     * Update curve control point during drag
     */
    updateCurveDotDrag(mouseX, mouseY) {
        if (!this.curveDotDrag.active) return;
        if (!isFinite(mouseX) || !isFinite(mouseY)) return;

        const idx = this.curveDotDrag.editingIndex;
        if (idx !== null && idx >= 0 && idx < this.curveDotDrag.controlPoints.length) {
            this.curveDotDrag.controlPoints[idx] = { x: mouseX, y: mouseY };
        }

        this.render();
    },

    /**
     * Finish curve drag and save
     */
    finishCurveDotDrag() {
        if (!this.curveDotDrag.active) return;

        const task = this.tasks.find(t => t.id === this.curveDotDrag.taskId);
        if (!task) {
            this.cancelCurveDotDrag();
            return;
        }

        // Initialize if needed
        if (!task.curveControlPoints) {
            task.curveControlPoints = {};
        }

        // Check if moved significantly (otherwise remove point)
        const idx = this.curveDotDrag.editingIndex;
        const pt = this.curveDotDrag.controlPoints[idx];
        const dist = Math.sqrt(
            (pt.x - this.curveDotDrag.initialX) ** 2 +
            (pt.y - this.curveDotDrag.initialY) ** 2
        );

        if (this.curveDotDrag.isNewPoint && dist < 5) {
            // New point not moved - cancel
            this.cancelCurveDotDrag();
            return;
        }

        // Save control points
        if (this.curveDotDrag.controlPoints.length === 0) {
            // Remove all control points
            delete task.curveControlPoints[this.curveDotDrag.parentId];
        } else {
            task.curveControlPoints[this.curveDotDrag.parentId] = this.curveDotDrag.controlPoints;
        }

        // Clear state
        this.curveDotDrag = {
            active: false,
            taskId: null,
            parentId: null,
            controlPoints: [],
            editingIndex: null,
            isNewPoint: false,
            initialX: 0,
            initialY: 0,
            lastClickTime: 0,
            lastClickedDotId: null
        };

        const canvasContainer = document.getElementById('canvas-container');
        canvasContainer.style.cursor = 'default';

        this.saveToStorage();
        this.render();

        this.showToast('Curve adjusted', 'success', 2000);
    },

    /**
     * Cancel curve drag
     */
    cancelCurveDotDrag() {
        this.curveDotDrag = {
            active: false,
            taskId: null,
            parentId: null,
            controlPoints: [],
            editingIndex: null,
            isNewPoint: false,
            initialX: 0,
            initialY: 0,
            lastClickTime: 0,
            lastClickedDotId: null
        };

        const canvasContainer = document.getElementById('canvas-container');
        canvasContainer.style.cursor = 'default';

        this.render();
    },

    /**
     * Remove a specific control point from a curve
     * Called on double-click of curve control dot
     *
     * @param {object} linkInfo - {linkType, taskId, relatedTaskId, pointIndex}
     */
    removeControlPoint(linkInfo) {
        if (!linkInfo || !linkInfo.taskId || !linkInfo.relatedTaskId) return;

        const task = this.tasks.find(t => t.id === linkInfo.taskId);
        if (!task || !task.curveControlPoints || !task.curveControlPoints[linkInfo.relatedTaskId]) {
            return;
        }

        const controlPoints = task.curveControlPoints[linkInfo.relatedTaskId];
        const pointIndex = linkInfo.pointIndex;

        // Check if this is a valid existing point (not a preview point)
        if (pointIndex < 0 || pointIndex >= controlPoints.length) {
            return;
        }

        this.saveSnapshot('Remove curve control point');

        // Remove the specific control point
        controlPoints.splice(pointIndex, 1);

        // If no control points left, remove the curve entirely (becomes straight line)
        if (controlPoints.length === 0) {
            delete task.curveControlPoints[linkInfo.relatedTaskId];

            // Clean up empty object
            if (Object.keys(task.curveControlPoints).length === 0) {
                delete task.curveControlPoints;
            }
        }

        this.saveToStorage();
        this.render();

        const message = controlPoints.length === 0 ?
            'Curve reset to straight line' :
            'Control point removed';
        this.showToast(message, 'success', 2000);
    }
};

console.log('[curve-control-v2.js] Miro-style curve control loaded');

/**
 * @module interactions/arrow-snap
 * @order 28
 * @category interactions
 *
 * Arrow snap point interactions - drag dots to customize arrow attachment points
 * Currently implements TARGET END only (arrowhead). Source end logic reusable for future.
 */

export const ArrowSnapMixin = {
    /**
     * Setup mouse listeners for arrow dot interactions
     * Called during app initialization
     */
    setupArrowSnapListeners() {
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            console.warn('[arrow-snap] Canvas not found, skipping setup');
            return;
        }

        // Mousemove for hover detection (delegated to render loop)
        // Mousedown/up for drag handled by existing onCanvasMouseDown/Up

        console.log('✓ Arrow snap listeners setup');
    },

    /**
     * Check if mouse is near any arrow endpoint and update hover state
     * Called from render() every frame
     *
     * @param {number} mouseX - Mouse X in SVG coordinates
     * @param {number} mouseY - Mouse Y in SVG coordinates
     */
    updateArrowDotHover(mouseX, mouseY) {
        // DEFENSIVE: Skip if editing or dragging
        if (this.editingTaskId !== null || this.dragMode !== null) {
            this.hoveredArrowDot = null;
            return;
        }

        // DEFENSIVE: Validate inputs
        if (!isFinite(mouseX) || !isFinite(mouseY)) {
            return;
        }

        // PERF: If already hovering a dot, check if cursor moved too far away
        // Use squared distance to avoid Math.sqrt()
        if (this.hoveredArrowDot) {
            const dx = mouseX - this.hoveredArrowDot.x;
            const dy = mouseY - this.hoveredArrowDot.y;
            const distanceSquared = dx * dx + dy * dy;
            const hideRadiusSquared = this.arrowDotHideRadius * this.arrowDotHideRadius;

            if (distanceSquared > hideRadiusSquared) {
                // Cursor moved too far - hide the dot
                this.hoveredArrowDot = null;

                // Update cursor
                const canvasContainer = document.getElementById('canvas-container');
                canvasContainer.style.cursor = 'default';

                // Trigger re-render to hide dot
                this.render();
                return;
            }
            // Still within hide radius - keep showing the dot
            return;
        }

        // Not currently hovering - check all visible arrows for proximity
        const hoveredDot = this.findArrowDotNearMouse(mouseX, mouseY);

        this.hoveredArrowDot = hoveredDot;

        // Update cursor style
        const canvasContainer = document.getElementById('canvas-container');
        if (hoveredDot && !this.arrowDotDrag.active) {
            canvasContainer.style.cursor = 'pointer';
        } else if (!this.arrowDotDrag.active && this.dragMode === null) {
            canvasContainer.style.cursor = 'default';
        }

        // IMPORTANT: Trigger re-render when hover state changes
        if (hoveredDot) {
            this.render();
        }
    },

    /**
     * Find arrow dot near mouse position
     * If multiple dots overlap, prioritizes the most recently moved (highest timestamp)
     *
     * @param {number} mouseX - Mouse X in SVG coordinates
     * @param {number} mouseY - Mouse Y in SVG coordinates
     * @returns {{type: string, taskId: number, parentId: number, childId: number, x: number, y: number}|null}
     */
    findArrowDotNearMouse(mouseX, mouseY) {
        // DEFENSIVE: Validate radius
        const radius = this.arrowDotRadius || 5;

        // PERF: Only check tasks near mouse cursor (rough viewport culling)
        // This avoids checking 100+ tasks when mouse is far away
        const QUICK_CHECK_MARGIN = 500;

        // Collect ALL dots near mouse, then prioritize by timestamp
        const nearbyDots = [];

        // Check all arrows (main parent + other parents)
        for (const task of this.tasks) {
            if (task.hidden) continue;

            // PERF: Quick distance check before expensive endpoint calculation
            const dx = task.x - mouseX;
            const dy = task.y - mouseY;
            if (Math.abs(dx) > QUICK_CHECK_MARGIN || Math.abs(dy) > QUICK_CHECK_MARGIN) {
                continue; // Too far away, skip
            }

            // Check main parent arrow (TARGET end - arrowhead on child)
            if (task.mainParent !== null) {
                const parent = this.tasks.find(t => t.id === task.mainParent);
                if (parent && !parent.hidden) {
                    const endPos = this.getArrowEndpoint(parent, task, 'target');

                    if (this.isPointNearPosition(mouseX, mouseY, endPos.x, endPos.y, radius)) {
                        const customPoint = task.customAttachPoints?.[task.mainParent];
                        nearbyDots.push({
                            type: 'target',
                            taskId: task.id,
                            parentId: task.mainParent,
                            x: endPos.x,
                            y: endPos.y,
                            timestamp: customPoint?.timestamp || 0
                        });
                    }
                }
            }

            // Check other parents (TARGET end - arrowhead on child)
            for (const parentId of task.otherParents || []) {
                const parent = this.tasks.find(t => t.id === parentId);
                if (parent && !parent.hidden) {
                    const endPos = this.getArrowEndpoint(parent, task, 'target');
                    if (this.isPointNearPosition(mouseX, mouseY, endPos.x, endPos.y, radius)) {
                        const customPoint = task.customAttachPoints?.[parentId];
                        nearbyDots.push({
                            type: 'target',
                            taskId: task.id,
                            parentId: parentId,
                            x: endPos.x,
                            y: endPos.y,
                            timestamp: customPoint?.timestamp || 0
                        });
                    }
                }
            }

            // Check main parent arrow (SOURCE end - where arrow starts from parent)
            if (task.mainParent !== null) {
                const parent = this.tasks.find(t => t.id === task.mainParent);
                if (parent && !parent.hidden) {
                    const startPos = this.getArrowEndpoint(parent, task, 'source');

                    if (this.isPointNearPosition(mouseX, mouseY, startPos.x, startPos.y, radius)) {
                        const customPoint = parent.customSourcePoints?.[task.id];
                        nearbyDots.push({
                            type: 'source',
                            taskId: parent.id,  // Source dot belongs to parent node
                            childId: task.id,   // Related to this child
                            x: startPos.x,
                            y: startPos.y,
                            timestamp: customPoint?.timestamp || 0
                        });
                    }
                }
            }

            // Check other parents (SOURCE end - where arrow starts from parent)
            for (const parentId of task.otherParents || []) {
                const parent = this.tasks.find(t => t.id === parentId);
                if (parent && !parent.hidden) {
                    const startPos = this.getArrowEndpoint(parent, task, 'source');
                    if (this.isPointNearPosition(mouseX, mouseY, startPos.x, startPos.y, radius)) {
                        const customPoint = parent.customSourcePoints?.[task.id];
                        nearbyDots.push({
                            type: 'source',
                            taskId: parent.id,  // Source dot belongs to parent node
                            childId: task.id,   // Related to this child
                            x: startPos.x,
                            y: startPos.y,
                            timestamp: customPoint?.timestamp || 0
                        });
                    }
                }
            }
        }

        // If no dots found, return null
        if (nearbyDots.length === 0) return null;

        // If multiple dots overlap, return the one with highest timestamp (most recently moved)
        nearbyDots.sort((a, b) => b.timestamp - a.timestamp);

        // Remove timestamp before returning (not needed in result)
        const result = nearbyDots[0];
        delete result.timestamp;
        return result;
    },

    /**
     * Determine which edge a point is on
     * @param {number} pointX - Point X
     * @param {number} pointY - Point Y
     * @param {number} centerX - Rectangle center X
     * @param {number} centerY - Rectangle center Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {string} 'top', 'bottom', 'left', or 'right'
     */
    getEdgeFromPoint(pointX, pointY, centerX, centerY, rectWidth, rectHeight) {
        const halfWidth = rectWidth / 2;
        const halfHeight = rectHeight / 2;

        const dx = pointX - centerX;
        const dy = pointY - centerY;

        // Use same quadrant logic as getOppositeEdgeCenter
        if (Math.abs(dy) * halfWidth < Math.abs(dx) * halfHeight) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'bottom' : 'top';
        }
    },

    /**
     * Calculate orthogonal routing path with 90-degree turns
     * @param {number} startX - Start point X (arrow start on edge)
     * @param {number} startY - Start point Y (arrow start on edge)
     * @param {string} startEdge - Start edge: 'top', 'bottom', 'left', 'right'
     * @param {number} endX - End point X (arrow end on edge)
     * @param {number} endY - End point Y (arrow end on edge)
     * @param {string} endEdge - End edge: 'top', 'bottom', 'left', 'right'
     * @param {number} startNodeX - Start node center X (for alignment detection)
     * @param {number} startNodeY - Start node center Y (for alignment detection)
     * @param {number} endNodeX - End node center X (for alignment detection)
     * @param {number} endNodeY - End node center Y (for alignment detection)
     * @returns {Array<{x: number, y: number}>} Array of waypoints
     */
    calculateOrthogonalPath(startX, startY, startEdge, endX, endY, endEdge, startNodeX, startNodeY, endNodeX, endNodeY) {
        const waypoints = [];

        // Always start at source
        waypoints.push({ x: startX, y: startY });

        const dx = endX - startX;
        const dy = endY - startY;
        const alignmentThreshold = 5; // Consider aligned if within 5px

        // Check if NODES are aligned (not arrow endpoints!)
        const nodesVerticallyAligned = startNodeX !== undefined && endNodeX !== undefined &&
                                       Math.abs(startNodeX - endNodeX) < alignmentThreshold;
        const nodesHorizontallyAligned = startNodeY !== undefined && endNodeY !== undefined &&
                                         Math.abs(startNodeY - endNodeY) < alignmentThreshold;

        // Calculate based on edge directions
        if (startEdge === 'right' || startEdge === 'left') {
            // Horizontal exit

            // If nodes are horizontally aligned (same Y), just draw a straight line!
            if (nodesHorizontallyAligned) {
                // Straight horizontal arrow - no turns needed
                // (waypoints already has start, will add end below)
            } else if (nodesVerticallyAligned) {
                // Nodes vertically aligned - need to route around
                const direction = startEdge === 'right' ? 1 : -1;
                const offset = 60 * direction;
                waypoints.push({ x: startX + offset, y: startY });
                waypoints.push({ x: startX + offset, y: endY });
            } else {
                // Normal case: 2 turns at midpoint
                const midX = startX + dx / 2;
                waypoints.push({ x: midX, y: startY });
                waypoints.push({ x: midX, y: endY });
            }

        } else {
            // Vertical exit (top or bottom)

            // If nodes are vertically aligned (same X), just draw a straight line!
            if (nodesVerticallyAligned) {
                // Straight vertical arrow - no turns needed
                // (waypoints already has start, will add end below)
            } else if (nodesHorizontallyAligned) {
                // Nodes horizontally aligned - need to route around
                const direction = startEdge === 'bottom' ? 1 : -1;
                const offset = 60 * direction;
                waypoints.push({ x: startX, y: startY + offset });
                waypoints.push({ x: endX, y: startY + offset });
            } else {
                // Normal case: 2 turns at midpoint
                const midY = startY + dy / 2;
                waypoints.push({ x: startX, y: midY });
                waypoints.push({ x: endX, y: midY });
            }
        }

        // Always end at target
        waypoints.push({ x: endX, y: endY });

        return waypoints;
    },

    /**
     * Get edge center based on direction from target to source
     * Uses simple dominant-axis approach: whichever direction (horizontal/vertical)
     * has greater distance determines which edge to use
     *
     * @param {number} sourceX - Source X position
     * @param {number} sourceY - Source Y position
     * @param {number} targetX - Target center X
     * @param {number} targetY - Target center Y
     * @param {number} rectWidth - Target rectangle width
     * @param {number} rectHeight - Target rectangle height
     * @returns {{x: number, y: number}} Center point of appropriate edge
     */
    getOppositeEdgeCenter(sourceX, sourceY, targetX, targetY, rectWidth, rectHeight) {
        const halfWidth = rectWidth / 2;
        const halfHeight = rectHeight / 2;

        // Calculate direction from target to source
        const dx = sourceX - targetX;
        const dy = sourceY - targetY;

        // Pick edge based on dominant axis
        // Use absolute values to determine which direction is stronger
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal direction dominates
            if (dx > 0) {
                // Source is to the right
                return { x: targetX + halfWidth, y: targetY };
            } else {
                // Source is to the left
                return { x: targetX - halfWidth, y: targetY };
            }
        } else {
            // Vertical direction dominates
            if (dy > 0) {
                // Source is below
                return { x: targetX, y: targetY + halfHeight };
            } else {
                // Source is above
                return { x: targetX, y: targetY - halfHeight };
            }
        }
    },

    /**
     * Get arrow endpoint position (uses custom attach point if exists)
     * This is the key function that checks for customization
     *
     * @param {object} sourceTask - Source task (parent)
     * @param {object} targetTask - Target task (child)
     * @param {string} type - 'source' or 'target'
     * @returns {{x: number, y: number}} Endpoint position
     */
    getArrowEndpoint(sourceTask, targetTask, type) {
        // DEFENSIVE: Validate inputs
        if (!sourceTask || !targetTask) {
            console.warn('[getArrowEndpoint] Missing task:', { sourceTask, targetTask });
            return { x: 0, y: 0 };
        }

        if (type === 'target') {
            const targetDims = this.calculateTaskDimensions(targetTask);

            // Check for custom attach point on target task
            const customPoint = targetTask.customAttachPoints?.[sourceTask.id];

            if (customPoint) {
                // Use custom position
                return this.denormalizeEdgePosition(
                    customPoint.edge,
                    customPoint.normalized,
                    targetTask.x,
                    targetTask.y,
                    targetDims.width,
                    targetDims.height
                );
            } else {
                // Use default calculation based on setting
                if (this.arrowOppositeEdge) {
                    // New behavior: land on edge center facing source
                    return this.getOppositeEdgeCenter(
                        sourceTask.x, sourceTask.y,
                        targetTask.x, targetTask.y,
                        targetDims.width, targetDims.height
                    );
                } else {
                    // Original behavior: land on nearest edge
                    return this.getLineEndAtRectEdge(
                        sourceTask.x, sourceTask.y,
                        targetTask.x, targetTask.y,
                        targetDims.width, targetDims.height
                    );
                }
            }
        } else {
            // Source end
            const sourceDims = this.calculateTaskDimensions(sourceTask);

            // Check for custom source point
            const customPoint = sourceTask.customSourcePoints?.[targetTask.id];

            if (customPoint) {
                // Use custom position
                return this.denormalizeEdgePosition(
                    customPoint.edge,
                    customPoint.normalized,
                    sourceTask.x,
                    sourceTask.y,
                    sourceDims.width,
                    sourceDims.height
                );
            } else {
                // Use default calculation based on setting
                if (this.arrowOppositeEdge) {
                    // New behavior: start from edge center facing target
                    return this.getOppositeEdgeCenter(
                        targetTask.x, targetTask.y,
                        sourceTask.x, sourceTask.y,
                        sourceDims.width, sourceDims.height
                    );
                } else {
                    // Original behavior: start from center of source
                    return { x: sourceTask.x, y: sourceTask.y };
                }
            }
        }
    },

    /**
     * Start dragging arrow dot
     * Called from onCanvasMouseDown when clicking on hoveredArrowDot
     *
     * @param {object} dotInfo - Dot information {type, taskId, parentId, childId}
     */
    startArrowDotDrag(dotInfo) {
        if (!dotInfo) return;

        // Save snapshot for undo
        this.saveSnapshot(`Adjust arrow position`);

        // Get current task
        const task = this.tasks.find(t => t.id === dotInfo.taskId);
        if (!task) return;

        // PERF: Cache task dimensions for entire drag session
        const cachedDims = this.calculateTaskDimensions(task);

        // PERF: Pre-calculate snap positions (only once at drag start)
        const cachedSnapPositions = this.getSnapPositions(task.x, task.y, cachedDims.width, cachedDims.height);

        // Get current position (custom or default)
        let currentEdge, currentNormalized;

        if (dotInfo.type === 'target') {
            // Target dot: dragging arrowhead on child node
            const customPoint = task.customAttachPoints?.[dotInfo.parentId];
            if (customPoint) {
                currentEdge = customPoint.edge;
                currentNormalized = customPoint.normalized;
            } else {
                // Calculate current default position
                const parent = this.tasks.find(t => t.id === dotInfo.parentId);
                if (!parent) return;

                const endPos = this.getLineEndAtRectEdge(
                    parent.x, parent.y,
                    task.x, task.y,
                    cachedDims.width, cachedDims.height
                );

                // Convert to edge + normalized
                const constrained = this.constrainToRectEdge(
                    endPos.x, endPos.y,
                    task.x, task.y,
                    cachedDims.width, cachedDims.height
                );
                currentEdge = constrained.edge;
                currentNormalized = constrained.normalized;
            }
        } else if (dotInfo.type === 'source') {
            // Source dot: dragging arrow start on parent node
            const customPoint = task.customSourcePoints?.[dotInfo.childId];
            if (customPoint) {
                currentEdge = customPoint.edge;
                currentNormalized = customPoint.normalized;
            } else {
                // Calculate current default position
                const child = this.tasks.find(t => t.id === dotInfo.childId);
                if (!child) return;

                const startPos = this.getOppositeEdgeCenter(
                    child.x, child.y,
                    task.x, task.y,
                    cachedDims.width, cachedDims.height
                );

                // Convert to edge + normalized
                const constrained = this.constrainToRectEdge(
                    startPos.x, startPos.y,
                    task.x, task.y,
                    cachedDims.width, cachedDims.height
                );
                currentEdge = constrained.edge;
                currentNormalized = constrained.normalized;
            }
        }

        // Set drag state with cached values
        this.arrowDotDrag = {
            active: true,
            dotType: dotInfo.type,
            taskId: dotInfo.taskId,
            relatedTaskId: dotInfo.type === 'target' ? dotInfo.parentId : dotInfo.childId,
            edge: currentEdge,
            normalized: currentNormalized,
            lastRenderTime: 0,
            // PERF: Cache expensive calculations
            cachedDims: cachedDims,
            cachedSnapPositions: cachedSnapPositions,
            rafPending: false  // For RAF throttling
        };

        // GPU ACCEL: Add class to arrow link for GPU acceleration
        // For source dots, the arrow is from taskId (parent) to childId
        // For target dots, the arrow is from parentId to taskId (child)
        const parentId = dotInfo.type === 'source' ? dotInfo.taskId : dotInfo.parentId;
        const childId = dotInfo.type === 'source' ? dotInfo.childId : dotInfo.taskId;
        const arrowSelector = `.parent-visible[data-task-id="${childId}"][data-parent-id="${parentId}"]`;
        const arrowLine = document.querySelector(arrowSelector);
        if (arrowLine) {
            arrowLine.classList.add('dragging-arrow');
        }

        // Update cursor
        const canvasContainer = document.getElementById('canvas-container');
        canvasContainer.style.cursor = 'grabbing';
    },

    /**
     * Update arrow dot drag position
     * Called from onCanvasMouseMove during drag
     *
     * @param {number} mouseX - Mouse X in SVG coordinates
     * @param {number} mouseY - Mouse Y in SVG coordinates
     */
    updateArrowDotDrag(mouseX, mouseY) {
        if (!this.arrowDotDrag.active) return;

        // DEFENSIVE: Validate inputs
        if (!isFinite(mouseX) || !isFinite(mouseY)) return;

        const task = this.tasks.find(t => t.id === this.arrowDotDrag.taskId);
        if (!task) return;

        // PERF: Use cached dimensions instead of recalculating
        const dims = this.arrowDotDrag.cachedDims;

        // Constrain mouse to rectangle edge
        const constrained = this.constrainToRectEdge(
            mouseX, mouseY,
            task.x, task.y,
            dims.width, dims.height
        );

        // PERF: Use cached snap positions
        const snap = this.findNearestSnap(
            constrained,
            this.arrowDotDrag.cachedSnapPositions,
            task.x, task.y,
            dims.width, dims.height,
            this.arrowSnapThreshold
        );

        // Update drag state
        if (snap) {
            this.arrowDotDrag.edge = snap.edge;
            this.arrowDotDrag.normalized = snap.normalized;
        } else {
            this.arrowDotDrag.edge = constrained.edge;
            this.arrowDotDrag.normalized = constrained.normalized;
        }

        // PERF: Use RAF to batch updates (max 60fps instead of 100+)
        if (!this.arrowDotDrag.rafPending) {
            this.arrowDotDrag.rafPending = true;
            requestAnimationFrame(() => {
                this.arrowDotDrag.rafPending = false;
                // PERF: Partial render - only update dot and arrow, not entire canvas
                this.renderArrowDotDragVisuals();
            });
        }
    },

    /**
     * PERF: Partial render for arrow dot drag - only update dot and arrow line
     * This avoids re-rendering the entire canvas on every mousemove
     */
    renderArrowDotDragVisuals() {
        if (!this.arrowDotDrag.active) return;

        const task = this.tasks.find(t => t.id === this.arrowDotDrag.taskId);
        if (!task) return;

        const relatedTask = this.tasks.find(t => t.id === this.arrowDotDrag.relatedTaskId);
        if (!relatedTask) return;

        const dims = this.arrowDotDrag.cachedDims;

        // Calculate current dot position from live drag state
        const dotPos = this.denormalizeEdgePosition(
            this.arrowDotDrag.edge,
            this.arrowDotDrag.normalized,
            task.x, task.y,
            dims.width, dims.height
        );

        // Find and update existing arrow dot element (or create if missing)
        let dotElement = document.querySelector('.arrow-dot');
        if (!dotElement) {
            // Fallback: full render if dot doesn't exist
            this.render();
            return;
        }

        // Update dot position (faster than recreating)
        dotElement.setAttribute('cx', dotPos.x);
        dotElement.setAttribute('cy', dotPos.y);
        dotElement.setAttribute('r', this.arrowDotDragSize || 7);

        // Determine color based on whether position is custom and dot type
        let hasCustomPosition;
        if (this.arrowDotDrag.dotType === 'source') {
            hasCustomPosition = !!(task.customSourcePoints && task.customSourcePoints[this.arrowDotDrag.relatedTaskId]);
        } else {
            hasCustomPosition = !!(task.customAttachPoints && task.customAttachPoints[this.arrowDotDrag.relatedTaskId]);
        }
        dotElement.setAttribute('fill', hasCustomPosition ? '#2196f3' : '#4caf50');

        // Find and update arrow line
        // For source dots: arrow is from taskId (parent) to relatedTaskId (child)
        // For target dots: arrow is from relatedTaskId (parent) to taskId (child)
        const parentId = this.arrowDotDrag.dotType === 'source' ? this.arrowDotDrag.taskId : this.arrowDotDrag.relatedTaskId;
        const childId = this.arrowDotDrag.dotType === 'source' ? this.arrowDotDrag.relatedTaskId : this.arrowDotDrag.taskId;
        const arrowSelector = `.parent-visible[data-task-id="${childId}"][data-parent-id="${parentId}"]`;
        const arrowLine = document.querySelector(arrowSelector);

        if (arrowLine) {
            // Update arrow to match dot
            // All arrows are <path> elements (created by createMultiSegmentCurvedLine)
            if (arrowLine.tagName === 'path') {
                // Get the OTHER end of the arrow (the one we're NOT dragging)
                let arrowStart, arrowEnd;
                const parentTask = this.tasks.find(t => t.id === parentId);
                const childTask = this.tasks.find(t => t.id === childId);

                if (this.arrowDotDrag.dotType === 'source') {
                    // Dragging source dot - start is what we're dragging, end is fixed
                    arrowStart = dotPos;
                    arrowEnd = this.getArrowEndpoint(parentTask, childTask, 'target');
                } else {
                    // Dragging target dot - start is fixed, end is what we're dragging
                    arrowStart = this.getArrowEndpoint(parentTask, childTask, 'source');
                    arrowEnd = dotPos;
                }

                // Get control points for this arrow (stored on child task)
                const controlPoints = childTask.curveControlPoints?.[parentId];

                // Check if we're also dragging curve control points
                const isDraggingThisCurve = this.curveDotDrag.active &&
                                            this.curveDotDrag.taskId === childId &&
                                            this.curveDotDrag.parentId === parentId;
                const effectiveControlPoints = isDraggingThisCurve ?
                    this.curveDotDrag.controlPoints : controlPoints;

                // Recreate the path with new endpoints
                if (effectiveControlPoints && effectiveControlPoints.length > 0) {
                    // Multi-segment curve - use Catmull-Rom spline
                    const points = [
                        { x: arrowStart.x, y: arrowStart.y },
                        ...effectiveControlPoints,
                        { x: arrowEnd.x, y: arrowEnd.y }
                    ];

                    let pathData = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[Math.max(0, i - 1)];
                        const p1 = points[i];
                        const p2 = points[i + 1];
                        const p3 = points[Math.min(points.length - 1, i + 2)];

                        const c1x = p1.x + (p2.x - p0.x) / 6;
                        const c1y = p1.y + (p2.y - p0.y) / 6;
                        const c2x = p2.x - (p3.x - p1.x) / 6;
                        const c2y = p2.y - (p3.y - p1.y) / 6;

                        pathData += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
                    }
                    arrowLine.setAttribute('d', pathData);
                } else {
                    // Straight line - simple path
                    arrowLine.setAttribute('d', `M ${arrowStart.x} ${arrowStart.y} L ${arrowEnd.x} ${arrowEnd.y}`);
                }
            }
        }

        // Update snap indicators
        const snapGroup = document.getElementById('snap-indicators-group');
        if (snapGroup) {
            // Clear old indicators
            snapGroup.innerHTML = '';

            // Render new snap indicators
            const indicators = this.renderSnapIndicators(
                task.x, task.y,
                dims.width, dims.height,
                this.arrowDotDrag.edge,
                this.arrowDotDrag.normalized
            );

            indicators.forEach(indicator => snapGroup.appendChild(indicator));
        }
    },

    /**
     * Finish arrow dot drag and commit changes
     * Called from onCanvasMouseUp
     */
    finishArrowDotDrag() {
        if (!this.arrowDotDrag.active) return;

        const task = this.tasks.find(t => t.id === this.arrowDotDrag.taskId);
        if (!task) {
            this.cancelArrowDotDrag();
            return;
        }

        // Save custom position based on dot type (with timestamp for prioritization)
        if (this.arrowDotDrag.dotType === 'target') {
            // Target dot: save to customAttachPoints (arrow endpoint on child)
            if (!task.customAttachPoints) {
                task.customAttachPoints = {};
            }
            task.customAttachPoints[this.arrowDotDrag.relatedTaskId] = {
                edge: this.arrowDotDrag.edge,
                normalized: this.arrowDotDrag.normalized,
                timestamp: Date.now()  // For prioritization when overlapping
            };
        } else if (this.arrowDotDrag.dotType === 'source') {
            // Source dot: save to customSourcePoints (arrow start on parent)
            if (!task.customSourcePoints) {
                task.customSourcePoints = {};
            }
            task.customSourcePoints[this.arrowDotDrag.relatedTaskId] = {
                edge: this.arrowDotDrag.edge,
                normalized: this.arrowDotDrag.normalized,
                timestamp: Date.now()  // For prioritization when overlapping
            };
        }

        // GPU ACCEL: Remove dragging-arrow class
        // For source dots, the arrow is from taskId (parent) to relatedTaskId (child)
        // For target dots, the arrow is from relatedTaskId (parent) to taskId (child)
        const parentId = this.arrowDotDrag.dotType === 'source' ? this.arrowDotDrag.taskId : this.arrowDotDrag.relatedTaskId;
        const childId = this.arrowDotDrag.dotType === 'source' ? this.arrowDotDrag.relatedTaskId : this.arrowDotDrag.taskId;
        const arrowSelector = `.parent-visible[data-task-id="${childId}"][data-parent-id="${parentId}"]`;
        const arrowLine = document.querySelector(arrowSelector);
        if (arrowLine) {
            arrowLine.classList.remove('dragging-arrow');
        }

        // Clear drag state
        this.arrowDotDrag = {
            active: false,
            dotType: null,
            taskId: null,
            relatedTaskId: null,
            edge: null,
            normalized: 0.5,
            lastRenderTime: 0
        };

        // Update cursor
        const canvasContainer = document.getElementById('canvas-container');
        canvasContainer.style.cursor = 'default';

        // Save and render
        this.saveToStorage();
        this.render();

        this.showToast('Arrow position updated', 'success', 2000);
    },

    /**
     * Cancel arrow dot drag without saving
     */
    cancelArrowDotDrag() {
        // GPU ACCEL: Remove dragging-arrow class if exists
        if (this.arrowDotDrag.taskId && this.arrowDotDrag.relatedTaskId) {
            // For source dots: arrow is from taskId (parent) to relatedTaskId (child)
            // For target dots: arrow is from relatedTaskId (parent) to taskId (child)
            const parentId = this.arrowDotDrag.dotType === 'source' ? this.arrowDotDrag.taskId : this.arrowDotDrag.relatedTaskId;
            const childId = this.arrowDotDrag.dotType === 'source' ? this.arrowDotDrag.relatedTaskId : this.arrowDotDrag.taskId;
            const arrowSelector = `.parent-visible[data-task-id="${childId}"][data-parent-id="${parentId}"]`;
            const arrowLine = document.querySelector(arrowSelector);
            if (arrowLine) {
                arrowLine.classList.remove('dragging-arrow');
            }
        }

        this.arrowDotDrag = {
            active: false,
            dotType: null,
            taskId: null,
            relatedTaskId: null,
            edge: null,
            normalized: 0.5,
            lastRenderTime: 0
        };

        const canvasContainer = document.getElementById('canvas-container');
        canvasContainer.style.cursor = 'default';

        this.render();
    },

    /**
     * Update timestamp for a specific arrow (both source and target endpoints)
     * Used when selecting an arrow or moving a connected node
     *
     * @param {number} childId - Child task ID
     * @param {number} parentId - Parent task ID
     */
    updateArrowTimestamp(childId, parentId) {
        const child = this.tasks.find(t => t.id === childId);
        const parent = this.tasks.find(t => t.id === parentId);

        if (!child || !parent) return;

        const timestamp = Date.now();

        // Update target endpoint (arrow landing on child)
        if (child.customAttachPoints && child.customAttachPoints[parentId]) {
            child.customAttachPoints[parentId].timestamp = timestamp;
        }

        // Update source endpoint (arrow starting from parent)
        if (parent.customSourcePoints && parent.customSourcePoints[childId]) {
            parent.customSourcePoints[childId].timestamp = timestamp;
        }
    },

    /**
     * Update timestamps for all arrows connected to a node
     * Used when moving a node to prioritize its arrows
     *
     * @param {number} taskId - Task ID that was moved
     */
    updateConnectedArrowsTimestamps(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const timestamp = Date.now();

        // Update all parent arrows (arrows coming INTO this node)
        const allParents = [task.mainParent, ...(task.otherParents || [])].filter(p => p !== null);
        for (const parentId of allParents) {
            const parent = this.tasks.find(t => t.id === parentId);
            if (!parent) continue;

            // Update target endpoint on child
            if (task.customAttachPoints && task.customAttachPoints[parentId]) {
                task.customAttachPoints[parentId].timestamp = timestamp;
            }

            // Update source endpoint on parent
            if (parent.customSourcePoints && parent.customSourcePoints[taskId]) {
                parent.customSourcePoints[taskId].timestamp = timestamp;
            }
        }

        // Update all child arrows (arrows going OUT from this node)
        for (const childId of task.children || []) {
            const child = this.tasks.find(t => t.id === childId);
            if (!child) continue;

            // Update target endpoint on child
            if (child.customAttachPoints && child.customAttachPoints[taskId]) {
                child.customAttachPoints[taskId].timestamp = timestamp;
            }

            // Update source endpoint on this node
            if (task.customSourcePoints && task.customSourcePoints[childId]) {
                task.customSourcePoints[childId].timestamp = timestamp;
            }
        }
    },

    /**
     * Reset arrow to default position (double-click or context menu)
     *
     * @param {object} dotInfo - Dot information {type, taskId, parentId, childId}
     */
    resetArrowPosition(dotInfo) {
        if (!dotInfo) return;

        this.saveSnapshot(`Reset arrow position`);

        const task = this.tasks.find(t => t.id === dotInfo.taskId);
        if (!task) return;

        if (dotInfo.type === 'target') {
            // Remove custom attach point (child-side)
            if (task.customAttachPoints && task.customAttachPoints[dotInfo.parentId]) {
                delete task.customAttachPoints[dotInfo.parentId];

                this.saveToStorage();
                this.render();

                this.showToast('Arrow position reset', 'success', 2000);
            }
        } else if (dotInfo.type === 'source') {
            // Remove custom source point (parent-side)
            if (task.customSourcePoints && task.customSourcePoints[dotInfo.childId]) {
                delete task.customSourcePoints[dotInfo.childId];

                this.saveToStorage();
                this.render();

                this.showToast('Arrow position reset', 'success', 2000);
            }
        }
    }
};

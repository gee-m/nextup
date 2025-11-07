/**
 * @module interactions/mouse
 * @order 25
 * @category interactions
 *
 * Mouse event handlers for canvas interactions
 */

export const MouseMixin = {
    onCanvasMouseDown(e) {
        // Don't start drag if we're editing
        if (this.editingTaskId !== null) return;

        // Check if clicking on resize handle (highest priority)
        if (e.target.classList && e.target.classList.contains('resize-handle')) {
            const taskId = parseInt(e.target.dataset.taskId);
            const corner = e.target.dataset.corner;
            this.startImageResize(taskId, corner, e);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Check if clicking on arrow dot (high priority)
        if (e.target.classList && e.target.classList.contains('arrow-dot')) {
            const dotType = e.target.getAttribute('data-dot-type');
            const taskId = parseInt(e.target.getAttribute('data-task-id'));
            const relatedId = parseInt(e.target.getAttribute('data-related-id'));

            const now = performance.now();
            const dotId = `${taskId}-${relatedId}`;
            const timeSinceLastClick = now - this.arrowDotDrag.lastClickTime;

            // Check for double-click (< 300ms, same dot)
            if (timeSinceLastClick < 300 && this.arrowDotDrag.lastClickedDotId === dotId) {
                // This is a double-click - don't start drag, let dblclick handler process it
                this.arrowDotDrag.lastClickTime = 0;
                this.arrowDotDrag.lastClickedDotId = null;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Single click - track for future double-click detection
            this.arrowDotDrag.lastClickTime = now;
            this.arrowDotDrag.lastClickedDotId = dotId;

            // Start drag after short delay to allow double-click detection
            setTimeout(() => {
                // Only start drag if not double-clicked in the meantime
                if (this.arrowDotDrag.lastClickedDotId === dotId) {
                    // For source dots: taskId is parent, relatedId is child
                    // For target dots: taskId is child, relatedId is parent
                    const dotInfo = {
                        type: dotType,
                        taskId: taskId
                    };

                    if (dotType === 'source') {
                        dotInfo.childId = relatedId;
                    } else {
                        dotInfo.parentId = relatedId;
                    }

                    this.startArrowDotDrag(dotInfo);
                }
            }, 250);

            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Check if clicking on curve control dot (second priority)
        // Use hoveredCurveDot state (Miro-style proximity detection)
        // ONLY works when Ctrl is held
        if (e.target.classList && e.target.classList.contains('curve-dot') && this.hoveredCurveDot && (e.ctrlKey || e.metaKey)) {
            const now = performance.now();
            const dotId = `curve-${this.hoveredCurveDot.taskId}-${this.hoveredCurveDot.parentId}`;
            const timeSinceLastClick = now - this.curveDotDrag.lastClickTime;

            // Check for double-click (< 300ms, same dot)
            if (timeSinceLastClick < 300 && this.curveDotDrag.lastClickedDotId === dotId) {
                // This is a double-click - don't start drag, let dblclick handler process it
                this.curveDotDrag.lastClickTime = 0;
                this.curveDotDrag.lastClickedDotId = null;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Single click - track for future double-click detection
            this.curveDotDrag.lastClickTime = now;
            this.curveDotDrag.lastClickedDotId = dotId;

            // Start drag after short delay to allow double-click detection
            setTimeout(() => {
                // Only start drag if not double-clicked in the meantime
                if (this.curveDotDrag.lastClickedDotId === dotId) {
                    this.startCurveDotDrag(this.hoveredCurveDot);
                }
            }, 250);

            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Don't interfere with line clicks - let the click handler deal with them
        if (e.target.tagName === 'line' && e.target.classList.contains('link')) {
            return; // Exit early, allow click event to fire
        }

        if (e.target.closest('.task-node')) {
            const node = e.target.closest('.task-node');
            const taskId = parseInt(node.dataset.id);

            if (e.button === 0) { // Left click
                if (e.ctrlKey || e.metaKey || this.debugCtrlMode) {
                    // Prepare for potential reparent drag (will activate on mousemove >5px)
                    // If no drag occurs, click event will handle multi-select
                    this.dragMode = 'reparent-pending';
                    this.selectedNode = taskId;
                    const pt = this.getSVGPoint(e);
                    this.dragStart = { x: pt.x, y: pt.y };
                    this.dragStartOriginal = { x: pt.x, y: pt.y };
                } else if (e.altKey) {
                    // Start dependency drag
                    this.dragMode = 'dependency';
                    this.selectedNode = taskId;
                    this.createTempLine(e);
                    // Create custom cursor arrow
                    this.cursorArrow = this.createCursorArrow();
                    // Initialize line from source to cursor (A → B drag direction)
                    const task = this.tasks.find(t => t.id === taskId);
                    if (task && this.tempLine) {
                        const pt = this.getSVGPoint(e);
                        this.tempLine.setAttribute('x1', task.x);
                        this.tempLine.setAttribute('y1', task.y);
                        this.tempLine.setAttribute('x2', pt.x);
                        this.tempLine.setAttribute('y2', pt.y);
                    }
                } else if (e.shiftKey) {
                    // Prepare for potential subtree drag (will activate on mousemove >5px)
                    this.dragMode = 'subtree-pending';
                    this.selectedNode = taskId;
                    const pt = this.getSVGPoint(e);
                    this.dragStart = { x: pt.x, y: pt.y };
                    this.dragStartOriginal = { x: pt.x, y: pt.y };
                } else {
                    // Start node drag
                    this.dragMode = 'node';
                    this.selectedNode = taskId;
                    const task = this.tasks.find(t => t.id === taskId);
                    const pt = this.getSVGPoint(e);
                    this.dragStart = { x: pt.x - task.x, y: pt.y - task.y };
                    this.dragOriginalPos = { x: task.x, y: task.y };

                    // Save snapshot BEFORE drag starts (captures original position)
                    if (this.selectedTaskIds.size > 1) {
                        this.saveSnapshot(`Move ${this.selectedTaskIds.size} tasks`);
                    } else {
                        const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
                        this.saveSnapshot(`Move task '${truncatedTitle}'`);
                    }
                }
            }
            e.preventDefault();
            e.stopPropagation();
        } else {
            // Clicked on empty space
            if (e.button === 0 && (e.ctrlKey || e.metaKey || this.debugCtrlMode)) {
                // Ctrl+Drag on empty space: prepare for box selection (Windows standard)
                const pt = this.getSVGPoint(e);
                this.dragMode = 'box-select';
                this.boxSelectStart = { x: pt.x, y: pt.y };
                this.isBoxSelecting = true;
                e.preventDefault();
            } else {
                // Pan canvas - use screen coordinates (stable, unlike SVG coords which change with viewBox)
                this.dragMode = 'canvas';
                this.dragStart = { x: e.clientX, y: e.clientY };
                const pt = this.getSVGPoint(e);
                this.dragStartOriginal = { x: pt.x, y: pt.y }; // Track original for click detection (SVG coords)
                document.getElementById('canvas-container').classList.add('dragging');
                e.preventDefault();
            }
        }
    },

    onCanvasMouseMove(e) {
        // Always track mouse position for Ctrl+V paste at cursor
        const pt = this.getSVGPoint(e);
        this.lastMousePosition = { x: pt.x, y: pt.y };

        // Handle image resizing
        if (this.imageResizing) {
            const task = this.tasks.find(t => t.id === this.imageResizing.taskId);
            if (!task) return;

            const dx = pt.x - this.imageResizing.startPoint.x;
            const dy = pt.y - this.imageResizing.startPoint.y;

            // Calculate new dimensions based on corner
            let newWidth = this.imageResizing.originalWidth;
            let newHeight = this.imageResizing.originalHeight;

            switch (this.imageResizing.corner) {
                case 'se': // Southeast - drag right/down
                    newWidth = this.imageResizing.originalWidth + dx;
                    newHeight = newWidth / this.imageResizing.aspectRatio;
                    break;
                case 'sw': // Southwest - drag left/down
                    newWidth = this.imageResizing.originalWidth - dx;
                    newHeight = newWidth / this.imageResizing.aspectRatio;
                    break;
                case 'ne': // Northeast - drag right/up
                    newWidth = this.imageResizing.originalWidth + dx;
                    newHeight = newWidth / this.imageResizing.aspectRatio;
                    break;
                case 'nw': // Northwest - drag left/up
                    newWidth = this.imageResizing.originalWidth - dx;
                    newHeight = newWidth / this.imageResizing.aspectRatio;
                    break;
            }

            // Enforce minimum size
            const MIN_SIZE = 50;
            newWidth = Math.max(MIN_SIZE, newWidth);
            newHeight = Math.max(MIN_SIZE, newHeight);

            // Update task dimensions
            task.imageWidth = Math.round(newWidth);
            task.imageHeight = Math.round(newHeight);

            this.render();
            e.preventDefault();
            return;
        }

        // Update arrow dot hover detection (even when not dragging)
        if (!this.arrowDotDrag.active && !this.curveDotDrag.active) {
            this.updateArrowDotHover(pt.x, pt.y);
        }

        // Update curve dot hover detection (only when Ctrl is held, not in orthogonal mode, and not dragging)
        if (!this.arrowDotDrag.active && !this.curveDotDrag.active && (e.ctrlKey || e.metaKey) && this.arrowRoutingMode !== 'orthogonal') {
            this.updateCurveDotHover(pt.x, pt.y);
        } else if (!this.curveDotDrag.active) {
            // Clear curve dot hover if Ctrl not held or in orthogonal mode
            if (this.hoveredCurveDot) {
                this.hoveredCurveDot = null;
                this.render();
            }
        }

        // Handle arrow dot drag
        if (this.arrowDotDrag.active) {
            this.updateArrowDotDrag(pt.x, pt.y);
            e.preventDefault();
            return;
        }

        // Handle curve dot drag
        if (this.curveDotDrag.active) {
            this.updateCurveDotDrag(pt.x, pt.y);
            e.preventDefault();
            return;
        }

        if (!this.dragMode) return;

        e.preventDefault();

        if (this.dragMode === 'box-select' && this.boxSelectStart) {
            // Draw visual feedback for box selection
            const minX = Math.min(this.boxSelectStart.x, pt.x);
            const minY = Math.min(this.boxSelectStart.y, pt.y);
            const maxX = Math.max(this.boxSelectStart.x, pt.x);
            const maxY = Math.max(this.boxSelectStart.y, pt.y);

            // Remove existing selection box
            const existingBox = document.querySelector('#box-selection-rect');
            if (existingBox) existingBox.remove();

            // Create new selection box
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.id = 'box-selection-rect';
            rect.setAttribute('x', minX);
            rect.setAttribute('y', minY);
            rect.setAttribute('width', maxX - minX);
            rect.setAttribute('height', maxY - minY);
            rect.setAttribute('fill', 'rgba(33, 150, 243, 0.1)');
            rect.setAttribute('stroke', '#2196f3');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('stroke-dasharray', '5,5');
            rect.setAttribute('pointer-events', 'none');
            document.getElementById('canvas').appendChild(rect);

            return;
        } else if (this.dragMode === 'node' && this.selectedNode !== null) {
            const task = this.tasks.find(t => t.id === this.selectedNode);
            if (task) {
                let newX = pt.x - this.dragStart.x;
                let newY = pt.y - this.dragStart.y;

                // Apply snapping
                if (this.enableSnapping) {
                    const excludeIds = this.selectedTaskIds.has(this.selectedNode) ? this.selectedTaskIds : new Set([this.selectedNode]);

                    // For multi-select, use bounding box of entire group for alignment
                    let snapWidth, snapHeight, snapCenterX, snapCenterY;
                    if (this.selectedTaskIds.has(this.selectedNode) && this.selectedTaskIds.size > 1) {
                        // Calculate bounding box of all selected nodes
                        const bbox = this.calculateMultiSelectBoundingBox(this.selectedTaskIds);

                        // Calculate where the bounding box center WOULD BE after drag
                        const dx = newX - task.x;
                        const dy = newY - task.y;
                        snapCenterX = bbox.centerX + dx;
                        snapCenterY = bbox.centerY + dy;
                        snapWidth = bbox.width;
                        snapHeight = bbox.height;
                    } else {
                        // Single node - use its dimensions
                        const dims = this.calculateTaskDimensions(task);
                        snapCenterX = newX;
                        snapCenterY = newY;
                        snapWidth = dims.width;
                        snapHeight = dims.height;
                    }

                    const snapped = this.calculateSnapping(snapCenterX, snapCenterY, snapWidth, snapHeight, excludeIds);

                    // Apply snap offset back to the dragged node position
                    if (this.selectedTaskIds.has(this.selectedNode) && this.selectedTaskIds.size > 1) {
                        // For groups, calculate offset from where bbox would be to where it should be
                        const bbox = this.calculateMultiSelectBoundingBox(this.selectedTaskIds);
                        const dx = newX - task.x;
                        const dy = newY - task.y;
                        const bboxWouldBeX = bbox.centerX + dx;
                        const bboxWouldBeY = bbox.centerY + dy;
                        const snapOffsetX = snapped.x - bboxWouldBeX;
                        const snapOffsetY = snapped.y - bboxWouldBeY;
                        newX += snapOffsetX;
                        newY += snapOffsetY;
                    } else {
                        // Single node - direct snap
                        newX = snapped.x;
                        newY = snapped.y;
                    }

                    this.activeSnapLines = snapped.snapLines;
                } else {
                    this.activeSnapLines = [];
                }

                // Check if we're dragging a selected node
                if (this.selectedTaskIds.has(this.selectedNode)) {
                    // Move all selected nodes together, maintaining relative positions
                    const dx = newX - task.x;
                    const dy = newY - task.y;

                    this.selectedTaskIds.forEach(selectedId => {
                        const selectedTask = this.tasks.find(t => t.id === selectedId);
                        if (selectedTask) {
                            selectedTask.x += dx;
                            selectedTask.y += dy;
                            selectedTask.vx = 0;
                            selectedTask.vy = 0;
                        }
                    });
                } else {
                    // Dragging an unselected node - move just this one
                    const snapped = this.snapPointToGrid(newX, newY);
                    task.x = snapped.x;
                    task.y = snapped.y;
                    task.vx = 0;
                    task.vy = 0;
                }

                // Check for hover copy of arrow attachments (with 750ms delay)
                // Temporarily hide dragged node from elementFromPoint to see what's underneath
                const draggedNodeElement = document.querySelector(`.task-node[data-id="${task.id}"]`);
                const originalPointerEvents = draggedNodeElement ? draggedNodeElement.style.pointerEvents : null;
                if (draggedNodeElement) {
                    draggedNodeElement.style.pointerEvents = 'none';
                }

                const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
                const hoveredNode = elementUnderCursor ? elementUnderCursor.closest('.task-node') : null;

                // Restore pointer events
                if (draggedNodeElement) {
                    draggedNodeElement.style.pointerEvents = originalPointerEvents || '';
                }

                if (hoveredNode) {
                    const hoveredId = parseInt(hoveredNode.dataset.id);
                    if (hoveredId !== task.id && !isNaN(hoveredId)) {
                        // Start hover timer if this is a new hover target OR revert if same target
                        if (this._attachmentCopyHoverTarget !== hoveredId || this._attachmentCopyApplied) {
                            // Clear any existing timer
                            if (this._attachmentCopyHoverTimer) {
                                clearTimeout(this._attachmentCopyHoverTimer);
                            }

                            // Capture IDs for closure
                            const draggedId = task.id;
                            const targetId = hoveredId;
                            const shouldRevert = this._attachmentCopyHoverTarget === hoveredId && this._attachmentCopyApplied;

                            // Set new timer for 750ms
                            this._attachmentCopyHoverTimer = setTimeout(() => {
                                if (shouldRevert) {
                                    // Revert to original
                                    this.revertArrowAttachments(draggedId);
                                    this._attachmentCopyApplied = false;
                                } else {
                                    // Apply copy
                                    this.handleArrowAttachmentHoverCopy(draggedId, targetId);
                                    this._attachmentCopyApplied = true;
                                }
                            }, 750);

                            this._attachmentCopyHoverTarget = hoveredId;
                        }
                    }
                } else {
                    // No longer hovering - moved to empty space
                    // Clear timer and reset state to allow multiple copies per drag
                    if (this._attachmentCopyHoverTimer) {
                        clearTimeout(this._attachmentCopyHoverTimer);
                        this._attachmentCopyHoverTimer = null;
                    }

                    // If we've copied attachments, commit them by updating the original state
                    // This allows multiple copies per drag session (reset after moving to empty space)
                    if (this._attachmentCopyApplied && this._attachmentCopyOriginal) {
                        // Update the "original" to current state so next revert doesn't undo this copy
                        this.saveOriginalArrowAttachments(task.id);
                        this._attachmentCopyApplied = false; // Allow copying again
                    }

                    this._attachmentCopyHoverTarget = null;
                }

                this.render();
            }
        } else if (this.dragMode === 'subtree-pending' && this.selectedNode !== null) {
            // Check if moved >threshold to activate subtree drag (vs shift+click for selection)
            const distance = Math.sqrt(
                Math.pow(pt.x - this.dragStartOriginal.x, 2) +
                Math.pow(pt.y - this.dragStartOriginal.y, 2)
            );

            if (distance >= this.INTERACTION.DRAG_THRESHOLD_PX) {
                // Activate full subtree drag
                this.dragMode = 'subtree';
                const taskId = this.selectedNode;

                // Get all descendants
                this.draggedSubtree = [taskId, ...this.getDescendants(taskId)];

                // Store original positions
                this.subtreeOriginalPositions = {};
                this.draggedSubtree.forEach(id => {
                    const t = this.tasks.find(t => t.id === id);
                    this.subtreeOriginalPositions[id] = { x: t.x, y: t.y };
                });

                const task = this.tasks.find(t => t.id === taskId);
                this.dragStart = { x: pt.x - task.x, y: pt.y - task.y };
                this.dragOriginalPos = { x: task.x, y: task.y };

                // Save snapshot BEFORE drag starts (captures original position)
                const truncatedTitle = task.title.length > 30 ? task.title.substring(0, 27) + '...' : task.title;
                this.saveSnapshot(`Move subtree '${truncatedTitle}'`);
            }
        } else if (this.dragMode === 'subtree' && this.selectedNode !== null) {
            // Calculate offset from original root position
            let newX = pt.x - this.dragStart.x;
            let newY = pt.y - this.dragStart.y;

            // Apply snapping to entire subtree bounding box (not just root)
            if (this.enableSnapping) {
                const rootTask = this.tasks.find(t => t.id === this.selectedNode);
                const excludeIds = new Set(this.draggedSubtree);

                // Use bounding box of entire subtree for alignment
                const subtreeIds = new Set(this.draggedSubtree);
                const bbox = this.calculateMultiSelectBoundingBox(subtreeIds);

                // Calculate where the bounding box center WOULD BE after drag
                const dx = newX - rootTask.x;
                const dy = newY - rootTask.y;
                const snapCenterX = bbox.centerX + dx;
                const snapCenterY = bbox.centerY + dy;

                const snapped = this.calculateSnapping(snapCenterX, snapCenterY, bbox.width, bbox.height, excludeIds);

                // Apply snap offset back to the root node position
                const bboxWouldBeX = bbox.centerX + dx;
                const bboxWouldBeY = bbox.centerY + dy;
                const snapOffsetX = snapped.x - bboxWouldBeX;
                const snapOffsetY = snapped.y - bboxWouldBeY;
                newX += snapOffsetX;
                newY += snapOffsetY;

                this.activeSnapLines = snapped.snapLines;
            } else {
                this.activeSnapLines = [];
            }

            let dx = newX - this.dragOriginalPos.x;
            let dy = newY - this.dragOriginalPos.y;

            // Snap the offset if grid snap is enabled
            if (this.gridEnabled && this.gridSnapEnabled) {
                dx = this.snapToGrid(dx);
                dy = this.snapToGrid(dy);
            }

            // Move entire subtree by same offset
            this.draggedSubtree.forEach(id => {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.x = this.subtreeOriginalPositions[id].x + dx;
                    task.y = this.subtreeOriginalPositions[id].y + dy;
                    task.vx = 0;
                    task.vy = 0;
                }
            });

            this.render();
        } else if (this.dragMode === 'reparent-pending' && this.selectedNode !== null) {
            // Check if moved >threshold to activate reparent drag (vs Ctrl+click for multi-select)
            const distance = Math.sqrt(
                Math.pow(pt.x - this.dragStartOriginal.x, 2) +
                Math.pow(pt.y - this.dragStartOriginal.y, 2)
            );

            if (distance >= this.INTERACTION.DRAG_THRESHOLD_PX) {
                // Activate reparent drag mode
                this.dragMode = 'reparent';
                this.createTempLine(e);
                // Create custom cursor arrow
                this.cursorArrow = this.createCursorArrow();
                // Initialize line from source to cursor (A → B)
                // Arrow follows drag motion for intuitive UX
                const task = this.tasks.find(t => t.id === this.selectedNode);
                if (task && this.tempLine) {
                    this.tempLine.setAttribute('x1', task.x);
                    this.tempLine.setAttribute('y1', task.y);
                    this.tempLine.setAttribute('x2', pt.x);
                    this.tempLine.setAttribute('y2', pt.y);
                }
            }
        } else if (this.dragMode === 'reparent' && this.tempLine) {
            const sourceTask = this.tasks.find(t => t.id === this.selectedNode);
            if (sourceTask) {
                // Check if cursor is over empty space (not over another task)
                const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
                const targetNode = elementUnderCursor ? elementUnderCursor.closest('.task-node') : null;

                if (!targetNode) {
                    // Over empty space → Show preview ghost node for new child creation
                    // Hide cursor arrow (only show for reparenting, not child creation)
                    if (this.cursorArrow) {
                        this.cursorArrow.style.display = 'none';
                    }

                    // Remove existing preview if any
                    const existingPreview = document.getElementById('preview-ghost-node');
                    if (existingPreview) existingPreview.remove();

                    // Calculate preview node dimensions - MUST match actual created task
                    // Created tasks have title: '' (empty), so preview must too
                    const previewDims = this.calculateTaskDimensions({ title: '' });

                    // Calculate arrow endpoint at preview node edge (not center)
                    // Use same approach as permanent arrows in render.js
                    const arrowEnd = this.getLineEndAtRectEdge(
                        sourceTask.x, sourceTask.y,  // From source task center
                        pt.x, pt.y,                   // To preview node center
                        previewDims.width,
                        previewDims.height
                    );

                    // Update line from source to edge (same as permanent arrows)
                    this.tempLine.setAttribute('x1', sourceTask.x);
                    this.tempLine.setAttribute('y1', sourceTask.y);
                    this.tempLine.setAttribute('x2', arrowEnd.x);
                    this.tempLine.setAttribute('y2', arrowEnd.y);
                    // Add green arrowhead marker to match temp line color
                    this.tempLine.setAttribute('marker-end', 'url(#arrowhead-temp-green)');

                    // Create preview ghost node rectangle
                    const ghostNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    ghostNode.id = 'preview-ghost-node';
                    ghostNode.setAttribute('x', pt.x - previewDims.width / 2);
                    ghostNode.setAttribute('y', pt.y - previewDims.height / 2);
                    ghostNode.setAttribute('width', previewDims.width);
                    ghostNode.setAttribute('height', previewDims.height);
                    ghostNode.setAttribute('rx', '8');
                    ghostNode.setAttribute('fill', 'rgba(255, 255, 255, 0.3)');
                    ghostNode.setAttribute('stroke', '#2196f3');
                    ghostNode.setAttribute('stroke-width', '2');
                    ghostNode.setAttribute('stroke-dasharray', '5,5');
                    ghostNode.setAttribute('pointer-events', 'none');
                    document.getElementById('canvas').appendChild(ghostNode);
                } else {
                    // Over another task → Show cursor arrow for reparenting
                    this.updateCursorArrow(e.clientX, e.clientY, sourceTask);

                    // Remove preview ghost if exists
                    const existingPreview = document.getElementById('preview-ghost-node');
                    if (existingPreview) existingPreview.remove();

                    // Update line to cursor (no preview node to clip to)
                    this.tempLine.setAttribute('x1', sourceTask.x);
                    this.tempLine.setAttribute('y1', sourceTask.y);
                    this.tempLine.setAttribute('x2', pt.x);
                    this.tempLine.setAttribute('y2', pt.y);
                    // Remove arrowhead marker (cursor arrow shows direction)
                    this.tempLine.removeAttribute('marker-end');
                }
            }
        } else if ((this.dragMode === 'dependency') && this.tempLine) {
            // Get source task for cursor arrow rotation
            const sourceTask = this.tasks.find(t => t.id === this.selectedNode);
            if (sourceTask) {
                this.updateCursorArrow(e.clientX, e.clientY, sourceTask);

                // Update line from source to cursor (A → B drag direction)
                // Arrow follows hand motion for intuitive UX
                this.tempLine.setAttribute('x1', sourceTask.x);
                this.tempLine.setAttribute('y1', sourceTask.y);
                this.tempLine.setAttribute('x2', pt.x);
                this.tempLine.setAttribute('y2', pt.y);
            }
        } else if (this.dragMode === 'canvas') {
            // Calculate delta in screen coordinates (stable)
            const screenDx = e.clientX - this.dragStart.x;
            const screenDy = e.clientY - this.dragStart.y;

            // Convert screen pixels to SVG units for viewBox movement
            // Account for zoom: when zoomed in, panning is slower (more precise)
            // when zoomed out, panning is faster (cover more ground)
            const svg = document.getElementById('canvas');
            const actualViewBoxWidth = this.viewBox.width / this.zoomLevel; // Current rendered viewBox size
            const scale = actualViewBoxWidth / svg.clientWidth; // SVG units per screen pixel
            const svgDx = screenDx * scale;
            const svgDy = screenDy * scale;

            // Move viewBox (opposite direction: drag right = look left)
            this.viewBox.x -= svgDx;
            this.viewBox.y -= svgDy;

            // Update dragStart for next frame (screen coords)
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.render();
        }
    },

    onCanvasMouseUp(e) {
        // End image resizing
        if (this.imageResizing) {
            this.imageResizing = null;
            this.saveToStorage();
            e.preventDefault();
            return;
        }

        // Handle arrow dot drag finish
        if (this.arrowDotDrag.active) {
            this.finishArrowDotDrag();
            e.preventDefault();
            return;
        }

        // Handle curve dot drag finish
        if (this.curveDotDrag.active) {
            this.finishCurveDotDrag();
            e.preventDefault();
            return;
        }

        if (this.dragMode === 'dependency') {
            // Use elementFromPoint to find what's actually under cursor (not e.target)
            const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
            const targetNode = elementUnderCursor ? elementUnderCursor.closest('.task-node') : null;
            if (targetNode && this.tempLine) {
                const targetId = parseInt(targetNode.dataset.id);

                // Check if dragging FROM a selected node (multi-source mode)
                if (this.selectedTaskIds.has(this.selectedNode)) {
                    // Source is selected (with others): all selected → target
                    // target depends on each selected node
                    this.selectedTaskIds.forEach(sourceId => {
                        if (sourceId !== targetId) {
                            this.addDependency({ dependentId: targetId, prerequisiteId: sourceId });
                        }
                    });
                } else if (this.selectedTaskIds.has(targetId)) {
                    // Target is selected (with others): source → all selected
                    // each selected depends on source
                    this.selectedTaskIds.forEach(depId => {
                        if (depId !== this.selectedNode) {
                            this.addDependency({ dependentId: depId, prerequisiteId: this.selectedNode });
                        }
                    });
                } else {
                    // Single source/target mode: source → target
                    if (targetId !== this.selectedNode) {
                        this.addDependency({ dependentId: targetId, prerequisiteId: this.selectedNode });
                    }
                }
            }
            this.removeTempLine();
        } else if (this.dragMode === 'reparent') {
            // Complete reparent: Make target a child of source
            const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
            const targetNode = elementUnderCursor ? elementUnderCursor.closest('.task-node') : null;

            if (targetNode && this.tempLine) {
                // Dropped on another task → Reparent
                const targetId = parseInt(targetNode.dataset.id);

                // Reparent target to source (source becomes parent of target)
                // Drag from A to B = A becomes parent of B
                if (targetId !== this.selectedNode) {
                    this.reparentTask({ taskId: targetId, newParentId: this.selectedNode });
                }
            } else if (!targetNode && this.tempLine) {
                // Dropped on empty space → Create child task at cursor position
                const pt = this.getSVGPoint(e);

                // DEFENSIVE: Validate coordinates
                if (this.validateTaskCoordinates({ x: pt.x, y: pt.y })) {
                    this.createChildAtPosition({
                        parentId: this.selectedNode,
                        x: pt.x,
                        y: pt.y
                    });
                }
            }

            // Clean up visual elements
            this.removeTempLine();
            const previewGhost = document.getElementById('preview-ghost-node');
            if (previewGhost) previewGhost.remove();
        } else if (this.dragMode === 'reparent-pending') {
            // Ctrl+click without dragging - don't interfere, let click event handle multi-select
            // Don't do anything here, just clear the dragMode
        } else if (this.dragMode === 'subtree-pending') {
            // Shift+click without dragging - clear pending mode
            // Don't do anything here, just clear the dragMode
        } else if (this.dragMode === 'subtree' && this.selectedNode !== null) {
            const task = this.tasks.find(t => t.id === this.selectedNode);
            if (task) {
                const movedDistance = Math.sqrt(
                    Math.pow(task.x - this.dragOriginalPos.x, 2) +
                    Math.pow(task.y - this.dragOriginalPos.y, 2)
                );

                // Save to storage if we actually moved (snapshot was saved in mousedown)
                if (movedDistance >= this.INTERACTION.DRAG_THRESHOLD_PX) {
                    // Update timestamps for all moved nodes in the subtree
                    this.draggedSubtree.forEach(nodeId => {
                        this.updateConnectedArrowsTimestamps(nodeId);
                    });

                    this.saveToStorage();
                } else {
                    // Didn't move enough - remove the snapshot we created in mousedown
                    if (this.undoStack.length > 0) {
                        this.undoStack.pop();
                    }
                }
            }

            // Clean up subtree drag state
            this.draggedSubtree = [];
            this.subtreeOriginalPositions = {};
        } else if (this.dragMode === 'node' && this.selectedNode !== null) {
            const task = this.tasks.find(t => t.id === this.selectedNode);
            if (task) {
                const movedDistance = Math.sqrt(
                    Math.pow(task.x - this.dragOriginalPos.x, 2) +
                    Math.pow(task.y - this.dragOriginalPos.y, 2)
                );

                // Save to storage if we actually moved (snapshot was saved in mousedown)
                if (movedDistance >= this.INTERACTION.DRAG_THRESHOLD_PX) {
                    // Update timestamps for all connected arrows to prioritize them
                    // If multi-select, update all selected nodes; otherwise just the moved node
                    if (this.selectedTaskIds.has(this.selectedNode) && this.selectedTaskIds.size > 1) {
                        this.selectedTaskIds.forEach(taskId => {
                            this.updateConnectedArrowsTimestamps(taskId);
                        });
                    } else {
                        this.updateConnectedArrowsTimestamps(this.selectedNode);
                    }

                    this.saveToStorage();
                } else {
                    // Didn't move enough - remove the snapshot we created in mousedown
                    if (this.undoStack.length > 0) {
                        this.undoStack.pop();
                    }
                }
            }
        } else if (this.dragMode === 'canvas') {
            // Don't create undo snapshot for canvas panning - it's a viewport navigation
            // action, not a content modification. Creating a snapshot would clear the
            // redo stack, preventing users from redoing after panning to look around.
            // Use debounced save to prevent performance issues from frequent localStorage writes
            this.debouncedSaveToStorage(500);
        } else if (this.dragMode === 'box-select' && this.boxSelectStart) {
            // Complete box selection
            const pt = this.getSVGPoint(e);
            const minX = Math.min(this.boxSelectStart.x, pt.x);
            const minY = Math.min(this.boxSelectStart.y, pt.y);
            const maxX = Math.max(this.boxSelectStart.x, pt.x);
            const maxY = Math.max(this.boxSelectStart.y, pt.y);

            // Find all nodes whose centers fall within the box
            const selectedInBox = this.tasks.filter(task => {
                return !task.hidden && task.x >= minX && task.x <= maxX && task.y >= minY && task.y <= maxY;
            });

            // Add to selection (additive - Shift+drag means add to existing selection)
            selectedInBox.forEach(task => {
                this.selectedTaskIds.add(task.id);
            });

            // Remove the selection box visual
            const boxElement = document.querySelector('#box-selection-rect');
            if (boxElement) boxElement.remove();

            // Render to show highlights on selected nodes
            this.render();
        }

        // Clear selection when clicking canvas (not when panning)
        const wasCanvasDrag = this.dragMode === 'canvas';

        // Remove custom cursor arrow if it exists
        this.removeCursorArrow();

        // Clear snap lines
        this.activeSnapLines = [];

        this.dragMode = null;
        this.selectedNode = null;
        this.isBoxSelecting = false;
        this.boxSelectStart = null;

        // Clear arrow attachment copy state
        if (this._attachmentCopyHoverTimer) {
            clearTimeout(this._attachmentCopyHoverTimer);
            this._attachmentCopyHoverTimer = null;
        }
        this._attachmentCopyHoverTarget = null;
        this._attachmentCopyApplied = false;
        this._attachmentCopyOriginal = null;

        if (wasCanvasDrag) {
            // Only clear selection if we didn't actually pan (click without movement)
            const pt = this.getSVGPoint(e);
            const panDistance = Math.sqrt(
                Math.pow(pt.x - this.dragStartOriginal.x, 2) +
                Math.pow(pt.y - this.dragStartOriginal.y, 2)
            );

            // If pan distance < threshold, treat as a click on canvas and clear selection
            if (panDistance < this.INTERACTION.DRAG_THRESHOLD_PX) {
                this.selectedTaskIds.clear();
                this.selectedLine = null;
                this.render();
            }
        }
        document.getElementById('canvas-container').classList.remove('dragging');
    },

    /**
     * Calculate bounding box for a group of selected nodes
     * Used for multi-select alignment snapping
     * @param {Set<number>} taskIds - Set of task IDs to calculate bounding box for
     * @returns {{left, right, top, bottom, centerX, centerY, width, height}} Bounding box
     */
    calculateMultiSelectBoundingBox(taskIds) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        taskIds.forEach(taskId => {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            const dims = this.calculateTaskDimensions(task);
            const left = task.x - dims.width / 2;
            const right = task.x + dims.width / 2;
            const top = task.y - dims.height / 2;
            const bottom = task.y + dims.height / 2;

            minX = Math.min(minX, left);
            maxX = Math.max(maxX, right);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, bottom);
        });

        return {
            left: minX,
            right: maxX,
            top: minY,
            bottom: maxY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            width: maxX - minX,
            height: maxY - minY
        };
    },

    /**
     * Start resizing an image node
     * @param {number} taskId - Task ID
     * @param {string} corner - Corner being dragged ('se', 'sw', 'ne', 'nw')
     * @param {MouseEvent} e - Mouse event
     */
    startImageResize(taskId, corner, e) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.imageId) return;

        this.imageResizing = {
            taskId: taskId,
            corner: corner,
            startPoint: this.getSVGPoint(e),
            originalWidth: task.imageWidth,
            originalHeight: task.imageHeight,
            aspectRatio: task.imageWidth / task.imageHeight
        };

        // Save snapshot for undo
        this.saveSnapshot(`Resize image`);
    },

    /**
     * Save original arrow attachments before copying (for revert)
     * @param {number} draggedId - ID of node being dragged
     */
    saveOriginalArrowAttachments(draggedId) {
        const draggedTask = this.tasks.find(t => t.id === draggedId);
        if (!draggedTask) return;

        this._attachmentCopyOriginal = {
            taskId: draggedId,
            customAttachPoints: JSON.parse(JSON.stringify(draggedTask.customAttachPoints || {})),
            customSourcePoints: JSON.parse(JSON.stringify(draggedTask.customSourcePoints || {}))
        };
    },

    /**
     * Revert arrow attachments to original state
     * @param {number} draggedId - ID of node being dragged
     */
    revertArrowAttachments(draggedId) {
        if (!this._attachmentCopyOriginal || this._attachmentCopyOriginal.taskId !== draggedId) {
            return;
        }

        const draggedTask = this.tasks.find(t => t.id === draggedId);
        if (!draggedTask) return;

        draggedTask.customAttachPoints = JSON.parse(JSON.stringify(this._attachmentCopyOriginal.customAttachPoints));
        draggedTask.customSourcePoints = JSON.parse(JSON.stringify(this._attachmentCopyOriginal.customSourcePoints));

        this.showToast('↩️ Reverted arrow attachments', 'info', 1500);
    },

    /**
     * Handle arrow attachment copying when hovering dragged node over another node
     * Copies both target points (where arrows land) and source points (where arrows start)
     * @param {number} draggedId - ID of node being dragged
     * @param {number} hoveredId - ID of node being hovered over
     */
    handleArrowAttachmentHoverCopy(draggedId, hoveredId) {
        const draggedTask = this.tasks.find(t => t.id === draggedId);
        const hoveredTask = this.tasks.find(t => t.id === hoveredId);

        if (!draggedTask || !hoveredTask) {
            return;
        }

        // Save original state before first copy
        if (!this._attachmentCopyOriginal) {
            this.saveOriginalArrowAttachments(draggedId);
        }

        let copiedCount = 0;

        // Process matching parent relationships (arrows coming INTO both nodes)
        const draggedParents = [draggedTask.mainParent, ...draggedTask.otherParents].filter(p => p !== null);
        const hoveredParents = [hoveredTask.mainParent, ...hoveredTask.otherParents].filter(p => p !== null);
        const sharedParents = draggedParents.filter(p => hoveredParents.includes(p));

        sharedParents.forEach(parentId => {
            const parent = this.tasks.find(t => t.id === parentId);
            if (!parent) return;

            // Copy TARGET point (where arrow lands on child)
            let targetPoint;
            if (hoveredTask.customAttachPoints && hoveredTask.customAttachPoints[parentId]) {
                targetPoint = hoveredTask.customAttachPoints[parentId];
            } else {
                const hoveredEndpoint = this.getArrowEndpoint(parent, hoveredTask, 'target');
                const hoveredDims = this.calculateTaskDimensions(hoveredTask);
                targetPoint = this.constrainToRectEdge(
                    hoveredEndpoint.x, hoveredEndpoint.y,
                    hoveredTask.x, hoveredTask.y,
                    hoveredDims.width, hoveredDims.height
                );
            }

            if (!draggedTask.customAttachPoints) {
                draggedTask.customAttachPoints = {};
            }
            draggedTask.customAttachPoints[parentId] = JSON.parse(JSON.stringify(targetPoint));
            copiedCount++;

            // Copy SOURCE point (where arrow starts from parent)
            let sourcePoint;
            if (parent.customSourcePoints && parent.customSourcePoints[hoveredId]) {
                sourcePoint = parent.customSourcePoints[hoveredId];
            } else {
                const parentStartpoint = this.getArrowEndpoint(parent, hoveredTask, 'source');
                const parentDims = this.calculateTaskDimensions(parent);
                sourcePoint = this.constrainToRectEdge(
                    parentStartpoint.x, parentStartpoint.y,
                    parent.x, parent.y,
                    parentDims.width, parentDims.height
                );
            }

            if (!parent.customSourcePoints) {
                parent.customSourcePoints = {};
            }
            parent.customSourcePoints[draggedId] = JSON.parse(JSON.stringify(sourcePoint));
            copiedCount++;
        });

        // Process matching child relationships (arrows going OUT from both nodes)
        const sharedChildren = draggedTask.children.filter(c => hoveredTask.children.includes(c));

        sharedChildren.forEach(childId => {
            const child = this.tasks.find(t => t.id === childId);
            if (!child) return;

            // Copy TARGET point (where arrow lands on child)
            let targetPoint;
            if (child.customAttachPoints && child.customAttachPoints[hoveredId]) {
                targetPoint = child.customAttachPoints[hoveredId];
            } else {
                const childTargetEndpoint = this.getArrowEndpoint(hoveredTask, child, 'target');
                const childDims = this.calculateTaskDimensions(child);
                targetPoint = this.constrainToRectEdge(
                    childTargetEndpoint.x, childTargetEndpoint.y,
                    child.x, child.y,
                    childDims.width, childDims.height
                );
            }

            if (!child.customAttachPoints) {
                child.customAttachPoints = {};
            }
            child.customAttachPoints[draggedId] = JSON.parse(JSON.stringify(targetPoint));
            copiedCount++;

            // Copy SOURCE point (where arrow starts from parent)
            let sourcePoint;
            if (hoveredTask.customSourcePoints && hoveredTask.customSourcePoints[childId]) {
                sourcePoint = hoveredTask.customSourcePoints[childId];
            } else {
                const draggedStartpoint = this.getArrowEndpoint(hoveredTask, child, 'source');
                const hoveredDims = this.calculateTaskDimensions(hoveredTask);
                sourcePoint = this.constrainToRectEdge(
                    draggedStartpoint.x, draggedStartpoint.y,
                    hoveredTask.x, hoveredTask.y,
                    hoveredDims.width, hoveredDims.height
                );
            }

            if (!draggedTask.customSourcePoints) {
                draggedTask.customSourcePoints = {};
            }
            draggedTask.customSourcePoints[childId] = JSON.parse(JSON.stringify(sourcePoint));
            copiedCount++;
        });

        // Show feedback with prominent toast and visual flash effect
        if (copiedCount > 0) {
            // Bigger, longer toast for better visibility
            this.showToast(`✨ Copied ${copiedCount} arrow attachment${copiedCount > 1 ? 's' : ''} from hover target!`, 'success', 3000);

            // Add flash effect to dragged node
            const draggedNodeElement = document.querySelector(`.task-node[data-id="${draggedId}"]`);
            if (draggedNodeElement) {
                draggedNodeElement.classList.add('attachment-copied-flash');
                setTimeout(() => {
                    draggedNodeElement.classList.remove('attachment-copied-flash');
                }, 600); // Remove after animation completes
            }
        } else {
            this.showToast('⚠️ No matching relationships to copy', 'warning', 2000);
        }
    },

};

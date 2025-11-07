/**
 * @module rendering/render
 * @order 24
 * @category rendering
 *
 * Main render orchestrator - renders all tasks, links, and UI elements
 *
 * IMPORTANT: This file was RE-EXTRACTED from the original monolithic task-tree.html
 * to fix missing features (multiline text, proper positioning, etc.)
 * Date: 2025-11-01
 */

export const RenderMixin = {
    /**
     * PERF: Invalidate cached dimensions when task changes
     * Call this when task title is edited
     */
    invalidateDimensionCache(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            delete task._cachedDims;
        }
    },

    /**
     * PERF: Invalidate all dimension caches
     * Call this after bulk operations
     */
    invalidateAllDimensionCaches() {
        this.tasks.forEach(task => {
            delete task._cachedDims;
        });
    },

    /**
     * PERF: Viewport culling - check if task is visible in current viewport
     * Adds margin for smooth scrolling
     */
    isTaskVisible(task, viewportBounds) {
        if (!task || task.hidden) return false;

        // Get task dimensions (cached if possible)
        const dims = task._cachedDims || this.calculateTaskDimensions(task);
        if (!task._cachedDims) task._cachedDims = dims;

        const halfWidth = dims.width / 2;
        const halfHeight = dims.height / 2;

        // Check if task rectangle intersects viewport (with margin)
        return !(task.x + halfWidth < viewportBounds.left ||
                 task.x - halfWidth > viewportBounds.right ||
                 task.y + halfHeight < viewportBounds.top ||
                 task.y - halfHeight > viewportBounds.bottom);
    },

    render() {
        const svg = document.getElementById('canvas');
        const linksGroup = document.getElementById('links');
        const nodesGroup = document.getElementById('nodes');

        linksGroup.innerHTML = '';
        nodesGroup.innerHTML = '';

        // Apply zoom via viewBox
        const viewBoxWidth = this.viewBox.width / this.zoomLevel;
        const viewBoxHeight = this.viewBox.height / this.zoomLevel;
        const viewBoxX = this.viewBox.x - (viewBoxWidth - this.viewBox.width) / 2;
        const viewBoxY = this.viewBox.y - (viewBoxHeight - this.viewBox.height) / 2;

        svg.setAttribute('viewBox',
            `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
        );

        // Render grid (if enabled)
        this.renderGrid();

        // PERF: Calculate visible viewport bounds for culling
        // Add margin so tasks smoothly appear when scrolling (increased for smoother experience)
        const VIEWPORT_MARGIN = 1000;
        const viewportBounds = {
            left: viewBoxX - VIEWPORT_MARGIN,
            right: viewBoxX + viewBoxWidth + VIEWPORT_MARGIN,
            top: viewBoxY - VIEWPORT_MARGIN,
            bottom: viewBoxY + viewBoxHeight + VIEWPORT_MARGIN
        };

        // PERF: Filter to only visible tasks (massive performance gain!)
        const visibleTasks = this.tasks.filter(task =>
            !task.hidden && this.isTaskVisible(task, viewportBounds)
        );
        const visibleTaskIds = new Set(visibleTasks.map(t => t.id));

        // Trigger background loading for uncached images (non-blocking)
        // Track loading images to prevent duplicate requests
        if (!this._loadingImages) this._loadingImages = new Set();

        visibleTasks.forEach(task => {
            if (task.imageId && !this.imageCache.has(task.imageId) && !this._loadingImages.has(task.imageId)) {
                // Mark as loading to prevent duplicate requests
                this._loadingImages.add(task.imageId);

                // Image not cached - trigger async load in background
                this.getImage(task.imageId).then(() => {
                    this._loadingImages.delete(task.imageId);
                    // Re-render once when image loads to show it
                    requestAnimationFrame(() => this.render());
                }).catch(err => {
                    this._loadingImages.delete(task.imageId);
                    console.warn(`Failed to load image ${task.imageId}:`, err);
                });
            }
        });

        // Find ALL working tasks (one per root graph) using the log for O(1) lookup
        const workingTasks = [];
        Object.values(this.workingTasksByRoot).forEach(taskId => {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                workingTasks.push(task);
            }
        });
        const workingTask = workingTasks[0]; // For status bar display, use first working task

        // Build combined lists for all working tasks
        const workingAncestors = [];
        const incompleteChildren = [];

        workingTasks.forEach(wt => {
            // Add ancestors of this working task
            const ancestors = this.getAncestors(wt.id);
            ancestors.forEach(id => {
                if (!workingAncestors.includes(id)) {
                    workingAncestors.push(id);
                }
            });

            // Add incomplete children of this working task
            wt.children.forEach(childId => {
                const child = this.tasks.find(t => t.id === childId);
                if (child && child.status !== 'done' && !incompleteChildren.includes(childId)) {
                    incompleteChildren.push(childId);
                }
            });
        });

        // Get golden paths for ALL working tasks (multi-project support)
        const allAncestorPaths = new Set();
        const allDirectChildren = [];
        const workingTaskIds = new Set();

        workingTasks.forEach(wt => {
            workingTaskIds.add(wt.id);

            // Build ancestor path for this working task
            allAncestorPaths.add(wt.id);  // Include working task itself
            let current = wt.mainParent;
            while (current !== null) {
                allAncestorPaths.add(current);
                const parent = this.tasks.find(t => t.id === current);
                current = parent ? parent.mainParent : null;
            }

            // Collect direct children with completion status
            wt.children.forEach(childId => {
                const child = this.tasks.find(t => t.id === childId);
                allDirectChildren.push({
                    id: childId,
                    isDone: child ? child.status === 'done' : false,
                    parentWorkingId: wt.id
                });
            });
        });

        const goldenPath = {
            workingTaskIds,
            ancestorPath: allAncestorPaths,
            directChildren: allDirectChildren
        };

        // PERF: Render links - only for visible tasks
        visibleTasks.forEach(task => {
            // DEFENSIVE: Skip tasks with invalid coordinates
            if (!isFinite(task.x) || !isFinite(task.y)) {
                console.warn(`Task ${task.id} has invalid coordinates: (${task.x}, ${task.y}) - skipping render`);
                return;
            }

            // Main parent link with hit detection
            if (task.mainParent !== null) {
                const parent = this.tasks.find(t => t.id === task.mainParent);
                if (parent && !parent.hidden) {
                    // DIAGNOSTIC: Log if either task has NaN
                    if (!isFinite(parent.x) || !isFinite(parent.y)) {
                        console.error(`[RENDER] Parent task ${parent.id} ("${parent.title}") has NaN coords: (${parent.x}, ${parent.y})`);
                    }
                    if (!isFinite(task.x) || !isFinite(task.y)) {
                        console.error(`[RENDER] Child task ${task.id} ("${task.title}") has NaN coords: (${task.x}, ${task.y})`);
                    }

                    // Get curve control points (simple array of {x, y})
                    const controlPoints = task.curveControlPoints?.[task.mainParent];
                    const hasControlPoints = controlPoints && Array.isArray(controlPoints) && controlPoints.length > 0;

                    // Get arrow start point (source)
                    const arrowStart = this.getArrowEndpoint(parent, task, 'source');

                    // Get arrow endpoint (target)
                    const isDraggingThisArrow = this.arrowDotDrag.active &&
                                                 this.arrowDotDrag.taskId === task.id &&
                                                 this.arrowDotDrag.relatedTaskId === task.mainParent;

                    let arrowEnd;
                    if (isDraggingThisArrow) {
                        const dims = this.calculateTaskDimensions(task);
                        arrowEnd = this.denormalizeEdgePosition(
                            this.arrowDotDrag.edge,
                            this.arrowDotDrag.normalized,
                            task.x,
                            task.y,
                            dims.width,
                            dims.height
                        );
                    } else {
                        arrowEnd = this.getArrowEndpoint(parent, task, 'target');
                    }

                    // Determine control points to use (live drag, orthogonal, or saved)
                    const isDraggingThisCurve = this.curveDotDrag.active &&
                                                this.curveDotDrag.taskId === task.id &&
                                                this.curveDotDrag.parentId === task.mainParent;

                    let effectiveControlPoints;

                    // Get effective routing mode from PARENT (arrows go FROM parent TO children)
                    const taskRoutingMode = this.getEffectiveArrowRouting(parent);

                    if (taskRoutingMode === 'orthogonal') {
                        // Orthogonal routing: calculate waypoints
                        const parentDims = this.calculateTaskDimensions(parent);
                        const taskDims = this.calculateTaskDimensions(task);

                        const startEdge = this.getEdgeFromPoint(arrowStart.x, arrowStart.y, parent.x, parent.y, parentDims.width, parentDims.height);
                        const endEdge = this.getEdgeFromPoint(arrowEnd.x, arrowEnd.y, task.x, task.y, taskDims.width, taskDims.height);

                        const waypoints = this.calculateOrthogonalPath(
                            arrowStart.x, arrowStart.y, startEdge,
                            arrowEnd.x, arrowEnd.y, endEdge,
                            parent.x, parent.y, task.x, task.y
                        );

                        // Remove first and last points (they're the start/end positions)
                        effectiveControlPoints = waypoints.slice(1, -1);
                    } else if (isDraggingThisCurve) {
                        effectiveControlPoints = this.curveDotDrag.controlPoints;
                    } else {
                        effectiveControlPoints = controlPoints;
                    }

                    // Create hit line and visible line
                    const useStraightSegments = taskRoutingMode === 'orthogonal';
                    const hitLine = this.createMultiSegmentCurvedLine(
                        arrowStart.x, arrowStart.y,
                        arrowEnd.x, arrowEnd.y,
                        effectiveControlPoints,
                        'link parent-hit',
                        useStraightSegments,
                        this.orthogonalCornerRadius
                    );
                    hitLine.dataset.type = 'parent';
                    hitLine.dataset.taskId = task.id;
                    hitLine.dataset.parentId = task.mainParent;
                    hitLine.style.pointerEvents = 'stroke';
                    hitLine.style.cursor = 'pointer';
                    if (this.selectedLine && this.selectedLine.type === 'parent' &&
                        this.selectedLine.taskId === task.id && this.selectedLine.parentId === task.mainParent) {
                        hitLine.classList.add('selected');
                    }
                    linksGroup.appendChild(hitLine);

                    // Create visible line
                    const line = this.createMultiSegmentCurvedLine(
                        arrowStart.x, arrowStart.y,
                        arrowEnd.x, arrowEnd.y,
                        effectiveControlPoints,
                        'link parent-visible',
                        useStraightSegments,
                        this.orthogonalCornerRadius
                    );
                    line.style.pointerEvents = 'none';
                    // ⭐ NEW: Add data attributes so we can update during animation
                    line.dataset.type = 'parent';
                    line.dataset.taskId = task.id;
                    line.dataset.parentId = task.mainParent;

                    // Check if this link is part of the golden ancestor path
                    // Link should be golden if task is on the path (working task or any ancestor)
                    const isAncestorPath =
                        goldenPath.ancestorPath.has(task.id) &&
                        goldenPath.ancestorPath.has(task.mainParent);

                    // Check if this is a link to a direct child of ANY working task
                    const childInfo = goldenPath.directChildren.find(c => c.id === task.id);
                    const isDirectChild = childInfo && goldenPath.workingTaskIds.has(task.mainParent);

                    // Apply path styling
                    if (isAncestorPath) {
                        line.classList.add('golden-path-ancestor');
                        line.setAttribute('marker-end', 'url(#arrowhead-golden)');
                        line.style.stroke = '#f59e0b';  // Golden amber
                        line.style.strokeWidth = '3';
                        line.style.filter = 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))';
                    } else if (isDirectChild) {
                        // Color based on completion status
                        if (childInfo.isDone) {
                            line.classList.add('golden-path-child-done');
                            line.setAttribute('marker-end', 'url(#arrowhead-green)');
                            line.style.stroke = '#4caf50';  // Green (same as done tasks)
                            line.style.strokeWidth = '2.5';
                        } else {
                            line.classList.add('golden-path-child-incomplete');
                            line.setAttribute('marker-end', 'url(#arrowhead-red)');
                            line.style.stroke = '#f44336';  // Red (same as incomplete children indicator)
                            line.style.strokeWidth = '2.5';
                        }
                    } else if (task.status === 'done') {
                        // Child is done - use green arrow
                        line.setAttribute('marker-end', 'url(#arrowhead-green)');
                        line.style.stroke = '#4caf50';  // Green
                    } else {
                        line.setAttribute('marker-end', 'url(#arrowhead)'); // Normal arrow
                    }

                    if (this.selectedLine && this.selectedLine.type === 'parent' &&
                        this.selectedLine.taskId === task.id && this.selectedLine.parentId === task.mainParent) {
                        line.classList.add('selected');
                    }
                    linksGroup.appendChild(line);
                }
            }

            // Other parent links with hit detection
            task.otherParents.forEach(parentId => {
                const parent = this.tasks.find(t => t.id === parentId);
                if (parent && !parent.hidden) {
                    // Get curve control points
                    const controlPoints = task.curveControlPoints?.[parentId];

                    // Get arrow start point (source)
                    const arrowStart = this.getArrowEndpoint(parent, task, 'source');

                    // Get arrow endpoint (target)
                    const isDraggingThisArrow = this.arrowDotDrag.active &&
                                                 this.arrowDotDrag.taskId === task.id &&
                                                 this.arrowDotDrag.relatedTaskId === parentId;

                    let arrowEnd;
                    if (isDraggingThisArrow) {
                        const dims = this.calculateTaskDimensions(task);
                        arrowEnd = this.denormalizeEdgePosition(
                            this.arrowDotDrag.edge,
                            this.arrowDotDrag.normalized,
                            task.x,
                            task.y,
                            dims.width,
                            dims.height
                        );
                    } else {
                        arrowEnd = this.getArrowEndpoint(parent, task, 'target');
                    }

                    // Determine control points to use (live drag, orthogonal, or saved)
                    const isDraggingThisCurve = this.curveDotDrag.active &&
                                                this.curveDotDrag.taskId === task.id &&
                                                this.curveDotDrag.parentId === parentId;

                    let effectiveControlPoints;

                    // Get effective routing mode from PARENT (arrows go FROM parent TO children)
                    const taskRoutingMode = this.getEffectiveArrowRouting(parent);

                    if (taskRoutingMode === 'orthogonal') {
                        // Orthogonal routing: calculate waypoints
                        const parentDims = this.calculateTaskDimensions(parent);
                        const taskDims = this.calculateTaskDimensions(task);

                        const startEdge = this.getEdgeFromPoint(arrowStart.x, arrowStart.y, parent.x, parent.y, parentDims.width, parentDims.height);
                        const endEdge = this.getEdgeFromPoint(arrowEnd.x, arrowEnd.y, task.x, task.y, taskDims.width, taskDims.height);

                        const waypoints = this.calculateOrthogonalPath(
                            arrowStart.x, arrowStart.y, startEdge,
                            arrowEnd.x, arrowEnd.y, endEdge,
                            parent.x, parent.y, task.x, task.y
                        );

                        // Remove first and last points (they're the start/end positions)
                        effectiveControlPoints = waypoints.slice(1, -1);
                    } else if (isDraggingThisCurve) {
                        effectiveControlPoints = this.curveDotDrag.controlPoints;
                    } else {
                        effectiveControlPoints = controlPoints;
                    }

                    // Create hit line
                    const useStraightSegments = taskRoutingMode === 'orthogonal';
                    const hitLine = this.createMultiSegmentCurvedLine(
                        arrowStart.x, arrowStart.y,
                        arrowEnd.x, arrowEnd.y,
                        effectiveControlPoints,
                        'link other-parent-hit',
                        useStraightSegments,
                        this.orthogonalCornerRadius
                    );
                    hitLine.dataset.type = 'parent';
                    hitLine.dataset.taskId = task.id;
                    hitLine.dataset.parentId = parentId;
                    hitLine.style.pointerEvents = 'stroke';
                    hitLine.style.cursor = 'pointer';
                    if (this.selectedLine && this.selectedLine.type === 'parent' &&
                        this.selectedLine.taskId === task.id && this.selectedLine.parentId === parentId) {
                        hitLine.classList.add('selected');
                    }
                    linksGroup.appendChild(hitLine);

                    // Create visible line
                    const line = this.createMultiSegmentCurvedLine(
                        arrowStart.x, arrowStart.y,
                        arrowEnd.x, arrowEnd.y,
                        effectiveControlPoints,
                        'link other-parent',
                        useStraightSegments,
                        this.orthogonalCornerRadius
                    );

                    // Color arrow based on task status
                    if (task.status === 'done') {
                        line.setAttribute('marker-end', 'url(#arrowhead-green)');
                        line.style.stroke = '#4caf50';  // Green
                    } else {
                        line.setAttribute('marker-end', 'url(#arrowhead)'); // Normal arrow
                    }

                    line.style.pointerEvents = 'none';
                    // ⭐ NEW: Add data attributes so we can update during animation
                    line.dataset.type = 'parent';
                    line.dataset.taskId = task.id;
                    line.dataset.parentId = parentId;
                    if (this.selectedLine && this.selectedLine.type === 'parent' &&
                        this.selectedLine.taskId === task.id && this.selectedLine.parentId === parentId) {
                        line.classList.add('selected');
                    }
                    linksGroup.appendChild(line);
                }
            });

            // Dependency links with better hit detection
            task.dependencies.forEach(depId => {
                const dep = this.tasks.find(t => t.id === depId);
                if (dep && !dep.hidden) {
                    // Create wider invisible line for easier clicking
                    const hitLine = this.createLine(dep.x, dep.y, task.x, task.y, 'link dependency-hit');
                    hitLine.dataset.type = 'dependency';
                    hitLine.dataset.from = task.id;
                    hitLine.dataset.to = depId;
                    hitLine.style.pointerEvents = 'stroke';
                    // Check if selected
                    if (this.selectedLine && this.selectedLine.type === 'dependency' &&
                        this.selectedLine.from === task.id && this.selectedLine.to === depId) {
                        hitLine.classList.add('selected');
                    }
                    linksGroup.appendChild(hitLine);

                    // Create visible line (non-interactive) with arrow at edge
                    // Calculate arrow endpoint at rectangle edge for pixel-perfect positioning
                    // Use dynamic dimensions to account for multiline nodes
                    const { width: rectWidth, height: rectHeight } = this.calculateTaskDimensions(task);
                    const arrowEnd = this.getLineEndAtRectEdge(dep.x, dep.y, task.x, task.y, rectWidth, rectHeight);

                    const line = this.createLine(dep.x, dep.y, arrowEnd.x, arrowEnd.y, 'link dependency');
                    line.setAttribute('marker-end', 'url(#arrowhead)');
                    // Make visible line NOT clickable - all interaction through hitLine
                    line.style.pointerEvents = 'none';
                    // ⭐ NEW: Add data attributes (using visual direction: dep → task)
                    line.dataset.type = 'dependency';
                    line.dataset.from = depId;  // Source (prerequisite)
                    line.dataset.to = task.id;  // Target (dependent)
                    // Check if selected
                    if (this.selectedLine && this.selectedLine.type === 'dependency' &&
                        this.selectedLine.from === task.id && this.selectedLine.to === depId) {
                        line.classList.add('selected');
                    }
                    linksGroup.appendChild(line);
                }
            });
        });

        // ========================================
        // Prioritize golden path and selected lines (render on top)
        // ========================================
        // Re-append golden path and selected lines to move them to the top of z-order
        const goldenPathLines = linksGroup.querySelectorAll('.golden-path-ancestor, .golden-path-child-done, .golden-path-child-incomplete');
        const selectedLines = linksGroup.querySelectorAll('.selected');

        // Re-append golden path lines (moves them to end = top of z-order)
        goldenPathLines.forEach(line => linksGroup.appendChild(line));

        // Re-append selected lines last (so they're on top of everything including golden path)
        selectedLines.forEach(line => linksGroup.appendChild(line));

        // PERF: Render nodes - only for visible tasks
        visibleTasks.forEach(task => {
            // DEFENSIVE: Skip tasks with invalid coordinates
            if (!isFinite(task.x) || !isFinite(task.y)) {
                console.warn(`Task ${task.id} ("${task.title}") has invalid coordinates - skipping node render`);
                return;
            }

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('task-node');
            g.dataset.id = task.id;

            // ⭐ NEW: Position group with transform (GPU-accelerated, animatable!)
            g.setAttribute('transform', `translate(${task.x}, ${task.y})`);

            if (task.status === 'done') g.classList.add('done');
            if (task.status === 'in_progress') g.classList.add('in-progress');
            if (task.currentlyWorking) g.classList.add('working');
            if (this.suggestedNextTaskId === task.id) g.classList.add('suggested-next');
            if (workingAncestors.includes(task.id)) g.classList.add('parent-of-working');
            if (incompleteChildren.includes(task.id)) g.classList.add('incomplete-child-of-working');
            if (task.hidden) g.classList.add('hidden');
            if (this.selectedTaskIds.has(task.id)) g.classList.add('selected');

            // Add visual indicator for "tied" nodes (with custom attachments) while dragging
            const hasCustomAttachments = (task.customAttachPoints && Object.keys(task.customAttachPoints).length > 0) ||
                                         (task.customSourcePoints && Object.keys(task.customSourcePoints).length > 0);
            if (this.dragMode === 'node' && this.selectedNode === task.id && hasCustomAttachments) {
                g.classList.add('tied');
            }

            // Determine display text (truncated or full)
            const isLongText = task.title.length > this.textLengthThreshold;
            const charsOverLimit = task.title.length - this.textLengthThreshold;
            // Only truncate if significantly over limit (5+ chars) and not expanded
            const shouldTruncate = charsOverLimit > 5;
            const shouldExpand = task.currentlyWorking || task.textLocked || (task.textExpanded && this.selectedTaskIds.has(task.id));
            let displayTitle = task.title;
            let isTruncated = false;

            if (shouldTruncate && !shouldExpand) {
                // Normal truncation
                displayTitle = task.title.substring(0, this.textLengthThreshold) + '...';
                isTruncated = true;
            }

            // Calculate rect dimensions
            let rectWidth, rectHeight, lines;
            const verticalPadding = 10; // Used for both image and text nodes
            let isOverflowing = false; // Used in text rendering later
            let actualRenderedLines = 0; // Used in text rendering later
            const padding = this.nodePadding; // Used in text rendering later

            // For image nodes, size based on original image dimensions
            if (task.imageId && task.imageWidth && task.imageHeight) {
                const imagePadding = 20;
                rectWidth = task.imageWidth + imagePadding * 2;
                rectHeight = task.imageHeight + imagePadding * 2;
                lines = []; // No text lines for image nodes
            } else {
                // For text nodes, calculate based on text
                const charWidth = this.charWidth;
                const minWidth = this.minNodeWidth;
                // When multiline is enabled, always use full text for wrapping (maxNodeHeight handles limiting)
                // When multiline is disabled, use truncated displayTitle
                // When editing, always use full text
                const textForSizing = this.editingTaskId === task.id || this.enableMultiline ? task.title : displayTitle;

                // Wrap text into lines based on max width (subtract padding to ensure text fits within available space)
                const availableWidth = this.maxNodeWidth - padding * 2;
                lines = this.wrapText(textForSizing, availableWidth, charWidth, this.wordWrap);

                // Calculate width: minimum of (maxNodeWidth OR longest line width OR minWidth)
                const longestLineWidth = Math.max(...lines.map(line => line.length * charWidth + padding * 2));
                rectWidth = Math.max(minWidth, Math.min(this.maxNodeWidth, longestLineWidth));

                // Calculate height: lines * lineHeight + vertical padding
                const calculatedHeight = lines.length * this.lineHeight + verticalPadding * 2;

                // Determine if we should bypass maxNodeHeight and show full text
                // - When editing: show all lines for easier editing
                // - When selected: show all lines so user can see full text and use lock button
                // - When already expanded (currentlyWorking, textLocked, etc.): show all lines
                const shouldFullyExpand = this.editingTaskId === task.id || this.selectedTaskIds.has(task.id) || shouldExpand;

                // Check if text overflows BEFORE calculating rectHeight
                isOverflowing = this.maxNodeHeight > 0 && !shouldFullyExpand && calculatedHeight > this.maxNodeHeight;

                // Calculate how many lines will actually be rendered when overflowing
                actualRenderedLines = lines.length;
                if (isOverflowing) {
                    const availableHeightForOverflow = this.maxNodeHeight - verticalPadding * 2;
                    actualRenderedLines = Math.floor(availableHeightForOverflow / this.lineHeight);
                }

                // Size rectangle based on actual rendered content (not blindly using maxNodeHeight)
                rectHeight = (this.maxNodeHeight > 0 && !shouldFullyExpand)
                    ? actualRenderedLines * this.lineHeight + verticalPadding * 2
                    : calculatedHeight;
            }

            // ⭐ NEW: Rect positioned RELATIVE to group (centered at 0,0)
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', -rectWidth / 2);
            rect.setAttribute('y', -rectHeight / 2);
            rect.setAttribute('width', rectWidth);
            rect.setAttribute('height', rectHeight);

            // Set fill based on priority with diagonal stripe patterns
            // Use inline style to override CSS rules
            if (task.priority === 'high') {
                rect.style.fill = this.darkMode ? 'url(#priority-high-dark)' : 'url(#priority-high-light)';
            } else if (task.priority === 'medium') {
                rect.style.fill = this.darkMode ? 'url(#priority-medium-dark)' : 'url(#priority-medium-light)';
            }
            // For normal priority, let CSS handle it (no inline style needed)

            g.appendChild(rect);

            // Render image if task has one
            if (task.imageId) {
                this.renderTaskImage(g, task, rectWidth, rectHeight);
            }

            // Add link badge if task has links
            if (task.links && task.links.length > 0) {
                const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                badgeGroup.classList.add('link-badge');

                // Position badge at top-right corner INSIDE the node bounds
                const badgeWidth = 20;  // Fixed width for just the emoji
                const badgeHeight = 14;
                const badgeX = rectWidth / 2 - badgeWidth - 1;  // 1px margin from right edge
                const badgeY = -rectHeight / 2 + 3;              // 3px margin from top edge

                // Invisible clickable area behind the emoji
                const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                clickArea.setAttribute('x', badgeX);
                clickArea.setAttribute('y', badgeY);
                clickArea.setAttribute('width', badgeWidth);
                clickArea.setAttribute('height', badgeHeight);
                clickArea.setAttribute('fill', 'none');
                clickArea.setAttribute('opacity', '0');
                clickArea.style.cursor = 'pointer';
                clickArea.style.pointerEvents = 'all';
                badgeGroup.appendChild(clickArea);

                // Badge text (just emoji, no visible background or count)
                const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                badgeText.setAttribute('x', badgeX + badgeWidth / 2);
                badgeText.setAttribute('y', badgeY + 12);  // 2px lower for better visual alignment
                badgeText.setAttribute('fill', '#2196f3');  // Blue color for link
                badgeText.setAttribute('font-size', '12');  // Slightly larger since no background
                badgeText.setAttribute('text-anchor', 'middle');
                badgeText.setAttribute('pointer-events', 'none');  // Let clicks pass through to clickArea
                badgeText.setAttribute('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))');
                badgeText.textContent = '🔗';
                badgeGroup.appendChild(badgeText);

                // Tooltip showing all links
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                const linkList = task.links.map(url => '• ' + this.shortenURL(url)).join('\n');
                title.textContent = `Links (${task.links.length}):\n${linkList}`;
                badgeGroup.appendChild(title);

                // Make badge clickable
                badgeGroup.style.cursor = 'pointer';
                badgeGroup.style.pointerEvents = 'all';

                badgeGroup.onclick = (evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();

                    if (task.links.length === 1) {
                        // Single link - open directly
                        this.openLink(task.links[0]);
                    } else {
                        // Multiple links - show dropdown menu at badge location
                        const rect = clickArea.getBoundingClientRect();
                        this.showLinksDropdown(task.id, rect.left, rect.bottom);
                    }
                };

                g.appendChild(badgeGroup);
            }

            // Show input if editing, otherwise show text
            if (this.editingTaskId === task.id) {
                const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                // Cover full rectangle width for better editing experience
                foreignObject.setAttribute('x', -rectWidth / 2);
                foreignObject.setAttribute('y', -rectHeight / 2 + 5);
                foreignObject.setAttribute('width', rectWidth);
                foreignObject.setAttribute('height', rectHeight - 10);
                // Prevent clicks on editing container from bubbling
                foreignObject.onmousedown = (e) => e.stopPropagation();
                foreignObject.onclick = (e) => e.stopPropagation();

                const textarea = document.createElement('textarea');
                textarea.id = 'edit-input';
                textarea.value = task.title;
                textarea.rows = Math.max(2, lines.length); // Dynamic rows based on content
                textarea.style.cssText = `width: 100%; max-width: none; height: 100%; border: 2px solid #007bff; border-radius: 4px; padding: 4px 8px; font-size: 14px; font-family: ${this.fontFamily}; text-align: left; box-sizing: border-box; resize: none; overflow: auto;`;
                textarea.onkeydown = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        // Plain Enter = save and finish editing
                        this.finishEditing(true);
                        e.preventDefault();
                    } else if (e.key === 'Escape') {
                        // Escape = cancel editing
                        this.finishEditing(false);
                        e.preventDefault();
                    }
                    // Shift+Enter creates newline (default textarea behavior when we don't preventDefault)
                    e.stopPropagation();
                };
                // Prevent clicks on textarea from bubbling to canvas handlers
                textarea.onmousedown = (e) => e.stopPropagation();
                textarea.onclick = (e) => e.stopPropagation();
                textarea.onblur = () => this.finishEditing(true);
                // Dynamically resize box as user types
                textarea.oninput = () => this.resizeEditingBox();

                foreignObject.appendChild(textarea);
                g.appendChild(foreignObject);
            } else {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', 0);
                text.setAttribute('text-anchor', 'start'); // Left-aligned for multiline
                text.setAttribute('xml:space', 'preserve'); // Preserve all whitespace (tabs, spaces)
                text.style.cursor = 'pointer';
                text.style.fontFamily = this.fontFamily;
                text.style.fontWeight = this.fontWeight;

                // Calculate how many lines actually fit within rectHeight
                const availableHeight = rectHeight - verticalPadding * 2;
                const maxVisibleLines = Math.floor(availableHeight / this.lineHeight);
                // Render all visible lines (truncate last line if overflowing)
                const linesToRender = Math.min(lines.length, maxVisibleLines);

                // Render only the lines that fit within the rectangle
                for (let index = 0; index < linesToRender; index++) {
                    let lineText = lines[index];

                    // If this is the last visible line and text is overflowing, truncate it
                    if (isOverflowing && index === linesToRender - 1) {
                        // Truncate to make room for "..." (remove last 3 chars, add ellipsis)
                        lineText = lineText.length > 3 ? lineText.slice(0, -3) + '...' : lineText + '...';
                    }

                    // Parse markdown tokens from line
                    const tokens = this.parseMarkdown(lineText);
                    const yOffset = -rectHeight / 2 + verticalPadding + this.lineHeight * (index + 0.75);
                    const xStart = -rectWidth / 2 + padding; // Left edge + padding (horizontal)

                    // Render each token as a separate tspan with appropriate styling
                    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
                        const token = tokens[tokenIndex];
                        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        tspan.setAttribute('xml:space', 'preserve'); // Preserve whitespace in this token

                        // Use createTextNode instead of textContent to preserve exact whitespace
                        const textNode = document.createTextNode(token.text);
                        tspan.appendChild(textNode);

                        // Position: first token uses x, subsequent tokens use dx=0
                        if (tokenIndex === 0) {
                            tspan.setAttribute('x', xStart);
                            tspan.setAttribute('y', yOffset);
                        } else {
                            tspan.setAttribute('dx', '0'); // Continue on same line
                        }

                        // Apply styling based on token format
                        if (token.format === 'bold') {
                            tspan.style.fontWeight = 'bold';
                        } else if (token.format === 'italic') {
                            tspan.style.fontStyle = 'italic';
                        } else if (token.format === 'code') {
                            tspan.style.fontFamily = "'Courier New', monospace";
                            tspan.style.fill = '#d63384'; // Pink/magenta for code
                        } else if (token.format === 'link') {
                            tspan.style.fill = '#0d6efd'; // Blue for links
                            tspan.style.textDecoration = 'underline';
                            tspan.style.cursor = 'pointer';
                            // Add click handler for link
                            tspan.addEventListener('click', (e) => {
                                e.stopPropagation(); // Don't trigger task selection
                                window.open(token.url, '_blank');
                            });
                        }
                        // 'normal' format gets default styling

                        text.appendChild(tspan);
                    }
                }

                // Add status emoji indicator positioned to the left of the node
                if (task.currentlyWorking || task.status === 'done') {
                    const statusEmoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    statusEmoji.textContent = task.currentlyWorking ? '🔄' : '✅';
                    // Position to the left of the rectangle
                    statusEmoji.setAttribute('x', -rectWidth / 2 - 20); // 20px left of node edge
                    statusEmoji.setAttribute('y', 0); // Vertically centered
                    statusEmoji.setAttribute('font-size', '16');
                    statusEmoji.setAttribute('text-anchor', 'middle');
                    statusEmoji.setAttribute('dominant-baseline', 'middle');
                    statusEmoji.setAttribute('pointer-events', 'none'); // Don't interfere with node clicks
                    statusEmoji.style.opacity = '0.63'; // More transparent to be subtle
                    g.appendChild(statusEmoji);
                }


                // Add dblclick handler directly to text element
                text.addEventListener('dblclick', (e) => {
                    if (this.editingTaskId === null) {
                        if (e.shiftKey) {
                            // Shift+double click: hide/show the node itself within its parent
                            this.toggleHiddenSelf(task.id);
                        } else {
                            // Normal double click: edit task name
                            this.startEditing(task.id);
                        }
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
                g.appendChild(text);
            }

            // Add lock button for expanded text (only if long text and expanded)
            if (isLongText && shouldExpand) {
                const lockSize = 16;
                // ⭐ NEW: Relative to group center
                const lockX = -rectWidth / 2 - 20;  // 20px to the left of box
                const lockY = 0;  // Vertically centered on node

                // Create a group for the lock button
                const lockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                lockGroup.classList.add('lock-button');
                lockGroup.style.cursor = task.currentlyWorking ? 'not-allowed' : 'pointer';
                lockGroup.onclick = (e) => {
                    e.stopPropagation();
                    if (!task.currentlyWorking) {
                        this.toggleTextLock(task.id);
                    }
                };

                // Background circle for visibility
                const lockBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                lockBg.setAttribute('cx', lockX);
                lockBg.setAttribute('cy', lockY);
                lockBg.setAttribute('r', 14);
                lockBg.setAttribute('fill', this.darkMode ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)');
                lockBg.setAttribute('stroke', this.darkMode ? '#4a5568' : '#ccc');
                lockBg.setAttribute('stroke-width', '1');
                lockGroup.appendChild(lockBg);

                // Lock icon (emoji)
                const lockText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                lockText.setAttribute('x', lockX);
                lockText.setAttribute('y', lockY);
                lockText.setAttribute('font-size', lockSize);
                lockText.setAttribute('text-anchor', 'middle');
                lockText.setAttribute('dominant-baseline', 'middle');
                lockText.textContent = task.textLocked ? '🔒' : '🔓';
                lockText.style.opacity = task.currentlyWorking ? '0.4' : '1';
                lockGroup.appendChild(lockText);

                g.appendChild(lockGroup);
            }

            // Add priority badge (colored dot in top-left corner)
            if (task.priority && task.priority !== 'normal') {
                const dotRadius = 6;
                const dotX = -rectWidth / 2 + dotRadius + 3;  // 3px from left edge
                const dotY = -rectHeight / 2 + dotRadius + 3;  // 3px from top edge

                const priorityDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                priorityDot.setAttribute('cx', dotX);
                priorityDot.setAttribute('cy', dotY);
                priorityDot.setAttribute('r', dotRadius);
                priorityDot.setAttribute('fill', task.priority === 'high' ? '#f44336' : '#ff9800');  // Red for high, Orange for medium
                priorityDot.setAttribute('stroke', this.darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)');
                priorityDot.setAttribute('stroke-width', '1.5');
                priorityDot.style.filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))';

                g.appendChild(priorityDot);
            }

            // Add time tracking badge (bottom-right corner)
            if (task.timeTracking && task.timeTracking.totalSeconds > 0) {
                const timeText = this.formatDurationCompact(task.timeTracking.totalSeconds);
                const badgeText = `⏱️ ${timeText}`;

                // Position in bottom-right corner (text only, no background)
                const badgeX = rectWidth / 2 - 5;  // Right edge with small margin
                const badgeY = rectHeight / 2 - 5;  // Bottom edge with small margin

                // Badge text only (no background rectangle)
                const badgeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                badgeLabel.setAttribute('x', badgeX);
                badgeLabel.setAttribute('y', badgeY);
                badgeLabel.setAttribute('text-anchor', 'end');  // Align right
                badgeLabel.setAttribute('dominant-baseline', 'baseline');
                badgeLabel.setAttribute('font-size', '9');
                badgeLabel.setAttribute('font-weight', '400');
                badgeLabel.setAttribute('fill', this.darkMode ? '#999' : '#888');
                badgeLabel.setAttribute('opacity', '0.8');
                badgeLabel.classList.add('time-badge');
                badgeLabel.textContent = badgeText;

                g.appendChild(badgeLabel);
            }

            // Add hidden children indicator badge
            const hiddenCount = this.getHiddenChildrenCount(task.id);
            if (hiddenCount > 0) {
                const badgeRadius = 12;
                // ⭐ NEW: Relative to group center
                const badgeX = rectWidth / 2 - 5;
                const badgeY = -rectHeight / 2 - 5;

                // Create a group for the badge
                const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                badgeGroup.style.cursor = 'pointer';
                badgeGroup.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleHidden(task.id);
                };

                // Badge circle
                const badgeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                badgeCircle.setAttribute('cx', badgeX);
                badgeCircle.setAttribute('cy', badgeY);
                badgeCircle.setAttribute('r', badgeRadius);
                badgeCircle.classList.add('hidden-indicator');
                badgeGroup.appendChild(badgeCircle);

                // Badge text
                const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                badgeText.setAttribute('x', badgeX);
                badgeText.setAttribute('y', badgeY);
                badgeText.textContent = `+${hiddenCount}`;
                badgeText.classList.add('hidden-indicator-text');
                badgeGroup.appendChild(badgeText);

                g.appendChild(badgeGroup);
            }

            // Add general click handler on node for selection
            g.style.cursor = 'pointer';
            g.addEventListener('click', (e) => {
                // Don't handle clicks on interactive elements
                if (e.target.closest('.lock-button') ||
                    e.target.closest('.hidden-indicator') ||
                    e.target.closest('.link-badge')) {
                    return;
                }

                // Don't interfere with Ctrl+click (multi-select), Alt+click (delete), or Shift+click (reserved)
                // Let the main canvas click handler handle those
                if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
                    return;
                }

                // Select the node (this updates lastWorkingTaskId if task is working)
                this.selectNode(task.id);

                // Also expand text if truncated
                if (isLongText && !shouldExpand) {
                    this.expandText(task.id);
                }
            });

            // Track hover for priority changes with P key
            g.addEventListener('mouseenter', () => {
                this.hoveredTaskId = task.id;
            });
            g.addEventListener('mouseleave', () => {
                this.hoveredTaskId = null;
            });

            nodesGroup.appendChild(g);
        });

        // ========================================
        // Arrow Snap Points - Render dots and snap indicators
        // ========================================
        if (this.hoveredArrowDot || this.arrowDotDrag.active) {
            // Determine which dot to render
            let dotToRender = this.arrowDotDrag.active ? {
                type: this.arrowDotDrag.dotType,
                taskId: this.arrowDotDrag.taskId,
                parentId: this.arrowDotDrag.relatedTaskId,
                childId: this.arrowDotDrag.relatedChildId
            } : this.hoveredArrowDot;

            if (dotToRender) {
                const isSourceDot = dotToRender.type === 'source';

                // For source dots: taskId is parent, childId is child
                // For target dots: taskId is child, parentId is parent
                const dotOwner = this.tasks.find(t => t.id === dotToRender.taskId);
                const relatedTask = isSourceDot ?
                    this.tasks.find(t => t.id === dotToRender.childId) :
                    this.tasks.find(t => t.id === dotToRender.parentId);

                if (dotOwner && relatedTask) {
                    // Get dot position
                    let dotPos;
                    if (this.arrowDotDrag.active) {
                        // During drag: use LIVE drag position
                        const dims = this.calculateTaskDimensions(dotOwner);
                        dotPos = this.denormalizeEdgePosition(
                            this.arrowDotDrag.edge,
                            this.arrowDotDrag.normalized,
                            dotOwner.x,
                            dotOwner.y,
                            dims.width,
                            dims.height
                        );
                    } else {
                        // When hovering: use saved or default position
                        if (isSourceDot) {
                            // Source dot on parent node
                            dotPos = this.getArrowEndpoint(dotOwner, relatedTask, 'source');
                        } else {
                            // Target dot on child node
                            dotPos = this.getArrowEndpoint(relatedTask, dotOwner, 'target');
                        }
                    }

                    // Check if this arrow has a custom position (for coloring)
                    const hasCustomPosition = isSourceDot ?
                        !!(dotOwner.customSourcePoints && dotOwner.customSourcePoints[dotToRender.childId]) :
                        !!(dotOwner.customAttachPoints && dotOwner.customAttachPoints[dotToRender.parentId]);

                    // Render the arrow dot
                    const relatedId = isSourceDot ? dotToRender.childId : dotToRender.parentId;
                    const dot = this.renderArrowDot(
                        dotPos.x, dotPos.y,
                        dotToRender.type,
                        dotToRender.taskId,
                        relatedId,
                        this.hoveredArrowDot !== null,
                        this.arrowDotDrag.active,
                        hasCustomPosition
                    );

                    if (dot) {
                        // Append to nodesGroup so it renders OVER nodes
                        nodesGroup.appendChild(dot);
                    }

                    // Render snap indicators if dragging
                    if (this.arrowDotDrag.active) {
                        const dims = this.calculateTaskDimensions(dotOwner);
                        const indicators = this.renderSnapIndicators(
                            dotOwner.x, dotOwner.y,
                            dims.width, dims.height,
                            this.arrowDotDrag.edge,
                            this.arrowDotDrag.normalized
                        );

                        indicators.forEach(indicator => {
                            // Append to nodesGroup so it renders OVER nodes
                            nodesGroup.appendChild(indicator);
                        });
                    }
                }
            }
        }

        // ========================================
        // Curve Control Points - Miro-style dots
        // ========================================
        if (this.hoveredCurveDot || this.curveDotDrag.active) {
            let dotsToRender = [];
            let taskId, parentId;

            if (this.curveDotDrag.active) {
                // During drag: show all control points being edited
                taskId = this.curveDotDrag.taskId;
                parentId = this.curveDotDrag.parentId;
                const controlPoints = this.curveDotDrag.controlPoints || [];
                dotsToRender = controlPoints.map((cp, idx) => ({
                    x: cp.x,
                    y: cp.y,
                    index: idx,
                    isBeingDragged: idx === this.curveDotDrag.editingIndex,
                    isExisting: true
                }));
            } else if (this.hoveredCurveDot) {
                // Hovering: show all existing control points + potential new point
                taskId = this.hoveredCurveDot.taskId;
                parentId = this.hoveredCurveDot.parentId;
                const { controlPoints, nearestPointIndex, addNewPoint, mouseX, mouseY } = this.hoveredCurveDot;

                // Add existing control points
                if (controlPoints && Array.isArray(controlPoints)) {
                    dotsToRender = controlPoints.map((cp, idx) => ({
                        x: cp.x,
                        y: cp.y,
                        index: idx,
                        isHovered: idx === nearestPointIndex,
                        isExisting: true
                    }));
                }

                // Add potential new point (gray preview)
                if (addNewPoint) {
                    dotsToRender.push({
                        x: mouseX,
                        y: mouseY,
                        index: -1,
                        isHovered: true,
                        isExisting: false
                    });
                }
            }

            // Render all dots
            for (const dotInfo of dotsToRender) {
                // Size
                let size = 5;
                if (dotInfo.isBeingDragged) {
                    size = 8;
                } else if (dotInfo.isHovered) {
                    size = 6;
                }

                // Color
                let fillColor = '#9e9e9e';  // Gray default
                if (dotInfo.isBeingDragged) {
                    fillColor = '#2196f3';  // Blue when dragging
                } else if (dotInfo.isExisting) {
                    fillColor = '#9c27b0';  // Purple for existing points
                }

                // Render dot
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', dotInfo.x);
                dot.setAttribute('cy', dotInfo.y);
                dot.setAttribute('r', size);
                dot.setAttribute('fill', fillColor);
                dot.setAttribute('stroke', 'white');
                dot.setAttribute('stroke-width', '2');
                dot.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');
                dot.classList.add('curve-dot');
                dot.style.pointerEvents = 'all';
                dot.style.cursor = this.curveDotDrag.active ? 'grabbing' : 'grab';

                // Add data attributes for double-click reset handler
                dot.setAttribute('data-link-type', 'parent');
                dot.setAttribute('data-task-id', taskId);
                dot.setAttribute('data-related-id', parentId);
                dot.setAttribute('data-point-index', dotInfo.index); // Which control point this is

                nodesGroup.appendChild(dot);
            }
        }

        // ========================================
        // Alignment Snap Guide Lines
        // ========================================
        if (this.activeSnapLines && this.activeSnapLines.length > 0) {
            this.activeSnapLines.forEach(snapLine => {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

                if (snapLine.type === 'vertical') {
                    // Vertical snap line (spans entire viewport height)
                    line.setAttribute('x1', snapLine.position);
                    line.setAttribute('y1', this.viewBox.y);
                    line.setAttribute('x2', snapLine.position);
                    line.setAttribute('y2', this.viewBox.y + this.viewBox.height);
                } else if (snapLine.type === 'horizontal') {
                    // Horizontal snap line (spans entire viewport width)
                    line.setAttribute('x1', this.viewBox.x);
                    line.setAttribute('y1', snapLine.position);
                    line.setAttribute('x2', this.viewBox.x + this.viewBox.width);
                    line.setAttribute('y2', snapLine.position);
                }

                // Style: semi-transparent, dashed line
                // Use different colors for edge vs center alignment
                const isCenter = snapLine.alignType === 'center';
                line.setAttribute('stroke', isCenter ? '#ff6b6b' : '#4dabf7');
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('stroke-dasharray', '5,5');
                line.setAttribute('opacity', '0.6');
                line.setAttribute('pointer-events', 'none');

                nodesGroup.appendChild(line);
            });
        }

        // Render off-screen indicators for working tasks
        this.renderOffscreenIndicators();

        // Update FPS counter
        this.updateFpsCounter();
    },

    /**
     * Update FPS counter and lag detection
     * Called at the end of every render()
     */
    updateFpsCounter() {
        if (!this.showFpsCounter) {
            // Remove FPS counter if disabled
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.remove();
            }
            return;
        }

        const now = performance.now();

        // Calculate current FPS
        if (this.fpsLastFrameTime > 0) {
            const frameDuration = now - this.fpsLastFrameTime;
            this.fpsCurrentFps = frameDuration > 0 ? Math.round(1000 / frameDuration) : 0;
        }
        this.fpsLastFrameTime = now;

        // Track frame times for average FPS (last 1 second)
        this.fpsFrameTimes.push(now);

        // Remove frame times older than 1 second
        this.fpsFrameTimes = this.fpsFrameTimes.filter(time => now - time < 1000);

        // Calculate average FPS over last second
        if (this.fpsFrameTimes.length > 1) {
            const timeSpan = this.fpsFrameTimes[this.fpsFrameTimes.length - 1] - this.fpsFrameTimes[0];
            this.fpsAverageFps = timeSpan > 0 ? Math.round((this.fpsFrameTimes.length - 1) * 1000 / timeSpan) : 0;
        }

        // Create or update FPS counter overlay
        let fpsElement = document.getElementById('fps-counter');
        if (!fpsElement) {
            fpsElement = document.createElement('div');
            fpsElement.id = 'fps-counter';
            fpsElement.style.position = 'fixed';
            fpsElement.style.top = '10px';
            fpsElement.style.right = '10px';
            fpsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            fpsElement.style.color = '#fff';
            fpsElement.style.padding = '8px 12px';
            fpsElement.style.borderRadius = '4px';
            fpsElement.style.fontFamily = 'monospace';
            fpsElement.style.fontSize = '12px';
            fpsElement.style.zIndex = '10000';
            fpsElement.style.pointerEvents = 'none';
            fpsElement.style.userSelect = 'none';
            document.body.appendChild(fpsElement);
        }

        // Determine if lagging
        const isLagging = this.fpsAverageFps < this.fpsLagThreshold && this.fpsAverageFps > 0;

        // Update content
        const lagIndicator = isLagging ? ' ⚠️ LAG' : '';
        const fpsColor = isLagging ? '#ff5252' : '#4caf50';

        fpsElement.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; gap: 12px;">
                    <span>FPS:</span>
                    <span style="color: ${fpsColor}; font-weight: bold;">${this.fpsCurrentFps}</span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 12px;">
                    <span>Avg:</span>
                    <span style="color: ${fpsColor}; font-weight: bold;">${this.fpsAverageFps}</span>
                </div>
                ${isLagging ? '<div style="color: #ff5252; font-weight: bold; text-align: center; margin-top: 4px;">⚠️ LAG DETECTED</div>' : ''}
            </div>
        `;
    },

    /**
     * Render task image in SVG node
     * @param {SVGElement} g - Group element to append to
     * @param {Object} task - Task object with imageId
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     */
    renderTaskImage(g, task, rectWidth, rectHeight) {
        try {
            // Get image blob URL from cache (already pre-loaded in render())
            const blobUrl = this.imageCache.get(task.imageId);

            if (!blobUrl) {
                console.warn(`[render.js] Image not in cache for task ${task.id}: ${task.imageId}`);
                return;
            }

            // Use original image dimensions (already stored in task)
            const imageWidth = task.imageWidth || 200;
            const imageHeight = task.imageHeight || 150;

            // Create SVG image element at original size
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('x', -imageWidth / 2);
            image.setAttribute('y', -imageHeight / 2);
            image.setAttribute('width', imageWidth);
            image.setAttribute('height', imageHeight);
            image.setAttribute('href', blobUrl);
            image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            image.style.pointerEvents = 'none';  // Don't block mouse events

            g.appendChild(image);

            // Add resize handles for selected image nodes
            if (this.selectedTaskIds.has(task.id)) {
                this.addResizeHandles(g, task, imageWidth, imageHeight);
            }
        } catch (error) {
            console.error(`[render.js] Failed to render image for task ${task.id}:`, error);
        }
    },

    /**
     * Add resize handles to image node corners
     * @param {SVGElement} g - Group element
     * @param {Object} task - Task object
     * @param {number} imageWidth - Current image width
     * @param {number} imageHeight - Current image height
     */
    addResizeHandles(g, task, imageWidth, imageHeight) {
        const handleSize = 12;
        const handleOffset = 4;

        // Corner positions
        const corners = [
            { x: imageWidth / 2 + handleOffset, y: imageHeight / 2 + handleOffset, cursor: 'nwse-resize', corner: 'se' },  // SE
            { x: -imageWidth / 2 - handleOffset, y: imageHeight / 2 + handleOffset, cursor: 'nesw-resize', corner: 'sw' }, // SW
            { x: imageWidth / 2 + handleOffset, y: -imageHeight / 2 - handleOffset, cursor: 'nesw-resize', corner: 'ne' }, // NE
            { x: -imageWidth / 2 - handleOffset, y: -imageHeight / 2 - handleOffset, cursor: 'nwse-resize', corner: 'nw' }  // NW
        ];

        corners.forEach(({ x, y, cursor, corner }) => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('cx', x);
            handle.setAttribute('cy', y);
            handle.setAttribute('r', handleSize / 2);
            handle.setAttribute('fill', '#2196f3');
            handle.setAttribute('stroke', 'white');
            handle.setAttribute('stroke-width', '2');
            handle.style.cursor = cursor;
            handle.style.pointerEvents = 'all';
            handle.classList.add('resize-handle');
            handle.dataset.taskId = task.id;
            handle.dataset.corner = corner;

            g.appendChild(handle);
        });
    },
};

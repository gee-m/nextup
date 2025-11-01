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
    render() {
        const svg = document.getElementById('canvas');
        const linksGroup = document.getElementById('links');
        const nodesGroup = document.getElementById('nodes');

        linksGroup.innerHTML = '';
        nodesGroup.innerHTML = '';

        // Apply zoom via viewBox
        const viewBoxWidth = this.viewBox.width / this.zoomLevel;
        const viewBoxHeight = this.viewBox.height / this.zoomLevel;
        svg.setAttribute('viewBox',
            `${this.viewBox.x - (viewBoxWidth - this.viewBox.width) / 2} ` +
            `${this.viewBox.y - (viewBoxHeight - this.viewBox.height) / 2} ` +
            `${viewBoxWidth} ${viewBoxHeight}`
        );

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

        // Render links
        this.tasks.forEach(task => {
            if (task.hidden) return;

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

                    // Create wider invisible line for easier clicking
                    // Arrow goes from parent to child (follows drag direction A→B)
                    const hitLine = this.createLine(parent.x, parent.y, task.x, task.y, 'link parent-hit');
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

                    // Create visible line (non-interactive) with arrow at edge
                    // Calculate arrow endpoint at rectangle edge for pixel-perfect positioning
                    // Use child dimensions for arrow endpoint (arrow points to child)
                    const { width: rectWidth, height: rectHeight } = this.calculateTaskDimensions(task);
                    const arrowEnd = this.getLineEndAtRectEdge(parent.x, parent.y, task.x, task.y, rectWidth, rectHeight);

                    const line = this.createLine(parent.x, parent.y, arrowEnd.x, arrowEnd.y, 'link parent-visible');
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
                    // Create wider invisible line for easier clicking
                    // Arrow goes from parent to child (follows drag direction A→B)
                    const hitLine = this.createLine(parent.x, parent.y, task.x, task.y, 'link other-parent-hit');
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

                    // Create visible line (non-interactive) with arrow at edge
                    // Calculate arrow endpoint at rectangle edge for pixel-perfect positioning
                    // Use child dimensions for arrow endpoint (arrow points to child)
                    const { width: rectWidth, height: rectHeight } = this.calculateTaskDimensions(task);
                    const arrowEnd = this.getLineEndAtRectEdge(parent.x, parent.y, task.x, task.y, rectWidth, rectHeight);

                    const line = this.createLine(parent.x, parent.y, arrowEnd.x, arrowEnd.y, 'link other-parent');
                    line.setAttribute('marker-end', 'url(#arrowhead)'); // Arrow pointing to child
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

        // Render nodes
        this.tasks.forEach(task => {
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
            if (task.currentlyWorking) g.classList.add('working');
            if (workingAncestors.includes(task.id)) g.classList.add('parent-of-working');
            if (incompleteChildren.includes(task.id)) g.classList.add('incomplete-child-of-working');
            if (task.hidden) g.classList.add('hidden');
            if (this.selectedTaskIds.has(task.id)) g.classList.add('selected');

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

            // Calculate rect dimensions with multiline support
            const padding = this.nodePadding;
            const charWidth = this.charWidth;
            const minWidth = this.minNodeWidth;
            // When multiline is enabled, always use full text for wrapping (maxNodeHeight handles limiting)
            // When multiline is disabled, use truncated displayTitle
            // When editing, always use full text
            const textForSizing = this.editingTaskId === task.id || this.enableMultiline ? task.title : displayTitle;

            // Wrap text into lines based on max width (subtract padding to ensure text fits within available space)
            const availableWidth = this.maxNodeWidth - padding * 2;
            const lines = this.wrapText(textForSizing, availableWidth, charWidth, this.wordWrap);

            // Calculate width: minimum of (maxNodeWidth OR longest line width OR minWidth)
            const longestLineWidth = Math.max(...lines.map(line => line.length * charWidth + padding * 2));
            const rectWidth = Math.max(minWidth, Math.min(this.maxNodeWidth, longestLineWidth));

            // Calculate height: lines * lineHeight + vertical padding
            // Use fixed vertical padding (not nodePadding which is for horizontal)
            const verticalPadding = 10;
            const calculatedHeight = lines.length * this.lineHeight + verticalPadding * 2;

            // Determine if we should bypass maxNodeHeight and show full text
            // - When editing: show all lines for easier editing
            // - When selected: show all lines so user can see full text and use lock button
            // - When already expanded (currentlyWorking, textLocked, etc.): show all lines
            const shouldFullyExpand = this.editingTaskId === task.id || this.selectedTaskIds.has(task.id) || shouldExpand;

            // Check if text overflows BEFORE calculating rectHeight
            const isOverflowing = this.maxNodeHeight > 0 && !shouldFullyExpand && calculatedHeight > this.maxNodeHeight;

            // Calculate how many lines will actually be rendered when overflowing
            let actualRenderedLines = lines.length;
            if (isOverflowing) {
                const availableHeightForOverflow = this.maxNodeHeight - verticalPadding * 2;
                actualRenderedLines = Math.floor(availableHeightForOverflow / this.lineHeight);
            }

            // Size rectangle based on actual rendered content (not blindly using maxNodeHeight)
            const rectHeight = (this.maxNodeHeight > 0 && !shouldFullyExpand)
                ? actualRenderedLines * this.lineHeight + verticalPadding * 2
                : calculatedHeight;

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

                    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    tspan.textContent = lineText; // No emoji prepended - now positioned separately
                    tspan.setAttribute('x', -rectWidth / 2 + padding); // Left edge + padding (horizontal)
                    // Vertical position: start from top + verticalPadding, add lineHeight per line
                    const yOffset = -rectHeight / 2 + verticalPadding + this.lineHeight * (index + 0.75);
                    tspan.setAttribute('y', yOffset);
                    text.appendChild(tspan);
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

        // Render off-screen indicators for working tasks
        this.renderOffscreenIndicators();
    },
};

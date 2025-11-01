/**
 * @module rendering/render
 * @order 24
 * @category rendering
 *
 * Main render orchestrator - renders all tasks, links, and UI elements
 *
 * The render() function:
 * 1. Sets up SVG viewBox for zoom
 * 2. Collects working tasks and their ancestors/children (golden path)
 * 3. Renders links:
 *    - Main parent links (with golden path styling)
 *    - Other parent links
 *    - Dependency links
 * 4. Renders nodes:
 *    - Task rectangles with priority patterns
 *    - Text or edit textarea
 *    - Status emoji (working/done)
 *    - Link badges
 *    - Priority dots
 *    - Hidden children badges
 *    - Lock button for expanded text
 * 5. Calls renderOffscreenIndicators()
 *
 * The render function uses helper methods from:
 * - GoldenPathMixin: getWorkingTaskPath()
 * - NodesMixin: calculateTaskDimensions()
 * - LinksMixin: createLine(), getLineEndAtRectEdge()
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

                    // Main parent link with hit detection
                    if (task.mainParent !== null) {
                        const parent = this.tasks.find(t => t.id === task.mainParent);
                        if (parent && !parent.hidden) {
                            // Create wider invisible line for easier clicking
                            const hitLine = this.createLine(parent.x, parent.y, task.x, task.y, 'link parent-hit');
                            hitLine.dataset.type = 'parent';
                            hitLine.dataset.taskId = task.id;
                            hitLine.dataset.parentId = task.mainParent;
                            hitLine.style.pointerEvents = 'stroke';
                            hitLine.style.cursor = 'pointer';
                            if (this.selectedLine && this.selectedLine.type === 'parent' &&
                                this.selectedLine.taskId === task.id && this.selectedLine.parentId === task.mainParent) {
                                hitLine.setAttribute('class', 'link parent-hit selected');
                            }
                            hitLine.addEventListener('click', (e) => {
                                e.stopPropagation();
                                this.selectLine({ type: 'parent', taskId: task.id, parentId: task.mainParent });
                            });
                            linksGroup.appendChild(hitLine);

                            // Create visible thin line on top
                            const visibleLine = this.createLine(parent.x, parent.y, task.x, task.y, 'link parent');
                            visibleLine.style.pointerEvents = 'none';

                            // Check if this link is part of the golden path
                            const isGoldenPath = goldenPath.ancestorPath.has(task.id) && goldenPath.ancestorPath.has(task.mainParent);

                            // Check if this is a direct child of a working task
                            const directChild = goldenPath.directChildren.find(c => c.id === task.id && c.parentWorkingId === task.mainParent);

                            if (isGoldenPath) {
                                // Golden path styling (working task → ancestors → root)
                                visibleLine.setAttribute('class', 'link parent golden-path');
                                visibleLine.setAttribute('marker-end', 'url(#arrowhead-golden)');
                            } else if (directChild) {
                                // Direct child of working task: red if incomplete, green if done
                                const childColor = directChild.isDone ? '#4caf50' : '#f44336';  // Green if done, red if incomplete
                                visibleLine.setAttribute('stroke', childColor);
                                visibleLine.setAttribute('stroke-width', '2');
                                visibleLine.setAttribute('marker-end', directChild.isDone ? 'url(#arrowhead-green)' : 'url(#arrowhead-red)');
                            } else {
                                // Regular parent link
                                visibleLine.setAttribute('marker-end', 'url(#arrowhead)');
                            }

                            linksGroup.appendChild(visibleLine);
                        }
                    }

                    // Other parent links (with hit detection)
                    if (task.otherParents) {
                        task.otherParents.forEach(parentId => {
                            const parent = this.tasks.find(t => t.id === parentId);
                            if (parent && !parent.hidden) {
                                // Hit detection line
                                const hitLine = this.createLine(parent.x, parent.y, task.x, task.y, 'link other-parent-hit');
                                hitLine.dataset.type = 'otherParent';
                                hitLine.dataset.taskId = task.id;
                                hitLine.dataset.parentId = parentId;
                                hitLine.style.pointerEvents = 'stroke';
                                hitLine.style.cursor = 'pointer';
                                if (this.selectedLine && this.selectedLine.type === 'otherParent' &&
                                    this.selectedLine.taskId === task.id && this.selectedLine.parentId === parentId) {
                                    hitLine.setAttribute('class', 'link other-parent-hit selected');
                                }
                                hitLine.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    this.selectLine({ type: 'otherParent', taskId: task.id, parentId });
                                });
                                linksGroup.appendChild(hitLine);

                                // Visible dashed line
                                const visibleLine = this.createLine(parent.x, parent.y, task.x, task.y, 'link other-parent');
                                visibleLine.style.pointerEvents = 'none';
                                linksGroup.appendChild(visibleLine);
                            }
                        });
                    }

                    // Dependencies (with hit detection)
                    if (task.dependencies) {
                        task.dependencies.forEach(depId => {
                            const dep = this.tasks.find(t => t.id === depId);
                            if (dep && !dep.hidden) {
                                // Hit detection line
                                const hitLine = this.createLine(task.x, task.y, dep.x, dep.y, 'link dependency-hit');
                                hitLine.dataset.type = 'dependency';
                                hitLine.dataset.from = task.id;
                                hitLine.dataset.to = depId;
                                hitLine.style.pointerEvents = 'stroke';
                                hitLine.style.cursor = 'pointer';
                                if (this.selectedLine && this.selectedLine.type === 'dependency' &&
                                    this.selectedLine.from === task.id && this.selectedLine.to === depId) {
                                    hitLine.setAttribute('class', 'link dependency-hit selected');
                                }
                                hitLine.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    this.selectLine({ type: 'dependency', from: task.id, to: depId });
                                });
                                linksGroup.appendChild(hitLine);

                                // Visible dashed line
                                const visibleLine = this.createLine(task.x, task.y, dep.x, dep.y, 'link dependency');
                                visibleLine.style.pointerEvents = 'none';
                                visibleLine.setAttribute('marker-end', 'url(#arrowhead)');
                                linksGroup.appendChild(visibleLine);
                            }
                        });
                    }
                });

                // Render tasks
                this.tasks.forEach(task => {
                    if (task.hidden) return;

                    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    g.setAttribute('class', 'task-node');
                    g.dataset.taskId = task.id;

                    // Calculate dimensions
                    const dims = this.calculateTaskDimensions(task);

                    // Rectangle
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', task.x);
                    rect.setAttribute('y', task.y);
                    rect.setAttribute('width', dims.width);
                    rect.setAttribute('height', dims.height);
                    rect.setAttribute('rx', '8');

                    // Apply status classes and priority fill
                    if (task.currentlyWorking) {
                        rect.classList.add('working');
                    } else if (task.status === 'done') {
                        rect.classList.add('done');
                    }

                    // Parent of working task (orange glow)
                    if (workingAncestors.includes(task.id)) {
                        rect.classList.add('parent-of-working');
                    }

                    // Incomplete child of working task (red border)
                    if (incompleteChildren.includes(task.id)) {
                        rect.classList.add('incomplete-child');
                    }

                    // Selection highlight
                    if (this.selectedTaskIds.has(task.id)) {
                        rect.classList.add('selected');
                    }

                    // Priority fill
                    if (task.priority && task.priority > 1 && task.status !== 'done') {
                        const pattern = task.priority === 3 ? 'priority-high' : 'priority-medium';
                        const suffix = this.darkMode ? '-dark' : '-light';
                        rect.setAttribute('fill', `url(#${pattern}${suffix})`);
                    }

                    g.appendChild(rect);

                    // Text rendering (or editing textarea)
                    if (this.editingTaskId === task.id) {
                        // Inline editing: show textarea
                        const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                        fo.setAttribute('x', task.x);
                        fo.setAttribute('y', task.y);
                        fo.setAttribute('width', dims.width);
                        fo.setAttribute('height', dims.height);

                        const textarea = document.createElement('textarea');
                        textarea.id = 'edit-textarea';
                        textarea.value = task.title;
                        textarea.style.width = '100%';
                        textarea.style.height = '100%';
                        textarea.style.padding = '5px';
                        textarea.style.fontSize = `${this.fontSize}px`;
                        textarea.style.fontFamily = this.fontFamily;
                        textarea.style.border = 'none';
                        textarea.style.outline = '2px solid #4caf50';
                        textarea.style.background = 'white';
                        textarea.style.resize = 'none';
                        textarea.style.boxSizing = 'border-box';

                        // Auto-focus and select all
                        setTimeout(() => {
                            textarea.focus();
                            textarea.select();
                        }, 0);

                        // Save on Enter, cancel on Escape
                        textarea.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                this.saveEdit();
                            } else if (e.key === 'Escape') {
                                this.cancelEdit();
                            }
                        });

                        fo.appendChild(textarea);
                        g.appendChild(fo);
                    } else {
                        // Normal text display
                        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        text.setAttribute('x', task.x + this.nodePadding);
                        text.setAttribute('y', task.y + dims.height / 2);
                        text.setAttribute('dominant-baseline', 'middle');
                        text.style.fontSize = `${this.fontSize}px`;
                        text.style.fontFamily = this.fontFamily;

                        // Truncate if needed
                        let displayText = task.title;
                        if (task.title.length > this.textLengthThreshold && !task.textExpanded) {
                            displayText = task.title.substring(0, this.textLengthThreshold) + '...';
                        }

                        text.textContent = displayText;
                        g.appendChild(text);

                        // Add lock button if text is expanded
                        if (task.textExpanded) {
                            const lockBtn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            lockBtn.setAttribute('x', task.x + dims.width - 20);
                            lockBtn.setAttribute('y', task.y + dims.height / 2);
                            lockBtn.setAttribute('dominant-baseline', 'middle');
                            lockBtn.setAttribute('text-anchor', 'middle');
                            lockBtn.setAttribute('class', 'lock-button');
                            lockBtn.textContent = '🔒';
                            lockBtn.style.cursor = 'pointer';
                            lockBtn.style.userSelect = 'none';
                            lockBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                task.textExpanded = false;
                                this.saveToStorage();
                                this.render();
                            });
                            g.appendChild(lockBtn);
                        }
                    }

                    // Status emoji (working/done)
                    const statusY = task.y - 5;
                    if (task.currentlyWorking) {
                        const statusEmoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        statusEmoji.setAttribute('x', task.x + dims.width / 2);
                        statusEmoji.setAttribute('y', statusY);
                        statusEmoji.setAttribute('text-anchor', 'middle');
                        statusEmoji.setAttribute('font-size', '18');
                        statusEmoji.textContent = '⚙️';
                        g.appendChild(statusEmoji);
                    } else if (task.status === 'done') {
                        const statusEmoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        statusEmoji.setAttribute('x', task.x + dims.width / 2);
                        statusEmoji.setAttribute('y', statusY);
                        statusEmoji.setAttribute('text-anchor', 'middle');
                        statusEmoji.setAttribute('font-size', '18');
                        statusEmoji.textContent = '✅';
                        g.appendChild(statusEmoji);
                    }

                    // Links badge (if has other parents or dependencies)
                    const hasOtherLinks = (task.otherParents && task.otherParents.length > 0) ||
                                        (task.dependencies && task.dependencies.length > 0);
                    if (hasOtherLinks) {
                        const linkBadge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        linkBadge.setAttribute('cx', task.x + dims.width - 10);
                        linkBadge.setAttribute('cy', task.y + 10);
                        linkBadge.setAttribute('r', '8');
                        linkBadge.setAttribute('class', 'link-badge');
                        linkBadge.style.cursor = 'pointer';
                        linkBadge.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.showLinksDropdown(task.id, e);
                        });
                        g.appendChild(linkBadge);

                        const linkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        linkIcon.setAttribute('x', task.x + dims.width - 10);
                        linkIcon.setAttribute('y', task.y + 10);
                        linkIcon.setAttribute('text-anchor', 'middle');
                        linkIcon.setAttribute('dominant-baseline', 'middle');
                        linkIcon.setAttribute('font-size', '10');
                        linkIcon.setAttribute('fill', 'white');
                        linkIcon.style.pointerEvents = 'none';
                        linkIcon.textContent = '🔗';
                        g.appendChild(linkIcon);
                    }

                    // Priority dots (right edge)
                    if (task.priority && task.priority > 1) {
                        const dotX = task.x + dims.width - 5;
                        const dotY = task.y + dims.height / 2;
                        const dotCount = task.priority === 3 ? 3 : 2;

                        for (let i = 0; i < dotCount; i++) {
                            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            dot.setAttribute('cx', dotX);
                            dot.setAttribute('cy', dotY + (i - 1) * 8);
                            dot.setAttribute('r', '2.5');
                            dot.setAttribute('fill', task.priority === 3 ? '#d32f2f' : '#f57c00');
                            g.appendChild(dot);
                        }
                    }

                    // Hidden children badge (top right)
                    const hiddenChildren = task.children.filter(childId => {
                        const child = this.tasks.find(t => t.id === childId);
                        return child && child.hidden;
                    });
                    if (hiddenChildren.length > 0) {
                        const badgeX = task.x + dims.width - 5;
                        const badgeY = task.y + 5;

                        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        badge.setAttribute('cx', badgeX);
                        badge.setAttribute('cy', badgeY);
                        badge.setAttribute('r', '10');
                        badge.setAttribute('fill', '#9c27b0');
                        badge.style.cursor = 'pointer';
                        badge.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleSubtreeVisibility(task.id);
                        });
                        g.appendChild(badge);

                        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        badgeText.setAttribute('x', badgeX);
                        badgeText.setAttribute('y', badgeY);
                        badgeText.setAttribute('text-anchor', 'middle');
                        badgeText.setAttribute('dominant-baseline', 'middle');
                        badgeText.setAttribute('font-size', '10');
                        badgeText.setAttribute('fill', 'white');
                        badgeText.style.pointerEvents = 'none';
                        badgeText.textContent = hiddenChildren.length;
                        g.appendChild(badgeText);
                    }

                    nodesGroup.appendChild(g);
                });

                // Render off-screen indicators for working tasks
                this.renderOffscreenIndicators();
            }
};

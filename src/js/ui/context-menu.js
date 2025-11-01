/**
 * @module ui/context-menu
 * @order 31
 * @category ui
 *
 * Right-click context menus for tasks and empty space
 */

export const ContextMenuMixin = {
    showNodeMenu(e, taskId) {
        this.closeMenu();

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        // If right-clicking on a task that's not in selection, select just it
        // If it's in the selection, operate on the entire selection
        const isInSelection = this.selectedTaskIds.has(taskId);
        const isMultiSelect = this.selectedTaskIds.size > 1;

        if (!isInSelection) {
            this.selectedTaskIds.clear();
            this.selectedTaskIds.add(taskId);
        }

        const menu = document.createElement('div');
        menu.className = 'node-menu';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';

        // Show dependencies if any
        if (task.dependencies.length > 0) {
            const depSection = document.createElement('div');
            depSection.className = 'dependency-section';

            const header = document.createElement('h4');
            header.textContent = 'Dependencies';
            depSection.appendChild(header);

            task.dependencies.forEach(depId => {
                const depTask = this.tasks.find(t => t.id === depId);
                if (depTask) {
                    const depItem = document.createElement('div');
                    depItem.className = 'dependency-item';

                    const span = document.createElement('span');
                    span.textContent = `→ ${depTask.title}`;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.textContent = 'X';
                    removeBtn.onclick = (evt) => {
                        evt.stopPropagation();
                        this.removeDependency(taskId, depId);
                        this.closeMenu();
                    };

                    depItem.appendChild(span);
                    depItem.appendChild(removeBtn);
                    depSection.appendChild(depItem);
                }
            });

            menu.appendChild(depSection);
        }

        const hasHiddenChildren = this.getHiddenChildrenCount(taskId) > 0;
        const hideButtonLabel = task.children.length > 0
            ? (hasHiddenChildren ? 'Show Children' : 'Hide Children')
            : null;

        const buttons = [];

        // Multi-select specific options
        if (isMultiSelect) {
            buttons.push({
                label: `✅ Mark Done (${this.selectedTaskIds.size})`,
                action: () => {
                    const selectedArray = Array.from(this.selectedTaskIds);
                    selectedArray.forEach(id => this.toggleDone(id));
                }
            });
            buttons.push({
                label: `⏸️ Mark Pending (${this.selectedTaskIds.size})`,
                action: () => {
                    const selectedArray = Array.from(this.selectedTaskIds);
                    selectedArray.forEach(id => {
                        const t = this.tasks.find(t => t.id === id);
                        if (t && t.status !== 'pending') this.toggleDone(id);
                    });
                }
            });
            buttons.push({
                label: `🙈 Hide Child (${this.selectedTaskIds.size})`,
                action: () => {
                    const selectedArray = Array.from(this.selectedTaskIds);
                    selectedArray.forEach(id => this.toggleHiddenSelf(id));
                }
            });
            buttons.push({
                label: `🗑️ Delete (${this.selectedTaskIds.size})`,
                action: () => {
                    const selectedArray = Array.from(this.selectedTaskIds);
                    this.deleteMultipleTasks(selectedArray);
                }
            });
        } else {
            // Single select options
            buttons.push({ label: '➕ Add Child', action: () => this.addChildTask(taskId) });
            buttons.push({ label: task.status === 'done' ? '⏸️ Mark Pending' : '✅ Mark Done', action: () => this.toggleDone(taskId) });
            buttons.push({ label: task.currentlyWorking ? '⏹️ Stop Working' : '▶️ Start Working', action: () => this.toggleWorking(taskId) });

            // Priority submenu
            const currentPriorityEmoji = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟠' : '⚪';
            buttons.push({ label: `${currentPriorityEmoji} Set Priority`, isPrioritySubmenu: true, currentPriority: task.priority });

            // Add hide option if task has a parent (not a root task)
            if (task.mainParent !== null) {
                buttons.push({ label: task.hidden ? '👁️ Show' : '🙈 Hide', action: () => this.toggleHiddenSelf(taskId) });
            }

            // Only add hide/show children button if task has children
            if (hideButtonLabel) {
                const hideEmoji = hideButtonLabel.includes('Show') ? '📂' : '📦';
                buttons.push({ label: `${hideEmoji} ${hideButtonLabel}`, action: () => this.toggleHidden(taskId) });
            }

            buttons.push({ label: '📋 Copy Text', action: () => this.copyTaskText(task.title) });

            // Copy/paste subtree options
            const subtreeSize = this.getSubtreeSize(taskId);
            const subtreeLabel = subtreeSize === 1 ? '📋 Copy Subtree' : `📋 Copy Subtree (${subtreeSize} nodes)`;
            buttons.push({ label: subtreeLabel, action: () => this.copySubtree(taskId) });

            if (this.copiedSubtree) {
                const pasteLabel = `📋 Paste as Child (${this.copiedSubtree.metadata.nodeCount} nodes)`;
                buttons.push({ label: pasteLabel, action: () => this.pasteSubtree(taskId) });
            }

            // Always show "Paste from Clipboard as Child" option (reads foreign JSON)
            buttons.push({ label: '📋 Paste from Clipboard as Child', action: () => this.pasteFromClipboard(taskId) });

            // Link management options
            if (!task.links) task.links = [];

            if (task.links.length === 0) {
                // No links - show attach option
                buttons.push({ label: '📎 Attach Link', action: () => this.attachLink(taskId) });
            } else if (task.links.length === 1) {
                // Single link - direct options
                buttons.push({ label: '🔗 Go to Link', action: () => this.openLink(task.links[0]) });
                buttons.push({ label: '📎 Attach Another Link', action: () => this.attachLink(taskId) });
                buttons.push({ label: '❌ Remove Link', action: () => this.removeAllLinks(taskId) });
            } else {
                // Multiple links - will need submenu (handled separately below)
                buttons.push({ label: `🔗 Links (${task.links.length})`, isLinksSubmenu: true });
                buttons.push({ label: '📎 Attach Another Link', action: () => this.attachLink(taskId) });
                buttons.push({ label: '🗑️ Remove All Links', action: () => this.removeAllLinks(taskId) });
            }

            buttons.push({ label: '🗑️ Delete', action: () => this.deleteTask(taskId) });
        }

        buttons.forEach(({ label, action, isLinksSubmenu, isPrioritySubmenu, currentPriority }) => {
            if (isPrioritySubmenu) {
                // Create priority submenu
                const priorityBtn = document.createElement('button');
                priorityBtn.className = 'menu-item-with-submenu';
                priorityBtn.textContent = label;

                const prioritySubmenu = document.createElement('div');
                prioritySubmenu.className = 'submenu-nested';
                prioritySubmenu.style.display = 'none';

                let hideTimeout = null;

                priorityBtn.addEventListener('mouseenter', () => {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                    const rect = priorityBtn.getBoundingClientRect();
                    prioritySubmenu.style.left = `${rect.right}px`;
                    prioritySubmenu.style.top = `${rect.top}px`;
                    prioritySubmenu.style.display = 'block';
                });

                priorityBtn.addEventListener('mouseleave', (evt) => {
                    hideTimeout = setTimeout(() => {
                        const hoveredElement = document.elementFromPoint(evt.clientX, evt.clientY);
                        if (!prioritySubmenu.contains(hoveredElement)) {
                            prioritySubmenu.style.display = 'none';
                        }
                    }, 100);
                });

                prioritySubmenu.addEventListener('mouseenter', () => {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                });

                prioritySubmenu.addEventListener('mouseleave', () => {
                    prioritySubmenu.style.display = 'none';
                });

                // Add priority options
                const priorities = [
                    { value: 'high', label: 'High Priority', emoji: '🔴' },
                    { value: 'medium', label: 'Medium Priority', emoji: '🟠' },
                    { value: 'normal', label: 'Normal Priority', emoji: '⚪' }
                ];

                priorities.forEach(({ value, label: priorityLabel, emoji }) => {
                    const item = document.createElement('div');
                    item.className = 'submenu-item';
                    item.textContent = `${emoji} ${priorityLabel}`;

                    // Add checkmark if this is the current priority
                    if (value === currentPriority) {
                        item.textContent = `✓ ${emoji} ${priorityLabel}`;
                        item.style.fontWeight = '600';
                    }

                    item.onclick = (evt) => {
                        evt.stopPropagation();
                        this.closeMenu();
                        this.setPriority(taskId, value);
                    };
                    prioritySubmenu.appendChild(item);
                });

                document.body.appendChild(prioritySubmenu);
                menu.appendChild(priorityBtn);
            } else if (isLinksSubmenu) {
                // Create submenu for multiple links
                const linksBtn = document.createElement('button');
                linksBtn.className = 'menu-item-with-submenu';
                linksBtn.textContent = label;

                const linksSubmenu = document.createElement('div');
                linksSubmenu.className = 'submenu-nested';
                linksSubmenu.style.display = 'none';

                let hideTimeout = null;

                linksBtn.addEventListener('mouseenter', () => {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                    const rect = linksBtn.getBoundingClientRect();
                    linksSubmenu.style.left = `${rect.right}px`;
                    linksSubmenu.style.top = `${rect.top}px`;
                    linksSubmenu.style.display = 'block';
                });

                linksBtn.addEventListener('mouseleave', (evt) => {
                    hideTimeout = setTimeout(() => {
                        const hoveredElement = document.elementFromPoint(evt.clientX, evt.clientY);
                        if (!linksSubmenu.contains(hoveredElement)) {
                            linksSubmenu.style.display = 'none';
                        }
                    }, 100);
                });

                linksSubmenu.addEventListener('mouseenter', () => {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                });

                linksSubmenu.addEventListener('mouseleave', () => {
                    linksSubmenu.style.display = 'none';
                });

                // Add each link as a submenu item
                task.links.forEach(url => {
                    const linkItem = document.createElement('div');
                    linkItem.className = 'submenu-item';
                    linkItem.textContent = `🌐 ${this.shortenURL(url)}`;
                    linkItem.onclick = (evt) => {
                        evt.stopPropagation();
                        this.closeMenu();
                        this.openLink(url);
                    };
                    linksSubmenu.appendChild(linkItem);
                });

                document.body.appendChild(linksSubmenu);
                menu.appendChild(linksBtn);
            } else {
                // Regular button
                const btn = document.createElement('button');
                btn.textContent = label;
                btn.onclick = (evt) => {
                    evt.stopPropagation();
                    this.closeMenu();
                    action();
                };
                menu.appendChild(btn);
            }
        });

        document.body.appendChild(menu);
    },

    showEmptySpaceMenu(e) {
        this.closeMenu();

        const menu = document.createElement('div');
        menu.className = 'node-menu';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';

        const buttons = [
            {
                label: '➕ Create New Task',
                action: () => {
                    this.saveSnapshot(`Created task`);

                    const pt = this.getSVGPoint(e);
                    const newTask = {
                        id: this.taskIdCounter++,
                        title: '',
                        x: pt.x,
                        y: pt.y,
                        mainParent: null,
                        otherParents: [],
                        children: [],
                        dependencies: [],
                        status: 'pending',
                        currentlyWorking: false,
                        hidden: false,
                        textExpanded: false,
                        textLocked: false,
                        links: []  // Array of URLs attached to this task
                    };
                    this.tasks.push(newTask);
                    this.startEditing(newTask.id);
                    this.saveToStorage();
                    this.render();
                }
            }
        ];

        // Add paste option if clipboard has data
        if (this.copiedSubtree) {
            const pt = this.getSVGPoint(e);
            buttons.push({
                label: `📋 Paste Subtree Here (${this.copiedSubtree.metadata.nodeCount} nodes)`,
                action: () => this.pasteSubtree(null, pt.x, pt.y)
            });
        }

        // Always show "Paste from Clipboard" option (reads foreign JSON)
        const pt = this.getSVGPoint(e);
        buttons.push({
            label: '📋 Paste from Clipboard',
            action: () => this.pasteFromClipboard(null, pt.x, pt.y)
        });

        buttons.push({ label: '🔍 Zoom to Fit', action: () => this.zoomToFit() });
        buttons.push({ label: '🎯 Mark Origin', action: () => this.markOrigin() });

        buttons.forEach(({ label, action }) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.onclick = (evt) => {
                evt.stopPropagation();
                this.closeMenu();
                action();
            };
            menu.appendChild(btn);
        });

        // Add Homes submenu
        const homesBtn = document.createElement('button');
        homesBtn.className = 'menu-item-with-submenu';
        homesBtn.textContent = '🏠 Homes';

        const submenu = document.createElement('div');
        submenu.className = 'submenu';

        if (this.homes.length === 0) {
            submenu.innerHTML = '<div class="submenu-empty">No homes yet</div>';
        } else {
            // Sort homes: "Origin Home" first, then alphabetically
            const sortedHomes = [...this.homes].sort((a, b) => {
                if (a.name === "Origin Home") return -1;
                if (b.name === "Origin Home") return 1;
                return a.name.localeCompare(b.name);
            });

            sortedHomes.forEach(home => {
                const item = document.createElement('div');
                item.className = 'submenu-item menu-item-with-submenu';
                if (home.name === "Origin Home") {
                    item.classList.add('special');
                }

                // Display home name with keybind if it exists
                const nameText = home.keybind ? `${home.name} [${home.keybind}]` : home.name;

                // Don't use textContent - it can interfere with appendChild
                // Instead, create a span for the text
                const textSpan = document.createElement('span');
                textSpan.textContent = nameText;
                item.appendChild(textSpan);

                // Click on home name navigates to that home
                item.onclick = (evt) => {
                    // Only navigate if clicking the item itself, not the nested submenu
                    if (evt.target === item || evt.target === textSpan) {
                        evt.stopPropagation();
                        this.closeMenu();
                        this.jumpToHome(home.id);
                    }
                };

                // Create nested submenu for each home (uses fixed positioning)
                const homeSubmenu = document.createElement('div');
                homeSubmenu.className = 'submenu-nested';
                homeSubmenu.style.display = 'none'; // Start hidden

                // Show/hide nested submenu with JavaScript (CSS hover unreliable with fixed positioning)
                let hideTimeout = null;

                item.addEventListener('mouseenter', () => {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                    const rect = item.getBoundingClientRect();
                    homeSubmenu.style.left = `${rect.right}px`;
                    homeSubmenu.style.top = `${rect.top}px`;
                    homeSubmenu.style.display = 'block';

                    // Keep parent submenu visible while nested submenu is open
                    submenu.style.display = 'block';
                });

                item.addEventListener('mouseleave', (evt) => {
                    // Don't hide if mouse moved to the submenu
                    hideTimeout = setTimeout(() => {
                        const hoveredElement = document.elementFromPoint(evt.clientX, evt.clientY);
                        if (!homeSubmenu.contains(hoveredElement)) {
                            homeSubmenu.style.display = 'none';
                            // Allow parent submenu to use CSS hover again
                            submenu.style.display = '';
                        }
                    }, 100);
                });

                // Keep both submenus visible when hovering nested submenu
                homeSubmenu.addEventListener('mouseenter', () => {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                    // Force parent submenu to stay visible
                    submenu.style.display = 'block';
                });

                homeSubmenu.addEventListener('mouseleave', () => {
                    homeSubmenu.style.display = 'none';
                    // Allow parent submenu to use CSS hover again
                    submenu.style.display = '';
                });

                // Jump to Home option
                const jumpOption = document.createElement('div');
                jumpOption.className = 'submenu-item';
                jumpOption.textContent = '🚀 Jump to Home';
                jumpOption.onclick = (evt) => {
                    evt.stopPropagation();
                    this.closeMenu();
                    this.jumpToHome(home.id);
                };
                homeSubmenu.appendChild(jumpOption);

                // Update Home Position option
                const updateOption = document.createElement('div');
                updateOption.className = 'submenu-item';
                updateOption.textContent = '📍 Update Home Position';
                updateOption.onclick = (evt) => {
                    evt.stopPropagation();
                    this.closeMenu();
                    this.updateHome(home.id);
                };
                homeSubmenu.appendChild(updateOption);

                // Append nested submenu to body (not to item) since it uses fixed positioning
                // This avoids parent overflow issues
                document.body.appendChild(homeSubmenu);

                submenu.appendChild(item);
            });

            // Add divider
            const divider = document.createElement('div');
            divider.className = 'submenu-divider';
            submenu.appendChild(divider);
        }

        // Add "Create New Home" option
        const createItem = document.createElement('div');
        createItem.className = 'submenu-item special';
        createItem.textContent = '➕ Create New Home';
        createItem.onclick = (evt) => {
            evt.stopPropagation();
            this.closeMenu();
            this.showCreateHomeModal();
        };
        submenu.appendChild(createItem);

        // Add "Manage Homes" option
        const manageItem = document.createElement('div');
        manageItem.className = 'submenu-item';
        manageItem.textContent = '⚙️ Manage Homes';
        manageItem.onclick = (evt) => {
            evt.stopPropagation();
            this.closeMenu();
            this.showManageHomesModal();
        };
        submenu.appendChild(manageItem);

        homesBtn.appendChild(submenu);
        menu.appendChild(homesBtn);

        document.body.appendChild(menu);
    },

    closeMenu() {
        const menu = document.querySelector('.node-menu');
        if (menu) menu.remove();

        // Also remove any nested submenus that were appended to body
        const nestedMenus = document.querySelectorAll('.submenu-nested');
        nestedMenus.forEach(m => m.remove());

        // Close any link dropdowns
        this.closeLinksDropdown();
    },

    copyTaskText(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show toast notification (auto-dismisses after 4 seconds)
            this.showToast(`✓ Copied: "${text}"`, 'success', 4000);
        }).catch(err => {
            // Show error toast
            this.showToast('Failed to copy to clipboard', 'error', 4000);
        });
    },

    // Link Management Functions
    attachLink(taskId) {
        this.showPrompt('Attach Link', 'Enter URL:', '', (url) => {
            if (!url) return;

            url = url.trim();
            if (!this.isValidURL(url)) {
                this.showToast('❌ Invalid URL format', 'error');
                return;
            }

            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            this.saveSnapshot(`Attached link to "${task.title}"`);

            if (!task.links) task.links = [];

            if (task.links.includes(url)) {
                this.showToast('⚠️ Link already exists', 'warning');
                return;
            }

            task.links.push(url);
            this.saveToStorage();
            this.render();
            this.showToast(`🔗 Link attached: ${this.shortenURL(url)}`, 'success');
        });
    },

    openLink(url) {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
            this.showToast(`🔗 Opened: ${this.shortenURL(url)}`, 'info', 2000);
        } catch (err) {
            this.showToast('❌ Failed to open link', 'error');
        }
    },

    removeAllLinks(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.links || task.links.length === 0) return;

        const count = task.links.length;
        const confirmMsg = count === 1
            ? 'Remove this link from the node?'
            : `Remove all ${count} links from this node?`;

        this.showConfirm('Remove Links', confirmMsg, () => {
            this.saveSnapshot(`Removed ${count} link(s) from "${task.title}"`);
            task.links = [];
            this.saveToStorage();
            this.render();
            this.showToast(`✓ Removed ${count} link(s)`, 'success');
        });
    },

    showLinksDropdown(taskId, x, y) {
        // Close any existing dropdown first
        this.closeLinksDropdown();

        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.links || task.links.length === 0) return;

        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'links-dropdown';
        dropdown.style.position = 'fixed';
        dropdown.style.left = x + 'px';
        dropdown.style.top = y + 'px';
        dropdown.style.zIndex = '10000';
        dropdown.style.background = 'white';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.borderRadius = '4px';
        dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        dropdown.style.minWidth = '200px';
        dropdown.style.maxWidth = '400px';

        // Add each link as a clickable item
        task.links.forEach((url, index) => {
            const linkItem = document.createElement('div');
            linkItem.style.padding = '8px 12px';
            linkItem.style.cursor = 'pointer';
            linkItem.style.borderBottom = index < task.links.length - 1 ? '1px solid #eee' : 'none';
            linkItem.style.transition = 'background-color 0.15s';
            linkItem.textContent = `🔗 ${this.shortenURL(url, 50)}`;
            linkItem.title = url;  // Show full URL on hover

            linkItem.addEventListener('mouseenter', () => {
                linkItem.style.backgroundColor = '#f0f0f0';
            });

            linkItem.addEventListener('mouseleave', () => {
                linkItem.style.backgroundColor = '';
            });

            linkItem.onclick = (evt) => {
                evt.stopPropagation();
                this.closeLinksDropdown();
                this.openLink(url);
            };

            dropdown.appendChild(linkItem);
        });

        document.body.appendChild(dropdown);

        // Close dropdown when clicking outside
        const closeHandler = (evt) => {
            if (!dropdown.contains(evt.target)) {
                this.closeLinksDropdown();
                document.removeEventListener('click', closeHandler);
            }
        };

        // Use setTimeout to avoid immediate closure from the badge click
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 0);
    },

    closeLinksDropdown() {
        const dropdown = document.querySelector('.links-dropdown');
        if (dropdown) dropdown.remove();
    }
};

console.log('[context-menu.js] Context menu system loaded');

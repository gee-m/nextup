/**
 * @module navigation/homes
 * @order 41
 * @category navigation
 *
 * Home bookmarks for quick navigation with keyboard shortcuts
 *
 * Homes are saved viewport positions (centerX, centerY, zoomLevel) that can be:
 * - Created at current view position
 * - Navigated to with cinematic 3-phase animation
 * - Updated to current position
 * - Assigned keyboard shortcuts (0-9)
 * - Renamed and deleted
 *
 * KEY FUNCTIONS:
 *
 * createHome(name) - Create new home at current position
 * - Validates unique name
 * - Saves center of viewport + zoom level
 * - Warns if >20 homes exist
 *
 * jumpToHome(homeId, animate) - Navigate to home
 * - 3-phase cinematic animation (zoom out → pan → zoom in)
 * - Smooth easing for professional feel
 * - Total duration: 1300ms (300ms + 500ms + 500ms)
 * - Lines fade during animation, reappear perfectly after
 *
 * updateHome(homeId) - Update home to current position
 * - Preserves name and keybind
 * - Updates coordinates and zoom
 *
 * deleteHome(homeId) - Delete home with confirmation
 * - Respects showDeleteConfirmation setting
 *
 * setKeybindForHome(homeId) - Assign 0-9 keyboard shortcut
 * - Validates 0-9 keys only
 * - Handles conflicts (reassign keybind)
 * - ESC to clear keybind
 *
 * renameHome(homeId, newName) - Rename home
 * - Validates unique name (case-insensitive)
 *
 * SPECIAL HOME:
 * - "Origin Home" - Migrated from old origin system
 * - Always shown first in lists
 * - Special purple styling
 *
 * MODAL SYSTEM:
 * - Create Home modal (simple name input)
 * - Manage Homes modal (full CRUD interface)
 *
 * DROPDOWN MENU:
 * - Shows all homes sorted (Origin first, then alphabetical)
 * - Displays keybind if assigned: "Home Name [3]"
 * - Quick actions: Create New, Manage Homes
 */

export const HomesMixin = {
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

    createHome(name) {
        // Create a new home bookmark at current view position
        // Validates unique name and warns if >20 homes

        if (!name || name.trim() === '') {
            this.showToast('Home name cannot be empty', 'error');
            return false;
        }

        const trimmedName = name.trim();

        // Check for duplicate name (case-insensitive)
        const duplicate = this.homes.find(h => h.name.toLowerCase() === trimmedName.toLowerCase());
        if (duplicate) {
            this.showToast(`Home "${trimmedName}" already exists`, 'error');
            return false;
        }

        // Calculate center of current viewport (where user is currently looking)
        const centerX = this.viewBox.x + this.viewBox.width / 2;
        const centerY = this.viewBox.y + this.viewBox.height / 2;

        // Create new home
        const newHome = {
            id: this.homeIdCounter++,
            name: trimmedName,
            centerX: centerX,
            centerY: centerY,
            zoomLevel: this.zoomLevel,
            timestamp: Date.now(),
            keybind: null  // No keybind by default
        };

        this.homes.push(newHome);
        this.saveToStorage();

        // Warn if >20 homes
        if (this.homes.length > 20) {
            this.showToast(`⚠️ Home "${trimmedName}" created (${this.homes.length} homes - consider organizing)`, 'warning', 3000);
        } else {
            this.showToast(`✓ Home "${trimmedName}" created`, 'success');
        }

        return true;
    },

    jumpToHome(homeId, animate = true) {
        // Navigate to a saved home bookmark
        // Smoothly animates pan and zoom if animate=true

        const home = this.homes.find(h => h.id === homeId);
        if (!home) {
            this.showToast('Home not found', 'error');
            return;
        }

        if (this.tasks.length === 0) {
            this.showToast(`No tasks to navigate. Home "${home.name}" will apply when tasks exist.`, 'warning');
            return;
        }

        if (animate) {
            // Use utility function for smooth three-phase animation
            const startZoom = this.zoomLevel;
            const targetZoom = home.zoomLevel;
            const overviewZoom = Math.min(startZoom, targetZoom) * 0.5;

            this.animateViewportTo(home.centerX, home.centerY, targetZoom, {
                overviewZoom: overviewZoom,
                onComplete: () => {
                    this.updateZoomDisplay();
                    this.saveToStorage();
                    this.showToast(`→ Jumped to "${home.name}"`, 'success');
                }
            });
        } else {
            // Instant jump without animation
            this.jumpToPosition(home.centerX, home.centerY, home.zoomLevel);
            this.updateZoomDisplay();
            this.saveToStorage();
            this.showToast(`→ Jumped to "${home.name}"`, 'success');
        }
    },

    updateHome(homeId) {
        // Update an existing home to current view position and zoom

        const home = this.homes.find(h => h.id === homeId);
        if (!home) {
            this.showToast('Home not found', 'error');
            return;
        }

        // Calculate center of current viewport (where user is currently looking)
        const centerX = this.viewBox.x + this.viewBox.width / 2;
        const centerY = this.viewBox.y + this.viewBox.height / 2;

        home.centerX = centerX;
        home.centerY = centerY;
        home.zoomLevel = this.zoomLevel;
        home.timestamp = Date.now();

        this.saveToStorage();
        this.showToast(`✓ Updated "${home.name}" to current view`, 'success');
    },

    deleteHome(homeId) {
        // Delete a home bookmark (with confirmation if enabled)

        const home = this.homes.find(h => h.id === homeId);
        if (!home) {
            this.showToast('Home not found', 'error');
            return;
        }

        const confirmDelete = () => {
            this.homes = this.homes.filter(h => h.id !== homeId);
            this.saveToStorage();
            this.showToast(`✓ Deleted home "${home.name}"`, 'success');
        };

        if (this.showDeleteConfirmation) {
            this.showConfirmDialog(
                `Delete home "${home.name}"?`,
                'This action cannot be undone.',
                confirmDelete
            );
        } else {
            confirmDelete();
        }
    },

    setKeybindForHome(homeId) {
        // Set a keyboard shortcut for a home
        const home = this.homes.find(h => h.id === homeId);
        if (!home) return;

        // Show alert instructing user to press a key
        const message = home.keybind
            ? `Current keybind for "${home.name}": ${home.keybind}\n\nPress a key (0-9) to set new keybind, or press Escape to clear keybind.`
            : `Press a key (0-9) to set keybind for "${home.name}", or press Escape to cancel.`;

        this.showAlert('Set Keybind', message);

        // Capture next keypress
        const keyHandler = (e) => {
            // Remove listener immediately
            document.removeEventListener('keydown', keyHandler);

            // Close alert modal
            this.hideAlert();

            // Handle Escape key
            if (e.key === 'Escape') {
                if (home.keybind) {
                    // Clear existing keybind
                    home.keybind = null;
                    this.saveToStorage();
                    this.renderManageHomesModal();
                    this.showToast(`✓ Keybind cleared for "${home.name}"`, 'success');
                }
                // Otherwise just cancel
                return;
            }

            // Only allow 0-9 keys
            if (!/^[0-9]$/.test(e.key)) {
                this.showToast('Only keys 0-9 are allowed for keybinds', 'error');
                return;
            }

            // Check if keybind is already used by another home
            const existingHome = this.homes.find(h => h.id !== homeId && h.keybind === e.key);
            if (existingHome) {
                this.showConfirm(
                    'Keybind Conflict',
                    `Key "${e.key}" is already assigned to "${existingHome.name}". Reassign it to "${home.name}"?`,
                    () => {
                        // Remove from old home
                        existingHome.keybind = null;
                        // Assign to new home
                        home.keybind = e.key;
                        this.saveToStorage();
                        this.renderManageHomesModal();
                        this.showToast(`✓ Keybind "${e.key}" assigned to "${home.name}"`, 'success');
                    }
                );
            } else {
                // No conflict, assign keybind
                home.keybind = e.key;
                this.saveToStorage();
                this.renderManageHomesModal();
                this.showToast(`✓ Keybind "${e.key}" assigned to "${home.name}"`, 'success');
            }
        };

        // Add listener for next keypress
        document.addEventListener('keydown', keyHandler);
    },

    renameHome(homeId, newName) {
        // Rename a home bookmark (validates unique name)

        const home = this.homes.find(h => h.id === homeId);
        if (!home) {
            this.showToast('Home not found', 'error');
            return false;
        }

        if (!newName || newName.trim() === '') {
            this.showToast('Home name cannot be empty', 'error');
            return false;
        }

        const trimmedName = newName.trim();

        // Check for duplicate name (case-insensitive), excluding current home
        const duplicate = this.homes.find(h =>
            h.id !== homeId && h.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (duplicate) {
            this.showToast(`Home "${trimmedName}" already exists`, 'error');
            return false;
        }

        const oldName = home.name;
        home.name = trimmedName;
        home.timestamp = Date.now();

        this.saveToStorage();
        this.showToast(`✓ Renamed "${oldName}" to "${trimmedName}"`, 'success');
        return true;
    },

    toggleHomesDropdown(event) {
        // Toggle the Homes dropdown menu
        event.stopPropagation();
        const dropdown = document.getElementById('homesDropdown');

        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            this.renderHomesDropdown();
            dropdown.classList.add('show');

            // Close dropdown when clicking outside
            const closeDropdown = (e) => {
                if (!dropdown.contains(e.target) && !e.target.closest('.dropdown button')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            };
            setTimeout(() => document.addEventListener('click', closeDropdown), 0);
        }
    },

    renderHomesDropdown() {
        // Populate the Homes dropdown with current homes
        const dropdown = document.getElementById('homesDropdown');
        dropdown.innerHTML = '';

        if (this.homes.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-empty">No homes created yet</div>';
        } else {
            // Sort homes: "Origin Home" first, then alphabetically
            const sortedHomes = [...this.homes].sort((a, b) => {
                if (a.name === "Origin Home") return -1;
                if (b.name === "Origin Home") return 1;
                return a.name.localeCompare(b.name);
            });

            sortedHomes.forEach(home => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                if (home.name === "Origin Home") {
                    item.classList.add('special');
                }

                // Display home name with keybind if it exists
                const nameText = home.keybind ? `${home.name} [${home.keybind}]` : home.name;
                item.textContent = nameText;

                item.onclick = (e) => {
                    e.stopPropagation();
                    this.jumpToHome(home.id);
                    dropdown.classList.remove('show');
                };
                dropdown.appendChild(item);
            });
        }

        // Add divider and actions
        if (this.homes.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'dropdown-divider';
            dropdown.appendChild(divider);
        }

        const createItem = document.createElement('div');
        createItem.className = 'dropdown-item special';
        createItem.innerHTML = '+ Create New Home';
        createItem.onclick = (e) => {
            e.stopPropagation();
            this.showCreateHomeModal();
            dropdown.classList.remove('show');
        };
        dropdown.appendChild(createItem);

        const manageItem = document.createElement('div');
        manageItem.className = 'dropdown-item';
        manageItem.innerHTML = '⚙️ Manage Homes';
        manageItem.onclick = (e) => {
            e.stopPropagation();
            this.showManageHomesModal();
            dropdown.classList.remove('show');
        };
        dropdown.appendChild(manageItem);
    },

    showCreateHomeModal() {
        // Show the Create Home modal
        const modal = document.getElementById('create-home-modal');
        const input = document.getElementById('home-name-input');
        input.value = '';
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    },

    hideCreateHomeModal() {
        // Hide the Create Home modal
        document.getElementById('create-home-modal').style.display = 'none';
    },

    createHomeFromModal() {
        // Create a new home from the modal input
        const input = document.getElementById('home-name-input');
        const name = input.value.trim();

        if (this.createHome(name)) {
            this.hideCreateHomeModal();
        }
    },

    showManageHomesModal() {
        // Show the Manage Homes modal
        const modal = document.getElementById('manage-homes-modal');
        this.renderManageHomesModal();
        modal.style.display = 'flex';
    },

    hideManageHomesModal() {
        // Hide the Manage Homes modal
        document.getElementById('manage-homes-modal').style.display = 'none';
    },

    renderManageHomesModal() {
        // Populate the Manage Homes modal with current homes
        const container = document.getElementById('homes-list');
        container.innerHTML = '';

        if (this.homes.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #999; padding: 40px; font-style: italic;">No homes created yet</div>';
            return;
        }

        // Sort homes: "Origin Home" first, then alphabetically
        const sortedHomes = [...this.homes].sort((a, b) => {
            if (a.name === "Origin Home") return -1;
            if (b.name === "Origin Home") return 1;
            return a.name.localeCompare(b.name);
        });

        sortedHomes.forEach(home => {
            const homeCard = document.createElement('div');
            homeCard.style.cssText = `
                background: ${home.name === "Origin Home" ? 'rgba(156, 39, 176, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${home.name === "Origin Home" ? 'rgba(156, 39, 176, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'flex: 1;';

            const nameSpan = document.createElement('div');
            nameSpan.textContent = home.name;
            // Use light colors in dark mode for visibility
            const isDarkMode = document.body.classList.contains('dark-mode');
            const nameColor = home.name === "Origin Home" ? '#9c27b0' : (isDarkMode ? '#e2e8f0' : '#333');
            nameSpan.style.cssText = `
                font-weight: 600;
                font-size: 15px;
                margin-bottom: 6px;
                color: ${nameColor};
            `;

            const detailsSpan = document.createElement('div');
            const keybindText = home.keybind ? ` • Keybind: ${home.keybind}` : '';
            detailsSpan.textContent = `Zoom: ${home.zoomLevel.toFixed(1)}x • Position: (${Math.round(home.centerX)}, ${Math.round(home.centerY)})${keybindText}`;
            const detailsColor = isDarkMode ? '#94a3b8' : '#666';
            detailsSpan.style.cssText = `font-size: 12px; color: ${detailsColor};`;

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(detailsSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = 'display: flex; gap: 8px;';

            // Jump button
            const jumpBtn = document.createElement('button');
            jumpBtn.textContent = '→ Jump';
            jumpBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
            jumpBtn.onclick = () => {
                this.jumpToHome(home.id);
                this.hideManageHomesModal();
            };
            actionsDiv.appendChild(jumpBtn);

            // Update button
            const updateBtn = document.createElement('button');
            updateBtn.className = 'secondary';
            updateBtn.textContent = '↻ Update';
            updateBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
            updateBtn.onclick = () => {
                this.updateHome(home.id);
                this.renderManageHomesModal();
            };
            actionsDiv.appendChild(updateBtn);

            // Keybind button
            const keybindBtn = document.createElement('button');
            keybindBtn.className = 'secondary';
            keybindBtn.textContent = home.keybind ? `⌨ ${home.keybind}` : '⌨ Set Key';
            keybindBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
            keybindBtn.onclick = () => {
                this.setKeybindForHome(home.id);
            };
            actionsDiv.appendChild(keybindBtn);

            // Rename button
            const renameBtn = document.createElement('button');
            renameBtn.className = 'secondary';
            renameBtn.textContent = '✎ Rename';
            renameBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
            renameBtn.onclick = () => {
                const newName = prompt(`Rename "${home.name}" to:`, home.name);
                if (newName) {
                    if (this.renameHome(home.id, newName)) {
                        this.renderManageHomesModal();
                    }
                }
            };
            actionsDiv.appendChild(renameBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'secondary';
            deleteBtn.textContent = '✕ Delete';
            deleteBtn.style.cssText = 'padding: 6px 12px; font-size: 13px; color: #f44336;';
            deleteBtn.onclick = () => {
                this.deleteHome(home.id);
                this.renderManageHomesModal();
            };
            actionsDiv.appendChild(deleteBtn);

            homeCard.appendChild(infoDiv);
            homeCard.appendChild(actionsDiv);
            container.appendChild(homeCard);
        });
    }
};

console.log('[homes.js] Home bookmarks navigation loaded');

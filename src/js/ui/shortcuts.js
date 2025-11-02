/**
 * @module ui/shortcuts
 * @order 34
 * @category ui
 *
 * Keyboard shortcuts modal - comprehensive reference for all keyboard interactions
 *
 * KEY FUNCTIONS:
 *
 * showShortcutsModal() - Display shortcuts reference modal
 * - Generates comprehensive keyboard shortcuts reference
 * - Platform-aware key names (Cmd vs Ctrl, Option vs Alt)
 * - Organized into 7 categories with emojis
 * - Pro Tips for advanced workflows
 * - ESC to close, click-outside to close
 *
 * hideShortcutsModal() - Close shortcuts modal
 * - Removes show class
 * - Cleans up event listeners
 *
 * SHORTCUT CATEGORIES:
 *
 * 1. ✏️ Editing - Task creation, editing, deletion
 *    - Double-click to edit
 *    - Cmd+Double-click to create child
 *    - Backspace to delete
 *
 * 2. 🎯 Selection - Selecting, multi-selecting, clearing
 *    - Click to select
 *    - Cmd+Click to multi-select
 *    - Cmd+Drag for box selection
 *    - Escape to clear
 *
 * 3. 📊 Status & Priority - Status changes, priority cycling
 *    - Middle-click to cycle status
 *    - P key to cycle priority
 *
 * 4. 🔗 Relationships - Reparenting, dependencies, subtree movement
 *    - Cmd+Drag to reparent
 *    - Alt+Drag to add dependency
 *    - Shift+Drag to move subtree
 *
 * 5. 🚀 Navigation - Movement, zooming, jumping, collapsing
 *    - Drag to move
 *    - Scroll wheel to zoom
 *    - J to jump to working task
 *    - Shift+Double-click to collapse
 *
 * 6. 🔗 Links - Link attachment, opening links
 *    - Cmd+K to attach URL
 *    - Click link icon to open
 *    - Pro Tip: Auto-detection when editing
 *
 * 7. ⏮️ Undo/Redo - Undo and redo operations
 *    - Cmd+Z to undo
 *    - Cmd+Shift+Z to redo
 *
 * PLATFORM-AWARE KEY NAMES:
 * - macOS: ⌘ (Cmd), ⌥ (Option), ⇧ (Shift)
 * - Windows/Linux: Ctrl, Alt, Shift
 *
 * Pro Tips are shown as highlighted boxes with blue left border,
 * providing advanced workflow guidance.
 */

export const ShortcutsMixin = {
    showShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal');
        const platformInfo = document.getElementById('shortcuts-platform-info');
        const content = document.getElementById('shortcuts-content');

        // Set platform info
        const platform = this.isMac ? 'macOS' : this.isWindows ? 'Windows' : 'Linux';
        platformInfo.textContent = `Detected platform: ${platform}`;

        // Get platform-specific key names
        const mod = this.getModifierKey(false); // 'Cmd' or 'Ctrl'
        const modSymbol = this.getModifierKey(true); // '⌘' or 'Ctrl'
        const alt = this.getAltKey(false);
        const altSymbol = this.getAltKey(true);
        const shift = this.getShiftKey(false);
        const shiftSymbol = this.getShiftKey(true);

        // Build shortcuts by category
        const shortcuts = [
            {
                category: '✏️ Editing',
                items: [
                    { keys: 'Double-click node', description: 'Edit task name' },
                    { keys: `${modSymbol}+Double-click node`, description: 'Create child task under node' },
                    { keys: `${modSymbol}+Double-click empty`, description: 'Create root task at cursor' },
                    { keys: 'Backspace', description: 'Delete selected task(s)' },
                    { keys: `${altSymbol}+Click node`, description: 'Delete task (alternative method)' }
                ]
            },
            {
                category: '🎯 Selection',
                items: [
                    { keys: 'Click node', description: 'Select task (clears other selections)' },
                    { keys: `${modSymbol}+Click node`, description: 'Multi-select (toggle selection)' },
                    { keys: `${modSymbol}+Drag empty`, description: 'Box select (select all nodes in rectangle)' },
                    { keys: 'Escape', description: 'Clear all selections' }
                ]
            },
            {
                category: '📊 Status & Priority',
                items: [
                    { keys: 'Middle-click', description: 'Cycle task status (pending → working → done → pending)' },
                    { keys: 'P (hover)', description: 'Cycle priority of hovered task' },
                    { keys: 'P (selected)', description: 'Cycle priority of selected task(s)' }
                ]
            },
            {
                category: '🔗 Relationships',
                items: [
                    { keys: `${modSymbol}+Drag A → B`, description: 'Reparent: Make task A a child of task B' },
                    { keys: `${modSymbol}+Drag A → empty`, description: 'Create child task at cursor position (with preview)' },
                    { keys: `${altSymbol}+Drag A → B`, description: 'Add dependency: A depends on B (A waits for B)' },
                    { keys: `${altSymbol}+Drag on dependency`, description: 'Remove dependency link' },
                    { keys: `${shiftSymbol}+Drag node`, description: 'Move entire subtree (preserves relative positions)' }
                ],
                tip: '💡 <strong>Pro Tip:</strong> When Ctrl+dragging, a ghost preview node shows where the new child will be created!'
            },
            {
                category: '🚀 Navigation',
                items: [
                    { keys: 'Drag node', description: 'Move single task to new position' },
                    { keys: 'Scroll wheel', description: 'Zoom in/out at cursor position' },
                    { keys: `${modSymbol}++`, description: 'Zoom in' },
                    { keys: `${modSymbol}+−`, description: 'Zoom out' },
                    { keys: 'J or 🎯 button', description: 'Jump to currently working task (cinematic animation)' },
                    { keys: `${shiftSymbol}+Double-click`, description: 'Toggle subtree visibility (collapse/expand)' }
                ]
            },
            {
                category: '🔗 Links',
                items: [
                    { keys: `${modSymbol}+K`, description: 'Attach URL to selected task' },
                    { keys: 'Click 🔗', description: 'Open attached link in new tab' }
                ],
                tip: '💡 <strong>Pro Tip:</strong> Paste a URL as the last text in a task - it will be automatically detected, removed from the task name, and added as a link!'
            },
            {
                category: '⏮️ Undo/Redo',
                items: [
                    { keys: `${modSymbol}+Z`, description: 'Undo last action' },
                    { keys: `${modSymbol}+${shiftSymbol}+Z`, description: 'Redo previously undone action' }
                ]
            }
        ];

        // Build HTML for shortcuts
        let html = '';
        shortcuts.forEach(section => {
            html += `
                <div class="shortcut-section">
                    <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 12px; color: ${this.darkMode ? '#fff' : '#333'};">${section.category}</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${section.items.map(item => `
                            <tr style="border-bottom: 1px solid ${this.darkMode ? '#444' : '#eee'};">
                                <td style="padding: 8px 16px 8px 0; font-family: 'Fira Code', monospace; font-size: 13px; color: ${this.darkMode ? '#4fc3f7' : '#1976d2'}; white-space: nowrap;">${item.keys}</td>
                                <td style="padding: 8px 0; font-size: 13px; color: ${this.darkMode ? '#ccc' : '#666'};">${item.description}</td>
                            </tr>
                        `).join('')}
                    </table>
                    ${section.tip ? `<div style="margin-top: 12px; padding: 10px; background: ${this.darkMode ? 'rgba(76, 195, 247, 0.1)' : 'rgba(25, 118, 210, 0.05)'}; border-left: 3px solid ${this.darkMode ? '#4fc3f7' : '#1976d2'}; border-radius: 4px; font-size: 13px; color: ${this.darkMode ? '#ccc' : '#666'};">${section.tip}</div>` : ''}
                </div>
            `;
        });

        content.innerHTML = html;

        // Add ESC key handler
        this._shortcutsEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideShortcutsModal();
            }
        };
        document.addEventListener('keydown', this._shortcutsEscHandler);

        // Add click-outside handler
        this._shortcutsClickHandler = (e) => {
            if (e.target === modal) {
                this.hideShortcutsModal();
            }
        };
        modal.addEventListener('click', this._shortcutsClickHandler);

        modal.classList.add('show');
    },

    hideShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal');
        modal.classList.remove('show');

        // Remove event listeners
        if (this._shortcutsEscHandler) {
            document.removeEventListener('keydown', this._shortcutsEscHandler);
            this._shortcutsEscHandler = null;
        }
        if (this._shortcutsClickHandler) {
            modal.removeEventListener('click', this._shortcutsClickHandler);
            this._shortcutsClickHandler = null;
        }
    }
};

console.log('[shortcuts.js] Keyboard shortcuts modal loaded');

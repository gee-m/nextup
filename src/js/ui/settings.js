/**
 * @module ui/settings
 * @order 33
 * @category ui
 *
 * Settings modal and configuration management
 *
 * KEY FUNCTIONS:
 *
 * showSettingsModal() - Display settings modal
 * - Generates form from configDefs metadata
 * - Renders inputs based on type (number, text, select, checkbox)
 * - Special handling for charWidth with calibration button
 * - Shows undo/redo history stats
 * - ESC to close, click-outside to close
 *
 * hideSettingsModal() - Close settings modal
 * - Removes show class
 * - Resets scroll position
 * - Cleans up event listeners
 *
 * applySettings() - Apply settings from form
 * - Reads all form values
 * - Updates app state properties
 * - Enforces undo limit if changed
 * - Auto-calibrates charWidth if font changed
 * - Saves to localStorage
 * - Re-renders canvas
 *
 * resetSettings() - Reset to defaults
 * - Shows confirmation dialog
 * - Resets all config values to defaults
 * - Auto-calibrates charWidth for default font
 * - Refreshes form with new values
 *
 * exportSettings() - Export settings as JSON
 * - Extracts all configuration parameters
 * - Formats as pretty JSON
 * - Copies to clipboard
 *
 * CONFIGURATION METADATA (configDefs):
 * Defines all user-customizable properties:
 * - textLengthThreshold: Text truncation length
 * - charWidth: Character width for node sizing
 * - nodePadding: Left/right padding inside rectangles
 * - wheelZoomSpeed: Mouse wheel zoom speed
 * - minNodeWidth: Minimum node width
 * - fontFamily: CSS font stack
 * - fontWeight: Font weight (300-700)
 * - showDeleteConfirmation: Show delete confirmation
 * - autoHideCompletedNodes: Auto-hide completed subtrees
 * - enableMultiline: Allow multiline text
 * - maxNodeWidth: Max node width before wrapping
 * - maxNodeHeight: Max node height (0 = unlimited)
 * - lineHeight: Vertical spacing between lines
 * - wordWrap: Wrap on word vs character boundaries
 * - arrowStyle: Straight or curved arrows
 * - arrowCurvature: Curve intensity (0.05-0.5)
 * - maxUndoSteps: Max undo history (5-200)
 */

export const SettingsMixin = {
    showSettingsModal() {
        // Configuration metadata - defines which app properties are user-customizable
        const configDefs = {
            textLengthThreshold: {
                label: 'Text Truncation Length',
                type: 'number',
                default: 80,
                min: 20,
                max: 200,
                description: 'Characters before text is truncated'
            },
            charWidth: {
                label: 'Character Width (px)',
                type: 'number',
                default: 8.5,
                min: 4,
                max: 15,
                step: 0.5,
                description: 'Pixels per character for node width calculation. Auto-calibrates when font changes, or click Calibrate to measure manually.'
            },
            nodePadding: {
                label: 'Node Padding (px)',
                type: 'number',
                default: 15,
                min: 0,
                max: 50,
                description: 'Left/right padding inside rectangles'
            },
            wheelZoomSpeed: {
                label: 'Wheel/Trackpad Zoom Speed',
                type: 'number',
                default: 0.18,
                min: 0.01,
                max: 0.5,
                step: 0.01,
                description: 'Adjust mouse wheel / trackpad zoom speed (higher = faster)'
            },
            minNodeWidth: {
                label: 'Minimum Node Width (px)',
                type: 'number',
                default: 100,
                min: 40,
                max: 200,
                description: 'Minimum rectangle width'
            },
            fontFamily: {
                label: 'Font Family',
                type: 'text',
                default: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                description: 'CSS font stack for task text'
            },
            fontWeight: {
                label: 'Font Weight',
                type: 'select',
                default: 700,
                options: [
                    { value: 300, label: 'Light (300)' },
                    { value: 400, label: 'Normal (400)' },
                    { value: 500, label: 'Medium (500)' },
                    { value: 600, label: 'Semibold (600)' },
                    { value: 700, label: 'Bold (700)' }
                ],
                description: 'Font weight for task text'
            },
            showDeleteConfirmation: {
                label: 'Show Delete Confirmation',
                type: 'checkbox',
                default: true,
                description: 'Show confirmation dialog when deleting tasks (can still undo with Ctrl+Z)'
            },
            autoHideCompletedNodes: {
                label: 'Auto-Hide Completed Nodes',
                type: 'checkbox',
                default: true,
                description: 'Automatically hide child nodes when they and their parent are marked done'
            },
            enableMultiline: {
                label: 'Enable Multiline Text',
                type: 'checkbox',
                default: true,
                description: 'Allow task text to wrap to multiple lines when it exceeds max width'
            },
            maxNodeWidth: {
                label: 'Max Node Width (px)',
                type: 'number',
                default: 600,
                min: 100,
                max: 2000,
                description: 'Maximum node width in pixels before text wraps to next line'
            },
            maxNodeHeight: {
                label: 'Max Node Height (px)',
                type: 'number',
                default: 0,
                min: 0,
                max: 1000,
                description: 'Maximum node height in pixels (0 = unlimited)'
            },
            lineHeight: {
                label: 'Line Height (px)',
                type: 'number',
                default: 20,
                min: 12,
                max: 40,
                description: 'Vertical spacing between lines of text'
            },
            wordWrap: {
                label: 'Word Wrap',
                type: 'checkbox',
                default: true,
                description: 'Wrap text on word boundaries (more readable) vs character boundaries'
            },
            enableMarkdown: {
                label: 'Enable Markdown Formatting',
                type: 'checkbox',
                default: true,
                description: 'Parse markdown in task titles: **bold**, *italic*, `code`, - bullets, [links](url)'
            },
            arrowStyle: {
                label: 'Arrow Style',
                type: 'select',
                default: 'straight',
                options: [
                    { value: 'straight', label: 'Straight' },
                    { value: 'curved', label: 'Curved' }
                ],
                description: 'Visual style for arrows connecting tasks'
            },
            arrowCurvature: {
                label: 'Arrow Curvature',
                type: 'number',
                default: 0.25,
                min: 0.05,
                max: 0.5,
                step: 0.05,
                description: 'Intensity of curve for curved arrows (0.05 = subtle, 0.5 = dramatic)'
            },
            arrowOppositeEdge: {
                label: 'Arrows Land on Opposite Edge',
                type: 'checkbox',
                default: true,
                description: 'Arrows land on the opposite edge (center of far side) instead of the nearest edge. Creates more consistent, organized layouts.'
            },
            arrowRoutingMode: {
                label: 'Arrow Routing Mode',
                type: 'select',
                default: 'direct',
                options: [
                    { value: 'direct', label: 'Direct (Straight/Curved)' },
                    { value: 'orthogonal', label: 'Orthogonal (90° Turns)' }
                ],
                description: 'Direct: arrows go straight from source to target. Orthogonal: arrows use 90-degree turns for a structured, circuit-board look. Toggle with Ctrl+Alt+A.'
            },
            orthogonalCornerRadius: {
                label: 'Orthogonal Corner Radius',
                type: 'number',
                default: 15,
                min: 0,
                max: 30,
                step: 1,
                description: 'Roundness of corners in orthogonal routing mode (0 = sharp 90° angles, 30 = smooth curves)'
            },
            enableSnapping: {
                label: 'Enable Alignment Snapping',
                type: 'checkbox',
                default: true,
                description: 'Snap nodes to align with edges and centers of nearby nodes when dragging. Shows visual guide lines during drag.'
            },
            snapThreshold: {
                label: 'Snap Detection Distance (px)',
                type: 'number',
                default: 10,
                min: 0,
                max: 50,
                step: 1,
                description: 'Distance in pixels for snap to activate. Higher values make snapping more aggressive.'
            },
            gridEnabled: {
                label: 'Show Grid',
                type: 'checkbox',
                default: false,
                description: 'Display a visual grid on the canvas for alignment reference'
            },
            gridSize: {
                label: 'Grid Cell Size (px)',
                type: 'number',
                default: 20,
                min: 5,
                max: 100,
                step: 5,
                description: 'Size of grid cells in pixels. Common values: 20 (fine), 50 (medium), 100 (coarse)'
            },
            gridSnapEnabled: {
                label: 'Snap to Grid',
                type: 'checkbox',
                default: true,
                description: 'Snap task positions to grid when grid is enabled. Disable for free positioning with visible grid.'
            },
            maxUndoSteps: {
                label: 'Max Undo History',
                type: 'number',
                default: 50,
                min: 5,
                max: 200,
                step: 5,
                description: 'Maximum number of undo steps to keep in history (5-200). Higher values use more memory.'
            }
        };

        // Generate form HTML
        const formContainer = document.getElementById('settings-form');
        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

        for (const [key, def] of Object.entries(configDefs)) {
            const currentValue = this[key];
            html += `
                <div class="settings-field">
                    <label style="display: block; font-weight: 600; margin-bottom: 3px; font-size: 13px;">
                        ${def.label}
                    </label>
                    <div style="font-size: 11px; color: #666; margin-bottom: 5px;">
                        ${def.description}
                    </div>`;

            if (def.type === 'number') {
                // Special handling for charWidth: add calibration button
                if (key === 'charWidth') {
                    html += `
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input
                                type="number"
                                id="setting-${key}"
                                value="${currentValue}"
                                min="${def.min || ''}"
                                max="${def.max || ''}"
                                step="${def.step || 1}"
                                style="flex: 1; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px;"
                            />
                            <button
                                onclick="app.calibrateCharWidth()"
                                style="padding: 6px 12px; font-size: 12px; white-space: nowrap; background: #2196f3; color: white; border: 1px solid #1976d2; border-radius: 4px; cursor: pointer;"
                                onmouseover="this.style.background='#1976d2'"
                                onmouseout="this.style.background='#2196f3'"
                                title="Measure actual character width for current font">
                                📏 Calibrate
                            </button>
                        </div>`;
                } else {
                    html += `
                        <input
                            type="number"
                            id="setting-${key}"
                            value="${currentValue}"
                            min="${def.min || ''}"
                            max="${def.max || ''}"
                            step="${def.step || 1}"
                            style="width: 100%; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px;"
                        />`;
                }
            } else if (def.type === 'text') {
                html += `
                    <input
                        type="text"
                        id="setting-${key}"
                        value="${currentValue}"
                        style="width: 100%; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px;"
                    />`;
            } else if (def.type === 'select') {
                html += `<select id="setting-${key}" style="width: 100%; padding: 6px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px;">`;
                for (const opt of def.options) {
                    const selected = currentValue == opt.value ? 'selected' : '';
                    html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                }
                html += `</select>`;
            } else if (def.type === 'checkbox') {
                const checked = currentValue ? 'checked' : '';
                html += `
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input
                            type="checkbox"
                            id="setting-${key}"
                            ${checked}
                            style="width: 18px; height: 18px; cursor: pointer;"
                        />
                        <span style="font-size: 14px;">Enable this option</span>
                    </label>`;
            }

            html += `</div>`;
        }

        html += '</div>';
        formContainer.innerHTML = html;

        // Store config defs for later use
        this._configDefs = configDefs;

        // Add ESC key handler
        this._settingsEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideSettingsModal();
            }
        };
        document.addEventListener('keydown', this._settingsEscHandler);

        // Add click-outside handler
        this._settingsClickHandler = (e) => {
            const modal = document.getElementById('settings-modal');
            if (e.target === modal) {
                this.hideSettingsModal();
            }
        };
        const modal = document.getElementById('settings-modal');
        modal.addEventListener('click', this._settingsClickHandler);

        // Update history stats
        document.getElementById('undo-count').textContent = this.undoStack.length;
        document.getElementById('undo-limit').textContent = this.maxUndoSteps;
        document.getElementById('redo-count').textContent = this.redoStack.length;

        // Estimate memory usage
        const historyJSON = JSON.stringify({
            undoStack: this.undoStack,
            redoStack: this.redoStack
        });
        const sizeKB = Math.round(historyJSON.length / 1024);
        document.getElementById('history-size').textContent = sizeKB;

        // Show modal
        modal.classList.add('show');
    },

    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('show');

        // Reset scroll position for next time modal is opened
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }

        // Remove event listeners
        if (this._settingsEscHandler) {
            document.removeEventListener('keydown', this._settingsEscHandler);
            this._settingsEscHandler = null;
        }
        if (this._settingsClickHandler) {
            modal.removeEventListener('click', this._settingsClickHandler);
            this._settingsClickHandler = null;
        }
    },

    applySettings() {
        // Store old font settings to detect changes
        const oldFontFamily = this.fontFamily;
        const oldFontWeight = this.fontWeight;

        // Read values from form and update app state
        for (const key of Object.keys(this._configDefs)) {
            const input = document.getElementById(`setting-${key}`);
            const def = this._configDefs[key];

            if (def.type === 'number') {
                this[key] = parseFloat(input.value);
            } else if (def.type === 'select') {
                // Check if select values are numeric or string
                // If first option value is a number, parse as int, otherwise keep as string
                const firstOptionValue = def.options[0].value;
                if (typeof firstOptionValue === 'number' || !isNaN(parseInt(firstOptionValue))) {
                    this[key] = parseInt(input.value);
                } else {
                    this[key] = input.value; // Keep as string for non-numeric selects
                }
            } else if (def.type === 'checkbox') {
                this[key] = input.checked;
            } else {
                this[key] = input.value;
            }
        }

        // Enforce undo limit if maxUndoSteps was changed
        this.enforceUndoLimit();

        // Auto-calibrate charWidth if font settings changed
        const fontChanged = (this.fontFamily !== oldFontFamily || this.fontWeight !== oldFontWeight);
        if (fontChanged) {
            // Calibrate before render/save so the new charWidth is applied
            this.calibrateCharWidth(true); // true = automatic
            // Note: calibrateCharWidth already calls render() and saveToStorage()
        } else {
            // Re-render to apply visual changes
            this.render();

            // Save to localStorage
            this.saveToStorage();
        }

        // Hide modal
        this.hideSettingsModal();

        // Show success feedback
        this.showToast('Settings applied successfully', 'success');
    },

    resetSettings() {
        // Confirm before resetting
        this.showConfirm(
            'Reset Settings',
            'Are you sure you want to reset all settings to their default values?',
            () => {
                // Reset all config values to defaults
                for (const [key, def] of Object.entries(this._configDefs)) {
                    this[key] = def.default;
                }

                // Auto-calibrate charWidth for default font settings
                this.calibrateCharWidth(true); // true = automatic
                // Note: calibrateCharWidth already calls render() and saveToStorage()

                // Re-populate form with new values
                this.hideSettingsModal();
                this.showSettingsModal();

                // Show success feedback
                this.showToast('Settings reset to defaults', 'success');
            }
        );
    },

    exportSettings() {
        // Extract configuration parameters
        const settings = {
            textLengthThreshold: this.textLengthThreshold,
            charWidth: this.charWidth,
            nodePadding: this.nodePadding,
            wheelZoomSpeed: this.wheelZoomSpeed,
            minNodeWidth: this.minNodeWidth,
            fontFamily: this.fontFamily,
            fontWeight: this.fontWeight
        };

        // Format as pretty JSON
        const json = JSON.stringify(settings, null, 2);

        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            this.showToast('Settings copied to clipboard!', 'success');
        }).catch(err => {
            this.showAlert('Export Failed', 'Failed to copy to clipboard: ' + err.message);
        });
    }
};

console.log('[settings.js] Settings modal and configuration management loaded');

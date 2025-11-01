// @order: 2
// @category: core
// @description: Default configuration values and settings definitions

/**
 * Configuration Definitions
 *
 * Defines all user-customizable settings with metadata for the Settings modal.
 * Each config has:
 * - type: 'number' | 'text' | 'select' | 'checkbox'
 * - label: Display label in UI
 * - default: Default value
 * - description: Help text explaining the setting
 * - min/max: For number inputs
 * - options: For select dropdowns
 *
 * These are used by settings.js to generate the Settings modal UI.
 */

// Default configuration values (defined in state.js, documented here for reference)
const DEFAULT_CONFIG = {
    // Text & Typography
    charWidth: 8.5,
    nodePadding: 15,
    minNodeWidth: 100,
    maxNodeWidth: 600,
    maxNodeHeight: 0,
    lineHeight: 20,
    textLengthThreshold: 80,
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
    fontWeight: 700,
    enableMultiline: true,
    wordWrap: true,

    // Visual Styling
    arrowStyle: 'straight',
    arrowCurvature: 0.25,

    // Zoom & Navigation
    minZoom: 0.2,
    maxZoom: 4,
    zoomSpeed: 0.1,
    wheelZoomSpeed: 0.18,

    // Behavior
    showDeleteConfirmation: true,
    autoHideCompletedNodes: true,
    maxUndoSteps: 50,
};

// Configuration metadata for Settings UI (used by settings.js)
const CONFIG_DEFINITIONS = {
    // Text & Typography Section
    textAndTypography: {
        label: '📝 Text & Typography',
        settings: {
            fontFamily: {
                type: 'text',
                label: 'Font Family',
                default: DEFAULT_CONFIG.fontFamily,
                description: 'CSS font family stack for task text'
            },
            fontWeight: {
                type: 'select',
                label: 'Font Weight',
                default: 700,
                options: [
                    { value: 400, label: 'Normal (400)' },
                    { value: 500, label: 'Medium (500)' },
                    { value: 600, label: 'Semibold (600)' },
                    { value: 700, label: 'Bold (700)' }
                ],
                description: 'Text boldness'
            },
            charWidth: {
                type: 'number',
                label: 'Character Width (px)',
                default: DEFAULT_CONFIG.charWidth,
                min: 5,
                max: 15,
                step: 0.1,
                description: 'Pixels per character for node width calculation'
            },
            nodePadding: {
                type: 'number',
                label: 'Node Padding (px)',
                default: DEFAULT_CONFIG.nodePadding,
                min: 5,
                max: 30,
                description: 'Left/right padding inside task rectangles'
            },
            minNodeWidth: {
                type: 'number',
                label: 'Min Node Width (px)',
                default: DEFAULT_CONFIG.minNodeWidth,
                min: 50,
                max: 200,
                description: 'Minimum rectangle width'
            },
            textLengthThreshold: {
                type: 'number',
                label: 'Text Truncation Limit',
                default: DEFAULT_CONFIG.textLengthThreshold,
                min: 20,
                max: 200,
                description: 'Character limit before truncation'
            }
        }
    },

    // Multiline Text Section
    multilineText: {
        label: '📄 Multiline Text',
        settings: {
            enableMultiline: {
                type: 'checkbox',
                label: 'Enable Multiline',
                default: DEFAULT_CONFIG.enableMultiline,
                description: 'Allow task text to wrap to multiple lines'
            },
            maxNodeWidth: {
                type: 'number',
                label: 'Max Node Width (px)',
                default: DEFAULT_CONFIG.maxNodeWidth,
                min: 100,
                max: 1000,
                description: 'Maximum node width before text wrapping'
            },
            maxNodeHeight: {
                type: 'number',
                label: 'Max Node Height (px, 0=unlimited)',
                default: DEFAULT_CONFIG.maxNodeHeight,
                min: 0,
                max: 500,
                description: 'Maximum node height (0 = unlimited)'
            },
            lineHeight: {
                type: 'number',
                label: 'Line Height (px)',
                default: DEFAULT_CONFIG.lineHeight,
                min: 12,
                max: 40,
                description: 'Vertical spacing between text lines'
            },
            wordWrap: {
                type: 'checkbox',
                label: 'Word Wrap',
                default: DEFAULT_CONFIG.wordWrap,
                description: 'Wrap on word boundaries (vs character boundaries)'
            }
        }
    },

    // Visual Styling Section
    visualStyling: {
        label: '🎨 Visual Styling',
        settings: {
            arrowStyle: {
                type: 'select',
                label: 'Arrow Style',
                default: DEFAULT_CONFIG.arrowStyle,
                options: [
                    { value: 'straight', label: 'Straight' },
                    { value: 'curved', label: 'Curved' }
                ],
                description: 'Relationship line style'
            },
            arrowCurvature: {
                type: 'number',
                label: 'Arrow Curvature',
                default: DEFAULT_CONFIG.arrowCurvature,
                min: 0.1,
                max: 0.5,
                step: 0.05,
                description: 'Curve intensity for curved arrows (0.1 to 0.5)'
            }
        }
    },

    // Zoom & Navigation Section
    zoomAndNavigation: {
        label: '🔍 Zoom & Navigation',
        settings: {
            minZoom: {
                type: 'number',
                label: 'Min Zoom',
                default: DEFAULT_CONFIG.minZoom,
                min: 0.1,
                max: 1,
                step: 0.1,
                description: 'Minimum zoom level'
            },
            maxZoom: {
                type: 'number',
                label: 'Max Zoom',
                default: DEFAULT_CONFIG.maxZoom,
                min: 2,
                max: 10,
                description: 'Maximum zoom level'
            },
            zoomSpeed: {
                type: 'number',
                label: 'Keyboard Zoom Speed',
                default: DEFAULT_CONFIG.zoomSpeed,
                min: 0.05,
                max: 0.3,
                step: 0.05,
                description: 'Zoom increment for Ctrl +/-'
            },
            wheelZoomSpeed: {
                type: 'number',
                label: 'Wheel Zoom Speed',
                default: DEFAULT_CONFIG.wheelZoomSpeed,
                min: 0.05,
                max: 0.5,
                step: 0.01,
                description: 'Zoom speed for wheel/trackpad'
            }
        }
    },

    // Behavior Section
    behavior: {
        label: '⚙️ Behavior',
        settings: {
            showDeleteConfirmation: {
                type: 'checkbox',
                label: 'Show Delete Confirmation',
                default: DEFAULT_CONFIG.showDeleteConfirmation,
                description: 'Show confirmation dialog when deleting tasks'
            },
            autoHideCompletedNodes: {
                type: 'checkbox',
                label: 'Auto-Hide Completed',
                default: DEFAULT_CONFIG.autoHideCompletedNodes,
                description: 'Auto-hide nodes when task and parent are done'
            },
            maxUndoSteps: {
                type: 'number',
                label: 'Max Undo Steps',
                default: DEFAULT_CONFIG.maxUndoSteps,
                min: 10,
                max: 200,
                description: 'Maximum undo/redo history depth'
            }
        }
    }
};

console.log('✓ Configuration loaded');

/**
 * @order 12
 * @category Data
 * @description JSON import/export functionality
 *
 * This module provides:
 * - exportData() - Downloads complete app state as JSON file
 * - copyDataToClipboard() - Copies JSON to clipboard with visual feedback
 * - importData() - Imports JSON from textarea (with validation)
 * - showImportModal() - Shows import modal
 * - hideImportModal() - Hides import modal
 *
 * EXPORT FORMAT:
 * - Complete localStorage snapshot (same format as saveToStorage)
 * - Filename: task-tree-YYYY-MM-DD.json
 *
 * IMPORT VALIDATION:
 * - Checks for valid JSON format
 * - Validates required fields (tasks array must exist)
 * - Creates undo snapshot before import (can undo accidental import)
 * - Shows success/error notifications
 *
 * UI INTEGRATION:
 * - Called from control panel buttons
 * - Import modal defined in HTML (id="import-modal")
 */

/**
 * Export complete app state as downloadable JSON file
 * Filename format: task-tree-YYYY-MM-DD.json
 */
app.exportData = function() {
    const json = localStorage.getItem('taskTree') || '{}';
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-tree-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Copy complete app state JSON to clipboard
 * Shows visual feedback on button (green + "Copied!" text)
 * @param {Event} e - Click event from button
 */
app.copyDataToClipboard = function(e) {
    const json = localStorage.getItem('taskTree') || '{}';
    navigator.clipboard.writeText(json).then(() => {
        // Show brief feedback
        const btn = e.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
    }).catch(err => {
        this.showAlert('Copy Failed', 'Failed to copy to clipboard: ' + err.message);
    });
};

/**
 * Show import modal for pasting JSON data
 * Clears textarea and displays modal
 */
app.showImportModal = function() {
    const modal = document.getElementById('import-modal');
    modal.classList.add('show');
    document.getElementById('import-textarea').value = '';
};

/**
 * Hide import modal
 */
app.hideImportModal = function() {
    const modal = document.getElementById('import-modal');
    modal.classList.remove('show');
};

/**
 * Import JSON data from textarea
 * Validates format, creates undo snapshot, and loads data
 * Shows success/error alert
 */
app.importData = function() {
    const textarea = document.getElementById('import-textarea');
    const json = textarea.value.trim();

    if (!json) {
        this.showAlert('Import Error', 'Please paste JSON data first.');
        return;
    }

    try {
        // Validate JSON
        const parsed = JSON.parse(json);
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
            throw new Error('Invalid task tree format');
        }

        // Save snapshot before importing
        const taskCount = parsed.tasks ? parsed.tasks.length : 0;
        this.saveSnapshot(`Imported ${taskCount} task${taskCount !== 1 ? 's' : ''} from JSON`);

        // Save and load
        localStorage.setItem('taskTree', json);
        this.loadFromStorage();
        this.updateStatusBar();
        this.render();
        this.hideImportModal();

        this.showAlert('Success', 'Data imported successfully!');
    } catch (err) {
        this.showAlert('Import Error', 'Invalid JSON data: ' + err.message);
    }
};

console.log('[import-export.js] JSON import/export functionality loaded');

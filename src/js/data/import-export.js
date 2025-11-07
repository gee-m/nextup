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
 * Export complete app state as downloadable .zip file containing:
 * - tasks.json: All task data and settings
 * - images/: Folder with all images from IndexedDB
 * Filename format: task-tree-YYYY-MM-DD.zip
 */
app.exportData = async function() {
    try {
        // Get all images from IndexedDB
        const images = await this.getAllImages();

        // If no images, export as JSON for backwards compatibility
        if (images.length === 0) {
            const json = localStorage.getItem('taskTree') || '{}';
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `task-tree-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('✓ Exported as JSON', 'success', 2000);
            return;
        }

        // Create .zip with JSZip
        const zip = new JSZip();

        // Add tasks.json
        const json = localStorage.getItem('taskTree') || '{}';
        zip.file('tasks.json', json);

        // Add images folder
        const imagesFolder = zip.folder('images');
        for (const image of images) {
            // Save each image with its ID as filename
            const extension = image.type.split('/')[1] || 'png';
            imagesFolder.file(`${image.id}.${extension}`, image.blob);
        }

        // Generate .zip blob
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // Download .zip file
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-tree-${new Date().toISOString().slice(0,10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);

        const sizeMB = (zipBlob.size / 1024 / 1024).toFixed(2);
        this.showToast(`✓ Exported .zip (${sizeMB}MB, ${images.length} images)`, 'success', 3000);
    } catch (error) {
        console.error('Export error:', error);
        this.showToast(`❌ Export failed: ${error.message}`, 'error', 3000);
    }
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
 * Show import modal for uploading files or pasting JSON data
 * Clears textarea and file input, displays modal
 */
app.showImportModal = function() {
    const modal = document.getElementById('import-modal');
    modal.classList.add('show');
    document.getElementById('import-textarea').value = '';
    document.getElementById('import-file').value = '';
};

/**
 * Hide import modal
 */
app.hideImportModal = function() {
    const modal = document.getElementById('import-modal');
    modal.classList.remove('show');
};

/**
 * Import data from file (.zip or .json) or pasted JSON
 * Handles .zip files with images, backwards compatible with .json
 * Validates format, creates undo snapshot, and loads data
 */
app.importData = async function() {
    try {
        const fileInput = document.getElementById('import-file');
        const textarea = document.getElementById('import-textarea');

        // Check if file was selected
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];

            if (file.name.endsWith('.zip')) {
                // Handle .zip file
                await this.importZipFile(file);
            } else if (file.name.endsWith('.json')) {
                // Handle .json file
                const text = await file.text();
                await this.importJsonData(text);
            } else {
                this.showAlert('Import Error', 'Please select a .zip or .json file.');
                return;
            }
        } else {
            // Check if JSON was pasted
            const json = textarea.value.trim();
            if (!json) {
                this.showAlert('Import Error', 'Please select a file or paste JSON data.');
                return;
            }
            await this.importJsonData(json);
        }

        this.hideImportModal();
    } catch (error) {
        console.error('Import error:', error);
        this.showAlert('Import Error', error.message);
    }
};

/**
 * Import .zip file containing tasks.json and images folder
 * @param {File} file - .zip file
 */
app.importZipFile = async function(file) {
    try {
        // Load .zip file
        const zip = await JSZip.loadAsync(file);

        // Extract tasks.json
        const tasksFile = zip.file('tasks.json');
        if (!tasksFile) {
            throw new Error('.zip must contain tasks.json file');
        }

        const jsonText = await tasksFile.async('text');
        const parsed = JSON.parse(jsonText);

        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
            throw new Error('Invalid task tree format in tasks.json');
        }

        // Clear existing images
        await this.clearAllImages();

        // Import images from images/ folder
        const imagesFolder = zip.folder('images');
        if (imagesFolder) {
            const imageFiles = [];
            imagesFolder.forEach((relativePath, file) => {
                imageFiles.push({ path: relativePath, file: file });
            });

            for (const { path, file } of imageFiles) {
                const blob = await file.async('blob');
                const imageId = path.split('.')[0]; // Extract ID from filename
                await this.saveImage(blob, imageId);
            }

            console.log(`[import-export.js] Imported ${imageFiles.length} images`);
        }

        // Save snapshot before importing
        const taskCount = parsed.tasks.length;
        this.saveSnapshot(`Imported ${taskCount} task${taskCount !== 1 ? 's' : ''} from .zip`);

        // Save and load
        localStorage.setItem('taskTree', jsonText);
        this.loadFromStorage();
        this.updateStatusBar();
        this.render();

        const imageCount = imagesFolder ? Object.keys(zip.folder('images').files).length : 0;
        this.showAlert('Success', `Imported ${taskCount} tasks and ${imageCount} images!`);
    } catch (error) {
        throw new Error(`Failed to import .zip: ${error.message}`);
    }
};

/**
 * Import JSON data from text string
 * @param {string} json - JSON string
 */
app.importJsonData = async function(json) {
    try {
        // Validate JSON
        const parsed = JSON.parse(json);
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
            throw new Error('Invalid task tree format');
        }

        // Save snapshot before importing
        const taskCount = parsed.tasks.length;
        this.saveSnapshot(`Imported ${taskCount} task${taskCount !== 1 ? 's' : ''} from JSON`);

        // Save and load
        localStorage.setItem('taskTree', json);
        this.loadFromStorage();
        this.updateStatusBar();
        this.render();

        this.showAlert('Success', `Imported ${taskCount} tasks!`);
    } catch (error) {
        throw new Error(`Invalid JSON data: ${error.message}`);
    }
};

console.log('[import-export.js] JSON import/export functionality loaded');

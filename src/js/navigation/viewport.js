/**
 * @module navigation/viewport
 * @order 40
 * @category navigation
 *
 * Zoom and pan viewport controls
 */

export const ViewportMixin = {
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + this.zoomSpeed, this.maxZoom);
        this.updateZoomDisplay();
        this.render();
        this.saveToStorage();
    },

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - this.zoomSpeed, this.minZoom);
        this.updateZoomDisplay();
        this.render();
        this.saveToStorage();
    },

    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoomDisplay();
        this.render();
        this.saveToStorage();
    },

    zoomToFit() {
        if (this.tasks.length === 0) {
            this.resetZoom();
            return;
        }

        // Find bounding box of all visible tasks
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.tasks.forEach(task => {
            if (!task.hidden) {
                minX = Math.min(minX, task.x - 50);
                maxX = Math.max(maxX, task.x + 50);
                minY = Math.min(minY, task.y - 30);
                maxY = Math.max(maxY, task.y + 30);
            }
        });

        if (minX === Infinity) {
            this.resetZoom();
            return;
        }

        const padding = 100;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        // Calculate zoom to fit
        const scaleX = this.viewBox.width / width;
        const scaleY = this.viewBox.height / height;
        this.zoomLevel = Math.min(scaleX, scaleY, this.maxZoom);
        this.zoomLevel = Math.max(this.zoomLevel, this.minZoom);

        this.updateZoomDisplay();
        this.render();
        this.saveToStorage();
    },

    calibrateCharWidth(isAutomatic = false) {
        // Measure actual character width for current font settings
        const svg = document.getElementById('canvas');

        // Create temporary text element with current font settings
        const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tempText.style.fontFamily = this.fontFamily;
        tempText.style.fontWeight = this.fontWeight;
        tempText.style.fontSize = '14px'; // Match task text size

        // Use a representative sample of characters (100 chars of varied types)
        const sampleText = 'The quick brown fox jumps over the lazy dog 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnop';
        tempText.textContent = sampleText;
        tempText.setAttribute('x', 0);
        tempText.setAttribute('y', 0);

        // Temporarily add to DOM to measure
        svg.appendChild(tempText);
        const bbox = tempText.getBBox();
        const totalWidth = bbox.width;
        svg.removeChild(tempText);

        // Calculate average character width
        const measuredCharWidth = totalWidth / sampleText.length;

        // Update charWidth
        const oldCharWidth = this.charWidth;
        this.charWidth = Math.round(measuredCharWidth * 10) / 10; // Round to 1 decimal

        // Update the input field in settings modal
        const input = document.getElementById('setting-charWidth');
        if (input) {
            input.value = this.charWidth;
        }

        // Save and re-render
        this.saveToStorage();
        this.render();

        // Show feedback (different message for automatic vs manual calibration)
        if (!isAutomatic) {
            this.showToast(
                `Character width calibrated: ${oldCharWidth}px → ${this.charWidth}px`,
                'success',
                3000
            );
        } else {
            this.showToast(
                `Auto-calibrated for new font: ${this.charWidth}px`,
                'info',
                2000
            );
        }
    },

    updateZoomDisplay() {
        const percent = Math.round(this.zoomLevel * 100);
        const display = document.getElementById('zoomLevel');
        if (display) {
            display.textContent = `${percent}%`;
        }
    },

    updateViewBoxOnly() {
        // Update just the SVG viewBox for smooth zoom animation
        // Used during animated transitions to avoid full re-render
        const svg = document.getElementById('canvas');
        const viewBoxWidth = this.viewBox.width / this.zoomLevel;
        const viewBoxHeight = this.viewBox.height / this.zoomLevel;
        svg.setAttribute('viewBox',
            `${this.viewBox.x - (viewBoxWidth - this.viewBox.width) / 2} ` +
            `${this.viewBox.y - (viewBoxHeight - this.viewBox.height) / 2} ` +
            `${viewBoxWidth} ${viewBoxHeight}`
        );
    }
};

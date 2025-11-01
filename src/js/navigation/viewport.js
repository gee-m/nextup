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

/**
 * @module rendering/grid
 * @order 19
 * @category rendering
 * @description Grid rendering - draws background grid for visual alignment
 *
 * KEY FUNCTIONS:
 *
 * renderGrid() - Renders grid lines on canvas
 * - Calculates visible grid lines based on viewport
 * - Creates SVG line elements for grid
 * - Updates on pan/zoom changes
 * - Performance optimized: only renders visible lines
 *
 * clearGrid() - Removes all grid lines from canvas
 * - Clears existing grid group
 * - Called when grid is disabled
 *
 * Grid is rendered behind all other elements (order: 19, before nodes/links)
 */

export const GridMixin = {
    /**
     * Render grid lines on the canvas
     * Only renders lines visible in current viewport for performance
     */
    renderGrid() {
        if (!this.gridEnabled) {
            this.clearGrid();
            return;
        }

        const svg = document.getElementById('canvas');
        let gridGroup = document.getElementById('grid-group');

        // Create grid group if it doesn't exist (should be first child)
        if (!gridGroup) {
            gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gridGroup.id = 'grid-group';
            // Insert as first child so grid renders behind everything
            svg.insertBefore(gridGroup, svg.firstChild);
        }

        // Clear existing grid lines
        gridGroup.innerHTML = '';

        const { x, y, width, height } = this.viewBox;
        const size = this.gridSize;

        // Calculate grid bounds with some padding for smooth panning
        const startX = Math.floor(x / size) * size - size;
        const endX = Math.ceil((x + width) / size) * size + size;
        const startY = Math.floor(y / size) * size - size;
        const endY = Math.ceil((y + height) / size) * size + size;

        // Use dark mode aware color
        const color = this.darkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : this.gridColor;

        // Draw vertical lines
        for (let i = startX; i <= endX; i += size) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', i);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', i);
            line.setAttribute('y2', endY);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '1');
            line.style.pointerEvents = 'none'; // Grid doesn't intercept clicks
            gridGroup.appendChild(line);
        }

        // Draw horizontal lines
        for (let i = startY; i <= endY; i += size) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', i);
            line.setAttribute('x2', endX);
            line.setAttribute('y2', i);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '1');
            line.style.pointerEvents = 'none';
            gridGroup.appendChild(line);
        }
    },

    /**
     * Clear all grid lines from canvas
     */
    clearGrid() {
        const gridGroup = document.getElementById('grid-group');
        if (gridGroup) {
            gridGroup.innerHTML = '';
        }
    },

    /**
     * Snap coordinate to grid
     * @param {number} coord - The coordinate to snap
     * @returns {number} - Snapped coordinate
     */
    snapToGrid(coord) {
        if (!this.gridEnabled || !this.gridSnapEnabled) {
            return coord;
        }
        return Math.round(coord / this.gridSize) * this.gridSize;
    },

    /**
     * Snap a point (x, y) to grid
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {{x: number, y: number}} - Snapped coordinates
     */
    snapPointToGrid(x, y) {
        return {
            x: this.snapToGrid(x),
            y: this.snapToGrid(y)
        };
    }
};

console.log('[grid.js] Grid rendering module loaded');

/**
 * @order 6
 * @category Utils
 * @description SVG coordinate transformation utilities
 *
 * This module provides:
 * - getSVGPoint() - Converts screen coordinates to SVG user space coordinates
 *
 * CRITICAL: This function accounts for zoom, pan, and viewBox transformations.
 * All mouse event handlers must use this to get accurate SVG coordinates.
 *
 * Implementation uses getScreenCTM() which handles all transformations automatically.
 */

/**
 * Convert screen coordinates (clientX, clientY) to SVG user space coordinates
 * @param {MouseEvent} e - Mouse event with clientX and clientY properties
 * @returns {Object} {x, y} coordinates in SVG user space
 */
app.getSVGPoint = function(e) {
    const svg = document.getElementById('canvas');
    const pt = svg.createSVGPoint();

    // Use raw screen coordinates - getScreenCTM handles all transformations
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Transform from screen space to SVG user space
    const screenCTM = svg.getScreenCTM();
    if (screenCTM) {
        return pt.matrixTransform(screenCTM.inverse());
    }
    return pt;
};

console.log('[svg.js] SVG coordinate utilities loaded');

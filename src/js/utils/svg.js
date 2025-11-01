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
        const transformed = pt.matrixTransform(screenCTM.inverse());

        // DEFENSIVE: Log if we get NaN coordinates
        if (!isFinite(transformed.x) || !isFinite(transformed.y)) {
            console.error('getSVGPoint returned NaN!', {
                clientX: e.clientX,
                clientY: e.clientY,
                screenCTM: screenCTM,
                transformed: transformed
            });
        }

        return transformed;
    }

    // DEFENSIVE: If no screenCTM, log warning
    console.warn('getScreenCTM returned null, returning untransformed point');
    return pt;
};

console.log('[svg.js] SVG coordinate utilities loaded');

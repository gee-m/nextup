/**
 * @module utils/viewport-animation
 * @order 39
 * @category Utils
 *
 * Smooth viewport navigation animations
 * Extracts duplicate code from jump.js and homes.js
 */

export const ViewportAnimationMixin = {
    /**
     * Smoothly animate viewport to target position with zoom
     *
     * Three-phase animation for smooth UX:
     * 1. Zoom out to overview (see both current and target)
     * 2. Pan to target location
     * 3. Zoom in to target zoom level
     *
     * This creates a natural "fly-over" effect that helps users
     * maintain spatial awareness during navigation.
     *
     * @param {number} targetX - Target X coordinate (center point)
     * @param {number} targetY - Target Y coordinate (center point)
     * @param {number} targetZoom - Target zoom level (default 1.0)
     * @param {Object} options - Animation options
     * @param {number} options.overviewZoom - Zoom level for overview phase (default 0.3)
     * @param {Function} options.onComplete - Callback when animation completes
     * @returns {Promise} Resolves when animation completes
     *
     * @example
     * // Jump to task with smooth animation
     * await app.animateViewportTo(task.x, task.y, 1.0, {
     *     onComplete: () => app.showToast('Navigation complete')
     * });
     */
    animateViewportTo(targetX, targetY, targetZoom = 1.0, options = {}) {
        const {
            overviewZoom = 0.3,
            onComplete = null,
        } = options;

        return new Promise((resolve) => {
            // Store starting state
            const startX = this.viewBox.x + this.viewBox.width / 2;
            const startY = this.viewBox.y + this.viewBox.height / 2;
            const startZoom = this.zoomLevel;

            // Calculate distances for pan
            const dx = targetX - startX;
            const dy = targetY - startY;

            // Phase 1: Zoom out to overview
            this._animatePhase(0, this.ANIMATION.ZOOM_OUT_MS, (progress) => {
                const t = this.ANIMATION.EASING(progress);
                this.zoomLevel = startZoom + (overviewZoom - startZoom) * t;
                this.render();
            }, () => {
                // Phase 2: Pan to target location
                this._animatePhase(0, this.ANIMATION.PAN_MS, (progress) => {
                    const t = this.ANIMATION.EASING(progress);
                    const currentX = startX + dx * t;
                    const currentY = startY + dy * t;

                    // Update viewBox center
                    this.viewBox.x = currentX - this.viewBox.width / 2;
                    this.viewBox.y = currentY - this.viewBox.height / 2;
                    this.render();
                }, () => {
                    // Phase 3: Zoom in to target level
                    this._animatePhase(0, this.ANIMATION.ZOOM_IN_MS, (progress) => {
                        const t = this.ANIMATION.EASING(progress);
                        this.zoomLevel = overviewZoom + (targetZoom - overviewZoom) * t;

                        // Recenter on target during zoom to prevent drift
                        this.viewBox.x = targetX - this.viewBox.width / 2;
                        this.viewBox.y = targetY - this.viewBox.height / 2;
                        this.render();
                    }, () => {
                        // Final positioning - ensure exact target state
                        this.zoomLevel = targetZoom;
                        this.viewBox.x = targetX - this.viewBox.width / 2;
                        this.viewBox.y = targetY - this.viewBox.height / 2;
                        this.render();

                        // Execute callback and resolve promise
                        if (onComplete) onComplete();
                        resolve();
                    });
                });
            });
        });
    },

    /**
     * Helper: Animate a single phase using requestAnimationFrame
     *
     * @param {number} startTime - Animation start time (0 for first frame)
     * @param {number} duration - Phase duration in milliseconds
     * @param {Function} onProgress - Callback with progress (0 to 1)
     * @param {Function} onComplete - Callback when phase complete
     * @private
     */
    _animatePhase(startTime, duration, onProgress, onComplete) {
        const animate = (currentTime) => {
            // Initialize start time on first frame
            if (startTime === 0) startTime = currentTime;

            // Calculate progress (0 to 1)
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            // Update via callback
            onProgress(progress);

            // Continue or complete
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                onComplete();
            }
        };

        requestAnimationFrame(animate);
    },

    /**
     * Instant jump to position (no animation)
     * Useful for immediate navigation or when animation is disabled
     *
     * @param {number} targetX - Target X coordinate (center)
     * @param {number} targetY - Target Y coordinate (center)
     * @param {number} targetZoom - Target zoom level (default 1.0)
     */
    jumpToPosition(targetX, targetY, targetZoom = 1.0) {
        this.zoomLevel = targetZoom;
        this.viewBox.x = targetX - this.viewBox.width / 2;
        this.viewBox.y = targetY - this.viewBox.height / 2;
        this.render();
    },
};

console.log('[viewport-animation.js] Smooth viewport navigation animations loaded');

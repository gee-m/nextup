/**
 * @module rendering/indicators
 * @order 21
 * @category rendering
 *
 * Off-screen indicators for working tasks and homes
 */

export const IndicatorsMixin = {
    renderOffscreenIndicators() {
        // Show arrows on screen edges pointing to off-screen targets (working tasks and homes)
        const container = document.getElementById('offscreen-indicators');
        if (!container) return;

        // Clear existing indicators
        container.innerHTML = '';

        // Calculate visible viewport bounds in SVG coordinates
        const svg = document.getElementById('canvas');
        const actualViewBoxWidth = this.viewBox.width / this.zoomLevel;
        const actualViewBoxHeight = this.viewBox.height / this.zoomLevel;
        const viewportLeft = this.viewBox.x - (actualViewBoxWidth - this.viewBox.width) / 2;
        const viewportRight = viewportLeft + actualViewBoxWidth;
        const viewportTop = this.viewBox.y - (actualViewBoxHeight - this.viewBox.height) / 2;
        const viewportBottom = viewportTop + actualViewBoxHeight;
        const viewportCenterX = (viewportLeft + viewportRight) / 2;
        const viewportCenterY = (viewportTop + viewportBottom) / 2;

        // Get all working tasks
        const workingTasks = this.tasks.filter(t => t.currentlyWorking && !t.hidden);

        // Find off-screen working tasks
        const offscreenTasks = workingTasks.filter(task => {
            return task.x < viewportLeft || task.x > viewportRight ||
                   task.y < viewportTop || task.y > viewportBottom;
        });

        // Find off-screen homes
        const offscreenHomes = this.homes.filter(home => {
            return home.centerX < viewportLeft || home.centerX > viewportRight ||
                   home.centerY < viewportTop || home.centerY > viewportBottom;
        });

        // Use canvas-container dimensions (not window, to avoid overlapping buttons)
        const canvasContainer = document.getElementById('canvas-container');
        const screenWidth = canvasContainer.clientWidth;
        const screenHeight = canvasContainer.clientHeight;
        const margin = 20; // Pixels from edge

        // Calculate top margin to avoid controls bar overlap
        // Controls bar is position:fixed, canvas-container has top:65px, but controls might be taller
        const controlsBar = document.getElementById('controls');
        const controlsBottom = controlsBar ? controlsBar.getBoundingClientRect().bottom : 65; // Actual bottom position
        const canvasTop = canvasContainer.getBoundingClientRect().top; // Actual canvas top position
        const overlap = Math.max(0, controlsBottom - canvasTop); // How much controls extends into canvas
        const topMargin = overlap + 20; // Overlap + 20px buffer (increased for safety)

        // Render indicators for each off-screen working task
        offscreenTasks.forEach(task => {
            this.createDirectionalIndicator({
                container,
                targetX: task.x,
                targetY: task.y,
                viewportCenterX,
                viewportCenterY,
                screenWidth,
                screenHeight,
                margin,
                topMargin,
                type: 'task',
                title: task.title,
                onClick: () => this.jumpToWorkingTask(task.id)
            });
        });

        // Render indicators for each off-screen home
        offscreenHomes.forEach(home => {
            this.createDirectionalIndicator({
                container,
                targetX: home.centerX,
                targetY: home.centerY,
                viewportCenterX,
                viewportCenterY,
                screenWidth,
                screenHeight,
                margin,
                topMargin,
                type: 'home',
                title: home.name,
                icon: home.icon || '🏠',  // Use custom icon or default
                onClick: () => this.jumpToHome(home.id)
            });
        });
    },

    createDirectionalIndicator({ container, targetX, targetY, viewportCenterX, viewportCenterY, screenWidth, screenHeight, margin, topMargin, type, title, icon, onClick }) {
        // Calculate angle from viewport center to target
        const dx = targetX - viewportCenterX;
        const dy = targetY - viewportCenterY;
        const angle = Math.atan2(dy, dx); // Radians

        // Screen center
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2;

        // Find intersection with screen rectangle
        // Ray from center: (screenCenterX + t*cos(angle), screenCenterY + t*sin(angle))
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        // Calculate t for each edge intersection (use topMargin for top edge to avoid header)
        const tRight = cosAngle > 0 ? (screenWidth - margin - screenCenterX) / cosAngle : Infinity;
        const tLeft = cosAngle < 0 ? (margin - screenCenterX) / cosAngle : Infinity;
        const tBottom = sinAngle > 0 ? (screenHeight - margin - screenCenterY) / sinAngle : Infinity;
        const tTop = sinAngle < 0 ? (topMargin - screenCenterY) / sinAngle : Infinity;

        // Find minimum positive t (closest intersection)
        const t = Math.min(tRight, tLeft, tBottom, tTop);

        // Calculate intersection point
        const edgeX = screenCenterX + t * cosAngle;
        const edgeY = screenCenterY + t * sinAngle;

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'offscreen-indicator' + (type === 'home' ? ' home' : '');
        indicator.style.left = `${edgeX}px`;
        indicator.style.top = `${edgeY}px`;

        // Convert radians to degrees
        const rotation = angle * (180 / Math.PI);

        // For homes: add 90 degrees so the roof points in the direction (not the side)
        const finalRotation = type === 'home' ? rotation + 90 : rotation;

        // Rotate arrows and homes to point toward target
        indicator.style.transform = `translate(-50%, -50%) rotate(${finalRotation}deg)`;

        // Use different emojis: arrow for tasks, custom icon for homes
        indicator.innerHTML = type === 'home' ? (icon || '🏠') : '➤';

        // Create separate tooltip element (won't rotate with indicator)
        const tooltip = document.createElement('div');
        tooltip.className = 'indicator-tooltip';
        const prefix = type === 'home' ? `${icon || '🏠'} Home: ` : '🎯 Task: ';
        tooltip.textContent = prefix + title;

        // Position tooltip on opposite side (visible side) based on angle
        // Normalize angle to 0-360
        const normalizedAngle = ((rotation % 360) + 360) % 360;

        // Determine best position for tooltip (opposite to where indicator is pointing inward)
        let tooltipX = edgeX;
        let tooltipY = edgeY;

        if (normalizedAngle >= 315 || normalizedAngle < 45) {
            // Pointing right, tooltip on left
            tooltipX = edgeX - 50;
            tooltipY = edgeY;
            tooltip.style.transform = 'translate(-100%, -50%)';
        } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
            // Pointing down, tooltip on top
            tooltipX = edgeX;
            tooltipY = edgeY - 50;
            tooltip.style.transform = 'translate(-50%, -100%)';
        } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
            // Pointing left, tooltip on right
            tooltipX = edgeX + 50;
            tooltipY = edgeY;
            tooltip.style.transform = 'translate(0%, -50%)';
        } else {
            // Pointing up, tooltip on bottom
            tooltipX = edgeX;
            tooltipY = edgeY + 50;
            tooltip.style.transform = 'translate(-50%, 0%)';
        }

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;

        // Show/hide tooltip on hover
        indicator.onmouseenter = () => tooltip.classList.add('visible');
        indicator.onmouseleave = () => tooltip.classList.remove('visible');

        indicator.title = title; // Fallback for browsers without CSS support
        indicator.onclick = onClick;

        // Add right-click support for home indicators to set icon
        if (type === 'home') {
            indicator.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Find the home by name to get its ID
                const home = this.homes.find(h => h.name === title);
                if (home) {
                    this.setHomeIcon(home.id);
                }
            };
        }

        container.appendChild(indicator);
        container.appendChild(tooltip);
    }
};

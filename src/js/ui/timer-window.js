/**
 * @module ui/timer-window
 * @order 37
 * @category UI
 * @description Floating timer window for time tracking
 */

export const TimerWindowMixin = {
    /**
     * Render or update the timer window
     */
    updateTimerDisplay() {
        const container = document.getElementById('timer-window');
        if (!container) return;

        // Show window if there's a working task (even if timer paused)
        const workingTask = this.tasks.find(t => t.currentlyWorking);
        if (!workingTask) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        // Use working task, not necessarily the one with running timer
        const task = workingTask;
        if (!task) return;

        // Get current session time
        const sessionSeconds = this.getCurrentSessionSeconds();
        const totalSeconds = this.getTotalTimeForTask(task.id);

        // Update content based on minimized state
        if (this.timerWindowMinimized) {
            container.innerHTML = `
                <div class="timer-badge" onclick="app.toggleTimerWindow()">
                    ⏱️ ${this.formatDuration(sessionSeconds)}
                </div>
            `;
        } else {
            const sessionCount = task.timeTracking ? task.timeTracking.sessions.length : 0;
            const taskTitle = this.truncateTitle(task.title || 'Untitled', 30);

            // Get recent sessions for display
            let sessionsHTML = '';
            if (task.timeTracking && task.timeTracking.sessions.length > 0) {
                const recentSessions = task.timeTracking.sessions.slice(-3).reverse();
                sessionsHTML = recentSessions.map(session => `
                    <div class="session-item">
                        • ${this.formatDuration(session.duration)} (${this.formatRelativeTime(session.startTime)})
                    </div>
                `).join('');
            }

            // Check if timer is currently running for this task
            const isTimerRunning = this.timerState.isRunning && this.timerState.taskId === task.id;
            const playPauseButton = isTimerRunning
                ? `<button onclick="app.stopTimer(); app.showToast('⏸️ Timer paused', 'info', 2000);" class="timer-btn-pause" title="Pause Timer">⏸️</button>`
                : `<button onclick="app.startTimer(${task.id}); app.showToast('▶️ Timer resumed', 'info', 2000);" class="timer-btn-play" title="Start Timer">▶️</button>`;

            container.innerHTML = `
                <div class="timer-window-header">
                    <span class="timer-title">⏱️ Time Tracker</span>
                    <div class="timer-controls">
                        ${playPauseButton}
                        <button onclick="app.toggleTimerWindow()" class="timer-btn-minimize" title="Minimize">−</button>
                        <button onclick="app.stopTimer()" class="timer-btn-close" title="Stop Timer">×</button>
                    </div>
                </div>
                <div class="timer-content">
                    <div class="timer-task-name">📌 ${taskTitle}</div>
                    <div class="timer-display">
                        <div class="timer-stat">
                            <span class="timer-label">Current Session:</span>
                            <span class="timer-value">${this.formatDuration(sessionSeconds)}</span>
                        </div>
                        <div class="timer-stat">
                            <span class="timer-label">Total Time:</span>
                            <span class="timer-value">${this.formatDuration(totalSeconds)}</span>
                        </div>
                        <div class="timer-stat">
                            <span class="timer-label">Sessions:</span>
                            <span class="timer-value">${sessionCount + 1}</span>
                        </div>
                    </div>
                    ${sessionsHTML ? `
                        <div class="timer-sessions">
                            <div class="timer-sessions-label">Recent Sessions:</div>
                            ${sessionsHTML}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    },

    /**
     * Toggle timer window between expanded and minimized
     */
    toggleTimerWindow() {
        this.timerWindowMinimized = !this.timerWindowMinimized;
        this.updateTimerDisplay();
    }
};

console.log('[timer-window.js] Timer window UI loaded');

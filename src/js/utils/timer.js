/**
 * @module utils/timer
 * @order 10
 * @category Utils
 * @description Time tracking utilities for task sessions
 */

export const TimerMixin = {
    /**
     * Start a timer session for a task
     * @param {number} taskId - Task to start timing
     */
    startTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error(`[Timer] Task ${taskId} not found`);
            return;
        }

        // Stop any existing timer first
        if (this.timerState.isRunning) {
            this.stopTimer();
        }

        // Initialize timeTracking if needed
        if (!task.timeTracking) {
            task.timeTracking = {
                totalSeconds: 0,
                sessions: []
            };
        }

        // Start new session
        this.timerState.isRunning = true;
        this.timerState.taskId = taskId;
        this.timerState.sessionStartTime = Date.now();

        // Start interval to update UI every second
        this.timerState.intervalId = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);

        this.updateTimerDisplay();
        console.log(`[Timer] Started for task ${taskId}`);
    },

    /**
     * Stop the current timer session and save it
     */
    stopTimer() {
        if (!this.timerState.isRunning) {
            return; // No timer running
        }

        const taskId = this.timerState.taskId;
        const task = this.tasks.find(t => t.id === taskId);

        if (task && task.timeTracking) {
            const endTime = Date.now();
            const duration = Math.floor((endTime - this.timerState.sessionStartTime) / 1000); // seconds

            // Save session
            const session = {
                startTime: this.timerState.sessionStartTime,
                endTime: endTime,
                duration: duration
            };
            task.timeTracking.sessions.push(session);
            task.timeTracking.totalSeconds += duration;

            console.log(`[Timer] Stopped. Session: ${this.formatDuration(duration)}, Total: ${this.formatDuration(task.timeTracking.totalSeconds)}`);
        }

        // Clear interval
        if (this.timerState.intervalId) {
            clearInterval(this.timerState.intervalId);
            this.timerState.intervalId = null;
        }

        // Reset state
        this.timerState.isRunning = false;
        this.timerState.taskId = null;
        this.timerState.sessionStartTime = null;

        this.updateTimerDisplay();
        this.saveToStorage();
    },

    /**
     * Get current elapsed time in seconds for active session
     * @returns {number} Elapsed seconds
     */
    getCurrentSessionSeconds() {
        if (!this.timerState.isRunning) {
            return 0;
        }
        return Math.floor((Date.now() - this.timerState.sessionStartTime) / 1000);
    },

    /**
     * Get total time (including current session) for a task
     * @param {number} taskId - Task ID
     * @returns {number} Total seconds
     */
    getTotalTimeForTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.timeTracking) {
            return 0;
        }

        let total = task.timeTracking.totalSeconds;

        // Add current session if task is being timed
        if (this.timerState.isRunning && this.timerState.taskId === taskId) {
            total += this.getCurrentSessionSeconds();
        }

        return total;
    },

    /**
     * Format duration as HH:MM:SS
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    },

    /**
     * Format duration in compact form for badges (e.g., "2h 15m" or "15m")
     * @param {number} seconds - Duration in seconds
     * @returns {string} Compact formatted duration
     */
    formatDurationCompact(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else if (mins > 0) {
            return `${mins}m`;
        } else {
            return '<1m';
        }
    },

    /**
     * Format timestamp as relative time (e.g., "2 hours ago")
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Relative time string
     */
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

        // Older than a week, show date
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    },

    /**
     * Update timer window display (to be implemented in timer-window.js)
     */
    updateTimerDisplay() {
        // This will be implemented by timer-window.js
        // Placeholder for now
    }
};

console.log('[timer.js] Time tracking utilities loaded');

/**
 * @module ui/time-tracking-dashboard
 * @order 38
 * @category UI
 *
 * Global time tracking dashboard - shows all tasks with tracked time
 */

export const TimeTrackingDashboardMixin = {
    /**
     * Show global time tracking dashboard
     * Displays sortable table of all tasks with tracked time
     */
    showTimeTrackingDashboard() {
        const modal = document.getElementById('time-dashboard-modal');
        const content = document.getElementById('time-dashboard-content');

        // Get all tasks with tracked time
        const tasksWithTime = this.tasks
            .filter(t => t.timeTracking && t.timeTracking.totalSeconds > 0)
            .map(t => ({
                id: t.id,
                title: this.getTaskDisplayTitle(t, 40),
                totalSeconds: t.timeTracking.totalSeconds,
                sessionCount: t.timeTracking.sessions.length,
                lastWorked: t.timeTracking.sessions.length > 0
                    ? Math.max(...t.timeTracking.sessions.map(s => s.endTime))
                    : 0
            }))
            .sort((a, b) => b.lastWorked - a.lastWorked); // Default sort: most recent first

        if (tasksWithTime.length === 0) {
            content.innerHTML = `
                <p style="text-align: center; color: #999; padding: 60px 20px;">
                    No time tracked yet. Start working on a task (middle-click) to begin tracking time.
                </p>
            `;
        } else {
            // Build table HTML
            let html = `
                <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${tasksWithTime.length}</strong> task${tasksWithTime.length !== 1 ? 's' : ''} with tracked time
                    </div>
                    <button onclick="app.exportTimeTracking()" style="padding: 6px 12px; font-size: 12px;">
                        📥 Export CSV
                    </button>
                </div>
                <table class="time-dashboard-table">
                    <thead>
                        <tr>
                            <th style="text-align: left; cursor: pointer;" onclick="app.sortTimeDashboard('title')">
                                Task <span style="font-size: 11px;">▼</span>
                            </th>
                            <th style="cursor: pointer;" onclick="app.sortTimeDashboard('totalTime')">
                                Total Time <span style="font-size: 11px;">▼</span>
                            </th>
                            <th style="cursor: pointer;" onclick="app.sortTimeDashboard('sessions')">
                                Sessions <span style="font-size: 11px;">▼</span>
                            </th>
                            <th style="cursor: pointer;" onclick="app.sortTimeDashboard('lastWorked')">
                                Last Worked <span style="font-size: 11px;">▼</span>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            tasksWithTime.forEach(task => {
                const totalTime = this.formatDurationCompact(task.totalSeconds);
                const lastWorked = this.formatRelativeTime(task.lastWorked);

                html += `
                    <tr>
                        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${task.title}
                        </td>
                        <td style="text-align: center; font-weight: 600; color: #4CAF50;">
                            ${totalTime}
                        </td>
                        <td style="text-align: center;">
                            ${task.sessionCount}
                        </td>
                        <td style="text-align: center; color: #666;">
                            ${lastWorked}
                        </td>
                        <td style="text-align: right;">
                            <button onclick="app.jumpToTaskFromDashboard(${task.id})" style="padding: 4px 8px; font-size: 11px;">
                                🎯 Jump
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            content.innerHTML = html;
        }

        modal.classList.add('show');

        // Close on ESC or click outside
        const closeHandler = (e) => {
            if (e.key === 'Escape' || e.target === modal) {
                this.hideTimeTrackingDashboard();
                document.removeEventListener('keydown', closeHandler);
                modal.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
        modal.addEventListener('click', closeHandler);

        // Store current sort state
        this.timeDashboardSort = { field: 'lastWorked', ascending: false };
    },

    /**
     * Hide time tracking dashboard
     */
    hideTimeTrackingDashboard() {
        const modal = document.getElementById('time-dashboard-modal');
        modal.classList.remove('show');
    },

    /**
     * Sort time dashboard table
     * @param {string} field - Field to sort by ('title', 'totalTime', 'sessions', 'lastWorked')
     */
    sortTimeDashboard(field) {
        // Toggle sort direction if clicking same field
        if (this.timeDashboardSort && this.timeDashboardSort.field === field) {
            this.timeDashboardSort.ascending = !this.timeDashboardSort.ascending;
        } else {
            this.timeDashboardSort = { field, ascending: false };
        }

        // Re-render with new sort
        this.showTimeTrackingDashboard();
    },

    /**
     * Jump to task from dashboard (with animation)
     * @param {number} taskId - Task ID to jump to
     */
    jumpToTaskFromDashboard(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.hideTimeTrackingDashboard();

        // Select the task
        this.selectedTaskIds.clear();
        this.selectedTaskIds.add(taskId);

        // Animate to task
        this.animateViewportTo(task.x, task.y, 1, {
            overviewZoom: 0.3,
            onComplete: () => {
                this.updateZoomDisplay();
                this.saveToStorage();
                this.showToast(`Jumped to "${this.getTaskDisplayTitle(task, 30)}"`, 'success', 2000);
            }
        });
    },

    /**
     * Export time tracking data as CSV
     */
    exportTimeTracking() {
        const tasksWithTime = this.tasks.filter(t => t.timeTracking && t.timeTracking.totalSeconds > 0);

        if (tasksWithTime.length === 0) {
            this.showToast('⚠️ No time tracking data to export', 'warning');
            return;
        }

        // Build CSV content
        let csv = 'Task,Total Time (seconds),Total Time (formatted),Sessions,Last Worked\n';

        tasksWithTime.forEach(task => {
            const title = task.title.replace(/"/g, '""'); // Escape quotes
            const totalSeconds = task.timeTracking.totalSeconds;
            const totalFormatted = this.formatDuration(totalSeconds);
            const sessionCount = task.timeTracking.sessions.length;
            const lastWorked = sessionCount > 0
                ? new Date(Math.max(...task.timeTracking.sessions.map(s => s.endTime))).toLocaleString()
                : 'Never';

            csv += `"${title}",${totalSeconds},"${totalFormatted}",${sessionCount},"${lastWorked}"\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-tracking-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast(`📥 Exported ${tasksWithTime.length} tasks to CSV`, 'success');
    }
};

console.log('✓ Time tracking dashboard mixin loaded');

/**
 * @module ui/modals
 * @order 30
 * @category ui
 *
 * Modal dialog system (confirm, alert, prompt)
 */

export const ModalsMixin = {
    showConfirm(title, message, onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        const modal = document.getElementById('confirm-modal');
        modal.classList.add('show');

        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        // Remove old listeners by cloning
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        yesBtn.replaceWith(newYesBtn);
        noBtn.replaceWith(newNoBtn);

        newYesBtn.onclick = () => {
            this.hideConfirm();
            onConfirm();
        };
        newNoBtn.onclick = () => this.hideConfirm();
    },

    hideConfirm() {
        const modal = document.getElementById('confirm-modal');
        modal.classList.remove('show');
    },

    showAlert(title, message) {
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-message').textContent = message;
        const modal = document.getElementById('alert-modal');
        modal.classList.add('show');

        const okBtn = document.getElementById('alert-ok');
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.replaceWith(newOkBtn);

        newOkBtn.onclick = () => this.hideAlert();
    },

    hideAlert() {
        const modal = document.getElementById('alert-modal');
        modal.classList.remove('show');
    },

    showPrompt(title, message, defaultValue, onConfirm) {
        document.getElementById('prompt-title').textContent = title;
        document.getElementById('prompt-message').textContent = message;
        const input = document.getElementById('prompt-input');
        input.value = defaultValue || '';

        const modal = document.getElementById('prompt-modal');
        modal.classList.add('show');

        // Focus input after modal shows
        setTimeout(() => input.focus(), 100);

        // Clone buttons to remove old event listeners
        const okBtn = document.getElementById('prompt-ok');
        const cancelBtn = document.getElementById('prompt-cancel');
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.replaceWith(newOkBtn);
        cancelBtn.replaceWith(newCancelBtn);

        newOkBtn.onclick = () => {
            const value = input.value;
            this.hidePrompt();
            if (onConfirm) onConfirm(value);
        };

        newCancelBtn.onclick = () => {
            this.hidePrompt();
        };

        // Enter key submits
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value;
                this.hidePrompt();
                if (onConfirm) onConfirm(value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hidePrompt();
            }
        };
    },

    hidePrompt() {
        const modal = document.getElementById('prompt-modal');
        modal.classList.remove('show');
    },

    /**
     * Show time tracking history for a specific task
     * @param {number} taskId - ID of the task
     */
    showTimeHistoryModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('time-history-modal');
        const content = document.getElementById('time-history-content');

        const timeTracking = task.timeTracking || { totalSeconds: 0, sessions: [] };
        const totalTime = this.formatDuration(timeTracking.totalSeconds);
        const sessionCount = timeTracking.sessions.length;

        // Build content HTML
        let html = `
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #333;">${this.getTaskDisplayTitle(task, 50)}</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Total Time</div>
                        <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${totalTime}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Sessions</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${sessionCount}</div>
                    </div>
                </div>
            </div>
        `;

        if (sessionCount === 0) {
            html += `<p style="text-align: center; color: #999; padding: 40px 0;">No time tracked yet for this task.</p>`;
        } else {
            html += `<h4 style="margin: 16px 0 12px 0; color: #333;">Session History</h4>`;
            html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;

            // Show sessions in reverse order (most recent first)
            const sortedSessions = [...timeTracking.sessions].reverse();
            sortedSessions.forEach((session, index) => {
                const duration = this.formatDuration(session.duration);
                const startTime = new Date(session.startTime).toLocaleString();
                const endTime = new Date(session.endTime).toLocaleString();
                const relativeTime = this.formatRelativeTime(session.startTime);

                html += `
                    <div style="background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: 600; color: #333;">Session ${sessionCount - index}</span>
                            <span style="font-size: 18px; font-weight: bold; color: #4CAF50;">${duration}</span>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            <div>Started: ${startTime}</div>
                            <div>Ended: ${endTime}</div>
                            <div style="margin-top: 4px; color: #999;">${relativeTime}</div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        content.innerHTML = html;
        modal.classList.add('show');

        // Close on ESC or click outside
        const closeHandler = (e) => {
            if (e.key === 'Escape' || e.target === modal) {
                this.hideTimeHistoryModal();
                document.removeEventListener('keydown', closeHandler);
                modal.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
        modal.addEventListener('click', closeHandler);
    },

    /**
     * Hide time history modal
     */
    hideTimeHistoryModal() {
        const modal = document.getElementById('time-history-modal');
        modal.classList.remove('show');
    },

    /**
     * Show emoji picker modal for selecting an icon
     * @param {string} title - Modal title
     * @param {string} currentEmoji - Currently selected emoji
     * @param {function} onConfirm - Callback with selected emoji
     */
    showEmojiPicker(title, currentEmoji, onConfirm) {
        document.getElementById('emoji-picker-title').textContent = title;
        const input = document.getElementById('emoji-custom-input');
        input.value = currentEmoji || '';

        const modal = document.getElementById('emoji-picker-modal');
        modal.classList.add('show');

        // Popular emojis organized by category
        const emojiCategories = {
            'Places & Navigation': ['🏠', '🏡', '🏢', '🏛️', '🏗️', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🗾', '🎪', '🎭'],
            'Symbols': ['⭐', '🌟', '💫', '✨', '🔥', '💥', '⚡', '🌈', '☀️', '🌙', '⭕', '❌', '✅', '❗', '❓', '💯'],
            'Arrows & Directions': ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '🔄', '🔁', '🔀', '🔃', '🔂', '▶️', '⏸️', '⏹️'],
            'Flags & Markers': ['🚩', '🏁', '🏳️', '🏴', '🎌', '🎏', '📍', '📌', '📎', '🔖', '🏷️', '💼', '🗂️', '📂', '📁', '🗃️'],
            'Activities': ['🎯', '🎲', '🎮', '🎰', '🎳', '🎸', '🎹', '🎺', '🎻', '🎬', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠'],
            'Work & Tools': ['💼', '📊', '📈', '📉', '🗂️', '📋', '📝', '🖊️', '✏️', '📌', '📍', '🔨', '⚒️', '🛠️', '⚙️', '🔧'],
            'Nature': ['🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍃', '🍂', '🍁', '🌺', '🌻', '🌹', '🌷', '💐'],
            'Food & Drink': ['☕', '🍵', '🧃', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🍴', '🍽️', '🥄', '🥢']
        };

        const grid = document.getElementById('emoji-picker-grid');
        grid.innerHTML = '';

        // Add emojis to grid
        Object.entries(emojiCategories).forEach(([category, emojis]) => {
            // Category header spanning all columns
            const header = document.createElement('div');
            header.style.cssText = 'grid-column: 1 / -1; font-size: 11px; font-weight: 600; color: #666; margin-top: 8px; margin-bottom: 4px;';
            header.textContent = category;
            grid.appendChild(header);

            // Emoji buttons
            emojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.textContent = emoji;
                btn.style.cssText = 'font-size: 24px; padding: 8px; background: white; border: 2px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s;';
                btn.onclick = () => {
                    input.value = emoji;
                    // Highlight selected
                    grid.querySelectorAll('button').forEach(b => b.style.borderColor = '#ddd');
                    btn.style.borderColor = '#007bff';
                };
                btn.onmouseenter = () => {
                    if (btn.style.borderColor !== 'rgb(0, 123, 255)') {
                        btn.style.borderColor = '#999';
                        btn.style.transform = 'scale(1.1)';
                    }
                };
                btn.onmouseleave = () => {
                    if (btn.style.borderColor !== 'rgb(0, 123, 255)') {
                        btn.style.borderColor = '#ddd';
                        btn.style.transform = 'scale(1)';
                    }
                };
                grid.appendChild(btn);
            });
        });

        // Clone buttons to remove old event listeners
        const okBtn = document.getElementById('emoji-picker-ok');
        const cancelBtn = document.getElementById('emoji-picker-cancel');
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.replaceWith(newOkBtn);
        cancelBtn.replaceWith(newCancelBtn);

        newOkBtn.onclick = () => {
            const value = input.value.trim();
            this.hideEmojiPicker();
            if (value && onConfirm) onConfirm(value);
        };

        newCancelBtn.onclick = () => {
            this.hideEmojiPicker();
        };

        // Enter key submits
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value.trim();
                this.hideEmojiPicker();
                if (value && onConfirm) onConfirm(value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideEmojiPicker();
            }
        };

        // Focus input after modal shows
        setTimeout(() => input.focus(), 100);
    },

    /**
     * Hide emoji picker modal
     */
    hideEmojiPicker() {
        const modal = document.getElementById('emoji-picker-modal');
        modal.classList.remove('show');
    }
};

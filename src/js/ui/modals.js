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
    }
};

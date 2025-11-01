/**
 * @module ui/toast
 * @order 36
 * @category ui
 *
 * Toast notification system
 */

export const ToastMixin = {
    showToast(message, type = 'success', duration = 4000) {
        // Create container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        // Add to container
        container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.remove();
        }, duration);

        // Allow clicking to dismiss early
        toast.onclick = () => toast.remove();
    }
};

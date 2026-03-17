/**
 * FormaToast - 토스트 메시지
 * 우상단 표시, success/error/info, 3초 자동 소멸.
 */
class FormaToast {
    static _container = null;

    static _getContainer() {
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.className = 'forma-toast-container';
            document.body.appendChild(this._container);
        }
        return this._container;
    }

    static _show(message, type, duration = 3000) {
        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.className = `forma-toast forma-toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('forma-toast-show'));
        setTimeout(() => {
            toast.classList.remove('forma-toast-show');
            toast.classList.add('forma-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static success(msg) { this._show(msg, 'success'); }
    static error(msg) { this._show(msg, 'error'); }
    static info(msg) { this._show(msg, 'info'); }
}

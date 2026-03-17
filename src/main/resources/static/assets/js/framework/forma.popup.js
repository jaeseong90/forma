/**
 * FormaPopup - alert, confirm, loading
 */
const FormaPopup = {
    alert: {
        show(msg) {
            return new Promise(resolve => {
                const overlay = document.createElement('div');
                overlay.className = 'forma-dialog-overlay';
                const dialog = document.createElement('div');
                dialog.className = 'forma-dialog';
                dialog.innerHTML = `
                    <div class="forma-dialog-body">${msg}</div>
                    <div class="forma-dialog-footer">
                        <button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>
                    </div>`;
                overlay.appendChild(dialog);
                document.body.appendChild(overlay);
                dialog.querySelector('.forma-dialog-ok').onclick = () => { overlay.remove(); resolve(); };
                dialog.querySelector('.forma-dialog-ok').focus();
            });
        }
    },

    confirm: {
        show(msg, callback) {
            const overlay = document.createElement('div');
            overlay.className = 'forma-dialog-overlay';
            const dialog = document.createElement('div');
            dialog.className = 'forma-dialog';
            dialog.innerHTML = `
                <div class="forma-dialog-body">${msg}</div>
                <div class="forma-dialog-footer">
                    <button class="forma-btn forma-dialog-cancel">취소</button>
                    <button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>
                </div>`;
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            const close = (result) => { overlay.remove(); if (callback) callback(result); };
            dialog.querySelector('.forma-dialog-ok').onclick = () => close(true);
            dialog.querySelector('.forma-dialog-cancel').onclick = () => close(false);
            overlay.onclick = (e) => { if (e.target === overlay) close(false); };
        }
    },

    loading: {
        _el: null,
        show() {
            if (!this._el) {
                this._el = document.createElement('div');
                this._el.className = 'forma-loading-overlay';
                this._el.innerHTML = '<div class="forma-loading-spinner"></div>';
                document.body.appendChild(this._el);
            }
            this._el.style.display = 'flex';
        },
        hide() {
            if (this._el) this._el.style.display = 'none';
        }
    },

    toast: {
        _container: null,
        _getContainer() {
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.className = 'forma-toast-container';
                document.body.appendChild(this._container);
            }
            return this._container;
        },
        _show(message, type) {
            const c = this._getContainer();
            const t = document.createElement('div');
            t.className = `forma-toast forma-toast-${type}`;
            t.textContent = message;
            c.appendChild(t);
            requestAnimationFrame(() => t.classList.add('forma-toast-show'));
            setTimeout(() => {
                t.classList.remove('forma-toast-show');
                t.classList.add('forma-toast-hide');
                setTimeout(() => t.remove(), 300);
            }, 3000);
        },
        success(msg) { this._show(msg, 'success'); },
        error(msg) { this._show(msg, 'error'); },
        info(msg) { this._show(msg, 'info'); },
    }
};

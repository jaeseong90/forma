/**
 * FormaPopup — alert, confirm, loading, toast (전부 Promise 기반)
 *
 * await FormaPopup.alert.show('완료');
 * var ok = await FormaPopup.confirm.show('저장하시겠습니까?');
 * if (ok) { ... }
 */
const FormaPopup = {
    alert: {
        show(msg) {
            return new Promise(function(resolve) {
                var overlay = document.createElement('div');
                overlay.className = 'forma-dialog-overlay';
                var dialog = document.createElement('div');
                dialog.className = 'forma-dialog';
                dialog.innerHTML =
                    '<div class="forma-dialog-body">' + msg + '</div>' +
                    '<div class="forma-dialog-footer">' +
                        '<button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>' +
                    '</div>';
                overlay.appendChild(dialog);
                document.body.appendChild(overlay);
                var btn = dialog.querySelector('.forma-dialog-ok');
                btn.onclick = function() { overlay.remove(); resolve(); };
                btn.focus();
            });
        }
    },

    confirm: {
        /**
         * 확인/취소 다이얼로그. Promise<boolean> 반환.
         * 하위 호환: 두 번째 인자가 function이면 콜백으로도 동작.
         *
         * var ok = await FormaPopup.confirm.show('저장?');
         * FormaPopup.confirm.show('저장?', function(ok) { ... });  // 하위 호환
         */
        show(msg, callback) {
            var promise = new Promise(function(resolve) {
                var overlay = document.createElement('div');
                overlay.className = 'forma-dialog-overlay';
                var dialog = document.createElement('div');
                dialog.className = 'forma-dialog';
                dialog.innerHTML =
                    '<div class="forma-dialog-body">' + msg + '</div>' +
                    '<div class="forma-dialog-footer">' +
                        '<button class="forma-btn forma-dialog-cancel">취소</button>' +
                        '<button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>' +
                    '</div>';
                overlay.appendChild(dialog);
                document.body.appendChild(overlay);
                var close = function(result) { overlay.remove(); resolve(result); };
                dialog.querySelector('.forma-dialog-ok').onclick = function() { close(true); };
                dialog.querySelector('.forma-dialog-cancel').onclick = function() { close(false); };
                overlay.onclick = function(e) { if (e.target === overlay) close(false); };
                dialog.querySelector('.forma-dialog-ok').focus();
            });

            // 하위 호환: 콜백이 있으면 실행
            if (typeof callback === 'function') {
                promise.then(callback);
            }
            return promise;
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
            var c = this._getContainer();
            var t = document.createElement('div');
            t.className = 'forma-toast forma-toast-' + type;
            t.textContent = message;
            c.appendChild(t);
            requestAnimationFrame(function() { t.classList.add('forma-toast-show'); });
            setTimeout(function() {
                t.classList.remove('forma-toast-show');
                t.classList.add('forma-toast-hide');
                setTimeout(function() { t.remove(); }, 300);
            }, 3000);
        },
        success(msg) { this._show(msg, 'success'); },
        error(msg) { this._show(msg, 'error'); },
        info(msg) { this._show(msg, 'info'); },
    }
};

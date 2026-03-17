/**
 * FormaDialog - 확인/알림 다이얼로그
 * FormaDialog.confirm() → Promise<boolean>, FormaDialog.alert() → Promise<void>
 */
class FormaDialog {
    static confirm(msg) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'forma-dialog-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'forma-dialog';
            dialog.innerHTML = `
                <div class="forma-dialog-body">${msg}</div>
                <div class="forma-dialog-footer">
                    <button class="forma-btn forma-dialog-cancel">취소</button>
                    <button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const close = (result) => {
                overlay.remove();
                resolve(result);
            };

            dialog.querySelector('.forma-dialog-ok').onclick = () => close(true);
            dialog.querySelector('.forma-dialog-cancel').onclick = () => close(false);
            overlay.onclick = (e) => { if (e.target === overlay) close(false); };
            dialog.querySelector('.forma-dialog-ok').focus();
        });
    }

    static alert(msg) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'forma-dialog-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'forma-dialog';
            dialog.innerHTML = `
                <div class="forma-dialog-body">${msg}</div>
                <div class="forma-dialog-footer">
                    <button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            dialog.querySelector('.forma-dialog-ok').onclick = () => { overlay.remove(); resolve(); };
            overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(); } };
            dialog.querySelector('.forma-dialog-ok').focus();
        });
    }
}

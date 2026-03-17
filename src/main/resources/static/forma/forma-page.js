/**
 * FormaPage - 페이지 헬퍼
 * 액션 버튼바 생성, confirm/alert 래퍼.
 */
class FormaPage {
    static actionBar(selector, actions) {
        const container = document.querySelector(selector);
        container.classList.add('forma-action-bar');
        for (const action of actions) {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.className = 'forma-btn ' + (action.primary ? 'forma-btn-primary' : '');
            btn.onclick = action.onClick;
            container.appendChild(btn);
        }
    }

    static confirm(msg) {
        return FormaDialog.confirm(msg);
    }

    static alert(msg) {
        return FormaDialog.alert(msg);
    }
}

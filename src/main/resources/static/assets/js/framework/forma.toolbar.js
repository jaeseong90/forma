/**
 * FormaToolbar — 화면 상단 공통 버튼바
 * pgmInfo/pgmAuth 기반 버튼 표시/숨김, 단축키 지원
 */
class FormaToolbar {

    static BUTTONS = [
        { key: 'search', label: '조회', shortcut: 'F3', primary: true, infoKey: 'srch_yn' },
        { key: 'news',   label: '신규', shortcut: 'F4', infoKey: 'new_yn' },
        { key: 'save',   label: '저장', shortcut: 'F9', infoKey: 'save_yn' },
        { key: 'del',    label: '삭제', shortcut: 'F5', infoKey: 'del_yn' },
        { key: 'print',  label: '출력', shortcut: 'F11', infoKey: 'prnt_yn' },
        { key: 'upload', label: '업로드', infoKey: 'upld_yn' },
        { key: 'init',   label: '초기화', shortcut: 'F12', infoKey: 'init_yn' },
    ];

    static render(selector, options = {}) {
        const container = document.querySelector(selector);
        if (!container) return;
        const pgmInfo = options.pgmInfo || {};
        const pgmAuth = options.pgmAuth || {};
        const listener = options.listener || {};

        container.innerHTML = '';
        container.classList.add('forma-toolbar');

        for (const def of FormaToolbar.BUTTONS) {
            if (pgmInfo[def.infoKey] === 'N') continue;
            if (pgmAuth[def.infoKey] === 'N') continue;

            const btn = document.createElement('button');
            btn.className = 'forma-btn' + (def.primary ? ' forma-btn-primary' : '');
            btn.textContent = def.label;
            btn.dataset.key = def.key;
            btn.onclick = () => listener.button?.[def.key]?.click();

            if (listener.button?.[def.key]) {
                listener.button[def.key]._el = btn;
                listener.button[def.key].hide = () => { btn.style.display = 'none'; };
                listener.button[def.key].show = () => { btn.style.display = ''; };
            }
            container.appendChild(btn);
        }

        // 단축키
        document.addEventListener('keydown', (e) => {
            const map = { F3: 'search', F4: 'news', F5: 'del', F9: 'save', F11: 'print', F12: 'init' };
            const key = map[e.key];
            if (key && listener.button?.[key]?._el?.style.display !== 'none') {
                e.preventDefault();
                listener.button[key].click();
            }
        });
    }
}

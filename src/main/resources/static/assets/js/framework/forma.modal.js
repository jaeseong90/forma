/**
 * FormaModal — 모달 팝업
 *
 * const modal = new FormaModal({
 *     title: '거래처 검색',
 *     url: '/pages/popup/CUS_P01.html',
 *     width: 800,
 *     height: 600,
 *     okCallback: function(result) { ... },
 *     cancelCallback: function(result) { ... }
 * });
 * modal.show(param);
 */
class FormaModal {
    constructor(config = {}) {
        this.config = {
            title: config.title || '팝업',
            url: config.url || '',
            width: config.width || 800,
            height: config.height || 600,
            okCallback: config.okCallback || function() {},
            cancelCallback: config.cancelCallback || function() {},
        };
        this.overlay = null;
        this._escHandler = null;
    }

    async show(modalParam = {}) {
        // 팝업 HTML 가져오기
        let html = '';
        try {
            const res = await fetch(this.config.url);
            if (!res.ok) throw new Error(res.statusText);
            html = await res.text();
        } catch (e) {
            FormaPopup.alert.show('팝업을 불러올 수 없습니다: ' + this.config.url);
            return;
        }

        // 오버레이 생성
        this.overlay = document.createElement('div');
        this.overlay.className = 'forma-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'forma-modal';
        modal.style.width = this.config.width + 'px';
        modal.style.height = this.config.height + 'px';

        // 헤더
        const header = document.createElement('div');
        header.className = 'forma-modal-header';
        header.innerHTML = '<span>' + this.config.title + '</span><button class="forma-modal-close">&times;</button>';
        modal.appendChild(header);

        // 바디
        const body = document.createElement('div');
        body.className = 'forma-modal-body';
        modal.appendChild(body);

        this.overlay.appendChild(modal);
        document.body.appendChild(this.overlay);

        // HTML 삽입 + 스크립트 실행
        body.innerHTML = html;
        this._executeScripts(body);

        // 팝업 Listener 초기화
        const popupId = 'modal_' + Date.now();
        const popupListener = platform.initListener(popupId);
        popupListener.modalParam = modalParam;
        popupListener.modal = this;

        // close 이벤트
        header.querySelector('.forma-modal-close').onclick = () => this.cancel(null);
        this.overlay.onclick = (e) => { if (e.target === this.overlay) this.cancel(null); };

        // ESC 키
        this._escHandler = (e) => { if (e.key === 'Escape') this.cancel(null); };
        document.addEventListener('keydown', this._escHandler);

        // 팝업 initPgm 호출
        if (popupListener.initPgm) popupListener.initPgm();
    }

    ok(result) {
        this._close();
        this.config.okCallback(result);
    }

    cancel(result) {
        this._close();
        this.config.cancelCallback(result);
    }

    _close() {
        if (this.overlay) this.overlay.remove();
        if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
        this.overlay = null;
        this._escHandler = null;
    }

    _executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(newScript);
        });
    }
}

// 사이즈 프리셋
FormaModal.SIZE = {
    XS: { width: 400, height: 300 },
    S:  { width: 600, height: 400 },
    M:  { width: 800, height: 600 },
    L:  { width: 1000, height: 700 },
    XL: { width: 1200, height: 800 },
};

/**
 * FormaModal — 모달 팝업 (중첩 지원)
 *
 * 특징:
 * - 팝업 위에 팝업 가능 (z-index 자동 증가)
 * - SPA 환경에서 부모↔팝업 데이터 통신
 * - ESC는 최상위 팝업만 닫음
 * - ok(result) → okCallback(result), cancel() → cancelCallback()
 *
 * 사용법:
 *   const modal = new FormaModal({
 *       title: '거래처 검색',
 *       url: '/pages/popup/CUS_P01.html',
 *       width: 800, height: 600,
 *       okCallback: function(result) { form.setField('cust_cd', result.CUST_CD); },
 *   });
 *   modal.show({ keyword: '삼성' });
 *
 * 팝업 HTML 내부에서:
 *   var modal = FormaModal.current();     // 현재 모달 인스턴스
 *   var param = FormaModal.getParam();    // show()에 전달된 파라미터
 *   modal.ok({ CUST_CD: 'C001', CUST_NM: '삼성전자' });  // 결과 전달 후 닫기
 */

// 팝업 스택 관리
var _formaModalStack = [];
var _formaModalBaseZ = 10000;

class FormaModal {
    constructor(config) {
        config = config || {};
        this.config = {
            title: config.title || '팝업',
            url: config.url || '',
            width: config.width || 800,
            height: config.height || 600,
            okCallback: config.okCallback || function() {},
            cancelCallback: config.cancelCallback || function() {},
        };
        this.overlay = null;
        this.modalParam = null;
        this._destroyed = false;
    }

    async show(modalParam) {
        this.modalParam = modalParam || {};

        // HTML 가져오기
        var html = '';
        if (this.config.url) {
            try {
                var res = await fetch(this.config.url);
                if (!res.ok) throw new Error(res.statusText);
                html = await res.text();
            } catch (e) {
                if (typeof FormaPopup !== 'undefined') {
                    FormaPopup.alert.show('팝업을 불러올 수 없습니다: ' + this.config.url);
                }
                return;
            }
        }

        // 스택에 추가
        _formaModalStack.push(this);
        var zIndex = _formaModalBaseZ + (_formaModalStack.length * 10);

        // 오버레이
        this.overlay = document.createElement('div');
        this.overlay.className = 'forma-modal-overlay';
        this.overlay.style.zIndex = zIndex;

        // 모달 박스
        var modal = document.createElement('div');
        modal.className = 'forma-modal';
        modal.style.width = this.config.width + 'px';
        modal.style.height = this.config.height + 'px';
        modal.style.zIndex = zIndex + 1;

        // 헤더 (드래그 가능)
        var header = document.createElement('div');
        header.className = 'forma-modal-header';
        var titleSpan = document.createElement('span');
        titleSpan.textContent = this.config.title;
        header.appendChild(titleSpan);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'forma-modal-close';
        closeBtn.innerHTML = '&times;';
        var self = this;
        closeBtn.onclick = function() { self.cancel(); };
        header.appendChild(closeBtn);

        modal.appendChild(header);

        // 바디
        var body = document.createElement('div');
        body.className = 'forma-modal-body';
        modal.appendChild(body);

        this.overlay.appendChild(modal);
        document.body.appendChild(this.overlay);

        // 오버레이 클릭으로 닫기
        this.overlay.onclick = function(e) {
            if (e.target === self.overlay) self.cancel();
        };

        // HTML 삽입
        if (html) {
            // <body> 내용만 추출
            var match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            var bodyContent = match ? match[1] : html;
            body.innerHTML = bodyContent;
            this._executeScripts(body);
        }

        // 드래그 이동
        this._initDrag(header, modal);
    }

    /**
     * 결과를 전달하고 팝업 닫기
     */
    ok(result) {
        if (this._destroyed) return;
        this._close();
        this.config.okCallback(result);
    }

    /**
     * 취소하고 팝업 닫기
     */
    cancel(result) {
        if (this._destroyed) return;
        this._close();
        this.config.cancelCallback(result);
    }

    _close() {
        this._destroyed = true;
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        // 스택에서 제거
        var idx = _formaModalStack.indexOf(this);
        if (idx >= 0) _formaModalStack.splice(idx, 1);
    }

    _executeScripts(container) {
        var scripts = container.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
            var oldScript = scripts[i];
            if (oldScript.src) {
                // 외부 스크립트 (프레임워크)는 이미 로딩됨 → 스킵
            } else {
                try {
                    new Function(oldScript.textContent)();
                } catch (e) {
                    console.error('Modal script error:', e);
                }
            }
            oldScript.remove();
        }
    }

    _initDrag(header, modal) {
        var offsetX = 0, offsetY = 0, dragging = false;
        header.style.cursor = 'move';
        header.onmousedown = function(e) {
            if (e.target.tagName === 'BUTTON') return;
            dragging = true;
            offsetX = e.clientX - modal.offsetLeft;
            offsetY = e.clientY - modal.offsetTop;
            e.preventDefault();
        };
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            modal.style.left = (e.clientX - offsetX) + 'px';
            modal.style.top = (e.clientY - offsetY) + 'px';
            modal.style.margin = '0';
            modal.style.position = 'fixed';
        });
        document.addEventListener('mouseup', function() { dragging = false; });
    }

    /**
     * 현재 (최상위) 모달 인스턴스 반환 — 팝업 내부에서 사용
     */
    static current() {
        return _formaModalStack.length > 0 ? _formaModalStack[_formaModalStack.length - 1] : null;
    }

    /**
     * 현재 모달의 파라미터 반환 — 팝업 내부에서 사용
     */
    static getParam() {
        var m = FormaModal.current();
        return m ? m.modalParam : {};
    }
}

// ESC 키: 최상위 팝업만 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && _formaModalStack.length > 0) {
        _formaModalStack[_formaModalStack.length - 1].cancel();
    }
});

// 사이즈 프리셋
FormaModal.SIZE = {
    XS: { width: 400, height: 300 },
    S:  { width: 600, height: 400 },
    M:  { width: 800, height: 600 },
    L:  { width: 1000, height: 700 },
    XL: { width: 1200, height: 800 },
};

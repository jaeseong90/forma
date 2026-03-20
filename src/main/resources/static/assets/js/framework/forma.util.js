/**
 * FormaUtil - 날짜, 숫자 포맷, 코드 헬프, Split 패널
 */
const FormaUtil = {
    formatCurrency(val) {
        if (val == null) return '';
        return Number(val).toLocaleString('ko-KR');
    },
    formatDate(val) {
        if (!val) return '';
        return String(val).substring(0, 10);
    },
    today() {
        return new Date().toISOString().substring(0, 10);
    },
    isEmpty(v) {
        return v === null || v === undefined || v === '';
    },
    isNotEmpty(v) {
        return !this.isEmpty(v);
    }
};

// ══════════════════════════════════════════════════════════════
//  FormaSplit — 상용 수준 스플릿 패널
// ══════════════════════════════════════════════════════════════
/**
 * FormaUtil.initSplit(selector, options?)
 *
 * HTML 구조:
 *   <div class="forma-split-h" id="split-area">
 *       <div class="forma-split-panel" style="width:400px">왼쪽</div>
 *       <div class="forma-split-handle"></div>
 *       <div class="forma-split-panel" style="flex:1">오른쪽</div>
 *   </div>
 *
 * options:
 *   minSize:    Number  패널 최소 크기 (px, 기본 80)
 *   maxSize:    Number  패널 최대 크기 (px, 기본 없음)
 *   collapsible: Boolean 핸들에 접기/펼치기 버튼 (기본 true)
 *   saveKey:    String  sessionStorage에 위치 저장 (기본 null)
 *   onResize:   Function 리사이즈 완료 콜백 (newSize)
 */
FormaUtil.initSplit = function(selector, options = {}) {
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return null;
    const handle = container.querySelector(':scope > .forma-split-handle');
    const panels = container.querySelectorAll(':scope > .forma-split-panel');
    if (!handle || panels.length < 2) return null;

    const isH = container.classList.contains('forma-split-h');
    const minSize = options.minSize || 80;
    const maxSize = options.maxSize || Infinity;
    const collapsible = options.collapsible !== false;
    const saveKey = options.saveKey || null;
    const onResize = options.onResize || null;

    const panel1 = panels[0], panel2 = panels[1];
    panel2.style.flex = '1';
    panel2.style.overflow = 'auto';
    panel1.style.overflow = 'auto';
    panel1.style.flexShrink = '0';

    // 저장된 위치 복원
    if (saveKey) {
        const saved = sessionStorage.getItem('forma-split-' + saveKey);
        if (saved) {
            const size = parseInt(saved);
            if (size >= minSize) {
                if (isH) panel1.style.width = size + 'px';
                else panel1.style.height = size + 'px';
            }
        }
    }

    let _collapsed = false;
    let _savedSize = null;

    // 접기/펼치기 버튼
    if (collapsible) {
        const btn = document.createElement('div');
        btn.className = 'forma-split-collapse-btn';
        btn.title = '패널 접기/펼치기';
        btn.textContent = isH ? '◀' : '▲';
        btn.onclick = (e) => {
            e.stopPropagation();
            if (_collapsed) {
                // 펼치기
                if (isH) panel1.style.width = (_savedSize || 300) + 'px';
                else panel1.style.height = (_savedSize || 200) + 'px';
                panel1.style.display = '';
                btn.textContent = isH ? '◀' : '▲';
                _collapsed = false;
            } else {
                // 접기
                _savedSize = isH ? panel1.offsetWidth : panel1.offsetHeight;
                if (isH) panel1.style.width = '0px';
                else panel1.style.height = '0px';
                panel1.style.display = 'none';
                btn.textContent = isH ? '▶' : '▼';
                _collapsed = true;
            }
            _fireResize();
        };
        handle.appendChild(btn);
    }

    // 드래그 리사이즈
    handle.onmousedown = (e) => {
        if (e.target.classList.contains('forma-split-collapse-btn')) return;
        e.preventDefault();
        if (_collapsed) return;
        const startPos = isH ? e.clientX : e.clientY;
        const startSize = isH ? panel1.offsetWidth : panel1.offsetHeight;
        const containerSize = isH ? container.offsetWidth : container.offsetHeight;

        document.body.style.cursor = isH ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        handle.classList.add('active');

        const onMove = (me) => {
            const diff = (isH ? me.clientX : me.clientY) - startPos;
            let newSize = startSize + diff;
            newSize = Math.max(minSize, Math.min(newSize, maxSize, containerSize - minSize - 10));
            if (isH) panel1.style.width = newSize + 'px';
            else panel1.style.height = newSize + 'px';
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            handle.classList.remove('active');

            const finalSize = isH ? panel1.offsetWidth : panel1.offsetHeight;
            if (saveKey) sessionStorage.setItem('forma-split-' + saveKey, String(finalSize));
            _fireResize();
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const _fireResize = () => {
        // 패널 내부의 그리드/폼에 리사이즈 알림
        window.dispatchEvent(new Event('resize'));
        if (onResize) onResize(isH ? panel1.offsetWidth : panel1.offsetHeight);
    };

    return {
        collapse: () => { if (!_collapsed && collapsible) handle.querySelector('.forma-split-collapse-btn')?.click(); },
        expand: () => { if (_collapsed && collapsible) handle.querySelector('.forma-split-collapse-btn')?.click(); },
        setSize: (size) => {
            const s = Math.max(minSize, Math.min(size, maxSize));
            if (isH) panel1.style.width = s + 'px'; else panel1.style.height = s + 'px';
            _fireResize();
        },
        getSize: () => isH ? panel1.offsetWidth : panel1.offsetHeight,
        isCollapsed: () => _collapsed,
    };
};

// 코드 캐시
const _codeCache = {};
async function getCodeItems(grpCode) {
    if (_codeCache[grpCode]) return _codeCache[grpCode];
    try {
        const res = await fetch('/api/codes/' + grpCode);
        const json = await res.json();
        if (json.resultCode === 'OK') {
            _codeCache[grpCode] = json.resultData || [];
            return _codeCache[grpCode];
        }
    } catch (e) { console.warn('Code load failed:', grpCode); }
    return [];
}

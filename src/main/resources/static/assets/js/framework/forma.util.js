/**
 * FormaUtil - 날짜, 숫자 포맷, 코드 헬프 등
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

// ── Split 패널 (좌우/상하 분할) ──
FormaUtil.initSplit = function(selector) {
    const container = document.querySelector(selector);
    if (!container) return;
    const handle = container.querySelector('.forma-split-handle');
    const panels = container.querySelectorAll('.forma-split-panel');
    if (!handle || panels.length < 2) return;

    const isHorizontal = container.classList.contains('forma-split-h');

    handle.onmousedown = (e) => {
        e.preventDefault();
        const startPos = isHorizontal ? e.clientX : e.clientY;
        const startSize = isHorizontal ? panels[0].offsetWidth : panels[0].offsetHeight;

        const onMove = (me) => {
            const diff = (isHorizontal ? me.clientX : me.clientY) - startPos;
            const newSize = Math.max(100, startSize + diff);
            if (isHorizontal) panels[0].style.width = newSize + 'px';
            else panels[0].style.height = newSize + 'px';
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
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

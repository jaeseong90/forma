/**
 * FormaFormat - 데이터 포맷터
 * currency, number, date, badge 등 표시 변환.
 */
const FormaFormat = {
    currency(val) {
        if (val == null) return '';
        return Number(val).toLocaleString('ko-KR');
    },
    number(val) {
        if (val == null) return '';
        return Number(val).toLocaleString();
    },
    date(val) {
        if (!val) return '';
        return String(val).substring(0, 10);
    },
    badge(val, codeItems) {
        if (!val || !codeItems) return val || '';
        const item = codeItems.find(c => c.value === val);
        if (!item) return val;
        const color = item.color || '#888';
        return `<span class="forma-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${item.label}</span>`;
    },
    apply(format, val, extra) {
        if (!format) return val == null ? '' : val;
        if (this[format]) return this[format](val, extra);
        return val;
    }
};

/**
 * 코드 사전 캐시.
 * getCodeItems(codeGroup)으로 /api/codes/{group} 에서 코드 목록 로딩 + 캐싱.
 */
const _codeCache = {};
async function getCodeItems(codeGroup) {
    if (_codeCache[codeGroup]) return _codeCache[codeGroup];
    try {
        const data = await FormaApi.get(`/api/codes/${codeGroup}`);
        _codeCache[codeGroup] = data.items || [];
        return _codeCache[codeGroup];
    } catch { return []; }
}

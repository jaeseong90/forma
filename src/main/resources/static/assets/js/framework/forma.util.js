/**
 * FormaUtil — ERP 실무 유틸리티
 */
const FormaUtil = {

    // ══════════════════════════════════════════
    //  날짜
    // ══════════════════════════════════════════

    /** 오늘 (YYYY-MM-DD) */
    today() { return new Date().toISOString().substring(0, 10); },

    /** 현재 시각 (HH:MM:SS) */
    now() { return new Date().toTimeString().substring(0, 8); },

    /** 현재 년월 (YYYY-MM) */
    thisMonth() { return new Date().toISOString().substring(0, 7); },

    /** 현재 년도 */
    thisYear() { return new Date().getFullYear(); },

    /** 날짜 포맷 (YYYY-MM-DD) */
    formatDate(val) {
        if (!val) return '';
        if (val instanceof Date) return val.toISOString().substring(0, 10);
        return String(val).substring(0, 10);
    },

    /** 날짜+시간 포맷 (YYYY-MM-DD HH:MM) */
    formatDateTime(val) {
        if (!val) return '';
        if (val instanceof Date) return val.toISOString().substring(0, 16).replace('T', ' ');
        var s = String(val);
        if (s.length >= 16) return s.substring(0, 10) + ' ' + s.substring(11, 16);
        return s.substring(0, 10);
    },

    /** 날짜 더하기/빼기 */
    addDays(dateStr, days) {
        var d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().substring(0, 10);
    },

    addMonths(dateStr, months) {
        var d = new Date(dateStr);
        d.setMonth(d.getMonth() + months);
        return d.toISOString().substring(0, 10);
    },

    /** 월의 첫날/마지막날 */
    firstDayOfMonth(dateStr) {
        var d = dateStr ? new Date(dateStr) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
    },

    lastDayOfMonth(dateStr) {
        var d = dateStr ? new Date(dateStr) : new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substring(0, 10);
    },

    /** 두 날짜 사이 일수 */
    diffDays(from, to) {
        var a = new Date(from), b = new Date(to);
        return Math.round((b - a) / (1000 * 60 * 60 * 24));
    },

    /** 요일 (0=일, 6=토) */
    dayOfWeek(dateStr) {
        return new Date(dateStr).getDay();
    },

    dayOfWeekName(dateStr) {
        var names = ['일', '월', '화', '수', '목', '금', '토'];
        return names[new Date(dateStr).getDay()];
    },

    // ══════════════════════════════════════════
    //  숫자/금액
    // ══════════════════════════════════════════

    /** 천단위 콤마 */
    formatCurrency(val) {
        if (val == null || val === '') return '';
        return Number(val).toLocaleString('ko-KR');
    },

    /** 소수점 포함 포맷 */
    formatNumber(val, decimals) {
        if (val == null || val === '') return '';
        decimals = decimals || 0;
        return Number(val).toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    },

    /** 콤마 제거 → 숫자 변환 */
    parseCurrency(str) {
        if (str == null || str === '') return 0;
        return Number(String(str).replace(/[,\s]/g, '')) || 0;
    },

    /** 퍼센트 포맷 (0.15 → '15%') */
    formatPercent(val, decimals) {
        if (val == null) return '';
        decimals = decimals || 0;
        return (Number(val) * 100).toFixed(decimals) + '%';
    },

    /** 파일 크기 포맷 (bytes → KB/MB/GB) */
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = 0;
        while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
        return bytes.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
    },

    /** 숫자 범위 제한 */
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, Number(val) || 0));
    },

    /** 반올림 (소수점 자릿수) */
    round(val, decimals) {
        decimals = decimals || 0;
        var factor = Math.pow(10, decimals);
        return Math.round(Number(val) * factor) / factor;
    },

    // ══════════════════════════════════════════
    //  문자열
    // ══════════════════════════════════════════

    isEmpty(v) { return v === null || v === undefined || v === ''; },
    isNotEmpty(v) { return !this.isEmpty(v); },

    /** 공백 trim */
    trim(v) { return v == null ? '' : String(v).trim(); },

    /** 좌측 패딩 (숫자 앞에 0 채우기) */
    padStart(val, len, char) {
        return String(val).padStart(len, char || '0');
    },

    /** 바이트 길이 (한글 2바이트) */
    byteLength(str) {
        if (!str) return 0;
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            len += str.charCodeAt(i) > 127 ? 2 : 1;
        }
        return len;
    },

    /** 바이트 기준 문자열 자르기 */
    cutByByte(str, maxBytes) {
        if (!str) return '';
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            len += str.charCodeAt(i) > 127 ? 2 : 1;
            if (len > maxBytes) return str.substring(0, i);
        }
        return str;
    },

    /** HTML 이스케이프 */
    escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /** 사업자번호 포맷 (1234567890 → 123-45-67890) */
    formatBizNo(val) {
        if (!val) return '';
        var s = String(val).replace(/[^0-9]/g, '');
        if (s.length === 10) return s.substring(0, 3) + '-' + s.substring(3, 5) + '-' + s.substring(5);
        return s;
    },

    /** 전화번호 포맷 */
    formatPhone(val) {
        if (!val) return '';
        var s = String(val).replace(/[^0-9]/g, '');
        if (s.length === 11) return s.substring(0, 3) + '-' + s.substring(3, 7) + '-' + s.substring(7);
        if (s.length === 10) return s.substring(0, 3) + '-' + s.substring(3, 6) + '-' + s.substring(6);
        if (s.length === 9) return s.substring(0, 2) + '-' + s.substring(2, 5) + '-' + s.substring(5);
        return s;
    },

    // ══════════════════════════════════════════
    //  배열/객체
    // ══════════════════════════════════════════

    /** 배열 그룹핑 */
    groupBy(arr, key) {
        var result = {};
        for (var i = 0; i < arr.length; i++) {
            var k = arr[i][key];
            if (!result[k]) result[k] = [];
            result[k].push(arr[i]);
        }
        return result;
    },

    /** 배열 합계 */
    sumBy(arr, key) {
        var sum = 0;
        for (var i = 0; i < arr.length; i++) sum += Number(arr[i][key]) || 0;
        return sum;
    },

    /** 배열 중복 제거 */
    unique(arr, key) {
        if (!key) return [...new Set(arr)];
        var seen = {};
        return arr.filter(function(item) {
            var k = item[key];
            if (seen[k]) return false;
            seen[k] = true;
            return true;
        });
    },

    /** 객체 깊은 복사 */
    deepCopy(obj) {
        if (obj == null || typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj));
    },

    /** 두 객체 비교 (얕은) */
    isEqual(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        var keysA = Object.keys(a), keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (var i = 0; i < keysA.length; i++) {
            if (a[keysA[i]] !== b[keysA[i]]) return false;
        }
        return true;
    },

    // ══════════════════════════════════════════
    //  DOM / UI
    // ══════════════════════════════════════════

    /** 클립보드 복사 */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            FormaPopup.toast.success('클립보드에 복사되었습니다.');
        } catch (e) {
            // fallback
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            FormaPopup.toast.success('클립보드에 복사되었습니다.');
        }
    },

    /** 디바운스 */
    debounce(fn, delay) {
        var timer = null;
        return function() {
            var args = arguments, ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
        };
    },

    /** 쓰로틀 */
    throttle(fn, delay) {
        var last = 0;
        return function() {
            var now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, arguments);
            }
        };
    },

    /** URL 파라미터 파싱 */
    getUrlParam(key) {
        return new URLSearchParams(window.location.search).get(key);
    },

    /** 엘리먼트 보이기/숨기기 */
    show(selector) {
        var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (el) el.style.display = '';
    },

    hide(selector) {
        var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (el) el.style.display = 'none';
    },

    // ══════════════════════════════════════════
    //  코드 조회 (async, 캐시)
    // ══════════════════════════════════════════

    _codeCache: {},

    /** 코드 그룹 조회 (캐시) → [{value, label}] */
    async getCodeItems(grpCode) {
        if (this._codeCache[grpCode]) return this._codeCache[grpCode];
        try {
            var res = await fetch('/api/codes/' + grpCode);
            var json = await res.json();
            if (json.resultCode === 'OK') {
                this._codeCache[grpCode] = json.resultData || [];
                return this._codeCache[grpCode];
            }
        } catch (e) { console.warn('Code load failed:', grpCode); }
        return [];
    },

    /** 코드 → 라벨 변환 */
    async getCodeLabel(grpCode, code) {
        var items = await this.getCodeItems(grpCode);
        for (var i = 0; i < items.length; i++) {
            if (items[i].value === code || items[i].VALUE === code) {
                return items[i].label || items[i].LABEL || '';
            }
        }
        return code;
    },

    /** 여러 코드 그룹 한번에 로드 (Promise.all) */
    async preloadCodes() {
        var codes = Array.prototype.slice.call(arguments);
        await Promise.all(codes.map(function(c) { return FormaUtil.getCodeItems(c); }));
    },

    /** 코드 캐시 초기화 */
    clearCodeCache(grpCode) {
        if (grpCode) delete this._codeCache[grpCode];
        else this._codeCache = {};
    },

    // ══════════════════════════════════════════
    //  유효성 검증
    // ══════════════════════════════════════════

    /** 이메일 검증 */
    isEmail(val) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); },

    /** 사업자번호 검증 (10자리) */
    isBizNo(val) {
        var s = String(val).replace(/[^0-9]/g, '');
        if (s.length !== 10) return false;
        var keys = [1, 3, 7, 1, 3, 7, 1, 3, 5];
        var sum = 0;
        for (var i = 0; i < 9; i++) sum += parseInt(s[i]) * keys[i];
        sum += Math.floor(parseInt(s[8]) * 5 / 10);
        return (10 - (sum % 10)) % 10 === parseInt(s[9]);
    },

    /** 숫자만 */
    isNumeric(val) { return /^-?\d+(\.\d+)?$/.test(val); },

    /** 한글 포함 여부 */
    hasKorean(val) { return /[가-힣]/.test(val); },
};

// ══════════════════════════════════════════════════════════════
//  하위 호환: 전역 getCodeItems
// ══════════════════════════════════════════════════════════════
async function getCodeItems(grpCode) {
    return FormaUtil.getCodeItems(grpCode);
}

// ══════════════════════════════════════════════════════════════
//  FormaSplit — 상용 수준 스플릿 패널
// ══════════════════════════════════════════════════════════════
FormaUtil.initSplit = function(selector, options) {
    options = options || {};
    var container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return null;
    var handle = container.querySelector(':scope > .forma-split-handle');
    var panels = container.querySelectorAll(':scope > .forma-split-panel');
    if (!handle || panels.length < 2) return null;

    var isH = container.classList.contains('forma-split-h');
    var minSize = options.minSize || 80;
    var maxSize = options.maxSize || Infinity;
    var collapsible = options.collapsible !== false;
    var saveKey = options.saveKey || null;
    var onResize = options.onResize || null;

    var panel1 = panels[0], panel2 = panels[1];
    panel2.style.flex = '1';
    panel2.style.overflow = 'auto';
    panel1.style.overflow = 'auto';
    panel1.style.flexShrink = '0';

    if (saveKey) {
        var saved = sessionStorage.getItem('forma-split-' + saveKey);
        if (saved) {
            var size = parseInt(saved);
            if (size >= minSize) {
                if (isH) panel1.style.width = size + 'px';
                else panel1.style.height = size + 'px';
            }
        }
    }

    var _collapsed = false, _savedSize = null;

    if (collapsible) {
        var btn = document.createElement('div');
        btn.className = 'forma-split-collapse-btn';
        btn.title = '접기/펼치기';
        btn.textContent = isH ? '\u25C0' : '\u25B2';
        btn.onclick = function(e) {
            e.stopPropagation();
            if (_collapsed) {
                if (isH) panel1.style.width = (_savedSize || 300) + 'px';
                else panel1.style.height = (_savedSize || 200) + 'px';
                panel1.style.display = '';
                btn.textContent = isH ? '\u25C0' : '\u25B2';
                _collapsed = false;
            } else {
                _savedSize = isH ? panel1.offsetWidth : panel1.offsetHeight;
                if (isH) panel1.style.width = '0px';
                else panel1.style.height = '0px';
                panel1.style.display = 'none';
                btn.textContent = isH ? '\u25B6' : '\u25BC';
                _collapsed = true;
            }
            _fireResize();
        };
        handle.appendChild(btn);
    }

    handle.onmousedown = function(e) {
        if (e.target.classList.contains('forma-split-collapse-btn')) return;
        e.preventDefault();
        if (_collapsed) return;
        var startPos = isH ? e.clientX : e.clientY;
        var startSize = isH ? panel1.offsetWidth : panel1.offsetHeight;
        var containerSize = isH ? container.offsetWidth : container.offsetHeight;

        document.body.style.cursor = isH ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        handle.classList.add('active');

        var onMove = function(me) {
            var diff = (isH ? me.clientX : me.clientY) - startPos;
            var newSize = startSize + diff;
            newSize = Math.max(minSize, Math.min(newSize, maxSize, containerSize - minSize - 10));
            if (isH) panel1.style.width = newSize + 'px';
            else panel1.style.height = newSize + 'px';
        };

        var onUp = function() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            handle.classList.remove('active');
            var finalSize = isH ? panel1.offsetWidth : panel1.offsetHeight;
            if (saveKey) sessionStorage.setItem('forma-split-' + saveKey, String(finalSize));
            _fireResize();
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    var _fireResize = function() {
        window.dispatchEvent(new Event('resize'));
        if (onResize) onResize(isH ? panel1.offsetWidth : panel1.offsetHeight);
    };

    return {
        collapse: function() { if (!_collapsed && collapsible) btn.click(); },
        expand: function() { if (_collapsed && collapsible) btn.click(); },
        setSize: function(s) {
            s = Math.max(minSize, Math.min(s, maxSize));
            if (isH) panel1.style.width = s + 'px'; else panel1.style.height = s + 'px';
            _fireResize();
        },
        getSize: function() { return isH ? panel1.offsetWidth : panel1.offsetHeight; },
        isCollapsed: function() { return _collapsed; },
    };
};

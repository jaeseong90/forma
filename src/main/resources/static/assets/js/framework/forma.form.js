/**
 * FormaForm - ERP 폼 빌더 (Widget Pattern)
 *
 * 위젯: text, number, combo, select, date, dateRange, codePopup, textarea, checkbox, radio, hidden,
 *        currency, multiCombo, yearMonth, year, switch, divider, display, password, address
 */

// ══════════════════════════════════════════════════════════════
//  Section 1: FormaCalendar — 커스텀 캘린더 드롭다운
// ══════════════════════════════════════════════════════════════
class _FormaCalendar {
    constructor(opts = {}) {
        this.onSelect = opts.onSelect || (() => {});
        this.onClear = opts.onClear || (() => {});
        this.el = null;
        this._year = 0;
        this._month = 0;
        this._mode = 'days';
        this._selected = null;
        this._anchor = null;
        this._handler = null;
    }

    show(anchor, selectedDate) {
        if (_FormaCalendar._active) _FormaCalendar._active.hide();
        this._anchor = anchor;
        this._selected = selectedDate || null;
        const d = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
        this._year = d.getFullYear();
        this._month = d.getMonth();
        this._mode = 'days';

        this.el = document.createElement('div');
        this.el.className = 'fc-cal';
        document.body.appendChild(this.el);
        this._render();
        this._position();
        _FormaCalendar._active = this;

        setTimeout(() => {
            this._handler = (e) => {
                if (this.el && !this.el.contains(e.target) && !this._anchor.contains(e.target)) this.hide();
            };
            document.addEventListener('mousedown', this._handler);
        }, 10);
    }

    hide() {
        if (this.el) this.el.remove();
        this.el = null;
        if (this._handler) { document.removeEventListener('mousedown', this._handler); this._handler = null; }
        if (_FormaCalendar._active === this) _FormaCalendar._active = null;
    }

    _position() {
        const r = this._anchor.getBoundingClientRect();
        this.el.style.position = 'fixed';
        this.el.style.left = r.left + 'px';
        this.el.style.top = (r.bottom + 2) + 'px';
        this.el.style.zIndex = '9000';
        requestAnimationFrame(() => {
            if (!this.el) return;
            const cr = this.el.getBoundingClientRect();
            if (cr.bottom > window.innerHeight - 8) this.el.style.top = (r.top - cr.height - 2) + 'px';
            if (cr.right > window.innerWidth - 8) this.el.style.left = Math.max(4, window.innerWidth - cr.width - 8) + 'px';
        });
    }

    _render() {
        if (!this.el) return;
        if (this._mode === 'days') this._renderDays();
        else if (this._mode === 'months') this._renderMonths();
        else if (this._mode === 'years') this._renderYears();
    }

    _renderDays() {
        const y = this._year, m = this._month;
        const firstDow = new Date(y, m, 1).getDay();
        const dim = new Date(y, m + 1, 0).getDate();
        const prevDim = new Date(y, m, 0).getDate();
        const todayStr = _FormaCalendar.fmt(new Date());
        const DAYS = ['일','월','화','수','목','금','토'];

        let h = '<div class="fc-hd">';
        h += '<button class="fc-nav" data-a="py">&laquo;</button>';
        h += '<button class="fc-nav" data-a="pm">&lsaquo;</button>';
        h += '<button class="fc-title" data-a="ym">' + y + '년 ' + (m + 1) + '월</button>';
        h += '<button class="fc-nav" data-a="nm">&rsaquo;</button>';
        h += '<button class="fc-nav" data-a="ny">&raquo;</button></div>';
        h += '<div class="fc-wk">';
        DAYS.forEach((d, i) => { h += '<span class="' + (i === 0 ? 'fc-sun' : i === 6 ? 'fc-sat' : '') + '">' + d + '</span>'; });
        h += '</div><div class="fc-ds">';
        for (let i = firstDow - 1; i >= 0; i--) h += '<span class="fc-d fc-ot">' + (prevDim - i) + '</span>';
        for (let d = 1; d <= dim; d++) {
            const ds = _FormaCalendar.fmt(new Date(y, m, d));
            let cls = 'fc-d';
            if (ds === todayStr) cls += ' fc-today';
            if (ds === this._selected) cls += ' fc-sel';
            const dow = (firstDow + d - 1) % 7;
            if (dow === 0) cls += ' fc-sun';
            else if (dow === 6) cls += ' fc-sat';
            h += '<span class="' + cls + '" data-d="' + ds + '">' + d + '</span>';
        }
        const total = firstDow + dim;
        const rem = (7 - (total % 7)) % 7;
        for (let d = 1; d <= rem; d++) h += '<span class="fc-d fc-ot">' + d + '</span>';
        h += '</div><div class="fc-ft">';
        h += '<button class="fc-btn" data-a="today">오늘</button>';
        h += '<button class="fc-btn" data-a="clear">초기화</button></div>';
        this.el.innerHTML = h;
        this._bindNav();
        this.el.querySelectorAll('.fc-d:not(.fc-ot)').forEach(el => {
            el.addEventListener('click', () => { this.onSelect(el.dataset.d); this.hide(); });
        });
    }

    _renderMonths() {
        const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
        let h = '<div class="fc-hd">';
        h += '<button class="fc-nav" data-a="py">&laquo;</button>';
        h += '<button class="fc-title" data-a="yr">' + this._year + '년</button>';
        h += '<button class="fc-nav" data-a="ny">&raquo;</button></div>';
        h += '<div class="fc-ms">';
        MONTHS.forEach((m, i) => {
            const now = new Date();
            let cls = 'fc-m';
            if (i === now.getMonth() && this._year === now.getFullYear()) cls += ' fc-today';
            h += '<span class="' + cls + '" data-m="' + i + '">' + m + '</span>';
        });
        h += '</div>';
        this.el.innerHTML = h;
        this._bindNav();
        this.el.querySelectorAll('.fc-m').forEach(el => {
            el.addEventListener('click', () => { this._month = parseInt(el.dataset.m); this._mode = 'days'; this._render(); });
        });
    }

    _renderYears() {
        const base = Math.floor(this._year / 10) * 10;
        let h = '<div class="fc-hd">';
        h += '<button class="fc-nav" data-a="pd">&laquo;</button>';
        h += '<span class="fc-title-text">' + base + ' - ' + (base + 9) + '</span>';
        h += '<button class="fc-nav" data-a="nd">&raquo;</button></div>';
        h += '<div class="fc-ys">';
        const curY = new Date().getFullYear();
        for (let y = base - 1; y <= base + 10; y++) {
            let cls = 'fc-y';
            if (y === curY) cls += ' fc-today';
            if (y < base || y > base + 9) cls += ' fc-ot';
            h += '<span class="' + cls + '" data-y="' + y + '">' + y + '</span>';
        }
        h += '</div>';
        this.el.innerHTML = h;
        this._bindNav();
        this.el.querySelectorAll('.fc-y').forEach(el => {
            el.addEventListener('click', () => { this._year = parseInt(el.dataset.y); this._mode = 'months'; this._render(); });
        });
    }

    _bindNav() {
        this.el.querySelectorAll('[data-a]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const a = btn.dataset.a;
                if (a === 'pm') { this._month--; if (this._month < 0) { this._month = 11; this._year--; } this._render(); }
                else if (a === 'nm') { this._month++; if (this._month > 11) { this._month = 0; this._year++; } this._render(); }
                else if (a === 'py') { this._year--; this._render(); }
                else if (a === 'ny') { this._year++; this._render(); }
                else if (a === 'pd') { this._year -= 10; this._render(); }
                else if (a === 'nd') { this._year += 10; this._render(); }
                else if (a === 'ym') { this._mode = 'months'; this._render(); }
                else if (a === 'yr') { this._mode = 'years'; this._render(); }
                else if (a === 'today') { this.onSelect(_FormaCalendar.fmt(new Date())); this.hide(); }
                else if (a === 'clear') { this.onClear(); this.hide(); }
            });
        });
    }

    static fmt(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
}
_FormaCalendar._active = null;

// ══════════════════════════════════════════════════════════════
//  Section 2: DateRange 프리셋 유틸리티
// ══════════════════════════════════════════════════════════════
const _datePresets = {
    today:       { label: '오늘',     fn: () => { const t = _FormaCalendar.fmt(new Date()); return { from: t, to: t }; } },
    yesterday:   { label: '어제',     fn: () => { const d = new Date(); d.setDate(d.getDate() - 1); const t = _FormaCalendar.fmt(d); return { from: t, to: t }; } },
    thisWeek:    { label: '이번주',   fn: () => {
        const d = new Date(), dow = d.getDay();
        const mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return { from: _FormaCalendar.fmt(mon), to: _FormaCalendar.fmt(sun) };
    }},
    lastWeek:    { label: '전주',     fn: () => {
        const d = new Date(), dow = d.getDay();
        const mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) - 7);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return { from: _FormaCalendar.fmt(mon), to: _FormaCalendar.fmt(sun) };
    }},
    thisMonth:   { label: '이번달',   fn: () => {
        const d = new Date(), y = d.getFullYear(), m = d.getMonth();
        return { from: _FormaCalendar.fmt(new Date(y, m, 1)), to: _FormaCalendar.fmt(new Date(y, m + 1, 0)) };
    }},
    lastMonth:   { label: '전월',     fn: () => {
        const d = new Date(), y = d.getFullYear(), m = d.getMonth() - 1;
        return { from: _FormaCalendar.fmt(new Date(y, m, 1)), to: _FormaCalendar.fmt(new Date(y, m + 1, 0)) };
    }},
    thisQuarter: { label: '이번분기', fn: () => {
        const d = new Date(), q = Math.floor(d.getMonth() / 3), y = d.getFullYear();
        return { from: _FormaCalendar.fmt(new Date(y, q * 3, 1)), to: _FormaCalendar.fmt(new Date(y, q * 3 + 3, 0)) };
    }},
    lastQuarter: { label: '전분기',   fn: () => {
        const d = new Date(), q = Math.floor(d.getMonth() / 3) - 1, y = d.getFullYear();
        const qy = q < 0 ? y - 1 : y, qm = q < 0 ? 9 : q * 3;
        return { from: _FormaCalendar.fmt(new Date(qy, qm, 1)), to: _FormaCalendar.fmt(new Date(qy, qm + 3, 0)) };
    }},
    thisYear:    { label: '올해',     fn: () => {
        const y = new Date().getFullYear();
        return { from: y + '-01-01', to: y + '-12-31' };
    }},
    lastYear:    { label: '전년도',   fn: () => {
        const y = new Date().getFullYear() - 1;
        return { from: y + '-01-01', to: y + '-12-31' };
    }},
    last7:       { label: '최근7일',  fn: () => {
        const t = new Date(), f = new Date(); f.setDate(t.getDate() - 6);
        return { from: _FormaCalendar.fmt(f), to: _FormaCalendar.fmt(t) };
    }},
    last30:      { label: '최근30일', fn: () => {
        const t = new Date(), f = new Date(); f.setDate(t.getDate() - 29);
        return { from: _FormaCalendar.fmt(f), to: _FormaCalendar.fmt(t) };
    }},
};
const _defaultPresets = ['today', 'thisWeek', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear'];

// ══════════════════════════════════════════════════════════════
//  Section 3: _FormaWidget 베이스 클래스 + 레지스트리
// ══════════════════════════════════════════════════════════════
class _FormaWidget {
    constructor(el, form) {
        this.el = el;
        this.form = form;
        this.field = el.field;
        this._docListeners = [];
    }
    build(group) {}
    getValue() { return null; }
    setValue(value) {}
    setValueFromData(obj) { if (obj[this.field] !== undefined) this.setValue(obj[this.field]); }
    clear() {}
    setReadonly(readonly) { this.el.readOnly = readonly; }
    validate() { return true; }
    focus() {}
    destroy() { for (const [evt, fn] of this._docListeners) document.removeEventListener(evt, fn); this._docListeners = []; }
    setOptions(options) {}
    setDisabled(disabled) {}

    _addDocListener(event, handler) {
        document.addEventListener(event, handler);
        this._docListeners.push([event, handler]);
    }
    _fireChange(value, old) { this.form._fireChange(this.field, value, old); }
    _wrapWithFix(group, input) {
        const el = this.el;
        if (!el.prefix && !el.suffix) { group.appendChild(input); return; }
        const w = document.createElement('span'); w.className = 'forma-input-fix';
        if (el.prefix) { const p = document.createElement('span'); p.className = 'forma-input-prefix'; p.textContent = el.prefix; w.appendChild(p); }
        w.appendChild(input);
        if (el.suffix) { const s = document.createElement('span'); s.className = 'forma-input-suffix'; s.textContent = el.suffix; w.appendChild(s); }
        group.appendChild(w);
    }
    _bindStdEvents(input) {
        const field = this.field, el = this.el, form = this.form;
        let prev = input.value;
        input.addEventListener('change', () => { const v = input.value; if (el.onChange) el.onChange(v, prev); if (form._onChange) form._onChange(field, v, prev); prev = v; });
        input.addEventListener('blur', () => { if (form._onBlur) form._onBlur(field, input.value); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && form._onEnter) form._onEnter(field, input.value); });
    }
}

const _FormaWidgets = {};

// ══════════════════════════════════════════════════════════════
//  Section 4: 위젯 구현체 18개
// ══════════════════════════════════════════════════════════════

// ── text ──
class _WText extends _FormaWidget {
    build(group) {
        const el = this.el;
        const input = document.createElement('input');
        input.type = el.type === 'number' ? 'number' : 'text';
        input.className = 'forma-input';
        if (el.placeholder) input.placeholder = el.placeholder;
        if (el.readOnly) input.readOnly = true;
        if (el.maxLength) input.maxLength = el.maxLength;
        if (el.type === 'number') { if (el.min !== undefined) input.min = el.min; if (el.max !== undefined) input.max = el.max; if (el.step !== undefined) input.step = el.step; }
        this._wrapWithFix(group, input);
        this._input = input;
        this._bindStdEvents(input);
    }
    getValue() {
        const input = this._input; if (!input) return null;
        if (input.type === 'number') return input.value ? Number(input.value) : null;
        return input.value || null;
    }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() {
        const v = this._input ? this._input.value : '';
        return v !== null && v !== undefined && v !== '';
    }
    focus() { if (this._input) this._input.focus(); }
    setDisabled(disabled) { if (this._input) this._input.disabled = disabled; }
}
_FormaWidgets['text'] = _WText;

// ── textarea ──
class _WTextarea extends _FormaWidget {
    build(group) {
        const el = this.el;
        const input = document.createElement('textarea');
        input.className = 'forma-input'; input.rows = el.rows || 3;
        if (el.readOnly) input.readOnly = true;
        if (el.placeholder) input.placeholder = el.placeholder;
        group.appendChild(input);
        this._input = input;
        this._bindStdEvents(input);
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
    setDisabled(disabled) { if (this._input) this._input.disabled = disabled; }
}
_FormaWidgets['textarea'] = _WTextarea;

// ── password ──
class _WPassword extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-password-wrap';
        const input = document.createElement('input'); input.type = 'password'; input.className = 'forma-input';
        if (el.placeholder) input.placeholder = el.placeholder;
        if (el.readOnly) input.readOnly = true;
        wrap.appendChild(input);
        const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'forma-password-toggle'; toggle.innerHTML = '&#128065;'; toggle.title = '비밀번호 보기';
        toggle.addEventListener('click', () => { if (input.type === 'password') { input.type = 'text'; toggle.classList.add('active'); } else { input.type = 'password'; toggle.classList.remove('active'); } });
        wrap.appendChild(toggle); group.appendChild(wrap);
        this._input = input;
        this._bindStdEvents(input);
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
    setDisabled(disabled) { if (this._input) this._input.disabled = disabled; }
}
_FormaWidgets['password'] = _WPassword;

// ── hidden ──
class _WHidden extends _FormaWidget {
    build(group) {
        const input = document.createElement('input'); input.type = 'hidden';
        this.form.container.appendChild(input);
        this._input = input;
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    validate() { return true; }
}
_FormaWidgets['hidden'] = _WHidden;

// ── checkbox ──
class _WCheckbox extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-checkbox-wrap';
        const input = document.createElement('input'); input.type = 'checkbox';
        if (el.readOnly) input.disabled = true;
        wrap.appendChild(input);
        if (el.checkLabel) { const s = document.createElement('span'); s.className = 'forma-checkbox-label'; s.textContent = el.checkLabel; wrap.appendChild(s); }
        group.appendChild(wrap);
        this._input = input;
        input.addEventListener('change', () => { this._fireChange(input.checked ? 'Y' : 'N', input.checked ? 'N' : 'Y'); });
    }
    getValue() { return this._input ? (this._input.checked ? 'Y' : 'N') : null; }
    setValue(value) { if (this._input) this._input.checked = (value === 'Y' || value === true); }
    clear() { if (this._input) this._input.checked = false; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.disabled = readonly; }
    validate() { return true; } // checkbox always valid
    focus() { if (this._input) this._input.focus(); }
    setDisabled(disabled) { if (this._input) this._input.disabled = disabled; }
}
_FormaWidgets['checkbox'] = _WCheckbox;

// ── radio ──
class _WRadio extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const wrap = document.createElement('span'); wrap.className = 'forma-radio-wrap';
        this._radios = [];
        (el.options || []).forEach((opt, idx) => {
            const lbl = document.createElement('label'); lbl.className = 'forma-radio-label';
            const r = document.createElement('input'); r.type = 'radio'; r.name = el.field + '_' + (form.container.id || 'f'); r.value = opt.value;
            if (el.readOnly) r.disabled = true; if (idx === 0) r.checked = true;
            lbl.appendChild(r); lbl.appendChild(document.createTextNode(' ' + opt.label)); wrap.appendChild(lbl); this._radios.push(r);
            r.addEventListener('change', () => { if (r.checked) this._fireChange(r.value, null); });
        });
        group.appendChild(wrap);
    }
    getValue() { const c = this._radios?.find(r => r.checked); return c ? c.value : null; }
    setValue(value) { if (this._radios) this._radios.forEach(r => r.checked = (r.value === String(value))); }
    clear() { if (this._radios && this._radios.length > 0) this._radios[0].checked = true; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._radios) this._radios.forEach(r => r.disabled = readonly); }
    validate() { return this._radios ? this._radios.some(r => r.checked) : false; }
    focus() { if (this._radios && this._radios[0]) this._radios[0].focus(); }
    setDisabled(disabled) { if (this._radios) this._radios.forEach(r => r.disabled = disabled); }
}
_FormaWidgets['radio'] = _WRadio;

// ── combo (검색 가능 커스텀 드롭다운 + popup 지원) ──
class _WCombo extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const hasPopup = !el.readOnly && el.popup;
        const outerWrap = hasPopup ? document.createElement('div') : null;
        if (outerWrap) outerWrap.className = 'fc-combo-popup-wrap';

        const wrap = document.createElement('div'); wrap.className = 'fc-combo-wrap';

        const display = document.createElement('div');
        display.className = 'fc-combo-display forma-input';
        display.setAttribute('tabindex', '0');
        const displayText = document.createElement('span'); displayText.className = 'fc-combo-text';
        displayText.textContent = form.isSearch ? '전체' : '선택';
        display.appendChild(displayText);
        const arrow = document.createElement('span'); arrow.className = 'fc-combo-arrow'; arrow.textContent = '▾';
        display.appendChild(arrow);
        wrap.appendChild(display);

        const dropdown = document.createElement('div'); dropdown.className = 'fc-combo-dd'; dropdown.style.display = 'none';
        const searchInput = document.createElement('input'); searchInput.type = 'text'; searchInput.className = 'fc-combo-search'; searchInput.placeholder = '검색...';
        dropdown.appendChild(searchInput);
        const list = document.createElement('div'); list.className = 'fc-combo-list';
        dropdown.appendChild(list);
        wrap.appendChild(dropdown);

        const hidden = document.createElement('input'); hidden.type = 'hidden';
        wrap.appendChild(hidden);

        this._state = {
            value: '', label: form.isSearch ? '전체' : '선택',
            options: [{ value: '', label: form.isSearch ? '전체' : '선택' }],
            wrap, display, displayText, dropdown, searchInput, list, hidden, isOpen: false, hlIdx: -1
        };
        this._input = hidden;

        if (el.options) {
            el.options.forEach(o => this._state.options.push({ value: o.value, label: o.label }));
        } else if (el.code) {
            this._loadCode(el.code);
        }

        if (el.readOnly) display.classList.add('fc-disabled');

        const state = this._state;
        const renderList = (filter) => {
            list.innerHTML = '';
            const q = (filter || '').toLowerCase();
            let idx = 0;
            state.options.forEach(opt => {
                if (q && !opt.label.toLowerCase().includes(q) && !String(opt.value).toLowerCase().includes(q)) return;
                const item = document.createElement('div');
                item.className = 'fc-combo-item' + (opt.value === state.value ? ' fc-sel' : '');
                item.textContent = opt.label;
                item.dataset.idx = idx++;
                item.addEventListener('click', (e) => { e.stopPropagation(); selectOpt(opt); });
                item.addEventListener('mouseenter', () => { state.hlIdx = parseInt(item.dataset.idx); highlightItem(); });
                list.appendChild(item);
            });
            if (list.children.length === 0) { list.innerHTML = '<div class="fc-combo-empty">결과 없음</div>'; }
            state.hlIdx = -1;
        };
        const highlightItem = () => {
            list.querySelectorAll('.fc-combo-item').forEach((it, i) => { it.classList.toggle('fc-hl', i === state.hlIdx); });
        };
        const selectOpt = (opt) => {
            const old = state.value;
            state.value = opt.value; state.label = opt.label;
            displayText.textContent = opt.label; hidden.value = opt.value;
            closeDD();
            this._fireChange(opt.value, old);
        };
        const openDD = () => {
            if (el.readOnly) return;
            form._closeAllDropdowns();
            dropdown.style.display = ''; state.isOpen = true;
            searchInput.value = ''; renderList(''); searchInput.focus();
            const selItem = list.querySelector('.fc-sel');
            if (selItem) selItem.scrollIntoView({ block: 'nearest' });
        };
        const closeDD = () => { dropdown.style.display = 'none'; state.isOpen = false; };

        display.addEventListener('click', (e) => { e.stopPropagation(); if (state.isOpen) closeDD(); else openDD(); });
        display.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (!state.isOpen) openDD(); }
            if (e.key === 'Escape') closeDD();
        });
        searchInput.addEventListener('input', () => renderList(searchInput.value));
        searchInput.addEventListener('keydown', (e) => {
            const items = list.querySelectorAll('.fc-combo-item');
            if (e.key === 'ArrowDown') { e.preventDefault(); state.hlIdx = Math.min(state.hlIdx + 1, items.length - 1); highlightItem(); items[state.hlIdx]?.scrollIntoView({ block: 'nearest' }); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); state.hlIdx = Math.max(state.hlIdx - 1, 0); highlightItem(); items[state.hlIdx]?.scrollIntoView({ block: 'nearest' }); }
            else if (e.key === 'Enter') { if (state.hlIdx >= 0 && items[state.hlIdx]) items[state.hlIdx].click(); }
            else if (e.key === 'Escape') { closeDD(); display.focus(); }
        });
        this._addDocListener('mousedown', (e) => { if (state.isOpen && !wrap.contains(e.target)) closeDD(); });
        this._closeDD = closeDD;

        // popup 지원: 돋보기 버튼 + 더블클릭
        if (hasPopup) {
            outerWrap.appendChild(wrap);
            const popupBtn = document.createElement('button');
            popupBtn.type = 'button'; popupBtn.className = 'fc-combo-popup-btn'; popupBtn.textContent = '🔍';
            popupBtn.title = el.popup.title || '검색';
            const openPopup = () => {
                if (typeof FormaModal === 'undefined') return;
                closeDD();
                const modal = new FormaModal({
                    title: el.popup.title || el.label || '검색',
                    url: el.popup.url, width: el.popup.width || 800, height: el.popup.height || 600,
                    okCallback: (result) => {
                        if (!result) return;
                        const code = result[el.popup.codeField] || '';
                        const name = result[el.popup.nameField] || '';
                        // 옵션 목록에 있으면 해당 옵션 선택, 없으면 동적 추가
                        const existing = state.options.find(o => o.value === code);
                        if (existing) {
                            selectOpt(existing);
                        } else {
                            const newOpt = { value: code, label: name || code };
                            state.options.push(newOpt);
                            selectOpt(newOpt);
                        }
                    }
                });
                modal.show({ currentValue: state.value });
            };
            popupBtn.addEventListener('click', (e) => { e.stopPropagation(); openPopup(); });
            display.addEventListener('dblclick', (e) => { e.stopPropagation(); openPopup(); });
            outerWrap.appendChild(popupBtn);
            this._wrapWithFix(group, outerWrap);
        } else {
            this._wrapWithFix(group, wrap);
        }
    }
    _loadCode(code, params) {
        const fetcher = params
            ? fetch('/api/codes/' + code + '?' + new URLSearchParams(params).toString()).then(r => r.json()).then(d => d.resultData || d)
            : (typeof getCodeItems === 'function' ? getCodeItems(code) : Promise.resolve([]));
        fetcher.then(items => {
            const st = this._state; if (!st) return;
            st.options = [st.options[0]];
            (items || []).forEach(item => {
                st.options.push({ value: item.CODE || item.code || item.value || '', label: item.CODE_NM || item.codeName || item.label || '' });
            });
        }).catch(() => {});
    }
    getValue() { return this._state ? this._state.value || null : null; }
    setValue(value) {
        const st = this._state; if (!st) return;
        const v = String(value ?? '');
        st.value = v; st.hidden.value = v;
        const opt = st.options.find(o => o.value === v);
        st.label = opt ? opt.label : (v || (this.form.isSearch ? '전체' : '선택'));
        st.displayText.textContent = st.label;
    }
    clear() {
        const st = this._state; if (!st) return;
        st.value = ''; st.hidden.value = '';
        st.label = st.options[0]?.label || '';
        st.displayText.textContent = st.label;
    }
    setReadonly(readonly) {
        this.el.readOnly = readonly;
        const st = this._state; if (!st) return;
        if (readonly) st.display.classList.add('fc-disabled'); else st.display.classList.remove('fc-disabled');
    }
    validate() { const v = this._state ? this._state.value : null; return v !== null && v !== undefined && v !== ''; }
    focus() { if (this._state) this._state.display.focus(); }
    setOptions(options) {
        const st = this._state; if (!st) return;
        st.options = [st.options[0]]; options.forEach(o => st.options.push({ value: o.value, label: o.label }));
    }
    setDisabled(disabled) {
        this.el.readOnly = disabled;
        const st = this._state; if (!st) return;
        if (disabled) st.display.classList.add('fc-disabled'); else st.display.classList.remove('fc-disabled');
    }
    closeDropdown() { if (this._closeDD) this._closeDD(); }
}
_FormaWidgets['combo'] = _WCombo;

// ── select (검색 없는 단순 드롭다운 + popup 지원) ──
class _WSelect extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const hasPopup = !el.readOnly && el.popup;
        const outerWrap = hasPopup ? document.createElement('div') : null;
        if (outerWrap) outerWrap.className = 'fc-combo-popup-wrap';

        const select = document.createElement('select');
        select.className = 'forma-input fc-select';
        if (el.readOnly) select.disabled = true;

        // 기본 옵션
        const defOpt = document.createElement('option');
        defOpt.value = ''; defOpt.textContent = form.isSearch ? '전체' : '선택';
        select.appendChild(defOpt);

        this._select = select;
        this._input = select;

        if (el.options) {
            el.options.forEach(o => this._addOption(o.value, o.label));
        } else if (el.code) {
            this._loadCode(el.code);
        }

        select.addEventListener('change', () => {
            const v = select.value, old = select._prev || '';
            select._prev = v;
            this._fireChange(v, old);
        });
        select._prev = '';

        // popup 지원
        if (hasPopup) {
            outerWrap.appendChild(select);
            const popupBtn = document.createElement('button');
            popupBtn.type = 'button'; popupBtn.className = 'fc-combo-popup-btn'; popupBtn.textContent = '🔍';
            popupBtn.title = el.popup.title || '검색';
            const openPopup = () => {
                if (typeof FormaModal === 'undefined') return;
                const modal = new FormaModal({
                    title: el.popup.title || el.label || '검색',
                    url: el.popup.url, width: el.popup.width || 800, height: el.popup.height || 600,
                    okCallback: (result) => {
                        if (!result) return;
                        const code = result[el.popup.codeField] || '';
                        const name = result[el.popup.nameField] || '';
                        // 옵션에 없으면 추가
                        if (!Array.from(select.options).find(o => o.value === code)) {
                            this._addOption(code, name || code);
                        }
                        const old = select.value;
                        select.value = code; select._prev = code;
                        this._fireChange(code, old);
                    }
                });
                modal.show({ currentValue: select.value });
            };
            popupBtn.addEventListener('click', (e) => { e.stopPropagation(); openPopup(); });
            select.addEventListener('dblclick', (e) => { e.stopPropagation(); openPopup(); });
            outerWrap.appendChild(popupBtn);
            this._wrapWithFix(group, outerWrap);
        } else {
            this._wrapWithFix(group, select);
        }
    }
    _addOption(value, label) {
        const opt = document.createElement('option');
        opt.value = value; opt.textContent = label;
        this._select.appendChild(opt);
    }
    _loadCode(code, params) {
        const fetcher = params
            ? fetch('/api/codes/' + code + '?' + new URLSearchParams(params).toString()).then(r => r.json()).then(d => d.resultData || d)
            : (typeof getCodeItems === 'function' ? getCodeItems(code) : Promise.resolve([]));
        fetcher.then(items => {
            if (!this._select) return;
            (items || []).forEach(item => {
                this._addOption(item.CODE || item.code || item.value || '', item.CODE_NM || item.codeName || item.label || '');
            });
        }).catch(() => {});
    }
    getValue() { return this._select ? this._select.value || null : null; }
    setValue(value) { if (this._select) { this._select.value = String(value ?? ''); this._select._prev = this._select.value; } }
    clear() { if (this._select) { this._select.value = ''; this._select._prev = ''; } }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._select) this._select.disabled = readonly; }
    validate() { const v = this._select ? this._select.value : null; return v !== null && v !== undefined && v !== ''; }
    focus() { if (this._select) this._select.focus(); }
    setOptions(options) {
        if (!this._select) return;
        const cur = this._select.value;
        // 첫 번째(기본) 옵션 유지, 나머지 제거
        while (this._select.options.length > 1) this._select.remove(1);
        options.forEach(o => this._addOption(o.value, o.label));
        this._select.value = cur; // 기존 값 복원 시도
    }
    setDisabled(disabled) { this.el.readOnly = disabled; if (this._select) this._select.disabled = disabled; }
}
_FormaWidgets['select'] = _WSelect;

// ── date (커스텀 캘린더) ──
class _WDate extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('div'); wrap.className = 'fc-date-wrap';
        const input = document.createElement('input');
        input.type = 'text'; input.className = 'forma-input fc-date-input';
        input.placeholder = 'YYYY-MM-DD'; input.readOnly = true;
        wrap.appendChild(input);
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'fc-date-btn'; btn.innerHTML = '&#128197;';
        wrap.appendChild(btn);

        const openCal = () => {
            if (el.readOnly) return;
            const cal = new _FormaCalendar({
                onSelect: (ds) => { const old = input.value; input.value = ds; this._fireChange(ds, old); },
                onClear: () => { const old = input.value; input.value = ''; this._fireChange('', old); }
            });
            cal.show(wrap, input.value || null);
        };
        input.addEventListener('click', openCal);
        btn.addEventListener('click', (e) => { e.stopPropagation(); openCal(); });

        if (el.default === 'TODAY') input.value = _FormaCalendar.fmt(new Date());

        this._wrapWithFix(group, wrap);
        this._input = input;
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['date'] = _WDate;

// ── dateRange (커스텀 캘린더 + 프리셋) ──
class _WDateRange extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const container = document.createElement('div'); container.className = 'fc-dr-container';

        const presets = el.presets !== false;
        const presetKeys = Array.isArray(el.presets) ? el.presets : _defaultPresets;

        if (presets) {
            const bar = document.createElement('div'); bar.className = 'fc-dr-presets';
            presetKeys.forEach(key => {
                const p = _datePresets[key]; if (!p) return;
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'fc-preset';
                btn.textContent = p.label; btn.dataset.key = key;
                btn.addEventListener('click', () => {
                    const r = p.fn();
                    this._fromInput.value = r.from; this._toInput.value = r.to;
                    bar.querySelectorAll('.fc-preset').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this._fireChange({ from: r.from, to: r.to }, null);
                });
                bar.appendChild(btn);
            });
            container.appendChild(bar);
            this._presetBar = bar;
        }

        const row = document.createElement('div'); row.className = 'fc-dr-row';
        const makeInput = (placeholder) => {
            const w = document.createElement('div'); w.className = 'fc-date-wrap';
            const inp = document.createElement('input');
            inp.type = 'text'; inp.className = 'forma-input fc-date-input';
            inp.placeholder = placeholder || 'YYYY-MM-DD'; inp.readOnly = true;
            w.appendChild(inp);
            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'fc-date-btn'; btn.innerHTML = '&#128197;';
            w.appendChild(btn);
            return { wrap: w, input: inp, btn };
        };

        const from = makeInput('시작일');
        const to = makeInput('종료일');
        row.appendChild(from.wrap);
        const sep = document.createElement('span'); sep.className = 'fc-dr-sep'; sep.textContent = '~'; row.appendChild(sep);
        row.appendChild(to.wrap);
        container.appendChild(row);
        group.appendChild(container);

        this._fromInput = from.input;
        this._toInput = to.input;
        this._container = container;

        const clearPresetHL = () => {
            if (this._presetBar) this._presetBar.querySelectorAll('.fc-preset').forEach(b => b.classList.remove('active'));
        };
        const openFrom = () => {
            if (el.readOnly) return;
            const cal = new _FormaCalendar({
                onSelect: (ds) => { this._fromInput.value = ds; clearPresetHL(); this._fireChange({ from: this._fromInput.value, to: this._toInput.value }, null); },
                onClear: () => { this._fromInput.value = ''; clearPresetHL(); }
            });
            cal.show(from.wrap, this._fromInput.value || null);
        };
        const openTo = () => {
            if (el.readOnly) return;
            const cal = new _FormaCalendar({
                onSelect: (ds) => { this._toInput.value = ds; clearPresetHL(); this._fireChange({ from: this._fromInput.value, to: this._toInput.value }, null); },
                onClear: () => { this._toInput.value = ''; clearPresetHL(); }
            });
            cal.show(to.wrap, this._toInput.value || null);
        };
        from.input.addEventListener('click', openFrom);
        from.btn.addEventListener('click', (e) => { e.stopPropagation(); openFrom(); });
        to.input.addEventListener('click', openTo);
        to.btn.addEventListener('click', (e) => { e.stopPropagation(); openTo(); });

        // default
        if (el.default) {
            const map = { 'THIS_MONTH': 'thisMonth', 'TODAY': 'today', 'THIS_YEAR': 'thisYear', 'THIS_WEEK': 'thisWeek', 'LAST_MONTH': 'lastMonth' };
            const key = map[el.default] || el.default;
            const p = _datePresets[key];
            if (p) {
                const r = p.fn();
                this._fromInput.value = r.from; this._toInput.value = r.to;
                if (presets) {
                    const presetBtn = container.querySelector('[data-key="' + key + '"]');
                    if (presetBtn) presetBtn.classList.add('active');
                }
            }
        }
    }
    // getData: field_from / field_to
    getValue() { return { from: this._fromInput ? this._fromInput.value || null : null, to: this._toInput ? this._toInput.value || null : null }; }
    setValue(value) {
        // value can be { from, to } or ignored (setValueFromData handles the split keys)
        if (value && typeof value === 'object') {
            if (this._fromInput && value.from !== undefined) this._fromInput.value = value.from ?? '';
            if (this._toInput && value.to !== undefined) this._toInput.value = value.to ?? '';
        }
    }
    setValueFromData(obj) {
        if (this._fromInput && obj[this.field + '_from'] !== undefined) this._fromInput.value = obj[this.field + '_from'] ?? '';
        if (this._toInput && obj[this.field + '_to'] !== undefined) this._toInput.value = obj[this.field + '_to'] ?? '';
    }
    clear() { if (this._fromInput) this._fromInput.value = ''; if (this._toInput) this._toInput.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._fromInput) this._fromInput.readOnly = true; if (this._toInput) this._toInput.readOnly = true; }
    validate() { return !!(this._fromInput && this._toInput && (this._fromInput.value || this._toInput.value)); }
    focus() { if (this._fromInput) this._fromInput.focus(); }
}
_FormaWidgets['dateRange'] = _WDateRange;

// ── codePopup ──
class _WCodePopup extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-codepopup';
        const codeInput = document.createElement('input'); codeInput.type = 'text'; codeInput.className = 'forma-input'; codeInput.style.width = '100px';
        if (el.placeholder) codeInput.placeholder = el.placeholder;
        if (el.readOnly) codeInput.readOnly = true;
        wrap.appendChild(codeInput);
        const nameSpan = document.createElement('span'); nameSpan.className = 'forma-codepopup-name'; wrap.appendChild(nameSpan);
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'forma-btn forma-btn-sm'; btn.textContent = '🔍'; btn.style.marginLeft = '2px';
        if (!el.readOnly && el.popup) {
            btn.onclick = () => {
                if (typeof FormaModal === 'undefined') return;
                const showParam = Object.assign({ currentValue: codeInput.value }, this._popupParams || {});
                const modal = new FormaModal({ title: el.label || '검색', url: el.popup.url, width: el.popup.width || 800, height: el.popup.height || 600,
                    okCallback: (result) => {
                        if (!result) return;
                        const old = codeInput.value;
                        codeInput.value = result[el.popup.codeField] || '';
                        nameSpan.textContent = result[el.popup.nameField] || '';
                        this._fireChange(codeInput.value, old);
                    }
                });
                modal.show(showParam);
            };
        }
        wrap.appendChild(btn); group.appendChild(wrap);
        this._codeInput = codeInput;
        this._nameSpan = nameSpan;
        this._popupParams = {};
        this._bindStdEvents(codeInput);
    }
    getValue() { return this._codeInput ? this._codeInput.value || null : null; }
    setValue(value) { if (this._codeInput) this._codeInput.value = value ?? ''; }
    setValueFromData(obj) {
        if (this._codeInput && obj[this.field] !== undefined) this._codeInput.value = obj[this.field] ?? '';
        if (this._nameSpan && this.el.popup && obj[this.el.popup.nameField] !== undefined) this._nameSpan.textContent = obj[this.el.popup.nameField] ?? '';
    }
    clear() { if (this._codeInput) this._codeInput.value = ''; if (this._nameSpan) this._nameSpan.textContent = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._codeInput) this._codeInput.readOnly = readonly; }
    validate() { return !!(this._codeInput && this._codeInput.value); }
    focus() { if (this._codeInput) this._codeInput.focus(); }
}
_FormaWidgets['codePopup'] = _WCodePopup;

// ── currency ──
class _WCurrency extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const input = document.createElement('input');
        input.type = 'text'; input.className = 'forma-input forma-currency-input'; input.style.textAlign = 'right';
        if (el.placeholder) input.placeholder = el.placeholder;
        if (el.readOnly) input.readOnly = true;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && form._onEnter) form._onEnter(this.field, this._parse(input.value));
            if (e.ctrlKey || e.metaKey) return;
            if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
            if (e.key === '-' && input.selectionStart === 0) return;
            if (e.key >= '0' && e.key <= '9') return;
            e.preventDefault();
        });
        input.addEventListener('focus', () => { const n = this._parse(input.value); input.value = n !== null && n !== 0 ? String(n) : (n === 0 ? '0' : ''); });
        input.addEventListener('blur', () => {
            const n = this._parse(input.value), old = input._prev;
            input.value = n !== null ? this._fmt(n) : ''; input._prev = n;
            if (n !== old) this._fireChange(n, old);
            if (form._onBlur) form._onBlur(this.field, n);
        });
        input._prev = null;
        this._wrapWithFix(group, input);
        this._input = input;
    }
    _parse(s) { if (s === null || s === undefined || s === '') return null; const n = Number(String(s).replace(/,/g, '')); return isNaN(n) ? null : n; }
    _fmt(n) { return n === null || n === undefined ? '' : n.toLocaleString('ko-KR'); }
    getValue() { return this._input ? this._parse(this._input.value) : null; }
    setValue(value) {
        if (!this._input) return;
        const n = value !== null && value !== undefined ? Number(value) : null;
        this._input.value = n !== null ? this._fmt(n) : '';
        this._input._prev = n;
    }
    clear() { if (this._input) { this._input.value = ''; this._input._prev = null; } }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return this._parse(this._input ? this._input.value : '') !== null; }
    focus() { if (this._input) this._input.focus(); }
    setDisabled(disabled) { if (this._input) this._input.disabled = disabled; }
}
_FormaWidgets['currency'] = _WCurrency;

// ── autocomplete (검색형 텍스트 입력) ──
class _WAutocomplete extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const wrap = document.createElement('div'); wrap.className = 'forma-ac-wrap';
        const input = document.createElement('input'); input.type = 'text'; input.className = 'forma-input';
        if (el.placeholder) input.placeholder = el.placeholder;
        if (el.readOnly) input.readOnly = true;
        if (el.maxLength) input.maxLength = el.maxLength;
        wrap.appendChild(input);

        const dd = document.createElement('div'); dd.className = 'forma-ac-dropdown'; dd.style.display = 'none';
        wrap.appendChild(dd);

        this._input = input;
        this._dd = dd;
        this._options = el.options || [];
        this._fetchUrl = el.fetchUrl || null;
        this._fetchTimer = null;
        this._hlIdx = -1;

        const renderList = (items) => {
            dd.innerHTML = '';
            if (items.length === 0) { dd.style.display = 'none'; return; }
            items.forEach((item, idx) => {
                const div = document.createElement('div'); div.className = 'forma-ac-item';
                div.textContent = typeof item === 'string' ? item : (item.label || item.value || '');
                div.addEventListener('click', (e) => { e.stopPropagation(); selectItem(item); });
                div.addEventListener('mouseenter', () => { this._hlIdx = idx; hlItem(); });
                dd.appendChild(div);
            });
            dd.style.display = '';
            this._hlIdx = -1;
        };
        const hlItem = () => { dd.querySelectorAll('.forma-ac-item').forEach((it, i) => it.classList.toggle('fc-hl', i === this._hlIdx)); };
        const selectItem = (item) => {
            const old = input.value;
            const val = typeof item === 'string' ? item : (item.value || item.label || '');
            const label = typeof item === 'string' ? item : (item.label || item.value || '');
            input.value = label;
            input.dataset.value = val;
            dd.style.display = 'none';
            this._fireChange(val, old);
            // nameField 자동 세팅
            if (el.nameField && typeof item === 'object' && item[el.nameField] !== undefined) {
                // 외부에서 처리
            }
        };
        const search = () => {
            const q = input.value.trim();
            if (!q) { dd.style.display = 'none'; return; }
            if (this._fetchUrl) {
                clearTimeout(this._fetchTimer);
                this._fetchTimer = setTimeout(() => {
                    fetch(this._fetchUrl + '?' + new URLSearchParams({ q }).toString())
                        .then(r => r.json())
                        .then(data => renderList(data.resultData || data || []))
                        .catch(() => renderList([]));
                }, 300);
            } else {
                const ql = q.toLowerCase();
                const filtered = this._options.filter(o => {
                    const label = typeof o === 'string' ? o : (o.label || o.value || '');
                    return label.toLowerCase().includes(ql);
                });
                renderList(filtered);
            }
        };

        input.addEventListener('input', search);
        input.addEventListener('focus', () => { if (input.value.trim()) search(); });
        input.addEventListener('keydown', (e) => {
            const items = dd.querySelectorAll('.forma-ac-item');
            if (e.key === 'ArrowDown') { e.preventDefault(); this._hlIdx = Math.min(this._hlIdx + 1, items.length - 1); hlItem(); items[this._hlIdx]?.scrollIntoView({ block: 'nearest' }); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); this._hlIdx = Math.max(this._hlIdx - 1, 0); hlItem(); items[this._hlIdx]?.scrollIntoView({ block: 'nearest' }); }
            else if (e.key === 'Enter') { e.preventDefault(); if (this._hlIdx >= 0 && items[this._hlIdx]) items[this._hlIdx].click(); else dd.style.display = 'none'; }
            else if (e.key === 'Escape') { dd.style.display = 'none'; }
            if (e.key === 'Enter' && form._onEnter) form._onEnter(this.field, input.value);
        });
        input.addEventListener('blur', () => { setTimeout(() => { dd.style.display = 'none'; }, 200); if (form._onBlur) form._onBlur(this.field, input.value); });

        this._wrapWithFix(group, wrap);
    }
    getValue() { return this._input ? (this._input.dataset.value || this._input.value || null) : null; }
    setValue(value) {
        if (!this._input) return;
        this._input.value = value ?? '';
        this._input.dataset.value = value ?? '';
        // 옵션에서 라벨 찾기
        if (this._options.length > 0) {
            const opt = this._options.find(o => (typeof o === 'string' ? o : o.value) === value);
            if (opt) this._input.value = typeof opt === 'string' ? opt : (opt.label || opt.value || '');
        }
    }
    clear() { if (this._input) { this._input.value = ''; this._input.dataset.value = ''; } }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return !!(this._input && (this._input.dataset.value || this._input.value)); }
    focus() { if (this._input) this._input.focus(); }
    setOptions(options) { this._options = options || []; }
}
_FormaWidgets['autocomplete'] = _WAutocomplete;

// ── inputMask (포맷 마스크 입력) ──
class _WInputMask extends _FormaWidget {
    build(group) {
        const el = this.el;
        const input = document.createElement('input'); input.type = 'text'; input.className = 'forma-input';
        if (el.placeholder) input.placeholder = el.placeholder;
        if (el.readOnly) input.readOnly = true;
        // mask: '000-0000-0000' (0=숫자, A=문자, *=아무거나)
        const mask = el.mask || '';
        if (mask) input.placeholder = input.placeholder || mask;
        input.addEventListener('input', () => {
            const raw = input.value.replace(/[^0-9a-zA-Z]/g, '');
            let result = '', ri = 0;
            for (let mi = 0; mi < mask.length && ri < raw.length; mi++) {
                const mc = mask[mi];
                if (mc === '0') { if (/\d/.test(raw[ri])) result += raw[ri++]; else break; }
                else if (mc === 'A') { if (/[a-zA-Z]/.test(raw[ri])) result += raw[ri++]; else break; }
                else if (mc === '*') { result += raw[ri++]; }
                else { result += mc; if (raw[ri] === mc) ri++; }
            }
            const pos = input.selectionStart;
            input.value = result;
            input.setSelectionRange(Math.min(pos, result.length), Math.min(pos, result.length));
        });
        this._wrapWithFix(group, input);
        this._input = input;
        this._bindStdEvents(input);
    }
    getValue() { return this._input ? this._input.value || null : null; }
    // 마스크 제거한 순수값
    getRawValue() { return this._input ? this._input.value.replace(/[^0-9a-zA-Z]/g, '') || null : null; }
    setValue(value) { if (this._input) { this._input.value = value ?? ''; this._input.dispatchEvent(new Event('input')); } }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['inputMask'] = _WInputMask;

// ── colorPicker ──
class _WColorPicker extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-color-wrap';
        const input = document.createElement('input'); input.type = 'color'; input.className = 'forma-color-input';
        input.value = el.default || getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4a90d9';
        if (el.readOnly) input.disabled = true;
        const label = document.createElement('span'); label.className = 'forma-color-label';
        label.textContent = input.value;
        input.addEventListener('input', () => { label.textContent = input.value; this._fireChange(input.value, null); });
        wrap.appendChild(input); wrap.appendChild(label);
        group.appendChild(wrap);
        this._input = input; this._label = label;
    }
    getValue() { return this._input ? this._input.value : null; }
    setValue(value) { if (this._input) { this._input.value = value || '#000000'; this._label.textContent = this._input.value; } }
    clear() { this.setValue(getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4a90d9'); }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.disabled = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['colorPicker'] = _WColorPicker;

// ── slider ──
class _WSlider extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-slider-wrap';
        const input = document.createElement('input'); input.type = 'range'; input.className = 'forma-slider';
        input.min = el.min ?? 0; input.max = el.max ?? 100; input.step = el.step ?? 1;
        input.value = el.default ?? 50;
        if (el.readOnly) input.disabled = true;
        const val = document.createElement('span'); val.className = 'forma-slider-val';
        val.textContent = input.value + (el.suffix || '');
        input.addEventListener('input', () => { val.textContent = input.value + (el.suffix || ''); this._fireChange(Number(input.value), null); });
        wrap.appendChild(input); wrap.appendChild(val);
        group.appendChild(wrap);
        this._input = input; this._val = val;
    }
    getValue() { return this._input ? Number(this._input.value) : null; }
    setValue(value) { if (this._input) { this._input.value = value ?? 50; this._val.textContent = this._input.value + (this.el.suffix || ''); } }
    clear() { this.setValue(this.el.default ?? 50); }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.disabled = readonly; }
    validate() { return true; }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['slider'] = _WSlider;

// ── tagInput (칩 입력) ──
class _WTagInput extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const wrap = document.createElement('div'); wrap.className = 'forma-tag-wrap forma-input';
        const tagArea = document.createElement('span'); tagArea.className = 'forma-tag-area';
        const input = document.createElement('input'); input.type = 'text'; input.className = 'forma-tag-input';
        input.placeholder = el.placeholder || '입력 후 Enter';
        wrap.appendChild(tagArea); wrap.appendChild(input);
        group.appendChild(wrap);
        this._tags = []; this._tagArea = tagArea; this._input = input; this._wrap = wrap;

        const addTag = (text) => {
            text = text.trim(); if (!text || this._tags.includes(text)) return;
            this._tags.push(text);
            renderTags();
            this._fireChange(this._tags.join(','), null);
        };
        const removeTag = (text) => { this._tags = this._tags.filter(t => t !== text); renderTags(); this._fireChange(this._tags.join(','), null); };
        const renderTags = () => {
            tagArea.innerHTML = '';
            this._tags.forEach(t => {
                const chip = document.createElement('span'); chip.className = 'forma-tag-chip';
                chip.textContent = t;
                const x = document.createElement('span'); x.className = 'forma-tag-x'; x.textContent = '×';
                x.onclick = () => { if (!el.readOnly) removeTag(t); };
                chip.appendChild(x); tagArea.appendChild(chip);
            });
        };
        input.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) { e.preventDefault(); addTag(input.value); input.value = ''; }
            if (e.key === 'Backspace' && !input.value && this._tags.length > 0) { removeTag(this._tags[this._tags.length - 1]); }
        });
        wrap.addEventListener('click', () => input.focus());
    }
    getValue() { return this._tags.length > 0 ? this._tags.join(',') : null; }
    setValue(value) { this._tags = value ? String(value).split(',').map(s => s.trim()).filter(s => s) : []; this._tagArea.innerHTML = ''; this._tags.forEach(t => { const chip = document.createElement('span'); chip.className = 'forma-tag-chip'; chip.textContent = t; const x = document.createElement('span'); x.className = 'forma-tag-x'; x.textContent = '×'; x.onclick = () => { if (!this.el.readOnly) { this._tags = this._tags.filter(tt => tt !== t); this.setValue(this._tags.join(',')); } }; chip.appendChild(x); this._tagArea.appendChild(chip); }); }
    clear() { this._tags = []; this._tagArea.innerHTML = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.disabled = readonly; }
    validate() { return this._tags.length > 0; }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['tagInput'] = _WTagInput;

// ── rating (별점) ──
class _WRating extends _FormaWidget {
    build(group) {
        const el = this.el;
        const maxStars = el.max || 5;
        const wrap = document.createElement('span'); wrap.className = 'forma-rating-wrap';
        this._stars = []; this._value = 0; this._max = maxStars;
        for (let i = 1; i <= maxStars; i++) {
            const star = document.createElement('span'); star.className = 'forma-rating-star'; star.textContent = '★';
            star.dataset.val = i;
            if (!el.readOnly) {
                star.addEventListener('click', () => { const old = this._value; this._value = i; this._renderStars(); this._fireChange(i, old); });
                star.addEventListener('mouseenter', () => this._highlightStars(i));
                star.addEventListener('mouseleave', () => this._renderStars());
            }
            wrap.appendChild(star); this._stars.push(star);
        }
        const valSpan = document.createElement('span'); valSpan.className = 'forma-rating-val';
        wrap.appendChild(valSpan); this._valSpan = valSpan;
        group.appendChild(wrap); this._wrap = wrap;
    }
    _renderStars() { this._stars.forEach((s, i) => { s.classList.toggle('active', i < this._value); }); this._valSpan.textContent = this._value > 0 ? this._value + '/' + this._max : ''; }
    _highlightStars(n) { this._stars.forEach((s, i) => s.classList.toggle('active', i < n)); }
    getValue() { return this._value || null; }
    setValue(value) { this._value = Number(value) || 0; this._renderStars(); }
    clear() { this._value = 0; this._renderStars(); }
    validate() { return this._value > 0; }
    focus() { if (this._stars[0]) this._stars[0].focus(); }
}
_FormaWidgets['rating'] = _WRating;

// ── buttonGroup (세그먼트 버튼) ──
class _WButtonGroup extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-btngroup';
        this._buttons = []; this._value = null;
        (el.options || []).forEach(opt => {
            const btn = document.createElement('button'); btn.type = 'button';
            btn.className = 'forma-btngroup-item'; btn.textContent = opt.label; btn.dataset.val = opt.value;
            if (!el.readOnly) {
                btn.addEventListener('click', () => { const old = this._value; this._value = opt.value; this._renderActive(); this._fireChange(opt.value, old); });
            }
            wrap.appendChild(btn); this._buttons.push(btn);
        });
        group.appendChild(wrap); this._wrap = wrap;
    }
    _renderActive() { this._buttons.forEach(b => b.classList.toggle('active', b.dataset.val === String(this._value))); }
    getValue() { return this._value; }
    setValue(value) { this._value = value; this._renderActive(); }
    clear() { this._value = null; this._renderActive(); }
    setReadonly(readonly) { this.el.readOnly = readonly; this._buttons.forEach(b => b.disabled = readonly); }
    validate() { return this._value !== null && this._value !== ''; }
    focus() { if (this._buttons[0]) this._buttons[0].focus(); }
}
_FormaWidgets['buttonGroup'] = _WButtonGroup;

// ── multiCombo ──
class _WMultiCombo extends _FormaWidget {
    build(group) {
        const el = this.el, form = this.form;
        const wrap = document.createElement('div'); wrap.className = 'forma-multicb-wrap';
        const display = document.createElement('div'); display.className = 'forma-multicb-display forma-input'; display.setAttribute('tabindex', '0'); wrap.appendChild(display);
        const dropdown = document.createElement('div'); dropdown.className = 'forma-multicb-dropdown'; dropdown.style.display = 'none';

        const allWrap = document.createElement('label'); allWrap.className = 'forma-multicb-item forma-multicb-all';
        const allCb = document.createElement('input'); allCb.type = 'checkbox';
        allWrap.appendChild(allCb); allWrap.appendChild(document.createTextNode(' 전체'));
        dropdown.appendChild(allWrap);
        const hr = document.createElement('hr'); hr.style.cssText = 'margin:2px 0;border:none;border-top:1px solid var(--border-light)'; dropdown.appendChild(hr);

        const items = [], checkboxes = [];
        (el.options || []).forEach(opt => {
            const lbl = document.createElement('label'); lbl.className = 'forma-multicb-item';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = opt.value; cb.dataset.label = opt.label;
            lbl.appendChild(cb); lbl.appendChild(document.createTextNode(' ' + opt.label));
            dropdown.appendChild(lbl); checkboxes.push(cb); items.push(opt);
        });
        wrap.appendChild(dropdown);

        const selectedValues = new Set();
        const updateDisplay = () => {
            display.innerHTML = '';
            if (selectedValues.size === 0) { display.innerHTML = '<span class="forma-multicb-placeholder">' + (form.isSearch ? '전체' : '선택') + '</span>'; return; }
            selectedValues.forEach(val => {
                const opt = items.find(i => i.value === val); if (!opt) return;
                const pill = document.createElement('span'); pill.className = 'forma-multicb-pill'; pill.textContent = opt.label;
                const x = document.createElement('span'); x.className = 'forma-multicb-pill-x'; x.textContent = '×';
                x.onclick = (e) => { e.stopPropagation(); selectedValues.delete(val); const c = checkboxes.find(c => c.value === val); if (c) c.checked = false; allCb.checked = false; updateDisplay(); this._fireChange(Array.from(selectedValues).join(','), null); };
                pill.appendChild(x); display.appendChild(pill);
            });
        };
        allCb.addEventListener('change', () => { checkboxes.forEach(cb => { cb.checked = allCb.checked; if (allCb.checked) selectedValues.add(cb.value); else selectedValues.delete(cb.value); }); updateDisplay(); this._fireChange(Array.from(selectedValues).join(','), null); });
        checkboxes.forEach(cb => { cb.addEventListener('change', () => { if (cb.checked) selectedValues.add(cb.value); else selectedValues.delete(cb.value); allCb.checked = checkboxes.every(c => c.checked); updateDisplay(); this._fireChange(Array.from(selectedValues).join(','), null); }); });
        display.addEventListener('click', (e) => { e.stopPropagation(); const open = dropdown.style.display !== 'none'; form._closeAllDropdowns(); if (!open) dropdown.style.display = 'block'; });
        this._addDocListener('mousedown', (e) => { if (!wrap.contains(e.target)) dropdown.style.display = 'none'; });
        updateDisplay(); group.appendChild(wrap);

        this._mc = { wrap, display, dropdown, checkboxes, items, selectedValues, allCb, updateDisplay };
    }
    getValue() { return this._mc ? Array.from(this._mc.selectedValues).join(',') || null : null; }
    setValue(value) {
        const mc = this._mc; if (!mc) return;
        mc.selectedValues.clear();
        String(value || '').split(',').filter(v => v).forEach(v => mc.selectedValues.add(v));
        mc.checkboxes.forEach(cb => cb.checked = mc.selectedValues.has(cb.value));
        mc.allCb.checked = mc.checkboxes.length > 0 && mc.checkboxes.every(c => c.checked);
        mc.updateDisplay();
    }
    clear() {
        const mc = this._mc; if (!mc) return;
        mc.selectedValues.clear(); mc.checkboxes.forEach(cb => cb.checked = false); mc.allCb.checked = false; mc.updateDisplay();
    }
    setReadonly(readonly) { this.el.readOnly = readonly; }
    validate() { return this._mc ? this._mc.selectedValues.size > 0 : false; }
    focus() { if (this._mc) this._mc.display.focus(); }
    setOptions(options) {
        const mc = this._mc; if (!mc) return;
        mc.selectedValues.clear(); mc.checkboxes.length = 0; mc.items.length = 0;
        const dd = mc.dropdown; dd.innerHTML = '';
        const allWrap = document.createElement('label'); allWrap.className = 'forma-multicb-item forma-multicb-all'; mc.allCb.checked = false; allWrap.appendChild(mc.allCb); allWrap.appendChild(document.createTextNode(' 전체')); dd.appendChild(allWrap);
        const hr = document.createElement('hr'); hr.style.cssText = 'margin:2px 0;border:none;border-top:1px solid var(--border-light)'; dd.appendChild(hr);
        options.forEach(opt => {
            const lbl = document.createElement('label'); lbl.className = 'forma-multicb-item';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = opt.value; cb.dataset.label = opt.label;
            lbl.appendChild(cb); lbl.appendChild(document.createTextNode(' ' + opt.label)); dd.appendChild(lbl); mc.checkboxes.push(cb); mc.items.push(opt);
            cb.addEventListener('change', () => { if (cb.checked) mc.selectedValues.add(cb.value); else mc.selectedValues.delete(cb.value); mc.allCb.checked = mc.checkboxes.every(c => c.checked); mc.updateDisplay(); this._fireChange(Array.from(mc.selectedValues).join(','), null); });
        });
        mc.updateDisplay();
    }
    closeDropdown() { if (this._mc) this._mc.dropdown.style.display = 'none'; }
}
_FormaWidgets['multiCombo'] = _WMultiCombo;

// ── yearMonth ──
class _WYearMonth extends _FormaWidget {
    build(group) {
        const el = this.el;
        const input = document.createElement('input'); input.type = 'month'; input.className = 'forma-input';
        if (el.readOnly) input.readOnly = true;
        if (el.default === 'THIS_MONTH') { const n = new Date(); input.value = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); }
        else if (el.default === 'PREV_MONTH') { const n = new Date(); n.setMonth(n.getMonth() - 1); input.value = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); }
        this._wrapWithFix(group, input);
        this._input = input;
        this._bindStdEvents(input);
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['yearMonth'] = _WYearMonth;

// ── year ──
class _WYear extends _FormaWidget {
    build(group) {
        const el = this.el;
        const input = document.createElement('select'); input.className = 'forma-input';
        const cy = new Date().getFullYear(), range = el.range || 5;
        input.innerHTML = '<option value="">선택</option>';
        for (let y = cy - range; y <= cy + range; y++) { const o = document.createElement('option'); o.value = String(y); o.textContent = y + '년'; input.appendChild(o); }
        if (el.default === 'THIS_YEAR') input.value = String(cy);
        if (el.readOnly) input.disabled = true;
        this._wrapWithFix(group, input);
        this._input = input;
        let prev = input.value;
        input.addEventListener('change', () => { const v = input.value; this._fireChange(v, prev); prev = v; });
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.disabled = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
    setOptions(options) {
        const input = this._input; if (!input || input.tagName !== 'SELECT') return;
        const first = input.options[0]; input.innerHTML = ''; if (first) input.appendChild(first);
        options.forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.label; input.appendChild(op); });
    }
    setDisabled(disabled) { if (this._input) this._input.disabled = disabled; }
}
_FormaWidgets['year'] = _WYear;

// ── switch ──
class _WSwitch extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('span'); wrap.className = 'forma-switch-wrap';
        if (el.offLabel) { const s = document.createElement('span'); s.className = 'forma-switch-label'; s.textContent = el.offLabel; wrap.appendChild(s); }
        const track = document.createElement('span'); track.className = 'forma-switch-track'; track.setAttribute('tabindex', '0');
        const thumb = document.createElement('span'); thumb.className = 'forma-switch-thumb'; track.appendChild(thumb); wrap.appendChild(track);
        if (el.onLabel) { const s = document.createElement('span'); s.className = 'forma-switch-label'; s.textContent = el.onLabel; wrap.appendChild(s); }
        this._isOn = false;
        this._track = track;
        track.addEventListener('click', () => { if (el.readOnly) return; const old = this._isOn ? 'Y' : 'N'; this._set(!this._isOn); this._fireChange(this._isOn ? 'Y' : 'N', old); });
        track.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); track.click(); } });
        group.appendChild(wrap);
    }
    _set(v) { this._isOn = v; if (this._isOn) this._track.classList.add('on'); else this._track.classList.remove('on'); }
    getValue() { return this._isOn ? 'Y' : 'N'; }
    setValue(value) { this._set(value === 'Y' || value === true); }
    clear() { this._set(false); }
    setReadonly(readonly) { this.el.readOnly = readonly; }
    validate() { return true; } // switch always valid
    focus() { if (this._track) this._track.focus(); }
    setDisabled(disabled) { this.el.readOnly = disabled; }
}
_FormaWidgets['switch'] = _WSwitch;

// ── divider (접기/펼치기 지원) ──
class _WDivider extends _FormaWidget {
    build(group) {
        group.className += ' forma-divider-row';
        const el = this.el;
        if (el.label) {
            const l = document.createElement('span'); l.className = 'forma-divider-label';
            if (el.collapsible) {
                this._collapsed = el.collapsed || false;
                const toggle = document.createElement('span'); toggle.className = 'forma-divider-toggle';
                toggle.textContent = this._collapsed ? '▶' : '▼';
                l.appendChild(toggle);
                l.appendChild(document.createTextNode(' ' + el.label));
                l.style.cursor = 'pointer';
                l.onclick = () => this._toggle();
                this._toggleIcon = toggle;
            } else {
                l.textContent = el.label;
            }
            group.appendChild(l);
        }
        const line = document.createElement('span'); line.className = 'forma-divider-line'; group.appendChild(line);
        this._group = group;
    }
    _toggle() {
        this._collapsed = !this._collapsed;
        if (this._toggleIcon) this._toggleIcon.textContent = this._collapsed ? '▶' : '▼';
        // 다음 divider 까지의 필드 숨기기/표시
        const form = this.form;
        const elements = form.elements;
        const myIdx = elements.indexOf(this.el);
        for (let i = myIdx + 1; i < elements.length; i++) {
            const nextEl = elements[i];
            if (nextEl.widget === 'divider') break;
            if (nextEl.field && form._groups[nextEl.field]) {
                form._groups[nextEl.field].style.display = this._collapsed ? 'none' : '';
            }
        }
    }
}
_FormaWidgets['divider'] = _WDivider;

// ── display ──
class _WDisplay extends _FormaWidget {
    build(group) {
        const span = document.createElement('span'); span.className = 'forma-display-value'; group.appendChild(span);
        this._span = span;
    }
    getValue() { return this._span ? this._span.dataset.value || this._span.textContent || null : null; }
    setValue(value) {
        if (!this._span) return;
        const el = this.el;
        this._span.dataset.value = value ?? '';
        let label = value;
        if (el.options) { const opt = el.options.find(o => o.value === value); if (opt) label = opt.label; }
        if (el.badge && el.badgeColors) {
            const color = el.badgeColors[value] || 'var(--text-muted)';
            this._span.innerHTML = '';
            const b = document.createElement('span'); b.className = 'forma-badge'; b.style.background = color; b.textContent = label;
            this._span.appendChild(b);
        } else {
            this._span.textContent = label ?? '';
        }
    }
}
_FormaWidgets['display'] = _WDisplay;

// ── time (시간 선택) ──
class _WTime extends _FormaWidget {
    build(group) {
        const el = this.el;
        const input = document.createElement('input'); input.type = 'time'; input.className = 'forma-input';
        if (el.readOnly) input.readOnly = true;
        if (el.step) input.step = el.step; // 초 단위 (60=분, 1=초)
        if (el.default === 'NOW') {
            const now = new Date();
            input.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        }
        this._wrapWithFix(group, input);
        this._input = input;
        this._bindStdEvents(input);
    }
    getValue() { return this._input ? this._input.value || null : null; }
    setValue(value) { if (this._input) this._input.value = value ?? ''; }
    clear() { if (this._input) this._input.value = ''; }
    setReadonly(readonly) { this.el.readOnly = readonly; if (this._input) this._input.readOnly = readonly; }
    validate() { return !!(this._input && this._input.value); }
    focus() { if (this._input) this._input.focus(); }
}
_FormaWidgets['time'] = _WTime;

// ── file (파일 업로드) ──
class _WFile extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('div'); wrap.className = 'forma-file-wrap';
        const input = document.createElement('input'); input.type = 'file'; input.className = 'forma-file-input';
        if (el.accept) input.accept = el.accept; // '.jpg,.png' or 'image/*'
        if (el.multiple) input.multiple = true;
        input.style.display = 'none';

        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'forma-btn forma-btn-sm';
        btn.textContent = el.buttonLabel || '파일 선택';
        btn.onclick = () => { if (!el.readOnly) input.click(); };
        wrap.appendChild(btn);

        const nameSpan = document.createElement('span'); nameSpan.className = 'forma-file-name'; nameSpan.textContent = '선택된 파일 없음';
        wrap.appendChild(nameSpan);

        input.addEventListener('change', () => {
            const files = Array.from(input.files);
            if (files.length === 0) { nameSpan.textContent = '선택된 파일 없음'; return; }
            nameSpan.textContent = files.map(f => f.name).join(', ');
            this._files = files;
            this._fireChange(files, null);
        });

        wrap.appendChild(input);
        group.appendChild(wrap);
        this._input = input;
        this._nameSpan = nameSpan;
        this._files = [];
    }
    getValue() { return this._files && this._files.length > 0 ? this._files : null; }
    setValue(value) {
        // 파일은 보안상 프로그래밍으로 설정 불가, 이름만 표시
        if (this._nameSpan) this._nameSpan.textContent = value || '선택된 파일 없음';
    }
    clear() { if (this._input) this._input.value = ''; this._files = []; if (this._nameSpan) this._nameSpan.textContent = '선택된 파일 없음'; }
    setReadonly(readonly) { this.el.readOnly = readonly; }
    validate() { return this._files && this._files.length > 0; }
    focus() { }
    getFiles() { return this._files || []; }
}
_FormaWidgets['file'] = _WFile;

// ── address (카카오 주소검색) ──
class _WAddress extends _FormaWidget {
    build(group) {
        const el = this.el;
        const wrap = document.createElement('div'); wrap.className = 'fc-address-wrap';

        // 우편번호 + 검색 버튼
        const row1 = document.createElement('div'); row1.className = 'fc-address-row';
        const zipInput = document.createElement('input');
        zipInput.type = 'text'; zipInput.className = 'forma-input fc-address-zip';
        zipInput.placeholder = '우편번호'; zipInput.readOnly = true;
        row1.appendChild(zipInput);
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'forma-btn forma-btn-sm fc-address-btn';
        btn.textContent = '주소 검색';
        row1.appendChild(btn);
        wrap.appendChild(row1);

        // 기본 주소
        const addrInput = document.createElement('input');
        addrInput.type = 'text'; addrInput.className = 'forma-input fc-address-addr';
        addrInput.placeholder = '기본 주소'; addrInput.readOnly = true;
        wrap.appendChild(addrInput);

        // 상세 주소
        const detailInput = document.createElement('input');
        detailInput.type = 'text'; detailInput.className = 'forma-input fc-address-detail';
        detailInput.placeholder = '상세 주소 입력';
        if (el.readOnly) detailInput.readOnly = true;
        wrap.appendChild(detailInput);

        this._zipInput = zipInput;
        this._addrInput = addrInput;
        this._detailInput = detailInput;
        this._input = zipInput;

        // 카카오 주소 API 스크립트 동적 로드
        const ensureKakaoScript = () => {
            return new Promise((resolve) => {
                if (window.daum && window.daum.Postcode) { resolve(); return; }
                if (document.getElementById('_kakao_postcode_script')) {
                    // 이미 로딩 중 — 로드 완료 대기
                    const check = setInterval(() => {
                        if (window.daum && window.daum.Postcode) { clearInterval(check); resolve(); }
                    }, 100);
                    return;
                }
                const script = document.createElement('script');
                script.id = '_kakao_postcode_script';
                script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                script.onload = () => resolve();
                document.head.appendChild(script);
            });
        };

        const openSearch = () => {
            if (el.readOnly) return;
            ensureKakaoScript().then(() => {
                new daum.Postcode({
                    oncomplete: (data) => {
                        const old = zipInput.value;
                        zipInput.value = data.zonecode;
                        addrInput.value = data.roadAddress || data.jibunAddress || data.address;
                        detailInput.value = '';
                        detailInput.focus();
                        this._fireChange(this.getValue(), old);
                    },
                    width: '100%', height: '100%'
                }).open();
            });
        };

        btn.addEventListener('click', openSearch);
        zipInput.addEventListener('click', openSearch);
        addrInput.addEventListener('click', openSearch);
        detailInput.addEventListener('blur', () => {
            if (this.form._onBlur) this.form._onBlur(this.field, this.getValue());
        });

        group.appendChild(wrap);
    }
    getValue() {
        return {
            zipcode: this._zipInput ? this._zipInput.value || '' : '',
            address: this._addrInput ? this._addrInput.value || '' : '',
            detail: this._detailInput ? this._detailInput.value || '' : ''
        };
    }
    setValue(value) {
        if (!value || typeof value !== 'object') return;
        if (this._zipInput) this._zipInput.value = value.zipcode || value.zip_code || '';
        if (this._addrInput) this._addrInput.value = value.address || value.addr || '';
        if (this._detailInput) this._detailInput.value = value.detail || value.addr_detail || '';
    }
    setValueFromData(obj) {
        const f = this.field;
        this.setValue({
            zipcode: obj[f + '_zip'] || obj[f + '_zipcode'] || obj.zipcode || '',
            address: obj[f + '_addr'] || obj[f + '_address'] || obj.address || '',
            detail: obj[f + '_detail'] || obj[f + '_addr_detail'] || obj.addr_detail || ''
        });
    }
    getDataKeys() {
        return [this.field + '_zip', this.field + '_addr', this.field + '_detail'];
    }
    clear() {
        if (this._zipInput) this._zipInput.value = '';
        if (this._addrInput) this._addrInput.value = '';
        if (this._detailInput) this._detailInput.value = '';
    }
    setReadonly(readonly) {
        this.el.readOnly = readonly;
        if (this._detailInput) this._detailInput.readOnly = readonly;
    }
    validate() { return !!(this._zipInput && this._zipInput.value && this._addrInput && this._addrInput.value); }
    focus() { if (this._zipInput) this._zipInput.click(); }
}
_FormaWidgets['address'] = _WAddress;

// ══════════════════════════════════════════════════════════════
//  Section 5: FormaForm — 오케스트레이터
// ══════════════════════════════════════════════════════════════
class FormaForm {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        this.elements = options.elements || [];
        this.isSearch = options.search || false;
        this.columns = options.columns || 2;
        this.labelWidth = options.labelWidth || 80;
        this._widgets = {};   // field → widget instance
        this._groups = {};    // field → group DOM element
        this._originalData = null;
        this._elemMap = {};

        // Legacy compat: expose inputs map for widgets that have _input
        this.inputs = {};

        this._onChange = options.onChange || null;
        this._onBlur = options.onBlur || null;
        this._onEnter = options.onEnter || null;

        for (const el of this.elements) { if (el.field) this._elemMap[el.field] = el; }
        this._depGraph = {};  // parent → [child fields]
        this._build();
        this._buildDepGraph();
    }

    _build() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.classList.add(this.isSearch ? 'forma-search' : 'forma-form');
        const row = document.createElement('div');
        if (this.isSearch) {
            row.className = 'forma-search-row';
        } else {
            row.className = 'forma-form-grid';
            row.style.gridTemplateColumns = 'repeat(' + this.columns + ', 1fr)';
        }

        for (const el of this.elements) {
            const type = el.widget || 'text';
            const WidgetClass = _FormaWidgets[type] || _WText;
            const widget = new WidgetClass(el, this);

            if (type === 'hidden') {
                widget.build(null);
                if (el.field) { this._widgets[el.field] = widget; if (widget._input) this.inputs[el.field] = widget._input; }
                continue;
            }

            const group = document.createElement('div');
            group.className = this.isSearch ? 'forma-search-group' : 'forma-form-row';
            if (el.field) group.dataset.field = el.field;

            if (type === 'divider') {
                if (!this.isSearch) group.style.gridColumn = '1 / -1';
                widget.build(group);
                if (el.field) { this._groups[el.field] = group; this._widgets[el.field] = widget; }
                row.appendChild(group);
                continue;
            }

            if (!this.isSearch && el.colspan && el.colspan > 1) group.style.gridColumn = 'span ' + Math.min(el.colspan, this.columns);

            const label = document.createElement('label');
            label.textContent = el.label || el.field;
            if (el.required) label.classList.add('required');
            if (!this.isSearch) label.style.minWidth = this.labelWidth + 'px';
            group.appendChild(label);

            widget.build(group);

            if (el.helpText) { const h = document.createElement('div'); h.className = 'forma-help-text'; h.textContent = el.helpText; group.appendChild(h); }
            if (el.field) {
                this._groups[el.field] = group;
                this._widgets[el.field] = widget;
                // Expose _input for legacy compat (focus, etc.)
                if (widget._input) this.inputs[el.field] = widget._input;
            }
            row.appendChild(group);
        }
        this.container.appendChild(row);
    }

    // ── 의존 그래프 빌드 (dependsOn 선언 기반) ──
    _buildDepGraph() {
        this._depGraph = {};
        for (const el of this.elements) {
            if (el.dependsOn && el.field) {
                const parent = el.dependsOn.field;
                if (!this._depGraph[parent]) this._depGraph[parent] = [];
                this._depGraph[parent].push(el.field);
            }
        }
    }

    // BFS로 자식 → 손자 → … 순차 처리 (재귀 없음, 무한루프 불가)
    _cascadeDependents(parentField, parentValue) {
        const children = this._depGraph[parentField];
        if (!children || children.length === 0) return;
        this._cascading = true;

        // BFS 큐: 직계 자식부터 시작
        const queue = children.slice();
        const visited = new Set();

        while (queue.length > 0) {
            const childField = queue.shift();
            if (visited.has(childField)) continue;  // 순환 방지
            visited.add(childField);

            const el = this._elemMap[childField];
            const w = this._widgets[childField];
            if (!el || !w) continue;

            const paramKey = el.dependsOn ? el.dependsOn.paramKey || 'parent_value' : 'parent_value';
            // 부모가 직접 부모인지 확인 (BFS에서 손자는 부모값 '' 으로 초기화)
            const isDirectChild = el.dependsOn && el.dependsOn.field === parentField;
            const pVal = isDirectChild ? parentValue : '';

            // combo
            if (w instanceof _WCombo) {
                const st = w._state; if (!st) continue;
                st.options = [st.options[0]];
                st.value = ''; st.label = st.options[0].label;
                st.displayText.textContent = st.label; st.hidden.value = '';
                if (pVal && el.code) {
                    const params = {}; params[paramKey] = pVal;
                    w._loadCode(el.code, params);
                }
            }
            // select
            else if (w instanceof _WSelect) {
                while (w._select.options.length > 1) w._select.remove(1);
                w._select.value = ''; w._select._prev = '';
                if (pVal && el.code) {
                    const params = {}; params[paramKey] = pVal;
                    w._loadCode(el.code, params);
                }
            }
            // codePopup
            else if (w instanceof _WCodePopup) {
                w.clear();
                w._popupParams = {};
                if (pVal) w._popupParams[paramKey] = pVal;
            }
            // 그 외 (autocomplete 등)
            else {
                w.clear();
            }

            this._fireChange(childField, '', '');

            // 이 자식의 자식들도 큐에 추가 (연쇄 초기화)
            const grandchildren = this._depGraph[childField];
            if (grandchildren) {
                for (const gc of grandchildren) {
                    if (!visited.has(gc)) queue.push(gc);
                }
            }
        }
        this._cascading = false;
    }

    // ── 이벤트 헬퍼 ──
    _fireChange(field, val, old) {
        const el = this._elemMap[field];
        if (el && el.onChange) el.onChange(val, old);
        if (this._onChange) this._onChange(field, val, old);
        // dependsOn 자동 연쇄 — cascading 중이면 BFS가 이미 처리하므로 스킵
        if (!this._cascading) this._cascadeDependents(field, val);
    }

    _closeAllDropdowns() {
        for (const k in this._widgets) {
            const w = this._widgets[k];
            if (w.closeDropdown) w.closeDropdown();
        }
        if (_FormaCalendar._active) _FormaCalendar._active.hide();
    }

    // ══════════════════════════════════════════════════════════
    //  Public API (100% 호환)
    // ══════════════════════════════════════════════════════════

    getData() {
        const result = {};
        for (const el of this.elements) {
            const type = el.widget || 'text';
            if (type === 'divider') continue;
            const w = this._widgets[el.field]; if (!w) continue;

            if (type === 'dateRange') {
                const v = w.getValue();
                result[el.field + '_from'] = v.from;
                result[el.field + '_to'] = v.to;
            } else if (type === 'address') {
                const v = w.getValue();
                result[el.field + '_zip'] = v.zipcode;
                result[el.field + '_addr'] = v.address;
                result[el.field + '_detail'] = v.detail;
            } else {
                result[el.field] = w.getValue();
            }
        }
        return result;
    }

    setData(obj) {
        for (const el of this.elements) {
            const type = el.widget || 'text';
            if (type === 'divider') continue;
            const w = this._widgets[el.field]; if (!w) continue;
            w.setValueFromData(obj);
        }
        this._originalData = JSON.parse(JSON.stringify(this.getData()));
    }

    getField(field) {
        const el = this._elemMap[field]; if (!el) return null;
        const type = el.widget || 'text';
        if (type === 'divider') return null;
        const w = this._widgets[field]; if (!w) return null;

        if (type === 'dateRange') {
            return w.getValue(); // { from, to }
        }
        return w.getValue();
    }

    setField(field, value) {
        const el = this._elemMap[field]; if (!el) return;
        const w = this._widgets[field]; if (!w) return;
        w.setValue(value);
    }

    clear() {
        for (const el of this.elements) {
            const type = el.widget || 'text';
            if (type === 'divider' || type === 'display') continue;
            const w = this._widgets[el.field]; if (!w) continue;
            w.clear();
        }
        this._clearErrors();
    }

    formReadonly(readonly) {
        for (const el of this.elements) {
            const type = el.widget || 'text';
            if (type === 'divider' || type === 'display') continue;
            const w = this._widgets[el.field]; if (!w) continue;
            w.setReadonly(readonly);
        }
    }

    validate() {
        this._clearErrors();
        for (const el of this.elements) {
            if (!el.required) continue;
            const type = el.widget || 'text';
            if (type === 'hidden' || type === 'divider' || type === 'display') continue;
            const w = this._widgets[el.field]; if (!w) continue;

            // switch and checkbox always valid
            if (type === 'switch' || type === 'checkbox') continue;

            if (!w.validate()) {
                const msg = (el.label || el.field) + (type === 'radio' || type === 'multiCombo' || type === 'combo' ? '을(를) 선택하세요.' : '을(를) 입력하세요.');
                this._showError(el.field, msg);
                w.focus();
                return false;
            }
        }
        return true;
    }

    showField(field) { const g = this._groups[field]; if (g) g.style.display = ''; }
    hideField(field) { const g = this._groups[field]; if (g) g.style.display = 'none'; }

    setOptions(field, options) {
        const w = this._widgets[field]; if (w) w.setOptions(options);
    }

    /**
     * combo/select의 옵션을 서버 코드그룹에서 다시 로드 + 값 초기화.
     * 부모-자식 연계 시 onChange에서 호출.
     * @param {string} field - 대상 필드명
     * @param {string} code - 코드그룹 (없으면 el.code 사용)
     * @param {object} params - 서버 전달 파라미터 (예: { parent_cd: 'GRP_A' })
     */
    reloadCode(field, code, params) {
        const w = this._widgets[field]; if (!w) return;
        const el = this._elemMap[field];
        const codeGroup = code || (el && el.code) || '';

        if (w instanceof _WCombo) {
            const st = w._state; if (!st) return;
            st.options = [st.options[0]];
            st.value = ''; st.label = st.options[0].label;
            st.displayText.textContent = st.label; st.hidden.value = '';
            if (codeGroup && params) w._loadCode(codeGroup, params);
            else if (codeGroup) w._loadCode(codeGroup);
        } else if (w instanceof _WSelect) {
            while (w._select.options.length > 1) w._select.remove(1);
            w._select.value = ''; w._select._prev = '';
            if (codeGroup && params) w._loadCode(codeGroup, params);
            else if (codeGroup) w._loadCode(codeGroup);
        }
    }

    /**
     * codePopup 팝업에 전달할 추가 파라미터 설정.
     * 부모-자식 연계 시 부모 값을 팝업 검색 조건으로 전달.
     * @param {string} field - codePopup 필드명
     * @param {object} params - 팝업에 전달할 파라미터
     */
    setPopupParams(field, params) {
        const w = this._widgets[field]; if (!w) return;
        if (w._popupParams !== undefined) w._popupParams = params || {};
    }

    /**
     * 필드 값 초기화. clear()는 전체, clearField()는 개별.
     * @param {string} field - 대상 필드명
     */
    clearField(field) {
        const w = this._widgets[field]; if (w) w.clear();
    }

    setRequired(field, required) {
        const el = this._elemMap[field]; if (el) el.required = required;
        const g = this._groups[field]; if (g) { const l = g.querySelector('label'); if (l) { if (required) l.classList.add('required'); else l.classList.remove('required'); } }
    }

    setReadonly(field, readonly) {
        const w = this._widgets[field]; if (w) w.setReadonly(readonly);
    }

    setDisabled(field, disabled) {
        const w = this._widgets[field]; if (w) w.setDisabled(disabled);
    }

    setLabel(field, label) { const g = this._groups[field]; if (g) { const l = g.querySelector('label'); if (l) l.textContent = label; } }

    focus(field) {
        const w = this._widgets[field]; if (w) { w.focus(); return; }
        // fallback for legacy inputs reference
        const input = this.inputs[field]; if (input?.focus) input.focus();
    }

    isDirty() { if (!this._originalData) return false; return JSON.stringify(this.getData()) !== JSON.stringify(this._originalData); }
    getChangedFields() { if (!this._originalData) return []; const cur = this.getData(), ch = []; for (const k in cur) { if (JSON.stringify(cur[k]) !== JSON.stringify(this._originalData[k])) ch.push(k); } return ch; }
    resetToOriginal() { if (this._originalData) this.setData(this._originalData); }

    destroy() {
        for (const k in this._widgets) this._widgets[k].destroy();
        this._widgets = {};
        this.inputs = {};
        this._groups = {};
    }

    _showError(field, msg) { const g = this._groups[field]; if (g) g.classList.add('forma-form-error'); if (typeof FormaPopup !== 'undefined') FormaPopup.alert.show(msg); }
    _clearErrors() { if (!this.container) return; this.container.querySelectorAll('.forma-form-error').forEach(el => el.classList.remove('forma-form-error')); }
}

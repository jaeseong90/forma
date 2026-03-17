/**
 * FormaForm - 검색폼/입력폼 빌더
 * search 모드: 가로 배치
 * form 모드: 2컬럼 그리드 배치
 * 위젯: text, number, combo, date, dateRange, codePopup, textarea, checkbox
 */
class FormaForm {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        this.elements = options.elements || [];
        this.isSearch = options.search || false;
        this.inputs = {};
        this._dateRangeInputs = {}; // field -> {from, to}
        this._codePopupInputs = {}; // field -> {code, name}
        this._build();
    }

    _build() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.classList.add(this.isSearch ? 'forma-search' : 'forma-form');

        const row = document.createElement('div');
        row.className = this.isSearch ? 'forma-search-row' : 'forma-form-grid';

        for (const el of this.elements) {
            const group = document.createElement('div');
            group.className = this.isSearch ? 'forma-search-group' : 'forma-form-row';

            const label = document.createElement('label');
            label.textContent = el.label || el.field;
            if (el.required) label.classList.add('required');
            group.appendChild(label);

            if (el.widget === 'dateRange') {
                this._buildDateRange(group, el);
            } else if (el.widget === 'codePopup') {
                this._buildCodePopup(group, el);
            } else if (el.widget === 'combo') {
                this._buildCombo(group, el);
            } else if (el.widget === 'textarea') {
                this._buildTextarea(group, el);
            } else if (el.widget === 'checkbox') {
                this._buildCheckbox(group, el);
            } else if (el.widget === 'date') {
                this._buildDate(group, el);
            } else {
                this._buildText(group, el);
            }

            row.appendChild(group);
        }
        this.container.appendChild(row);
    }

    _buildText(group, el) {
        const input = document.createElement('input');
        input.type = el.type === 'number' ? 'number' : 'text';
        input.className = 'forma-input';
        if (el.placeholder) input.placeholder = el.placeholder;
        if (el.readOnly) input.readOnly = true;
        group.appendChild(input);
        this.inputs[el.field] = input;
    }

    _buildCombo(group, el) {
        const input = document.createElement('select');
        input.className = 'forma-input';
        input.innerHTML = '<option value="">' + (this.isSearch ? '전체' : '선택') + '</option>';
        if (el.options) {
            el.options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                input.appendChild(o);
            });
        }
        if (el.readOnly) input.disabled = true;
        group.appendChild(input);
        this.inputs[el.field] = input;
    }

    _buildTextarea(group, el) {
        const input = document.createElement('textarea');
        input.className = 'forma-input';
        input.rows = 3;
        if (el.readOnly) input.readOnly = true;
        group.appendChild(input);
        this.inputs[el.field] = input;
    }

    _buildCheckbox(group, el) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        group.appendChild(input);
        this.inputs[el.field] = input;
    }

    _buildDate(group, el) {
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'forma-input';
        if (el.readOnly) input.readOnly = true;
        group.appendChild(input);
        this.inputs[el.field] = input;
    }

    // ── dateRange (B-1) ──

    _buildDateRange(group, el) {
        const wrap = document.createElement('span');
        wrap.className = 'forma-daterange';

        const fromInput = document.createElement('input');
        fromInput.type = 'date';
        fromInput.className = 'forma-input';
        wrap.appendChild(fromInput);

        const sep = document.createElement('span');
        sep.textContent = ' ~ ';
        sep.style.margin = '0 4px';
        wrap.appendChild(sep);

        const toInput = document.createElement('input');
        toInput.type = 'date';
        toInput.className = 'forma-input';
        wrap.appendChild(toInput);

        group.appendChild(wrap);

        this._dateRangeInputs[el.field] = { from: fromInput, to: toInput };

        // 기본값 설정
        if (el.default === 'THIS_MONTH') {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
            fromInput.value = y + '-' + m + '-01';
            toInput.value = y + '-' + m + '-' + String(lastDay).padStart(2, '0');
        } else if (el.default === 'TODAY') {
            const today = new Date().toISOString().substring(0, 10);
            fromInput.value = today;
            toInput.value = today;
        } else if (el.default === 'THIS_YEAR') {
            const y = new Date().getFullYear();
            fromInput.value = y + '-01-01';
            toInput.value = y + '-12-31';
        }
    }

    // ── codePopup (B-2) ──

    _buildCodePopup(group, el) {
        const wrap = document.createElement('span');
        wrap.className = 'forma-codepopup';

        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.className = 'forma-input';
        codeInput.style.width = '100px';
        if (el.placeholder) codeInput.placeholder = el.placeholder;
        if (el.readOnly) codeInput.readOnly = true;
        wrap.appendChild(codeInput);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'forma-codepopup-name';
        wrap.appendChild(nameSpan);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'forma-btn forma-btn-sm';
        btn.textContent = '🔍';
        btn.style.marginLeft = '2px';
        if (!el.readOnly && el.popup) {
            btn.onclick = () => {
                const modal = new FormaModal({
                    title: el.label || '검색',
                    url: el.popup.url,
                    width: el.popup.width || 800,
                    height: el.popup.height || 600,
                    okCallback: (result) => {
                        if (result) {
                            codeInput.value = result[el.popup.codeField] || '';
                            nameSpan.textContent = result[el.popup.nameField] || '';
                        }
                    }
                });
                modal.show({ currentValue: codeInput.value });
            };
        }
        wrap.appendChild(btn);

        group.appendChild(wrap);

        this.inputs[el.field] = codeInput;
        this._codePopupInputs[el.field] = { code: codeInput, name: nameSpan, popup: el.popup };
    }

    // ── API ──

    getData() {
        const result = {};
        for (const el of this.elements) {
            if (el.widget === 'dateRange') {
                const dr = this._dateRangeInputs[el.field];
                if (dr) {
                    result[el.field + '_from'] = dr.from.value || null;
                    result[el.field + '_to'] = dr.to.value || null;
                }
            } else {
                const input = this.inputs[el.field];
                if (!input) continue;
                if (input.type === 'checkbox') result[el.field] = input.checked;
                else if (input.type === 'number') result[el.field] = input.value ? Number(input.value) : null;
                else result[el.field] = input.value || null;
            }
        }
        return result;
    }

    setData(obj) {
        for (const el of this.elements) {
            if (el.widget === 'dateRange') {
                const dr = this._dateRangeInputs[el.field];
                if (dr) {
                    if (obj[el.field + '_from'] !== undefined) dr.from.value = obj[el.field + '_from'] ?? '';
                    if (obj[el.field + '_to'] !== undefined) dr.to.value = obj[el.field + '_to'] ?? '';
                }
            } else if (el.widget === 'codePopup') {
                const cp = this._codePopupInputs[el.field];
                if (cp && obj[el.field] !== undefined) cp.code.value = obj[el.field] ?? '';
                if (cp && el.popup && obj[el.popup.nameField] !== undefined) {
                    cp.name.textContent = obj[el.popup.nameField] ?? '';
                }
            } else {
                const input = this.inputs[el.field];
                if (!input || obj[el.field] === undefined) continue;
                if (input.type === 'checkbox') input.checked = !!obj[el.field];
                else input.value = obj[el.field] ?? '';
            }
        }
    }

    clear() {
        for (const el of this.elements) {
            if (el.widget === 'dateRange') {
                const dr = this._dateRangeInputs[el.field];
                if (dr) { dr.from.value = ''; dr.to.value = ''; }
            } else if (el.widget === 'codePopup') {
                const cp = this._codePopupInputs[el.field];
                if (cp) { cp.code.value = ''; cp.name.textContent = ''; }
            } else {
                const input = this.inputs[el.field];
                if (!input) continue;
                if (input.type === 'checkbox') input.checked = false;
                else input.value = '';
            }
        }
    }

    // ── formReadonly (B-3) ──

    formReadonly(readonly) {
        for (const el of this.elements) {
            if (el.widget === 'dateRange') {
                const dr = this._dateRangeInputs[el.field];
                if (dr) { dr.from.readOnly = readonly; dr.to.readOnly = readonly; }
            } else if (el.widget === 'codePopup') {
                const cp = this._codePopupInputs[el.field];
                if (cp) cp.code.readOnly = readonly;
            } else {
                const input = this.inputs[el.field];
                if (!input) continue;
                if (input.tagName === 'SELECT') input.disabled = readonly;
                else if (input.type === 'checkbox') input.disabled = readonly;
                else input.readOnly = readonly;
            }
        }
    }
}

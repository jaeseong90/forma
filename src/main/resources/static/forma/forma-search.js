/**
 * FormaSearch - 검색바
 * text, combo, dateRange, codePopup 위젯. 접기/펼치기, 초기화 지원.
 */
class FormaSearch {
    constructor(selector, fields, onSearch) {
        this.container = document.querySelector(selector);
        this.fields = fields;
        this.onSearch = onSearch;
        this.inputs = {};
        this.displayInputs = {};
        this._collapsed = fields.length > 4;
        this._visibleCount = 3;
        this._build();
    }

    _build() {
        this.container.innerHTML = '';
        this.container.classList.add('forma-search');

        const row = document.createElement('div');
        row.className = 'forma-search-row';

        this.fields.forEach((f, idx) => {
            const group = document.createElement('div');
            group.className = 'forma-search-group';
            if (this._collapsed && idx >= this._visibleCount) {
                group.classList.add('forma-search-hidden');
            }

            const label = document.createElement('label');
            label.textContent = f.label || f.field;
            group.appendChild(label);

            if (f.widget === 'dateRange') {
                const from = document.createElement('input');
                from.type = 'date';
                from.className = 'forma-input';
                const to = document.createElement('input');
                to.type = 'date';
                to.className = 'forma-input';

                if (f.default === 'THIS_MONTH') {
                    const now = new Date();
                    from.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0,10);
                    to.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().substring(0,10);
                } else if (f.default === 'TODAY') {
                    const today = new Date().toISOString().substring(0,10);
                    from.value = today;
                    to.value = today;
                } else if (f.default === 'THIS_YEAR') {
                    const now = new Date();
                    from.value = new Date(now.getFullYear(), 0, 1).toISOString().substring(0,10);
                    to.value = new Date(now.getFullYear(), 11, 31).toISOString().substring(0,10);
                }

                const span = document.createElement('span');
                span.textContent = '~';
                span.style.margin = '0 4px';
                group.appendChild(from);
                group.appendChild(span);
                group.appendChild(to);
                this.inputs[f.field + '_from'] = from;
                this.inputs[f.field + '_to'] = to;
            } else if (f.widget === 'combo') {
                const select = document.createElement('select');
                select.className = 'forma-input';
                select.innerHTML = '<option value="">전체</option>';
                if (f.code) {
                    getCodeItems(f.code).then(items => {
                        items.forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item.value;
                            opt.textContent = item.label;
                            select.appendChild(opt);
                        });
                        if (f.default) select.value = f.default;
                    });
                }
                group.appendChild(select);
                this.inputs[f.field] = select;
            } else if (f.widget === 'codePopup') {
                const wrap = document.createElement('div');
                wrap.className = 'forma-codepopup';
                const codeInput = document.createElement('input');
                codeInput.type = 'text';
                codeInput.className = 'forma-input forma-codepopup-code';
                codeInput.placeholder = f.label || f.field;
                const displaySpan = document.createElement('span');
                displaySpan.className = 'forma-codepopup-display';
                const popupBtn = document.createElement('button');
                popupBtn.type = 'button';
                popupBtn.className = 'forma-btn forma-btn-sm forma-codepopup-btn';
                popupBtn.textContent = '🔍';
                popupBtn.onclick = () => {
                    FormaPopup.open({
                        title: f.label || f.field,
                        url: f.popupUrl || `/api/${f.popupEntity || f.field}`,
                        columns: f.popupColumns || [
                            { field: f.field, label: '코드', width: 100 },
                            { field: f.displayField || f.field + '_nm', label: '명칭', width: 200 }
                        ],
                        onSelect: (row) => {
                            codeInput.value = row[f.field] || '';
                            displaySpan.textContent = row[f.displayField || f.field + '_nm'] || '';
                        }
                    });
                };
                codeInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.onSearch?.();
                    } else if (e.key === 'Tab' && codeInput.value && f.popupUrl) {
                        FormaApi.get(f.popupUrl || `/api/${f.popupEntity || f.field}`, { [f.field]: codeInput.value, _size: '2' })
                            .then(data => {
                                const rows = data.data || data;
                                if (rows.length === 1) {
                                    displaySpan.textContent = rows[0][f.displayField || f.field + '_nm'] || '';
                                }
                            }).catch(() => {});
                    }
                };
                wrap.appendChild(codeInput);
                wrap.appendChild(displaySpan);
                wrap.appendChild(popupBtn);
                group.appendChild(wrap);
                this.inputs[f.field] = codeInput;
                this.displayInputs[f.field] = displaySpan;
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'forma-input';
                input.placeholder = f.label || f.field;
                input.onkeydown = (e) => { if (e.key === 'Enter') this.onSearch?.(); };
                group.appendChild(input);
                this.inputs[f.field] = input;
            }

            row.appendChild(group);
        });

        const btnGroup = document.createElement('div');
        btnGroup.className = 'forma-search-group';

        const searchBtn = document.createElement('button');
        searchBtn.textContent = '조회';
        searchBtn.className = 'forma-btn forma-btn-primary';
        searchBtn.onclick = () => this.onSearch?.();
        btnGroup.appendChild(searchBtn);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '초기화';
        resetBtn.className = 'forma-btn';
        resetBtn.onclick = () => this.reset();
        btnGroup.appendChild(resetBtn);

        if (this.fields.length > this._visibleCount) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'forma-btn forma-btn-sm';
            toggleBtn.textContent = this._collapsed ? '상세 ▼' : '접기 ▲';
            toggleBtn.onclick = () => {
                this._collapsed = !this._collapsed;
                toggleBtn.textContent = this._collapsed ? '상세 ▼' : '접기 ▲';
                row.querySelectorAll('.forma-search-group').forEach((g, gi) => {
                    if (gi >= this._visibleCount && gi < this.fields.length) {
                        g.classList.toggle('forma-search-hidden', this._collapsed);
                    }
                });
            };
            btnGroup.appendChild(toggleBtn);
        }

        row.appendChild(btnGroup);
        this.container.appendChild(row);
    }

    getValues() {
        const result = {};
        for (const [key, el] of Object.entries(this.inputs)) {
            const val = el.value;
            if (val) result[key] = val;
        }
        return result;
    }

    reset() {
        for (const el of Object.values(this.inputs)) el.value = '';
        for (const el of Object.values(this.displayInputs)) el.textContent = '';
    }
}

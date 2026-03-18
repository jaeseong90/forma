/**
 * FormaGrid - ERP 수준 데이터 그리드
 * gstat, 체크박스, 인라인 편집, 정렬, footer, 멀티헤더,
 * select/check 에디터, 행번호, 셀CSS, 검증, frozen, 컬럼리사이즈, CSV
 */
class FormaGrid {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        this.columns = options.columns || [];
        this.editable = options.editable || false;
        this.checkable = options.checkable || false;
        this.sortable = options.sortable || false;
        this.rowNum = options.rowNum || false;
        this.paging = options.paging || false;
        this.onRowClick = options.onRowClick || null;
        this.onRowDblClick = options.onRowDblClick || null;
        this.onCellChange = options.onCellChange || null;
        this.onPageChange = options.onPageChange || null;
        this.rows = [];
        this.selectedIdx = -1;
        this._cellCss = {};
        this._rowCss = {};
        this._sortCol = null;
        this._sortDir = null;
        this._currentPage = 1;
        this._totalCount = 0;
        this._pageSize = options.pageSize || 50;
        this._hasMultiHeader = this.columns.some(c => Array.isArray(c.label));
        this._hasFooter = this.columns.some(c => c.footer);
        this._hasFrozen = this.columns.some(c => c.frozen);
        this._codeCache = {};
        this._build();
    }

    // ── Build ──

    _build() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.classList.add('forma-grid-wrap');

        if (this.editable) {
            const bar = document.createElement('div');
            bar.className = 'forma-grid-toolbar';
            const addBtn = document.createElement('button');
            addBtn.textContent = '+ 행추가';
            addBtn.className = 'forma-btn forma-btn-sm';
            addBtn.onclick = () => this.addRow();
            bar.appendChild(addBtn);
            const delBtn = document.createElement('button');
            delBtn.textContent = '- 행삭제';
            delBtn.className = 'forma-btn forma-btn-sm';
            delBtn.onclick = () => this.deleteRow();
            bar.appendChild(delBtn);
            this.container.appendChild(bar);
        }

        const wrap = document.createElement('div');
        wrap.className = 'forma-grid-scroll';
        this.table = document.createElement('table');
        this.table.className = 'forma-grid';

        this._buildHeader();

        this.tbody = document.createElement('tbody');
        this.table.appendChild(this.tbody);

        if (this._hasFooter) {
            this.tfoot = document.createElement('tfoot');
            this.table.appendChild(this.tfoot);
        }

        wrap.appendChild(this.table);
        this.container.appendChild(wrap);
        this._renderEmpty();
    }

    _buildHeader() {
        const thead = document.createElement('thead');
        if (this._hasMultiHeader) {
            this._buildMultiHeader(thead);
        } else {
            this._buildSingleHeader(thead);
        }
        this.table.appendChild(thead);
    }

    _buildSingleHeader(thead) {
        const tr = document.createElement('tr');
        this._appendLeadingTh(tr, 1);

        for (let ci = 0; ci < this.columns.length; ci++) {
            const col = this.columns[ci];
            const th = document.createElement('th');
            th.textContent = col.label || col.field;
            if (col.width) th.style.width = col.width + 'px';
            th.style.position = 'relative';
            if (this.sortable) this._attachSort(th, col);
            this._attachResize(th, col, ci);
            this._applyFrozenTh(th, ci);
            tr.appendChild(th);
        }
        thead.appendChild(tr);
    }

    _buildMultiHeader(thead) {
        const tr1 = document.createElement('tr');
        this._appendLeadingTh(tr1, 2);

        let skipCount = 0;
        for (let i = 0; i < this.columns.length; i++) {
            if (skipCount > 0) { skipCount--; continue; }
            const col = this.columns[i];
            const labels = Array.isArray(col.label) ? col.label : [{ text: col.label || col.field }];
            const top = labels[0];
            if (top === null || top === undefined) continue;

            const th = document.createElement('th');
            th.textContent = top.text || '';
            th.style.textAlign = 'center';
            if (top.colspan && top.colspan > 1) {
                th.colSpan = top.colspan;
                skipCount = top.colspan - 1;
            } else if (!labels[1]) {
                th.rowSpan = 2;
                if (col.width) th.style.width = col.width + 'px';
                this._applyFrozenTh(th, i);
            }
            tr1.appendChild(th);
        }
        thead.appendChild(tr1);

        const tr2 = document.createElement('tr');
        for (let i = 0; i < this.columns.length; i++) {
            const col = this.columns[i];
            const labels = Array.isArray(col.label) ? col.label : null;
            if (!labels || !labels[1]) continue;

            const bottom = labels[1];
            const th = document.createElement('th');
            th.textContent = bottom.text || '';
            if (col.width) th.style.width = col.width + 'px';
            th.style.position = 'relative';
            if (this.sortable) this._attachSort(th, col);
            this._attachResize(th, col, i);
            this._applyFrozenTh(th, i);
            tr2.appendChild(th);
        }
        thead.appendChild(tr2);
    }

    _appendLeadingTh(tr, rowspan) {
        if (this.checkable) {
            const th = document.createElement('th');
            th.style.width = '36px';
            th.style.textAlign = 'center';
            if (rowspan > 1) th.rowSpan = rowspan;
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.onchange = () => this._toggleAllCheck(cb.checked);
            this._headerCb = cb;
            th.appendChild(cb);
            if (this._hasFrozen) this._applySticky(th, 0);
            tr.appendChild(th);
        }
        if (this.rowNum) {
            const th = document.createElement('th');
            th.style.width = '45px';
            th.style.textAlign = 'center';
            th.textContent = 'No';
            if (rowspan > 1) th.rowSpan = rowspan;
            if (this._hasFrozen) {
                const left = this.checkable ? 36 : 0;
                this._applySticky(th, left);
            }
            tr.appendChild(th);
        }
    }

    // ── Frozen (A-1) ──

    _calcFrozenLeft(colIdx) {
        let left = 0;
        if (this.checkable) left += 36;
        if (this.rowNum) left += 45;
        for (let i = 0; i < colIdx; i++) {
            if (this.columns[i].frozen) left += (this.columns[i].width || 100);
        }
        return left;
    }

    _applyFrozenTh(th, colIdx) {
        if (!this._hasFrozen || !this.columns[colIdx].frozen) return;
        const left = this._calcFrozenLeft(colIdx);
        this._applySticky(th, left);
    }

    _applyFrozenTd(td, colIdx) {
        if (!this._hasFrozen || !this.columns[colIdx].frozen) return;
        const left = this._calcFrozenLeft(colIdx);
        this._applySticky(td, left);
        td.style.background = td.style.background || '#fff';
    }

    _applySticky(el, left) {
        el.style.position = 'sticky';
        el.style.left = left + 'px';
        el.style.zIndex = '2';
        if (!el.style.background || el.style.background === 'transparent') {
            el.style.background = '#f8f8f8';
        }
    }

    // ── 컬럼 리사이즈 (A-2) ──

    _attachResize(th, col, colIdx) {
        const handle = document.createElement('div');
        handle.className = 'forma-col-resize';
        handle.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const startX = e.clientX;
            const startW = th.offsetWidth;
            const onMove = (me) => {
                const newW = Math.max(50, startW + me.clientX - startX);
                th.style.width = newW + 'px';
                col.width = newW;
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };
        th.appendChild(handle);
    }

    // ── 정렬 ──

    _attachSort(th, col) {
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        const arrow = document.createElement('span');
        arrow.className = 'forma-sort-icon';
        th.appendChild(arrow);
        col._sortIcon = arrow;

        th.onclick = (e) => {
            if (e.target.classList.contains('forma-col-resize')) return;
            if (this._sortCol === col.field) {
                if (this._sortDir === 'asc') this._sortDir = 'desc';
                else { this._sortDir = null; this._sortCol = null; }
            } else {
                this._sortCol = col.field;
                this._sortDir = 'asc';
            }
            this._updateSortIcons();
            this._applySort();
            this._render();
        };
    }

    _updateSortIcons() {
        for (const col of this.columns) {
            if (!col._sortIcon) continue;
            col._sortIcon.textContent = col.field === this._sortCol
                ? (this._sortDir === 'asc' ? ' ▲' : ' ▼') : '';
        }
    }

    _applySort() {
        if (!this._sortCol || !this._sortDir) return;
        const col = this.columns.find(c => c.field === this._sortCol);
        const isNum = col && (col.type === 'number' || col.format === 'currency');
        const dir = this._sortDir === 'asc' ? 1 : -1;
        const field = this._sortCol;
        this.rows.sort((a, b) => {
            let va = a[field], vb = b[field];
            if (va == null) va = '';
            if (vb == null) vb = '';
            if (isNum) return (Number(va) - Number(vb)) * dir;
            return String(va).localeCompare(String(vb), 'ko') * dir;
        });
    }

    // ── Data API ──

    setData(data, totalCount) {
        this.rows = (data || []).map(r => ({ ...r }));
        this._totalCount = (totalCount !== undefined) ? totalCount : this.rows.length;
        this.selectedIdx = -1;
        this._cellCss = {};
        this._rowCss = {};
        if (this._sortCol && this._sortDir) this._applySort();
        this._render();
        if (this.paging) this._renderPaging();
    }

    getData() { return this.rows; }
    getCheckedData() { return this.rows.filter(r => r._checked); }
    getModifiedData() { return this.rows.filter(r => r.gstat === 'I' || r.gstat === 'U'); }

    clearData() {
        this.rows = [];
        this.selectedIdx = -1;
        this._cellCss = {};
        this._rowCss = {};
        this._totalCount = 0;
        this._currentPage = 1;
        this._render();
        if (this.paging) this._renderPaging();
    }

    addRow(defaultData = {}) {
        const row = { ...defaultData, gstat: 'I', _checked: false };
        this.rows.push(row);
        this._render();
    }

    deleteRow() {
        const checked = this.rows.filter(r => r._checked);
        if (checked.length === 0 && this.selectedIdx >= 0) {
            this.rows.splice(this.selectedIdx, 1);
        } else {
            this.rows = this.rows.filter(r => !r._checked);
        }
        this.selectedIdx = -1;
        this._render();
    }

    getItem(idx) { return this.rows[idx]; }
    getSelectedItem() { return this.selectedIdx >= 0 ? this.rows[this.selectedIdx] : null; }
    getSelectedIndex() { return this.selectedIdx; }

    updateItem(idx, data) {
        if (this.rows[idx]) {
            Object.assign(this.rows[idx], data);
            if (this.rows[idx].gstat !== 'I') this.rows[idx].gstat = 'U';
            this._renderRow(idx);
            this._renderFooter();
        }
    }

    clearSelect() {
        this.selectedIdx = -1;
        this.tbody.querySelectorAll('tr.selected').forEach(tr => tr.classList.remove('selected'));
    }

    eachRow(callback) { this.rows.forEach((row, idx) => callback(row, idx)); }

    // ── 검증 ──

    checkGridValidation() {
        this.tbody.querySelectorAll('.forma-cell-error').forEach(el => el.classList.remove('forma-cell-error'));
        const requiredCols = this.columns.filter(c => c.required);
        if (requiredCols.length === 0) return true;

        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            if (this.checkable && !row._checked) continue;
            for (const col of requiredCols) {
                const val = row[col.field];
                if (val === null || val === undefined || val === '') {
                    this.addCellCss(i, col.field, 'forma-cell-error');
                    FormaPopup.alert.show((i + 1) + '행 [' + (col.label || col.field) + '] 값을 입력하세요.');
                    return false;
                }
            }
        }
        return true;
    }

    // ── 셀/행 CSS ──

    addCellCss(rowIdx, colField, css) {
        const key = rowIdx + ':' + colField;
        if (!this._cellCss[key]) this._cellCss[key] = new Set();
        css.split(' ').forEach(c => { if (c) this._cellCss[key].add(c); });
        const td = this._getTd(rowIdx, colField);
        if (td) css.split(' ').forEach(c => { if (c) td.classList.add(c); });
    }

    removeCellCss(rowIdx, colField, css) {
        const key = rowIdx + ':' + colField;
        if (this._cellCss[key]) css.split(' ').forEach(c => this._cellCss[key].delete(c));
        const td = this._getTd(rowIdx, colField);
        if (td) css.split(' ').forEach(c => { if (c) td.classList.remove(c); });
    }

    addCss(rowIdx, css) {
        if (!this._rowCss[rowIdx]) this._rowCss[rowIdx] = new Set();
        css.split(' ').forEach(c => { if (c) this._rowCss[rowIdx].add(c); });
        const tr = this.tbody.children[rowIdx];
        if (tr) css.split(' ').forEach(c => { if (c) tr.classList.add(c); });
    }

    removeCss(rowIdx, css) {
        if (this._rowCss[rowIdx]) css.split(' ').forEach(c => this._rowCss[rowIdx].delete(c));
        const tr = this.tbody.children[rowIdx];
        if (tr) css.split(' ').forEach(c => { if (c) tr.classList.remove(c); });
    }

    _getTd(rowIdx, colField) {
        const tr = this.tbody.children[rowIdx];
        if (!tr) return null;
        const colIdx = this.columns.findIndex(c => c.field === colField);
        if (colIdx < 0) return null;
        let offset = 0;
        if (this.checkable) offset++;
        if (this.rowNum) offset++;
        return tr.children[colIdx + offset] || null;
    }

    // ── CSV 내보내기 (A-3) ──

    exportCsv(filename) {
        const BOM = '\uFEFF';
        // 헤더 — label이 배열이면 마지막 요소의 text 사용
        const headers = this.columns.map(c => {
            if (Array.isArray(c.label)) {
                const last = c.label[c.label.length - 1];
                return last ? (last.text || c.field) : c.field;
            }
            return c.label || c.field;
        });

        const csvRows = this.rows.map(row => {
            return this.columns.map(col => {
                let val = row[col.field] ?? '';
                if (col.format === 'currency' && val !== '') val = Number(val).toLocaleString('ko-KR');
                if (col.editor === 'select' && col.options) {
                    const opt = col.options.find(o => String(o.value) === String(val));
                    if (opt) val = opt.label;
                }
                if (col.editor === 'check') val = (val === 'Y' || val === true) ? 'Y' : 'N';
                return '"' + String(val).replace(/"/g, '""') + '"';
            }).join(',');
        });

        const csv = BOM + headers.join(',') + '\n' + csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename || 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        if (typeof FormaPopup !== 'undefined') FormaPopup.toast.success('CSV 다운로드 완료');
    }

    // ── Render ──

    _render() {
        this.tbody.innerHTML = '';
        if (this.rows.length === 0) { this._renderEmpty(); this._renderFooter(); return; }
        for (let i = 0; i < this.rows.length; i++) {
            this._appendRow(i);
        }
        this._applySavedCss();
        this._renderFooter();
    }

    _appendRow(i) {
        const row = this.rows[i];
        const tr = document.createElement('tr');
        tr.onclick = () => { this._selectRow(i); if (this.onRowClick) this.onRowClick(row, i); };
        tr.ondblclick = () => { if (this.onRowDblClick) this.onRowDblClick(row, i); };
        if (i === this.selectedIdx) tr.classList.add('selected');
        if (row.gstat === 'I' || row.gstat === 'U') tr.classList.add('forma-row-modified');

        if (this.checkable) {
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            if (this._hasFrozen) { this._applySticky(td, 0); td.style.background = '#fff'; }
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!row._checked;
            cb.onclick = (e) => e.stopPropagation();
            cb.onchange = () => { row._checked = cb.checked; };
            td.appendChild(cb);
            tr.appendChild(td);
        }

        if (this.rowNum) {
            const td = document.createElement('td');
            td.style.textAlign = 'center';
            td.textContent = i + 1;
            if (this._hasFrozen) {
                const left = this.checkable ? 36 : 0;
                this._applySticky(td, left);
                td.style.background = '#fff';
            }
            tr.appendChild(td);
        }

        for (let ci = 0; ci < this.columns.length; ci++) {
            const col = this.columns[ci];
            const td = document.createElement('td');
            if (col.align) td.style.textAlign = col.align;
            if (col.format === 'currency' || col.type === 'number') td.style.textAlign = 'right';

            this._applyFrozenTd(td, ci);

            if (col.editor === 'check') {
                this._renderCheckEditor(td, row, col, i);
            } else {
                if (this.editable && !col.readOnly) {
                    td.ondblclick = (e) => {
                        e.stopPropagation();
                        this._startEdit(i, col, td, row);
                    };
                }
                this._renderCell(td, row, col);
            }
            tr.appendChild(td);
        }
        this.tbody.appendChild(tr);
    }

    _renderCell(td, row, col) {
        let val = row[col.field];
        if (col.editor === 'select') {
            const opts = col.options || this._codeCache[col.code] || [];
            const opt = opts.find(o => String(o.value) === String(val));
            td.textContent = opt ? opt.label : (val ?? '');
            return;
        }
        if (col.format === 'currency' && val != null && val !== '') {
            td.textContent = Number(val).toLocaleString('ko-KR');
        } else if (col.format === 'date' && val) {
            td.textContent = String(val).substring(0, 10);
        } else {
            td.textContent = val ?? '';
        }
    }

    _renderRow(idx) {
        const tr = this.tbody.children[idx];
        if (!tr) return;
        const row = this.rows[idx];
        let ci = 0;
        if (this.checkable) ci++;
        if (this.rowNum) ci++;
        for (const col of this.columns) {
            const td = tr.children[ci];
            if (col.editor !== 'check') this._renderCell(td, row, col);
            ci++;
        }
        if (row.gstat === 'I' || row.gstat === 'U') tr.classList.add('forma-row-modified');
    }

    _applySavedCss() {
        for (const [idx, classes] of Object.entries(this._rowCss)) {
            const tr = this.tbody.children[idx];
            if (tr) classes.forEach(c => tr.classList.add(c));
        }
        for (const [key, classes] of Object.entries(this._cellCss)) {
            const [rowIdx, field] = key.split(':');
            const td = this._getTd(Number(rowIdx), field);
            if (td) classes.forEach(c => td.classList.add(c));
        }
    }

    // ── check 에디터 ──

    _renderCheckEditor(td, row, col, rowIdx) {
        td.style.textAlign = 'center';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        const val = row[col.field];
        cb.checked = val === 'Y' || val === true || val === 1;
        cb.onclick = (e) => e.stopPropagation();
        cb.onchange = () => {
            row[col.field] = cb.checked ? 'Y' : 'N';
            if (row.gstat !== 'I') row.gstat = 'U';
            const tr = this.tbody.children[rowIdx];
            if (tr) tr.classList.add('forma-row-modified');
            if (this.onCellChange) this.onCellChange(row, col.field, rowIdx);
            this._renderFooter();
        };
        if (!this.editable || col.readOnly) cb.disabled = true;
        td.appendChild(cb);
    }

    // ── 편집 ──

    _startEdit(rowIdx, col, td, row) {
        if (td.querySelector('input, select')) return;
        if (col.editor === 'select') { this._startSelectEdit(rowIdx, col, td, row); return; }

        const originalValue = row[col.field];
        td.textContent = '';
        const input = document.createElement('input');
        input.className = 'forma-grid-input';
        input.type = col.type === 'number' || col.format === 'currency' ? 'number' : 'text';
        input.value = row[col.field] ?? '';
        td.appendChild(input);
        input.focus();
        input.select();

        const commit = () => {
            let val = input.value;
            if (input.type === 'number') val = val ? Number(val) : null;
            if (val !== originalValue) {
                row[col.field] = val;
                if (row.gstat !== 'I') row.gstat = 'U';
                const tr = this.tbody.children[rowIdx];
                if (tr) tr.classList.add('forma-row-modified');
                if (this.onCellChange) this.onCellChange(row, col.field, rowIdx);
            }
            this._renderCell(td, row, col);
            this._renderFooter();
        };

        input.onblur = commit;
        input.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { row[col.field] = originalValue; this._renderCell(td, row, col); }
        };
    }

    _startSelectEdit(rowIdx, col, td, row) {
        const originalValue = row[col.field];
        const doEdit = (options) => {
            td.textContent = '';
            const select = document.createElement('select');
            select.className = 'forma-grid-input';
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '-- 선택 --';
            select.appendChild(emptyOpt);

            for (const opt of options) {
                const o = document.createElement('option');
                o.value = opt.value;
                o.textContent = opt.label;
                if (String(opt.value) === String(row[col.field])) o.selected = true;
                select.appendChild(o);
            }
            td.appendChild(select);
            select.focus();

            const commit = () => {
                const val = select.value || null;
                if (val !== originalValue) {
                    row[col.field] = val;
                    if (row.gstat !== 'I') row.gstat = 'U';
                    const tr = this.tbody.children[rowIdx];
                    if (tr) tr.classList.add('forma-row-modified');
                    if (this.onCellChange) this.onCellChange(row, col.field, rowIdx);
                }
                this._renderCell(td, row, col);
                this._renderFooter();
            };

            select.onblur = commit;
            select.onchange = commit;
            select.onkeydown = (e) => {
                if (e.key === 'Escape') { row[col.field] = originalValue; this._renderCell(td, row, col); }
            };
        };

        if (col.options) {
            doEdit(col.options);
        } else if (col.code) {
            if (this._codeCache[col.code]) {
                doEdit(this._codeCache[col.code]);
            } else {
                fetch('/api/codes/' + col.code)
                    .then(r => r.json())
                    .then(json => {
                        const opts = (json.resultData || []).map(c => ({
                            value: c.CODE || c.code,
                            label: c.CODE_NM || c.codeName || c.label || c.CODE
                        }));
                        this._codeCache[col.code] = opts;
                        doEdit(opts);
                    })
                    .catch(() => doEdit([]));
            }
        } else {
            doEdit([]);
        }
    }

    // ── Footer ──

    _renderFooter() {
        if (!this._hasFooter || !this.tfoot) return;
        this.tfoot.innerHTML = '';
        if (this.rows.length === 0) return;

        const tr = document.createElement('tr');
        if (this.checkable) tr.appendChild(document.createElement('td'));
        if (this.rowNum) tr.appendChild(document.createElement('td'));

        for (const col of this.columns) {
            const td = document.createElement('td');
            if (col.align) td.style.textAlign = col.align;
            if (col.format === 'currency' || col.type === 'number') td.style.textAlign = 'right';

            if (col.footer) {
                const values = this.rows.map(r => Number(r[col.field]) || 0);
                let result;
                if (col.footer === 'sum') result = values.reduce((a, b) => a + b, 0);
                else if (col.footer === 'avg') result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                else if (col.footer === 'count') result = this.rows.length;

                if (col.format === 'currency' || col.footer === 'sum' || col.footer === 'avg') {
                    td.textContent = Number(result).toLocaleString('ko-KR');
                } else {
                    td.textContent = result;
                }
            }
            tr.appendChild(td);
        }
        this.tfoot.appendChild(tr);
    }

    // ── 내부 유틸 ──

    _selectRow(idx) {
        this.selectedIdx = idx;
        Array.from(this.tbody.children).forEach((tr, i) => tr.classList.toggle('selected', i === idx));
    }

    _toggleAllCheck(checked) {
        this.rows.forEach(r => r._checked = checked);
        this.tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
    }

    _renderEmpty() {
        let cols = this.columns.length;
        if (this.checkable) cols++;
        if (this.rowNum) cols++;
        this.tbody.innerHTML = '<tr><td colspan="' + cols + '" class="forma-grid-empty">데이터가 없습니다</td></tr>';
    }

    // ── 페이징 ──

    _renderPaging() {
        if (!this.paging) return;
        // 기존 페이징 바 제거
        const old = this.container.querySelector('.forma-grid-paging');
        if (old) old.remove();

        const totalPages = Math.max(1, Math.ceil(this._totalCount / this._pageSize));
        const page = this._currentPage;

        const bar = document.createElement('div');
        bar.className = 'forma-grid-paging';

        // 왼쪽: 페이지 버튼
        const nav = document.createElement('div');
        nav.className = 'forma-paging-nav';

        const mkBtn = (text, targetPage, disabled) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.disabled = disabled;
            if (targetPage === page) btn.classList.add('active');
            if (!disabled) btn.onclick = () => this._goPage(targetPage);
            return btn;
        };

        nav.appendChild(mkBtn('«', 1, page === 1));
        nav.appendChild(mkBtn('‹', page - 1, page === 1));

        // 페이지 번호 (최대 10개 표시)
        let startPage = Math.max(1, page - 4);
        let endPage = Math.min(totalPages, startPage + 9);
        if (endPage - startPage < 9) startPage = Math.max(1, endPage - 9);

        for (let p = startPage; p <= endPage; p++) {
            nav.appendChild(mkBtn(String(p), p, false));
        }

        nav.appendChild(mkBtn('›', page + 1, page === totalPages));
        nav.appendChild(mkBtn('»', totalPages, page === totalPages));
        bar.appendChild(nav);

        // 가운데: 페이지 크기
        const sizeWrap = document.createElement('div');
        sizeWrap.className = 'forma-paging-size';
        sizeWrap.innerHTML = '페이지크기: ';
        [20, 50, 100].forEach(size => {
            const btn = document.createElement('button');
            btn.textContent = size;
            if (size === this._pageSize) btn.classList.add('active');
            btn.onclick = () => {
                this._pageSize = size;
                this._currentPage = 1;
                this._renderPaging();
                if (this.onPageChange) this.onPageChange(1, size);
            };
            sizeWrap.appendChild(btn);
        });
        bar.appendChild(sizeWrap);

        // 오른쪽: 총 건수
        const info = document.createElement('div');
        info.className = 'forma-paging-info';
        info.textContent = '총 ' + this._totalCount.toLocaleString('ko-KR') + '건';
        bar.appendChild(info);

        this.container.appendChild(bar);
    }

    _goPage(page) {
        const totalPages = Math.max(1, Math.ceil(this._totalCount / this._pageSize));
        if (page < 1 || page > totalPages) return;
        this._currentPage = page;
        this._renderPaging();
        if (this.onPageChange) this.onPageChange(page, this._pageSize);
    }
}

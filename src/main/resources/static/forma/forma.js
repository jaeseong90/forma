/**
 * FORMA Frontend Framework
 * AI가 생성하는 화면 JS에서 이 컴포넌트들을 조합한다.
 * 빌드 도구 없이 <script src="/forma/forma.js"> 로 사용.
 */

// ============================================================
// API Helper
// ============================================================
const FormaApi = {
    _loadingCount: 0,

    _showLoading() {
        this._loadingCount++;
        if (this._loadingCount === 1) {
            let el = document.getElementById('forma-loading');
            if (!el) {
                el = document.createElement('div');
                el.id = 'forma-loading';
                el.className = 'forma-loading-overlay';
                el.innerHTML = '<div class="forma-loading-spinner"></div>';
                document.body.appendChild(el);
            }
            el.style.display = 'flex';
        }
    },

    _hideLoading() {
        this._loadingCount = Math.max(0, this._loadingCount - 1);
        if (this._loadingCount === 0) {
            const el = document.getElementById('forma-loading');
            if (el) el.style.display = 'none';
        }
    },

    async _request(method, url, body) {
        this._showLoading();
        try {
            const options = { method };
            if (body !== undefined) {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(body);
            }
            const res = await fetch(url, options);
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'API 오류');
            return json.data;
        } finally {
            this._hideLoading();
        }
    },

    async get(url, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const fullUrl = qs ? `${url}?${qs}` : url;
        return this._request('GET', fullUrl);
    },

    async post(url, body) {
        return this._request('POST', url, body);
    },

    async del(url) {
        return this._request('DELETE', url);
    }
};

// ============================================================
// Formatter
// ============================================================
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

// ============================================================
// Code Cache (코드 사전 캐시)
// ============================================================
const _codeCache = {};
async function getCodeItems(codeGroup) {
    if (_codeCache[codeGroup]) return _codeCache[codeGroup];
    try {
        const data = await FormaApi.get(`/api/codes/${codeGroup}`);
        _codeCache[codeGroup] = data.items || [];
        return _codeCache[codeGroup];
    } catch { return []; }
}

// ============================================================
// FormaGrid - 데이터 그리드
// ============================================================
class FormaGrid {
    constructor(selector, options) {
        this.container = document.querySelector(selector);
        this.columns = options.columns || [];
        this.editable = options.editable || false;
        this.onSelect = options.onSelect || null;
        this.onCellChange = options.onCellChange || null;
        this.onSort = options.onSort || null;
        this.onPageChange = options.onPageChange || null;
        this.features = options.features || [];
        this.currentSort = options.defaultSort || null;
        this.currentPage = 1;
        this.pageSize = options.pageSize || 50;
        this.totalCount = 0;
        this.rows = [];
        this.selectedIdx = -1;
        this.checkedSet = new Set();
        this.modifiedSet = new Set();
        this._editingCell = null;  // { rowIdx, colIdx }
        this._build();
    }

    _build() {
        this.container.innerHTML = '';
        this.container.classList.add('forma-grid-wrap');

        // 기능 버튼바
        const hasToolbar = (this.editable && (this.features.includes('addRow') || this.features.includes('deleteRow')))
            || this.features.includes('export');
        if (hasToolbar) {
            const bar = document.createElement('div');
            bar.className = 'forma-grid-toolbar';
            if (this.editable && this.features.includes('addRow')) {
                const btn = document.createElement('button');
                btn.textContent = '+ 행추가';
                btn.className = 'forma-btn forma-btn-sm';
                btn.onclick = () => this.addRow();
                bar.appendChild(btn);
            }
            if (this.editable && this.features.includes('deleteRow')) {
                const btn = document.createElement('button');
                btn.textContent = '- 행삭제';
                btn.className = 'forma-btn forma-btn-sm';
                btn.onclick = () => this.deleteRow();
                bar.appendChild(btn);
            }
            if (this.features.includes('export')) {
                const btn = document.createElement('button');
                btn.textContent = '⬇ 내보내기';
                btn.className = 'forma-btn forma-btn-sm';
                btn.onclick = () => this.exportCsv();
                bar.appendChild(btn);
            }
            this.container.appendChild(bar);
        }

        // 테이블
        const tableWrap = document.createElement('div');
        tableWrap.className = 'forma-grid-scroll';
        this.table = document.createElement('table');
        this.table.className = 'forma-grid';

        // 헤더
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        // 체크박스 컬럼
        if (this.features.includes('checkbox')) {
            const th = document.createElement('th');
            th.style.width = '36px';
            th.style.textAlign = 'center';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.onchange = () => this._toggleAllCheck(cb.checked);
            this._headerCheckbox = cb;
            th.appendChild(cb);
            tr.appendChild(th);
        }
        // 행번호 컬럼
        if (this.features.includes('rowNum')) {
            const th = document.createElement('th');
            th.textContent = 'No';
            th.style.width = '45px';
            th.style.textAlign = 'center';
            tr.appendChild(th);
        }
        for (const col of this.columns) {
            const th = document.createElement('th');
            const labelSpan = document.createElement('span');
            labelSpan.textContent = col.label || col.field;
            th.appendChild(labelSpan);
            if (col.width) th.style.width = col.width + 'px';
            // 정렬
            if (!col.auto) {
                th.style.cursor = 'pointer';
                th.dataset.field = col.field;
                const sortIcon = document.createElement('span');
                sortIcon.className = 'forma-sort-icon';
                th.appendChild(sortIcon);
                th.onclick = (e) => {
                    if (e.target.classList.contains('forma-resize-handle')) return;
                    this._toggleSort(col.field);
                };
            }
            // 리사이즈 핸들
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'forma-resize-handle';
            resizeHandle.onmousedown = (e) => this._startResize(e, th, col);
            th.appendChild(resizeHandle);
            th.style.position = 'relative';
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        this.table.appendChild(thead);
        this._updateSortIcons();
        this._applyFrozen();

        this.tbody = document.createElement('tbody');
        this.table.appendChild(this.tbody);
        tableWrap.appendChild(this.table);
        this.container.appendChild(tableWrap);

        // 빈 상태
        this._renderEmpty();
    }

    async setData(rows, total, page, size) {
        this.rows = rows || [];
        this.totalCount = total || 0;
        if (page) this.currentPage = page;
        if (size) this.pageSize = size;
        this.selectedIdx = -1;
        this.checkedSet.clear();
        await this._render();
        this._applyFrozen();
        this._buildPaging();
    }

    async _render() {
        this.tbody.innerHTML = '';
        if (this.rows.length === 0) { this._renderEmpty(); return; }

        // 코드 데이터 미리 로딩
        for (const col of this.columns) {
            if (col.code) await getCodeItems(col.code);
        }

        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            const tr = document.createElement('tr');
            tr.onclick = () => this._selectRow(i);
            if (i === this.selectedIdx) tr.classList.add('selected');

            // 체크박스 셀
            if (this.features.includes('checkbox')) {
                const td = document.createElement('td');
                td.style.textAlign = 'center';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = this.checkedSet.has(i);
                cb.onclick = (e) => e.stopPropagation();
                cb.onchange = () => {
                    if (cb.checked) this.checkedSet.add(i);
                    else this.checkedSet.delete(i);
                    this._updateHeaderCheckbox();
                };
                td.appendChild(cb);
                tr.appendChild(td);
            }
            // 행번호 셀
            if (this.features.includes('rowNum')) {
                const td = document.createElement('td');
                td.style.textAlign = 'center';
                td.textContent = (this.currentPage - 1) * this.pageSize + i + 1;
                tr.appendChild(td);
            }

            for (let ci = 0; ci < this.columns.length; ci++) {
                const col = this.columns[ci];
                const td = document.createElement('td');
                if (col.align) td.style.textAlign = col.align;
                if (col.format === 'currency' || col.type === 'number' || col.type === 'decimal') {
                    td.style.textAlign = td.style.textAlign || 'right';
                }

                // 셀 값 표시
                this._renderCellValue(td, row, col);

                // 편집 가능 셀: 더블클릭으로 편집 진입
                if (this.editable && !col.readOnly && !col.auto) {
                    td.ondblclick = (e) => {
                        e.stopPropagation();
                        this._enterEditMode(i, ci, td, row, col);
                    };
                }

                if (col.link && !this.editable) {
                    td.classList.add('forma-link');
                    td.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof col.link === 'function') col.link(row);
                        else location.href = col.link + '?id=' + row[col.field];
                    };
                }
                tr.appendChild(td);
            }

            // 변경된 행 표시
            if (this.modifiedSet.has(i)) {
                tr.classList.add('forma-row-modified');
            }
            this.tbody.appendChild(tr);
        }
    }

    _renderCellValue(td, row, col) {
        let val = row[col.field];
        if (col.format === 'badge' && col.code) {
            td.innerHTML = FormaFormat.badge(val, _codeCache[col.code]);
        } else if (col.format) {
            td.textContent = FormaFormat.apply(col.format, val);
        } else {
            td.textContent = val ?? '';
        }
    }

    _enterEditMode(rowIdx, colIdx, td, row, col) {
        // 이전 편집 셀 종료
        if (this._editingCell) this._commitEdit();

        this._editingCell = { rowIdx, colIdx };
        const originalValue = row[col.field];

        td.textContent = '';
        const input = document.createElement('input');
        input.className = 'forma-grid-input forma-grid-input-active';
        input.type = (col.type === 'number' || col.format === 'currency') ? 'number' : 'text';
        input.value = row[col.field] ?? '';
        td.appendChild(input);
        input.focus();
        input.select();

        const commit = () => {
            let val = input.value;
            if (input.type === 'number') val = val ? Number(val) : null;
            if (val !== originalValue) {
                row[col.field] = val;
                this.modifiedSet.add(rowIdx);
                const tr = this.tbody.children[rowIdx];
                if (tr) tr.classList.add('forma-row-modified');
                if (this.onCellChange) {
                    this.onCellChange(row, col.field, rowIdx);
                    this._refreshRow(rowIdx);
                }
            }
            this._exitEditMode(td, row, col);
        };

        input.onblur = () => commit();
        input.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                commit();
                // 다음 셀로 이동
                const nextColIdx = e.shiftKey ? colIdx - 1 : colIdx + 1;
                this._moveToNextEditableCell(rowIdx, nextColIdx, e.key === 'Enter');
            } else if (e.key === 'Escape') {
                row[col.field] = originalValue;
                this._exitEditMode(td, row, col);
                this._editingCell = null;
            }
        };
    }

    _exitEditMode(td, row, col) {
        this._editingCell = null;
        td.textContent = '';
        this._renderCellValue(td, row, col);
    }

    _commitEdit() {
        const activeInput = this.tbody.querySelector('.forma-grid-input-active');
        if (activeInput) activeInput.blur();
    }

    _moveToNextEditableCell(rowIdx, colIdx, isEnter) {
        if (isEnter) {
            // Enter: 다음 행 같은 컬럼
            rowIdx++;
            if (rowIdx >= this.rows.length) return;
        } else {
            // Tab: 다음 편집 가능 컬럼 찾기
            while (colIdx >= 0 && colIdx < this.columns.length) {
                const c = this.columns[colIdx];
                if (!c.readOnly && !c.auto) break;
                colIdx++;
            }
            if (colIdx >= this.columns.length) {
                rowIdx++;
                colIdx = 0;
                if (rowIdx >= this.rows.length) return;
                while (colIdx < this.columns.length && (this.columns[colIdx].readOnly || this.columns[colIdx].auto)) colIdx++;
            }
            if (colIdx < 0 || colIdx >= this.columns.length) return;
        }

        const tr = this.tbody.children[rowIdx];
        if (!tr) return;
        let offset = 0;
        if (this.features.includes('checkbox')) offset++;
        if (this.features.includes('rowNum')) offset++;
        const td = tr.children[colIdx + offset];
        if (td) {
            const col = this.columns[colIdx];
            const row = this.rows[rowIdx];
            this._enterEditMode(rowIdx, colIdx, td, row, col);
        }
    }

    getModifiedRows() {
        return [...this.modifiedSet].sort((a, b) => a - b).map(i => this.rows[i]);
    }

    _startResize(e, th, col) {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = th.offsetWidth;
        const colIdx = Array.from(th.parentElement.children).indexOf(th);

        // 가이드라인
        const guide = document.createElement('div');
        guide.className = 'forma-resize-guide';
        guide.style.left = e.clientX + 'px';
        document.body.appendChild(guide);

        const onMove = (ev) => {
            const newWidth = Math.max(50, startWidth + ev.clientX - startX);
            th.style.width = newWidth + 'px';
            guide.style.left = ev.clientX + 'px';
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            guide.remove();
            col.width = th.offsetWidth;
            this._applyFrozen();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    _applyFrozen() {
        const thead = this.table.querySelector('thead tr');
        if (!thead) return;
        const ths = Array.from(thead.children);
        let leftOffset = 0;
        // extra columns offset
        let extraCols = 0;
        if (this.features.includes('checkbox')) extraCols++;
        if (this.features.includes('rowNum')) extraCols++;

        // Apply frozen to extra columns and frozen data columns
        for (let i = 0; i < ths.length; i++) {
            const th = ths[i];
            const isExtra = i < extraCols;
            const colIdx = i - extraCols;
            const col = colIdx >= 0 ? this.columns[colIdx] : null;
            const isFrozen = isExtra || (col && col.frozen);

            if (isFrozen) {
                th.classList.add('frozen');
                th.style.left = leftOffset + 'px';
                th.style.zIndex = '2';
                // Apply to all tbody rows
                Array.from(this.tbody.children).forEach(tr => {
                    const td = tr.children[i];
                    if (td) {
                        td.classList.add('frozen');
                        td.style.left = leftOffset + 'px';
                        td.style.zIndex = '1';
                    }
                });
                leftOffset += th.offsetWidth;
            } else {
                break;
            }
        }
    }

    _toggleSort(field) {
        if (this.currentSort === field + ' ASC') {
            this.currentSort = field + ' DESC';
        } else if (this.currentSort === field + ' DESC') {
            this.currentSort = null;
        } else {
            this.currentSort = field + ' ASC';
        }
        this._updateSortIcons();
        if (this.onSort) this.onSort(this.currentSort);
    }

    _updateSortIcons() {
        const ths = this.table?.querySelectorAll('thead th');
        if (!ths) return;
        ths.forEach(th => {
            const icon = th.querySelector('.forma-sort-icon');
            if (!icon) return;
            const field = th.dataset.field;
            if (this.currentSort === field + ' ASC') icon.textContent = ' ▲';
            else if (this.currentSort === field + ' DESC') icon.textContent = ' ▼';
            else icon.textContent = '';
        });
    }

    _buildPaging() {
        // 기존 페이징 바 제거
        const old = this.container.querySelector('.forma-grid-paging');
        if (old) old.remove();

        if (this.totalCount <= 0) return;

        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        if (totalPages <= 1 && this.totalCount <= this.pageSize) return;

        const paging = document.createElement('div');
        paging.className = 'forma-grid-paging';

        // 정보 텍스트
        const info = document.createElement('span');
        info.className = 'forma-paging-info';
        info.textContent = `총 ${this.totalCount.toLocaleString()}건 / ${totalPages}페이지 중 ${this.currentPage}페이지`;
        paging.appendChild(info);

        const nav = document.createElement('div');
        nav.className = 'forma-paging-nav';

        // 처음/이전
        nav.appendChild(this._pagingBtn('«', 1, this.currentPage <= 1));
        nav.appendChild(this._pagingBtn('‹', this.currentPage - 1, this.currentPage <= 1));

        // 페이지 번호 (최대 5개)
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        for (let p = startPage; p <= endPage; p++) {
            const btn = this._pagingBtn(String(p), p, false);
            if (p === this.currentPage) btn.classList.add('active');
            nav.appendChild(btn);
        }

        // 다음/마지막
        nav.appendChild(this._pagingBtn('›', this.currentPage + 1, this.currentPage >= totalPages));
        nav.appendChild(this._pagingBtn('»', totalPages, this.currentPage >= totalPages));

        paging.appendChild(nav);

        // 페이지 사이즈 선택
        const sizeWrap = document.createElement('div');
        sizeWrap.className = 'forma-paging-size';
        const sizeSelect = document.createElement('select');
        sizeSelect.className = 'forma-input';
        for (const s of [20, 50, 100]) {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s + '건';
            if (s === this.pageSize) opt.selected = true;
            sizeSelect.appendChild(opt);
        }
        sizeSelect.onchange = () => {
            this.pageSize = Number(sizeSelect.value);
            this.currentPage = 1;
            if (this.onPageChange) this.onPageChange(this.currentPage, this.pageSize);
        };
        sizeWrap.appendChild(sizeSelect);
        paging.appendChild(sizeWrap);

        this.container.appendChild(paging);
    }

    _pagingBtn(text, page, disabled) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'forma-paging-btn';
        btn.disabled = disabled;
        if (!disabled) {
            btn.onclick = () => {
                this.currentPage = page;
                if (this.onPageChange) this.onPageChange(this.currentPage, this.pageSize);
            };
        }
        return btn;
    }

    _refreshRow(idx) {
        // 계산 필드 등 변경 후 해당 행만 다시 렌더
        const row = this.rows[idx];
        const tr = this.tbody.children[idx];
        if (!tr) return;
        // extra columns offset (checkbox, rowNum)
        let offset = 0;
        if (this.features.includes('checkbox')) offset++;
        if (this.features.includes('rowNum')) offset++;
        this.columns.forEach((col, ci) => {
            if (col.readOnly || col.auto) {
                const td = tr.children[ci + offset];
                if (col.format) td.textContent = FormaFormat.apply(col.format, row[col.field]);
                else td.textContent = row[col.field] ?? '';
            }
        });
    }

    _selectRow(idx) {
        this.selectedIdx = idx;
        Array.from(this.tbody.children).forEach((tr, i) => {
            tr.classList.toggle('selected', i === idx);
        });
        if (this.onSelect) this.onSelect(this.rows[idx], idx);
    }

    _renderEmpty() {
        let colSpan = this.columns.length;
        if (this.features.includes('checkbox')) colSpan++;
        if (this.features.includes('rowNum')) colSpan++;
        this.tbody.innerHTML = '<tr><td colspan="' + colSpan
            + '" class="forma-grid-empty">데이터가 없습니다</td></tr>';
    }

    _toggleAllCheck(checked) {
        this.checkedSet.clear();
        if (checked) {
            for (let i = 0; i < this.rows.length; i++) this.checkedSet.add(i);
        }
        this.tbody.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
            cb.checked = checked;
        });
    }

    _updateHeaderCheckbox() {
        if (this._headerCheckbox) {
            this._headerCheckbox.checked = this.rows.length > 0 && this.checkedSet.size === this.rows.length;
        }
    }

    getSelectedRow() { return this.selectedIdx >= 0 ? this.rows[this.selectedIdx] : null; }
    getAllRows() { return this.rows; }
    getCheckedRows() { return [...this.checkedSet].sort((a, b) => a - b).map(i => this.rows[i]); }

    addRow() { this.rows.push({}); this._render(); }
    deleteRow() {
        if (this.selectedIdx < 0) return;
        this.rows.splice(this.selectedIdx, 1);
        this.selectedIdx = -1;
        this.checkedSet.clear();
        this._render();
    }

    exportCsv(filename) {
        const BOM = '\uFEFF';
        const header = this.columns.map(c => c.label || c.field).join(',');
        const rows = this.rows.map(row =>
            this.columns.map(col => {
                let val = row[col.field] ?? '';
                if (col.format === 'currency') val = FormaFormat.currency(val);
                else if (col.format === 'number') val = FormaFormat.number(val);
                else if (col.format === 'date') val = FormaFormat.date(val);
                return '"' + String(val).replace(/"/g, '""') + '"';
            }).join(',')
        );
        const csv = BOM + header + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'export.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

// ============================================================
// FormaSearch - 검색바
// ============================================================
class FormaSearch {
    constructor(selector, fields, onSearch) {
        this.container = document.querySelector(selector);
        this.fields = fields;
        this.onSearch = onSearch;
        this.inputs = {};
        this.displayInputs = {};  // codePopup의 표시값 input
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
            // 접기: 4번째 이상은 숨김 (collapsed 상태일 때)
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
                // Tab/Enter 시 코드 자동 조회
                codeInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.onSearch?.();
                    } else if (e.key === 'Tab' && codeInput.value && f.popupUrl) {
                        // 코드 입력 후 Tab → 자동 조회
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

        // 버튼 그룹: 조회 + 초기화 + 상세
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

        // 상세 접기/펼치기 버튼
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

// ============================================================
// FormaForm - 폼 빌더
// ============================================================
class FormaForm {
    constructor(selector, fields) {
        this.container = document.querySelector(selector);
        this.fields = fields;
        this.inputs = {};
        this._build();
    }

    _build() {
        this.container.innerHTML = '';
        this.container.classList.add('forma-form');

        for (const f of this.fields) {
            const row = document.createElement('div');
            row.className = 'forma-form-row';

            const label = document.createElement('label');
            label.textContent = f.label || f.field;
            if (f.required) label.classList.add('required');
            row.appendChild(label);

            let input;
            if (f.widget === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else if (f.widget === 'combo' && f.code) {
                input = document.createElement('select');
                input.innerHTML = '<option value="">선택</option>';
                getCodeItems(f.code).then(items => {
                    items.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.value;
                        opt.textContent = item.label;
                        input.appendChild(opt);
                    });
                });
            } else if (f.widget === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
            } else {
                input = document.createElement('input');
                input.type = f.type === 'number' || f.type === 'decimal' ? 'number' : f.type === 'date' ? 'date' : 'text';
            }

            input.className = 'forma-input';
            if (f.readOnly) input.readOnly = true;
            row.appendChild(input);
            this.container.appendChild(row);
            this.inputs[f.field] = input;
        }
    }

    getData() {
        const result = {};
        for (const [key, el] of Object.entries(this.inputs)) {
            if (el.type === 'checkbox') result[key] = el.checked;
            else if (el.type === 'number') result[key] = el.value ? Number(el.value) : null;
            else result[key] = el.value || null;
        }
        return result;
    }

    setData(obj) {
        for (const [key, el] of Object.entries(this.inputs)) {
            if (el.type === 'checkbox') el.checked = !!obj[key];
            else el.value = obj[key] ?? '';
        }
    }

    clear() {
        for (const el of Object.values(this.inputs)) {
            if (el.type === 'checkbox') el.checked = false;
            else el.value = '';
        }
    }
}

// ============================================================
// FormaPopup - 코드 검색 팝업 (간이 구현)
// ============================================================
class FormaPopup {
    static open(options) {
        // options: { title, url, columns, onSelect }
        const overlay = document.createElement('div');
        overlay.className = 'forma-popup-overlay';

        const modal = document.createElement('div');
        modal.className = 'forma-popup';
        modal.innerHTML = `
            <div class="forma-popup-header">
                <span>${options.title || '검색'}</span>
                <button class="forma-popup-close">&times;</button>
            </div>
            <div class="forma-popup-search">
                <input type="text" class="forma-input" placeholder="검색어 입력" />
                <button class="forma-btn">검색</button>
            </div>
            <div class="forma-popup-grid"></div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const closeBtn = modal.querySelector('.forma-popup-close');
        closeBtn.onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const searchInput = modal.querySelector('input');
        const searchBtn = modal.querySelector('.forma-popup-search button');
        const gridContainer = modal.querySelector('.forma-popup-grid');

        const grid = new FormaGrid(null, {
            columns: options.columns,
            onSelect: (row) => {
                if (options.onSelect) options.onSelect(row);
                overlay.remove();
            }
        });
        // manual mount
        grid.container = gridContainer;
        grid._build();

        const doSearch = async () => {
            const keyword = searchInput.value;
            const data = await FormaApi.get(options.url, {keyword, _size: '20'});
            grid.setData(data.data || data, data.total);
        };

        searchBtn.onclick = doSearch;
        searchInput.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };
        doSearch();
    }
}

// ============================================================
// FormaPage - 페이지 헬퍼
// ============================================================
class FormaPage {
    static actionBar(selector, actions) {
        const container = document.querySelector(selector);
        container.classList.add('forma-action-bar');
        for (const action of actions) {
            const btn = document.createElement('button');
            btn.textContent = action.label;
            btn.className = 'forma-btn ' + (action.primary ? 'forma-btn-primary' : '');
            btn.onclick = action.onClick;
            container.appendChild(btn);
        }
    }

    static confirm(msg) {
        return FormaDialog.confirm(msg);
    }

    static alert(msg) {
        return FormaDialog.alert(msg);
    }
}

// ============================================================
// FormaToast - 토스트 메시지
// ============================================================
class FormaToast {
    static _container = null;

    static _getContainer() {
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.className = 'forma-toast-container';
            document.body.appendChild(this._container);
        }
        return this._container;
    }

    static _show(message, type, duration = 3000) {
        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.className = `forma-toast forma-toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        // fade in
        requestAnimationFrame(() => toast.classList.add('forma-toast-show'));
        setTimeout(() => {
            toast.classList.remove('forma-toast-show');
            toast.classList.add('forma-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static success(msg) { this._show(msg, 'success'); }
    static error(msg) { this._show(msg, 'error'); }
    static info(msg) { this._show(msg, 'info'); }
}

// ============================================================
// FormaDialog - 확인/알림 다이얼로그
// ============================================================
class FormaDialog {
    static confirm(msg) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'forma-dialog-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'forma-dialog';
            dialog.innerHTML = `
                <div class="forma-dialog-body">${msg}</div>
                <div class="forma-dialog-footer">
                    <button class="forma-btn forma-dialog-cancel">취소</button>
                    <button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const close = (result) => {
                overlay.remove();
                resolve(result);
            };

            dialog.querySelector('.forma-dialog-ok').onclick = () => close(true);
            dialog.querySelector('.forma-dialog-cancel').onclick = () => close(false);
            overlay.onclick = (e) => { if (e.target === overlay) close(false); };
            dialog.querySelector('.forma-dialog-ok').focus();
        });
    }

    static alert(msg) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'forma-dialog-overlay';

            const dialog = document.createElement('div');
            dialog.className = 'forma-dialog';
            dialog.innerHTML = `
                <div class="forma-dialog-body">${msg}</div>
                <div class="forma-dialog-footer">
                    <button class="forma-btn forma-btn-primary forma-dialog-ok">확인</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            dialog.querySelector('.forma-dialog-ok').onclick = () => { overlay.remove(); resolve(); };
            overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(); } };
            dialog.querySelector('.forma-dialog-ok').focus();
        });
    }
}

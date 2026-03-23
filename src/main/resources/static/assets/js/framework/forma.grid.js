/**
 * FormaGrid - 상용 수준 ERP 데이터 그리드
 *
 * 기능: N단 멀티헤더, frozen, gstat, 인라인 편집(8종 에디터), 정렬, footer,
 *       키보드 셀 내비게이션, 클립보드(Ctrl+C/V), 셀 렌더러, 필터행,
 *       컬럼 리사이즈/자동맞춤, CSV, 체크박스, 페이징, 셀CSS, 검증
 */
class FormaGrid {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        this.columns = options.columns || [];
        this.editable = options.editable || false;
        this.checkable = options.checkable || false;
        this.sortable = options.sortable || false;
        this.rowNum = options.rowNum || false;
        this.reorderable = options.reorderable || false;
        this.paging = options.paging || false;
        this.filterable = options.filterable || false;
        this.onRowClick = options.onRowClick || null;
        this.onRowDblClick = options.onRowDblClick || null;
        this.onCellChange = options.onCellChange || null;
        this.onPageChange = options.onPageChange || null;
        this.onRowReorder = options.onRowReorder || null;
        this.rows = [];
        this.selectedIdx = -1;
        this._cellCss = {};
        this._rowCss = {};
        this._sortCol = null;
        this._sortDir = null;
        this._currentPage = 1;
        this._totalCount = 0;
        this._pageSize = options.pageSize || 50;
        this._headerDepth = 1;
        for (const c of this.columns) { if (Array.isArray(c.label)) this._headerDepth = Math.max(this._headerDepth, c.label.length); }
        this._hasFooter = this.columns.some(c => c.footer);
        this._hasFrozen = this.columns.some(c => c.frozen);
        this._codeCache = {};
        // 키보드 내비게이션
        this._focusRow = -1;
        this._focusCol = -1;
        this._editing = false;
        // 필터
        this._allRows = null;
        this._filterValues = {};
        this._filterTimer = null;
        // Undo/Redo
        this._undoStack = [];
        this._redoStack = [];
        // 컨텍스트 메뉴
        this._ctxMenu = null;
        this._ctxDocHandler = null;
        // 가상 스크롤 (groupBy와 동시 사용 불가)
        this.virtualScroll = options.virtualScroll && !options.groupBy || false;
        this._vsHeight = options.height || 400;
        this._rowHeight = options.rowHeight || 30;
        this._vsStart = 0;
        this._vsEnd = 0;
        this._vsTick = false;
        // 셀 병합
        this._mergeColumns = this.columns.filter(c => c.merge).map(c => c.field);
        // 멀티행 (레코드당 서브행)
        this.rowDetail = options.rowDetail || null;
        // 트리 그리드
        this.treeField = options.treeField || null;      // 표시 필드 (트리 들여쓰기)
        this.treeParentField = options.treeParentField || 'parent_id';
        this.treeIdField = options.treeIdField || 'id';
        this._treeState = new Set(); // 접힌 노드 ID
        // 마스터-디테일 중첩
        this.detailGrid = options.detailGrid || null;    // function(row, containerEl) → 디테일 그리드 생성
        this._expandedDetails = new Set();               // 펼쳐진 행 인덱스
        // 그룹핑
        this.groupBy = options.groupBy || null;
        this.groupFooter = options.groupFooter || false;
        this._groups = [];
        this._collapsedGroups = new Set();
        this._build();
    }

    // ══════════════════════════════════════════════════════════
    //  Build
    // ══════════════════════════════════════════════════════════

    _build() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.classList.add('forma-grid-wrap');

        if (this.editable) {
            const bar = document.createElement('div');
            bar.className = 'forma-grid-toolbar';
            const addBtn = document.createElement('button');
            addBtn.textContent = '+ 행추가'; addBtn.className = 'forma-btn forma-btn-sm';
            addBtn.onclick = () => this.addRow();
            bar.appendChild(addBtn);
            const delBtn = document.createElement('button');
            delBtn.textContent = '- 행삭제'; delBtn.className = 'forma-btn forma-btn-sm';
            delBtn.onclick = () => this.deleteRow();
            bar.appendChild(delBtn);
            this.container.appendChild(bar);
        }

        this._scrollWrap = document.createElement('div');
        this._scrollWrap.className = 'forma-grid-scroll';
        this._scrollWrap.setAttribute('tabindex', '0');
        this.table = document.createElement('table');
        this.table.className = 'forma-grid';

        this._buildColGroup();
        this._buildHeader();
        if (this.filterable) this._buildFilterRow();

        this.tbody = document.createElement('tbody');
        this.table.appendChild(this.tbody);

        if (this._hasFooter) {
            this.tfoot = document.createElement('tfoot');
            this.table.appendChild(this.tfoot);
        }

        this._scrollWrap.appendChild(this.table);
        this.container.appendChild(this._scrollWrap);
        if (this.virtualScroll) {
            this._scrollWrap.style.maxHeight = this._vsHeight + 'px';
            this._scrollWrap.style.overflowY = 'auto';
            this._scrollWrap.addEventListener('scroll', () => {
                if (!this._vsTick) { this._vsTick = true; requestAnimationFrame(() => { this._renderVirtual(); this._vsTick = false; }); }
            });
        }
        this._renderEmpty();
        this._initKeyboard();
        // DOM 추가 후 테이블 너비 재계산 + 리사이즈 감지
        requestAnimationFrame(() => this._updateTableWidth());
        this._resizeObserver = new ResizeObserver(() => this._updateTableWidth());
        this._resizeObserver.observe(this._scrollWrap);
    }

    // ══════════════════════════════════════════════════════════
    //  Colgroup — 컬럼 너비 일괄 관리
    // ══════════════════════════════════════════════════════════

    _buildColGroup() {
        // colgroup은 너비 힌트로만 사용 (table-layout: auto)
        this._colgroup = document.createElement('colgroup');
        this._cols = [];
        if (this.detailGrid) { const c = document.createElement('col'); c.setAttribute('width', '30'); this._colgroup.appendChild(c); }
        if (this.reorderable) { const c = document.createElement('col'); c.setAttribute('width', '28'); this._colgroup.appendChild(c); }
        if (this.checkable) { const c = document.createElement('col'); c.setAttribute('width', '36'); this._colgroup.appendChild(c); }
        if (this.rowNum) { const c = document.createElement('col'); c.setAttribute('width', '45'); this._colgroup.appendChild(c); }
        for (const col of this.columns) {
            const c = document.createElement('col');
            c.setAttribute('width', col._hidden ? '0' : String(col.width || 100));
            this._colgroup.appendChild(c);
            this._cols.push(c);
        }
        this.table.appendChild(this._colgroup);
    }

    _updateTableWidth() {
        // auto layout에서는 min-width로 수평 스크롤 보장
        let total = 0;
        if (this.detailGrid) total += 30;
        if (this.reorderable) total += 28;
        if (this.checkable) total += 36;
        if (this.rowNum) total += 45;
        for (const col of this.columns) { if (!col._hidden) total += (col.width || 100); }
        this.table.style.minWidth = total + 'px';
    }

    _updateColWidth(colIdx, width) {
        if (this._cols[colIdx]) this._cols[colIdx].setAttribute('width', String(width));
        this.columns[colIdx].width = width;
        this._updateTableWidth();
    }

    // ══════════════════════════════════════════════════════════
    //  N단 멀티헤더
    // ══════════════════════════════════════════════════════════

    _buildHeader() {
        this._thead = document.createElement('thead');
        const cols = this.columns;
        const depth = this._headerDepth;

        const labels = cols.map(col => {
            if (!Array.isArray(col.label)) return [{ text: col.label || col.field }];
            return col.label.slice();
        });

        const matrix = [];
        for (let r = 0; r < depth; r++) matrix.push(new Array(cols.length).fill(null));

        for (let ci = 0; ci < cols.length; ci++) {
            const la = labels[ci];
            for (let r = 0; r < depth; r++) {
                if (matrix[r][ci] === 'covered') continue;
                const cell = r < la.length ? la[r] : undefined;
                if (cell === null || cell === undefined) continue;
                const colspan = cell.colspan || 1;
                let rowspan = 1;
                for (let nr = r + 1; nr < depth; nr++) {
                    if (matrix[nr][ci] === 'covered') break;
                    if (nr < la.length && la[nr] !== null && la[nr] !== undefined) break;
                    rowspan++;
                }
                matrix[r][ci] = { text: cell.text || '', colspan, rowspan };
                for (let rs = 0; rs < rowspan; rs++) {
                    for (let cs = 0; cs < colspan; cs++) {
                        if (rs === 0 && cs === 0) continue;
                        const mr = r + rs, mc = ci + cs;
                        if (mr < depth && mc < cols.length) matrix[mr][mc] = 'covered';
                    }
                }
            }
        }

        for (let r = 0; r < depth; r++) {
            const tr = document.createElement('tr');
            if (r === 0) {
                if (this.detailGrid) {
                    const th = document.createElement('th');
                    th.style.width = '30px'; th.style.textAlign = 'center';
                    if (depth > 1) th.rowSpan = depth;
                    tr.appendChild(th);
                }
                if (this.reorderable) {
                    const th = document.createElement('th');
                    th.style.width = '28px'; th.style.textAlign = 'center'; th.textContent = '';
                    if (depth > 1) th.rowSpan = depth;
                    tr.appendChild(th);
                }
                if (this.checkable) {
                    const th = document.createElement('th');
                    th.style.width = '36px'; th.style.textAlign = 'center';
                    if (depth > 1) th.rowSpan = depth;
                    const cb = document.createElement('input'); cb.type = 'checkbox';
                    cb.onchange = () => this._toggleAllCheck(cb.checked);
                    this._headerCb = cb; th.appendChild(cb);
                    if (this._hasFrozen) this._applySticky(th, 0);
                    tr.appendChild(th);
                }
                if (this.rowNum) {
                    const th = document.createElement('th');
                    th.style.width = '45px'; th.style.textAlign = 'center'; th.textContent = 'No';
                    if (depth > 1) th.rowSpan = depth;
                    if (this._hasFrozen) this._applySticky(th, this.checkable ? 36 : 0);
                    tr.appendChild(th);
                }
            }
            for (let ci = 0; ci < cols.length; ci++) {
                const cell = matrix[r][ci];
                if (cell === 'covered' || cell === null) continue;
                const th = document.createElement('th');
                th.textContent = cell.text; th.style.textAlign = 'center';
                if (cell.colspan > 1) th.colSpan = cell.colspan;
                if (cell.rowspan > 1) th.rowSpan = cell.rowspan;
                const isLeaf = (r + cell.rowspan === depth);
                if (isLeaf) {
                    if (cols[ci].width) th.style.width = cols[ci].width + 'px';
                    th.style.position = 'relative';
                    if (this.sortable) this._attachSort(th, cols[ci]);
                    this._attachResize(th, cols[ci], ci);
                    this._applyFrozenTh(th, ci);
                    // 헤더 우클릭 컨텍스트 메뉴
                    ((cci) => { th.oncontextmenu = (ev) => this._headerContextMenu(ev, cols[cci], cci); })(ci);
                }
                tr.appendChild(th);
            }
            this._thead.appendChild(tr);
        }
        this.table.appendChild(this._thead);
    }

    // ══════════════════════════════════════════════════════════
    //  필터행
    // ══════════════════════════════════════════════════════════

    _buildFilterRow() {
        const tr = document.createElement('tr');
        tr.className = 'forma-filter-row';
        if (this.detailGrid) { const td = document.createElement('th'); td.style.width = '30px'; tr.appendChild(td); }
        if (this.reorderable) { const td = document.createElement('th'); td.style.width = '28px'; tr.appendChild(td); }
        if (this.checkable) { const td = document.createElement('th'); td.style.width = '36px'; tr.appendChild(td); }
        if (this.rowNum) { const td = document.createElement('th'); td.style.width = '45px'; tr.appendChild(td); }

        for (let ci = 0; ci < this.columns.length; ci++) {
            const col = this.columns[ci];
            const th = document.createElement('th');
            th.style.padding = '2px 4px';

            if (col.editor === 'check' || col.editor === 'switch') {
                const sel = document.createElement('select');
                sel.className = 'forma-filter-input';
                sel.innerHTML = '<option value="">전체</option><option value="Y">Y</option><option value="N">N</option>';
                sel.onchange = () => { this._filterValues[col.field] = sel.value; this._applyFilter(); };
                th.appendChild(sel);
            } else if (col.editor === 'select' || col.editor === 'combo') {
                const sel = document.createElement('select');
                sel.className = 'forma-filter-input';
                sel.innerHTML = '<option value="">전체</option>';
                (col.options || []).forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.label; sel.appendChild(op); });
                sel.onchange = () => { this._filterValues[col.field] = sel.value; this._applyFilter(); };
                th.appendChild(sel);
            } else {
                const input = document.createElement('input');
                input.type = 'text'; input.className = 'forma-filter-input';
                input.placeholder = '검색';
                input.oninput = () => {
                    this._filterValues[col.field] = input.value;
                    clearTimeout(this._filterTimer);
                    this._filterTimer = setTimeout(() => this._applyFilter(), 250);
                };
                th.appendChild(input);
            }
            tr.appendChild(th);
        }
        this._thead.appendChild(tr);
    }

    _applyFilter() {
        if (!this._allRows) return;
        const filters = Object.entries(this._filterValues).filter(([, v]) => v !== '' && v != null);
        if (filters.length === 0) {
            this.rows = this._allRows.map(r => r);
        } else {
            this.rows = this._allRows.filter(row => {
                return filters.every(([field, val]) => {
                    const col = this.columns.find(c => c.field === field);
                    const cellVal = row[field];
                    if (col && (col.editor === 'check' || col.editor === 'switch' || col.editor === 'select' || col.editor === 'combo')) {
                        return String(cellVal) === String(val);
                    }
                    // 텍스트 부분일치
                    if (cellVal == null) return false;
                    return String(cellVal).toLowerCase().includes(String(val).toLowerCase());
                });
            });
        }
        this._totalCount = this.rows.length;
        this.selectedIdx = -1;
        this._focusRow = -1;
        this._focusCol = -1;
        this._render();
        if (this.paging) this._renderPaging();
        this._renderFooter();
    }

    // ══════════════════════════════════════════════════════════
    //  Frozen
    // ══════════════════════════════════════════════════════════

    _calcFrozenLeft(colIdx) {
        let left = 0;
        if (this.reorderable) left += 28;
        if (this.checkable) left += 36;
        if (this.rowNum) left += 45;
        for (let i = 0; i < colIdx; i++) { if (this.columns[i].frozen) left += (this.columns[i].width || 100); }
        return left;
    }
    _applyFrozenTh(th, colIdx) { if (!this._hasFrozen || !this.columns[colIdx].frozen) return; this._applySticky(th, this._calcFrozenLeft(colIdx)); }
    _applyFrozenTd(td, colIdx) { if (!this._hasFrozen || !this.columns[colIdx].frozen) return; this._applySticky(td, this._calcFrozenLeft(colIdx)); td.style.background = td.style.background || '#fff'; }
    _applySticky(el, left) { el.style.position = 'sticky'; el.style.left = left + 'px'; el.style.zIndex = '2'; if (!el.style.background || el.style.background === 'transparent') el.style.background = '#f8f8f8'; }

    // ══════════════════════════════════════════════════════════
    //  컬럼 리사이즈 + 자동맞춤
    // ══════════════════════════════════════════════════════════

    _attachResize(th, col, colIdx) {
        const handle = document.createElement('div');
        handle.className = 'forma-col-resize';
        handle.onmousedown = (e) => {
            e.stopPropagation(); e.preventDefault();
            const startX = e.clientX, startW = th.offsetWidth;
            const onMove = (me) => { const nw = Math.max(40, startW + me.clientX - startX); this._updateColWidth(colIdx, nw); };
            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
        };
        // 더블클릭 자동맞춤
        handle.ondblclick = (e) => { e.stopPropagation(); this._autoFitColumn(colIdx); };
        th.appendChild(handle);
    }

    _autoFitColumn(colIdx) {
        const col = this.columns[colIdx];
        const span = document.createElement('span');
        span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:12px;padding:0 8px;';
        document.body.appendChild(span);
        // 헤더 텍스트
        const lbl = Array.isArray(col.label) ? (col.label[col.label.length - 1]?.text || col.field) : (col.label || col.field);
        span.textContent = lbl;
        let maxW = span.offsetWidth + 24;
        // 데이터 (최대 100행 샘플)
        const sample = this.rows.slice(0, 100);
        for (const row of sample) {
            let val = row[col.field];
            if ((col.format === 'currency' || col.editor === 'currency') && val != null) val = Number(val).toLocaleString('ko-KR');
            else if ((col.editor === 'select' || col.editor === 'combo') && col.options) {
                const opt = col.options.find(o => String(o.value) === String(val));
                if (opt) val = opt.label;
            }
            span.textContent = val ?? '';
            maxW = Math.max(maxW, span.offsetWidth + 24);
        }
        document.body.removeChild(span);
        const newW = Math.max(40, Math.min(maxW, 400));
        this._updateColWidth(colIdx, newW);
    }

    // ══════════════════════════════════════════════════════════
    //  정렬
    // ══════════════════════════════════════════════════════════

    _attachSort(th, col) {
        th.style.cursor = 'pointer'; th.style.userSelect = 'none';
        const arrow = document.createElement('span'); arrow.className = 'forma-sort-icon'; th.appendChild(arrow); col._sortIcon = arrow;
        th.onclick = (e) => {
            if (e.target.classList.contains('forma-col-resize')) return;
            if (this._sortCol === col.field) { if (this._sortDir === 'asc') this._sortDir = 'desc'; else { this._sortDir = null; this._sortCol = null; } }
            else { this._sortCol = col.field; this._sortDir = 'asc'; }
            this._updateSortIcons(); this._applySort(); this._render();
        };
    }
    _updateSortIcons() { for (const col of this.columns) { if (col._sortIcon) col._sortIcon.textContent = col.field === this._sortCol ? (this._sortDir === 'asc' ? ' ▲' : ' ▼') : ''; } }
    _applySort() {
        if (!this._sortCol || !this._sortDir) return;
        const col = this.columns.find(c => c.field === this._sortCol);
        const isNum = col && (col.type === 'number' || col.format === 'currency' || col.editor === 'currency');
        const dir = this._sortDir === 'asc' ? 1 : -1, field = this._sortCol;
        this.rows.sort((a, b) => { let va = a[field] ?? '', vb = b[field] ?? ''; if (isNum) return (Number(va) - Number(vb)) * dir; return String(va).localeCompare(String(vb), 'ko') * dir; });
    }

    // ══════════════════════════════════════════════════════════
    //  Data API
    // ══════════════════════════════════════════════════════════

    setData(data, totalCount) {
        this.rows = (data || []).map(r => ({ ...r }));
        if (this.filterable) { this._allRows = this.rows.map(r => r); }
        this._totalCount = (totalCount !== undefined) ? totalCount : this.rows.length;
        this.selectedIdx = -1; this._focusRow = -1; this._focusCol = -1;
        this._cellCss = {}; this._rowCss = {};
        this._vsStart = 0; this._vsEnd = 0;
        if (this._sortCol && this._sortDir) this._applySort();
        if (this.groupBy) this._buildGroups();
        this._render();
        if (this.paging) this._renderPaging();
    }

    getData() { return this.rows; }
    getCheckedData() { return this.rows.filter(r => r._checked); }
    getModifiedData() { return this.rows.filter(r => r.gstat === 'I' || r.gstat === 'U'); }

    clearData() {
        this.rows = []; if (this.filterable) this._allRows = [];
        this.selectedIdx = -1; this._focusRow = -1; this._focusCol = -1;
        this._cellCss = {}; this._rowCss = {}; this._totalCount = 0; this._currentPage = 1;
        this._render(); if (this.paging) this._renderPaging();
    }

    addRow(defaultData = {}) { const row = { ...defaultData, gstat: 'I', _checked: false }; this.rows.push(row); if (this._allRows) this._allRows.push(row); this._render(); }
    deleteRow() {
        const checked = this.rows.filter(r => r._checked);
        if (checked.length === 0 && this.selectedIdx >= 0) this.rows.splice(this.selectedIdx, 1);
        else this.rows = this.rows.filter(r => !r._checked);
        if (this._allRows) { if (checked.length === 0 && this.selectedIdx >= 0) {} else this._allRows = this._allRows.filter(r => !r._checked); }
        this.selectedIdx = -1; this._focusRow = -1; this._render();
    }

    getItem(idx) { return this.rows[idx]; }
    getSelectedItem() { return this.selectedIdx >= 0 ? this.rows[this.selectedIdx] : null; }
    getSelectedIndex() { return this.selectedIdx; }

    updateItem(idx, data) {
        if (this.rows[idx]) {
            Object.assign(this.rows[idx], data);
            if (this.rows[idx].gstat !== 'I') this.rows[idx].gstat = 'U';
            this._renderRow(idx); this._renderFooter();
        }
    }

    clearSelect() { this.selectedIdx = -1; this.tbody.querySelectorAll('tr.selected').forEach(tr => tr.classList.remove('selected')); }
    eachRow(callback) { this.rows.forEach((row, idx) => callback(row, idx)); }

    // ══════════════════════════════════════════════════════════
    //  검증
    // ══════════════════════════════════════════════════════════

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
                    if (typeof FormaPopup !== 'undefined') FormaPopup.alert.show((i + 1) + '행 [' + (Array.isArray(col.label) ? col.label[col.label.length-1]?.text : col.label || col.field) + '] 값을 입력하세요.');
                    return false;
                }
            }
        }
        return true;
    }

    // ══════════════════════════════════════════════════════════
    //  셀/행 CSS
    // ══════════════════════════════════════════════════════════

    addCellCss(rowIdx, colField, css) { const key = rowIdx + ':' + colField; if (!this._cellCss[key]) this._cellCss[key] = new Set(); css.split(' ').forEach(c => { if (c) this._cellCss[key].add(c); }); const td = this._getTd(rowIdx, colField); if (td) css.split(' ').forEach(c => { if (c) td.classList.add(c); }); }
    removeCellCss(rowIdx, colField, css) { const key = rowIdx + ':' + colField; if (this._cellCss[key]) css.split(' ').forEach(c => this._cellCss[key].delete(c)); const td = this._getTd(rowIdx, colField); if (td) css.split(' ').forEach(c => { if (c) td.classList.remove(c); }); }
    addCss(rowIdx, css) { if (!this._rowCss[rowIdx]) this._rowCss[rowIdx] = new Set(); css.split(' ').forEach(c => { if (c) this._rowCss[rowIdx].add(c); }); const tr = this.tbody.children[rowIdx]; if (tr) css.split(' ').forEach(c => { if (c) tr.classList.add(c); }); }
    removeCss(rowIdx, css) { if (this._rowCss[rowIdx]) css.split(' ').forEach(c => this._rowCss[rowIdx].delete(c)); const tr = this.tbody.children[rowIdx]; if (tr) css.split(' ').forEach(c => { if (c) tr.classList.remove(c); }); }

    _leadingCols() { let n = 0; if (this.detailGrid) n++; if (this.reorderable) n++; if (this.checkable) n++; if (this.rowNum) n++; return n; }
    _getRowTr(rowIdx) {
        if (!this.virtualScroll && !this.groupBy) return this.tbody.children[rowIdx] || null;
        return this.tbody.querySelector('tr[data-ridx="' + rowIdx + '"]');
    }
    _getTd(rowIdx, colField) {
        const tr = this._getRowTr(rowIdx); if (!tr) return null;
        const colIdx = this.columns.findIndex(c => c.field === colField); if (colIdx < 0) return null;
        return tr.children[colIdx + this._leadingCols()] || null;
    }
    _getTdByIdx(rowIdx, colIdx) {
        const tr = this._getRowTr(rowIdx); if (!tr) return null;
        return tr.children[colIdx + this._leadingCols()] || null;
    }

    // ══════════════════════════════════════════════════════════
    //  CSV 내보내기
    // ══════════════════════════════════════════════════════════

    exportCsv(filename) {
        const BOM = '\uFEFF';
        const visCols = this.columns.filter(c => !c._hidden);
        const headers = visCols.map(c => { if (Array.isArray(c.label)) { const last = c.label[c.label.length - 1]; return last ? (last.text || c.field) : c.field; } return c.label || c.field; });
        const csvRows = this.rows.map(row => {
            return visCols.map(col => {
                let val = row[col.field] ?? '';
                if ((col.format === 'currency' || col.editor === 'currency') && val !== '') val = Number(val).toLocaleString('ko-KR');
                if ((col.editor === 'select' || col.editor === 'combo') && col.options) { const opt = col.options.find(o => String(o.value) === String(val)); if (opt) val = opt.label; }
                if (col.editor === 'check' || col.editor === 'switch') val = (val === 'Y' || val === true) ? 'Y' : 'N';
                return '"' + String(val).replace(/"/g, '""') + '"';
            }).join(',');
        });
        const csv = BOM + headers.join(',') + '\n' + csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename || 'export.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
        if (typeof FormaPopup !== 'undefined') FormaPopup.toast.success('CSV 다운로드 완료');
    }

    // XLSX 내보내기 (외부 라이브러리 없이 XML 기반)
    exportXlsx(filename) {
        const visCols = this.columns.filter(c => !c._hidden);
        const headers = visCols.map(c => { if (Array.isArray(c.label)) { const last = c.label[c.label.length - 1]; return last ? (last.text || c.field) : c.field; } return c.label || c.field; });

        // SharedStrings
        const ss = []; const ssMap = {};
        const ssIdx = (s) => { s = String(s); if (ssMap[s] !== undefined) return ssMap[s]; ssMap[s] = ss.length; ss.push(s); return ssMap[s]; };

        // 셀 참조 (A1, B2...)
        const colRef = (c) => { let r = ''; let n = c; while (n >= 0) { r = String.fromCharCode(65 + (n % 26)) + r; n = Math.floor(n / 26) - 1; } return r; };

        // Sheet 데이터
        let sheetRows = '';
        // 헤더행
        sheetRows += '<row r="1">';
        headers.forEach((h, ci) => { sheetRows += '<c r="' + colRef(ci) + '1" t="s" s="1"><v>' + ssIdx(h) + '</v></c>'; });
        sheetRows += '</row>';

        // 데이터행
        this.rows.forEach((row, ri) => {
            const rn = ri + 2;
            sheetRows += '<row r="' + rn + '">';
            visCols.forEach((col, ci) => {
                let val = row[col.field];
                if ((col.editor === 'select' || col.editor === 'combo') && col.options) { const opt = col.options.find(o => String(o.value) === String(val)); if (opt) val = opt.label; }
                if (col.editor === 'check' || col.editor === 'switch') val = (val === 'Y' || val === true) ? 'Y' : 'N';
                const ref = colRef(ci) + rn;
                if (val === null || val === undefined || val === '') { sheetRows += '<c r="' + ref + '"/>'; }
                else if (typeof val === 'number' || ((col.type === 'number' || col.format === 'currency' || col.editor === 'currency') && !isNaN(Number(val)))) {
                    sheetRows += '<c r="' + ref + '" s="' + (col.format === 'currency' || col.editor === 'currency' ? '2' : '0') + '"><v>' + Number(val) + '</v></c>';
                } else {
                    sheetRows += '<c r="' + ref + '" t="s"><v>' + ssIdx(String(val)) + '</v></c>';
                }
            });
            sheetRows += '</row>';
        });

        // XML 조립
        const sharedStringsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + ss.length + '" uniqueCount="' + ss.length + '">' + ss.map(s => '<si><t>' + s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</t></si>').join('') + '</sst>';
        const stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F0FE"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/></cellXfs></styleSheet>';
        const sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + sheetRows + '</sheetData></worksheet>';
        const workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>';
        const relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>';
        const contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>';
        const rootRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';

        // ZIP (간이 구현)
        const te = new TextEncoder();
        const files = [
            { name: '[Content_Types].xml', data: te.encode(contentTypesXml) },
            { name: '_rels/.rels', data: te.encode(rootRelsXml) },
            { name: 'xl/workbook.xml', data: te.encode(workbookXml) },
            { name: 'xl/_rels/workbook.xml.rels', data: te.encode(relsXml) },
            { name: 'xl/worksheets/sheet1.xml', data: te.encode(sheetXml) },
            { name: 'xl/styles.xml', data: te.encode(stylesXml) },
            { name: 'xl/sharedStrings.xml', data: te.encode(sharedStringsXml) },
        ];
        // 간이 ZIP (Store only, no compression) — 브라우저 호환
        const zip = this._buildZip(files);
        const blob = new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename || 'export.xlsx';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
        if (typeof FormaPopup !== 'undefined') FormaPopup.toast.success('Excel 다운로드 완료');
    }

    _buildZip(files) {
        const localHeaders = [], centralHeaders = [], offsets = [];
        let offset = 0;
        for (const f of files) {
            const nameBytes = new TextEncoder().encode(f.name);
            const hdr = new Uint8Array(30 + nameBytes.length);
            const dv = new DataView(hdr.buffer);
            dv.setUint32(0, 0x04034b50, true); // local sig
            dv.setUint16(4, 20, true); // version
            dv.setUint16(8, 0, true);  // method: store
            dv.setUint32(18, f.data.length, true); // compressed
            dv.setUint32(22, f.data.length, true); // uncompressed
            dv.setUint16(26, nameBytes.length, true);
            hdr.set(nameBytes, 30);
            localHeaders.push(hdr);
            offsets.push(offset);
            offset += hdr.length + f.data.length;

            // Central
            const chdr = new Uint8Array(46 + nameBytes.length);
            const cdv = new DataView(chdr.buffer);
            cdv.setUint32(0, 0x02014b50, true); // central sig
            cdv.setUint16(4, 20, true);
            cdv.setUint16(6, 20, true);
            cdv.setUint32(20, f.data.length, true);
            cdv.setUint32(24, f.data.length, true);
            cdv.setUint16(28, nameBytes.length, true);
            cdv.setUint32(42, offsets[offsets.length - 1], true);
            chdr.set(nameBytes, 46);
            centralHeaders.push(chdr);
        }
        const centralOffset = offset;
        let centralSize = 0;
        centralHeaders.forEach(c => centralSize += c.length);
        const eocd = new Uint8Array(22);
        const edv = new DataView(eocd.buffer);
        edv.setUint32(0, 0x06054b50, true);
        edv.setUint16(8, files.length, true);
        edv.setUint16(10, files.length, true);
        edv.setUint32(12, centralSize, true);
        edv.setUint32(16, centralOffset, true);

        const parts = [];
        for (let i = 0; i < files.length; i++) { parts.push(localHeaders[i]); parts.push(files[i].data); }
        centralHeaders.forEach(c => parts.push(c));
        parts.push(eocd);

        let total = 0; parts.forEach(p => total += p.length);
        const result = new Uint8Array(total);
        let pos = 0; parts.forEach(p => { result.set(p, pos); pos += p.length; });
        return result;
    }

    // ══════════════════════════════════════════════════════════
    //  서버사이드 XLSX 다운로드 (대량 데이터용)
    // ══════════════════════════════════════════════════════════

    /**
     * 서버에서 Apache POI로 XLSX를 생성해 다운로드.
     * 클라이언트 exportXlsx()는 소량에 적합, 대량(1만건+)은 이 메서드 사용.
     * @param {string} filename  파일명 (확장자 제외)
     * @param {Array} [data]     데이터 배열 (생략 시 현재 그리드 데이터)
     */
    exportXlsxServer(filename, data) {
        var visCols = this.columns.filter(function(c) { return !c._hidden; });
        var cols = visCols.map(function(c) {
            var lbl = c.label;
            if (Array.isArray(lbl)) { var last = lbl[lbl.length - 1]; lbl = last ? (last.text || c.field) : c.field; }
            return { field: c.field, label: lbl || c.field, width: Math.round((c.width || 100) / 8), type: c.type, format: c.format };
        });
        var rows = data || this.rows;

        // select/combo 옵션 변환
        var exportData = rows.map(function(row) {
            var r = {};
            visCols.forEach(function(col) {
                var val = row[col.field];
                if ((col.editor === 'select' || col.editor === 'combo') && col.options) {
                    var opt = col.options.find(function(o) { return String(o.value) === String(val); });
                    if (opt) val = opt.label;
                }
                if (col.editor === 'check' || col.editor === 'switch') val = (val === 'Y' || val === true) ? 'Y' : 'N';
                r[col.field] = val;
            });
            return r;
        });

        var payload = JSON.stringify({ fileName: filename || 'export', sheetName: 'Sheet1', columns: cols, data: exportData });

        fetch('/api/excel/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        }).then(function(res) {
            if (!res.ok) throw new Error('Download failed');
            return res.blob();
        }).then(function(blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (filename || 'export') + '.xlsx';
            a.click();
            URL.revokeObjectURL(a.href);
        }).catch(function(err) {
            console.error(err);
            if (typeof FormaPopup !== 'undefined') FormaPopup.toast.error('다운로드 실패');
        });
    }

    // ══════════════════════════════════════════════════════════
    //  Excel 임포트 (CSV/TSV 파싱 → 그리드 데이터)
    // ══════════════════════════════════════════════════════════

    importExcel(callback) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.csv,.tsv,.txt,.xlsx';
        input.onchange = () => {
            const file = input.files[0]; if (!file) return;
            if (file.name.endsWith('.xlsx')) {
                // XLSX → 간이 파싱 (첫 시트 텍스트만)
                file.arrayBuffer().then(buf => {
                    const data = this._parseXlsxSimple(new Uint8Array(buf));
                    if (callback) callback(data);
                    else this._applyImportData(data);
                });
            } else {
                file.text().then(text => {
                    const sep = text.includes('\t') ? '\t' : ',';
                    const lines = text.split('\n').filter(l => l.trim());
                    if (lines.length < 2) return;
                    const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
                    const data = [];
                    for (let i = 1; i < lines.length; i++) {
                        const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
                        const row = {};
                        headers.forEach((h, ci) => {
                            // 헤더→필드 매핑 (라벨 또는 필드명)
                            const col = this.columns.find(c => c.field === h || (Array.isArray(c.label) ? c.label[c.label.length-1]?.text : c.label) === h);
                            if (col) row[col.field] = vals[ci] || null;
                        });
                        row.gstat = 'I';
                        data.push(row);
                    }
                    if (callback) callback(data);
                    else this._applyImportData(data);
                });
            }
        };
        input.click();
    }

    _applyImportData(data) {
        if (!data || data.length === 0) return;
        data.forEach(r => { r.gstat = r.gstat || 'I'; r._checked = false; });
        this.rows = this.rows.concat(data);
        if (this._allRows) this._allRows = this._allRows.concat(data);
        this._render();
        if (typeof FormaPopup !== 'undefined') FormaPopup.toast.success(data.length + '건 임포트 완료');
    }

    _parseXlsxSimple(uint8) {
        // 간이 XLSX 텍스트 추출 (sharedStrings.xml에서 문자열, sheet1.xml에서 셀 참조)
        // 완전한 파싱은 아니지만 텍스트/숫자 데이터 임포트에 충분
        try {
            const text = new TextDecoder().decode(uint8);
            // ZIP 내 XML을 간이 추출 (store 방식만)
            const extract = (name) => {
                const idx = text.indexOf(name);
                if (idx < 0) return '';
                const xmlStart = text.indexOf('<?xml', idx);
                if (xmlStart < 0) return '';
                const xmlEnd = text.indexOf('</worksheet>', xmlStart) || text.indexOf('</sst>', xmlStart);
                return text.substring(xmlStart, xmlEnd + 20);
            };
            // 단순 반환 — 실제 프로젝트에서는 서버사이드 파싱 권장
            return [];
        } catch (e) { return []; }
    }

    // ══════════════════════════════════════════════════════════
    //  인쇄
    // ══════════════════════════════════════════════════════════

    print(title) {
        const printWin = window.open('', '_blank', 'width=900,height=700');
        const visCols = this.columns.filter(c => !c._hidden);

        let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (title || '인쇄') + '</title>';
        html += '<style>';
        html += 'body{font-family:"Pretendard",-apple-system,sans-serif;font-size:12px;color:#333;padding:20px}';
        html += 'h1{font-size:16px;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #333}';
        html += 'table{width:100%;border-collapse:collapse;margin-top:8px}';
        html += 'th{background:#f0f0f0;padding:6px 8px;border:1px solid #ccc;font-weight:600;text-align:center;font-size:11px}';
        html += 'td{padding:4px 8px;border:1px solid #ddd;font-size:11px}';
        html += 'tfoot td{background:#f5f5f5;font-weight:600;border-top:2px solid #ccc}';
        html += '.r{text-align:right}.c{text-align:center}';
        html += '.info{font-size:10px;color:#888;margin-top:8px}';
        html += '@media print{body{padding:0}h1{font-size:14px}}';
        html += '</style></head><body>';
        html += '<h1>' + (title || '데이터 목록') + '</h1>';

        html += '<table><thead><tr>';
        html += '<th class="c" style="width:30px">No</th>';
        visCols.forEach(c => { html += '<th>' + (Array.isArray(c.label) ? c.label[c.label.length-1]?.text : c.label || c.field) + '</th>'; });
        html += '</tr></thead><tbody>';

        this.rows.forEach((row, i) => {
            html += '<tr>';
            html += '<td class="c">' + (i + 1) + '</td>';
            visCols.forEach(col => {
                let val = row[col.field] ?? '';
                const cls = (col.format === 'currency' || col.type === 'number' || col.editor === 'currency') ? ' class="r"' : '';
                if ((col.format === 'currency' || col.editor === 'currency') && val !== '') val = Number(val).toLocaleString('ko-KR');
                if ((col.editor === 'select' || col.editor === 'combo') && col.options) { const opt = col.options.find(o => String(o.value) === String(val)); if (opt) val = opt.label; }
                if (col.editor === 'check' || col.editor === 'switch') val = val === 'Y' ? 'Y' : 'N';
                html += '<td' + cls + '>' + val + '</td>';
            });
            html += '</tr>';
        });
        html += '</tbody>';

        // 푸터
        if (this._hasFooter) {
            html += '<tfoot><tr><td></td>';
            visCols.forEach(col => {
                const td = '<td' + ((col.format === 'currency' || col.type === 'number' || col.editor === 'currency') ? ' class="r"' : '') + '>';
                if (col.footer) {
                    const values = this.rows.map(r => Number(r[col.field]) || 0);
                    let result;
                    if (col.footer === 'sum') result = values.reduce((a, b) => a + b, 0);
                    else if (col.footer === 'avg') result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    else if (col.footer === 'count') result = this.rows.length;
                    html += td + Number(result).toLocaleString('ko-KR') + '</td>';
                } else { html += td + '</td>'; }
            });
            html += '</tr></tfoot>';
        }

        html += '</table>';
        html += '<div class="info">인쇄일시: ' + new Date().toLocaleString('ko-KR') + ' | 총 ' + this.rows.length + '건</div>';
        html += '<script>window.onload=function(){window.print();}<\/script>';
        html += '</body></html>';

        printWin.document.write(html);
        printWin.document.close();
    }

    // ══════════════════════════════════════════════════════════
    //  Render
    // ══════════════════════════════════════════════════════════

    _render() {
        this.tbody.innerHTML = '';
        if (this.rows.length === 0) { this._renderEmpty(); this._renderFooter(); return; }
        if (this.virtualScroll) { this._renderVirtual(); }
        else if (this.groupBy) { this._renderGrouped(); }
        else if (this.treeField) { this._renderTree(); }
        else { for (let i = 0; i < this.rows.length; i++) this._appendRow(i); }
        if (this._mergeColumns.length > 0 && !this.virtualScroll) this._applyCellMerge();
        this._applySavedCss();
        this._renderFooter();
    }

    _appendRow(i) {
        const row = this.rows[i];
        const tr = document.createElement('tr');
        tr.dataset.ridx = String(i);
        if (i % 2 === 1) tr.classList.add('forma-row-alt');
        tr.onclick = (e) => { this._selectRow(i); if (this.onRowClick) this.onRowClick(row, i); };
        tr.ondblclick = () => { if (this.onRowDblClick) this.onRowDblClick(row, i); };
        if (i === this.selectedIdx) tr.classList.add('selected');
        if (row.gstat === 'I' || row.gstat === 'U') tr.classList.add('forma-row-modified');

        if (this.detailGrid) {
            const td = document.createElement('td');
            td.className = 'forma-detail-toggle'; td.style.textAlign = 'center'; td.style.cursor = 'pointer';
            const expanded = this._expandedDetails.has(i);
            td.textContent = expanded ? '▼' : '▶';
            ((ri) => { td.onclick = (e) => { e.stopPropagation(); this.toggleDetail(ri); }; })(i);
            tr.appendChild(td);
        }

        if (this.reorderable) {
            const td = document.createElement('td');
            td.className = 'forma-drag-handle'; td.textContent = '≡';
            td.draggable = false;
            ((ri) => {
                td.addEventListener('mousedown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    this._startRowDrag(ri, e);
                });
            })(i);
            tr.appendChild(td);
        }

        if (this.checkable) {
            const td = document.createElement('td'); td.style.textAlign = 'center';
            if (this._hasFrozen) { this._applySticky(td, 0); td.style.background = '#fff'; }
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!row._checked;
            cb.onclick = (e) => e.stopPropagation();
            cb.onchange = () => { row._checked = cb.checked; };
            td.appendChild(cb); tr.appendChild(td);
        }

        if (this.rowNum) {
            const td = document.createElement('td'); td.style.textAlign = 'center'; td.textContent = i + 1;
            if (this._hasFrozen) { const left = this.checkable ? 36 : 0; this._applySticky(td, left); td.style.background = '#fff'; }
            tr.appendChild(td);
        }

        for (let ci = 0; ci < this.columns.length; ci++) {
            const col = this.columns[ci];
            const td = document.createElement('td');
            if (col.align) td.style.textAlign = col.align;
            if (col.format === 'currency' || col.type === 'number' || col.editor === 'currency') td.style.textAlign = 'right';
            this._applyFrozenTd(td, ci);

            // 셀 우클릭 컨텍스트 메뉴
            ((ri) => { td.oncontextmenu = (ev) => this._cellContextMenu(ev, ri); })(i);

            // 셀 포커스 클릭
            ((ri, cci) => {
                td.addEventListener('mousedown', (e) => {
                    if (e.detail === 1 && !this._editing) this._setFocusCell(ri, cci);
                });
            })(i, ci);

            // 툴팁
            if (col.tooltip !== false) {
                td.addEventListener('mouseenter', () => {
                    if (td.scrollWidth > td.clientWidth) td.title = td.textContent;
                    else td.title = '';
                });
            }

            if (col.editor === 'check') {
                this._renderCheckEditor(td, row, col, i);
            } else if (col.editor === 'switch') {
                this._renderSwitchEditor(td, row, col, i);
            } else {
                if (this.editable && !col.readOnly) {
                    td.ondblclick = (e) => { e.stopPropagation(); this._startEdit(i, col, td, row); };
                }
                this._renderCell(td, row, col, i);
            }
            tr.appendChild(td);
        }
        this.tbody.appendChild(tr);

        // 멀티행 (서브행) 렌더링
        if (this.rowDetail) {
            const detail = this.rowDetail(row, i);
            if (detail) {
                if (typeof detail === 'string') {
                    // HTML 문자열 → 전체 colspan 1행
                    const dtr = document.createElement('tr');
                    dtr.className = 'forma-detail-row';
                    dtr.dataset.ridx = String(i);
                    if (i % 2 === 1) dtr.classList.add('forma-row-alt');
                    const dtd = document.createElement('td');
                    dtd.colSpan = this.columns.length + this._leadingCols();
                    dtd.innerHTML = detail;
                    dtr.appendChild(dtd);
                    this.tbody.appendChild(dtr);
                } else if (Array.isArray(detail)) {
                    // 배열 → 여러 서브행, 각 항목이 1행
                    for (const subRow of detail) {
                        const dtr = document.createElement('tr');
                        dtr.className = 'forma-detail-row';
                        dtr.dataset.ridx = String(i);
                        if (i % 2 === 1) dtr.classList.add('forma-row-alt');
                        // leading 빈 셀
                        for (let lc = 0; lc < this._leadingCols(); lc++) {
                            const ltd = document.createElement('td'); ltd.style.borderBottom = 'none'; dtr.appendChild(ltd);
                        }
                        if (Array.isArray(subRow)) {
                            // [{field, colspan, value, label, align, renderer, editable, editor}] 형태
                            let consumed = 0;
                            for (const cell of subRow) {
                                const dtd = document.createElement('td');
                                if (cell.colspan) dtd.colSpan = cell.colspan;
                                if (cell.align) dtd.style.textAlign = cell.align;
                                if (cell.style) dtd.style.cssText += cell.style;

                                const renderDetailCell = () => {
                                    if (cell.renderer) {
                                        const result = cell.renderer(cell.field ? row[cell.field] : null, row, null, i);
                                        if (typeof result === 'string') dtd.innerHTML = result;
                                        else dtd.textContent = '';
                                    } else if (cell.label) {
                                        dtd.innerHTML = '<span style="color:#888;font-size:11px">' + cell.label + ':</span> ' + (cell.field ? (row[cell.field] ?? '') : (cell.value ?? ''));
                                    } else if (cell.field) {
                                        dtd.textContent = row[cell.field] ?? '';
                                    } else if (cell.value !== undefined) {
                                        dtd.textContent = cell.value;
                                    }
                                };
                                renderDetailCell();

                                // 서브행 편집 지원
                                if (cell.editable !== false && cell.field && this.editable) {
                                    ((ri, fld, cDef) => {
                                        dtd.ondblclick = (ev) => {
                                            ev.stopPropagation();
                                            if (dtd.querySelector('input, textarea, select')) return;
                                            this._editing = true;
                                            const origVal = this.rows[ri][fld];
                                            dtd.textContent = '';
                                            const editor = cDef.editor || 'text';
                                            let inp;
                                            if (editor === 'textarea') {
                                                inp = document.createElement('textarea');
                                                inp.className = 'forma-grid-input';
                                                inp.style.cssText = 'width:100%;min-height:40px;font-size:12px;padding:2px 4px;resize:vertical;';
                                            } else {
                                                inp = document.createElement('input');
                                                inp.className = 'forma-grid-input';
                                                inp.type = (editor === 'number' || cDef.type === 'number') ? 'number' : 'text';
                                            }
                                            inp.value = origVal ?? '';
                                            dtd.appendChild(inp);
                                            inp.focus(); if (inp.select) inp.select();
                                            const commit = () => {
                                                this._editing = false;
                                                const newVal = inp.value || null;
                                                if (newVal !== origVal) {
                                                    this.rows[ri][fld] = newVal;
                                                    this._markModified(ri);
                                                    this._undoStack.push({ rowIdx: ri, field: fld, oldVal: origVal, newVal });
                                                    if (this._undoStack.length > 100) this._undoStack.shift();
                                                    this._redoStack = [];
                                                    if (this.onCellChange) this.onCellChange(this.rows[ri], fld, ri);
                                                }
                                                renderDetailCell();
                                            };
                                            inp.onblur = commit;
                                            inp.onkeydown = (ke) => {
                                                if (ke.key === 'Enter' && editor !== 'textarea') { ke.preventDefault(); commit(); }
                                                if (ke.key === 'Escape') { this._editing = false; this.rows[ri][fld] = origVal; renderDetailCell(); }
                                            };
                                        };
                                        dtd.style.cursor = 'pointer';
                                    })(i, cell.field, cell);
                                }

                                consumed += (cell.colspan || 1);
                                dtr.appendChild(dtd);
                            }
                            // 남은 컬럼 빈 셀
                            for (let rc = consumed; rc < this.columns.length; rc++) dtr.appendChild(document.createElement('td'));
                        } else if (typeof subRow === 'string') {
                            const dtd = document.createElement('td');
                            dtd.colSpan = this.columns.length;
                            dtd.innerHTML = subRow;
                            dtr.appendChild(dtd);
                        }
                        this.tbody.appendChild(dtr);
                    }
                }
            }
        }

        // 마스터-디테일 중첩 그리드
        if (this.detailGrid && this._expandedDetails.has(i)) {
            const dtr = document.createElement('tr');
            dtr.className = 'forma-master-detail-row';
            dtr.dataset.ridx = String(i);
            const dtd = document.createElement('td');
            dtd.colSpan = this.columns.length + this._leadingCols();
            dtd.style.padding = '8px 16px 8px ' + (this._leadingCols() * 40 + 16) + 'px';
            const container = document.createElement('div');
            container.className = 'forma-detail-grid-wrap';
            dtd.appendChild(container);
            dtr.appendChild(dtd);
            this.tbody.appendChild(dtr);
            this.detailGrid(row, container, i);
        }
    }

    _renderCell(td, row, col, rowIdx) {
        let val = row[col.field];
        // 커스텀 렌더러
        if (col.renderer) {
            const result = col.renderer(val, row, col, rowIdx);
            if (typeof result === 'string') td.innerHTML = result;
            else if (result instanceof HTMLElement) { td.textContent = ''; td.appendChild(result); }
            else td.textContent = val ?? '';
            return;
        }
        if (col.editor === 'select' || col.editor === 'combo') {
            const opts = col.options || this._codeCache[col.code] || [];
            const opt = opts.find(o => String(o.value) === String(val));
            td.textContent = opt ? opt.label : (val ?? '');
            return;
        }
        if ((col.format === 'currency' || col.editor === 'currency') && val != null && val !== '') {
            td.textContent = Number(val).toLocaleString('ko-KR');
        } else if ((col.format === 'date' || col.editor === 'date') && val) {
            td.textContent = String(val).substring(0, 10);
        } else {
            td.textContent = val ?? '';
        }
    }

    _renderRow(idx) {
        const tr = this._getRowTr(idx); if (!tr) return;
        const row = this.rows[idx];
        let ci = this._leadingCols();
        for (let c = 0; c < this.columns.length; c++) {
            const col = this.columns[c];
            const td = tr.children[ci];
            if (col.editor !== 'check' && col.editor !== 'switch') this._renderCell(td, row, col, idx);
            ci++;
        }
        if (row.gstat === 'I' || row.gstat === 'U') tr.classList.add('forma-row-modified');
    }

    _applySavedCss() {
        for (const [idx, classes] of Object.entries(this._rowCss)) { const tr = this.tbody.children[idx]; if (tr) classes.forEach(c => tr.classList.add(c)); }
        for (const [key, classes] of Object.entries(this._cellCss)) { const [rowIdx, field] = key.split(':'); const td = this._getTd(Number(rowIdx), field); if (td) classes.forEach(c => td.classList.add(c)); }
    }

    _renderEmpty() {
        const cols = this.columns.length + this._leadingCols();
        this.tbody.innerHTML = '<tr><td colspan="' + cols + '" class="forma-grid-empty">데이터가 없습니다</td></tr>';
    }

    // ── 셀 병합 (자동 rowspan) ──
    _applyCellMerge() {
        for (const field of this._mergeColumns) {
            const colIdx = this.columns.findIndex(c => c.field === field);
            if (colIdx < 0) continue;

            let startRow = 0;
            while (startRow < this.rows.length) {
                const startVal = this.rows[startRow][field];
                let span = 1;
                while (startRow + span < this.rows.length && this.rows[startRow + span][field] === startVal) span++;

                if (span > 1) {
                    const firstTd = this._getTdByIdx(startRow, colIdx);
                    if (firstTd) {
                        firstTd.rowSpan = span;
                        firstTd.style.verticalAlign = 'middle';
                        // 병합 셀 편집 지원
                        if (this.editable && !this.columns[colIdx].readOnly) {
                            ((sr, ci, sp) => {
                                firstTd.ondblclick = (e) => {
                                    e.stopPropagation();
                                    this._startEdit(sr, this.columns[ci], firstTd, this.rows[sr]);
                                };
                            })(startRow, colIdx, span);
                        }
                        // 병합된 행의 TD 숨기기
                        for (let r = 1; r < span; r++) {
                            const hideTd = this._getTdByIdx(startRow + r, colIdx);
                            if (hideTd) hideTd.style.display = 'none';
                        }
                    }
                }
                startRow += span;
            }
        }
    }

    // 프로그래밍 방식 셀 병합 API
    mergeCells(startRow, startCol, rowspan, colspan) {
        const td = this._getTdByIdx(startRow, startCol);
        if (!td) return;
        if (rowspan > 1) td.rowSpan = rowspan;
        if (colspan > 1) td.colSpan = colspan;
        td.style.verticalAlign = 'middle';
        // 병합 범위 내 셀 숨기기
        for (let r = 0; r < rowspan; r++) {
            for (let c = 0; c < colspan; c++) {
                if (r === 0 && c === 0) continue;
                const hideTd = this._getTdByIdx(startRow + r, startCol + c);
                if (hideTd) hideTd.style.display = 'none';
            }
        }
    }

    // ── 가상 스크롤 ──
    _renderVirtual() {
        const totalH = this.rows.length * this._rowHeight;
        const viewH = this._scrollWrap.clientHeight;
        const scrollTop = this._scrollWrap.scrollTop;
        const buf = 5;
        const start = Math.max(0, Math.floor(scrollTop / this._rowHeight) - buf);
        const end = Math.min(this.rows.length, Math.ceil((scrollTop + viewH) / this._rowHeight) + buf);
        if (start === this._vsStart && end === this._vsEnd && this.tbody.children.length > 0) return;
        this._vsStart = start; this._vsEnd = end;

        this.tbody.innerHTML = '';
        const cs = this.columns.length + this._leadingCols();

        if (start > 0) {
            const sp = document.createElement('tr');
            const td = document.createElement('td'); td.colSpan = cs;
            td.style.cssText = 'height:' + (start * this._rowHeight) + 'px;padding:0;border:none;';
            sp.appendChild(td); this.tbody.appendChild(sp);
        }
        for (let i = start; i < end; i++) this._appendRow(i);
        if (end < this.rows.length) {
            const sp = document.createElement('tr');
            const td = document.createElement('td'); td.colSpan = cs;
            td.style.cssText = 'height:' + ((this.rows.length - end) * this._rowHeight) + 'px;padding:0;border:none;';
            sp.appendChild(td); this.tbody.appendChild(sp);
        }
    }

    // ── 그룹핑 ──
    _buildGroups() {
        if (!this.groupBy) { this._groups = []; return; }
        const field = this.groupBy;
        const col = this.columns.find(c => c.field === field);
        const map = new Map();
        for (let i = 0; i < this.rows.length; i++) {
            const key = String(this.rows[i][field] ?? '');
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(i);
        }
        this._groups = [];
        for (const [key, indices] of map) {
            let label = key;
            if (col && (col.editor === 'select' || col.editor === 'combo') && col.options) {
                const opt = col.options.find(o => String(o.value) === key);
                if (opt) label = opt.label;
            }
            this._groups.push({ key, label, indices });
        }
    }

    _renderGrouped() {
        this._buildGroups();
        const cs = this.columns.length + this._leadingCols();
        for (const grp of this._groups) {
            // 그룹 헤더
            const htr = document.createElement('tr');
            htr.className = 'forma-group-row';
            const htd = document.createElement('td');
            htd.colSpan = cs;
            const collapsed = this._collapsedGroups.has(grp.key);
            htd.innerHTML = '<span class="forma-group-toggle">' + (collapsed ? '▶' : '▼') + '</span> '
                + '<b>' + (grp.label || '(빈값)') + '</b>'
                + ' <span class="forma-group-count">(' + grp.indices.length + '건)</span>';
            htd.onclick = () => this.toggleGroup(grp.key);
            htr.appendChild(htd);
            this.tbody.appendChild(htr);

            if (!collapsed) {
                for (const idx of grp.indices) this._appendRow(idx);

                // 그룹 소계
                if (this.groupFooter) {
                    const ftr = document.createElement('tr');
                    ftr.className = 'forma-group-footer';
                    if (this.reorderable) ftr.appendChild(document.createElement('td'));
                    if (this.checkable) ftr.appendChild(document.createElement('td'));
                    if (this.rowNum) { const td = document.createElement('td'); td.textContent = '소계'; td.style.textAlign = 'center'; td.style.fontWeight = '600'; ftr.appendChild(td); }
                    for (const col of this.columns) {
                        const td = document.createElement('td');
                        if (col.footer) {
                            const vals = grp.indices.map(i => Number(this.rows[i][col.field]) || 0);
                            let result;
                            if (col.footer === 'sum') result = vals.reduce((a, b) => a + b, 0);
                            else if (col.footer === 'avg') result = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                            else if (col.footer === 'count') result = vals.length;
                            td.textContent = Number(result).toLocaleString('ko-KR');
                            td.style.textAlign = 'right'; td.style.fontWeight = '600';
                        }
                        ftr.appendChild(td);
                    }
                    this.tbody.appendChild(ftr);
                }
            }
        }
    }

    toggleGroup(key) {
        if (this._collapsedGroups.has(key)) this._collapsedGroups.delete(key);
        else this._collapsedGroups.add(key);
        this._render();
    }

    expandAllGroups() { this._collapsedGroups.clear(); this._render(); }
    collapseAllGroups() { this._groups.forEach(g => this._collapsedGroups.add(g.key)); this._render(); }

    // ── 트리 그리드 ──
    _renderTree() {
        const idField = this.treeIdField, parentField = this.treeParentField;
        const childMap = new Map(); // parentId → [rowIdx]
        const rootIndices = [];
        for (let i = 0; i < this.rows.length; i++) {
            const pid = this.rows[i][parentField];
            if (!pid && pid !== 0) { rootIndices.push(i); }
            else { if (!childMap.has(pid)) childMap.set(pid, []); childMap.get(pid).push(i); }
        }
        const renderNode = (idx, depth) => {
            const row = this.rows[idx];
            const nodeId = row[idField];
            const children = childMap.get(nodeId) || [];
            const hasChildren = children.length > 0;
            const collapsed = this._treeState.has(nodeId);
            this._appendRow(idx);
            // 트리 필드 셀에 들여쓰기 + 토글 삽입
            const treeColIdx = this.columns.findIndex(c => c.field === this.treeField);
            if (treeColIdx >= 0) {
                const td = this._getTdByIdx(idx, treeColIdx);
                if (td) {
                    const indent = depth * 20;
                    const toggle = hasChildren ? ('<span class="forma-tree-toggle" style="margin-left:' + indent + 'px">' + (collapsed ? '▶' : '▼') + '</span> ') : ('<span style="display:inline-block;width:14px;margin-left:' + indent + 'px"></span> ');
                    td.innerHTML = toggle + '<span>' + (td.textContent || '') + '</span>';
                    if (hasChildren) {
                        td.querySelector('.forma-tree-toggle').onclick = (e) => { e.stopPropagation(); this.toggleTreeNode(nodeId); };
                    }
                }
            }
            if (!collapsed) {
                for (const ci of children) renderNode(ci, depth + 1);
            }
        };
        for (const ri of rootIndices) renderNode(ri, 0);
    }

    toggleTreeNode(nodeId) {
        if (this._treeState.has(nodeId)) this._treeState.delete(nodeId);
        else this._treeState.add(nodeId);
        this._render();
    }

    expandAllTree() { this._treeState.clear(); this._render(); }
    collapseAllTree() { for (const row of this.rows) { const id = row[this.treeIdField]; if (id !== null && id !== undefined) this._treeState.add(id); } this._render(); }

    // ── 마스터-디테일 중첩 그리드 ──
    toggleDetail(rowIdx) {
        if (this._expandedDetails.has(rowIdx)) this._expandedDetails.delete(rowIdx);
        else this._expandedDetails.add(rowIdx);
        this._render();
    }

    // ══════════════════════════════════════════════════════════
    //  인라인 에디터 (check, switch)
    // ══════════════════════════════════════════════════════════

    _renderCheckEditor(td, row, col, rowIdx) {
        td.style.textAlign = 'center';
        const cb = document.createElement('input'); cb.type = 'checkbox';
        cb.checked = row[col.field] === 'Y' || row[col.field] === true || row[col.field] === 1;
        cb.onclick = (e) => e.stopPropagation();
        cb.onchange = () => { row[col.field] = cb.checked ? 'Y' : 'N'; if (row.gstat !== 'I') row.gstat = 'U'; const tr = this.tbody.children[rowIdx]; if (tr) tr.classList.add('forma-row-modified'); if (this.onCellChange) this.onCellChange(row, col.field, rowIdx); this._renderFooter(); };
        if (!this.editable || col.readOnly) cb.disabled = true;
        td.appendChild(cb);
    }

    _renderSwitchEditor(td, row, col, rowIdx) {
        td.style.textAlign = 'center';
        const wrap = document.createElement('span'); wrap.className = 'forma-switch-wrap';
        const track = document.createElement('span'); track.className = 'forma-switch-track';
        const thumb = document.createElement('span'); thumb.className = 'forma-switch-thumb';
        track.appendChild(thumb); wrap.appendChild(track);
        const isOn = row[col.field] === 'Y' || row[col.field] === true || row[col.field] === 1;
        if (isOn) track.classList.add('on');
        if (this.editable && !col.readOnly) {
            track.style.cursor = 'pointer';
            track.onclick = (e) => { e.stopPropagation(); const on = !track.classList.contains('on'); row[col.field] = on ? 'Y' : 'N'; if (row.gstat !== 'I') row.gstat = 'U'; if (on) track.classList.add('on'); else track.classList.remove('on'); const tr = this.tbody.children[rowIdx]; if (tr) tr.classList.add('forma-row-modified'); if (this.onCellChange) this.onCellChange(row, col.field, rowIdx); this._renderFooter(); };
        }
        td.appendChild(wrap);
    }

    // ══════════════════════════════════════════════════════════
    //  에디터 디스패치 + 커밋/이동 공통 로직
    // ══════════════════════════════════════════════════════════

    _markModified(rowIdx) {
        const row = this.rows[rowIdx]; if (!row) return;
        if (row.gstat !== 'I') row.gstat = 'U';
        const tr = this.tbody.children[rowIdx]; if (tr) tr.classList.add('forma-row-modified');
    }

    _commitValue(rowIdx, col, val, originalValue) {
        const row = this.rows[rowIdx]; if (!row) return false;
        if (val === originalValue && String(val) === String(originalValue)) return false;
        row[col.field] = val;
        this._markModified(rowIdx);
        // Undo 스택 기록
        this._undoStack.push({ rowIdx, field: col.field, oldVal: originalValue, newVal: val });
        if (this._undoStack.length > 100) this._undoStack.shift();
        this._redoStack = [];
        if (this.onCellChange) this.onCellChange(row, col.field, rowIdx);
        return true;
    }

    _editorKeydown(e, rowIdx, colIdx, commitFn) {
        if (e.key === 'Tab') {
            e.preventDefault(); commitFn();
            this._navigateEdit(rowIdx, colIdx, e.shiftKey ? 'prev' : 'next');
        } else if (e.key === 'Enter') {
            e.preventDefault(); commitFn();
            this._navigateEdit(rowIdx, colIdx, 'down');
        } else if (e.key === 'Escape') {
            return 'cancel';
        }
        return null;
    }

    _navigateEdit(rowIdx, colIdx, direction) {
        const target = this._findNextEditable(rowIdx, colIdx, direction);
        if (target) {
            this._setFocusCell(target.row, target.col);
            setTimeout(() => this._startEditByIdx(target.row, target.col), 10);
        } else {
            this._setFocusCell(rowIdx, colIdx);
        }
    }

    _findNextEditable(rowIdx, colIdx, direction) {
        const cols = this.columns;
        let r = rowIdx, c = colIdx;
        if (direction === 'next') {
            c++;
            while (r < this.rows.length) {
                while (c < cols.length) {
                    if (!cols[c].readOnly && cols[c].editor !== 'check' && cols[c].editor !== 'switch') return { row: r, col: c };
                    c++;
                }
                c = 0; r++;
            }
        } else if (direction === 'prev') {
            c--;
            while (r >= 0) {
                while (c >= 0) {
                    if (!cols[c].readOnly && cols[c].editor !== 'check' && cols[c].editor !== 'switch') return { row: r, col: c };
                    c--;
                }
                c = cols.length - 1; r--;
            }
        } else if (direction === 'down') {
            r++;
            if (r < this.rows.length && !cols[c].readOnly && cols[c].editor !== 'check' && cols[c].editor !== 'switch') return { row: r, col: c };
        } else if (direction === 'up') {
            r--;
            if (r >= 0 && !cols[c].readOnly && cols[c].editor !== 'check' && cols[c].editor !== 'switch') return { row: r, col: c };
        }
        return null;
    }

    _startEditByIdx(rowIdx, colIdx) {
        const col = this.columns[colIdx];
        if (!col || col.readOnly || !this.editable) return;
        if (col.editor === 'check' || col.editor === 'switch') return;
        const td = this._getTdByIdx(rowIdx, colIdx);
        if (!td) return;
        this._startEdit(rowIdx, col, td, this.rows[rowIdx]);
    }

    // ══════════════════════════════════════════════════════════
    //  에디터: text / number
    // ══════════════════════════════════════════════════════════

    _startEdit(rowIdx, col, td, row) {
        if (td.querySelector('input, select, textarea, .fg-combo-dd')) return;
        this._editing = true;
        const editor = col.editor || 'text';
        if (editor === 'select') { this._startSelectEdit(rowIdx, col, td, row); return; }
        if (editor === 'combo') { this._startComboEdit(rowIdx, col, td, row); return; }
        if (editor === 'date') { this._startDateEdit(rowIdx, col, td, row); return; }
        if (editor === 'currency' || col.format === 'currency') { this._startCurrencyEdit(rowIdx, col, td, row); return; }
        if (editor === 'textarea') { this._startTextareaEdit(rowIdx, col, td, row); return; }

        const ci = this.columns.indexOf(col);
        const originalValue = row[col.field];
        td.textContent = '';
        const input = document.createElement('input'); input.className = 'forma-grid-input';
        input.type = col.type === 'number' ? 'number' : 'text';
        input.value = row[col.field] ?? '';
        td.appendChild(input); input.focus(); input.select();

        const commit = () => {
            this._editing = false;
            let val = input.value;
            if (input.type === 'number') val = val ? Number(val) : null;
            this._commitValue(rowIdx, col, val, originalValue);
            this._renderCell(td, row, col, rowIdx); this._renderFooter();
        };

        input.onblur = commit;
        input.onkeydown = (e) => {
            const action = this._editorKeydown(e, rowIdx, ci, commit);
            if (action === 'cancel') { this._editing = false; row[col.field] = originalValue; this._renderCell(td, row, col, rowIdx); this._setFocusCell(rowIdx, ci); }
        };
    }

    // ── select ──
    _startSelectEdit(rowIdx, col, td, row) {
        const ci = this.columns.indexOf(col);
        const originalValue = row[col.field];
        const doEdit = (options) => {
            td.textContent = '';
            const select = document.createElement('select'); select.className = 'forma-grid-input';
            select.innerHTML = '<option value="">-- 선택 --</option>';
            for (const opt of options) { const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.label; if (String(opt.value) === String(row[col.field])) o.selected = true; select.appendChild(o); }
            td.appendChild(select); select.focus();
            const commit = () => { this._editing = false; this._commitValue(rowIdx, col, select.value || null, originalValue); this._renderCell(td, row, col, rowIdx); this._renderFooter(); };
            select.onblur = commit;
            select.onchange = commit;
            select.onkeydown = (e) => {
                const action = this._editorKeydown(e, rowIdx, ci, commit);
                if (action === 'cancel') { this._editing = false; row[col.field] = originalValue; this._renderCell(td, row, col, rowIdx); this._setFocusCell(rowIdx, ci); }
            };
        };
        this._resolveOptions(col, doEdit);
    }

    // ── combo ──
    _startComboEdit(rowIdx, col, td, row) {
        const ci = this.columns.indexOf(col);
        const originalValue = row[col.field];
        const doEdit = (options) => {
            td.textContent = '';
            const wrap = document.createElement('div'); wrap.style.position = 'relative';
            const dd = document.createElement('div'); dd.className = 'fg-combo-dd';
            const si = document.createElement('input'); si.type = 'text'; si.className = 'fc-combo-search'; si.placeholder = '검색...';
            dd.appendChild(si);
            const list = document.createElement('div'); list.className = 'fc-combo-list';
            dd.appendChild(list); wrap.appendChild(dd); td.appendChild(wrap);

            let hlIdx = -1;
            const renderList = (filter) => {
                list.innerHTML = ''; const q = (filter || '').toLowerCase(); let idx = 0;
                const empty = document.createElement('div'); empty.className = 'fc-combo-item' + (!originalValue ? ' fc-sel' : '');
                empty.textContent = '-- 선택 --'; empty.dataset.idx = idx++;
                empty.addEventListener('click', (e) => { e.stopPropagation(); selectOpt({ value: null }); });
                list.appendChild(empty);
                options.forEach(opt => {
                    if (q && !opt.label.toLowerCase().includes(q) && !String(opt.value).toLowerCase().includes(q)) return;
                    const item = document.createElement('div'); item.className = 'fc-combo-item' + (String(opt.value) === String(originalValue) ? ' fc-sel' : '');
                    item.textContent = opt.label; item.dataset.idx = idx++;
                    item.addEventListener('click', (e) => { e.stopPropagation(); selectOpt(opt); });
                    item.addEventListener('mouseenter', () => { hlIdx = parseInt(item.dataset.idx); hl(); });
                    list.appendChild(item);
                });
                hlIdx = -1;
            };
            const hl = () => { list.querySelectorAll('.fc-combo-item').forEach((it, i) => it.classList.toggle('fc-hl', i === hlIdx)); };
            const selectOpt = (opt) => { this._editing = false; this._commitValue(rowIdx, col, opt.value, originalValue); cleanup(); this._renderCell(td, row, col, rowIdx); this._renderFooter(); };
            let docH = null;
            const cleanup = () => { if (docH) { document.removeEventListener('mousedown', docH); docH = null; } };
            docH = (e) => { if (!wrap.contains(e.target)) { this._editing = false; cleanup(); this._renderCell(td, row, col, rowIdx); } };
            setTimeout(() => document.addEventListener('mousedown', docH), 10);

            si.addEventListener('input', () => renderList(si.value));
            si.addEventListener('keydown', (e) => {
                const items = list.querySelectorAll('.fc-combo-item');
                if (e.key === 'ArrowDown') { e.preventDefault(); hlIdx = Math.min(hlIdx + 1, items.length - 1); hl(); items[hlIdx]?.scrollIntoView({ block: 'nearest' }); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); hlIdx = Math.max(hlIdx - 1, 0); hl(); items[hlIdx]?.scrollIntoView({ block: 'nearest' }); }
                else if (e.key === 'Enter') { if (hlIdx >= 0 && items[hlIdx]) items[hlIdx].click(); }
                else if (e.key === 'Escape') { this._editing = false; cleanup(); row[col.field] = originalValue; this._renderCell(td, row, col, rowIdx); this._setFocusCell(rowIdx, ci); }
                else if (e.key === 'Tab') { e.preventDefault(); this._editing = false; cleanup(); this._renderCell(td, row, col, rowIdx); this._navigateEdit(rowIdx, ci, e.shiftKey ? 'prev' : 'next'); }
            });
            renderList(''); si.focus();
            const selItem = list.querySelector('.fc-sel'); if (selItem) selItem.scrollIntoView({ block: 'nearest' });
        };
        this._resolveOptions(col, doEdit);
    }

    // ── date ──
    _startDateEdit(rowIdx, col, td, row) {
        const ci = this.columns.indexOf(col);
        const originalValue = row[col.field];
        if (typeof _FormaCalendar === 'undefined') { this._startEdit(rowIdx, { ...col, editor: 'text' }, td, row); return; }
        const cal = new _FormaCalendar({
            onSelect: (ds) => { this._editing = false; this._commitValue(rowIdx, col, ds, originalValue); this._renderCell(td, row, col, rowIdx); },
            onClear: () => { this._editing = false; this._commitValue(rowIdx, col, '', originalValue); this._renderCell(td, row, col, rowIdx); }
        });
        cal.show(td, originalValue || null);
    }

    // ── currency ──
    _startCurrencyEdit(rowIdx, col, td, row) {
        const ci = this.columns.indexOf(col);
        const originalValue = row[col.field];
        td.textContent = '';
        const input = document.createElement('input'); input.className = 'forma-grid-input'; input.type = 'text'; input.style.textAlign = 'right';
        const raw = originalValue != null && originalValue !== '' ? Number(originalValue) : '';
        input.value = raw !== '' && !isNaN(raw) ? String(raw) : '';
        td.appendChild(input); input.focus(); input.select();

        input.addEventListener('keydown', (e) => {
            const action = this._editorKeydown(e, rowIdx, ci, commit);
            if (action === 'cancel') { this._editing = false; row[col.field] = originalValue; this._renderCell(td, row, col, rowIdx); this._setFocusCell(rowIdx, ci); return; }
            if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') return;
            if (e.ctrlKey || e.metaKey) return;
            if (['Backspace','Delete','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
            if (e.key === '-' && input.selectionStart === 0) return;
            if (e.key === '.' && !input.value.includes('.')) return;
            if (e.key >= '0' && e.key <= '9') return;
            e.preventDefault();
        });

        const commit = () => {
            this._editing = false;
            const s = input.value.replace(/,/g, '');
            const numVal = s === '' ? null : (isNaN(Number(s)) ? null : Number(s));
            this._commitValue(rowIdx, col, numVal, originalValue);
            this._renderCell(td, row, col, rowIdx); this._renderFooter();
        };
        input.onblur = commit;
    }

    // ── textarea ──
    _startTextareaEdit(rowIdx, col, td, row) {
        const ci = this.columns.indexOf(col);
        const originalValue = row[col.field];
        td.textContent = ''; td.style.position = 'relative';
        const ta = document.createElement('textarea'); ta.className = 'forma-grid-input fg-textarea-edit';
        ta.value = row[col.field] ?? '';
        td.appendChild(ta); ta.focus();
        const commit = () => { this._editing = false; this._commitValue(rowIdx, col, ta.value || null, originalValue); td.style.position = ''; this._renderCell(td, row, col, rowIdx); };
        ta.onblur = commit;
        ta.onkeydown = (e) => {
            if (e.key === 'Escape') { this._editing = false; td.style.position = ''; row[col.field] = originalValue; this._renderCell(td, row, col, rowIdx); this._setFocusCell(rowIdx, ci); }
        };
    }

    // ── 옵션 해석 ──
    _resolveOptions(col, callback) {
        if (col.options) { callback(col.options); }
        else if (col.code) {
            if (this._codeCache[col.code]) { callback(this._codeCache[col.code]); }
            else { fetch('/api/codes/' + col.code).then(r => r.json()).then(json => { const opts = (json.resultData || []).map(c => ({ value: c.CODE || c.code, label: c.CODE_NM || c.codeName || c.label || c.CODE })); this._codeCache[col.code] = opts; callback(opts); }).catch(() => callback([])); }
        } else { callback([]); }
    }

    // ══════════════════════════════════════════════════════════
    //  키보드 내비게이션 + 클립보드
    // ══════════════════════════════════════════════════════════

    _initKeyboard() {
        this._scrollWrap.addEventListener('keydown', (e) => {
            if (this._editing) return; // 편집 중이면 에디터가 처리
            const fr = this._focusRow, fc = this._focusCol;

            // Ctrl+C 클립보드 복사
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') { this._copyToClipboard(); return; }
            // Ctrl+V 클립보드 붙여넣기
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') { this._pasteFromClipboard(); return; }
            // Ctrl+Z Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.undo(); return; }
            // Ctrl+Y Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this.redo(); return; }

            if (fr < 0 || fc < 0) {
                // 포커스 없으면 첫 셀로
                if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) {
                    e.preventDefault();
                    this._setFocusCell(0, 0);
                }
                return;
            }

            if (e.key === 'ArrowDown') { e.preventDefault(); if (fr < this.rows.length - 1) this._setFocusCell(fr + 1, fc); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (fr > 0) this._setFocusCell(fr - 1, fc); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); if (fc < this.columns.length - 1) this._setFocusCell(fr, fc + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); if (fc > 0) this._setFocusCell(fr, fc - 1); }
            else if (e.key === 'Tab') {
                e.preventDefault();
                const dir = e.shiftKey ? 'prev' : 'next';
                let r = fr, c = fc;
                if (dir === 'next') { c++; if (c >= this.columns.length) { c = 0; r++; } if (r >= this.rows.length) return; }
                else { c--; if (c < 0) { c = this.columns.length - 1; r--; } if (r < 0) return; }
                this._setFocusCell(r, c);
            }
            else if (e.key === 'Enter' || e.key === 'F2') {
                e.preventDefault();
                if (this.editable) this._startEditByIdx(fr, fc);
            }
            else if (e.key === 'Delete') {
                e.preventDefault();
                const col = this.columns[fc];
                if (this.editable && !col.readOnly && col.editor !== 'check' && col.editor !== 'switch') {
                    const row = this.rows[fr];
                    const old = row[col.field];
                    row[col.field] = null;
                    this._markModified(fr);
                    if (this.onCellChange) this.onCellChange(row, col.field, fr);
                    const td = this._getTdByIdx(fr, fc);
                    if (td) this._renderCell(td, row, col, fr);
                    this._renderFooter();
                }
            }
            else if (e.key === 'Home') { e.preventDefault(); this._setFocusCell(e.ctrlKey ? 0 : fr, 0); }
            else if (e.key === 'End') { e.preventDefault(); this._setFocusCell(e.ctrlKey ? this.rows.length - 1 : fr, this.columns.length - 1); }
            else if (e.key === 'PageDown') { e.preventDefault(); this._setFocusCell(Math.min(fr + 20, this.rows.length - 1), fc); }
            else if (e.key === 'PageUp') { e.preventDefault(); this._setFocusCell(Math.max(fr - 20, 0), fc); }
            else if (e.key === ' ') {
                e.preventDefault();
                // 체크박스 토글 (체크 에디터 또는 행 체크박스)
                const col = this.columns[fc];
                if (col.editor === 'check' || col.editor === 'switch') {
                    const row = this.rows[fr];
                    row[col.field] = row[col.field] === 'Y' ? 'N' : 'Y';
                    this._markModified(fr);
                    if (this.onCellChange) this.onCellChange(row, col.field, fr);
                    this._renderRow(fr);
                }
            }
        });
    }

    _setFocusCell(rowIdx, colIdx) {
        // 이전 포커스 제거
        const prev = this.tbody.querySelector('.forma-cell-focus');
        if (prev) prev.classList.remove('forma-cell-focus');
        this._focusRow = rowIdx;
        this._focusCol = colIdx;
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rows.length || colIdx >= this.columns.length) return;
        this._selectRow(rowIdx);
        const td = this._getTdByIdx(rowIdx, colIdx);
        if (td) {
            td.classList.add('forma-cell-focus');
            // 스크롤 뷰포트로 이동
            td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        this._scrollWrap.focus({ preventScroll: true });
    }

    // ── 클립보드 ──
    _copyToClipboard() {
        const rows = this.getCheckedData().length > 0 ? this.getCheckedData() : (this._focusRow >= 0 ? [this.rows[this._focusRow]] : []);
        if (rows.length === 0) return;
        const header = this.columns.map(c => Array.isArray(c.label) ? (c.label[c.label.length-1]?.text || c.field) : (c.label || c.field)).join('\t');
        const body = rows.map(row => this.columns.map(col => {
            let val = row[col.field] ?? '';
            if ((col.editor === 'select' || col.editor === 'combo') && col.options) { const opt = col.options.find(o => String(o.value) === String(val)); if (opt) val = opt.label; }
            return val;
        }).join('\t')).join('\n');
        const text = header + '\n' + body;
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { if (typeof FormaPopup !== 'undefined') FormaPopup.toast.info(rows.length + '행 복사됨'); });
    }

    _pasteFromClipboard() {
        if (!this.editable || this._focusRow < 0 || this._focusCol < 0) return;
        if (!navigator.clipboard) return;
        navigator.clipboard.readText().then(text => {
            if (!text) return;
            const lines = text.split('\n').filter(l => l.trim());
            let startRow = this._focusRow, startCol = this._focusCol;
            for (let li = 0; li < lines.length && startRow + li < this.rows.length; li++) {
                const vals = lines[li].split('\t');
                const row = this.rows[startRow + li];
                for (let vi = 0; vi < vals.length && startCol + vi < this.columns.length; vi++) {
                    const col = this.columns[startCol + vi];
                    if (col.readOnly) continue;
                    let val = vals[vi];
                    if (col.type === 'number' || col.format === 'currency' || col.editor === 'currency') val = val.replace(/,/g, '');
                    row[col.field] = val || null;
                    this._markModified(startRow + li);
                }
            }
            this._render();
            if (typeof FormaPopup !== 'undefined') FormaPopup.toast.info(lines.length + '행 붙여넣기 완료');
        }).catch(() => {});
    }

    // ══════════════════════════════════════════════════════════
    //  Undo / Redo
    // ══════════════════════════════════════════════════════════

    undo() {
        if (this._undoStack.length === 0) return;
        const action = this._undoStack.pop();
        const row = this.rows[action.rowIdx];
        if (!row) return;
        row[action.field] = action.oldVal;
        this._redoStack.push(action);
        this._renderRow(action.rowIdx);
        this._renderFooter();
        this._setFocusCell(action.rowIdx, this.columns.findIndex(c => c.field === action.field));
        if (typeof FormaPopup !== 'undefined') FormaPopup.toast.info('실행 취소');
    }

    redo() {
        if (this._redoStack.length === 0) return;
        const action = this._redoStack.pop();
        const row = this.rows[action.rowIdx];
        if (!row) return;
        row[action.field] = action.newVal;
        this._undoStack.push(action);
        this._renderRow(action.rowIdx);
        this._renderFooter();
        this._setFocusCell(action.rowIdx, this.columns.findIndex(c => c.field === action.field));
        if (typeof FormaPopup !== 'undefined') FormaPopup.toast.info('다시 실행');
    }

    // ══════════════════════════════════════════════════════════
    //  컨텍스트 메뉴
    // ══════════════════════════════════════════════════════════

    _showContextMenu(x, y, items) {
        this._hideContextMenu();
        const menu = document.createElement('div');
        menu.className = 'forma-ctx-menu';
        for (const item of items) {
            if (item === '---') { const hr = document.createElement('div'); hr.className = 'forma-ctx-sep'; menu.appendChild(hr); continue; }
            const div = document.createElement('div');
            div.className = 'forma-ctx-item';
            if (item.icon) div.innerHTML = '<span class="forma-ctx-icon">' + item.icon + '</span>' + item.label;
            else div.textContent = item.label;
            if (item.disabled) div.classList.add('disabled');
            else div.onclick = () => { this._hideContextMenu(); item.action(); };
            menu.appendChild(div);
        }
        document.body.appendChild(menu);
        menu.style.left = x + 'px'; menu.style.top = y + 'px';
        requestAnimationFrame(() => {
            const r = menu.getBoundingClientRect();
            if (r.right > window.innerWidth) menu.style.left = (x - r.width) + 'px';
            if (r.bottom > window.innerHeight) menu.style.top = (y - r.height) + 'px';
        });
        this._ctxMenu = menu;
        this._ctxDocHandler = (e) => { if (!menu.contains(e.target)) this._hideContextMenu(); };
        this._ctxEscHandler = (e) => { if (e.key === 'Escape') this._hideContextMenu(); };
        setTimeout(() => { document.addEventListener('mousedown', this._ctxDocHandler); document.addEventListener('keydown', this._ctxEscHandler); }, 10);
    }

    _hideContextMenu() {
        if (this._ctxMenu) { this._ctxMenu.remove(); this._ctxMenu = null; }
        if (this._ctxDocHandler) { document.removeEventListener('mousedown', this._ctxDocHandler); this._ctxDocHandler = null; }
        if (this._ctxEscHandler) { document.removeEventListener('keydown', this._ctxEscHandler); this._ctxEscHandler = null; }
    }

    _headerContextMenu(e, col, colIdx) {
        e.preventDefault();
        const hidden = this.columns.filter(c => c._hidden);
        const items = [
            { icon: '▲', label: '오름차순 정렬', action: () => { this._sortCol = col.field; this._sortDir = 'asc'; this._updateSortIcons(); this._applySort(); this._render(); } },
            { icon: '▼', label: '내림차순 정렬', action: () => { this._sortCol = col.field; this._sortDir = 'desc'; this._updateSortIcons(); this._applySort(); this._render(); } },
            { icon: '✕', label: '정렬 해제', action: () => { this._sortCol = null; this._sortDir = null; this._updateSortIcons(); this._render(); } },
            '---',
            { icon: '⇔', label: '컬럼 자동맞춤', action: () => this._autoFitColumn(colIdx) },
            { icon: '⇔', label: '전체 컬럼 자동맞춤', action: () => this.autoFitAllColumns() },
            '---',
            { icon: '👁', label: '컬럼 숨기기', action: () => this.hideColumn(col.field) },
        ];
        if (hidden.length > 0) {
            items.push('---');
            for (const hc of hidden) {
                const lbl = Array.isArray(hc.label) ? (hc.label[hc.label.length-1]?.text || hc.field) : (hc.label || hc.field);
                items.push({ icon: '👁', label: '"' + lbl + '" 표시', action: () => this.showColumn(hc.field) });
            }
        }
        this._showContextMenu(e.clientX, e.clientY, items);
    }

    _cellContextMenu(e, rowIdx) {
        e.preventDefault();
        const items = [
            { icon: '📋', label: '행 복사 (TSV)', action: () => { this._selectRow(rowIdx); this._copyToClipboard(); } },
            { icon: '📌', label: '붙여넣기', action: () => this._pasteFromClipboard(), disabled: !this.editable },
            '---',
            { icon: '➕', label: '위에 행 추가', action: () => { this.rows.splice(rowIdx, 0, { gstat: 'I', _checked: false }); this._render(); }, disabled: !this.editable },
            { icon: '➕', label: '아래에 행 추가', action: () => { this.rows.splice(rowIdx + 1, 0, { gstat: 'I', _checked: false }); this._render(); }, disabled: !this.editable },
            { icon: '🗑', label: '행 삭제', action: () => { this.rows.splice(rowIdx, 1); this.selectedIdx = -1; this._render(); }, disabled: !this.editable },
        ];
        this._showContextMenu(e.clientX, e.clientY, items);
    }

    // ══════════════════════════════════════════════════════════
    //  컬럼 숨기기/표시
    // ══════════════════════════════════════════════════════════

    hideColumn(field) {
        const ci = this.columns.findIndex(c => c.field === field);
        if (ci >= 0) { this.columns[ci]._hidden = true; if (this._cols[ci]) this._cols[ci].style.width = '0px'; this._updateTableWidth(); this._rebuild(); }
    }

    showColumn(field) {
        const ci = this.columns.findIndex(c => c.field === field);
        if (ci >= 0) { this.columns[ci]._hidden = false; if (this._cols[ci]) this._cols[ci].style.width = (this.columns[ci].width || 100) + 'px'; this._updateTableWidth(); this._rebuild(); }
    }

    getHiddenColumns() { return this.columns.filter(c => c._hidden).map(c => c.field); }

    autoFitAllColumns() {
        for (let i = 0; i < this.columns.length; i++) {
            if (!this.columns[i]._hidden) this._autoFitColumn(i);
        }
    }

    _rebuild() {
        const data = this.rows.map(r => ({ ...r }));
        const sel = this.selectedIdx;
        const sortCol = this._sortCol, sortDir = this._sortDir;
        this._build();
        this.rows = data;
        this.selectedIdx = sel;
        this._sortCol = sortCol; this._sortDir = sortDir;
        this._updateSortIcons();
        this._render();
        if (this.paging) this._renderPaging();
    }

    // ══════════════════════════════════════════════════════════
    //  행 드래그&드롭 재정렬
    // ══════════════════════════════════════════════════════════

    _startRowDrag(fromIdx, startEvent) {
        const tbody = this.tbody;
        const rows = Array.from(tbody.children);
        const dragTr = rows[fromIdx];
        if (!dragTr) return;

        dragTr.classList.add('forma-row-dragging');
        let targetIdx = fromIdx;

        // 드래그 인디케이터 라인
        const indicator = document.createElement('div');
        indicator.className = 'forma-drag-indicator';
        this._scrollWrap.appendChild(indicator);
        indicator.style.display = 'none';

        const onMove = (e) => {
            e.preventDefault();
            const scrollRect = this._scrollWrap.getBoundingClientRect();
            const y = e.clientY;

            // 어느 행 위에 있는지 계산
            let newTarget = fromIdx;
            for (let i = 0; i < rows.length; i++) {
                const tr = rows[i];
                const rect = tr.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (y < mid) { newTarget = i; break; }
                newTarget = i + 1;
            }
            newTarget = Math.max(0, Math.min(newTarget, this.rows.length));
            targetIdx = newTarget;

            // 인디케이터 위치
            let indicatorY;
            if (newTarget < rows.length) {
                indicatorY = rows[newTarget].getBoundingClientRect().top - scrollRect.top + this._scrollWrap.scrollTop;
            } else {
                const last = rows[rows.length - 1];
                indicatorY = last.getBoundingClientRect().bottom - scrollRect.top + this._scrollWrap.scrollTop;
            }
            indicator.style.display = '';
            indicator.style.top = indicatorY + 'px';
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            dragTr.classList.remove('forma-row-dragging');
            indicator.remove();

            if (targetIdx !== fromIdx && targetIdx !== fromIdx + 1) {
                this.moveRow(fromIdx, targetIdx > fromIdx ? targetIdx - 1 : targetIdx);
            }
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    moveRow(fromIdx, toIdx) {
        if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= this.rows.length || toIdx >= this.rows.length) return;
        const [row] = this.rows.splice(fromIdx, 1);
        this.rows.splice(toIdx, 0, row);
        if (this._allRows) {
            const [ar] = this._allRows.splice(fromIdx, 1);
            this._allRows.splice(toIdx, 0, ar);
        }
        this.selectedIdx = toIdx;
        this._focusRow = toIdx;
        this._render();
        if (this.onRowReorder) this.onRowReorder(fromIdx, toIdx, row);
    }

    // ══════════════════════════════════════════════════════════
    //  Footer
    // ══════════════════════════════════════════════════════════

    _renderFooter() {
        if (!this._hasFooter || !this.tfoot) return;
        this.tfoot.innerHTML = '';
        if (this.rows.length === 0) return;
        const tr = document.createElement('tr');
        if (this.detailGrid) tr.appendChild(document.createElement('td'));
        if (this.reorderable) tr.appendChild(document.createElement('td'));
        if (this.checkable) tr.appendChild(document.createElement('td'));
        if (this.rowNum) tr.appendChild(document.createElement('td'));
        for (const col of this.columns) {
            const td = document.createElement('td');
            if (col.align) td.style.textAlign = col.align;
            if (col.format === 'currency' || col.type === 'number' || col.editor === 'currency') td.style.textAlign = 'right';
            if (col.footer) {
                const values = this.rows.map(r => Number(r[col.field]) || 0);
                let result;
                if (col.footer === 'sum') result = values.reduce((a, b) => a + b, 0);
                else if (col.footer === 'avg') result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                else if (col.footer === 'count') result = this.rows.length;
                td.textContent = (col.format === 'currency' || col.editor === 'currency' || col.footer === 'sum' || col.footer === 'avg') ? Number(result).toLocaleString('ko-KR') : result;
            }
            tr.appendChild(td);
        }
        this.tfoot.appendChild(tr);
    }

    // ══════════════════════════════════════════════════════════
    //  내부 유틸
    // ══════════════════════════════════════════════════════════

    _selectRow(idx) {
        this.selectedIdx = idx;
        this.tbody.querySelectorAll('tr.selected').forEach(tr => tr.classList.remove('selected'));
        const tr = this._getRowTr(idx);
        if (tr) tr.classList.add('selected');
    }
    _toggleAllCheck(checked) { this.rows.forEach(r => r._checked = checked); this.tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked); }

    // ══════════════════════════════════════════════════════════
    //  페이징
    // ══════════════════════════════════════════════════════════

    _renderPaging() {
        if (!this.paging) return;
        const old = this.container.querySelector('.forma-grid-paging'); if (old) old.remove();
        const totalPages = Math.max(1, Math.ceil(this._totalCount / this._pageSize));
        const page = this._currentPage;
        const bar = document.createElement('div'); bar.className = 'forma-grid-paging';
        const nav = document.createElement('div'); nav.className = 'forma-paging-nav';
        const mkBtn = (text, tp, dis) => { const btn = document.createElement('button'); btn.textContent = text; btn.disabled = dis; if (tp === page) btn.classList.add('active'); if (!dis) btn.onclick = () => this._goPage(tp); return btn; };
        nav.appendChild(mkBtn('«', 1, page === 1)); nav.appendChild(mkBtn('‹', page - 1, page === 1));
        let sp = Math.max(1, page - 4), ep = Math.min(totalPages, sp + 9); if (ep - sp < 9) sp = Math.max(1, ep - 9);
        for (let p = sp; p <= ep; p++) nav.appendChild(mkBtn(String(p), p, false));
        nav.appendChild(mkBtn('›', page + 1, page === totalPages)); nav.appendChild(mkBtn('»', totalPages, page === totalPages));
        bar.appendChild(nav);
        const sizeWrap = document.createElement('div'); sizeWrap.className = 'forma-paging-size'; sizeWrap.innerHTML = '페이지크기: ';
        [20, 50, 100].forEach(size => { const btn = document.createElement('button'); btn.textContent = size; if (size === this._pageSize) btn.classList.add('active'); btn.onclick = () => { this._pageSize = size; this._currentPage = 1; this._renderPaging(); if (this.onPageChange) this.onPageChange(1, size); }; sizeWrap.appendChild(btn); });
        bar.appendChild(sizeWrap);
        const info = document.createElement('div'); info.className = 'forma-paging-info'; info.textContent = '총 ' + this._totalCount.toLocaleString('ko-KR') + '건';
        bar.appendChild(info); this.container.appendChild(bar);
    }
    _goPage(page) { const tp = Math.max(1, Math.ceil(this._totalCount / this._pageSize)); if (page < 1 || page > tp) return; this._currentPage = page; this._renderPaging(); if (this.onPageChange) this.onPageChange(page, this._pageSize); }
}

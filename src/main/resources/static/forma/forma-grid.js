/**
 * FormaGrid - ERP 수준 데이터 그리드
 * 정렬, 페이징, 체크박스, 행번호, CSV 내보내기, 인라인 편집,
 * 컬럼 리사이즈, frozen 컬럼, 변경 행 추적.
 */
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
        this._editingCell = null;
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

        for (const col of this.columns) {
            if (col.code) await getCodeItems(col.code);
        }

        for (let i = 0; i < this.rows.length; i++) {
            const row = this.rows[i];
            const tr = document.createElement('tr');
            tr.onclick = () => this._selectRow(i);
            if (i === this.selectedIdx) tr.classList.add('selected');

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
                this._renderCellValue(td, row, col);
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
            rowIdx++;
            if (rowIdx >= this.rows.length) return;
        } else {
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
            this._enterEditMode(rowIdx, colIdx, td, this.rows[rowIdx], this.columns[colIdx]);
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
        let extraCols = 0;
        if (this.features.includes('checkbox')) extraCols++;
        if (this.features.includes('rowNum')) extraCols++;
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
        if (this.currentSort === field + ' ASC') this.currentSort = field + ' DESC';
        else if (this.currentSort === field + ' DESC') this.currentSort = null;
        else this.currentSort = field + ' ASC';
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
        const old = this.container.querySelector('.forma-grid-paging');
        if (old) old.remove();
        if (this.totalCount <= 0) return;
        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        if (totalPages <= 1 && this.totalCount <= this.pageSize) return;

        const paging = document.createElement('div');
        paging.className = 'forma-grid-paging';

        const info = document.createElement('span');
        info.className = 'forma-paging-info';
        info.textContent = `총 ${this.totalCount.toLocaleString()}건 / ${totalPages}페이지 중 ${this.currentPage}페이지`;
        paging.appendChild(info);

        const nav = document.createElement('div');
        nav.className = 'forma-paging-nav';
        nav.appendChild(this._pagingBtn('«', 1, this.currentPage <= 1));
        nav.appendChild(this._pagingBtn('‹', this.currentPage - 1, this.currentPage <= 1));
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        for (let p = startPage; p <= endPage; p++) {
            const btn = this._pagingBtn(String(p), p, false);
            if (p === this.currentPage) btn.classList.add('active');
            nav.appendChild(btn);
        }
        nav.appendChild(this._pagingBtn('›', this.currentPage + 1, this.currentPage >= totalPages));
        nav.appendChild(this._pagingBtn('»', totalPages, this.currentPage >= totalPages));
        paging.appendChild(nav);

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
        const row = this.rows[idx];
        const tr = this.tbody.children[idx];
        if (!tr) return;
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
        Array.from(this.tbody.children).forEach((tr, i) => tr.classList.toggle('selected', i === idx));
        if (this.onSelect) this.onSelect(this.rows[idx], idx);
    }

    _renderEmpty() {
        let colSpan = this.columns.length;
        if (this.features.includes('checkbox')) colSpan++;
        if (this.features.includes('rowNum')) colSpan++;
        this.tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="forma-grid-empty">데이터가 없습니다</td></tr>';
    }

    _toggleAllCheck(checked) {
        this.checkedSet.clear();
        if (checked) { for (let i = 0; i < this.rows.length; i++) this.checkedSet.add(i); }
        this.tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
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

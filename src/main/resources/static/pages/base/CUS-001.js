// Generated from: design/screens/CUS-001.yml (type: list)
// 고도화된 FORMA 프레임워크 적용

const page = {
    api: '/api/customer',

    init() {
        // 검색바
        this.search = new FormaSearch('#search', [
            { field: 'cust_cd', widget: 'text', label: '거래처코드' },
            { field: 'cust_nm', widget: 'text', label: '거래처명' },
            { field: 'cust_type', widget: 'combo', label: '거래처유형', code: 'CUST_TYPE' },
        ], () => this.doSearch());

        // 그리드
        this.grid = new FormaGrid('#grid', {
            editable: true,
            defaultSort: 'cust_cd ASC',
            columns: [
                { field: 'cust_cd',   label: '거래처코드', width: 120, frozen: true },
                { field: 'cust_nm',   label: '거래처명',  width: 200 },
                { field: 'cust_type', label: '거래처유형', width: 100, format: 'badge', code: 'CUST_TYPE', readOnly: true },
                { field: 'tel',       label: '전화번호',  width: 130 },
                { field: 'addr',      label: '주소',     width: 300 },
            ],
            features: ['checkbox', 'rowNum', 'addRow', 'deleteRow', 'export'],
            onSort: () => this.doSearch(),
            onPageChange: (pg) => this.doSearch(pg),
        });

        // 액션 버튼
        FormaPage.actionBar('#actions', [
            { label: '조회', onClick: () => this.doSearch(), primary: true },
            { label: '저장', onClick: () => this.doSave() },
            { label: '선택 삭제', onClick: () => this.doDeleteChecked() },
        ]);

        this.doSearch();
    },

    async doSearch(pg) {
        try {
            const params = this.search.getValues();
            params._page = pg || 1;
            params._size = this.grid.pageSize;
            if (this.grid.currentSort) params._sort = this.grid.currentSort;

            const data = await FormaApi.get(this.api, params);
            this.grid.setData(data.data, data.total, data.page, data.size);
        } catch (e) {
            FormaToast.error(e.message);
        }
    },

    async doSave() {
        const modified = this.grid.getModifiedRows();
        if (modified.length === 0) {
            FormaToast.info('변경된 데이터가 없습니다');
            return;
        }

        try {
            for (const row of modified) {
                const data = {};
                for (const [k, v] of Object.entries(row)) {
                    if (k.startsWith('_')) continue;
                    data[k] = v;
                }
                await FormaApi.post(this.api, data);
            }
            FormaToast.success('저장되었습니다');
            this.doSearch(this.grid.currentPage);
        } catch (e) {
            FormaToast.error(e.message);
        }
    },

    async doDeleteChecked() {
        const checked = this.grid.getCheckedRows();
        if (checked.length === 0) {
            FormaToast.info('삭제할 행을 선택하세요');
            return;
        }

        const ok = await FormaDialog.confirm(`${checked.length}건을 삭제하시겠습니까?`);
        if (!ok) return;

        try {
            for (const row of checked) {
                if (row.cust_cd) await FormaApi.del(this.api + '/' + row.cust_cd);
            }
            FormaToast.success(`${checked.length}건 삭제되었습니다`);
            this.doSearch();
        } catch (e) {
            FormaToast.error(e.message);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => page.init());

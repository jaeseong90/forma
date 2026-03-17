// Generated from: design/screens/ORD-001.yml (type: master-detail)
// 고도화된 FORMA 프레임워크 적용

const page = {
    api: '/api/sales-order',
    selectedOrderNo: null,

    init() {
        // 검색바
        this.search = new FormaSearch('#search', [
            { field: 'order_date', widget: 'dateRange', label: '수주일자', default: 'THIS_MONTH' },
            { field: 'cust_cd', widget: 'codePopup', label: '거래처',
                popupUrl: '/api/customer', popupEntity: 'customer',
                displayField: 'cust_nm',
                popupColumns: [
                    { field: 'cust_cd', label: '거래처코드', width: 120 },
                    { field: 'cust_nm', label: '거래처명', width: 200 }
                ]
            },
            { field: 'status', widget: 'combo', label: '상태', code: 'ORD_STATUS' },
        ], () => this.doSearch());

        // 마스터 그리드
        this.masterGrid = new FormaGrid('#master-grid', {
            columns: [
                { field: 'order_no',   label: '수주번호',  width: 160, frozen: true },
                { field: 'cust_nm',    label: '거래처명',  width: 180 },
                { field: 'order_date', label: '수주일자',  width: 110, format: 'date' },
                { field: 'total_amt',  label: '합계금액',  width: 130, format: 'currency' },
                { field: 'status',     label: '상태',     width: 90,  format: 'badge', code: 'ORD_STATUS' },
            ],
            features: ['rowNum'],
            defaultSort: 'order_date DESC',
            onSelect: (row) => this.onMasterSelect(row),
            onSort: () => this.doSearch(),
            onPageChange: (pg) => this.doSearch(pg),
        });

        // 마스터 입력 폼 (신규/수정 시 표시)
        this.masterForm = new FormaForm('#master-form', [
            { field: 'order_no',   label: '수주번호', readOnly: true },
            { field: 'order_date', label: '수주일자', type: 'date', required: true },
            { field: 'cust_cd',    label: '거래처코드', required: true },
            { field: 'cust_nm',    label: '거래처명', readOnly: true },
            { field: 'status',     label: '상태', widget: 'combo', code: 'ORD_STATUS', readOnly: true },
            { field: 'remark',     label: '비고', widget: 'textarea' },
        ]);

        // 디테일 그리드
        this.detailGrid = new FormaGrid('#detail-grid', {
            editable: true,
            columns: [
                { field: 'seq',        label: '순번',  width: 60,  readOnly: true, auto: true },
                { field: 'item_cd',    label: '품목코드', width: 120 },
                { field: 'item_nm',    label: '품목명',  width: 200 },
                { field: 'qty',        label: '수량',   width: 80,  type: 'number' },
                { field: 'unit_price', label: '단가',   width: 110, type: 'number', format: 'currency' },
                { field: 'amount',     label: '금액',   width: 130, format: 'currency', readOnly: true },
            ],
            features: ['addRow', 'deleteRow', 'rowNum'],
            onCellChange: (row, field) => {
                if (field === 'qty' || field === 'unit_price') {
                    const qty = Number(row.qty) || 0;
                    const price = Number(row.unit_price) || 0;
                    row.amount = qty * price;
                }
            }
        });

        // 액션 버튼
        FormaPage.actionBar('#actions', [
            { label: '조회', onClick: () => this.doSearch(), primary: true },
            { label: '신규', onClick: () => this.doNew() },
            { label: '저장', onClick: () => this.doSave() },
            { label: '삭제', onClick: () => this.doDelete() },
            { label: '승인', onClick: () => this.doApprove() },
        ]);

        this.doSearch();
    },

    _showForm(show) {
        document.getElementById('master-form-section').style.display = show ? '' : 'none';
    },

    onMasterSelect(row) {
        this.selectedOrderNo = row.order_no;
        this.masterForm.setData(row);
        this._showForm(true);
        this.loadDetail(row.order_no);
    },

    async doSearch(pg) {
        try {
            const params = this.search.getValues();
            params._page = pg || 1;
            params._size = this.masterGrid.pageSize;
            if (this.masterGrid.currentSort) params._sort = this.masterGrid.currentSort;

            const data = await FormaApi.get(this.api, params);
            this.masterGrid.setData(data.data, data.total, data.page, data.size);
            this.detailGrid.setData([]);
            this.selectedOrderNo = null;
            this._showForm(false);
        } catch (e) { FormaToast.error(e.message); }
    },

    async loadDetail(orderNo) {
        this.selectedOrderNo = orderNo;
        try {
            const items = await FormaApi.get(this.api + '/' + orderNo + '/items');
            this.detailGrid.setData(items);
        } catch (e) { FormaToast.error(e.message); }
    },

    doNew() {
        this.selectedOrderNo = null;
        this.masterGrid.selectedIdx = -1;
        this.masterForm.clear();
        this.masterForm.setData({
            order_date: new Date().toISOString().substring(0, 10),
            status: 'DRAFT',
        });
        this._showForm(true);
        this.detailGrid.setData([{}]);
    },

    async doSave() {
        const formData = this.masterForm.getData();
        if (!formData.cust_cd) {
            FormaToast.error('거래처코드를 입력하세요');
            return;
        }
        if (!formData.order_date) {
            FormaToast.error('수주일자를 입력하세요');
            return;
        }

        const master = {
            order_no: this.selectedOrderNo || formData.order_no || null,
            order_date: formData.order_date,
            cust_cd: formData.cust_cd,
            cust_nm: formData.cust_nm || '',
            status: formData.status || 'DRAFT',
            remark: formData.remark || '',
        };

        const items = this.detailGrid.getAllRows().map(item => {
            const clean = {};
            for (const [k, v] of Object.entries(item)) {
                if (!k.startsWith('_')) clean[k] = v;
            }
            return clean;
        });

        try {
            const result = await FormaApi.post(this.api + '/save-all', { master, items });
            FormaToast.success('저장되었습니다. 수주번호: ' + result.id);
            this.doSearch();
        } catch (e) { FormaToast.error(e.message); }
    },

    async doDelete() {
        if (!this.selectedOrderNo) {
            FormaToast.info('삭제할 수주를 선택하세요');
            return;
        }
        const ok = await FormaDialog.confirm('삭제하시겠습니까?');
        if (!ok) return;
        try {
            await FormaApi.del(this.api + '/' + this.selectedOrderNo);
            FormaToast.success('삭제되었습니다');
            this.doSearch();
        } catch (e) { FormaToast.error(e.message); }
    },

    async doApprove() {
        if (!this.selectedOrderNo) {
            FormaToast.info('승인할 수주를 선택하세요');
            return;
        }
        const ok = await FormaDialog.confirm('승인하시겠습니까?');
        if (!ok) return;
        try {
            await FormaApi.post(this.api + '/' + this.selectedOrderNo + '/approve', {});
            FormaToast.success('승인되었습니다');
            this.doSearch();
        } catch (e) { FormaToast.error(e.message); }
    }
};

document.addEventListener('DOMContentLoaded', () => page.init());

// Generated from: design/screens/ORD-001.yml (type: master-detail)

const page = {
    api: '/api/sales-order',
    selectedOrderNo: null,

    init() {
        // 검색바 — 설계서 search 섹션
        this.search = new FormaSearch('#search', [
            { field: 'order_date', widget: 'dateRange', label: '수주일자', default: 'THIS_MONTH' },
            { field: 'cust_cd', widget: 'text', label: '거래처코드' },
            { field: 'status', widget: 'combo', label: '상태', code: 'ORD_STATUS' },
        ], () => this.doSearch());

        // 마스터 그리드 — 설계서 master 섹션
        this.masterGrid = new FormaGrid('#master-grid', {
            columns: [
                { field: 'ORDER_NO',   label: '수주번호',  width: 160 },
                { field: 'CUST_NM',    label: '거래처명',  width: 180 },
                { field: 'ORDER_DATE', label: '수주일자',  width: 110, format: 'date' },
                { field: 'TOTAL_AMT',  label: '합계금액',  width: 130, format: 'currency', align: 'right' },
                { field: 'STATUS',     label: '상태',     width: 90,  format: 'badge', code: 'ORD_STATUS' },
            ],
            onSelect: (row) => this.loadDetail(row.ORDER_NO || row.order_no),
        });

        // 디테일 그리드 — 설계서 detail 섹션
        this.detailGrid = new FormaGrid('#detail-grid', {
            editable: true,
            columns: [
                { field: 'SEQ',        label: '순번',  width: 60,  readOnly: true, auto: true },
                { field: 'ITEM_CD',    label: '품목코드', width: 120 },
                { field: 'ITEM_NM',    label: '품목명',  width: 200 },
                { field: 'QTY',        label: '수량',   width: 80,  type: 'number', align: 'right' },
                { field: 'UNIT_PRICE', label: '단가',   width: 110, type: 'number', format: 'currency', align: 'right' },
                { field: 'AMOUNT',     label: '금액',   width: 130, format: 'currency', align: 'right', readOnly: true },
            ],
            features: ['addRow', 'deleteRow'],
            // 설계서 rules.calc: qty * unit_price → amount
            onCellChange: (row, field) => {
                if (field === 'QTY' || field === 'UNIT_PRICE') {
                    const qty = Number(row.QTY) || 0;
                    const price = Number(row.UNIT_PRICE) || 0;
                    row.AMOUNT = qty * price;
                }
            }
        });

        // 액션 버튼 — 설계서 actions 섹션
        FormaPage.actionBar('#actions', [
            { label: '조회', onClick: () => this.doSearch(), primary: true },
            { label: '신규', onClick: () => this.doNew() },
            { label: '저장', onClick: () => this.doSave() },
            { label: '삭제', onClick: () => this.doDelete() },
            { label: '승인', onClick: () => this.doApprove() },
        ]);

        this.doSearch();
    },

    async doSearch() {
        try {
            const data = await FormaApi.get(this.api, this.search.getValues());
            this.masterGrid.setData(data.data, data.total);
            this.detailGrid.setData([]);
            this.selectedOrderNo = null;
        } catch (e) { FormaPage.alert(e.message); }
    },

    async loadDetail(orderNo) {
        this.selectedOrderNo = orderNo;
        try {
            const items = await FormaApi.get(this.api + '/' + orderNo + '/items');
            this.detailGrid.setData(items);
        } catch (e) { FormaPage.alert(e.message); }
    },

    doNew() {
        this.selectedOrderNo = null;
        this.masterGrid.selectedIdx = -1;
        this.detailGrid.setData([{}]); // 빈 행 1개
    },

    async doSave() {
        const master = this.masterGrid.getSelectedRow();
        const items = this.detailGrid.getAllRows();

        if (!master && !this.selectedOrderNo) {
            // 신규 — 최소 정보
            const newMaster = {
                order_no: null,
                order_date: new Date().toISOString().substring(0,10),
                cust_cd: prompt('거래처코드를 입력하세요:'),
                cust_nm: '',
                status: 'DRAFT',
            };
            if (!newMaster.cust_cd) return;
            await this._saveAll(newMaster, items);
        } else {
            // 기존 수정
            const data = {};
            for (const [k,v] of Object.entries(master)) data[k.toLowerCase()] = v;
            await this._saveAll(data, items);
        }
    },

    async _saveAll(master, items) {
        // 컬럼명 소문자 변환 (H2가 대문자로 반환하므로)
        const cleanItems = items.map(item => {
            const clean = {};
            for (const [k,v] of Object.entries(item)) clean[k.toLowerCase()] = v;
            return clean;
        });

        try {
            const result = await FormaApi.post(this.api + '/save-all', {
                master: master,
                items: cleanItems
            });
            FormaPage.alert('저장되었습니다. 수주번호: ' + result.id);
            this.doSearch();
        } catch (e) { FormaPage.alert(e.message); }
    },

    async doDelete() {
        if (!this.selectedOrderNo) { FormaPage.alert('삭제할 수주를 선택하세요'); return; }
        if (!FormaPage.confirm('삭제하시겠습니까?')) return;
        try {
            await FormaApi.del(this.api + '/' + this.selectedOrderNo);
            FormaPage.alert('삭제되었습니다');
            this.doSearch();
        } catch (e) { FormaPage.alert(e.message); }
    },

    async doApprove() {
        if (!this.selectedOrderNo) { FormaPage.alert('승인할 수주를 선택하세요'); return; }
        if (!FormaPage.confirm('승인하시겠습니까?')) return;
        try {
            await FormaApi.post(this.api + '/' + this.selectedOrderNo + '/approve', {});
            FormaPage.alert('승인되었습니다');
            this.doSearch();
        } catch (e) { FormaPage.alert(e.message); }
    }
};

document.addEventListener('DOMContentLoaded', () => page.init());

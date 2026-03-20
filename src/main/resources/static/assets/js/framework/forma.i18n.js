/**
 * FormaI18n — 다국어 시스템
 *
 * FormaI18n.setLang('en');
 * FormaI18n.t('btn.save')  → 'Save'
 * FormaI18n.t('btn.save')  → '저장' (ko)
 */
const FormaI18n = {
    _lang: 'ko',
    _messages: {
        ko: {
            // 버튼
            'btn.search': '조회', 'btn.new': '신규', 'btn.save': '저장', 'btn.delete': '삭제',
            'btn.print': '출력', 'btn.upload': '업로드', 'btn.init': '초기화', 'btn.ok': '확인', 'btn.cancel': '취소',
            'btn.addRow': '+ 행추가', 'btn.delRow': '- 행삭제', 'btn.close': '닫기',
            // 그리드
            'grid.empty': '데이터가 없습니다', 'grid.pageSize': '페이지크기', 'grid.total': '총 {0}건',
            'grid.csvDone': 'CSV 다운로드 완료', 'grid.xlsxDone': 'Excel 다운로드 완료',
            'grid.undo': '실행 취소', 'grid.redo': '다시 실행',
            'grid.copied': '{0}행 복사됨', 'grid.pasted': '{0}행 붙여넣기 완료',
            // 컨텍스트 메뉴
            'ctx.sortAsc': '오름차순 정렬', 'ctx.sortDesc': '내림차순 정렬', 'ctx.sortClear': '정렬 해제',
            'ctx.autoFit': '컬럼 자동맞춤', 'ctx.autoFitAll': '전체 컬럼 자동맞춤',
            'ctx.hideCol': '컬럼 숨기기', 'ctx.showCol': '"{0}" 표시',
            'ctx.copyRow': '행 복사 (TSV)', 'ctx.paste': '붙여넣기',
            'ctx.insertAbove': '위에 행 추가', 'ctx.insertBelow': '아래에 행 추가', 'ctx.deleteRow': '행 삭제',
            // 폼
            'form.required': '{0}을(를) 입력하세요.', 'form.selectRequired': '{0}을(를) 선택하세요.',
            'form.all': '전체', 'form.select': '선택', 'form.search': '검색...',
            'form.noFile': '선택된 파일 없음', 'form.fileBtn': '파일 선택',
            // 팝업
            'popup.confirm': '확인', 'popup.cancel': '취소',
            // 날짜
            'date.today': '오늘', 'date.clear': '초기화',
            'date.thisMonth': '이번달', 'date.lastMonth': '전월', 'date.thisYear': '올해',
            // 메뉴
            'menu.home': '홈', 'menu.favorites': '즐겨찾기',
        },
        en: {
            'btn.search': 'Search', 'btn.new': 'New', 'btn.save': 'Save', 'btn.delete': 'Delete',
            'btn.print': 'Print', 'btn.upload': 'Upload', 'btn.init': 'Reset', 'btn.ok': 'OK', 'btn.cancel': 'Cancel',
            'btn.addRow': '+ Add Row', 'btn.delRow': '- Delete Row', 'btn.close': 'Close',
            'grid.empty': 'No data available', 'grid.pageSize': 'Page size', 'grid.total': 'Total {0}',
            'grid.csvDone': 'CSV download complete', 'grid.xlsxDone': 'Excel download complete',
            'grid.undo': 'Undo', 'grid.redo': 'Redo',
            'grid.copied': '{0} row(s) copied', 'grid.pasted': '{0} row(s) pasted',
            'ctx.sortAsc': 'Sort Ascending', 'ctx.sortDesc': 'Sort Descending', 'ctx.sortClear': 'Clear Sort',
            'ctx.autoFit': 'Auto-fit Column', 'ctx.autoFitAll': 'Auto-fit All Columns',
            'ctx.hideCol': 'Hide Column', 'ctx.showCol': 'Show "{0}"',
            'ctx.copyRow': 'Copy Row (TSV)', 'ctx.paste': 'Paste',
            'ctx.insertAbove': 'Insert Row Above', 'ctx.insertBelow': 'Insert Row Below', 'ctx.deleteRow': 'Delete Row',
            'form.required': 'Please enter {0}.', 'form.selectRequired': 'Please select {0}.',
            'form.all': 'All', 'form.select': 'Select', 'form.search': 'Search...',
            'form.noFile': 'No file selected', 'form.fileBtn': 'Choose File',
            'popup.confirm': 'OK', 'popup.cancel': 'Cancel',
            'date.today': 'Today', 'date.clear': 'Clear',
            'date.thisMonth': 'This Month', 'date.lastMonth': 'Last Month', 'date.thisYear': 'This Year',
            'menu.home': 'Home', 'menu.favorites': 'Favorites',
        },
        ja: {
            'btn.search': '照会', 'btn.new': '新規', 'btn.save': '保存', 'btn.delete': '削除',
            'btn.print': '印刷', 'btn.upload': 'アップロード', 'btn.init': '初期化', 'btn.ok': '確認', 'btn.cancel': 'キャンセル',
            'btn.addRow': '+ 行追加', 'btn.delRow': '- 行削除', 'btn.close': '閉じる',
            'grid.empty': 'データがありません', 'grid.pageSize': 'ページサイズ', 'grid.total': '合計 {0}件',
            'grid.csvDone': 'CSVダウンロード完了', 'grid.xlsxDone': 'Excelダウンロード完了',
            'grid.undo': '元に戻す', 'grid.redo': 'やり直し',
            'form.required': '{0}を入力してください。', 'form.selectRequired': '{0}を選択してください。',
            'form.all': '全体', 'form.select': '選択', 'form.search': '検索...',
            'popup.confirm': '確認', 'popup.cancel': 'キャンセル',
        },
        zh: {
            'btn.search': '查询', 'btn.new': '新建', 'btn.save': '保存', 'btn.delete': '删除',
            'btn.print': '打印', 'btn.ok': '确认', 'btn.cancel': '取消',
            'grid.empty': '暂无数据', 'grid.total': '共 {0} 条',
            'form.required': '请输入{0}。', 'form.selectRequired': '请选择{0}。',
            'form.all': '全部', 'form.select': '选择',
        }
    },

    setLang(lang) {
        this._lang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('forma-lang', lang);
    },

    getLang() { return this._lang; },

    t(key, ...args) {
        const msg = this._messages[this._lang]?.[key] || this._messages['ko']?.[key] || key;
        return args.length > 0 ? msg.replace(/\{(\d+)\}/g, (_, i) => args[i] ?? '') : msg;
    },

    addMessages(lang, messages) {
        if (!this._messages[lang]) this._messages[lang] = {};
        Object.assign(this._messages[lang], messages);
    },

    init() {
        const saved = localStorage.getItem('forma-lang');
        if (saved && this._messages[saved]) this._lang = saved;
    }
};
FormaI18n.init();

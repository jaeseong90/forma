/**
 * FORMA Core - Listener 패턴 + platform.post/get + Callback + 상수
 */
const RESULT_CODE = { OK: 'OK', WARN: 'WARN', ERROR: 'ERROR' };

function Callback(callbackFunc) {
    this.callback = callbackFunc;
    let isShowLoading = true;
    this.setShowLoading = function(bool) { isShowLoading = bool; };
    this.preHook = function() { if (isShowLoading) FormaPopup.loading.show(); };
    this.postHook = function() { if (isShowLoading) setTimeout(() => FormaPopup.loading.hide(), 100); };
}

const platform = {
    listener: {},

    _handleAuthError(response) {
        const error = response.headers.get('error');
        if (!error) return false;
        const messages = {
            token_missing: '로그인이 필요합니다.',
            token_expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
            user_isvalid: '사용자 정보가 올바르지 않습니다.'
        };
        const msg = messages[error] || '인증 오류가 발생했습니다.';
        if (typeof FormaPopup !== 'undefined') {
            FormaPopup.alert.show(msg).then(function() { location.href = '/login.html'; });
        } else {
            alert(msg);
            location.href = '/login.html';
        }
        return true;
    },

    async post(url, param, callbackObj) {
        if (callbackObj?.preHook) callbackObj.preHook();
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(param)
            });
            // 인증 에러 체크
            if (response.status === 401) {
                this._handleAuthError(response);
                return;
            }
            const data = await response.json();
            if (data.resultCode === RESULT_CODE.ERROR && data.resultMessage) FormaPopup.alert.show(data.resultMessage);
            else if (data.resultCode === RESULT_CODE.WARN && data.resultMessage) FormaPopup.alert.show(data.resultMessage);
            if (callbackObj?.callback) callbackObj.callback(data);
            return data;
        } catch (err) {
            console.error(err);
            FormaPopup.alert.show('서버 연결 실패');
        } finally {
            if (callbackObj?.postHook) callbackObj.postHook();
        }
    },

    async get(url, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const fullUrl = qs ? url + '?' + qs : url;
        try {
            const response = await fetch(fullUrl);
            if (response.status === 401) {
                this._handleAuthError(response);
                return { resultCode: 'ERROR', resultMessage: '인증 필요' };
            }
            return await response.json();
        } catch (err) {
            console.error(err);
            return { resultCode: 'ERROR', resultMessage: '서버 연결 실패' };
        }
    },

    initListener(pgmId) {
        const l = {
            pgmId: pgmId,
            pgmInfo: null,
            pgmAuth: null,
            initializedPgm: false,

            // 생명주기
            initPgm: function() {},
            activePgm: function() {},

            // 표준 버튼
            button: {
                search: { click() {} },
                news:   { click() {} },
                save:   { click() {} },
                del:    { click() {} },
                print:  { click() {} },
                upload: { click() {} },
                init:   { click() {} },
            },

            // 그리드 이벤트
            gridRow: { click(record, grid, col) {}, dblclick(rowId, colId, record, grid) {} },
            gridEditor: { changed(grid, state, editor) {}, beforeEditStart(grid, record, curCol) { return true; } },

            // 트리그리드 이벤트
            treeGridRow: { click(record, treeGrid, col) {}, dblclick(rowId, colId, record, treeGrid) {} },
            treeGridEditor: { changed(treeGrid, state, editor) {}, beforeEditStart(treeGrid, record, curCol) { return true; } },

            // 탭 이벤트
            tabBar: { tabChange(tab) {} },

            // 에디터(폼) 이벤트
            editor: { change(el) {}, keydown(el, event) {} },

            // 컴포넌트 참조
            form: {},
            grid: {},
            treeGrid: {},
            tab: {},
            toolbar: {},
            modal: null,
            auth: null,
        };
        for (let i = 1; i <= 10; i++) l.button['etc' + i] = { click() {} };
        this.listener[pgmId] = l;
        return l;
    },

    async startPage(pgmId, listener) {
        // 1. Init API 호출
        try {
            const res = await fetch('/api/pgm/' + pgmId + '/init');
            const json = await res.json();
            if (json.resultCode === RESULT_CODE.OK) {
                listener.pgmInfo = json.resultData.pgmInfo;
                listener.pgmAuth = json.resultData.pgmAuth;
            }
        } catch (e) {
            console.warn('PGM init failed, using defaults');
            listener.pgmInfo = {};
            listener.pgmAuth = {};
        }

        // 2. 툴바 렌더링
        FormaToolbar.render('#forma-toolbar', {
            listener: listener,
            pgmInfo: listener.pgmInfo,
            pgmAuth: listener.pgmAuth,
        });

        // 3. initPgm 실행
        listener.initPgm();
        listener.initializedPgm = true;
    }
};

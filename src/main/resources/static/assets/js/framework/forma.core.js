/**
 * FORMA Core — Promise/async 기반
 *
 * 사용법:
 *   var result = await platform.post('/api/save', data);
 *   var result = await platform.post('/api/save', data, { loading: true });
 *
 *   // 기존 Callback 패턴도 하위 호환
 *   platform.post('/api/save', data, new Callback(function(r) { ... }));
 */
const RESULT_CODE = { OK: 'OK', WARN: 'WARN', ERROR: 'ERROR' };

/**
 * Callback — 하위 호환용. 신규 코드에서는 await platform.post() 사용 권장.
 */
function Callback(callbackFunc) {
    this.callback = callbackFunc;
    var isShowLoading = true;
    this.setShowLoading = function(bool) { isShowLoading = bool; };
    this.preHook = function() { if (isShowLoading && typeof FormaPopup !== 'undefined') FormaPopup.loading.show(); };
    this.postHook = function() { if (isShowLoading && typeof FormaPopup !== 'undefined') setTimeout(function() { FormaPopup.loading.hide(); }, 100); };
}

const platform = {
    listener: {},

    _handleAuthError(response) {
        var error = response.headers.get('error');
        if (!error) return false;
        var messages = {
            token_missing: '로그인이 필요합니다.',
            token_expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
            user_isvalid: '사용자 정보가 올바르지 않습니다.'
        };
        var msg = messages[error] || '인증 오류가 발생했습니다.';
        if (typeof FormaPopup !== 'undefined') {
            FormaPopup.alert.show(msg).then(function() { location.href = '/login.html'; });
        } else {
            alert(msg);
            location.href = '/login.html';
        }
        return true;
    },

    /**
     * POST 요청. Promise 반환.
     * @param {string} url
     * @param {Object} param
     * @param {Object} options  { loading: true } 또는 Callback 인스턴스 (하위 호환)
     * @returns {Promise<Object>} BaseResponse { resultCode, resultMessage, resultData }
     */
    async post(url, param, options) {
        // 하위 호환: Callback 인스턴스인 경우
        var isLegacyCallback = options instanceof Callback;
        var showLoading = isLegacyCallback ? false : (options && options.loading !== false);

        if (isLegacyCallback && options.preHook) options.preHook();
        else if (showLoading && typeof FormaPopup !== 'undefined') FormaPopup.loading.show();

        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(param)
            });

            if (response.status === 401) {
                this._handleAuthError(response);
                return { resultCode: 'ERROR', resultMessage: '인증 필요' };
            }

            var data = await response.json();

            // WARN/ERROR 메시지 자동 표시
            if (data.resultCode === RESULT_CODE.ERROR && data.resultMessage) {
                if (typeof FormaPopup !== 'undefined') FormaPopup.alert.show(data.resultMessage);
            } else if (data.resultCode === RESULT_CODE.WARN && data.resultMessage) {
                if (typeof FormaPopup !== 'undefined') FormaPopup.alert.show(data.resultMessage);
            }

            // 하위 호환 콜백 실행
            if (isLegacyCallback && options.callback) options.callback(data);

            return data;
        } catch (err) {
            console.error(err);
            if (typeof FormaPopup !== 'undefined') FormaPopup.alert.show('서버 연결 실패');
            return { resultCode: 'ERROR', resultMessage: '서버 연결 실패' };
        } finally {
            if (isLegacyCallback && options.postHook) options.postHook();
            else if (showLoading && typeof FormaPopup !== 'undefined') setTimeout(function() { FormaPopup.loading.hide(); }, 100);
        }
    },

    /**
     * GET 요청. Promise 반환.
     */
    async get(url, params) {
        params = params || {};
        var qs = new URLSearchParams(params).toString();
        var fullUrl = qs ? url + '?' + qs : url;
        try {
            var response = await fetch(fullUrl);
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
        var l = {
            pgmId: pgmId,
            pgmInfo: null,
            pgmAuth: null,
            initializedPgm: false,
            initPgm: function() {},
            activePgm: function() {},
            button: {
                search: { click: function() {} },
                news:   { click: function() {} },
                save:   { click: function() {} },
                del:    { click: function() {} },
                print:  { click: function() {} },
                upload: { click: function() {} },
                init:   { click: function() {} },
            },
            gridRow: { click: function() {}, dblclick: function() {} },
            gridEditor: { changed: function() {}, beforeEditStart: function() { return true; } },
            treeGridRow: { click: function() {}, dblclick: function() {} },
            treeGridEditor: { changed: function() {}, beforeEditStart: function() { return true; } },
            tabBar: { tabChange: function() {} },
            editor: { change: function() {}, keydown: function() {} },
            form: {}, grid: {}, treeGrid: {}, tab: {}, toolbar: {}, modal: null, auth: null,
        };
        for (var i = 1; i <= 10; i++) l.button['etc' + i] = { click: function() {} };
        this.listener[pgmId] = l;
        return l;
    },

    async startPage(pgmId, listener) {
        try {
            var res = await fetch('/api/pgm/' + pgmId + '/init');
            var json = await res.json();
            if (json.resultCode === RESULT_CODE.OK) {
                listener.pgmInfo = json.resultData.pgmInfo;
                listener.pgmAuth = json.resultData.pgmAuth;
            }
        } catch (e) {
            listener.pgmInfo = {};
            listener.pgmAuth = {};
        }

        if (typeof FormaToolbar !== 'undefined') {
            FormaToolbar.render('#forma-toolbar', {
                listener: listener,
                pgmInfo: listener.pgmInfo,
                pgmAuth: listener.pgmAuth,
            });
        }

        listener.initPgm();
        listener.initializedPgm = true;
    }
};

/**
 * FormaApi - API 통신 헬퍼
 * fetch 기반 HTTP 클라이언트. 로딩 인디케이터 자동 표시.
 */
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

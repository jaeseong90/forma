/**
 * FormaTab — 탭 컴포넌트
 *
 * const tab = new FormaTab('#tab-area', {
 *     tabs: [
 *         { id: 'tab1', label: '기본정보' },
 *         { id: 'tab2', label: '품목명세' },
 *     ],
 *     listener: listener,
 *     onTabChange: (tabId) => {}
 * });
 */
class FormaTab {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        this.tabs = options.tabs || [];
        this.listener = options.listener || null;
        this.onTabChange = options.onTabChange || null;
        this.activeTabId = null;
        this._build();
    }

    _build() {
        this.container.innerHTML = '';
        this.container.classList.add('forma-tab-wrap');

        // 헤더
        this.headerEl = document.createElement('div');
        this.headerEl.className = 'forma-tab-header';
        for (const tab of this.tabs) {
            const btn = document.createElement('button');
            btn.className = 'forma-tab-btn';
            btn.textContent = tab.label;
            btn.dataset.tabId = tab.id;
            btn.onclick = () => this.selectTab(tab.id);
            tab._headerBtn = btn;
            this.headerEl.appendChild(btn);
        }
        this.container.appendChild(this.headerEl);

        // 바디
        this.bodyEl = document.createElement('div');
        this.bodyEl.className = 'forma-tab-body';
        for (const tab of this.tabs) {
            const panel = document.createElement('div');
            panel.className = 'forma-tab-panel';
            panel.id = tab.id;
            panel.style.display = 'none';
            tab._panel = panel;
            this.bodyEl.appendChild(panel);
        }
        this.container.appendChild(this.bodyEl);

        // 첫 번째 탭 선택
        if (this.tabs.length > 0) {
            this.selectTab(this.tabs[0].id);
        }
    }

    selectTab(tabId) {
        if (tabId === this.activeTabId) return;
        this.activeTabId = tabId;

        for (const tab of this.tabs) {
            tab._headerBtn.classList.toggle('active', tab.id === tabId);
            tab._panel.style.display = tab.id === tabId ? '' : 'none';
        }

        if (this.listener?.tabBar?.tabChange) {
            this.listener.tabBar.tabChange({ activeId: tabId });
        }
        if (this.onTabChange) this.onTabChange(tabId);
    }

    getActiveTab() { return this.activeTabId; }

    getContentEl(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        return tab?._panel || null;
    }

    setActiveTab(tabId) { this.selectTab(tabId); }

    hideTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) tab._headerBtn.style.display = 'none';
    }

    showTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) tab._headerBtn.style.display = '';
    }
}

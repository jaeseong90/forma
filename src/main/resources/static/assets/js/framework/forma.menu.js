/**
 * FormaMenu — 좌측 트리 메뉴 + 다중 탭 MDI
 *
 * FormaMenu.init('#menu-area', '#content-area', menuData);
 */
const FormaMenu = {
    _menuEl: null,
    _contentEl: null,
    _tabBar: null,
    _tabs: [],
    _activeTab: null,

    init(menuSelector, contentSelector, menuData) {
        this._menuEl = document.querySelector(menuSelector);
        this._contentEl = document.querySelector(contentSelector);
        if (!this._menuEl || !this._contentEl) return;

        // 메뉴 트리 렌더링
        this._menuEl.innerHTML = '';
        this._menuEl.className = 'forma-menu';
        const ul = this._buildTree(menuData);
        this._menuEl.appendChild(ul);

        // 탭바 (MDI)
        this._tabBar = document.createElement('div');
        this._tabBar.className = 'forma-mdi-tabs';
        this._contentEl.parentElement.insertBefore(this._tabBar, this._contentEl);
    },

    _buildTree(items, depth = 0) {
        const ul = document.createElement('ul');
        ul.className = depth === 0 ? 'forma-menu-root' : 'forma-menu-sub';
        for (const item of items) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'forma-menu-item';
            a.style.paddingLeft = (12 + depth * 16) + 'px';

            if (item.children && item.children.length > 0) {
                // 폴더
                const toggle = document.createElement('span');
                toggle.className = 'forma-menu-toggle';
                toggle.textContent = '▼';
                a.appendChild(toggle);
                const txt = document.createElement('span');
                txt.textContent = item.label;
                a.appendChild(txt);
                const sub = this._buildTree(item.children, depth + 1);
                li.appendChild(a);
                li.appendChild(sub);
                a.onclick = (e) => {
                    e.preventDefault();
                    const open = sub.style.display !== 'none';
                    sub.style.display = open ? 'none' : '';
                    toggle.textContent = open ? '▶' : '▼';
                };
            } else {
                // 리프 (화면)
                if (item.icon) { const ic = document.createElement('span'); ic.className = 'forma-menu-icon'; ic.textContent = item.icon; a.appendChild(ic); }
                const txt = document.createElement('span');
                txt.textContent = item.label;
                a.appendChild(txt);
                if (item.id) { const badge = document.createElement('span'); badge.className = 'forma-menu-badge'; badge.textContent = item.id; a.appendChild(badge); }
                a.onclick = (e) => { e.preventDefault(); this.openPage(item); };
                a.href = item.url || '#';
            }
            ul.appendChild(li);
        }
        return ul;
    },

    openPage(item) {
        const id = item.id || item.url;
        // 이미 열린 탭이면 활성화
        const existing = this._tabs.find(t => t.id === id);
        if (existing) { this._activateTab(id); return; }

        // 새 탭 생성
        const tab = { id, label: item.label, url: item.url };
        this._tabs.push(tab);

        // 탭 버튼
        const btn = document.createElement('div');
        btn.className = 'forma-mdi-tab';
        btn.dataset.tabId = id;
        btn.innerHTML = '<span>' + item.label + '</span><span class="forma-mdi-tab-close">&times;</span>';
        btn.querySelector('span').onclick = () => this._activateTab(id);
        btn.querySelector('.forma-mdi-tab-close').onclick = (e) => { e.stopPropagation(); this.closeTab(id); };
        this._tabBar.appendChild(btn);
        tab._btn = btn;

        // 콘텐츠 영역 (iframe)
        const frame = document.createElement('iframe');
        frame.className = 'forma-mdi-frame';
        frame.src = item.url;
        frame.style.display = 'none';
        this._contentEl.appendChild(frame);
        tab._frame = frame;

        this._activateTab(id);
    },

    _activateTab(id) {
        this._activeTab = id;
        for (const tab of this._tabs) {
            const active = tab.id === id;
            tab._btn.classList.toggle('active', active);
            tab._frame.style.display = active ? '' : 'none';
        }
        // 메뉴 하이라이트
        this._menuEl.querySelectorAll('.forma-menu-item.active').forEach(a => a.classList.remove('active'));
        const menuItem = this._menuEl.querySelector('a[href="' + this._tabs.find(t => t.id === id)?.url + '"]');
        if (menuItem) menuItem.classList.add('active');
    },

    closeTab(id) {
        const idx = this._tabs.findIndex(t => t.id === id);
        if (idx < 0) return;
        const tab = this._tabs[idx];
        tab._btn.remove();
        tab._frame.remove();
        this._tabs.splice(idx, 1);
        if (this._activeTab === id && this._tabs.length > 0) {
            this._activateTab(this._tabs[Math.max(0, idx - 1)].id);
        }
    },

    closeAllTabs() {
        [...this._tabs].forEach(t => this.closeTab(t.id));
    }
};

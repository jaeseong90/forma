/**
 * FormaMenu — 좌측 트리 메뉴 + 즐겨찾기
 *
 * FormaMenu.init('#menu-area', menuData);
 * FormaMenu.initFavorites(favoritesData);  // 즐겨찾기 섹션 추가
 */
const FormaMenu = {
    _menuEl: null,
    _favSection: null,
    _menuData: null,

    /**
     * 메뉴 트리 렌더링
     * @param {string} selector  메뉴 컨테이너
     * @param {Array} menuData   트리 구조 [{id, label, icon, url, children:[...]}]
     */
    init(selector, menuData) {
        this._menuEl = document.querySelector(selector);
        if (!this._menuEl) return;
        this._menuData = menuData;

        this._menuEl.innerHTML = '';
        this._menuEl.className = 'forma-menu';

        // 즐겨찾기 섹션 (초기에는 비어있음)
        this._favSection = document.createElement('div');
        this._favSection.className = 'forma-menu-fav-section';
        this._favSection.style.display = 'none';
        this._menuEl.appendChild(this._favSection);

        var ul = this._buildTree(menuData);
        this._menuEl.appendChild(ul);

        // MDI 탭 변경 시 메뉴 하이라이트 동기화
        if (typeof FormaMdi !== 'undefined') {
            var self = this;
            FormaMdi.onTabChange = function(id) { self._highlightMenu(id); };
        }
    },

    /**
     * 즐겨찾기 데이터 로드 및 렌더링
     * @param {Array} favorites  [{MENU_ID, MENU_NM, PGM_ID, URL, ICON}]
     */
    initFavorites(favorites) {
        if (!this._favSection) return;
        this._favSection.innerHTML = '';

        if (!favorites || favorites.length === 0) {
            this._favSection.style.display = 'none';
            return;
        }

        this._favSection.style.display = '';

        var header = document.createElement('div');
        header.className = 'forma-menu-group';
        header.textContent = '\u2605 \uC990\uACA8\uCC3E\uAE30';
        this._favSection.appendChild(header);

        var ul = document.createElement('ul');
        ul.className = 'forma-menu-root';
        var self = this;

        for (var i = 0; i < favorites.length; i++) {
            var fav = favorites[i];
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.className = 'forma-menu-item forma-menu-fav-item';
            a.style.paddingLeft = '12px';
            a.dataset.menuId = fav.PGM_ID || fav.MENU_ID || '';

            if (fav.ICON) {
                var ic = document.createElement('span');
                ic.className = 'forma-menu-icon';
                ic.textContent = fav.ICON;
                a.appendChild(ic);
            }

            var txt = document.createElement('span');
            txt.textContent = fav.MENU_NM;
            a.appendChild(txt);

            // 즐겨찾기 해제 버튼
            var removeBtn = document.createElement('span');
            removeBtn.className = 'forma-menu-fav-remove';
            removeBtn.textContent = '\u00D7';
            removeBtn.title = '\uC990\uACA8\uCC3E\uAE30 \uD574\uC81C';
            a.appendChild(removeBtn);

            (function(favItem, removeEl) {
                a.onclick = function(e) {
                    if (e.target === removeEl) {
                        e.preventDefault();
                        self.removeFavorite(favItem.MENU_ID);
                        return;
                    }
                    e.preventDefault();
                    if (typeof FormaMdi !== 'undefined') {
                        FormaMdi.open({
                            id: favItem.PGM_ID || favItem.MENU_ID,
                            label: favItem.MENU_NM,
                            url: favItem.URL
                        });
                    }
                };
            })(fav, removeBtn);

            li.appendChild(a);
            ul.appendChild(li);
        }

        this._favSection.appendChild(ul);

        // 구분선
        var hr = document.createElement('div');
        hr.className = 'forma-menu-fav-divider';
        this._favSection.appendChild(hr);
    },

    /**
     * 즐겨찾기 추가 (서버 호출)
     */
    async addFavorite(menuId) {
        var res = await platform.post('/api/user/favorites/add', { menu_id: menuId });
        if (res.resultCode === RESULT_CODE.OK) {
            await this.reloadFavorites();
            if (typeof FormaPopup !== 'undefined') FormaPopup.toast.success('\uC990\uACA8\uCC3E\uAE30\uC5D0 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
        }
    },

    /**
     * 즐겨찾기 제거 (서버 호출)
     */
    async removeFavorite(menuId) {
        var res = await platform.post('/api/user/favorites/remove', { menu_id: menuId });
        if (res.resultCode === RESULT_CODE.OK) {
            await this.reloadFavorites();
            if (typeof FormaPopup !== 'undefined') FormaPopup.toast.info('\uC990\uACA8\uCC3E\uAE30\uC5D0\uC11C \uC81C\uAC70\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
        }
    },

    /**
     * 즐겨찾기 서버에서 다시 로드
     */
    async reloadFavorites() {
        var res = await platform.get('/api/user/favorites');
        if (res.resultCode === RESULT_CODE.OK) {
            this.initFavorites(res.resultData);
        }
    },

    _buildTree(items, depth) {
        depth = depth || 0;
        var ul = document.createElement('ul');
        ul.className = depth === 0 ? 'forma-menu-root' : 'forma-menu-sub';

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.className = 'forma-menu-item';
            a.style.paddingLeft = (12 + depth * 16) + 'px';

            if (item.children && item.children.length > 0) {
                // 그룹 (폴더)
                var toggle = document.createElement('span');
                toggle.className = 'forma-menu-toggle';
                toggle.textContent = '\u25BC';
                a.appendChild(toggle);

                var txt = document.createElement('span');
                txt.textContent = item.label;
                a.appendChild(txt);

                var sub = this._buildTree(item.children, depth + 1);
                li.appendChild(a);
                li.appendChild(sub);

                (function(subEl, toggleEl) {
                    a.onclick = function(e) {
                        e.preventDefault();
                        var open = subEl.style.display !== 'none';
                        subEl.style.display = open ? 'none' : '';
                        toggleEl.textContent = open ? '\u25B6' : '\u25BC';
                    };
                })(sub, toggle);
            } else {
                // 리프 (화면)
                if (item.icon) {
                    var ic = document.createElement('span');
                    ic.className = 'forma-menu-icon';
                    ic.textContent = item.icon;
                    a.appendChild(ic);
                }

                var txt2 = document.createElement('span');
                txt2.textContent = item.label;
                a.appendChild(txt2);

                if (item.id) {
                    var badge = document.createElement('span');
                    badge.className = 'forma-menu-badge';
                    badge.textContent = item.id;
                    a.appendChild(badge);
                }

                a.href = item.url || '#';
                a.dataset.menuId = item.id || '';

                // 우클릭 → 즐겨찾기 추가
                var self = this;
                (function(pageItem, menuItem) {
                    a.onclick = function(e) {
                        e.preventDefault();
                        if (typeof FormaMdi !== 'undefined') {
                            FormaMdi.open(pageItem);
                        } else {
                            location.href = pageItem.url;
                        }
                    };
                    a.oncontextmenu = function(e) {
                        e.preventDefault();
                        self._showFavContextMenu(e, menuItem);
                    };
                })(item, item);

                li.appendChild(a);
            }
            ul.appendChild(li);
        }
        return ul;
    },

    /**
     * 우클릭 시 즐겨찾기 추가 컨텍스트 메뉴
     */
    _showFavContextMenu(e, menuItem) {
        // 기존 컨텍스트 메뉴 제거
        var old = document.querySelector('.forma-menu-ctx');
        if (old) old.remove();

        var menu = document.createElement('div');
        menu.className = 'forma-menu-ctx';
        menu.style.position = 'fixed';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.style.zIndex = '9999';
        menu.style.background = 'var(--bg-card)';
        menu.style.border = '1px solid var(--border)';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        menu.style.padding = '4px 0';
        menu.style.fontSize = '12px';
        menu.style.minWidth = '120px';

        var self = this;

        // 메뉴 항목의 실제 menu_id를 찾기 (menuData의 원본 id가 아닌 MENU_ID 기반)
        var addItem = document.createElement('div');
        addItem.style.padding = '6px 12px';
        addItem.style.cursor = 'pointer';
        addItem.textContent = '\u2605 \uC990\uACA8\uCC3E\uAE30 \uCD94\uAC00';
        addItem.onmouseover = function() { this.style.background = '#f0f7ff'; };
        addItem.onmouseout = function() { this.style.background = ''; };
        addItem.onclick = function() {
            menu.remove();
            // menuItem에서 연결된 menu_id 찾기: FormaMenu의 flatMenus에서 pgm_id로 찾기
            self._addFavoriteByPgmId(menuItem.id);
        };
        menu.appendChild(addItem);

        document.body.appendChild(menu);

        // 클릭 시 닫기
        setTimeout(function() {
            document.addEventListener('click', function handler() {
                menu.remove();
                document.removeEventListener('click', handler);
            });
        }, 0);
    },

    async _addFavoriteByPgmId(pgmId) {
        // pgmId로 menu_id 조회 — 서버에서 처리
        var res = await platform.post('/api/user/favorites/add', { pgm_id: pgmId });
        if (res.resultCode === RESULT_CODE.OK) {
            await this.reloadFavorites();
            if (typeof FormaPopup !== 'undefined') FormaPopup.toast.success('\uC990\uACA8\uCC3E\uAE30\uC5D0 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
        }
    },

    /**
     * 활성 탭에 해당하는 메뉴 항목 하이라이트
     */
    _highlightMenu(id) {
        if (!this._menuEl) return;
        var items = this._menuEl.querySelectorAll('.forma-menu-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('active', items[i].dataset.menuId === id);
        }
    }
};

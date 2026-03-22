/**
 * FormaMenu — 좌측 트리 메뉴
 *
 * 메뉴 클릭 시 FormaMdi.open()을 호출한다.
 * MDI 모듈(forma.mdi.js)이 먼저 로드되어야 한다.
 *
 * FormaMenu.init('#menu-area', menuData);
 */
const FormaMenu = {
    _menuEl: null,

    /**
     * 메뉴 트리 렌더링
     * @param {string} selector  메뉴 컨테이너
     * @param {Array} menuData   트리 구조 [{id, label, icon, url, children:[...]}]
     */
    init(selector, menuData) {
        this._menuEl = document.querySelector(selector);
        if (!this._menuEl) return;

        this._menuEl.innerHTML = '';
        this._menuEl.className = 'forma-menu';
        var ul = this._buildTree(menuData);
        this._menuEl.appendChild(ul);

        // MDI 탭 변경 시 메뉴 하이라이트 동기화
        if (typeof FormaMdi !== 'undefined') {
            var self = this;
            FormaMdi.onTabChange = function(id) { self._highlightMenu(id); };
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

                (function(pageItem) {
                    a.onclick = function(e) {
                        e.preventDefault();
                        if (typeof FormaMdi !== 'undefined') {
                            FormaMdi.open(pageItem);
                        } else {
                            // MDI 없으면 직접 이동
                            location.href = pageItem.url;
                        }
                    };
                })(item);

                li.appendChild(a);
            }
            ul.appendChild(li);
        }
        return ul;
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

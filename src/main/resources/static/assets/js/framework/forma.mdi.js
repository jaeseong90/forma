/**
 * FormaMdi — SPA 기반 MDI (iframe 없음)
 *
 * 각 화면을 div 컨테이너로 관리한다.
 * YAML 정의 화면은 자동 렌더링, 커스텀 화면은 loadHtml로 로딩.
 *
 * FormaMdi.init('#tab-bar', '#content-area');
 * FormaMdi.open({ id: 'MMA010', label: '품목관리', url: '/pages/screen.html?id=MMA010' });
 */
const FormaMdi = {
    _tabBarEl: null,
    _contentEl: null,
    _tabs: {},        // id → { id, label, url, btn, container, ctx, listener, type }
    _order: [],       // 탭 순서 (id 배열)
    _activeId: null,
    _maxTabs: 15,

    init(tabBarSelector, contentSelector) {
        this._tabBarEl = document.querySelector(tabBarSelector);
        this._contentEl = document.querySelector(contentSelector);
    },

    /**
     * 화면 열기
     * @param {Object} page { id, label, url, icon }
     *   url이 /pages/screen.html?id=XXX 형태면 YAML 엔진으로 렌더링
     *   아니면 HTML fetch 후 삽입
     */
    async open(page) {
        if (!page || !page.id) return;

        // 이미 열린 탭 → 활성화
        if (this._tabs[page.id]) {
            this._activate(page.id);
            return;
        }

        if (this._order.length >= this._maxTabs) {
            FormaPopup.alert.show('최대 ' + this._maxTabs + '개까지 열 수 있습니다.');
            return;
        }

        // 탭 데이터
        var tab = {
            id: page.id,
            label: page.label,
            url: page.url,
            ctx: {},        // FormaForm, FormaGrid 등 컴포넌트 참조
            listener: null  // platform listener
        };

        // 탭 버튼
        tab.btn = this._createTabBtn(tab);
        this._tabBarEl.appendChild(tab.btn);

        // 콘텐츠 컨테이너
        tab.container = document.createElement('div');
        tab.container.className = 'forma-mdi-panel';
        tab.container.style.display = 'none';
        tab.container.dataset.tabId = page.id;
        this._contentEl.appendChild(tab.container);

        this._tabs[page.id] = tab;
        this._order.push(page.id);

        // welcome 숨기기
        var welcome = this._contentEl.querySelector('.erp-welcome');
        if (welcome) welcome.style.display = 'none';

        // 화면 로딩
        var screenId = this._extractScreenId(page.url);
        if (screenId) {
            await this._loadYamlScreen(tab, screenId);
        } else if (page.url) {
            await this._loadHtmlScreen(tab, page.url);
        }

        this._activate(page.id);
    },

    /**
     * YAML 정의 화면을 동적 렌더링 (레이아웃 타입별 분기)
     */
    async _loadYamlScreen(tab, screenId) {
        var defRes = await platform.get('/api/screen/' + screenId + '/definition');
        if (!defRes || defRes.resultCode !== RESULT_CODE.OK || !defRes.resultData) {
            tab.container.innerHTML = '<div style="padding:40px;color:#999;">화면 정의를 찾을 수 없습니다: ' + screenId + '</div>';
            return;
        }
        var def = defRes.resultData;
        tab.type = 'yaml';

        var S = screenId; // DOM id 접두사
        var PGM = screenId;
        var listener = platform.initListener(PGM);
        var ctx = tab.ctx;
        var apiBase = '/api/screen/' + screenId;
        var layoutType = (def.layout && def.layout.type) || 'full';
        var screenType = def.screen.type || 'list';

        // ── 1. HTML 구조 생성 (레이아웃별) ──
        var headerHtml =
            '<div class="forma-page-header">' +
                '<h1 class="forma-page-title">' + def.screen.name + ' (' + S + ')</h1>' +
                '<div id="toolbar-' + S + '"></div>' +
            '</div>';

        var searchHtml = '<div id="search-' + S + '"></div>';

        if (screenType === 'split-detail' || layoutType === 'split-h') {
            // 좌우 분할: grid1 | grid2
            var sw = (def.layout && def.layout.splitWidth) || 400;
            tab.container.innerHTML =
                '<div class="forma-page">' + headerHtml +
                '<div class="forma-content">' + searchHtml +
                    '<div class="forma-split-h" id="split-' + S + '">' +
                        '<div class="forma-split-panel" style="width:' + sw + 'px"><div id="grid1-' + S + '"></div></div>' +
                        '<div class="forma-split-handle"></div>' +
                        '<div class="forma-split-panel" style="flex:1"><div id="grid2-' + S + '"></div></div>' +
                    '</div>' +
                '</div></div>';
        } else if (screenType === 'master-detail') {
            // 상하: grid1 → form → grid2
            tab.container.innerHTML =
                '<div class="forma-page">' + headerHtml +
                '<div class="forma-content">' + searchHtml +
                    '<div id="grid1-' + S + '"></div>' +
                    '<div id="form-' + S + '" style="margin:8px 0"></div>' +
                    '<div id="grid2-' + S + '"></div>' +
                '</div></div>';
        } else {
            // list (기본)
            tab.container.innerHTML =
                '<div class="forma-page">' + headerHtml +
                '<div class="forma-content">' + searchHtml +
                    '<div id="grid1-' + S + '"></div>' +
                '</div></div>';
        }

        // ── 2. 컴포넌트 초기화 ──
        listener.initPgm = function() {
            // 검색폼
            if (def.search && def.search.length > 0) {
                ctx.searchForm = new FormaForm('#search-' + S, { search: true, elements: def.search });
            }

            // grid1
            if (def.grids && def.grids.grid1) {
                var gd = def.grids.grid1;
                ctx.grid1 = new FormaGrid('#grid1-' + S, {
                    editable: gd.editable || false,
                    checkable: gd.checkable || false,
                    sortable: gd.sortable || false,
                    columns: gd.columns || []
                });
            }

            // grid2 (split-detail, master-detail)
            if (def.grids && def.grids.grid2) {
                var gd2 = def.grids.grid2;
                ctx.grid2 = new FormaGrid('#grid2-' + S, {
                    editable: gd2.editable || false,
                    checkable: gd2.checkable || false,
                    sortable: gd2.sortable || false,
                    rowNum: gd2.rowNum || false,
                    columns: gd2.columns || []
                });
            }

            // masterForm (master-detail)
            if (def.form) {
                var formKey = Object.keys(def.form)[0]; // 첫 번째 폼
                if (formKey && def.form[formKey]) {
                    var fd = def.form[formKey];
                    ctx.masterForm = new FormaForm('#form-' + S, {
                        columns: fd.columns || 2,
                        labelWidth: fd.labelWidth || 120,
                        elements: fd.elements || []
                    });
                    ctx.masterForm.formReadonly(true); // 초기 읽기전용
                }
            }

            // grid1 클릭 → grid2 로딩 (split-detail / master-detail)
            if (ctx.grid2) {
                listener.gridRow.click = function(record) {
                    ctx._selectedRow = record;
                    // masterForm에 세팅
                    if (ctx.masterForm) {
                        ctx.masterForm.setData(record);
                    }
                    // grid2 로딩
                    var params = {};
                    for (var key in record) {
                        params[key.toLowerCase()] = record[key];
                    }
                    var cb = new Callback(function(r) {
                        if (r.resultCode === RESULT_CODE.OK && ctx.grid2) ctx.grid2.setData(r.resultData);
                    });
                    cb.setShowLoading(false);
                    platform.post(apiBase + '/selectGrid2', params, cb);
                };
                // FormaGrid에 onRowClick 연결
                if (ctx.grid1) {
                    ctx.grid1.options = ctx.grid1.options || {};
                    ctx.grid1.onRowClick = function(row) { listener.gridRow.click(row); };
                }
            }

            // 스플릿 초기화
            if (typeof FormaUtil !== 'undefined' && FormaUtil.initSplit) {
                FormaUtil.initSplit('#split-' + S);
            }

            listener.button.search.click();
        };

        // ── 3. 버튼 핸들러 ──
        listener.button.search.click = function() {
            var params = ctx.searchForm ? ctx.searchForm.getData() : {};
            platform.post(apiBase + '/selectGrid1', params, new Callback(function(r) {
                if (r.resultCode === RESULT_CODE.OK && ctx.grid1) {
                    ctx.grid1.setData(r.resultData);
                    if (ctx.grid2) ctx.grid2.clearData();
                    if (ctx.masterForm) { ctx.masterForm.clear(); ctx.masterForm.formReadonly(true); }
                }
            }));
        };

        listener.button.save.click = function() {
            // 편집 가능한 그리드를 찾아서 저장
            var targetGrid = null;
            var targetAction = null;
            if (ctx.grid2 && def.grids.grid2 && def.grids.grid2.editable) {
                targetGrid = ctx.grid2;
                targetAction = '/saveGrid2';
            } else if (ctx.grid1 && def.grids.grid1 && def.grids.grid1.editable) {
                targetGrid = ctx.grid1;
                targetAction = '/saveGrid1';
            }
            if (!targetGrid) return;

            var data = targetGrid.getCheckedData();
            if (data.length === 0) data = targetGrid.getModifiedData ? targetGrid.getModifiedData() : [];
            if (data.length === 0) { FormaPopup.alert.show('저장할 항목이 없습니다.'); return; }

            // split-detail: 선택된 마스터 행 정보를 디테일에 주입
            if (ctx._selectedRow && targetAction === '/saveGrid2') {
                data.forEach(function(row) {
                    for (var key in ctx._selectedRow) {
                        if (!row.hasOwnProperty(key)) row[key] = ctx._selectedRow[key];
                    }
                });
            }

            FormaPopup.confirm.show('저장하시겠습니까?', function(ok) {
                if (ok) platform.post(apiBase + targetAction, data, new Callback(function(r) {
                    if (r.resultCode === RESULT_CODE.OK) {
                        FormaPopup.toast.success('저장되었습니다.');
                        if (targetAction === '/saveGrid2' && ctx._selectedRow) {
                            listener.gridRow.click(ctx._selectedRow); // 디테일 재로딩
                        } else {
                            listener.button.search.click();
                        }
                    }
                }));
            });
        };

        listener.button.del.click = function() {
            var targetGrid = null;
            var targetAction = null;
            if (ctx.grid2 && def.grids.grid2 && def.grids.grid2.editable && def.grids.grid2.checkable) {
                targetGrid = ctx.grid2;
                targetAction = '/deleteGrid2';
            } else if (ctx.grid1 && def.grids.grid1) {
                targetGrid = ctx.grid1;
                targetAction = '/deleteGrid1';
            }
            if (!targetGrid) return;

            var data = targetGrid.getCheckedData();
            if (data.length === 0) { FormaPopup.alert.show('삭제할 항목을 선택하세요.'); return; }

            FormaPopup.confirm.show(data.length + '건 삭제하시겠습니까?', function(ok) {
                if (ok) platform.post(apiBase + targetAction, data, new Callback(function(r) {
                    if (r.resultCode === RESULT_CODE.OK) {
                        FormaPopup.toast.success('삭제되었습니다.');
                        if (targetAction.indexOf('Grid2') >= 0 && ctx._selectedRow) {
                            listener.gridRow.click(ctx._selectedRow);
                        } else {
                            listener.button.search.click();
                        }
                    }
                }));
            });
        };

        listener.button.news.click = function() {
            var targetGrid = (ctx.grid2 && def.grids.grid2 && def.grids.grid2.editable) ? ctx.grid2 : ctx.grid1;
            if (!targetGrid) return;
            var defaults = {};
            // 마스터 행 키 값을 기본값으로 주입
            if (targetGrid === ctx.grid2 && ctx._selectedRow) {
                for (var key in ctx._selectedRow) defaults[key] = ctx._selectedRow[key];
            }
            targetGrid.addRow(defaults);
        };

        listener.button.init.click = function() {
            if (ctx.searchForm) ctx.searchForm.clear();
            if (ctx.grid1) ctx.grid1.clearData();
            if (ctx.grid2) ctx.grid2.clearData();
            if (ctx.masterForm) { ctx.masterForm.clear(); ctx.masterForm.formReadonly(true); }
        };

        tab.listener = listener;

        // ── 4. PGM init + 툴바 ──
        try {
            var initRes = await platform.get('/api/pgm/' + PGM + '/init');
            if (initRes.resultCode === RESULT_CODE.OK) {
                listener.pgmInfo = initRes.resultData.pgmInfo;
                listener.pgmAuth = initRes.resultData.pgmAuth;
            }
        } catch (e) {
            listener.pgmInfo = {};
            listener.pgmAuth = {};
        }

        FormaToolbar.render('#toolbar-' + S, {
            listener: listener,
            pgmInfo: listener.pgmInfo,
            pgmAuth: listener.pgmAuth
        });

        listener.initPgm();
        listener.initializedPgm = true;
    },

    /**
     * 커스텀 HTML 화면 로딩 (fetch → script 실행)
     */
    async _loadHtmlScreen(tab, url) {
        tab.type = 'html';
        try {
            var res = await fetch(url);
            var html = await res.text();

            // HTML에서 body 내용만 추출
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var body = doc.body;

            // 스크립트 분리
            var scripts = body.querySelectorAll('script');
            var scriptContents = [];
            scripts.forEach(function(s) {
                if (s.src) {
                    // 외부 스크립트는 이미 로딩된 프레임워크이므로 스킵
                } else {
                    scriptContents.push(s.textContent);
                }
                s.remove();
            });

            // DOM 삽입
            tab.container.innerHTML = body.innerHTML;

            // 스크립트 실행
            scriptContents.forEach(function(code) {
                try { new Function(code)(); } catch (e) { console.error('Script error in', tab.id, e); }
            });
        } catch (e) {
            tab.container.innerHTML = '<div style="padding:40px;color:#e53935;">화면 로딩 실패: ' + url + '</div>';
            console.error('Load failed:', url, e);
        }
    },

    /**
     * URL에서 screen ID 추출
     * /pages/screen.html?id=MMA010 → MMA010
     */
    _extractScreenId(url) {
        if (!url) return null;
        if (url.indexOf('screen.html') < 0) return null;
        var match = url.match(/[?&]id=([^&]+)/);
        return match ? match[1] : null;
    },

    _createTabBtn(tab) {
        var self = this;
        var btn = document.createElement('div');
        btn.className = 'forma-mdi-tab';
        btn.dataset.tabId = tab.id;

        var label = document.createElement('span');
        label.className = 'forma-mdi-tab-label';
        label.textContent = tab.label;
        label.onclick = function() { self._activate(tab.id); };

        var close = document.createElement('span');
        close.className = 'forma-mdi-tab-close';
        close.innerHTML = '&times;';
        close.onclick = function(e) { e.stopPropagation(); self.close(tab.id); };

        btn.appendChild(label);
        btn.appendChild(close);

        // 우클릭 컨텍스트 메뉴
        btn.oncontextmenu = function(e) {
            e.preventDefault();
            self._showTabContextMenu(e, tab.id);
        };

        return btn;
    },

    _activate(id) {
        this._activeId = id;
        for (var key in this._tabs) {
            var t = this._tabs[key];
            var active = t.id === id;
            t.btn.classList.toggle('active', active);
            t.container.style.display = active ? '' : 'none';
        }
        if (this.onTabChange) this.onTabChange(id);
    },

    close(id) {
        var tab = this._tabs[id];
        if (!tab) return;

        // 컴포넌트 정리
        if (tab.ctx) {
            for (var key in tab.ctx) {
                if (tab.ctx[key] && typeof tab.ctx[key].destroy === 'function') {
                    tab.ctx[key].destroy();
                }
            }
        }
        // listener 정리
        if (tab.listener && tab.listener.pgmId) {
            delete platform.listener[tab.listener.pgmId];
        }

        tab.btn.remove();
        tab.container.remove();
        delete this._tabs[id];
        this._order = this._order.filter(function(i) { return i !== id; });

        if (this._activeId === id) {
            if (this._order.length > 0) {
                this._activate(this._order[this._order.length - 1]);
            } else {
                this._activeId = null;
                var welcome = this._contentEl.querySelector('.erp-welcome');
                if (welcome) welcome.style.display = '';
            }
        }
    },

    closeAll() {
        var ids = this._order.slice();
        for (var i = 0; i < ids.length; i++) this.close(ids[i]);
    },

    closeOthers(keepId) {
        var ids = this._order.filter(function(i) { return i !== keepId; });
        for (var i = 0; i < ids.length; i++) this.close(ids[i]);
    },

    _showTabContextMenu(e, tabId) {
        // 기존 메뉴 제거
        var old = document.querySelector('.forma-tab-ctx');
        if (old) old.remove();

        var self = this;
        var menu = document.createElement('div');
        menu.className = 'forma-tab-ctx';
        menu.style.cssText = 'position:fixed;z-index:9999;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.15);padding:4px 0;font-size:12px;';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        var items = [
            { label: '닫기', fn: function() { self.close(tabId); } },
            { label: '다른 탭 모두 닫기', fn: function() { self.closeOthers(tabId); } },
            { label: '전체 닫기', fn: function() { self.closeAll(); } }
        ];

        items.forEach(function(item) {
            var div = document.createElement('div');
            div.textContent = item.label;
            div.style.cssText = 'padding:6px 16px;cursor:pointer;';
            div.onmouseover = function() { div.style.background = '#f0f2f5'; };
            div.onmouseout = function() { div.style.background = ''; };
            div.onclick = function() { menu.remove(); item.fn(); };
            menu.appendChild(div);
        });

        document.body.appendChild(menu);
        setTimeout(function() {
            document.addEventListener('click', function handler() {
                menu.remove();
                document.removeEventListener('click', handler);
            });
        }, 0);
    },

    getActiveId() { return this._activeId; },
    getOpenTabs() { return this._order.map(function(id) { var t = this._tabs[id]; return { id: t.id, label: t.label }; }.bind(this)); },
    isOpen(id) { return !!this._tabs[id]; },

    onTabChange: null
};

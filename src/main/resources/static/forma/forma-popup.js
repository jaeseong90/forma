/**
 * FormaPopup - 코드 검색 팝업
 * 모달 팝업에서 검색 + 그리드 선택.
 */
class FormaPopup {
    static open(options) {
        const overlay = document.createElement('div');
        overlay.className = 'forma-popup-overlay';

        const modal = document.createElement('div');
        modal.className = 'forma-popup';
        modal.innerHTML = `
            <div class="forma-popup-header">
                <span>${options.title || '검색'}</span>
                <button class="forma-popup-close">&times;</button>
            </div>
            <div class="forma-popup-search">
                <input type="text" class="forma-input" placeholder="검색어 입력" />
                <button class="forma-btn">검색</button>
            </div>
            <div class="forma-popup-grid"></div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const closeBtn = modal.querySelector('.forma-popup-close');
        closeBtn.onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const searchInput = modal.querySelector('input');
        const searchBtn = modal.querySelector('.forma-popup-search button');
        const gridContainer = modal.querySelector('.forma-popup-grid');

        const grid = new FormaGrid(null, {
            columns: options.columns,
            onSelect: (row) => {
                if (options.onSelect) options.onSelect(row);
                overlay.remove();
            }
        });
        grid.container = gridContainer;
        grid._build();

        const doSearch = async () => {
            const keyword = searchInput.value;
            const data = await FormaApi.get(options.url, {keyword, _size: '20'});
            grid.setData(data.data || data, data.total);
        };

        searchBtn.onclick = doSearch;
        searchInput.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };
        doSearch();
    }
}

/**
 * FORMA Frontend Framework - Loader
 * 각 컴포넌트를 순서대로 로딩한다.
 * 빌드 도구 없이 <script src="/forma/forma.js"> 하나로 전체 프레임워크 사용.
 */
(function () {
    const base = document.currentScript?.src.replace(/forma\.js.*$/, '') || '/forma/';
    const modules = [
        'forma-api.js',
        'forma-format.js',
        'forma-grid.js',
        'forma-search.js',
        'forma-form.js',
        'forma-popup.js',
        'forma-page.js',
        'forma-toast.js',
        'forma-dialog.js',
    ];

    // 동기 순서 보장을 위해 document.write 사용 (DOMContentLoaded 전에 로딩)
    for (const mod of modules) {
        document.write(`<script src="${base}${mod}"><\/script>`);
    }
})();

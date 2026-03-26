/**
 * FormaTheme — 테마/다크모드 시스템
 *
 * FormaTheme.set('dark');
 * FormaTheme.toggle();
 */
const FormaTheme = {
    _current: 'light',
    _themes: {
        light: {
            '--bg': '#f5f5f5', '--bg-card': '#fff', '--bg-header': '#f8f8f8', '--bg-alt': '#fafbfc',
            '--bg-hover': '#f0f7ff', '--bg-selected': '#e3effa', '--bg-input': '#fff',
            '--text': '#333', '--text-sub': '#555', '--text-muted': '#999',
            '--border': '#e0e0e0', '--border-light': '#eee',
            '--primary': '#4a90d9', '--primary-hover': '#3a7bc8', '--primary-text': '#fff',
            '--danger': '#e24b4a', '--success': '#4caf50', '--warning': '#ff9800',
            '--shadow': 'rgba(0,0,0,0.12)',
            // 확장 변수
            '--bg-loading': 'rgba(255,255,255,0.5)',
            '--bg-overlay': 'rgba(0,0,0,0.4)',
            '--bg-group': '#f0f4f8', '--bg-group-hover': '#e3ecf5', '--bg-group-footer': '#f5f7fa',
            '--bg-filter': '#f0f4f8', '--bg-detail-toolbar': '#f0f4f8',
            '--bg-detail-row': '#f8f9fb', '--bg-drag': '#e3effa',
            '--border-group': '#d0d8e0', '--border-detail': '#d0d8e0',
            '--bg-scrollbar-track': '#f0f0f0', '--bg-scrollbar-thumb': '#c0c8d0', '--bg-scrollbar-hover': '#a0a8b0',
            '--bg-split-handle': '#e8ecf0', '--bg-split-btn': '#d0d8e0',
            '--bg-pill': '#e3effa', '--text-pill': '#333',
            '--bg-cal-hover': '#e8f0fe',
            '--bg-cell-error': '#fff0f0',
            '--text-cell-red': '#e24b4a', '--text-cell-blue': '#4a90d9', '--text-cell-navy': '#1a3c6e',
            '--bg-cell-yel': '#fffde7', '--bg-cell-pnk': '#fce4ec', '--bg-cell-lav': '#f3e5f5',
            '--frozen-shadow': 'rgba(0,0,0,0.06)',
            // 헤더 바
            '--header-bg': '#1a2332', '--header-text': '#fff', '--header-sub': '#a0b0c0',
            '--header-border': '#3a4a5a', '--header-hover': '#2a3a4a',
            '--header-logo': '#5b9ef4',
        },
        dark: {
            '--bg': '#1e1e2e', '--bg-card': '#2a2a3c', '--bg-header': '#252537', '--bg-alt': '#23233a',
            '--bg-hover': '#33335a', '--bg-selected': '#3a3a6a', '--bg-input': '#2f2f45',
            '--text': '#e0e0e0', '--text-sub': '#b0b0c0', '--text-muted': '#777',
            '--border': '#3a3a50', '--border-light': '#333348',
            '--primary': '#6aa3e0', '--primary-hover': '#5090d0', '--primary-text': '#fff',
            '--danger': '#f06060', '--success': '#66bb6a', '--warning': '#ffa726',
            '--shadow': 'rgba(0,0,0,0.4)',
            // 확장 변수
            '--bg-loading': 'rgba(30,30,46,0.6)',
            '--bg-overlay': 'rgba(0,0,0,0.6)',
            '--bg-group': '#2e2e44', '--bg-group-hover': '#36365a', '--bg-group-footer': '#2a2a40',
            '--bg-filter': '#2e2e44', '--bg-detail-toolbar': '#2e2e44',
            '--bg-detail-row': '#252538', '--bg-drag': '#3a3a6a',
            '--border-group': '#3a3a50', '--border-detail': '#3a3a50',
            '--bg-scrollbar-track': '#2a2a3c', '--bg-scrollbar-thumb': '#4a4a64', '--bg-scrollbar-hover': '#5a5a78',
            '--bg-split-handle': '#3a3a50', '--bg-split-btn': '#4a4a64',
            '--bg-pill': '#3a3a6a', '--text-pill': '#e0e0e0',
            '--bg-cal-hover': '#33335a',
            '--bg-cell-error': '#3a2020',
            '--text-cell-red': '#f06060', '--text-cell-blue': '#6aa3e0', '--text-cell-navy': '#8ab4e8',
            '--bg-cell-yel': '#3a3520', '--bg-cell-pnk': '#3a2028', '--bg-cell-lav': '#302838',
            '--frozen-shadow': 'rgba(0,0,0,0.25)',
            // 헤더 바
            '--header-bg': '#16162a', '--header-text': '#e0e0e0', '--header-sub': '#888',
            '--header-border': '#3a3a50', '--header-hover': '#22223a',
            '--header-logo': '#6aa3e0',
        },
        blue: {
            '--bg': '#eaf2fb', '--bg-card': '#fff', '--bg-header': '#d6e6f5', '--bg-alt': '#f0f6fc',
            '--bg-hover': '#d0e4f7', '--bg-selected': '#b8d4f0', '--bg-input': '#fff',
            '--text': '#1a3c6e', '--text-sub': '#2c5a8f', '--text-muted': '#7094b8',
            '--border': '#b8d4f0', '--border-light': '#d6e6f5',
            '--primary': '#2574b8', '--primary-hover': '#1a5c96', '--primary-text': '#fff',
            '--danger': '#d32f2f', '--success': '#388e3c', '--warning': '#f57c00',
            '--shadow': 'rgba(0,0,0,0.1)',
            // 확장 변수
            '--bg-loading': 'rgba(234,242,251,0.6)',
            '--bg-overlay': 'rgba(0,0,0,0.35)',
            '--bg-group': '#d6e6f5', '--bg-group-hover': '#c4d8ed', '--bg-group-footer': '#e0ecf6',
            '--bg-filter': '#d6e6f5', '--bg-detail-toolbar': '#d6e6f5',
            '--bg-detail-row': '#e8f0f8', '--bg-drag': '#b8d4f0',
            '--border-group': '#a8c8e8', '--border-detail': '#a8c8e8',
            '--bg-scrollbar-track': '#d6e6f5', '--bg-scrollbar-thumb': '#a0c0dc', '--bg-scrollbar-hover': '#88b0d0',
            '--bg-split-handle': '#b8d4f0', '--bg-split-btn': '#a0c0dc',
            '--bg-pill': '#b8d4f0', '--text-pill': '#1a3c6e',
            '--bg-cal-hover': '#c4d8ed',
            '--bg-cell-error': '#fce8e8',
            '--text-cell-red': '#d32f2f', '--text-cell-blue': '#2574b8', '--text-cell-navy': '#1a3c6e',
            '--bg-cell-yel': '#faf5e0', '--bg-cell-pnk': '#fce4ec', '--bg-cell-lav': '#ece0f5',
            '--frozen-shadow': 'rgba(0,0,0,0.08)',
            // 헤더 바
            '--header-bg': '#1a4a7a', '--header-text': '#fff', '--header-sub': '#a0c8e8',
            '--header-border': '#2574b8', '--header-hover': '#1a5c96',
            '--header-logo': '#a0d0f0',
        }
    },

    set(theme) {
        if (!this._themes[theme]) return;
        this._current = theme;
        const vars = this._themes[theme];
        const root = document.documentElement;
        for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
        document.body.dataset.theme = theme;
        localStorage.setItem('forma-theme', theme);
    },

    get() { return this._current; },

    toggle() {
        const themes = Object.keys(this._themes);
        const idx = (themes.indexOf(this._current) + 1) % themes.length;
        this.set(themes[idx]);
    },

    addTheme(name, vars) { this._themes[name] = vars; },

    init() {
        const saved = localStorage.getItem('forma-theme');
        if (saved && this._themes[saved]) this.set(saved);
        else this.set('light');
    }
};
FormaTheme.init();

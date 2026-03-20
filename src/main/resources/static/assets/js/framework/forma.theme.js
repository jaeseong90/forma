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
        },
        dark: {
            '--bg': '#1e1e2e', '--bg-card': '#2a2a3c', '--bg-header': '#252537', '--bg-alt': '#23233a',
            '--bg-hover': '#33335a', '--bg-selected': '#3a3a6a', '--bg-input': '#2f2f45',
            '--text': '#e0e0e0', '--text-sub': '#b0b0c0', '--text-muted': '#777',
            '--border': '#3a3a50', '--border-light': '#333348',
            '--primary': '#6aa3e0', '--primary-hover': '#5090d0', '--primary-text': '#fff',
            '--danger': '#f06060', '--success': '#66bb6a', '--warning': '#ffa726',
            '--shadow': 'rgba(0,0,0,0.4)',
        },
        blue: {
            '--bg': '#eaf2fb', '--bg-card': '#fff', '--bg-header': '#d6e6f5', '--bg-alt': '#f0f6fc',
            '--bg-hover': '#d0e4f7', '--bg-selected': '#b8d4f0', '--bg-input': '#fff',
            '--text': '#1a3c6e', '--text-sub': '#2c5a8f', '--text-muted': '#7094b8',
            '--border': '#b8d4f0', '--border-light': '#d6e6f5',
            '--primary': '#2574b8', '--primary-hover': '#1a5c96', '--primary-text': '#fff',
            '--danger': '#d32f2f', '--success': '#388e3c', '--warning': '#f57c00',
            '--shadow': 'rgba(0,0,0,0.1)',
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

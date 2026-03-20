/**
 * FormaChart — 경량 SVG 차트 (외부 라이브러리 없음)
 *
 * new FormaChart('#chart-area', {
 *     type: 'bar',  // bar, line, pie, donut
 *     data: [...],
 *     width: 400, height: 300
 * });
 */
class FormaChart {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        this.type = options.type || 'bar';
        this.data = options.data || [];
        this.width = options.width || this.container?.offsetWidth || 400;
        this.height = options.height || 300;
        this.title = options.title || '';
        this.colors = options.colors || ['#4a90d9','#4caf50','#ff9800','#e24b4a','#9c27b0','#00bcd4','#795548','#607d8b','#f06292','#aed581'];
        this.showLegend = options.legend !== false;
        this.showValue = options.showValue !== false;
        this.animate = options.animate !== false;
        if (this.container && this.data.length > 0) this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.style.position = 'relative';

        if (this.type === 'bar') this._renderBar();
        else if (this.type === 'line') this._renderLine();
        else if (this.type === 'pie' || this.type === 'donut') this._renderPie();
        else if (this.type === 'hbar') this._renderHBar();
    }

    setData(data) { this.data = data; this.render(); }

    _svg(w, h) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', w); svg.setAttribute('height', h);
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.style.overflow = 'visible';
        return svg;
    }

    _renderBar() {
        const W = this.width, H = this.height;
        const pad = { t: this.title ? 30 : 10, r: 10, b: 40, l: 60 };
        const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
        const svg = this._svg(W, H);
        this.container.appendChild(svg);

        // 타이틀
        if (this.title) this._text(svg, W / 2, 18, this.title, { size: 13, weight: 600, anchor: 'middle', fill: 'var(--text,#333)' });

        const maxVal = Math.max(...this.data.map(d => d.value), 1);
        const barW = Math.min(40, cw / this.data.length * 0.6);
        const gap = cw / this.data.length;

        // Y축 눈금
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + ch - (ch * i / 4);
            const val = Math.round(maxVal * i / 4);
            this._line(svg, pad.l, y, W - pad.r, y, '#eee');
            this._text(svg, pad.l - 6, y + 4, this._fmtNum(val), { size: 10, anchor: 'end', fill: 'var(--text-muted,#999)' });
        }

        // 바
        this.data.forEach((d, i) => {
            const x = pad.l + gap * i + (gap - barW) / 2;
            const h = (d.value / maxVal) * ch;
            const y = pad.t + ch - h;
            const rect = this._rect(svg, x, this.animate ? pad.t + ch : y, barW, this.animate ? 0 : h, this.colors[i % this.colors.length], 3);
            if (this.animate) { rect.style.transition = 'all 0.6s ease'; requestAnimationFrame(() => { rect.setAttribute('y', y); rect.setAttribute('height', h); }); }
            // 툴팁
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = d.label + ': ' + this._fmtNum(d.value);
            rect.appendChild(title);
            // 라벨
            this._text(svg, x + barW / 2, H - pad.b + 14, d.label, { size: 10, anchor: 'middle', fill: 'var(--text-sub,#555)' });
            if (this.showValue) this._text(svg, x + barW / 2, y - 4, this._fmtNum(d.value), { size: 9, anchor: 'middle', fill: 'var(--text-muted,#999)' });
        });
    }

    _renderLine() {
        const W = this.width, H = this.height;
        const pad = { t: this.title ? 30 : 10, r: 10, b: 40, l: 60 };
        const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
        const svg = this._svg(W, H);
        this.container.appendChild(svg);

        if (this.title) this._text(svg, W / 2, 18, this.title, { size: 13, weight: 600, anchor: 'middle', fill: 'var(--text,#333)' });

        const maxVal = Math.max(...this.data.map(d => d.value), 1);
        const gap = cw / Math.max(this.data.length - 1, 1);

        // Y축
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + ch - (ch * i / 4);
            this._line(svg, pad.l, y, W - pad.r, y, '#eee');
            this._text(svg, pad.l - 6, y + 4, this._fmtNum(Math.round(maxVal * i / 4)), { size: 10, anchor: 'end', fill: 'var(--text-muted,#999)' });
        }

        // 라인 + 점
        let points = '';
        this.data.forEach((d, i) => {
            const x = pad.l + gap * i;
            const y = pad.t + ch - (d.value / maxVal) * ch;
            points += (i === 0 ? 'M' : 'L') + x + ',' + y;
            // 점
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 4);
            c.setAttribute('fill', this.colors[0]); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 2);
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = d.label + ': ' + this._fmtNum(d.value); c.appendChild(title);
            svg.appendChild(c);
            this._text(svg, x, H - pad.b + 14, d.label, { size: 10, anchor: 'middle', fill: 'var(--text-sub,#555)' });
        });
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', points); path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.colors[0]); path.setAttribute('stroke-width', 2);
        if (this.animate) { path.style.strokeDasharray = path.getTotalLength?.() || 1000; path.style.strokeDashoffset = path.getTotalLength?.() || 1000; path.style.transition = 'stroke-dashoffset 1s ease'; requestAnimationFrame(() => path.style.strokeDashoffset = 0); }
        svg.insertBefore(path, svg.firstChild?.nextSibling || null);
    }

    _renderPie() {
        const W = this.width, H = this.height;
        const cx = W / 2, cy = (this.title ? 20 : 0) + (H - (this.title ? 20 : 0) - (this.showLegend ? 30 : 0)) / 2;
        const r = Math.min(cx - 10, cy - 10) * 0.85;
        const ir = this.type === 'donut' ? r * 0.55 : 0;
        const svg = this._svg(W, H);
        this.container.appendChild(svg);

        if (this.title) this._text(svg, W / 2, 18, this.title, { size: 13, weight: 600, anchor: 'middle', fill: 'var(--text,#333)' });

        const total = this.data.reduce((s, d) => s + d.value, 0) || 1;
        let angle = -Math.PI / 2;

        this.data.forEach((d, i) => {
            const slice = (d.value / total) * Math.PI * 2;
            const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
            const x2 = cx + r * Math.cos(angle + slice), y2 = cy + r * Math.sin(angle + slice);
            const ix1 = cx + ir * Math.cos(angle), iy1 = cy + ir * Math.sin(angle);
            const ix2 = cx + ir * Math.cos(angle + slice), iy2 = cy + ir * Math.sin(angle + slice);
            const large = slice > Math.PI ? 1 : 0;

            let pathD;
            if (ir > 0) {
                pathD = 'M' + ix1 + ',' + iy1 + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + x2 + ',' + y2 + ' L' + ix2 + ',' + iy2 + ' A' + ir + ',' + ir + ' 0 ' + large + ',0 ' + ix1 + ',' + iy1;
            } else {
                pathD = 'M' + cx + ',' + cy + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + x2 + ',' + y2 + ' Z';
            }
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD); path.setAttribute('fill', this.colors[i % this.colors.length]);
            path.setAttribute('stroke', 'var(--bg-card,#fff)'); path.setAttribute('stroke-width', 2);
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = d.label + ': ' + this._fmtNum(d.value) + ' (' + Math.round(d.value / total * 100) + '%)';
            path.appendChild(title);
            svg.appendChild(path);
            angle += slice;
        });

        // 범례
        if (this.showLegend) {
            const ly = H - 16;
            let lx = 10;
            this.data.forEach((d, i) => {
                this._rect(svg, lx, ly - 8, 10, 10, this.colors[i % this.colors.length], 2);
                this._text(svg, lx + 14, ly, d.label + ' (' + Math.round(d.value / total * 100) + '%)', { size: 10, fill: 'var(--text-sub,#555)' });
                lx += (d.label.length * 7) + 50;
            });
        }
    }

    _renderHBar() {
        const W = this.width, H = this.height;
        const pad = { t: this.title ? 30 : 10, r: 10, b: 10, l: 80 };
        const ch = H - pad.t - pad.b;
        const barH = Math.min(24, ch / this.data.length * 0.7);
        const gap = ch / this.data.length;
        const cw = W - pad.l - pad.r;
        const svg = this._svg(W, H);
        this.container.appendChild(svg);

        if (this.title) this._text(svg, W / 2, 18, this.title, { size: 13, weight: 600, anchor: 'middle', fill: 'var(--text,#333)' });

        const maxVal = Math.max(...this.data.map(d => d.value), 1);
        this.data.forEach((d, i) => {
            const y = pad.t + gap * i + (gap - barH) / 2;
            const w = (d.value / maxVal) * cw;
            this._text(svg, pad.l - 6, y + barH / 2 + 4, d.label, { size: 10, anchor: 'end', fill: 'var(--text-sub,#555)' });
            this._rect(svg, pad.l, y, w, barH, this.colors[i % this.colors.length], 3);
            if (this.showValue) this._text(svg, pad.l + w + 6, y + barH / 2 + 4, this._fmtNum(d.value), { size: 10, fill: 'var(--text-muted,#999)' });
        });
    }

    // SVG 헬퍼
    _text(svg, x, y, text, opts = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', x); el.setAttribute('y', y);
        el.setAttribute('font-size', opts.size || 12);
        if (opts.weight) el.setAttribute('font-weight', opts.weight);
        if (opts.anchor) el.setAttribute('text-anchor', opts.anchor);
        el.setAttribute('fill', opts.fill || '#333');
        el.textContent = text;
        svg.appendChild(el);
        return el;
    }
    _rect(svg, x, y, w, h, fill, rx) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('width', w); el.setAttribute('height', h);
        el.setAttribute('fill', fill); if (rx) el.setAttribute('rx', rx);
        svg.appendChild(el); return el;
    }
    _line(svg, x1, y1, x2, y2, stroke) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2);
        el.setAttribute('stroke', stroke); svg.appendChild(el); return el;
    }
    _fmtNum(n) { return typeof n === 'number' ? n.toLocaleString('ko-KR') : n; }
}

/* Shared helpers for the per-project interactive models (no dependencies). */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const K = {};

  K.el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };
  K.txt = (parent, x, y, s, attrs = {}) => { const t = K.el('text', { x, y, ...attrs }, parent); t.textContent = s; return t; };
  K.html = (tag, props = {}, parent) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'text') n.textContent = v; else if (k === 'style') n.style.cssText = v; else n[k] = v;
    }
    if (parent) parent.appendChild(n);
    return n;
  };
  K.nice = (max, n = 4) => {
    if (max <= 0) return { step: 1, top: 1 };
    const raw = max / n, mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    return { step, top: Math.ceil(max / step - 1e-9) * step };
  };
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.ease = t => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  K.param = (name, dflt = null) => new URLSearchParams(location.search).get(name) ?? dflt;
  // ?static renders final states without animation (used for screenshots); also honours reduced-motion
  K.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || K.param('static') !== null;

  // Formatters
  K.fmt = {
    one: v => v == null ? '–' : v.toFixed(1),
    int: v => v == null ? '–' : Math.round(v).toLocaleString('en-US'),
    pct: v => v == null ? '–' : v.toFixed(1) + '%',
    pct0: v => v == null ? '–' : (v * 100).toFixed(1) + '%',
    money: v => {
      if (v == null) return '–';
      const a = Math.abs(v), s = v < 0 ? '−$' : '$';
      return a >= 1e9 ? s + (a / 1e9).toFixed(2) + 'B' : a >= 1e6 ? s + (a / 1e6).toFixed(a >= 1e8 ? 0 : 2) + 'M' : a >= 1e3 ? s + Math.round(a / 1e3) + 'K' : s + Math.round(a);
    },
    axis: v => String(+v.toFixed(2)),
  };

  // Tweening: animate(duration, frame(t)) -> cancel()
  K.animate = (ms, frame, done) => {
    if (K.reduced) { frame(1); done && done(); return () => {}; }
    const t0 = performance.now(); let raf;
    const step = now => {
      const t = K.clamp((now - t0) / ms, 0, 1);   // rAF timestamps can precede t0, so never let t go negative
      frame(K.ease(t));
      if (t < 1) raf = requestAnimationFrame(step); else done && done();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  };

  // Tooltip (values lead, labels follow; text via textContent only)
  let tip;
  K.tip = (evt, title, rows) => {
    if (!tip) { tip = document.getElementById('tip') || K.html('div', { id: 'tip' }, document.body); }
    tip.replaceChildren();
    if (title) K.html('div', { className: 't-title', text: title }, tip);
    for (const r of rows) {
      const row = K.html('div', { className: 't-row' }, tip);
      if (r.color) K.html('span', { className: 'key-line', style: `background:${r.color}` }, row);
      K.html('strong', { text: r.value }, row);
      if (r.name) K.html('span', { className: 'name', text: r.name }, row);
    }
    tip.style.opacity = 1;
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + w > innerWidth - 8) x = evt.clientX - w - pad;
    if (y + h > innerHeight - 8) y = evt.clientY - h - pad;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  K.hideTip = () => { if (tip) tip.style.opacity = 0; };

  // Sequential blue ramp (palette steps 100..700); dark mode runs it the other way so "low" recedes into the surface
  const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  K.isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };
  K.seq = t => {
    t = K.clamp(t, 0, 1);
    const ramp = K.isDark() ? RAMP.slice(4).reverse().concat([]) : RAMP;
    const p = t * (ramp.length - 1), i = Math.min(ramp.length - 2, Math.floor(p)), f = p - i;
    const a = hex(ramp[i]), b = hex(ramp[i + 1]);
    return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
  };
  K.seqTextColor = t => {               // label inside a fill: white on dark fills, near-black on light ones
    const dark = K.isDark();
    return (dark ? t > 0.55 : t < 0.45) ? '#0b0b0b' : '#ffffff';
  };
  K.rampCss = () => `linear-gradient(90deg, ${[0, .25, .5, .75, 1].map(K.seq).join(',')})`;

  K.legend = (container, items, kind = 'rect') => {
    const lg = K.html('div', { className: 'legend' }, container);
    items.forEach(([name, color]) => {
      const sp = K.html('span', {}, lg);
      K.html('i', { className: 'key-' + kind, style: `background:${color}` }, sp);
      sp.appendChild(document.createTextNode(name));
    });
    return lg;
  };

  K.table = (container, headers, rows, label = 'Show data table') => {
    const d = K.html('details', { className: 'tbl' }, container);
    K.html('summary', { text: label }, d);
    const sc = K.html('div', { className: 'scroll' }, d);
    const t = K.html('table', {}, sc);
    const hr = K.html('tr', {}, t);
    headers.forEach((h, i) => K.html('th', { text: h, className: i ? 'n' : '' }, hr));
    rows.forEach(r => { const tr = K.html('tr', {}, t); r.forEach((c, i) => K.html('td', { text: c, className: i ? 'n' : '' }, tr)); });
    return d;
  };

  // Play / scrub control over a fractional position 0..n-1
  K.timeline = (container, { labels, onChange, speed = 1, loop = false }) => {
    const box = K.html('div', { className: 'timeline' }, container);
    const btn = K.html('button', { className: 'btn primary play', type: 'button', text: '▶', title: 'Play' }, box);
    btn.setAttribute('aria-label', 'Play');
    const range = K.html('input', { type: 'range', min: 0, max: labels.length - 1, step: 0.01, value: 0 }, box);
    range.setAttribute('aria-label', 'Time');
    const year = K.html('div', { className: 'year', text: labels[0] }, box);
    let pos = 0, playing = false, raf, last;
    const set = p => {
      pos = K.clamp(p, 0, labels.length - 1);
      range.value = pos; year.textContent = labels[Math.round(pos)];
      onChange(pos);
    };
    const tick = now => {
      if (!playing) return;
      const dt = (now - last) / 1000; last = now;
      let p = pos + dt * speed;
      if (p >= labels.length - 1) { if (loop) p = 0; else { p = labels.length - 1; stop(); } }
      set(p);
      if (playing) raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (pos >= labels.length - 1) set(0);
      playing = true; btn.textContent = '❚❚'; btn.setAttribute('aria-label', 'Pause'); last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { playing = false; btn.textContent = '▶'; btn.setAttribute('aria-label', 'Play'); cancelAnimationFrame(raf); };
    btn.addEventListener('click', () => playing ? stop() : play());
    range.addEventListener('input', () => { stop(); set(+range.value); });
    return { set, play, stop, get pos() { return pos; } };
  };

  // Theme toggle shared by every model page
  K.themeToggle = (btn, onChange) => {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme'); if (saved) root.dataset.theme = saved;
    btn.addEventListener('click', () => {
      root.dataset.theme = K.isDark() ? 'light' : 'dark';
      localStorage.setItem('theme', root.dataset.theme);
      onChange && onChange();
    });
  };

  K.onResize = fn => { let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fn, 150); }); };

  window.Kit = K;
})();

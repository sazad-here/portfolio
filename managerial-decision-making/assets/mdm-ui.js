/* Small chart helpers shared by the Managerial Decision Making models (builds on model-kit.js). */
(() => {
  const K = window.Kit;
  const U = {};

  U.scale = (d0, d1, r0, r1) => {
    const f = v => r0 + (v - d0) / ((d1 - d0) || 1) * (r1 - r0);
    f.inv = p => d0 + (p - r0) / ((r1 - r0) || 1) * (d1 - d0);
    f.d = [d0, d1];
    return f;
  };
  U.ticks = (lo, hi, n = 5) => {
    const { step } = K.nice(hi - lo, n); const out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  };
  U.domain = (vals, pad = 0.05, zero = false) => {
    let lo = Math.min(...vals), hi = Math.max(...vals); if (zero) lo = Math.min(0, lo);
    const p = (hi - lo || 1) * pad; return [zero && lo === 0 ? 0 : lo - p, hi + p];
  };
  U.compact = v => {
    const a = Math.abs(v);
    return a >= 1e6 ? (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : a >= 1e3 ? (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(+v.toFixed(2));
  };
  U.money = v => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // grid + axes; returns { svg, sx, sy, W, H, m }
  U.plot = (box, { W, H = 320, m = { l: 52, r: 14, t: 12, b: 40 }, x, y, xFmt = U.compact, yFmt = U.compact, xLabel = '', yLabel = '', xTicks, yTicks }) => {
    box.replaceChildren();
    W = W || box.clientWidth || 640;
    const svg = K.el('svg', { width: W, height: H, role: 'img' }, box);
    const sx = U.scale(x[0], x[1], m.l, W - m.r), sy = U.scale(y[0], y[1], H - m.b, m.t);
    (yTicks || U.ticks(y[0], y[1])).forEach(v => {
      K.el('line', { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), style: 'stroke:var(--grid)' }, svg);
      K.txt(svg, m.l - 6, sy(v) + 4, yFmt(v), { 'text-anchor': 'end', class: 'muted' });
    });
    (xTicks || U.ticks(x[0], x[1])).forEach(v => K.txt(svg, sx(v), H - m.b + 16, xFmt(v), { 'text-anchor': 'middle', class: 'muted' }));
    K.el('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, style: 'stroke:var(--axis)' }, svg);
    if (xLabel) K.txt(svg, (m.l + W - m.r) / 2, H - 6, xLabel, { 'text-anchor': 'middle' });
    if (yLabel) K.txt(svg, m.l + 4, m.t + 10, yLabel, { class: 'muted' });
    // clip path for marks that may run past the plot area (lines drawn across the whole domain)
    const id = 'clip' + Math.random().toString(36).slice(2, 8);
    const defs = K.el('defs', {}, svg), cp = K.el('clipPath', { id }, defs);
    K.el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, cp);
    const clipped = K.el('g', { 'clip-path': `url(#${id})` }, svg);
    return { svg, sx, sy, W, H, m, clipped };
  };

  // animated horizontal bars; remembers previous values on the element so updates tween
  U.hbars = (box, rows, { fmt = U.compact, colors, color = 'var(--series-1)', labelW = 120, max, min, thick = 18, gap = 10, highlight } = {}) => {
    const prev = box._vals || {};
    const draw = t => {
      box.replaceChildren();
      const W = box.clientWidth || 480, right = 72, H = rows.length * (thick + gap) + 6;
      const svg = K.el('svg', { width: W, height: H, role: 'img' }, box);
      const lo = min ?? Math.min(0, ...rows.map(r => r[1])), hi = max ?? Math.max(...rows.map(r => r[1]), 0);
      const sx = U.scale(lo, hi || 1, labelW, W - right);
      rows.forEach(([label, v], i) => {
        const val = K.lerp(prev[label] ?? 0, v, t), y = 3 + i * (thick + gap), x0 = sx(Math.max(lo, 0)), x1 = sx(val);
        K.txt(svg, labelW - 8, y + thick / 2 + 4, label, { 'text-anchor': 'end', style: highlight === label ? 'font-weight:700;fill:var(--text-primary)' : '' });
        const c = colors ? colors[i] : color;
        K.el('rect', { x: Math.min(x0, x1), y, width: Math.max(1, Math.abs(x1 - x0)), height: thick, rx: 4, style: `fill:${c};${highlight && highlight !== label ? 'opacity:.45' : ''}` }, svg);
        K.txt(svg, Math.max(x0, x1) + 6, y + thick / 2 + 4, fmt(val), { class: 'val' });
        const hit = K.el('rect', { x: 0, y: y - gap / 2, width: W, height: thick + gap, fill: 'transparent' }, svg);
        hit.addEventListener('pointermove', e => K.tip(e, label, [{ value: fmt(v), color: c }]));
        hit.addEventListener('pointerleave', K.hideTip);
      });
      if (lo < 0) K.el('line', { x1: sx(0), x2: sx(0), y1: 0, y2: H, style: 'stroke:var(--axis)' }, svg);
    };
    box._cancel && box._cancel();
    box._cancel = K.animate(500, draw, () => { box._vals = Object.fromEntries(rows); });
  };

  U.stat = (box, items) => {
    box.replaceChildren();
    items.forEach(([label, value, note]) => {
      const d = K.html('div', { className: 'stat' }, box);
      K.html('div', { className: 'label', text: label }, d);
      K.html('div', { className: 'value', text: value }, d);
      if (note) K.html('div', { className: 'note', text: note }, d);
    });
  };

  U.slider = (box, { name, min, max, step = 1, value, fmt = v => v, onInput }) => {
    const row = K.html('div', { className: 'slider' }, box);
    K.html('span', { className: 'name', text: name }, row);
    const val = K.html('span', { className: 'value', text: fmt(value) }, row);
    const r = K.html('input', { type: 'range', min, max, step, value }, row);
    r.setAttribute('aria-label', name);
    const api = { get value() { return +r.value; }, set(v) { r.value = v; val.textContent = fmt(+v); val.classList.toggle('changed', +v !== value); } };
    r.addEventListener('input', () => { api.set(r.value); onInput && onInput(+r.value); });
    return api;
  };

  // page chrome shared by every model: theme toggle + resize redraw
  U.page = redraw => { K.themeToggle(document.getElementById('theme'), redraw); K.onResize(redraw); };

  window.Ui = U;
})();

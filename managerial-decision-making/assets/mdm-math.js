/* Math engine for the Managerial Decision Making models: linear programming (two-phase simplex),
   integer programming (branch and bound), least-squares regression, and t / F distributions.
   No dependencies; works in the browser (window.MdmMath) and in Node (module.exports). */
(() => {
  const EPS = 1e-9;

  // ---------- linear programming ----------
  // maximize (or minimize) c·x  s.t.  A x (<=|>=|=) b,  x >= 0
  function lp({ c, A, b, types, maximize = true }) {
    const m = A.length, n = c.length;
    const rows = A.map(r => r.slice()), rhs = b.slice(), tp = types.slice();
    for (let i = 0; i < m; i++) if (rhs[i] < 0) {
      rows[i] = rows[i].map(v => -v); rhs[i] = -rhs[i];
      tp[i] = tp[i] === '<=' ? '>=' : tp[i] === '>=' ? '<=' : '=';
    }
    const nSlack = tp.filter(t => t !== '=').length, nArt = tp.filter(t => t !== '<=').length;
    const W = n + nSlack + nArt;
    const T = [], basis = [];
    let s = n, a = n + nSlack;
    for (let i = 0; i < m; i++) {
      const row = new Array(W + 1).fill(0);
      for (let j = 0; j < n; j++) row[j] = rows[i][j];
      if (tp[i] === '<=') { row[s] = 1; basis.push(s++); }
      else if (tp[i] === '>=') { row[s++] = -1; row[a] = 1; basis.push(a++); }
      else { row[a] = 1; basis.push(a++); }
      row[W] = rhs[i];
      T.push(row);
    }
    const isArt = j => j >= n + nSlack;
    const pivot = (r, col) => {
      const p = T[r][col];
      for (let j = 0; j <= W; j++) T[r][j] /= p;
      for (let i = 0; i < m; i++) if (i !== r && Math.abs(T[i][col]) > EPS) {
        const f = T[i][col];
        for (let j = 0; j <= W; j++) T[i][j] -= f * T[r][j];
      }
      basis[r] = col;
    };
    const run = (cost, banned) => {
      for (let it = 0; it < 5000; it++) {
        let enter = -1;
        for (let j = 0; j < W; j++) {
          if (banned(j)) continue;
          let rc = cost[j];
          for (let i = 0; i < m; i++) rc -= cost[basis[i]] * T[i][j];
          if (rc > 1e-9) { enter = j; break; }          // Bland's rule: first improving column
        }
        if (enter < 0) return 'optimal';
        let leave = -1, best = Infinity;
        for (let i = 0; i < m; i++) if (T[i][enter] > EPS) {
          const ratio = T[i][W] / T[i][enter];
          if (ratio < best - 1e-12 || (Math.abs(ratio - best) <= 1e-12 && basis[i] < basis[leave])) { best = ratio; leave = i; }
        }
        if (leave < 0) return 'unbounded';
        pivot(leave, enter);
      }
      return 'iteration limit';
    };
    // phase 1: drive artificials to zero
    if (nArt) {
      const cost1 = new Array(W).fill(0); for (let j = n + nSlack; j < W; j++) cost1[j] = -1;
      run(cost1, () => false);
      const infeas = basis.reduce((acc, j, i) => acc + (isArt(j) ? T[i][W] : 0), 0);
      if (infeas > 1e-6) return { status: 'infeasible' };
      for (let i = 0; i < m; i++) if (isArt(basis[i])) {
        const j = T[i].findIndex((v, k) => k < n + nSlack && Math.abs(v) > 1e-7);
        if (j >= 0) pivot(i, j);
      }
    }
    // phase 2
    const cost2 = new Array(W).fill(0); for (let j = 0; j < n; j++) cost2[j] = maximize ? c[j] : -c[j];
    const st = run(cost2, isArt);
    if (st !== 'optimal') return { status: st };
    const x = new Array(n).fill(0);
    basis.forEach((j, i) => { if (j < n) x[j] = Math.abs(T[i][W]) < 1e-9 ? 0 : T[i][W]; });
    const z = c.reduce((acc, v, j) => acc + v * x[j], 0);
    return { status: 'optimal', x, z };
  }

  // shadow price of constraint i = change in optimum when its right-hand side grows by one unit
  function shadowPrices(model) {
    const base = lp(model);
    if (base.status !== 'optimal') return null;
    return model.b.map((_, i) => {
      const b = model.b.slice(); b[i] += 1;
      const r = lp({ ...model, b });
      return r.status === 'optimal' ? r.z - base.z : null;
    });
  }

  // integer program: branch and bound on top of lp()
  function ilp(model, intVars = model.c.map((_, j) => j)) {
    let best = null;
    const better = z => best === null || (model.maximize !== false ? z > best.z + 1e-7 : z < best.z - 1e-7);
    const stack = [model];
    let nodes = 0;
    while (stack.length && nodes < 20000) {
      const mdl = stack.pop(); nodes++;
      const r = lp(mdl);
      if (r.status !== 'optimal' || !better(r.z)) continue;
      const j = intVars.find(k => Math.abs(r.x[k] - Math.round(r.x[k])) > 1e-6);
      if (j === undefined) { best = { ...r, x: r.x.map((v, k) => intVars.includes(k) ? Math.round(v) : v) }; continue; }
      const row = new Array(mdl.c.length).fill(0); row[j] = 1;
      stack.push({ ...mdl, A: [...mdl.A, row], b: [...mdl.b, Math.ceil(r.x[j])], types: [...mdl.types, '>='] });
      stack.push({ ...mdl, A: [...mdl.A, row], b: [...mdl.b, Math.floor(r.x[j])], types: [...mdl.types, '<='] });
    }
    return best ? { ...best, nodes } : { status: 'infeasible', nodes };
  }

  // ---------- distributions ----------
  function lgamma(x) {
    const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (const v of g) ser += v / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  }
  function ibeta(x, a, b) {               // regularized incomplete beta I_x(a, b)
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  const tcdf = (t, df) => { const p = 0.5 * ibeta(df / (df + t * t), df / 2, 0.5); return t >= 0 ? 1 - p : p; };
  const tTwoSidedP = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5);
  const fUpperP = (f, d1, d2) => f <= 0 ? 1 : ibeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2);
  function tinv(p, df) {                  // quantile of Student t by bisection
    let lo = -100, hi = 100;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; tcdf(mid, df) < p ? lo = mid : hi = mid; }
    return (lo + hi) / 2;
  }

  // ---------- regression ----------
  function invert(M) {
    const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => +(i === j))]);
    for (let col = 0; col < n; col++) {
      let piv = col; for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      if (Math.abs(A[piv][col]) < 1e-12) return null;
      [A[col], A[piv]] = [A[piv], A[col]];
      const p = A[col][col]; for (let j = 0; j < 2 * n; j++) A[col][j] /= p;
      for (let r = 0; r < n; r++) if (r !== col) { const f = A[r][col]; for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[col][j]; }
    }
    return A.map(r => r.slice(n));
  }
  // y: array, X: array of rows (no intercept column; it is added)
  function ols(X, y) {
    const n = y.length, Xi = X.map(r => [1, ...r]), k = Xi[0].length;
    const XtX = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => Xi.reduce((s, r) => s + r[i] * r[j], 0)));
    const inv = invert(XtX); if (!inv) return null;
    const Xty = Array.from({ length: k }, (_, i) => Xi.reduce((s, r, t) => s + r[i] * y[t], 0));
    const beta = inv.map(row => row.reduce((s, v, j) => s + v * Xty[j], 0));
    const fit = Xi.map(r => r.reduce((s, v, j) => s + v * beta[j], 0));
    const ybar = y.reduce((s, v) => s + v, 0) / n;
    const sse = y.reduce((s, v, t) => s + (v - fit[t]) ** 2, 0), sst = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
    const df = n - k, mse = sse / df;
    const se = inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * mse)));
    const t = beta.map((b, i) => b / se[i]);
    const p = t.map(v => tTwoSidedP(Math.abs(v), df));
    const r2 = 1 - sse / sst, adj = 1 - (1 - r2) * (n - 1) / df;
    const F = ((sst - sse) / (k - 1)) / mse;
    return { beta, se, t, p, r2, adjR2: adj, F, pF: fUpperP(F, k - 1, df), df, n, k, fit, sePred: Math.sqrt(mse) };
  }

  const api = { lp, ilp, shadowPrices, ols, tcdf, tinv, tTwoSidedP, fUpperP, ibeta };
  if (typeof module !== 'undefined') module.exports = api; else window.MdmMath = api;
})();

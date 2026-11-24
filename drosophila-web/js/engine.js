// Motore genetico — porting 1:1 della logica di genetic_map_pygame.py
const GENES = 'ABCDEFGHI';
// Ordine dei caratteri come nel programma originale (num2car)
const CH = [
  { g: 'A', n: 'Colore corpo',   d: 'marrone',    r: 'nero' },
  { g: 'I', n: 'Antenne',        d: 'lunghe',     r: 'corte' },
  { g: 'B', n: 'Forma occhio',   d: 'tondo',      r: 'a barra' },
  { g: 'C', n: 'Colore occhio',  d: 'rosso',      r: 'bianco' },
  { g: 'E', n: 'Setole',         d: 'lunghe',     r: 'corte' },
  { g: 'H', n: 'Ali anteriori',  d: 'lunghe',     r: 'vestigiali' },
  { g: 'D', n: 'Ali posteriori', d: 'vestigiali', r: 'lunghe' },
  { g: 'G', n: 'Zampe',          d: 'lunghe',     r: 'corte' },
  { g: 'F', n: 'Addome',         d: 'segmentato', r: 'liscio' },
];
const MUT_INIT = 0.1, MUT = 0.2, AVG = 250, PREVIEW = 8, N_INIT = 2;

const rnd = () => Math.random();
const coin = () => (rnd() < 0.5 ? 0 : 1);

function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; while (p > L) { k++; p *= rnd(); } return k - 1; }
function numFigli() { return Math.floor(AVG * (0.8 + 0.4 * rnd())); }

// layout: {A:{c:1|2, um:0..1}}  genotipo: {A:[allele omologo a, allele omologo b]}
// Gamete = crossing-over (Poisson(1) punti uniformi, scambio delle code) + scelta casuale di un omologo
function gamete(layout, gt) {
  const out = {};
  for (const c of [1, 2]) {
    const h = coin(), pts = [], n = poisson(1);
    for (let i = 0; i < n; i++) pts.push(rnd());
    for (const g of GENES) {
      if (layout[g].c !== c) continue;
      let s = h;
      for (const r of pts) if (layout[g].um >= r) s ^= 1;
      out[g] = gt[g][s];
    }
  }
  return out;
}
function breed(layout, p1, p2) {
  const a = gamete(layout, p1), b = gamete(layout, p2), ch = {};
  for (const g of GENES) ch[g] = [a[g], b[g]];
  return ch;
}
function mutate(gt, rate) {
  const m = {};
  for (const g of GENES) m[g] = gt[g].map(x => (rnd() < rate ? 0 : x));
  return m;
}
const dom = (gt, g) => gt[g][0] | gt[g][1];
const phenoKey = gt => CH.map(c => dom(gt, c.g)).join('');

// conteggio fenotipi per k caratteri (indici in CH); ordine: dominante prima
function countCross(layout, p1, p2, chars) {
  const N = numFigli(), k = chars.length, counts = new Array(1 << k).fill(0);
  for (let i = 0; i < N; i++) {
    const f = breed(layout, p1, p2);
    let m = 0;
    for (let j = 0; j < k; j++) m = (m << 1) | (dom(f, CH[chars[j]].g) ? 0 : 1);
    counts[m]++;
  }
  return { N, counts };
}
function comboLabel(chars, m) {
  const k = chars.length;
  return chars.map((ci, j) => ((m >> (k - 1 - j)) & 1 ? CH[ci].r : CH[ci].d));
}

// ---- Genoma iniziale (nuovo_genoma.py) e codice partita ----
function specValid(spec) {
  for (const c of [1, 2]) {
    const ums = GENES.split('').filter(g => spec[g].c === c).map(g => spec[g].um);
    if (ums.length < 2) return 'Ogni cromosoma deve contenere almeno 2 geni.';
    if (new Set(ums).size !== ums.length) return 'Due geni sullo stesso cromosoma non possono avere la stessa posizione.';
  }
  return '';
}
function randomSpec(r = rnd) {
  for (;;) {
    const s = {};
    for (const g of GENES) s[g] = { c: r() < 0.5 ? 1 : 2, um: Math.round(r() * 100), dl: r() < 0.5 ? 0 : 1, ot: r() > 0.6 ? 1 : 0 };
    if (!specValid(s)) return s;
  }
}
const layoutOf = spec => Object.fromEntries(GENES.split('').map(g => [g, { c: spec[g].c, um: spec[g].um / 100 }]));
const wildOf = spec => Object.fromEntries(GENES.split('').map(g => [g, spec[g].dl ? [spec[g].ot, 1] : [1, spec[g].ot]]));

const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const MASK = (() => { let m = 0n, s = 20191103; for (let i = 0; i < 100; i++) { s = (s * 1103515245 + 12345) % 2147483648; m = (m << 1n) | BigInt((s >> 16) & 1); } return m; })();
function encode(spec) {
  let v = 0n, sum = 0;
  for (const g of GENES) {
    const s = spec[g], x = ((s.c - 1) << 9) | (s.um << 2) | (s.dl << 1) | s.ot;
    v = (v << 10n) | BigInt(x); sum = (sum * 31 + x) % 1024;
  }
  v = ((v << 10n) | BigInt(sum)) ^ MASK;
  let str = '';
  for (let i = 0; i < 20; i++) { str = ALPH[Number(v & 31n)] + str; v >>= 5n; }
  return str.match(/.{5}/g).join('-');
}
// Codice corto (9 caratteri) per i genomi casuali: 35 bit di seme + 10 bit di controllo.
// Il genoma si rigenera dal seme con un generatore pseudocasuale deterministico.
function prng(seed) { let a = seed >>> 0, b = Math.floor(seed / 4294967296) ^ 0x9e3779b9; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; t ^= b; b = Math.imul(b ^ (b >>> 13), 0x5bd1e995); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const chk10 = seed => { let h = 0x2f; for (let i = 0; i < 35; i += 5) h = (Math.imul(h ^ Math.floor(seed / 2 ** i) % 32, 0x01000193) >>> 0); return h % 1024; };
function shortCode() {
  const seed = Math.floor(rnd() * 2 ** 35);
  let v = BigInt(seed) * 1024n + BigInt(chk10(seed)), str = '';
  for (let i = 0; i < 9; i++) { str = ALPH[Number(v & 31n)] + str; v >>= 5n; }
  return str.match(/.{3}/g).join('-');
}
const clean = code => String(code).toUpperCase().replace(/[^0-9A-Z]/g, '');
function canon(code) { const s = clean(code); return s.length === 9 ? s.match(/.{3}/g).join('-') : s.length === 20 ? s.match(/.{5}/g).join('-') : s; }
function decode(code) {
  const s = clean(code);
  if (s.length === 9) {
    let v = 0n;
    for (const ch of s) { const i = ALPH.indexOf(ch); if (i < 0) return null; v = (v << 5n) | BigInt(i); }
    const seed = Number(v >> 10n);
    return Number(v & 1023n) === chk10(seed) ? randomSpec(prng(seed)) : null;
  }
  if (s.length !== 20) return null;
  let v = 0n;
  for (const ch of s) { const i = ALPH.indexOf(ch); if (i < 0) return null; v = (v << 5n) | BigInt(i); }
  v ^= MASK;
  const sum = Number(v & 1023n); v >>= 10n;
  const xs = [];
  for (let i = 0; i < 9; i++) { xs.unshift(Number(v & 1023n)); v >>= 10n; }
  let chk = 0; const spec = {};
  xs.forEach((x, i) => { chk = (chk * 31 + x) % 1024; spec[GENES[i]] = { c: (x >> 9) + 1, um: (x >> 2) & 127, dl: (x >> 1) & 1, ot: x & 1 }; });
  if (chk !== sum || GENES.split('').some(g => spec[g].um > 100) || specValid(spec)) return null;
  return spec;
}

// ---- Statistica (su richiesta) ----
function lnG(z) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = z, t = z + 5.5; t -= (z + 0.5) * Math.log(t); let s = 1.000000000190015; for (const k of c) s += k / ++y; return -t + Math.log(2.5066282746310005 * s / z); }
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 300; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-13) break; } return sum * Math.exp(-x + a * Math.log(x) - lnG(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 300; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-13) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lnG(a)) * h;
}
const CRIT = [0, 3.841, 5.991, 7.815, 9.488, 11.070, 12.592, 14.067];
function chiSquare(obs, ratio) {
  const N = obs.reduce((a, b) => a + b, 0), R = ratio.reduce((a, b) => a + b, 0);
  const exp = ratio.map(r => (N * r) / R);
  const chi = obs.reduce((s, o, i) => s + (o - exp[i]) ** 2 / exp[i], 0);
  const df = obs.length - 1;
  return { N, exp, chi, df, p: 1 - gammaP(df / 2, chi / 2), crit: CRIT[df] };
}
const haldane = r => (r >= 0.5 ? Infinity : -50 * Math.log(1 - 2 * r));

if (typeof module !== 'undefined') module.exports = { shortCode, canon, prng, GENES, CH, poisson, gamete, breed, mutate, dom, countCross, comboLabel, randomSpec, specValid, layoutOf, wildOf, encode, decode, chiSquare, haldane };

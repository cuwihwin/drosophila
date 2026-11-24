// Interfaccia dell'app. Richiede js/engine.js
{
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'drosophila-web-v1';

// ---------- disegno della mosca: stessi livelli e stesso ordine di drawGenome() ----------
function layers(gt) {
  const d = g => dom(gt, g), col = d('A') ? 'mar' : 'nere';
  const L = [d('A') ? 'base_mar' : 'base_nera'];
  if (d('I')) L.push('antenne');
  if (d('F')) L.push('addome');
  if (d('E')) L.push('setole');
  L.push((d('B') ? 'tondo_' : 'barra_') + (d('C') ? 'rosso' : 'bianco'));
  if (d('G')) L.push('zampe_' + col);
  if (!d('H')) L.push('vest_avanti_' + col);
  if (d('D')) L.push('vest_dietro_' + col);
  if (d('H')) L.push('ali_avanti');
  if (!d('D')) L.push('ali_dietro');
  return L;
}
const tile = gt => `<span class="tile">${layers(gt).map(n => `<img alt="" src="img/${n}.webp">`).join('')}</span>`;

// ---------- stato ----------
let S = null;          // partita salvata
let LAY = null;        // layout dei geni (segreto)
const U = { join: false, view: 'start', tab: 'alle', p: [null, null], mode: 'all', sel: [], preview: null, last: null, chi: { o: '', r: '' }, hal: { R: '', N: '' }, teach: null, tmode: 'rand', tspec: null, startErr: '' };
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
function newGame(spec, code) {
  const wild = wildOf(spec);
  S = { code: code || encode(spec), orgs: [{ id: 0, gt: wild, from: 'tipo selvatico' }], next: 1, log: [], hyp: {}, revealed: false };
  for (let i = 0; i < N_INIT; i++) S.orgs.push({ id: S.next++, gt: mutate(wild, MUT_INIT), from: 'mutante iniziale' });
  start();
}
function start() {
  LAY = layoutOf(decode(S.code));
  U.view = 'game'; U.tab = 'alle'; U.p = [null, null]; U.preview = null; U.last = null;
  save(); render();
}
const lbl = c => (c.length > 11 ? c.slice(0, 5) + '…' : c);
const org = id => S.orgs.find(o => o.id === id);

// ---------- icone ----------
const IC = {
  alle: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  inc: '<svg viewBox="0 0 24 24"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>',
  qua: '<svg viewBox="0 0 24 24"><path d="M6 3h11a2 2 0 0 1 2 2v16H8a2 2 0 0 1-2-2z"/><path d="M6 19a2 2 0 0 1 2-2h11M10 8h6M10 12h4"/></svg>',
  str: '<svg viewBox="0 0 24 24"><path d="M4 20h16M7 16V9M12 16V5M17 16v-4"/></svg>',
};
const TABS = [['alle', 'Allevamento'], ['inc', 'Incrocio'], ['qua', 'Quaderno'], ['str', 'Strumenti']];

const CREDIT = '<p class="credit">creato da Davide Palmigiani, <a href="https://sites.google.com/view/cuwihwin-root/home-page" target="_blank" rel="noopener">ROOT</a></p>';

// ---------- viste ----------
function vStart() {
  const saved = load();
  const demo = wildOf({ A: { dl: 0, ot: 1 }, B: { dl: 0, ot: 1 }, C: { dl: 0, ot: 1 }, D: { dl: 0, ot: 1 }, E: { dl: 0, ot: 1 }, F: { dl: 0, ot: 1 }, G: { dl: 0, ot: 1 }, H: { dl: 0, ot: 1 }, I: { dl: 0, ot: 1 } });
  const hash = (location.hash || '').slice(1);
  return `<div class="wrap" style="padding-bottom:40px"><section class="hero">
  <div>${tile(demo)}</div>
  <div>
   <div class="kicker">Laboratorio di genetica</div><h1>Drosophila!</h1>
   <p class="mute">Alleva, incrocia e fai mutare i moscerini. Ricostruisci su quale cromosoma si trova ciascun gene.</p>
   <div class="stack3">
    <button class="btn pri wide" data-a="solo">Partita casuale</button>
    <div class="row"><button class="btn grow" data-a="teacher">Partita cooperativa</button><button class="btn grow ${U.join ? 'on' : ''}" data-a="join" aria-expanded="${!!U.join}">Entra con il codice</button></div>
    ${U.join ? `<form class="card" data-f="join" style="margin:0">
     <div class="row"><input class="grow" type="text" id="joincode" placeholder="ABC-DEF-GHJ" autocomplete="off" autocapitalize="characters" value="${esc(decode(hash) ? hash : '')}"><button class="btn pri">Entra</button></div>
     <div class="err">${esc(U.startErr)}</div>
    </form>` : ''}
    ${saved && decode(saved.code) ? `<button class="btn wide" data-a="continue">Continua la partita · ${esc(lbl(saved.code))}</button>` : ''}
    <button class="btn wide ghost" data-a="help">Come si gioca</button>
   </div>
  </div></section>${CREDIT}</div>`;
}

function vTeacher() {
  const t = U.tspec;
  let body = '';
  if (U.tmode === 'custom') {
    if (!t) U.tspec = Object.fromEntries(GENES.split('').map((g, i) => [g, { c: i < 5 ? 1 : 2, um: [0, 10, 20, 70, 90, 0, 50, 80, 90][i], dl: 0, ot: 0 }]));
    const s = U.tspec;
    body = `<div class="card"><h3>Posizione dei geni</h3><p class="small mute">Cromosoma 1 o 2, posizione da 0 a 100 cM. Almeno 2 geni per cromosoma.</p>
    ${CH.map(c => `<div class="hyp"><span>${c.n}</span><div class="seg">${[1, 2].map(k => `<button type="button" class="${s[c.g].c === k ? 'on' : ''}" data-a="tc" data-g="${c.g}" data-v="${k}">${k}</button>`).join('')}</div><input type="number" min="0" max="100" inputmode="numeric" value="${s[c.g].um}" data-i="tum" data-g="${c.g}"></div>`).join('')}
    <p class="small mute" style="margin-top:10px">Il moscerino iniziale avrà sempre fenotipo selvatico; per ogni gene sarà eterozigote o omozigote dominante a caso.</p>
    <div class="err" id="terr"></div>
    <button class="btn pri wide" data-a="tgen">Genera il codice</button></div>`;
  } else body = `<div class="card"><p>Viene creato un genoma segreto casuale. Tutta la classe lavora sullo stesso genoma.</p><button class="btn pri wide" data-a="tgen">Genera il codice</button></div>`;
  return `<div class="wrap" style="padding-bottom:40px">
  <button class="btn sm" data-a="home">← Indietro</button>
  <h1 style="margin-top:16px">Partita cooperativa</h1>
  <p class="mute">Genera un codice e condividilo: ognuno lo inserisce in “Entra con il codice” e tutti lavorano sullo stesso genoma.</p>
  ${U.teach ? `<div class="card"><h3>Codice della partita</h3><div class="code" id="tcode">${U.teach}</div>
    <div class="row" style="margin-top:10px"><button class="btn grow" data-a="copy" data-v="${U.teach}">Copia codice</button><button class="btn grow" data-a="tplay">Prova la partita</button></div>
    <details style="margin-top:12px"><summary class="btn sm">Mostra la soluzione (solo insegnante)</summary>${mapSVG(trueMap(layoutOf(decode(U.teach))), 'Mappa reale')}</details>
    <button class="btn sm" style="margin-top:12px" data-a="treset">Crea un altro codice</button></div>`
    : `<div class="seg" style="margin-bottom:14px"><button class="${U.tmode === 'rand' ? 'on' : ''}" data-a="tmode" data-v="rand">Casuale</button><button class="${U.tmode === 'custom' ? 'on' : ''}" data-a="tmode" data-v="custom">Su misura</button></div>${body}`}
  </div>`;
}

function vAlle() {
  return `<div class="sec"><h2>Allevamento</h2><span class="mute small">${S.orgs.length} moscerini</span></div>
  <p class="small mute">Tocca un moscerino per vederne i caratteri, farlo mutare o usarlo in un incrocio.</p>
  <div class="grid">${S.orgs.map(o => `<button class="fly" data-a="org" data-id="${o.id}">${tile(o.gt)}<span class="lab">#${o.id}${o.id === 0 ? ' <small>selvatico</small>' : ''}</span></button>`).join('')}</div>`;
}

function vInc() {
  const slot = i => {
    const o = U.p[i] != null ? org(U.p[i]) : null;
    return `<button class="slot ${o ? 'full' : ''}" data-a="pick" data-v="${i}">${o ? tile(o.gt) + `<b>#${o.id}</b>` : `<span style="font-size:28px">+</span>Genitore ${i + 1}`}</button>`;
  };
  const ready = U.p[0] != null && U.p[1] != null && (U.mode === 'all' || U.sel.length);
  return `<div class="sec"><h2>Incrocio</h2></div>
  <div class="parents">${slot(0)}<span class="times">×</span>${slot(1)}</div>
  <p class="small mute" style="margin-top:8px">Puoi scegliere due volte lo stesso moscerino.</p>
  <div class="seg" style="margin:14px 0"><button class="${U.mode === 'all' ? 'on' : ''}" data-a="mode" data-v="all">${PREVIEW} figli a caso</button><button class="${U.mode === 'count' ? 'on' : ''}" data-a="mode" data-v="count">Conta i caratteri</button></div>
  ${U.mode === 'count' ? `<p class="small mute">Scegli da 1 a 3 caratteri: verranno analizzati circa ${AVG} figli.</p><div class="chips">${CH.map((c, i) => { const on = U.sel.includes(i); return `<button class="chip ${on ? 'on' : ''}" data-a="char" data-v="${i}" ${!on && U.sel.length >= 3 ? 'disabled' : ''}>${c.n}</button>`; }).join('')}</div>` : `<p class="small mute">Guardi ${PREVIEW} figli con tutti i caratteri e scegli quali aggiungere all'allevamento.</p>`}
  <button class="btn pri wide" style="margin-top:16px" data-a="cross" ${ready ? '' : 'disabled'}>Incrocia</button>
  <div id="res">${vResult()}</div>`;
}

function vResult() {
  if (U.mode === 'all' && U.preview) {
    return `<div class="sec"><h2>Figli</h2><button class="btn sm" data-a="cross">Altri ${PREVIEW}</button></div>
    <p class="small mute">Tocca + per aggiungere un figlio all'allevamento.</p>
    <div class="grid">${U.preview.map((f, i) => `<div class="fly">${tile(f.gt)}<button class="badge ${f.added ? '' : 'add'}" data-a="add" data-v="${i}" aria-label="Aggiungi">${f.added ? '✓' : '+'}</button><span class="lab ${f.added ? '' : 'blank'}">${f.added ? '#' + f.added : '&nbsp;'}</span></div>`).join('')}</div>`;
  }
  if (U.mode === 'count' && U.last != null) { const e = S.log.find(x => x.id === U.last); if (e) return `<div class="sec"><h2>Risultato</h2><button class="btn sm" data-a="cross">Ripeti</button></div>` + resultCard(e, true); }
  return '';
}

function resultCard(e, actions) {
  const max = Math.max(...e.counts);
  const p1 = org(e.p[0]), p2 = org(e.p[1]);
  return `<div class="card">
   <div class="res-head">${p1 ? tile(p1.gt) : ''}${p2 ? tile(p2.gt) : ''}<div><b>#${e.p[0]} × #${e.p[1]}</b><div class="small mute">${e.ch.map(i => CH[i].n).join(' · ')}</div></div></div>
   <table><thead><tr><th>Fenotipo</th><th class="num">Figli</th></tr></thead><tbody>
   ${e.counts.map((n, m) => { const lab = comboLabel(e.ch, m), k = e.ch.length; return `<tr><td>${lab.map((t, j) => ((m >> (k - 1 - j)) & 1 ? `<span class="rec">${t}</span>` : t)).join(' · ')}<div class="bar"><i style="width:${max ? (n / max) * 100 : 0}%"></i></div></td><td class="num">${n}</td></tr>`; }).join('')}
   <tr><td><b>Totale</b></td><td class="num"><b>${e.n}</b></td></tr></tbody></table>
   ${actions ? `<div class="row" style="margin-top:12px"><button class="btn sm" data-a="tochi" data-v="${e.id}">Test χ²</button>${e.ch.length > 1 ? `<button class="btn sm" data-a="tohal" data-v="${e.id}">Distanza (Haldane)</button>` : ''}</div>` : ''}
  </div>`;
}

function vQua() {
  const crosses = S.log.slice().reverse();
  return `<div class="sec"><h2>Quaderno</h2></div>
  <p class="small mute">Tutti gli incroci con conteggio vengono salvati qui. Aggiungi note per ricordare cosa hai scoperto.</p>
  ${crosses.length ? crosses.map(e => `<details class="card log"><summary><b>#${e.p[0]} × #${e.p[1]} · ${e.ch.map(i => CH[i].n).join(', ')}</b><span class="mute small">${e.n} figli</span></summary>
    ${resultCard(e, true)}
    <textarea placeholder="Note…" data-i="note" data-v="${e.id}">${esc(e.note || '')}</textarea>
    <button class="btn sm danger" style="margin-top:8px" data-a="dellog" data-v="${e.id}">Elimina dal quaderno</button></details>`).join('') : '<div class="empty card">Nessun incrocio ancora. Vai su “Incrocio” e scegli “Conta i caratteri”.</div>'}
  <div class="sec"><h2>La mia mappa</h2></div>
  <div class="card"><p class="small mute">Per ogni carattere indica il cromosoma ipotizzato e la posizione in cM. La numerazione dei cromosomi è libera.</p>
  ${CH.map(c => { const h = S.hyp[c.g] || { c: 0, pos: '' }; return `<div class="hyp"><span>${c.n}</span><div class="seg">${[[0, '?'], [1, '1'], [2, '2']].map(([v, t]) => `<button class="${h.c === v ? 'on' : ''}" data-a="hc" data-g="${c.g}" data-v="${v}">${t}</button>`).join('')}</div><input type="number" min="0" max="100" inputmode="decimal" placeholder="cM" value="${esc(h.pos)}" data-i="hpos" data-g="${c.g}"></div>`; }).join('')}
  <div class="maps" style="margin-top:14px"><div id="hypmap">${mapSVG(hypMap(), 'La mia ipotesi')}</div>${S.revealed ? `<div>${mapSVG(trueMap(LAY), 'Mappa reale')}</div>` : ''}</div>
  ${S.revealed ? '' : `<button class="btn wide" style="margin-top:12px" data-a="reveal">Confronta con la soluzione</button>`}
  </div>`;
}

function vStr() {
  const c = U.chi, h = U.hal;
  let chiOut = '', halOut = '';
  const obs = c.o.split(/[\s,;]+/).filter(Boolean).map(Number), rat = c.r.split(/[\s:,;]+/).filter(Boolean).map(Number);
  if (obs.length) {
    if (obs.length < 2 || obs.length > 8 || obs.some(x => !(x >= 0)) ) chiOut = '<p class="err">Inserisci da 2 a 8 numeri osservati.</p>';
    else if (rat.length !== obs.length || rat.some(x => !(x > 0))) chiOut = `<p class="err">Servono ${obs.length} proporzioni (es. ${'1:'.repeat(obs.length - 1)}1).</p>`;
    else {
      const r = chiSquare(obs, rat), ok = r.chi <= r.crit;
      chiOut = `<table style="margin-top:10px"><thead><tr><th>Classe</th><th class="num">Osservati</th><th class="num">Attesi</th></tr></thead><tbody>${obs.map((o, i) => `<tr><td>${i + 1}</td><td class="num">${o}</td><td class="num">${r.exp[i].toFixed(1)}</td></tr>`).join('')}</tbody></table>
      <div class="ph" style="margin-top:12px"><span>χ²</span><b>${r.chi.toFixed(2)}</b><span>Gradi di libertà</span><b>${r.df}</b><span>Valore critico (5%)</span><b>${r.crit.toFixed(2)}</b><span>p</span><b>${r.p < 0.001 ? '< 0,001' : r.p.toFixed(3).replace('.', ',')}</b></div>
      <p style="margin-top:12px"><b class="${ok ? '' : 'rec'}">${ok ? 'Ipotesi accettata' : 'Ipotesi rifiutata'}</b> <span class="mute">al livello del 5%: ${ok ? 'le differenze possono essere dovute al caso.' : 'i dati non seguono queste proporzioni.'}</span></p>`;
    }
  }
  const R = Number(h.R), N = Number(h.N);
  if (h.R !== '' && h.N !== '') {
    if (!(N > 0) || !(R >= 0) || R > N) halOut = '<p class="err">Controlla i numeri: ricombinanti ≤ totale.</p>';
    else { const r = R / N, d = haldane(r); halOut = `<div class="ph" style="margin-top:12px"><span>Ricombinanti</span><b>${(r * 100).toFixed(2)}%</b><span>Distanza (Haldane)</span><b>${isFinite(d) ? d.toFixed(1) + ' cM' : '∞ · non associati'}</b></div>${isFinite(d) ? `<p class="small mute" style="margin-top:8px">d = −50 · ln(1 − 2r). Con pochi ricombinanti è circa uguale alla percentuale (${(r * 100).toFixed(1)}).</p>` : '<p class="small mute" style="margin-top:8px">Con il 50% o più di ricombinanti i geni segregano indipendentemente.</p>'}`; }
  }
  return `<div class="sec"><h2>Strumenti</h2></div>
  <div class="card" id="chi"><h3>Test del χ²</h3>
   <label class="small mute">Figli osservati per classe</label><input type="text" inputmode="numeric" data-i="chio" value="${esc(c.o)}" placeholder="64, 66, 71, 56">
   <label class="small mute" style="display:block;margin-top:10px">Proporzioni attese</label><input type="text" data-i="chir" value="${esc(c.r)}" placeholder="1:1:1:1">
   <div class="chips" style="margin-top:10px">${['3:1', '1:1', '9:3:3:1', '1:1:1:1', '27:9:9:3:9:3:3:1', '1:1:1:1:1:1:1:1'].map(x => `<button class="chip" data-a="ratio" data-v="${x}">${x}</button>`).join('')}</div>
   <div id="chiout">${chiOut}</div></div>
  <div class="card" id="hal"><h3>Distanza di mappa (Haldane)</h3>
   <div class="row"><div class="grow"><label class="small mute">Ricombinanti</label><input type="number" inputmode="numeric" data-i="halR" value="${esc(h.R)}" placeholder="83"></div><div class="grow"><label class="small mute">Totale figli</label><input type="number" inputmode="numeric" data-i="halN" value="${esc(h.N)}" placeholder="275"></div></div>
   <div id="halout">${halOut}</div></div>`;
}

// ---------- mappe dei cromosomi ----------
function trueMap(lay) { return CH.map(c => ({ n: c.n, c: lay[c.g].c, pos: Math.round(lay[c.g].um * 100) })); }
function hypMap() { return CH.map(c => { const h = S.hyp[c.g]; return h && h.c && h.pos !== '' && !isNaN(+h.pos) ? { n: c.n, c: h.c, pos: Math.max(0, Math.min(100, +h.pos)) } : null; }).filter(Boolean); }
function mapSVG(items, title) {
  const top = 46, H = 300, xs = { 1: 40, 2: 200 };
  let s = `<svg viewBox="0 0 360 380" role="img" aria-label="${esc(title)}"><text x="0" y="18" font-size="15" font-weight="600" fill="currentColor">${esc(title)}</text>`;
  for (const c of [1, 2]) {
    const x = xs[c];
    s += `<text x="${x}" y="38" text-anchor="middle" font-size="13" fill="currentColor" opacity=".6">${c}</text><rect x="${x - 9}" y="${top}" width="18" height="${H}" rx="9" fill="var(--soft)" stroke="var(--line)"/>`;
    const list = items.filter(i => i.c === c).sort((a, b) => a.pos - b.pos);
    let last = -99;
    for (const it of list) {
      const y = top + (it.pos / 100) * H; let ly = Math.max(y, last + 16); last = ly;
      s += `<line x1="${x - 9}" x2="${x + 9}" y1="${y}" y2="${y}" stroke="var(--main)" stroke-width="2.5"/><path d="M${x + 12} ${y} L${x + 18} ${ly}" stroke="currentColor" stroke-opacity=".3" fill="none"/><text x="${x + 21}" y="${ly + 4}" font-size="13" fill="currentColor">${esc(it.n)} <tspan opacity=".55">${it.pos}</tspan></text>`;
    }
  }
  if (!items.length) s += `<text x="180" y="200" text-anchor="middle" font-size="13" fill="currentColor" opacity=".5">Nessun gene posizionato</text>`;
  return s + '</svg>';
}

// ---------- pannelli ----------
function sheet(title, html) { $('#layer').innerHTML = `<div class="ov" data-a="close"><div class="sheet" role="dialog" aria-label="${esc(title)}"><div class="hd"><h2>${esc(title)}</h2><button class="x" data-a="close" aria-label="Chiudi">×</button></div>${html}</div></div>`; }
function closeSheet() { $('#layer').innerHTML = ''; }
let toastT;
function toast(msg, undo) {
  clearTimeout(toastT);
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.className = 'toast'; t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-a="undo">Annulla</button>' : ''}`;
  U.undo = undo || null; toastT = setTimeout(() => { t.remove(); U.undo = null; }, 4500);
}
function orgSheet(id) {
  const o = org(id);
  sheet(`Esemplare #${o.id}`, `<div class="zoom" data-a="part" data-id="${o.id}" role="button" aria-label="Tocca una parte del moscerino">${tile(o.gt)}</div>
   <p class="small mute" style="text-align:center">${esc(o.from)}</p>
   <details class="carat"><summary>Caratteri</summary><div class="ph">${CH.map(c => { const d = dom(o.gt, c.g); return `<span data-g="${c.g}">${c.n}</span><b data-g="${c.g}" class="${d ? '' : 'rec'}">${d ? c.d : c.r}</b>`; }).join('')}</div></details>
   <div class="stack3"><button class="btn pri wide" data-a="asparent" data-id="${o.id}">Usa in un incrocio</button>
   <div class="row"><button class="btn grow" data-a="mutate" data-id="${o.id}">Crea un mutante</button>${o.id === 0 ? '' : `<button class="btn grow danger" data-a="del" data-id="${o.id}">Elimina</button>`}</div></div>
   ${o.id === 0 ? '<p class="small mute" style="margin-top:10px">Il tipo selvatico non può essere eliminato.</p>' : ''}`);
}
function partAt(x, y) {
  const mid = x >= 300 && x <= 520;
  if (y >= 35 && y < 105 && x > 240 && x < 580) return ['Antenne', ['I']];
  if (y >= 105 && y < 232 && x > 270 && x < 550) return ['Occhi', ['B', 'C']];
  if (y >= 770 && x > 220 && x < 615) return ['Ali', ['H', 'D']];
  if (y >= 290 && !mid && x > 200 && x < 625) return ['Ali', ['H', 'D']];
  if (y >= 232 && y < 470 && mid) return ['Torace', ['A', 'E']];
  if (y >= 470 && y < 770 && mid) return ['Addome', ['F', 'A']];
  if (y >= 100 && y < 960) return ['Zampe', ['G']];
  return null;
}
function pickSheet(i) {
  sheet(`Scegli il genitore ${i + 1}`, `<div class="grid">${S.orgs.map(o => `<button class="fly ${U.p[i] === o.id ? 'sel' : ''}" data-a="setp" data-v="${i}" data-id="${o.id}">${tile(o.gt)}<span class="lab">#${o.id}</span></button>`).join('')}</div>`);
}
function helpSheet() {
  sheet('Come si gioca', `<ol style="padding-left:20px;margin:0">
  <li><p><b>Lo scopo.</b> Il moscerino ha 9 geni su 2 coppie di cromosomi. Ogni gene controlla un carattere con un allele dominante e uno recessivo. Devi scoprire su quale cromosoma si trovi ogni gene e a che distanza.</p></li>
  <li><p><b>Allevamento.</b> Parti dal tipo selvatico #0 e da due mutanti. Tocca un moscerino per farlo mutare (i mutanti hanno alleli recessivi in più) o eliminarlo.</p></li>
  <li><p><b>Incroci.</b> Con “${PREVIEW} figli a caso” vedi alcuni figli e puoi aggiungerli all'allevamento. Con “Conta i caratteri” ottieni circa ${AVG} figli, divisi secondo 1, 2 o 3 caratteri.</p></li>
  <li><p><b>Analisi.</b> Due geni su cromosomi diversi danno 1:1:1:1 in un reincrocio; se sono vicini prevalgono le classi parentali. Ricombinanti / totale ≈ distanza. Gli strumenti χ² e Haldane sono a disposizione quando servono.</p></li>
  <li><p><b>La mappa.</b> Nel Quaderno scrivi la tua ipotesi e, quando sei pronto, confrontala con la soluzione.</p></li></ol>
  <p class="small mute">Tutto viene salvato automaticamente in questo browser.</p>`);
}
function menuSheet() {
  sheet('Partita', `<p class="small mute">Codice della partita</p><div class="code">${S.code}</div>
  <div class="stack3"><button class="btn wide" data-a="copy" data-v="${S.code}">Copia codice</button><button class="btn wide" data-a="help">Come si gioca</button><button class="btn wide danger" data-a="askquit">Esci e inizia un'altra partita</button></div>`);
}
function confirmSheet(title, text, act, label) {
  sheet(title, `<p>${text}</p><div class="row"><button class="btn grow" data-a="close">Annulla</button><button class="btn pri grow" data-a="${act}">${label}</button></div>`);
}

// ---------- render ----------
function render() {
  const app = $('#app');
  if (U.view === 'start') { app.innerHTML = vStart(); return; }
  if (U.view === 'teacher') { app.innerHTML = vTeacher(); return; }
  const body = { alle: vAlle, inc: vInc, qua: vQua, str: vStr }[U.tab]();
  app.innerHTML = `<header class="top"><div class="in"><b>Drosophila!<small>laboratorio di genetica</small></b><button class="chip" data-a="menu" aria-label="Menu della partita">${esc(lbl(S.code))} ⋯</button></div></header>
   <main class="wrap">${body}${CREDIT}</main>
   <nav class="tabs"><div class="in">${TABS.map(([k, t]) => `<button class="${U.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${IC[k]}${t}</button>`).join('')}</div></nav>`;
}
function go(tab) { U.tab = tab; render(); window.scrollTo(0, 0); }

// ---------- azioni ----------
const A = {
  continue() { S = load(); start(); },
  solo() { const sv = load(); if (sv && decode(sv.code)) confirmSheet('Nuova partita casuale', 'C\'è una partita in corso: verrà sostituita da una nuova.', 'dosolo', 'Inizia'); else A.dosolo(); },
  dosolo() { closeSheet(); U.startErr = ''; const c = shortCode(); newGame(decode(c), c); },
  join() { U.join = !U.join; render(); const i = $('#joincode'); if (i) i.focus(); },
  teacher() { U.view = 'teacher'; U.teach = null; render(); },
  home() { U.view = 'start'; render(); },
  help: helpSheet, menu: menuSheet, close: closeSheet,
  tmode(v) { U.tmode = v; render(); },
  tc(v, el) { U.tspec[el.dataset.g].c = +v; render(); },
  tgen() {
    let spec;
    if (U.tmode === 'custom') {
      spec = {};
      for (const g of GENES) { const s = U.tspec[g]; const um = Math.round(+s.um); if (!(um >= 0 && um <= 100)) { $('#terr').textContent = 'Le posizioni vanno da 0 a 100.'; return; } spec[g] = { c: s.c, um, dl: Math.random() < 0.5 ? 0 : 1, ot: Math.random() > 0.6 ? 1 : 0 }; }
      const e = specValid(spec); if (e) { $('#terr').textContent = e; return; }
    U.teach = encode(spec); render(); return;
    }
    U.teach = shortCode(); render();
  },
  treset() { U.teach = null; render(); },
  tplay() { const c = U.teach; const sv = load(); if (sv && sv.code === c) { S = sv; start(); } else newGame(decode(c), c); },
  copy(v, el) { const done = () => toast(el && el.dataset.msg || 'Codice copiato'); try { navigator.clipboard.writeText(v).then(done, () => toast('Seleziona il codice e copialo a mano')); } catch (e) { toast('Seleziona il codice e copialo a mano'); } },
  askquit() { confirmSheet('Nuova partita', 'La partita corrente verrà chiusa. Potrai riprenderla inserendo di nuovo lo stesso codice, ma l\'allevamento ripartirà da capo.', 'quit', 'Esci'); },
  quit() { closeSheet(); try { localStorage.removeItem(KEY); } catch (e) {} S = null; U.view = 'start'; render(); },
  tab(v) { go(v); },
  org(v, el) { orgSheet(+el.dataset.id); },
  asparent(v, el) { const id = +el.dataset.id; if (U.p[0] == null) U.p[0] = id; else if (U.p[1] == null) U.p[1] = id; else U.p = [id, null]; closeSheet(); U.preview = null; go('inc'); },
  mutate(v, el) {
    const src = org(+el.dataset.id), o = { id: S.next++, gt: mutate(src.gt, MUT), from: `mutante di #${src.id}` };
    S.orgs.push(o); save(); closeSheet(); render(); toast(`Nuovo mutante #${o.id} da #${src.id}`);
  },
  del(v, el) {
    const id = +el.dataset.id, i = S.orgs.findIndex(o => o.id === id), o = S.orgs[i];
    S.orgs.splice(i, 1); U.p = U.p.map(x => (x === id ? null : x)); save(); closeSheet(); render();
    toast(`#${id} eliminato`, () => { S.orgs.splice(i, 0, o); S.orgs.sort((a, b) => a.id - b.id); save(); render(); });
  },
  part(v, el, ev) {
    const o = org(+el.dataset.id), r = el.getBoundingClientRect();
    const px = ev.clientX - r.left, py = ev.clientY - r.top, hit = partAt(px / r.width * 818, py / r.height * 1040);
    el.querySelectorAll('.ring,.tip').forEach(n => n.remove());
    document.querySelectorAll('.ph .hl').forEach(n => n.classList.remove('hl'));
    if (!hit) return;
    const [name, genes] = hit;
    const rows = genes.map(g => { const c = CH.find(c => c.g === g), d = dom(o.gt, g); return `${c.n}: <b class="${d ? '' : 'r'}">${d ? c.d : c.r}</b>`; });
    el.insertAdjacentHTML('beforeend', `<span class="ring" style="left:${px}px;top:${py}px"></span><span class="tip ${py < 90 ? 'below' : ''}" style="left:${Math.max(90, Math.min(r.width - 90, px))}px;top:${py}px">${genes.length > 1 ? `<b>${name}</b><br>` : ''}${rows.join('<br>')}</span>`);
    genes.forEach(g => document.querySelectorAll(`.ph [data-g="${g}"]`).forEach(n => n.classList.add('hl')));
  },
  undo() { if (U.undo) { U.undo(); U.undo = null; } const t = $('#toast'); if (t) t.remove(); },
  pick(v) { pickSheet(+v); },
  setp(v, el) { U.p[+v] = +el.dataset.id; if (+v === 0 && U.p[1] == null) { pickSheet(1); render(); return; } closeSheet(); U.preview = null; render(); },
  mode(v) { U.mode = v; render(); },
  char(v) { v = +v; U.sel = U.sel.includes(v) ? U.sel.filter(x => x !== v) : U.sel.concat(v).slice(0, 3); render(); },
  cross() {
    const p1 = org(U.p[0]), p2 = org(U.p[1]); if (!p1 || !p2) return;
    if (U.mode === 'all') U.preview = Array.from({ length: PREVIEW }, () => ({ gt: breed(LAY, p1.gt, p2.gt), added: 0 }));
    else {
      const ch = U.sel.slice(), r = countCross(LAY, p1.gt, p2.gt, ch);
      const e = { id: (S.log.reduce((m, x) => Math.max(m, x.id), 0) + 1), t: Date.now(), p: [p1.id, p2.id], ch, n: r.N, counts: r.counts, note: '' };
      S.log.push(e); U.last = e.id; save();
    }
    render(); const r = $('#res'); if (r) r.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  },
  add(v) {
    const f = U.preview[+v]; if (f.added) return;
    const o = { id: S.next++, gt: f.gt, from: `figlio di #${U.p[0]} × #${U.p[1]}` };
    S.orgs.push(o); f.added = o.id; save(); $('#res').innerHTML = vResult(); toast(`#${o.id} aggiunto all'allevamento`);
  },
  tochi(v) { const e = S.log.find(x => x.id === +v); U.chi = { o: e.counts.join(', '), r: '' }; go('str'); },
  tohal(v) { const e = S.log.find(x => x.id === +v); U.hal = { R: '', N: String(e.n) }; go('str'); setTimeout(() => { const h = $('#hal'); h.scrollIntoView(); h.querySelector('input').focus(); }, 0); },
  ratio(v) { U.chi.r = v; const el = document.querySelector('[data-i=chir]'); el.value = v; refreshStr(); },
  dellog(v) { const i = S.log.findIndex(x => x.id === +v), e = S.log[i]; S.log.splice(i, 1); save(); render(); toast('Incrocio eliminato', () => { S.log.splice(i, 0, e); save(); render(); }); },
  hc(v, el) { const g = el.dataset.g; S.hyp[g] = Object.assign({ c: 0, pos: '' }, S.hyp[g], { c: +v }); save(); render(); },
  reveal() { confirmSheet('Vedere la soluzione?', 'Comparirà la mappa reale accanto alla tua ipotesi. Puoi continuare a giocare anche dopo.', 'doreveal', 'Mostra'); },
  doreveal() { S.revealed = true; save(); closeSheet(); render(); },
};
function refreshStr() { const tmp = document.createElement('div'); tmp.innerHTML = vStr(); $('#chiout').innerHTML = tmp.querySelector('#chiout').innerHTML; $('#halout').innerHTML = tmp.querySelector('#halout').innerHTML; }

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  if (el.dataset.a === 'close' && el.classList.contains('ov') && ev.target !== el) return;
  const f = A[el.dataset.a]; if (f) { ev.preventDefault(); f(el.dataset.v, el, ev); }
});
document.addEventListener('submit', ev => {
  ev.preventDefault();
  if (ev.target.dataset.f === 'join') {
    const raw = $('#joincode').value, spec = decode(raw);
    if (!spec) { U.startErr = 'Codice non valido. Controlla di averlo copiato tutto.'; render(); return; }
    U.startErr = ''; const code = canon(raw), sv = load();
    if (sv && canon(sv.code) === code) { S = sv; start(); } else newGame(spec, code);
  }
});
document.addEventListener('input', ev => {
  const el = ev.target, i = el.dataset.i; if (!i) return;
  if (i === 'note') { const e = S.log.find(x => x.id === +el.dataset.v); e.note = el.value; save(); }
  else if (i === 'hpos') { const g = el.dataset.g; S.hyp[g] = Object.assign({ c: 0, pos: '' }, S.hyp[g], { pos: el.value }); save(); $('#hypmap').innerHTML = mapSVG(hypMap(), 'La mia ipotesi'); }
  else if (i === 'tum') { U.tspec[el.dataset.g].um = el.value; }
  else if (i === 'chio') { U.chi.o = el.value; refreshStr(); }
  else if (i === 'chir') { U.chi.r = el.value; refreshStr(); }
  else if (i === 'halR') { U.hal.R = el.value; refreshStr(); }
  else if (i === 'halN') { U.hal.N = el.value; refreshStr(); }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSheet(); });

// avvio
if (decode((location.hash || '').slice(1))) U.join = true;
render();

}

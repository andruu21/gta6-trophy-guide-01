// Leonida Trophy Atlas v2 — master-detail tracker, roadmap, missables and save/load
// for the 55 GTA VI trophies. All state lives in localStorage; export/import move it
// as a JSON file. No network anywhere: the app fetches only its own data file.
const KEY = 'leonida-atlas-v2';
const state = {
  earned: {}, spoilers: false, view: 'tracker', selected: null,
  filters: { q: '', grade: 'all', kind: 'all', status: 'all' }
};

let trophies = [];

async function load() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  restore();
  document.getElementById('tabs').addEventListener('click', onTab);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === '/' && state.view === 'tracker' && document.activeElement.tagName !== 'INPUT') {
      ev.preventDefault(); const q = document.getElementById('q'); if (q) q.focus();
    }
  });
  render();
}

// Restore the saved checklist from localStorage, tolerating a corrupt or missing save.
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.earned) state.earned = saved.earned;
    if (typeof saved.spoilers === 'boolean') state.spoilers = saved.spoilers;
    if (typeof saved.selected === 'string') state.selected = saved.selected;
    if (saved.filters) Object.assign(state.filters, saved.filters);
    if (saved.view && ['tracker', 'roadmap', 'missables', 'data'].includes(saved.view)) state.view = saved.view;
  } catch (e) { /* first run or corrupt save: start fresh */ }
}

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const done = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) { c[t.grade]++; if (state.earned[t.name]) done[t.grade]++; }
  return { c, done };
}

function header() {
  const { c, done } = gradeCounts();
  const n = done.platinum + done.gold + done.silver + done.bronze;
  document.getElementById('earned').textContent = n;
  document.getElementById('bar-fill').style.width = (n / trophies.length * 100) + '%';
  const row = document.getElementById('grade-row');
  row.innerHTML = '';
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const chip = document.createElement('span');
    chip.className = 'chip ' + g;
    chip.textContent = g + ' ' + done[g] + '/' + c[g];
    row.appendChild(chip);
  }
}

function visible() {
  const f = state.filters, q = f.q.trim().toLowerCase();
  return trophies.filter(t => {
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.kind !== 'all' && (t.kind || 'story') !== f.kind) return false;
    const e = !!state.earned[t.name];
    if (f.status === 'earned' && !e) return false;
    if (f.status === 'todo' && e) return false;
    if (f.status === 'missable' && !t.missable) return false;
    if (f.status === 'hidden' && !t.hidden) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

// Spoiler mode masks every hidden trophy's name, description and guide until it is earned.
function isMasked(t) { return state.spoilers && t.hidden && !state.earned[t.name]; }
function guideText(t) { return isMasked(t) ? 'Hidden trophy — earn it to unmask the guide.' : t.guide; }
function nameText(t) { return isMasked(t) ? 'Hidden trophy' : t.name; }
function descText(t) { return isMasked(t) ? 'Hidden until earned' : t.description; }

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function tag(text, cls, extra) {
  return '<span class="tag t-' + cls + (extra ? ' ' + extra : '') + '">' + esc(text) + '</span>';
}
function tagsHtml(t) {
  return tag(t.grade, 'g', t.grade) + (t.kind ? tag(t.kind, 'k') : '') +
    (t.hidden ? tag('hidden', 'h') : '') + (t.missable ? tag('possibly missable', 'm') : '');
}

// One row of the checklist: tick, name, official description, tags. Clicking the row
// opens its full cited guide in the detail pane; the tick marks it earned.
function trophyCard(t) {
  const e = !!state.earned[t.name];
  const card = document.createElement('article');
  card.className = 'card' + (e ? ' earned' : '') + (t.missable ? ' missable' : '') +
    (state.selected === t.name ? ' selected' : '');
  card.dataset.name = t.name;
  card.innerHTML =
    '<div class="card-head">' +
    '<button class="tick" aria-label="toggle earned">' + (e ? '✔' : '') + '</button>' +
    '<div class="card-title"><h3>' + esc(nameText(t)) + '</h3>' +
    '<p class="desc">' + esc(descText(t)) + '</p></div>' +
    '<div class="tags">' + tagsHtml(t) + '</div></div>';
  card.querySelector('.tick').addEventListener('click', (ev) => { ev.stopPropagation(); toggle(t.name); });
  card.addEventListener('click', () => { state.selected = t.name; save(); renderTracker(); });
  return card;
}

function toggle(name) {
  if (state.earned[name]) delete state.earned[name]; else state.earned[name] = true;
  save(); header(); render();
}

// The sticky detail pane: the selected trophy's guide, sources and roadmap placement.
function detailPane(t) {
  const e = !!state.earned[t.name];
  const box = document.createElement('aside');
  box.className = 'detail';
  box.innerHTML =
    '<div class="detail-grade">' + esc(t.grade.toUpperCase()) + (t.hidden ? ' · HIDDEN ON PSN' : '') + '</div>' +
    '<h2>' + esc(nameText(t)) + '</h2>' +
    '<p class="detail-desc">' + esc(descText(t)) + '</p>' +
    '<div class="detail-tags">' + tagsHtml(t) + '</div>' +
    '<p class="guide">' + esc(guideText(t)) + '</p>';
  const srcs = t.sources || [];
  if (srcs.length) {
    const p = document.createElement('p');
    p.className = 'sources';
    p.append('Sources: ');
    srcs.forEach((s, i) => {
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.label; a.rel = 'noopener';
      p.appendChild(a);
      if (i < srcs.length - 1) p.append('·');
    });
    box.appendChild(p);
  }
  if (t.roadmap) {
    const r = document.createElement('p');
    r.className = 'stage';
    r.textContent = 'Roadmap: ' + t.roadmap + (t.chapter ? ' · Chapter ' + t.chapter : '') +
      (t.missable ? ' · POSSIBLY MISSABLE — see Missables' : '');
    box.appendChild(r);
  }
  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const btn = document.createElement('button');
  btn.textContent = e ? 'Unmark earned' : 'Mark earned';
  btn.addEventListener('click', () => toggle(t.name));
  actions.appendChild(btn);
  box.appendChild(actions);
  return box;
}

function renderTracker() {
  const m = document.getElementById('main');
  m.innerHTML =
    '<div class="toolbar">' +
    '<input id="q" type="search" placeholder="Search name or description… (press /)" value="' + esc(state.filters.q) + '">' +
    '<select id="f-kind"><option value="all">All kinds</option><option value="story">Story</option>' +
    '<option value="activities">Activities</option><option value="collectibles">Collectibles</option></select>' +
    '<select id="f-grade"><option value="all">All grades</option><option value="platinum">Platinum</option>' +
    '<option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option></select>' +
    '<select id="f-status"><option value="all">All</option><option value="todo">To do</option>' +
    '<option value="earned">Earned</option><option value="missable">Missable</option><option value="hidden">Hidden</option></select>' +
    '<label class="spoiler"><input type="checkbox" id="sp" ' + (state.spoilers ? 'checked' : '') + '> Hide spoilers</label>' +
    '<span id="shown"></span></div><div class="split"><div class="rows" id="rows"></div><div id="detail-slot"></div></div>';
  const rows = m.querySelector('#rows');
  const vis = visible();
  for (const t of vis) rows.appendChild(trophyCard(t));
  m.querySelector('#shown').textContent = vis.length + ' of 55 shown · ' +
    Object.keys(state.earned).length + ' earned';
  const sel = trophies.find(t => t.name === state.selected) || vis[0];
  if (sel) m.querySelector('#detail-slot').appendChild(detailPane(sel));
  bindToolbar();
}

function bindToolbar() {
  const m = document.getElementById('main');
  const q = m.querySelector('#q');
  q.addEventListener('input', () => { state.filters.q = q.value; save(); renderTracker(); });
  for (const [id, key] of [['#f-kind', 'kind'], ['#f-grade', 'grade'], ['#f-status', 'status']]) {
    const el = m.querySelector(id);
    el.value = state.filters[key];
    el.addEventListener('change', () => { state.filters[key] = el.value; save(); renderTracker(); });
  }
  const sp = m.querySelector('#sp');
  sp.addEventListener('change', () => { state.spoilers = sp.checked; save(); renderTracker(); });
}

// The roadmap: three stages built from the official descriptions, then the trophies
// grouped under the stage each one belongs to.
const STAGES = [
  ['Stage 1: Story', 'Play the five chapters and grab side content as it appears; nearly half the list pops here. Two early warnings: Lucia\'s balcony meditation the morning after Down to Earth (Chapter 1) is the one shot at a trophy that may need it, and the Irredeemable criminal profile is permanent once set. (GTABase roadmap; Push Square trophy reveal.)'],
  ['Stage 2: 100% Checklist', 'After the credits, open Progress > Stats > 100% Completion. Required in full: all robberies (8 bank vaults, 39 gang operations), underwater discoveries, all 42 Shooting Range golds, all drone races and Bret\'s 15 Target Decks. Partial shares: 100 optional missions, 200/277 vehicle scans, 100/255 animal studies, 15/18 meditations, 70/80 challenges, 300 of 397 stunts, 100 WAiNK scans. (GTABase 100% checklist.)'],
  ['Stage 3: Strangers & Clean-up', 'Stranger strands sit outside the 100% checklist: Strangers & Freaks needs 8 qualifying strands, and the character quests for Andy, Kenton, Billy, Randy and Tyrone close out their trophies. Sweep the list by grade until the platinum lands. (GTABase strangers missions list.)']
];

function renderRoadmap() {
  const m = document.getElementById('main');
  let html = '<section class="roadmap"><h2>Three stages to the platinum</h2>';
  for (const [h, p] of STAGES) html += '<div class="stage-block"><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p></div>';
  html += '<h3>Trophies by stage</h3><div id="stage-list"></div></section>';
  m.innerHTML = html;
  const list = m.querySelector('#stage-list');
  const stages = ['Stage 1: Story', 'Stage 2: 100% Checklist', 'Stage 3: Strangers & Clean-up', 'Finale'];
  for (const s of stages) {
    const group = trophies.filter(t => t.roadmap === s);
    if (!group.length) continue;
    const h = document.createElement('h4');
    h.textContent = s + ' — ' + group.length + (group.length === 1 ? ' trophy' : ' trophies');
    list.appendChild(h);
    const wrap = document.createElement('div');
    wrap.className = 'rows';
    for (const t of group) wrap.appendChild(trophyCard(t));
    list.appendChild(wrap);
  }
}

function renderMissables() {
  const m = document.getElementById('main');
  m.innerHTML = '<section class="roadmap"><h2>Missables</h2>' +
    '<p>GTABase\'s roadmap call: <strong>only Positive Mental Attitude is possibly missable</strong> — ' +
    'Lucia\'s balcony meditation the morning after Down to Earth in Chapter 1 disappears afterwards, and it is not ' +
    'confirmed whether the trophy needs it. Do not skip it. Everything else stays available in free roam after the story. ' +
    'Cheats disable trophies and saving, so keep them off a trophy run.</p>' +
    '<div class="split"><div id="m-list" class="rows"></div><div id="m-detail"></div></div></section>';
  const list = m.querySelector('#m-list');
  const miss = trophies.filter(t => t.missable);
  for (const t of miss) list.appendChild(trophyCard(t));
  const sel = miss.find(t => t.name === state.selected) || miss[0];
  if (sel) m.querySelector('#m-detail').appendChild(detailPane(sel));
}

function renderData() {
  const m = document.getElementById('main');
  m.innerHTML = '<section class="roadmap"><h2>Save / load</h2>' +
    '<p>Progress saves itself in this browser (localStorage) every time you tick a trophy, so the checklist ' +
    'is where you left it when you come back. Export writes a JSON file you can move to another machine; ' +
    'import reads one back in.</p>' +
    '<button id="export">Export progress</button> <label class="filebtn">Import progress ' +
    '<input id="import" type="file" accept="application/json"></label> <button id="reset">Reset</button>' +
    '<p id="saved-msg"></p></section>';
  m.querySelector('#export').addEventListener('click', doExport);
  m.querySelector('#import').addEventListener('change', doImport);
  m.querySelector('#reset').addEventListener('click', () => {
    state.earned = {}; state.selected = null; save(); header(); renderData();
  });
}

function doExport() {
  const blob = new Blob([JSON.stringify({ version: 2, game: 'GTA VI', earned: state.earned }, null, 2)],
    { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-atlas-progress.json';
  a.click();
  document.getElementById('saved-msg').textContent = 'Exported ' + Object.keys(state.earned).length + ' earned trophies.';
}

function doImport(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (data && data.earned) {
        state.earned = data.earned; save(); header();
        document.getElementById('saved-msg').textContent =
          'Imported ' + Object.keys(data.earned).length + ' earned trophies.';
      } else throw new Error('no earned key');
    } catch (e) { document.getElementById('saved-msg').textContent = 'Not a valid progress file.'; }
  };
  r.readAsText(f);
}

function onTab(ev) {
  const b = ev.target.closest('.tab');
  if (!b) return;
  for (const t of document.querySelectorAll('.tab')) t.classList.toggle('active', t === b);
  state.view = b.dataset.view;
  save();
  render();
}

function render() {
  header();
  // Keep the tab bar's active state in step with a restored view.
  for (const t of document.querySelectorAll('.tab')) t.classList.toggle('active', t.dataset.view === state.view);
  ({ tracker: renderTracker, roadmap: renderRoadmap, missables: renderMissables, data: renderData })[state.view]();
}

load();

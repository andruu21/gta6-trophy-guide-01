// GTA VI Trophy Guide — vanilla JS single-page app.
// All trophies are PROJECTIONS modelled on the GTA V (PS5) list; the UI labels
// them as such everywhere. Spoiler mode masks trophy details flagged as spoilers,
// and progress (earned marks, spoiler preference, filters) persists in localStorage.
const STORAGE_KEY = 'gta6-trophy-guide-v1';

const state = {
  earned: {},            // id -> true, marked earned locally
  spoilersOn: false,     // spoiler mode toggle
  category: 'all',
  query: ''
};

let data = null;   // full JSON (meta, categories, roadmap, missables)
let trophies = [];

// ---------- persistence ----------
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (raw.earned && typeof raw.earned === 'object') state.earned = raw.earned;
    if (typeof raw.spoilersOn === 'boolean') state.spoilersOn = raw.spoilersOn;
    if (typeof raw.category === 'string') state.category = raw.category;
    if (typeof raw.query === 'string') state.query = raw.query;
  } catch (e) { /* fresh start on corrupt save */ }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: state.earned,
      spoilersOn: state.spoilersOn,
      category: state.category,
      query: state.query
    }));
  } catch (e) { /* storage full/blocked: app still works this session */ }
}

// ---------- helpers ----------
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function diffDots(n) {
  return '●'.repeat(n) + '○'.repeat(10 - n);
}

// Spoiler mode hides description + how-to for trophies flagged spoiler: true,
// and always masks them until earned. Un-flagged trophies stay readable so
// casual users can browse without toggling anything.
function isMasked(t) {
  return state.spoilersOn && t.spoiler && !state.earned[t.id];
}

function trophyTags(t) {
  const bits = ['<span class="tag rarity-tag ' + esc(t.rarity) + '">' + esc(t.rarity) + '</span>'];
  bits.push('<span class="tag diff-tag">difficulty ' + t.difficulty + '/10 ' +
    '<span class="diff-dots">' + diffDots(t.difficulty) + '</span></span>');
  if (t.missable) bits.push('<span class="tag miss-tag">missable</span>');
  if (t.spoiler) bits.push('<span class="tag spoiler-tag">spoiler</span>');
  bits.push('<span class="tag proj-tag">projected</span>');
  return bits.join('');
}

// ---------- rendering ----------
function renderStats() {
  const grid = document.getElementById('statGrid');
  const count = (fn) => trophies.filter(fn).length;
  const rows = [
    { cls: '', lbl: 'total trophies (projected)', num: trophies.length },
    { cls: 'platinum', lbl: 'platinum', num: count(t => t.rarity === 'platinum') },
    { cls: 'gold', lbl: 'gold', num: count(t => t.rarity === 'gold') },
    { cls: 'silver', lbl: 'silver', num: count(t => t.rarity === 'silver') },
    { cls: 'bronze', lbl: 'bronze', num: count(t => t.rarity === 'bronze') },
    { cls: 'missable', lbl: 'watch for missables', num: count(t => t.missable) },
    { cls: '', lbl: 'marked earned (local)', num: Object.keys(state.earned).length }
  ];
  grid.innerHTML = rows.map(r =>
    '<div class="stat-box ' + r.cls + '"><div class="num">' + r.num +
    '</div><div class="lbl">' + esc(r.lbl) + '</div></div>'
  ).join('');
  document.getElementById('earnedCount').textContent = Object.keys(state.earned).length;
  document.getElementById('totalCount').textContent = trophies.length;
}

function renderFilters() {
  const nav = document.getElementById('filters');
  // keep the static "All" button, inject category buttons after it
  const labels = data.categoryLabels || {};
  const btns = ['all'].concat(data.categories).map(cat => {
    const label = cat === 'all' ? 'All' : (labels[cat] || cat);
    return '<button class="filter-btn' + (state.category === cat ? ' active' : '') +
      '" data-category="' + esc(cat) + '" type="button">' + esc(label) + '</button>';
  });
  nav.innerHTML = btns.join('');
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return trophies.filter(t => {
    if (state.category !== 'all' && t.category !== state.category) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.howTo).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function trophyCard(t) {
  const masked = isMasked(t);
  const earned = !!state.earned[t.id];
  const card = document.createElement('article');
  card.className = 'trophy-card rarity-' + t.rarity +
    (t.missable ? ' missable' : '') + (earned ? ' earned' : '');
  card.tabIndex = 0;
  card.dataset.id = t.id;
  card.innerHTML =
    '<h3>' + (masked ? 'Hidden Trophy' : esc(t.name)) + '</h3>' +
    '<p class="desc' + (masked ? ' masked' : '') + '">' +
      (masked ? 'Description hidden in spoiler mode — reveal it from the header toggle.' : esc(t.description)) +
    '</p>' +
    '<div class="trophy-meta">' + trophyTags(t) + '</div>';
  card.addEventListener('click', () => openTrophy(t.id));
  card.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openTrophy(t.id); }
  });
  return card;
}

function renderTrophies() {
  const grid = document.getElementById('trophyGrid');
  const vis = visibleTrophies();
  grid.innerHTML = '';
  for (const t of vis) grid.appendChild(trophyCard(t));
  document.getElementById('emptyNote').hidden = vis.length > 0;
  updateShownCounter();
}

function renderRoadmap() {
  const rm = data.roadmap;
  document.getElementById('roadmapHours').textContent =
    'Estimated total: ' + (rm ? rm.estimatedHours : 'unknown (projection)');
  const list = document.getElementById('roadmapList');
  list.innerHTML = (rm ? rm.steps : []).map(step =>
    '<li><span class="phase">' + esc(step.phase) + '</span>' +
    '<p>' + esc(step.advice) + '</p></li>'
  ).join('');
}

function renderMissables() {
  const m = data.missables || { intro: '', items: [] };
  document.getElementById('missablesIntro').textContent = m.intro;
  document.getElementById('missablesList').innerHTML =
    m.items.map(item => '<li>' + esc(item) + '</li>').join('');
}

function renderAll() {
  renderStats();
  renderFilters();
  renderTrophies();
  renderRoadmap();
  renderMissables();
  renderSpoilerToggle();
}

function renderSpoilerToggle() {
  const btn = document.getElementById('spoilerToggle');
  const label = document.getElementById('spoilerState');
  btn.classList.toggle('on', state.spoilersOn);
  btn.setAttribute('aria-pressed', String(state.spoilersOn));
  label.textContent = state.spoilersOn ? 'shown' : 'hidden';
}

// ---------- dialog ----------
function openTrophy(id) {
  const t = trophies.find(x => x.id === id);
  if (!t) return;
  const masked = isMasked(t);
  const earned = !!state.earned[t.id];
  const body = document.getElementById('dialogBody');
  body.innerHTML =
    '<p class="proj-note">PROJECTION — not an official trophy until Rockstar confirms the list</p>' +
    '<h3>' + (masked ? 'Hidden Trophy' : esc(t.name)) + '</h3>' +
    '<p class="desc' + (masked ? ' masked' : '') + '">' +
      (masked ? 'Hidden in spoiler mode.' : esc(t.description)) + '</p>' +
    '<div class="trophy-meta">' + trophyTags(t) + '</div>' +
    (t.missable && t.watch && !masked
      ? '<p class="watch"><strong>Missable watch:</strong> ' + esc(t.watch) + '</p>' : '') +
    (masked
      ? '<p class="howto">Details are hidden by spoiler mode. Toggle spoiler mode in the header to reveal.</p>'
      : '<p class="howto"><strong>How to get it:</strong> ' + esc(t.howTo) + '</p>');
  const dlg = document.getElementById('trophyDialog');
  if (!document.getElementById('dialogEarn')) {
    const actions = document.querySelector('.dialog-actions');
    const b = document.createElement('button');
    b.id = 'dialogEarn'; b.className = 'btn'; b.type = 'button';
    actions.insertBefore(b, actions.firstChild);
  }
  const earnBtn = document.getElementById('dialogEarn');
  earnBtn.textContent = earned ? 'Unmark earned' : 'Mark earned';
  earnBtn.onclick = () => {
    if (state.earned[t.id]) delete state.earned[t.id]; else state.earned[t.id] = true;
    persist();
    renderAll();
    openTrophy(t.id); // refresh dialog contents
  };
  dlg.showModal();
  // Headless/edge-case browsers can silently fail the first showModal call
  // if the dialog was just inserted; retry once on the next frame.
  if (!dlg.open) requestAnimationFrame(() => { try { dlg.showModal(); } catch (e) { /* ignore */ } });
}

// ---------- events ----------
// Press "/" anywhere to jump to search; Escape clears it.
function bindEvents() {
  const search = document.getElementById('searchBox');
  document.addEventListener('keydown', (ev) => {
    if (ev.key === '/' && document.activeElement !== search) {
      ev.preventDefault();
      search.focus();
      search.select();
    }
    if (ev.key === 'Escape' && document.activeElement === search) {
      search.value = '';
      state.query = '';
      persist();
      renderTrophies();
    }
  });

  document.getElementById('shownCounter')?.remove();
  const counter = document.createElement('span');
  counter.id = 'shownCounter';
  counter.className = 'progress-pill';
  counter.style.alignSelf = 'flex-start';
  document.querySelector('.header-controls').appendChild(counter);
  updateShownCounter();

  document.getElementById('filters').addEventListener('click', (ev) => {
    const btn = ev.target.closest('.filter-btn');
    if (!btn) return;
    state.category = btn.dataset.category;
    persist();
    renderFilters();
    renderTrophies();
  });

  search.value = state.query;
  search.addEventListener('input', () => {
    state.query = search.value;
    persist();
    renderTrophies();
  });

  document.getElementById('spoilerToggle').addEventListener('click', () => {
    state.spoilersOn = !state.spoilersOn;
    persist();
    renderAll();
  });

  document.getElementById('dialogClose').addEventListener('click', () => {
    document.getElementById('trophyDialog').close();
  });
}

function updateShownCounter() {
  const el = document.getElementById('shownCounter');
  if (!el) return;
  const vis = visibleTrophies().length;
  el.textContent = 'showing ' + vis + ' of ' + trophies.length;
}

// ---------- boot ----------
async function boot() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('Failed to load trophies.json: ' + res.status);
  data = await res.json();
  trophies = data.trophies;
  loadState();
  bindEvents();
  renderAll();
}

boot().catch(err => {
  const grid = document.getElementById('trophyGrid');
  if (grid) grid.innerHTML = '<p class="empty-note">Could not load trophy data: ' + esc(err.message) + '</p>';
});

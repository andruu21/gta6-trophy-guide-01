/* GTA VI Trophy Guide — vanilla JS single-page app.
   Renders the projected 55-trophy list, spoiler-free mode, filters and local
   progress tracking. No frameworks, no build step. */

'use strict';

const STORAGE_KEY = 'gta6-guide-progress-v1';
const SPOILER_KEY = 'gta6-guide-spoiler-mode-v1';

let state = {
  data: null,
  activeCategory: 'all',
  showMissableOnly: false,
  query: '',
  sort: 'order',
  spoilerMode: null, // null = undecided, true = hide routes, false = show routes
  progress: {}       // trophyId -> true
};

/* ---------- persistence ---------- */

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch (e) { /* private mode etc. — progress just won't persist */ }
}

function loadSpoilerMode() {
  try {
    const v = localStorage.getItem(SPOILER_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch (e) { /* ignore */ }
  // No stored preference: default to HIDING routes. New visitors are far more
  // likely to be mid-playthrough than finished, so opt-in risking spoilers.
  return true;
}

function saveSpoilerMode() {
  try {
    localStorage.setItem(SPOILER_KEY, String(state.spoilerMode));
  } catch (e) { /* ignore */ }
}

/* ---------- rendering helpers ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function rankClass(rank) {
  return 'rank-' + rank; // rank-platinum / rank-gold / rank-silver / rank-bronze
}

function difficultyLabel(level) {
  return ['—', 'Easy', 'Moderate', 'Hard', 'Very Hard'][level] || '—';
}

function difficultyBar(level) {
  const wrap = el('div', 'difficulty');
  wrap.setAttribute('aria-label', 'Difficulty ' + level + ' of 4');
  for (let i = 1; i <= 4; i++) {
    wrap.appendChild(el('span', 'difficulty-seg' + (i <= level ? ' filled' : '')));
  }
  wrap.appendChild(el('span', 'difficulty-label', difficultyLabel(level)));
  return wrap;
}

/* ---------- trophy card ---------- */

function trophyCard(trophy) {
  const card = el('article', 'trophy-card' + (state.progress[trophy.id] ? ' done' : ''));
  card.dataset.id = trophy.id;

  const head = el('div', 'trophy-head');
  head.appendChild(el('span', 'rank-badge ' + rankClass(trophy.rank), trophy.rank.toUpperCase()));
  head.appendChild(el('h3', 'trophy-name', trophy.name));
  if (trophy.missable) {
    const m = el('span', 'missable-flag', 'MISSABLE');
    m.title = 'Missable — read the note before proceeding';
    head.appendChild(m);
  }
  card.appendChild(head);

  const projected = el('span', 'projected-tag', 'PROJECTION');
  projected.title = 'Projected trophy — not yet confirmed by Rockstar';
  card.appendChild(projected);

  card.appendChild(el('p', 'trophy-desc', trophy.description));
  card.appendChild(difficultyBar(trophy.difficulty));

  if (state.spoilerMode === false) {
    if (trophy.missable && trophy.missableNote) {
      card.appendChild(el('p', 'missable-note', '⚠ ' + trophy.missableNote));
    }
    card.appendChild(el('p', 'trophy-howto', trophy.howTo));
  } else {
    card.appendChild(el('p', 'spoiler-hint', 'Spoiler mode is on — tap "Reveal" to see the route and any missable notes.'));
    const reveal = el('button', 'btn reveal-btn', 'Reveal');
    reveal.type = 'button';
    reveal.addEventListener('click', () => {
      state.spoilerMode = false;
      saveSpoilerMode();
      syncSpoilerControls();
      renderTrophies();
    });
    card.appendChild(reveal);
  }

  const done = el('label', 'progress-toggle');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!state.progress[trophy.id];
  cb.addEventListener('change', () => {
    if (cb.checked) state.progress[trophy.id] = true;
    else delete state.progress[trophy.id];
    saveProgress();
    updateProgressBar();
    renderTrophies();
  });
  done.appendChild(cb);
  done.appendChild(el('span', null, 'Done'));
  card.appendChild(done);

  return card;
}

/* ---------- section rendering ---------- */

function renderTrophies() {
  const list = document.getElementById('trophy-list');
  list.innerHTML = '';

  const data = state.data;
  const filtered = applySearchAndSort(data.trophies.filter((t) => {
    if (state.activeCategory !== 'all' && t.category !== state.activeCategory) return false;
    if (state.showMissableOnly && !t.missable) return false;
    return true;
  }));

  const catLabel = state.activeCategory === 'all'
    ? 'All trophies'
    : (data.categories.find((c) => c.id === state.activeCategory) || {}).label || state.activeCategory;

  list.appendChild(el('h2', null, catLabel + ' (' + filtered.length + ')'));
  filtered.forEach((t) => list.appendChild(trophyCard(t)));
}

function renderRoadmap() {
  const host = document.getElementById('roadmap');
  state.data.roadmap.forEach((phase) => {
    const item = el('div', 'roadmap-phase');
    item.appendChild(el('h3', null, 'Phase ' + phase.phase + ': ' + phase.title));
    item.appendChild(el('p', null, phase.text));
    host.appendChild(item);
  });
}

function renderMissables() {
  const host = document.getElementById('missables');
  state.data.missables.forEach((m) => {
    const item = el('div', 'missable-item');
    item.appendChild(el('h3', null, '⚠ ' + m.title));
    item.appendChild(el('p', null, m.text));
    host.appendChild(item);
  });
}

function renderCategoryFilters() {
  const host = document.getElementById('category-filters');
  const all = el('button', 'filter-btn active', 'All');
  all.type = 'button';
  all.dataset.category = 'all';
  host.appendChild(all);

  state.data.categories.forEach((c) => {
    const btn = el('button', 'filter-btn', c.label);
    btn.type = 'button';
    btn.dataset.category = c.id;
    host.appendChild(btn);
  });

  host.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.filter-btn');
    if (!btn) return;
    state.activeCategory = btn.dataset.category;
    host.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
    renderTrophies();
  });
}

function updateProgressBar() {
  const total = state.data.trophies.length;
  const done = Object.keys(state.progress).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-count').textContent = done + ' / ' + total;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';
}

function syncSpoilerControls() {
  const banner = document.getElementById('spoiler-banner');
  const toggle = document.getElementById('spoiler-toggle');
  if (state.spoilerMode === true) {
    banner.hidden = false;
    toggle.textContent = 'Spoilers hidden — show routes';
  } else {
    banner.hidden = true;
    toggle.textContent = 'Spoilers shown — hide routes';
  }
}

/* ---------- search & sort (revision 2) ---------- */

function applySearchAndSort(list) {
  let out = list.slice();

  if (state.query) {
    const q = state.query.toLowerCase();
    out = out.filter((t) =>
      [t.name, t.description, t.howTo, t.missableNote, t.rank]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  if (state.sort === 'name') {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sort === 'difficulty-desc') {
    out.sort((a, b) => b.difficulty - a.difficulty);
  } else if (state.sort === 'difficulty-asc') {
    out.sort((a, b) => a.difficulty - b.difficulty);
  }
  // default: data order (the guide's own recommended reading order)
  return out;
}

/* ---------- boot ---------- */

async function boot() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('Failed to load trophies.json: ' + res.status);
  state.data = await res.json();
  state.progress = loadProgress();
  state.spoilerMode = loadSpoilerMode();

  document.getElementById('guide-title').textContent = state.data.meta.title;
  document.getElementById('guide-status').textContent = state.data.meta.status;
  document.getElementById('release-line').textContent =
    state.data.meta.game + ' · ' + state.data.meta.platforms.join(' / ') +
    ' · released ' + state.data.meta.releaseDate + ' · estimated platinum: ' + state.data.meta.estimatedHours;

  renderRoadmap();
  renderMissables();
  renderCategoryFilters();
  updateProgressBar();
  syncSpoilerControls();
  renderTrophies();

  document.getElementById('spoiler-toggle').addEventListener('click', () => {
    state.spoilerMode = state.spoilerMode === true ? false : true;
    saveSpoilerMode();
    syncSpoilerControls();
    renderTrophies();
  });

  document.getElementById('missable-only').addEventListener('change', (ev) => {
    state.showMissableOnly = ev.target.checked;
    renderTrophies();
  });

  // Revision 2 wiring: live search + difficulty sort.
  document.getElementById('search-input').addEventListener('input', (ev) => {
    state.query = ev.target.value.trim();
    renderTrophies();
  });

  document.getElementById('sort-select').addEventListener('change', (ev) => {
    state.sort = ev.target.value;
    renderTrophies();
  });

  // "Reveal all" lets a finished-story user unmask every route in one click.
  document.getElementById('reveal-all').addEventListener('click', () => {
    state.spoilerMode = false;
    saveSpoilerMode();
    syncSpoilerControls();
    renderTrophies();
  });

  document.getElementById('reset-progress').addEventListener('click', () => {
    state.progress = {};
    saveProgress();
    updateProgressBar();
    renderTrophies();
  });
}

document.addEventListener('DOMContentLoaded', boot);

/* GTA VI Trophy Guide — vanilla JS single-page app (fresh rewrite).
   Renders the projected 55-trophy list with a spoiler-free mode, search,
   category/rank filters, sorting, and localStorage progress tracking.
   No frameworks, no build step. */

'use strict';

const PROGRESS_KEY = 'gta6-guide-progress-v2';
const SPOILER_KEY = 'gta6-guide-spoiler-v2';
const FILTERS_KEY = 'gta6-guide-filters-v2';

const state = {
  data: null,
  category: 'all',
  rank: 'all',
  missableOnly: false,
  hideDone: false,
  query: '',
  sort: 'guide',
  spoilerMode: true,   // true = routes hidden; persisted in localStorage
  progress: {}         // trophy id -> true
};

/* ---------- persistence ---------- */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* private mode: tracking just won't persist */ }
}

function loadProgress() {
  return loadJSON(PROGRESS_KEY, {});
}

function saveProgress() {
  saveJSON(PROGRESS_KEY, state.progress);
}

function loadSpoilerMode() {
  const v = loadJSON(SPOILER_KEY, null);
  // Default to spoiler-safe (routes hidden) for first-time visitors.
  return typeof v === 'boolean' ? v : true;
}

function saveSpoilerMode() {
  saveJSON(SPOILER_KEY, state.spoilerMode);
}

function loadFilters() {
  const f = loadJSON(FILTERS_KEY, {});
  if (typeof f.category === 'string') state.category = f.category;
  if (typeof f.rank === 'string') state.rank = f.rank;
  if (typeof f.sort === 'string') state.sort = f.sort;
  if (typeof f.missableOnly === 'boolean') state.missableOnly = f.missableOnly;
  if (typeof f.hideDone === 'boolean') state.hideDone = f.hideDone;
}

function saveFilters() {
  saveJSON(FILTERS_KEY, {
    category: state.category,
    rank: state.rank,
    sort: state.sort,
    missableOnly: state.missableOnly,
    hideDone: state.hideDone
  });
}

/* ---------- rendering helpers ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function difficultyWord(level) {
  return ['', 'Easy', 'Fair', 'Tricky', 'Hard', 'Very Hard',
          'Challenging', 'Tough', 'Demanding', 'Brutal', 'Extreme'][level] || '—';
}

function difficultyBar(level) {
  const wrap = el('div', 'difficulty');
  wrap.setAttribute('aria-label', 'Difficulty ' + level + ' of 10');
  for (let i = 1; i <= 10; i++) {
    wrap.appendChild(el('span', 'difficulty-seg' + (i <= level ? ' filled' : '')));
  }
  wrap.appendChild(el('span', 'difficulty-label', level + '/10 · ' + difficultyWord(level)));
  return wrap;
}

function trophyCard(t) {
  const card = el('article', 'trophy-card rank-border-' + t.rank +
    (state.progress[t.id] ? ' done' : ''));
  card.dataset.id = t.id;

  const head = el('div', 'trophy-head');
  head.appendChild(el('span', 'rank-badge rank-' + t.rank, t.rank.toUpperCase()));
  head.appendChild(el('h3', 'trophy-name', t.name));
  if (t.missable) {
    const flag = el('span', 'missable-flag', 'MISSABLE');
    flag.title = 'Missable — read the note before proceeding';
    head.appendChild(flag);
  }
  const proj = el('span', 'projected-tag', 'PROJECTION');
  proj.title = 'Projected trophy — not confirmed by Rockstar';
  head.appendChild(proj);
  card.appendChild(head);

  card.appendChild(el('p', 'trophy-desc', t.description));
  card.appendChild(difficultyBar(t.difficulty));

  if (state.spoilerMode) {
    const hint = el('p', 'spoiler-hint',
      'Spoiler mode is on — route details hidden.');
    card.appendChild(hint);
    const reveal = el('button', 'btn reveal-btn', 'Reveal this trophy');
    reveal.type = 'button';
    reveal.addEventListener('click', () => {
      card.classList.add('revealed');
      if (t.missable && t.missableNote) {
        card.insertBefore(
          el('p', 'missable-note', '⚠ Watch: ' + t.missableNote),
          card.querySelector('.progress-toggle'));
      }
      card.insertBefore(el('p', 'trophy-howto', t.howTo),
        card.querySelector('.progress-toggle'));
      reveal.remove();
      hint.remove();
    });
    card.appendChild(reveal);
  } else {
    if (t.missable && t.missableNote) {
      card.appendChild(el('p', 'missable-note', '⚠ Watch: ' + t.missableNote));
    }
    card.appendChild(el('p', 'trophy-howto', t.howTo));
  }

  const toggle = el('label', 'progress-toggle');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!state.progress[t.id];
  cb.setAttribute('aria-label', 'Mark ' + t.name + ' as done');
  cb.addEventListener('change', () => {
    if (cb.checked) state.progress[t.id] = true;
    else delete state.progress[t.id];
    saveProgress();
    updateProgressUI();
    if (state.hideDone) renderTrophies(); else card.classList.toggle('done', cb.checked);
  });
  toggle.appendChild(cb);
  toggle.appendChild(el('span', null, 'Done'));
  card.appendChild(toggle);

  return card;
}

/* ---------- filtering ---------- */

function visibleTrophies() {
  let list = state.data.trophies.slice();

  if (state.category !== 'all') {
    list = list.filter((t) => t.category === state.category);
  }
  if (state.rank !== 'all') {
    list = list.filter((t) => t.rank === state.rank);
  }
  if (state.missableOnly) {
    list = list.filter((t) => t.missable);
  }
  if (state.hideDone) {
    list = list.filter((t) => !state.progress[t.id]);
  }
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter((t) =>
      [t.name, t.description, t.howTo, t.missableNote, t.rank, t.category]
        .join(' ').toLowerCase().includes(q));
  }

  switch (state.sort) {
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'difficulty-desc':
      list.sort((a, b) => b.difficulty - a.difficulty);
      break;
    case 'difficulty-asc':
      list.sort((a, b) => a.difficulty - b.difficulty);
      break;
    case 'rank': {
      const order = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
      list.sort((a, b) => (order[a.rank] - order[b.rank]) || a.difficulty - b.difficulty);
      break;
    }
    default:
      break; // 'guide' order = data order
  }
  return list;
}

/* ---------- render ---------- */

function renderTrophies() {
  const list = document.getElementById('trophy-list');
  list.innerHTML = '';

  const shown = visibleTrophies();
  const total = state.data.trophies.length;
  list.appendChild(el('h2', null, 'Trophies (' + shown.length + ' of ' + total + ')'));

  if (shown.length === 0) {
    list.appendChild(el('p', 'empty-note', 'No trophies match the current filters.'));
  }
  shown.forEach((t) => list.appendChild(trophyCard(t)));
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
  host.innerHTML = '';
  const mk = (id, label) => {
    const btn = el('button', 'filter-btn' +
      (state.category === id ? ' active' : ''), label);
    btn.type = 'button';
    btn.dataset.category = id;
    host.appendChild(btn);
  };
  mk('all', 'All');
  state.data.categories.forEach((c) => mk(c.id, c.label));
}

function renderRankFilters() {
  const host = document.getElementById('rank-filters');
  host.innerHTML = '';
  ['all', 'platinum', 'gold', 'silver', 'bronze'].forEach((r) => {
    const btn = el('button', 'filter-btn' + (state.rank === r ? ' active' : ''),
      r === 'all' ? 'All ranks' : r);
    btn.type = 'button';
    btn.dataset.rank = r;
    host.appendChild(btn);
  });
}

function updateProgressUI() {
  const total = state.data.trophies.length;
  const done = Object.keys(state.progress).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-count').textContent = done + ' / ' + total;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
}

function syncSpoilerUI() {
  const toggle = document.getElementById('spoiler-toggle');
  const banner = document.getElementById('spoiler-banner');
  toggle.setAttribute('aria-pressed', String(!state.spoilerMode));
  toggle.textContent = state.spoilerMode
    ? '🙈 Spoilers hidden — show routes'
    : '👀 Spoilers shown — hide routes';
  banner.hidden = !state.spoilerMode;
}

/* ---------- boot ---------- */

async function boot() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('Failed to load trophies.json: ' + res.status);
  state.data = await res.json();

  state.progress = loadProgress();
  state.spoilerMode = loadSpoilerMode();
  loadFilters();

  document.getElementById('guide-title').textContent = state.data.meta.title;
  document.getElementById('guide-status').textContent = state.data.meta.status;
  document.getElementById('release-line').textContent =
    state.data.meta.game + ' · ' + state.data.meta.platforms.join(' / ') +
    ' · released ' + state.data.meta.releaseDate +
    ' · ' + state.data.meta.trophyCount + ' projected trophies · est. platinum ' +
    state.data.meta.estimatedHours;

  renderRoadmap();
  renderMissables();
  renderCategoryFilters();
  renderRankFilters();
  updateProgressUI();
  syncSpoilerUI();
  renderTrophies();

  // restore control state from persisted filters
  document.getElementById('missable-only').checked = state.missableOnly;
  document.getElementById('hide-done').checked = state.hideDone;
  document.getElementById('sort-select').value = state.sort;

  document.getElementById('spoiler-toggle').addEventListener('click', () => {
    state.spoilerMode = !state.spoilerMode;
    saveSpoilerMode();
    syncSpoilerUI();
    renderTrophies();
  });

  document.getElementById('category-filters').addEventListener('click', (ev) => {
    const btn = ev.target.closest('.filter-btn');
    if (!btn) return;
    state.category = btn.dataset.category;
    saveFilters();
    renderCategoryFilters();
    renderTrophies();
  });

  document.getElementById('rank-filters').addEventListener('click', (ev) => {
    const btn = ev.target.closest('.filter-btn');
    if (!btn) return;
    state.rank = btn.dataset.rank;
    saveFilters();
    renderRankFilters();
    renderTrophies();
  });

  document.getElementById('missable-only').addEventListener('change', (ev) => {
    state.missableOnly = ev.target.checked;
    saveFilters();
    renderTrophies();
  });

  document.getElementById('hide-done').addEventListener('change', (ev) => {
    state.hideDone = ev.target.checked;
    saveFilters();
    renderTrophies();
  });

  document.getElementById('search-input').addEventListener('input', (ev) => {
    state.query = ev.target.value.trim();
    renderTrophies();
  });

  document.getElementById('sort-select').addEventListener('change', (ev) => {
    state.sort = ev.target.value;
    saveFilters();
    renderTrophies();
  });

  document.getElementById('reset-progress').addEventListener('click', () => {
    if (!window.confirm('Reset all tracked trophy progress?')) return;
    state.progress = {};
    saveProgress();
    updateProgressUI();
    renderTrophies();
  });
}

document.addEventListener('DOMContentLoaded', boot);

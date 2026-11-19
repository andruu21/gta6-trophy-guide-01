/* GTA VI Trophy Guide — vanilla JS single-page app.
   Renders the projected 55-trophy list, spoiler-free mode, filters, search,
   sorting and local progress tracking. No frameworks, no build step. */

'use strict';

(function () {
  const STORAGE_KEYS = {
    progress: 'gta6-guide.progress.v1',
    spoilers: 'gta6-guide.spoilers.v1',
    theme: 'gta6-guide.theme.v1'
  };

  const state = {
    trophies: [],
    categories: [],
    difficulties: [],
    meta: null,
    selectedCategories: new Set(),
    selectedDifficulties: new Set(),
    missableOnly: false,
    query: '',
    sort: 'order',
    openTrophy: null,
    spoilersOn: true,
    tracked: new Set()
  };

  const $ = (sel) => document.querySelector(sel);

  /* ---------- persistence ---------- */

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('Could not read stored state:', err);
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('Could not persist state:', err);
    }
  }

  function loadProgress() {
    const saved = loadJSON(STORAGE_KEYS.progress, []);
    state.tracked = new Set(Array.isArray(saved) ? saved : []);
  }

  function saveProgress() {
    saveJSON(STORAGE_KEYS.progress, Array.from(state.tracked));
  }

  /* ---------- data ---------- */

  async function loadTrophies() {
    const res = await fetch('data/trophies.json');
    if (!res.ok) throw new Error('Failed to load trophies.json: HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.trophies)) throw new Error('trophies.json has no trophies array');
    state.trophies = data.trophies;
    state.categories = data.categories || [];
    state.difficulties = data.difficulties || [];
    state.meta = data.meta || null;
  }

  /* ---------- spoiler mode ---------- */

  function applySpoilerMode() {
    const btn = $('#spoilerToggle');
    const stateLabel = $('#spoilerState');
    btn.setAttribute('aria-pressed', String(state.spoilersOn));
    stateLabel.textContent = state.spoilersOn ? 'ON' : 'OFF';
    $('#spoilerIcon').textContent = state.spoilersOn ? '🙈' : '👁️';
    render();
  }

  function toggleSpoilers() {
    state.spoilersOn = !state.spoilersOn;
    saveJSON(STORAGE_KEYS.spoilers, state.spoilersOn);
    applySpoilerMode();
  }

  /* A trophy's story details are masked while spoiler mode is ON.
     Rule of thumb: anything that names missions, chapters, endings or
     story-specific mechanics stays hidden; world systems stay visible. */
  function trophiesHiddenBySpoilers(t) {
    if (!state.spoilersOn) return false;
    // Story and choice outcomes are inherently narrative: always masked.
    if (t.category === 'story' || t.category === 'partnership') return true;
    // Narrative heists (the story scores) are masked; repeatable open-world
    // robberies (jewelry stores, vaults, armored trucks) stay visible.
    if (t.category === 'heists' && /The Cartel Heist|story/i.test(t.description)) return true;
    // Anything referencing the final mission or chapter structure stays masked.
    return /final mission|Chapter \d|endgame/i.test(t.description);
  }

  /* ---------- filtering ---------- */

  function currentTrophies() {
    let list = state.trophies.slice();

    if (state.selectedCategories.size) {
      list = list.filter((t) => state.selectedCategories.has(t.category));
    }
    if (state.selectedDifficulties.size) {
      list = list.filter((t) => state.selectedDifficulties.has(t.difficulty));
    }
    if (state.missableOnly) {
      list = list.filter((t) => t.missable || /miss|save before|lockout|reset/i.test(t.missableNote || ''));
    }
    if (state.query) {
      const q = state.query.toLowerCase();
      list = list.filter((t) =>
        [t.name, t.description, t.missableNote, t.category, t.type]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    if (state.sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sort === 'difficulty') {
      const order = state.difficulties.slice().reverse();
      list.sort((a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty));
    }
    return list;
  }

  /* ---------- rendering ---------- */

  function renderChips() {
    const catWrap = $('#categoryFilters');
    catWrap.innerHTML = '';
    state.categories.forEach((cat) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = cat.label;
      chip.dataset.category = cat.id;
      chip.addEventListener('click', () => {
        if (state.selectedCategories.has(cat.id)) {
          state.selectedCategories.delete(cat.id);
          chip.classList.remove('active');
        } else {
          state.selectedCategories.add(cat.id);
          chip.classList.add('active');
        }
        render();
      });
      catWrap.appendChild(chip);
    });

    const diffWrap = $('#difficultyFilters');
    diffWrap.innerHTML = '';
    state.difficulties.forEach((diff) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = diff;
      chip.dataset.difficulty = diff;
      chip.addEventListener('click', () => {
        if (state.selectedDifficulties.has(diff)) {
          state.selectedDifficulties.delete(diff);
          chip.classList.remove('active');
        } else {
          state.selectedDifficulties.add(diff);
          chip.classList.add('active');
        }
        render();
      });
      diffWrap.appendChild(chip);
    });
  }

  function spoilerify(t, el) {
    if (!trophiesHiddenBySpoilers(t)) return;
    const masked = document.createElement('div');
    masked.className = 'spoiler-placeholder';
    masked.textContent = '🔒 Spoiler-free mode is ON — story details hidden. Toggle it off in the header once you\'ve finished the campaign.';
    el.innerHTML = '';
    el.appendChild(masked);
    el.classList.add('spoiler-mask');
  }

  function trophyCard(t) {
    const card = document.createElement('article');
    card.className = 'trophy-card cat-' + t.category;
    card.setAttribute('role', 'listitem');
    card.tabIndex = 0;
    card.dataset.id = t.id;

    const head = document.createElement('div');
    head.className = 'trophy-head';
    const name = document.createElement('h3');
    name.className = 'trophy-name';
    name.textContent = t.name;
    const badge = document.createElement('span');
    badge.className = 'badge badge-' + t.type;
    badge.textContent = t.type;
    head.append(name, badge);

    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const diff = document.createElement('span');
    diff.className = 'meta-pill diff-' + t.difficulty.replace(/\s+/g, '');
    diff.textContent = 'Difficulty: ' + t.difficulty;
    meta.appendChild(diff);

    const catPill = document.createElement('span');
    catPill.className = 'meta-pill';
    const catDef = state.categories.find((c) => c.id === t.category);
    catPill.textContent = catDef ? catDef.label : t.category;
    meta.appendChild(catPill);

    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'meta-pill flag-missable';
      flag.textContent = 'Missable risk';
      meta.appendChild(flag);
    }

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = t.description;
    spoilerify(t, desc);

    const projected = document.createElement('div');
    projected.className = 'muted';
    projected.style.marginTop = '6px';
    projected.textContent = 'Projected — not yet verified against Rockstar\u2019s official list.';

    card.append(head, meta, desc, projected);

    if (t.missableNote) {
      const note = document.createElement('p');
      note.className = 'trophy-note';
      note.textContent = '⚠ ' + t.missableNote;
      spoilerify(t, note);
      card.appendChild(note);
    }

    const trackRow = document.createElement('div');
    trackRow.className = 'track-row';
    const trackBtn = document.createElement('button');
    trackBtn.type = 'button';
    trackBtn.className = 'track-btn' + (state.tracked.has(t.id) ? ' done' : '');
    trackBtn.textContent = state.tracked.has(t.id) ? '✓ Tracked' : 'Mark obtained';
    trackBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleTracked(t.id);
    });
    trackRow.appendChild(trackBtn);
    card.appendChild(trackRow);

    card.addEventListener('click', () => toggleOpen(t.id));
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggleOpen(t.id);
      }
    });

    return card;
  }

  function detailBody(t) {
    const pane = document.createElement('div');
    pane.className = 'detail-pane';
    const title = document.createElement('h4');
    title.textContent = 'What to watch';
    const body = document.createElement('p');
    body.textContent = t.missableNote || 'No special watch-outs recorded for this projection.';
    pane.append(title, body);
    return pane;
  }

  function toggleOpen(id) {
    state.openTrophy = state.openTrophy === id ? null : id;
    render();
  }

  function toggleTracked(id) {
    if (state.tracked.has(id)) {
      state.tracked.delete(id);
    } else {
      state.tracked.add(id);
    }
    saveProgress();
    render();
  }

  function renderProgress() {
    const total = state.trophies.length;
    const count = state.tracked.size;
    $('#progressCount').textContent = String(count);
    $('#progressTotal').textContent = String(total);
    $('#progressFill').style.width = total ? (100 * count / total).toFixed(1) + '%' : '0%';
  }

  function render() {
    const grid = $('#trophyGrid');
    grid.innerHTML = '';
    const list = currentTrophies();
    $('#resultCount').textContent = '(' + list.length + ' shown)';
    $('#emptyState').hidden = list.length > 0;

    list.forEach((t) => {
      const card = trophyCard(t);
      if (state.openTrophy === t.id) {
        card.classList.add('open');
        card.appendChild(detailBody(t));
      }
      grid.appendChild(card);
    });

    renderProgress();
  }

  /* ---------- theme ---------- */

  function applyTheme() {
    const saved = loadJSON(STORAGE_KEYS.theme, 'dark');
    document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark';
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    saveJSON(STORAGE_KEYS.theme, next);
  }

  /* ---------- init ---------- */

  function wireStaticControls() {
    $('#spoilerToggle').addEventListener('click', toggleSpoilers);
    $('#themeToggle').addEventListener('click', toggleTheme);

    $('#searchInput').addEventListener('input', (ev) => {
      state.query = ev.target.value.trim();
      render();
    });

    $('#missableOnly').addEventListener('change', (ev) => {
      state.missableOnly = ev.target.checked;
      const chip = ev.target.closest('.chip');
      if (chip) chip.classList.toggle('active', ev.target.checked);
      render();
    });

    $('#sortSelect').addEventListener('change', (ev) => {
      state.sort = ev.target.value;
      render();
    });

    $('#resetProgress').addEventListener('click', () => {
      state.tracked.clear();
      saveProgress();
      render();
    });
  }

  async function init() {
    applyTheme();
    loadProgress();
    state.spoilersOn = loadJSON(STORAGE_KEYS.spoilers, true);
    wireStaticControls();

    try {
      await loadTrophies();
    } catch (err) {
      console.error(err);
      $('#emptyState').hidden = false;
      $('#emptyState').textContent = 'Could not load trophies.json — open this page via a web server (e.g. `python3 -m http.server`), not file://.';
      return;
    }

    renderChips();
    applySpoilerMode();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

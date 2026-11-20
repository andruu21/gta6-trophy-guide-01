// Leonida Platinum — GTA VI trophy guide & tracker (offline, no network).
import { renderTrophies, applyFilters } from './list.js';
import { renderRoadmap, renderGuide } from './roadmap.js';
import { loadProgress, saveProgress, exportProgress, importProgress, resetProgress } from './progress.js';

const state = {
  trophies: [],
  roadmap: [],
  earned: new Set(),
  selected: null,
  filters: { kind: 'all', grade: 'all', hideEarned: false, spoiler: false, missOnly: false },
};

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  state.trophies = data.trophies;
  state.roadmap = data.roadmap ?? [];
  state.earned = loadProgress();

  renderRoadmap(document.getElementById('roadmapList'), state.roadmap);
  wireControls();
  applyFilters(state);
  renderTrophies(document.getElementById('trophyList'), state, onToggle, onSelect);
  updateProgress();
  // open the first visible trophy so the guide panel is never empty on load
  if (state.visible?.length) onSelect(state.visible[0]);
}

function onToggle(name, checked) {
  if (checked) state.earned.add(name); else state.earned.delete(name);
  saveProgress([...state.earned]);
  applyFilters(state);
  renderTrophies(document.getElementById('trophyList'), state, onToggle, onSelect);
  updateProgress();
}

function onSelect(t) {
  state.selected = t;
  renderGuide(document.getElementById('guideDetail'), t, state);
  document.querySelectorAll('.trophy.open').forEach(el => el.classList.remove('open'));
  const li = document.querySelector(`.trophy[data-name="${CSS.escape(t.name)}"]`);
  if (li) { li.classList.add('open'); }
}

function updateProgress() {
  const n = state.earned.size;
  const total = state.trophies.length;
  document.getElementById('earnedCount').textContent = `${n} / ${total} earned`;
  document.getElementById('platinumPct').textContent =
    `${total ? Math.round((n / total) * 100) : 0}% platinum`;
  document.getElementById('barFill').style.width = `${total ? (n / total) * 100 : 0}%`;
  const by = g => state.trophies.filter(t => t.grade === g && state.earned.has(t.name)).length;
  document.getElementById('gradeMini').textContent =
    `P ${by('platinum')} · G ${by('gold')} · S ${by('silver')} · B ${by('bronze')}`;
}

function wireControls() {
  const kindF = document.getElementById('kindFilter');
  const gradeF = document.getElementById('gradeFilter');
  const hideE = document.getElementById('hideEarned');
  const spoil = document.getElementById('spoilerMode');
  const missChip = document.getElementById('missableChip');
  const rerender = () => {
    state.filters.kind = kindF.value;
    state.filters.grade = gradeF.value;
    state.filters.hideEarned = hideE.checked;
    state.filters.spoiler = spoil.checked;
    document.getElementById('spoilerBanner').hidden = !spoil.checked;
    applyFilters(state);
    renderTrophies(document.getElementById('trophyList'), state, onToggle, onSelect);
    if (state.selected) renderGuide(document.getElementById('guideDetail'), state.selected, state);
  };
  kindF.addEventListener('change', rerender);
  gradeF.addEventListener('change', rerender);
  hideE.addEventListener('change', rerender);
  spoil.addEventListener('change', rerender);
  const flipMiss = () => {
    state.filters.missOnly = !state.filters.missOnly;
    missChip.classList.toggle('active', state.filters.missOnly);
    rerender();
  };
  missChip.addEventListener('click', flipMiss);
  missChip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') flipMiss(); });

  document.getElementById('exportBtn').addEventListener('click', () => exportProgress([...state.earned]));
  document.getElementById('importInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state.earned = importProgress(await file.text(), state.trophies);
      saveProgress([...state.earned]);
      rerender();
      updateProgress();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all progress?')) return;
    resetProgress();
    state.earned = new Set();
    rerender();
    updateProgress();
  });
}

boot();

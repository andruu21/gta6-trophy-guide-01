// Leonida Platinum — entry point. Offline static app; earned state lives in
// localStorage and the UI is built from plain DOM calls.
import { drawList, applyFilters, orderTrophies } from './list.js';
import { drawStages, drawGuide } from './roadmap.js';
import { readEarned, saveEarned, downloadEarned, parseEarnedFile, clearEarned } from './progress.js';

const store = {
  db: { trophies: [], roadmap: [] },
  earned: new Set(),
  selected: null,
  view: { kind: 'all', grade: 'all', stage: 'all', hideDone: false, spoilers: false, missOnly: false },
  shown: [],
};

const byId = id => document.getElementById(id);

async function boot() {
  const res = await fetch('data/trophies.json');
  store.db = await res.json();
  store.earned = readEarned();
  drawStages(byId('roadmapList'), store.db.roadmap ?? []);
  wireControls();
  redraw();
  if (store.shown.length) select(store.shown[0]);
}

function redraw() {
  store.shown = orderTrophies(applyFilters(store.db.trophies, store.view, store.earned), store.earned);
  drawList(byId('trophyList'), store.shown, store.earned, store.view, markEarned, select);
  paintMeter();
}

function markEarned(name, on) {
  if (on) store.earned.add(name); else store.earned.delete(name);
  saveEarned([...store.earned]);
  redraw();
  if (store.selected) drawGuide(byId('guideDetail'), store.selected, store);
}

function select(t) {
  store.selected = t;
  drawGuide(byId('guideDetail'), t, store);
  document.querySelectorAll('.row.picked').forEach(el => el.classList.remove('picked'));
  const li = document.querySelector(`.row[data-trophy="${CSS.escape(t.name)}"]`);
  if (li) li.classList.add('picked');
}

function paintMeter() {
  const total = store.db.trophies.length || 55;
  const n = store.earned.size;
  byId('earnedCount').textContent = `${n} / ${total} earned`;
  byId('platinumPct').textContent = `${Math.round((n / total) * 100)}% to platinum`;
  byId('meterFill').style.width = `${(n / total) * 100}%`;
  const per = g => store.db.trophies.filter(t => t.grade === g && store.earned.has(t.name)).length;
  byId('gradeMini').textContent = `P ${per('platinum')} · G ${per('gold')} · S ${per('silver')} · B ${per('bronze')}`;
  const left = store.db.trophies.filter(t => t.missable && !store.earned.has(t.name)).length;
  byId('missableTip').textContent = left
    ? `${left} missable ${left === 1 ? 'trophy' : 'trophies'} still open — clear them before the story closes the window.`
    : 'Every missable trophy is marked earned.';
}

function wireControls() {
  const sync = () => {
    store.view.kind = byId('kindFilter').value;
    store.view.grade = byId('gradeFilter').value;
    store.view.stage = byId('stageFilter').value;
    store.view.hideDone = byId('hideEarned').checked;
    store.view.spoilers = byId('spoilerMode').checked;
    byId('spoilerBanner').hidden = !store.view.spoilers;
    redraw();
    if (store.selected) drawGuide(byId('guideDetail'), store.selected, store);
  };
  for (const id of ['kindFilter', 'gradeFilter', 'stageFilter', 'hideEarned', 'spoilerMode']) {
    byId(id).addEventListener('change', sync);
  }
  const chip = byId('missableChip');
  const flip = () => {
    store.view.missOnly = !store.view.missOnly;
    chip.classList.toggle('on', store.view.missOnly);
    sync();
  };
  chip.addEventListener('click', flip);
  chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') flip(); });

  byId('exportBtn').addEventListener('click', () => downloadEarned([...store.earned]));
  byId('importInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      store.earned = parseEarnedFile(await f.text(), store.db.trophies);
      saveEarned([...store.earned]);
      sync();
    } catch (err) { alert('Import failed: ' + err.message); }
    e.target.value = '';
  });
  byId('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned marks?')) return;
    clearEarned();
    store.earned = new Set();
    sync();
  });
}

boot();

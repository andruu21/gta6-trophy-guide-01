// Leonida Ledger — GTA VI trophy tracker. Fully offline; state lives in localStorage.
import { renderList, computeVisible, sortVisible } from './list.js';
import { renderRoadmap, renderGuide } from './roadmap.js';
import { loadEarned, persistEarned, exportEarned, importEarned, wipeEarned } from './progress.js';

const S = {
  data: { trophies: [], roadmap: [] },
  earned: new Set(),
  picked: null,
  view: { kind: 'all', grade: 'all', hideDone: false, spoilers: false, missOnly: false },
  visible: [],
};

const $ = id => document.getElementById(id);

async function start() {
  const data = await (await fetch('data/trophies.json')).json();
  S.data = data;
  S.earned = loadEarned();
  renderRoadmap($('roadmapList'), data.roadmap ?? []);
  bindControls();
  refresh();
  if (S.visible.length) pick(S.visible[0]);
}

function refresh() {
  S.visible = sortVisible(computeVisible(S.data.trophies, S.view, S.earned), S.earned);
  renderList($('trophyList'), S.visible, S.earned, S.view, toggle, pick);
  paintProgress();
}

function toggle(name, on) {
  if (on) S.earned.add(name); else S.earned.delete(name);
  persistEarned([...S.earned]);
  refresh();
  if (S.picked) renderGuide($('guideDetail'), S.picked, S);
}

function pick(t) {
  S.picked = t;
  renderGuide($('guideDetail'), t, S);
  document.querySelectorAll('.trophy.open').forEach(el => el.classList.remove('open'));
  const li = document.querySelector(`.trophy[data-name="${CSS.escape(t.name)}"]`);
  if (li) li.classList.add('open');
}

function paintProgress() {
  const total = S.data.trophies.length || 55;
  const n = S.earned.size;
  $('earnedCount').textContent = `${n} / ${total} earned`;
  $('platinumPct').textContent = `${Math.round((n / total) * 100)}% platinum`;
  $('barFill').style.width = `${(n / total) * 100}%`;
  const per = g => S.data.trophies.filter(t => t.grade === g && S.earned.has(t.name)).length;
  $('gradeMini').textContent = `P ${per('platinum')} · G ${per('gold')} · S ${per('silver')} · B ${per('bronze')}`;
  const left = S.data.trophies.filter(t => t.missable && !S.earned.has(t.name)).length;
  $('missableTip').textContent = left
    ? `${left} missable ${left === 1 ? 'trophy' : 'trophies'} still unmarked — clear them before the story closes their window.`
    : 'All missable trophies are marked.';
}

function bindControls() {
  const rerun = () => {
    S.view.kind = $('kindFilter').value;
    S.view.grade = $('gradeFilter').value;
    S.view.hideDone = $('hideEarned').checked;
    S.view.spoilers = $('spoilerMode').checked;
    $('spoilerBanner').hidden = !S.view.spoilers;
    refresh();
    if (S.picked) renderGuide($('guideDetail'), S.picked, S);
  };
  for (const id of ['kindFilter', 'gradeFilter']) $(id).addEventListener('change', rerun);
  for (const id of ['hideEarned', 'spoilerMode']) $(id).addEventListener('change', rerun);
  const chip = $('missableChip');
  const flip = () => { S.view.missOnly = !S.view.missOnly; chip.classList.toggle('active', S.view.missOnly); rerun(); };
  chip.addEventListener('click', flip);
  chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') flip(); });

  $('exportBtn').addEventListener('click', () => exportEarned([...S.earned]));
  $('importInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      S.earned = importEarned(await f.text(), S.data.trophies);
      persistEarned([...S.earned]);
      rerun();
      paintProgress();
    } catch (err) { alert('Import failed: ' + err.message); }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned marks?')) return;
    wipeEarned();
    S.earned = new Set();
    rerun();
  });
}

start();

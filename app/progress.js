// Earned-state persistence: localStorage (single JSON list under one key) plus
// JSON file export/import so progress can move between browsers or machines.
const KEY = 'gta6-leonida-ledger-v1';

export function loadEarned() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : []);
  } catch { return new Set(); }
}

export function persistEarned(names) {
  try { localStorage.setItem(KEY, JSON.stringify(names)); } catch { /* storage blocked */ }
}

export function exportEarned(names) {
  const blob = new Blob([JSON.stringify({ app: 'gta6-leonida-ledger', version: 1, earned: names }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importEarned(text, trophies) {
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(arr)) throw new Error('no earned array in file');
  const known = new Set(trophies.map(t => t.name));
  return new Set(arr.filter(x => typeof x === 'string' && known.has(x)));
}

export function wipeEarned() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

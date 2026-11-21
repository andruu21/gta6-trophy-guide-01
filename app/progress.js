// Earned-state persistence: one localStorage key plus JSON export/import so
// progress survives reloads and can move between browsers.

const STORAGE_KEY = 'gta6-leonida-ledger-v2';

export function readEarned() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []);
  } catch { return new Set(); }
}

export function saveEarned(names) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(names)); } catch { /* storage unavailable */ }
}

export function downloadEarned(names) {
  const payload = JSON.stringify({ app: 'gta6-leonida-ledger', version: 2, earned: names }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseEarnedFile(text, trophies) {
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(arr)) throw new Error('no earned array in file');
  const known = new Set(trophies.map(t => t.name));
  return new Set(arr.filter(x => typeof x === 'string' && known.has(x)));
}

export function clearEarned() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
}

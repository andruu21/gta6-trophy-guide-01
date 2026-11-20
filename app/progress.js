// Progress persistence: localStorage save/load plus export/import to a file.
const KEY = 'gta6-leonida-platinum-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveProgress(names) {
  try { localStorage.setItem(KEY, JSON.stringify(names)); } catch { /* private mode */ }
}

export function exportProgress(names) {
  const payload = { app: 'gta6-leonida-platinum', version: 1, earned: names };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importProgress(text, trophies) {
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(arr)) throw new Error('no earned array in file');
  const known = new Set(trophies.map(t => t.name));
  return new Set(arr.filter(x => typeof x === 'string' && known.has(x)));
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

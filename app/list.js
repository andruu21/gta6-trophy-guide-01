// Filtering + list rendering for the trophy checklist.
export function computeVisible(trophies, view, earned) {
  return trophies.filter(t => {
    if (view.missOnly && !t.missable) return false;
    if (view.kind === 'missable') { if (!t.missable) return false; }
    else if (view.kind !== 'all' && t.kind !== view.kind) return false;
    if (view.grade !== 'all' && t.grade !== view.grade) return false;
    if (view.hideDone && earned.has(t.name)) return false;
    return true;
  });
}

// Order: unfinished missables first (they expire), then the rest by id.
export function sortVisible(list, earned) {
  return [...list].sort((a, b) => {
    const am = a.missable && !earned.has(a.name) ? 0 : 1;
    const bm = b.missable && !earned.has(b.name) ? 0 : 1;
    return am - bm || a.id - b.id;
  });
}

function tag(cls, text) {
  const s = document.createElement('span');
  s.className = 'badge ' + cls;
  s.textContent = text;
  return s;
}

function cell(cls, text) {
  const d = document.createElement('div');
  d.className = cls;
  if (text != null) d.textContent = text;
  return d;
}

export function renderList(root, visible, earned, view, onToggle, onPick) {
  root.replaceChildren();
  for (const t of visible) {
    const li = document.createElement('li');
    li.className = 'trophy';
    li.dataset.name = t.name;
    const done = earned.has(t.name);
    if (done) li.classList.add('earned');
    if (t.missable) li.classList.add('missable-flag');

    const row = document.createElement('div');
    row.className = 'tr-main';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'tr-check';
    box.checked = done;
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('click', e => e.stopPropagation());
    box.addEventListener('change', () => onToggle(t.name, box.checked));
    row.append(box);

    const info = document.createElement('div');
    info.className = 'tr-info';
    const masked = view.spoilers && t.kind === 'story' && !done;
    if (masked) {
      li.classList.add('spoiler-hidden');
      info.append(cell('tr-name', '████ spoiler protected ████'),
                  cell('tr-desc', 'Mark this story trophy earned to reveal it.'));
    } else {
      info.append(cell('tr-name', t.name), cell('tr-desc', t.description ?? ''));
    }
    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.append(tag(t.grade, t.grade));
    badges.append(tag('kind', t.missable ? 'missable' : (t.kind ?? 'misc')));
    if (t.hidden) badges.append(tag('hidden-b', 'hidden'));
    if (t.missable) badges.append(tag('warn', '⚠ missable'));
    info.append(badges);
    row.append(info);
    li.append(row);
    li.addEventListener('click', () => onPick(t));
    root.append(li);
  }
}

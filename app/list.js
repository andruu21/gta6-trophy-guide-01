// Checklist side: filtering, missables-first ordering and list drawing.

// Keep only trophies the current view wants.
export function applyFilters(trophies, view, earned) {
  return trophies.filter(t => {
    if (view.missOnly && !t.missable) return false;
    if (view.kind === 'missable') { if (!t.missable) return false; }
    else if (view.kind !== 'all' && t.kind !== view.kind) return false;
    if (view.grade !== 'all' && t.grade !== view.grade) return false;
    if (view.hideDone && earned.has(t.name)) return false;
    return true;
  });
}

// Unfinished missables rise to the top (their window can close); everything
// else keeps list order.
export function orderTrophies(list, earned) {
  return [...list].sort((a, b) => {
    const av = a.missable && !earned.has(a.name) ? 0 : 1;
    const bv = b.missable && !earned.has(b.name) ? 0 : 1;
    return av - bv;
  });
}

function badge(cls, text) {
  const s = document.createElement('span');
  s.className = 'tag ' + cls;
  s.textContent = text;
  return s;
}

function box(cls, text) {
  const d = document.createElement('div');
  d.className = cls;
  if (text != null) d.textContent = text;
  return d;
}

export function drawList(root, shown, earned, view, onMark, onSelect) {
  root.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'row';
    li.dataset.trophy = t.name;
    const got = earned.has(t.name);
    if (got) li.classList.add('got');
    if (t.missable) li.classList.add('perishable');

    const body = document.createElement('div');
    body.className = 'row-body';

    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.className = 'row-check';
    tick.checked = got;
    tick.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    tick.addEventListener('click', e => e.stopPropagation());
    tick.addEventListener('change', () => onMark(t.name, tick.checked));
    body.append(tick);

    const info = document.createElement('div');
    info.className = 'row-info';
    const veiled = view.spoilers && t.kind === 'story' && !got;
    if (veiled) {
      li.classList.add('veiled-row');
      info.append(box('row-name', '████ spoiler protected ████'),
                  box('row-desc', 'Mark this story trophy earned to reveal it.'));
    } else {
      info.append(box('row-name', t.name), box('row-desc', t.description ?? ''));
    }
    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.append(badge(t.grade, t.grade));
    tags.append(badge('family', t.missable ? 'missable' : (t.kind ?? 'misc')));
    if (t.hidden) tags.append(badge('veiled', 'hidden'));
    if (t.missable) tags.append(badge('alert', '⚠ missable'));
    info.append(tags);
    body.append(info);
    li.append(body);
    li.addEventListener('click', () => onSelect(t));
    root.append(li);
  }
}

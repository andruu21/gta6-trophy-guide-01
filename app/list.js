// Trophy list rendering + filtering.
export function applyFilters(state) {
  const f = state.filters;
  state.visible = state.trophies.filter(t => {
    if (f.missOnly && !t.missable) return false;
    if (f.kind === 'missable') { if (!t.missable) return false; }
    else if (f.kind !== 'all' && t.kind !== f.kind) return false;
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.hideEarned && state.earned.has(t.name)) return false;
    return true;
  });
}

function gradeBadge(grade) {
  const b = document.createElement('span');
  b.className = 'badge ' + grade;
  b.textContent = grade;
  return b;
}

export function renderTrophies(root, state, onToggle, onSelect) {
  root.replaceChildren();
  for (const t of state.visible) {
    const li = document.createElement('li');
    li.className = 'trophy';
    li.dataset.name = t.name;
    const isEarned = state.earned.has(t.name);
    if (isEarned) li.classList.add('earned');
    if (t.missable) li.classList.add('missable-flag');

    const main = document.createElement('div');
    main.className = 'tr-main';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'tr-check';
    box.checked = isEarned;
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('click', e => e.stopPropagation());
    box.addEventListener('change', () => onToggle(t.name, box.checked));
    main.append(box);

    const info = document.createElement('div');
    info.className = 'tr-info';
    if (state.filters.spoiler && t.kind === 'story' && !isEarned) {
      li.classList.add('spoiler-hidden');
      info.append(
        el('div', 'tr-name', '████ spoiler protected ████'),
        el('div', 'tr-desc', 'Complete this story trophy to reveal it.'),
      );
    } else {
      info.append(el('div', 'tr-name', t.name), el('div', 'tr-desc', t.description ?? ''));
    }

    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.append(gradeBadge(t.grade));
    if (t.kind && t.kind !== 'missable') badges.append(el('span', 'badge kind', t.kind));
    else if (t.kind === 'missable') badges.append(el('span', 'badge kind', 'missable'));
    if (t.hidden) badges.append(el('span', 'badge hidden-b', 'hidden'));
    if (t.missable) badges.append(el('span', 'badge warn', '⚠ missable'));
    info.append(badges);
    main.append(info);
    li.append(main);
    li.addEventListener('click', () => onSelect(t));
    root.append(li);
  }
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

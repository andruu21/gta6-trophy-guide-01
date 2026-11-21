// Roadmap stages and the per-trophy guide panel.

function el(tag, cls, text) {
  const d = document.createElement(tag);
  d.className = cls;
  if (text != null) d.textContent = text;
  return d;
}

export function drawStages(root, roadmap) {
  root.replaceChildren();
  for (const st of roadmap) {
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.append(el('span', 'st-title', st.title));
    head.append(el('span', 'st-time', st.time ?? ''));
    li.append(head);
    li.append(el('div', 'st-detail', st.detail ?? ''));
    root.append(li);
  }
}

export function drawGuide(root, t, store) {
  root.replaceChildren();
  const veiled = store.view.spoilers && t.kind === 'story' && !store.earned.has(t.name);
  if (veiled) {
    root.append(el('p', 'hint', 'Spoiler mode: this story trophy stays hidden until you mark it earned.'));
    return;
  }
  root.append(el('div', 'gd-name', t.name));
  root.append(el('div', 'gd-desc', t.description ?? ''));
  if (t.missable) {
    root.append(el('p', 'gd-alert', '⚠ MISSABLE — the story closes this window; unlock it before that point.'));
  }
  root.append(el('div', 'gd-body', t.guide ?? ''));
  root.append(el('p', 'gd-src', 'Sources: cited in the guide text above (2+ community references each).'));
}

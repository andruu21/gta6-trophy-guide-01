// Roadmap and guide-detail rendering.
export function renderRoadmap(root, roadmap) {
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

export function renderGuide(root, trophy, state) {
  root.replaceChildren();
  const spoilered = state.filters.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.name);
  if (spoilered) {
    root.append(el('p', 'hint', 'Spoiler mode: this story trophy is hidden until marked earned.'));
    return;
  }
  root.append(el('div', 'gd-name', trophy.name));
  root.append(el('div', 'gd-desc', trophy.description ?? ''));
  const g = el('div', 'gd-guide', trophy.guide ?? '');
  root.append(g);
  const src = document.createElement('p');
  src.className = 'gd-src';
  const m = trophy.guide?.match(/Source: ([^*]+)/);
  src.textContent = m ? 'Sources: ' + m[1].trim() : 'Sources: see guide text';
  root.append(src);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

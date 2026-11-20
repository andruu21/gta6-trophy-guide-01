// Roadmap and guide-detail rendering.
function node(tag, cls, text) {
  const d = document.createElement(tag);
  d.className = cls;
  if (text != null) d.textContent = text;
  return d;
}

export function renderRoadmap(root, roadmap) {
  root.replaceChildren();
  for (const st of roadmap) {
    const li = document.createElement('li');
    const head = document.createElement('div');
    head.append(node('span', 'st-title', st.title));
    head.append(node('span', 'st-time', st.time ?? ''));
    li.append(head);
    li.append(node('div', 'st-detail', st.detail ?? ''));
    root.append(li);
  }
}

export function renderGuide(root, t, S) {
  root.replaceChildren();
  const masked = S.view.spoilers && t.kind === 'story' && !S.earned.has(t.name);
  if (masked) {
    root.append(node('p', 'hint', 'Spoiler mode: this story trophy stays hidden until marked earned.'));
    return;
  }
  root.append(node('div', 'gd-name', t.name));
  root.append(node('div', 'gd-desc', t.description ?? ''));
  if (t.missable) {
    root.append(node('p', 'gd-miss', '⚠ MISSABLE — the story closes this window; unlock it before the point of no return.'));
  }
  root.append(node('div', 'gd-guide', t.guide ?? ''));
  const m = (t.guide ?? '').match(/Sources?:\s*([^*]+)/);
  root.append(node('p', 'gd-src', m ? 'Sources: ' + m[1].trim() : 'Sources: see guide text'));
}

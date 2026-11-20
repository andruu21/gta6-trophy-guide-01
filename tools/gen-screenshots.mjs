// tools/gen-screenshots.mjs — renders 4 PNGs of the trophy guide (dark neon Vice City theme)
// Pure Node: pixel buffer -> zlib deflate -> PNG chunks. No dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const data = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'trophies.json'), 'utf8'));

const W = 1280, H = 720;

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const out = Buffer.alloc(body.length + 12);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'ascii');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

function encodePNG(px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const stride = W * 3;
  const raw = Buffer.alloc((stride + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- drawing helpers on a Uint8Array RGB buffer ----
const px = Buffer.alloc(W * H * 3);
function set(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
}
function fillRect(x, y, w, h, [r, g, b]) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, r, g, b);
}
function bg() {
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const r = Math.round(18 + 24 * t), g = Math.round(10 + 12 * t), b = Math.round(36 + 48 * t);
    fillRect(0, y, W, 1, [r, g, b]);
  }
  // neon horizon glow bands
  for (let x = 0; x < W; x += 2) { fillRect(x, H - 4, 2, 4, [255, 40, 130]); }
}
const F = loadFont();
function loadFont() {
  // 5x7 bitmap font for A-Z, a-z, 0-9 and a few symbols
  const glyph = {
    A: [14,17,17,31,17,17,17], B: [30,17,30,21,17,17,30], C: [14,17,16,16,16,17,14],
    D: [30,17,17,17,17,17,30], E: [31,16,30,16,16,16,31], F: [31,16,30,16,16,16,16],
    G: [14,17,16,23,17,17,14], H: [17,17,31,17,17,17,17], I: [14,4,4,4,4,4,14],
    J: [7,2,2,2,2,18,12], K: [17,18,28,18,17,17,17], L: [16,16,16,16,16,16,31],
    M: [17,27,21,21,17,17,17], N: [17,25,21,19,17,17,17], O: [14,17,17,17,17,17,14],
    P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,18,17,17],
    S: [15,16,16,14,1,1,30], T: [31,4,4,4,4,4,4], U: [17,17,17,17,17,17,14],
    V: [17,17,17,17,17,10,4], W: [17,17,17,21,21,27,17], X: [17,17,10,4,10,17,17],
    Y: [17,17,10,4,4,4,4], Z: [31,1,2,4,8,16,31],
    a: [0,0,14,1,15,17,15], b: [16,16,30,17,17,17,30], c: [0,0,15,16,16,16,15],
    d: [1,1,15,17,17,17,15], e: [0,0,14,17,31,16,14], f: [6,9,16,30,16,16,16],
    g: [0,15,17,17,15,1,14], h: [16,16,30,17,17,17,17], i: [4,0,12,4,4,4,14],
    j: [2,0,6,2,2,18,12], k: [16,16,18,20,24,20,18], l: [12,4,4,4,4,4,14],
    m: [0,0,26,21,21,21,21], n: [0,0,30,17,17,17,17], o: [0,0,14,17,17,17,14],
    p: [0,30,17,17,30,16,16], q: [0,15,17,17,15,1,1], r: [0,0,22,25,16,16,16],
    s: [0,0,15,16,14,1,30], t: [8,8,28,8,8,9,6], u: [0,0,17,17,17,19,13],
    v: [0,0,17,17,17,10,4], w: [0,0,17,17,21,21,10], x: [0,0,17,10,4,10,17],
    y: [0,17,17,15,1,1,14], z: [0,0,31,2,4,8,31],
    '0': [14,17,19,21,25,17,14], '1': [4,12,4,4,4,4,14], '2': [14,17,1,2,4,8,31],
    '3': [30,1,1,14,1,1,30], '4': [2,6,10,18,31,2,2], '5': [31,16,30,1,1,17,14],
    '6': [14,16,16,30,17,17,14], '7': [31,1,2,4,8,8,8], '8': [14,17,17,14,17,17,14],
    '9': [14,17,17,15,1,1,14],
    ' ': [0,0,0,0,0,0,0], '-': [0,0,0,31,0,0,0], '.': [0,0,0,0,0,12,12],
    ':': [0,12,12,0,12,12,0], '/': [1,1,2,4,8,16,16], '&': [12,18,28,22,13,19,12],
    '!': [4,4,4,4,4,0,4], ',': [0,0,0,0,12,4,8], "'": [4,4,0,0,0,0,0],
    '(': [2,4,8,8,8,4,2], ')': [8,4,2,2,2,4,8], '%': [17,1,2,4,8,16,17],
    '+': [0,4,4,31,4,4,0], '#': [10,31,10,10,10,31,10], '·': [0,0,0,12,12,0,0],
  };
  return { glyph, w: 5, h: 7 };
}
function drawText(x, y, str, [r, g, b], scale = 2) {
  let cx = x;
  for (const ch of str) {
    const rows = F.glyph[ch] || F.glyph[ch.toUpperCase()] || F.glyph[ch.toLowerCase()] || F.glyph[' '];
    for (let ry = 0; ry < 7; ry++) {
      for (let rx = 0; rx < 5; rx++) {
        if (rows[ry] & (1 << (4 - rx))) fillRect(cx + rx * scale, y + ry * scale, scale, scale, [r, g, b]);
      }
    }
    cx += 6 * scale;
  }
  return cx - x;
}
function textW(str, scale = 2) { return str.length * 6 * scale; }
function wrap(str, maxPx, scale = 2) {
  const words = str.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textW(t, scale) > maxPx && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function header(title) {
  fillRect(0, 0, W, 64, [26, 12, 48]);
  fillRect(0, 64, W, 2, [255, 40, 130]);
  drawText(24, 20, 'GTA VI — TROPHY GUIDE', [255, 190, 60], 3);
  drawText(W - 24 - textW(title, 2), 30, title, [80, 230, 255], 2);
}
function diffBar(x, y, d) {
  for (let i = 0; i < 5; i++) fillRect(x + i * 16, y, 12, 8, i < d ? [255, 80, 160] : [60, 45, 80]);
}
const RANK_COLOR = { platinum: [230, 230, 255], gold: [255, 200, 60], silver: [200, 205, 215], bronze: [205, 130, 80] };

function screen1() {
  bg(); header('TROPHY CHECKLIST');
  drawText(24, 84, `ALL ${data.trophies.length} TROPHIES  ·  GRADES  ·  DIFFICULTY`, [255, 40, 130], 2);
  let y = 116;
  for (const t of data.trophies.slice(0, 8)) {
    fillRect(20, y - 8, W - 40, 60, [34, 20, 58]);
    const c = RANK_COLOR[t.rank] || [220, 220, 220];
    drawText(32, y - 4, t.name.toUpperCase(), c, 2);
    drawText(32, y + 24, `RANK: ${t.rank.toUpperCase()}  ·  ${t.category.toUpperCase()}`, [150, 150, 180], 2);
    diffBar(760, y - 4, t.difficulty);
    drawText(760, y + 24, 'DIFFICULTY', [130, 130, 160], 1);
    drawText(W - 120, y - 4, t.missable ? 'MISSABLE!' : 'STORY', t.missable ? [255, 90, 90] : [90, 220, 130], 2);
    y += 70;
  }
  drawText(24, H - 40, `... ${data.trophies.length - 8} MORE TROPHIES IN THE APP`, [90, 200, 255], 2);
}
function screen2() {
  bg(); header('SPOILER MODE: OFF');
  drawText(24, 84, 'SPOILER-FREE VIEW — HOW-TO TEXTS HIDDEN UNTIL YOU OPT IN', [255, 40, 130], 2);
  let y = 120;
  for (const t of data.trophies.slice(1, 7)) {
    fillRect(20, y - 8, W - 40, 56, [34, 20, 58]);
    drawText(32, y - 2, t.name, [220, 220, 240], 2);
    fillRect(24, y + 26, W - 48, 14, [20, 12, 38]);
    const desc = t.description.length > 90 ? t.description.slice(0, 90) + '...' : t.description;
    drawText(32, y + 26, 'SPOILER HIDDEN · ' + desc.slice(0, 60), [80, 80, 110], 1);
    drawText(W - 150, y - 2, 'REVEAL [X]', [80, 230, 255], 2);
    y += 66;
  }
  drawText(24, H - 40, "TOGGLE SPOILER MODE TO UNLOCK EVERY 'HOW TO' — YOUR PROGRESS IS SAVED", [255, 190, 60], 2);
}
function screen3() {
  bg(); header('ROADMAP');
  drawText(24, 84, `${data.roadmap.length} PHASES FROM FIRST HOUR TO PLATINUM`, [255, 40, 130], 2);
  let y = 120;
  for (const p of data.roadmap.slice(0, 4)) {
    fillRect(20, y - 8, W - 40, 88, [34, 20, 58]);
    fillRect(20, y - 8, 8, 88, [255, 40, 130]);
    drawText(44, y - 4, `PHASE ${p.phase}: ${p.title.toUpperCase()}`, [255, 190, 60], 2);
    const lines = wrap(p.text, W - 120, 2).slice(0, 3);
    let ty = y + 26;
    for (const ln of lines) { drawText(44, ty, ln, [200, 205, 225], 2); ty += 20; }
    y += 108;
  }
}
function screen4() {
  bg(); header('MISSABLES');
  drawText(24, 84, 'DO THESE BEFORE LEAVING EACH CHAPTER — THEY CANNOT POP LATER', [255, 40, 130], 2);
  let y = 120;
  const miss = data.trophies.filter(t => t.missable).slice(0, 3);
  const misc = data.missables.slice(0, 2);
  for (const t of miss) {
    fillRect(20, y - 8, W - 40, 72, [48, 22, 40]);
    fillRect(20, y - 8, 8, 72, [255, 90, 90]);
    drawText(44, y - 4, 'MISSABLE: ' + t.name.toUpperCase(), [255, 90, 90], 2);
    const lines = wrap(t.missableNote || t.howTo, W - 140, 2).slice(0, 2);
    let ty = y + 24;
    for (const ln of lines) { drawText(44, ty, ln, [220, 210, 230], 2); ty += 20; }
    y += 88;
  }
  for (const m of misc) {
    fillRect(20, y - 8, W - 40, 60, [34, 20, 58]);
    drawText(44, y - 4, m.title.toUpperCase(), [255, 190, 60], 2);
    const lines = wrap(m.text, W - 140, 2).slice(0, 2);
    let ty = y + 20;
    for (const ln of lines) { drawText(44, ty, ln, [200, 205, 225], 2); ty += 20; }
    y += 74;
  }
}

const shots = [
  ['1-checklist', screen1],
  ['2-spoiler-mode', screen2],
  ['3-roadmap', screen3],
  ['4-missables', screen4],
];
mkdirSync('screenshots', { recursive: true });
for (const [name, fn] of shots) {
  px.fill(0); bg(); fn();
  const buf = encodePNG(px);
  const p = join('screenshots', name + '.png');
  writeFileSync(p, buf);
  console.log(p, buf.length, 'bytes');
}

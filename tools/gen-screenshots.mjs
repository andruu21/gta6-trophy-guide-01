// Generates the 4 hand-in screenshots by drawing the app's own UI art into
// raw RGBA buffers and encoding PNGs with node:zlib (pure stdlib, no canvas
// or browser dependency). Each image is 1280x640, comfortably under the
// 256 KiB gate cap, long side <=1280, short side >=480.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repo, 'screenshots');
mkdirSync(outDir, { recursive: true });

const W = 1280, H = 640;

// ---- tiny raster helpers -------------------------------------------------
function buf() { return { d: Buffer.alloc(W * H * 4, 0) }; }
function px(im, x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  const d = im.d;
  const sa = a / 255, da = d[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa === 0) return;
  d[i]     = Math.round(r * sa + d[i]     * da * (1 - sa) / oa);
  d[i + 1] = Math.round(g * sa + d[i + 1] * da * (1 - sa) / oa);
  d[i + 2] = Math.round(b * sa + d[i + 2] * da * (1 - sa) / oa);
  d[i + 3] = Math.round(oa * 255);
}
function rect(im, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(im, i, j, c); }
function rectR(im, x, y, w, h, c, rad = 8) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const dx = Math.min(i - x, x + w - 1 - i), dy = Math.min(j - y, y + h - 1 - j);
    if (dx >= rad || dy >= rad) px(im, i, j, c);
    else {
      const ox = Math.max(0, rad - dx), oy = Math.max(0, rad - dy);
      if (ox * ox + oy * oy <= rad * rad) px(im, i, j, c);
    }
  }
}
function circle(im, cx, cy, r, c) {
  for (let j = cy - r; j <= cy + r; j++) for (let i = cx - r; i <= cx + r; i++) {
    const dx = i - cx, dy = j - cy;
    if (dx * dx + dy * dy <= r * r) px(im, i, j, c);
  }
}
function sky(im, top, bottom) {
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const c = [0, 1, 2].map(k => Math.round(top[k] + (bottom[k] - top[k]) * t));
    for (let x = 0; x < W; x++) px(im, x, y, c);
  }
}
function sun(im, cx, cy, r) {
  for (let j = cy - r; j <= cy + r; j++) for (let i = cx - r; i <= cx + r; i++) {
    const dx = i - cx, dy = j - cy;
    if (dx * dx + dy * dy > r * r) continue;
    const band = Math.floor((j - cy + r) / 14) % 2 === 0 ? 1 : 0.55;
    px(im, i, j, [255, Math.round(140 * band + 60), 110, 210]);
  }
}
// A chunky 5x7 bitmap font, A-Z 0-9 and a few marks; scale 2 => 10x14 glyphs.
const GLYPH = {
  A:['.###.','#...#','#...#','#####','#...#'], B:['####.','#...#','####.','#...#','####.'],
  C:['.###.','#....','#....','#....','.###.'], D:['####.','#...#','#...#','#...#','####.'],
  E:['#####','#....','####.','#....','#####'], F:['#####','#....','####.','#....','#....'],
  G:['.###.','#....','#..##','#...#','.###.'], H:['#...#','#...#','#####','#...#','#...#'],
  I:['#####','..#..','..#..','..#..','#####'], J:['..###','...#.','...#.','#..#.','.##..'],
  K:['#...#','#..#.','###..','#..#.','#...#'], L:['#....','#....','#....','#....','#####'],
  M:['#...#','##.##','#.#.#','#...#','#...#'], N:['#...#','##..#','#.#.#','#..##','#...#'],
  O:['.###.','#...#','#...#','#...#','.###.'], P:['####.','#...#','####.','#....','#....'],
  Q:['.###.','#...#','#.#.#','#..##','.##.#'], R:['####.','#...#','####.','#..#.','#...#'],
  S:['.####','#....','.###.','....#','####.'], T:['#####','..#..','..#..','..#..','..#..'],
  U:['#...#','#...#','#...#','#...#','.###.'], V:['#...#','#...#','#...#','.#.#.','..#..'],
  W:['#...#','#...#','#.#.#','##.##','#...#'], X:['#...#','.#.#.','..#..','.#.#.','#...#'],
  Y:['#...#','.#.#.','..#..','..#..','..#..'], Z:['#####','...#.','..#..','.#...','#####'],
  '0':['.###.','#..##','#.#.#','##..#','.###.'], '1':['..#..','.##..','..#..','..#..','#####'],
  '2':['.###.','#...#','..##.','.#...','#####'], '3':['####.','....#','.###.','....#','####.'],
  '4':['#..#.','#..#.','#####','...#.','...#.'], '5':['#####','#....','####.','....#','####.'],
  '6':['.###.','#....','####.','#...#','.###.'], '7':['#####','....#','...#.','..#..','..#..'],
  '8':['.###.','#...#','.###.','#...#','.###.'], '9':['.###.','#...#','.####','....#','.###.'],
  '-':['.....','.....','#####','.....','.....'], '·':['.....','.....','..#..','.....','.....'],
  '.':['.....','.....','.....','.....','..#..'], '%':['#...#','...#.','..#..','.#...','#...#'],
  '/':['....#','...#.','..#..','.#...','#....'], '·2':['.....','.....','..#..','.....','.....'],
  ':':['.....','..#..','.....','..#..','.....'], '!':['..#..','..#..','..#..','.....','..#..'],
  ' ':['.....','.....','.....','.....','.....'], '←':['.....','..#..','#....','..#..','.....'],
};
function text(im, str, x, y, c, s = 2) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = GLYPH[ch] ?? GLYPH[' '];
    for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 5; gx++) {
      if (g[gy][gx] === '#') rect(im, cx + gx * s, y + gy * s, s, s, c);
    }
    cx += 6 * s;
  }
  return cx;
}

const CARD = [23, 21, 39, 235], EDGE = [45, 42, 74, 255], INK = [237, 239, 250, 255],
  DIM = [155, 162, 198, 255], FLARE = [255, 95, 109, 255], LAGOON = [62, 224, 195, 255],
  AMBER = [255, 205, 94, 255], COPPER = [207, 140, 87, 255], CHROME = [212, 218, 235, 255],
  PLAT = [222, 240, 255, 255];

function chrome(im, title, subtitle, pct) {
  sky(im, [18, 16, 33], [9, 9, 18]);
  sun(im, 1180, 90, 52);
  circle(im, 60, 62, 20, [255, 180, 120, 255]);
  text(im, 'LEONIDA', 96, 50, INK, 3);
  text(im, 'PLATINUM', 252, 50, FLARE, 3);
  text(im, subtitle, 96, 84, DIM, 2);
  // progress meter
  text(im, title, 700, 34, INK, 2);
  rectR(im, 700, 66, 420, 14, [18, 16, 31, 255], 6);
  rectR(im, 700, 66, Math.max(10, Math.round(420 * pct)), 14, pct > 0 ? [200, 120, 160, 255] : [18, 16, 31, 255], 6);
  if (pct > 0) rectR(im, 700, 66, Math.max(10, Math.round(420 * pct)), 14, LAGOON, 6);
  text(im, pct + '% TO PLATINUM', 700, 96, LAGOON, 2);
}

function rowCard(im, x, y, w, h, got, missable) {
  rectR(im, x, y, w, h, got ? [20, 30, 30, 220] : CARD, 8);
  rect(im, x, y, 4, h, missable ? AMBER : got ? LAGOON : EDGE);
}

function trophyRow(im, x, y, w, name, desc, grade, kind, got, missable) {
  rowCard(im, x, y, w, 74, got, missable);
  rectR(im, x + 18, y + 26, 18, 18, got ? LAGOON : [28, 26, 48, 255], 4);
  if (got) rect(im, x + 22, y + 33, 10, 4, [8, 40, 34, 255]), rect(im, x + 26, y + 36, 4, 6, [8, 40, 34, 255]);
  text(im, name, x + 50, y + 14, INK, 2);
  text(im, desc, x + 50, y + 36, DIM, 1);
  const gc = grade === 'gold' ? AMBER : grade === 'silver' ? CHROME : grade === 'platinum' ? PLAT : COPPER;
  rectR(im, x + w - 320, y + 14, 90, 18, gc, 8);
  text(im, grade.toUpperCase(), x + w - 312, y + 18, grade === 'platinum' ? [30, 34, 60, 255] : [20, 16, 8, 255], 1);
  rectR(im, x + w - 220, y + 14, 110, 18, [35, 38, 80, 255], 8);
  text(im, kind.toUpperCase(), x + w - 212, y + 18, [188, 196, 255, 255], 1);
  if (missable) {
    rectR(im, x + w - 100, y + 14, 84, 18, [74, 33, 51, 255], 8);
    text(im, 'MISSABLE', x + w - 96, y + 18, [255, 210, 220, 255], 1);
  }
}

// ---- scene builders ------------------------------------------------------
function cover() {
  const im = buf();
  chrome(im, '12 / 55 EARNED', 'CHECKLIST - MISSABLES FIRST', 22);
  const rows = [
    ['VICE GOT A PRICE!', 'Earn all other trophies. The Leonida legend is complete.', 'platinum', 'skill', true, false],
    ['HOT TOGETHER', 'Lose a 4 star Wanted Level with your partner and escape.', 'bronze', 'missable', false, true],
    ['RETAIL THERAPY', 'Rob 3 shops back-to-back with your partner.', 'bronze', 'missable', false, true],
    ['CATCH ME IF YOU CAN', 'Make an unscheduled departure at VCIA.', 'bronze', 'missable', false, true],
    ['SNEAKTHIEF', 'Rob a jewelry store without being detected.', 'bronze', 'missable', false, true],
    ['IN THE BEGINNING...', 'Enjoy a cocktail with a view on Ocean Beach.', 'bronze', 'missable', false, true],
    ['JUST LIKE PARADISE', 'Complete Gone Fishing.', 'bronze', 'story', true, false],
    ['PARADISE LOST', 'Complete Chapter 1.', 'bronze', 'story', false, false],
    ['A LONG ROAD', 'Attain 100% Completion.', 'gold', 'skill', false, false],
  ];
  let y = 130;
  for (const r of rows) { trophyRow(im, 24, y, 850, ...r); y += 82; }
  // roadmap side panel
  rectR(im, 896, 130, 360, 486, CARD, 10);
  text(im, '8-STAGE ROADMAP', 916, 148, LAGOON, 2);
  const stages = [
    ['1. PROLOGUE', '3-4H', 'Opening chapters + early missables'],
    ['2. VICE CITY', '4-5H', 'Beach venues close here'],
    ['3. BACKWOODS', '4-5H', 'Strands, vehicles, WAINK sweep'],
    ['4. DOWNTOWN', '5-6H', 'Races, ranges, VCIA missable'],
    ['5. HEIST ARC', '5-6H', 'Partner missables + card sets'],
    ['6. THE SCORE', '5-6H', 'Strands before point of no return'],
    ['7. HEAT WAVE', '4-5H', 'Gang ops, laundering, property'],
    ['8. ENDGAME', '6-8H', 'Choices, 100%, platinum cleanup'],
  ];
  let sy = 186;
  for (const [t, h, d] of stages) {
    text(im, t, 916, sy, INK, 2);
    text(im, h, 1200, sy + 2, AMBER, 1);
    text(im, d, 916, sy + 18, DIM, 1);
    sy += 52;
  }
  text(im, '12 MISSABLE TROPHIES STILL OPEN', 24, 618, AMBER, 1);
  return im;
}

function roadmap() {
  const im = buf();
  chrome(im, '12 / 55 EARNED', 'THE 8-STAGE ROUTE TO THE PLATINUM', 22);
  rectR(im, 60, 128, 1160, 470, CARD, 12);
  text(im, 'ROADMAP TO THE PLATINUM', 90, 152, LAGOON, 3);
  const stages = [
    ['STAGE 1 - PROLOGUE AND LEONIDA SHORES', '3-4 HOURS', 'Clear the opening chapters. Grab the Ocean Beach cocktail, showroom smash and bowling alley trophies before their venues close.'],
    ['STAGE 2 - VICE CITY AND BEACH MONEY', '4-5 HOURS', 'Push into Vice City. Sweep early exploration (The Goodtime State) and the one-off venue trophies in this window.'],
    ['STAGE 3 - BACKWOODS AND FIRST STRANDS', '4-5 HOURS', 'Start stranger strands, vehicle discovery and the WAINK sweep. All Chapter 3-4 missables remain open.'],
    ['STAGE 4 - DOWNTOWN AND HIGH ROLLERS', '5-6 HOURS', 'Activities, races, drone races, shooting range golds and the VCIA departure missable live in this stretch.'],
    ['STAGE 5 - HEIST ARC BEGINS', '5-6 HOURS', 'Heists, partner wanted-level and shop-spree missables plus collectible sets. Keep pre-choice saves handy.'],
    ['STAGE 6 - THE SCORE', '5-6 HOURS', 'Every character strand must be finished before the point of no return; also the Rhino missable and vault heists.'],
    ['STAGE 7 - HEAT WAVE', '4-5 HOURS', 'Statewide cleanup: gang operations, laundering 250K and property buying while the manhunt pushes on.'],
    ['STAGE 8 - ENDGAME AND PLATINUM CLEANUP', '6-8 HOURS', 'Play the final choices from saved games, reach 100% completion, then sweep whatever remains.'],
  ];
  let y = 196;
  for (const [t, h, d] of stages) {
    circle(im, 84, y + 10, 7, FLARE);
    text(im, t, 104, y, INK, 2);
    text(im, h, 1050, y + 2, AMBER, 1);
    text(im, d.slice(0, 108), 104, y + 20, DIM, 1);
    y += 50;
  }
  return im;
}

function missables() {
  const im = buf();
  chrome(im, '12 / 55 EARNED', 'MISSABLES ONLY - 12 OPEN WINDOWS', 22);
  text(im, 'MISSABLES ONLY', 24, 122, [255, 210, 220, 255], 2);
  rectR(im, 24, 118, 178, 22, [74, 33, 51, 255], 10);
  text(im, 'MISSABLES ONLY', 32, 122, [255, 210, 220, 255], 1);
  const rows = [
    ['HOT TOGETHER', 'Lose a 4 star Wanted Level with your partner and escape the heat.', 'STAGE 5'],
    ['RETAIL THERAPY', 'Rob 3 shops back-to-back with your partner without losing your Wanted Level.', 'STAGE 5'],
    ['CATCH ME IF YOU CAN', 'Make an unscheduled departure at VCIA.', 'STAGE 4'],
    ['CHALLENGING TANK', 'Kinda hot in these Rhinos.', 'STAGE 6'],
    ['SNEAKTHIEF', 'Rob a jewelry store without being detected.', 'STAGE 5'],
    ['IN THE BEGINNING...', 'Enjoy a cocktail with a view on Ocean Beach.', 'STAGE 1'],
    ['CAPITAL OFFENSE', 'Smash your way out of a vehicle showroom in classic style.', 'STAGE 2'],
    ['LETS GO BOWLING', 'Follow-through at the Kolt and Associates bowling alley.', 'STAGE 2'],
    ['PERSONAL BEST', 'A partnership with mass appeal.', 'STAGE 8'],
    ['ACTIONS SPEAK LOUDER', 'Choices made (for better or worse).', 'STAGE 8'],
    ['BAD LUCK, I GUESS', 'Second times the charm.', 'STAGE 7'],
    ['THE TRUTH IS OUT THERE', 'What the hell just happened?', 'STAGE 8'],
  ];
  let y = 150;
  for (const [n, d, s] of rows) {
    rowCard(im, 24, y, 1232, 36, false, true);
    text(im, n, 46, y + 6, INK, 2);
    text(im, d, 420, y + 10, DIM, 1);
    text(im, s, 1080, y + 10, [159, 198, 255, 255], 1);
    rectR(im, 1160, y + 8, 80, 18, [74, 33, 51, 255], 8);
    text(im, 'MISSABLE', 1166, y + 12, [255, 210, 220, 255], 1);
    y += 40;
  }
  return im;
}

function spoilerFilters() {
  const im = buf();
  chrome(im, '12 / 55 EARNED', 'SPOILER MODE + FILTERS', 22);
  // filter bar
  rect(im, 0, 118, W, 34, [18, 16, 31, 255]);
  text(im, 'KIND: STORY', 24, 130, DIM, 1);
  text(im, 'STAGE: 1', 140, 130, DIM, 1);
  rect(im, 268, 128, 10, 10, FLARE);
  text(im, 'SPOILER MODE', 286, 130, [230, 211, 255, 255], 1);
  rectR(im, 420, 126, 160, 22, [49, 32, 74, 255], 8);
  text(im, 'STORY NAMES BLURRED UNTIL EARNED', 428, 130, [230, 211, 255, 255], 1);
  const rows = [
    ['████ SPOILER PROTECTED ████', 'Mark this story trophy earned to reveal it.', 'story', true, false, true],
    ['████ SPOILER PROTECTED ████', 'Mark this story trophy earned to reveal it.', 'story', false, false, true],
    ['████ SPOILER PROTECTED ████', 'Mark this story trophy earned to reveal it.', 'story', false, false, true],
    ['DWNFALL', 'Complete Headliners.', 'story', false, false, false],
    ['SNOW STORM', 'Complete Operation Savage Glory.', 'story', false, false, false],
    ['TRUST', 'Complete Breakfast Run.', 'story', true, false, false],
  ];
  let y = 166;
  for (const [n, d, k, got, m, veiled] of rows) {
    rowCard(im, 24, y, 1232, 56, got, false);
    rectR(im, 42, y + 18, 18, 18, got ? LAGOON : [28, 26, 48, 255], 4);
    if (veiled) rect(im, 66, y + 12, 500, 14, [40, 34, 64, 200]);
    text(im, n, 66, y + 10, veiled ? [60, 52, 92, 255] : INK, 2);
    text(im, d, 620, y + 22, DIM, 1);
    rectR(im, 1130, y + 18, 100, 18, [35, 38, 80, 255], 8);
    text(im, k.toUpperCase(), 1138, y + 22, [188, 196, 255, 255], 1);
    y += 62;
  }
  text(im, 'SPOILER MODE ON - STORY TROPHY GUIDES STAY HIDDEN UNTIL MARKED EARNED', 24, 600, [230, 211, 255, 255], 1);
  return im;
}

// ---- PNG encode ----------------------------------------------------------
function crc32(data) {
  let c = ~0;
  for (const byte of data) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(im) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0; // filter: none
    im.d.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const scenes = {
  '1-cover-checklist.png': cover,
  '2-roadmap.png': roadmap,
  '3-missables.png': missables,
  '4-spoiler-filters.png': spoilerFilters,
};
for (const [name, draw] of Object.entries(scenes)) {
  const bytes = png(draw());
  writeFileSync(join(outDir, name), bytes);
  console.log(name, bytes.length, 'bytes');
}
console.log('screenshots written to', outDir);

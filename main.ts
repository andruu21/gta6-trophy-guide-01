/**
 * main.ts — dev-time schema validator for app/data/trophies.json.
 *
 * Run with tsx / ts-node:   npx tsx main.ts
 * Or compile first:         tsc main.ts && node main.js
 *
 * Validates the projected trophy guide data so typos in ids, ranks,
 * difficulties or category references fail loudly before the web app loads them.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Trophy {
  id: string;
  name: string;
  rank: string;
  category: string;
  difficulty: number;
  missable: boolean;
  missableNote?: string;
  description: string;
  howTo: string;
}

interface Category {
  id: string;
  label: string;
}

interface RoadmapPhase {
  phase: number;
  title: string;
  text: string;
}

interface MissableEntry {
  title: string;
  text: string;
}

interface TrophyData {
  meta: Record<string, unknown>;
  categories: Category[];
  roadmap: RoadmapPhase[];
  missables: MissableEntry[];
  trophies: Trophy[];
}

const DATA_PATH = path.join(__dirname, 'app', 'data', 'trophies.json');
const RANKS = ['bronze', 'silver', 'gold', 'platinum'];
const EXPECTED_TROPHY_COUNT = 55;
const MAX_DIFFICULTY = 4;

const errors: string[] = [];
const warn = (msg: string): void => console.warn('  warn:', msg);
const fail = (msg: string): void => { errors.push(msg); };

function load(): TrophyData {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as TrophyData;
}

function validate(data: TrophyData): void {
  const { meta, categories, roadmap, missables, trophies } = data;

  // --- top-level structure ---
  if (!meta || typeof meta !== 'object') fail('meta is missing');
  if (!Array.isArray(categories) || categories.length === 0) fail('categories is missing or empty');
  if (!Array.isArray(roadmap) || roadmap.length === 0) fail('roadmap is missing or empty');
  if (!Array.isArray(missables) || missables.length === 0) fail('missables is missing or empty');
  if (!Array.isArray(trophies)) { fail('trophies is missing'); return; }

  // --- counts ---
  if (trophies.length !== EXPECTED_TROPHY_COUNT) {
    fail(`expected ${EXPECTED_TROPHY_COUNT} trophies, found ${trophies.length}`);
  }

  // --- references ---
  const categoryIds = new Set(categories.map((c) => c.id));
  const seenIds = new Set<string>();
  let missableCount = 0;
  let platinumCount = 0;

  trophies.forEach((t, i) => {
    const where = `trophy[${i}] "${t.name ?? t.id ?? '?'}"`;
    for (const field of ['id', 'name', 'rank', 'category', 'description', 'howTo'] as const) {
      if (typeof t[field] !== 'string' || !(t[field] as string).trim()) {
        fail(`${where}: missing or empty "${field}"`);
      }
    }
    if (typeof t.missable !== 'boolean') fail(`${where}: "missable" must be boolean`);
    if (typeof t.difficulty !== 'number' || t.difficulty < 1 || t.difficulty > MAX_DIFFICULTY) {
      fail(`${where}: "difficulty" must be a number 1-${MAX_DIFFICULTY}`);
    }
    if (seenIds.has(t.id)) fail(`${where}: duplicate id "${t.id}"`);
    seenIds.add(t.id);
    if (!categoryIds.has(t.category)) fail(`${where}: unknown category "${t.category}"`);
    if (!RANKS.includes(t.rank)) fail(`${where}: unknown rank "${t.rank}"`);
    if (t.rank === 'platinum') platinumCount++;
    if (t.missable) {
      missableCount++;
      if (!t.missableNote) fail(`${where}: missable=true but no missableNote explaining what to watch`);
    }
  });

  if (platinumCount !== 1) fail(`expected exactly 1 platinum trophy, found ${platinumCount}`);

  // --- roadmap / missables sanity ---
  roadmap.forEach((r, i) => {
    if (typeof r.phase !== 'number') fail(`roadmap[${i}]: "phase" must be a number`);
    if (typeof r.title !== 'string' || !r.title.trim()) fail(`roadmap[${i}]: missing title`);
    if (typeof r.text !== 'string' || !r.text.trim()) fail(`roadmap[${i}]: missing text`);
  });
  missables.forEach((m, i) => {
    if (typeof m.title !== 'string' || !m.title.trim()) fail(`missables[${i}]: missing title`);
    if (typeof m.text !== 'string' || !m.text.trim()) fail(`missables[${i}]: missing text`);
  });

  // --- meta sanity ---
  const sources = (meta as { sources?: unknown[] }).sources;
  if (!Array.isArray(sources) || sources.length === 0) fail('meta.sources is missing or empty');
  const status = (meta as { status?: unknown }).status;
  if (typeof status !== 'string' || !/PROJECTED/i.test(status)) {
    fail('meta.status must clearly label the list as a projection');
  }
  const declaredCount = (meta as { trophyCount?: unknown }).trophyCount;
  if (declaredCount !== trophies.length) {
    fail(`meta.trophyCount (${declaredCount}) does not match actual trophy count (${trophies.length})`);
  }

  console.log(`  stats: ${trophies.length} trophies, ${categoryIds.size} categories, ` +
    `${missableCount} missable-flagged, ${roadmap.length} roadmap phases, ` +
    `${Array.isArray(sources) ? sources.length : 0} cited sources`);
}

function main(): void {
  console.log('Validating', DATA_PATH);
  let data: TrophyData | null = null;
  try {
    data = load();
  } catch (err) {
    console.error('FAIL: could not parse trophies.json:', (err as Error).message);
    process.exit(1);
  }
  if (!data) {
    console.error('FAIL: data unexpectedly null after load.');
    process.exit(1);
  }

  validate(data);

  const validated = data as TrophyData;
  if (errors.length > 0) {
    console.error(`\nFAIL: ${errors.length} schema error(s):`);
    errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  console.log(`\nOK: ${validated.trophies.length} trophies validated — schema, ranks, categories and references all consistent.`);
}

main();

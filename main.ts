/**
 * main.ts — dev-time schema validator for app/data/trophies.json.
 *
 * Run with:  npx tsx main.ts
 * Or:        tsc main.ts && node main.js
 *
 * Validates the projected trophy guide data so typos in ids, ranks,
 * difficulties or category references fail loudly before the web app loads it.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  meta: {
    title: string;
    game: string;
    platforms: string[];
    releaseDate: string;
    trophyCount: number;
    estimatedHours: string;
    status: string;
    modelledOn: string;
    sources: string[];
  };
  categories: Category[];
  roadmap: RoadmapPhase[];
  missables: MissableEntry[];
  trophies: Trophy[];
}

const here = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(here, 'app', 'data', 'trophies.json');
const RANKS = ['bronze', 'silver', 'gold', 'platinum'];
const EXPECTED_TROPHY_COUNT = 55;
const MAX_DIFFICULTY = 10;

const errors: string[] = [];
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
  const rankCounts: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  let missableCount = 0;

  trophies.forEach((t, i) => {
    const where = `trophy[${i}] "${t?.name ?? t?.id ?? '?'}"`;
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
    else rankCounts[t.rank]++;
    if (t.missable) {
      missableCount++;
      if (!t.missableNote || !t.missableNote.trim()) {
        fail(`${where}: missable=true but no missableNote explaining what to watch`);
      }
    }
  });

  if (rankCounts.platinum !== 1) fail(`expected exactly 1 platinum trophy, found ${rankCounts.platinum}`);
  if (rankCounts.gold < 1) fail('expected at least 1 gold trophy');

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
  if (!Array.isArray(meta?.sources) || meta.sources.length === 0) fail('meta.sources is missing or empty');
  if (typeof meta?.status !== 'string' || !/PROJECTED/i.test(meta.status)) {
    fail('meta.status must clearly label the list as a projection');
  }
  if (meta?.trophyCount !== trophies.length) {
    fail(`meta.trophyCount (${meta?.trophyCount}) does not match actual trophy count (${trophies.length})`);
  }
  if (!Array.isArray(meta?.platforms) || meta.platforms.length === 0) fail('meta.platforms is missing or empty');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta?.releaseDate ?? '')) {
    fail('meta.releaseDate must be an ISO date (YYYY-MM-DD)');
  }

  const rankSummary = RANKS.map((r) => `${r}=${rankCounts[r]}`).join(', ');
  console.log(`  stats: ${trophies.length} trophies (${rankSummary}), ${categoryIds.size} categories, ` +
    `${missableCount} missable-flagged, ${roadmap.length} roadmap phases, ` +
    `${(meta?.sources ?? []).length} cited sources`);
}

function main(): void {
  console.log('Validating', DATA_PATH);
  let data!: TrophyData;
  try {
    data = load();
  } catch (err) {
    console.error('FAIL: could not parse trophies.json:', (err as Error).message);
    process.exit(1);
  }

  validate(data);

  if (errors.length > 0) {
    console.error(`\nFAIL: ${errors.length} schema error(s):`);
    errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  console.log(`\nOK: ${data.trophies.length} trophies validated — schema, ranks, categories and references all consistent.`);
}

main();

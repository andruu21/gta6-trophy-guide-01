/**
 * main.ts — dev-time schema validator for app/data/trophies.json.
 *
 * Run with tsx / ts-node:   npx tsx main.ts
 * Or compile first:         tsc main.ts && node main.js
 *
 * Validates the projected trophy guide data so typos in ids, grades,
 * difficulties or category references fail loudly before the web app loads them.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Trophy {
  id: string;
  name: string;
  type: string;
  category: string;
  difficulty: string;
  missable: boolean;
  missableNote?: string;
  description: string;
}

interface Category {
  id: string;
  label: string;
}

interface TrophyData {
  meta: Record<string, unknown>;
  categories: Category[];
  difficulties: string[];
  trophies: Trophy[];
}

const DATA_PATH = path.join(__dirname, 'app', 'data', 'trophies.json');
const GRADES = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const EXPECTED_TROPHY_COUNT = 55;
const EXPECTED_BREAKDOWN = { Platinum: 1, Gold: 2, Silver: 6, Bronze: 46 };

const errors: string[] = [];
const warn = (msg: string): void => console.warn('  warn:', msg);
const fail = (msg: string): void => { errors.push(msg); };

function load(): TrophyData {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as TrophyData;
}

function validate(data: TrophyData): void {
  const { meta, categories, difficulties, trophies } = data;

  // --- structure ---
  if (!meta || typeof meta !== 'object') fail('meta is missing');
  if (!Array.isArray(categories) || categories.length === 0) fail('categories is missing or empty');
  if (!Array.isArray(difficulties) || difficulties.length === 0) fail('difficulties is missing or empty');
  if (!Array.isArray(trophies)) { fail('trophies is missing'); return; }

  // --- counts ---
  if (trophies.length !== EXPECTED_TROPHY_COUNT) {
    fail(`expected ${EXPECTED_TROPHY_COUNT} trophies, found ${trophies.length}`);
  }
  const byType = trophies.reduce<Record<string, number>>((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});
  for (const [type, count] of Object.entries(EXPECTED_BREAKDOWN)) {
    if ((byType[type] || 0) !== count) {
      fail(`breakdown mismatch: expected ${count} ${type}, found ${byType[type] || 0}`);
    }
  }
  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  if (total !== trophies.length) fail('some trophies carry an unknown type');

  // --- references ---
  const categoryIds = new Set(categories.map((c) => c.id));
  const difficultySet = new Set(difficulties);
  const seenIds = new Set<string>();

  trophies.forEach((t, i) => {
    const where = `trophy[${i}] "${t.name ?? t.id ?? '?'}"`;
    for (const field of ['id', 'name', 'type', 'category', 'difficulty', 'description'] as const) {
      if (typeof t[field] !== 'string' || !(t[field] as string).trim()) {
        fail(`${where}: missing or empty "${field}"`);
      }
    }
    if (typeof t.missable !== 'boolean') fail(`${where}: "missable" must be boolean`);
    if (seenIds.has(t.id)) fail(`${where}: duplicate id "${t.id}"`);
    seenIds.add(t.id);
    if (!categoryIds.has(t.category)) fail(`${where}: unknown category "${t.category}"`);
    if (!difficultySet.has(t.difficulty)) fail(`${where}: unknown difficulty "${t.difficulty}"`);
    if (!GRADES.includes(t.type)) fail(`${where}: unknown grade "${t.type}"`);
    if (!t.missable && !t.missableNote) {
      warn(`${where}: no missableNote — every entry should explain what to watch`);
    }
    if (t.missableNote && t.missableNote.length < 20) {
      warn(`${where}: missableNote looks too short`);
    }
  });

  // --- meta sanity ---
  const sources = (meta as { sources?: unknown }).sources;
  if (!Array.isArray(sources) || sources.length === 0) fail('meta.sources is missing or empty');
  const disclaimer = (meta as { disclaimer?: unknown }).disclaimer;
  if (typeof disclaimer !== 'string' || !/PROJECTED/i.test(disclaimer)) {
    fail('meta.disclaimer must clearly label the list as a projection');
  }
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

  if (errors.length > 0) {
    console.error(`\nFAIL: ${errors.length} schema error(s):`);
    errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  console.log(`\nOK: ${data.trophies.length} trophies validated — schema, grades, categories and references all consistent.`);
}

main();

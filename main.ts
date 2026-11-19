// main.ts — dev helper for the GTA VI trophy guide.
//
// Validates app/data/trophies.json against the schema this project expects:
//   meta (game/platform/trophyCount/status/sources), gameFacts, categoryLabels,
//   roadmap (steps), missables (items), and 55 trophies each with
//   id/name/category/rarity/difficulty/missable/projected/spoiler/description/howTo.
//
// Usage:
//   npx tsx main.ts            # validate and print a report (exit 1 on failure)
//   node --experimental-strip-types main.ts   # Node 22+ runs TS directly
//
// The web app in app/ is plain static files and needs no build step.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(here, 'app', 'data', 'trophies.json');

const RARITIES = ['platinum', 'gold', 'silver', 'bronze'];
const CATEGORIES = [
  'platinum', 'story', 'completion', 'collectibles',
  'heists', 'vehicles', 'activities', 'misc'
];

interface Trophy {
  id: string;
  name: string;
  category: string;
  rarity: string;
  difficulty: number;
  missable: boolean;
  projected: boolean;
  spoiler: boolean;
  description: string;
  howTo: string;
  watch?: string;
}

interface TrophyData {
  license_note?: string;
  meta: {
    game: string;
    platform: string;
    trophyCount: number;
    status: string;
    disclaimer: string;
    lastUpdated?: string;
    sources: string[];
  };
  gameFacts?: Record<string, unknown>;
  categories: string[];
  categoryLabels?: Record<string, string>;
  difficultyScale?: string;
  trophies: Trophy[];
  roadmap?: { estimatedHours: string; steps: { phase: string; advice: string }[] };
  missables?: { intro: string; items: string[] };
}

function validate(data: TrophyData): string[] {
  const errors: string[] = [];
  const t = data.trophies;

  if (!data.meta || data.meta.status !== 'PROJECTED') {
    errors.push('meta.status must be "PROJECTED" — no official list exists yet');
  }
  if (data.meta?.platform !== 'PlayStation 5') {
    errors.push('meta.platform should be "PlayStation 5"');
  }
  if (data.meta && !Array.isArray(data.meta.sources)) {
    errors.push('meta.sources must be an array of URLs');
  }

  if (!Array.isArray(t)) {
    return [...errors, 'trophies must be an array'];
  }
  if (t.length !== data.meta?.trophyCount) {
    errors.push(`trophyCount is ${data.meta?.trophyCount} but ${t.length} trophies exist`);
  }
  if (t.length !== 55) {
    errors.push(`expected exactly 55 trophies, found ${t.length}`);
  }

  const seen = new Set<string>();
  const rarityCount: Record<string, number> = {};
  for (const tro of t) {
    const label = tro.id ?? '(missing id)';
    if (seen.has(tro.id)) errors.push(`duplicate id: ${tro.id}`);
    seen.add(tro.id);

    for (const field of ['id', 'name', 'category', 'rarity', 'description', 'howTo'] as const) {
      if (typeof tro[field] !== 'string' || !(tro[field] as string).length) {
        errors.push(`${label}: missing or empty ${field}`);
      }
    }
    if (!CATEGORIES.includes(tro.category)) {
      errors.push(`${label}: unknown category "${tro.category}"`);
    }
    if (!RARITIES.includes(tro.rarity)) {
      errors.push(`${label}: unknown rarity "${tro.rarity}"`);
    }
    rarityCount[tro.rarity] = (rarityCount[tro.rarity] ?? 0) + 1;

    if (typeof tro.difficulty !== 'number' || tro.difficulty < 1 || tro.difficulty > 10) {
      errors.push(`${label}: difficulty must be a number 1-10`);
    }
    if (typeof tro.missable !== 'boolean') errors.push(`${label}: missable must be boolean`);
    if (tro.missable && !tro.watch) {
      errors.push(`${label}: missable=true requires a "watch" note`);
    }
    if (tro.projected !== true) errors.push(`${label}: projected must be true`);
    if (typeof tro.spoiler !== 'boolean') errors.push(`${label}: spoiler must be boolean`);
  }

  const plats = rarityCount['platinum'] ?? 0;
  if (plats !== 1) errors.push(`exactly 1 platinum expected, found ${plats}`);

  const declared = data.categories ?? [];
  for (const tro of t) {
    if (!declared.includes(tro.category)) {
      errors.push(`${tro.id}: category "${tro.category}" not declared in "categories"`);
    }
  }

  return errors;
}

function main(): void {
  let data: TrophyData;
  try {
    data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    console.error('FAILED to read/parse trophies.json:', (e as Error).message);
    process.exit(1);
  }

  const errors = validate(data);
  const trophies = data.trophies ?? [];

  console.log(`GTA VI trophy guide — data validation`);
  console.log(`  trophies: ${trophies.length}`);
  console.log(`  status:   ${data.meta?.status ?? 'MISSING'} (all entries marked projected)`);
  console.log(`  missable: ${trophies.filter((x) => x.missable).length}`);
  console.log(`  spoiler:  ${trophies.filter((x) => x.spoiler).length}`);
  console.log(`  roadmap:  ${data.roadmap?.steps?.length ?? 0} phases`);
  console.log(`  missable notes: ${data.missables?.items?.length ?? 0}`);

  if (errors.length) {
    console.error(`\n${errors.length} validation error(s):`);
    for (const err of errors) console.error('  - ' + err);
    process.exit(1);
  }
  console.log('\nOK — trophies.json is valid.');
}

main();

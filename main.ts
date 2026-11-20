// Hand-in program for gta6-trophy-guide-01 (Node 22, standard library only).
// Copies app/ and screenshots/ to $MAKEFUN_OUTPUT_DIR (default /output) and writes
// dossier.json with buildDossier from the vendored kit library.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Fail loudly if screenshots were never generated, so a hand-in is never silent.
if (!existsSync(join(here, 'screenshots'))) {
  throw new Error('screenshots/ missing from repository — run tools/gen-screenshots.mjs first');
}

// The scorer's caps (reference/gate.json): text_max_bytes shapes the dossier text;
// the other options refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Hand-in program for the make.fun entry gta6-trophy-guide-01 (Node 22, stdlib only).
// Copies app/ and screenshots/ into $MAKEFUN_OUTPUT_DIR (default /output), then
// writes dossier.json via buildDossier from the vendored kit library. Exits
// non-zero on any problem so a silent bad hand-in is impossible.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
} else {
  throw new Error('screenshots/ missing — run tools/gen-screenshots.mjs first');
}

// Caps from the competition gate: keep the dossier text lean and refuse
// anything the scorer would reject outright.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log('hand-in written to', out);

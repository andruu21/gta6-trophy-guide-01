// Hand-in program for the make.fun entry gta6-trophy-guide-01 (Node 22,
// stdlib only). Copies app/ and screenshots/ into $MAKEFUN_OUTPUT_DIR
// (default /output) and writes dossier.json through buildDossier from the
// vendored kit library. Exits non-zero on any failure so a broken hand-in is
// never silent.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
if (!existsSync(join(repoRoot, 'screenshots'))) {
  throw new Error('screenshots/ missing — run tools/gen-screenshots.mjs first');
}
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log('hand-in written to', outDir);

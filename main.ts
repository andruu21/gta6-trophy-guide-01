// Leonida Trophy Atlas — hand-in program (Node 22, standard library only).
//
// The entry is the static app in app/: plain files a browser serves with app/ at the
// root, no build step, fully offline. app/index.html opens the master-detail tracker
// (checklist with tick-to-earn, cited guides in a sticky detail pane, filters, spoiler
// mode); app/data/trophies.json carries all 55 official trophies with name, official
// description, grade, and a guide written for this entry that cites its sources. The
// roadmap to the platinum and the missables page are built from those same data.
//
// This program hands the entry in: it copies app/ and screenshots/ to /output and
// writes /output/dossier.json with buildDossier from vendor/makefun-frontend.ts (the
// kit's copy, unchanged — the scorer rebuilds the dossier with the same library and
// compares byte for byte). Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// screenshots/ holds the four judge-facing renders; the first by name is the cover.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps from the scorer's reference/gate.json: mirror them here so a build that would
// be refused fails here with a clear error instead of shipping.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648
};

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(join(out, 'dossier.json'), buildDossier(out, caps));
console.log('dossier written to ' + out + '/dossier.json');

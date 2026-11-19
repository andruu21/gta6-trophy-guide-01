# Leonida Trophy Atlas — GTA VI Trophy Guide & Tracker

An offline guide and tracker for the 55 official PlayStation 5 trophies of
Grand Theft Auto VI: every trophy with its official name, description and grade,
a guide that cites its sources, a three-stage roadmap to the platinum, missable
flags, filters by kind / grade / status, a spoiler setting that hides hidden
trophies until earned, and checklist progress that saves in your browser
(localStorage) with export/import to a JSON file.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Static files under `app/`, no build step, no network at run time. Open
`app/index.html` from any static server with `app/` at its root.

## Build (hand-in)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`dossier.json` with the kit's `buildDossier`.

## What is inside

- `app/index.html` + `app/app.js` + `app/style.css` — master-detail tracker:
  checklist rows (tick to earn), a sticky detail pane with the selected trophy's
  full cited guide, filters (story / activities / collectibles, grade, status),
  spoiler mode, roadmap, missables page, save/load with export & import.
- `app/data/trophies.json` — all 55 official trophies as PlayStation publishes
  them (via Exophase and PSNProfiles), each with a guide written for this entry
  and its sources cited (GTABase, Push Square, PlayStation.Blog, Rockstar's
  Only in Leonida). Nothing copied from any guide.
- `screenshots/` — four renders of the app itself (checklist with a guide open,
  spoiler mode at work, the roadmap, the missables page).

Entry for [gta6-trophy-guide-01 on make.fun](https://make.fun/c/gta6-trophy-guide-01).

MIT licensed. No Rockstar assets used.

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

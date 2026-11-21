[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline, fan-made companion for all 55 PlayStation 5 trophies of Grand Theft
Auto VI, built for the make.fun competition `gta6-trophy-guide-01`. Everything
runs from static files with zero network requests and no Rockstar assets.
Trophy names and descriptions are reproduced exactly as published; all guides,
the roadmap and every missable note are written in our own words, each citing
at least two community sources (PSNProfiles, PowerPyx, PlayStationTrophies.org,
GameFAQs, Exophase, GTA Forums, GTA Wiki).

What it does:

- Checklist of every trophy with its official name, description and grade;
  ticking items tracks progress in localStorage, with export/import to a JSON
  file and a reset option.
- Each trophy carries a compact original guide whose key claims cite at least
  two community sources, shown when a trophy is opened.
- Filters for kind (story, missable, collectibles, activities, misc), grade and
  hide-earned, plus a one-click "missables only" chip.
- Spoiler mode blurs story-trophy names and descriptions until they are marked
  earned.
- An 8-stage roadmap to the platinum with per-stage time estimates, rendered in
  the sidebar and stored in the data file.
- Missable trophies carry a persistent warning badge and a callout in the guide
  panel, and unfinished missables sort to the top of the checklist.

## Run

Serve `app/` with any static server, e.g.:

    node serve.ts          # http://localhost:8080

## Regenerate screenshots

    node tools/gen-screenshots.mjs    # needs Playwright + Chromium (Python venv)

## Hand-in

    MAKEFUN_OUTPUT_DIR=/tmp/tg-output node main.ts

Copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored kit library. The app makes no network requests
and uses no Rockstar assets.

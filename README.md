# Leonida Platinum — GTA VI Trophy Guide & Tracker

An offline, fan-made guide and tracker for all 55 PlayStation 5 trophies of Grand
Theft Auto VI, built for the make.fun competition `gta6-trophy-guide-01`.

- **Checklist & tracker** — every trophy with its official name, description and
  grade, tick-to-earn progress saved in localStorage, plus export/import of
  progress as a JSON file.
- **Guides with cited sources** — each trophy's guide cites 2+ sources
  (PowerPyx, PSNProfiles, PlayStationTrophies.org, GameFAQs, Exophase,
  GTA Forums, GTA Wiki) for its key claims, in our own words.
- **Filters** — by kind (story, missable, collectibles, activities, misc),
  grade, hide-earned, and a "missables only" chip.
- **Spoiler mode** — hides names and descriptions of story trophies until they
  are marked earned.
- **Roadmap** — an 8-stage plan to the platinum with time estimates, rendered
  in the app.
- **Missable warnings** — every missable trophy is prominently flagged.

## Run

Any static server with `app/` at its root, e.g.:

    node serve.ts          # http://localhost:8080

## Regenerate screenshots

    node tools/gen-screenshots.mjs    # needs Playwright + Chromium (Python)

## Hand-in

    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

Copies `app/` and `screenshots/` to the output dir and writes `dossier.json`
with the vendored kit library (run twice; both runs must match byte for byte).
No network requests; no Rockstar assets; the whole app is offline static files.

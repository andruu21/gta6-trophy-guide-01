[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# GTA VI Trophy Guide

A projected, browser-based companion for the Grand Theft Auto VI Platinum
hunt. All **55 trophies** are laid out along a phased completion roadmap, with
every missable trophy flagged, plus a spoiler mode so first-time players can
browse the list without having the story spoiled ahead of time.

## What's in the guide

- **55 projected trophies** — Platinum, story missions, 100% completion,
  collectibles, heists, vehicles, activities, strangers and side quests — each
  with a difficulty rating (Easy / Medium / Hard / Very Hard), a missable flag
  and a "what to watch" note.
- **A roadmap** that breaks the run into five phases — blind story run →
  pre-endgame sweep → post-story clean-up → grinds → skill checks & 100% —
  so a 150–200 hour Platinum stays organised.
- **A missables section** covering cheats disabling trophies, chapter-locked
  content, heist approach lockouts, stealth resets and the cumulative
  relationship meter.
- **Spoiler mode** — a toggle that masks story-mission names, chapter details
  and endings while leaving world-system trophies visible. Your setting is
  remembered across reloads.

## Running it

The app is dependency-free static files. Serve the `app/` folder:

```bash
python3 -m http.server 8000 --directory app
```

Then open http://localhost:8000 in any modern browser. Opening
`app/index.html` directly also works in most browsers; if yours blocks the
`file://` JSON fetch (CORS on local files), use the server command above.

## Verified facts (with sources)

- **Release date & platforms:** launched **November 19, 2026** on
  **PlayStation 5** and **Xbox Series X|S** — per the [Rockstar Newswire
  release-date announcement](https://www.rockstargames.com/newswire).
- **Setting:** the game is set in the **state of Leonida**, a return to modern
  day **Vice City** plus regions like the Leonida Keys, Grassrivers and Port
  Gellhorn — per Rockstar's official announcements.
- **Protagonists:** the story follows **Jason Duval** and **Lucia Caminos**, a
  fugitive couple — per Rockstar's character reveals and
  [store listing](https://store.rockstargames.com/game/buy-gta-vi).
- **Single-player at launch:** Rockstar's pre-order posts describe GTA VI as a
  **single-player experience**; no online mode is part of the launch package.

## Projection disclaimer

**This entire list is a projection.** Rockstar Games has not published an
official trophy guide as of this writing. Every trophy name, category and
unlock condition here is modelled on the GTA V PS5 trophy structure and on
launch-week community tracking (GTA BOOM, GTABase, gta.guide). When the
official list surfaces, correct this guide against it — treat it as a working
draft, not gospel. This project is fan-made and not affiliated with or endorsed
by Rockstar Games or Take-Two Interactive.

## trophies.json data model

Trophy data lives in `app/data/trophies.json`:

```jsonc
{
  "meta": {
    "game": "Grand Theft Auto VI",
    "platforms": ["PlayStation 5", "Xbox Series X|S"],
    "releaseDate": "2026-11-19",
    "setting": "State of Leonida (Vice City, …)",
    "protagonists": "Jason Duval & Lucia Caminos",
    "disclaimer": "PROJECTED LIST. …"
  },
  "categories": [ { "id": "story", "label": "Story Missions" }, "… 9 more" ],
  "difficulties": ["Easy", "Medium", "Hard", "Very Hard"],
  "trophies": [
    {
      "id": "vice-got-a-price",      // unique slug
      "name": "Vice Got a Price!",
      "type": "Platinum",            // Bronze | Silver | Gold | Platinum
      "category": "platinum",        // must exist in categories[]
      "difficulty": "Very Hard",     // must exist in difficulties[]
      "missable": false,
      "missableNote": "what to watch — present on every entry",
      "description": "how to get it"
    }
  ]
}
```

Every trophy is a flat object keyed by a slug `id`, tagged with one of the
category ids, a difficulty tier and missable metadata. The app renders straight
from this file, so edits to the JSON appear on refresh. A small TypeScript
validator (`main.ts`, run with `npx tsx main.ts`) checks the count (55),
grade breakdown (1/2/6/46), required fields and cross-references.

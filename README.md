[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# GTA VI Trophy Guide — Projected 55-Trophy Companion

A zero-dependency single-page trophy guide for Grand Theft Auto VI. It ships a
full 55-trophy projection (platinum, story, 100% completion, collectibles,
heists, vehicles, activities, misc), a 3-phase completion roadmap, a dedicated
missables section, and a spoiler-free mode that hides routes by default so a
first playthrough stays unspoiled.

Everything is vanilla HTML + CSS + JavaScript. No frameworks, no build step.

## Quick start

```bash
# serve the app (fetch() needs http://, not file://)
python3 -m http.server 8000 --directory app
# then open http://localhost:8000

# validate the trophy data schema (dev-time)
npx tsx main.ts
```

## App features

- **Category filters** (8 categories) plus **live search** over names,
  descriptions, routes and notes.
- **Sort** by guide order, name, or difficulty (either direction).
- **Spoiler mode** — ON by default for new visitors; routes and missable notes
  are hidden per trophy until you press "Reveal", or globally via
  "Reveal all routes". The choice persists in `localStorage`.
- **Progress tracking** — tick trophies off; the count and percentage bar
  persist locally. One-click reset included.
- **Difficulty bars** (1-4 scale) and MISSABLE flags on every card.

## Verified GTA VI facts (cited)

| Fact | Value | Source |
| --- | --- | --- |
| Release | 19 November 2026 | [PlayStation.Blog, 18 Nov 2026](https://blog.playstation.com/2026/11/18/grand-theft-auto-vi-launches-tomorrow-november-19); [AP News](https://apnews.com/article/grand-theft-auto-6-video-game-release-6e255c930da6de820e539721f4682253) |
| Platforms | PS5, Xbox Series X\|S | [Wikipedia](https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI) |
| Setting | State of Leonida: Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga | [Rockstar — Only in Leonida](https://www.rockstargames.com/VI/only-in-leonida) |
| Protagonists | Jason Duval & Lucia Caminos | Rockstar character pages (link above); [Britannica](https://www.britannica.com/question/What-is-Grand-Theft-Auto-VI) |
| Online mode | None at launch — single-player only; a multiplayer mode is unconfirmed (reported ~2027, Bloomberg via VICE) | [VICE](https://vice.com/en/article/gta-6-online-release-window-bloomberg); [Push Square PSA](https://www.pushsquare.com/news/2026/11/psa-gta-6-does-not-have-online-multiplayer-at-launch) |

## Projection disclaimer

**Every trophy below the verified facts above is a projection.** Rockstar has
not published an official GTA VI trophy list. Names and requirements are
modelled on the GTA V PS5 list structure ([TrueTrophies](https://www.truetrophies.com/n20891/grand-theft-auto-v-playstation-trophies),
[Exophase](https://www.exophase.com/game/grand-theft-auto-v-psn/trophies/),
[TechRadar](https://www.techradar.com/news/gta-5-on-ps5-and-xbox-series-x-trophy-guide-all-51-achievements-revealed)),
labelled `PROJECTION` in the UI, and stored with a `status` disclaimer in the
data file. Replace the list once Rockstar's official one exists. Fan-made; not
affiliated with Rockstar Games or Take-Two Interactive.

## Data model (`app/data/trophies.json`)

```jsonc
{
  "meta":       { "title", "game", "platforms", "releaseDate", "trophyCount",
                  "estimatedHours", "status", "modelledOn", "sources": [url, …] },
  "categories": [ { "id": "story", "label": "Story Missions" }, … ],   // 8
  "roadmap":    [ { "phase": 1, "title": "…", "text": "…" }, … ],      // 3 phases
  "missables":  [ { "title": "…", "text": "…" }, … ],
  "trophies": [
    {
      "id": "story-finale",          // unique slug
      "name": "To Live or Die in Leonida",
      "rank": "platinum|gold|silver|bronze",
      "category": "story",           // must exist in categories[]
      "difficulty": 2,               // 1-4
      "missable": true,
      "missableNote": "what to watch (required when missable=true)",
      "description": "trophy requirement",
      "howTo": "route text"
    }
  ]
}
```

`main.ts` validates all of this: exact count of 55, unique ids, valid
category/rank references, difficulty range, missable⇒missableNote, roadmap and
missables completeness, `meta.trophyCount` consistency, and a PROJECTION
`status` string. Exit code 1 with per-item errors on any violation.

## When Rockstar's official list drops

1. Replace the 55 entries in `app/data/trophies.json` with the real names,
   ranks and unlock conditions (keep the same field shape).
2. Update `meta.trophyCount`, `meta.status` (drop the PROJECTED label) and
   `meta.sources` with a link to the official PSN/PlayStation trophy page.
3. Re-run `npx tsx main.ts` — it will flag any count or schema drift.
4. Sweep the roadmap and missables sections against the real unlock logic.

## Repository layout

```
app/index.html          page shell
app/style.css           Vice City neon theme
app/app.js              vanilla-JS renderer + state
app/data/trophies.json  the 55-trophy dataset
main.ts                 schema validator (npx tsx main.ts)
```

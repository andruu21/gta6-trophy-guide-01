# GTA VI Trophy Guide — Projected 55-Trophy Roadmap

A fan-made, spoiler-aware **Grand Theft Auto VI** trophy guide: a working
single-page web app (vanilla JS, no frameworks) plus a TypeScript data validator.
**Every trophy name and route below is a projection** — Rockstar Games has not
published an official trophy guide. The list is modelled on the GTA V PS5
trophy structure and on launch-week community tracking, and is clearly labelled
as projected everywhere in the app and data.

## Verified facts (with sources)

| Fact | Value | Source |
|---|---|---|
| Release date | November 19, 2026 (PS5, Xbox Series X\|S) | [Rockstar Newswire, Nov 6 2025](https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026) · [rockstargames.com/VI](https://www.rockstargames.com/VI) |
| Setting | State of **Leonida** — Vice City, Leonida Quays, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga, the Keys | Rockstar ("sprawling state of Leonida and a return to modern day Vice City") · [GTAVice](https://gtavice.net/setting-and-story) · [GameSpot](https://gamespot.com/articles/10-new-things-we-just-learned-about-gta-6) |
| Protagonists | **Jason Duval & Lucia Caminos**, a fugitive couple; Lucia starts the story in prison | [Rockstar Store game description](https://store.rockstargames.com/game/buy-gta-vi) · [Variety](https://variety.com/2026/gaming/news/gta-6-release-details-1236846230) |
| Online mode | **Not announced at launch.** Rockstar describes GTA VI as "a single player experience"; Bloomberg reporting suggests a 2027 multiplayer launch (unconfirmed rumor) | [Rockstar Newswire pre-order post](https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25) · [ViceSplat explainer](https://vicesplat.com/news/will-gta-6-have-online-mods-fivem-rp-servers/) · [PC Gamer](https://www.pcgamer.com/games/grand-theft-auto/gta-6-online-multiplayer/) |
| Trophy count | 55 trophies incl. Platinum per launch-week tracking (1 Platinum, 2 Gold, 6 Silver, 46 Bronze); all single-player | [GTA BOOM](https://gtaboom.com/every-gta-6-trophy-and-achievement-at-launch-and-how-to-unlock-them-fc5f) · [GTABase](https://gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series) · [gta.guide](https://gta.guide/gta-6/guides/trophies-and-achievements) |

## The guide

All **55 trophies**, each with:

- a `projected` label (a dashed-gold badge and a banner; nothing claims official status),
- a **difficulty rating** (Easy / Medium / Hard / Very Hard),
- a **missable flag plus a "what to watch" note** for every entry,
- a **description** of how to get it.

Plus, in the app UI:

- a **completion roadmap** in five phases (story blind run → pre-endgame sweep → post-story clean-up → grinds → skill checks & 100%),
- a **missables section** (cheats disabling trophies, chapter-locked content, heist approach lockouts, stealth resets, the cumulative relationship meter, and the online caveat),
- a **spoiler-free toggle** that masks story-mission names, chapter details and endings while leaving world-system trophies visible.

## Running the app

Static files only — serve the repo root (or the `app/` dir) with any web server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/app/
```

Opening `app/index.html` via `file://` will fail to fetch the JSON in some
browsers (CORS on local files) — the app detects this and shows a hint.

### App features

- Spoiler-free mode (persisted in `localStorage`, restored on reload)
- Dark neon / light theme toggle (also persisted)
- Category chips, difficulty chips, "missable risk only" filter
- Free-text search across names, descriptions and notes
- Sorting (list order, hardest first, A–Z)
- Per-trophy "Mark obtained" tracking with a progress bar (stored locally, never uploaded; reset button included)

## Validating the data (main.ts)

`main.ts` is a small TypeScript dev helper that validates
`app/data/trophies.json` against the guide's own schema: trophy count (55),
grade breakdown (1/2/6/46), required fields, unique ids, category and
difficulty references, grade values, and the mandatory projection disclaimer.

```bash
# fastest: run directly
npx tsx main.ts

# or compile & run
npx tsc main.ts --module commonjs --target es2020 --esModuleInterop \
  && node main.js
```

Node's built-in type definitions (`@types/node`) are needed for
`fs`/`path`/`process` — `npx tsx` pulls them automatically; a bare `tsc` run
may need `npm i -D @types/node` first. Note there is no `package.json` in this
repo on purpose (the app is dependency-free); the validator is optional dev
tooling.

Quick checks without TypeScript:

```bash
node -e "JSON.parse(require('fs').readFileSync('app/data/trophies.json'))"
node --check app/app.js
```

## Repo layout

```
app/
  index.html          # single-page shell: header, filters, grid, roadmap, missables
  app.js              # vanilla JS: rendering, spoiler mode, filters, tracking
  style.css           # Vice City neon dark + light theme, responsive layout
  data/trophies.json  # 55 projected trophies + meta (sources, disclaimer, breakdown)
main.ts               # dev-only schema validator for trophies.json
README.md             # this file
```

## Data model (`trophies.json`)

```jsonc
{
  "meta": { "disclaimer": "PROJECTED …", "sources": [ … ] },
  "categories": [ { "id": "story", "label": "Story Missions" }, … ],
  "difficulties": ["Easy", "Medium", "Hard", "Very Hard"],
  "trophies": [
    {
      "id": "vice-got-a-price",
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

## License & attribution

Fan-made projection guide; **not affiliated with or endorsed by Rockstar Games
or Take-Two Interactive**. Trophy names are projected from launch-week community
tracking (GTA BOOM, GTABase, gta.guide, November 2026) until an official list
exists. Grand Theft Auto and all related marks are trademarks of Take-Two
Interactive. No game assets are included or reproduced here.

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/andruu21/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# GTA VI Trophy Guide — Projected 55-Trophy Companion

A zero-dependency single-page trophy guide for Grand Theft Auto VI. It ships a
55-trophy projection (1 platinum, 3 gold, 8 silver, 43 bronze — modelled on the
GTA V PS5 list structure), a 3-phase completion roadmap, a dedicated missables
section, and a spoiler-free mode that hides routes by default so a first
playthrough stays unspoiled.

Everything is vanilla HTML + CSS + JavaScript. No frameworks, no build step.

## Run it

```bash
# serve the app (fetch() needs http://, not file://)
python3 -m http.server 8000 --directory app
# then open http://localhost:8000

# validate the trophy data schema (dev-time)
npx tsx main.ts
```

## App features

- **Category filters** (8 categories) and **rank filters** (platinum/gold/silver/bronze).
- **Live search** over names, requirements, routes and notes; **sort** by guide
  order, name, rank, or difficulty in either direction.
- **Spoiler mode** — ON by default for new visitors; routes and missable notes
  are hidden per trophy until you press "Reveal this trophy", or globally via
  the header toggle. The choice persists in `localStorage`.
- **Progress tracking** — tick trophies off; the count and percentage bar
  persist locally. One-click reset (with confirmation) included.
- **Difficulty bars** (1–10 scale) and MISSABLE flags on every card;
  filters and sort choices also persist between visits.

## Verified GTA VI facts (cited)

| Fact | Value | Source |
| --- | --- | --- |
| Release | 19 November 2026 | [Rockstar Newswire](https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026); [Take-Two IR launch press release](https://ir.take2games.com/node/32696/pdf) |
| Platforms at launch | PS5, Xbox Series X\|S (single-player only at launch) | [Rockstar — GTA VI page](https://www.rockstargames.com/VI/); [Xbox listing](https://xbox.com/en-US/games/grand-theft-auto-vi) |
| Setting | Fictional state of Leonida, with Vice City at its heart | [Rockstar — Only in Leonida](https://www.rockstargames.com/VI/only-in-leonida) |
| Protagonists | Jason Duval & Lucia Caminos (both playable; Lucia is the first playable woman in a mainline 3D GTA) | Rockstar character pages (above); [Britannica](https://www.britannica.com/question/What-is-Grand-Theft-Auto-VI) |
| Regions shown | Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga National Park | Rockstar's Only in Leonida region tour (link above) |

Projected list shape: **55 trophies** — 1 platinum, 3 gold, 8 silver, 43 bronze;
7 flagged missable; difficulty on a 1–10 scale; estimated platinum time 110–170h.

## Projection disclaimer

**Every trophy below the verified facts above is a projection.** As of
20 November 2026, Rockstar has not published an official GTA VI trophy list.
Names and requirements are modelled on the GTA V PS5 list structure
([TrueTrophies](https://www.truetrophies.com/n20891/grand-theft-auto-v-playstation-trophies),
[Exophase](https://www.exophase.com/game/grand-theft-auto-v-psn/trophies/)),
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
      "id": "gold-all-missions",     // unique slug
      "name": "Blood and Sand",
      "rank": "platinum|gold|silver|bronze",
      "category": "story",           // must exist in categories[]
      "difficulty": 3,               // 1-10
      "missable": true,
      "missableNote": "what to watch (required when missable=true)",
      "description": "trophy requirement",
      "howTo": "route text"
    }
  ]
}
```

`main.ts` validates all of this: exact count of 55, unique ids, exactly one
platinum, valid category/rank references, difficulty range, missable⇒missableNote,
roadmap and missables completeness, `meta.trophyCount` consistency, ISO
`releaseDate`, and a PROJECTION `status` string. Exit code 1 with per-item
errors on any violation.

## When Rockstar's official list drops

1. Replace the 55 entries in `app/data/trophies.json` with the real names,
   ranks and unlock conditions (keep the same field shape).
2. Update `meta.trophyCount`, `meta.status` (drop the PROJECTED label) and
   `meta.sources` with a link to the official PSN trophy page.
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

## License

MIT — see [LICENSE](LICENSE).

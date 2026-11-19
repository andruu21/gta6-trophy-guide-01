# GTA VI Trophy Guide — Leonida Legend (Projected)

A single-page, framework-free trophy guide for **Grand Theft Auto VI**
(PlayStation 5) with all **55 trophies**, a completion roadmap, a missables
section, difficulty ratings, and a spoiler-free toggle mode.

## ⚠️ Everything is a projection

Rockstar Games has **not published an official GTA VI trophy list**. Every
trophy name, rarity, and requirement in `app/data/trophies.json` is an original
projection modelled on the Grand Theft Auto V (PS5) trophy list and Rockstar's
long-standing trophy design patterns. The data file and the app UI label this
everywhere (`meta.status: "PROJECTED"`, a gold banner in the header, a
"projected" tag on every card, and a reminder in each trophy's detail dialog).
Treat nothing as confirmed until Rockstar publishes the real list.

## Verified facts (sourced)

These are the only "hard" facts in this guide, each checked against primary
sources on November 20, 2026:

| Fact | Value | Source |
|---|---|---|
| Release date | November 19, 2026 (PS5, Xbox Series X\|S) | [Rockstar Newswire](https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026) |
| Setting | State of Leonida, incl. modern-day Vice City | [Rockstar Newswire](https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026), [rockstargames.com/VI](https://www.rockstargames.com/VI) |
| Protagonists | Jason Duval & Lucia, a criminal partnership across Leonida | [Rockstar: Only in Leonida](https://www.rockstargames.com/VI/only-in-leonida) |
| Online mode | GTA VI is single-player at launch; existing GTA Online continues to be supported "after GTA 6 release and beyond"; any new online mode is unannounced | [Take-Two IR](https://www.take2games.com/ir/news/rockstar-games-announces-pre-orders-grand-theft-auto-vi), [IGN](https://ign.com/articles/gta-6-is-a-single-player-experience-rockstar-confirms-what-now-for-gta-online) |

## Run it

The app is plain static files — no build step, no dependencies:

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

(Any static server serving `app/` at its root works. Opening `index.html`
via `file://` also works in most browsers; fetch of the JSON is the only
network call, to the app's own data file.)

## What the app does

- **55 trophy cards** in a responsive grid, grouped by 8 filterable categories
  (Platinum, Story, 100% Completion, Collectibles, Heists, Vehicles,
  Sports & Activities, Misc).
- **Every trophy shows**: a difficulty rating (1–10 with dot visualization),
  rarity, a missable tag where relevant, a spoiler tag, and the projected label.
- **Detail dialog** per trophy: description, "how to get it", and for missable
  ones a "what to watch" warning.
- **Spoiler-free toggle mode**: hides the names/descriptions/how-tos of
  spoiler-flagged trophies until revealed. Preference persists in `localStorage`.
- **Search** (`/` shortcut, `Esc` clears) plus category filters, with a live
  "showing N of 55" counter.
- **Roadmap**: 5 phases from story-first to platinum cleanup, with estimated hours.
- **Missables section**: the watch-list of things that could lock trophies in
  a playthrough, plus per-trophy warnings.
- **Local progress tracking**: mark trophies "earned"; stored in `localStorage`
  (`gta6-trophy-guide-v1`), survives reloads, never leaves the browser.

## Files

```
app/
  index.html          page shell: header, filters, panels, dialog
  style.css           Vice City dusk palette, responsive layout
  app.js              vanilla JS: load, render, filters, search, spoiler mode,
                      dialog, localStorage persistence
  data/trophies.json  all 55 projected trophies + verified game facts + roadmap
                      + missables + sources
main.ts               TypeScript dev helper: validates trophies.json against the
                      project schema (55 trophies, required fields, rarity values,
                      difficulty range, missable=>watch note, projected=true, etc.)
README.md             this file
```

## Data schema

Each trophy object requires:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | unique slug |
| `name` | string | projected trophy name |
| `category` | one of `platinum, story, completion, collectibles, heists, vehicles, activities, misc` | grouping |
| `rarity` | `platinum` \| `gold` \| `silver` \| `bronze` | PSN rarity class |
| `difficulty` | number 1–10 | projected effort/skill |
| `missable` | boolean | could lock in one playthrough |
| `watch` | string | required when `missable: true` — what to watch |
| `projected` | `true` | always true; nothing is official |
| `spoiler` | boolean | masked by spoiler mode |
| `description` | string | what the trophy asks |
| `howTo` | string | projected method to earn it |

Top-level sections: `meta` (disclaimer, status, sources), `gameFacts`
(verified facts above), `categories`/`categoryLabels`, `roadmap` (5 phases),
`missables` (intro + watch-list items).

## Dev tooling

Validate the data (exit code 1 on failure — CI-friendly):

```sh
npx tsx main.ts
# or on Node 22+: node --experimental-strip-types main.ts
```

Syntax-check the app and data by hand:

```sh
node -e "JSON.parse(require('fs').readFileSync('app/data/trophies.json'))"
node --check app/app.js
```

## Updating when the real list lands

1. Replace `trophies` in `app/data/trophies.json` with the official names and
   requirements, set `meta.status` to `"OFFICIAL"` (the validator will then
   reject `"PROJECTED"`-only data).
2. Set each trophy's `projected` to `false`, keep `difficulty`, `missable`,
   and `watch` honest per real gameplay.
3. Re-run `npx tsx main.ts` and refresh the app — the banner text reads the
   status, so the UI follows automatically only if you also update the static
   banner in `index.html`.

## License

Guide text: MIT (see LICENSE). Unofficial fan project — not affiliated with
Rockstar Games or Take-Two Interactive. No Rockstar assets used.

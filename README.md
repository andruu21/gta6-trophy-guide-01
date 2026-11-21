# Leonida Platinum — GTA VI Trophy Guide

A fan-made, fully offline companion for the 55 PlayStation 5 trophies of
Grand Theft Auto VI, built for the make.fun competition
`gta6-trophy-guide-01`. It is a static site: `app/` opens straight from disk,
makes no network requests and uses no Rockstar assets. Trophy names and
descriptions follow the published list; every walkthrough note is written
originally and cites two community sources (PowerPyx, PSNProfiles,
PlayStationTrophies.org, GTA Forums).

## Features

- Checklist of all 55 trophies with grade, kind and story-stage tags.
- Progress checklist stored in localStorage, with JSON export/import and reset.
- Missables-first: open missable trophies always sort to the top of the list.
- 8-stage roadmap to the platinum, rendered in the sidebar.
- Spoiler mode blurs story trophy names, descriptions and guides until earned.
- Filters for kind, grade, stage and hide-earned, plus a "missables only" chip.

## Run

Serve `app/` with any static server, e.g.:

    node serve.ts          # http://localhost:8080

## Regenerate screenshots

    node tools/gen-screenshots.mjs

## Hand-in

    MAKEFUN_OUTPUT_DIR=/tmp/mfgate node main.ts

Copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` via the vendored kit library in `vendor/`.

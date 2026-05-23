# NAGT — Nuclear Arms Global Tracker

A single-page, **fictional, simulation-only** intelligence-dashboard concept. It visualizes
nuclear-armed states, strategic platforms, and a mock launch/intercept scenario on an
interactive world map.

> [!IMPORTANT]
> This is a design/demo project. Warhead counts are rounded public estimates
> (FAS/SIPRI-style); **every alert, launch window, DEFCON state, and "live feed" item is
> invented** for the demo. Nothing here is real intelligence.

## Features

- **Interactive map** (Leaflet + CARTO dark tiles) of nine nuclear-armed states, sized by arsenal.
- **Strategic platforms** — SSBN submarines, strategic bombers, and Ground-Based Interceptor
  (GBI) defense sites, each with map markers and sidebar inventories.
- **Launch simulation** — animates a notional ICBM trajectory and probabilistically engages
  it with GBI midcourse defense, showing an intercept or impact outcome.
- **Live panels** — rotating intel feed, DEFCON scale, arsenal comparison, geopolitical heat
  index, and projected launch windows.
- Data-driven from a single set of arrays, responsive layout, and reduced-motion support.

## Run locally

It's one self-contained file with no build step. Either open it directly:

```sh
open index.html      # macOS  (use xdg-open on Linux)
```

…or serve it (recommended, so the map tiles load over HTTP):

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

An internet connection is required at runtime for the Leaflet, Lucide, Google Fonts, and
map-tile CDNs.

## Deployment

Pushing to `main` publishes the site to GitHub Pages via
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

**Live:** https://devante88.github.io/Nuke-Tracker-/

## Project structure

```
index.html                      # entire app: markup, styles, and logic
.github/workflows/deploy-pages.yml  # GitHub Pages deploy
.nojekyll                       # serve static files without Jekyll processing
```

# NAGT — Nuclear Arms Global Tracker

A single-page, **fictional, simulation-only** intelligence-dashboard concept. It visualizes
nuclear-armed states, strategic platforms, and a mock launch/intercept scenario on an
interactive world map.

> [!IMPORTANT]
> This is a design/demo project. Warhead counts are rounded public estimates
> (FAS/SIPRI-style); **every alert, launch window, DEFCON state, and "live feed" item is
> invented** for the demo. Nothing here is real intelligence.

- **Fully self-contained — no external CDNs.** Leaflet, the world basemap, fonts, and icons are
  all vendored in [`vendor/`](vendor/), so the app runs deployed, from a local folder, over
  `file://`, and **completely offline**.

## Features

- **Interactive map** of nine nuclear-armed states, sized by arsenal, framed by a tactical HUD
  (corner brackets, vignette, radar sweep). The basemap is a **bundled world GeoJSON drawn as
  vectors by Leaflet** — no tile server, so it renders with zero network access.
- **Strategic platforms & bases** — SSBN submarines, strategic bombers, Ground-Based Interceptor
  (GBI) defense sites, and the three US ICBM ground bases (Minuteman wings). Click any sidebar
  inventory row (or focus it and press Enter) to fly the map to that asset and open its readout.
- **Satellite tracking** — an animated monitoring constellation rides sinusoidal ground tracks
  and beams down to the assets it watches: US GBI sites, SSBN patrols, and ICBM ground bases.
  Toggle it from the map, and the "Monitoring Satellites" KPI reflects the live count.
- **Triad movement tracking** — mobile nuclear forces animate across all three domains:
  **ground** (road-mobile TELs), **air** (bomber patrols), and **water** (SSBN patrols), each
  riding a patrol route with a live trail. Toggle from the map; listed in the sidebar.
- **Arsenal-development indicator** — every nation shows its program trajectory (expanding,
  growing, modernizing, or stable) on its sidebar card and in a dedicated development panel.
- **Interactive DEFCON scale** — click any of the five levels to set the global posture; the
  header badge updates its number, status codeword, and color.
- **Launch simulation with ETA** — animates a notional ICBM trajectory, runs a live
  **impact-ETA countdown** (boost → midcourse → terminal), and probabilistically engages it
  with GBI midcourse defense, showing an intercept or impact outcome.
- **Live panels** — rotating intel feed, arsenal comparison, geopolitical heat index, and
  projected launch windows.
- Data-driven from a single set of arrays (totals and the movements KPI are derived, never
  hand-typed), responsive layout, and reduced-motion support.

## Run locally

No build step and no internet required. Open it directly:

```sh
open index.html      # macOS  (use xdg-open on Linux)
```

…or serve it (recommended, so the browser resolves the `vendor/` paths cleanly):

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Everything it needs is in the repo, so it works the same online or offline.

## Deployment

The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
publishes the site to the **`gh-pages`** branch on every push to `main` (a plain token push —
no `github-pages` environment, so it isn't blocked by branch-protection rules).

**One-time setup** — GitHub only lets a repo admin turn Pages on, so this single step can't be
automated: in **Settings → Pages → Build and deployment**, set **Source → Deploy from a branch**,
choose **Branch → `gh-pages`** and **folder `/ (root)`**, then **Save**. After that, every push
to `main` auto-updates the live site.

**Live:** https://devante88.github.io/Nuke-Tracker-/

## Project structure

```
index.html                          # entire app: markup, styles, and logic
vendor/
  leaflet/                          # Leaflet 1.9.4 (js, css, marker images)
  world/world.js                    # bundled world basemap (GeoJSON as a global)
  fonts/                            # self-hosted Orbitron, Share Tech Mono, Inter (woff2)
.github/workflows/deploy-pages.yml  # publishes the site to the gh-pages branch
.nojekyll                           # serve static files without Jekyll processing
```

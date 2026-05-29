---
name: run-nuke-tracker
description: Build, run, screenshot, and smoke-test the NAGT Nuclear Arms Global Tracker dashboard. Use when asked to start, run, launch, screenshot, drive, or smoke-test the dashboard locally, or to verify a change before pushing.
---

NAGT is a single-page static web app — one `index.html` plus a `vendor/`
directory of pre-bundled JS/CSS/fonts/world-basemap. No build step. There
is no React, no Vite, no `package.json` to run. Drive it by:

1. serving the repo with any static server (`npx http-server` works), and
2. running [`driver.mjs`](driver.mjs) — a headless-Chromium smoke + screenshot
   harness (Playwright with `--no-sandbox`, per the
   [playwright.md](../../../playwright.md) fallback because `chromium-cli`
   isn't installed in this container).

All paths below are relative to the repo root.

## Prerequisites

This container already has Node 22, Python 3, `npx http-server`, Playwright
globally at `/opt/node22/lib/node_modules/playwright`, and Chromium under
`/opt/pw-browsers`. Nothing to `apt-get install`.

## Setup

No setup. No `npm install`. The repo is self-contained; `vendor/` ships in
git and the app uses no external CDNs at runtime.

## Run (agent path)

The driver is the way you interact with this app from an agent. It starts
no server itself — start one yourself, then call the driver.

```bash
cd /home/user/Nuke-Tracker-

# 1. Start a static server in the background on a free port.
PORT=8101
(npx http-server -p $PORT -s -c-1 . >/tmp/http.log 2>&1 &)
timeout 30 bash -c "until curl -sf http://127.0.0.1:$PORT/index.html >/dev/null; do sleep 0.3; done"

# 2. Drive it: smoke-test + screenshot. Exits 0 if everything's healthy.
node .claude/skills/run-nuke-tracker/driver.mjs \
  --url=http://127.0.0.1:$PORT/index.html \
  --out=/tmp/nuke-tracker.png
```

The driver:

- launches headless Chromium with `--no-sandbox`,
- dismisses the first-load briefing overlay,
- asserts the vector basemap rendered (>100 country paths), ≥21 markers, the
  satellite sidebar is populated, and the intel feed has items,
- writes the screenshot to `--out`,
- prints a single JSON object on stdout and exits 0/1.

Useful flags:

```bash
# Offline mode — block every external request, prove the vendored assets
# + sim fallback work without internet. Run this before pushing any change
# that touches the real-time feeds (USGS, The Space Devs, CelesTrak).
node .claude/skills/run-nuke-tracker/driver.mjs --offline \
  --url=http://127.0.0.1:8101/index.html \
  --out=/tmp/nuke-tracker-offline.png
```

Stop the server when done. `pkill -f` is dangerous (see Gotchas) — use
`fuser`, which targets only the process bound to that port:

```bash
fuser -k 8101/tcp
```

## Inspect the screenshot

Always look at the actual image — the driver's assertions are necessary
but not sufficient.

```bash
ls -la /tmp/nuke-tracker.png   # confirm it was written
```

Open `/tmp/nuke-tracker.png` (your client's Read tool) and confirm the map
shows continent outlines, the green hairline "NAGT" header, the DEFCON
badge, and the live feeds in the lower panels.

## Run (human path)

Same `npx http-server -p 8101 -s -c-1 .` line, then open
`http://127.0.0.1:8101/` in a real browser. Useless headlessly — that's
why the agent path is primary.

## Test

There is no separate test suite. `driver.mjs` is the test. Run it twice
(online + `--offline`) to cover both feed paths.

## Deploy

Push to `main`. The deploy workflow at `.github/workflows/deploy-pages.yml`
publishes the site to the `gh-pages` branch on every push.

**Live:** https://devante88.github.io/Nuke-Tracker-/

## Gotchas

- **Do not run `pkill -f http-server`** or `pgrep -af http-server | xargs
  kill` to clean up. From inside a Bash tool block in this harness, the
  pattern matches the parent shell's own argv (which contains the string
  `http-server`) and kills it — your command aborts with exit 144. Use
  `fuser -k <port>/tcp` instead: it targets only the process bound to that
  port and can't match anything else.

- **`kill $!` doesn't stop the server.** `npx http-server` is a wrapper
  chain: `npm exec` → `sh -c` → `http-server`. Killing the wrapper PID
  leaves the real server running and the port held. Always shut down by
  port (`fuser -k`), not by captured PID.

- **The route filter must match the server's origin exactly.** The
  `--offline` mode aborts every request that isn't to the page's own
  origin. The driver derives the origin from `--url`, so if you change the
  port, do it via `--url=...`, not by editing a hardcoded literal.

- **The first-load briefing overlay is gated by `localStorage`.** Every
  new browser context sees it. The driver clicks `#briefing-enter` to
  dismiss it before measuring; if you write your own driver, do the same
  or your assertions fire while a modal is covering the dashboard.

- **The real-time feeds (USGS earthquakes, The Space Devs launches,
  CelesTrak TLEs) require internet.** When network is up, they populate.
  When down (or under `--offline`), the app falls back to the bundled
  simulated feed and synthetic satellites without throwing. That means
  *the absence of a console error does not prove the live feeds reached
  their servers* — if you need to verify a feed change end-to-end, run
  without `--offline` AND inspect the screenshot AND read
  `state.feedItems` / `state.satRows` from the driver's JSON output.

- **`chromium-cli` is not installed in this container.** The driver uses
  the Playwright `chromium` API directly with `--no-sandbox`, as per the
  fallback paragraph in `examples/playwright.md`. Don't waste time
  looking for the binary.

- **Variable named `URL` shadows the global `URL` constructor.** The
  driver uses `PAGE_URL` for that reason. If you refactor it, don't undo
  this rename.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Driver exits `net::ERR_FAILED` immediately under `--offline` | The route filter blocked the page itself. Confirm `--url` points at the server you actually started, not a hardcoded port. |
| Driver hangs at `waitUntil: load` | The server isn't actually up yet on that port. Re-run the `timeout 30 bash -c 'until curl …'` line — don't skip it. |
| `EADDRINUSE` from `npx http-server` | Old server still running. `fuser -k 8101/tcp` (replace with your port), then re-run. Do NOT `pkill -f` — it kills your shell. |
| `state.feedItems` is 0 | The intel feed didn't render. Either the page errored (check `pageErrors` in the JSON) or you killed the server before the page finished loading. |
| Screenshot is a black map | Leaflet container measured 0px before the basemap drew. Add `await page.waitForTimeout(...)` after `goto`; the driver already does this. |

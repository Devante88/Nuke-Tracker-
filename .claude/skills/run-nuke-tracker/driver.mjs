#!/usr/bin/env node
// Headless smoke + screenshot driver for the Nuke Tracker dashboard.
//
//   node .claude/skills/run-nuke-tracker/driver.mjs            # full run
//   node .claude/skills/run-nuke-tracker/driver.mjs --offline  # block external feeds
//   node .claude/skills/run-nuke-tracker/driver.mjs --url=...  # override PAGE_URL
//   node .claude/skills/run-nuke-tracker/driver.mjs --out=/path/screenshot.png
//
// The app is a static single-page web app (index.html + vendor/) with no
// build step. The driver starts no server itself — the SKILL.md tells you
// to spin one with `npx http-server -p 8100 -s -c-1 .` before calling this.
//
// `chromium-cli` isn't available in this container; we use Playwright's
// chromium with `--no-sandbox` as the playwright.md example's fallback says.

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Playwright is globally installed at /opt/node22/lib/node_modules
const { chromium } = require("/opt/node22/lib/node_modules/playwright/index.js");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const PAGE_URL = args.url || "http://127.0.0.1:8100/index.html";
const OUT = args.out || "/tmp/nuke-tracker.png";
const OFFLINE = !!args.offline;

process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// When --offline, block every request that isn't to the dev server's own
// origin — exercises the fully-vendored-asset path and the sim fallback for
// the real-time feeds.
const LOCAL_ORIGIN = new URL(PAGE_URL).origin;
const blocked = [];
if (OFFLINE) {
  await ctx.route("**/*", (route) => {
    const u = route.request().url();
    if (u.startsWith(LOCAL_ORIGIN) || u.startsWith("data:") || u.startsWith("blob:"))
      return route.continue();
    blocked.push(u);
    return route.abort();
  });
}

const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(PAGE_URL, { waitUntil: "load", timeout: 30000 });
// Dismiss the first-load briefing if it pops up (gated by localStorage).
await page.waitForTimeout(1200);
await page.locator("#briefing-enter").click({ timeout: 1500 }).catch(() => {});
await page.waitForTimeout(2200);

// Smoke assertions — every claim here is something the page MUST satisfy
// or the driver exits non-zero.
const state = await page.evaluate(() => ({
  countryPaths: document.querySelectorAll(".leaflet-overlay-pane path").length,
  markers: document.querySelectorAll(".leaflet-marker-icon").length,
  kpis: {
    warheads: document.querySelector("#kpi-warheads")?.textContent ?? "",
    threats: document.querySelector("#kpi-threats")?.textContent ?? "",
    satellites: document.querySelector("#kpi-satellites")?.textContent ?? "",
  },
  briefingDismissed: !!document.querySelector("#briefing")?.hidden,
  satBtn: document.querySelector("#sat-btn")?.textContent.trim() ?? "",
  satRows: document.querySelectorAll("#sat-tbody tr").length,
  feedItems: document.querySelectorAll("#intel-feed .timeline-item").length,
  // Per-panel data-age stamps: "LIVE · Ns ago" | "SIM" | "OFFLINE" | "RATE-LIMITED"
  stamps: Object.fromEntries([...document.querySelectorAll("[data-stamp]")]
    .map((n) => [n.dataset.stamp, n.textContent])),
}));

await page.screenshot({ path: OUT });

const ok =
  errors.length === 0 &&
  state.countryPaths > 100 &&     // vector basemap rendered
  state.markers >= 21 &&          // at least nations + platforms + bases
  state.satRows > 0 &&
  state.feedItems > 0;

console.log(JSON.stringify({ ok, url: PAGE_URL, offline: OFFLINE, screenshot: OUT,
  pageErrors: errors, blockedExternal: blocked.length, state }, null, 2));

await browser.close();
process.exit(ok ? 0 : 1);

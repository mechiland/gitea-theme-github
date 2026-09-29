#!/usr/bin/env node
// Screenshot + audit runner for Gitea (ours) and github.com (reference).
// See tools/shoot/README.md for usage.
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from './lib/browser.mjs';
import { parseArgs, list, runId } from './lib/args.mjs';
import { PROJECT_ROOT, GITEA_URL, ensureLogin, ensureAppearance, langCookies, giteaVersion } from './lib/gitea.mjs';
import { loadPalette } from './lib/palette.mjs';
import { INIT_SCRIPT, FREEZE_CSS, settle, pageAudit } from './lib/audit.mjs';
import { measureItems, pageMeasure, MEASURE_PROPS } from './lib/measure.mjs';
import { installThemePreview } from './lib/preview.mjs';

const HELP = `usage: node tools/shoot/shoot.mjs --target gitea|github [options]
  --routes <file>        routes file (default tools/shoot/routes.json)
  --only <id,...>        only these route ids
  --schemes light,dark   color schemes (default both)
  --viewports 1440,390   viewport widths (default both)
  --states               also capture interaction states defined per route
  --measure              also dump computed metrics for the measure set
  --measure-only         only measure (no screenshots, no audit)
  --theme <name>         gitea user theme to enforce (default github-auto)
  --out <dir>            output dir (gitea default shots/<run-id>, github default docs/reference)
  --concurrency <n>      parallel captures (default 3 gitea / 2 github)
  --no-audit             skip color/var/icon audit (faster)
  --relogin              discard cached session`;

const args = parseArgs();
if (args.help || args.h) { console.log(HELP); process.exit(0); }
const target = args.target || 'gitea';
if (!['gitea', 'github'].includes(target)) { console.error(HELP); process.exit(2); }
const routesFile = path.resolve(PROJECT_ROOT, args.routes || 'tools/shoot/routes.json');
const cfg = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
const only = list(args.only, null);
const schemes = list(args.schemes, ['light', 'dark']);
const viewports = list(args.viewports, ['1440', '390']).map(Number);
const theme = args.theme && args.theme !== true ? args.theme : (cfg.defaultTheme || 'github-auto');
const measure = !!(args.measure || args['measure-only']);
const measureOnly = !!args['measure-only'];
const doStates = !!args.states;
const doAudit = !args['no-audit'] && !measureOnly;
let previewTheme = null;
const concurrency = Number(args.concurrency) || (target === 'github' ? 2 : 3);
const giteaBase = (cfg.giteaBase || GITEA_URL).replace(/\/$/, '');
const outDir = path.resolve(PROJECT_ROOT, args.out && args.out !== true ? args.out
  : target === 'github' ? 'docs/reference' : `shots/${runId('gitea-' + theme)}`);

let routes = cfg.routes.filter((r) => !only || only.includes(r.id));
if (only) for (const id of only) if (!routes.find((r) => r.id === id)) console.warn(`[shoot] unknown route id: ${id}`);
const skipped = [];
routes = routes.filter((r) => {
  const u = r[target];
  if (u === null || u === undefined) { skipped.push({ id: r.id, reason: `no ${target} url` }); return false; }
  if (typeof u === 'string' && u.includes('{{')) { skipped.push({ id: r.id, reason: 'unfilled placeholder (run routes-from-manifest.mjs)' }); return false; }
  return true;
});

const VIEWPORTS = { 1440: { width: 1440, height: 900, deviceScaleFactor: 1 }, 390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: false, hasTouch: false } };
const vpFor = (w) => VIEWPORTS[w] || { width: w, height: 900, deviceScaleFactor: 1 };

const IGNORED_FAIL = /(gravatar\.com|avatars\.githubusercontent\.com|collector\.github\.com|api\.github\.com\/_private|google-analytics|googletagmanager|doubleclick)/;

async function injectFreeze(page) {
  await page.evaluate((css) => {
    if (document.getElementById('__shoot_freeze')) return;
    const s = document.createElement('style'); s.id = '__shoot_freeze'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }, FREEZE_CSS).catch(() => {});
}

async function dismissCookieBanner(page) {
  // Decline non-essential cookies only. Never accept.
  const clicked = await page.evaluate(() => {
    const scopes = [...document.querySelectorAll('[id*=cookie i], [class*=cookie i], [id*=consent i], [class*=consent i], #ghcc, cookie-consent-banner, [aria-label*=cookie i]')];
    for (const scope of scopes) {
      for (const b of scope.querySelectorAll('button, a[role=button]')) {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
        if (/^(reject|decline|refuse)|reject all|decline all|only (necessary|essential)|necessary only|essential only/i.test(t) && !/accept/i.test(t)) { b.click(); return t; }
      }
    }
    return null;
  }).catch(() => null);
  if (clicked) await page.waitForTimeout(400);
  return clicked;
}

function urlFor(route) {
  const u = route[target];
  if (target === 'github') return u;
  return u.startsWith('http') ? u : giteaBase + u;
}

// Playwright's 'networkidle' never fires on signed-in Gitea pages (the
// notification EventSource / SharedWorker keeps a request open), so we track
// in-flight requests ourselves and ignore long-lived streams.
const LONG_LIVED = /(\/user\/events|eventsource|\/-\/events|websocket|collector\.github\.com|\/_private\/browser\/stats|live-update|alive\.github)/i;
function trackInflight(page) {
  const inflight = new Set();
  page.__lastNet = Date.now();
  const skip = (r) => LONG_LIVED.test(r.url()) || ['eventsource', 'websocket', 'manifest', 'other'].includes(r.resourceType());
  page.on('request', (r) => { if (!skip(r)) { inflight.add(r); page.__lastNet = Date.now(); } });
  const done = (r) => { if (inflight.delete(r)) page.__lastNet = Date.now(); };
  page.on('requestfinished', done); page.on('requestfailed', done);
  page.__inflight = inflight;
}
async function waitReady(page, { idleMs = 500, timeout = 15000 } = {}) {
  const t0 = Date.now();
  if (!page.__inflight) trackInflight(page);
  while (Date.now() - t0 < timeout) {
    if (page.__inflight.size === 0 && Date.now() - page.__lastNet >= idleMs) break;
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
}

function attachLogs(page, log, route) {
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') {
      const loc = m.location();
      log[t === 'error' ? 'consoleErrors' : 'consoleWarnings'].push({ text: m.text().slice(0, 500), url: loc && loc.url ? `${loc.url}:${loc.lineNumber}` : undefined });
    }
  });
  page.on('pageerror', (e) => log.consoleErrors.push({ text: 'pageerror: ' + String(e.message || e).slice(0, 500) }));
  page.on('response', (r) => {
    const st = r.status();
    if (st < 400) return;
    const url = r.url();
    const isMain = r.request().isNavigationRequest() && r.request().frame() === page.mainFrame();
    const entry = { url, status: st, type: r.request().resourceType() };
    if (isMain && route.expectStatus === st) { entry.expected = true; log.expectedFailures.push(entry); return; }
    if (IGNORED_FAIL.test(url)) log.ignoredRequests.push(entry); else log.failedRequests.push(entry);
  });
  page.on('requestfailed', (r) => {
    const url = r.url();
    const f = r.failure(); const text = f ? f.errorText : 'failed';
    if (/ERR_ABORTED/.test(text) && r.resourceType() !== 'stylesheet' && r.resourceType() !== 'script') { log.ignoredRequests.push({ url, failure: text }); return; }
    const entry = { url, failure: text, type: r.resourceType() };
    if (IGNORED_FAIL.test(url)) log.ignoredRequests.push(entry); else log.failedRequests.push(entry);
  });
  page.on('requestfinished', (r) => {
    if (r.resourceType() !== 'stylesheet') return;
    log._pending.push(r.sizes().then((s) => { log.cssBytes += s.responseBodySize; log.cssFiles.push({ url: r.url(), bytes: s.responseBodySize }); }).catch(() => {}));
  });
}

async function newContext(browser, route, scheme, vw, storageState) {
  const vp = vpFor(vw);
  const auth = target === 'gitea' && route.auth !== false;
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor,
    colorScheme: scheme, locale: 'en-US', timezoneId: 'UTC',
    ...(auth ? { storageState } : {}),
  });
  if (target === 'gitea') await ctx.addCookies(langCookies(giteaBase, auth ? undefined : theme));
  if (target === 'gitea' && previewTheme) await installThemePreview(ctx, previewTheme);
  await ctx.addInitScript(INIT_SCRIPT);
  return ctx;
}

async function runStates(browser, route, scheme, vw, storageState, dir) {
  const states = (route.states || []).filter((s) => !s.target || s.target === target);
  // Never submit forms on github.com (external site): submitEmpty is gitea-only.
  const statesDef = states.map((s) => ({ ...s, selector: (s.selectors ? s.selectors[target] : s.selector) }))
    .filter((s) => s.selector && !(target === 'github' && s.action === 'submitEmpty') && (!s.viewports || s.viewports.map(Number).includes(vw)));
  const results = [];
  if (!statesDef.length) return results;
  fs.mkdirSync(path.join(dir, 'states'), { recursive: true });
  for (const st of statesDef) {
    const t0 = Date.now();
    const res = { name: st.name, action: st.action, selector: st.selector, ok: false };
    const ctx = await newContext(browser, route, scheme, vw, storageState);
    const page = await ctx.newPage();
    trackInflight(page);
    try {
      await page.goto(urlFor(route), { waitUntil: 'load', timeout: 45000 });
      await waitReady(page);
      if (target === 'github') await dismissCookieBanner(page);
      await injectFreeze(page);
      await settle(page, 150);
      const loc = page.locator(st.selector).first();
      await loc.waitFor({ state: st.action === 'submitEmpty' ? 'attached' : 'visible', timeout: 8000 });
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      switch (st.action) {
        case 'hover': await loc.hover(); break;
        case 'focus': {
          await page.keyboard.press('Shift');
          await loc.focus();
          let fv = await loc.evaluate((el) => el.matches(':focus-visible'));
          if (!fv) { await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); fv = await loc.evaluate((el) => el.matches(':focus-visible')); }
          res.focusVisible = fv;
          break;
        }
        case 'press': {
          const b = await loc.boundingBox();
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
          await page.mouse.down(); // never released: page is discarded after capture, so no click fires
          break;
        }
        case 'disable': case 'disabled':
          await loc.evaluate((el) => { el.setAttribute('disabled', ''); el.setAttribute('aria-disabled', 'true'); });
          break;
        case 'click': await loc.click(); break;
        case 'submitEmpty': {
          const submit = await loc.evaluateHandle((el, native) => {
            const form = el.tagName === 'FORM' ? el : el.closest('form');
            if (!form) throw new Error('no form for selector');
            if (!native) form.noValidate = true;
            for (const i of form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]), textarea')) i.value = '';
            return form.querySelector('button[type=submit], button:not([type]), input[type=submit]') || form;
          }, !!st.native);
          const nav = page.waitForNavigation({ timeout: 8000 }).catch(() => null);
          await submit.asElement().click();
          await nav;
          await waitReady(page);
          break;
        }
        default: throw new Error(`unknown action ${st.action}`);
      }
      await page.waitForTimeout(st.wait ?? 350);
      await injectFreeze(page);
      await settle(page, 100);
      const base = path.join(dir, 'states', `${scheme}-${vw}-${st.name}`);
      await page.screenshot({ path: base + '.png', animations: 'disabled', caret: 'hide' });
      res.viewportPng = path.relative(outDir, base + '.png');
      const clipSel = (st.clips && st.clips[target]) || st.clip || (st.action === 'submitEmpty' ? null : st.selector);
      if (clipSel) {
        const clipLoc = page.locator(clipSel).filter({ visible: true }).first();
        if (await clipLoc.count()) {
          const bb = await clipLoc.boundingBox();
          if (bb) {
            const pad = st.pad ?? 8;
            const vp = page.viewportSize();
            const x = Math.max(0, bb.x - pad), y = Math.max(0, bb.y - pad);
            const clip = { x, y, width: Math.min(vp.width - x, bb.width + 2 * pad), height: Math.min(vp.height - y, bb.height + 2 * pad) };
            if (clip.width > 0 && clip.height > 0) {
              await page.screenshot({ path: base + '-clip.png', clip, animations: 'disabled', caret: 'hide' });
              res.clipPng = path.relative(outDir, base + '-clip.png');
            }
          }
        } else res.clipMissing = clipSel;
      }
      res.url = page.url();
      res.ok = true;
    } catch (e) {
      res.error = String(e.message || e).split('\n')[0];
      try { await page.screenshot({ path: path.join(dir, 'states', `${scheme}-${vw}-${st.name}-FAILED.png`) }); } catch {}
    }
    res.ms = Date.now() - t0;
    results.push(res);
    await ctx.close();
  }
  return results;
}

async function capture(browser, route, scheme, vw, storageState, palette) {
  const dir = path.join(outDir, route.id);
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  const url = urlFor(route);
  const log = { route: route.id, target, url, scheme, viewport: vw, theme: target === 'gitea' ? theme : null, auth: target === 'gitea' ? route.auth !== false : false,
    consoleErrors: [], consoleWarnings: [], failedRequests: [], expectedFailures: [], ignoredRequests: [], cssBytes: 0, cssFiles: [], _pending: [], problems: [] };
  const ctx = await newContext(browser, route, scheme, vw, storageState);
  const page = await ctx.newPage();
  trackInflight(page);
  attachLogs(page, log, route);
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    log.mainStatus = resp ? resp.status() : null;
    log.finalUrl = page.url();
    await waitReady(page);
    if (target === 'github') log.cookieBanner = await dismissCookieBanner(page);
    const expect = route.expectStatus || 200;
    if (log.mainStatus !== expect) log.problems.push(`main document status ${log.mainStatus} (expected ${expect})`);
    if (target === 'gitea' && route.auth !== false && /\/user\/login/.test(new URL(log.finalUrl).pathname)) log.problems.push('redirected to login (session lost)');
    log.env = await page.evaluate(() => ({ prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, bodyBg: getComputedStyle(document.body).backgroundColor, bodyColor: getComputedStyle(document.body).color, fontFamily: getComputedStyle(document.body).fontFamily }));
    if (!measureOnly) {
      await injectFreeze(page);
      await settle(page);
      const png = path.join(dir, `${scheme}-${vw}.png`);
      await page.screenshot({ path: png, fullPage: true, animations: 'disabled', caret: 'hide' });
      log.png = path.relative(outDir, png);
    }
    if (doAudit) {
      const pal = palette.schemes[scheme] || {};
      const otherPal = palette.schemes[scheme === 'light' ? 'dark' : 'light'] || {};
      Object.assign(log, await page.evaluate(pageAudit, { palette: pal, otherPalette: otherPal, target }));
      if (target === 'gitea' && route.auth !== false && log.signedIn === false) log.problems.push('navbar shows no signed-in avatar');
      if (target === 'gitea' && log.htmlTheme && theme && log.htmlTheme !== theme && route.auth !== false) log.problems.push(`html[data-theme]=${log.htmlTheme}, expected ${theme}`);
      if (target === 'gitea' && /^github-/.test(log.htmlTheme || '') && log.unlayeredGiteaCss && log.unlayeredGiteaCss.length) log.problems.push(`unlayered Gitea index.css link (beats every gh layer): ${log.unlayeredGiteaCss.join(', ')}`);
    }
    if (measure) {
      const items = measureItems(route, target);
      const m = await page.evaluate(pageMeasure, { items, props: MEASURE_PROPS, limit: 3 });
      const mf = path.join(dir, `${scheme}-${vw}.measure.json`);
      fs.writeFileSync(mf, JSON.stringify({ route: route.id, target, url, scheme, viewport: vw, measures: m }, null, 1));
      log.measureJson = path.relative(outDir, mf);
    }
  } catch (e) {
    log.problems.push('capture failed: ' + String(e.message || e).split('\n')[0]);
    try { await page.screenshot({ path: path.join(dir, `${scheme}-${vw}-FAILED.png`) }); } catch {}
  }
  await Promise.all(log._pending); delete log._pending;
  await ctx.close();
  if (doStates && !measureOnly) log.states = await runStates(browser, route, scheme, vw, storageState, dir);
  log.ms = Date.now() - t0;
  if (log.states) for (const s of log.states) if (!s.ok) log.problems.push(`state ${s.name} failed: ${s.error}`);
  fs.writeFileSync(path.join(dir, `${scheme}-${vw}.json`), JSON.stringify(log, null, 1));
  return log;
}

function summarize(logs, meta) {
  const agg = (getList, keyOf) => {
    const m = new Map();
    for (const l of logs) for (const e of getList(l) || []) {
      const k = keyOf(e);
      let a = m.get(k);
      if (!a) m.set(k, (a = { ...e, count: 0, pages: [], samples: [] }));
      a.count += e.count || 1;
      const pid = `${l.route}/${l.scheme}-${l.viewport}`;
      if (!a.pages.includes(pid)) a.pages.push(pid);
      for (const s of e.samples || e.selectors || []) if (a.samples.length < 5 && !a.samples.includes(s)) a.samples.push(s);
    }
    return [...m.values()].map((a) => ({ ...a, pageCount: a.pages.length, pages: a.pages.slice(0, 12) })).sort((x, y) => y.count - x.count);
  };
  const pages = logs.map((l) => ({
    route: l.route, scheme: l.scheme, viewport: l.viewport, url: l.url, png: l.png, json: `${l.route}/${l.scheme}-${l.viewport}.json`,
    mainStatus: l.mainStatus, problems: l.problems, consoleErrors: l.consoleErrors.length, consoleWarnings: l.consoleWarnings.length,
    failedRequests: l.failedRequests.length, unresolvedVars: l.cssVars ? l.cssVars.unresolved.length : null,
    unresolvedVarsLive: l.cssVars ? l.cssVars.unresolved.filter((v) => v.matchedElements > 0).length : null,
    offPaletteDistinct: l.colors ? l.colors.offPaletteDistinct : null, offPaletteTotal: l.colors ? l.colors.offPaletteTotal : null,
    nonOcticonIcons: l.icons ? l.icons.nonOcticon.reduce((s, i) => s + i.count, 0) : null, cls: l.cls ? l.cls.total : null,
    maskedIcons: l.icons && l.icons.masked ? l.icons.masked.reduce((s, i) => s + i.count, 0) : null,
    unlayeredGiteaCss: l.unlayeredGiteaCss ? l.unlayeredGiteaCss.length : null,
    cssBytes: l.cssBytes, htmlTheme: l.htmlTheme, prefersDark: l.env && l.env.prefersDark, bodyBg: l.env && l.env.bodyBg,
    states: l.states ? l.states.map((s) => ({ name: s.name, ok: s.ok, error: s.error })) : undefined,
  }));
  return {
    ...meta,
    totals: {
      pages: logs.length, pagesWithProblems: pages.filter((p) => p.problems.length).length,
      consoleErrors: logs.reduce((s, l) => s + l.consoleErrors.length, 0), failedRequests: logs.reduce((s, l) => s + l.failedRequests.length, 0),
      maxCLS: Math.max(0, ...pages.map((p) => p.cls || 0)),
      nonOcticonIcons: pages.reduce((s, p) => s + (p.nonOcticonIcons || 0), 0), maskedIcons: pages.reduce((s, p) => s + (p.maskedIcons || 0), 0),
      pagesWithUnlayeredGiteaCss: pages.filter((p) => p.unlayeredGiteaCss).length,
    },
    pages,
    offPalette: agg((l) => l.colors && l.colors.offPalette.map((e) => ({ ...e, key: `${l.scheme}|${e.color}`, scheme: l.scheme })), (e) => e.key).slice(0, 100),
    unresolvedVars: agg((l) => l.cssVars && l.cssVars.unresolved, (e) => e.name),
    nonOcticonIcons: agg((l) => l.icons && l.icons.nonOcticon, (e) => e.name),
    maskedIcons: agg((l) => l.icons && l.icons.masked, (e) => e.name),
    consoleErrors: agg((l) => l.consoleErrors.map((e) => ({ text: e.text })), (e) => e.text),
    failedRequests: agg((l) => l.failedRequests.map((e) => ({ url: e.url, status: e.status, failure: e.failure })), (e) => e.url + (e.status || e.failure)),
    skipped,
  };
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launchBrowser();
  let storageState = null; let appearance = null;
  if (target === 'gitea') {
    storageState = await ensureLogin(browser, { force: !!args.relogin });
    appearance = await ensureAppearance(browser, storageState, { theme, lang: 'en-US' });
    previewTheme = appearance.preview || null;
    if (previewTheme) console.error(`[shoot] ${previewTheme} is deployed but not registered yet (needs a Gitea restart): PREVIEW mode — head rewritten like head_style.tmpl`);
    if (appearance.changes.length) console.error(`[shoot] appearance updated: ${JSON.stringify(appearance.changes)}`);
  }
  const palette = doAudit ? await loadPalette(browser) : null;
  const jobs = [];
  for (const r of routes) for (const s of schemes) for (const v of viewports) jobs.push([r, s, v]);
  console.error(`[shoot] ${target}: ${routes.length} routes x ${schemes.length} schemes x ${viewports.length} viewports = ${jobs.length} captures -> ${path.relative(PROJECT_ROOT, outDir)}`);
  const logs = await pool(jobs, concurrency, async ([r, s, v]) => {
    const l = await capture(browser, r, s, v, storageState, palette);
    const flag = l.problems.length ? `PROBLEMS: ${l.problems.join('; ')}` : 'ok';
    console.error(`[shoot] ${r.id} ${s}-${v} ${l.mainStatus} ${l.ms}ms offPalette=${l.colors ? l.colors.offPaletteDistinct : '-'} vars=${l.cssVars ? l.cssVars.unresolved.filter((v) => v.matchedElements > 0).length + '/' + l.cssVars.unresolved.length : '-'} icons=${l.icons ? l.icons.nonOcticon.length : '-'} errors=${l.consoleErrors.length} ${flag}`);
    return l;
  });
  const meta = { target, theme: target === 'gitea' ? theme : null, generated: new Date().toISOString(), outDir: path.relative(PROJECT_ROOT, outDir),
    giteaBase: target === 'gitea' ? giteaBase : null, giteaVersion: target === 'gitea' ? await giteaVersion() : null, browser: browser.version(),
    schemes, viewports, appearance, paletteVersion: palette && palette.version };
  await browser.close();
  // partial runs (--only) into an existing dir (e.g. docs/reference) merge page lists instead of overwriting
  const summaryFile = path.join(outDir, 'summary.json');
  const summary = summarize(logs, meta);
  if (fs.existsSync(summaryFile) && only) { // partial re-run into an existing dir: keep other pages
    try {
      const prev = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
      const keep = (prev.pages || []).filter((p) => !summary.pages.find((q) => q.route === p.route && q.scheme === p.scheme && q.viewport === p.viewport));
      summary.pages = [...keep, ...summary.pages];
      const P = summary.pages;
      summary.totals = { pages: P.length, pagesWithProblems: P.filter((p) => p.problems && p.problems.length).length,
        consoleErrors: P.reduce((a, p) => a + (p.consoleErrors || 0), 0), failedRequests: P.reduce((a, p) => a + (p.failedRequests || 0), 0),
        maxCLS: Math.max(0, ...P.map((p) => p.cls || 0)), mergedWithPreviousRun: true };
      summary.note = 'offPalette/unresolvedVars/nonOcticonIcons/consoleErrors aggregates cover only the latest partial run; per-page numbers are in pages[]';
    } catch {}
  }
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 1));
  console.log(JSON.stringify({ outDir: path.relative(PROJECT_ROOT, outDir), summary: path.relative(PROJECT_ROOT, summaryFile), totals: summary.totals, skipped }, null, 1));
  process.exit(logs.some((l) => l.problems.some((p) => p.startsWith('capture failed') || p.includes('session lost'))) ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });

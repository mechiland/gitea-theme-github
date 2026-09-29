#!/usr/bin/env node
// Functional smoke test of core Gitea flows with a theme applied.
// ALL writes happen only in the seeded repo (default octo-org/theme-playground);
// pre-existing repos (admin/jiri, ai/jiri, anything in docs/baseline-pre-seed.json) are refused.
//
// usage: node tools/shoot/smoke.mjs [--theme github-auto] [--alt-theme gitea-auto] [--repo octo-org/theme-playground]
//                                    [--scheme light|dark] [--viewport 1440] [--out shots/smoke-<ts>] [--strict-seed] [--headed]
// Output: one JSON object on stdout {theme, repo, ok, steps:[{step, ok, ms, error, url, screenshot}], consoleErrors}
// Exit: 0 all ok (or skipped because the seed is missing; 3 with --strict-seed), 1 on any failed step.
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from './lib/browser.mjs';
import { parseArgs, runId } from './lib/args.mjs';
import { PROJECT_ROOT, GITEA_URL, ADMIN_USER, ADMIN_PASS, ensureLogin, ensureAppearance, langCookies } from './lib/gitea.mjs';
import { installThemePreview } from './lib/preview.mjs';

const args = parseArgs();
const theme = args.theme && args.theme !== true ? args.theme : 'github-auto';
const altTheme = args['alt-theme'] && args['alt-theme'] !== true ? args['alt-theme'] : (theme === 'gitea-auto' ? 'gitea-light' : 'gitea-auto');
const repo = args.repo && args.repo !== true ? args.repo : 'octo-org/theme-playground';
const scheme = args.scheme || 'light';
const vw = Number(args.viewport) || 1440;
const outDir = path.resolve(PROJECT_ROOT, args.out && args.out !== true ? args.out : `shots/${runId('smoke-' + theme)}`);
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const R = `${GITEA_URL}/${repo}`;
const AUTH = 'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

// ---- safety: never write into pre-existing repos ----
const protectedRepos = new Set(['admin/jiri', 'ai/jiri']);
try { for (const r of JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'docs/baseline-pre-seed.json'), 'utf8')).repos || []) protectedRepos.add(r); } catch {}
if (protectedRepos.has(repo)) { console.error(`refusing to write into protected repo ${repo}`); process.exit(2); }

async function api(method, p, body) {
  const r = await fetch(`${GITEA_URL}/api/v1${p}`, { method, headers: { Authorization: AUTH, 'Content-Type': 'application/json', Accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}

const result = { theme, altTheme, repo, scheme, viewport: vw, started: new Date().toISOString(), outDir: path.relative(PROJECT_ROOT, outDir), ok: true, steps: [], consoleErrors: [] };
const finish = (code) => { result.finished = new Date().toISOString(); console.log(JSON.stringify(result, null, 1)); process.exit(code); };

const repoInfo = await api('GET', `/repos/${repo}`);
if (repoInfo.status !== 200) {
  console.error(`SKIPPED: seed missing (${repo} returned HTTP ${repoInfo.status}; run the seeder first)`);
  result.ok = null; result.skipped = 'seed missing';
  finish(args['strict-seed'] ? 3 : 0);
}
const defaultBranch = repoInfo.json.default_branch || 'main';

fs.mkdirSync(outDir, { recursive: true });
const browser = await launchBrowser({ headless: !args.headed });
let page; let currentStep = 'setup';
const state = {};
let aborted = false;

async function step(name, fn, { always = false } = {}) {
  if (aborted && !always) { result.steps.push({ step: name, ok: null, ms: 0, error: 'skipped (earlier step failed)' }); return; }
  currentStep = name;
  const t0 = Date.now();
  const rec = { step: name, ok: false, ms: 0 };
  try {
    const extra = await fn();
    if (extra && typeof extra === 'object') Object.assign(rec, extra);
    rec.ok = true;
  } catch (e) {
    rec.error = String(e && e.message || e).split('\n').slice(0, 3).join(' | ');
    result.ok = false;
    if (!always) aborted = true;
    if (page) { const f = path.join(outDir, `FAILED-${name}.png`); try { await page.screenshot({ path: f, fullPage: true }); rec.screenshot = path.relative(PROJECT_ROOT, f); } catch {} }
  }
  rec.ms = Date.now() - t0;
  if (page) rec.url = page.url();
  result.steps.push(rec);
  console.error(`[smoke] ${rec.ok ? 'ok  ' : 'FAIL'} ${name} ${rec.ms}ms${rec.error ? ' — ' + rec.error : ''}`);
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const flashOk = async () => page.locator('.flash-success, .ui.positive.message').first().waitFor({ state: 'visible', timeout: 10000 });

try {
  const storage = await ensureLogin(browser);
  const ctx = await browser.newContext({ storageState: storage, viewport: { width: vw, height: 900 }, colorScheme: scheme, locale: 'en-US' });
  await ctx.addCookies(langCookies());
  page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('console', (m) => { if (m.type() === 'error') result.consoleErrors.push({ step: currentStep, text: m.text().slice(0, 400) }); });
  page.on('pageerror', (e) => result.consoleErrors.push({ step: currentStep, text: 'pageerror: ' + String(e.message || e).slice(0, 400) }));

  await step('apply-theme', async () => {
    const a = await ensureAppearance(browser, storage, { theme });
    if (a.preview) await installThemePreview(ctx, a.preview); // theme deployed but not registered yet
    await page.goto(R);
    const t = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(t === theme, `html[data-theme]=${t}, expected ${theme}`);
    return { changes: a.changes };
  });

  await step('create-issue', async () => {
    state.issueTitle = `Smoke issue ${ts}`;
    await page.goto(`${R}/issues/new`);
    await page.fill('#issue_title', state.issueTitle);
    await page.locator('#new-issue textarea[name=content]').fill(`Created by tools/shoot/smoke.mjs at ${ts}.`);
    await Promise.all([page.waitForURL(/\/issues\/\d+$/, { timeout: 20000 }), page.locator('#new-issue button.ui.primary.button').first().click()]);
    state.issueUrl = page.url();
    await page.locator('#issue-title, .issue-title').filter({ hasText: state.issueTitle }).first().waitFor();
    return { issue: state.issueUrl };
  });

  await step('comment', async () => {
    const text = `Smoke comment ${ts}`;
    await page.locator('#comment-form textarea[name=content]').fill(text);
    await page.click('#comment-button');
    await page.locator('.timeline-item.comment .render-content, .timeline-item.comment .markup').filter({ hasText: text }).first().waitFor({ timeout: 15000 });
  });

  await step('add-label', async () => {
    const combo = page.locator('.issue-sidebar-combo[data-update-url*="/issues/labels"]');
    let items = combo.locator('.menu .item[data-value]');
    if ((await items.count()) === 0) {
      const r = await api('POST', `/repos/${repo}/labels`, { name: 'smoke-test', color: '#0969da', description: 'created by smoke.mjs' });
      expect(r.status === 201 || r.status === 409 || r.status === 422, `could not create label in seeded repo: HTTP ${r.status}`);
      await page.reload();
      items = combo.locator('.menu .item[data-value]');
    }
    expect((await items.count()) > 0, 'no labels available in seeded repo');
    await page.locator('.issue-sidebar-combo[data-update-url*="/issues/labels"] > .ui.dropdown').click();
    const item = combo.locator('.menu .item[data-value]:not(.checked)').first();
    const labelName = (await item.innerText()).trim().split('\n')[0];
    await item.click();
    const resp = page.waitForResponse((r) => r.url().includes('/issues/labels') && r.request().method() === 'POST', { timeout: 15000 });
    await page.locator('#issue-title, .issue-title').first().click(); // click away -> dropdown hides -> backend update
    const r = await resp;
    expect(r.ok(), `label update HTTP ${r.status()}`);
    await page.waitForLoadState('load');
    await combo.locator('.ui.list .item').filter({ hasText: labelName }).first().waitFor({ timeout: 15000 });
    return { label: labelName };
  });

  await step('edit-file-new-branch', async () => {
    const tree = await api('GET', `/repos/${repo}/contents?ref=${encodeURIComponent(defaultBranch)}`);
    const files = (tree.json || []).filter((f) => f.type === 'file');
    const file = (files.find((f) => /^readme(\.md)?$/i.test(f.name)) || files.find((f) => /\.(md|txt)$/i.test(f.name)) || files[0]);
    expect(file, 'seeded repo has no file at the root to edit');
    state.branch = `smoke-${ts}`;
    await page.goto(`${R}/_edit/${encodeURIComponent(defaultBranch)}/${file.path.split('/').map(encodeURIComponent).join('/')}`);
    const line = `Smoke edit ${ts}`;
    const monaco = page.locator('.cm-editor .cm-content, .monaco-editor').first(); // 1.27 uses CodeMirror 6
    await monaco.waitFor({ timeout: 20000 });
    await monaco.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.press('End');
    await page.keyboard.type(`\n${line}\n`);
    let synced = await page.evaluate((l) => document.querySelector('#edit_area').value.includes(l), line);
    if (!synced) { // fallback: write the hidden textarea directly (what the code editor would sync)
      await page.evaluate((l) => { const t = document.querySelector('#edit_area'); t.value += `\n${l}\n`; }, line);
      synced = 'fallback';
    }
    await page.fill('input[name=commit_summary]', `Smoke edit ${ts}`);
    await page.check('input[name=commit_choice][value=commit-to-new-branch]', { force: true });
    await page.locator('input[name=new_branch_name]').fill(state.branch);
    await Promise.all([page.waitForURL(/\/compare\//, { timeout: 30000 }), page.click('#commit-button')]);
    return { file: file.path, branch: state.branch, editorSync: synced };
  });

  await step('open-pr', async () => {
    const toggle = page.locator('.pullrequest-form-toggle .show-panel');
    if (await toggle.isVisible().catch(() => false)) await toggle.click();
    const title = page.locator('.pullrequest-form #issue_title');
    await title.waitFor();
    state.prTitle = `Smoke PR ${ts}`;
    await title.fill(state.prTitle);
    await Promise.all([page.waitForURL(/\/pulls\/\d+$/, { timeout: 30000 }), page.locator('.pullrequest-form #new-issue button.ui.primary.button').first().click()]);
    state.prUrl = page.url();
    await page.locator('#issue-title, .issue-title').filter({ hasText: state.prTitle }).first().waitFor();
    return { pr: state.prUrl };
  });

  await step('merge-pr', async () => {
    const btn = page.locator('#pull-request-merge-form .merge-button > button.ui.button');
    for (let i = 0; i < 15 && !(await btn.isVisible().catch(() => false)); i++) { await page.waitForTimeout(2000); await page.reload(); }
    await btn.click();
    const submit = page.locator('#pull-request-merge-form form button[type=submit][name=do]');
    await submit.waitFor();
    await submit.click();
    await page.locator('.issue-state-label.purple, .issue-state-label').filter({ hasText: /merged/i }).first().waitFor({ timeout: 30000 });
  });

  await step('change-repo-setting', async () => {
    await page.goto(`${R}/settings`);
    const form = page.locator('form:has(input[name=action][value=update])').first();
    const desc = form.locator('#description');
    state.origDescription = await desc.inputValue();
    const next = `Theme playground — smoke ${ts}`;
    await desc.fill(next);
    await Promise.all([page.waitForLoadState('load'), form.locator('button.ui.primary.button').first().click()]);
    await flashOk();
    expect((await page.locator('#description').inputValue()) === next, 'description not persisted');
    // restore original description
    await page.locator('#description').fill(state.origDescription);
    await Promise.all([page.waitForLoadState('load'), page.locator('form:has(input[name=action][value=update]) button.ui.primary.button').first().click()]);
    await flashOk();
    expect((await page.locator('#description').inputValue()) === state.origDescription, 'description not restored');
  });

  const switchTheme = async (to) => {
    await page.goto(`${GITEA_URL}/user/settings/appearance`);
    const form = page.locator('form[action$="/theme"]');
    await form.locator('.ui.selection.dropdown').click();
    await form.locator(`.menu .item[data-value="${to}"]`).click();
    await Promise.all([page.waitForURL(/\/user\/settings\/appearance/), form.locator('button.ui.primary.button').click()]);
    await flashOk();
    const t = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(t === to, `after switching, html[data-theme]=${t}, expected ${to}`);
  };
  await step('switch-theme-alt', async () => { await switchTheme(altTheme); });
  await step('switch-theme-back', async () => { await switchTheme(theme); }, { always: true });

  await step('screenshot-final', async () => {
    await page.goto(state.prUrl || state.issueUrl || R);
    const f = path.join(outDir, 'final.png');
    await page.screenshot({ path: f, fullPage: true });
    return { screenshot: path.relative(PROJECT_ROOT, f) };
  }, { always: true });

  await step('no-console-errors', async () => {
    expect(result.consoleErrors.length === 0, `${result.consoleErrors.length} console error(s): ${result.consoleErrors.slice(0, 3).map((e) => `[${e.step}] ${e.text}`).join(' ; ')}`);
  }, { always: true });
  await ctx.close();
} catch (e) {
  result.ok = false; result.fatal = String(e && e.message || e);
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'smoke.json'), JSON.stringify(result, null, 1));
finish(result.ok ? 0 : 1);

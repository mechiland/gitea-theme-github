// Disposable compatibility test: build once, run this against the exact same tarball on each Gitea version.
// It creates its own database/users/repos and always removes its container and data. Never uses a live instance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {launchBrowser} from '../shoot/lib/browser.mjs';
import {GITEA_VERSIONS} from '../../build/gitea-versions.mjs';

const option = name => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const version = option('version');
assert.ok(GITEA_VERSIONS.includes(version), `--version must be one of ${GITEA_VERSIONS.join(', ')}`);
const archive = path.resolve(option('package') || '');
assert.ok(fs.statSync(archive).isFile(), '--package must name the built .tar.gz');
const out = path.resolve(option('out') || `shots/compat/${version}`);
fs.mkdirSync(out, {recursive: true});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gitea-theme-compat-'));
const data = path.join(tmp, 'data'), custom = path.join(data, 'gitea');
const container = `github-theme-${version.replaceAll('.', '-')}-${crypto.randomBytes(4).toString('hex')}`;
const docker = (...args) => execFileSync('docker', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024});
const admin = 'compat-admin', force = 'compat-force', password = 'Compatibility-Test-123!';
const result = {version, packageSha256: crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex'), checks: [], ok: false};
let browser, started = false, lastPage;
const check = (name, details = {}) => { result.checks.push({name, ...details}); console.log(`✓ ${version}: ${name}`); };
const listener = net.createServer();
await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;

async function api(method, route, body, user = admin) {
  const response = await fetch(`${base}/api/v1${route}`, {method,
    headers: {Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`, 'Content-Type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body)});
  const text = await response.text();
  assert.ok(response.ok, `${method} ${route}: ${response.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function login(page, user = admin) {
  await page.goto(`${base}/user/login`);
  await page.locator('#user_name').fill(user);
  await page.locator('#password').fill(password);
  await page.locator('form button.primary').click();
  await page.waitForURL(url => url.pathname !== '/user/login');
}

async function forcedNavbar(theme) {
  await api('PATCH', `/admin/users/${force}`, {must_change_password: false});
  await api('PATCH', '/user/settings', {theme}, force);
  await api('PATCH', `/admin/users/${force}`, {must_change_password: true});
  const ctx = await browser.newContext({locale: 'en-US'});
  try {
    const page = lastPage = await ctx.newPage();
    await login(page, force);
    assert.ok(page.url().includes('/user/settings/change_password'), 'must reach forced-password page');
    const trigger = page.locator('#navbar .user-menu').locator('..').locator(':scope > span').first();
    const html = await trigger.evaluate(el => el.outerHTML.replace(/\s+/g, ' ').trim());
    if (theme.startsWith('github-')) {
      assert.ok(await trigger.evaluate(el => el.classList.contains('flex-text-block')), 'GitHub forced-password avatar must use flex-text-block');
      assert.equal(await trigger.locator('.tw-mr-1').count(), 0, 'flex gap replaces the old avatar margin');
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({width, height: 900});
      await page.screenshot({path: path.join(out, `forced-password-${theme}-${width}.png`)});
    }
    return html;
  } finally { await ctx.close(); }
}

try {
  fs.mkdirSync(path.join(custom, 'conf'), {recursive: true});
  execFileSync('tar', ['-xzf', archive, '-C', custom]);
  // Start with upstream templates to capture the native forced-password navbar for this exact version.
  fs.renameSync(path.join(custom, 'templates'), path.join(custom, 'templates-package'));
  fs.writeFileSync(path.join(custom, 'conf/app.ini'), `APP_NAME = Compatibility test\nRUN_MODE = prod
[database]
DB_TYPE = sqlite3
PATH = /data/gitea/gitea.db
[repository]
ROOT = /data/git/repositories
[server]
APP_DATA_PATH = /data/gitea
ROOT_URL = ${base}/
DISABLE_SSH = true
OFFLINE_MODE = true
[security]
INSTALL_LOCK = true
SECRET_KEY = ${crypto.randomBytes(32).toString('hex')}
[service]
DISABLE_REGISTRATION = true
[mailer]
ENABLED = false
[cron]
ENABLED = false
[ui]
THEMES = gitea-auto,gitea-light,gitea-dark,github-auto,github-light,github-dark
DEFAULT_THEME = github-auto
[log]
MODE = console
LEVEL = Warn
`);
  docker('run', '-d', '--name', container, '--label', 'purpose=gitea-theme-compatibility', '-p', `127.0.0.1:${port}:3000`, '-v', `${data}:/data`, `docker.gitea.com/gitea:${version}`);
  started = true;
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch(`${base}/api/v1/version`, {signal: AbortSignal.timeout(2000)});
      if (response.ok) { assert.equal((await response.json()).version, version); ready = true; break; }
    } catch { /* Startup and database migrations are still in progress. */ }
    await delay(500);
  }
  assert.ok(ready, 'Gitea did not become ready');
  docker('exec', '-u', 'git', container, 'gitea', 'admin', 'user', 'create', '--username', admin, '--password', password, '--email', 'admin@example.invalid', '--admin', '--must-change-password=false', '--config', '/data/gitea/conf/app.ini');
  await api('POST', '/admin/users', {username: force, password, email: 'force@example.invalid', must_change_password: false});
  const repo = `${admin}/showcase`, repoApi = `/repos/${repo}`;
  await api('POST', '/user/repos', {name: 'showcase', auto_init: true, default_branch: 'main'});
  const readme = '# Compatibility\n\n```go\nfmt.Println("compatibility")\n```\n\n```mermaid\ngraph LR\nA-->B\n```\n';
  for (const [file, text] of [['.editorconfig', 'root = true\n[*]\nindent_style = space\nindent_size = 4\n'], ['src/main.go', 'package main\n\nfunc main() {}\n'], ['GUIDE.md', readme]]) {
    await api('POST', `${repoApi}/contents/${file}`, {content: Buffer.from(text).toString('base64'), message: `Add ${file}`});
  }
  const issue = await api('POST', `${repoApi}/issues`, {title: 'Compatibility issue', body: readme});
  await api('POST', `${repoApi}/branches`, {new_branch_name: 'feature', old_branch_name: 'main'});
  let commit;
  for (const file of ['feature-one.txt', 'feature-two.txt']) commit = await api('POST', `${repoApi}/contents/${file}`, {branch: 'feature', content: Buffer.from(file).toString('base64'), message: `Add ${file}`});
  const pr = await api('POST', `${repoApi}/pulls`, {head: 'feature', base: 'main', title: 'Compatibility pull', body: readme});
  await api('POST', `${repoApi}/wiki/new`, {title: 'Home', content_base64: Buffer.from(readme).toString('base64')});
  browser = await launchBrowser();
  const nativeBefore = await forcedNavbar('gitea-auto');
  // The image chowns /data to git at startup; the host runner no longer owns this directory on Linux.
  docker('exec', '-u', 'git', container, 'mv', '/data/gitea/templates-package', '/data/gitea/templates');
  docker('exec', '-u', 'git', container, 'gitea', 'manager', 'reload-templates', '--config', '/data/gitea/conf/app.ini');
  assert.equal(await forcedNavbar('gitea-auto'), nativeBefore, 'the package must preserve this version’s native forced-password navbar');
  await forcedNavbar('github-auto');
  check('native navbar preserved; GitHub forced-password layout at 1440 and 390px');

  const ctx = await browser.newContext({locale: 'en-US', permissions: ['clipboard-read', 'clipboard-write']});
  const page = lastPage = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await login(page);
  const routes = ['/', '/user/settings', '/user/settings/appearance', '/user/settings/keys', `/${repo}`, `/${repo}/src/branch/main/src`,
    `/${repo}/src/branch/main/src/main.go`, `/${repo}/src/branch/main/GUIDE.md`, `/${repo}/blame/branch/main/src/main.go`, `/${repo}/commits/branch/main`,
    `/${repo}/issues`, `/${repo}/issues/${issue.number}`, `/${repo}/pulls/${pr.number}`, `/${repo}/pulls/${pr.number}/commits`,
    `/${repo}/pulls/${pr.number}/commits/${commit.commit.sha}`, `/${repo}/pulls/${pr.number}/files?style=unified`, `/${repo}/pulls/${pr.number}/files?style=split`, `/${repo}/wiki/Home`, `/${repo}/settings`];
  if (!version.startsWith('1.')) routes.push('/user/settings/audit_logs', '/-/admin/monitor/audit_logs', `/${repo}/actions/job_queue`);
  for (const theme of ['github-auto', 'gitea-auto']) {
    await api('PATCH', '/user/settings', {theme});
    for (const scheme of ['light', 'dark']) for (const width of [1440, 390]) {
      await page.emulateMedia({colorScheme: scheme});
      await page.setViewportSize({width, height: 900});
      for (const route of routes) {
        const response = await page.goto(base + route, {waitUntil: 'load'});
        assert.equal(response.status(), 200, `${theme} ${route}`);
        assert.ok(!page.url().includes('/user/login'), `${route}: unexpected sign-in redirect`);
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        if (theme.startsWith('github-')) {
          await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
          // Gitea's overflow-menu waits for ResizeObserver and throttles updates by 100ms.
          // Check the settled layout; persistent overflow still fails the assertion below.
          await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 2, null, {timeout: 3000}).catch(() => {});
          const metrics = await page.evaluate(() => ({overflow: document.documentElement.scrollWidth > innerWidth + 2,
            unlayered: [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href.includes('/assets/css/index.') && l.media !== 'not all')}));
          assert.equal(metrics.unlayered, false, `unlayered Gitea CSS: ${route}`);
          assert.equal(metrics.overflow, false, `horizontal overflow at ${width}: ${route}`);
        }
      }
      check(`${theme} ${scheme} ${width}px`, {pages: routes.length});
    }
  }
  for (const theme of ['github-light', 'github-dark']) {
    await api('PATCH', '/user/settings', {theme});
    await page.goto(`${base}/${repo}/src/branch/main/GUIDE.md`);
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
  }
  await page.locator('.mermaid-block iframe').waitFor({state: 'visible'});
  await page.evaluate(() => navigator.clipboard.writeText(''));
  await page.locator('.code-copy').first().click();
  await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes('fmt.Println'));
  check('fixed themes, Mermaid and code copy');
  assert.deepEqual(errors, [], 'browser JavaScript errors');
  result.ok = true;
} catch (error) {
  result.error = error.stack;
  if (lastPage && !lastPage.isClosed()) await lastPage.screenshot({path: path.join(out, 'failed.png'), fullPage: true}).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (started) {
    fs.writeFileSync(path.join(out, 'server.log'), docker('logs', container));
    // Restore ownership of disposable bind-mounted data before removing it on Linux CI hosts.
    if (process.getuid) { try { docker('exec', '-u', '0', container, 'chown', '-R', `${process.getuid()}:${process.getgid()}`, '/data'); } catch {} }
    docker('rm', '-f', container);
  }
  fs.rmSync(tmp, {recursive: true, force: true});
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(result, null, 2));
}

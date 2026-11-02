import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';

export const OWNER = 'visual-owner';
export const PASSWORD = 'visual-fixture-password-2026'; // Disposable, loopback-only test instances.
export const REPO = `/${OWNER}/theme-playground`;
const DATE = '2026-01-01T00:00:00Z';
const identity = {name: 'Visual Owner', email: 'owner@example.invalid'};
const commit = {author: identity, committer: identity, dates: {author: DATE, committer: DATE}};
const docker = (...args) => execFileSync('docker', args, {encoding: 'utf8'}).trim();

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

export async function startGitea({version, label, packageDir, directory, servers}) {
  const data = path.join(directory, label, 'data');
  const custom = path.join(data, 'gitea');
  fs.mkdirSync(path.join(custom, 'conf'), {recursive: true});
  for (const folder of ['public', 'templates']) fs.cpSync(path.join(packageDir, folder), path.join(custom, folder), {recursive: true});
  const url = `http://127.0.0.1:${await freePort()}`;
  fs.writeFileSync(path.join(custom, 'conf/app.ini'), `APP_NAME = Theme visual tests
RUN_MODE = prod
[database]
DB_TYPE = sqlite3
PATH = /data/gitea/gitea.db
[repository]
ROOT = /data/git/repositories
DEFAULT_BRANCH = main
[server]
APP_DATA_PATH = /data/gitea
ROOT_URL = ${url}/
DISABLE_SSH = true
OFFLINE_MODE = true
[security]
INSTALL_LOCK = true
SECRET_KEY = ${randomBytes(32).toString('hex')}
[service]
DISABLE_REGISTRATION = true
[mailer]
ENABLED = false
[cron]
ENABLED = false
[actions]
ENABLED = false
[ui]
THEMES = gitea-auto,github-auto,github-light,github-dark
DEFAULT_THEME = github-auto
[other]
SHOW_FOOTER_TEMPLATE_LOAD_TIME = false
[log]
MODE = console
LEVEL = Warn
`);
  const name = `theme-visual-${label}-${randomBytes(5).toString('hex')}`;
  console.log(`Starting Gitea ${version} (${label}) at ${url}`);
  docker('run', '-d', '--name', name, '--label', 'purpose=gitea-theme-visual-ci',
    '-e', `USER_UID=${process.getuid?.() || 1000}`, '-e', 'USER_GID=1000',
    '-p', `127.0.0.1:${new URL(url).port}:3000`,
    '--mount', `type=bind,src=${data},dst=/data`, `docker.gitea.com/gitea:${version}`);
  const server = {name, url, data, label};
  servers.push(server); // Cleanup also runs when readiness or seeding fails.
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(`${url}/api/v1/version`, {signal: AbortSignal.timeout(2000)});
      if (response.ok && (await response.json()).version === version) { ready = true; break; }
    } catch { /* Gitea is initializing its own disposable database. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`Gitea ${version} (${label}) did not become ready`);
  docker('exec', '--user', 'git', name, 'gitea', 'admin', 'user', 'create',
    '--config', '/data/gitea/conf/app.ini', '--username', OWNER, '--password', PASSWORD,
    '--email', identity.email, '--admin', '--must-change-password=false');
  await seed(server);
  return server;
}

async function seed({url, name}) {
  const flush = () => docker('exec', '--user', 'git', name, 'gitea', 'manager', 'flush-queues', '--config', '/data/gitea/conf/app.ini', '--timeout', '10s');
  async function api(method, route, body, user = OWNER) {
    const response = await fetch(`${url}/api/v1${route}`, {
      method,
      headers: {authorization: `Basic ${Buffer.from(`${user}:${PASSWORD}`).toString('base64')}`, 'content-type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${(await response.text()).slice(0, 400)}`);
    return response.status === 204 ? null : response.json();
  }
  await api('POST', '/admin/users', {username: 'visual-reviewer', full_name: 'Visual Reviewer', email: 'reviewer@example.invalid', password: PASSWORD, must_change_password: false});
  await api('POST', '/user/repos', {name: 'theme-playground', description: 'A small repository for visual regression tests.', private: false, auto_init: false, default_branch: 'main'});
  const colors = 'package colors\n\nfunc Palette() []string {\n\treturn []string{\n\t\t"default",\n\t\t"muted",\n\t}\n}\n';
  const layout = 'export const spacing = {\n  small: 4,\n  medium: 8,\n};\n';
  const readme = '# Theme playground\n\nA stable fixture for GitHub theme visual tests.\n\n## Components\n\n- Buttons, navigation and repository files\n- Issue comments and pull request reviews\n\n| Theme | Schemes |\n| --- | --- |\n| GitHub | Light and dark |\n\n> [!NOTE]\n> Review menus must remain visible outside their thread.\n';
  const repo = `/repos${REPO}`;
  await api('POST', `${repo}/contents`, {...commit, branch: 'main', message: 'Add visual fixtures', files: Object.entries({'README.md': readme, 'src/colors.go': colors, 'src/layout.ts': layout}).map(([file, content]) => ({operation: 'create', path: file, content: Buffer.from(content).toString('base64')}))});
  const label = await api('POST', `${repo}/labels`, {name: 'bug', color: 'd73a4a', description: 'Something is not working'});
  await api('POST', `${repo}/issues`, {title: 'Keep review menus fully visible', body: 'Comment menus should extend beyond the review thread.\n\n- [x] Desktop\n- [ ] Mobile\n\n```css\n.review-thread { overflow: visible; }\n```', labels: [label.id]});
  await api('POST', `${repo}/issues/1/comments`, {body: 'Please check light and dark themes, including the last menu item.'}, 'visual-reviewer');
  for (const [file, content] of [['src/colors.go', colors.replace('"muted",', '"accent",\n\t\t"success",')], ['src/layout.ts', layout.replace('small: 4', 'small: 8')]]) {
    const previous = await api('GET', `${repo}/contents/${file}?ref=main`);
    await api('PUT', `${repo}/contents/${file}`, {...commit, branch: file.endsWith('.go') ? 'main' : 'review-menu', ...(file.endsWith('.go') ? {new_branch: 'review-menu'} : {}), sha: previous.sha, message: `Update ${file}`, content: Buffer.from(content).toString('base64')});
  }
  // Finish push hooks before creating the PR, so a late hook cannot add an extra timeline event.
  flush();
  await api('POST', `${repo}/pulls`, {base: 'main', head: 'review-menu', title: 'Refine palette and spacing', body: 'Keep the thread actions usable in every diff view.'});
  await api('POST', `${repo}/pulls/2/reviews`, {event: 'COMMENT', body: 'A couple of small review comments.', comments: [
    {path: 'src/colors.go', new_position: 6, body: 'Could we sort these colors alphabetically?'},
    {path: 'src/layout.ts', new_position: 2, body: 'Please keep the spacing scale consistent.'},
  ]}, 'visual-reviewer');
  flush();
}

export async function login(browser, server, directory, label) {
  const context = await browser.newContext({locale: 'en-US'});
  await context.addCookies([{name: 'lang', value: 'en-US', domain: new URL(server.url).hostname, path: '/'}]);
  try {
    const page = await context.newPage();
    await page.goto(`${server.url}/user/login`, {waitUntil: 'load'});
    await page.fill('#user_name', OWNER);
    await page.fill('#password', PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/user/login')),
      page.locator('form.ui.form button.ui.primary.button').first().click(),
    ]);
    const storageState = path.join(directory, `${label}-session.json`);
    await context.storageState({path: storageState});
    return {url: server.url, storageState};
  } finally { await context.close(); }
}

export function cleanup(servers, output) {
  for (const server of servers.reverse()) {
    try {
      const logs = spawnSync('docker', ['logs', server.name], {encoding: 'utf8'});
      fs.writeFileSync(path.join(output, `${server.label}.log`), (logs.stdout || '') + (logs.stderr || ''));
    } catch { /* Preserve the original failure. */ }
    try { docker('rm', '-f', server.name); } catch (error) { console.error(`Could not remove test container ${server.name}: ${error.message}`); }
  }
}

#!/usr/bin/env node
// Idempotent seed script for the local Gitea used to develop the GitHub-lookalike theme.
//
//   node tools/seed/seed.mjs                # full run
//   node tools/seed/seed.mjs --skip-migrations
//   node tools/seed/seed.mjs --only=manifest # rebuild docs/seed-manifest.json only
//
// Node 24, no npm dependencies. See tools/seed/README.md.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as C from './content.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const TOKEN_FILE = path.join(HERE, '.token');
const MANIFEST_FILE = path.join(ROOT, 'docs', 'seed-manifest.json');

const BASE = (process.env.GITEA_URL || 'http://localhost:3000').replace(/\/$/, '');
const API = `${BASE}/api/v1`;
const ADMIN_USER = process.env.GITEA_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.GITEA_ADMIN_PASS || '11111111';
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD || 'seed-pass-2026';
const TOKEN_NAME = 'theme-seed';
const MARK = '<!-- theme-seed -->';
const ORG = 'octo-org';
const ORG2 = 'pixel-guild';
const PLAY = 'theme-playground';
const PLAY_FULL = `${ORG}/${PLAY}`;
const PLAY_DESCRIPTION = 'Markdown, diff and CI showcase';
const ORG_SPECS = {
  [ORG]: { full_name: 'Octo Org', description: 'Design tokens, themes and small developer tools.', website: 'https://example.com/octo-org', location: 'The Internet' },
  [ORG2]: { full_name: 'Pixel Guild', description: 'Pixel art tools, sprites and tiny games.', website: '', location: 'Remote' },
};

const ARGS = new Set(process.argv.slice(2));
const SKIP_MIGRATIONS = ARGS.has('--skip-migrations');
const ONLY_MANIFEST = ARGS.has('--only=manifest');
const ONLY_TIDY = ARGS.has('--only=tidy');

// How seeded objects are recognised: docs/seed-manifest.json (machine-readable inventory) and, only where it
// is invisible, the HTML comment MARK at the end of issue/PR/release bodies. Nothing visible (descriptions,
// topics, bios, READMEs, titles) carries a seed marker. Older runs did; these are the markers they used, and
// the steps below remove them from existing instances.
const LEGACY_TOPICS = ['theme-seed', 'migrated-from-github'];
const cleanDescription = (d = '') => d.replace(/^\[seed\]\s*/, '').replace(/\s*\(migrated from github\.com\/[^)]*\)$/, '');

// ------------------------------------------------------------------ logging / stats
const stats = { changes: 0, skipped: 0, failures: [] };
const changeLog = [];
let GH_TOKEN = null; // kept in memory only
const scrub = (s) => {
  let out = String(s);
  if (GH_TOKEN) out = out.split(GH_TOKEN).join('***');
  return out;
};
const log = (...a) => console.log(scrub(a.join(' ')));
function changed(what) { stats.changes++; changeLog.push(what); log(`  + ${what}`); }
function skip(what) { stats.skipped++; if (process.env.SEED_VERBOSE) log(`  = ${what}`); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ HTTP
let TOKEN = null;
class HttpError extends Error {
  constructor(method, url, status, body) {
    super(`${method} ${url} -> ${status}: ${typeof body === 'string' ? body.slice(0, 400) : JSON.stringify(body).slice(0, 400)}`);
    this.status = status; this.body = body;
  }
}

async function request(method, url, { body, headers = {}, sudo, auth = 'token', raw = false, form } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (auth === 'token') h.Authorization = `token ${TOKEN}`;
  else if (auth === 'basic') h.Authorization = 'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
  if (sudo) h.Sudo = sudo;
  let payload;
  if (form) { payload = form; }
  else if (Buffer.isBuffer(body)) { payload = body; }
  else if (body !== undefined) { payload = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { method, headers: h, body: payload });
    } catch (e) {
      if (attempt < 3) { await sleep(1000 * (attempt + 1)); continue; }
      throw e;
    }
    if (res.status >= 500 && attempt < 2 && method === 'GET') { await sleep(1000); continue; }
    const text = await res.text();
    let data = text;
    if (!raw) { try { data = text ? JSON.parse(text) : null; } catch { /* keep text */ } }
    return { status: res.status, data, headers: res.headers };
  }
}

async function api(method, p, opts = {}) {
  const url = p.startsWith('http') ? p : `${API}${p}`;
  const r = await request(method, url, opts);
  if (r.status >= 400 && !(opts.allow || []).includes(r.status)) throw new HttpError(method, p, r.status, r.data);
  return r;
}
async function get(p, opts = {}) {
  const r = await api('GET', p, { ...opts, allow: [404, ...(opts.allow || [])] });
  return r.status === 404 ? null : r.data;
}
async function getAll(p, opts = {}) {
  const out = [];
  for (let page = 1; page < 200; page++) {
    const sep = p.includes('?') ? '&' : '?';
    const data = await get(`${p}${sep}page=${page}&limit=50`, opts);
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < 50) break;
  }
  return out;
}
const post = (p, body, opts = {}) => api('POST', p, { ...opts, body }).then((r) => r.data);
const patch = (p, body, opts = {}) => api('PATCH', p, { ...opts, body }).then((r) => r.data);
const put = (p, body, opts = {}) => api('PUT', p, { ...opts, body }).then((r) => r.data);
const b64 = (s) => Buffer.from(s).toString('base64');
const enc = encodeURIComponent;

/** Long-running POST (repo migration) via node:http so the default fetch header timeout does not apply. */
function longPost(p, body, timeoutMs = 60 * 60 * 1000) {
  const url = new URL(`${API}${p}`);
  const payload = Buffer.from(JSON.stringify(body));
  return new Promise((resolve, reject) => {
    const req = http.request({
      method: 'POST', hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length, Authorization: `token ${TOKEN}`, Accept: 'application/json' },
      timeout: timeoutMs,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let data = text; try { data = JSON.parse(text); } catch { /* text */ }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end(payload);
  });
}

// ------------------------------------------------------------------ data
const USERS = [
  { login: 'alice-dev', full_name: 'Alice Anders', location: 'Lisbon, Portugal', website: 'https://example.com/alice',
    description: 'Frontend engineer. Design tokens, accessible palettes and tidy CSS.' },
  { login: 'bob-dev', full_name: 'Bob Brennan', location: 'Toronto, Canada', website: 'https://example.com/bob',
    description: 'Backend developer working on Go services and APIs.' },
  { login: 'carol-ops', full_name: 'Carol Chen', location: 'Singapore', website: 'https://example.com/carol',
    description: 'Platform and CI/CD. Keeps the runners running.' },
  { login: 'dave-qa', full_name: 'Dave Diaz', location: 'Berlin, Germany', website: 'https://example.com/dave',
    description: 'QA engineer. Writes the bug reports you did not want to read.' },
];
const EMAIL = (login) => `${login}@example.com`;
const ID = (login) => {
  if (login === ADMIN_USER) return { name: 'admin', email: 'admin@example.com' };
  const u = USERS.find((x) => x.login === login);
  return { name: u.full_name, email: EMAIL(login) };
};
// users with write access to octo-org repos (team core). Others' commits are pushed by admin with their author identity.
const WRITERS = ['alice-dev', 'bob-dev', 'carol-ops'];
const asWriter = (login, repo = '') => (login === ADMIN_USER ? undefined : repo.startsWith(`${login}/`) || WRITERS.includes(login) ? login : undefined);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().replace(/\.\d+Z$/, 'Z');

const MIGRATIONS = [
  { github: 'pemistahl/grex', name: 'grex', why: 'Rust CLI: 7 milestones (6 closed), 16 releases with notes, 13 labels, README with tables/images, ~290 merged/closed/open PRs' },
  { github: 'akoutmos/prom_ex', name: 'prom_ex', why: 'Elixir library: 3 milestones, 16 releases with notes, README with many images and tables, open/merged/closed PRs' },
  { github: 'lgarron/folderify', name: 'folderify', why: 'Small Rust CLI with a real GitHub wiki, 1 milestone, 53 releases, README images' },
];

// ------------------------------------------------------------------ steps
async function ensureToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    const r = await request('GET', `${API}/user`);
    if (r.status === 200 && r.data?.login === ADMIN_USER) { skip('token'); return; }
    log('  stored token is invalid, recreating');
  }
  const tokens = await api('GET', `/users/${ADMIN_USER}/tokens`, { auth: 'basic' }).then((r) => r.data);
  const existing = tokens.find((t) => t.name === TOKEN_NAME);
  if (existing) {
    // Only our own token (name "theme-seed") is ever deleted, and only because its secret was lost.
    await api('DELETE', `/users/${ADMIN_USER}/tokens/${existing.id}`, { auth: 'basic' });
  }
  const created = await api('POST', `/users/${ADMIN_USER}/tokens`, { auth: 'basic', body: { name: TOKEN_NAME, scopes: ['all'] } }).then((r) => r.data);
  TOKEN = created.sha1;
  fs.writeFileSync(TOKEN_FILE, TOKEN + '\n', { mode: 0o600 });
  changed(`admin API token "${TOKEN_NAME}" (stored in tools/seed/.token)`);
}

async function ensureUsers() {
  for (const u of USERS) {
    let cur = await get(`/users/${u.login}`);
    if (!cur) {
      await post('/admin/users', {
        username: u.login, email: EMAIL(u.login), full_name: u.full_name, password: SEED_PASSWORD,
        must_change_password: false, send_notify: false, visibility: 'public',
      });
      changed(`user ${u.login}`);
      cur = await get(`/users/${u.login}`);
    } else skip(`user ${u.login}`);
    const want = { full_name: u.full_name, description: u.description, location: u.location, website: u.website };
    const diff = Object.entries(want).filter(([k, v]) => (cur[k] ?? '') !== v);
    if (diff.length) {
      await patch(`/admin/users/${u.login}`, { login_name: u.login, source_id: 0, ...want, must_change_password: false });
      changed(`profile of ${u.login} (${diff.map(([k]) => k).join(', ')})`);
    }
    // custom avatar: gitea names uploaded avatars sha256("<id>-<bytes>"), so we can tell whether ours is set
    const img = C.avatarPng(u.login);
    if (!cur.avatar_url?.endsWith(avatarHash(cur.id, img))) {
      await post('/user/avatar', { image: img.toString('base64') }, { sudo: u.login });
      changed(`avatar for ${u.login}`);
    }
  }
  // follows (profile followers/following counts)
  const follows = [['alice-dev', 'bob-dev'], ['alice-dev', 'carol-ops'], ['bob-dev', 'alice-dev'], ['carol-ops', 'alice-dev'], ['dave-qa', 'alice-dev'], ['dave-qa', 'bob-dev']];
  for (const [a, b] of follows) {
    const r = await api('GET', `/user/following/${b}`, { sudo: a, allow: [404] });
    if (r.status === 204) { skip(`follow ${a}->${b}`); continue; }
    await api('PUT', `/user/following/${b}`, { sudo: a });
    changed(`${a} follows ${b}`);
  }
}

const avatarHash = (id, buf) => crypto.createHash('sha256').update(`${id}-`).update(buf).digest('hex');

async function ensureOrg(name, opts, owners = []) {
  let org = await get(`/orgs/${name}`);
  if (!org) {
    await post('/orgs', { username: name, ...opts, visibility: 'public' });
    changed(`org ${name}`);
    org = await get(`/orgs/${name}`);
  } else skip(`org ${name}`);
  const diff = Object.entries(opts).filter(([k, v]) => (org[k] ?? '') !== v);
  if (diff.length) { await patch(`/orgs/${name}`, opts); changed(`org ${name} fields (${diff.map(([k]) => k).join(', ')})`); }
  const img = C.logoPng(128, name === ORG ? 0 : 1);
  if (!org.avatar_url?.endsWith(avatarHash(org.id, img))) {
    await post(`/orgs/${name}/avatar`, { image: img.toString('base64') });
    changed(`avatar for org ${name}`);
  }
  const teams = await getAll(`/orgs/${name}/teams`);
  const ownersTeam = teams.find((t) => t.name === 'Owners');
  for (const o of owners) await ensureTeamMember(ownersTeam, o);
  return org;
}

async function ensureTeamMember(team, login) {
  const r = await api('GET', `/teams/${team.id}/members/${login}`, { allow: [404] });
  if (r.status === 200) { skip(`team ${team.name} member ${login}`); return; }
  await api('PUT', `/teams/${team.id}/members/${login}`);
  changed(`team ${team.name} += ${login}`);
}

async function ensureTeams() {
  const specs = [
    { name: 'core', description: 'Core maintainers with write access to every repository', permission: 'write', members: ['alice-dev', 'bob-dev', 'carol-ops'] },
    { name: 'triage', description: 'Triage issues and pull requests (read access)', permission: 'read', members: ['dave-qa', 'carol-ops'] },
  ];
  const units = ['repo.code', 'repo.issues', 'repo.pulls', 'repo.releases', 'repo.wiki', 'repo.projects', 'repo.packages', 'repo.actions'];
  const out = {};
  for (const s of specs) {
    let team = (await getAll(`/orgs/${ORG}/teams`)).find((t) => t.name === s.name);
    if (!team) {
      team = await post(`/orgs/${ORG}/teams`, {
        name: s.name, description: s.description, permission: s.permission, includes_all_repositories: true,
        can_create_org_repo: s.permission === 'write',
        units_map: Object.fromEntries(units.map((u) => [u, s.permission])),
      });
      changed(`team ${ORG}/${s.name}`);
    } else skip(`team ${s.name}`);
    for (const m of s.members) await ensureTeamMember(team, m);
    out[s.name] = team;
  }
  return out;
}

// ---------------------------------------------------------------- repo helpers
async function ensureRepo(owner, name, { description, website = '', topics = [], isOrg = true, autoInit = false, settings = {} }) {
  let repo = await get(`/repos/${owner}/${name}`);
  if (!repo) {
    const body = { name, description, default_branch: 'main', auto_init: autoInit, private: false };
    if (isOrg) await post(`/orgs/${owner}/repos`, body);
    else await post(`/admin/users/${owner}/repos`, body);
    changed(`repo ${owner}/${name}`);
    repo = await get(`/repos/${owner}/${name}`);
  } else skip(`repo ${owner}/${name}`);
  const want = { description, website, ...settings };
  const diff = Object.entries(want).filter(([k, v]) => repo[k] !== undefined && repo[k] !== v);
  if (diff.length) { await patch(`/repos/${owner}/${name}`, want); changed(`repo ${owner}/${name} settings (${diff.map(([k]) => k).join(', ')})`); }
  await ensureTopics(owner, name, topics);
  return repo;
}

// Adds `topics` and drops the legacy marker topics; other existing topics (e.g. the ones a migration copied
// from github.com) are kept.
async function ensureTopics(owner, name, topics, drop = LEGACY_TOPICS) {
  const cur = (await get(`/repos/${owner}/${name}/topics`))?.topics || [];
  const want = [...new Set([...cur.filter((t) => !drop.includes(t)), ...topics])];
  if (want.length === cur.length && want.every((t) => cur.includes(t))) { skip('topics'); return; }
  await put(`/repos/${owner}/${name}/topics`, { topics: want });
  const added = want.filter((t) => !cur.includes(t)), removed = cur.filter((t) => !want.includes(t));
  changed(`topics ${owner}/${name}${added.length ? ` += ${added.join(',')}` : ''}${removed.length ? ` -= ${removed.join(',')}` : ''}`);
}

/**
 * Rewrites text in existing files (fixes: { path: [[old, new], ...] }) in ONE commit, only for files where an
 * `old` string still occurs. Converges older instances on the current wording; a no-op everywhere else.
 */
async function ensureFileFixes(repo, branch, message, fixes, { author } = {}) {
  const files = [];
  for (const [p, pairs] of Object.entries(fixes)) {
    let cur;
    try { cur = await rawFile(repo, p, branch); } catch { continue; }
    let next = cur;
    for (const [a, b] of pairs) next = next.split(a).join(b);
    if (next !== cur) files.push({ operation: 'update', path: p, content: b64(next), sha: await fileSha(repo, p, branch) });
  }
  if (!files.length) { skip(`file fixes ${repo}`); return false; }
  const id = ID(author);
  await post(`/repos/${repo}/contents`, { message, branch, files, author: id, committer: id }, { sudo: asWriter(author, repo) });
  changed(`commit on ${repo}@${branch}: ${message} (${files.map((f) => f.path).join(', ')})`);
  return true;
}

async function branchCommits(repo, branch, limit = 100) {
  const data = await get(`/repos/${repo}/commits?sha=${enc(branch)}&limit=${limit}&stat=false&verification=false&files=false`, { allow: [409] });
  return Array.isArray(data) ? data : [];
}
async function fileSha(repo, filePath, ref) {
  const r = await get(`/repos/${repo}/contents/${filePath.split('/').map(enc).join('/')}?ref=${enc(ref)}`);
  return r?.sha || null;
}

/**
 * Applies a commit (identified by its message) to a branch if no commit with that message exists yet.
 * files: [{ op: 'create'|'update'|'delete'|'rename'|'upload', path, content?: string|Buffer, from? }]
 */
async function ensureCommit(repo, branch, message, files, { author, date, sudo, newBranchFrom } = {}) {
  const exists = newBranchFrom ? null : await get(`/repos/${repo}/branches/${enc(branch)}`);
  const history = exists || !newBranchFrom ? await branchCommits(repo, branch) : [];
  if (history.some((c) => c.commit.message.trim().split('\n')[0] === message)) { skip(`commit "${message}"`); return false; }
  const ref = newBranchFrom || branch;
  const ops = [];
  for (const f of files) {
    const op = { operation: f.op, path: f.path };
    if (f.content !== undefined) op.content = Buffer.isBuffer(f.content) ? f.content.toString('base64') : b64(f.content);
    if (f.op === 'update' || f.op === 'delete') op.sha = await fileSha(repo, f.path, ref);
    if (f.op === 'rename') { op.from_path = f.from; op.sha = await fileSha(repo, f.from, ref); }
    ops.push(op);
  }
  const id = ID(author);
  const body = {
    message, files: ops, author: id, committer: id,
    ...(date ? { dates: { author: date, committer: date } } : {}),
  };
  if (newBranchFrom) { body.branch = newBranchFrom; body.new_branch = branch; } else body.branch = branch;
  await post(`/repos/${repo}/contents`, body, { sudo: asWriter(author, repo) });
  changed(`commit on ${repo}@${branch}: ${message}`);
  return true;
}

async function ensureBranch(repo, branch, from) {
  if (await get(`/repos/${repo}/branches/${enc(branch)}`)) { skip(`branch ${branch}`); return; }
  await post(`/repos/${repo}/branches`, { new_branch_name: branch, old_ref_name: `refs/heads/${from}` });
  changed(`branch ${repo}@${branch}`);
}

// ---------------------------------------------------------------- playground: code
async function seedPlaygroundCode() {
  const R = PLAY_FULL;
  const repo = await ensureRepo(ORG, PLAY, {
    description: PLAY_DESCRIPTION,
    website: 'https://example.com/theme-playground',
    topics: ['markdown', 'design-tokens', 'playground'],
    settings: { has_issues: true, has_wiki: true, has_projects: true, has_pull_requests: true, has_actions: true, has_packages: true, has_releases: true },
  });
  const isEmpty = repo.empty || !(await get(`/repos/${R}/branches/main`));
  const initial = [
    ['README.md', C.readme()], ['LICENSE', C.LICENSE], ['.gitignore', C.GITIGNORE], ['.editorconfig', C.EDITORCONFIG],
    ['go.mod', C.GO_MOD], ['package.json', C.PACKAGE_JSON], ['Makefile', C.MAKEFILE],
    ['cmd/playground/main.go', C.MAIN_GO], ['internal/render/render.go', C.RENDER_GO],
    ['internal/theme/palette.go', C.PALETTE_GO], ['web/src/app.ts', C.APP_TS],
    ['web/src/components/Button.tsx', C.BUTTON_TSX], ['web/styles/main.css', C.MAIN_CSS],
    ['scripts/build.sh', C.BUILD_SH], ['scripts/release.py', C.RELEASE_PY],
    ['config/settings.json', C.SETTINGS_JSON], ['config/app.yaml', C.APP_YAML],
    ['assets/images/logo.png', C.logoPng(96, 0)], ['assets/images/diagram.svg', C.DIAGRAM_SVG],
  ];
  if (isEmpty) {
    await post(`/repos/${R}/contents`, {
      message: 'Initial commit: project skeleton', branch: 'main',
      files: initial.map(([p, c]) => ({ operation: 'create', path: p, content: Buffer.isBuffer(c) ? c.toString('base64') : b64(c) })),
      author: ID('alice-dev'), committer: ID('alice-dev'), dates: { author: daysAgo(75), committer: daysAgo(75) },
    }, { sudo: 'alice-dev' });
    changed(`commit on ${R}@main: Initial commit: project skeleton`);
  } else skip('initial commit');

  await ensureCommit(R, 'main', 'Add docs tree and render tests', [
    { op: 'create', path: 'docs/guide/getting-started.md', content: C.GETTING_STARTED_MD },
    { op: 'create', path: 'docs/guide/advanced/configuration.md', content: C.CONFIGURATION_MD },
    { op: 'create', path: 'docs/reference/api/v1/endpoints.md', content: C.ENDPOINTS_MD },
    { op: 'create', path: 'internal/render/render_test.go', content: C.RENDER_TEST_GO },
  ], { author: 'bob-dev', date: daysAgo(62) });

  await ensureCommit(R, 'main', 'Add generated palette table, Rust contrast helpers and SQL schema', [
    { op: 'create', path: 'internal/palette/generated.go', content: C.largeGo(0) },
    { op: 'create', path: 'crates/contrast/src/lib.rs', content: C.LIB_RS },
    { op: 'create', path: 'db/schema.sql', content: C.SCHEMA_SQL },
  ], { author: 'carol-ops', date: daysAgo(50) });

  await ensureCommit(R, 'main', 'ci: add Gitea Actions workflow and Dockerfile', [
    { op: 'create', path: '.gitea/workflows/ci.yml', content: C.CI_YML },
    { op: 'create', path: 'Dockerfile', content: C.DOCKERFILE },
  ], { author: 'carol-ops', date: daysAgo(40) });

  await ensureCommit(R, 'main', 'render: guard against nil palette and document options', [
    { op: 'update', path: 'internal/render/render.go', content: C.RENDER_GO.replace('// Unsafe allows raw HTML to pass through untouched.', '// Unsafe allows raw HTML to pass through untouched.\n\t// It is false by default; never enable it for user content.') },
    { op: 'create', path: 'CHANGELOG.md', content: C.CHANGELOG_MD },
  ], { author: 'dave-qa', date: daysAgo(30) });

  const history = await branchCommits(R, 'main');
  const first = history[history.length - 1]?.sha;
  await ensureCommit(R, 'main', 'docs: reference the first commit in the README', [
    { op: 'update', path: 'README.md', content: C.readme({ firstSha: first }) },
  ], { author: 'alice-dev', date: daysAgo(21) });

  await tidyPlaygroundFiles();
}

// Removes the visible seed wording that older runs committed (README, LICENSE, package.json, ci.yml).
async function tidyPlaygroundFiles() {
  await ensureFileFixes(PLAY_FULL, 'main', 'Tidy up README, LICENSE and package metadata', C.LEGACY_FILE_FIXES, { author: 'alice-dev' });
}

// ---------------------------------------------------------------- playground: labels, milestones
const LABELS = [
  ['bug', 'd73a4a', "Something isn't working", false],
  ['enhancement', 'a2eeef', 'New feature or request', false],
  ['documentation', '0075ca', 'Improvements or additions to documentation', false],
  ['good first issue', '7057ff', 'Good for newcomers', false],
  ['help wanted', '008672', 'Extra attention is needed', false],
  ['question', 'd876e3', 'Further information is requested', false],
  ['duplicate', 'cfd3d7', 'This issue or pull request already exists', false],
  ['wontfix', 'ffffff', 'This will not be worked on', false],
  ['priority/high', 'b60205', 'Fix before the next release', true],
  ['priority/medium', 'fbca04', 'Fix soon', true],
  ['priority/low', '0e8a16', 'Nice to have', true],
  ['area/markdown', '1d76db', 'Markdown rendering', false],
  ['area/ci', '5319e7', 'Continuous integration', false],
  ['area/theme', 'c5def5', 'Colors, spacing and components', false],
];
async function seedLabels(R) {
  const cur = await getAll(`/repos/${R}/labels`);
  const byName = Object.fromEntries(cur.map((l) => [l.name, l]));
  for (const [name, color, description, exclusive] of LABELS) {
    if (byName[name]) { skip(`label ${name}`); continue; }
    byName[name] = await post(`/repos/${R}/labels`, { name, color: `#${color}`, description, exclusive });
    changed(`label ${name}`);
  }
  return byName;
}

async function seedMilestones(R) {
  const specs = [
    { title: 'v0.9 — Foundations', description: 'Project skeleton, first palettes and CI.', due_on: daysAgo(20), state: 'closed' },
    { title: 'v1.0 — Public preview', description: 'Everything needed for the first public preview of the theme.', due_on: new Date(Date.now() + 30 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z'), state: 'open' },
    { title: 'v2.0 — Theming API', description: 'User-defined palettes and a stable token API. No due date yet.', state: 'open' },
  ];
  const cur = await getAll(`/repos/${R}/milestones?state=all`);
  const out = {};
  for (const s of specs) {
    let m = cur.find((x) => x.title === s.title);
    if (!m) {
      m = await post(`/repos/${R}/milestones`, { title: s.title, description: s.description, due_on: s.due_on });
      changed(`milestone ${s.title}`);
    } else skip(`milestone ${s.title}`);
    out[s.title] = m;
  }
  return out;
}

// ---------------------------------------------------------------- playground: issues
function issueSpecs(ms) {
  const v09 = ms['v0.9 — Foundations'].id, v10 = ms['v1.0 — Public preview'].id, v20 = ms['v2.0 — Theming API'].id;
  return [
    { key: 'roadmap', title: 'Roadmap: GitHub-style theme for 2026', author: 'alice-dev', labels: ['enhancement', 'priority/high'], milestone: v10, assignees: ['alice-dev'], pin: true,
      body: `This is the tracking issue for the theme. Ping @bob-dev and @carol-ops for reviews.\n\n### Milestones\n\n- [x] Seed data and fixtures\n- [x] Colors and typography (#2)\n- [ ] Diff view polish (#3)\n- [ ] Accessibility audit (#11)\n  - [ ] Reduced motion (#7)\n  - [ ] Contrast ratios\n- [ ] Release checklist (#13)\n\n> [!IMPORTANT]\n> Keep this issue pinned until v1.0 ships.`,
      comments: [{ author: 'bob-dev', body: 'Thanks for writing this up! I will take the diff view items.' }, { author: 'carol-ops', body: 'CI is wired up in `.gitea/workflows/ci.yml`; see the Actions tab.' }],
      reactions: [['bob-dev', '+1'], ['carol-ops', 'rocket'], ['dave-qa', 'heart']] },
    { key: 'alerts', title: 'Markdown alerts render without icons in dark mode', author: 'bob-dev', labels: ['bug', 'priority/high', 'area/markdown'], milestone: v10, assignees: ['bob-dev', 'alice-dev'],
      body: `### Steps to reproduce\n\n1. Switch to the dark theme\n2. Open the README of this repository\n3. Scroll to **Alerts**\n\n### Expected\n\nEach alert shows its octicon.\n\n### Actual\n\nIcons are invisible (same color as background).\n\n\`\`\`css\n.markdown-alert-title svg { fill: currentColor; }\n\`\`\``,
      comments: [
        { author: 'alice-dev', body: 'Confirmed on Firefox and Chrome. Looks like `currentColor` resolves to the canvas color.', reactions: [['bob-dev', '+1']] },
        { author: 'dave-qa', body: 'Also reproducible on the wiki pages:\n\n| Browser | Light | Dark |\n| --- | --- | --- |\n| Firefox | ✅ | ❌ |\n| Chrome | ✅ | ❌ |\n| Safari | ✅ | ❌ |' },
        { author: 'carol-ops', body: 'The visual regression job in CI caught this too (it fails on purpose right now).' },
        { author: ADMIN_USER, body: 'Assigning to @bob-dev and @alice-dev. Let\'s aim for v1.0.' },
        { author: 'bob-dev', body: 'Proposed fix:\n\n```diff\n-.markdown-alert-title svg { fill: currentColor; }\n+.markdown-alert-title svg { fill: var(--fgColor-accent); }\n```', reactions: [['alice-dev', 'hooray'], ['dave-qa', 'eyes']] },
        { author: 'alice-dev', body: 'LGTM :+1: — will be part of the token refactor in #16.' },
      ],
      reactions: [['alice-dev', '+1'], ['carol-ops', '+1'], ['dave-qa', 'eyes'], [ADMIN_USER, 'heart']] },
    { key: 'diff-overflow', title: 'Diff view: long lines overflow the file box', author: 'dave-qa', labels: ['bug', 'area/theme', 'priority/medium'], milestone: v10, assignees: ['bob-dev'],
      body: 'Open the files tab of #16 and look at `docs/adr/0001-design-tokens.md`: long lines push the layout wider than the viewport.',
      comments: [{ author: 'bob-dev', body: 'We should wrap by default and offer a toggle.' }, { author: 'dave-qa', body: 'Also the split view clips the right side.' }] },
    { key: 'kbd', title: 'Add a keyboard shortcuts cheat sheet', author: 'carol-ops', labels: ['enhancement', 'good first issue'], state: 'closed',
      body: 'Document <kbd>t</kbd>, <kbd>s</kbd>, <kbd>/</kbd> and friends somewhere discoverable.',
      comments: [{ author: 'alice-dev', body: 'Added to the wiki FAQ. Closing.' }] },
    { key: 'typos', title: 'Typos in the getting started guide', author: 'dave-qa', labels: ['documentation', 'good first issue'],
      body: '`docs/guide/getting-started.md` says "Requirments" and "Instalation".' },
    { key: 'scoped', title: 'Question: how do scoped labels work?', author: 'carol-ops', labels: ['question'],
      body: 'I noticed `priority/high` and `priority/low` cannot both be applied. Is that intended?',
      comments: [{ author: 'alice-dev', body: 'Yes, labels marked *exclusive* with a `scope/` prefix are mutually exclusive within the scope.' }] },
    { key: 'motion', title: 'Support prefers-reduced-motion', author: 'alice-dev', labels: ['enhancement', 'priority/low'], milestone: v20,
      body: 'Disable transitions when `@media (prefers-reduced-motion: reduce)` matches.' },
    { key: 'ci-node18', title: 'CI: visual regression job always fails', author: 'carol-ops', labels: ['bug', 'area/ci', 'priority/high'], assignees: ['alice-dev'],
      body: 'The `flaky` job exits 1 on purpose so that we can style failed runs. We should keep it that way for screenshots, but track it here.\n\n```\n::error file=web/styles/main.css,line=24::3 screenshots differ by more than 0.1%\n```',
      comments: [{ author: 'dave-qa', body: 'Keeping it red is useful for the Actions pages :smile:' }] },
    { key: 'dup', title: 'Alert icons missing', author: 'dave-qa', labels: ['duplicate'], state: 'closed',
      body: 'Alert icons do not show up.', comments: [{ author: 'bob-dev', body: 'Duplicate of #2.' }] },
    { key: 'mermaid', title: 'Mermaid diagrams ignore theme colors', author: 'bob-dev', labels: ['bug', 'area/markdown', 'priority/medium'], milestone: v10,
      body: 'The flowchart in the README renders with the default mermaid palette. Related to #2.' },
    { key: 'a11y', title: 'Tracking: accessibility audit', author: 'alice-dev', labels: ['enhancement', 'help wanted'], assignees: ['alice-dev', 'bob-dev'],
      body: '- [ ] Reduced motion (#7)\n- [ ] Diff overflow (#3)\n- [x] Keyboard shortcuts (#4)\n- [ ] Focus rings on buttons\n- [ ] Contrast of muted text' },
    { key: 'ie11', title: 'Support Internet Explorer 11', author: 'dave-qa', labels: ['wontfix'], state: 'closed',
      body: 'Some users still run IE11.', comments: [{ author: ADMIN_USER, body: 'We only support evergreen browsers. Closing as wontfix.' }] },
    { key: 'release-checklist', title: 'Release checklist for v1.0', author: ADMIN_USER, labels: ['documentation'], milestone: v10, assignees: [ADMIN_USER],
      body: '- [ ] Tag `v1.0.0`\n- [ ] Publish release notes\n- [ ] Upload assets\n- [ ] Announce on the wiki' },
    { key: 'unicode', title: 'Unicode rendering: 日本語, العربية, Ελληνικά and emoji 🎨', author: 'carol-ops', labels: ['area/markdown'],
      body: 'Mixed scripts: こんにちは世界 — مرحبا بالعالم — Γειά σου Κόσμε. Emoji: 👍 🎉 🚀. RTL text should align correctly.' },
    { key: 'flaky-test', title: 'Flaky test in render_test.go', author: 'bob-dev', labels: ['bug'], milestone: v09, state: 'closed',
      body: '`TestMarkdownEmpty` failed once on CI.', comments: [{ author: 'bob-dev', body: 'Could not reproduce after 500 runs; closing.' }] },
  ];
}

/** Read-only users (dave-qa) cannot set labels/milestone/assignees on creation; admin fixes them up afterwards. */
async function ensureIssueMeta(R, number, spec, labelsByName) {
  const cur = await get(`/repos/${R}/issues/${number}`);
  const have = new Set((cur.labels || []).map((l) => l.name));
  const missing = (spec.labels || []).filter((n) => !have.has(n));
  if (missing.length) {
    await post(`/repos/${R}/issues/${number}/labels`, { labels: missing.map((n) => labelsByName[n].id) });
    changed(`labels on #${number}: ${missing.join(', ')}`);
  }
  const edit = {};
  if (spec.milestone && cur.milestone?.id !== spec.milestone) edit.milestone = spec.milestone;
  const haveA = new Set((cur.assignees || []).map((a) => a.login));
  if ((spec.assignees || []).some((a) => !haveA.has(a))) edit.assignees = [...new Set([...haveA, ...spec.assignees])];
  if (Object.keys(edit).length) {
    await patch(`/repos/${R}/issues/${number}`, edit);
    changed(`metadata on #${number}: ${Object.keys(edit).join(', ')}`);
  }
}

async function ensureIssueExtras(R, issue, spec, labelsByName) {
  // comments
  const comments = await getAll(`/repos/${R}/issues/${issue.number}/comments`);
  for (const c of spec.comments || []) {
    let existing = comments.find((x) => x.body.startsWith(c.body.slice(0, 60)) && x.user.login === c.author);
    if (!existing) {
      existing = await post(`/repos/${R}/issues/${issue.number}/comments`, { body: c.body }, { sudo: c.author === ADMIN_USER ? undefined : c.author });
      changed(`comment on #${issue.number} by ${c.author}`);
    } else skip('comment');
    for (const [who, content] of c.reactions || []) {
      const rs = (await get(`/repos/${R}/issues/comments/${existing.id}/reactions`)) || [];
      if (rs.some((x) => x.user.login === who && x.content === content)) { skip('reaction'); continue; }
      await post(`/repos/${R}/issues/comments/${existing.id}/reactions`, { content }, { sudo: who === ADMIN_USER ? undefined : who });
      changed(`reaction ${content} by ${who} on comment ${existing.id}`);
    }
  }
  for (const [who, content] of spec.reactions || []) {
    const rs = (await get(`/repos/${R}/issues/${issue.number}/reactions`)) || [];
    if (rs.some((x) => x.user.login === who && x.content === content)) { skip('reaction'); continue; }
    await post(`/repos/${R}/issues/${issue.number}/reactions`, { content }, { sudo: who === ADMIN_USER ? undefined : who });
    changed(`reaction ${content} by ${who} on #${issue.number}`);
  }
  if (spec.state === 'closed' && issue.state !== 'closed') {
    await patch(`/repos/${R}/issues/${issue.number}`, { state: 'closed' });
    changed(`closed #${issue.number}`);
  }
  if (spec.pin) {
    const pinned = (await get(`/repos/${R}/issues/pinned`)) || [];
    if (!pinned.some((p) => p.number === issue.number)) {
      await api('POST', `/repos/${R}/issues/${issue.number}/pin`);
      changed(`pinned #${issue.number}`);
    } else skip('pin');
  }
}

async function seedIssues(R, labelsByName, ms) {
  const specs = issueSpecs(ms);
  const existing = await getAll(`/repos/${R}/issues?state=all&type=issues`);
  const out = {};
  for (const s of specs) {
    let issue = existing.find((i) => i.title === s.title);
    if (!issue) {
      issue = await post(`/repos/${R}/issues`, {
        title: s.title, body: `${s.body}\n\n${MARK}`, labels: s.labels.map((n) => labelsByName[n].id),
        milestone: s.milestone || 0, assignees: s.assignees || [],
      }, { sudo: s.author === ADMIN_USER ? undefined : s.author });
      changed(`issue #${issue.number} ${s.title}`);
    } else skip(`issue ${s.title}`);
    await ensureIssueMeta(R, issue.number, s, labelsByName);
    await ensureIssueExtras(R, issue, s, labelsByName);
    out[s.key] = issue.number;
  }
  return out;
}

// ---------------------------------------------------------------- playground: pull requests
function bigPrFiles() {
  const readmeNew = C.readme().replace('# Theme Playground', '# Theme Playground\n\n> Now powered by design tokens (see `internal/theme/tokens.go`).');
  const tokensGo = `package theme

// Token is a named design value that resolves per color mode.
type Token struct {
	Name  string
	Light string
	Dark  string
}

// Tokens is the canonical token table. Components must use these instead of raw hex values.
var Tokens = []Token{
	{Name: "fgColor-default", Light: "#1f2328", Dark: "#f0f6fc"},
	{Name: "fgColor-muted", Light: "#59636e", Dark: "#9198a1"},
	{Name: "fgColor-accent", Light: "#0969da", Dark: "#4493f8"},
	{Name: "bgColor-default", Light: "#ffffff", Dark: "#0d1117"},
	{Name: "bgColor-muted", Light: "#f6f8fa", Dark: "#151b23"},
	{Name: "borderColor-default", Light: "#d1d9e0", Dark: "#3d444d"},
}

// Resolve returns the value of a token for a mode ("light" or "dark").
func Resolve(name, mode string) (string, bool) {
	for _, t := range Tokens {
		if t.Name == name {
			if mode == "dark" {
				return t.Dark, true
			}
			return t.Light, true
		}
	}
	return "", false
}
`;
  const tokensTs = `// Generated from internal/theme/tokens.go — keep in sync.
export const tokens = {
  'fgColor-default': { light: '#1f2328', dark: '#f0f6fc' },
  'fgColor-muted': { light: '#59636e', dark: '#9198a1' },
  'fgColor-accent': { light: '#0969da', dark: '#4493f8' },
  'bgColor-default': { light: '#ffffff', dark: '#0d1117' },
  'bgColor-muted': { light: '#f6f8fa', dark: '#151b23' },
  'borderColor-default': { light: '#d1d9e0', dark: '#3d444d' },
} as const;

export type TokenName = keyof typeof tokens;

export function cssVariables(mode: 'light' | 'dark'): string {
  return Object.entries(tokens)
    .map(([name, v]) => \`--\${name}: \${v[mode]};\`)
    .join('\\n');
}
`;
  const adr = `# ADR 0001: Design tokens

- Status: proposed
- Deciders: @alice-dev, @bob-dev, @carol-ops

## Context

Raw hex values are scattered across ${'the Go renderer, the TypeScript components, the CSS files and the configuration, which makes dark mode and high-contrast support error-prone because every color has to be changed in several places at once and nobody remembers all of them, so we keep shipping regressions where one component still uses the old gray while its neighbours already use the new one; this sentence is intentionally extremely long to exercise horizontal overflow and soft wrapping in the diff viewer, in both the unified and the split layout, with and without whitespace changes hidden.'}

## Decision

Introduce a single token table (\`internal/theme/tokens.go\`) and generate \`web/src/tokens.ts\` from it.

## Consequences

- Components reference tokens, never hex values.
- The palette file is renamed to \`colors.go\` and shrinks.
`;
  return [
    { op: 'update', path: 'README.md', content: readmeNew },
    { op: 'update', path: 'cmd/playground/main.go', content: C.MAIN_GO.replace('\tmode := flag.String("mode", "light", "color mode: light or dark")', '\tmode := flag.String("mode", "auto", "color mode: auto, light or dark")\n\tcontrast := flag.String("contrast", "normal", "contrast: normal or high")').replace('\tpalette := theme.Lookup(*mode)', '\t_ = contrast\n\tpalette := theme.Lookup(*mode)') },
    { op: 'update', path: 'internal/render/render.go', content: C.RENDER_GO.replace('opts.Palette.Foreground', 'opts.Palette.Token("fgColor-default")').replace('func escape(s string) string {\n\tr := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;")\n\treturn r.Replace(s)\n}', 'var escaper = strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", "\\"", "&quot;")\n\nfunc escape(s string) string { return escaper.Replace(s) }') },
    { op: 'update', path: 'internal/render/render_test.go', content: C.RENDER_TEST_GO + `\nfunc TestEscapeQuotes(t *testing.T) {\n\tif got := escape("\\"x\\""); got != "&quot;x&quot;" {\n\t\tt.Fatalf("got %q", got)\n\t}\n}\n` },
    { op: 'rename', path: 'internal/theme/colors.go', from: 'internal/theme/palette.go' },
    { op: 'create', path: 'internal/theme/tokens.go', content: tokensGo },
    { op: 'create', path: 'web/src/tokens.ts', content: tokensTs },
    { op: 'update', path: 'web/src/app.ts', content: C.APP_TS.replace("import { Button } from './components/Button';", "import { Button } from './components/Button';\nimport { cssVariables } from './tokens';").replace('  document.documentElement.dataset.colorMode = resolved;', '  document.documentElement.dataset.colorMode = resolved;\n  document.documentElement.style.cssText = cssVariables(resolved);') },
    { op: 'update', path: 'web/src/components/Button.tsx', content: C.BUTTON_TSX.replace("  variant?: 'default' | 'primary' | 'danger' | 'invisible';", "  variant?: 'default' | 'primary' | 'danger' | 'invisible' | 'outline';\n  leadingVisual?: JSX.Element;").replace('      {label}', '      {leadingVisual}\n      <span className="btn-label">{label}</span>') },
    { op: 'rename', path: 'web/styles/base.css', from: 'web/styles/main.css' },
    { op: 'delete', path: 'scripts/release.py' },
    { op: 'update', path: 'config/settings.json', content: C.SETTINGS_JSON.replace('"contrast": "normal"', '"contrast": "normal",\n    "tokens": "internal/theme/tokens.go",\n    "description": "Tokens are the single source of truth for every color used by the renderer, the web components and the generated CSS variables; do not add raw hex values anywhere else."') },
    { op: 'update', path: 'config/app.yaml', content: C.APP_YAML.replace('    - high-contrast\n', '    - high-contrast\n    - dimmed\n  tokens: internal/theme/tokens.go\n') },
    { op: 'update', path: 'assets/images/logo.png', content: C.logoPng(96, 1) },
    { op: 'create', path: 'assets/images/tokens-banner.png', content: C.logoPng(64, 0) },
    { op: 'update', path: 'docs/guide/advanced/configuration.md', content: C.CONFIGURATION_MD + '| `theme.tokens` | path | `internal/theme/tokens.go` | Token table used to generate CSS variables |\n' },
    { op: 'create', path: 'docs/adr/0001-design-tokens.md', content: adr },
    { op: 'update', path: 'package.json', content: C.PACKAGE_JSON.replace('"lint": "eslint web/src"', '"lint": "eslint web/src",\n    "tokens": "go run ./cmd/gen-tokens > web/src/tokens.ts"') },
    { op: 'update', path: 'Makefile', content: C.MAKEFILE.replace('.PHONY: build test lint clean', '.PHONY: build test lint clean tokens').replace('clean:\n', 'tokens:\n\tgo run ./cmd/gen-tokens > web/src/tokens.ts\n\nclean:\n') },
    { op: 'update', path: 'internal/palette/generated.go', content: C.largeGo(1) },
  ];
}

async function ensurePR(R, spec, labelsByName) {
  const pulls = await getAll(`/repos/${R}/pulls?state=all`);
  let pr = pulls.find((p) => p.head?.ref === spec.head);
  if (!pr) {
    pr = await post(`/repos/${R}/pulls`, {
      head: spec.head, base: 'main', title: spec.title, body: `${spec.body}\n\n${MARK}`,
      labels: (spec.labels || []).map((n) => labelsByName[n].id), milestone: spec.milestone || 0,
      assignees: spec.assignees || [], reviewers: spec.reviewers || [],
    }, { sudo: spec.author === ADMIN_USER ? undefined : spec.author });
    changed(`PR #${pr.number} ${spec.title}`);
  } else skip(`PR ${spec.title}`);
  await ensureIssueMeta(R, pr.number, spec, labelsByName);
  return pr;
}

async function ensureReview(R, number, who, event, body, comments = []) {
  const reviews = (await get(`/repos/${R}/pulls/${number}/reviews`)) || [];
  if (reviews.some((r) => r.user?.login === who && r.state === event)) { skip(`review ${who}`); return; }
  await post(`/repos/${R}/pulls/${number}/reviews`, { event, body, comments }, { sudo: who === ADMIN_USER ? undefined : who });
  changed(`review ${event} by ${who} on #${number}`);
}

async function waitMergeable(R, number) {
  for (let i = 0; i < 30; i++) {
    const pr = await get(`/repos/${R}/pulls/${number}`);
    if (pr.mergeable) return pr;
    await sleep(1000);
  }
  return get(`/repos/${R}/pulls/${number}`);
}

async function seedPulls(R, labelsByName, ms, issues) {
  const v10 = ms['v1.0 — Public preview'].id;
  const out = {};

  // 1) large multi-file diff PR (open, reviewed)
  await ensureCommit(R, 'feature/design-tokens', 'Refactor palette into design tokens', bigPrFiles(), { author: 'alice-dev', date: daysAgo(10), newBranchFrom: (await get(`/repos/${R}/branches/feature%2Fdesign-tokens`)) ? undefined : 'main' });
  await ensureCommit(R, 'feature/design-tokens', 'Address review feedback: document Resolve fallback', [
    { op: 'update', path: 'internal/theme/tokens.go', content: (await rawFile(R, 'internal/theme/tokens.go', 'feature/design-tokens')).replace('// Resolve returns the value of a token for a mode ("light" or "dark").', '// Resolve returns the value of a token for a mode ("light" or "dark").\n// Unknown modes fall back to the light value.') },
  ], { author: 'alice-dev', date: daysAgo(8) });
  const big = await ensurePR(R, {
    head: 'feature/design-tokens', author: 'alice-dev', title: 'Refactor palette into design tokens',
    body: `## Summary\n\nIntroduces a single design token table and generates the TypeScript tokens from it.\n\n- Renames \`palette.go\` → \`colors.go\` and \`main.css\` → \`base.css\`\n- Removes the unused \`scripts/release.py\`\n- Updates the logo (binary change)\n\nFixes part of #1, relates to #2 and #3.\n\n### Checklist\n\n- [x] Tests updated\n- [x] ADR written\n- [ ] Screenshots attached`,
    labels: ['enhancement', 'area/theme', 'priority/high'], milestone: v10, assignees: ['alice-dev'], reviewers: ['bob-dev', 'carol-ops', 'dave-qa'],
  }, labelsByName);
  out.large_diff = big.number;
  await ensureReview(R, big.number, 'bob-dev', 'APPROVED', 'Looks great! A couple of nits inline, none blocking. :shipit:', [
    { path: 'internal/theme/tokens.go', new_position: 13, body: 'Nit: could we sort these alphabetically?' },
    { path: 'web/src/tokens.ts', new_position: 14, body: '```suggestion\nexport function cssVariables(mode: \'light\' | \'dark\' = \'light\'): string {\n```' },
  ]);
  await ensureReview(R, big.number, 'carol-ops', 'REQUEST_CHANGES', 'The CI config still references the old CSS path. Please update before merging.', [
    { path: 'config/app.yaml', new_position: 12, body: 'Should `dimmed` be behind a feature flag?' },
    { path: 'internal/render/render.go', new_position: 30, body: '`Palette.Token` does not exist yet — this will not compile.' },
  ]);
  await ensureReview(R, big.number, 'dave-qa', 'COMMENT', 'Tested locally in light and dark mode; screenshots look right except for the diff overflow in #3.', []);
  const bigComments = await getAll(`/repos/${R}/issues/${big.number}/comments`);
  if (!bigComments.some((c) => c.body.startsWith('Thanks for the reviews'))) {
    await post(`/repos/${R}/issues/${big.number}/comments`, { body: 'Thanks for the reviews! I will fix the compile error and push again.' }, { sudo: 'alice-dev' });
    changed(`comment on #${big.number}`);
  }

  // 2) merged PR fixing #5
  const fixed = C.GETTING_STARTED_MD.replace('Requirments', 'Requirements').replace('Instalation', 'Installation');
  await ensureCommit(R, 'docs/fix-typos', 'docs: fix typos in getting started guide', [
    { op: 'update', path: 'docs/guide/getting-started.md', content: fixed },
  ], { author: 'bob-dev', date: daysAgo(18), newBranchFrom: (await get(`/repos/${R}/branches/docs%2Ffix-typos`)) ? undefined : 'main' });
  const merged = await ensurePR(R, {
    head: 'docs/fix-typos', author: 'bob-dev', title: 'docs: fix typos in getting started guide',
    body: `Fixes #${issues.typos}.\n\nSmall docs-only change.`, labels: ['documentation'], milestone: v10, reviewers: ['alice-dev'],
  }, labelsByName);
  out.merged = merged.number;
  await ensureReview(R, merged.number, 'alice-dev', 'APPROVED', 'Thanks! :sparkles:');
  if (!merged.merged) {
    const m = await waitMergeable(R, merged.number);
    if (!m.merged) {
      await post(`/repos/${R}/pulls/${merged.number}/merge`, { Do: 'merge', merge_message_field: `Merge pull request #${merged.number} from docs/fix-typos` });
      changed(`merged PR #${merged.number}`);
    }
  } else skip('merge');

  // 3) closed, unmerged PR
  await ensureCommit(R, 'experiment/alt-renderer', 'Experiment: swap renderer for a streaming implementation', [
    { op: 'create', path: 'internal/render/stream.go', content: 'package render\n\nimport "io"\n\n// Stream renders markdown incrementally. Experimental.\nfunc Stream(w io.Writer, src []byte) error {\n\t_, err := w.Write(src)\n\treturn err\n}\n' },
  ], { author: 'dave-qa', date: daysAgo(15), newBranchFrom: (await get(`/repos/${R}/branches/experiment%2Falt-renderer`)) ? undefined : 'main' });
  const closed = await ensurePR(R, {
    head: 'experiment/alt-renderer', author: 'dave-qa', title: 'Experiment: streaming markdown renderer',
    body: 'Trying out a streaming renderer. Not sure this is the right direction.', labels: ['question'],
  }, labelsByName);
  out.closed_unmerged = closed.number;
  const closedComments = await getAll(`/repos/${R}/issues/${closed.number}/comments`);
  if (!closedComments.some((c) => c.body.startsWith('Closing in favor'))) {
    await post(`/repos/${R}/issues/${closed.number}/comments`, { body: `Closing in favor of #${big.number}; streaming can come later.` }, { sudo: 'alice-dev' });
    changed(`comment on #${closed.number}`);
  }
  if (closed.state !== 'closed') { await patch(`/repos/${R}/pulls/${closed.number}`, { state: 'closed' }); changed(`closed PR #${closed.number}`); }

  // 4) draft / WIP PR
  await ensureCommit(R, 'wip/dark-dimmed', 'WIP: dimmed dark palette', [
    { op: 'create', path: 'web/styles/dimmed.css', content: "[data-color-mode='dimmed'] {\n  --fg-default: #d1d7e0;\n  --bg-default: #212830;\n  --border-default: #3d444d;\n}\n" },
  ], { author: 'carol-ops', date: daysAgo(6), newBranchFrom: (await get(`/repos/${R}/branches/wip%2Fdark-dimmed`)) ? undefined : 'main' });
  const draft = await ensurePR(R, {
    head: 'wip/dark-dimmed', author: 'carol-ops', title: 'WIP: Dimmed dark palette',
    body: 'Draft — do not merge yet. Needs #16 first.', labels: ['enhancement', 'area/theme'], milestone: ms['v2.0 — Theming API'].id,
  }, labelsByName);
  out.draft = draft.number;

  // 5) small open PR with requested reviewer and failing check
  await ensureCommit(R, 'feature/kbd-hints', 'Show keyboard shortcut hints on buttons', [
    { op: 'update', path: 'web/src/components/Button.tsx', content: C.BUTTON_TSX.replace('  onClick?: () => void;', '  onClick?: () => void;\n  /** Keyboard shortcut shown next to the label, e.g. "⌘K". */\n  shortcut?: string;') },
  ], { author: 'dave-qa', date: daysAgo(3), newBranchFrom: (await get(`/repos/${R}/branches/feature%2Fkbd-hints`)) ? undefined : 'main' });
  const open = await ensurePR(R, {
    head: 'feature/kbd-hints', author: 'dave-qa', title: 'Show keyboard shortcut hints on buttons',
    body: `Part of #${issues.a11y}. Adds an optional \`shortcut\` prop.`, labels: ['enhancement', 'good first issue'], reviewers: ['alice-dev'],
  }, labelsByName);
  out.open = open.number;
  return out;
}

async function rawFile(R, p, ref) {
  const r = await request('GET', `${API}/repos/${R}/raw/${p}?ref=${enc(ref)}`, { raw: true });
  if (r.status !== 200) throw new Error(`raw ${p}@${ref}: ${r.status}`);
  return r.data;
}

// ---------------------------------------------------------------- releases, wiki, social
async function seedReleases(R) {
  const main = await get(`/repos/${R}/branches/main`);
  const specs = [
    { tag: 'v0.9.0', name: 'v0.9.0 — Foundations', body: '## What\'s new\n\n- Project skeleton\n- Light palette\n\n**Full changelog**: CHANGELOG.md', author: 'bob-dev' },
    { tag: 'v1.0.0', name: 'v1.0.0 — Public preview', author: 'alice-dev', assets: true,
      body: `## Highlights\n\n- :art: Markdown showcase README\n- :new_moon: Dark palette\n- :bug: Typos fixed in the guide (#17)\n\n## Breaking changes\n\n> [!WARNING]\n> \`main.css\` will be renamed to \`base.css\` in the next release.\n\n## Checksums\n\n| File | SHA-256 |\n| --- | --- |\n| theme-playground-1.0.0.tar.gz | see \`checksums.txt\` |\n\nThanks @bob-dev, @carol-ops and @dave-qa!` },
    { tag: 'v1.1.0-rc.1', name: 'v1.1.0-rc.1', prerelease: true, author: 'alice-dev', body: 'Release candidate with design tokens (#16). Please test and report issues.' },
    { tag: 'v1.2.0', name: 'v1.2.0 (draft)', draft: true, author: 'alice-dev', body: 'Draft release notes — not published yet.' },
  ];
  const all = await getAll(`/repos/${R}/releases`).catch(() => []);
  const out = [];
  for (const s of specs) {
    let rel = all.find((r) => r.tag_name === s.tag) || (await get(`/repos/${R}/releases/tags/${enc(s.tag)}`));
    if (!rel) {
      rel = await post(`/repos/${R}/releases`, {
        tag_name: s.tag, target_commitish: main.commit.id, name: s.name, body: `${s.body}\n\n${MARK}`,
        draft: !!s.draft, prerelease: !!s.prerelease,
      }, { sudo: s.author });
      changed(`release ${s.tag}`);
    } else skip(`release ${s.tag}`);
    if (s.assets) {
      const tarball = zlib.gzipSync(C.makeTar([
        { name: 'theme-playground-1.0.0/README.md', content: C.readme() },
        { name: 'theme-playground-1.0.0/LICENSE', content: C.LICENSE },
      ]));
      const files = [
        ['theme-playground-1.0.0.tar.gz', tarball, 'application/gzip'],
        ['logo.png', C.logoPng(96, 0), 'image/png'],
      ];
      files.push(['checksums.txt', Buffer.from(files.map(([n, b]) => `${crypto.createHash('sha256').update(b).digest('hex')}  ${n}`).join('\n') + '\n'), 'text/plain']);
      const cur = (await get(`/repos/${R}/releases/${rel.id}`)).assets || [];
      for (const [name, buf, type] of files) {
        if (cur.some((a) => a.name === name)) { skip(`asset ${name}`); continue; }
        const fd = new FormData();
        fd.append('attachment', new Blob([buf], { type }), name);
        await api('POST', `/repos/${R}/releases/${rel.id}/assets?name=${enc(name)}`, { form: fd });
        changed(`release asset ${name}`);
      }
    }
    out.push({ tag: s.tag, draft: !!s.draft, prerelease: !!s.prerelease, gitea_url: `${BASE}/${R}/releases/tag/${enc(s.tag)}` });
  }
  return out;
}

async function seedWiki(R) {
  const pages = await getAll(`/repos/${R}/wiki/pages`).catch(() => []);
  const out = [];
  for (const p of C.WIKI_PAGES) {
    const exists = pages.some((x) => x.title === p.title) || (await get(`/repos/${R}/wiki/page/${enc(p.title)}`));
    if (!exists) {
      await post(`/repos/${R}/wiki/new`, { title: p.title, content_base64: b64(p.content), message: `Add ${p.title} page` }, { sudo: 'alice-dev' });
      changed(`wiki page ${p.title}`);
    } else skip(`wiki ${p.title}`);
    out.push({ title: p.title, gitea_url: `${BASE}/${R}/wiki/${enc(p.title)}` });
  }
  await tidyWiki(R);
  return out;
}

// Applies C.LEGACY_WIKI_FIXES to existing wiki pages (edits, never deletes).
async function tidyWiki(R) {
  for (const [title, pairs] of Object.entries(C.LEGACY_WIKI_FIXES)) {
    const page = await get(`/repos/${R}/wiki/page/${enc(title)}`);
    if (!page?.content_base64) continue;
    const cur = Buffer.from(page.content_base64, 'base64').toString('utf8');
    let next = cur;
    for (const [a, b] of pairs) next = next.split(a).join(b);
    if (next === cur) { skip(`wiki fixes ${title}`); continue; }
    await patch(`/repos/${R}/wiki/page/${enc(title)}`, { title, content_base64: b64(next), message: `Update ${title}` }, { sudo: 'alice-dev' });
    changed(`wiki page ${title} updated`);
  }
}

async function ensureStar(who, repo) {
  const r = await api('GET', `/user/starred/${repo}`, { sudo: who, allow: [404] });
  if (r.status === 204) { skip('star'); return; }
  await api('PUT', `/user/starred/${repo}`, { sudo: who });
  changed(`${who} starred ${repo}`);
}
async function ensureWatch(who, repo) {
  const r = await api('GET', `/repos/${repo}/subscription`, { sudo: who, allow: [404] });
  if (r.status === 200 && r.data?.subscribed !== false) { skip('watch'); return; }
  await api('PUT', `/repos/${repo}/subscription`, { sudo: who });
  changed(`${who} watches ${repo}`);
}

async function seedFork() {
  const fork = await get(`/repos/bob-dev/${PLAY}`);
  if (fork) {
    skip('fork');
    // a fork copies the parent's description at fork time; keep it in line with the (cleaned) parent
    const parent = await get(`/repos/${PLAY_FULL}`);
    if (parent && fork.description !== parent.description && cleanDescription(fork.description) !== fork.description) {
      await patch(`/repos/bob-dev/${PLAY}`, { description: parent.description });
      changed(`description of bob-dev/${PLAY}`);
    }
    return `bob-dev/${PLAY}`;
  }
  await api('POST', `/repos/${PLAY_FULL}/forks`, { body: {}, sudo: 'bob-dev' });
  changed(`fork bob-dev/${PLAY}`);
  return `bob-dev/${PLAY}`;
}

const ORG_README = () => `## octo-org

We build design tokens, themes and small developer tools.

- :art: [theme-playground](${BASE}/${PLAY_FULL}): markdown, diffs, CI and releases in one place
- :package: Tools we use every day: [grex](${BASE}/${ORG}/grex), [prom_ex](${BASE}/${ORG}/prom_ex) and [folderify](${BASE}/${ORG}/folderify)
- :handshake: Contributions are welcome. Open an issue or a pull request in any repository.

> [!TIP]
> New here? Start with the [wiki](${BASE}/${PLAY_FULL}/wiki).
`;
// what older runs committed (named the seed script); replaced as a whole by ensureFileFixes
const LEGACY_ORG_README = () => `## octo-org\n\nA seeded organization used to build and screenshot a GitHub-lookalike Gitea theme.\n\n- :package: Repositories migrated from public GitHub projects for side-by-side comparison\n- :test_tube: [theme-playground](${BASE}/${PLAY_FULL}) exercises markdown, diffs, CI and releases\n\n> [!NOTE]\n> All data here is test data created by \`tools/seed/seed.mjs\`.\n`;

async function seedProfiles() {
  // user profile README (alice-dev/.profile) and org profile README (octo-org/.profile)
  await ensureRepo('alice-dev', '.profile', { description: '', isOrg: false });
  await ensureCommit('alice-dev/.profile', 'main', 'Add profile README', [{ op: 'create', path: 'README.md', content:
    `### Hi there, I'm Alice :wave:\n\n- :art: I work on design tokens and theming at **octo-org**\n- :seedling: Currently polishing [theme-playground](${BASE}/${PLAY_FULL})\n- :speech_balloon: Ask me about color contrast\n\n| Language | Share |\n| --- | ---: |\n| TypeScript | 48% |\n| Go | 32% |\n| CSS | 20% |\n` }],
  { author: 'alice-dev', date: daysAgo(70) });
  await ensureRepo(ORG, '.profile', { description: '' });
  await ensureCommit(`${ORG}/.profile`, 'main', 'Add organization profile README', [{ op: 'create', path: 'README.md', content: ORG_README() }],
  { author: 'alice-dev', date: daysAgo(70) });
  await ensureFileFixes(`${ORG}/.profile`, 'main', 'Update README.md', { 'README.md': [[LEGACY_ORG_README(), ORG_README()]] }, { author: 'alice-dev' });
}

// ---------------------------------------------------------------- migrations
async function seedMigrations() {
  const out = [];
  for (const m of MIGRATIONS) {
    const full = `${ORG}/${m.name}`;
    let repo = await get(`/repos/${full}`);
    if (repo && !repo.empty) {
      skip(`migration ${full}`);
    } else if (SKIP_MIGRATIONS) {
      log(`  ! migration ${full} skipped (--skip-migrations)`);
      out.push({ ...m, full_name: full, status: 'skipped' });
      continue;
    } else {
      if (repo && repo.empty) throw new Error(`${full} exists but is empty (a previous migration probably failed); delete it manually and re-run`);
      if (!GH_TOKEN) GH_TOKEN = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
      const gh = JSON.parse(execFileSync('gh', ['api', `repos/${m.github}`], { encoding: 'utf8' }));
      log(`  … migrating github.com/${m.github} -> ${full} (this can take several minutes)`);
      const t0 = Date.now();
      const r = await longPost('/repos/migrate', {
        clone_addr: `https://github.com/${m.github}.git`, service: 'github', auth_token: GH_TOKEN,
        repo_owner: ORG, repo_name: m.name, mirror: false, private: false,
        description: (gh.description || '').slice(0, 255), // exactly the github.com description
        wiki: true, milestones: true, labels: true, issues: true, pull_requests: true, releases: true, lfs: false,
      });
      if (r.status !== 201) throw new Error(`migrate ${m.github}: ${r.status} ${scrub(JSON.stringify(r.data)).slice(0, 400)}`);
      changed(`migrated github.com/${m.github} -> ${full} in ${Math.round((Date.now() - t0) / 1000)}s`);
      repo = await get(`/repos/${full}`);
    }
    await tidyMigratedRepo(m);
    out.push({ ...m, full_name: full, status: 'ok' });
  }
  return out;
}

// Migrated repos keep github.com's description and topics (the migration copies both); older runs added a
// '[seed] ' prefix, a ' (migrated from github.com/...)' suffix and two marker topics. Remove them.
async function tidyMigratedRepo(m) {
  const full = `${ORG}/${m.name}`;
  const repo = await get(`/repos/${full}`);
  if (!repo) return;
  const clean = cleanDescription(repo.description);
  if (clean !== repo.description) { await patch(`/repos/${full}`, { description: clean }); changed(`description of ${full}`); }
  await ensureTopics(ORG, m.name, []);
}

// ---------------------------------------------------------------- actions
async function seedActions(R) {
  const runs = async () => (await get(`/repos/${R}/actions/runs?limit=50`))?.workflow_runs || [];
  let list = await runs();
  if (!list.some((r) => r.event === 'workflow_dispatch')) {
    await api('POST', `/repos/${R}/actions/workflows/ci.yml/dispatches`, { body: { ref: 'main', inputs: { reason: 'manual run' } } });
    changed('workflow_dispatch run of ci.yml');
    await sleep(2000);
    list = await runs();
  } else skip('workflow_dispatch');
  // wait (bounded) for runs to finish
  const deadline = Date.now() + Number(process.env.SEED_ACTIONS_WAIT_MS || 8 * 60 * 1000);
  // stop early when nothing is being picked up (e.g. no runner is available for this org)
  const fingerprint = (l) => l.map((r) => `${r.id}:${r.status}`).join(',');
  let lastChange = Date.now(); let fp = fingerprint(list);
  while (Date.now() < deadline && list.some((r) => r.status !== 'completed')) {
    const pending = list.filter((r) => r.status !== 'completed');
    if (!pending.some((r) => r.status === 'in_progress') && Date.now() - lastChange > 60000) {
      log(`  ! ${pending.length} run(s) still queued and no progress for 60s; not waiting (see README: runner scope)`);
      break;
    }
    log(`  … waiting for ${pending.length} action run(s) to finish`);
    await sleep(10000);
    list = await runs();
    if (fingerprint(list) !== fp) { fp = fingerprint(list); lastChange = Date.now(); }
  }
  return list.map((r) => ({ id: r.id, run_number: r.run_number, event: r.event, head_branch: r.head_branch, status: r.status, conclusion: r.conclusion, title: r.display_title, gitea_url: r.html_url }));
}

// ---------------------------------------------------------------- packages
async function seedPackages() {
  const out = [];
  const auth = { Authorization: `token ${TOKEN}` };
  for (const [ver, text] of [['1.0.0', 'theme-demo 1.0.0\nDemo generic package.\n'], ['1.1.0', 'theme-demo 1.1.0\nDemo generic package (newer version).\n']]) {
    const exists = await get(`/packages/${ORG}/generic/theme-demo/${ver}`);
    if (!exists) {
      const r = await request('PUT', `${BASE}/api/packages/${ORG}/generic/theme-demo/${ver}/file.txt`, { body: Buffer.from(text), headers: { ...auth, 'Content-Type': 'text/plain' }, auth: 'none' });
      if (r.status !== 201) throw new Error(`generic package upload ${ver}: ${r.status} ${JSON.stringify(r.data)}`);
      changed(`generic package theme-demo@${ver}`);
    } else skip(`generic ${ver}`);
    out.push({ type: 'generic', name: 'theme-demo', version: ver, gitea_url: `${BASE}/${ORG}/-/packages/generic/theme-demo/${ver}` });
  }
  // npm
  const npmName = `@${ORG}/theme-tokens`;
  const npmVer = '1.0.0';
  const npmExists = await get(`/packages/${ORG}/npm/${enc(npmName)}/${npmVer}`);
  if (!npmExists) {
    const pkgJson = { name: npmName, version: npmVer, description: 'Design tokens for the theme playground', main: 'index.js', license: 'MIT', keywords: ['design-tokens', 'tokens'] };
    const readmeTxt = `# ${npmName}\n\nDesign tokens as a tiny npm package.\n\n\`\`\`js\nimport tokens from '${npmName}';\n\`\`\`\n`;
    const tgz = zlib.gzipSync(C.makeTar([
      { name: 'package/package.json', content: JSON.stringify(pkgJson, null, 2) },
      { name: 'package/index.js', content: "module.exports = { 'fgColor-default': '#1f2328', 'bgColor-default': '#ffffff' };\n" },
      { name: 'package/README.md', content: readmeTxt },
    ]));
    const tarballName = `theme-tokens-${npmVer}.tgz`;
    const body = {
      _id: npmName, name: npmName, description: pkgJson.description, 'dist-tags': { latest: npmVer },
      versions: { [npmVer]: { ...pkgJson, _id: `${npmName}@${npmVer}`, readme: readmeTxt,
        dist: { shasum: crypto.createHash('sha1').update(tgz).digest('hex'), integrity: 'sha512-' + crypto.createHash('sha512').update(tgz).digest('base64'),
          tarball: `${BASE}/api/packages/${ORG}/npm/${npmName}/-/${npmVer}/${tarballName}` } } },
      readme: readmeTxt,
      _attachments: { [tarballName]: { content_type: 'application/octet-stream', data: tgz.toString('base64'), length: tgz.length } },
    };
    const r = await request('PUT', `${BASE}/api/packages/${ORG}/npm/${npmName.replace('/', '%2f')}`, { body: Buffer.from(JSON.stringify(body)), headers: { ...auth, 'Content-Type': 'application/json' }, auth: 'none' });
    if (r.status !== 201) throw new Error(`npm publish: ${r.status} ${JSON.stringify(r.data)}`);
    changed(`npm package ${npmName}@${npmVer}`);
  } else skip('npm');
  out.push({ type: 'npm', name: npmName, version: npmVer, gitea_url: `${BASE}/${ORG}/-/packages/npm/${enc(npmName)}/${npmVer}` });
  // link packages to the playground repo (so they show on the repo's packages tab)
  for (const [type, name] of [['generic', 'theme-demo'], ['npm', npmName]]) {
    const p = await get(`/packages/${ORG}/${type}/${enc(name)}/${type === 'npm' ? npmVer : '1.0.0'}`);
    if (p && !p.repository) {
      const r = await api('POST', `/packages/${ORG}/${type}/${enc(name)}/-/link/${PLAY}`, { allow: [404, 405] });
      if (r.status < 300) changed(`linked ${type} ${name} to ${PLAY}`);
    } else skip('pkg link');
  }
  return out;
}

// ---------------------------------------------------------------- projects (web UI, no API)
async function webLogin(user, password) {
  const res = await fetch(`${BASE}/user/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user_name: user, password }).toString(),
  });
  // the session is regenerated on login, so keep only the last value of each cookie name
  const jar = new Map();
  for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const i = kv.indexOf('='); jar.set(kv.slice(0, i), kv.slice(i + 1)); }
  if ((res.status !== 303 && res.status !== 302) || res.headers.get('location')?.includes('/user/login')) throw new Error(`web login as ${user} failed: ${res.status}`);
  const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  const check = await fetch(`${BASE}/user/settings`, { redirect: 'manual', headers: { Cookie: cookie } });
  if (check.status !== 200) throw new Error(`web session for ${user} not valid (${check.status})`);
  return cookie;
}

async function seedProjects(R, issues) {
  const cookie = await webLogin('alice-dev', SEED_PASSWORD);
  const web = async (method, p, body, type = 'application/x-www-form-urlencoded') => {
    const res = await fetch(`${BASE}${p}`, { method, redirect: 'manual', headers: { Cookie: cookie, ...(body ? { 'Content-Type': type } : {}) }, body });
    return { status: res.status, text: await res.text() };
  };
  const listProjects = async () => {
    const out = [];
    for (const state of ['open', 'closed']) {
      const { text } = await web('GET', `/${R}/projects?state=${state}`);
      for (const m of text.matchAll(/<a class="muted" href="\/[^"]*\/projects\/(\d+)">([^<]+)<\/a>/g)) out.push({ id: Number(m[1]), title: m[2].trim(), state });
    }
    return out;
  };
  const specs = [
    { title: 'Theme v1 board', content: 'Kanban board for the v1.0 public preview.', template: 1, cards: { 'To Do': ['a11y', 'motion'], 'In Progress': ['alerts', 'diff-overflow'], Done: ['kbd'], Backlog: ['mermaid'] } },
    { title: 'Bug triage', content: 'Incoming bugs waiting for triage.', template: 2, cards: {} },
  ];
  let projects = await listProjects();
  const out = [];
  for (const s of specs) {
    let p = projects.find((x) => x.title === s.title);
    if (!p) {
      const r = await web('POST', `/${R}/projects/new`, new URLSearchParams({ title: s.title, content: s.content, template_type: String(s.template), card_type: '1' }).toString());
      if (r.status >= 400) throw new Error(`create project ${s.title}: ${r.status}`);
      changed(`project ${s.title}`);
      projects = await listProjects();
      p = projects.find((x) => x.title === s.title);
      if (!p) throw new Error(`project ${s.title} not found after creation`);
    } else skip(`project ${s.title}`);
    // columns
    const { text } = await web('GET', `/${R}/projects/${p.id}`);
    const columns = [];
    for (const m of text.matchAll(/<div class="project-column"[^>]*data-id="(\d+)"[\s\S]*?project-column-title-text[^>]*>([\s\S]*?)<\/div>/g)) {
      columns.push({ id: Number(m[1]), title: m[2].replace(/<[^>]+>/g, '').trim() });
    }
    for (const [colTitle, keys] of Object.entries(s.cards)) {
      const col = columns.find((c) => c.title === colTitle);
      if (!col) { log(`  ! column ${colTitle} not found in project ${s.title}`); continue; }
      const moves = [];
      for (const key of keys) {
        const issue = await get(`/repos/${R}/issues/${issues[key]}`);
        // assign issue to project via API if missing
        if (!(await issueInProject(web, R, p.id, issue.id))) {
          await patch(`/repos/${R}/issues/${issue.number}`, { projects: [p.id] });
          changed(`issue #${issue.number} added to project ${s.title}`);
          moves.push(issue.id);
        } else skip('project card');
      }
      if (moves.length) {
        const r = await web('POST', `/${R}/projects/${p.id}/${col.id}/move`, JSON.stringify({ issues: moves.map((id, i) => ({ issueID: id, sorting: i })) }), 'application/json');
        if (r.status >= 400) throw new Error(`move cards: ${r.status} ${r.text.slice(0, 200)}`);
        changed(`moved ${moves.length} card(s) to ${colTitle}`);
      }
    }
    out.push({ id: p.id, title: s.title, gitea_url: `${BASE}/${R}/projects/${p.id}` });
  }
  return out;
}
async function issueInProject(web, R, projectId, issueId) {
  const { text } = await web('GET', `/${R}/projects/${projectId}`);
  return text.includes(`data-issue="${issueId}"`);
}

// ---------------------------------------------------------------- manifest
async function mostCommented(full) {
  const all = await getAll(`/repos/${full}/issues?state=all&type=issues`);
  all.sort((a, b) => b.comments - a.comments);
  return all[0] ? { number: all[0].number, comments: all[0].comments, title: all[0].title } : null;
}
async function notablePRs(full) {
  const all = await getAll(`/repos/${full}/pulls?state=all`);
  const merged = all.filter((p) => p.merged);
  const closed = all.filter((p) => p.state === 'closed' && !p.merged);
  const open = all.filter((p) => p.state === 'open');
  // list responses do not carry diff stats: fetch details for recent human-authored merged PRs and pick a mid-sized diff
  const human = merged.filter((p) => !/bot/i.test(p.user?.login || '') && !/^(chore\(deps\)|build\(deps\)|bump )/i.test(p.title)).slice(0, 40);
  const detailed = [];
  for (const p of human) {
    const d = await get(`/repos/${full}/pulls/${p.number}`);
    if (d) detailed.push(d);
  }
  const midsize = detailed.filter((d) => d.changed_files >= 3 && d.changed_files <= 60);
  const biggest = (midsize.length ? midsize : detailed).sort((a, b) => (b.changed_files || 0) - (a.changed_files || 0))[0];
  const openHuman = open.find((p) => !/bot/i.test(p.user?.login || '')) || open[0];
  return {
    merged: human[0]?.number ?? merged[0]?.number ?? null, closed_unmerged: (closed.find((p) => !/bot/i.test(p.user?.login || '')) || closed[0])?.number ?? null, open: openHuman?.number ?? null,
    largest_merged: biggest ? { number: biggest.number, changed_files: biggest.changed_files, additions: biggest.additions, deletions: biggest.deletions } : null,
    counts: { merged: merged.length, closed_unmerged: closed.length, open: open.length },
  };
}

function ghRunUrl(repo) {
  try {
    return JSON.parse(execFileSync('gh', ['api', `repos/${repo}/actions/runs?per_page=1`], { encoding: 'utf8' })).workflow_runs?.[0]?.html_url || null;
  } catch { return null; }
}

async function buildManifest(ctx) {
  const G = (p) => `${BASE}${p}`;
  const H = (p) => (p === null ? null : `https://github.com${p}`);
  const repos = [];
  const migrated = {};
  for (const m of MIGRATIONS) {
    const full = `${ORG}/${m.name}`;
    const repo = await get(`/repos/${full}`);
    if (!repo) { repos.push({ full_name: full, gitea_url: G(`/${full}`), github_url: H(`/${m.github}`), status: 'missing' }); continue; }
    const releases = (await getAll(`/repos/${full}/releases`)).map((r) => r.tag_name);
    const milestones = (await getAll(`/repos/${full}/milestones?state=all`)).map((x) => ({ title: x.title, state: x.state }));
    const wikiPages = (await getAll(`/repos/${full}/wiki/pages`).catch(() => [])).map((p) => p.title);
    const commits = await branchCommits(full, repo.default_branch, 1);
    const info = {
      default_branch: repo.default_branch, head_sha: commits[0]?.sha, open_issues: repo.open_issues_count, open_prs: repo.open_pr_counter,
      release_tags: releases.slice(0, 20), release_count: releases.length, milestones, wiki_pages: wikiPages,
      most_commented_issue: await mostCommented(full), pulls: await notablePRs(full),
    };
    migrated[m.name] = info;
    repos.push({ full_name: full, source: 'github-migration', github_repo: m.github, why: m.why, gitea_url: G(`/${full}`), github_url: H(`/${m.github}`), ...info });
  }
  const playRepo = await get(`/repos/${PLAY_FULL}`);
  const playHead = (await branchCommits(PLAY_FULL, 'main', 1))[0]?.sha;
  repos.push({ full_name: PLAY_FULL, source: 'native', gitea_url: G(`/${PLAY_FULL}`), github_url: null, head_sha: playHead, stars: playRepo?.stars_count, forks: playRepo?.forks_count });
  repos.push({ full_name: `${ORG}/.profile`, source: 'native', gitea_url: G(`/${ORG}/.profile`), github_url: null });
  repos.push({ full_name: 'alice-dev/.profile', source: 'native', gitea_url: G('/alice-dev/.profile'), github_url: null });
  repos.push({ full_name: `bob-dev/${PLAY}`, source: 'fork', gitea_url: G(`/bob-dev/${PLAY}`), github_url: null });

  const grex = migrated.grex || {};
  const gx = (p) => G(`/${ORG}/grex${p}`);
  const gh = (p) => H(`/pemistahl/grex${p}`);
  const folder = migrated.folderify || {};
  const grexSha = grex.head_sha;
  const grexRelease = grex.release_tags?.[0];
  const grexIssue = grex.most_commented_issue?.number;
  const grexMerged = grex.pulls?.largest_merged?.number ?? grex.pulls?.merged;
  const grexClosed = grex.pulls?.closed_unmerged;
  const ours = (ctx.actions || []).filter((r) => r.event === 'workflow_dispatch' || /^(docs: reference the first commit|Refactor palette|Show keyboard|WIP|docs: fix typos|Experiment)/.test(r.title || ''));
  const actionRun = ours.find((r) => r.conclusion === 'failure') || ours.find((r) => r.event === 'workflow_dispatch') || ours[0] || ctx.actions?.[0];
  const ghRun = ctx.ghGrexRun;
  const P = (p) => G(`/${PLAY_FULL}${p}`);
  const pr = ctx.prs || {};

  const routes = [
    { name: 'dashboard', auth: 'admin', gitea: G('/'), github: H('/') },
    { name: 'repo home', gitea: gx(''), github: gh('') },
    { name: 'repo home (markdown showcase, playground)', gitea: P(''), github: null },
    { name: 'file view (source)', gitea: gx(`/src/branch/${grex.default_branch || 'main'}/src/main.rs`), github: gh(`/blob/${grex.default_branch || 'main'}/src/main.rs`) },
    { name: 'file view (markdown)', gitea: gx(`/src/branch/${grex.default_branch || 'main'}/README.md`), github: gh(`/blob/${grex.default_branch || 'main'}/README.md`) },
    { name: 'file view (large file, playground)', gitea: P('/src/branch/main/internal/palette/generated.go'), github: null },
    { name: 'file view (image, playground)', gitea: P('/src/branch/main/assets/images/logo.png'), github: null },
    { name: 'directory tree', gitea: gx(`/src/branch/${grex.default_branch || 'main'}/src`), github: gh(`/tree/${grex.default_branch || 'main'}/src`) },
    { name: 'blame', gitea: gx(`/blame/branch/${grex.default_branch || 'main'}/README.md`), github: gh(`/blame/${grex.default_branch || 'main'}/README.md`) },
    { name: 'blame (playground, multiple authors)', gitea: P('/blame/branch/main/internal/render/render.go'), github: null },
    { name: 'commits', gitea: gx(`/commits/branch/${grex.default_branch || 'main'}`), github: gh(`/commits/${grex.default_branch || 'main'}`) },
    { name: 'commit detail', gitea: grexSha ? gx(`/commit/${grexSha}`) : null, github: grexSha ? gh(`/commit/${grexSha}`) : null },
    { name: 'branches', gitea: gx('/branches'), github: gh('/branches') },
    { name: 'tags', gitea: gx('/tags'), github: gh('/tags') },
    { name: 'releases', gitea: gx('/releases'), github: gh('/releases') },
    { name: 'release detail', gitea: grexRelease ? gx(`/releases/tag/${grexRelease}`) : null, github: grexRelease ? gh(`/releases/tag/${grexRelease}`) : null },
    { name: 'releases (playground, with assets/prerelease/draft)', gitea: P('/releases'), github: null },
    { name: 'wiki home', gitea: G(`/${ORG}/folderify/wiki`), github: H('/lgarron/folderify/wiki') },
    { name: 'wiki page list', gitea: G(`/${ORG}/folderify/wiki/?action=_pages`), github: H('/lgarron/folderify/wiki/_pages') },
    { name: 'wiki page', gitea: G(`/${ORG}/folderify/wiki/Home`), github: H('/lgarron/folderify/wiki/Home') },
    { name: 'repo home (README with images and tables)', gitea: G(`/${ORG}/prom_ex`), github: H('/akoutmos/prom_ex') },
    { name: 'wiki page (playground)', gitea: P('/wiki/Architecture'), github: null },
    { name: 'issues list', gitea: gx('/issues'), github: gh('/issues') },
    { name: 'issues list (closed)', gitea: gx('/issues?state=closed'), github: gh('/issues?q=is%3Aissue%20state%3Aclosed') },
    { name: 'issue detail (most comments)', gitea: grexIssue ? gx(`/issues/${grexIssue}`) : null, github: grexIssue ? gh(`/issues/${grexIssue}`) : null },
    { name: 'issue detail (playground, reactions/alerts/tables)', gitea: P(`/issues/${ctx.issues?.alerts ?? 2}`), github: null },
    { name: 'labels', gitea: gx('/labels'), github: gh('/labels') },
    { name: 'milestones', gitea: gx('/milestones'), github: gh('/milestones') },
    { name: 'PR list', gitea: gx('/pulls'), github: gh('/pulls') },
    { name: 'PR conversation (merged)', gitea: grexMerged ? gx(`/pulls/${grexMerged}`) : null, github: grexMerged ? gh(`/pull/${grexMerged}`) : null },
    { name: 'PR conversation (open)', gitea: grex.pulls?.open ? gx(`/pulls/${grex.pulls.open}`) : null, github: grex.pulls?.open ? gh(`/pull/${grex.pulls.open}`) : null },
    { name: 'PR commits tab', gitea: grexMerged ? gx(`/pulls/${grexMerged}/commits`) : null, github: grexMerged ? gh(`/pull/${grexMerged}/commits`) : null },
    { name: 'PR conversation (closed unmerged)', gitea: grexClosed ? gx(`/pulls/${grexClosed}`) : null, github: grexClosed ? gh(`/pull/${grexClosed}`) : null },
    { name: 'PR files changed (split)', gitea: grexMerged ? gx(`/pulls/${grexMerged}/files?style=split`) : null, github: grexMerged ? gh(`/pull/${grexMerged}/files?diff=split`) : null },
    { name: 'PR files changed (unified)', gitea: grexMerged ? gx(`/pulls/${grexMerged}/files?style=unified`) : null, github: grexMerged ? gh(`/pull/${grexMerged}/files?diff=unified`) : null },
    { name: 'PR conversation (playground large diff, reviews)', gitea: P(`/pulls/${pr.large_diff}`), github: null },
    { name: 'PR files changed split (playground large diff)', gitea: P(`/pulls/${pr.large_diff}/files?style=split`), github: null },
    { name: 'PR files changed unified (playground large diff)', gitea: P(`/pulls/${pr.large_diff}/files?style=unified`), github: null },
    { name: 'PR commits tab (playground)', gitea: P(`/pulls/${pr.large_diff}/commits`), github: null },
    { name: 'PR draft/WIP (playground)', gitea: P(`/pulls/${pr.draft}`), github: null },
    { name: 'compare (two tags)', gitea: grex.release_tags?.[1] ? gx(`/compare/${grex.release_tags[1]}...${grex.release_tags[0]}`) : null, github: grex.release_tags?.[1] ? gh(`/compare/${grex.release_tags[1]}...${grex.release_tags[0]}`) : null },
    { name: 'actions list', gitea: P('/actions'), github: gh('/actions') },
    { name: 'action run', gitea: actionRun?.gitea_url || null, github: ghRun },
    { name: 'packages (org)', gitea: G(`/${ORG}/-/packages`), github: null },
    { name: 'package detail (npm)', gitea: G(`/${ORG}/-/packages/npm/${enc(`@${ORG}/theme-tokens`)}/1.0.0`), github: null },
    { name: 'projects list', gitea: P('/projects'), github: null },
    { name: 'project board', gitea: ctx.projects?.[0]?.gitea_url || null, github: null },
    { name: 'user profile', gitea: G('/alice-dev'), github: H('/pemistahl') },
    { name: 'user profile (stars tab)', gitea: G('/alice-dev?tab=stars'), github: H('/pemistahl?tab=stars') },
    { name: 'user profile (repositories tab)', gitea: G('/alice-dev?tab=repositories'), github: H('/pemistahl?tab=repositories') },
    { name: 'org home', gitea: G(`/${ORG}`), github: H('/go-gitea') },
    { name: 'org members', gitea: G(`/org/${ORG}/members`), github: H('/orgs/go-gitea/people') },
    { name: 'org teams', auth: 'admin', gitea: G(`/org/${ORG}/teams`), github: null },
    { name: 'explore repos', gitea: G('/explore/repos'), github: H('/explore') },
    { name: 'explore users', gitea: G('/explore/users'), github: null },
    { name: 'explore orgs', gitea: G('/explore/organizations'), github: null },
    { name: 'repo settings', auth: 'admin', gitea: gx('/settings'), github: null },
    { name: 'user settings: profile', auth: 'admin', gitea: G('/user/settings'), github: H('/settings/profile') },
    { name: 'user settings: appearance', auth: 'admin', gitea: G('/user/settings/appearance'), github: H('/settings/appearance') },
    { name: 'user settings: keys', auth: 'admin', gitea: G('/user/settings/keys'), github: H('/settings/keys') },
    { name: 'admin dashboard', auth: 'admin', gitea: G('/-/admin'), github: null },
    { name: 'admin users', auth: 'admin', gitea: G('/-/admin/users'), github: null },
    { name: 'admin repos', auth: 'admin', gitea: G('/-/admin/repos'), github: null },
    { name: 'admin config', auth: 'admin', gitea: G('/-/admin/config'), github: null },
    { name: 'sign in', auth: 'anonymous', gitea: G('/user/login'), github: H('/login') },
    { name: 'sign up', auth: 'anonymous', gitea: G('/user/sign_up'), github: H('/signup') },
    { name: '404', gitea: G('/this-page-does-not-exist-theme-seed'), github: H('/this-page-does-not-exist-theme-seed') },
  ];

  return {
    generated_at: new Date().toISOString(),
    generator: 'tools/seed/seed.mjs',
    gitea_base: BASE,
    note: 'Everything listed here was created by the seed script. Seeded users share the password documented in tools/seed/README.md. Pre-seed baseline (admin, ai, admin/jiri, ai/jiri) is untouched.',
    markers: MARKERS,
    run: { changes: stats.changes, failures: stats.failures },
    users: USERS.map((u) => ({ login: u.login, full_name: u.full_name, gitea_url: G(`/${u.login}`), github_url: null })),
    orgs: [
      { name: ORG, gitea_url: G(`/${ORG}`), teams: ['Owners', 'core', 'triage'].map((t) => ({ name: t, gitea_url: G(`/org/${ORG}/teams/${t.toLowerCase()}`) })) },
      { name: ORG2, gitea_url: G(`/${ORG2}`), teams: [] },
    ],
    repos,
    playground: {
      repo: PLAY_FULL,
      gitea_url: G(`/${PLAY_FULL}`),
      issues: ctx.issues ? Object.fromEntries(Object.entries(ctx.issues).map(([k, n]) => [k, { number: n, gitea_url: P(`/issues/${n}`) }])) : null,
      notable: {
        pinned_issue: ctx.issues?.roadmap, issue_with_most_comments: ctx.issues?.alerts,
        large_diff_pr: pr.large_diff, merged_pr: pr.merged, closed_unmerged_pr: pr.closed_unmerged, draft_pr: pr.draft, open_pr: pr.open,
      },
      pulls: Object.fromEntries(Object.entries(pr).map(([k, n]) => [k, { number: n, gitea_url: P(`/pulls/${n}`), files_url: P(`/pulls/${n}/files`) }])),
      releases: ctx.releases || [],
      wiki: ctx.wiki || [],
      projects: ctx.projects || [],
      actions_runs: ctx.actions || [],
      actions_note: (ctx.actions || []).every((r) => r.status === 'completed') ? null
        : 'Runs stay queued: the only runner (gitea-runner-1) is registered as a user-level runner of admin (owner_id=1), so it only executes jobs for repos owned by admin. Register an org/instance runner to execute them.',
      foreign_activity_note: 'Items in theme-playground not listed here (e.g. "Smoke issue/PR ..." by admin) were created by other sessions, not by this script.',
    },
    migrated,
    packages: ctx.packages || [],
    social: { fork: ctx.fork ? G(`/${ctx.fork}`) : null, stars: ctx.stars || [] },
    routes,
  };
}

const MARKERS = {
  how_to_recognise: 'This manifest is the machine-readable marker for seeded objects (users, orgs, repos, issues, PRs, releases, wiki, packages). Issue/PR/release bodies created by the script also end with the invisible HTML comment below. The admin API token used by the script is named theme-seed.',
  hidden_body_marker: MARK,
  api_token_name: TOKEN_NAME,
  visible_markers: 'none (FG-015): no [seed] description prefix, no "(migrated from ...)" suffix, no theme-seed/migrated-from-github topics, no "seeded" wording in bios, org descriptions or READMEs. `node tools/seed/seed.mjs --only=tidy` removes those from instances seeded by older versions.',
  legacy_visible_markers_removed: { description_prefix: '[seed] ', description_suffix: ' (migrated from github.com/<owner>/<repo>)', topics: LEGACY_TOPICS },
};

// ---------------------------------------------------------------- main
async function step(name, fn, ctx, key) {
  log(`• ${name}`);
  try {
    const v = await fn();
    if (key) ctx[key] = v;
    return v;
  } catch (e) {
    const msg = scrub(e?.stack || e);
    stats.failures.push({ step: name, error: scrub(e?.message || e) });
    log(`  ! ${name} failed: ${msg}`);
    return undefined;
  }
}

async function main() {
  const t0 = Date.now();
  const ctx = {};
  await ensureToken();
  if (ONLY_TIDY) {
    // Only removes visible seed markers from existing objects (no migrations, no new content, manifest untouched).
    await step('users', ensureUsers, ctx);
    await step(`org ${ORG}`, () => ensureOrg(ORG, ORG_SPECS[ORG], ['alice-dev']), ctx);
    await step(`org ${ORG2}`, () => ensureOrg(ORG2, ORG_SPECS[ORG2], ['carol-ops']), ctx);
    await step('playground repo', () => ensureRepo(ORG, PLAY, { description: PLAY_DESCRIPTION, website: 'https://example.com/theme-playground', topics: ['markdown', 'design-tokens', 'playground'] }), ctx);
    await step('playground files', tidyPlaygroundFiles, ctx);
    await step('wiki', () => tidyWiki(PLAY_FULL), ctx);
    await step('profiles', seedProfiles, ctx);
    await step('fork', seedFork, ctx);
    for (const m of MIGRATIONS) await step(`migrated ${m.name}`, () => tidyMigratedRepo(m), ctx);
    log(`\nDone in ${Math.round((Date.now() - t0) / 1000)}s: ${stats.changes} change(s), ${stats.failures.length} failure(s). Manifest not rewritten (--only=tidy).`);
    if (stats.failures.length) process.exitCode = 1;
    return;
  }
  if (!ONLY_MANIFEST) {
    await step('users', ensureUsers, ctx);
    await step(`org ${ORG}`, () => ensureOrg(ORG, ORG_SPECS[ORG], ['alice-dev']), ctx);
    await step(`org ${ORG2}`, () => ensureOrg(ORG2, ORG_SPECS[ORG2], ['carol-ops']), ctx);
    await step('teams', ensureTeams, ctx);
    await step('playground code', seedPlaygroundCode, ctx);
    const labels = await step('labels', () => seedLabels(PLAY_FULL), ctx);
    const ms = await step('milestones', () => seedMilestones(PLAY_FULL), ctx);
    if (labels && ms) {
      await step('issues', () => seedIssues(PLAY_FULL, labels, ms), ctx, 'issues');
      if (ctx.issues) await step('pull requests', () => seedPulls(PLAY_FULL, labels, ms, ctx.issues), ctx, 'prs');
    }
    await step('releases', () => seedReleases(PLAY_FULL), ctx, 'releases');
    await step('wiki', () => seedWiki(PLAY_FULL), ctx, 'wiki');
    await step('profiles', seedProfiles, ctx);
    await step('fork', seedFork, ctx, 'fork');
    await step('packages', seedPackages, ctx, 'packages');
    if (ctx.issues) await step('projects', () => seedProjects(PLAY_FULL, ctx.issues), ctx, 'projects');
    await step('migrations', seedMigrations, ctx, 'migrations');
    await step('stars and watches', async () => {
      const stars = [['alice-dev', PLAY_FULL], ['bob-dev', PLAY_FULL], ['carol-ops', PLAY_FULL], ['alice-dev', `${ORG}/grex`], ['bob-dev', `${ORG}/folderify`], ['carol-ops', `${ORG}/prom_ex`], ['dave-qa', `${ORG}/grex`]];
      const done = [];
      for (const [who, repo] of stars) { if (await get(`/repos/${repo}`)) { await ensureStar(who, repo); done.push({ user: who, repo }); } }
      for (const who of ['bob-dev', 'dave-qa']) await ensureWatch(who, PLAY_FULL);
      return done;
    }, ctx, 'stars');
    await step('actions', () => seedActions(PLAY_FULL), ctx, 'actions');
  } else {
    // manifest-only: recover numbers from the live instance
    const issues = await getAll(`/repos/${PLAY_FULL}/issues?state=all&type=issues`);
    const ms = Object.fromEntries((await getAll(`/repos/${PLAY_FULL}/milestones?state=all`)).map((m) => [m.title, m]));
    ctx.issues = Object.fromEntries(issueSpecs(ms).map((s) => [s.key, issues.find((i) => i.title === s.title)?.number]));
    const pulls = await getAll(`/repos/${PLAY_FULL}/pulls?state=all`);
    const byHead = (h) => pulls.find((p) => p.head?.ref === h)?.number;
    ctx.prs = { large_diff: byHead('feature/design-tokens'), merged: byHead('docs/fix-typos'), closed_unmerged: byHead('experiment/alt-renderer'), draft: byHead('wip/dark-dimmed'), open: byHead('feature/kbd-hints') };
    ctx.actions = ((await get(`/repos/${PLAY_FULL}/actions/runs?limit=50`))?.workflow_runs || []).map((r) => ({ id: r.id, event: r.event, status: r.status, conclusion: r.conclusion, gitea_url: r.html_url }));
  }
  ctx.ghGrexRun = ghRunUrl('pemistahl/grex');
  const manifest = await buildManifest(ctx);
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');
  log(`\nDone in ${Math.round((Date.now() - t0) / 1000)}s: ${stats.changes} change(s), ${stats.skipped} existing item(s) skipped, ${stats.failures.length} failure(s).`);
  log(`Manifest: ${path.relative(ROOT, MANIFEST_FILE)}`);
  if (stats.failures.length) {
    for (const f of stats.failures) log(`  FAILED ${f.step}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(scrub(e?.stack || e)); process.exit(1); });

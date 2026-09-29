#!/usr/bin/env node
// Fills {{...}} placeholders in tools/shoot/routes.json from docs/seed-manifest.json.
// Idempotent: the original placeholder is kept in `giteaTemplate`, so the file
// can be regenerated whenever the manifest changes.
//
// Placeholders:
//   {{repo.<name>}}    -> /<owner>/<name>            (name or owner/name)
//   {{branch.<repo>}}  -> default branch of the repo (manifest default_branch, else main)
//   {{issue.<repo>}}   -> /<owner>/<repo>/issues/<n> (first issue of the repo in the manifest)
//   {{pull.<repo>}}    -> /<owner>/<repo>/pulls/<n>
//   {{org.<name>}}     -> /<name>
//   {{user.<name>}}    -> /<name>
//   {{route.<key>}}    -> manifest.routes[key] (if the manifest publishes ready-made paths)
//   {{json:<a.b.c>}}   -> any value at that JSON path in the manifest
// Also: every entry in manifest.routes (object {id: path} or array [{id, path|url}])
// that is not yet present in routes.json is appended as {id, gitea, github:null}.
//
// usage: node tools/shoot/routes-from-manifest.mjs [--manifest docs/seed-manifest.json] [--routes tools/shoot/routes.json] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/args.mjs';
import { PROJECT_ROOT } from './lib/gitea.mjs';

const args = parseArgs();
const manifestFile = path.resolve(PROJECT_ROOT, args.manifest || 'docs/seed-manifest.json');
const routesFile = path.resolve(PROJECT_ROOT, args.routes || 'tools/shoot/routes.json');
if (!fs.existsSync(manifestFile)) {
  console.error(`manifest not found: ${manifestFile} — routes with placeholders stay skipped`);
  process.exit(3);
}
const M = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const cfg = JSON.parse(fs.readFileSync(routesFile, 'utf8'));

const arr = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.entries(v).map(([k, x]) => (typeof x === 'object' ? { key: k, ...x } : { key: k, value: x })) : []);
const fullName = (r) => (typeof r === 'string' ? r : r.full_name || r.fullName || (r.owner && r.name ? `${typeof r.owner === 'object' ? r.owner.login || r.owner.username : r.owner}/${r.name}` : r.key || r.name));
const repos = arr(M.repos || M.repositories).map((r) => ({ raw: r, full: fullName(r) })).filter((r) => r.full);
const findRepo = (q) => repos.find((r) => r.full === q) || repos.find((r) => r.full.split('/')[1] === q);
const numberOf = (x) => (typeof x === 'number' ? x : x && (x.number ?? x.index ?? x.id));

function firstOf(kind, repoQ) {
  const repo = findRepo(repoQ);
  if (!repo) return null;
  const keys = kind === 'issue' ? ['issues'] : ['pulls', 'pull_requests', 'pullRequests', 'prs'];
  for (const k of keys) {
    const inRepo = typeof repo.raw === 'object' && repo.raw[k];
    if (inRepo && arr(inRepo).length) return `/${repo.full}/${kind === 'issue' ? 'issues' : 'pulls'}/${numberOf(arr(inRepo)[0])}`;
    const top = arr(M[k]).filter((i) => [i.repo, i.repository, i.full_name].map((v) => (v && typeof v === 'object' ? fullName(v) : v)).includes(repo.full));
    if (top.length) {
      const i = top[0];
      if (i.path) return i.path;
      if (i.url || i.html_url) return new URL(i.url || i.html_url).pathname;
      return `/${repo.full}/${kind === 'issue' ? 'issues' : 'pulls'}/${numberOf(i)}`;
    }
  }
  return null;
}

function resolve(ph) {
  const [kind, ...rest] = ph.split(/[.:]/);
  const arg = ph.slice(kind.length + 1);
  switch (kind) {
    case 'repo': { const r = findRepo(arg); return r ? `/${r.full}` : null; }
    case 'branch': { const r = findRepo(arg); return r ? ((typeof r.raw === 'object' && (r.raw.default_branch || r.raw.defaultBranch)) || 'main') : null; }
    case 'issue': return firstOf('issue', arg);
    case 'pull': return firstOf('pull', arg);
    case 'org': { const o = arr(M.orgs || M.organizations).find((x) => (typeof x === 'string' ? x : x.name || x.username || x.key) === arg); return o ? `/${arg}` : null; }
    case 'user': { const u = arr(M.users).find((x) => (typeof x === 'string' ? x : x.login || x.username || x.name || x.key) === arg); return u ? `/${arg}` : null; }
    case 'route': { const r = M.routes && (Array.isArray(M.routes) ? M.routes.find((x) => x.id === arg) : M.routes[arg]); return r ? (typeof r === 'string' ? r : r.path || r.url) : null; }
    case 'json': return rest.length ? arg.split('.').reduce((o, k) => (o == null ? o : o[k]), M) ?? null : null;
    default: return null;
  }
}

const report = { filled: [], unresolved: [], added: [] };
for (const r of cfg.routes) {
  const tpl = r.giteaTemplate || (typeof r.gitea === 'string' && r.gitea.includes('{{') ? r.gitea : null);
  if (!tpl) continue;
  r.giteaTemplate = tpl;
  let missing = [];
  const filled = tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, ph) => { const v = resolve(ph); if (v == null) { missing.push(ph); return m; } return String(v); });
  r.gitea = filled;
  (missing.length ? report.unresolved : report.filled).push({ id: r.id, gitea: filled, missing: missing.length ? missing : undefined });
}
for (const e of arr(M.routes)) {
  const id = e.id || e.key; const p = e.path || e.url || e.value;
  if (!id || !p || cfg.routes.find((r) => r.id === id)) continue;
  cfg.routes.push({ id, gitea: p, github: e.github ?? null, fromManifest: true, ...(e.auth === false ? { auth: false } : {}) });
  report.added.push(id);
}
if (!args.dry) fs.writeFileSync(routesFile, JSON.stringify(cfg, null, 2) + '\n');
console.log(JSON.stringify(report, null, 1));

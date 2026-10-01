#!/usr/bin/env node
// FG2-105 page-scope check: do page-folder selectors reach pages their folder never targeted?
//
//   node build/page-scope-check.mjs [--live] [--strict] [--quiet] [--seed]
//
// 1. Selectors → scopes. Every rule in src/pages/<group>/**/*.css is parsed (postcss + css-what; `:is()` / `:where()`
//    alternatives are expanded, `:has()` arguments are searched). The scope of a selector is the class set of the
//    compound that carries `.page-content` or, when there is none, of the first compound that has classes, if every one
//    of its classes is a Gitea page class (vocabulary = union of the class sets found in step 2, minus `ui`, `container`,
//    `page-content`, `tw-*`). `:not(.a, .b)` on that compound becomes a negative set. Selectors whose first class
//    compound is not made of page classes are "unscoped" (component-style rules inside a page folder) and not checked.
// 2. Templates → page classes (static). gitea-src-1.27.3/templates/**/*.tmpl + our templates/ overrides (they win) +
//    the Modern theme's overrides in CUSTOM_PATH/templates (read-only): every `class="page-content …"` attribute is
//    expanded over its `{{if}}…{{else}}…{{end}}` branches; `{{.pageClass}}` is resolved through every
//    `(dict "pageClass" "…")` call site of that layout template (the caller is reported as the template).
// 3. Routes → page classes (live, authoritative). With --live every route of tools/shoot/routes.json (+ EXTRA_URLS,
//    the known shared shells that no route covers) is fetched from Gitea (admin session from the shoot tool's storage
//    state; anonymous for `auth: false`; the `style` query parameter is dropped so the admin's diff-style preference is
//    never written) and the classes of the first `.page-content` element are cached in shots/page-classes.json.
//    Without --live the cache is used when present.
// 4. Match: a scope matches a page when its classes ⊆ the page's classes and no negative set ⊆ the page's classes.
// 5. Intent: src/pages/<group>/scopes.json declares, per scope key (sorted classes, e.g. ".commits.repository" or
//    ".milestones.repository:not(.dashboard):not(.projects)"), the templates it is meant for:
//      { "<scope>": ["repo/commits.tmpl", …] }  or  { "<scope>": {"intended": [...], "waived": {"<tmpl>": "reason"}} }
//    A matching template that is neither intended nor waived is a LEAK; a scope with no entry is NEW (all its matches are
//    reported, not counted as leaks, until the owner declares it); a scope that matches no template and no route is DEAD.
//    `--seed` writes missing scope keys into scopes.json with their current matches (review them afterwards!).
// 6. Report: docs/page-scope-report.md (LEAK rows first) + docs/page-scope-report.json.
//    Exit code: 0; with --strict 1 when there is any LEAK (build.mjs --strict and the final gate use that).
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import {parse as parseSelector} from 'css-what'; // transitive dependency of svgo (pinned by package-lock.json)
import {ROOT, SRC, CUSTOM_PATH, GITEA_URL, PAGE_GROUPS} from './folders.mjs';

const GITEA_SRC = path.resolve(ROOT, '../gitea-src-1.27.3');
const CACHE = path.join(ROOT, 'shots/page-classes.json');
const REPORT_MD = path.join(ROOT, 'docs/page-scope-report.md');
const REPORT_JSON = path.join(ROOT, 'docs/page-scope-report.json');
const GENERIC = new Set(['ui', 'container', 'page-content']);
// Shared shells no shoot route covers (FG2-105 "known shared shells"): fetched with --live like the routes.
const EXTRA_URLS = [
  {id: 'x-dashboard-issues', url: '/issues'},
  {id: 'x-dashboard-pulls', url: '/pulls'},
  {id: 'x-dashboard-milestones', url: '/milestones'},
  {id: 'x-repo-graph', url: '/octo-org/grex/graph'},
  {id: 'x-repo-projects', url: '/octo-org/theme-playground/projects'},
  {id: 'x-repo-new-milestone', url: '/octo-org/grex/milestones/new'},
  {id: 'x-repo-issue-choose', url: '/octo-org/theme-playground/issues/new/choose'},
  {id: 'x-repo-wiki-revisions', url: '/octo-org/folderify/wiki/Home?action=_revision'},
  {id: 'x-repo-settings-collab', url: '/octo-org/grex/settings/collaboration'},
  {id: 'x-org-settings-actions', url: '/org/octo-org/settings/actions/runners'},
  {id: 'x-user-settings-actions', url: '/user/settings/actions/runners'},
  {id: 'x-explore-orgs', url: '/explore/organizations'},
  {id: 'x-repo-activity-recent', url: '/octo-org/grex/activity/recent-commits'},
  {id: 'x-repo-settings-branch-rule', url: '/octo-org/grex/settings/branches/edit'},
  {id: 'x-repo-settings-actions', url: '/octo-org/theme-playground/settings/actions/runners'},
  {id: 'x-org-settings-packages', url: '/org/octo-org/settings/packages'},
  {id: 'x-user-settings-packages', url: '/user/settings/packages'},
  {id: 'x-user-settings-profile', url: '/user/settings'},
  {id: 'x-org-projects', url: '/octo-org/-/projects'},
  {id: 'x-user-profile-packages', url: '/octo-org/-/packages'},
  {id: 'x-explore-code', url: '/explore/code'},
  {id: 'x-repo-code-search', url: '/octo-org/grex/search?q=main'},
];

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);

// ---------------------------------------------------------------------------------------------------------------------
// 2. templates → class sets
function listTemplates(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {recursive: true}).filter((f) => f.endsWith('.tmpl')).map((f) => f.split(path.sep).join('/'));
}

// Scan a class attribute value that starts right after `class="`; `{{…}}` actions may contain quotes.
function readAttr(text, start) {
  let i = start;
  while (i < text.length) {
    if (text.startsWith('{{', i)) {
      const j = text.indexOf('}}', i + 2);
      if (j < 0) return null;
      i = j + 2;
    } else if (text[i] === '"') return text.slice(start, i);
    else i++;
  }
  return null;
}

// Tokenise a class attribute into a tree of text / if-chains / values, then expand every branch.
function expandAttr(value, pageClassValues) {
  const toks = [];
  const re = /\{\{-?\s*([\s\S]*?)\s*-?\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(value))) {
    if (m.index > last) toks.push({t: 'text', v: value.slice(last, m.index)});
    const a = m[1].trim();
    if (/^(if|with|range)\b/.test(a)) toks.push({t: 'open'});
    else if (/^else\b/.test(a)) toks.push({t: 'else'});
    else if (a === 'end') toks.push({t: 'end'});
    else if (a.startsWith('/*')) { /* comment */ } else if (a === '.pageClass') toks.push({t: 'pageClass'});
    else toks.push({t: 'value', v: a});
    last = re.lastIndex;
  }
  if (last < value.length) toks.push({t: 'text', v: value.slice(last)});
  let pos = 0;
  const unknown = [];
  // returns list of alternatives (strings) for a sequence until else/end
  function seq() {
    let alts = [''];
    while (pos < toks.length) {
      const k = toks[pos];
      if (k.t === 'else' || k.t === 'end') return alts;
      pos++;
      let opts;
      if (k.t === 'text') opts = [k.v];
      else if (k.t === 'pageClass') opts = pageClassValues.length ? pageClassValues : [''];
      else if (k.t === 'value') { unknown.push(k.v); opts = ['']; } else { // open: branches until end
        const branches = [];
        branches.push(...seq());
        let hasElse = false;
        while (pos < toks.length && toks[pos].t === 'else') { pos++; hasElse = true; branches.push(...seq()); }
        if (pos < toks.length && toks[pos].t === 'end') pos++;
        if (!hasElse) branches.push('');
        opts = branches;
      }
      const next = [];
      for (const a of alts) for (const o of opts) next.push(a + o);
      alts = [...new Set(next)].slice(0, 64);
    }
    return alts;
  }
  const out = seq();
  return {variants: out.map((s) => s.split(/\s+/).filter(Boolean)), unknown};
}

function scanTemplates() {
  const sources = new Map(); // rel → {file, origin}
  for (const rel of listTemplates(path.join(GITEA_SRC, 'templates'))) sources.set(rel, {file: path.join(GITEA_SRC, 'templates', rel), origin: 'upstream'});
  for (const rel of listTemplates(path.join(CUSTOM_PATH, 'templates'))) sources.set(rel, {file: path.join(CUSTOM_PATH, 'templates', rel), origin: 'custom (live)'});
  for (const rel of listTemplates(path.join(ROOT, 'templates'))) sources.set(rel, {file: path.join(ROOT, 'templates', rel), origin: 'ours'});
  const text = new Map([...sources].map(([rel, s]) => [rel, fs.readFileSync(s.file, 'utf8')]));
  // pageClass call sites: {{template "admin/layout_head" (dict "pageClass" "admin config")}}
  const callers = new Map(); // layout rel → [{caller, value}]
  const reCall = /\{\{-?\s*template\s+"([^"]+)"\s+\(dict\b([^)]*)\)/g;
  for (const [rel, t] of text) {
    let m;
    while ((m = reCall.exec(t))) {
      const pc = /"pageClass"\s+"([^"]*)"/.exec(m[2]);
      if (!pc) continue;
      const layout = `${m[1]}.tmpl`;
      if (!callers.has(layout)) callers.set(layout, []);
      callers.get(layout).push({caller: rel, value: pc[1]});
    }
  }
  const pages = []; // {template, via, origin, classes[]}
  for (const [rel, t] of text) {
    let idx = 0;
    while ((idx = t.indexOf('class="', idx)) >= 0) {
      const start = idx + 7;
      idx = start;
      const val = readAttr(t, start);
      if (val == null || !/^\s*page-content\b/.test(val) && !/(^|\s)page-content(\s|$)/.test(val.replace(/\{\{[\s\S]*?\}\}/g, ' '))) continue;
      const usesPageClass = /\{\{-?\s*\.pageClass\s*-?\}\}/.test(val);
      const sites = usesPageClass ? (callers.get(rel) || []) : [null];
      for (const site of sites) {
        const {variants, unknown} = expandAttr(val, site ? [site.value] : []);
        for (const v of variants) {
          pages.push({template: site ? site.caller : rel, via: site ? rel : null, origin: sources.get(rel).origin,
            classes: [...new Set(v)].filter((c) => !c.startsWith('tw-')).sort(), unknown});
        }
      }
    }
  }
  // dedupe
  const seen = new Set();
  return pages.filter((p) => {
    const k = `${p.template}|${p.classes.join('.')}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. live routes → class sets
async function fetchLive() {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/shoot/routes.json'), 'utf8'));
  const stateFile = path.join(ROOT, '.cache/gitea-admin-storage.json');
  let cookie = 'lang=en-US';
  if (fs.existsSync(stateFile)) {
    const st = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    cookie = st.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  }
  const targets = [...cfg.routes.map((r) => ({id: r.id, url: r.gitea, anon: r.auth === false})), ...EXTRA_URLS];
  const out = {generated: new Date().toISOString(), gitea: GITEA_URL, routes: {}};
  for (const r of targets) {
    const u = new URL(r.url, GITEA_URL);
    u.searchParams.delete('style'); // never write the admin's diff-style preference
    try {
      const res = await fetch(u, {headers: {cookie: r.anon ? 'lang=en-US' : cookie}, redirect: 'follow'});
      const html = await res.text();
      const m = /<[a-z]+\b[^>]*\bclass="([^"]*\bpage-content\b[^"]*)"/.exec(html);
      out.routes[r.id] = {url: u.pathname + u.search, status: res.status, finalUrl: res.url.replace(GITEA_URL, ''),
        anon: !!r.anon, classes: m ? [...new Set(m[1].split(/\s+/).filter(Boolean))].filter((c) => !c.startsWith('tw-')).sort() : null};
      if (!r.anon && /\/user\/login/.test(res.url)) out.routes[r.id].error = 'redirected to login (stale session: run any shoot command to refresh .cache)';
    } catch (e) {
      out.routes[r.id] = {url: r.url, error: e.message};
    }
  }
  fs.mkdirSync(path.dirname(CACHE), {recursive: true});
  fs.writeFileSync(CACHE, JSON.stringify(out, null, 1));
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// 1. selectors → scopes
const classesOf = (compound) => compound.filter((t) => t.type === 'attribute' && t.name === 'class' && t.action === 'element').map((t) => t.value);

// Expand :is()/:where() alternatives in a token list (top-level compounds only) into separate token lists.
function expandIs(tokens, depth = 0) {
  const i = tokens.findIndex((t) => t.type === 'pseudo' && (t.name === 'is' || t.name === 'where' || t.name === 'matches') && Array.isArray(t.data));
  if (i < 0 || depth > 6) return [tokens];
  const out = [];
  for (const alt of tokens[i].data) {
    for (const x of expandIs([...tokens.slice(0, i), ...alt, ...tokens.slice(i + 1)], depth + 1)) out.push(x);
    if (out.length > 256) break;
  }
  return out;
}

function compounds(tokens) {
  const out = [[]];
  for (const t of tokens) {
    if (['child', 'descendant', 'sibling', 'adjacent', 'parent', 'column-combinator'].includes(t.type)) out.push([]);
    else out[out.length - 1].push(t);
  }
  return out.filter((c) => c.length);
}

function negativesOf(compound) {
  const negs = [];
  for (const t of compound) {
    if (t.type === 'pseudo' && t.name === 'not' && Array.isArray(t.data)) {
      for (const alt of t.data) {
        const cs = compounds(alt);
        if (cs.length === 1) {
          const cl = classesOf(cs[0]);
          if (cl.length) negs.push(cl.sort());
        }
      }
    }
  }
  return negs;
}

function findPageContent(tokens) {
  for (const c of compounds(tokens)) {
    if (classesOf(c).includes('page-content')) return c;
    for (const t of c) {
      if (t.type === 'pseudo' && t.name === 'has' && Array.isArray(t.data)) {
        for (const alt of t.data) {
          for (const x of expandIs(alt)) {
            const f = findPageContent(x);
            if (f) return f;
          }
        }
      }
    }
  }
  return null;
}

function scopeOf(tokens, vocab) {
  const pc = findPageContent(tokens);
  let compound = pc;
  if (!compound) {
    compound = compounds(tokens).find((c) => classesOf(c).length);
    if (!compound) return null;
    const cl = classesOf(compound);
    if (!cl.every((c) => vocab.has(c))) return null;
  }
  const classes = [...new Set(classesOf(compound).filter((c) => !GENERIC.has(c)))].sort();
  if (!classes.length) return null;
  const negatives = negativesOf(compound);
  const key = '.' + classes.join('.') + negatives.map((n) => `:not(.${n.join('.')})`).sort().join('');
  return {key, classes, negatives};
}

function collectScopes(group, vocab) {
  const dir = path.join(SRC, 'pages', group);
  const scopes = new Map();
  let unscoped = 0;
  for (const rel of fs.readdirSync(dir, {recursive: true}).filter((f) => f.endsWith('.css')).sort()) {
    const file = path.join(dir, rel);
    const root = postcss.parse(fs.readFileSync(file, 'utf8'), {from: file});
    root.walkRules((r) => {
      if (r.parent?.type === 'atrule' && /keyframes/.test(r.parent.name)) return;
      for (const sel of r.selectors) {
        let parsed;
        try {
          parsed = parseSelector(sel);
        } catch {
          continue;
        }
        const keys = new Set();
        for (const tokens of parsed) {
          for (const x of expandIs(tokens)) {
            const s = scopeOf(x, vocab);
            if (!s) continue;
            if (keys.has(s.key)) continue;
            keys.add(s.key);
            if (!scopes.has(s.key)) scopes.set(s.key, {...s, count: 0, first: `src/pages/${group}/${rel}:${r.source?.start?.line}`, selector: sel.replace(/\s+/g, ' ').trim(), all: []});
            scopes.get(s.key).count++;
            scopes.get(s.key).all.push({sel: sel.replace(/\s+/g, ' ').trim(), at: `src/pages/${group}/${rel}:${r.source?.start?.line}`});
          }
        }
        if (!keys.size) unscoped++;
      }
    });
  }
  return {scopes, unscoped};
}

const matches = (scope, classes) => scope.classes.every((c) => classes.includes(c)) && !scope.negatives.some((n) => n.every((c) => classes.includes(c)));

// ---------------------------------------------------------------------------------------------------------------------
// --probe: for every LEAK row with a live route, load that route (admin session, or anonymous) and count the elements
// each of the scope's selectors matches there (dynamic pseudo-classes and pseudo-elements stripped). 0 everywhere =
// the leak is inert (element-guarded); > 0 = the rule really styles the unintended page.
function probeable(sel) {
  return sel.replace(/::?(before|after|placeholder|selection|marker|backdrop|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+|first-line|first-letter)\b/g, '')
    .replace(/:(hover|focus|focus-visible|focus-within|active|visited|checked|indeterminate|autofill|user-invalid|target)\b/g, '')
    .replace(/:(nth-[\w-]+|lang|dir)\([^)]*\)/g, (m) => m) || '*';
}
async function probeLeaks(result, liveData) {
  const {chromium} = await import('playwright');
  const {launchBrowser} = await import('../tools/shoot/lib/browser.mjs').catch(() => ({}));
  const browser = launchBrowser ? await launchBrowser() : await chromium.launch();
  const stateFile = path.join(ROOT, '.cache/gitea-admin-storage.json');
  const ctxs = {admin: await browser.newContext({storageState: fs.existsSync(stateFile) ? stateFile : undefined, locale: 'en-US'}),
    anon: await browser.newContext({locale: 'en-US'})};
  for (const c of Object.values(ctxs)) await c.addCookies([{name: 'lang', value: 'en-US', url: GITEA_URL}]);
  const pages = {};
  for (const f of Object.values(result.folders)) {
    for (const row of f.rows.filter((x) => x.status === 'LEAK' && x.leakRoutes.length)) {
      row.probe = [];
      for (const r of row.leakRoutes) {
        const info = liveData.routes[r.id];
        const ctx = info.anon ? ctxs.anon : ctxs.admin;
        const key = `${info.anon}|${info.url}`;
        if (!pages[key]) {
          pages[key] = await ctx.newPage();
          await pages[key].goto(new URL(info.url, GITEA_URL).href, {waitUntil: 'domcontentloaded'}).catch(() => {});
        }
        const counts = await pages[key].evaluate((sels) => sels.map((s) => { try { return document.querySelectorAll(s).length; } catch { return -1; } }), row.selectorsAll.map((x) => probeable(x.sel)));
        const applied = row.selectorsAll.map((x, i) => ({...x, count: counts[i]})).filter((x) => x.count > 0);
        row.probe.push({route: r.id, applied: applied.length, of: row.selectorsAll.length, examples: applied.slice(0, 5)});
      }
    }
  }
  await browser.close();
}

export async function pageScopeCheck({live = false, seed = false, write = true, probe = false} = {}) {
  const templates = scanTemplates();
  const vocab = new Set(templates.flatMap((t) => t.classes).filter((c) => !GENERIC.has(c)));
  let liveData = null;
  if (live) liveData = await fetchLive();
  else if (fs.existsSync(CACHE)) liveData = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const routes = liveData ? Object.entries(liveData.routes).filter(([, r]) => r.classes) : [];
  const result = {generated: new Date().toISOString(), liveCache: liveData ? path.relative(ROOT, CACHE) : null,
    liveGenerated: liveData?.generated || null, templatesScanned: templates.length, folders: {}, totals: {scopes: 0, leaks: 0, newScopes: 0, dead: 0}};
  for (const group of PAGE_GROUPS) {
    const {scopes, unscoped} = collectScopes(group, vocab);
    const scopesFile = path.join(SRC, 'pages', group, 'scopes.json');
    const declared = fs.existsSync(scopesFile) ? JSON.parse(fs.readFileSync(scopesFile, 'utf8')) : {};
    const rows = [];
    for (const s of [...scopes.values()].sort((a, b) => a.key.localeCompare(b.key))) {
      const tmpl = [...new Set(templates.filter((t) => matches(s, t.classes)).map((t) => t.template))].sort();
      const rts = routes.filter(([, r]) => matches(s, r.classes)).map(([id, r]) => ({id, url: r.url}));
      const d = declared[s.key];
      const intended = Array.isArray(d) ? d : d?.intended || [];
      const waived = (d && !Array.isArray(d) && d.waived) || {};
      const leaks = d && !intended.includes('*') ? tmpl.filter((t) => !intended.includes(t) && !(t in waived)) : [];
      const status = !tmpl.length && !rts.length ? 'DEAD' : !d ? 'NEW' : leaks.length ? 'LEAK' : 'ok';
      // a route "leaks" when its class set equals that of a leaking template (live evidence of the leak)
      const leakRoutes = leaks.length ? rts.filter((r) => {
        const cls = routes.find(([id]) => id === r.id)[1].classes.join('.');
        return templates.some((t) => leaks.includes(t.template) && t.classes.join('.') === cls);
      }) : [];
      rows.push({scope: s.key, status, selectors: s.count, first: s.first, example: s.selector, templates: tmpl, routes: rts, leaks, leakRoutes, waived, selectorsAll: s.all});
      if (seed && !d) declared[s.key] = tmpl;
    }
    if (seed) fs.writeFileSync(scopesFile, JSON.stringify(Object.fromEntries(Object.entries(declared).sort()), null, 1) + '\n');
    const stale = Object.keys(declared).filter((k) => !scopes.has(k));
    result.folders[group] = {scopes: rows.length, unscopedSelectors: unscoped, leaks: rows.filter((r) => r.status === 'LEAK').length,
      newScopes: rows.filter((r) => r.status === 'NEW').length, dead: rows.filter((r) => r.status === 'DEAD').length, staleDeclarations: stale, rows};
    result.totals.scopes += rows.length;
    result.totals.leaks += result.folders[group].leaks;
    result.totals.newScopes += result.folders[group].newScopes;
    result.totals.dead += result.folders[group].dead;
  }
  if (probe && liveData) await probeLeaks(result, liveData);
  for (const f of Object.values(result.folders)) for (const row of f.rows) delete row.selectorsAll;
  if (write) {
    fs.writeFileSync(REPORT_JSON, JSON.stringify(result, null, 1));
    fs.writeFileSync(REPORT_MD, toMarkdown(result));
  }
  return result;
}

function toMarkdown(r) {
  const L = [];
  L.push('# Page-scope report (FG2-105)', '');
  L.push(`Generated ${r.generated} by \`node build/page-scope-check.mjs${r.liveCache ? '' : ''}\`. Templates scanned: ${r.templatesScanned} (upstream 1.27.3 + CUSTOM_PATH + ours); live page classes: ${r.liveCache ? `${r.liveCache} (${r.liveGenerated})` : 'none (run with --live)'}.`);
  L.push('', `Totals: ${r.totals.scopes} scopes, **${r.totals.leaks} LEAK**, ${r.totals.newScopes} NEW (undeclared), ${r.totals.dead} DEAD (match nothing).`, '');
  L.push('Scope = class set of the `.page-content` compound (or of the leading page-class compound). A LEAK is a template the scope', 'matches that `src/pages/<group>/scopes.json` neither intends nor waives. Declare intent there; waive with a reason.', '');
  L.push('| folder | scope | status | sel. | first rule | matched templates | matched routes |', '|---|---|---|---|---|---|---|');
  const order = {LEAK: 0, NEW: 1, DEAD: 2, ok: 3};
  const rows = Object.entries(r.folders).flatMap(([g, f]) => f.rows.map((x) => ({g, ...x}))).sort((a, b) => order[a.status] - order[b.status] || a.g.localeCompare(b.g) || a.scope.localeCompare(b.scope));
  for (const x of rows) {
    const t = x.templates.map((t) => (x.leaks.includes(t) ? `**${t}**` : t in (x.waived || {}) ? `~~${t}~~` : t)).join(', ') || '—';
    const rt = x.routes.map((q) => (x.leakRoutes.some((l) => l.id === q.id) ? `**${q.id}**` : q.id)).join(', ') || '—';
    const pr = (x.probe || []).map((p) => `${p.route}: ${p.applied}/${p.of} applied`).join('; ');
    L.push(`| ${x.g} | \`${x.scope}\` | ${x.status}${pr ? ` (probe ${pr})` : ''} | ${x.selectors} | ${x.first} | ${t} | ${rt} |`);
  }
  L.push('', 'Bold = leak (unintended match); struck = waived (reason in scopes.json).', '');
  for (const [g, f] of Object.entries(r.folders)) {
    const w = f.rows.filter((x) => Object.keys(x.waived || {}).length);
    if (!w.length) continue;
    L.push(`### Waivers — ${g}`);
    for (const x of w) for (const [t, why] of Object.entries(x.waived)) L.push(`- \`${x.scope}\` → ${t}: ${why}`);
    L.push('');
  }
  return L.join('\n') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await pageScopeCheck({live: flag('live'), seed: flag('seed'), probe: flag('probe')});
  if (!flag('quiet')) {
    for (const [g, f] of Object.entries(r.folders)) {
      console.log(`${f.leaks ? '!' : '✓'} pages/${g}: ${f.scopes} scopes, ${f.leaks} LEAK, ${f.newScopes} NEW, ${f.dead} DEAD, ${f.unscopedSelectors} unscoped selectors${f.staleDeclarations.length ? `, stale declarations: ${f.staleDeclarations.join(' ')}` : ''}`);
      for (const x of f.rows.filter((x) => x.status === 'LEAK')) {
        console.log(`   LEAK ${x.scope} (${x.first}) → ${x.leaks.join(', ')}${x.leakRoutes.length ? ` [routes: ${x.leakRoutes.map((q) => q.id).join(', ')}]` : ''}`);
        for (const p of x.probe || []) console.log(`        probe ${p.route}: ${p.applied}/${p.of} selectors match elements${p.examples.length ? ` e.g. ${p.examples.slice(0, 2).map((e) => `${e.sel} (${e.count}) @${e.at}`).join(' | ')}` : ''}`);
      }
    }
    console.log(`page-scope: ${r.totals.leaks} LEAK · report ${path.relative(ROOT, REPORT_MD)}`);
  }
  process.exit(flag('strict') && r.totals.leaks ? 1 : 0);
}

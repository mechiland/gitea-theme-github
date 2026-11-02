import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import http from 'node:http';
import {GITEA_VERSIONS as versions} from '../gitea-versions.mjs';

const root = path.resolve(import.meta.dirname, '../..');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-theme-build-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  fs.cpSync(path.join(root, 'build'), path.join(dir, 'build'), {recursive: true});
  fs.cpSync(path.join(root, 'src'), path.join(dir, 'src'), {recursive: true});
  fs.cpSync(path.join(root, 'templates'), path.join(dir, 'templates'), {recursive: true});
  fs.copyFileSync(path.join(root, 'package.json'), path.join(dir, 'package.json'));
  for (const name of ['LICENSE', 'NOTICE']) fs.copyFileSync(path.join(root, name), path.join(dir, name));
  fs.mkdirSync(path.join(dir, 'docs'));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  const write = (name, value) => {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, value);
  };
  for (const v of versions) {
    write(`upstream/${v}/web_src/css/base.css`, ':root { --color-primary: blue; }');
    write(`upstream/${v}/templates/repo/allowed.tmpl`, '<main class="page-content repository compat-test"></main>');
  }
  return {dir, write, run: (...args) => spawnSync(process.execPath, args, {
    cwd: dir, encoding: 'utf8', env: {...process.env, GITEA_SOURCE_ROOT: path.join(dir, 'upstream'), GITEA_CUSTOM_PATH: path.join(dir, 'no-live-custom')},
  })};
}

test('one CSS build reserves names and retains tokens referenced by any supported upstream', t => {
  const f = fixture(t);
  f.write('upstream/28.3.0/web_src/css/new.css', '.new { --a: 1; width: var(--base-size-112); border-radius: var(--borderRadius-medium); }');
  const built = f.run('build/build.mjs', '--no-lint');
  assert.equal(built.status, 0, built.stderr);
  const map = JSON.parse(fs.readFileSync(path.join(f.dir, 'dist/varmap.json')));
  assert.equal(Object.hasOwn(map, '--a'), false, 'upstream --a must not be generated as a short name');
  const css = fs.readFileSync(path.join(f.dir, 'dist/theme-github-light.css'), 'utf8');
  assert.match(css, /--base-size-112\s*:/, 'an upstream-only token must survive pruning and renaming');
  assert.match(css, /--borderRadius-medium\s*:/, 'upstream references must keep the original token name');
});

test('a release build refuses to silently skip missing supported sources', t => {
  const f = fixture(t);
  fs.rmSync(path.join(f.dir, 'upstream/28.2.0'), {recursive: true});
  const built = f.run('build/build.mjs', '--strict');
  assert.notEqual(built.status, 0);
  assert.match(built.stdout + built.stderr, /28\.2\.0.*(missing|not found)|missing.*28\.2\.0/i);
});

test('the single package documents every version in the compatibility matrix', t => {
  const f = fixture(t);
  const built = f.run('build/build.mjs', '--no-lint');
  assert.equal(built.status, 0, built.stderr);
  const packaged = f.run('build/package.mjs');
  assert.equal(packaged.status, 0, packaged.stderr);
  const install = fs.readFileSync(path.join(f.dir, 'dist/package/gitea-theme-github/INSTALL.md'), 'utf8');
  for (const version of versions) assert.ok(install.includes(version), `INSTALL.md must list ${version}`);
});

test('scope checks detect new upstream pages per version without sharing old live caches', t => {
  const f = fixture(t);
  f.write('src/pages/repo/index.css', '.repository.compat-test .button { color: var(--fgColor-default); }');
  f.write('src/pages/repo/scopes.json', JSON.stringify({'.compat-test.repository': ['repo/allowed.tmpl']}));
  f.write('upstream/28.3.0/templates/repo/new.tmpl', '<main class="page-content repository compat-test"></main>');
  f.write('shots/page-classes.json', JSON.stringify({gitea: 'http://old-instance:3000', routes: {stale: {classes: ['repository', 'compat-test']}}}));
  const result = f.run('--input-type=module', '-e', `
    import {pageScopeCheck} from './build/page-scope-check.mjs';
    const latest = await pageScopeCheck({version: '28.3.0', write: false});
    const old = await pageScopeCheck({version: '28.0.0', write: false});
    console.log(JSON.stringify({latest, old}));
  `);
  assert.equal(result.status, 0, result.stderr);
  const {latest, old} = JSON.parse(result.stdout);
  const row = report => report.folders.repo.rows.find(r => r.scope === '.compat-test.repository');
  assert.equal(row(latest)?.status, 'LEAK');
  assert.deepEqual(row(latest).leaks, ['repo/new.tmpl']);
  assert.equal(row(old)?.status, 'ok');
  assert.deepEqual(row(old).routes, [], 'unversioned cache from another server must be ignored');
});

test('live probes reject an instance running another Gitea version before opening a browser', async t => {
  const f = fixture(t);
  const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'application/json'); res.end('{"version":"28.1.0"}'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import {pageScopeCheck} from './build/page-scope-check.mjs';
    await pageScopeCheck({version: '28.3.0', probe: true, write: false});
  `], {cwd: f.dir, env: {...process.env, GITEA_SOURCE_ROOT: path.join(f.dir, 'upstream'), GITEA_URL: `http://127.0.0.1:${server.address().port}`}});
  let output = '';
  child.stdout.on('data', data => output += data);
  child.stderr.on('data', data => output += data);
  const code = await new Promise(resolve => child.on('close', resolve));
  assert.notEqual(code, 0);
  assert.match(output, /Expected Gitea 28\.3\.0, got 28\.1\.0/);
});

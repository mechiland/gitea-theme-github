import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {launchBrowser} from '../shoot/lib/browser.mjs';
import {startGitea, login, cleanup, REPO} from './fixture.mjs';

const root = path.resolve(import.meta.dirname, '../..');
process.chdir(root);
// Share checked upstream sources with the reference checkout when it also supports the version matrix.
process.env.GITEA_SOURCE_ROOT ||= path.join(root, '.cache/gitea-sources');
const version = process.env.VISUAL_GITEA_VERSION || '28.2.0';
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('VISUAL_GITEA_VERSION must be an exact Gitea version.');
const baseline = JSON.parse(fs.readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(baseline.ref)) throw new Error('The visual baseline must pin an approved, full commit SHA.');
const output = path.resolve('shots/visual', version);
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
fs.mkdirSync('.cache/visual', {recursive: true});
const directory = fs.mkdtempSync(path.resolve('.cache/visual/run-'));
const referenceSource = path.join(directory, 'reference-source');
fs.mkdirSync(referenceSource);
const run = (command, args, cwd = root) => execFileSync(command, args, {cwd, stdio: 'inherit', env: {...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1', COPYFILE_DISABLE: '1'}});
const servers = [];
let browser;
try {
  // Render the approved source in the same browser/OS as the candidate, rather than comparing cross-OS PNGs.
  console.log(`Visual baseline: ${baseline.description} (${baseline.ref})`);
  const archive = execFileSync('git', ['archive', '--format=tar', baseline.ref], {maxBuffer: 64 * 1024 * 1024});
  execFileSync('tar', ['-xf', '-', '-C', referenceSource], {input: archive});
  run('npm', ['ci', '--ignore-scripts', '--no-audit'], referenceSource);
  for (const source of [referenceSource, root]) {
    if (fs.existsSync(path.join(source, 'build/fetch-gitea.mjs'))) run(process.execPath, ['build/fetch-gitea.mjs'], source);
    run(process.execPath, ['build/build.mjs', '--strict'], source);
    run(process.execPath, ['build/package.mjs'], source);
  }
  const reference = await startGitea({version, label: 'reference', packageDir: path.join(referenceSource, 'dist/package/gitea-theme-github'), directory, servers});
  const candidate = await startGitea({version, label: 'candidate', packageDir: path.join(root, 'dist/package/gitea-theme-github'), directory, servers});
  browser = await launchBrowser();
  const state = {version, repo: REPO, baseline, reference: await login(browser, reference, directory, 'reference'), candidate: await login(browser, candidate, directory, 'candidate')};
  await browser.close();
  browser = null;
  const stateFile = path.join(directory, 'state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state));
  fs.writeFileSync(path.join(output, 'environment.json'), JSON.stringify({version, baseline, candidate: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim()}, null, 2));
  const result = spawnSync(process.execPath, ['node_modules/playwright/cli.js', 'test', '--config', 'tools/visual/playwright.config.mjs', ...process.argv.slice(2)], {
    stdio: 'inherit', env: {...process.env, VISUAL_STATE: stateFile},
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (browser) await browser.close();
  cleanup(servers, output);
  fs.rmSync(directory, {recursive: true, force: true});
}

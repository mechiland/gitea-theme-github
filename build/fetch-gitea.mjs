// Cache only the upstream templates and frontend sources used by compatibility checks.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {GITEA_VERSIONS, SOURCE_ROOT, sourceDirectory} from './gitea-versions.mjs';

const requested = process.argv.slice(2);
const versions = requested.length ? requested : GITEA_VERSIONS;
for (const version of versions) {
  if (!GITEA_VERSIONS.includes(version)) throw new Error(`Unsupported Gitea test version: ${version}`);
  try {
    console.log(`Gitea ${version}: ${sourceDirectory(version)}`);
    continue;
  } catch { /* Fetch a missing source tree; never change an existing development checkout. */ }
  fs.mkdirSync(SOURCE_ROOT, {recursive: true});
  const tmp = fs.mkdtempSync(path.join(SOURCE_ROOT, '.download-'));
  try {
    const archive = path.join(tmp, 'source.tar.gz');
    const response = await fetch(`https://codeload.github.com/go-gitea/gitea/tar.gz/refs/tags/v${version}`, {signal: AbortSignal.timeout(120000)});
    if (!response.ok) throw new Error(`Gitea ${version}: download returned HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(archive));
    const extracted = path.join(tmp, 'source');
    fs.mkdirSync(extracted);
    execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', extracted, `gitea-${version}/templates`, `gitea-${version}/web_src`]);
    fs.writeFileSync(path.join(extracted, 'upstream-version'), `${version}\n`);
    fs.renameSync(extracted, path.join(SOURCE_ROOT, version));
    console.log(`Gitea ${version}: downloaded into ${sourceDirectory(version)}`);
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

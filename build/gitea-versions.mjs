import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './folders.mjs';

// The build, package metadata and CI matrix share this list. Adding a version requires testing it.
const config = JSON.parse(fs.readFileSync(new URL('./gitea-versions.json', import.meta.url), 'utf8'));
export const GITEA_VERSIONS = config.versions;
export const GITEA_SERIES = config.series;
export const GITEA_PACKAGE_SUFFIX = GITEA_SERIES.join('-');
export const SOURCE_ROOT = path.resolve(process.env.GITEA_SOURCE_ROOT || path.join(ROOT, '.cache/gitea-sources'));

export function sourceDirectory(version) {
  if (!GITEA_VERSIONS.includes(version)) throw new Error(`Unsupported Gitea test version: ${version}`);
  const dirs = [path.join(SOURCE_ROOT, version)];
  // Keep the existing read-only development checkouts usable without copying or modifying them.
  if (!process.env.GITEA_SOURCE_ROOT) dirs.push(path.resolve(ROOT, `../gitea-src-${version}`));
  const found = dirs.find(dir => ['templates', 'web_src'].every(name => fs.existsSync(path.join(dir, name))));
  if (!found) throw new Error(`Gitea ${version} sources missing. Run npm run upstream (or set GITEA_SOURCE_ROOT).`);
  return found;
}

export function sourceDirectories() {
  return GITEA_VERSIONS.map(version => ({version, directory: sourceDirectory(version)}));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify({version: GITEA_VERSIONS}));
}

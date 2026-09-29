import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const SRC = path.join(ROOT, 'src');
export const DIST = path.join(ROOT, 'dist');
export const CUSTOM_PATH = process.env.GITEA_CUSTOM_PATH || '/Users/michael/work/gitea/gitea/gitea';
export const GITEA_URL = process.env.GITEA_URL || 'http://localhost:3000';
export const GITEA_CONTAINER = process.env.GITEA_CONTAINER || 'gitea-server';

// Component folders in cascade order (later wins). Each compiles into @layer gh.<folder>.
// `dark` holds dark-scheme-only exceptions and is emitted only for the dark scheme.
// `pages` is split into one sub-folder per page group (src/pages/<group>/), each its own layer gh.pages-<group>.
export const PAGE_GROUPS = ['repo', 'issues-prs', 'actions-packages-projects', 'people', 'settings-admin', 'auth'];
export const FOLDERS = ['foundation', 'controls', 'overlays', 'navigation', 'data-display', 'code', 'markdown',
  ...PAGE_GROUPS.map((g) => `pages/${g}`), 'dark'];
export const layerName = (folder) => `gh.${folder.replace('/', '-')}`;
export const THEMES = {
  'github-light': {display: 'GitHub Light', scheme: 'light'},
  'github-dark': {display: 'GitHub Dark', scheme: 'dark'},
  'github-auto': {display: 'GitHub', scheme: 'auto'},
};
export const BUDGET_BYTES = 300 * 1024;

# Actions for the orchestrator (blocked for the integrator by the session permission policy)

## ORC-1 — DONE 2026-09-30 by orchestrator (installed, reloaded, verified: github 2 matches, gitea-auto 0, modern 0; dialog close works, 0 console errors)
## (integrator, wave 2) Install the GitHub-only dialog close button hook (request OV-4, ACCEPTED)
The integrator's attempt to write into CUSTOM_PATH/templates and run `gitea manager reload-templates` was refused by
the permission classifier ("Remote Shell Writes"); not retried. The project copy is final:
`/Users/michael/work/gitea/gitea-theme-github/templates/custom/footer.tmpl`.
Gitea's own `templates/custom/footer.tmpl` is an empty extension hook (0 bytes in gitea-src-1.27.3), and CUSTOM_PATH has
no `templates/custom/` today, so nothing is overwritten. For non-github themes the template renders nothing
(all text is inside a trimmed `{{- if … -}}`), so their HTML is byte-identical.
Commands (run in order; note the integrator's first attempt may or may not have created the empty directory — mkdir -p is idempotent):
```sh
mkdir -p /Users/michael/work/gitea/gitea/gitea/templates/custom
cp /Users/michael/work/gitea/gitea-theme-github/templates/custom/footer.tmpl /Users/michael/work/gitea/gitea/gitea/templates/custom/footer.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify: `curl -s -b gitea_theme=github-auto http://localhost:3000/explore/repos | grep -c 'gh-dialog-close'` → 1, and
`curl -s -b gitea_theme=gitea-auto http://localhost:3000/explore/repos | grep -c 'gh-dialog-close'` → 0.
Then open /octo-org/grex/labels → "Delete" on a label: the confirm dialog shows a 32px × in the header (click closes it).
If reload-templates refuses the template (it keeps the old one), report the error text to the integrator.

## ORC-2 (integrator, wave 2) Install svgo 4.0.1 as a devDependency (icons I-2 / II-2, ACCEPTED)
Needs a package download from the npm registry, which the integrator does not perform without approval.
```sh
cd /Users/michael/work/gitea/gitea-theme-github && npm i -D -E svgo@4.0.1
node src/icons/gen-icons.mjs --check   # expect exit 0 (2 upgraded / 374 identical / 13 replaced / 0 missing)
```
Optional afterwards (integrator): `"icons": "node src/icons/gen-icons.mjs"` in package.json scripts.

## Status
- ORC-1 DONE (orchestrator): installed + reloaded; verified scoping (github-auto only) and a real dialog close.
- ORC-2 DONE (orchestrator): svgo 4.0.1 installed as exact devDependency.

## ORC-3 (integrator, wave 3) Install the github-only settings page header override (request SA-4, ACCEPTED)
The integrator's `cp` into CUSTOM_PATH/templates + `reload-templates` was refused by the permission classifier
("Remote Shell Writes"); not retried. The project copy is final:
`/Users/michael/work/gitea/gitea-theme-github/templates/user/settings/layout_head.tmpl`
(upstream 1.27.3 `templates/user/settings/layout_head.tmpl` + one trimmed `{{- if … }}` block; nothing in CUSTOM_PATH
overrides this template today, so nothing is overwritten; the Modern theme does not use it).
Non-github themes render the upstream bytes: the comment is `{{- /* */ -}}` and the false branch emits nothing, so
`<div role="main" …>` is followed by `\n\t<div class="ui container flex-container">` exactly as upstream.
Commands (in order):
```sh
mkdir -p /Users/michael/work/gitea/gitea/gitea/templates/user/settings
cp /Users/michael/work/gitea/gitea-theme-github/templates/user/settings/layout_head.tmpl /Users/michael/work/gitea/gitea/gitea/templates/user/settings/layout_head.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
If reload-templates refuses the template it keeps the old (upstream) one — report the error text; to roll back
delete the copied file and reload again.
Verify (no restart needed):
```sh
cd /Users/michael/work/gitea/gitea-theme-github
node tools/shoot/shoot.mjs --target gitea --theme github-auto --only user-settings,user-settings-account,user-settings-appearance --out shots/orc3-verify
# expect: header row (48px avatar, "admin", "Settings", "Profile" button) above the NavList on every page;
# node -e "…" not needed — check shots/orc3-verify/user-settings/light-1440.png
npm run deploy   # templatesPending must be [] afterwards
```
Non-github check (other themes unchanged): in a browser logged in as a user whose theme is gitea-auto, /user/settings
has no `.gh-settings-header` (document.querySelector('.gh-settings-header') === null).

## ORC-4 (integrator, wave 3) Decision needed: theme size budget (ARCHITECTURE §10, 300 KB per file)
After the build-level saving (PPL-1 addendum, short custom-property names: −100 KB) the files are
github-auto 334.8 KB, github-light/dark 330.8 KB minified (gzip ≈ 52 KB, one request each). The rest is folder CSS
(pages/* ≈ 157 KB minified). `npm run build --strict` (final gate) fails on the budget. Options:
(a) raise BUDGET_BYTES in build/folders.mjs to 360 KB (dark pass headroom) and update §10;
(b) order a trim round for the four largest layers (pages/repo 39.5 KB, code 35.0, pages/issues-prs 34.5,
    pages/actions-packages-projects 29.7) with a per-folder cap;
(c) both. The integrator did not change the budget on its own.

- ORC-3 DONE (orchestrator, 2026-09-30): templates/user/settings/layout_head.tmpl installed + reloaded; verified header on /user/settings (light 1440 screenshot), 0 console errors.
- ORC-4 DECIDED (orchestrator): the 300 KB budget is a user requirement and is NOT raised. Trim round ordered (coverage-driven, per-folder caps, zero-pixel-diff proof), target ≤ 285 KB per file to leave dark-pass headroom.

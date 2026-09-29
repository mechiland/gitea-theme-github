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

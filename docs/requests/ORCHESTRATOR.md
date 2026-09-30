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

# Final gate #1 follow-up (integrator, 2026-09-30): template installs ORC-5 … ORC-9
Seven new files (§7 cap is 8). None exists in CUSTOM_PATH today, so nothing is overwritten (Modern's
`repo/view_content.tmpl` / `repo/view_list.tmpl` are NOT touched; they include `repo/view_file` / `repo/blame`, whose
non-github output is upstream bytes). Every override is upstream 1.27.3 + github-only blocks inserted with no whitespace
outside template actions, so non-GitHub themes render byte-identical HTML (proven offline: deleting the inserted blocks
yields the upstream file exactly; the head_navbar else-branch is the upstream file verbatim, no newline after `{{end}}`).
Templates were not parsed by Go here (no Go toolchain, docker is off-limits for the integrator): `reload-templates`
refuses a broken template and keeps the old one — if it does, send the error text back to the integrator.

**Timing:** the markup is unstyled until the owning builders style it (navigation for the header, code, pages/repo,
pages/issues-prs, pages/auth). Install right before those builders' round, not before a critic/judge run.

## Common byte-identity check (all of ORC-5…9)
A "before" snapshot was taken by the integrator at 12:05 on 2026-09-30 (templates not installed):
`shots/orc5/before/` (21 pages × {anon gitea-auto, anon modern, anon studio, signed-in seeded user dave-qa with theme
gitea-auto}; normalised for CSP nonces, footer timing, file-icon sprite order and pagination query order — two
consecutive snapshots were identical). After installing, run:
```sh
cd /Users/michael/work/gitea/gitea-theme-github
sh shots/orc5/html-snapshot.sh shots/orc5/after
diff -rq shots/orc5/before shots/orc5/after && echo "non-GitHub HTML unchanged"
```
Expect no output from diff (if repo content changed in between, e.g. a smoke run or new commits, re-take `before` with the
templates removed, or compare only pages that did not change). Admin-only pages (/-/admin) are covered by the same
branches; check one by hand if wanted: switch the admin to gitea-auto (`node tools/shoot/shoot.mjs --theme gitea-auto
--only home --schemes light --viewports 1440 --no-audit --out shots/orc5-tmp`), compare, then switch back with
`--theme github-auto`.

## ORC-5 FG-007 AppHeader + FG-063 auth header (navigation / pages-auth)
```sh
mkdir -p /Users/michael/work/gitea/gitea/gitea/templates/base /Users/michael/work/gitea/gitea/gitea/templates/custom
cp /Users/michael/work/gitea/gitea-theme-github/templates/base/head_navbar.tmpl /Users/michael/work/gitea/gitea/gitea/templates/base/head_navbar.tmpl
cp /Users/michael/work/gitea/gitea-theme-github/templates/custom/gh_head_navbar.tmpl /Users/michael/work/gitea/gitea/gitea/templates/custom/gh_head_navbar.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify: `curl -s -b 'gitea_theme=github-auto; lang=en-US' http://localhost:3000/explore/repos | grep -c 'gh-app-header'` ≥ 1;
same with `gitea_theme=gitea-auto` → 0; `/user/login` with github-auto contains `gh-app-header--auth`. Signed in (shoot as
admin, github-auto): bell count present, create/avatar menus open, hamburger drawer opens/closes, file tree still detects
signed-in (`#navbar .user-menu`), project board fullscreen hides the header, 0 console errors
(`node tools/shoot/shoot.mjs --target gitea --only home,repo-home,login,not-found --out shots/orc5-verify`).
Rollback: delete both files, reload.

## ORC-6 FG-019 commit day groups (pages/repo)
```sh
mkdir -p /Users/michael/work/gitea/gitea/gitea/templates/repo
cp /Users/michael/work/gitea/gitea-theme-github/templates/repo/commits_list.tmpl /Users/michael/work/gitea/gitea/gitea/templates/repo/commits_list.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify: `curl -s -b 'gitea_theme=github-auto; lang=en-US' 'http://localhost:3000/octo-org/grex/commits/branch/main' | grep -c 'gh-commit-day"'` ≥ 1
(one per distinct day on the page); gitea-auto → 0. Wiki revisions (`/octo-org/theme-playground/wiki/?action=_revision`) → 0 for both.

## ORC-7 FG-021 Code | Blame SegmentedControl (code)
```sh
cp /Users/michael/work/gitea/gitea-theme-github/templates/repo/view_file.tmpl /Users/michael/work/gitea/gitea/gitea/templates/repo/view_file.tmpl
cp /Users/michael/work/gitea/gitea-theme-github/templates/repo/blame.tmpl /Users/michael/work/gitea/gitea/gitea/templates/repo/blame.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify (github-auto cookie, count `gh-file-view-switch"`): `/octo-org/grex/src/branch/main/src/main.rs` → 1 (Code selected,
Blame), `/octo-org/grex/src/branch/main/README.md` → 1 (Preview selected), `/octo-org/grex/blame/branch/main/src/main.rs` → 1,
repo home `/octo-org/grex` → 0 (README box untouched); gitea-auto and modern → 0 everywhere.

## ORC-8 FG-022 wiki Pages box (pages/repo)
```sh
mkdir -p /Users/michael/work/gitea/gitea/gitea/templates/repo/wiki
cp /Users/michael/work/gitea/gitea-theme-github/templates/repo/wiki/view.tmpl /Users/michael/work/gitea/gitea/gitea/templates/repo/wiki/view.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify: github-auto `/octo-org/theme-playground/wiki` contains `gh-wiki-aside` and no `js-btn-clone-panel`; the copy button
copies the wiki clone URL; gitea-auto → no `gh-wiki-aside`, has `js-btn-clone-panel`.

## ORC-9 FG-017 issues / PRs NavList (pages/issues-prs)
```sh
mkdir -p /Users/michael/work/gitea/gitea/gitea/templates/repo/issue
cp /Users/michael/work/gitea/gitea-theme-github/templates/repo/issue/list.tmpl /Users/michael/work/gitea/gitea/gitea/templates/repo/issue/list.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify: github-auto `/octo-org/grex/issues` and `/octo-org/grex/pulls` contain `gh-issues-nav` (anonymous: 1 item + Milestones +
Labels; signed in: 4 / 6 filter items); `?type=assigned` marks that item selected and titles the page; gitea-auto → 0.

After ORC-5…9: `npm run deploy` → `templatesPending` must be `[]`. Add a DONE line under Status.

## ORC-10 (decision, optional) FG-105 forgot-password page
The capture instance has no mailer, so /user/forgot_password only shows "Account recovery is disabled". Exercising the form
needs `[mailer] ENABLED = true` + `PROTOCOL = dummy` in app.ini and a Gitea restart (orchestrator only; it affects every
theme's forgot-password page, harmless). Otherwise treat FG-105 as environment/inherent and drop the route from the gate.

- ORC-5..9 DONE (orchestrator, 2026-09-30): 7 template files installed + reloaded; html-snapshot before/after diff: other themes (gitea-auto/modern/studio anon + gitea-auto signed-in, 21 pages) byte-identical; github-only markers present only for github-auto; smoke 12/12 green; 0 console errors except intentional 404.
- ORC-10: FG-105 treated as environment/inherent (no mailer change).

## ORC-11 (integrator, loop 1 after final gate #1, 2026-09-30) Install two edited github-only templates (PA-L1-1, PA-L1-2, NAV-I4, SA-5b)
The integrator's live copy + reload was refused by the permission policy (not retried). Both files are already live
overrides; only their github-* branch changes (else-branches untouched, so other themes stay byte-identical).
Project copies are final; previous versions kept in `shots/gh_head_navbar.pre-L1.tmpl`, `shots/layout_head.pre-L1.tmpl`.

1. `templates/custom/gh_head_navbar.tmpl` (only rendered for github-* themes):
```diff
-{{- $isAuth := and (not .IsSigned) (or .PageIsSignIn .PageIsSignUp .IsResetRequest .IsResetForm) -}}
+{{- $isAuth := and (not .IsSigned) (or .PageIsSignIn .PageIsSignUp .IsResetRequest .IsResetForm .IsResetDisable
+	(StringUtils.HasPrefix .Link (print AppSubUrl "/user/two_factor"))
+	(StringUtils.HasPrefix .Link (print AppSubUrl "/user/webauthn"))
+	(StringUtils.HasPrefix .Link (print AppSubUrl "/user/link_account"))) -}}
 …
 			{{if .Repository}}
 				…
+			{{else if .PageIsAdmin}}
+				<a class="gh-context-item" href="{{AppSubUrl}}/-/admin">{{ctx.Locale.Tr "admin_panel"}}</a>
+			{{else if .PageIsUserSettings}}
+				<a class="gh-context-item" href="{{AppSubUrl}}/user/settings">{{ctx.Locale.Tr "your_settings"}}</a>
 			{{else if .PageIsDashboard}}
```
2. `templates/user/settings/layout_head.tmpl` (github-* branch condition only):
```diff
-{{- if and (StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-") (StringUtils.Contains (StringUtils.ToString .pageClass) "settings")}}
+{{- if and (StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-") (or (not .pageClass) (StringUtils.Contains (StringUtils.ToString .pageClass) "settings"))}}
```
(plus two comment lines inside the trimmed `{{- /* */ -}}` block, which emits nothing).

Install:
```sh
cp /Users/michael/work/gitea/gitea-theme-github/templates/custom/gh_head_navbar.tmpl /Users/michael/work/gitea/gitea/gitea/templates/custom/gh_head_navbar.tmpl
cp /Users/michael/work/gitea/gitea-theme-github/templates/user/settings/layout_head.tmpl /Users/michael/work/gitea/gitea/gitea/templates/user/settings/layout_head.tmpl
docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini
```
Verify (no restart needed):
- `curl -s -b 'gitea_theme=github-auto; lang=en-US' http://localhost:3000/user/forgot_password | grep -c 'gh-app-header--auth'` → 1 (was 0).
- `curl -s -b 'gitea_theme=github-auto; lang=en-US' http://localhost:3000/user/login | grep -c 'gh-app-header--auth'` → 1 (unchanged).
- signed in as admin with github-auto: `/-/admin` crumb reads "Site Administration", `/user/settings` crumb reads "Settings";
  `/user/settings/actions/general` shows `gh-settings-header`.
- gitea-auto / modern / studio: `sh shots/orc5/html-snapshot.sh shots/orc5/after-L1` and compare with a fresh `before`
  (else-branches unchanged, so expect identical output).
Rollback: copy back `shots/gh_head_navbar.pre-L1.tmpl` / `shots/layout_head.pre-L1.tmpl`, reload.

### ORC-11 update (integrator, loop 1 integration pass, 2026-09-30 14:30) — still pending, copy + reload refused again (not retried)
- `templates/custom/gh_head_navbar.tmpl` changed once more since ORC-11 was written: the three `.Link` prefix checks now read
  `(StringUtils.HasPrefix (StringUtils.ToString .Link) (print AppSubUrl "/user/…"))`. Reason: `HasPrefix(s, prefix string)`
  errors at execution time if `.Link` is absent from the data map (nil interface → "invalid value; expected string"); every
  page rendered through `base/head` has `Link` (services/context/context.go:168), but `ToString` makes the auth condition
  nil-safe for any future caller. `and`/`or` short-circuit (Go ≥ 1.18), so signed-in pages never evaluate it.
- Install commands and verification are unchanged (see ORC-11 above). Both project copies are final.
- Live state checked 14:28: `custom/gh_head_navbar.tmpl` and `user/settings/layout_head.tmpl` differ from the project
  copies (ORC-11 not installed); the other 7 github-only templates are byte-identical to the project copies.

## ORC-12 (integrator, loop 1, FYI — decision taken, reversible) browser floor for the size budget
Wave L1 put the flat build at 347 KB (auto). Instead of deleting ~33 KB of never-covered rules, the build now emits CSS
nesting for shared selector prefixes (build/nest.mjs; lossless, self-checked every build, pixel-diffed): auto 288.9 KB.
Consequence: the GitHub themes need CSS nesting support — Chrome/Edge 112+, Safari 16.5+, Firefox 117+ (all 2023).
Older browsers would drop the nested rules (the page would look largely unstyled by our layers; Gitea's own CSS still
applies). Rollback: `node build/build.mjs --deploy --no-nest` (flat, identical rendering, but 347 KB = over the 300 KB cap).
Also observed: another agent deployed at 14:36:27 (revision 2b39b04cbf; src/navigation/nav-list.css restored to its HEAD
content in the same second) while this pass was running; the integrator's deploy at 14:54:12 (85fbd66d9d) builds from the
same tree, so nothing of theirs was lost, but the orchestrator should know that a builder was still active.

- ORC-11 DONE (orchestrator): gh_head_navbar + layout_head installed + reloaded; other themes byte-identical (html-snapshot before-L1/after-L1); forgot-password auth header, admin/settings crumbs, actions/general settings header verified.
- ORC-12 ACCEPTED (orchestrator): CSS nesting in the minified output. The theme already requires :has() (Firefox 121+, Chrome 105+, Safari 15.4+) and @layer; nesting raises the floor only to Chrome/Edge 112+ and Safari 16.5+ (2023). The 14:36:27 deploy was the orchestrator (user-requested NavList fix), not a builder.
- Smoke hygiene: 83 leftover open "Smoke issue" issues (admin, octo-org/theme-playground) closed; smoke.mjs now closes its own issue (step close-issue).

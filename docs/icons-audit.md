# Icon audit — GitHub theme for Gitea 1.27.3

Owner: icons builder (wave 1), then the integrator. Generator: `src/icons/gen-icons.mjs` → `src/icons/svg/*.svg`
(deployed by `npm run deploy` to `CUSTOM_PATH/public/assets/img/svg/`), `src/icons/octicon-masks.css`,
`src/icons/manifest.json`. Policy: ARCHITECTURE.md §6.

**Server-side overrides take effect only after a Gitea restart** (`modules/svg/svg.go Init`, read once at startup).
They apply to **all themes** (not theme-scoped). JS/Vue icons are baked into Gitea's bundle and cannot be changed by
files; for those, the owning folder uses the CSS mask variables from `src/icons/octicon-masks.css`.

## 1. Octicons upgrade (19.28.1 → 19.38.0)

- Gitea 1.27.3 ships 376 `octicon-*.svg` (all from `@primer/octicons/build/svg/*-16.svg`; Gitea's generator only
  globs `-16`, so there is no 24px variant to consider).
- `gen-icons.mjs` runs Gitea's exact pipeline (`tools/generate-svg.ts` `processAssetsSvgFile`: svgo **4.0.1**,
  `preset-default`, `removeDimensions`, `removeTitle`, `prefixIds`, `addClassesToSVGElement ['svg', name]`,
  `addAttributesToSVGElement xmlns/width=16/height=16/aria-hidden`).
- **Fidelity check:** running the generator against `@primer/octicons@19.28.1` reproduces all 376 Gitea files
  byte-for-byte (0 differences) — so any difference with 19.38.0 is a real drawing change, not a normalisation artefact.
- **Result with 19.38.0:** 374 identical, **2 upgraded**: `octicon-project-template`, `octicon-repo-forked-locked`
  (minor path refinements; contact sheet row 1–2). 0 names missing in 19.38.0.
- Root of every emitted file is checked by the script: `class="svg <name> …"`, `width="16" height="16"`,
  `viewBox`, `aria-hidden="true"`, no root `fill`.

## 2. Non-Octicon icons (68 files: 60 `gitea-*`, 4 `fontawesome-*`, 4 `material-*`)

Decision key: **replace** = server override file of the same name containing the Octicon drawing
(class `svg <original> octicon-<new>`); **keep** = brand/product logo or meaning carried by colour/shape;
**mask** = JS/Vue-rendered copy, CSS `mask-image` in the owning folder (request filed).

Live audit: `shots/icons-r1/*/light-1440.json` (36 routes incl. repo home, file, commit, graph, pulls, actions,
migrate, packages, settings, admin). Counts below are from that run (before restart, i.e. Gitea's originals).

| Name | Where used (source; live audit pages) | Depicts | Decision | Reason |
|---|---|---|---|---|
| `gitea-double-chevron-left` | `base/paginate.tmpl:11` ("First"), `shared/issuelist.tmpl:68` (12px, PR "base ← head"; live: icons-pulls ×2); JS `DashboardRepoList.vue:500` | « | **replace → `octicon-arrow-left`**; pagination: **mask → `move-to-start`** (navigation N-3); JS copy: **mask** (pages/people) | UI glyph. GitHub's compare view / PR header uses `arrow-left` between base and head, so the *file* stays `arrow-left` (the 12px PR-list use). In pagination the labels are hidden below 768px and `← ‹` is ambiguous (critic r1), so navigation masks it with `move-to-start` (verified by injection, `shots/icons-r2/cmp-b.png`). `move-to-start` was not used for the file because it is wrong for base ← head. github.com has no First/Last, but Gitea's page window has no first/last page numbers, so hiding them would drop "jump to last". |
| `gitea-double-chevron-right` | `base/paginate.tmpl:38` ("Last"); JS `DashboardRepoList.vue:519` | » | **replace → `octicon-arrow-right`**; pagination: **mask → `move-to-end`** (navigation N-3); JS: **mask** (pages/people) | UI glyph, pair of the above. |
| `gitea-exclamation` | `repo/icons/commit_status.tmpl:9,15` (18px, error=red / warning=yellow); JS `modules/toast.ts:27,32` (warning/error toasts), `DashboardRepoList.vue:38,40` | ! | **replace → `octicon-alert`**; JS: **mask** (overlays: toasts; pages/people: dashboard) | UI glyph. Primer uses `alert` for warnings; a distinct shape from failure's `x`. |
| `gitea-eclipse` | theme selector icon for `--theme-color-scheme: auto` (`modules/templates/util_render.go:242`); live: footer theme menu on **all 36 pages**, settings/appearance | half-moon | **replace → `octicon-device-desktop`** | UI glyph. "Auto" = follow the system; device-desktop is the conventional "system" icon; GitHub has no eclipse glyph. |
| `gitea-whitespace` | `repo/diff/whitespace_dropdown.tmpl:2` (live: icons-commit) | ¶-like whitespace | **replace → `octicon-gear`** | UI glyph. GitHub keeps diff whitespace options behind the diff-settings gear. (`octicon-space` was considered: in 19.38 it is the Copilot-Spaces folder glyph — wrong meaning.) |
| `gitea-split` | `repo/diff/whitespace_dropdown.tmpl:30` (live: icons-commit) | split arrows | **replace → `octicon-split-view`** | UI glyph; `split-view` is Primer's two-pane glyph. |
| `gitea-join` | same button when split view is active | join arrows | **replace → `octicon-rows`** | UI glyph; closest Octicon for a single stacked (unified) view. Weakest match of the set. |
| `gitea-lock` | `repo/commit_sign_badge.tmpl:66` (signed, verified, known user) | padlock | **replace → `octicon-verified`** | GitHub marks verified signatures with the `verified` badge glyph. |
| `gitea-lock-cog` | `repo/commit_sign_badge.tmpl:69` (verified by instance/trusted key) | padlock + cog | **replace → `octicon-shield-check`** | Keeps a distinct "trusted by system" meaning; the original's cog cut-out is a hard-coded white fill that disappears on dark backgrounds (contact sheet, dark). |
| `gitea-unlock` | `repo/commit_sign_badge.tmpl:73` (signed but unverified; live: icons-commit) | open padlock | **replace → `octicon-unverified`**; unsigned commits: **hide badge** (data-display D-4) | GitHub's glyph for unverified signatures. The same icon is also used on the commit page for *unsigned* commits (`commit_page.tmpl:174` passes no Commit, class has no `commit-is-signed`); github.com shows no badge there, so D-4 hides `.commit-sign-badge:not(.commit-is-signed)` (verified by injection, `shots/icons-r2/sign-badge-cmp.png`). |
| `gitea-running` | `repo/icons/action_status.tmpl:25`, `pull_merge_box.go:132` (live: icons-actions); JS: ActionRunJobView, RepoCodeFrequency, RepoContributors, RepoRecentCommits, ViewFileTreeItem, action-status-icon | spinning ring | **keep** | Already drawn in GitHub's style (ring at .5 opacity + dot + arc, currentColor); there is no Octicon spinner. Believed to match GitHub Actions' in-progress icon — **not verified live** (no in-progress run reachable logged-out). |
| `gitea-empty-checkbox` | JS only: `ActionRunJobView.vue:440-457` (log options), `EasyMDEToolbarActions.ts:111` | empty rounded square | **keep** | It is the outline of `octicon-checkbox` (same 1.75 radius / 1.5 stroke geometry); Octicons has no unchecked variant (`square` is a tiny 8px box). JS-only → no file effect anyway. |
| `gitea-favicon` | JS `modules/favicon-status.ts:6` | Gitea logo | **keep** | Brand. |
| `gitea-gitea` | webhook icon `shared/webhook/icon.tmpl:6`, migrate card, OAuth "gitea" (live: icons-migrate) | Gitea logo | **keep** | Brand (the Gitea logo stays, ARCHITECTURE §11). |
| `gitea-colorblind-redgreen`, `gitea-colorblind-blueyellow` | theme menu extra icon (`services/webtheme/webtheme.go:61-69`; live: settings/appearance ×7) | two-colour disc | **keep** | Meaning *is* the colour pair (hard-coded fills). |
| `gitea-git` | `MigrationIcon` for non-GitHub hosts (issue/comment/review/release), "open in" fallback, migrate card (live: icons-migrate) | git logo | **keep** | Brand of the source system. |
| `gitea-vscodium`, `gitea-jetbrains` | clone "open with" menu (`routers/web/repo/view_home.go:81-83`); VS Code already uses `octicon-vscode` | IDE logos | **keep** | Brand. |
| `gitea-feishu`, `gitea-matrix` | webhook type icons `shared/webhook/icon.tmpl:20,22` | service logos | **keep** | Brand. |
| `gitea-gitlab`, `gitea-gitbucket`, `gitea-gogs`, `gitea-onedev`, `gitea-codebase`, `gitea-codecommit` | migrate page cards at 184px (`repo/migrate/migrate.tmpl:12-16`; live: icons-migrate ×1 each) | migration-service logos | **keep** | Brand (GitHub card uses `octicon-mark-github` already). |
| `gitea-google`, `gitea-bitbucket`, `gitea-discord`, `gitea-dropbox`, `gitea-facebook`, `gitea-twitter`, `gitea-yandex`, `gitea-azuread`, `gitea-azureadv2`, `gitea-microsoftonline`, `gitea-nextcloud`, `gitea-mastodon`, `gitea-openid` | OAuth2 provider buttons / linked accounts (`services/auth/source/oauth2/providers_*.go`) — none configured here, not seen live | provider logos | **keep** | Brand. |
| `gitea-alpine`, `-arch`, `-cargo`, `-chef`, `-composer`, `-conan`, `-conda`, `-cran`, `-debian`, `-go`, `-helm`, `-maven`, `-npm`, `-nuget`, `-pub`, `-python`, `-rpm`, `-rubygems`, `-swift`, `-terraform`, `-vagrant` | package type icons (`models/packages/package.go:137-190`; `package/shared/list.tmpl:26`, `view.tmpl:47`, cleanup rules 32px) — no packages yet, not seen live | registry logos | **keep** | Brand; GitHub Packages also shows ecosystem logos. |
| `fontawesome-openid` | OpenID sign-in (`user/auth/signin_openid.tmpl`, `external_auth_methods.tmpl:9`, settings/security/openid, profile) (live: login, signup) | OpenID logo | **keep** | Brand. |
| `fontawesome-windows` | SSPI sign-in (`external_auth_methods.tmpl:14`) | Windows logo | **keep** | Brand. |
| `fontawesome-save` | "Save" primary button in `repo/issue/labels/label_edit_modal.tmpl:65`, `repo/settings/push_mirror_sync_modal.tmpl:22` (live: repo-settings) | floppy disk | **replace → `octicon-check`** | UI glyph in a button; GitHub's save buttons carry no floppy; `check` is the Octicon for "confirm". |
| `fontawesome-send` | access-token list item, 32px (`user/settings/applications.tmpl:15`; live: icons-applications ×2) | paper plane | **replace → `octicon-key`** | UI glyph; GitHub (and Gitea's own SSH/GPG key lists) use `key` for credentials. `paper-airplane` was the literal alternative. |
| `material-invert-colors` | commit graph "Monochrome" button (`repo/graph.tmpl:43`; live: icons-graph) | ink drop | **replace → `octicon-circle`** (r2; was `circle-slash`) | UI glyph; hollow circle = "no colour" next to the paintbrush "Color". `circle-slash` (r1) read as "blocked / not allowed" (critic r1). No drop glyph in Octicons. |
| `material-palette` | commit graph "Color" button (`repo/graph.tmpl:44`; live: icons-graph) | palette | **replace → `octicon-paintbrush`** | UI glyph; Gitea itself uses `paintbrush` for colour/theme. |
| `material-folder-symlink` | symlink-to-directory with the *material* provider (`modules/fileicon/material.go:90`, extra class `octicon-file-directory-symlink`) | blue folder + arrow | **replace → `octicon-file-directory-symlink`** | Keeps the file-type meaning, drops the hard-coded blue fills. (With the default `FOLDER_ICON_THEME = basic` this path is not reached — dir symlinks already use the Octicon.) |
| `material-folder-generic` | no reference in Go/templates/JS | folder | **keep (unused)** | Nothing renders it. |

### 2.1 Material file icons (not files in `img/svg`)

- `[ui] FILE_ICON_THEME` defaults to `material` (`modules/setting/ui.go:99`), `FOLDER_ICON_THEME` to `basic` (`:100`).
  Material file icons render as `<svg class="svg git-entry-icon octicon-file" …><use href="#svg-mfi-<name>"/></svg>`
  with 1244 of 1250 symbols carrying hard-coded fills (`modules/fileicon/material.go:64-116`). Live (repo-home,
  `shots/icons-r1-repo-home-crop.png`): `.gitignore` orange git logo, `package*.json` green nodejs, `README.md` blue
  info, `tsconfig.json` TS logo; folders already blue Octicons (basic).
- **The shoot audit does not flag them** (they carry an `octicon-file` class) — tool change requested.
- GitHub (verified live on github.com/go-gitea/gitea, `shots/icons-gh-filelist-{light,dark}-crop.png`): only
  `octicon-file` / `octicon-file-directory-fill` (+ `file-submodule`, `file-symlink-file`), 16px. Colours measured:
  light directory `rgb(84,174,255)` = `--treeViewItem-leadingVisual-iconColor-rest`, file `rgb(89,99,110)` =
  `--fgColor-muted`; dark directory and file both `rgb(145,152,161)` = `--fgColor-muted` (token maps dark
  `--treeViewItem-leadingVisual-iconColor-rest` to `--fgColor-muted`, consistent).
- `FILE_ICON_THEME = basic` (source-verified): `modules/fileicon/render.go:36-47` → `BasicEntryIconHTML`
  (`basic.go:13-31`) renders `svg.RenderHTML("octicon-file" | "octicon-file-symlink-file" |
  "octicon-file-directory-symlink" | "octicon-file-directory(-open)-fill" | "octicon-file-submodule")` — plain
  Octicons through the normal `svg` helper (so our 19.38.0 upgrades apply). Every file-icon call site goes through
  `RenderEntryIconHTML`: repo file list (`routers/web/repo/view.go:259-266`), Vue file tree
  (`services/repository/files/tree.go:140-143`), diff file tree (`routers/web/repo/treelist.go:115`,
  `pull.go`, `commit.go`, `compare.go`). ⇒ proposed to the integrator (docs/requests/icons.md). It is a global
  setting (also changes Gitea/Modern/Studio themes).
- Theme-scoped alternative if the integrator declines: CSS mask in `code` (docs/requests/code.md). Tested by
  injecting the rule into the live repo page under the GitHub theme preview:
  `shots/icons-r1-mask-filelist-compare.png` (light before/after, dark before/after) — files render as muted
  `octicon-file` (computed background `rgb(89,99,110)` light, `rgb(145,152,161)` dark).

## 3. Sizes (GitHub, measured logged-out with Playwright, `shots/icons-gh-sizes.json`)

| Where on github.com | Size | Colour | Gitea today | Proposal (owner) |
|---|---|---|---|---|
| Default everywhere (repo home 170, issues 113, pulls 138, commits 189, tree 294 icons…) | 16 | context | 16 | — |
| Blankslate icon (`octicon-tag blankslate-icon`, releases/tags empty state; `shots/icons-gh-blankslate-releases.png`) | **24** | `rgb(89,99,110)` = `--fgColor-muted`, margin-bottom 8px, margin-right 4px | `.empty-placeholder` icons hard-coded **48** (org home, projects, notifications, code search, actions, packages, worktime); wiki start page `octicon-book` 48 outside `.empty-placeholder` | `.empty-placeholder > .svg` → 24px, fgColor-muted, mb `--base-size-8` (data-display) |
| Issue timeline cross-reference / state icons (issue #1: `issue-closed` ×38, `git-merge` ×2, `skip`, `issue-opened`) | **12** | state colour | 16 | `.timeline` reference-event state icons 12px (data-display / pages/issues-prs) |
| Tree view chevrons (code tree, `chevron-right` ×103, `chevron-down`) | **12** | muted | Vue file tree chevrons 16 | 12px (code) |
| Pagination prev/next chevrons (issues, pulls, commits) | **14** | — | 16 (`base/paginate.tmpl`) | 14px optional (navigation) |
| Commit status next to latest commit (repo home) | 16 | state colour | **18** (`repo/icons/commit_status.tmpl`, all states) | 16px (data-display; cc pages/repo) |
| Header logo `mark-github` | 32 (header), 24 (footer) | — | Gitea logo `<img>` 30 | n/a (Gitea logo kept; navigation) |
| Big icons 32–184 (migrate cards 184, token list 32, package cleanup 32, profile 56) | — | — | kept as templated | no GitHub equivalent measured |

Gitea's `web_src/css/modules/svg.css` sets `min-width/min-height` per `width/height` attribute; our layer wins, so a
folder resizing an icon must set `width`, `height`, `min-width`, `min-height` together.

## 4. Deliverables in `src/icons/`

- `svg/` — 17 files (2 upgrades + 15 replacements). Regenerate: `SVGO_PATH=<dir with node_modules/svgo@4.0.1> node src/icons/gen-icons.mjs`
  (or plain `node src/icons/gen-icons.mjs` once `svgo@4.0.1` is a devDependency); `--check` verifies freshness.
- `octicon-masks.css` — `:root { --gh-octicon-<name>: url("data:image/svg+xml,…") }` for alert, stop, x-circle, info,
  check-circle, arrow-left, arrow-right, move-to-start, move-to-end, file, file-directory-fill, file-directory-open-fill, file-submodule,
  file-symlink-file, file-directory-symlink. Needs to be bundled into the token layer (integrator request).
- `manifest.json` — what was generated and why.
- Contact sheet: `shots/icons-sheet.html` / `shots/icons-sheet.png` (Gitea original vs ours, 16/32px, in a button,
  light + dark; all 195 SVGs render with a non-empty bbox).

## 5. Open items

### Round 2 findings
- **Unlayered Gitea CSS on repo home / file view (integrator I-6, major, all folders).** A lazily imported chunk
  lists `index.<hash>.css` as a CSS dependency; Vite de-duplicates only against `link[rel=stylesheet][href]`, our
  head has only `rel=preload` + `@import … layer(gitea)`, so Vite appends an unlayered copy of all Gitea CSS ~1 s after
  load. It beats every `gh.*` layer: repo buttons measure 30px / 4px (Gitea) instead of 32px / 6px, the Code button
  turns Gitea-blue, and a directory colour set in `@layer gh.code` reverts from rgb(84,174,255) to rgb(9,105,218).
  A `<link rel="stylesheet" href="index.css" media="not all">` fixes it on all 8 routes checked
  (`shots/icons-r2/unlayered-*.png`, `unlayered-index-css.json`).
- Post-restart simulation, round 2 (`shots/icons-sim.mjs` → `shots/icons-r2/sim/`, 96 captures:
  8 targets × light/dark × 1440/390 × {Gitea today, ours after restart, ours + requested CSS}; 0 failed, 0 console
  errors). Sheets: `shots/icons-r2/cmp-{a,b,c,d}.png`.

- Live verification of the overrides needs the integrator's Gitea restart (deploy reported `iconsChanged: 17`,
  `restartRequired: true`); until then pages still show Gitea's originals.
- JS/Vue icons (toasts, dashboard repo list) change only once overlays / pages/people apply the mask requests.

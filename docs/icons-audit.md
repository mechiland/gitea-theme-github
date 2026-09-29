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
| `gitea-double-chevron-left` | `base/paginate.tmpl:11` ("First"), `shared/issuelist.tmpl:68` (12px, PR "base « head" in every PR row; live: pulls lists ×56 on 12 pages); JS `DashboardRepoList.vue:500` | « | **keep Gitea's file** (w2 r1: no override file at all; the RESTORED copies were deleted by deploy I-7). GitHub themes, **parity first**: github.com has no First/Last in Pagination and no branch chips in the PR list → hide them (navigation N-5, pages/issues-prs P-2; owners' call). Fallback masks if kept: pagination → **mask `move-to-start`** (navigation N-3), PR list → **mask `arrow-left`** (pages/issues-prs P-1), JS copy → **mask `move-to-start`** (pages/people) | Not purely presentational: the PR-list use carries direction (merge head into base), the pagination use means "first page". A file override is global, so one drawing cannot be right for both uses in every theme. Round 3's `move-to-start` file put `main ⇤ head` into Gitea's own themes (critic r3 issue A); round 1–2's `arrow-left` made pagination read `← ‹`. Masks are theme-scoped, so each use gets its own glyph in GitHub themes and Gitea/Modern/Studio keep `«`. Sim r4: gitea-auto after the restart is pixel-identical to today (`shots/icons-r4/cmp-pag-branches.png`, columns 1–2). |
| `gitea-double-chevron-right` | `base/paginate.tmpl:38` ("Last"); JS `DashboardRepoList.vue:519` | » | **keep the file (round 4)**; GitHub themes: **mask `move-to-end`** (navigation N-3; JS copy pages/people) | Pair of the above; kept un-overridden with it so First/Last stay a matching pair in every theme. |
| `gitea-exclamation` | `repo/icons/commit_status.tmpl:9,15` (18px, error=red / warning=yellow); JS `modules/toast.ts:27,32` (warning/error toasts), `DashboardRepoList.vue:38,40` | ! | **replace → `octicon-alert`**; JS: **mask** (overlays: toasts; pages/people: dashboard) | UI glyph. Primer uses `alert` for warnings; a distinct shape from failure's `x`. |
| `gitea-eclipse` | theme selector icon for `--theme-color-scheme: auto` (`modules/templates/util_render.go:242`); live: footer theme menu on **all 36 pages**, settings/appearance | half-moon | **replace → `octicon-device-desktop`** | UI glyph. "Auto" = follow the system; device-desktop is the conventional "system" icon; GitHub has no eclipse glyph. |
| `gitea-whitespace` | `repo/diff/whitespace_dropdown.tmpl:2` (live: icons-commit) | ¶-like whitespace | **replace → `octicon-gear`** | UI glyph. GitHub keeps diff whitespace options behind the diff-settings gear. (`octicon-space` was considered: in 19.38 it is the Copilot-Spaces folder glyph — wrong meaning.) |
| `gitea-split` | `repo/diff/whitespace_dropdown.tmpl:30` (live: icons-commit) | split arrows | **replace → `octicon-split-view`** | UI glyph; `split-view` is Primer's two-pane glyph. |
| `gitea-join` | same button when split view is active | join arrows | **replace → `octicon-rows`** | UI glyph; closest Octicon for a single stacked (unified) view. Weakest match of the set. |
| `gitea-lock` | `repo/commit_sign_badge.tmpl:66` (signed, verified, known user) | padlock | **replace → `octicon-verified`** | GitHub marks verified signatures with the `verified` badge glyph. |
| `gitea-lock-cog` | `repo/commit_sign_badge.tmpl:69` (verified by instance/trusted key) | padlock + cog | **replace → `octicon-shield-check`** | Keeps a distinct "trusted by system" meaning; the original's cog cut-out is a hard-coded white fill that disappears on dark backgrounds (contact sheet, dark). |
| `gitea-unlock` | `repo/commit_sign_badge.tmpl:73` (signed but unverified, class `commit-is-signed sign-warning`) **and** unsigned commits on the commit page (`commit_page.tmpl:174` passes no Commit, badge has no `commit-is-signed`; live: commit-detail) | open padlock | **replace → `octicon-unlock`** (w2 r1; w1 used `unverified`). GitHub themes: unsigned → **hide badge** (data-display D-4, done); signed-but-unverified → **mask `unverified`** (data-display D-5) | The w1 drawing `unverified` was wrong in Gitea's own themes: an *unsigned* commit told gitea-auto users "Unverified", which in GitHub's vocabulary means *signed, key not verified* (critic w2 r0 #1, live on /octo-org/grex/commit/99cc3477). `unlock` keeps Gitea's meaning ("not verified / not signed") in every theme, so the file override is again purely presentational (§2.2). GitHub-specific meaning is applied theme-scoped by masks. Sim (Gitea not restarted): `shots/icons-w2r1/sim-sheet-1440.png`. Known limit (critic r2): a *signed* commit whose key is unknown (`NoKeyFound`, Warning=false) renders without `commit-is-signed`, so D-4 hides it where github.com would show "Unverified"; the DOM carries no locale-independent marker for that case. |
| `gitea-running` | `repo/icons/action_status.tmpl:25` (`tw-text-yellow rotate-clockwise`), `pull_merge_box.go:132` (live: actions-list, action-run, icons-actions); JS: ActionRunJobView, RepoCodeFrequency, RepoContributors, RepoRecentCommits, ViewFileTreeItem, action-status-icon | spinning ring | **keep — verified identical to github.com (w2 r1)** | github.com's Actions "currently running" icon (logged-out, microsoft/vscode `/actions?query=is:in_progress`, `shots/icons-w2r1/gh-probe2.json`, `gh-running-row-light.png`) has **the same three paths** (`M3.05 3.05a7 7 …` ring at opacity .5, `M8 4a4 4 …` dot, `M14 8a6 6 0 0 0-6-6V0a8 8 …` arc), coloured `--fgColor-attention` and rotating (`.anim-rotate`: `rotate-keyframes 1s linear infinite`, Primer `utilities/animations.scss:188`). Gitea: `tw-text-yellow` → `--color-yellow` → `--fgColor-attention` (gitea-map), `rotate-clockwise` 1s linear infinite. There is no Octicon for it. |
| `gitea-empty-checkbox` | JS only: `ActionRunJobView.vue:440-457` (log options), `EasyMDEToolbarActions.ts:111` | empty rounded square | **keep** | It is the outline of `octicon-checkbox` (same 1.75 radius / 1.5 stroke geometry); Octicons has no unchecked variant (`square` is a tiny 8px box). JS-only → no file effect anyway. |
| `gitea-favicon` | JS `modules/favicon-status.ts:6` | Gitea logo | **keep** | Brand. |
| `gitea-gitea` | webhook icon `shared/webhook/icon.tmpl:6`, migrate card, OAuth "gitea" (live: icons-migrate) | Gitea logo | **keep** | Brand (the Gitea logo stays, ARCHITECTURE §11). |
| `gitea-colorblind-redgreen`, `gitea-colorblind-blueyellow` | theme menu extra icon (`services/webtheme/webtheme.go:61-69`; live: settings/appearance ×7) | two-colour disc | **keep (w2 r1 re-checked)** | Meaning *is* the colour pair (hard-coded fills): they tell the protanopia/deuteranopia and tritanopia theme variants apart in Gitea's theme menu. github.com has no equivalent marker (its colour-blind themes are chosen from preview cards in Settings → Appearance), and any Octicon would drop the information. Only on settings/appearance and the footer theme menu (critic w2 r0: 16 + 12 on 4 pages). |
| `gitea-git` | `MigrationIcon` for non-GitHub hosts (issue/comment/review/release), "open in" fallback, migrate card (live: icons-migrate) | git logo | **keep** | Brand of the source system. |
| `gitea-vscodium`, `gitea-jetbrains` | clone "open with" menu (`routers/web/repo/view_home.go:81-83`); VS Code already uses `octicon-vscode` | IDE logos | **keep** | Brand. |
| `gitea-feishu`, `gitea-matrix` | webhook type icons `shared/webhook/icon.tmpl:20,22` | service logos | **keep** | Brand. |
| `gitea-gitlab`, `gitea-gitbucket`, `gitea-gogs`, `gitea-onedev`, `gitea-codebase`, `gitea-codecommit` | migrate page cards at 184px (`repo/migrate/migrate.tmpl:12-16`; live: icons-migrate ×1 each) | migration-service logos | **keep** | Brand (GitHub card uses `octicon-mark-github` already). |
| `gitea-google`, `gitea-bitbucket`, `gitea-discord`, `gitea-dropbox`, `gitea-facebook`, `gitea-twitter`, `gitea-yandex`, `gitea-azuread`, `gitea-azureadv2`, `gitea-microsoftonline`, `gitea-nextcloud`, `gitea-mastodon`, `gitea-openid` | OAuth2 provider buttons / linked accounts (`services/auth/source/oauth2/providers_*.go`) — none configured here, not seen live | provider logos | **keep** | Brand. |
| `gitea-alpine`, `-arch`, `-cargo`, `-chef`, `-composer`, `-conan`, `-conda`, `-cran`, `-debian`, `-go`, `-helm`, `-maven`, `-npm`, `-nuget`, `-pub`, `-python`, `-rpm`, `-rubygems`, `-swift`, `-terraform`, `-vagrant` | package type icons (`models/packages/package.go:137-190`; `package/shared/list.tmpl:26`, `view.tmpl:47`, cleanup rules 32px) — no packages yet, not seen live | registry logos | **keep — verified (w2 r1)** | Brand. github.com's org package list (`/orgs/github/packages?ecosystem=npm`, logged-out, `shots/icons-w2r1/gh-packages-npm-light.png`) shows the **npm logo** in red on every npm row; containers get `octicon-container`, actions `octicon-play`. So `gitea-npm` in packages-org / package-detail-npm (critic w2 r0: 8 on 8 pages) is parity, not a gap. |
| `fontawesome-openid` | OpenID sign-in (`user/auth/signin_openid.tmpl`, `external_auth_methods.tmpl:9`, settings/security/openid, profile) (live: login, signup) | OpenID logo | **keep (w2 r1 re-checked)** | Brand of the sign-in method; github.com has no OpenID sign-in, so there is no GitHub glyph to match, and no Octicon depicts OpenID. Live on login / signup (critic w2 r0: 8 on 8 pages). |
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
- The shoot audit flags them as `material-file:<name>` since integrator I-5 (they carry an `octicon-file` class, so before I-5 they passed silently). Owner of the fix: code (C-1/C-2).
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

### 2.2 Effect of the file overrides on other themes (Gitea, Modern, Studio)

Server-side override files are global: they are read at startup and served for every theme and user
(`modules/svg/svg.go`). `DEFAULT_THEME` is `gitea-auto`, so most users of this instance see them outside the GitHub
theme. Rule (policy §6): a file override is allowed only if its drawing is correct under **every** theme, i.e. the
icon is purely presentational and every call site means the same thing.

Checks (round 4): no Gitea CSS (`web_src/css`) and no Modern/Studio CSS (`CUSTOM_PATH/public/assets/css/{theme-modern*,modern/,theme-studio*,studio/}`)
selects any of the 17 overridden class names (grep, 0 hits each), so the new drawings inherit the same size and
`currentColor` in every theme.

| Override | Call sites | Effect in Gitea/Modern/Studio | OK? |
|---|---|---|---|
| `gitea-eclipse` → `device-desktop` | theme menu "Auto" entry + footer | Auto shows a monitor instead of a half-moon (sim r4 `shots/icons-r4/cmp-footer.png`, column 2) | yes: one meaning ("follow system") |
| `gitea-exclamation` → `alert` | commit status error/warning | triangle instead of "!" in state colour | yes |
| `gitea-whitespace` → `gear`, `gitea-split` → `split-view`, `gitea-join` → `rows` | diff toolbar buttons | Octicon glyphs in the same buttons | yes: single meaning each |
| `gitea-lock` → `verified`, `gitea-lock-cog` → `shield-check` | commit signature badge (verified) | GitHub's signature glyphs; `shield-check` also fixes the white cog cut-out that vanished on dark themes | yes |
| `gitea-unlock` → `unlock` (w2 r1) | badge for signed-unverified **and** unsigned commits | open padlock, same meaning as Gitea's drawing (sim `shots/icons-w2r1/sim-sheet-1440.png`, gitea-auto rows) | yes (w1's `unverified` was **no**: unsigned commits read "Unverified", critic w2 r0 #1) |
| `fontawesome-save` → `check`, `fontawesome-send` → `key` | Save buttons in 2 modals; access-token list item | Octicon glyphs | yes |
| `material-invert-colors` → `circle`, `material-palette` → `paintbrush` | commit graph Mono/Color buttons | Octicon glyphs | yes |
| `material-folder-symlink` → `file-directory-symlink` | material file-icon theme, dir symlinks | muted Octicon instead of a blue folder | yes |
| `octicon-project-template`, `octicon-repo-forked-locked` | 19.28.1 → 19.38.0 path refinements | same glyph, newer drawing | yes |
| ~~`gitea-double-chevron-left/right`~~ | pagination First/Last **and** PR-list base/head arrow | round 3 gave `main ⇤ head` in every theme → **withdrawn in round 4**; w2 r1: files deleted from CUSTOM_PATH | no → Gitea's bundled original |

Withdrawn overrides: `npm run deploy` now deletes files it placed earlier that are no longer in `src/icons/svg`
(integrator I-7, `CUSTOM_PATH/public/assets/img/svg/.gh-icons-manifest.json`). w1 r4 had re-emitted Gitea's original
bytes for the two chevrons (`RESTORED`) as a stop-gap; w2 r1 empties `RESTORED`, and the w2 r1 deploy reported
`iconsRemoved: [gitea-double-chevron-left.svg, gitea-double-chevron-right.svg]` (CUSTOM_PATH listing checked: 15 files,
all `cmp`-identical to `src/icons/svg`). Until the next restart Gitea keeps serving the in-memory copies (same bytes as
its bundle), so there is no visible change either way.

**Upgrade pinning (critic w1 r4 #5, w2 r0 #7).** Every file in `CUSTOM_PATH/public/assets/img/svg` shadows Gitea's
bundled icon of the same name, also after a Gitea upgrade. The 2 upgraded Octicons pin 19.38.0 drawings (harmless
until Gitea ships a newer Octicons; then they would be *older*), and the 13 replacements pin the names: if a future
Gitea renames or re-purposes one of `gitea-*` / `fontawesome-*` / `material-*` above, the override keeps drawing the old
Octicon or becomes dead. After any Gitea upgrade: point `--gitea-src` at the new source and run
`node src/icons/gen-icons.mjs --check` (it fails when a replaced name no longer exists, and re-derives the upgrade set
from the new bundle), then re-read the call sites in §2 for the replaced names.

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

- `svg/` — 15 files (2 upgrades + 13 replacements; `RESTORED` is empty since w2 r1, §2.2). Regenerate: `SVGO_PATH=<dir with node_modules/svgo@4.0.1> node src/icons/gen-icons.mjs`
  (or plain `node src/icons/gen-icons.mjs` once `svgo@4.0.1` is a devDependency); `--check` verifies freshness.
- `octicon-masks.css` — `:root { --gh-octicon-<name>: url("data:image/svg+xml,…") }` for alert, stop, x-circle, info,
  check-circle, arrow-left, arrow-right, move-to-start, move-to-end, file, file-directory-fill, file-directory-open-fill, file-submodule,
  file-symlink-file, file-directory-symlink; w2 r1 adds unverified (data-display D-5) and issue-opened,
  git-pull-request, milestone, telescope, search (navigation NI-1) → **21**. Bundled by `build/build.mjs` into
  `gh.tokens` (integrator I-4, done); only masks some folder references via `var(--gh-octicon-…)` are kept.
  Catalogue check w2 r1: all 21 render as the named Octicon at 32 and 16px next to the source SVG
  (`shots/icons-w2r1-masks.mjs` → `shots/icons-w2r1/masks-catalogue.png`, 21/21 mask-images resolve).
- `manifest.json` — what was generated and why.
- Contact sheet: `shots/icons-sheet.html` / `shots/icons-sheet.png` (Gitea original vs ours, 16/32px, in a button,
  light + dark). Built by `shots/icons-sheet.mjs`; round 3 and round 4 (chevron rows now "restored: Gitea original", identical glyphs, looked at): **197/197** SVGs render with a non-empty bbox (17 rows × 2 schemes × 5 + 27 candidates; the count grew from 195 (r1) and 196 (r2) because candidates were added: `circle` in r2, `dot` in r3).

## 5. Open items

### Wave 2, round 1 (live server started 2026-09-29T18:30Z; w1 overrides are live)
- **Live audit** `shots/icons-w2r1/full/` (74 routes = routes.json + 6 icon routes, light/dark × 1440/390, `--states`;
  296 pages, 0 failed requests, 0 pages with unlayered Gitea CSS): `nonOcticonIcons` **288**, `maskedIcons` **1700**
  (material-file 984 + octicon-file 560 via code C-2, triangle-down 92, pagination double-chevrons 32 + 32 via
  navigation N-3). The 288 non-Octicons, each a documented decision:
  | Name | Count / pages | Decision | Status |
  |---|---|---|---|
  | `gitea-double-chevron-left` (PR-list branch chips, 12px) | 208 / 36 | parity: hide chips (P-2) or mask `arrow-left` (P-1) | owner pages/issues-prs, pending |
  | `gitea-colorblind-blueyellow` / `-redgreen` | 16 + 12 / 4 | keep (meaning is the colour pair) | final |
  | `fontawesome-openid` | 8 / 8 | keep (brand; github.com has no OpenID sign-in) | final |
  | `gitea-npm` | 8 / 8 | keep — github.com shows the npm logo on npm package rows (verified) | final |
  | `gitea-running` | 4 / 4 (actions status filter) | keep — identical paths to github.com's running icon (verified), `--fgColor-attention`, 1s rotation | final |
  | 8 migrate-card brands (`gitea-git`, `-gitlab`, `-gitea`, `-gogs`, `-onedev`, `-gitbucket`, `-codebase`, `-codecommit`) | 32 / 4 | keep (brand) | final |
  Pagination double chevrons now render as masked `move-to-start` / `move-to-end` at 14×14 (disabled `rgb(129,139,152)`
  light / `rgb(101,108,118)` dark, links `--fgColor-accent`), `shots/icons-w2r1/crops-sheet.png`,
  `crops/pagination-dark-390-recheck.png`. (One capture in the first crop run showed unstyled pagination while
  another folder was redeploying the theme CSS; 4/4 re-captures are styled.)
- **`gitea-unlock` → `unlock`** (critic w2 r0 #1, §2). Deployed; takes effect at the next restart (integrator II-1).
  Signed-but-unverified in GitHub themes → data-display D-5 (`unverified` mask). Sim: `shots/icons-w2r1/sim-sheet-1440.png`.
- **RESTORED dropped** (critic w2 r0 #4): deploy removed both chevron copies (`iconsRemoved`), §2.2.
- **Masks: 21** (added `unverified`; navigation NI-1: issue-opened, git-pull-request, milestone, telescope, search),
  catalogue `shots/icons-w2r1/masks-catalogue.png` (21/21 exact).
- **Double chevrons, parity first** (critic w2 r0 #2): github.com has no First/Last and no PR-list branch chips →
  navigation N-5 and pages/issues-prs P-2 propose hiding them; the masks are the fallback.
- Still open: svgo devDependency (integrator II-2 / I-2); the diff toolbar button box (code C-4) and the `NoKeyFound`
  signed commit hidden by D-4 (accepted limitation).
- Older round notes below are wave 1 history; statements there that things are "simulated" or "need the restart"
  were resolved by the 2026-09-29T18:30Z restart.

### Round 4
- **Chevron regression fixed (critic r3 issue A).** `gitea-double-chevron-left/right` are no longer overridden: the
  generator re-emits Gitea's original bytes (`RESTORED`, §2.2), and `npm run deploy` wrote them to `CUSTOM_PATH`
  (`iconsChanged: 2`, `restartRequired: true`; `cmp` with gitea-src: identical). Simulation `shots/icons-r4-sim.mjs`
  (3 targets × light/dark × 1440/390 × 4 modes = 48 captures, 0 failed, 0 console errors), sheet
  `shots/icons-r4/cmp-pag-branches.png`:
  - `gitea-theme` (today) and `ours-gitea-theme` (icons after the restart, Gitea's `gitea-auto`) are identical:
    PR list `main « head` 12×12, rgb(91,97,103) light / rgb(150,154,161) dark; pagination `« First … Last »`.
    **No effect on non-GitHub themes.**
  - `ours` (github-auto, restart only, before I-4): Gitea's `«`/`»` glyphs in our colours (rgb(89,99,110) /
    rgb(145,152,161) in the PR list). Same as today, not a regression.
  - `proposals` (github-auto + N-3 + P-1 masks): pagination `⇤ ‹ 1 › ⇥` (390) and `⇤ First ‹ Previous 1 … Next › Last ⇥`
    (1440), masks applied, 16×16, currentColor rgb(31,35,40) / rgb(240,246,252); PR list `main ← head`, 12×12,
    rgb(89,99,110) / rgb(145,152,161).
  - Cost: the GitHub pagination glyphs depend on I-4 + N-3 again (reinstated in docs/requests/navigation.md), the same
    prerequisites as round 2. Without them the GitHub themes show Gitea's `«`/`»`, which is today's state, not a
    regression. P-1 is now an improvement (`«` → `←`) rather than a repair.
  - All of the above is simulated (Gitea has not been restarted since 2026-09-29T15:31:18Z).
- **Cross-theme table (§2.2)** for all 15 remaining overrides; Modern/Studio/Gitea CSS select none of them.
- **Audit tool note:** masked icons keep their `gitea-double-chevron-*` class, so `icons.nonOcticon` in the shoot audit
  will keep listing them on github-* pages even when they are drawn as Octicons. I-5 (tool) is extended with this case.

### Round 3
- **Pagination no longer depends on other folders.** `gitea-double-chevron-left/right` now carry `move-to-start` /
  `move-to-end` (the file serves pagination twice and the PR list once). After the restart alone the bar reads
  `⇤ ‹ 1 › ⇥` at 390 and `⇤ First ‹ Previous 1 2 … Next › Last ⇥` at 1440, light and dark (sim, `shots/icons-r3/cmp-a.png`,
  `cmp-b.png`). N-3 is withdrawn. The PR-list 12px glyph becomes `arrow-left` via the P-1 mask (pages/issues-prs;
  verified by injection: `mask: true`, 12×12, currentColor rgb(89,99,110) / rgb(145,152,161)).
- **Simulation now includes I-6.** `shots/icons-r3-sim.mjs` (96 captures, 0 failed, 0 console errors; waits 1.8 s for
  lazy chunks). "ours + I-6 + requested CSS" on repo home: 0 unlayered index.css, directories rgb(84,174,255) light /
  rgb(145,152,161) dark, material icons → masked `octicon-file`. Without I-6 ("ours"): 1 unlayered index.css and
  directories rgb(9,105,218) / rgb(68,147,248). Sheets `shots/icons-r3/cmp-{a,b,c,d}.png`, report
  `shots/icons-r3/sim/report.json`.
- **Graph Mono (nit, kept).** `octicon-circle` is a full 16px ring and reads heavier than `paintbrush`; `dot` (8px ring,
  contact sheet) is too small to read as a button icon at 16px. The icon touching the segment border is button padding
  (controls / pages/repo), unchanged from Gitea.

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

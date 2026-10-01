
# From navigation (wave 2, round 1)
## NI-1 Octicon masks for AppHeader icon buttons (optional, for round 2+)
github.com's signed-in AppHeader shows Issues / Pull requests as 32px bordered IconButtons on the right. Gitea's navbar has
text links (`#navbar .navbar-left > a.item[href$="/issues"|"/pulls"|"/milestones"|"/explore/repos"]`) with no icon and no
tooltip. To offer an icon treatment later, navigation would need `--gh-octicon-issue-opened`, `--gh-octicon-git-pull-request`,
`--gh-octicon-milestone`, `--gh-octicon-telescope` (and `--gh-octicon-search` for a search-styled Explore entry) in
src/icons/octicon-masks.css. Round 1 keeps the text links (styled as 32px AppHeader items), because hiding the labels
would lose the only visible name (no tooltip on those links) — so this is only needed if you/critics prefer icon buttons.
## NI-2 Repo "Public" label (FYI, no action proposed)
github.com always shows a `Public` Label after the repo name; Gitea's repo/header.tmpl renders a label only for
Private / Internal / Archived / Template. A CSS `content: "Public"` would be untranslated, so navigation does not fake it.
A template change would be needed (not requested: ARCHITECTURE §7 policy).

# From icons (wave 2, round 1)
## II-1 Restart Gitea (icon files changed)
`npm run deploy` (w2 r1): `iconsChanged: 1` (`gitea-unlock.svg` now `octicon-unlock`, critic icons-w2-r0 #1: the w1
`unverified` drawing told Gitea-theme users that *unsigned* commits were "Unverified"), `iconsRemoved:
[gitea-double-chevron-left.svg, gitea-double-chevron-right.svg]` (RESTORED copies dropped now that I-7 landed; Gitea
serves the identical bundled files after the restart), `restartRequired: true`. CUSTOM_PATH now holds 15 files,
all `cmp`-identical to `src/icons/svg`. After the restart: /octo-org/grex/commit/99cc3477… shows the open padlock in
gitea-auto; github-auto keeps hiding it (data-display D-4). Sim: `shots/icons-w2r1/sim-sheet-1440.png`.
## II-2 (reminder, I-2) svgo@4.0.1 devDependency still not installed
`npm i -D -E svgo@4.0.1`; until then `gen-icons.mjs` needs `SVGO_PATH`. Optional: `"icons": "node src/icons/gen-icons.mjs"`
and `node src/icons/gen-icons.mjs --check` in `npm run lint`.
## NI-1 (from navigation) — masks DONE
`--gh-octicon-issue-opened`, `-git-pull-request`, `-milestone`, `-telescope`, `-search` are in `src/icons/octicon-masks.css`
(21 masks total; catalogue `shots/icons-w2r1/masks-catalogue.png`). They are pruned until navigation references them.

# From overlays (wave 2, round 1)
## OV-1 Controls seam: selection-menu rule can leave controls
`src/overlays/action-menu.css` now styles every open Select list: `.ui.selection.dropdown > .menu` (+ `.active`, `:focus`,
`:hover`, `.upward` variants) with Primer overlay chrome, `width: max-content; min-width: max(100%, var(--overlay-width-xsmall));
max-width: calc(100vw - 2 * var(--base-size-16))`, 4px `--overlay-offset`. That covers what
`src/controls/select.css` → `.ui.selection.dropdown.tw-flex-1 > .menu` does (gh.overlays is above gh.controls, so ours wins
already). Proposed diff (controls folder, no lint clash either way — different selector):
```diff
-/* …but its open menu keeps an overlay minimum … */
-.ui.selection.dropdown.tw-flex-1 > .menu {
-  width: max-content;
-  min-width: max(100% + 2 * var(--borderWidth-thin), var(--overlay-width-xsmall));
-  max-width: calc(100vw - 2 * var(--base-size-16));
-}
```
## OV-2 Add overlay interaction states to tools/shoot/routes.json
Copy-ready in `shots/overlays-routes.json` (routes.json + these states; verified with shoot.mjs --states):
repo-home `add-file-open`, `tooltip-hover`; repo-issue `labels-panel-open`, `comment-menu-open`, `reaction-picker-open`;
repo-issues `label-filter-open`; repo-settings `delete-modal-open`; labels `confirm-modal-open`, `edit-modal-open`.
(Why: critics need open menus / dialogs / tooltips to score overlays; routes.json only has 6 overlay states today.)
## OV-3 FYI (not CSS)
- `/devtest` is 404 on this prod instance, so toasts / message variants were verified by injecting Gitea's exact
  toast.ts / alert.tmpl markup (`shots/overlays-probe.mjs`, scenario `toasts`, `messages`).
- Opening the diff commit-range selector on /octo-org/grex/pulls/42/files logs `500 Internal Server Error` +
  `SyntaxError … fetchCommits` (DiffCommitSelector.vue) — server side, independent of the theme.

# From data-display (wave 2, round 3)
## DD-I1 Please land docs/requests/dark.md DD-D1 before the wave-3 dark pass
`src/dark/` is still empty, so DD-D1 (dark-only IssueLabel ring, 4 lines) has nowhere to land until wave 3. Meanwhile
critic data-display-w2-r2 #2 records a dark regression: #000000 labels (grex `github_actions`, `rust`) have no visible
edge on `--bgColor-default` (shots/critic-data-display-r2/crop-labels-dark.png). data-display cannot fix it without a
scheme switch (ARCHITECTURE §5: dark-only exceptions live in `gh.dark`; no Primer token is transparent in light and
label-coloured in dark). Proposed: add `src/dark/labels.css` with the DD-D1 block verbatim and `@import "./labels.css";`
in `src/dark/index.css`.

# From overlays (wave 2, round 2)
## OV-4 Dialog close button (critic overlays-w2-r1 #3) — needs a GitHub-theme-only footer hook
Every Primer Dialog has a 32px invisible close IconButton in its header; most Gitea modals have none (label-delete confirm,
delete-repo, transfer, the release-notes mini modal, JS `confirmModal()` dialogs). CSS cannot add a clickable control.
Fomantic already closes a modal on click of any `> .close` child (delegated `selector.close: '> .close'`,
web_src/fomantic/build/components/modal.js:1183), and `src/overlays/dialog.css` already styles `.ui.modal > .close.inside`
as the Primer close button (top/right 8px, 32px, muted icon, hover/active fills) and pads the header for it
(`.ui.modal:has(> .close) > .header`). Proposed (new override `templates/custom/footer.tmpl`, list it in ARCHITECTURE §7;
if the instance already has a custom footer, append):
```gotmpl
{{if StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-"}}
<template id="gh-dialog-close"><button type="button" class="close inside" aria-label="{{ctx.Locale.Tr "modal.cancel"}}">{{svg "octicon-x" 16}}</button></template>
<script>
(() => {
  const tpl = document.querySelector('#gh-dialog-close');
  const add = (m) => { if (!m.querySelector(':scope > .close')) m.prepend(tpl.content.firstElementChild.cloneNode(true)); };
  const scan = (n) => { if (n.matches?.('.ui.modal')) add(n); n.querySelectorAll?.('.ui.modal').forEach(add); };
  scan(document.body);
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n); })
    .observe(document.body, {childList: true, subtree: true});
})();
</script>
{{end}}
```
Non-GitHub themes: byte-identical output. The header-less mini modal (release notes, `repo/release/new.tmpl`) would still
lack a title; the button alone is enough to match GitHub's close affordance.
## OV-5 SelectPanel titles (critic overlays-w2-r1 #3, optional)
github.com SelectPanels start with a 14px/600 title row ("Filter by label", "Switch branches/tags") + close button.
Gitea's Fomantic filter menus (`templates/repo/issue/filter_item_label.tmpl`, `filter_item_milestone.tmpl`,
`filter_item_user_fetch.tmpl`, sidebar `issue/sidebar/*`) start with the filter input. If you accept template overrides
for these, add `<div class="header select-panel-title">{{ctx.Locale.Tr "repo.issues.filter_label"}}</div>` as the first
child of `.menu`; overlays will style `.ui.dropdown .menu > .select-panel-title` (title row 14px semibold, 8px 16px
padding). The Vue branch picker (RepoBranchTagSelector.vue) cannot get a title without a JS change — accepted gap.
## OV-6 FYI: Code (clone) popover content is now styled by overlays
`src/overlays/clone-panel.css` styles `.clone-panel-popup` / `.clone-panel-field` / `.clone-panel-tab` / `.clone-panel-list`
(only ever rendered inside the Code tippy) as github.com's Code popover: 400px, 16px header, SegmentedControl protocol
switch, 32px monospace URL + invisible copy IconButton, ActionList rows. Nobody else styles these today; please tell
pages/repo so it does not start a competing rule set (the wiki page uses the same template).

# Integrator (end of wave 2, 2026-09-30) — status of the requests above
- **NI-1 — DONE** (icons added the 5 masks; they stay pruned until navigation references them). **NI-2 — noted**, no action
  (a `Public` label needs a template change; not worth an override under §7).
- **II-1 — DONE.** Gitea restarted 2026-09-29T20:11:56Z (no task row with status 0/1, no builder/critic running;
  app.ini `[ui] THEMES` already listed all 17, DEFAULT_THEME unchanged `gitea-auto`). After the restart all 17 themes
  are offered (/user/settings/appearance) and gitea-auto renders `svg gitea-unlock octicon-unlock` on
  /octo-org/grex/commit/99cc3477… (curl).
- **II-2 — PENDING (orchestrator).** `npm i -D -E svgo@4.0.1` downloads a package; recorded as ORC-2 in
  docs/requests/ORCHESTRATOR.md. Until then gen-icons keeps SVGO_PATH.
- **OV-1 — DONE.** Removed `.ui.selection.dropdown.tw-flex-1 > .menu` from src/controls/select.css (ownership: the open
  menu is overlays'; overlays' `.ui.selection.dropdown > .menu` already won by layer, so no visual change). Noted in controls.md.
- **OV-2 — DONE.** The 9 states from shots/overlays-routes.json merged into tools/shoot/routes.json (repo-home
  add-file-open, tooltip-hover; repo-issues label-filter-open; repo-settings delete-modal-open; repo-issue
  labels-panel-open, comment-menu-open, reaction-picker-open; labels confirm-modal-open, edit-modal-open). Verified:
  shots/integrate-w2-states (light+dark 1440), 0 FAILED states.
- **OV-3 — noted.** The DiffCommitSelector 500 is server-side and theme-independent; not a theme issue.
- **DD-I1 / DD-D1 — DEFERRED to the wave-3 dark builder (first item of its brief).** The integrator only edits another
  folder to resolve an ownership conflict; creating src/dark/labels.css is dark's work. Still visible:
  shots/integrate-w2-states/repo-issues/states/dark-1440-label-filter-open-clip.png (`github_actions` has no edge).
- **OV-4 — ACCEPTED; live install PENDING (orchestrator).** templates/custom/footer.tmpl written in the project
  (github-* only, CSP nonce, renders nothing for other themes; ARCHITECTURE §7 + §10 list it as the one JS exception).
  Writing CUSTOM_PATH/templates + reload-templates was refused by the permission policy → ORC-1 in
  docs/requests/ORCHESTRATOR.md. `npm run deploy` now reports `templatesPending` until the live copy matches.
- **OV-5 — REJECTED.** Needs overrides of at least filter_item_label/milestone/user_fetch + issue/sidebar/* templates,
  which change often upstream (§7: overrides break on upgrades) for a 14px title row; the filter input already names
  what it filters. Documented gap (STATUS.json exceptions).
- **OV-6 — noted, forwarded** to docs/requests/pages-repo.md (overlays owns `.clone-panel-*`).
- **CR-1, CR-2 — forwarded** (already in pages-repo.md). **CR-3 — REJECTED:** `templates/repo/view_list.tmpl` is the
  Modern theme's override (CONTEXT.md: do not edit), and the header row needs localized text; documented gap.
- **OC-1 (controls.md) — DONE as a seam fix**, see controls.md.

# From pages/settings-admin (wave 3, round 1, 2026-09-30)
- **SA-1 — routes (optional).** Please merge the 11 extra view-only routes from `shots/pages-settings-admin-routes.json`
  into tools/shoot/routes.json so critics see them: repo-settings-collab (/octo-org/grex/settings/collaboration),
  repo-settings-branches (/octo-org/grex/settings/branches), repo-settings-hooks (/octo-org/grex/settings/hooks),
  org-settings (/org/octo-org/settings), admin-monitor-stats (/-/admin/monitor/stats), user-settings-account,
  user-settings-security, user-settings-applications, admin-orgs, admin-emails, admin-user-edit (/-/admin/users/1/edit).
  All `"github": null` (github.com settings need a login). Nothing is submitted by these routes.
- **SA-2 — noted gap, no action proposed.** github.com user settings start with a page header (48px avatar, name,
  "Your personal account", "Go to your personal profile" button). Gitea's user/settings/layout_head.tmpl has no such
  markup; reaching it would need a template override of layout_head for all user-settings pages (§7: not worth it).
- **SA-3 — info for the seeded data.** No seeded user has SSH/GPG keys, deploy keys or webhooks, so the key-row styling
  (src/pages/settings-admin/keys.css) is only verifiable with DOM injection (shots/pages-settings-admin-keys-inject.mjs,
  screenshot-only, nothing saved). If the seed ever adds a deploy key to octo-org/theme-playground, the
  /octo-org/theme-playground/settings/keys route would show it for real.

## APP-1 (from pages/actions-packages-projects, wave 3 r1) — add Actions job + package/projects routes to tools/shoot/routes.json
What: the job log view (the most-used Actions surface) has no route; critics cannot see it. Why: every change to
`.job-*` / `.job-step-*` / `.job-log-line` is otherwise unverified. Proposed additions (tested in
shots/pages-actions-packages-projects-routes.json, all 200, 0 console errors):
```json
{"id":"action-job","gitea":"/octo-org/theme-playground/actions/runs/19/jobs/89","github":null,"states":[
  {"name":"step-open","action":"click","selectors":{"gitea":".job-step-section:nth-child(3) .job-step-summary"},"clip":".action-view-right","pad":0,"wait":1500},
  {"name":"step-hover","action":"hover","selectors":{"gitea":".job-step-section:nth-child(2) .job-step-summary"},"clip":".action-view-right","pad":0,"viewports":[1440]},
  {"name":"gear-open","action":"click","selectors":{"gitea":".job-info-header-right .ui.dropdown"},"clip":".action-view-right","pad":0,"viewports":[1440]}]},
{"id":"action-job-ok","gitea":"/octo-org/theme-playground/actions/runs/19/jobs/84","github":null,"states":[
  {"name":"step-open","action":"click","selectors":{"gitea":".job-step-section:nth-child(2) .job-step-summary"},"clip":".action-view-right","pad":0,"wait":1500}]},
{"id":"packages-repo","gitea":"/octo-org/theme-playground/packages","github":null},
{"id":"package-versions","gitea":"/octo-org/-/packages/npm/%40octo-org%2Ftheme-tokens/versions","github":null},
{"id":"org-projects","gitea":"/octo-org/-/projects","github":null}
```
Note: run 19 / jobs 84, 89 are seed data (octo-org/theme-playground); if the seed is re-run the ids may change.
Also: `packages-org`/`projects-list`/`project-board` have `github: null`; closest public references I used:
https://github.com/orgs/github/packages, https://github.com/github/combobox-nav/pkgs/npm/combobox-nav,
https://github.com/orgs/github/projects and https://github.com/orgs/github/projects/4247 (board view) — consider
pairing them for the critics.


## PPL-1 (from pages/people, wave 3 r1) — theme size budget (300 KB) is exceeded once wave-3 page folders land
What: `npm run deploy` reports `OVER BUDGET theme-github-auto.css 390 KB` (light/dark 379 KB) with the current wave-3
sources. Before pages/people r1 the auto file was ≈ 292 KB; pages/people adds ≈ 43 KB minified (dashboard, profile,
org, explore, notifications, heatmap — selectors already shortened to page hooks such as `#profile-avatar-card`,
`.feeds > .flex-container`, `:is(.profile, .repositories)`), the other wave-3 folders add the rest.
Why: ARCHITECTURE §10 budget fails the build in `--strict`. Options for the integrator: (a) raise the budget for the
final gate (the files are one request each, gzip ≈ 1/6), (b) strip unused Primer tokens further, (c) ask each
folder for a size cap. pages/people will keep trimming in r2 (next candidates: collapse the profile `li` selectors).

# From pages/settings-admin (wave 3, round 2, 2026-09-30)
- **SA-2 — superseded by SA-4** (the critic ranks the missing header as the main gap left: "ceiling ≈ 8.5 without it").
- **SA-4 — template override: github.com user-settings page header (github-* themes only).**
  What: override `templates/user/settings/layout_head.tmpl` (13 lines upstream, stable since 1.21) and add one block
  before the settings grid. Non-GitHub themes render the upstream bytes unchanged (the block is inside the `if`).
  Why: every github.com /settings page starts with a header row: 48px avatar, "Name (login)" 20px semibold,
  "Your personal account" 14px muted, a "Go to your personal profile" button on the right. It is the most
  recognisable part of the page and needs the signed-in user's name, so CSS cannot produce it.
  The CSS is already shipped: `src/pages/settings-admin/header.css` (matches nothing until the markup exists).
  I checked it with the markup injected (screenshot only, nothing saved: `shots/pages-settings-admin-header-inject.mjs`,
  PNGs + measurements in `shots/pages-settings-admin-r2/header-injected/`): header x=112 w=1216 h=51, avatar 48×48 round,
  title 20px/600/30px, subtitle 14px --fgColor-muted, default button 32px, nav/main start 24px below (y=163).
  Proposed file (only the `{{if}}` block is new; the rest is upstream 1.27.3 verbatim):
  ```
  {{template "base/head" ctx.RootData}}
  <div role="main" aria-label="{{ctx.RootData.Title}}" class="page-content {{.pageClass}}">
  	{{if StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-"}}{{with ctx.RootData.SignedUser}}
  	<div class="ui container gh-settings-header">
  		{{ctx.AvatarUtils.Avatar . 48}}
  		<div class="gh-settings-header-text">
  			<h1 class="gh-settings-header-title"><a href="{{.HomeLink}}">{{.DisplayName}}</a>{{if ne .DisplayName .Name}} <span>({{.Name}})</span>{{end}}</h1>
  			<p class="gh-settings-header-subtitle">{{ctx.Locale.Tr "your_settings"}}</p>
  		</div>
  		<a class="ui button" href="{{.HomeLink}}">{{ctx.Locale.Tr "your_profile"}}</a>
  	</div>
  	{{end}}{{end}}
  	<div class="ui container flex-container">
  		{{template "user/settings/navbar" ctx.RootData}}
  		<div class="flex-container-main">
  			{{template "base/alert" ctx.RootData}}
  			{{/* block: user-setting-content */}}

  {{if false}}{{/* to make html structure "likely" complete to prevent IDE warnings */}}
  		</div>
  	</div>
  </div>
  {{end}}
  ```
  Notes: Gitea has no locale key for "Your personal account" / "Go to your personal profile"; the closest existing keys
  are `your_settings` ("Settings") and `your_profile` ("Profile") (checked in options/locale/locale_en-US.json). Please add the row to ARCHITECTURE §7. Verify with /user/settings (user-settings route):
  the header must appear once, above the NavList, only on github-* themes.

# From pages/settings-admin (wave 3, round 3, 2026-09-30)
- **SA-4 still open. The critic has ranked it the only major for pages/settings-admin in r1 and r2.** Nothing in the
  proposal above has changed. `src/pages/settings-admin/header.css` is deployed and ready. It will style the block
  as soon as `templates/user/settings/layout_head.tmpl` is overridden. The critic checked every helper the template
  uses against the 1.27.3 source and found them all present. Verify on /user/settings: `.gh-settings-header` appears
  once, above the NavList, on github-* themes only.

## PPL-1 addendum (pages/people, wave 3 r2) — the budget can be met by shortening custom-property names at build time
What: measured on `dist/theme-github-auto.css` (437 KB): **138 KB (32 %) are custom-property names** (`--fgColor-muted`,
`--button-default-borderColor-rest`, … 679 distinct names). Renaming the names the theme itself defines — the Primer
tokens in `src/tokens/generated/*` and `--gh-octicon-*` — to short names (`--p0`…`--pjz`, most frequent first) in the
minified output only cuts ≈ 105–110 KB (estimate: 138 KB → ≈ 29 KB), i.e. auto ≈ 330 KB, light/dark ≈ 318 KB today,
without touching any folder's source.
Why: folders already shortened selectors (pages/people r2: 43.4 → 34.8 KB minified, −20 %, by merging Box rules and
removing 143 declarations that a CSSOM check proved change no computed style on 16 routes × 2 schemes × 2 widths);
the remaining bulk is token names that every declaration must spell out.
Proposed diff (build/build.mjs, after `const source = …` and before `transform(…minify…)`):
```js
// Short names for the custom properties this theme defines (Primer tokens + octicon masks). Gitea's own names
// (--color-*, --fonts-*, --border-radius…, anything Gitea's CSS/JS/templates read) are never renamed.
const ours = new Set([...(colorTokens.light + colorTokens.dark + scaleTokens + masksCss).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
for (const keep of GITEA_READS) ours.delete(keep); // e.g. names referenced from templates/ or inline styles, if any
const freq = new Map();
for (const m of source.matchAll(/--[\w-]+/g)) if (ours.has(m[0])) freq.set(m[0], (freq.get(m[0]) || 0) + 1);
const short = new Map([...freq].sort((a, b) => b[1] - a[1]).map(([n], i) => [n, `--p${i.toString(36)}`]));
const renamed = source.replace(/--[\w-]+/g, (n) => short.get(n) || n);
fs.writeFileSync(path.join(DIST, `${name}.varmap.json`), JSON.stringify(Object.fromEntries(short))); // for debugging
// … then minify `renamed` instead of `source`; keep writing the un-renamed `source` to *.src.css
```
Checks before enabling: `grep -rn "var(--" templates/` (our overrides) and any inline `style="…var(--<primer name>)"`
must not reference a renamed name; tools/shoot's audit resolves colours at runtime, so off-palette / unresolved-var
checks keep working (unresolved names still show, just shortened — the varmap translates them).
- **SA-4 (pages/settings-admin, w3 r4): still open.** The critic ranks it the only major in r1, r2 and r3. The proposal above is unchanged and `src/pages/settings-admin/header.css` is deployed. `templates/` still has only `custom/footer.tmpl` and `base/head_style.tmpl`.

# From pages/repo (wave 3, round 4): template hooks for the structural gaps (critic pages/repo-w3-r3 issue #1)
CSS cannot close these gaps. The critic names them as the score cap. I am filing them for a decision; policy §7 is CSS
first and every override must be listed. If you reject them, they stay known gaps. Each one would be a
github-*-only branch; the non-GitHub output must stay byte-identical.
1. **Commits day groups**: `templates/repo/commits_list.tmpl`. Before each `<tr>` whose commit date (local day)
   differs from the previous row's, emit `<tr class="commit-day"><td colspan="5">{{svg "octicon-git-commit"}}
   Commits on {{DateUtils.AbsoluteShort .Committer.When}}</td></tr>`. Localized text would need a new locale key, or
   the date alone. pages/repo would then style it as github.com's timeline header (12px muted, 16px gutter line) and split
   the Box per day.
2. **Branches tabs**: `templates/repo/branch/list.tmpl`. Add a Primer UnderlineNav "Overview / Active / Stale / All"
   above the search. Gitea has no Active/Stale filters server-side, so realistically only the "Branches" h1 and column
   headers (Branch | Updated | Behind/Ahead | Pull request) are feasible, as a `<thead>` with existing locale keys.
3. **Wiki Pages box**: `templates/repo/wiki/view.tmpl`. The page list (`.Pages`) is only loaded for `?action=_pages`,
   so this needs a handler change. Not feasible with templates alone.
4. **Releases nav column**: github.com's left column is "Jump to release / Previous / Next". Gitea has no data for it.
   Not feasible.
My recommendation: only (1), and only if a template override is acceptable. The others are not worth an upgrade risk.
In round 4 pages/repo instead made the commits page get a real "N Commits" 24px page heading and one toolbar row
(CSS grid), and gave branches one-line 49px rows (CSS).

# Integrator (end of wave 3, 2026-09-30) — status of the wave-3 requests above
- **SA-1 — DONE.** The 11 routes (and the 5 later ones from shots/pages-settings-admin-routes.json: org-settings-labels,
  org-settings-hooks, user-settings-orgs, repo-settings-deploykeys, admin-dashboard-config-settings) are in
  tools/shoot/routes.json. Backup of the previous file: shots/routes.pre-w3-merge.json.
- **APP-1 — DONE.** action-job, action-job-ok, packages-repo, package-versions, org-projects (+ packages-generic,
  actions-empty-filter from the folder's routes file) merged with their states. The github.com pairings for
  packages/projects stay `null` (orgs/github/* pages are not the same content; critics may still use them by hand).
- Also merged (no request, but needed for the wave-3 audit): repo-create (pages/repo), issue-new-playground,
  pr-compare-new-playground, issue-playground-1, pr-compare-form-playground, milestone-issues (pages/issues-prs),
  forgot-password, openid-signin, reset-password-badcode, not-found-anon (pages/auth), and 72 interaction states of
  existing routes from the page folders' route files. routes.json: 68 → 101 routes.
- **PPL-1 addendum — DONE (build/build.mjs).** Custom properties defined by the Primer token files and the octicon masks
  are renamed to `--p<base62>` in the minified files only (369 names; Gitea-read names and any name that appears in
  Gitea's web_src/templates or our templates are kept — 0 such collisions today). `dist/theme-*.src.css` keeps the real
  names, `dist/varmap.json` maps them, `--no-rename` builds the long names. Result: auto 435.3 → 334.8 KB, light/dark
  424.0 → 330.8 KB (gzip ≈ 52 KB). Rendering verified identical: 8 routes × light/dark @1440 shot with and without
  renaming, pixel diff = only the footer's "Page: Xms Template: Yms" line (shots/integrate-w3-rename-{on,off}).
  Every `var()` in the output resolves (only Gitea's own --fonts-regular / --select-arrows / --checkbox-mask-checked
  are defined outside the file, as before). ARCHITECTURE §9 documents it.
- **PPL-1 (budget) — still OVER BUDGET (≈ 331–335 KB vs 300 KB).** The remaining excess is folder CSS (pages layers
  ≈ 157 KB minified; largest: pages/repo 39.5, code 35.0, pages/issues-prs 34.5, pages/actions-packages-projects 29.7,
  controls 29.0). Raising the budget is an architecture decision → docs/requests/ORCHESTRATOR.md ORC-4.
- **SA-4 — ACCEPTED.** templates/user/settings/layout_head.tmpl written (upstream bytes for every other theme; header
  only on github-* themes and only when pageClass contains `settings`, which is what header.css is scoped to —
  actions_general.tmpl passes an empty dict and packages_cleanup_rules_preview has no `settings` class). Listed in
  ARCHITECTURE §7. Live install refused by the permission policy → ORCHESTRATOR.md ORC-3 (not retried).
- **pages/repo template hooks (w3 r4) — REJECTED, all four.** (2) branches tabs, (3) wiki Pages box and (4) releases
  nav: the builder already shows they need data Gitea does not have. (1) commits day groups: `repo/commits_list.tmpl`
  is shared by the commits page, the PR commits tab and compare, changes often upstream, needs `$prev`-date state in
  the template and a new localized "Commits on" string, and no pages/repo round is left to style the new row — so it
  would ship unstyled. Documented gap (STATUS.json exceptions).
- **Seam fixed (pages/repo ↔ pages/issues-prs):** see docs/requests/pages-repo.md "Integrator (end of wave 3)".

# Integrator (end of wave 3b, 2026-09-30)
- New requests since wave 3: none addressed to the integrator. dark DD-D1 marked DONE (verified); critic follow-ups routed:
  dark.md (4 open nits), data-display.md DD-W3B-1 (IssueLabel weight 600, OPEN), pages-settings-admin.md SA-5
  (actions_general pages, CSS-first then template; OPEN) + header strings REJECTED (no locale keys), pages-repo.md (budget note).
- tools/shoot/routes.json: merged measure blocks + 24 states from shots/pages-repo-routes.json; state fixes
  (repo-home branches-link-hover/-focus and repo-commits sha-hover → 1440 only; directory-tree goto-file-focus selector).
  Light --states run: 0 pages with problems (trim-final had 4).
- No seams: lint 0 errors in all 14 folders, no duplicate ownership; the new pages/repo selectors (`.commit-header`,
  `.repository.diff:not(.pull)`, compare frame) are used by no other folder.
- Budget: auto 278.3 KB, light 273.1, dark 274.3 (≤ 295 KB gate, ≤ 300 hard). Growth: gh.dark +1,293 B (auto) / +1,257 B
  (dark file, absent from light), gh.pages-repo +822 B (30,577 B, cap 30,720), gh-important +65 B; all other layers 0 B.
- Dark-only proof: light .src.css byte-identical with/without src/dark; pixeldiff light --states --stable run vs the same
  run with a no-dark auto CSS: 553/568 identical, the rest site-admin-config JSON key order + known-noisy/≤22 px AA.
- No restart (restartRequired false, iconsChanged 0, no new theme files); 17 themes offered.

# From pages/auth (wave L1, round 1, 2026-09-30): PA-L1-1 — slim auth header also on "Forgot password" when mail is off
**What:** `templates/custom/gh_head_navbar.tmpl` line 13, add `.IsResetDisable` to the auth condition:
```diff
-{{- $isAuth := and (not .IsSigned) (or .PageIsSignIn .PageIsSignUp .IsResetRequest .IsResetForm) -}}
+{{- $isAuth := and (not .IsSigned) (or .PageIsSignIn .PageIsSignUp .IsResetRequest .IsResetForm .IsResetDisable) -}}
```
**Why:** `routers/web/auth/password.go:34-40` (ForgotPasswd): with no mail service configured (this instance) the handler
sets only `IsResetDisable` and returns, so `IsResetRequest` is never set and /user/forgot_password — route
`forgot-password`, cited by FG-063 / C060 — still renders the full header (Explore / Help / search / Register / Sign In).
Measured 2026-09-30: login / sign_up / recover_account / login/openid get `nav.gh-app-header--auth` (94px, 48px mark at
y=46, title at y=108 = github.com/login), forgot_password gets the full bar (111px, no --auth). The drawer's Register /
Sign In items are already emitted for `$isAuth`, so no link is lost. `IsResetDisable` is only set by that one handler.
Styling is already in place (src/pages/auth/app-header.css keys on `.gh-app-header--auth` only). Needs only
`gitea manager reload-templates` (no restart).

## pages/settings-admin — L1 round 1 (2026-09-30)
### SA-5b — relax the settings header condition (SA-5 step 2)
pages/settings-admin now styles pages whose pageClass is empty (`[class="page-content "]`: user + org Actions > General,
admin badge view). Proposed change in templates/user/settings/layout_head.tmpl (github-* branch only): render the
`.gh-settings-header` block when `(or (not .pageClass) (StringUtils.Contains .pageClass "settings"))` instead of only the
"settings" check, so /user/settings/actions/general gets the same header as its sibling pages. Org layout_head is not
overridden (no header by design).
### SA-6 — octicon mask `--gh-octicon-chevron-right` (optional, low impact)
Token rows (user/settings/applications.tmpl) wrap the token name in `<details><summary>`, which shows the native ▸.
With a `--gh-octicon-chevron-right` mask in src/icons/octicon-masks.css this folder would replace the marker with a
12px --fgColor-muted chevron (`summary::before { mask: var(--gh-octicon-chevron-right) … }`). Skip if the budget is tight.
### Budget note
Measured 2026-09-30 (other folders deploying concurrently): full build theme-github-auto.css 337,942 B; the same build
with `--exclude pages/settings-admin` 311,755 B → this folder is 26,187 B minified in the auto file, of which ~2.4 KB is
the SA-5 scope (`,[class=page-content\ ]` in 107 selectors). Both are above the 300 KB budget (ARCHITECTURE §10), and
the build did not fail. Tell me a size target if this folder should trim.

# From pages/repo (final gate #1 loop 1, round 1)
- **routes.json repo-commits `row-hover`**: its selector hovers the first `#commits-table tbody tr`, which is now the
  `tr.gh-commit-day` date header (ORC-6) — the state no longer shows a commit row. Proposed selector:
  `#commits-table > tbody > tr:not(.gh-commit-day)` (gitea side only). Same for `copy-focus` if it targets the first row's
  button: it already targets `.copy-commit-id`, fine.
- **routes.json repo-home `tooltip-hover`** fails on every run (`locator.waitFor` timeout): its gitea selector
  `#navbar .navbar-right .ui.dropdown:has(.octicon-plus)` no longer exists since the github-* header override (ORC-5,
  `.gh-app-header*`). Needs a new selector from navigation (not pages/repo markup).
- **FYI budget:** the full themes now build OVER BUDGET (auto 331.5 KB, light 326.2, dark 327.5 at 2026-09-30 ~04:50);
  gh.pages-repo is 31,740 B (was 30,577 B; +1,163 B for the day-group Timeline, the wiki Pages Box and FG-018/036/037/040,
  after ~1.7 KB of trims in this folder). The rest of the growth is in other folders.
- **FG-018 for other owners:** Gitea's `ShortSha` is 10 characters everywhere. pages/repo now clips the SHA to 7ch on
  /commits, PR Commits, compare and the commit page (`#commits-table .commit-id-short`, `.commit-header + .segment
  .commit-id-short`). The issue timeline commit rows (pages/issues-prs, critic C200) and any other `.ui.label.commit-id-short`
  (data-display generic rule) still show 10 characters. Technique that works with mono text: `width: calc(7ch + <inline
  padding>); overflow: hidden;` with the inline padding drawn as a transparent border (overflow clips at the padding edge).

# From navigation (wave L1, round 1, 2026-09-30)
## NAV-I1 routes.json: header states for the github-only AppHeader (ORC-5 markup)
The `home` states `create-menu-open`, `avatar-menu-open`, `mobile-menu-open` and repo-home `tooltip-hover` still use the
old navbar selectors (`#navbar .navbar-right .ui.dropdown:has(.octicon-plus)`, `…:has(.navbar-avatar)`,
`#navbar-expand-toggle`), which no longer exist for github-* themes. Proposed replacements (verified in
`shots/navigation-r1` with my routes file `shots/navigation-routes.json`, all states captured, light/dark, 1440/390):
```json
{"name":"create-menu-open","action":"click","selectors":{"gitea":".gh-app-header-create"},"clip":".gh-app-header-create .menu","pad":16,"viewports":[1440]},
{"name":"avatar-menu-open","action":"click","selectors":{"gitea":".gh-app-header-avatar"},"clip":".gh-app-header-avatar .menu","pad":16},
{"name":"drawer-open","action":"click","selectors":{"gitea":".gh-app-header-menu > summary"},"clip":".gh-app-header-drawer","pad":0},
{"name":"search-focus-header","action":"focus","selectors":{"gitea":".gh-app-header-search input"},"clip":".gh-app-header-search","pad":8,"viewports":[1440]},
{"name":"iconbtn-hover","action":"hover","selectors":{"gitea":".gh-app-header .gh-icon-btn[href$=\"/pulls\"]"},"clip":".gh-app-header-end","pad":8,"viewports":[1440]}
```
(`drawer-open` replaces `mobile-menu-open` and works at both widths.) repo-home `tooltip-hover`: use
`.gh-app-header .gh-icon-btn[href$="/pulls"]` (it has `data-tooltip-content`). If `lib/measure.mjs` has a `header` set with
`.navbar-*` selectors, the new ones are `.gh-app-header` (bar), `.gh-icon-btn` (IconButtons), `.gh-context-item` (crumbs).
## NAV-I2 FYI budget
gh.navigation adds ~+3.3 KB minified (before var renaming) this round: the AppHeader + drawer (7.5 KB) replace the old
navbar rules (6.1 KB), plus FG-041/042/030 (repo header, org rule), FG-029 (mobile TabNav), FG-059 (pagination), FG-117.
Dead rules removed (`.navbar-*`, `#navbar-expand-toggle`, avatar/sign-in !important overrides, two never-used NavList rules).
In the whole build gh.navigation is 24.7 KB of 333.9 KB (auto; measured by `--exclude navigation`: 309.2 KB). The themes were
already over budget from concurrent growth in other folders when this round started deploying.
## NAV-I3 FG-050 (settings / admin NavList leading Octicons) not done — needs ~25 new `--gh-octicon-*` masks
Each mask is a data-URI (~0.3–0.8 KB); person, gear, paintbrush, shield-lock, key, apps, organization, people, webhook,
server, repo, package, … would add roughly 8–15 KB to every theme file, which the 300 KB budget cannot absorb today.
Decision needed (integrator/orchestrator): accept FG-050 as inherent, or free budget first.

## overlays — L1 round 1 (2026-09-30): FYI, shoot states that no longer resolve (tools/shoot/routes.json)
Seen in shots/overlays-r1c (light+dark 1440) and shots/overlays-r1 (both viewports), `locator.waitFor` timeouts:
`home` create-menu-open (`#navbar .navbar-right .ui.dropdown:has(.octicon-plus)`), `home` avatar-menu-open
(`#navbar .navbar-right .ui.dropdown:has(.navbar-avatar)`), `repo-home` tooltip-hover (same `+` selector),
`repo-issues` labels-btn-hover (`.list-header > .ui.button:not(.primary)`, 1440) and select-all (`.issue-checkbox-all`, 390).
Most likely the github-* AppHeader / issue-list template overrides changed the markup. Please point the selectors at the new
markup so critics still capture the create / avatar ActionMenus (overlays styles them). No overlays change needed.

# From icons (final gate #1, wave L1 round 1, 2026-09-30)

## IC-1 Register `src/icons/` as a CSS folder → `@layer gh.icons` (FG-091, FG-114)
What: FG-091 and FG-114 are assigned to icons and are theme-scoped Octicon swaps (CSS masks). A server file cannot do
them (CUSTOM_PATH/public/assets/img/svg is global for every theme, ARCHITECTURE §6), and icons has no layer today, so
`src/icons/index.css` (→ `theme-menu.css`, `pr-tabs.css`, 6 selectors, lint 0/0) is not compiled. Proposed: add
`icons` to FOLDERS right before `dark`, so an icon swap wins over the component/page folder that sizes and colours the
same svg (they keep size/colour; icons only sets `background-color: currentcolor` + `mask` and hides the drawing).
```diff
 export const FOLDERS = ['foundation', 'controls', 'overlays', 'navigation', 'data-display', 'code', 'markdown',
-  ...PAGE_GROUPS.map((g) => `pages/${g}`), 'dark'];
+  ...PAGE_GROUPS.map((g) => `pages/${g}`), 'icons', 'dark'];
```
and in ARCHITECTURE.md §5 table: `| icons → gh.icons | theme-scoped Octicon swaps (masks) | .svg.gitea-colorblind-*, .pull.tabular.menu > .item > .svg.octicon-diff | Octicons |`.
Notes: `compileFolder` only reads `index.css` (+ `*.important.css`); `octicon-masks.css` is not imported by index.css, so it
keeps going through the token path only. Lint with all 15 folders + icons: 0 errors, no ownership clash. Size: ~0.4 KB rules +
the two masks it references (`eye` 0.76 KB, `file-diff` 0.66 KB) ≈ 1.8 KB per theme file.
Verified by injection (same CSS as `@layer gh.icons` + the two mask vars) on the live github-auto pages, light/dark ×
1440/390: `shots/icons-l1r1-sim.mjs`, `shots/icons-l1r1/sim/{cmp-repo-pull,cmp-appearance-1440,cmp-appearance-390}.png`,
`report.json`. After the change: `npm run deploy` (no restart: no icon file changes).

## IC-2 audit: count `gitea-running` as GitHub-native, not "non-Octicon" (FG-091)
Re-verified today (logged out, python/cpython `/actions?query=is:in_progress`, `shots/icons-l1r1/gh-probe.json`):
github.com's "currently running" svg is the same three paths as Gitea's `gitea-running` (ring `M3.05 3.05a7 7…` at .5,
dot `M8 4a4 4…`, arc `M14 8a6 6 0 0 0-6-6V0a8 8…`), fill `var(--fgColor-attention)`, `.anim-rotate` 1s. Ours: 16×16,
`--fgColor-attention` both schemes, `rotate-clockwise` 1s. Masking it (dot-fill/sync, as FG-091 suggested) would move
away from github.com, so icons keeps it. Proposed in `tools/shoot/lib/audit.mjs`: report `svg.gitea-running` under a
separate `icons.githubNative` list (name `github-native:in-progress`) instead of `icons.nonOcticon`. Today it is the 4
`nonOcticonIcons` on actions-list (shots/icons-l1r1/shoot/summary.json).

## IC-3 (FYI) SA-6 / APK-M1 / PPL-I1 masks now exist
`src/icons/octicon-masks.css` has 65 masks (catalogue `shots/icons-l1r1/masks-catalogue.png`, 65/65). SA-6's
`--gh-octicon-chevron-right` is available to pages/settings-admin (they asked here; forwarded in their request file).
This deploy (9ee594a4be) switched on 4 masks that folders already referenced (book 0.59 KB, screen-full 0.64 KB,
plus 0.27 KB, dash 0.21 KB ≈ 1.7 KB/theme). Budget: the build reports 334.4 KB auto / 329.2 light / 330.4 dark
(over the 300 KB cap before and after this change — the masks are ~0.5 % of it).

# From code (wave L1, round 1)
## CODE-L1-1 lint exception: show the blame age on mobile (FG-028)
github.com's mobile blame header row shows `avatar · message … age · re-blame` (docs/reference/blame/light-390.png).
Gitea renders the age as `div.blame-time.not-mobile` and hides it below 768px with helpers.css
`.not-mobile.not-mobile { display: none !important }`, which only a `display` in `gh-important` can undo — and lint
rule 4 forbids `display` there. Proposed: allow exactly this selector in `src/code/code.important.css`
(e.g. an allow-list in build/lint.mjs rule 4: `if (important && /^(display|visibility)$/.test(d.prop) && !ALLOW.has(rule.selector))`
with `ALLOW = new Set(['.blame .lines-commit .blame-time.not-mobile'])`), and code would add
```css
@media (max-width: 767.98px) { .blame .lines-commit .blame-time.not-mobile { display: block !important; } }
```
Scope: blame page only; tw-hidden is not involved. Until then the mobile header row is `avatar · message … re-blame`
(everything else of FG-028 is done: shots/code-r1/blame/{light,dark}-390.png).
Same lint rule, second case (FG-100): Gitea hides the diff summary ("25 changed files with N additions and M
deletions") below 800px with `.repository .diff-detail-box .diff-detail-stats { display: none !important }`
(repo.css:853-857); github.com keeps it on mobile. If the allow-list is accepted, code would add
`@media (max-width: 800px) { .repository .diff-detail-box .diff-detail-stats { display: flex !important; } }` plus a
`height: auto` / wrap rule for the 44px `.diff-detail-box`. Not urgent (impact 3).

# From pages/auth (wave L1, round 2, 2026-09-30): PA-L1-1 reminder + PA-L1-2 — slim auth header on the remaining signed-out auth pages
**PA-L1-1 is still open** (re-checked 2026-09-30 r2: `templates/custom/gh_head_navbar.tmpl:11` has no `.IsResetDisable`;
`/user/forgot_password` still measures the full bar + the title's ::before logo = the logo twice, critic
`docs/critiques/pages/auth-wL1-r1.md` issue 1). Same one-word diff as above.

**PA-L1-2 (optional, same line):** 2FA / scratch code / WebAuthn prompt / link-account are signed-out auth steps too, but their
handlers (routers/web/auth/2fa.go, webauthn.go, linkaccount.go) set none of PageIsSignIn/PageIsSignUp/IsReset*, so they keep
the full bar (critic issue 8). `.Link` is set for every page (services/context/context.go:168), so key on the path:
```diff
-{{- $isAuth := and (not .IsSigned) (or .PageIsSignIn .PageIsSignUp .IsResetRequest .IsResetForm) -}}
+{{- $isAuth := and (not .IsSigned) (or .PageIsSignIn .PageIsSignUp .IsResetRequest .IsResetForm .IsResetDisable
+	(StringUtils.HasPrefix .Link (print AppSubUrl "/user/two_factor"))
+	(StringUtils.HasPrefix .Link (print AppSubUrl "/user/webauthn"))
+	(StringUtils.HasPrefix .Link (print AppSubUrl "/user/link_account"))) -}}
```
(`/user/settings/security/two_factor` is signed-in only, so `not .IsSigned` excludes it.) No CSS change needed: the
auth styling keys on `.gh-app-header--auth` and the title's ::before logo is already skipped under it (header.css).
Activation (/user/activate) is for a signed-in inactive user, so it is intentionally not included.

## PPL-T1 (from pages/people, final gate #1 wave L1 round 2) — profile follower counts bold (FG-052, critic L1r1 #3)
What: github.com shows "**3** followers · **2** following" with the numbers 14/600 `--fgColor-default` and the words
muted. Gitea renders number and word in one text node (templates/shared/user/profile_big_avatar.tmpl:21), so no CSS
can style the number. Proposed override `templates/shared/user/profile_big_avatar.tmpl` (copy of the 1.27.3 file, line 21
only changed; theme-scoped via the usual github-* branch if the template policy needs it):
```diff
-			<a class="muted" href="{{.ContextUser.HomeLink}}?tab=followers">{{svg "octicon-person" 18 "tw-mr-1"}}{{.NumFollowers}} {{ctx.Locale.Tr "user.followers"}}</a> · <a class="muted" href="{{.ContextUser.HomeLink}}?tab=following">{{.NumFollowing}} {{ctx.Locale.Tr "user.following"}}</a>
+			<a class="muted" href="{{.ContextUser.HomeLink}}?tab=followers">{{svg "octicon-person" 18 "tw-mr-1"}}<span class="text">{{.NumFollowers}}</span> {{ctx.Locale.Tr "user.followers"}}</a> · <a class="muted" href="{{.ContextUser.HomeLink}}?tab=following"><span class="text">{{.NumFollowing}}</span> {{ctx.Locale.Tr "user.following"}}</a>
```
pages/people will then add (profile.css): `.profile-avatar-name .tw-mt-2 > a > .text { color: var(--fgColor-default); font-weight: var(--base-text-weight-semibold) }`
(hover keeps the link's accent through `a:hover > .text { color: inherit }`). No behaviour change; the same markup renders in
every theme.

## NAV-I4 (navigation, wave L1 round 2) — AppHeader crumb text on admin / user-settings pages (critic nav-wL1-r1 #7)
The context crumb in `templates/custom/gh_head_navbar.tmpl` falls through to `.Title`, so it reads "Dashboard" on
/-/admin (the admin dashboard's title, identical to the real dashboard crumb) and "Profile" on /user/settings.
github.com's crumb names the area ("Settings"). Proposed diff (github-only template, no CSS change needed; the crumb is
already styled as `.gh-context-item`, the last crumb semibold):
```diff
 			{{if .Repository}}
 				…
+			{{else if .PageIsAdmin}}
+				<a class="gh-context-item" href="{{AppSubUrl}}/-/admin">{{ctx.Locale.Tr "admin_panel"}}</a>
+			{{else if .PageIsUserSettings}}
+				<a class="gh-context-item" href="{{AppSubUrl}}/user/settings">{{ctx.Locale.Tr "your_settings"}}</a>
 			{{else if .PageIsDashboard}}
```
(`PageIsAdmin` is set for every /-/admin route by the middleware in routers/web/web.go:241; `PageIsUserSettings` by
routers/web/user/setting/settings.go. Locale keys exist: admin_panel = "Site Administration", your_settings = "Settings".)

## NAV-I5 FYI (navigation, wave L1 round 2) — repo band now follows signed-in github.com (critic nav-wL1-r1 #3)
- The repo UnderlineNav is drawn as the AppHeader local bar: `.secondary-nav > .ui.container:has(> overflow-menu)` gets
  `order: -1`, --bgColor-inset, padding 0 16px and the 1px --borderColor-default rule (header + tabs = one 112px block).
- The title row (owner / repo, Public, Watch / Fork / Star, RSS, forked-from line) is shown **only on the repo overview**
  (`.page-content:has(.repo-grid-filelist-sidebar)`) and the empty-repo quick setup (`.quickstart`), below the local bar on
  the page background, aligned with the content container — as on signed-in github.com, where sub-pages (issues, PRs,
  code tree, actions, settings) start directly under the header and the crumbs name the repo. Consequence: Watch / Star /
  Fork are reachable from the overview only; FG-041 / FG-042 now only show on the overview. Reverting is one rule in
  src/navigation/repo-header.css ("github.com signed-in shows the title row on the repo overview …") if the orchestrator
  prefers the logged-out band on every page.
- Other folders' layouts that assumed "band bottom = rule" (code file-tree pane, actions run list) are unaffected: on
  those pages the band bottom is the local-bar rule again (checked: /octo-org/grex/src/branch/main/src,
  /octo-org/theme-playground/actions, light/dark 1440/390).
- Budget: navigation's minified layer is 21,293 B (was 21,387 B before this round) + ~60 B in gh-important → net ≈ 0.

# From icons (final gate #1, wave L1 round 2, 2026-09-30)

## IC-1 (reminder, still blocking FG-091 / FG-114) — register `src/icons/` → `@layer gh.icons`
Same one-line diff as in L1 r1 (`'icons'` before `'dark'` in `build/folders.mjs` FOLDERS). The critic scored icons 8.0 only
because this change is missing. The folder now has three files and 10 selectors:
- `theme-menu.css`: the colorblind markers are hidden (github.com has no marker).
- `pr-tabs.css`: Files changed → `file-diff`.
- `nav-tabs.css`: repo Projects tab and the `…` popup → `table`.

Verified with the real build script on a scratch copy of the project that has only this FOLDERS change:
- `node build/lint.mjs`: all 15 folders plus icons have 0 errors and no ownership clash (icons: 10 selectors).
- `build.mjs`: icons ok, 3.0 KB src. The build report lists `--gh-octicon-file-diff` and `--gh-octicon-table` as used.
- Size: +1,401 B per theme file.
- Output: `shots/icons-l1r2/sim-theme-github-auto.css`. Served with `--theme-css`, the shoot gives 0 console errors,
  0 off-palette colours and 0 unresolved vars (`shots/icons-l1r2/sim-shoot`, probe `shots/icons-l1r2/probe/report.json`).

ARCHITECTURE §5 row: `| icons → gh.icons | theme-scoped Octicon swaps (masks) / dropped brand markers | .svg.gitea-colorblind-*, .pull.tabular.menu > .item > .svg.octicon-diff, overflow-menu .item > .svg.octicon-project, .overflow-menu-popup > .item > .svg.octicon-project(-symlink) | Octicons |`.
No restart is needed, because no icon files change.

## IC-4 audit: don't count theme-hidden svgs as non-Octicon (FG-091)
`tools/shoot/lib/audit.mjs` §3 counts every `svg.svg`, including ones the theme hides. With IC-1 the 7 colorblind markers
per appearance page have `display: none` on the svg itself, yet they would still show up as 7 `nonOcticon`, which is
28 on the standard 4-mode run.
Proposed: before the mask check, add
```js
    if (getComputedStyle(svg).display === 'none') { bump(hidden, baseName, svg); continue; }
```
with `const hidden = new Map();` next to `masked`, and report `icons.hidden`.

Only the svg's **own** computed display is tested. Icons inside a closed dropdown keep their own display value, so they
are still counted, exactly as today.

# Integrator (loop 1 integration pass after wave L1, 2026-09-30 14:30) — status of every request above since final gate #1
Applied by the integrator in this loop (build/tools edits made 13:38–13:46, verified again 14:30: `node build/lint.mjs` 15 folders
0 errors, no ownership clash; `npm run build` ok):
- **IC-1 — DONE.** `build/folders.mjs` FOLDERS has `'icons'` before `'dark'` (layer `gh.icons`, 660 B in the auto file);
  ARCHITECTURE §3 order and §5 row updated. Masks file-diff / table now in `octiconMasks.used`.
- **IC-2 — DONE.** `tools/shoot/lib/audit.mjs`: `svg.gitea-running` → `icons.githubNative` (`github-native:in-progress`), not nonOcticon.
- **IC-4 — DONE.** audit.mjs: an svg whose own computed display is none → `icons.hidden` (checked before the mask test).
- **CODE-L1-1 — DONE (both cases).** `build/lint.mjs` rule 4 has the exact-selector allow-list `IMPORTANT_DISPLAY_ALLOW`
  (`.blame .lines-commit .blame-time.not-mobile`, `.repository .diff-detail-box .diff-detail-stats`; `display` only);
  ARCHITECTURE §4 documents it.
- **NAV-I1 — DONE.** routes.json home: create-menu-open → `.gh-app-header-create`, avatar-menu-open → `.gh-app-header-avatar`
  (both viewports), mobile-menu-open replaced by `drawer-open` (both viewports), + `search-focus-header`, `iconbtn-hover`;
  repo-home tooltip-hover → `.gh-app-header .gh-icon-btn[href$="/pulls"]`.
- **overlays L1 FYI (dead states) — DONE** with NAV-I1 and the issues-prs request in integrator-tools.md (labels-btn-hover →
  `navlist-item-hover` on `.gh-issues-nav`, select-all 1440 only).
- **pages/repo routes (row-hover, tooltip-hover) — DONE.** repo-commits row-hover → `#commits-table > tbody > tr:not(.gh-commit-day)`;
  repo-issue toolbar-btn-focus → `markdown-toolbar-button[tabindex="0"]` (foundation critic, roving tabindex).
- **PA-L1-1, PA-L1-2, NAV-I4, SA-5b — ACCEPTED, project templates edited, live install PENDING (ORCHESTRATOR.md ORC-11).**
  The integrator's copy + `reload-templates` is refused by the session permission policy (tried once per pass, not retried).
  PA-L1-2 went in nil-safe: `StringUtils.HasPrefix (StringUtils.ToString .Link) (print AppSubUrl "/user/two_factor")` etc.
  (HasPrefix takes `string`; a data map without `Link` would otherwise fail at execution). Until ORC-11 is installed:
  forgot-password keeps the full bar, the admin / settings crumbs read "Dashboard" / "Profile", Actions > General has no
  settings header.
- **SA-6 — DONE** (icons shipped `--gh-octicon-chevron-right`; using it is pages/settings-admin's call, currently unused → pruned).
- **PPL-T1 — REJECTED.** (1) `shared/user/profile_big_avatar.tmpl` would be the 8th and last new override allowed by §7 (e) for a
  part of FG-052 whose judge impact is small (bold numbers in one meta line); (2) the proposed diff adds `<span class="text">`
  unconditionally, so every other theme's HTML changes (§7 d) — a github-only branch would duplicate the whole line; (3)
  template installs are currently blocked for the integrator anyway (ORC-11). Documented as a known gap (STATUS.json).
- **NAV-I3 (FG-050 NavList leading Octicons) — REJECTED for this loop (budget).** The build is 338.5 KB auto / 333.4 light /
  334.5 dark before this pass's trim, 44 KB over the 295 KB gate; ~25 masks (8–15 KB) cannot be afforded. Revisit only if the
  trim leaves ≥ 12 KB headroom under 285 KB.
- **NAV-I2, NAV-I5, IC-3 — FYI, noted** (NAV-I5 layout decision recorded in STATUS.json → templateOverrides/notes).
- **pages/settings-admin budget note / all budget FYIs** — handled by the integrator's budget trim in this pass (see STATUS.json →
  budget.loop1).
- **FG-018 for other owners (pages/repo note)** — forwarded: data-display.md (generic `.ui.label.commit-id-short`) and
  pages-issues-prs.md (timeline SHAs), no integrator action.
- **Budget (all budget FYIs above) — RESOLVED without deleting rules.** Wave L1 grew the flat build by 63.6 KB (auto 283,706 →
  347,273 B; largest: pages/issues-prs +11.9 KB, pages/settings-admin +9.6, pages/actions-packages-projects +8.4, code +5.9,
  pages/people +5.1, tokens/masks +4.2). A coverage run (shots/coverage-integrate-L1 + rerun) showed that deleting every
  never-used rule would save only ~33 KB and would strip real but unseeded features (toasts, @-mention suggestions, delete
  modals, markdown footnotes / code previews …), so instead `build/nest.mjs` factors shared selector prefixes of adjacent rules
  into CSS nesting in the minified files (lossless; self-checked per build by lowering both texts and comparing 3,393 selector
  members; pixel-diffed flat vs nested: 1,138 pairs, 1,103 identical, 14 ≤ 2 px AA, 16 known-noisy, 5 explained). Result:
  auto 295,880 B (288.9 KB), light 290,683, dark 291,734 — under the 295 KB gate. Browser floor raised to CSS nesting
  (Chrome/Edge 112+, Safari 16.5+, Firefox 117+; ARCHITECTURE §9). No folder was trimmed.

# From navigation (wave L2, round 1, 2026-09-30)
## NAV-I6 FYI / policy: settings NavList icons use Gitea's served Octicon SVGs as masks, not `--gh-octicon-*`
FG2-014 needs ~22 distinct glyphs (gear alone is a 2.3 KB data URI); as `--gh-octicon-*` masks that is ~15 KB per theme
file. `src/navigation/nav-list.css` instead uses `mask-image: url("../img/svg/octicon-<name>.svg")` — the Octicon files Gitea
itself serves from /assets/img/svg (all present in 1.27.3, same origin, Cache-Control 6h, relative to the theme file like the
footer's existing `../img/logo.svg`). Net cost of the whole FG2-014 change ≈ 2.4 KB minified. Please record it in ARCHITECTURE §6
if you accept it; if you'd rather have data URIs, the mapping is one rule per glyph and switching is mechanical.
## Budget (numbers, not a request)
Navigation layer in the minified auto file: 19,229 B at HEAD → 21,794 B now (+2,565: NavList icons +~2.7 KB, trims −~0.4 KB).
The auto file is 326,457 B in my last build, but other folders grew far more in the same period (without navigation: 287,104
at my first build vs 275,456 at the start of the round) — the 295 KB gate is currently broken by the wave as a whole.

# From code (wave L2, round 1) — CODE-L2-1: two Octicon masks `link`, `history` (FG2-015)
- **What:** add `'link', 'history'` to the mask list in `src/icons/gen-icons.mjs` (same generator as the other masks) and
  regenerate `src/icons/octicon-masks.css`.
- **Why:** FG2-015 turns the blob / blame header's Permalink and History text buttons into invisible IconButtons
  (`src/code/file-view.css`, `.file-header .file-actions > .ui.buttons > .button:is([href*="/src/commit/"], [href*="/commits/"])::before`).
  The rule already reads `mask: var(--gh-octicon-link, url("../img/svg/octicon-link.svg"))` and
  `mask-image: var(--gh-octicon-history, url("../img/svg/octicon-history.svg"))`, so today it falls back to the Octicon
  files Gitea serves at `/assets/img/svg/` (two small cached requests on file / blame pages; verified rendering in
  `shots/code-l2-r1-states/code-rcf-states/states/*-clip.png`). Once the masks exist the data URIs take over and the
  requests go away; no code change needed on our side. Cost ≈ 0.9 KB per theme file (both masks, pruned until referenced — they are referenced now).
- **Diff:**
```diff
   'plus', 'dash', 'screen-full', // pages/actions-packages-projects APK-M1 (FG-038 workflow-graph controls)
+  'link', 'history', // FG2-015: blob / blame header Permalink + History IconButtons (code)
```

# From pages/issues-prs (wave L2, round 1, 2026-09-30)
## IPR-L2-1 (FG2-027) `templates/repo/issue/list.tmpl` override: no NavList on the PR list
- **What:** in the github-* branch of line 4, render `<nav class="gh-issues-nav">…</nav>` only when `not .PageIsPullList`.
  The `.gh-issues-layout` / `.gh-issues-main` / `h2.gh-issues-title` wrappers stay for both lists (the PR list keeps its
  "All pull requests" title, New button and query bar — that is github.com's PR list header). The PR-only NavList items
  (review_requested / reviewed_by) become unreachable inside the new `if` and can be dropped. No new slot; non-GitHub
  output stays upstream bytes.
- **Diff (line 4, schematic):**
```diff
-<div class="gh-issues-layout"><nav class="gh-issues-nav" …>…</nav><div class="gh-issues-main">
+<div class="gh-issues-layout">{{if not .PageIsPullList}}<nav class="gh-issues-nav" …>…(issue items only)…</nav>{{end}}<div class="gh-issues-main">
```
- **Why / CSS already live:** src/pages/issues-prs/issues-nav.css treats a `.gh-issues-layout` whose nav has no
  `octicon-issue-opened` item (the PR list today, or no nav after this edit) as the PR list: nav hidden, centred container
  with the 24px gutter (x=104 w=1232 @1440, = github.com), title 24px under the tabs, Box 24px under the query bar.
  So the page is already right before the edit; the edit only removes the hidden markup (and the ~1 KB of links).
- Verified: shots/pages-issues-prs-L2r1/repo-pulls/{light,dark}-{1440,390}.png, measured title x104 y+24, list w1232.

## IPR-L2-2 FYI: budget
pages/issues-prs costs 39.2 KB of the minified github-auto file (build without the folder: 289,764 B; with: 328,917 B at
16:5x). This round's additions (FG2-023 NavList layout, FG2-035 milestone rows, FG2-046 blankslate, FG2-031 mobile
filters/bottom sheet, FG2-039/059/072/073/074/083/093) replaced the FG-039 SegmentedControl and shortened the
labels/milestones selectors; the net growth is several KB. The file is over 300 KB with every L2 folder's growth together.

# From navigation (wave L2, round 2) — NAV-I6 still open
NAV-I6 (settings NavList icons via Gitea's served `/assets/img/svg/octicon-*.svg` as relative `url()` masks) is still
unanswered; the critic flags it as a nit (breaks only if the theme CSS is ever inlined or moved off `/assets/css/`).
Navigation layer in the minified auto file this round: 22,745 B (+~950 B: scroll-driven PR tab fades, pagination and
UnderlineNav breakpoints). FYI outside navigation, seen at 320 only: /octo-org/grex/pulls scrollWidth 331
(`.user-remote-search` / `.dropdown.jump` filter menus), /octo-org/grex/releases 350 (`.attachment-right-info`).

# From controls (wave L2b r1, 2026-09-30) — reminder: CT-IC-1 (mask `calendar`) still open
docs/requests/icons.md CT-IC-1 (one line in `src/icons/gen-icons.mjs` MASKS: `'calendar'`, then regenerate
octicon-masks.css). icons is integrator-owned now. Until it lands every page's audit lists `--gh-octicon-calendar` as
unresolved (critique controls-wL2-r1 #3; `shots/controls-wL2b-r1/*/*.json cssVars.unresolved`) and date inputs keep
Chrome's glyph (guarded fallback, nothing breaks).

# Integrator — loop 2 follow-up (L2b, 2026-09-30): dispositions
- **NAV-I6 — ACCEPTED and generalised.** Octicon masks now reference the Octicon files Gitea itself serves
  (`url("../img/svg/octicon-<name>.svg")`, relative to /assets/css/, so a sub-path ROOT_URL works) instead of data URIs:
  src/icons/gen-icons.mjs emits `--gh-octicon-<name>: url("../img/svg/octicon-<name>.svg")` for every 16px Octicon that
  Gitea 1.27.3 ships (the served drawing is the 19.38.0 one: deploy places the 2 upgraded files in CUSTOM_PATH, the other
  374 are byte-identical to Gitea's). Data URIs remain only for drawings Gitea does not ship (`alert-24`). Saves ~13 KB per
  file; one cached same-origin request per glyph (Cache-Control 6h), never render-blocking. Recorded in ARCHITECTURE §6.
  The shoot audit counts url()-masked Octicons as Octicons (tools/shoot/lib/audit.mjs). `--data-uri-masks` regenerates the
  old encoding (used for the pixel-diff baseline).
- **CODE-L2-1 — DONE.** `link`, `history` masks (now the served files; code's `var(--gh-octicon-link, url(…))` fallback is
  the same URL).
- **CT-IC-1 (calendar) — DONE** (see icons.md). **IPR-L2-1 (FG2-027) — project template edited, install pending ORC-13**
  (reload-templates refused by the permission policy; live copy restored). **IPR-L2-2 / navigation budget FYIs — handled**
  by the L2b budget pass below. Navigation's 320px overflow FYI (grex pulls filter menus 331px, releases
  `.attachment-right-info` 350px) → forwarded to pages/issues-prs and pages/repo (OPEN, not in this pass).
- **L2b budget pass (task 3.1) — DONE, all three files ≤ 295 KB without deleting a visible rule:**
  auto 334,687 → 299,589 B (326.8 → 292.6 KB), light 329,548 → 295,732 B, dark 330,599 → 296,619 B. Steps, in order of size:
  1. build/nest.mjs: compound-suffix nesting (`P{a}P:hover{b}` → `P{a;&:hover{b}}`, also `.x`, `#x`, `[x]`, `::x`),
     self-checked like the loop-1 nesting (lowered member-by-member comparison) — ≈ −11 KB.
  2. Octicon masks → Gitea-served files (above) — ≈ −13 KB (the new calendar/link/history/arrow masks cost ~0.2 KB instead of ~2.5).
  3. build/build.mjs short names without the `p` prefix (`--a`, `--Xd`; never a name Gitea's web_src/templates or our CSS
     uses) — ≈ −6.6 KB.
  4. build/build.mjs identical-token dedupe: 91 Primer tokens whose definitions are identical in every scheme share one
     short name (only tokens no folder re-declares; `--no-dedupe`) — ≈ −2.2 KB.
  5. src/tokens/gitea-map.css: 65 Gitea variables referenced nowhere in 1.27.3 (served index.css + the 9 lazy chunk CSS
     files + index.js, web_src outside themes/, templates, Go) nor by our src/templates no longer mapped ("L2b gitea-map
     prune", list below) — ≈ −2.2 KB. (A first cut of 68 missed three names that only Tailwind's generated utilities use —
     `--color-grey-light`, `--color-gold`, `--color-danger`; the full audit flagged `.tw-text-grey-light` as unresolved
     and they were restored before the final deploy.)
  6. Two cross-folder duplicates removed (documented in the owners' files): pages/issues-prs composer toolbar button
     rules identical to controls (CT-FG2-079), pages/repo list-search dead `color` declarations (CT-L2b-3) — ≈ −0.5 KB.
  Coverage (shots/coverage-integrate-L2b, 794 loads): 526 never-used rules, 26.6 KB verifiable — none deleted (they are
  unseeded states/features: merge-box states, toasts, delete modals…). FG2-014 settings NavList icons kept (url() masks, ~2.4 KB).
  Proof of no visual change: STATUS.json → budget.loop2 (pixeldiff pre-trim vs post-trim, both `--stable --theme-css`).
- **L2b gitea-map prune list** (65; --color-grey-light, --color-gold, --color-danger were restored): --color-primary-dark-5/6/7, -light-3, -alpha-20/40/50/70/80/90; --color-secondary-dark-9…13,
  -light-2/3/4, -alpha-10/40/70/80/90, -button, -hover, -active; --color-{olive,pink,brown,black,gold}, --color-grey-light,
  --color-{orange,yellow,olive,green,teal,blue,violet,purple,pink,brown,black}-light, --color-{olive,teal,blue,violet,pink,brown,black}-dark-1,
  --color-{orange,yellow,olive,teal,blue,violet,purple,pink,brown,black}-dark-2, --color-diff-moved-row-border,
  --color-priority-{border,bg}, --color-shadow-opaque, --color-reaction-bg, --color-label-active-bg, --color-danger,
  --color-workflow-edge-hover. Check used: exact-name regex over gitea-src-1.27.3/{web_src (minus css/themes), templates,
  modules, routers, services, models} + our src (minus tokens) + templates, transitively through gitea-map values; no
  dynamic `--color-${…}` construction exists in 1.27.3. Re-run after a Gitea upgrade (shots/l2b-gitea-map.before.css is the old file).


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

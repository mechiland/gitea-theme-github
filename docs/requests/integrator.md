
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

# Change requests from `controls` (wave 1, round 1)

## 1. tokens (integrator): map Gitea's checkbox size to Primer
**What:** in `src/tokens/gitea-map.css` `:root` add
```diff
+  --checkbox-size: var(--base-size-16);
```
**Why:** Primer Checkbox/Radio are 16px; Gitea uses `--checkbox-size` (14px) in `modules/checkbox.css` for
`.ui.checkbox` min-height/line-height and the input box. controls already sets 16px on the elements
directly, but any Gitea rule still reading the variable (e.g. `.ui.checkbox` min-width, `.ui.radio.checkbox`
min-height) stays at 14px until the variable is mapped.

## 2. data-display: leave the counter inside `.ui.labeled.button` to controls
**What:** when data-display styles `.ui.label` / `.ui.basic.label`, exclude the counter of Watch/Star/Fork, e.g.
```css
.ui.label:not(.ui.labeled.button > .label) { … }
```
(or wrap the generic selector in `:where(.ui.label:not(.ui.labeled.button > .label))`).
**Why:** `gh.data-display` is a later layer than `gh.controls`, so any generic `.ui.label` declaration
(padding, background, border, radius, font) would override controls' Primer `.btn .Counter` look of
`.ui.labeled.button > .label` (repo header Watch/Star/Fork, `templates/repo/header/{watch,star,fork}.tmpl`).

## 3. Page folders: controls' `.ui.button` base supersedes Gitea's page-level button geometry
controls sets Primer geometry (`min-height`, `padding`, `border`, `gap`, `font-size`) on `.ui.button`. Because
`gh.controls` beats layer `gitea` regardless of specificity, these page-scoped Gitea rules no longer apply; the
owning folder should restate them in Primer terms if the page needs it (controls restated the generic ones:
ellipsis-button, dropdown caret buttons, action-input buttons, labeled buttons, button groups):
- code: `.repository .diff-detail-box .ui.button`, `.diff-file-header .button`, `.file-view.code-view .ui.button.code-line-button`,
  `.ui.button.add-code-comment` (review.css) — padding/height/min-height/border.
- pages/repo: `#git-graph-container li .commit-refs .ui.button`, `.repo-button-row .ui.button` (min-height),
  `.repo-view-container .ui.button.repo-view-file-tree-toggle`, `.branch-selector-dropdown .ui.button.branch-dropdown-button`,
  `#cite-repo-modal #citation-panel .citation.button`; RSS button in the repo header is an icon-only
  `.ui.compact.small.basic.button` without `.icon` → renders 34×28 instead of Primer IconButton 28×28
  (`.repo-header .ui.button:has(> .octicon-rss)` → `min-width: var(--control-small-size); padding: 0`).
- pages/issues-prs: `.repository.view.issue .issue-title-buttons > .ui.button` (height), comment form buttons;
  github.com's issue list toolbar uses **medium** (32px) Labels/Milestones/New issue buttons and a 32px filter
  input, Gitea's template uses `.ui.small` → page may upsize with `min-height: var(--control-medium-size)`.
- pages/auth: github.com /login uses **large** 40px inputs and buttons (measured 352×40); controls provides
  `.ui.large.button` (40px); inputs would need `height: var(--control-large-size)` scoped to the auth pages.
- overlays: `.ui.modal .actions > .ui.button` padding (controls' 12px Primer padding applies now; Primer Dialog
  footer buttons are medium, so probably fine).

## 4. foundation (FYI, not controls): horizontal overflow on /user/sign_up
`div.ui.middle.very.relaxed.page.grid` is 1472px wide at a 1440 viewport (x=-16) → document width 1456
(`shots/controls-r1/signup/light-1440.json` `document.horizontalOverflow: true`). `.ui.grid` gutters are
foundation's.

# Round 2 (controls, wave 1)

## 5. templates (integrator): inline FormControl validation caption on auth forms
**What:** the brief (and critique controls-w1-r1 #7) asks for Primer's inline validation caption under an
invalid field. Gitea only renders the message in the top flash, so CSS cannot produce it. controls now
styles `.ui.form .field .help.error` (and Gitea's own `.field.error .error.message:not(:empty)`) as Primer
FormControl.Validation: 12px semibold `--fgColor-danger`, 12px alert-fill octicon, 4px gap, 4px below the
control. This was verified with injected markup: `shots/controls-r2/probe/caption-{light,dark}.png`.
Proposed override, for github-* themes only, e.g. `templates/user/auth/signup_inner.tmpl` (same pattern in
`signin_inner.tmpl`):
```diff
 <div class="required field {{if and (.Err_UserName) (or (not .LinkAccountMode) (and .LinkAccountMode .LinkAccountModeRegister))}}error{{end}}">
 	<label for="user_name">{{ctx.Locale.Tr "username"}}</label>
 	<input id="user_name" type="text" name="user_name" value="{{.user_name}}" autofocus required>
+	{{if and .Err_UserName .Flash .Flash.ErrorMsg (StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github")}}
+	<p class="help error">{{svg "octicon-alert-fill" 12}}{{.Flash.ErrorMsg}}</p>
+	{{end}}
 </div>
```
**Why not now:** this is a template override (ARCHITECTURE §7: allowed only when CSS cannot reach the
layout). It needs the integrator's decision. Note that github.com's **login** shows the error only as a flash
("Incorrect username or password."), so the current Gitea login output already matches github.com. Only
**signup** on github.com uses inline captions. If the override is rejected, record this as a documented
exception.

## 6. (integrator, blocker; duplicate of icons I-6) Vite re-adds index.css unlayered
Same root cause as icons request I-6 and critique controls-w1-r1 (Mermaid / RepoFileSearch lazy chunks).
It is still absent from `templates/base/head_style.tmpl` and `tools/shoot/lib/preview.mjs` as of this round.
Until it lands, every controls measurement on repo home and file view pages is taken on mermaid-free pages.

# Round 4 (icons)
## Graph Mono/Color segmented buttons: icon touches the button edge (critic r3 nit 7)
In github-auto the commit-graph buttons (`repo/graph.tmpl:43-44`, `#flow-color-monochrome`, `#flow-color-colored`)
lose their left padding: `octicon-circle` touches the Mono button's left edge and `paintbrush` touches the "Mono" label
(critic sim `shots/critic-icons-r3/sim/graph-buttons-light-1440-ours.png`). Same icons in gitea-auto have normal
spacing, so it is button padding, not the glyph. Primer ButtonGroup/SegmentedControl: `padding: 0 var(--control-medium-paddingInline-normal)`
with `gap: var(--control-medium-gap)` between leading visual and label. Owner: controls (button padding) or pages/repo.

# Round 3 (controls, wave 1)

## 7. (integrator) smoke step `switch-theme-back` fails because github-auto is not registered
`node tools/shoot/smoke.mjs --theme github-auto` (shots/20260930-013140-smoke-github-auto) passes 11 of 12 steps
with 0 console errors. The one failure is `switch-theme-back`: `.menu .item[data-value="github-auto"]` does not
exist in the appearance form because `github-auto` is not in `[ui] THEMES` of app.ini yet. It needs the theme
registered (app.ini + restart, integrator only). Controls can't fix this in CSS.

## 8. (pages/repo, optional) compare-page branch pickers: `.ui.button > .text > strong`
github.com compare range buttons use a medium label. Controls now sets `.ui.button > .flex-text-block > strong`
to `font-weight: inherit` (the Vue branch/tag picker, measured equal to github.com: 105.8x32, 500, muted icon).
The compare page's "merge into: / pull from: **owner/repo:branch**" still bolds the ref. If pages/repo wants
github.com's look there: `.page-content.repository .choose.branch .ui.button > .text > strong { font-weight: inherit }`.

# Round 4 (controls, wave 1)

## 9. (pages/repo, FYI) grex releases still scroll 20px sideways at 320
Controls fixed its part of critique controls-w1-r3 #1: at <768px a `.flex-text-block` made only of buttons plus an
optional `tw-flex-1` filler now wraps (releases header "New Release" drops to a second line; org members "Manage
teams and members" too; releases/new footer "Create Tag Only" is no longer pushed off-screen left). Measured at 320:
/octo-org/theme-playground/releases 41 → 0px, /org/octo-org/members 4 → 0px, /octo-org/grex/releases 41 → 20px.
The remaining 20px on grex releases is the release **attachment list** (`.attachment-right-info` relative-time and
`span.gt-ellipsis` asset names end at x=340), not a control. Suggested pages/repo fix: let the attachment row wrap
or truncate the asset name (`.release-list .attachment-list .item` → `flex-wrap: wrap` / `min-width: 0` on the name).

## 10. (pages/issues-prs, FYI) comment-form buttons on mobile
Gitea's `.repository.view.issue .comment-list .comment .content .form .button { width: 100% }` (<768px) is now
neutralised by controls (`.ui.form .field > .flex-text-block > .ui.button:not(.fluid) { width: auto }` in the
mobile block): "Close issue" / "Comment" keep their natural width, right-aligned, and wrap only when they do not
fit (320px, "Close Pull Request"). Before, the pair was squeezed to 160px each at 390 and at 320 "Close Pull
Request" started at x=18, outside the comment box. If issues-prs prefers full-width stacked mobile buttons,
say so and controls will drop the rule.

# Integrator (between wave 1 and wave 2, 2026-09-30)

- **#1 — DONE (already present).** `--checkbox-size: var(--base-size-16)` has been in `src/tokens/gitea-map.css:336`
  since wave 0; `dist/theme-github-auto.css` contains it. Gitea's `:root{--checkbox-size:14px}` is in layer `gitea`,
  so ours wins. If a measurement still shows 14px it was taken on a page with the unlayered index.css (#6).
- **#2 — FORWARDED** to data-display (appended to docs/requests/data-display.md; part of its wave-2 brief).
- **#3, #8, #9, #10 — FORWARDED** to the page folders (wave 3); code/overlays items go into their wave-2 briefs.
- **#4 — resolved** by foundation round 2 (`.ui.grid` override dropped).
- **#5 — REJECTED (documented exception).** ARCHITECTURE §7 allows template overrides only when CSS cannot reach a
  layout *and* the gain justifies an override that breaks on every Gitea upgrade. github.com's login shows errors only
  as a flash, which Gitea already matches; only sign-up differs. Overriding `user/auth/signup_inner.tmpl` (a 100+ line
  form, with the same pattern needed in link-account) for one caption is not worth the upgrade risk. Your CSS for
  `.help.error` stays (harmless, and it applies if Gitea ever renders per-field errors). Recorded as an exception in
  docs/STATUS.json.
- **#6 — see foundation #1: PARTIAL** (source + preview tool done; live template install pending user approval).
- **#7 — DONE.** app.ini `[ui] THEMES` now lists all 14 previously offered themes + github-auto/light/dark,
  DEFAULT_THEME unchanged (gitea-auto); Gitea restarted 2026-09-29T18:30:06Z; /user/settings/appearance offers all
  17 (verified).
- **Seam (overlays):** `src/controls/select.css` styles `.ui.selection.dropdown.tw-flex-1 > .menu`; the open menu
  belongs to overlays. Left in place for now (no lint conflict, overlays is empty); overlays' wave-2 brief takes it
  over — when overlays ships its `.ui.dropdown .menu` rules, delete this rule from controls (noted in overlays.md).

# From overlays (wave 2, round 1)
## OC-1 Open Select keeps its bottom corners
Gitea: `.ui.selection.active.dropdown { border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important }`
and `.ui.active.upward.selection.dropdown` / `.ui.upward.selection.dropdown.visible { border-radius: 0 0 r r !important }`
(modules/dropdown.css). The open list is now a detached Primer overlay 4px below the control (overlays), so the square
corners show (see shots/overlays-r1/shoot/user-settings-appearance/states/light-1440-theme-dropdown-open-clip.png).
Proposed `src/controls/select.important.css`:
```css
.ui.selection.active.dropdown,
.ui.active.upward.selection.dropdown,
.ui.upward.selection.dropdown.visible {
  border-radius: var(--borderRadius-medium) !important;
}
```
## OC-2 FYI: dialog footer buttons
`src/overlays/dialog.css` resizes `.ui.modal .actions > .ui.button:is(.small, .tiny, .mini)` to the medium (32px) Primer
button and hides the octicon Gitea puts in Cancel/OK/Save (GitHub dialog buttons are text-only). Everything else about
those buttons (colors, borders, danger variant) still comes from controls.

# Integrator (end of wave 2, 2026-09-30) — seam fixes applied in this folder (overlays ↔ controls)
- **OV-1 — DONE (ownership):** deleted `.ui.selection.dropdown.tw-flex-1 > .menu` from `select.css` (a comment points
  to overlays' `.ui.selection.dropdown > .menu`, which already won by layer — no visual change). The `min-width: 0` on
  the closed `.ui.selection.dropdown.tw-flex-1` stays (trigger = controls).
- **OC-1 — DONE (seam):** new `select.important.css` restores `--borderRadius-medium` on the open Select
  (`.ui.selection.active.dropdown`, `.ui.active.upward.selection.dropdown`, `.ui.upward.selection.dropdown.visible`),
  beating Gitea's `!important` square corners now that overlays detaches the list. Verified before/after:
  shots/critic-overlays-r2/user-settings-appearance/states/light-1440-theme-dropdown-open-clip.png (square bottom
  corners) vs shots/integrate-w2-states/user-settings-appearance/states/light-1440-theme-dropdown-open-clip.png (rounded).
  Lint clean. Applied by the integrator because controls had no wave-2 round; controls owns the file from now on.

## APP-C1 (from pages/actions-packages-projects, wave 3 r1) — `.ui.small.fluid.action.input` with a native <select>: heights differ
Where: package list search (templates/package/shared/list.tmpl + versionlist.tmpl: `div.ui.small.fluid.action.input >
input + select.ui.small.dropdown + button`), e.g. /octo-org/-/packages, /octo-org/-/packages/npm/%40octo-org%2Ftheme-tokens/versions.
What I see (shots/pages-actions-packages-projects-r1/packages-org/light-1440.png, package-versions/dark-1440.png): the text
input is 28px tall (y 184–212) while the `select` and the search button are 32px (y 184–216), so the input's bottom
border stops 4px above the select's. Proposed: in the action-input group give all three the same control size
(small → `--control-small-size` 28px, or medium 32px for all), e.g.
`.ui.action.input > select.ui.dropdown { height: 100%; }` + `.ui.small.action.input > :is(input, select, .button) { height: var(--control-small-size); }`.
Not touching it myself: `.ui.action.input` is controls' selector family.

# From pages/issues-prs (wave 3, round 1) — optional ownership proposal
- The markdown editor (`.combo-markdown-editor` toolbar buttons: 28px square invisible buttons, 16px --fgColor-muted
  octicons, hover --control-transparent-bgColor-hover + --fgColor-accent) and the dropzone file bar (lazy
  dropzone.css is unlayered: needs `*.important.css` for border/min-height/padding/radius/.dz-message margin) are
  styled page-scoped in src/pages/issues-prs/composer.css (+ composer.important.css) for the issue/PR composer only.
  Release / wiki / file-editor pages still show Gitea's toolbar and the 150px dropzone. If controls takes them
  generically, pages/issues-prs would keep only the header-strip layout; say so and I will drop the duplicated parts.

# Controls (wave 3, round 1) — handled
- **APP-C1 — DONE.** Small selections (`.ui.small/.tiny/.mini.selection.dropdown` and any selection inside a small
  `.ui.action.input`) are now Primer Select small (28px, 8px leading, 12px); native `select` in an action input is joined
  (-1px, radius 0) and 28px in a small group. Package search measured 28/28/28 (input, Type select, button):
  shots/controls-w3r1/probe/pkg-ig-light.png.
- **OC-1 — kept** (select.important.css unchanged, owned by controls now).
- **Icons r4 (graph Mono/Color gutter) — forwarded** to pages/repo (docs/requests/pages-repo.md): the buttons hold an
  icon + a bare text node, which CSS cannot tell from an icon-only button. Controls fitted the "Select branches" Select
  into the 28px SegmentedControl track (it poked 2px above/below).

# From pages/settings-admin (wave 3, round 2) — SA-C1: FormControl.Caption line-height
What: `src/controls/form.css` `.ui.form .help, .form .help` uses `line-height: var(--text-caption-lineHeight)` (1.25 →
15px at 12px). The critic measured Primer React FormControl.Caption on primer.style storybook
(`components-formcontrol-features--with-caption`, shots/critic-pages/primer-formcontrol-caption.png): 12px / **18px**
line-height, 4px margin-top, --fgColor-muted, no bottom padding.
Proposed diff:
```css
 .ui.form .help,
 .form .help {
   margin-top: var(--base-size-4);
+  padding-bottom: 0;              /* Gitea modules/form.css:417 adds 0.6em */
   color: var(--fgColor-muted);
   font-size: var(--text-body-size-small);
-  line-height: var(--text-caption-lineHeight);
+  line-height: var(--base-text-lineHeight-normal); /* 12px × 1.5 = 18px */
 }
```
Why: multi-line captions (repo settings trust-model descriptions, mirror help) read cramped at 15px, and every settings
form carries them. pages/settings-admin already zeroes the padding-bottom for settings pages (forms.css, rhythm);
the line-height is controls' component spec, so I am not overriding it.
- Related (same request): `src/controls/form.css:13` styles `.ui.form .inline.field > p` / `.inline.fields .field > p` as a
  label (14px semibold, from Fomantic). A `p.help` in an inline field (org settings / admin user edit
  "(Enter -1 to use the global default limit.)", templates org/settings/options.tmpl:47, admin/user/edit.tmpl:101)
  therefore renders as a bold label. Proposed: `:is(…) > p:not(.help)` in that selector list. pages/settings-admin
  restores the caption look for settings pages meanwhile (forms.css, last rule).

# From pages/issues-prs (wave 3, round 2) — IP-C3: split buttons with an open menu (merge button)
Critic pages/issues-prs-w3-r1 #1 (`shots/critic-pages/issues-prs-r1/pr-conversation-playground-large-diff-reviews/states/light-1440-merge-style-open.png`).
Two generic defects in `src/controls/button-groups.css`, both hit the PR merge button (Vue PullRequestMergeForm:
`.ui.buttons.merge-button.primary > .ui.button + .ui.dropdown.icon.button > .menu`) and any ButtonGroup that holds
a dropdown (e.g. "Update branch by merge"):
1. `.ui.buttons { isolation: isolate }` (line 13) makes every group a stacking context, so a dropdown menu inside it
   (z-index 11) cannot rise above later siblings of the group's ancestors — the merge-style menu was painted under the
   comment composer (2 of 4 items unclickable). Proposed: drop `isolation` (the `z-index: 1` on hovered/active buttons
   works without it), or restrict it: `.ui.buttons:not(:has(.dropdown)) { isolation: isolate; }`.
2. Fomantic adds `.active` to an opened `.dropdown.button`, which turns the group into a SegmentedControl
   (`.ui.buttons:has(> .active.button)`: track bg, transparent knobs → the green merge button became grey,
   bg rgba(0,0,0,0)). Proposed: `.ui.buttons:has(> .active.button:not(.dropdown))` in all SegmentedControl selectors.
pages/issues-prs now works around both page-scoped (merge-box.css: `#pull-request-merge-form .ui.merge-button`
isolation auto + restates the primary/danger ButtonGroup while `:has(> .active.button)`); the generic fix would let me
drop that block.
- **SA-C1 follow-up (pages/settings-admin, wave 3, r3):** pages/settings-admin now sets 12px/18px on `.help` itself,
  but only on settings and admin pages (forms.css). Please still land SA-C1 so captions elsewhere (new repo, migrate,
  auth forms) match. Once it lands I will drop the page-scoped line-height.

## APP-C1 correction (pages/actions-packages-projects, wave 3 r2)
The original APP-C1 text was wrong: input, Type select and search button were all 28px/12px (the whole group is `.ui.small.action.input`), not 28 vs 32. No controls change is needed any more: the packages pages now make that group medium page-scoped (`.page-content.packages .ui.form > .ui.small.action.input` → input/select/IconButton 32px, 14px; measured 1046x32 / 140x32 / 32x32). Please treat APP-C1 as closed.

# Integrator (end of wave 3, 2026-09-30)
- **SA-C1** (caption 12/18px, `p:not(.help)`) and **IP-C3** (`.ui.buttons` isolation + SegmentedControl `:has(> .active.button)` catching opened dropdown buttons) are still OPEN for controls. Not applied by the integrator: neither is an ownership conflict (pages/settings-admin and pages/issues-prs carry page-scoped workarounds, so nothing is broken on their pages today). First items for the next controls round.


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-048 [theme-fixable-css] Action-input searches are 28px/12px with an attached square search button (Semantic look); Primer TextInput is 32px/14px with a leading icon** — impact 9 (judges 0, critic wt 9; routes: org-projects, site-admin-users, admin-orgs)
   - Fix: .ui.action.input (search forms) → medium 32px, 14px, leading search icon, button detached or invisible.
   - Critic refs: C006 (site-admin-users, minor), C057 (org-projects, minor), C129 (admin-orgs, minor)
   - PNG: `shots/final-gate/admin-orgs/light-1440.png`, `shots/final-gate/org-projects/light-1440.png`, `shots/final-gate/site-admin-users/light-1440.png`, `shots/final-gate/admin-orgs/light-1440.png`
2. **FG-060 [theme-fixable-css] 'Add dependency…' select (32px, native double arrow) next to a 28px '+' button: bottoms misaligned by 4px** — impact 7 (judges 0, critic wt 7; routes: repo-issue, repo-pull, issue-detail-playground-reactions-alerts-tables)
   - Fix: Same control size in the input group; Primer single chevron (appearance:none + mask).
   - Critic refs: C087 (repo-issue, minor), C139 (repo-pull, minor), C120 (issue-detail-playground-reactions-alerts-tables, nit)
   - PNG: `shots/final-gate-critic-5/pull-light-dep.png`, `shots/final-gate-critic-4/issue-light-1.png`, `shots/final-gate/repo-issue/dark-390.png`, `shots/final-gate/repo-issue/dark-1440.png`
3. **FG-089 [theme-fixable-css] Controls details: comment editor double border, label edit modal inputs 27/28/32px, default-branch value in placeholder colour, help text capped at ~550px** — impact 4 (judges 0, critic wt 4; routes: repo-create, repo-settings-branches, labels, issue-detail-playground-reactions-alerts-tables)
   - Fix: Borderless textarea inside the editor Box; one input height; .default.text fgColor-default when it is a value; captions max-width none.
   - Critic refs: C121 (issue-detail-playground-reactions-alerts-tables, nit), C150 (labels, nit), C160 (repo-settings-branches, nit), C108 (repo-create, nit)
   - PNG: `shots/final-gate-critic-4/issue-dark-editor.png`, `shots/final-gate/repo-create/dark-390.png`, `shots/final-gate/repo-create/dark-1440.png`, `shots/final-gate/repo-create/light-390.png`

# Controls (final gate #1, wave L1 round 1, 2026-09-30) — handled
- **FG-048 — DONE.** `inputs.css` "search field": every `shared/search/*` group (`.ui.action.input` with an `input[type=search]` /
  `input[name=q]` child) is a medium TextInput: 32px, 14px; the submit button that directly follows the input is drawn as
  the leading search octicon (32px wide, transparent, --fgColor-muted → --fgColor-default on hover, focus-visible ring,
  input padding-left 32px, = github.com /orgs/*/projects measured padding-left 32px). Groups with a dropdown / select
  between input and button (dashboard issues/milestones search mode, packages type select) keep a joined trailing 32x32
  IconButton. Excluded: pages/issues-prs' trailing-button scope (`:is(.issue-list, .milestone-issue-list,
  .repository.milestones) .list-header-search`), which also covers the repo projects list — see CT-FG048 in
  pages-issues-prs.md. Measured: /-/admin/users, /-/admin/orgs, /octo-org/-/projects, /explore/repos, /explore/code,
  /org/octo-org/members, /-/admin/repos/unadopted → input 32px/14px, button 32x32 at x=0 (`shots/controls-fg1/r1.json`, `r2.json`).
- **FG-060 — FORWARDED** to pages/issues-prs (CT-FG060): the 28px "+" comes from their sidebar sizing (page layer), so the
  Select must go small there; proposed rule verified by injection (`shots/controls-fg1/dep-proposed.png`). The up/down
  indicator stays: it is Primer Select's glyph (`@primer/css/forms/form-select.scss`), not the native arrow.
- **FG-089 — DONE except the editor part.** (a) label edit dialog: a small `.ui.input` directly in a `.ui.form .field` is
  medium now → Name / Description / Color all 32px/14px; (b) `.default.text` that shows a value (hidden input with a
  non-empty `value`) → --fgColor-default (settings/branches "main"); (c) `.form .help` → `text-wrap: wrap` (Gitea's
  `balance` broke captions at ~550px). (d) comment-editor double border → forwarded to pages/issues-prs (CT-FG089a,
  it is their composer layout).
- **SA-C1 — DONE.** `.form .help`: 12px / 18px (`--base-text-lineHeight-normal`), padding-bottom 0; inline-field `p` label
  rule is `p:not(.help)` (org settings "(Enter -1 …)" measured 12px / 400 / 18px / --fgColor-muted).
- **IP-C3 — DONE.** `.ui.buttons` no longer sets `isolation: isolate`; every SegmentedControl selector uses
  `:has(> .active.button:not(.dropdown))`, so an opened dropdown button no longer greys a primary split button. Checked on
  /octo-org/theme-playground/pulls/16 with the merge-style menu open (merge button stays green, menu over the content,
  `shots/controls-fg1/merge-pair.png`; pages/issues-prs' own workaround is still active there, so it can now be dropped).

# From pages/issues-prs (wave L1 r1, 2026-09-30) — re CT-FG048
- pages/issues-prs narrowed every `.repository.milestones` selector to `.repository.milestones:not(.projects)` (the repo
  projects list renders `.page-content.repository.projects.milestones`). The issue-search scope is now
  `:is(.issue-list, .milestone-issue-list, .repository.milestones:not(.projects)) .list-header-search` — please narrow
  your exclusion the same way so the repo projects list gets the leading search icon like the org projects list.

# Controls (final gate #1, wave L1 round 2, 2026-09-30) — handled
- **pages/issues-prs re CT-FG048 — DONE.** The 5 leading-visual selectors in `inputs.css` now exclude
  `:is(.issue-list, .milestone-issue-list, .repository.milestones:not(.projects)) .list-header-search > *`, so the repo
  projects list (/octo-org/theme-playground/projects) gets the leading search icon like the org projects list: measured
  input 1102x32 (390: 244x32), padding 0 12 0 32, 14px; icon button 32x32 transparent; light + dark
  (`shots/controls-fg2b/cc-projects-list`). Repo issues / milestones unchanged (trailing, pages/issues-prs).
- Critic controls-wL1-r1 nits: search icon colour is now documented as static --fgColor-muted (dead hover colour rules
  removed; github.com's leading visual does not change on hover). Input / Select / selection-dropdown focus ring is
  drawn inside the box (`outline-offset: calc(var(--borderWidth-thick) * -1)`): org-projects search ring rows 16-17 /
  46-47, pixel-identical to the github.com reference in light and dark. `.form .help:has(+ .field)` gets an 8px
  bottom gap (repo/migrate "Access Token is required…" above the item checkboxes). Not changed: the leading icon
  stays a tab stop after the input (it is Gitea's submit button; making it non-focusable needs a template change).


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-076 [theme-fixable-css] Controls details: textarea shows a partial third line at 390, tag-search button focus ring hugs the icon inside the input, disabled checkbox label not muted, native date input** — impact 4 (judges 0, critic wt 4; gate 1 FG-089; routes: issue-playground-1, repo-settings, admin-user-edit, tags)
   - Fix: Textarea min-height in whole lines (3 × 20px + padding); focus ring on the input group, not the inner icon button; `.ui.checkbox.disabled label` `--fgColor-disabled`; date input: 32px TextInput look + calendar Octicon mask over the native indicator.
   - Critic refs: C006 (repo-settings, nit), C054 (tags, nit), C163 (admin-user-edit, nit), C167 (issue-playground-1, nit)
   - PNG: `shots/final-gate-critic-0/repo-settings-390-a.png`, `shots/final-gate-critic-2/live/tags/states/light-1440-search-btn-focus-clip.png`, `shots/final-gate-2/issue-playground-1/dark-390.png`, `shots/final-gate-2/issue-playground-1/dark-1440.png`
   - **DONE (controls wL2 r1)** — textarea[rows] min 3 lines (repo description 78px, 3 lines, no partial line at 390),
     rowless form textareas 6 lines (138px); leading search button focus draws the ring on the whole input (tags);
     `.ui.checkbox:has(> input:disabled) > label` muted (admin-user-edit "Disable Sign-In"); date/datetime/month/week
     indicator = calendar Octicon 16px --fgColor-muted mask (time = clock) — **needs mask `calendar` (docs/requests/icons.md
     CT-IC-1)**; until then Chrome's glyph stays (guarded) and the audit lists 1 unresolved var on date pages. `shots/controls-r1`.
2. **FG2-079 [theme-fixable-css] Markdown editor outside issue/PR forms (admin notices, releases, wiki, milestones) gets no composer Box: Write/Preview tabs and toolbar float above a separate textarea** — impact 3 (judges 0, critic wt 3; new; routes: admin-dashboard-config-settings)
   - Fix: Move the composer chrome from pages/issues-prs composer.css (scoped to `:is(#comment-form,#new-issue,.code-comments-list form.comment-form)`) into a generic `.combo-markdown-editor` rule in controls; pages/issues-prs keeps only page deviations. Coordinate the move (ownership lint).
   - Critic refs: C090 (admin-dashboard-config-settings, minor)
   - PNG: `shots/final-gate-2/admin-dashboard-config-settings/dark-1440.png`, `shots/final-gate-2/admin-dashboard-config-settings/light-1440.png`
   - **DONE (controls wL2 r1)** — new `src/controls/markdown-editor.css`: generic CommentBox for every editor outside the
     composer scope (admin banner, releases, milestones, projects, wiki, comment edit, review box); toolbar look generic.
     pages/issues-prs told they may drop their duplicate toolbar rules (docs/requests/pages-issues-prs.md). `shots/controls-r1`.

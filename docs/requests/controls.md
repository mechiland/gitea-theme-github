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

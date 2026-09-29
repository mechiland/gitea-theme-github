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

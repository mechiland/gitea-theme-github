# Final gate — group 7 (critic 7)

Scope: site-admin, repo-issues, repo-commits, blame-playground-multiple-authors, wiki-page-list, pr-conversation-open,
pr-draft-wip-playground, user-profile-stars-tab, org-settings, org-settings-labels, package-versions, pr-compare-form-playground.

Inputs: `shots/final-gate/<route>/{light,dark}-{1440,390}.png` + `.json`; references in `docs/reference/<route>/` (5 of the 12
routes have one). Crops: `shots/final-gate-critic-7/<route>/`. Live measure run (theme github-auto, 1440, light+dark):
`shots/final-gate-critic-7/live/` (24 pages, 0 problems). A few extra DOM probes were run through the shoot tool's
`launchBrowser()` with the cached admin session. The probes were read-only; the admin theme was not changed.

## Audit logs (all 48 captures)
- Every capture returned HTTP 200. None had console errors or warnings, failed requests, unresolved CSS vars,
  off-palette colours, non-Octicon icons, unlayered Gitea CSS or horizontal document overflow.
- CLS: max 0.0031 (pr-compare-form 1440) and 0.0024 (org-settings-labels 390). Both are negligible.
- Masked icons are all expected: `octicon-filter`, `octicon-triangle-down`, `gitea-double-chevron-*`, plus the
  `material-file` / `octicon-file` pairs in the Vue file tree.

## Scores

| route | light | dark | 390 |
|---|---|---|---|
| site-admin | 8.5 | 8.5 | 8 |
| repo-issues | 8.5 | 8.5 | 8 |
| repo-commits | 7.5 | 7.5 | 7.5 |
| blame-playground-multiple-authors | 8 | 8 | **5** |
| wiki-page-list | 7.5 | 7.5 | 7.5 |
| pr-conversation-open | 8.5 | 8.5 | 8 |
| pr-draft-wip-playground | 8.5 | 8.5 | 8 |
| user-profile-stars-tab | 8.5 | 8.5 | 8.5 |
| org-settings | 8 | 7.5 | 8 |
| org-settings-labels | 7 | 7 | 7 |
| package-versions | 8 | 7.5 | 8 |
| pr-compare-form-playground | 8 | 7.5 | 7.5 |

## Issues (most severe first)

### BLOCKER (mobile) — blame at 390: the code is off-screen, and only the blame column shows
- Where: `shots/final-gate/blame-playground-multiple-authors/{light,dark}-390.png`; crop
  `shots/final-gate-critic-7/blame-playground-multiple-authors/light-390-0.png`.
- Measured live at 390 px: `.file-view.code-view` is 358 px wide with `overflow-x:auto`, and its table is 1038 px
  wide. `td.lines-num` starts at x=360 and `td.lines-code` at x=432, so both begin outside the 390 px viewport. The
  first screen, and the whole page height, shows only commit summaries and empty hunk space.
- Expected: GitHub's blame on a narrow screen keeps the code visible. It collapses or narrows the blame gutter
  (avatar + short message, about 100–150 px). Here the blame column should shrink (or wrap under) below 768 px so
  that line numbers and code sit in the viewport.
- Owner: **code** (`.blame*`, `.code-view`, `.lines-commit`).

### MAJOR (dark) — diff line backgrounds are painted twice (on the `tr` and on the `td`)
- Where: `shots/final-gate/pr-compare-form-playground/dark-1440.png` (and dark-390); crop
  `shots/final-gate-critic-7/pr-compare-form-playground/zoom-dark-diff.png`.
- Measured live: `TR.add-code` has `rgba(46,160,67,0.15)` and `TD.chroma.lines-code` also has
  `rgba(46,160,67,0.15)`. The composited pixel is rgb(22,56,34), which is an effective alpha of about 0.28.
  - The number cell is rgb(31,82,44), where it should be about rgb(28,67,40).
  - The hunk row is rgb(21,40,67), where it should be about rgb(17,29,46).
- Expected: GitHub's single layer, `#2ea04326` over `#0d1117`, which gives rgb(18,38,30).
- Light mode is unaffected because the light tokens are opaque (#dafbe1 / #aceebb, both correct). The same rule
  almost certainly affects every dark diff (files-changed routes), not only this one.
- Owner: **code** (`src/code/diff.css` around l.279: set the background on either the row or the cells, not both).

### MAJOR — commits list: SHA in sans-serif, title too light, inline code has a chip background
- Where: `shots/final-gate/repo-commits/light-1440.png`. Crops `shots/final-gate-critic-7/repo-commits/zoom-row-ours.png`
  and `zoom-row-ref.png`.
- `#commits-table td.sha a` is computed as `-apple-system…` at 12px/500. GitHub renders the SHA ("99cc347") in
  `ui-monospace`. The 10-character SHA versus GitHub's 7 characters comes from Gitea, but the font can be fixed.
- `.commit-summary` is font-weight 500. The reference title is visibly heavier (semibold 600).
- `Command::cargo_bin` in the title is drawn as a grey code chip. GitHub commit titles show inline code as plain mono
  text with no background (see the ref crop).
- The browse button uses `octicon-file-code`; GitHub uses `code` (`<>`). That icon change needs a template, so it is
  noted only.
- Owner: **pages/repo** (`#commits-table`).

### MINOR — org header / org underline nav has no bottom border (the dark nav floats)
- Where: `shots/final-gate/org-settings/dark-1440.png`, `package-versions/dark-1440.png`, `org-settings-labels/*`.
  Crop `shots/final-gate-critic-7/org-settings/zoom-dark-orgnav.png`.
- Measured: the org header `.ui.container` (bg #f6f8fa light / #0d1117 dark) with
  `overflow-menu.ui.secondary.pointing.tabular.borderless.menu` has border-bottom 0 in both schemes. Pixel rows
  158–175 at x=700 show no divider. The repo header has a 1px `#d1d9e0` / `#3d444d` rule at y=173. In dark, the org
  tabs therefore have no separator from the page at all.
- Expected: GitHub's UnderlineNav has a full-width 1px `borderColor-muted` bottom border.
- Owner: **navigation** (`.overflow-menu*`, org header).

### MINOR — wiki page list rows too dense and link too heavy; extra Subhead rule
- Where: `shots/final-gate/wiki-page-list/light-1440.png` compared with `docs/reference/wiki-page-list/light-1440.png`;
  crop `shots/final-gate-critic-7/wiki-page-list/zoom-row.png`.
- Measured: the row is 36px with 8px 16px padding (GitHub: 54px, 16px padding). The "Home" link is 600 (GitHub: 400).
  The "Pages" header has `border-bottom:1px` plus `padding-bottom:16px` (GitHub has no rule).
- At 390, "Last updated" is right-aligned on its own line. GitHub left-aligns it under the title
  (`ref-dark-390-0.png`).
- Owner: **pages/repo** (`.wiki-*`).

### MINOR — compare page: branch refs rendered as green-outlined labels
- Where: `shots/final-gate/pr-compare-form-playground/{light,dark}-1440.png`, the "1 Commits" header; crop
  `shots/final-gate-critic-7/pr-compare-form-playground/zoom-refs-light.png`.
- Measured: `a.ui.green.sha.label` has a `1px solid rgb(26,127,55)` border, a transparent background and fg default.
- Expected: GitHub's `commit-ref` style: `bgColor-accent-muted` (#ddf4ff / rgba(56,139,253,.1)) with accent fg,
  mono, radius 6px and no border.
- Owner: **data-display** (`.ui.label*` colour variants), or pages/issues-prs if scoped to compare.

### MINOR — org settings labels: empty state is not a Blankslate; mixed button sizes
- Where: `shots/final-gate/org-settings-labels/{light,dark}-1440.png`.
- The empty state is centred plain text, then a 3-line italic select, then a button, all between two hr rules. GitHub
  shows a Blankslate (icon, heading, description, primary action).
- "New Label" is 28px (y 190–217) but "Use Label Set" is 32px (y 441–472) on the same page. GitHub's labels page uses
  a 32px default-size "New label".
- The "0 labels" heading is 24px with a border, which reads as a second Subhead under the intro row.
- Owner: **pages/issues-prs** (labels page chrome); the Blankslate treatment belongs to **data-display**
  (`.empty-placeholder`).

### MINOR — site-admin mobile: every "Run" button wraps onto its own line
- Where: `shots/final-gate/site-admin/light-390.png` (crop `site-admin/light-390-0.png`, `dark-390-1.png`).
- Each maintenance row is about 80px tall at 390 because the button drops below the text. GitHub settings rows keep
  the action right-aligned (the text wraps, the button stays on the first line). The page is 7232px tall at 2x.
- Owner: **pages/settings-admin**.

### NIT — PR timeline details
- `pr-draft-wip-playground/light-1440.png`, crop `zoom-timeline.png`: in "added the enhancement area/theme labels" the
  label pills sit about 4px above the text baseline.
  - Label centre y≈172 in the 2x crop, text y≈177.
  - Owner: **pages/issues-prs** (timeline event label alignment).
- The commit SHA in the timeline ("7728b5f95d") is drawn as a bordered chip. GitHub shows a plain mono, underlined
  link ("22955d1" in `docs/reference/pr-conversation-open/light-1440.png`). Owner: **pages/issues-prs**.
- "Remove  WIP:  prefix" has visibly doubled spaces around the `<strong>`. Owner: **pages/issues-prs**.

### NIT — blame hunk row heights are irregular
- Measured row heights at 1440 are 25, 20…20, 26, **31**, 26, 20. A single-line hunk (line 15) is 31px, so the code
  rhythm jumps between lines 14, 15 and 16 (`blame-playground-multiple-authors/light-1440-0.png`, y 574→605→636).
- GitHub keeps a 20px line pitch.
- Owner: **code**.

### NIT — other
- Profile topic tags are 24px tall with 12px padding. GitHub's `topic-tag` is about 22px with 10px padding
  (`user-profile-stars-tab/light-1440.png`). Owner: **pages/people**.
- The org settings Description textarea spans the full 936px column while every other input is 440px
  (`org-settings/light-1440.png`). Owner: **pages/settings-admin**.
- The org settings sidebar has no leading Octicons and no org avatar/name context block, unlike GitHub.
  Owner: **navigation** (`.ui.vertical.menu`).
- Global header: logged-in GitHub has a search field, context breadcrumb and icon buttons. Ours shows text links
  (Issues / Pull Requests / Milestones / Explore) and a 1px rule at y=63 between the global bar and the repo header.
  GitHub's AppHeader is one block. Cross-route, owner **navigation**.
- On mobile, the compare page's "1 changed files with 9 additions…" stats line is hidden, leaving only the icon row
  (`pr-compare-form-playground/dark-390-1.png`). Owner: **code** (`.diff-detail-box`).

## What is good
- Light and dark palettes are exact on every route: page #fff / #0d1117, header #f6f8fa / #010409, borders #d1d9e0 /
  #3d444d.
- Buttons, counters, the underline nav (active #fd8c73 bar), Box rows, the issue list, the PR header, the merge box,
  the comment composer and the settings NavList all read as Primer.
- The PR conversation page is within nits of the reference in both schemes.

# Final gate — group 0 (13 routes)

Reviewer: final whole-site gate, group 0. Theme `github-auto`. Sources: `shots/final-gate/<id>/{light,dark}-{1440,390}.png` + `.json`,
references in `docs/reference/<id>/`, live `--measure-only` re-run in `shots/final-gate-critic-0/live/<id>/`, crops in
`shots/final-gate-critic-0/`.

## Audit logs (all 52 captures)

- Console errors 0, console warnings 0, failed requests 0, `problems` 0, HTTP 200, unresolved CSS vars 0 (only
  `--loading-size` with a fallback, 0 matched elements), off-palette colours 0, `otherSchemeOnly` 0, horizontal overflow 0.
- Non-Octicon icons: only `org-settings-hooks` (3: `gitea-gitea`, `gitea-feishu`, `gitea-matrix` brand logos in the
  hidden "Add Webhook" menu). They are third-party brand marks with no Octicon equivalent, so this is accepted.
- CLS: `home` @390 = **0.365** (light and dark). Four shifts on `div.flex-container-main` at 93 to 182 ms, while the
  Vue repo list loads. Every other capture is at or below 0.003.
- No `states/` subfolders exist in `shots/final-gate/` for these routes, so the interaction states were not captured in this run.

## Scores

| Route | Light 1440 | Dark 1440 | 390 |
|---|---|---|---|
| home | 7.5 | 7.5 | 7 |
| site-admin-users | 8.5 | 8.5 | 8 |
| repo-settings | 8.5 | 8.5 | 8 |
| org-home | 8.5 | 8.5 | 8.5 |
| commit-detail | 7.5 | 7.5 | 6 |
| wiki-page | 8 | 8 | 8 |
| pr-commits-tab | 8.5 | 8.5 | 8 |
| compare-two-tags | 7.5 | 7.5 | 7.5 |
| user-profile-repositories-tab | 8.5 | 8.5 | 8.5 |
| admin-monitor-stats | 8.5 | 8.5 | 8.5 |
| org-settings-hooks | 8 | 8 | 8 |
| packages-generic | 8 | 8 | 8 |
| milestone-issues | 8 | 8 | 7.5 |

Dark parity is good everywhere. Header `#010409`, page `#0d1117`, repo header `#0d1117` and borders `#3d444d`/`#2e353c`
match the reference (`docs/reference/commit-detail/dark-1440.png`: repo header band = rgb(13,17,23)). Light repo header
`#f6f8fa` also matches the reference.

## Cross-route issues

1. **MAJOR: the capture order leaks the diff-style preference (tools/shoot, integrator).** `repo-pull-files`
   (`?style=split`, captured 10:56:43) saves the admin's diff style as split. `commit-detail` (10:57:08) then renders
   **split** (`shots/final-gate/commit-detail/light-1440.png`), while the reference is unified.
   `pr-files-changed-unified` (10:57:38) resets it, so `compare-two-tags` (10:57:56) is unified. Any diff route
   captured after a `?style=split` route is contaminated. Pin `?style=unified` on commit/compare routes, or restore
   the preference after each split route.
2. **MINOR: the global header layout is 2022-era GitHub (navigation).** It has bold text links "Issues / Pull
   Requests / Milestones / Explore" and no hamburger, context breadcrumb or search field at 1440. Signed-in
   github.com shows a hamburger, the logo, a page-context title, a search input and icon buttons. The colours are
   correct: bg rgb(246,248,250) and bottom border rgb(209,217,224) in light, rgb(1,4,9) and rgb(61,68,77) in dark,
   height 64px. It reads "GitHub-inspired" rather than identical on every route.
3. **NIT: the Gitea logo appears in the header and footer, and the Gitea footer text is kept (navigation).** This is
   probably deliberate branding and is listed only for completeness.

## Per-route findings

### home (Gitea dashboard, no reference)
- MAJOR (pages/people): CLS 0.365 at 390 on `div.flex-container-main`. The Vue repo list grows 4 times during load.
  Reserve its height or give it a min-height placeholder. Log: `shots/final-gate/home/light-390.json`.
- MINOR (navigation / pages/people): the dashboard context bar (`admin ▾`) is `#f6f8fa` in light with **no bottom
  border**. The grey band stops at y=114 without the 1px `#d1d9e0` separator that the repo header has (y=173 on
  repo pages). In dark the bar is page bg `#0d1117`. Crop: `shots/final-gate-critic-0/home-l-a.png`.
- MINOR (pages/people): the contribution heatmap does not fill its Box. The cells end at x≈1195 inside a box that
  ends at x=1363, leaving ~165px empty on the right. At 390 only Jul–Dec is visible and the leading "Jul" label
  touches the edge. Crop: `home-l-m1.png`.
- NIT (pages/people): at 390 the pagination shows only chevrons with no "Previous/Next" labels (`home-m-end.png`),
  and the feed's commit/comment boxes stop ~30px short of the row's right edge.
- NIT: the repo-search input shows a 2px accent ring (rgb(9,105,218)) in every capture, so it is autofocused. This is
  harmless but draws the eye.

### site-admin-users (Gitea-only)
- MINOR (controls): the search input is **28px tall and 12px text** (live measure `input-text` h=28, 12px). The
  Primer medium TextInput is 32px and 14px. The attached square search button reads as Semantic UI, not a leading
  magnifier inside the field.
- NIT (navigation): the NavList collapsible groups use chevron-right (collapsed) and chevron-down (expanded). Primer
  NavList uses chevron-down that rotates to up.
- NIT (data-display): at 390 the table is clipped at the right with no scroll affordance (the "Activated" column is
  cut off). Crop: `sau-l-m.png`.

### repo-settings (Gitea-only)
- Reads as a native GitHub settings page: Subhead 24px/400 with a border, 32px inputs, a green primary button, a
  red-bordered danger-zone Box with btn-danger buttons, and accent checkboxes and radios in both schemes
  (`rs-l-*.png`, `rs-d-*.png`).
- NIT (pages/repo): the Settings tab is pushed to the far right of the repo tab row. On GitHub it follows the other tabs.

### org-home (reference go-gitea)
- Structure matches: avatar with 6px radius, underline nav, search + Filter/Sort, repo Box rows with topics, and a
  right sidebar (`oh-l.png` vs `ref-oh-l.png`). Mobile is solid.
- NIT (pages/people): no "Public" visibility Label next to repo names (a template limit), and no sparkline.

### commit-detail (reference pemistahl/grex)
- MAJOR (env, see cross-route issue 1): split diff at 390 is barely usable. Code wraps into ~60px columns
  (`cd-l-m.png`). GitHub shows unified at this width (`ref-cd-l-m.png`).
- MINOR (pages/repo): the header differs from GitHub. Ours puts the title inside a Box ("Remove deprecated
  `Command::cargo_bin` (#349)", 20px) with author, parent and commit SHAs in the footer row. GitHub has an H1
  "Commit 99cc347", a message Box, a branch row and a "1 file changed" row. The Code tab is not marked active
  (a template limit).
- The diff body matches: hunk rows `#ddf4ff`, del/add number cells, 20px rows. GitHub's new view uses ~24px rows (nit).

### wiki-page (reference lgarron/folderify)
- Title 32px/400 and content width 112 to 1328 are identical to the reference, and the Edit/New Page buttons are 28px
  as on GitHub.
- MINOR (pages/repo): the right column is a full-width "Page: Home" dropdown plus a green "Code" clone button. GitHub
  has a "Pages" Box with a filter field and a "Clone this wiki locally" input group (`ref-wp-l.png`).

### pr-commits-tab (reference grex#42)
- Very close: 32px title, purple Merged state label, tabnav, diffstat (`pr-commits-tab/light-1440.png` vs `ref-pc-l.png`).
- MINOR (pages/issues-prs): commits sit in a Box headed "1 Commits". GitHub groups them under a timeline marker
  "Commits on May 31, 2021" with a bordered commit card. The SHA is plain text, not a mono button group.
- NIT: at 390 the tabnav clips "Files Changed" at the viewport edge (GitHub clips as well).

### compare-two-tags (reference grex v1.4.5...v1.4.6)
- MINOR (pages/repo): commit titles in the list are **16px/400**. GitHub uses **14px/600** (zoom:
  `ct-l-z.png` vs `ref-ct-z.png`). Authors are muted regular; GitHub shows the author bold in fg-default plus
  "committed on". The SHA is bare muted text (GitHub puts copy and SHA in a bordered button group). There is no
  "Commits on <date>" timeline grouping.
- NIT (pages/repo): the range-editor box is white. On GitHub it is `#f6f8fa`.
- The diff section (file tree with status squares, hunks, word highlights) matches in both schemes
  (`ct-l-c.png`, `ct-d-c.png`). At 390 the "25 changed files" summary text is hidden and only the icons remain.

### user-profile-repositories-tab (reference pemistahl)
- Near-identical layout: 296px avatar overlapping the underline nav, 24px name / 20px login, 32px search, 20px repo
  names. Mobile header row matches.
- NIT (pages/people): Followers/Following counts are not bold. The Follow button has a person icon (GitHub has none).
  There is no "Public" label.

### admin-monitor-stats (Gitea-only)
- A clean Primer Box table with 38px rows and correct borders in both schemes. No issues.

### org-settings-hooks (Gitea-only)
- MINOR (pages/settings-admin): the empty state is only a sentence. A native GitHub Webhooks page shows a Box or
  Blankslate. The subhead reads "Settings" (template text) rather than "Webhooks".
- NIT (navigation): at 390 the active "Settings" tab is in the overflow, so the coral underline sits under "···".

### packages-generic (Gitea-only)
- Reads native: 32px title, Installation Box-header 55px on `#f6f8fa`, and a sidebar with icon rows.
- NIT (pages/actions-packages-projects): the "View all" link is top-aligned against the "Versions (2)" heading
  (y=579 vs y=583) instead of baseline-aligned.

### milestone-issues (Gitea-only)
- MINOR (data-display): at 390 `.milestone-progress-big` runs to the viewport edge. It spans device px 32 to 779
  (css 16 to 390) with no right gutter and the rounded end is clipped. The cause is Gitea's
  `width: min(420px, 96vw)`, which is not neutralised. Use `width: 100%` or `max-width: 420px` inside the container.
  Crop: `milestone-issues-m.png`.
- NIT (pages/issues-prs): the Issues tab is not marked active on the milestone page (`PageIsIssueList` only, a
  template limit). GitHub highlights Issues here.

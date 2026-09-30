# Final gate — group 3 critique (theme github-auto)

Reviewer: final-gate critic 3. Evidence: `shots/final-gate-2/<route>/{light,dark}-{1440,390}.png` + `.json`,
references in `docs/reference/<route>/` (repo-issue, releases, issues-list-closed; login used as the auth yardstick),
and a fresh live run with states and measurements at `shots/final-gate-critic-3/live/` (52 pages, 0 problems, 0 console errors,
0 failed requests, max CLS 0.0025). Crops are in `shots/final-gate-critic-3/`.

## Audit logs (all 13 routes × 4 captures)

- Console errors 0, failed requests 0, unresolved CSS vars 0 (only `--loading-size` with fallback, 0 matched elements),
  off-palette colors 0, horizontal overflow none, unlayered Gitea CSS none.
- Non-Octicon icons: `gitea-npm` on packages-org (brand logo, allowed exception per ARCHITECTURE §6).
- CLS: packages-org dark-390 0.0132 (`footer.page-footer`); admin-repos 0.0003–0.0025 (table cells); PR-16 light-390 0.0001. All below 0.05.
- Measured against github.com (live measure vs reference): heading 32/400/40, underline-nav items 75.4×30, primary button
  93×32 14/500, markdown paragraph 14/21 and inline code 13.6px, auth heading 20/600, auth input and button 352×40.
  All match. Diff colors on PR-16 sampled: hunk number cell #b6e3ff / #0c2d6b, added number cell #aceebb / #1c4328, added line
  #dafbe1 / #12261d. These are Primer values.

## Scores

| Route | Light 1440 | Dark 1440 | 390 |
|---|---|---|---|
| explore-orgs | 8.5 | 8.5 | 8.5 |
| user-settings-appearance | 8.5 | 8.5 | 8.5 |
| repo-issue | 8.5 | 8.5 | 8 |
| file-view-large-file-playground | 8.5 | 8.5 | 8 |
| releases | 7.5 | 7.5 | 8.5 |
| issues-list-closed | 9 | 9 | 8.5 |
| pr-conversation-playground-large-diff-reviews | 8.5 | 8.5 | 8 |
| packages-org | 8 | 8 | 8 |
| admin-repos | 8.5 | 8.5 | 7.5 |
| user-settings-applications | 8.5 | 8.5 | 8.5 |
| admin-dashboard-config-settings | 8 | 8 | 7.5 |
| repo-create | 7.5 | 7.5 | 7.5 |
| reset-password-badcode | 8.5 | 8.5 | 8.5 |

## Issues (most severe first)

### MAJOR — releases: desktop uses the pre-2025 release layout, while current github.com has a different one (pages/repo)
- Ours (`final-gate-2/releases/light-1440.png`, crop `final-gate-critic-3/rel-l-a.png`): a 162px left column holds tag `v1.4.6`,
  commit `db9275ace1` and the Compare button (x 230–325, y 260–340). The card byline has no tag or commit.
- github.com (`docs/reference/releases/light-1440.png`): the left column is a "Release list" NavList. Tag and commit sit
  inline in the card's meta row (y≈403). Compare is a small button at the card's top right (x 1170–1260, y 330).
- Our own 390 layout already moves Compare, tag and commit into the card (`rel390a.png`), matching github.com @390. So the same reorder
  can be done in CSS at ≥768. The "Release list" nav has no data on the page, so drop the column or leave it empty.
  (tags-releases.css:11 notes this was a deliberate choice of the "classic" column.)

### MAJOR — repo-create: the form is inside a boxed card; github.com/new is an unboxed page (pages/repo, new-repo.css)
- Ours (`final-gate-2/repo-create/light-1440.png`): a 768px Box (x 336–1104) with a gray 55px Box-header "New Repository"
  (14px semibold, y 88–143) wraps every field.
- github.com/new has no Box. It has a 24px "Create a new repository" heading, a muted subtitle, a Subhead rule, then fields on
  the page background. Owner and name sit side by side with a "/" separator, and "Create repository" is at the end.
- CSS can reach most of this: remove the attached-segment border and background, restyle the attached header as a 24px Subhead,
  and put the owner and name fields in a grid row. The "Visibility" checkbox instead of Public/Private radio cards is template-level (nit).

### MINOR — admin-dashboard-config-settings: the markdown editor outside issue forms gets no composer styling (controls; today scoped in pages/issues-prs/composer.css)
- Ours (`admin-dashboard-config-settings/light-1440.png`, crop `adm-zoom2.png`): Write/Preview tabs and the toolbar sit loose on the page.
  The toolbar is a separate full-width row with group divider rules and "Aa" at the far right (x 1315, y 948). The textarea is a
  separate bordered box.
- repo-issue shows the same editor as one bordered composer (`ri-l-b.png` y 845–1067). Every rule in composer.css
  is scoped to `:is(#comment-form, #new-issue, .code-comments-list form.comment-form) .combo-markdown-editor`. Release, wiki
  and admin-banner editors fall back to stock styling. Make the composer chrome generic (controls) and keep only
  page-specific deltas in pages/issues-prs.

### MINOR — admin-dashboard-config-settings @390: toggle switches wrap under their labels (pages/settings-admin)
- `final-gate-critic-3/adm390.png` y≈135–220: the "Enable Gravatar" and "Enable Federated Avatars" ToggleSwitches drop to a second
  right-aligned line, so each row doubles in height (≈62px vs 41px at 1440). github.com keeps the ToggleSwitch on the label row.
- Nit: Primer ToggleSwitch shows an "On/Off" status text left of the track. Ours has none (`adm-zoom.png`).

### MINOR — PR-16 merge-style menu items are 54px tall with titles only (pages/issues-prs, merge-box.css / lazy PullRequestMergeForm chunk)
- `live/pr-conversation-playground-large-diff-reviews/states/light-1440-merge-style-open.png`: 4 items from y 477 to 695 (≈54px each,
  28px side padding) with a single 14px line each.
- A Primer ActionList single-line item is 32px. github.com's merge menu uses title plus description rows. The menu reads as empty.

### MINOR — file view @390: full-bleed boxes keep rounded corners and side borders (code, file-view.css:303)
- `final-gate-critic-3/fv390zoom.png`: `#repo-file-commit-box` and the file Box are stretched to x=0…390 (FG-054) but keep 6px radii and
  left and right borders, clipped at the viewport edge. The breadcrumb and buttons above keep the 16px gutter.
- A responsive full-bleed Box drops side borders and radius. Otherwise keep the 16px gutter.

### MINOR — admin-repos @390: page heading squeezed to 3 lines (pages/settings-admin)
- `final-gate-critic-3/ar390.png` y≈415–500: "Repository Management (Total: 11)" at 24px wraps to three lines beside the
  "Unadopted Repositories" button. Stack the action under the heading or wrap the button below it at narrow widths.

### MINOR — issues-list-closed @390 and PR-16 @390: overflowing nav rows get cut off with no affordance (pages/issues-prs, navigation/tabnav.css)
- `il390a.png` y≈150: the NavList becomes a pill row cut off at "Created by y…" with no fade or overflow button.
- `pr390a.png` y≈370: the PR tabnav cuts off "Files Changed" and drops its count at the right edge.
- The issues filter bar wraps to two rows (Label/Milestone/Project, then Author/Assignee/Type/Sort). github.com @390 shows 3 filters plus "…".

### MINOR — reset-password-badcode: a lone hamburger floats top-left on the auth page (pages/auth, app-header.css)
- `reset-password-badcode/light-1440.png` x 20–44, y 20–44 (also at 390). github.com auth pages have no chrome above the logo
  (`docs/reference/login/light-1440.png`). Heading, input and button metrics match exactly (20/600, 352×40, 352×40).

### MINOR — packages-org: list and filter structure is Gitea's (pages/actions-packages-projects)
- `packages-org/light-1440.png`: rows have no leading package icon column. The search, native "Type" select and search button are fused
  into one 1216px input group (y 190–222). github.com org packages has a "Find a package" input with separate Type / Visibility / Sort
  ActionMenu buttons and 16px package octicons on each row.

### NIT — repo-issue
- @390 the comment header wraps "(Migrated from github.com)" onto a second line (`ri390a.png` y 370–410). The composer toolbar wraps
  to 2 rows (`ri390b.png` y 255–295). The sidebar comes after the composer. github.com @390 surfaces Labels above the first comment (template-level).
- Labels select panel shows full pill labels (`live/repo-issue/states/light-1440-labels-panel-open-clip.png`). github.com SelectPanel rows use
  a colour dot + name + description.

### NIT — PR-16
- Timeline commit SHAs are bordered chips ("2d51c41304", x 897–983, y 983–1005 in `pr-l-0.png`). github.com uses plain monospace
  Link--secondary text.
- The review-thread footer is a gray bar with "Resolve conversation" and "Reply" buttons. github.com shows a collapsed "Reply…" input.

### NIT — issues-list-closed
- The state toggle is "⊙ 8 Open ✓ 51 Closed" (classic). Current github.com uses "Open 8 | Closed 51" with CounterLabels (reference y 307).

### NIT — releases
- "Downloads" disclosure has no CounterLabel (github.com: "Assets 8"). @390 "New Release" is a full-width green button (y≈190).

### NIT — user-settings-applications
- An empty "Authorized OAuth2 Applications" section shows only a paragraph. github.com shows an empty-state Box.

### NIT — global (every route)
- The footer is the centered Gitea row (logo, Powered by Gitea, GitHub, English, Licenses, API, Version). It reads close to github.com's
  centered © footer. No change needed.

## Not issues (checked)
- Hidden UnderlineNav icons @390 on repo/org tabs are Primer behaviour (icons go first on overflow, navigation/underline-nav.css:110).
- Gray folder icons in dark file tree match github.com dark TreeView.
- Full-page captures cannot show the sticky file-tree pane. Not judged.
- Label colours are inline `!important` (exempt).

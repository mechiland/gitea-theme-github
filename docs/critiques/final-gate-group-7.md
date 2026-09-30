# Final gate: group 7 critique

Reviewer: whole-site gate, group 7 (12 routes). Theme `github-auto`. Source shots: `shots/final-gate-2/<route>/`.
Crops used for review: `shots/final-gate-critic-7/` (`<route>_{light,dark}1440_N.png` are 1000px bands, `<route>_m_N.png` show light-390 and dark-390 side by side with a red divider, `ref_*` are reference crops, `*_zoom*.png` are detail zooms).

## Audit logs (all 48 JSON files)

The logs are clean on every route, scheme and width:
- mainStatus 200
- 0 console errors or warnings
- 0 failed requests
- 0 unresolved CSS vars
- 0 off-palette colours and 0 colours from the other scheme
- 0 non-Octicon icons
- 0 unlayered Gitea CSS
- no horizontal overflow

The largest CLS is 0.004 (`pr-compare-form-playground` 1440). No state captures exist for these routes in final-gate-2.

## Scores

| Route | Light 1440 | Dark 1440 | Mobile 390 | Reference |
|---|---|---|---|---|
| site-admin | 8.5 | 8.5 | 8 | none (Gitea-only) |
| repo-issues | 8.5 | 8.5 | 7.5 | yes |
| repo-commits | 8.5 | 8.5 | 8.5 | yes |
| blame-playground-multiple-authors | 7.5 | 7.5 | 7 | none |
| wiki-page-list | 9 | 9 | 8.5 | yes |
| pr-conversation-open | 8.5 | 8.5 | 8 | yes |
| pr-draft-wip-playground | 8 | 8 | 7.5 | none |
| user-profile-stars-tab | 8.5 | 8.5 | 8 | yes |
| org-settings | 8.5 | 8.5 | 8 | none |
| org-settings-labels | 7.5 | 7.5 | 7.5 | none |
| package-versions | 7.5 | 7.5 | 7.5 | none |
| pr-compare-form-playground | 8 | 8 | 7.5 | none |

In dark mode, the sampled pixels match github.com exactly on `pr-conversation-open`:
- page background #0d1117
- comment header #151b23
- comment border #3d444d

The dark scores therefore equal the light scores throughout.

## Cross-route issues

1. **minor · navigation**: the mobile UnderlineNav drops its leading icons.
   - `src/navigation/underline-nav.css` L111-123 hides `.overflow-menu-items > .item > .svg`:
     - below 1200px on the repo bar
     - below 768px on the profile and org bars
   - At 390 ours shows "Code / Issues 8 / Pull Requests 12 / …" with no icons (`shots/final-gate-critic-7/repo-issues_m_0.png`).
   - github.com at 390 keeps the icons and shows fewer tabs: "<> Code  ⊙ Issues 8  …" (`docs/reference/repo-issues/light-390.png`). The profile does the same: "Overview / Repositories 15 / Projects" with icons (`docs/reference/user-profile-stars-tab/light-390.png`).
   - The CSS comment says Primer hides icons first, but the reference contradicts that.
   - Also, when the active tab sits in the overflow (Wiki, Settings, Packages, Starred), the "…" button gets the orange active underline (`wiki-page-list_m_0.png`, `org-settings_m_0.png`). GitHub never underlines the overflow button.
   - Seen on: repo-issues, repo-commits, blame, wiki-page-list, both PR routes, pr-compare, user-profile-stars-tab, org-settings, org-settings-labels, package-versions.
2. **nit · navigation (`.page-footer`)**: our footer is Gitea's.
   - It has no border-top. It shows the Gitea logo, "Powered by Gitea", "GitHub" (the theme name), "English", "Licenses", "API" and "Version".
   - github.com uses a footer with a top border and a copyright line.
   - At 390 it wraps to two rows.
   - Probably an accepted Gitea-only difference. Listed so it is a conscious decision.
3. **minor · navigation (NavList, `.ui.vertical.menu`)**: settings sidebars have no leading Octicons.
   - github.com settings NavLists (org, user and repo settings) put a 16px icon in front of every item.
   - Ours shows text only: Organization, Webhooks, Labels, … (`org-settings_light1440_0.png`, `site-admin_light1440_0.png`).
   - Gitea's markup has no icons, so this needs an href-keyed `mask-image` or a template change.

## Per-route findings

### site-admin (Gitea-only admin dashboard)
Reads as a native Primer settings page:
- Subhead "Maintenance Operations" at 24px with a bottom border
- Box rows with "Run" buttons
- NavList with the 4px accent bar
- a key/value Box that stacks correctly at 390 (`site-admin_m_2.png`)

Only the cross-route nav-icon gap applies (item 3). No other defects found.

### repo-issues
Very close to github.com (`repo-issues_light1440_0.png` vs `docs/reference/repo-issues/light-1440.png`): row height 65, label pills, comment counts, left NavList.
- **minor · pages/issues-prs**: the state toggle is the classic "⊙ 8 Open  ✓ 51 Closed" with icons and bold text. Current github.com uses "Open [8]  Closed [51]" with CounterLabels and no icons.
- **minor · pages/issues-prs**: at 390, the left NavList becomes a horizontally scrolling strip clipped at the viewport edge ("Created by y…" cut at x=390, `repo-issues_m_0.png`). github.com hides the sidebar behind a collapse button next to "All issues" (`docs/reference/repo-issues/light-390.png`).
- **minor · pages/issues-prs**: at 390 all 7 filters wrap to two rows inside the Box header (Label, Milestone, Project, Author, Assignee, Type, Sort). github.com shows 3 and collapses the rest into a "…" overflow.
- **nit · pages/issues-prs**: the author in the row meta ("opened 3 years ago by hellishvictor") is plain muted text. GitHub underlines it as a muted link. Word order is Gitea's locale.

### repo-commits
Commit timeline, Box rows and day groups match the reference (`repo-commits_light1440_0.png` vs `ref_repo-commits_light_0.png`). The timeline stubs at 390 match github.com's mobile layout (`ref_repo-commits_m0.png`).
- **minor · icons**: the "browse files" button uses `octicon-file-code` (a page with `<>`). github.com uses `octicon-code` (`<>` alone). Zooms: `commits_icons_zoom.png` vs `commits_icons_zoom_ref.png`. Every commit row is affected, and pr-compare shares it.
- **nit · pages/repo**: the SHA ("99cc347") is set in the monospace stack. github.com renders it in the UI sans at 12px (same zooms).
- **nit · pages/repo**: the day label reads "Jan 14, 2026" instead of "Commits on Jan 14, 2026". This is accepted in ARCHITECTURE §7, since there is no locale key.

### blame-playground-multiple-authors (no reference)
File tree, breadcrumb, Code|Blame SegmentedControl and hunk rows are all Primer.
- **major · code**: there is no blame age heat strip and no "Older ▮▮▮▮▮ Newer" legend (`blame-playground-multiple-authors_light1440_0.png`).
  - On github.com, every hunk has a 2px coloured age stripe between the blame column and the line numbers, and the file header shows the legend. It is the strongest visual signature of a GitHub blame view.
  - Gitea emits no age data per hunk, so this is not reachable with CSS. It needs a template/data decision or an explicit exemption.
- **minor · pages/repo**: at 390 the file toolbar wraps into three rows. "Go to file" and "Add File" take row two, and the "…" kebab sits alone on row three (y≈295 css px, `blame-playground-multiple-authors_m_0.png`). github.com hides "Go to file" on narrow screens and keeps the kebab inline.
- **nit · code**: at 390 the file box is edge-to-edge (x=0..390) while everything above it keeps the 16px gutter.

### wiki-page-list
Near-identical to github.com (`shots/final-gate-2/wiki-page-list/light-1440.png` vs the reference): the "Pages" title, green "New page" button and single Box row all match.
- **nit · pages/repo**: the extra "Default Branch: master" line (Gitea data). The "New Page" casing comes from the locale.
- Mobile only has the cross-route nav-icon issue.

### pr-conversation-open
- Header, StateLabel, branch pills, tabs with counters, diffstat, comment Box, sidebar with gear icons and comment composer all match the reference geometry.
- Dark pixels match exactly.
- The missing "pushed commit" timeline row is migration data, not theme.
- **nit · pages/issues-prs**: at 390 the "Edit" button sits on its own row above the title (`pr-conversation-open_m_0.png`, y≈150 css px). github.com's mobile reference starts with the title (`ref_prconv_m0.png`).
- **nit · pages/issues-prs**: at 390 the comment header wraps as "…commented 4 / months ago (Migrated…)". GitHub puts the timestamp on its own line.

### pr-draft-wip-playground (no reference)
The Draft StateLabel, checks list and merge box read as GitHub.
- **minor · pages/issues-prs**: the timeline commit SHA "7728b5f95d" is drawn as a bordered, button-like box (`draft_sha_zoom.png`). github.com shows a plain muted monospace link with no border (see `pr-conversation-open` reference, "22955d1").
- **nit · pages/issues-prs**: "Remove  WIP:  prefix" has visibly doubled gaps around the `<strong>` (`pr-draft-wip-playground_light1440_1.png`, y≈125).
- **nit · pages/issues-prs**: at 390 the merge-box status rows put two icons (lock and check) against three wrapped text lines. The check floats between the lines instead of aligning with its line (`pr-draft-wip-playground_m_1.png`).
- Behaviour note (not theme): with a failing required check and WIP, Gitea still shows a green primary "Create merge commit" for admin. GitHub would show "Ready for review" and a disabled merge button.

### user-profile-stars-tab
Profile vcard, UnderlineNav, repo rows (owner / **repo** in blue, description, topics, language dot, stats) and the 390 ordering (vcard, then tabs, then list) match github.com.
- **nit · pages/people**: there is no "Starred" or "Star" button on each row. github.com always has one, but Gitea's markup has none.
- Mobile has the nav-icon and overflow-underline issues (`user-profile-stars-tab_m_0.png`).

### org-settings (no reference)
Org header, NavList, form fields, help text, primary button and the Danger Zone Box with red border and danger buttons are native Primer. They stack correctly at 390 (`org-settings_m_1.png`).
- **minor · pages/settings-admin**: the avatar upload is a native `<input type=file>` ("Choose File / No file chosen") plus two buttons below the form. GitHub's org profile page puts "Profile picture" in a right column with a large avatar and an "Edit" menu.
- Also affected by the cross-route nav-icon issue (item 3).

### org-settings-labels (no reference)
This page is still visibly Gitea (`shots/final-gate-2/org-settings-labels/light-1440.png`).
- **major · pages/issues-prs (labels list; blankslate via data-display)**: the empty state is not a Primer Blankslate.
  - It is centred muted text over a 440px-wide `<select>` whose option spans 3 lines in *italics* ("Default (bug, duplicate, …)"), with a "Use Label Set" button under it.
  - There is no Box border, no 24px Octicon and no heading.
  - A GitHub page would show a bordered Box with a `tag` icon, the heading "No labels", and the action. It would use a single-line Select with no italics.
- **minor · pages/issues-prs**: "0 labels" is a 24px Subhead with a separate "Sort" link. github.com's labels page puts "N labels" and "Sort" in a muted Box header.

### package-versions (no reference)
- **minor · pages/actions-packages-projects**: there is no page title. The only heading is a 14px breadcrumb "@octo-org/theme-tokens / Versions" (y=201). GitHub's versions page has a 24px Subhead "Versions", Active/Deleted tabs and a Box of rows.
- **minor · pages/actions-packages-projects**: the version name "1.0.0" is bold `fgColor-default`, not a link. GitHub renders it as a bold accent link, #0969da in light.
- The rest is fine: search input with Select and button, Box row, muted meta.

### pr-compare-form-playground (no reference)
The composer, sidebar, commit timeline and diff (hunk header #ddf4ff, add rows #dafbe1 and #aceebb) are all GitHub.
- **minor · pages/issues-prs**: the page is fluid. Content runs x=32..1408 (1376px) at 1440. The other repo pages use 80..1360 (1280, repo-commits) or 112..1328 (1216, PR and wiki). github.com's compare page uses container-xl, 1280px centred.
- **minor · code**: at 390 the "± 1 changed files with 9 additions and 0 deletions" summary disappears. Only the gear, split and kebab icons stay, right-aligned (`pr-compare-form-playground_m_1.png`, y≈585 css px).
- The commit rows share the `file-code` icon issue from repo-commits.

## Summary
No route in this group has a technical defect: logs, palette, icons and overflow are all clean. The strongest routes are 8.5-9 (wiki page list, issues, commits, PR conversation, stars, org settings, site admin).

Three routes pull the group down:
- **blame**: the missing age heat strip and legend, a GitHub signature that is not CSS-reachable
- **org-settings-labels**: a non-Primer empty state
- **package-versions**: no title, and the version is not a link

The most visible systemic issue is on mobile: the UnderlineNav drops its icons and underlines "…", contradicting the github.com 390 references. Settings NavLists also lack leading icons.

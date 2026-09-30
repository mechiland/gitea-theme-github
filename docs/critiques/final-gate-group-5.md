# Final gate 2: group 5 (critic 5)

Theme `github-auto`, Gitea 1.27.3. Sources: `shots/final-gate-2/<route>/*` (fresh full run), with crops in `shots/final-gate-critic-5/<route>/`. Live re-capture with `--states --measure`, used only for the interaction states, is in `shots/final-gate-critic-5/live/` (48 pages; 0 problems, 0 console errors, 0 failed requests).
References used: `docs/reference/{repo-pull, directory-tree, labels, apx1-projects-list, crit-app-action-job}`. `docs/reference/signup/*` is GitHub's "Access is temporarily restricted" bot page, so it cannot be used. Signup was judged against github.com/login instead.

## Audit logs (48 captures in final-gate-2)
- 0 console errors, 0 failed requests, 0 unresolved CSS vars (only `--loading-size` with fallback, 0 matched elements), 0 off-palette colors, 0 other-scheme-only colors, 0 unlayered Gitea CSS.
- `document.horizontalOverflow=false` on every capture. This fixes both prior blockers: directory-tree @390 and pr-files-changed @390.
- The only non-Octicon icon is `fontawesome-openid` on signup, which is an allowed brand exception.
- CLS is 0 everywhere, except releases @390 at 0.0007 (`a.muted.tw-font-mono`). action-job-ok was 0.0599 in the last gate and is now 0.

## Scores (1440 light / 1440 dark / 390 both schemes)

| route | light | dark | 390 |
|---|---|---|---|
| signup | 8.5 | 8.5 | 8.5 |
| notifications | 8.0 | 8.0 | 8.0 |
| repo-pull | 9.0 | 9.0 | 8.7 |
| directory-tree | 8.5 | 8.5 | 7.5 |
| releases-playground-with-assets-prerelease-draft | 8.5 | 8.5 | 7.8 |
| labels | 8.5 | 8.5 | 8.5 |
| pr-files-changed-unified-playground-large-diff | 8.8 | 8.8 | 8.2 |
| projects-list | 8.5 | 8.5 | 8.5 |
| repo-settings-branches | 8.3 | 8.3 | 8.3 |
| admin-emails | 8.7 | 8.7 | 8.0 |
| action-job-ok | 8.8 | 8.8 | 8.3 |
| pr-compare-new-playground | 8.2 | 8.2 | 7.8 |

Verified fixed since final-gate 1:
- Both @390 overflows.
- Dependency select and "+" are now aligned (`repo-pull/z-dep.png`).
- The delete-label Confirm button is now danger-styled (`live/labels/states/dark-1440-confirm-modal-open-clip.png`).
- The Labels/Milestones segmented control now shows a selected state.
- Projects: Open/Closed moved into the Box header; New Project is 32px.
- Admin email checks are now success green.
- "Add New Rule" is now a default button.
- Inline review author is now bold.
- The job view no longer has CLS.
- The file-tree pane now has a divider.

No blockers remain. Dark mode matches Primer tokens on every route checked, including GitHub's dark label formula and the dark diff/hunk colors.

## Major
1. **directory-tree @390: the toolbar takes 3 rows and the latest-commit bar truncates badly.**
   - The toolbar wraps: branch, compare and breadcrumb on row 1; Go to file and Add File on row 2; … and History on row 3. It spans about 111 CSS px (y 144–255). GitHub fits "← Files · main · grex / src / · …" into one 32px row.
   - The commit header shows "Joel Nati… a… Peter M. …". The "and" is cut to "a…", and both names are ellipsized. GitHub shows "jqnatividad and pemistahl 10 months ago" on one line and puts the actions on a second line.
   - Evidence: `shots/final-gate-2/directory-tree/light-390.png`, `shots/final-gate-critic-5/directory-tree/z-mobile-toolbar.png`, ref `docs/reference/directory-tree/light-390.png`.
   - Owners: pages/repo (toolbar), code (`#repo-files-table` latest-commit row).

## Minor
2. **releases @390: the header row is inset 15px more than the cards.**
   - "4 Releases | 3 Tags", RSS, New Release and the divider start at x=31 and end at x=359 CSS px. The release cards span x=16 to x=374.
   - Measured on `light-390.png` rows 304/384/464 vs 600/1100. Evidence: `releases-playground-with-assets-prerelease-draft/z-mobile-header-inset.png`.
   - Owner: pages/repo.
3. **releases @390: the title row still wraps awkwardly.** The red commit-status "×" sits alone on a line and "Stable" is pushed to a separate right-aligned line (`releases-…/light-390-1.png` top). Owner: pages/repo.
4. **releases (all sizes): the "Downloads" summary doesn't match GitHub's "Assets" row.**
   - It uses the browser's native ▸ marker, has no counter, and is collapsed on every release.
   - GitHub's "Assets" row uses an octicon triangle and a Counter, and is expanded for the latest release.
   - With the row collapsed, the route never shows its assets (`light-1440.png` y≈655).
   - Owner: pages/repo.
5. **pr-files-changed @390 (also pr-compare @390): the diff stats summary is hidden.**
   - The "20 changed files with 106 additions and 57 deletions" summary and the file-tree toggle are hidden. The toolbar shows only gear, split, …, commit and Review.
   - GitHub keeps a file count or selector on mobile. Evidence: `pr-files-…/light-390-0.png` y≈857.
   - Owner: code (`.diff-detail-box`).
6. **pr-compare: "1 Commits" is a bare Box header with no body**, a 54px muted bar that reads as empty. GitHub shows "Commits on <date>" directly with a commit Box (`pr-compare-new-playground/light-1440-0.png` y 364–417, `z-mobile-commits.png`). @390 the timeline rail under "Sep 26, 2026" is an 8px stub. Owner: pages/issues-prs.
7. **admin-emails @390: the table scroll affordance is heavy.**
   - It is a 12px radial shadow in `--borderColor-emphasis` that reaches #a6adb6 at the edge (dark: #4a515a).
   - The shadow skips the header row, and the email cells are ellipsized even though the table scrolls.
   - Primer DataTable scrolls without a shadow. Evidence: `admin-emails/z-scroll-light.png`, `src/data-display/tables.css:169-174`.
   - Owner: data-display.
8. **repo-settings-branches: settings NavList items have no leading octicons.** GitHub's repo settings nav gives every item a 16px icon (gear, people, webhook, git-branch, tag, key…). The empty state is plain centred text in a bordered box, not a Blankslate with an icon (`repo-settings-branches/light-1440-0.png`). Owner: pages/settings-admin, with navigation for `.ui.vertical.menu`.
9. **notifications is Gitea's layout, not GitHub's inbox.**
   - There is no filter bar (is:unread / Group by), no "Select all" list header, and no repo grouping.
   - The left nav is Unread/Read with no icons, where GitHub has Inbox/Saved/Done with icons.
   - On hover the title turns accent blue, and GitHub doesn't do that (`live/notifications/states/light-1440-row-hover-clip.png`).
   - Owner: pages/people.
10. **labels differs from the current github.com labels page.**
    - There is no "Search all labels" input and no "Active 13 / Archived 0" counters; the header just reads "13 labels".
    - Every row shows "N open issues/pull requests" text plus inline Edit/Delete. GitHub shows only non-zero counts as a PR or issue icon with a number, and puts actions in a kebab menu (`labels/light-1440-0.png` vs `ref-light-1440-0.png`).
    - Owner: pages/issues-prs.

## Nits
- signup: at 1440 a lone invisible 32px hamburger is pinned top-left (deliberate, FG-063). github.com/login has no control there. pages/auth.
- repo-pull: when the author has no link, "innobead merged…" is muted regular weight; GitHub's author is semibold fg-default. The code block has no hover copy IconButton. The branch copy icon sits inside the `main` label instead of beside it (`repo-pull/z-meta-light.png` vs `z-meta-ref.png`). Owners: pages/issues-prs, markdown.
- pr-files-changed @390: the active "Files Changed" tab is clipped at the right edge and its counter is hidden (GitHub clips too, but after the active tab). Owner: navigation.
- releases: the compare SelectPanel has no "Choose a tag to compare" header (`live/releases…/states/light-1440-compare-open.png`). Owner: overlays.
- action-job-ok: the right log panel has a 1px border; GitHub's log/CheckRun container has none (`action-job-ok/light-1440-0.png` vs `docs/reference/crit-app-action-job/light-1440.png`). Owner: pages/actions-packages-projects.
- admin-emails: the sort indicator is a filled caret ▲; Primer DataTable uses the `arrow-up` / `sort-asc` octicon. Owner: data-display.
- directory-tree @1440: the branch picker and Go to file sit in the content toolbar, not the tree pane. There is also no Name / Last commit message / Last commit date header row (Gitea structure). Owner: code.

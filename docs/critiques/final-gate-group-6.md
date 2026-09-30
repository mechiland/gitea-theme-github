# Final gate: group 6 (whole-site critic)

Theme `github-auto`. Sources: `shots/final-gate-2/<route>/` (baseline run), plus a fresh live pass with `--measure --states` in `shots/final-gate-critic-6/live/` (48 pages: 0 problems, 0 console errors, 0 failed requests, max CLS 0.0108). The crops I read are in `shots/final-gate-critic-6/`.

## Audit logs (all 12 routes, both schemes, both widths)
- Unresolved CSS vars: 0 everywhere. `--loading-size` is unresolved but has a fallback, so it doesn't matter. Off-palette colours: 0. Horizontal overflow: none. Unlayered Gitea CSS: 0. CLS never goes above 0.0085.
- repo-home in `final-gate-2` logs 21 console errors and 21 failed requests. They are all `net::ERR_BLOCKED_BY_CLIENT` on third-party README images (raw.githubusercontent.com, shields.io, GitHub badges). The shoot tool blocks those requests, so they are not a theme defect. The fresh live run logs 0.
- Non-Octicon icons: repo-settings-hooks has `gitea-gitea`, `gitea-feishu` and `gitea-matrix` in the Add Webhook menu, and packages-repo has `gitea-npm`. These are brand marks, which is acceptable.

## Scores
| route | light 1440 | dark 1440 | 390 |
|---|---|---|---|
| user-profile | 8.5 | 8.5 | 8.0 |
| repo-home | 9.0 | 9.0 | 8.5 |
| repo-pull-files | 9.0 | 9.0 | 8.5 |
| blame | 8.5 | 8.5 | 7.5 |
| wiki-home | 9.0 | 9.0 | 8.5 |
| milestones | 8.5 | 8.5 | 8.5 |
| pr-commits-tab-playground | 9.0 | 9.0 | 8.5 |
| project-board | 8.0 | 8.0 | 7.5 |
| repo-settings-hooks | 8.5 | 8.5 | 8.0 |
| admin-user-edit | 8.5 | 8.5 | 8.5 |
| packages-repo | 8.5 | 8.5 | 8.5 |
| issue-playground-1 | 8.5 | 8.5 | 8.0 |

## Issues by route

### user-profile
- **minor**, owner `pages/people`. In the follower line "3 Followers · 2 Following", the numbers are not bold. GitHub renders `<b>297</b> followers · <b>18</b> following`: the count is bold and in fg-default, and the label is lowercase in fg-muted. Ours renders the whole line in fg-muted at regular weight. See `final-gate-2/user-profile/light-1440.png` y≈608 and the crop `up-l-left.png`.
- **nit**, owner `pages/people`. "Block user" renders at about 12px; GitHub's "Block or report user" is 14px (`up-l-left.png` compared with `up-ref-l-left.png`). The vcard rows (location, mail, link, joined) sit 25px apart; GitHub uses about 29px.
- **nit**, owner `pages/people`. The org avatar has no "Organizations" heading above it. This may be a DOM limitation.
- **nit**, owner `navigation`. At 390 the tab icons are dropped and the rest collapses into "…". GitHub keeps the icons and scrolls the tabs (`up-390-a.png`).

### repo-home
- **minor**, owner `pages/repo` (README box header). The `#readme .ui.top.attached.header` measures 46px tall with 8px left padding and a `#f6f8fa` background. GitHub's README header is white, has a 16px inset, and shows "README" as an underline tab with an accent bar. Compare `rh-l-readmehdr.png` with `rh-ref-readmehdr.png`.
- **nit**, owner `markdown`. The copy button on code blocks is always visible (`rh-l-scan0.png`). On GitHub it only appears on hover or focus.
- **nit**, owner `overlays`. In the branch picker, long branch names break mid-word ("…actions/uploa / d-artifact-7"). GitHub truncates them with an ellipsis (`live/repo-home/states/light-1440-branch-menu-open-clip.png`).

### repo-pull-files
- The diff colours match pixel-for-pixel in both schemes: hunk `#ddf4ff` / `#111d2e`, deletion number cell `#ffcecb` / `#542326`, addition `#dafbe1` / `#12261d`, file header `#f6f8fa` / `#151b23`. No theme defects.
- **nit**, owner `pages/issues-prs`. At 390 the Files Changed tab is clipped at the right edge and its counter is cut off (`prf-390-a.png`). GitHub also scrolls here, so this is acceptable.

### blame
- **minor**, owner `code`. At 390 the blame group header shows only the commit message and drops the relative date. GitHub shows "3 years ago" right-aligned in the same header. The header background is also `bg-muted`, where GitHub uses bg-default (`bl-390-a.png`, `bl-390-b.png`).
- **minor**, owner `pages/repo`. At 390 the file toolbar wraps into three rows, and the "…" button ends up alone on its own row (`bl-390-a.png`).
- **nit**, owner `code`. The age heat strip in the left gutter of each blame row is missing (GitHub's Older→Newer ramp). The Gitea DOM has no age bucket, so this can only be accepted as a known gap.

### wiki-home
- The layout matches at 1440 in both schemes. **nit**, owner `navigation`: at 390 the active "Wiki" tab lives inside the overflow, so the orange underline sits under the "…" button (`wiki-home-390.png`). Primer's UnderlineNav moves the selected item into the visible set instead.

### milestones
- There is no defect against GitHub's classic milestones layout. GitHub has since moved to a new issues-sidebar shell, which Gitea's DOM can't reproduce. In our row, "0%" sits alone under the progress bar, where GitHub shows "0% complete · 2 open · 0 closed" (`milestones/light-1440.png`). Nit, owner `pages/issues-prs`.

### pr-commits-tab-playground
- This matches GitHub's commits tab closely (`prc-l-rows.png` compared with `prc-ref-rows.png`). **nit**, owner `icons`: the browse-files button uses `file-code`. GitHub uses the `code` (`<>`) Octicon.

### project-board
- **minor**, owner `pages/actions-packages-projects`. At 1440, four 350px columns overflow the 1376px content box. The Done column and its "…" menu are clipped at x=1440 with no scroll affordance (`project-board/light-1440.png`).
- **minor**, same owner. The columns stop at a fixed height (bottom at y≈763), leaving large empty column wells. GitHub Projects columns stretch to the viewport.
- **nit**, same owner. At 390 the Fullscreen/Edit/Close/Delete/New Column button group breaks into separate buttons across two rows (`project-board-390.png`).

### repo-settings-hooks
- **minor**, owner `pages/settings-admin`. The empty state is a bordered box of centred muted text with no icon and no heading. That doesn't read as a Primer Blankslate or as GitHub's plain description paragraph (`repo-settings-hooks/light-1440.png` y 197–283).
- **nit**, same owner. The settings nav has no item icons and no group headings ("Access" and "Code and automation" on GitHub).

### admin-user-edit
- **nit**, owner `controls`. The label of the disabled "Disable Sign-In" checkbox stays in fg-default; Primer mutes disabled labels (`aue-dark-lower.png`, `admin-user-edit-390b.png`).

### packages-repo
- This reads as a native Primer list. There are no findings beyond the brand-icon note above.

### issue-playground-1
- **minor**, owner `pages/issues-prs`. The issue page container runs from x=104 to 1336 (1232px), while every other repo page runs from 112 to 1328. The title and body shift 8px against the rest of the site (`issue-playground-1/light-1440.png` compared with `pr-commits-tab-playground/light-1440.png`).
- **minor**, owner `data-display` (comment header). At 390 the comment header wraps "commented 4 months / ago", leaving an orphan "ago" on its own line (`ip-390-0.png`, `ip-390-1.png`).
- **nit**, owner `pages/issues-prs`. The sidebar "Delete" is fg-default, but GitHub's delete action is fg-danger. Gaps between sidebar headings and their text are inconsistent: 8px under Due Date, 0 under Dependencies (`ip-l-sidebar.png`).
- **nit**, owner `controls`. The due date uses the native `yyyy/mm/dd` date input with the browser's calendar glyph.

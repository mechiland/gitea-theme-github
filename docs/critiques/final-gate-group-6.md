# Final gate: group 6 (whole-site review)

Reviewer: final-gate critic 6 (design-systems review, no code written)
Inputs: `shots/final-gate/<route>/{light,dark}-{1440,390}.png` + `.json`, references in `docs/reference/<route>/`.
Crops and live captures: `shots/final-gate-critic-6/` (live states in `shots/final-gate-critic-6/live/`, run with `--theme github-auto --states --measure --viewports 1440`).
DOM probes used the cached admin session against http://localhost:3000 and changed no settings.

## Audit logs (all 48 captures)
- Main status 200 everywhere. There is no horizontal document overflow, CLS is 0, and there are no unresolved vars, no off-palette colours and no unlayered Gitea CSS.
- **repo-home**: 20 console errors and 20 failed requests, all `net::ERR_BLOCKED_BY_CLIENT` for external README images (raw.githubusercontent.com, shields.io, docs.rs …). The stable-capture mode aborts these, so this is an environment effect and not a theme fault. The README therefore shows alt-text links where GitHub shows badges.
- Non-Octicon icons: `gitea-gitea`, `gitea-feishu` and `gitea-matrix` (repo-settings-hooks, Add Webhook menu) and `gitea-npm` (packages-repo). All are brand logos, so they are allowed exceptions under ARCHITECTURE §6.
- Masked icons (material-file → octicon-file, filter and triangle-down) render correctly.

## Scores

| Route | Light 1440 | Dark 1440 | 390 (both) |
|---|---|---|---|
| user-profile | 8.5 | 8.5 | 8.5 |
| repo-home | 8.5 | 8.5 | 8.0 |
| repo-pull-files | 8.0 | 8.0 | 7.5 |
| blame | 8.0 | 8.0 | **5.0** |
| wiki-home | 7.5 | 7.5 | 7.5 |
| milestones | 8.0 | 8.0 | 7.5 |
| pr-commits-tab-playground | 8.0 | 8.0 | 8.0 |
| project-board | 8.0 | 8.0 | 6.5 |
| repo-settings-hooks | 8.5 | 8.5 | 8.5 |
| admin-user-edit | 8.5 | 8.5 | 8.5 |
| packages-repo | 8.0 | 8.0 | 8.0 |
| issue-playground-1 | 8.5 | 8.5 | 8.5 |

Token accuracy is excellent. Sampled pixels match Primer exactly: header #f6f8fa/#010409, borders #d1d9e0/#3d444d, underline-nav #fd8c73/#f78166, table zebra #f6f8fa/#151b23, and disabled primary #94d3a2/#105823. What keeps the scores down is layout and responsive behaviour, not colour.

## Issues by severity

### Major
1. **blame, 390: the code is not visible at all** (owner `code`). `.code-view` is 358px wide with `overflow:auto`, but its table is 2031px wide. `.blame-info` takes about 312px and `.lines-num` starts at x=360 (off-screen), so the first viewport shows only commit messages. Long hunks leave huge blank areas, and the page is about 15,000 CSS px of mostly empty rows. GitHub stacks each commit header above its code lines. Evidence: `shots/final-gate/blame/light-390.png`, `shots/final-gate-critic-6/bl-m0.png`, `bl-m-bands.png`.
2. **repo-pull-files, split view: the addition-side line-number cell is neutral grey instead of green** (owner `code`). Right-hand cells for lines 107, 108 and 117 measure #f6f8fa (light) and #151b23 (dark). GitHub uses #aceebb and #1c4428. The deletion side is correct (#ffcecb / #542326). The bug also shows at 390. Evidence: `shots/final-gate-critic-6/prf-num.png`, `shots/final-gate/repo-pull-files/{light,dark}-1440.png`, `prf-m0.png`.
3. **project-board, 390: the toolbar button group is truncated** (owner `pages/actions-packages-projects`). `.project-header .ui.compact.menu` is a 358px `overflow:auto` strip. "Delete" is clipped (right edge 386.6 > 374) and "New Column" sits entirely off-screen (x=385–519), with nothing to show it can be scrolled. The group should wrap or collapse into an overflow menu. Evidence: `shots/final-gate/project-board/light-390.png`, `shots/final-gate-critic-6/pb-m.png`.

### Minor
4. **repo-home, 390: the README box header wraps** (owner `code`). `#readme .file-header` is 75px tall, against 46px at 1440. `.file-header-left` stretches to 342px, which pushes the pencil button onto its own line at the left. GitHub keeps a single 48px row. Evidence: `shots/final-gate-critic-6/rh-m1.png`.
5. **blame, 1440: blame metadata sits about 5px above the code baseline.** "4 years ago" is at y≈310 while line "1" is at y≈315. GitHub aligns them on one baseline. Owner `code`. Evidence: `shots/final-gate-critic-6/bl-zoom.png`.
6. **blame, 1440: there is no vertical divider between the file tree and the content column.** GitHub draws a full-height 1px border at the edge of the tree pane. Owner `code`. Evidence: `bl-light-0.png` vs `bl-ref-light-0.png`.
7. **repo-pull-files, dark: the hunk header row is too blue.** Ours is #152843; GitHub is #111d2e. The hunk number cell (#0c2d6b) is correct. Owner `code`. Evidence: `shots/final-gate/repo-pull-files/dark-1440.png` vs the reference.
8. **repo-pull-files, 390: the PR tab strip clips the active "Files Changed" tab** at the right edge ("± Fi…"), with no sign that the strip scrolls. Owner `navigation`. Evidence: `prf-m0.png`.
9. **wiki-home: the sidebar is not GitHub's.** It uses a "Page: Home" select plus a green "Code" clone button. GitHub shows a bordered "Pages" box with a filter field and a "Clone this wiki locally" URL input, and "Delete Page" is not a header button. At 390 the selector also sits above the content. Owner `pages/repo`. Evidence: `shots/final-gate-critic-6/wiki-d.png`, `wiki-m.png`.
10. **pr-commits-tab-playground: the commit list differs from GitHub.** It renders as a Box with a bold "2 Commits" header row, where GitHub uses a "Commits on <date>" timeline group. SHAs are 10 characters in proportional sans at fg-default; GitHub uses 7 characters in 12px monospace at fg-muted. Owner `pages/repo`. Evidence: `shots/final-gate-critic-6/prc-sha.png`.
11. **milestones, 390: the progress bar has a fixed width** of about 200px instead of the full row width, and the "0%" label sits before the bar. GitHub puts "0% complete · 2 open · 0 closed" under a full-width bar. Owner `pages/issues-prs`. Evidence: `ms-m.png`.
12. **Mobile global header shows only hamburger, logo and bell.** GitHub's signed-in mobile header also shows the create (+) and avatar controls. This affects every route. Owner `navigation`. Evidence: `up-m.png`.

### Nit
13. **user-profile**: follower and following counts are not bold (GitHub bolds the numbers). The profile README box has no "user / README.md" caption, and the org avatars have no "Organizations" heading. Owner `pages/people`. Evidence: `shots/final-gate/user-profile/light-1440.png`.
14. **milestones**: "Labels | Milestones" is plain text, where GitHub's classic subnav was a bordered segmented pair. Owner `pages/issues-prs`. The due date "Dec 31, 9998" is a Gitea/seed timezone artefact, not a theme issue.
15. **packages-repo**: the meta links ("admin", "octo-org/theme-playground") are underlined and bold. GitHub uses non-underlined Link--muted, and the package name is a blue link with a leading package icon. Owner `pages/actions-packages-projects`.
16. **repo-home**: sidebar says "Description" rather than "About", and there is no "Public" label. These are Gitea template strings, so no action.
17. **blame / diff syntax colours**: HTML inside markdown and fenced code inside a markdown diff are not coloured the way GitHub colours them. This comes from the chroma lexer, not from tokens. Owner `code`.
18. **repo-home README external images** are blocked by the shoot tool's stable mode, so the page cannot be compared on badges. Owner `tools/shoot`.

## States (live, 1440)
The Follow button's hover, press and focus states, the milestone row hover, the board card hover, the column menu, filter focus and hover, and the repo-home branch, Code, Add-file, tooltip, topic-hover and goto-file focus states all read as Primer. Focus rings are 2px #0969da / #1f6feb, overlays in dark use #010409 as the generated token says, and topic hover is solid accent. Evidence: `shots/final-gate-critic-6/states-A.png`, `states-B.png`.

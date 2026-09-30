# Final gate: group 0 (13 routes)

Reviewer: senior GitHub design-systems critic (read-only; no code changed).
Inputs: `shots/final-gate-2/<route>/{light,dark}-{1440,390}.png` + `.json`, `docs/reference/<route>/…` (where github.com has a
counterpart), fresh live capture with states and measure in `shots/final-gate-critic-0/live/` (theme github-auto,
52 captures), crops in `shots/final-gate-critic-0/`, computed-style probes (`shots/final-gate-critic-0/probe.mjs`, read-only GETs).

## Audit logs (all 13 routes × 4 captures, both runs)

- HTTP 200 on every capture. 0 console errors, 0 warnings, 0 failed requests, `problems: []`.
- 0 unresolved CSS vars (only `--loading-size`, which has a fallback and matches no elements). 0 off-palette colours. 0 unlayered Gitea CSS.
- No horizontal overflow at 1440 or 390. Max CLS 0.0117 (home at 390). Everything else is 0 to 0.0026.
- Non-Octicon icons appear only in `org-settings-hooks`, inside the closed Add Webhook menu: `gitea-gitea`, `gitea-feishu`, `gitea-matrix`. These are brand logos and are covered by the ARCHITECTURE §6 exception, so this is not a defect.
- Masked icons are the documented IC-1 swaps: `octicon-project(-symlink)`, `octicon-info`, `octicon-diff`, `octicon-filter`, `octicon-triangle-down`, and file-tree `material-file`→`octicon-file`.
- final-gate-2 used a frozen clock, which is why it shows "4 months ago" and a Jan–Dec heatmap. The live run shows real times. This is not a theme defect.

## Scores

| route | light 1440 | dark 1440 | mobile 390 | GitHub ref |
|---|---|---|---|---|
| home | 8.5 | 8.5 | 8.5 | none (signed-in dashboard judged from knowledge) |
| site-admin-users | 8.5 | 8.5 | 8 | none |
| repo-settings | 8.5 | 8.5 | 8 | none (github repo settings from knowledge) |
| org-home | 8.5 | 8.5 | 8 | go-gitea |
| commit-detail | 8 | 8 | 8 | yes |
| wiki-page | 9 | 9 | 8.5 | yes |
| pr-commits-tab | 9 | 9 | 8.5 | yes |
| compare-two-tags | 8 | 8 | 8 | yes |
| user-profile-repositories-tab | 8.5 | 8.5 | 8.5 | yes |
| admin-monitor-stats | 8.5 | 8.5 | 8.5 | none |
| org-settings-hooks | 8.5 | 8.5 | 8.5 | none |
| packages-generic | 8.5 | 8.5 | 8 | none |
| milestone-issues | 8.5 | 8.5 | 8.5 | none |

Across the group, both schemes use Primer tokens correctly: header #f6f8fa / #010409, canvas #fff / #0d1117, borders #d1d9e0 / #3d444d, overlays #fff / #010409. The AppHeader, UnderlineNav (coral #fd8c73 active bar), NavList (4px accent marker), Box, buttons (28/32px, 6px radius, 12/14px 500) and diff colours all match Primer. The wiki and PR-commits pages measure identical to github.com, for example New page 75.5×28 at 12px/500 with #1f883d. Nothing in this group reads as recoloured Gitea. What remains are structural differences in the Gitea templates, plus a few component nits.

## Issues by route

### home (`shots/final-gate-2/home/*`)
- **minor, navigation**: The current page in the feed pagination is not rendered as a current page. It shows "1" as plain #1f2328 text with a transparent background, where Primer uses a filled #0969da pill with white text. Gitea emits `<a class="item">1</a>` with no `active` class and no `href`, so a rule like `.pagination .item:not(.navigation):not([href])` could style it. Crop: `shots/final-gate-critic-0/home-light-pag.png`.
- **nit, pages/people**: When the page loads, the repo filter input still shows the accent #0969da border, because Gitea focuses it from Vue. The 2px ring is deliberately removed (`.repos-search input:focus:placeholder-shown{outline:0}`), but the input still looks focused at rest, and github.com never shows that. If it is meant to look unfocused, the resting border colour should be kept too. Crop: `home-left-zoom.png`.
- **nit, pages/people**: The "admin ▾" context strip on the #f6f8fa band has no GitHub counterpart. The sidebar head is "Repositories 9 +", where GitHub shows "Top repositories" and a green New button. Both are acceptable Gitea structure.

### site-admin-users
- **nit, pages/settings-admin**: At 390px the h1 "User Account Management (Total: 5)" wraps to 3 lines beside the Create button. A Primer Subhead stacks the action below the heading on narrow screens. Crop: `site-admin-users-390.png`.

### repo-settings
- **minor, navigation/pages/settings-admin**: The settings NavList has no leading Octicons and no group headings. github.com repo settings shows a gear icon for General, a people icon for Collaborators, a webhook icon for Webhooks, and so on, under the headings Access and Code and automation. Crops: `repo-settings-light-1440-t0.png`, `repo-settings-390-a.png`.
- **nit, controls**: At 390px the Description textarea cuts off its third line mid-glyph ("user-provided test cases"). The auto height leaves a partial line visible. Crop: `repo-settings-390-a.png`.
- Modals (Transfer, Delete) render as a correct Primer Dialog with the flash-warn #fff8c5 / dark attention-muted colours and a full-width danger button. Crops: `rs-modal.png`, `rs-modal2.png`.

### org-home (ref `docs/reference/org-home`)
- **nit, pages/people**: At 390px the README box content is only 278px wide inside a 358px container, which leaves about 40px of inset per side. GitHub's Box-body uses 16px on mobile. Crop: `oh-390-a.png`.
- **nit, pages/people**: The right column opens with the green New Repository and New Migration buttons. GitHub's org overview sidebar starts with People. This follows Gitea's structure and is acceptable.

### commit-detail (ref yes)
- **minor, pages/repo**: The header structure differs from GitHub. GitHub shows "Commit 99cc347" as an h1 with the sha as a mono inline code, then an author line, then a Box containing the monospace commit message and parent/sha. Ours puts an 18px bold title inside the Box, with an "…" body toggle and a separate author row. This is recognisably GitHub-style, but it is not the same page. Crop: `cd-l.png`.
- **nit, code**: The diff file tree is collapsed by default. GitHub shows the file tree to the left of the diff. This is Gitea's default behaviour.

### wiki-page (ref yes)
- **nit, pages/repo**: The revision history is shown as "1 🕒" to the right. GitHub puts "· 1 revision" in the byline. The clone input has no "Clone this wiki locally" label. Crop: `wp-l.png`.

### pr-commits-tab (ref yes)
- **minor, icons**: The browse-at-this-commit button uses `octicon-file-code`. github.com uses `octicon-code` (`<>`). This is confirmed by the probe `browseIcons: ["svg octicon-file-code"]`. The same icon appears on every commit row in compare-two-tags. Crop: `pc-icons.png`.
- **nit, pages/issues-prs**: At 390px the tab strip clips "Files Changed 1" at the right edge. GitHub clips its tab strip the same way, so this is acceptable.

### compare-two-tags (ref yes)
- **minor, pages/repo**: The title is "Compare commits" with a border-bottom and no description. GitHub shows "Comparing changes" plus a muted description and no rule. We show a "74 Commits" Box header with tag labels, where GitHub uses a tab row (Commits 74 | Files changed 25). This follows Gitea's template structure. Crop: `ct-l.png`.
- **nit, pages/repo**: The commit sha in each row is plain monospace text. GitHub renders it as a bordered small button beside the copy button. Crop: `ct-l.png`.
- **minor, icons**: The `octicon-file-code` vs `octicon-code` difference from pr-commits-tab repeats on all 74 rows.
- The diff area (unified), the file tree with the attention-coloured diff-modified squares, the hunk rows and the dark diff colours all match the reference. Crops: `ct-l3.png`, `ct-l4.png`, `ct-390c.png`.

### user-profile-repositories-tab (ref yes)
- **nit, pages/people**: The organisations avatar row has no "Organizations" h2. GitHub labels this section. Crop: `up-l.png`.
- Everything else matches the reference: the 296px avatar, name at 24/600, login at 20/300 muted, the full-width Follow button, the vcard icons, and the UnderlineNav with counters. The filter menu (`st-up.png`) is a correct ActionMenu, although GitHub uses check marks where we use radio circles (nit, overlays).

### admin-monitor-stats
- No defects found. The page reads as a native Primer Box table in both schemes and at 390px. Crop: `am-l.png`.

### org-settings-hooks
- **nit, data-display**: The empty state is only a centred description in a Box. A Primer Blankslate would add a heading and a webhook icon. Crop: `osh-l.png`.
- The page heading says "Settings" rather than "Webhooks". That text comes from Gitea's `.Title` and cannot be fixed by the theme.

### packages-generic
- **nit, pages/actions-packages-projects**: At 390px the install command is clipped at "…/api/", and the code block shows no scroll affordance or copy button. GitHub's install box has a clipboard button. Crop: `pg-390.png`.

### milestone-issues
- **nit, pages/issues-prs**: "Close" is a danger button with red text. GitHub's "Close milestone" is a default button. Crop: `mi-l.png`.

## States checked (live run)
The following are all correct Primer in both schemes: create and avatar menus, the drawer, repo-row, feed-link and icon-button hovers, the heatmap tooltip, header and profile search focus rings (2px #0969da, offset −2px), the Browse Source hover, press and focus states, the Operations menu (overlay #010409, border #3d444d in dark), the profile Filter hover, press, focus and open states, the wiki Edit hover, and the repo-settings dialogs.
Crops: `home-create.png`, `home-avatar.png`, `home-drawer.png`, `st-home-misc.png`, `st-cd-ops.png`, `st-cd-btn.png`, `st-up.png`.

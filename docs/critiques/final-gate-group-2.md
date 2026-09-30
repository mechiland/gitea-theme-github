# Final gate, group 2 (13 routes)

Reviewer: final-gate critic 2. Theme: `github-auto`. Our screenshots: `shots/final-gate/<route>/`. References: `docs/reference/<route>/`, where they exist. Crops and live probes: `shots/final-gate-critic-2/`.

## How I checked

- I looked at all four captures of every route: light and dark at 1440, and light and dark at 390. Tall pages were cut into strips so the lower parts were checked too.
- I compared against the github.com reference wherever one exists: repo-code-file, file-view-markdown, tags, pr-files-changed-unified and action-run.
- I read all 52 JSON audit logs. Across the whole set:
  - 0 console errors, except the known one below.
  - 0 unresolved CSS variables.
  - 0 off-palette colours.
  - 0 horizontal overflow.
  - 0 unlayered Gitea CSS.
- Non-Octicon icons appear only in the documented exemptions: `gitea-running` in actions-empty-filter and `fontawesome-openid` in openid-signin. Both are listed in `docs/icons-audit.md`.
- file-view-markdown logs 20 failed requests and 20 console errors. All of them are external README badges and images blocked by the shooter (`ERR_BLOCKED_BY_CLIENT`). This is a test artefact, not a theme defect.
- Highest CLS values:
  - action-run at 390: 0.074
  - file-view-markdown at 390: 0.053
  - wiki-page-playground at 390: 0.0225

  All are below 0.1.
- The final-gate run did not capture states. I took them live for tags and action-run with `--states` (`shots/final-gate-critic-2/live/*/states`, contact sheet `states-sheet.png`). All states look correct.

## Scores

Score scale:
- 10: indistinguishable from github.com
- 8.5: matches, with nits
- 7: recognisably GitHub-inspired
- 5: recoloured Gitea

| Route | Light 1440 | Dark 1440 | 390 |
|---|---|---|---|
| explore-users | 8 | 8 | 8 |
| user-settings | 8 | 8 | 8 |
| repo-code-file | 8.5 | 8.5 | 8 |
| file-view-markdown | 8 | 8 | 8 |
| tags | 9 | 9 | 8.5 |
| wiki-page-playground | 8 | 8 | 8 |
| pr-files-changed-unified | 9 | 7.5 | 8 |
| action-run | 8.5 | 8.5 | 7.5 |
| org-teams | 7.5 | 7.5 | 7.5 |
| user-settings-security | 8 | 8 | 8 |
| repo-settings-deploykeys | 8 | 8 | 8 |
| actions-empty-filter | 7.5 | 7.5 | 8 |
| openid-signin | 8.5 | 8.5 | 8.5 |

## Major issues

### 1. Dark diff rows have their translucent backgrounds stacked twice (owner: `code`)

- **Where:** pr-files-changed-unified, dark, both widths. Any unified diff is affected.
- **Evidence:** `shots/final-gate/pr-files-changed-unified/dark-1440.png` compared with `docs/reference/pr-files-changed-unified/dark-1440.png`, pixel samples:

  | Part | Ours | github.com |
  |---|---|---|
  | Deletion code | rgb(57,28,31) | rgb(36,23,27) |
  | Deletion number | (100,40,40) | (84,35,38) |
  | Addition code | (22,56,34) | (18,38,29) |
  | Addition number | (31,82,44) | (28,67,40) |
  | Hunk | (21,40,67) | (17,29,46) |

  Light matches github.com exactly.
- **Cause (live probe):**
  - `tr.del-code` has `background-color: rgba(248,81,73,.1)`.
  - Each `td` in that row (`lines-code`, `lines-type-marker`, `lines-escape`) has the same 0.1 again.
  - The `lines-num` cells have 0.3 on top of the row's 0.1.

  In light the colours are opaque, so the stacking is invisible. In dark the 10% alpha is applied twice, giving about 19%.
- **Fix:** paint only the cells (make the `tr` transparent), or only the row. The rules are in `src/code/diff.css`, around lines 224–280. The token mapping is in `src/tokens/gitea-map.css:175-183`.

### 2. Markdown-source syntax colours leak into rendered `.md` previews (owner: `code`)

- **Where:** file-view-markdown, every fenced code block in a rendered `*.md` file view. Visible in `shots/final-gate-critic-2/fvm-light-script.png`.
- **What you see:** in the `<script type="module">` block:
  - `type` (`.na`) is `rgb(10,48,105)` and underlined. github.com shows the attribute in the entity colour, without an underline.
  - `script` (`.nt`) is plain `fgColor-default`. github.com shows it in green (`prettylights-syntax-entity-tag`).
- **Cause:** the selectors key on `.page-content:has(.breadcrumb > .active.section[title$=".md"]) .file-view`. That matches the rendered preview as well as the source view:
  - `src/code/syntax.css:95`: `:is(.nt,.o,.m,.nb){color:inherit}`
  - `src/code/editor.css:107`: `.na` gets string colour plus underline
- **Fix:** exclude `.markup` descendants. Or scope the rule to the source view only (`.file-view:not(.markup)` or `table.chroma`).

### 3. Actions list layout is not GitHub's (owner: `pages/actions-packages-projects`)

- **Where:** actions-empty-filter at 1440, both schemes (`shots/final-gate/actions-empty-filter/light-1440.png`). For comparison, see the github.com Actions layout in `docs/reference/actions-list/light-1440.png`.
- **github.com:**
  - A full-width split layout.
  - A sidebar at x=0–335 with a right border and an "Actions" heading.
  - The main column starts at x=360 with an "All workflows" h2, a "Showing runs from all workflows" subtitle and a "Filter workflow runs" input.
- **Ours:**
  - A centred container at x=104–1328, with no sidebar border and no page heading.
  - The Box starts right under the repo nav.
- The blankslate and the filter header row inside the Box are fine.

## Minor issues

4. **org-teams: card grid, not a Primer list** (owner: `pages/people`).
   - The team cards sit in a two-column grid. Their header heights differ: Owners is 62px because of the Leave button, core and triage are 55px.
   - This leaves a staggered layout with a 48px hole under the first card (live measurement: cards at y=282/282/456).
   - At 390, the Owners header wraps onto two lines while the others stay on one.
   - A native Primer version would be a single Box with one row per team.
   - Evidence: `shots/final-gate/org-teams/light-1440.png`, `shots/final-gate-critic-2/ot-l390.png`.

5. **Settings header offset differs between the Profile tab and the other tabs** (owner: `pages/people`).
   - `.gh-settings-header` has `margin-top` 32px on `/user/settings` and 24px on `/security` and `/account`. The avatar sits at y=98 vs y=90, so the whole page jumps 8px when you switch tabs.
   - Cause: `src/pages/people/profile.css:24`, `.user.profile > :first-child { margin-top: 32px }`. It also matches `.page-content.user.settings.profile`.
   - Fix: scope it with `:not(.settings)`.
   - Evidence: `shots/final-gate/user-settings/light-1440.png` vs `user-settings-security/light-1440.png`.

6. **Settings NavLists have no leading icons and no group headings** (owner: `navigation`, which owns `.ui.vertical.menu` settings sidebars).
   - Affected: user-settings, user-settings-security, repo-settings-deploykeys.
   - github.com's settings sidebars put a 16px Octicon before every item and group items under headings ("Access", "Code and automation", "Security"). Ours are text-only.
   - This is the clearest remaining sign that the settings pages are not github.com.

7. **user-settings-security has three primary (green) buttons** (owner: `pages/settings-admin`).
   - The buttons are "Enroll in Two-Factor Authentication", "Add Security Key" and "Add OpenID URI".
   - GitHub uses one primary action per view. The secondary adds should be default buttons.

8. **Deploy keys empty state is bare text** (owner: `pages/settings-admin`).
   - Ours shows "There are no deploy keys yet." as plain text under the subhead.
   - github.com shows a bordered Box/Blankslate.
   - The "Add Deploy Key" subhead button is 28px tall with 12px text.
   - Evidence: `shots/final-gate/repo-settings-deploykeys/light-1440.png`.

9. **Wiki "Pages" sidebar reads as markdown** (owner: `pages/repo`).
   - It is a bulleted list of underlined links.
   - github.com's wiki sidebar lists page titles without bullets or underlines.
   - The header buttons Edit / New Page / Delete Page are 28px.
   - Evidence: `shots/final-gate/wiki-page-playground/light-1440.png`.

10. **explore-users uses separate cards with 16px gaps** (owner: `pages/people`).
    - Each user is its own bordered card.
    - A Primer list (for example, github.com's user search results) is one Box with divided rows.
    - Evidence: `shots/final-gate/explore-users/light-1440.png`.

11. **pr-files-changed-unified at 390: the selected tab is off-screen** (owner: `navigation`).
    - The selected "Files Changed" tab is clipped at the right edge (only "Fil" is visible at x≈360).
    - The page loads with the active tab not visible.
    - Evidence: `shots/final-gate-critic-2/prf-l390.png`.

12. **action-run at 390: graph and sidebar** (owner: `pages/actions-packages-projects`).
    - The "Build" node is outside the graph viewport. Lint's outgoing connector dot points at nothing.
    - The full job sidebar is stacked above the summary. github.com collapses it into a "Summary ▾" menu.
    - CLS is 0.074, caused by `action-view-body`, `action-view-left` and `action-run-summary-stat` resizing.
    - Evidence: `shots/final-gate-critic-2/ar-l390.png`.

## Nits

- **action-run, dark** (owner: `pages/actions-packages-projects`): the graph nodes and the matrix box use `bgColor-default` rgb(13,17,23). github.com uses the overlay background rgb(21,27,35).
- **tags** (owner: `pages/repo`): the Box header reads "16 Tags" with no tag Octicon. github.com shows an Octicon followed by "Tags".
- **repo-code-file / file-view-markdown** (owner: `code`):
  - The file-tree column is inset. github.com's is flush-left with a border-right.
  - At 390 the file box keeps 16px gutters and a border. github.com's is full-bleed.
- **openid-signin** (owner: `pages/auth`):
  - The label reads "OpenID URI  *", with a double space before the asterisk.
  - Title case "Sign In" is locale text, so not a theme issue.
- **Mermaid** (owner: `markdown`): light mode uses Gitea's neutral grey theme. github.com uses Mermaid's default lavender. The iframe is out of reach of CSS.
- **Mobile UnderlineNav** (owner: `navigation`): when the selected tab is in overflow, the coral underline sits under the "…" button. Seen on tags, org-teams and the wiki.

## Tooling note (owner: integrator / tools/shoot)

The full-page captures at 390 go blank inside tall `<table>`s past about 17,270 device px.
- In `repo-code-file/{light,dark}-390.png`, lines 410–447 are empty.
- A live probe shows all 447 rows in the DOM.
- A live viewport screenshot at the bottom renders them correctly (`shots/final-gate-critic-2/live-rcf-390-bottom.png`).

This is not a theme defect. Future full-page gates should capture tall mobile pages in segments.

## What is right

- Tags is effectively identical to github.com in both schemes.
- The light unified diff matches github.com's diff colours exactly.
- The Actions run summary and graph match github.com's colours and structure.
- The code view header, tree, and syntax colours for Rust match.
- Rendered markdown (headings, code blocks, inline code, lists, link underlines) matches github.com's `markdown-body`.
- The settings header template reads as github.com's.
- The OpenID page matches the current github.com sign-in form: 40px controls and a full-width primary button.
- Dark mode has no light-only artefacts on any of the 13 routes.

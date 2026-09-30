# Final gate — group 1 (whole-site critic, theme github-auto)

Sources: `shots/final-gate-2/<route>/{light,dark}-{1440,390}.png` + `.json`. References: `docs/reference/<route>/`.
Extra live capture with states and measurements: `shots/final-gate-critic-1/live/` (`--measure --states`, theme github-auto, admin theme not changed).
Crops that back each finding: `shots/final-gate-critic-1/*.png`.

Scale: 10 = can't tell it apart from github.com, 8.5 = matches with nits, 7 = recognisably GitHub-inspired, 5 = recoloured Gitea.
The logged-out marketing header on the references is expected. Our logged-in header is judged against github.com's signed-in AppHeader.

## Audit logs (all 52 captures)

- **Clean on every route:** 0 unresolved vars, 0 off-palette colours, 0 non-Octicon icons, 0 unlayered Gitea CSS, no horizontal overflow at 390, max CLS 0.0029.
- **Console errors: all expected or caused by the test environment.**
  - not-found: the expected 404 document.
  - repo-home-readme-with-images-and-tables: 5 × `img.shields.io` `ERR_BLOCKED_BY_CLIENT`. The shoot tool blocks third-party requests, so the badges show their alt text.
  - pr-conversation-closed-unmerged: 1 × `dependabot-badges.githubapp.com`, same cause.
- **Token spot checks (pixels):**
  - header: `#f6f8fa` / `#010409`, with a 1px `#d1d9e0` / `#3d444d` bottom border
  - canvas: `#ffffff` / `#0d1117`
  - Box header: `#f6f8fa` / `#151b23`
  - primary button: `#1f883d` / `#238636`
  - danger flash: `#ffebe9` / `#25171c`
  - All of these match Primer.

## Scores

| route | light | dark | 390 |
|---|---|---|---|
| explore-repos | 8.5 | 8.5 | 8 |
| site-admin-config | 9 | 9 | 8.5 |
| not-found | 7 | 7 | 7 |
| repo-home-markdown-showcase-playground | 9 | 9 | 8 |
| branches | 8 | 8 | 8 |
| repo-home-readme-with-images-and-tables | 9 | 9 | 8 |
| pr-conversation-closed-unmerged | 8.5 | 8.5 | 8.5 |
| actions-list | 8.5 | 8.5 | 8.5 |
| org-members | 8.5 | 8.5 | 8.5 |
| user-settings-account | 9 | 9 | 8.5 |
| user-settings-orgs | 9 | 9 | 8.5 |
| org-projects | 8.5 | 8.5 | 8.5 |
| forgot-password | 8 | 8 | 8 |

## Findings (most severe first)

### M1 (major, `code`): the README box header wraps to two rows on mobile
- **Where:** repo home at 390, both schemes, on every repo.
- **What happens:** "README.md" takes a full row and the pencil edit button drops to a second row at the left. That makes a 2-row, about 66px header, where github.com's is a single row about 46px tall.
- **Cause:** `src/code/file-view.css` about line 284, inside the mobile media query: `.file-header .file-header-left { flex: 1 0 100%; }`. It was written for the blob-view header (info row above actions). It also matches the README header on repo home (`h4.file-header.flex-left-right` with only a pencil on the right).
- **Fix:** scope the rule to the file view (`.non-diff-file-content .file-header`, or `:not(#readme …)`).
- **Evidence:** `shots/final-gate-critic-1/rdm-01.png` (y≈520–560) and `mdm-01.png` (y≈500–545).

### M2 (major, `pages/repo`, template): the branches page lacks GitHub's structure
- **Missing compared with github.com:**
  - the "Branches" 24px page title
  - the Overview / Active / Stale / All UnderlineNav
  - the table header row (Branch · Updated · Check status · Behind|Ahead · Pull request) on a `#f6f8fa` / `#151b23` background
- **Action icons:** each row shows 5 inline icon buttons (branch, rss, download, pencil, trash). github.com shows trash plus a kebab menu.
- **What does match:** rows at 48px + 1px (GitHub 49), the BranchName pill (`#ddf4ff` / `#0969da`, mono 12px), and the ahead/behind bars.
- **Evidence:** `br-light.png` vs `br-ref-light.png`; `br-dark.png` vs `br-ref-dark.png`.
- **Fix:** the thead and title need a template or integrator change. The extra icons could fold into a kebab on the page.

### m1 (minor, `pages/repo`): section order on mobile repo home
- At 390 the whole sidebar sits between the file list and the README: Description, topics, Readme/MIT/size, the gitea-only "Search code" box, Releases, Languages.
- github.com mobile shows description, link and counts under the repo title, then files, then README, then Releases/Languages at the end.
- On our page the README starts around 1.5 screens further down than on github.com.
- **Evidence:** `rdm-01.png` vs the reference column in the same crop; `mdm-01.png`.

### m2 (minor, `data-display`): emoji-led descriptions wrap onto their own line in list rows
- `.items-with-main > .item .item-body` is `display:flex; flex-wrap:wrap` (Gitea `shared/flex-list.css`; the theme only changes gap and colour).
- A description such as `<span class="emoji">📁</span> Generate…` becomes two flex items. At 390 the text wraps under the lone emoji: octo-org/folderify on explore-repos, both schemes.
- github.com renders the emoji inline.
- **Fix:** make `.item-body` display:block (or add a `:has(> .emoji)` exception) when it holds a plain text description.
- **Evidence:** `shots/final-gate-critic-1/explore-m-00.png` (third card).

### m3 (minor, `data-display` / integrator): the 404 page is a generic blankslate
- **Ours:** a 24px alert Octicon, "404 Not Found" at 24px bold, and a muted sentence, centred in a mostly empty page.
- **github.com:** a full-width illustrated hero plus a "Find code, projects, and people" search box.
- The illustration is not licensable, but a Primer-native version would add the search field and use the Blankslate spacious variant.
- **Evidence:** `nf-00.png`, `nfd-00.png`, `nfm-00.png`.

### m4 (minor, `pages/actions-packages-projects`, template): Actions list is missing the page chrome
- **Missing compared with github.com:**
  - the sidebar "Actions" heading
  - the "All workflows / Showing runs from all workflows" title and subtitle
  - the "Filter workflow runs" input
- **What does match:** the run rows (79px vs 80px), the row kebab menu, the status SelectPanel and the pagination.
- **Evidence:** `act-light-0.png` vs `act-ref-light.png`; `act-dark.png`; states in `live/actions-list/states/`.

### m5 (minor, `navigation` / `pages/auth`): stray hamburger on logged-out pages
- Logged-out auth pages (forgot-password, and login too) keep a lone hamburger icon at top-left (x≈16, y≈16) at both widths.
- github.com auth pages have no header chrome at all.
- **Evidence:** `forgot-password-d-00.png`, `forgot-password-m-00.png`, `login-cmp-00.png`.

### m6 (minor, `pages/auth`): forgot-password message is unstyled
- With mail disabled, the message is plain centred text with no container.
- github.com's "Reset your password" puts its content in a bordered `#f6f8fa` Box, 340px wide.
- The validation-error state cannot trigger here because there is no form (`live/forgot-password/states/light-1440-validation-error-clip.png`).

### n1 (nit, `overlays`): flash icon wraps under the text on mobile
- In the danger flash at 390, the second text line wraps under the icon instead of aligning to the text column.
- github.com's Flash uses a grid/flex layout with a separate icon column.
- **Evidence:** `usam-01.png` ("Delete Your Account" flash).

### n2 (nit, `markdown`): Mermaid output
- **Light:** nodes use Gitea's neutral grey theme, where github.com uses its default lavender nodes.
- **Dark:** edge labels sit on grey chips.
- **Mobile:** the iframe keeps extra empty height under the scaled-down diagram, about 60 CSS px.
- These are iframe-rendered and need an integrator/JS change.
- **Evidence:** `md-06.png`, `mdm-08.png`.

### n3 (nit, `navigation`): header search and nav wording
- The header search placeholder reads "Search repos…" / "Search code…", where github.com reads "Type / to search" with a `/` hint.
- Nav labels use Gitea title-case, e.g. "Pull Requests", "Files Changed", "All Workflows". github.com uses sentence case ("Pull requests").
- These are locale strings, fixable only with a custom locale.

### n4 (nit, `pages/people`): nameless row alignment in user-settings-orgs
- In the "ai" row, which has no description, the name is top-aligned (text centre y≈191) while the 32px avatar is centred at y≈195.
- **Evidence:** `uso-light.png`.

### n5 (nit, `code` / template): README box header content
- The README box header shows "README.md" plus a pencil.
- github.com shows README | MIT license tabs and an outline (TOC) button.
- **Evidence:** `rd-00.png`.

## Per-route notes

- **explore-repos:** github.com /explore is a marketing feed with no equivalent page, so this is judged as a native Primer page.
  - Correct: the NavList with active bar and focus ring, bordered repo cards, topic pills, the Filter/Sort ActionMenus with single-select checks (`live/explore-repos/states/*sort-open*`), and the orange UnderlineNav on mobile.
  - Only real defect: m2.
- **site-admin-config:** reads like a Primer settings page.
  - Correct: the NavList with group headings and nested active item, 24px Subheads, key/value Boxes, and full stacking at 390.
- **repo-home-markdown-showcase-playground:** the GFM feature coverage matches github-markdown-css: headings, alerts, tables, task lists, kbd, footnotes, math, prettylights. The hr is 1px (`src/markdown/base.css` says this is deliberate).
  - Defects: mobile M1 and m1.
- **repo-home-readme-with-images-and-tables:** nearly identical to github.com at 1440. Page height is 10829 vs 10886, and the README column matches the reference to the pixel.
  - The broken badges come from the test environment.
  - Defects: mobile M1 and m1.
- **pr-conversation-closed-unmerged:** title, Closed StateLabel (91px wide on both), tabs with counters, diffstat, comment headers, timeline rail, editor toolbar and sidebar all match.
  - Differences: the extra "Pull request closed" box and missing timeline events come from Gitea's data and template, not the theme.
  - Dark: label contrast handling matches github.com.
- **org-members:** matches GitHub's People rows (48px avatars, 81px rows, 320px search). It lacks the "People" title and the Organization permissions box (template).
- **user-settings-account / user-settings-orgs:** a strong Primer settings match.
  - Correct: the avatar+name header with Profile button, NavList, Subheads, the 440px inputs, the red danger Subhead and the error flash.
- **org-projects:** the Box header with Open/Closed counts and the Blankslate read as native Primer.

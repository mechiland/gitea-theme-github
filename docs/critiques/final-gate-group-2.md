# Final gate: whole-site review, group 2

Reviewer: design-systems critic (final gate). Theme: `github-auto`, Gitea 1.27.3. Date: 2026-09-30.
Inputs: `shots/final-gate-2/<route>/{light,dark}-{1440,390}.png` + `.json` audits, `docs/reference/<route>/*` where a
github.com page exists. I also took live captures with states and measurements in `shots/final-gate-critic-2/live/`
(`--states --measure`, theme `github-auto`, admin theme not changed). Crops are in `shots/final-gate-critic-2/`.

Scale: 10 = indistinguishable from github.com, 8.5 = matches with nits, 7 = recognisably GitHub-inspired,
5 = recoloured Gitea. Pages with no GitHub counterpart are scored on whether they read as a native Primer page.
Expected differences, not scored: the logged-out marketing header and "Sign in" on the references, Gitea-only
copy and data (Title Case locale strings, 10-character SHAs, relative times, extra Gitea buttons), and the Gitea
footer.

## Audit logs (all 13 routes × 4 captures)

- Status 200 everywhere. There are no console errors, failed requests, unresolved `var()`s, off-palette colours,
  unlayered Gitea CSS or horizontal overflow, except as noted below.
- `file-view-markdown`: 21 console errors and 21 failed requests on every capture. All of them are
  `ERR_BLOCKED_BY_CLIENT` for external README images (raw.githubusercontent.com, badge SVGs). The shooter aborts
  third-party requests on purpose (`tools/shoot/shoot.mjs:235`). This comes from the harness, not the theme. It is
  also why the badges show as alt-text links and why the CLS is 0.058–0.063 at 390.
- `wiki-page-playground` at 390: CLS **0.165** (light) in the final-gate-2 run, 0.0489 / 0.0497 in my live rerun.
  The source is `details.gh-wiki-pages` in both runs. It is intermittent, but it crosses the 0.1 "poor" threshold.
- `openid-signin`: 2 non-Octicon icons (`fontawesome-openid`, in the heading and in the field label).
- Icons: every other route is Octicons only.

## Scores

| Route | GitHub ref | Light 1440 | Dark 1440 | Mobile 390 |
|---|---|---|---|---|
| explore-users | – | 8.8 | 8.8 | 8.7 |
| user-settings | – | 8.2 | 8.2 | 8.2 |
| repo-code-file | yes | 8.6 | 8.6 | 8.3 |
| file-view-markdown | yes | 8.6 | 8.6 | 8.2 |
| tags | yes | 8.8 | 8.8 | 8.6 |
| wiki-page-playground | – | 8.2 | 8.2 | 7.8 |
| pr-files-changed-unified | yes | 9.0 | 9.0 | 8.8 |
| action-run | yes | 8.7 | 8.7 | 8.2 |
| org-teams | – | 8.4 | 8.4 | 8.4 |
| user-settings-security | – | 8.1 | 8.1 | 8.1 |
| repo-settings-deploykeys | – | 8.2 | 8.2 | 8.2 |
| actions-empty-filter | – | 8.5 | 8.5 | 8.4 |
| openid-signin | – | 8.3 | 8.3 | 8.3 |

Dark mode is at parity with light on every route. The header (#010409), canvas (#0d1117), diff colours (hunk
`rgb(17,29,46)` / expander `rgb(12,45,107)` / deletion number `rgb(84,35,38)`) and file-tree folders
(`#9198a1`) are pixel-identical to the github.com dark references. None of the issues below is dark-only.

## Issues by route

### explore-users (8.8 / 8.8 / 8.7)
- **nit**: the header avatar carries a blue site-admin shield badge (`shots/final-gate-critic-2/us-hdr-l.png`).
  GitHub's AppHeader avatar has no badge. Owner: `navigation`. This applies to every signed-in route.
- **nit**: row avatars are vertically centred against the 2–3 line meta block (390:
  `shots/final-gate-critic-2/explore-users-390-pair.png`). Primer list rows top-align the avatar. Owner: `pages/people`.

### user-settings (8.2)
- **major**: the settings NavList has no leading Octicons. github.com/settings shows person / gear / paintbrush /
  shield-lock / key / organization … before every item, and ours shows text only
  (`shots/final-gate-2/user-settings/light-1440.png`, x 104–368, y 200–570). This is the strongest tell on every
  settings page. CSS can reach it: mask `::before` icons keyed on `a[href$=…]`. Owner: `pages/settings-admin` (icon
  data from `icons`).
- **minor**: the list opens with a "User Settings" group heading (12px/600 muted, y=177). GitHub's settings nav
  starts directly with "Public profile" and uses group headings only for the lower sections (Access, Code planning
  and automation, …). Owner: `pages/settings-admin`.
- **nit**: the page-header action reads "Profile". GitHub uses "Go to your personal profile". The copy is a Gitea
  locale key, so this is exempt. The avatar column that GitHub shows on the right of the form is not present
  (template). Owner: `pages/settings-admin`.

### repo-code-file (8.6 / 8.6 / 8.3)
- **minor**: the main column's right gutter is 32px and GitHub's is 16px. The code box's right edge is at x=1408,
  where github.com has it at x=1424 (measured on `light-1440.png` of both, y=400). Markdown bodies are therefore
  1005 wide instead of 1012. Owner: `pages/repo` (file-browser page layout).
- **minor** (known, FG-025 rejected): the branch picker and "Go to file" sit in the main column header instead of
  under "Files" in the tree pane, and the tree pane has no branch or search row
  (`shots/final-gate-critic-2/rcf-light-top.png` vs `rcf-ref-light-top.png`). Owner: `pages/repo` (template
  owned by Modern).
- **nit**: the file toolbar is `Raw | Permalink | History` + copy/download + edit/delete + RSS. GitHub has
  Raw + copy/download + edit▾ + symbols, and "History" lives on the latest-commit bar. These are Gitea features,
  but the RSS icon button at the far right has no GitHub analogue. Owner: `code`.
- **nit**: syntax tokens differ slightly (e.g. `BufRead, Error, ErrorKind` are orange on GitHub and plain here).
  This comes from Chroma's tokeniser, not the palette. Exempt.
- Mobile: the "Raw + icons" row wraps to a second line under the segmented control, where GitHub uses one
  kebab (`shots/final-gate-critic-2/rcf-390-light-vsref.png`). Owner: `code`.

### file-view-markdown (8.6 / 8.6 / 8.2)
- **minor** (390): the markdown body inside the file box has 16px side padding and GitHub has 32px. Measured
  `markdown-p` width is 356 vs 324 and `markdown-pre` is 312 vs 280 (`shots/final-gate-critic-2/live/file-view-markdown/light-390.measure.json`
  vs `docs/reference/file-view-markdown/light-390.measure.json`; crop `fvm-390-dark-mid.png`). Owner: `code`
  (`.file-view.markup` padding; coordinate with `markdown`).
- **nit**: the toolbar shows only "22 KiB". GitHub shows "595 lines (435 loc) · 21.8 KB" plus the outline (TOC)
  icon button. This is Gitea data, so no fix is expected. Owner: `code`.
- Markdown typography, headings, code blocks, copy buttons and lists match github.com at 1440 in both schemes
  (`fvm-light-ch1.png` vs `fvm-ref-light-ch1.png`). The broken badges are the harness's blocked external images
  (see audit section).

### tags (8.8 / 8.8 / 8.6)
- **nit**: the Box header reads "16 Tags" with no leading tag Octicon. GitHub shows `(tag) Tags`
  (`shots/final-gate-2/tags/light-1440.png` y=237 vs reference y=307). Owner: `pages/repo`.
- **nit**: search-button focus draws a 2px ring hugging the 32×32 icon button, flush with the input's left border.
  This reads as a clipped square inside the field (`shots/final-gate-critic-2/live/tags/states/light-1440-search-btn-focus-clip.png`).
  Owner: `controls`.
- The search focus, row hover, pagination and segmented control (`tags-states.png`) are correct.

### wiki-page-playground (8.2 / 8.2 / 7.8) (no GitHub counterpart for this content; judged against GitHub wiki)
- **minor** (390): the clone-URL input and the "Table of Contents" box touch with a 0px gap. The input's bottom
  border is at y=1088 CSS px and the box's top border is at y=1088, while every other box in the column has 24px
  between it and the next (`shots/final-gate-critic-2/wiki-page-playground-390-pair-1.png`). Owner: `pages/repo`.
- **minor** (390): layout shift of up to 0.165 CLS from `details.gh-wiki-pages` (our FG-022 template). It is
  intermittent (0.049 on rerun) but above 0.1. Reserve the box's height or avoid toggling `open` after load. Owner:
  `pages/repo`.
- **minor**: the "Pages" rows indent the link 37px (link x=1069, box x=1032) with nothing in the gutter. GitHub
  puts a disclosure chevron there for each page's headings, so here the indent looks accidental
  (`shots/final-gate-critic-2/wiki-side-l.png`). Either drop the indent to 16px or add the chevron. Owner:
  `pages/repo`.
- **nit**: the "Table of Contents" box uses the native `▼` details marker. Primer uses an Octicon chevron and
  GitHub has no such box. Owner: `markdown` / `pages/repo`.
- **nit**: the Mermaid light theme renders grey `#ececec` nodes. GitHub's default Mermaid theme is lavender
  (`#ECECFF` / `#9370DB`). Gitea sets the Mermaid theme in JS, and the diagram is in an iframe. Owner: `markdown`
  (probably exempt).

### pr-files-changed-unified (9.0 / 9.0 / 8.8)
- **nit**: the diffstat (`+3 −3 ■■■■■`) sits at the right of the file header. GitHub puts `6 ■■■■■` before the
  filename. Owner: `code`.
- **nit**: markdown lines in the diff are not syntax-highlighted (GitHub colours `choco | scoop` and the `### 4.2`
  heading; ours are plain). This is Chroma or upstream behaviour. Exempt.
- Hunk rows, expander cells, word-level highlights and line-number backgrounds are pixel-identical in both schemes.

### action-run (8.7 / 8.7 / 8.2)
- **minor**: the workflow graph draws no connector between Lint and Build. Only the two 3.5px port dots render
  (`shots/final-gate-critic-2/ar-graph-l.png`), where GitHub draws the edge. Root cause, from a DOM probe: the edge
  is `M 244 44 H 340` (bbox height 0), and it sits in `<g mask="url(#workflow-graph-edge-mask-ci.yml)">`. With
  objectBoundingBox mask units, a zero-height bbox masks the whole path. This is an upstream Gitea bug, but it
  shows on our page. `.workflow-graph .graph-svg g[mask]{mask:none}` would restore the line, because the nodes
  paint on top of it. Owner: `pages/actions-packages-projects`.
- **minor** (390): the full jobs sidebar (Summary, All jobs, Run Details) renders below the graph. GitHub mobile
  collapses it into a "Summary ▾" menu under the title (`shots/final-gate-critic-2/action-run-390-pair-1.png` vs
  `ar-ref-390.png`). Owner: `pages/actions-packages-projects`.
- **nit**: the matrix node shows "Matrix: Test" inside the card. GitHub renders it as a tab on the card's top edge.
  Owner: `pages/actions-packages-projects`.
- The job-hover (re-run icon) and back-link hover states are correct (`ar-states2.png`).

### org-teams (8.4)
- **minor**: the org identity row (avatar + "Octo Org") and the tabs are inset to the 1216 container (tabs start at
  x=112). Signed-in GitHub org pages put the UnderlineNav flush-left in the header band (x=16), as our repo tabs
  already do (`shots/final-gate-2/org-teams/light-1440.png` vs any repo route). The two header types are
  inconsistent. Owner: `navigation` / `pages/people`.
- **nit**: the right-hand meta column is ragged. "2 members · 5 repositories" starts at x=1098 on the Owners row
  (because of the Leave button) and at x=1158 on the other rows. Owner: `pages/people`.
- **nit**: member avatars are spaced 4px apart. GitHub teams use an overlapping AvatarStack. Owner: `data-display`.

### user-settings-security (8.1)
- **major**: same missing NavList Octicons as user-settings (`shots/final-gate-2/user-settings-security/light-1440.png`).
  Owner: `pages/settings-admin`.
- **minor**: 2FA is shown as prose + a single button. GitHub's "Password and authentication" puts the methods in
  a Box with one row per method (Authenticator app / Security keys, each with status + button). The "Security Keys"
  and "OpenID" sections here are bare form fields under a Subhead. Owner: `pages/settings-admin`.
- **nit**: the inline "WebAuthn Authenticator" link inside the paragraph is not underlined. Primer underlines
  inline links in body text. Owner: `foundation`.

### repo-settings-deploykeys (8.2)
- **major**: the repo-settings NavList has no Octicons (GitHub: gear General, people Collaborators, git-branch
  Branches, tag Tags, key Deploy keys, webhook Webhooks …), and it has a "Settings" group heading where GitHub has
  none (`shots/final-gate-2/repo-settings-deploykeys/light-1440.png` x 104–368). Owner: `pages/settings-admin`.
- **nit**: the empty state is a bare centred line ("There are no deploy keys yet."). GitHub's version adds a
  second, muted line with a docs link. Gitea copy, low priority. Owner: `pages/settings-admin`.

### actions-empty-filter (8.5 / 8.5 / 8.4)
- **minor**: the page has no heading ("All workflows" + "Showing runs from all workflows") and no "Filter workflow
  runs" input above the Box, so the Box floats directly under the tabs. GitHub always has the heading row
  (`shots/final-gate-2/actions-empty-filter/light-1440.png`). Gitea has the workflow name data, so a CSS-only
  `::before` title is not realistic. Owner: `pages/actions-packages-projects` (template request if it is wanted).
- The blankslate (24px circle-slash, 20px/600 "No results matched."), the Box header filters and the ActionList
  sidebar read as native Primer in both schemes.

### openid-signin (8.3)
- **minor**: `fontawesome-openid` appears twice. It is a legitimate brand logo, but GitHub auth pages never put an
  icon in the page heading or in a field label. Hide the icon in the heading (`h4.ui.top.attached > svg`) and in
  the label for GitHub themes. Owner: `pages/auth`.
- **nit**: the slim auth header shows a lone hamburger at top-left (x=32, y=32). github.com/login has no menu. This
  is deliberate (FG-063, keeps Gitea navigation) but it is a visible tell on every auth page. Owner: `navigation`
  / `pages/auth`.
- The heading (20px/600/30px), the 352×40 input, the 40px green button and the link row match github.com/login's
  measurements exactly.

## Cross-route summary (priority order)
1. **Settings NavList icons** (major, 3 routes here and every settings page): `pages/settings-admin`.
2. **Workflow-graph edges invisible** (upstream mask bug, one-line CSS workaround): `pages/actions-packages-projects`.
3. **Wiki mobile**: 0px gap between clone input and ToC box, and CLS up to 0.165: `pages/repo`.
4. **File view gutters**: 32px right gutter at 1440 (GitHub 16px) and 16px markdown padding at 390 (GitHub 32px):
   `pages/repo` / `code`.
5. **Org header inset vs repo header flush-left**: `navigation` / `pages/people`.
6. Nits: header admin badge, tags box-header icon, search-button focus ring, OpenID icons, diffstat position.

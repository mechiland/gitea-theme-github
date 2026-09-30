# Final gate: critic group 4 (whole-site gate, run final-gate-2)

Theme: `github-auto`. Sources: `shots/final-gate-2/<route>/` (full run), plus a fresh live run with `--measure --states` in
`shots/final-gate-critic-4/live/` and DOM probes (`shots/final-gate-critic-4/probe.mjs` with `q1.js` to `q5.js`). Crops and
side-by-sides are in `shots/final-gate-critic-4/*.png`. github.com references exist for login, repo-pulls and
release-detail, plus `crit-app-action-job`, `apx1-package-detail-npm`, `repo-issue` and `not-found`, which I used for
layout context. All other routes are judged on whether they read as a native Primer page.

Scale: 10 means indistinguishable from github.com, 8.5 means it matches with nits, 7 means recognisably GitHub-inspired, and 5 means recoloured Gitea.

## Audit logs (52 captures in final-gate-2, 52 in the live run)
- Console errors: none, except not-found-anon (1 per capture). That error is the expected `404` of the main document
  (`expectStatus: 404`).
- Failed requests: 0. Unresolved CSS vars: 0 (only `--loading-size` with a fallback, 0 matched elements).
  Off-palette colors: 0 on every capture. Unlayered Gitea CSS: 0.
- Non-Octicon icons: `fontawesome-openid` (login) and `gitea-npm` (package-detail-npm). Both are brand marks and
  deliberate exceptions under ARCHITECTURE.md §6.
- CLS: repo-pulls 390 0.002, file-view-image-playground 1440 0.0156 (source `footer.page-footer`, after the image loads),
  issue-new-playground 390 0.0088 (`.issue-content-right`). All are below 0.1, so these are nits.
- **Horizontal overflow: not-found-anon 390 (light and dark), document width 396 px against a 390 px viewport.** See below.
- Measured metrics against github.com (login, repo-pulls, release-detail): button, primary, input, link, counter, underline-nav
  and page-heading metrics match to the pixel (height, padding, radius, 14/12 px sizes, 500/600 weights, colors). The
  remaining systematic difference is `Mona Sans VF` on github.com against the system stack.

## Scores

| Route | Light 1440 | Dark 1440 | Mobile 390 |
|---|---|---|---|
| login | 9 | 9 | 8.5 |
| user-settings-keys | 8.5 | 8.5 | 8 |
| repo-pulls | 8 | 8 | 7.5 |
| file-view-image-playground | 8.5 | 8.5 | 7.5 |
| release-detail | 8.5 | 8.5 | 8.5 |
| issue-detail-playground-reactions-alerts-tables | 8.5 | 8.5 | 8 |
| pr-files-changed-split-playground-large-diff | 8.5 | 8.5 | 6.5 |
| package-detail-npm | 8 | 8 | 7.5 |
| repo-settings-collab | 8 | 8 | 7.5 |
| admin-orgs | 8.5 | 8.5 | 7.5 |
| action-job | 8.5 | 8.5 | 7.5 |
| issue-new-playground | 8 | 8 | 8 |
| not-found-anon | 8 | 8 | 6.5 |

## Issues (most severe first)

### Major
1. **not-found-anon, 390: the header overflows the viewport by 6 px** (navigation). `a.gh-app-header-signup` ("Register") spans
   left 315 to right 396 on a 390 px viewport, and `scrollWidth` is 396. `.gh-app-header-end` shrinks to 170 px (flex-shrink 1,
   min-width 0) although its children need 192 px (search link 32 + Sign In 63 + Register 81 + 2×8 gap). The start group
   keeps 176 px because `.gh-context-item` ("Page Not ...") only shrinks to 96 px. `/explore/repos` has a shorter crumb and
   does not overflow, so the bug depends on crumb length. Expected: the end group does not shrink and the crumb truncates
   further. PNGs: `shots/final-gate-2/not-found-anon/{light,dark}-390.png` (792 px wide) and `shots/final-gate-critic-4/nf-390.png`.
2. **pr-files-changed-split, 390: the split diff is kept and soft-wrapped into about 13-character columns** (code). The page is
   44,250 px tall at 390, against 9,236 px at 1440. Each Go line wraps over 4 to 6 rows (`shots/final-gate-critic-4/pfs-390-{0,1,2}.png`).
   github.com does not show a two-column wrapped diff at phone width: it uses unified, or a single scrolling column.
   Expected: at 390, fall back to unified rendering or `white-space: pre` with horizontal scroll per side.
3. **repo-pulls, 1440: left NavList sidebar ("All pull requests / Assigned to you / … / Milestones / Labels")** (pages/issues-prs,
   template ORC-9). The github.com PR list (`docs/reference/repo-pulls/light-1440.png`) has no sidebar. Its list is a centered
   1232 px column (x 104 to 1336). Ours is full-bleed, with the sidebar from 0 to 256 and the list from 280 to 1416. This
   is the largest layout difference on the page. Side by side: `shots/final-gate-critic-4/pulls-d-rows.png`.

### Minor
4. **Mobile UnderlineNav hides the active tab in the "…" overflow** (navigation). In repo-settings-collab (Settings),
   package-detail-npm (Packages), action-job (Actions) and file-view (fine, since Code is first), the only
   selected-state cue is the orange underline under the `…` button. github.com's UnderlineNav swaps the selected item into
   the visible set. PNGs: `shots/final-gate-critic-4/collab-390.png`, `pkg-390-0.png`, `aj-390.png`.
5. **file-view-image-playground, 390: the latest-commit bar and file box are full-bleed but keep their rounded corners and side
   borders** (code). `.non-diff-file-content` is at x=0, w=390, while `.repo-view-content` is at x=16, w=358 (probe `q1.js`). The
   breadcrumb above keeps its 16 px gutter, so the box looks misaligned and clipped. Pick one: a 16 px gutter, or true
   full-bleed with no radius and no side borders. `shots/final-gate-critic-4/fvi-390-zoom.png`.
6. **repo-pulls, mobile: the seven filter dropdowns wrap onto two rows inside the Box header** (pages/issues-prs).
   github.com collapses them behind a `…`. `shots/final-gate-critic-4/pulls-390-top.png`.
7. **repo-pulls: a branch-ref chip row (`main ← GhostCoder6969/honor-no-c…`) on every row** (pages/issues-prs). This is a Gitea tell.
   github.com shows `#358 · author opened …` plus checks and a Bot label. Consider muting the chips to plain muted text or hiding them.
8. **release-detail: the detail page reuses the list chrome** ("16 Releases | 16 Tags" segmented control, RSS Feed, New
   Release and a divider) where github.com shows the breadcrumb `Releases / v1.4.6`. The tag and commit meta sit above the box
   instead of inline in the byline (pages/repo). `shots/final-gate-2/release-detail/light-1440.png` compared with the reference.
9. **pr-files-changed-split: the inline review-comment row leaves its left half white (#ffffff)**, while the surrounding empty split
   cells are muted (#f6f8fa). See `shots/final-gate-critic-4/pfs-light-3.png` (tokens.ts) and `pfs-light-2.png` (code).
10. **pr-files-changed-split, 390: the "Files Changed 20" tab is clipped at the right edge** and its counter is not visible
    (navigation, `.ui.tabular.menu`). `pfs-390-0.png`.
11. **issue-detail, 390: comment headers wrap "ago" onto a second line** ("commented 4 months / ago") because the emoji and
    kebab buttons take the width (data-display, `.comment` header). github.com truncates or drops the verb. `idp-390-0.png`, `idp-390-1.png`.
12. **user-settings-keys: settings NavList items have no leading Octicons** (pages/settings-admin, template-bound). github.com's
    settings sidebar has an icon on every item. There is no empty-state Box ("There are no SSH keys associated with your
    account.") under the Subhead either. `shots/final-gate-2/user-settings-keys/light-1440.png`.
13. **repo-settings-collab: the Collaborators section is an empty Box with a centered input and button.** github.com uses a
    blankslate or a Box with an "Add people" action (pages/settings-admin). The disabled Remove buttons are correct Primer
    (danger fg at 50%, `#eff2f5` bg; probe `q2.js`).
14. **package-detail-npm: the title is `@octo-org/theme-tokens (1.0.0)`, all 600 weight with the version in parentheses.**
    github.com shows the package icon, the name at 600, the version muted at 400, and a `Latest` label
    (pages/actions-packages-projects). `docs/reference/apx1-package-detail-npm/light-1440.png`.
15. **action-job: there is no "Search logs" input in the job header**, and at 390 the job list stacks below the log instead of
    appearing as a job-name dropdown under the title (pages/actions-packages-projects; the Vue view limits this). `aj-390.png`.
16. **admin-orgs, 390: the 24 px heading "Organization Management (Total: 3)" wraps onto 3 lines next to the button, and the
    full admin NavList (about 460 px) comes before the content** (pages/settings-admin). `aorgs-390.png`.
17. **issue-new-playground: this is the classic layout with no page heading.** The current github.com form has a "Create new
    issue" h1 and "Add a title" / "Add a description" labels (pages/issues-prs, template-bound).

### Nits
18. login: "Sign In" and button text are 600/500 in the system font, while github.com uses Mona Sans. The metrics are identical
    (20px/600 heading, 40 px button). The footer has no `bgColor-muted` band (navigation `.page-footer`), and the hamburger
    sits alone at top left (the github.com login has no header).
19. repo-pulls: issue labels measure font-weight 600 with line-height 12px. Primer IssueLabel uses 500 with line-height 18px
    (data-display).
20. file-view-image: a lone "Code" segment appears for an image (FG-021 override, code), and the file info `676 B · 96x96px`
    is set in the monospace font where github.com uses sans (code).
21. pr-files-changed-split: the rename-only file `web/styles/main.css → base.css` has an empty body and no collapse chevron. github.com shows
    "File renamed without changes." (code).
22. release-detail: "Downloads" has no counter (github.com: "Assets 8"). "Source Code (ZIP)" is bold throughout (Gitea
    string). At 390 the `hr` under the byline is missing (pages/repo).
23. not-found-anon: the "Page Not Found" crumb in the header is Gitea-only (navigation). The page body is a clean Primer blankslate.

## States checked (live run)
The login focus, hover, press, disabled and validation states, the add-SSH-key panel, the Compare menu, the action-job
step-open, step-hover and gear menu, and the new-issue title-focus and preview states all render on-palette and in Primer
style in both schemes. The dark overlays use `--overlay-bgColor` #010409 from the generated primitives (probe `q5.js`).

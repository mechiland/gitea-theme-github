# Final gate, group 3 (whole-site critic)

Theme: `github-auto`. Sources: `shots/final-gate/<route>/{light,dark}-{1440,390}.png` plus JSON audits. References are in `docs/reference/<route>/` where they exist. I took live captures with `--states --measure` into `shots/final-gate-critic-3/live/`. All crops and zooms are in `shots/final-gate-critic-3/`.

## Audit logs (all 13 routes, 52 captures)
- Console errors, failed requests, unresolved vars, off-palette colours and horizontal document overflow: **0 across all 52 captures**.
- CLS is 0 everywhere except admin-repos (0.0011 at 1440, 0.002 at 390; source td/th). That value is negligible.
- Non-Octicon icons: `gitea-colorblind-blueyellow` ×4 appears inside the closed theme menu on user-settings-appearance. `gitea-npm` ×1 is the package-type label on packages-org. Masked icons are Octicon masks, so they are fine.
- Capture artefacts (not theme defects):
  - At 390 the full-page PNG of file-view-large-file-playground is blank from line 410 downward. A live probe renders lines 740–797 correctly (`live-file-bottom-390.png`), so this is Chromium's full-page limit.
  - Some lazy avatars show as empty circles in full-page shots. Examples: the Participants avatar on repo-issue at 390, dave-qa on the PR at 390, and the composer avatar on the PR at 1440.

## Scores (10 = indistinguishable; 8.5 = matches with nits; 7 = GitHub-inspired; 5 = recoloured Gitea)

| route | light | dark | 390 |
|---|---|---|---|
| explore-orgs | 8 | 8 | 8 |
| user-settings-appearance | 8.5 | 8.5 | 8.5 |
| repo-issue | 8.5 | 8.5 | 7 |
| file-view-large-file-playground | 9 | 9 | 8 |
| releases | 8.5 | 8.5 | 8 |
| issues-list-closed | 9 | 9 | 8 |
| pr-conversation-playground-large-diff-reviews | 8 | 8.5 | 7 |
| packages-org | 8 | 7.5 | 8 |
| admin-repos | 7 | 7 | 7.5 |
| user-settings-applications | 8.5 | 8.5 | 8.5 |
| admin-dashboard-config-settings | 8.5 | 8.5 | 8 |
| repo-create | 7.5 | 7.5 | 7.5 |
| reset-password-badcode | 9 | 9 | 8.5 |

## Issues, by severity

### Major
1. **admin-repos: the table is clipped at 1440** (owner: pages/settings-admin).
   - `.ui.attached.table.segment` has clientWidth 934 but scrollWidth 1052 (measured live).
   - The "Created" column is cut to "Sep 2…" and the operations column is off-screen behind a scroll container with no visible scrollbar.
   - GitHub never scrolls a data table at desktop width. Tighten the cell padding (Primer DataTable uses 8px 16px) and/or let the long columns wrap.
   - Evidence: `shots/final-gate/admin-repos/light-1440.png` x=1290–1328.
2. **Mobile comment header wraps to 3 rows** (owner: data-display `.comment` header shell; pages/issues-prs if the fix is issue-scoped).
   - At 390, `.timeline-item.comment .comment-header` is 85.3px tall (measured). The layout is name + "commented 6 years ago", then "(Migrated from github.com)", then the reaction/kebab icons on a third row.
   - GitHub keeps one ~40px row, with the timestamp truncating and the actions on the right.
   - Evidence: `shots/final-gate/repo-issue/light-390.png` y=850–1025; the same problem on the PR at y=1010–1090.
3. **PR review conversation box breaks the 16px mobile gutter** (owner: pages/issues-prs, review.css).
   - `.code-comments-list .conversation-holder` has left=4px, while comment boxes have left=16px (measured at 390).
   - Evidence: `pr-conversation-playground-large-diff-reviews/light-390.png` y≈5820.
4. **Invisible Reply icon (light)** (owner: pages/issues-prs, review.css).
   - The `.comment-form-reply` button is restyled to the default variant, but its svg keeps the primary icon colour. Computed svg colour is `rgba(255,255,255,0.8)` on a `#f6f8fa` button, so the icon is invisible and leaves a 16px hole before "Reply".
   - In dark the icon is pure white instead of `fgColor-muted`.
   - Evidence: `zoom-pr-reply.png`.

### Minor
5. **Org header has no bottom divider** (owner: navigation).
   - On packages-org, the header background stops at y=166 with no 1px line. In dark the header is the same colour as the page, so the tabs float with no separation.
   - The repo header has a `borderColor-muted` line at y=173.
   - Evidence: `shots/final-gate/packages-org/dark-1440.png`.
6. **Dependency select and + button heights differ** (owner: pages/issues-prs).
   - In the issue sidebar the "Add dependency…" select is 32px tall (y 1077–1108) but the attached + button is 28px (y 1077–1104), which leaves a notch.
   - Evidence: `zoom-issue-dep-light.png`; the same control appears on the PR.
7. **Timeline commit rows use monospace for the summary** (owner: pages/issues-prs).
   - `a.muted.title-full-link` uses ui-monospace at 13.3px. GitHub uses the sans UI font for the commit message and mono only for the SHA.
   - Evidence: PR 1440, y=1055/1087/2254.
8. **File info bar is monospace** (owner: code).
   - The line/size/language strip reads "798 lines · 39 KiB · Go" and has `.file-info.tw-font-mono`. GitHub uses 12px sans.
   - Evidence: `file-view-large-file-playground/light-1440.png` y=328.
9. **Mobile pagination shows only the current page** (owner: navigation).
   - Releases (2 pages) and issues-list-closed (3 pages) show only `|< < [1] > >|` at 390, with the other page numbers hidden. GitHub's mobile pagination shows Previous/Next with labels.
10. **Mobile PR tab row is clipped** (owner: pages/issues-prs).
    - The third tab shows as "± Fi" at the right edge with no fade or scroll affordance.
    - Evidence: `pr-conversation…/light-390.png` y=940.
11. **Mobile inline review comment header stacks its icons** (owner: pages/issues-prs).
    - The reaction and kebab icons sit one above the other on the right (y≈975/1035 at 2x).
12. **Mobile issue list shows per-row checkboxes** (owner: pages/issues-prs).
    - They cost about 50px of title width. GitHub hides bulk-select on narrow screens.
13. **repo-create is a boxed Gitea form** (owner: pages/repo).
    - The layout is an attached "New Repository" header box. GitHub's /new is unboxed, with a 24px "Create a new repository" heading, a subtitle and a divider.
    - The help text is capped at about 550px, which gives ragged double-line captions ("…named \".profile\" / or …") even at 1440.
14. **Release meta wraps badly on mobile** (owner: pages/repo).
    - The line breaks as "released this / 2 years ago / · 3 commits…", starting a line with an orphan "·".
    - Evidence: `releases/light-390.png` y≈965–1065.
15. **Banner editor toolbar on admin config (mobile)** (owner: pages/settings-admin).
    - The toolbar wraps to two rows, and its group separators leave dangling vertical rules.
    - Evidence: `admin-dashboard-config-settings` 390, y≈2970–3060.

### Nits
- explore-orgs: each org is a separate bordered card with 16px gaps, where GitHub uses list rows with 1px dividers. The left sidebar's vertical rule ends at y=788 instead of reaching the footer (pages/people).
- packages-org: package names use `fgColor-default` where GitHub uses a Link colour. Metadata links are bold and underlined. The npm label uses a brand svg, not an Octicon (pages/actions-packages-projects; icons).
- user-settings-appearance: the theme menu has no scroll affordance past "Modern Light". There are 4 `gitea-colorblind-*` non-Octicon icons (icons).
- repo-issue: the labels SelectPanel has no title row. The markdown toolbar has H1/H2/H3 glyphs where GitHub has a single heading icon (pages/issues-prs).
- file view (390): the line-number gutter is about 88px wide, and the latest-commit bar drops the commit message (code; pages/repo).
- admin config: the ToggleSwitch sits mid-row (x=723), where GitHub puts it at the row end (pages/settings-admin).
- reset-password: the heading "Account Recovery" is 20px semibold versus GitHub's auth heading. There is no visible "Sign in" button in the 390 header (pages/auth; navigation).

## What is already at GitHub level
- Every colour sampled matches Primer, including the Box header (`#f6f8fa` / `#151b23`) and the diff hunk, addition and num backgrounds.
- The UnderlineNav selected bar (`#fd8c73`), NavList, overlays and label chips in dark are all correct.
- reset-password closely mirrors github.com/login. The file view and issue list are close matches too.

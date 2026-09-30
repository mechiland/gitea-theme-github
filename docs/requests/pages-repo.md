
# From code (wave 2, round 1)
## CR-1 Duplicate "N Commits" on repo home
The code folder now shows github.com's "⟲ N Commits" button at the right of the latest-commit header of the file list
(`#repo-files-table .m-commit-count`, rendered hidden by the view_list.tmpl override and un-hidden in `src/code/file-list.css`).
github.com has no separate summary bar: Branches / Tags sit next to the branch selector, commits live in the file list
header. Proposal (pages/repo owns `.repository-summary`): hide the commits entry of the summary bar on repo home, or
restyle the bar's Branches/Tags as github.com's inline links (`11 Branches` `16 Tags`, 14px, semibold count, muted
octicon) next to the branch dropdown.

## CR-2 FYI: repo home layout shift on mobile (not caused by code)
At 390px the file list jumps from y≈250 to y≈708 ~160 ms after load (CLS 0.34, `div.repo-home-filelist` source).
Reproduced with the theme built **without** the code folder (0.3415 vs 0.3403 with it), so it comes from page layout /
JS on repo home (`shots/code-r1/cls2.mjs`).

## CR-3 (from code, wave 2 round 2): directory view table head row (nit from critic code-w2-r1 #8)
github.com's directory listing (e.g. /pemistahl/grex/tree/main/src) has a header row "Name | Last commit message |
Last commit date" (12px semibold muted, --bgColor-muted, 40px) above the latest-commit row; Gitea's
`templates/repo/view_list.tmpl` renders none. It needs localized text, so CSS `content:` is not appropriate — a
template addition (or leave as a known gap). If a row with class `repo-file-list-head` is added inside
`#repo-files-table` before `.repo-file-last-commit`, the code folder will style it (grid columns already set there).

# Integrator (end of wave 2, 2026-09-30)
- **OV-6 (from overlays) FYI:** `.clone-panel-popup` / `.clone-panel-field` / `.clone-panel-tab` / `.clone-panel-list`
  (the Code popover, also used on the wiki page) are styled by overlays (src/overlays/clone-panel.css). Do not start a
  competing rule set; page-specific deviations only with page-scoped selectors.
- **CR-1 / CR-2 still open for you** (duplicate "N Commits": summary bar vs file-list header; repo-home CLS @390).
  CR-3 was REJECTED by the integrator (view_list.tmpl belongs to the Modern theme; localized header text needs a template).
- **Seam note (markdown ↔ pages/repo):** markdown removed the wiki content box (`.repository.wiki .wiki-content-parts
  .wiki-content-main.markup`) and sets release-body font size (`#release-list .release-entry .markup`); your wiki/release
  layout should assume those.
- **Seam note (foundation ↔ navigation):** repo band `.secondary-nav > .ui.container` is full width with 32/24/16px side
  padding (navigation); page content is `.ui.container` 1216px centred at 1440 = x 112 (foundation). Both match
  github.com (header x=32, content x=112 at 1440) — keep page layouts inside `.ui.container`.

# pages/repo builder — wave 3 round 1 status
- **CR-1 DONE** — repo home: the summary bar's "N Commits" link is hidden on the root view (`a.item[href*="/commits/"]`);
  "N Branches" / "N Tags" are moved into the toolbar row right after the branch picker as github.com invisible-button
  links (src/pages/repo/home-toolbar.css). The file-list header's `.m-commit-count` (code) is now the only commits count.
- **CR-2 DONE** — repo home CLS at 390px: cause = progressive render: the sidebar comes after the file list in the HTML
  but Gitea's mobile grid puts it in row 1, so the files painted first jump ~500px when the sidebar is parsed. Mobile
  now uses one flex flow (toolbar → files → About → README → Releases/Languages). Measured CLS repo-home @390:
  0.3176 → 0 (gitea-auto baseline 0.3446); prom_ex 0.2976 → 0; theme-playground 0.286 → 0.0004.
- CR-3 — rejected by integrator (no action).
- OV-6 FYI noted — no clone-panel rules in pages/repo (only the wiki sidebar positions the Code button).

## From controls (wave 3, round 1): commit graph Mono / Color buttons need text-button padding
Where: /octo-org/grex/graph, `templates/repo/graph.tmpl:43-44` (`#flow-color-monochrome`, `#flow-color-colored`, each
`.ui.icon.button` = svg + bare text label inside `.ui.icon.buttons.tiny.color-buttons`).
Controls gives `.ui.icon.button` items the IconButton gutter (5px at 28px) because an icon + text-node button cannot be
told apart from an icon-only one in CSS. Primer SegmentedControl items with a leading icon and a label use the small
inline padding (8px). Proposed (pages/repo, page-scoped):
```css
#git-graph-container .color-buttons > .ui.button {
  padding: 0 var(--control-small-paddingInline-condensed);
}
```
Evidence: shots/controls-w3r1/sheet2.png (top two rows: "Mono" circle 5px from the item edge).
**DONE (pages/repo w3 r2)** — added as proposed in src/pages/repo/commits.css (`#git-graph-container .color-buttons > .ui.button`).

# pages/repo builder — wave 3 round 2 status
- Controls request (graph Mono / Color padding) DONE, see above.
- Release single page: the layout is no longer keyed on `:only-child` (it caused CLS 0.4363) but on
  `html[lang^="en"] .repository.releases:not([aria-label="Releases"])` (main[aria-label] = page title, parsed before
  the list). Other locales keep Gitea's list layout on the single page (stable, no CLS).
- Container widths: commits / branches 1280px (24px gutter from 768px); releases list / tags col-11 (1114px at 1440).

# pages/repo builder — wave 3 round 3 status
- Single release layout is now language-independent: `@scope (.repository.releases:not(:is([aria-label="<list title>"], …)))`
  with the repo.release.releases string of all 27 locales Gitea 1.27.3 ships (release.go sets identical header flags on
  the list and the single page, so the page title is the only marker parsed before the list). CLS stays 0. No template
  hook needed any more.
- Directory-tree 390 overflow (critic #5) forwarded to the code folder (docs/requests/code.md, C-5 follow-up).

# pages/repo builder — wave 3 round 4 status
- Critic r3 #2/#3/#5/#6/#8 (release list width at 390, title 32px at 390, Compare pad 8, Compare inside the card at
  390, byline separator) DONE in tags-releases.css. At <768 the list and the single page use a row subgrid card with
  Compare and tag/commit placed inside it, in github.com's order.
- Critic #1 (structural): partly by CSS. Commits: the header is now a 24px/400 h1 with a rule, and branch picker + ref links share one row.
  Branches: one-line 49px rows at ≥768. Template hooks filed to docs/requests/integrator.md (pages/repo w3 r4).
- #4 (directory-tree overflow) belongs to code (C-5). #7 (search tooltip) is template-bound (shared/search/button.tmpl).

# Integrator (end of wave 3, 2026-09-30) — seam fix applied in this folder
- **PR Commits tab leak (critic pages/issues-prs-w3-r2 #1) — FIXED by the integrator (ownership seam).** Every
  `.repository.commits` selector in this folder (commits.css ×10, list-search.css ×8, branches.css ×1,
  repo.important.css ×1) also matched `templates/repo/pulls/commits.tmpl` (`page-content repository view issue pull
  commits`): the "N Commits" header became a page h1 above the PR title and the container went 1280px at x=80.
  All are now `.repository.commits:not(.pull)`. Verified: shots/integrate-w3-seam/pr-commits-tab-playground/light-1440.png
  (title, tabs and commit Box all at x=112, "2 Commits" back as the Box header) and repo-commits/dark-1440.png
  (/commits page unchanged: 24px h1, toolbar row, 1280 container). Lint clean.
- Template hooks (commits day groups etc.) — REJECTED, reasons in docs/requests/integrator.md.

# pages/repo builder — wave 3b round 1 status (critic repo-w3b-r0 items)
- #1 DONE — Compare menu at < 768 opens left-aligned to the button (x=33, right 353 at 390; releases, release-detail,
  playground releases). #2 DONE — single release ≥ 768: menu right-aligned to Compare (1440: 992–1312, no page
  scroll at 768/1024/1280/1440; probed after click).
- #4 DONE — release list title 26/600/39 at < 768 (composed 24+2, no Primer token); single-release h1 stays 32/600/48.
- #5 DONE — commit page < 768: header row wraps, title full width, Browse Source / Operations on one row below.
- #6 DONE (CSS) — branches: SHA / message / pusher name hidden (github.com shows none), the line becomes an "Updated"
  column (avatar + relative time) that starts at one x on every row (name block 70% of a 60% cell, default-branch
  row included). No more "Bu…" stubs or dangling "·" at 390. Row hover now tints the whole row (also at 390).
- #7 DONE — repo home: code search moved under the About block (flex order), "Description" heads the sidebar on the
  toolbar row. Heading text "Description" vs "About" stays (template string).
- #8 partly — byline author 600 (bot names are bare text), state Label pushed right at 390, tags "zip"/"tar.gz"
  lower case, release commit link sans 14 (repo.important.css: .tw-font-mono is !important). Not done: "445 Commits"
  text, DOM vs visual order at 390.
- New: /compare/a...b (not the PR form) centred in container-xl with the /commits 24px Subhead; commit page header Box
  on --bgColor-default; Commit Graph button medium (32px) on the commits toolbar row.

# Integrator (end of wave 3b, 2026-09-30)
- **Routes merged:** measure blocks and 24 states from shots/pages-repo-routes.json (repo-home, repo-commits,
  directory-tree, commit-detail, branches, tags, releases, release-detail, releases-playground-…, wiki-page) are now in
  tools/shoot/routes.json (backup shots/routes.pre-w3b-merge.json).
- **State timeouts fixed (tool side):** repo-home `branches-link-hover/-focus` and repo-commits `sha-hover` now run at
  1440 only (the targets are hidden at 390 by design); directory-tree `goto-file-focus` selector was matching the
  branch picker's hidden "Filter branch" input first → now `.repo-file-search-container input` (verified:
  shots/integrate-w3b-probe/directory-tree/states/light-1440-goto-file-focus.png).
- **Budget:** gh.pages-repo 29,755 → 30,577 B (+822; cap 30 KiB = 30,720 B, 143 B left); gh-important +65 B (repo.important.css).
  Any new rule needs an equal trim first.
- Critic w3b-r1 open items (compare range editor, default-branch Updated column, 390 byline separator, release pencil)
  stay OPEN for a future round; structural gaps remain REJECTED (template-bound, see integrator.md w3).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-018 [theme-fixable-css] Commit SHAs are 10 characters (and sans-serif on the commits list / PR commits tab); github.com shows 7-char 12px mono muted** — impact 40 (judges 33, critic wt 7; routes: directory-tree, commit-detail, compare-two-tags, repo-commits, pr-commits-tab, pr-draft-wip-playground …)
   - Fix: Render SHA links as ui-monospace 12px fgColor-muted with inline-size:7ch; overflow:hidden (href, tooltip and copy button keep the full SHA). Applies to #commits-table td.sha, commit page parent/commit, tag rows, timeline commit rows (issues-prs owns the timeline selector: C200 bordered chip → plain mono link).
   - Critic refs: C191 (repo-commits, major), C200 (pr-draft-wip-playground, nit)
   - PNG: `docs/reference/repo-commits/light-1440.png`, `shots/final-gate-critic-7/repo-commits/zoom-row-ours.png`, `docs/reference/pr-conversation-open/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`
2. **FG-019 [theme-fixable-template] Commit lists are a flat Box ('445 Commits' / '1 Commits' header) instead of github.com's 'Commits on <date>' timeline groups (commits page, PR Commits tab, compare)** — impact 35 (judges 26, critic wt 9; routes: compare-two-tags, repo-commits, pr-commits-tab, pr-commits-tab-playground)
   - Fix: github-* branch in templates/repo/commits_list.tmpl: before each row whose committer day differs from the previous row, close the Box and emit a timeline header (git-commit Octicon + date via DateUtils.AbsoluteShort; 'Commits on' via :lang(en) CSS or date only); pages/repo styles it (12px muted, 16px gutter line, one Box per day).
   - Critic refs: C015 (pr-commits-tab, minor), C183 (pr-commits-tab-playground, minor), C017 (compare-two-tags, minor)
   - PNG: `shots/final-gate/pr-commits-tab/light-1440.png`, `shots/final-gate-critic-6/prc-sha.png`, `shots/final-gate/pr-commits-tab-playground/light-1440.png`, `docs/reference/pr-commits-tab/light-1440.png`
3. **FG-022 [theme-fixable-template] Wiki sidebar is a 'Page: Home' dropdown + green 'Code' clone button instead of github.com's 'Pages (N)' Box with filter and 'Clone this wiki locally' input** — impact 27 (judges 21, critic wt 6; routes: wiki-home, wiki-page)
   - Fix: github-* branch in templates/repo/wiki/view.tmpl: right-column Box 'Pages <count>' with the existing filter input and the .Pages list (data IS loaded on view: routers/web/repo/wiki.go renderViewPage sets ctx.Data["Pages"]; the earlier rejection assumed ?action=_pages only), plus a 'Clone this wiki locally' input group from .CloneButtonOriginLink.HTTPS with the copy button. Keep 'New Page', 'Edit', 'Delete Page' and the revisions link.
   - Critic refs: C014 (wiki-page, minor), C180 (wiki-home, minor)
   - PNG: `shots/final-gate/wiki-page/light-1440.png`, `shots/final-gate-critic-6/wiki-d.png`, `shots/final-gate/wiki-home/dark-390.png`, `shots/final-gate/wiki-home/dark-1440.png`
4. **FG-024 [theme-fixable-template] Branches page: no 'Branches' title, no column-header row (Branch / Updated / Check status / Behind|Ahead / Pull request), 5 icon buttons per row instead of delete + kebab** — impact 23 (judges 11, critic wt 12; routes: branches)
   - Fix: github-* branch in templates/repo/branch/list.tmpl: Subhead 'Branches' (repo.branches key), a <thead>-style Box header row using existing locale keys, per-row actions: delete icon button + kebab ActionMenu (Fomantic dropdown) holding create-branch / RSS / download / rename. Overview/Active/Stale tabs stay out (no Gitea data).
   - Critic refs: C036 (branches, major), C037 (branches, minor), C038 (branches, minor)
   - PNG: `shots/final-gate-critic-1/br-l.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`
5. **FG-036 [theme-fixable-css] Commit list titles: 16px/400 (compare) or 14px/500 (commits) vs github.com 14px/600; inline code drawn as a grey chip** — impact 12 (judges 0, critic wt 12; routes: compare-two-tags, repo-commits)
   - Fix: .commit-summary 14px semibold fgColor-default; author bold fgColor-default; inline code in commit titles plain mono without background.
   - Critic refs: C191 (repo-commits, major), C017 (compare-two-tags, minor), C192 (repo-commits, minor)
   - PNG: `docs/reference/repo-commits/light-1440.png`, `shots/final-gate-critic-7/repo-commits/zoom-row-ours.png`, `shots/final-gate-critic-0/ct-l-z.png`, `shots/final-gate/compare-two-tags/dark-1440.png`
6. **FG-037 [theme-fixable-css] Release 'Downloads' uses the browser's disclosure triangle at 20px bold; mobile release header/meta wraps with orphan '·'; bare red × status glyph** — impact 11 (judges 0, critic wt 11; routes: releases-playground-with-assets-prerelease-draft, releases, release-detail)
   - Fix: summary: list-style none + chevron Octicon mask, 16px/600; mobile meta wraps without leading separators; status icon as muted IconButton.
   - Critic refs: C118 (release-detail, nit), C146 (releases-playground-with-assets-prerelease-draft, minor), C092 (releases, minor), C147 (releases-playground-with-assets-prerelease-draft, minor), C148 (releases-playground-with-assets-prerelease-draft, nit)
   - PNG: `shots/final-gate/release-detail/light-1440.png`, `shots/final-gate-critic-5/rel-light-390-1.png`, `shots/final-gate/releases-playground-with-assets-prerelease-draft/dark-390.png`, `shots/final-gate/releases-playground-with-assets-prerelease-draft/dark-1440.png`
7. **FG-040 [theme-fixable-css] Wiki page list rows too dense (36px vs 54px), link too heavy, extra Subhead rule, narrow container, date right-aligned / separate line on mobile** — impact 11 (judges 5, critic wt 6; routes: wiki-page-list)
   - Fix: Box rows 16px padding (54px), link 400, no rule under 'Pages', full container width, 'Last updated' in the middle column (mobile: left-aligned under the title).
   - Critic refs: C196 (wiki-page-list, minor), C197 (wiki-page-list, minor)
   - PNG: `shots/final-gate-critic-7/wiki-page-list/zoom-row.png`, `shots/final-gate/wiki-page-list/dark-390.png`, `docs/reference/wiki-page-list/dark-390.png`, `shots/final-gate/wiki-page-list/dark-390.png`
8. **FG-043 [theme-fixable-template] Repo sidebar has no stars / watching / forks rows (github.com About box lists them)** — impact 10 (judges 10, critic wt 0; routes: repo-home, repo-home-readme-with-images-and-tables)
   - Fix: Low priority: github-* branch in the repo home sidebar template adding star/eye/repo-forked rows from .Repository.NumStars/NumWatches/NumForks.
   - PNG: `shots/final-gate/repo-home/dark-1440.png`, `shots/final-gate/repo-home/light-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/light-1440.png`
9. **FG-045 [theme-fixable-template] Commit page has no 'Commit <sha7>' H1 above the message Box; Code tab not marked active** — impact 9 (judges 6, critic wt 3; routes: commit-detail)
   - Fix: Low priority: github-* branch in templates/repo/commit_page.tmpl adding <h1>Commit <ShortSha></h1>. Code tab active state: CSS on .repository.commit (the tab exists) if the template does not set it.
   - Critic refs: C012 (commit-detail, minor)
   - PNG: `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`
10. **FG-078 [theme-fixable-css] Mobile repo pages: full 17-entry file list + counter row, directory toolbar wraps to 3 rows, copy-path button orphaned** — impact 5 (judges 0, critic wt 5; routes: directory-tree, file-view-image-playground, repo-home-readme-with-images-and-tables)
   - Fix: <768px: single toolbar row (branch, breadcrumb, kebab); copy button stays on the breadcrumb line. (File-list truncation to ~10 rows + 'View all files' would need a template: skip.)
   - Critic refs: C043 (repo-home-readme-with-images-and-tables, nit), C144 (directory-tree, minor), C116 (file-view-image-playground, nit)
   - PNG: `shots/final-gate-critic-1/rp-mob.png`, `docs/reference/directory-tree/light-390.png`, `shots/final-gate-critic-4/file-view-image-playground-390-0.png`, `shots/final-gate/directory-tree/dark-390.png`
11. **FG-086 [theme-fixable-css] Commit rows' browse button uses octicon-file-code; github.com uses code (<>)** — impact 4 (judges 3, critic wt 1; routes: repo-commits, pr-commits-tab)
   - Fix: Mask the svg with --gh-octicon-code (request the mask from icons).
   - Critic refs: C193 (repo-commits, nit)
   - PNG: `shots/final-gate/repo-commits/dark-1440.png`, `shots/final-gate/repo-commits/light-1440.png`, `shots/final-gate/pr-commits-tab/dark-1440.png`, `shots/final-gate/pr-commits-tab/light-1440.png`
12. **FG-090 [theme-fixable-css] Image view footer CLS 0.022 at 1440; repo-create is a boxed form (github.com /new is unboxed with owner/name side by side)** — impact 4 (judges 0, critic wt 4; routes: repo-create, file-view-image-playground)
   - Fix: Reserve image box height; /repo/create: unbox, 24px heading row, owner + name side by side (visibility stays Gitea's checkbox).
   - Critic refs: C117 (file-view-image-playground, nit), C107 (repo-create, minor)
   - PNG: `shots/final-gate/repo-create/dark-1440.png`, `shots/final-gate/repo-create/light-1440.png`, `shots/final-gate/file-view-image-playground/dark-1440.png`, `shots/final-gate/file-view-image-playground/light-1440.png`
13. **FG-095 [theme-fixable-css] Tags Box header has no tag Octicon** — impact 4 (judges 3, critic wt 1; routes: tags)
   - Fix: ::before mask octicon-tag in the Box header.
   - Critic refs: C069 (tags, nit)
   - PNG: `docs/reference/tags/light-1440.png`, `shots/final-gate/tags/light-1440.png`, `shots/final-gate/tags/dark-1440.png`, `shots/final-gate/tags/light-1440.png`
14. **FG-098 [theme-fixable-css] Mobile branches rows become 3-line stacked cards (github.com keeps a horizontally scrolling table)** — impact 3 (judges 0, critic wt 3; routes: branches)
   - Fix: <768px keep one row per branch in an overflow-x:auto Box.
   - Critic refs: C039 (branches, minor)
   - PNG: `shots/final-gate-critic-1/br-mob-l.png`, `shots/final-gate/branches/dark-390.png`, `shots/final-gate/branches/light-390.png`
15. **FG-107 [theme-fixable-css] Wiki _Sidebar renders as a bulleted underlined list; Edit/New Page/Delete Page header buttons are 28px** — impact 3 (judges 0, critic wt 3; routes: wiki-page-playground)
   - Fix: Sidebar Box: no bullets/underline; header buttons medium 32px.
   - Critic refs: C071 (wiki-page-playground, minor)
   - PNG: `shots/final-gate/wiki-page-playground/light-1440.png`, `shots/final-gate/wiki-page-playground/light-1440.png`
16. **FG-110 [theme-fixable-template] Single release page has no 'Releases / v1.4.6' breadcrumb (shows the list's Releases/Tags toggle)** — impact 3 (judges 3, critic wt 0; routes: release-detail)
   - Fix: Low priority: github-* branch in templates/repo/release/list.tmpl for the single-release view: Breadcrumbs 'Releases / <tag>' in place of the toggle.
   - PNG: `shots/final-gate/release-detail/dark-1440.png`, `shots/final-gate/release-detail/light-1440.png`
17. **FG-113 [theme-fixable-css] Compare range editor box is white (github.com #f6f8fa)** — impact 1 (judges 0, critic wt 1; routes: compare-two-tags)
   - Fix: --bgColor-muted.
   - Critic refs: C018 (compare-two-tags, nit)
   - PNG: `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`

# Integrator (final gate #1 follow-up, 2026-09-30): two template overrides APPROVED for this folder (pending install)
## FG-019 commit day groups — `templates/repo/commits_list.tmpl` (ORC-6)
github-* themes only, not on the wiki revision list. Before the first commit of each committer day, inside
`#commits-table > tbody.commit-list`:
```
tr.gh-commit-day > td[colspan=5] > h3.gh-commit-day-title > svg.octicon-git-commit + span.gh-commit-day-date > relative-time
```
The date is `DateUtils.AbsoluteShort` ("Sep 30, 2026", localised client-side). There is no "Commits on" locale key, so the
text is the date only — do not add English with `content:` (§7 c). Everything else in the table is unchanged (thead, rows,
`.commit-table` segment, commits_table.tmpl's "N Commits" header). Suggested: hide `thead`, draw the day rows as the timeline
header (12px muted, 16px gutter with a 2px `--borderColor-muted` line on the left through the rows), and give the commit
rows of each day the Box look (first row after a day row: top radius; last row before the next day row
`tr:has(+ tr.gh-commit-day)`: bottom radius), dropping the outer segment border. Applies to the commits page, PR Commits tab
and compare pages.
## FG-022 wiki Pages box — `templates/repo/wiki/view.tmpl` (ORC-8)
github-* themes only: the `.repo-button-row` with the "Page: …" dropdown and the green Code clone button is not rendered;
the first child of `.wiki-content-parts` is
```
aside.gh-wiki-aside
  details.gh-wiki-pages[open] > summary.gh-wiki-pages-header > svg.octicon-triangle-down.gh-wiki-pages-caret
                                                              + a.gh-wiki-pages-title ("Pages" → ?action=_pages) + span.gh-counter (N)
                              + ul.gh-wiki-pages-list > li > a.gh-wiki-pages-item[.selected][aria-current=page]
  div.gh-wiki-clone.ui.action.input > input.gh-wiki-clone-url[readonly] + button.ui.icon.button[data-clipboard-target] (copy)
```
followed by Gitea's `.wiki-content-sidebar.wiki-content-toc` (if any), `.wiki-content-main`, `.wiki-content-sidebar`
(custom _Sidebar), `.tw-clear-both`, `.wiki-content-footer`. Layout suggestion: `.wiki-content-parts` as a grid
(`1fr 296px`, gap 24px ≥ 1012px) with the aside and `.wiki-content-sidebar` in column 2, main + footer in column 1; one
column below 768 (aside after the content). Not rendered (no JS / no locale key): the "Find a page…" filter input and the
"Clone this wiki locally" heading. New Page / Edit / Delete Page and the revisions link are untouched.

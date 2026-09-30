
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

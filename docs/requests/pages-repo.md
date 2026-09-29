
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

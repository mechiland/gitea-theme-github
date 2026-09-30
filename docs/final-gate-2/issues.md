# Final gate #2 — deduplicated, ranked issue list (loop iteration 2)

Inputs: `docs/final-gate-2/raw.json` (8 whole-site critic reports, 101 routes, 198 issues: 15 major, 91 minor, 92 nit, 0 blocker), 1213 blind-judge reasons (8 judges × 38 pairs = 304 judgments, **304 correct**: identification 100% on every route and variant), `docs/final-gate-2/scores.json`. Reasons were joined with the blind key (route, scheme, page/content variant) and mapped to issues with per-issue patterns (scratchpad `fg2_defs.py` / `fg2_map.py`, extending gate 1’s); 1212/1213 reasons map to at least one issue (the unmapped one: “B's split diff gutter and hunk colors differ from GitHub's” — critic C151 measured the repo-pull-files diff colours pixel-identical to github.com in both schemes, so it is not filed).

**Ranking:** impact = judge-count + Σ critic severity weight (blocker 12, major 6, minor 3, nit 1); ties → weakest affected route (lowest min(light, dark, 390) critic score) first. judge-count = number of judge reasons citing the tell; a reason naming several tells counts for each, so counts overlap. Critic ids `C###` are positions in the **gate-2** raw.json (not gate 1’s). Column “Gate 1” = the FG-### item this continues. Machine-readable: `docs/final-gate-2/issues.json`.

**Classes:** inherent 19, theme-fixable-css 70, theme-fixable-template 13, tooling 3. Inherent classes are carried over from gate 1 unchanged (same keys, titles and reasons; only judge patterns extended). `tooling` = not a theme defect (capture/seed/build checks), owner integrator/tools.

**Budget reminder:** github-auto is 288.9 KB of the 300 KB cap (gate 295, target 285; STATUS.json themeSizes, revision 85fbd66d9d). Every folder trims before it adds; the settings NavList icons (FG2-014) were refused in loop 1 for budget alone.

## Read this first

- **Identification is still 100%, and it is still mostly inherent.** 19 inherent issues carry 2276 of the judge-reason citations (Gitea strings, Title Case, relative dates, Gitea-only controls, GitHub-only features, migrated data, the logo and “Powered by Gitea”, and the logged-out reference (197 reasons; it now also covers “Gitea header” — the installed signed-in AppHeader vs the logged-out marketing bar — and “no repo title row” on sub-pages, which signed-in github.com also only shows on the overview). None of these may be hidden.
- **Biggest theme-fixable levers:** FG2-014 settings NavList icons (critic weight 37, 3 majors; budget-blocked in loop 1), FG2-015 file toolbar text buttons (24 reasons), FG2-018 browse icon file-code→code (11 reasons + 4 critics; mask already exists), FG2-021 “Commits on” prefix (19 reasons, CSS `:lang(en)` content), FG2-020 mobile UnderlineNav (weight 20), FG2-022 Actions headings (13 reasons, CSS `:lang(en)` content instead of the rejected template), FG2-025 releases left column (CSS: the 390 layout already does it), FG2-026 wiki clone label (14 reasons), FG2-027 PR list must drop the sidebar (edit of our own override).
- **The 15 critic majors** (no blockers) — table below: 12 theme-fixable-css, 2 theme-fixable-template (C028 in FG2-016, still rejected; C096 in FG2-027, an edit of our own override), 1 inherent (C178 blame age strip, carried in FG2-001 as in gate 1).
- **Last template slot (8 of 8):** proposed for FG2-023 — override `templates/repo/issue/navbar.tmpl` to give Labels and Milestones the Issues NavList (18 judge reasons; weakest route 8.5). It is the highest-impact template item that passes all §7 criteria; the two above it are blocked (FG2-016 branches table: no locale keys for its column headers; FG2-019 tree-pane branch picker: Modern-owned template; FG2-044 directory header, lower, is Modern-owned too). Impact is moderate, so the orchestrator may keep the slot instead — nothing else below it is worth it. Spec: “Template decision” below.
- **Integrator tooling (user-requested):** FG2-105 shared page-class leak check (page-folder scopes such as `.repository.commits`, `.repository.pull`, `.dashboard.issues` reach several Gitea templates; two user-reported leaks). Not scored (impact 0) but first in the integrator’s list. Also FG2-043 seed markers (smoke runs “Update SMOKE.md … pushed by admin” fill the Actions list) and FG2-102 pair canvas padding.
- **Our own selector leaks** show up in the critic list too: FG2-034 (the blob-header mobile rule hits the README header, 2 majors) and FG2-027 (our issue-list override applies the NavList to PRs). The leak check should also cover component folders’ over-broad selectors where cheap.

## Critic majors (15)

| Critic | Route | Critic owner | Issue | Class | Owner here |
|---|---|---|---|---|---|
| C025 | repo-home-markdown-showcase-playground | code | FG2-034 README box header wraps to two rows at 390 | theme-fixable-css | code |
| C028 | branches | pages/repo | FG2-016 Branches page lacks GitHub's title, UnderlineNav and table header | theme-fixable-template | pages/repo |
| C030 | repo-home-readme-with-images-and-tables | code | FG2-034 README box header wraps to two rows at 390 | theme-fixable-css | code |
| C044 | user-settings | pages/settings-admin | FG2-014 Settings NavList has no leading Octicons | theme-fixable-css | navigation |
| C067 | user-settings-security | pages/settings-admin | FG2-014 Settings NavList has no leading Octicons | theme-fixable-css | navigation |
| C070 | repo-settings-deploykeys | pages/settings-admin | FG2-014 Repo settings NavList lacks Octicons and adds a 'Settings' heading | theme-fixable-css | navigation |
| C080 | releases | pages/repo | FG2-025 Desktop keeps the classic left meta column; current github.com has Release list nav and in-card tag/commit/Compare | theme-fixable-css | pages/repo |
| C092 | repo-create | pages/repo | FG2-063 New-repo form sits in a boxed card with a gray Box-header; github.com/new is an unboxed page | theme-fixable-css | pages/repo |
| C096 | repo-pulls | pages/issues-prs | FG2-027 Left NavList sidebar not present on github.com PR list | theme-fixable-template | pages/issues-prs |
| C106 | pr-files-changed-split-playground-large-diff | code | FG2-058 Mobile: split diff soft-wraps into ~13-char columns | theme-fixable-css | code |
| C118 | not-found-anon | navigation | FG2-054 390: header overflows viewport by 6px (Register button right=396) | theme-fixable-css | navigation |
| C124 | directory-tree | pages/repo | FG2-030 @390 toolbar wraps into 3 rows | theme-fixable-css | pages/repo |
| C125 | directory-tree | code | FG2-060 @390 latest-commit bar truncates authors and the connector word | theme-fixable-css | code |
| C178 | blame-playground-multiple-authors | code | FG2-001 No blame age heat strip and no Older/Newer legend | inherent | integrator/tools |
| C192 | org-settings-labels | pages/issues-prs | FG2-046 Empty state is not a Primer Blankslate | theme-fixable-css | pages/issues-prs |

## Template decision (last §7 slot): FG2-023 Labels / Milestones NavList

**Proposal:** one new override, `templates/repo/issue/navbar.tmpl` (upstream is 4 lines: the `Labels | Milestones` `h2.ui.compact.small.menu`).
It is included by `repo/issue/labels.tmpl`, `milestones.tmpl`, `milestone_new.tmpl` and `choose.tmpl`. `PageIsMilestones` alone is not
enough: NewMilestone / EditMilestone (which render `milestone_new.tmpl`, also including the navbar) set it too
(routers/web/repo/milestone.go l.100-167); only the Milestones list sets `.State` ("open"/"closed"). So the github branch is gated on
`or .PageIsLabels (and .PageIsMilestones .State)`; milestone_new, choose and every non-GitHub theme render upstream bytes.

```
{{if and (StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-") (or .PageIsLabels (and .PageIsMilestones .State))}}<nav class="gh-issues-nav gh-issues-nav--side" aria-label="{{ctx.Locale.Tr "repo.issues"}}">
  <a class="gh-issues-nav-item" href="{{.RepoLink}}/issues">{{svg "octicon-issue-opened"}}<span>{{ctx.Locale.Tr "repo.issues"}}</span></a>
  <div class="gh-issues-nav-divider" role="separator"></div>
  <a class="gh-issues-nav-item{{if .PageIsMilestones}} selected{{end}}"{{if .PageIsMilestones}} aria-current="page"{{end}} href="{{.RepoLink}}/milestones">{{svg "octicon-milestone"}}<span>{{ctx.Locale.Tr "repo.milestones"}}</span></a>
  <a class="gh-issues-nav-item{{if .PageIsLabels}} selected{{end}}"{{if .PageIsLabels}} aria-current="page"{{end}} href="{{.RepoLink}}/labels">{{svg "octicon-tag"}}<span>{{ctx.Locale.Tr "repo.labels"}}</span></a>
</nav>{{else}}…upstream 1.27.3 navbar.tmpl verbatim…{{end}}
```
(no trailing newline after `{{end}}`, as in the other overrides. Items mirror github.com’s issues sidebar that Gitea can back:
Issues, then Milestones / Labels; the `?type=` filters stay on the Issues list, which already has them.)

- **§7 check:** a — continues gate-1 FG-017 (impact 45, the largest per-page template tell), 18 judge reasons now on labels + milestones;
  b — `.RepoLink`, `.PageIsLabels` (issue_label.go Labels), `.PageIsMilestones` + `.State` (milestone.go Milestones) are in ctx; c — existing keys only (repo.issues, repo.milestones,
  repo.labels); d — else-branch = upstream bytes (verify with gitea-auto / modern / studio on /octo-org/grex/labels,
  /milestones, /milestones/new, /issues/new/choose); e — 8 of 8.
- **Layout (pages/issues-prs):** `.repository:is(.labels,.milestones) > .ui.container` becomes a 256px + 1fr grid (24px gap);
  `.issue-navbar` (labels) / the milestones header row get `display: contents` so the nav takes column 1 (`grid-row: 1 / span 20`) and
  everything else column 2. < 768 the nav collapses exactly like the Issues list. Reuses `.gh-issues-nav*`. Scope with the page-class
  leak check: `.repository.milestones` must not reach `.repository.milestone-issue-list` or `milestone_new`.
- **Not proposed (still rejected):** FG2-016 branches table (no locale keys for the column headers), FG2-019 tree-pane picker and FG2-044 directory header
  (Modern-owned files), FG2-037 commit H1, FG2-039 labels rows, FG2-041 README|license tabs, FG2-048 About stats, FG2-053 release breadcrumb,
  FG2-057 profile README caption, FG2-070 profile counts (PPL-T1 rejected), FG2-082 new-issue heading — all lower impact or blocked. FG2-027 is an edit of
  our existing `repo/issue/list.tmpl` override and needs no slot.

## Ranked list (all classes)

| Rank | Id | Class | Owner | Judges | Critic wt | Impact | Gate 1 | Title |
|---|---|---|---|---|---|---|---|---|
| 1 | FG2-001 | inherent | integrator/tools | 372 | 7 | 379 | FG-001 | github.com-only features absent: Checks tab, Achievements, star Lists / starred topics, Explore Topics/Trending/Collections, Pinned + sparklines + Top languages, Sponsor, Contributors / Used by, release sha256 + reactions, Actions Usage/Caches/Workflow+Event filters, blame age legend, code folding, new PR-files toolbar (File filter / Jump to), branch Active/Stale data |
| 2 | FG2-002 | inherent | foundation | 257 | 4 | 261 | FG-002 | Gitea wording differs from github.com ('Description' vs 'About', 'Stable' vs 'Latest', 'Downloads' vs 'Assets', 'Compare commits', 'Browse Source', 'Starred Repositories', 'Members', '445 Commits', '8 Open / 51 Closed', 'Release details', 'Register now.'…) |
| 3 | FG2-003 | inherent | pages/repo | 212 | 0 | 212 | FG-005 | Gitea-only repo controls present: extra repo tabs (Packages, Projects, Releases, Wiki, Activity), RSS buttons, Add File, compare icon, Manage Topics, repo size, sidebar code search, Commit Graph, 'This Branch' search, Operations, tag pills in commit titles, branch-row actions (RSS/download/rename) |
| 4 | FG2-004 | inherent | foundation | 197 | 2 | 199 | FG-006 | Title Case UI strings: 'Pull Requests', 'Files Changed', 'New Issue', 'New Page', 'Sign In', 'Remember This Device', 'Run Details', 'Source Code (ZIP)'… |
| 5 | FG2-005 | inherent | integrator/tools | 197 | 0 | 197 | FG-010 | Reference pages are logged-out github.com: marketing header (Platform/Solutions…), 'Sign up for free' banner instead of a composer, 'New issue' instead of 'Edit', marketing footer, Google/Apple SSO |
| 6 | FG2-006 | inherent | foundation | 190 | 0 | 190 | FG-009 | Relative dates ('4 years ago') where github.com shows absolute dates ('on May 17, 2023'); KiB/MiB sizes and no '(N loc)' |
| 7 | FG2-007 | inherent | integrator/tools | 167 | 0 | 167 | FG-003 | Migrated data differs: '(Migrated from github.com)' on comments, no timeline events, no Verified / CI check counts / Bot badges / linked-PR icons, commit authors shown by full name, different counts |
| 8 | FG2-008 | inherent | navigation | 166 | 0 | 166 | FG-004 | 'Powered by Gitea' footer attribution |
| 9 | FG2-009 | inherent | pages/issues-prs | 123 | 4 | 127 | FG-008 | Gitea-only issue/PR features present: sidebar Time Tracker, Due Date, Dependencies, Reference, Pin/Lock/Delete, 'No Branch/Tag Specified', WIP hint; merge box, Viewed/Review progress, bulk-select checkboxes, Project/Type filters, branch chips, H1/H2/H3 toolbar |
| 10 | FG2-010 | inherent | pages/actions-packages-projects | 101 | 0 | 101 | FG-013 | Gitea-only controls on releases/tags/wiki/actions: RSS Feed + New Release, counted Releases/Tags toggle, 'Search tags', left release metadata column, 'Delete Page', wiki revision counter, 'Default Branch: master', Actor/Status/Branch run filters |
| 11 | FG2-011 | inherent | pages/people | 99 | 2 | 101 | FG-012 | Gitea-only people/org features present: org Members/Teams/Worktime tabs, New Repository/Migration/Team buttons, RSS + Follow on org, profile email/'Joined on'/Block user/gear, member admin (Hidden, Member Role, 2FA, Make visible/Remove/Leave), explore Repositories/Users/Organizations nav, Filter/Sort |
| 12 | FG2-012 | inherent | navigation | 80 | 0 | 80 | FG-016 | Gitea teacup logo in the header, on the sign-in page and in the footer |
| 13 | FG2-013 | inherent | foundation | 76 | 0 | 76 | FG-014 | Upstream pluralisation / word-order bugs: '1 commits', '1 changed files', '1 Participants', 'merged 1 commits from main into main' |
| 14 | FG2-014 | theme-fixable-css | navigation | 0 | 37 | 37 | FG-050 | Settings / admin NavList: no leading 16px Octicons (every settings page), and user/repo settings open with a 'User Settings' / 'Settings' group heading github.com does not have |
| 15 | FG2-015 | theme-fixable-css | code | 24 | 3 | 27 | FG-021 | File toolbar: 'Raw \| Permalink \| History' as text buttons plus copy/download/edit/delete/RSS icons; lone 'Code' segment on images; file info in mono; no lines/loc |
| 16 | FG2-016 | theme-fixable-template | pages/repo | 16 | 9 | 25 | FG-024 | Branches page: no 'Branches' title, no Overview/Active/Stale/All tabs, no column-header row, 5 icon buttons per row, 'Default Branch' box |
| 17 | FG2-017 | inherent | integrator/tools | 24 | 1 | 25 | FG-023 | README badges, logos, demo GIFs and the Dependabot score render as broken alt-text links |
| 18 | FG2-018 | theme-fixable-css | pages/repo | 11 | 13 | 24 | FG-086 | 'Browse at this commit' button uses octicon-file-code on every commit row (commits, PR Commits tab, compare, compare form); github.com uses octicon-code (<>) |
| 19 | FG2-019 | theme-fixable-template | code | 20 | 4 | 24 | FG-025 | Branch picker, 'Go to file' and 'Add File' sit in the content toolbar; github.com puts branch picker + file search at the top of the Files tree pane |
| 20 | FG2-020 | theme-fixable-css | navigation | 0 | 20 | 20 | FG-029 | 390: repo / profile / org UnderlineNav hides its icons below 1200px and the selected tab ends up inside '…' (only the overflow button carries the underline) |
| 21 | FG2-021 | theme-fixable-css | pages/repo | 19 | 1 | 20 | FG-019 | Commit day groups read 'May 31, 2021'; github.com reads 'Commits on May 31, 2021' (commits page, PR Commits tab, compare) |
| 22 | FG2-022 | theme-fixable-css | pages/actions-packages-projects | 13 | 6 | 19 | FG-049 | Actions list: no 'Actions' sidebar heading and no 'All workflows' title + 'Showing runs from all workflows' subtitle above the runs Box (also on the empty-filter state) |
| 23 | FG2-023 | theme-fixable-template | pages/issues-prs | 18 | 0 | 18 | FG-017 | Labels and Milestones pages lack the issues NavList sidebar the Issues list now has; they show the Labels \| Milestones toggle instead (github.com: left sidebar with Milestones / Labels selected) |
| 24 | FG2-024 | inherent | pages/people | 14 | 3 | 17 | FG-031 | 404 is a Primer Blankslate; github.com shows the illustrated Octocat 'This is not the web page you are looking for' page |
| 25 | FG2-025 | theme-fixable-css | pages/repo | 9 | 6 | 15 | FG-013 | Releases (≥ 768): tag / commit / Compare sit in a left metadata column beside each card; github.com puts tag + commit in the byline and Compare at the card's top right |
| 26 | FG2-026 | theme-fixable-css | pages/repo | 14 | 1 | 15 | FG-022 | Wiki clone input has no 'Clone this wiki locally' label; revision count shown as '1 🕒' at the right instead of '· 1 revision' in the byline |
| 27 | FG2-027 | theme-fixable-template | pages/issues-prs | 8 | 6 | 14 | FG-017 | PR list shows the left NavList (ORC-9 override) but github.com's PR list has no sidebar (centred 1232px column, filters in the query bar) |
| 28 | FG2-028 | theme-fixable-css | navigation | 11 | 2 | 13 | FG-026 | Footer: 'Version: 1.27.3' still shown next to the attribution; no top rule and the link row wraps to 2 lines at 390 |
| 29 | FG2-029 | theme-fixable-css | pages/actions-packages-projects | 0 | 13 | 13 | FG-061 | Packages: list rows lack the leading 16px package icon; search + Type select + button fused into one 1216px input group; detail title '(1.0.0)' bold in parentheses; versions page has no title and version names are not links-blue; install command clipped at 390 with no copy |
| 30 | FG2-030 | theme-fixable-css | pages/repo | 0 | 12 | 12 | FG-078 | 390 directory / blame toolbar wraps into 3 rows (branch + compare + breadcrumb / Go to file + Add File / lone '…'), ~111px |
| 31 | FG2-031 | theme-fixable-css | pages/issues-prs | 0 | 12 | 12 | FG-074 | 390 issue/PR lists: the NavList becomes a clipped horizontal strip ('Created by y…') and the 7 filter dropdowns wrap onto 2 rows in the Box header |
| 32 | FG2-032 | theme-fixable-css | pages/settings-admin | 0 | 12 | 12 | FG-064 | Settings empty states (webhooks, deploy keys, collaborators, protected branches, OAuth2 apps, org hooks) are centred muted text or an empty Box, not a Primer Blankslate |
| 33 | FG2-033 | theme-fixable-css | pages/auth | 3 | 9 | 12 | FG-063 | Logged-out auth pages (login, signup, forgot/reset password, OpenID) keep a lone hamburger IconButton at the top-left; github.com auth pages have no chrome (and a muted footer band) |
| 34 | FG2-034 | theme-fixable-css | code | 0 | 12 | 12 | new | 390: README box header wraps to two rows (pencil alone on row 2, ~66px) — the blob-header mobile rule `.file-header .file-header-left { flex: 1 0 100% }` also hits `#readme h4.file-header` |
| 35 | FG2-035 | theme-fixable-css | pages/issues-prs | 10 | 2 | 12 | FG-073 | Milestone rows: bare '0%' under the bar (github.com '0% complete · 2 open · 0 closed'), inline red Delete / danger 'Close' |
| 36 | FG2-036 | theme-fixable-css | pages/issues-prs | 7 | 4 | 11 | FG-039 | Open / Closed switch reads '⊙ 8 Open ✓ 51 Closed' (icons, count before label); github.com 'Open 8 \| Closed 51' with CounterLabels (issues, PRs, milestones) |
| 37 | FG2-037 | theme-fixable-template | pages/repo | 8 | 3 | 11 | FG-045 | Commit page: no 'Commit <sha7>' H1 above the message Box; the message is the title inside the Box with Browse Source / Operations |
| 38 | FG2-038 | theme-fixable-css | pages/repo | 7 | 4 | 11 | FG-113 | Compare page: 'Compare commits' title with a bottom rule and no description; '74 Commits' as a grey Box header with tag labels (github.com: Commits \| Files changed tabs); SHA plain text (github.com: small bordered button) |
| 39 | FG2-039 | theme-fixable-template | pages/issues-prs | 8 | 3 | 11 | FG-051 | Labels rows repeat '0 open issues/pull requests' and Edit / Delete on every row (github.com: non-zero icon counts only, actions in a kebab); no 'Search all labels' / Active-Archived header |
| 40 | FG2-040 | theme-fixable-css | pages/settings-admin | 0 | 10 | 10 | FG-065 | 390 settings/admin: page heading squeezed to 3 lines beside its action button (users, repos, orgs); ToggleSwitches wrap under their labels; full NavList (~460px) precedes the content |
| 41 | FG2-041 | theme-fixable-template | code | 10 | 0 | 10 | FG-034 | README header is a single 'README.md' bar, not github.com's 'README \| <license> license' tabs |
| 42 | FG2-042 | theme-fixable-css | pages/settings-admin | 0 | 10 | 10 | FG-079 | Settings details: 2FA is prose + buttons (github.com: method Box rows), org avatar upload is a native file input under the form, appearance uses Selects, cache 'Test' button 8px low, description-less org row off-centre, header copy |
| 43 | FG2-043 | tooling | integrator/tools | 10 | 0 | 10 | FG-015 | Seed data carries visible markers: '[seed]' descriptions, 'theme-seed' / 'migrated-from-github' topics, org README naming tools/seed/seed.mjs and 'GitHub-lookalike Gitea theme', '(seeded test account)' bios, 'Smoke edit' runs by admin |
| 44 | FG2-044 | theme-fixable-template | code | 9 | 0 | 9 | FG-044 | Directory listing has no 'Name \| Last commit message \| Last commit date' header row; '..' parent row sits flush at the top |
| 45 | FG2-045 | theme-fixable-css | code | 0 | 9 | 9 | new | 390: diff summary ('20 changed files with 106 additions…') and the file-tree toggle are hidden in the PR Files / compare toolbars |
| 46 | FG2-046 | theme-fixable-css | pages/issues-prs | 0 | 9 | 9 | new | Org settings Labels empty state: centred muted text over a 440px select with a 3-line italic option and 'Use Label Set'; '0 labels' as a 24px Subhead instead of a Box header |
| 47 | FG2-047 | theme-fixable-css | pages/repo | 0 | 9 | 9 | FG-022 | Wiki sidebar polish: clone input touches the ToC box at 390 (0 gap), CLS 0.165 from details.gh-wiki-pages opening after load, Pages rows indented 37px with an empty gutter |
| 48 | FG2-048 | theme-fixable-template | pages/repo | 9 | 0 | 9 | FG-043 | Repo sidebar has no stars / watching / forks rows (github.com About box lists them) |
| 49 | FG2-049 | theme-fixable-css | pages/repo | 8 | 1 | 9 | FG-018 | Tag rows and compare/commit lists still show 10-character SHAs (github.com 7); commits-list SHA in mono where the critic measured github.com sans |
| 50 | FG2-050 | theme-fixable-css | navigation | 0 | 8 | 8 | FG-029 | 390: PR TabNav (Conversation / Commits / Files Changed) clips 'Files Changed' and its counter at the right edge |
| 51 | FG2-051 | theme-fixable-css | pages/actions-packages-projects | 0 | 8 | 8 | FG-055 | Projects: board's 4th column clipped at 1440 with no scroll cue; column wells end at y≈763 regardless of content; mobile header buttons break into two rows; list Open/Closed without Counters and inline Edit/Close/Delete |
| 52 | FG2-052 | theme-fixable-css | data-display | 0 | 8 | 8 | FG-046 | 390 comment headers wrap: 'commented 4 months / ago', '(Migrated from github.com)' on its own line, kebab/reactions squeezing the time |
| 53 | FG2-053 | theme-fixable-template | pages/repo | 5 | 3 | 8 | FG-110 | Release detail reuses the list chrome (Releases \| Tags toggle, RSS Feed, New Release) instead of a 'Releases / v1.4.6' breadcrumb |
| 54 | FG2-054 | theme-fixable-css | navigation | 0 | 7 | 7 | new | 390 anonymous AppHeader overflows by 6px when the context crumb is long ('Page Not Found'); Register button ends at x=396 |
| 55 | FG2-055 | theme-fixable-css | code | 0 | 7 | 7 | FG-054 | 390: full-bleed file box / commit bar / blame box keep 6px radius and side borders at the viewport edge while the breadcrumb keeps the 16px gutter |
| 56 | FG2-056 | theme-fixable-css | pages/actions-packages-projects | 0 | 7 | 7 | new | 390 run / job view: full Summary / jobs sidebar stacks below the content; no job selector under the title; no 'Search logs' input |
| 57 | FG2-057 | theme-fixable-template | pages/people | 7 | 0 | 7 | FG-053 | Profile README Box has no '<user> / README.md' caption header |
| 58 | FG2-058 | theme-fixable-css | code | 0 | 6 | 6 | new | 390: split diff soft-wraps into ~13-character columns (page 44,250px tall vs 9,236 at 1440) |
| 59 | FG2-059 | theme-fixable-css | pages/issues-prs | 0 | 6 | 6 | FG-119 | Issue page content spans 1232px (x=104-1336) while other repo pages span 1216px; PR compare form is fluid (1376px) |
| 60 | FG2-060 | theme-fixable-css | code | 0 | 6 | 6 | new | 390 latest-commit bar: both author names and the connector are ellipsized ('Joel Nati… a… Peter M. …'); github.com keeps names on one line and moves actions to a second line |
| 61 | FG2-061 | theme-fixable-css | foundation | 4 | 2 | 6 | new | In-text and meta author links are not underlined (github.com underlines them: 'X opened on …', inline body links) |
| 62 | FG2-062 | theme-fixable-css | pages/repo | 1 | 5 | 6 | FG-037 | Release 'Downloads' disclosure: native marker, no Counter, collapsed on every release (the with-assets route never shows its assets); no divider under the byline at 390 |
| 63 | FG2-063 | theme-fixable-css | pages/repo | 0 | 6 | 6 | new | New-repository form is a 768px boxed card with a grey 'New Repository' Box header; github.com/new is an unboxed page (24px heading + subtitle + Subhead rule, Owner / name side by side) |
| 64 | FG2-064 | theme-fixable-css | pages/repo | 0 | 6 | 6 | new | 390 releases: header row (Releases \| Tags, RSS, New Release) inset 15px more than the cards; title row strands the red status × and the 'Stable' label on their own lines |
| 65 | FG2-065 | theme-fixable-css | pages/auth | 0 | 6 | 6 | FG-092 | Auth forms: 'Account recovery is disabled' message is bare centred text (github.com: 340px bordered muted Box); OpenID logo drawn in the heading and field label |
| 66 | FG2-066 | theme-fixable-css | pages/people | 0 | 6 | 6 | FG-083 | People details: dashboard repo filter looks focused at rest (autofocus + accent border), 40px README inset at 390 on org home, row avatars centred against multi-line meta, ragged team meta column, 'Block user' 12px and tight vcard rows, no Star button on starred rows |
| 67 | FG2-067 | theme-fixable-css | pages/repo | 0 | 6 | 6 | FG-078 | 390 repo home: the whole sidebar (description, topics, size, code search, Releases, Languages) sits between the file list and the README |
| 68 | FG2-068 | theme-fixable-css | code | 2 | 3 | 5 | FG-096 | Diff file header: diffstat '+3 −3 ■■■■■' at the right (github.com: count + blocks before the file name), no expand/collapse chevron look, rename-only files show an empty body |
| 69 | FG2-069 | theme-fixable-css | overlays | 0 | 5 | 5 | FG-121 | Overlay details: single-select filter menus show radio circles (Primer: check mark), labels SelectPanel rows show full pills (Primer: dot + name + description), compare SelectPanel has no title, branch names break mid-word, Flash icon wraps under text at 390 |
| 70 | FG2-070 | theme-fixable-template | pages/people | 2 | 3 | 5 | FG-052 | Profile: follower / following counts not bold (github.com: bold default-colour counts, muted lowercase labels) |
| 71 | FG2-071 | theme-fixable-css | pages/actions-packages-projects | 5 | 0 | 5 | FG-018 | Actions run rows: 'Commit 9994cec061' shows the 10-character SHA underlined |
| 72 | FG2-072 | theme-fixable-css | pages/issues-prs | 0 | 4 | 4 | FG-069 | Issue/PR details: unlinked PR author muted 400 (github.com semibold default), copy icon inside the branch label, sidebar Delete not danger, uneven sidebar heading gaps, doubled gaps in 'Remove WIP: prefix', merge-box icons float on wrapped lines |
| 73 | FG2-073 | theme-fixable-css | pages/issues-prs | 0 | 4 | 4 | FG-084 | PR timeline commit SHAs drawn as bordered chips ('2d51c41304'); github.com uses plain muted mono links |
| 74 | FG2-074 | theme-fixable-css | pages/issues-prs | 0 | 4 | 4 | new | New-PR compare: '1 Commits' is an empty 54px Box header with no body; range editor on white (github.com muted); 8px timeline stub at 390 |
| 75 | FG2-075 | theme-fixable-css | data-display | 0 | 4 | 4 | FG-082 | 390 admin tables: heavy radial scroll shadow on the right edge (skips the header row) and ellipsized cells although the table scrolls; sort indicator is a filled caret |
| 76 | FG2-076 | theme-fixable-css | controls | 0 | 4 | 4 | FG-089 | Controls details: textarea shows a partial third line at 390, tag-search button focus ring hugs the icon inside the input, disabled checkbox label not muted, native date input |
| 77 | FG2-077 | theme-fixable-css | code | 0 | 4 | 4 | FG-034 | README box header: 46px grey bar with 'README.md' + pencil; github.com draws a white header with an underlined 'README' tab (accent bar) and a TOC button |
| 78 | FG2-078 | theme-fixable-css | code | 0 | 3 | 3 | new | Split diff: the inline review comment row's empty left half is white while neighbouring empty split cells are muted |
| 79 | FG2-079 | theme-fixable-css | controls | 0 | 3 | 3 | new | Markdown editor outside issue/PR forms (admin notices, releases, wiki, milestones) gets no composer Box: Write/Preview tabs and toolbar float above a separate textarea |
| 80 | FG2-080 | theme-fixable-css | code | 0 | 3 | 3 | FG-028 | 390 blame group header: no relative date (github.com right-aligns '3 years ago') and muted background (github.com default bg) |
| 81 | FG2-081 | theme-fixable-css | data-display | 0 | 3 | 3 | new | 390: repo description starting with an emoji wraps into a lone-emoji line (flex item split) on explore / list rows |
| 82 | FG2-082 | theme-fixable-template | pages/issues-prs | 0 | 3 | 3 | new | New-issue form: no 'Create new issue' heading and no 'Add a title' / 'Add a description' labels |
| 83 | FG2-083 | theme-fixable-css | pages/issues-prs | 0 | 3 | 3 | new | Merge-style dropdown items are 54px tall single-line rows (Primer ActionList 32px, or title + description) |
| 84 | FG2-084 | theme-fixable-css | pages/people | 0 | 3 | 3 | FG-047 | Notifications: row title turns accent blue on hover (github.com does not); Unread/Read nav without icons |
| 85 | FG2-085 | theme-fixable-css | pages/actions-packages-projects | 0 | 3 | 3 | FG-038 | Workflow graph: connector edges invisible (horizontal path with a zero-height bbox is fully masked by the objectBoundingBox edge mask); only port dots render |
| 86 | FG2-086 | theme-fixable-css | code | 0 | 3 | 3 | new | 390 markdown file view: body padding 16px (github.com 32px) — paragraphs 356px wide vs 324 |
| 87 | FG2-087 | theme-fixable-css | pages/repo | 0 | 3 | 3 | new | File view main column right gutter 32px (box ends x=1408) vs github.com 16px (x=1424) |
| 88 | FG2-088 | theme-fixable-css | navigation | 0 | 3 | 3 | FG-030 | Org header tabs start at x=112 inside the container while repo tabs (and github.com's org UnderlineNav) are flush-left at x=16 |
| 89 | FG2-089 | theme-fixable-css | navigation | 0 | 3 | 3 | FG-059 | Dashboard feed pagination: the current page ('1', class item, no href, no .active) is plain text instead of the filled accent pill |
| 90 | FG2-090 | theme-fixable-css | pages/repo | 2 | 1 | 3 | FG-095 | Tags Box header reads '16 Tags' with no tag Octicon (github.com: '(tag) Tags') |
| 91 | FG2-091 | theme-fixable-css | data-display | 0 | 2 | 2 | FG-058 | Team member avatars spaced 4px (github.com overlapping AvatarStack); issue label text 600/12px line-height (Primer IssueLabel 500/18px) |
| 92 | FG2-092 | theme-fixable-css | navigation | 0 | 2 | 2 | new | AppHeader details: search placeholder 'Search repos…' / 'Search code…' (github.com 'Type / to search'); blue site-admin shield badge on the header avatar |
| 93 | FG2-093 | theme-fixable-css | pages/issues-prs | 0 | 2 | 2 | new | 390 issue/PR header: 'Edit' sits on its own row above the title (+40px) |
| 94 | FG2-094 | theme-fixable-css | pages/people | 0 | 2 | 2 | new | Profile sidebar: the organizations avatar row has no 'Organizations' heading |
| 95 | FG2-095 | theme-fixable-css | pages/actions-packages-projects | 0 | 2 | 2 | FG-072 | Actions details: matrix label inside the node card (github.com: tab on the card's top edge); job log panel has a 1px border (github.com borderless) |
| 96 | FG2-096 | theme-fixable-css | markdown | 0 | 2 | 2 | FG-087 | Markdown code-block copy button: always visible in READMEs (github.com: on hover/focus), missing on the repo-pull comment block |
| 97 | FG2-097 | theme-fixable-css | foundation | 2 | 0 | 2 | new | Short pages pin the footer to the viewport bottom, leaving a large empty gap; github.com's footer follows the content |
| 98 | FG2-098 | theme-fixable-css | markdown | 0 | 1 | 1 | new | Markdown `<details>` (ToC box) uses the native ▼ marker instead of an Octicon chevron |
| 99 | FG2-099 | theme-fixable-css | code | 0 | 1 | 1 | new | Commit page diff: file tree collapsed by default (github.com shows it left of the diff) |
| 100 | FG2-100 | inherent | markdown | 0 | 1 | 1 | FG-112 | Mermaid: neutral grey light theme and 100px blank space at 390 |
| 101 | FG2-101 | inherent | data-display | 1 | 0 | 1 | FG-116 | Issue label colours (bright cyan / solid green) differ from github.com's muted pills |
| 102 | FG2-102 | tooling | integrator/tools | 1 | 0 | 1 | new | Judge pairs pad the shorter capture with the harness grey, so a short page reads as 'ends short, grey area beneath' |
| 103 | FG2-103 | inherent | icons | 0 | 0 | 0 | FG-120 | Brand logos reported as non-Octicon (webhook menu gitea/feishu/matrix, gitea-npm) |
| 104 | FG2-104 | inherent | foundation | 0 | 0 | 0 | FG-122 | Font stack is the Primer system stack, github.com uses Mona Sans VF (reads slightly heavier) |
| 105 | FG2-105 | tooling | integrator/tools | 0 | 0 | 0 | new | No check for page-class scope leaks: page-folder rules scoped by a shared Gitea page class (.repository.commits, .repository.pull, .repository.view.issue, .dashboard.issues, .user.signin, .organization.settings…) reach templates the folder never targeted (user-reported twice) |

## Theme-fixable issues by owner (ranked)

- **pages/repo** (18): FG2-016 branches-structure (T), FG2-018 browse-icon, FG2-021 commits-on-prefix, FG2-025 releases-left-column, FG2-026 wiki-clone-label, FG2-030 mobile-file-toolbar, FG2-037 commit-page-h1 (T), FG2-038 compare-header, FG2-047 wiki-sidebar, FG2-048 about-stats (T), FG2-049 sha-7, FG2-053 release-breadcrumb (T), FG2-062 release-assets, FG2-063 repo-create-form, FG2-064 release-mobile, FG2-067 repo-home-mobile-order, FG2-087 code-gutter, FG2-090 tags-header-icon
- **code** (15): FG2-015 file-toolbar, FG2-019 tree-branch-picker (T), FG2-034 readme-header-mobile-wrap, FG2-041 readme-tabs (T), FG2-044 dir-table-header (T), FG2-045 mobile-diff-stats-hidden, FG2-055 mobile-full-bleed-box, FG2-058 split-diff-mobile, FG2-060 latest-commit-mobile, FG2-068 diff-file-header, FG2-077 readme-header-style, FG2-078 review-row-split-bg, FG2-080 mobile-blame-header, FG2-086 md-file-padding-mobile, FG2-099 diff-tree-default
- **pages/issues-prs** (14): FG2-023 labels-milestones-nav (T), FG2-027 pulls-no-sidebar (T), FG2-031 issues-mobile-filters, FG2-035 milestone-meta, FG2-036 open-closed-counters, FG2-039 labels-rows (T), FG2-046 org-labels-empty, FG2-059 issue-page-width, FG2-072 issues-misc, FG2-073 timeline-sha-chip, FG2-074 pr-compare-commits, FG2-082 issue-new-heading (T), FG2-083 merge-style-menu, FG2-093 mobile-edit-row
- **navigation** (8): FG2-014 settings-navlist-icons, FG2-020 mobile-tabs-overflow, FG2-028 footer, FG2-050 mobile-pr-tabnav, FG2-054 header-overflow-anon, FG2-088 org-header-inset, FG2-089 pagination-current, FG2-092 header-misc
- **pages/actions-packages-projects** (7): FG2-022 actions-headings, FG2-029 packages, FG2-051 project-board, FG2-056 actions-mobile, FG2-071 actions-run-meta, FG2-085 action-run-graph-edges, FG2-095 actions-misc
- **pages/settings-admin** (3): FG2-032 settings-blankslates, FG2-040 settings-mobile, FG2-042 settings-misc
- **pages/people** (5): FG2-057 profile-readme-caption (T), FG2-066 people-misc, FG2-070 profile-counts (T), FG2-084 notifications-hover, FG2-094 profile-org-heading
- **pages/auth** (2): FG2-033 auth-header-hamburger, FG2-065 auth-forms
- **data-display** (4): FG2-052 mobile-comment-header, FG2-075 admin-table-scroll, FG2-081 explore-emoji-wrap, FG2-091 dd-misc
- **integrator/tools** (3): FG2-105 page-class-leak-check, FG2-043 seed-markers, FG2-102 pair-canvas
- **foundation** (2): FG2-061 link-underlines, FG2-097 sticky-footer
- **controls** (2): FG2-076 controls-misc, FG2-079 editor-chrome-generic
- **overlays** (1): FG2-069 overlays-misc
- **markdown** (2): FG2-096 md-copy-button, FG2-098 md-details-marker

(T) = theme-fixable-template.

## Inherent issues (not to be hidden; carried over from gate 1)

- FG2-001 (= FG-001; 372 judge reasons, critic wt 7) — GitHub-only feature/data with no Gitea equivalent (cannot be created by a theme): github.com-only features absent: Checks tab, Achievements, star Lists / starred topics, Explore Topics/Trending/Collections, Pinned + sparklines + Top languages, Sponsor, Contributors / Used by, release sha256 + reactions, Actions Usage/Caches/Workflow+Event filters, blame age legend, code folding, new PR-files toolbar (File filter / Jump to), branch Active/Stale data
- FG2-002 (= FG-002; 257 judge reasons, critic wt 4) — Gitea strings/locale: Gitea wording differs from github.com ('Description' vs 'About', 'Stable' vs 'Latest', 'Downloads' vs 'Assets', 'Compare commits', 'Browse Source', 'Starred Repositories', 'Members', '445 Commits', '8 Open / 51 Closed', 'Release details', 'Register now.'…)
- FG2-003 (= FG-005; 212 judge reasons, critic wt 0) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only repo controls present: extra repo tabs (Packages, Projects, Releases, Wiki, Activity), RSS buttons, Add File, compare icon, Manage Topics, repo size, sidebar code search, Commit Graph, 'This Branch' search, Operations, tag pills in commit titles, branch-row actions (RSS/download/rename)
- FG2-004 (= FG-006; 197 judge reasons, critic wt 2) — Gitea strings/locale (text-transform cannot produce sentence case; locale overrides would change every theme): Title Case UI strings: 'Pull Requests', 'Files Changed', 'New Issue', 'New Page', 'Sign In', 'Remember This Device', 'Run Details', 'Source Code (ZIP)'…
- FG2-005 (= FG-010; 197 judge reasons, critic wt 0) — github.com reference is logged-out; ours is signed in as admin: Reference pages are logged-out github.com: marketing header (Platform/Solutions…), 'Sign up for free' banner instead of a composer, 'New issue' instead of 'Edit', marketing footer, Google/Apple SSO
- FG2-006 (= FG-009; 190 judge reasons, critic wt 0) — Gitea strings/locale: <relative-time> attributes and IEC sizes are set in Go helpers, not templates or CSS: Relative dates ('4 years ago') where github.com shows absolute dates ('on May 17, 2023'); KiB/MiB sizes and no '(N loc)'
- FG2-007 (= FG-003; 167 judge reasons, critic wt 0) — Seeded content differs from github.com (Gitea migration does not import timeline events, check runs, signatures, bot flags or account links): Migrated data differs: '(Migrated from github.com)' on comments, no timeline events, no Verified / CI check counts / Bot badges / linked-PR icons, commit authors shown by full name, different counts
- FG2-008 (= FG-004; 166 judge reasons, critic wt 0) — 'Powered by Gitea' attribution must stay (footer restyle allowed, attribution kept): 'Powered by Gitea' footer attribution
- FG2-009 (= FG-008; 123 judge reasons, critic wt 4) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only issue/PR features present: sidebar Time Tracker, Due Date, Dependencies, Reference, Pin/Lock/Delete, 'No Branch/Tag Specified', WIP hint; merge box, Viewed/Review progress, bulk-select checkboxes, Project/Type filters, branch chips, H1/H2/H3 toolbar
- FG2-010 (= FG-013; 101 judge reasons, critic wt 0) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only controls on releases/tags/wiki/actions: RSS Feed + New Release, counted Releases/Tags toggle, 'Search tags', left release metadata column, 'Delete Page', wiki revision counter, 'Default Branch: master', Actor/Status/Branch run filters
- FG2-011 (= FG-012; 99 judge reasons, critic wt 2) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only people/org features present: org Members/Teams/Worktime tabs, New Repository/Migration/Team buttons, RSS + Follow on org, profile email/'Joined on'/Block user/gear, member admin (Hidden, Member Role, 2FA, Make visible/Remove/Leave), explore Repositories/Users/Organizations nav, Filter/Sort
- FG2-012 (= FG-016; 80 judge reasons, critic wt 0) — Gitea logo must stay (ARCHITECTURE §11): Gitea teacup logo in the header, on the sign-in page and in the footer
- FG2-013 (= FG-014; 76 judge reasons, critic wt 0) — Gitea strings/locale (upstream plural bugs): Upstream pluralisation / word-order bugs: '1 commits', '1 changed files', '1 Participants', 'merged 1 commits from main into main'
- FG2-017 (= FG-023; 24 judge reasons, critic wt 1) — External images blocked by --stable capture (ERR_BLOCKED_BY_CLIENT): README badges, logos, demo GIFs and the Dependabot score render as broken alt-text links
- FG2-024 (= FG-031; 14 judge reasons, critic wt 3) — github.com's 404 is a trademarked Octocat illustration (§11: no GitHub marks): 404 is a Primer Blankslate; github.com shows the illustrated Octocat 'This is not the web page you are looking for' page
- FG2-100 (= FG-112; 0 judge reasons, critic wt 1) — Mermaid renders in a same-origin iframe sized by Gitea (CSS cannot reach the SVG theme/size): Mermaid: neutral grey light theme and 100px blank space at 390
- FG2-101 (= FG-116; 1 judge reasons, critic wt 0) — Label colours are seeded data rendered as inline style !important (CONTEXT: exempt): Issue label colours (bright cyan / solid green) differ from github.com's muted pills
- FG2-103 (= FG-120; 0 judge reasons, critic wt 0) — Brand logos kept by ARCHITECTURE §6 (webhook providers, package types): Brand logos reported as non-Octicon (webhook menu gitea/feishu/matrix, gitea-npm)
- FG2-104 (= FG-122; 0 judge reasons, critic wt 0) — Mona Sans VF excluded by ARCHITECTURE §11 (no GitHub brand fonts): Font stack is the Primer system stack, github.com uses Mona Sans VF (reads slightly heavier)

## Details

### FG2-001 — github.com-only features absent: Checks tab, Achievements, star Lists / starred topics, Explore Topics/Trending/Collections, Pinned + sparklines + Top languages, Sponsor, Contributors / Used by, release sha256 + reactions, Actions Usage/Caches/Workflow+Event filters, blame age legend, code folding, new PR-files toolbar (File filter / Jump to), branch Active/Stale data
- **Class:** inherent — GitHub-only feature/data with no Gitea equivalent (cannot be created by a theme) · **Owner:** integrator/tools · **Impact:** 379 (judge reasons 372 in 131 pairs + critic weight 7) · weakest route 7.0 · **Gate 1:** FG-001
- **Routes** (light/dark/390 critic score; j = judge reasons): blame-playground-multiple-authors (7.5/7.5/7.0; C178), blame (8.5/8.5/7.5; j13; C154), directory-tree (8.5/8.5/7.5; j4), releases (7.5/7.5/8.5; j16), repo-issues (8.5/8.5/7.5; j15), repo-pulls (8.0/8.0/7.5; j10), branches (8.0/8.0/8.0; j9), commit-detail (8.0/8.0/8.0; j10), compare-two-tags (8.0/8.0/8.0; j15), explore-repos (8.5/8.5/8.0; j11) … +26 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 190, content 182
- **Critic:** C154 blame [nit] No blame age heat strip; C178 blame-playground-multiple-authors [major] No blame age heat strip and no Older/Newer legend
- **Judges say:** “B's tabs are 'Conversation / Commits / Files Changed' with no Checks tab, and 'Changed' is capitalized” / “B's avatar is a generated teal identicon, and B shows no Achievements section”
- **PNG:** `shots/final-gate-critic-7/blame-playground-multiple-authors_light1440_0.png`, `shots/final-gate-2/blame-playground-multiple-authors/dark-1440.png`, `shots/final-gate-2/blame-playground-multiple-authors/light-1440.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2-pairs/p001.png`
- **Fix:** None. Critics C154/C178 (blame age strip + Older/Newer legend): Gitea sends no per-hunk age, CSS cannot reach it — stays inherent as in gate 1 (FG-001).

### FG2-002 — Gitea wording differs from github.com ('Description' vs 'About', 'Stable' vs 'Latest', 'Downloads' vs 'Assets', 'Compare commits', 'Browse Source', 'Starred Repositories', 'Members', '445 Commits', '8 Open / 51 Closed', 'Release details', 'Register now.'…)
- **Class:** inherent — Gitea strings/locale · **Owner:** foundation · **Impact:** 261 (judge reasons 257 in 103 pairs + critic weight 4) · weakest route 7.0 · **Gate 1:** FG-002
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j1), directory-tree (8.5/8.5/7.5; j7), releases (7.5/7.5/8.5; j13), repo-issues (8.5/8.5/7.5; j20), repo-pulls (8.0/8.0/7.5; j13), branches (8.0/8.0/8.0; j8), commit-detail (8.0/8.0/8.0; j8), compare-two-tags (8.0/8.0/8.0; j12), explore-repos (8.5/8.5/8.0; j4), org-home (8.5/8.5/8.0; j5) … +20 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 134, content 123
- **Critic:** C036 org-members [minor] No 'People' title / permissions box; C181 wiki-page-list [nit] Extra 'Default Branch: master' line; 'New Page' casing
- **Judges say:** “A's metadata reads 'opened 3 years ago by X' with a plain username; GitHub reads 'X opened on Sep 14, 2024' with an underlined username” / “B's sidebar says '1 Participants' (grammar) and 'No Assignees'/'No Milestone' in title case; GitHub says 'No one assigned'/'No milestone'”
- **PNG:** `shots/final-gate-critic-1/om-light-full.png`, `docs/reference/wiki-page-list/light-1440.png`, `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`
- **Fix:** None. C036 (org People page title / permissions box) and C181 (wiki "Default Branch: master" line) are Gitea strings/structure.

### FG2-003 — Gitea-only repo controls present: extra repo tabs (Packages, Projects, Releases, Wiki, Activity), RSS buttons, Add File, compare icon, Manage Topics, repo size, sidebar code search, Commit Graph, 'This Branch' search, Operations, tag pills in commit titles, branch-row actions (RSS/download/rename)
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/repo · **Impact:** 212 (judge reasons 212 in 91 pairs + critic weight 0) · weakest route 7.5 · **Gate 1:** FG-005
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.5/8.5/7.5; j16), directory-tree (8.5/8.5/7.5; j9), releases (7.5/7.5/8.5; j4), repo-issues (8.5/8.5/7.5; j3), repo-pulls (8.0/8.0/7.5; j3), branches (8.0/8.0/8.0; j9), commit-detail (8.0/8.0/8.0; j10), compare-two-tags (8.0/8.0/8.0; j9), pr-conversation-open (8.5/8.5/8.0; j2), repo-home-readme-with-images-and-tables (9.0/9.0/8.0; j21) … +20 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 73, content 139
- **Judges say:** “B has no repo header row (Notifications/Fork/Star) and uses the Gitea tabs (Packages, Releases, Wiki, Activity, Settings)” / “B has the Gitea header (teapot logo, octo-org / theme-playground) and Gitea repo tabs”
- **PNG:** `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2-pairs/p013.png`, `shots/final-gate-2-pairs/p014.png`
- **Fix:** None beyond Primer styling (already done).

### FG2-004 — Title Case UI strings: 'Pull Requests', 'Files Changed', 'New Issue', 'New Page', 'Sign In', 'Remember This Device', 'Run Details', 'Source Code (ZIP)'…
- **Class:** inherent — Gitea strings/locale (text-transform cannot produce sentence case; locale overrides would change every theme) · **Owner:** foundation · **Impact:** 199 (judge reasons 197 in 102 pairs + critic weight 2) · weakest route 7.5 · **Gate 1:** FG-006
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.5/8.5/7.5; j2), directory-tree (8.5/8.5/7.5; j1), releases (7.5/7.5/8.5; j8), repo-issues (8.5/8.5/7.5; j5), repo-pulls (8.0/8.0/7.5; j6), branches (8.0/8.0/8.0; j6), commit-detail (8.0/8.0/8.0; j1), compare-two-tags (8.0/8.0/8.0; j9), org-home (8.5/8.5/8.0; j1), pr-conversation-open (8.5/8.5/8.0; j6) … +25 more
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 87, content 110
- **Critic:** C034 pr-conversation-closed-unmerged [nit] Title-case tab labels; C039 org-projects [nit] Title-case 'New Project'
- **Judges say:** “A has a green 'New Issue' button where GitHub has a gray 'New issue', and A's footer is the Gitea one” / “B's tabs are 'Conversation / Commits / Files Changed' with no Checks tab, and 'Changed' is capitalized”
- **PNG:** `shots/final-gate-critic-1/pr-light.png`, `shots/final-gate-critic-1/op-light.png`, `shots/final-gate-2/blame/dark-390.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-390.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-390.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-390.png`, `shots/final-gate-2/directory-tree/light-1440.png`
- **Fix:** None required. Possible partial mitigation (not recommended): html:lang(en) + text-transform:lowercase + ::first-letter uppercase only works on block/inline-block text-only buttons, not on flex tab items with leading icons.

### FG2-005 — Reference pages are logged-out github.com: marketing header (Platform/Solutions…), 'Sign up for free' banner instead of a composer, 'New issue' instead of 'Edit', marketing footer, Google/Apple SSO
- **Class:** inherent — github.com reference is logged-out; ours is signed in as admin · **Owner:** integrator/tools · **Impact:** 197 (judge reasons 197 in 104 pairs + critic weight 0) · weakest route 7.0 · **Gate 1:** FG-010
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j14), blame (8.5/8.5/7.5; j3), directory-tree (8.5/8.5/7.5; j2), releases (7.5/7.5/8.5; j3), repo-issues (8.5/8.5/7.5; j7), repo-pulls (8.0/8.0/7.5; j3), branches (8.0/8.0/8.0; j1), commit-detail (8.0/8.0/8.0; j1), compare-two-tags (8.0/8.0/8.0; j4), explore-repos (8.5/8.5/8.0; j1) … +27 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 120, content 77
- **Judges say:** “A has no 'Find code, projects, and people on GitHub' search box and no large marketing footer (newsletter, Platform/Ecosystem/Support/Company columns)” / “A's header has a hamburger, a green teapot logo, 'Page Not Found' as the title, a '+' dropdown and issue/PR/bell icon buttons, not the GitHub marketing header”
- **PNG:** `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2-pairs/p001.png`, `shots/final-gate-2-pairs/p005.png`
- **Fix:** None for the theme. Optional tooling: capture signed-in github.com references (the target is the signed-in UI) so judges compare like with like. Gate 2: the signed-in AppHeader (FG-007) is installed; judges still compare it with the logged-out marketing header, and read the repo title row (shown on the overview only, like signed-in github.com) as missing on sub-pages.

### FG2-006 — Relative dates ('4 years ago') where github.com shows absolute dates ('on May 17, 2023'); KiB/MiB sizes and no '(N loc)'
- **Class:** inherent — Gitea strings/locale: <relative-time> attributes and IEC sizes are set in Go helpers, not templates or CSS · **Owner:** foundation · **Impact:** 190 (judge reasons 190 in 94 pairs + critic weight 0) · weakest route 7.5 · **Gate 1:** FG-009
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.5/8.5/7.5; j8), directory-tree (8.5/8.5/7.5; j5), releases (7.5/7.5/8.5; j10), repo-issues (8.5/8.5/7.5; j8), repo-pulls (8.0/8.0/7.5; j4), commit-detail (8.0/8.0/8.0; j1), compare-two-tags (8.0/8.0/8.0; j5), explore-repos (8.5/8.5/8.0; j2), pr-conversation-open (8.5/8.5/8.0; j1), repo-home-readme-with-images-and-tables (9.0/9.0/8.0; j10) … +18 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 93, content 97
- **Judges say:** “A's metadata reads 'opened 3 years ago by X' with a plain username; GitHub reads 'X opened on Sep 14, 2024' with an underlined username” / “Every comment header in B says 'commented 6 years ago (Migrated from github.com)' with a GitHub-mark icon in place of a round avatar, and has no Owner badge”
- **PNG:** `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2-pairs/p002.png`, `shots/final-gate-2-pairs/p004.png`
- **Fix:** None.

### FG2-007 — Migrated data differs: '(Migrated from github.com)' on comments, no timeline events, no Verified / CI check counts / Bot badges / linked-PR icons, commit authors shown by full name, different counts
- **Class:** inherent — Seeded content differs from github.com (Gitea migration does not import timeline events, check runs, signatures, bot flags or account links) · **Owner:** integrator/tools · **Impact:** 167 (judge reasons 167 in 82 pairs + critic weight 0) · weakest route 7.0 · **Gate 1:** FG-003
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j1), blame (8.5/8.5/7.5; j6), directory-tree (8.5/8.5/7.5; j7), releases (7.5/7.5/8.5; j2), repo-issues (8.5/8.5/7.5; j1), repo-pulls (8.0/8.0/7.5; j8), branches (8.0/8.0/8.0; j6), commit-detail (8.0/8.0/8.0; j5), compare-two-tags (8.0/8.0/8.0; j8), org-home (8.5/8.5/8.0; j4) … +16 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 81, content 86
- **Judges say:** “A's header has a hamburger, a green teapot logo, 'Page Not Found' as the title, a '+' dropdown and issue/PR/bell icon buttons, not the GitHub marketing header” / “Every comment header in B says 'commented 6 years ago (Migrated from github.com)' with a GitHub-mark icon in place of a round avatar, and has no Owner badge”
- **PNG:** `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2-pairs/p010.png`, `shots/final-gate-2-pairs/p012.png`
- **Fix:** None for the theme.

### FG2-008 — 'Powered by Gitea' footer attribution
- **Class:** inherent — 'Powered by Gitea' attribution must stay (footer restyle allowed, attribution kept) · **Owner:** navigation · **Impact:** 166 (judge reasons 166 in 84 pairs + critic weight 0) · weakest route 7.0 · **Gate 1:** FG-004
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j8), directory-tree (8.5/8.5/7.5; j8), repo-issues (8.5/8.5/7.5; j8), repo-pulls (8.0/8.0/7.5; j7), branches (8.0/8.0/8.0; j8), commit-detail (8.0/8.0/8.0; j8), user-profile (8.5/8.5/8.0; j8), user-profile-stars-tab (8.5/8.5/8.0; j8), action-run (8.7/8.7/8.2; j8), labels (8.5/8.5/8.5; j8) … +11 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 84, content 82
- **Judges say:** “A's footer shows a green Gitea teapot logo, 'Powered by Gitea', 'English', 'Licenses', 'API' and 'Version: 1.27.3'” / “A has a green 'New Issue' button where GitHub has a gray 'New issue', and A's footer is the Gitea one”
- **PNG:** `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2/repo-pulls/dark-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2-pairs/p005.png`, `shots/final-gate-2-pairs/p006.png`
- **Fix:** None; footer layout already mirrors github.com's single-row footer.

### FG2-009 — Gitea-only issue/PR features present: sidebar Time Tracker, Due Date, Dependencies, Reference, Pin/Lock/Delete, 'No Branch/Tag Specified', WIP hint; merge box, Viewed/Review progress, bulk-select checkboxes, Project/Type filters, branch chips, H1/H2/H3 toolbar
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/issues-prs · **Impact:** 127 (judge reasons 123 in 40 pairs + critic weight 4) · weakest route 7.5 · **Gate 1:** FG-008
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issues (8.5/8.5/7.5; j11), repo-pulls (8.0/8.0/7.5; j21; C097), issue-detail-playground-reactions-alerts-tables (8.5/8.5/8.0; C105), pr-conversation-open (8.5/8.5/8.0; j15), repo-issue (8.5/8.5/8.0; j14), issues-list-closed (9.0/9.0/8.5; j9), milestones (8.5/8.5/8.5; j9), pr-conversation-closed-unmerged (8.5/8.5/8.5; j14), repo-pull-files (9.0/9.0/8.5; j11), repo-pull (9.0/9.0/8.7; j11) … +1 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 62, content 61
- **Critic:** C097 repo-pulls [minor] Branch-ref chips on every row; C105 issue-detail-playground-reactions-alerts-tables [nit] Editor toolbar H1/H2/H3 and dashed dropzone are Gitea-specific
- **Judges say:** “B's diff file header has a 'Viewed' checkbox and no expand-all icon or code/rich view toggle” / “B has no timeline events (label added, title changed, commit referenced); A shows them”
- **PNG:** `shots/final-gate-critic-4/pulls-d-rows.png`, `shots/final-gate-critic-4/idp-light-3.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2/repo-pulls/dark-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/dark-1440.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/light-1440.png`, `shots/final-gate-2/pr-conversation-open/dark-1440.png`, `shots/final-gate-2/pr-conversation-open/light-1440.png`
- **Fix:** None beyond Primer styling. (Labels SelectPanel 'Apply labels' title needs template overrides of several filter templates: OV-5, rejected, keep rejected.)

### FG2-010 — Gitea-only controls on releases/tags/wiki/actions: RSS Feed + New Release, counted Releases/Tags toggle, 'Search tags', left release metadata column, 'Delete Page', wiki revision counter, 'Default Branch: master', Actor/Status/Branch run filters
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/actions-packages-projects · **Impact:** 101 (judge reasons 101 in 32 pairs + critic weight 0) · weakest route 7.5 · **Gate 1:** FG-013
- **Routes** (light/dark/390 critic score; j = judge reasons): releases (7.5/7.5/8.5; j13), action-run (8.7/8.7/8.2; j13), actions-list (8.5/8.5/8.5; j11), release-detail (8.5/8.5/8.5; j18), wiki-home (9.0/9.0/8.5; j14), wiki-page (9.0/9.0/8.5; j14), wiki-page-list (9.0/9.0/8.5; j8), tags (8.8/8.8/8.6; j10)
- **Schemes / viewports:** dark, light / 1440; judge variants page 51, content 50
- **Judges say:** “B's filters are only Actor/Status/Branch, without Workflow/Event” / “B's branch column shows PR numbers like '#187' as branch pills”
- **PNG:** `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2/action-run/dark-1440.png`, `shots/final-gate-2/action-run/light-1440.png`, `shots/final-gate-2/actions-list/dark-1440.png`, `shots/final-gate-2/actions-list/light-1440.png`, `shots/final-gate-2/release-detail/dark-1440.png`, `shots/final-gate-2/release-detail/light-1440.png`, `shots/final-gate-2-pairs/p073.png`, `shots/final-gate-2-pairs/p074.png`
- **Fix:** None. Gate 2: the left release metadata column moved to its own theme-fixable item (critic C080: the 390 layout already moves tag/commit/Compare into the card, so CSS can do it at ≥ 768).

### FG2-011 — Gitea-only people/org features present: org Members/Teams/Worktime tabs, New Repository/Migration/Team buttons, RSS + Follow on org, profile email/'Joined on'/Block user/gear, member admin (Hidden, Member Role, 2FA, Make visible/Remove/Leave), explore Repositories/Users/Organizations nav, Filter/Sort
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/people · **Impact:** 101 (judge reasons 99 in 23 pairs + critic weight 2) · weakest route 8.0 · **Gate 1:** FG-012
- **Routes** (light/dark/390 critic score; j = judge reasons): explore-repos (8.5/8.5/8.0; j13), org-home (8.5/8.5/8.0; j23; C008), user-profile (8.5/8.5/8.0; j12), user-profile-stars-tab (8.5/8.5/8.0; j12), home (8.5/8.5/8.5; C003), org-members (8.5/8.5/8.5; j22), user-profile-repositories-tab (8.5/8.5/8.5; j17)
- **Schemes / viewports:** dark, light / 1440; judge variants content 50, page 49
- **Critic:** C003 home [nit] Dashboard sidebar head and context strip differ from GitHub; C008 org-home [nit] Sidebar order differs from GitHub
- **Judges say:** “B has an RSS icon after '3 Followers · 2 Following', a public email and a 'Joined on Sep 29, 2026' line; GitHub uses lowercase 'followers'/'following' with bold counts” / “B has a gear icon next to the username and says 'Block user' where GitHub says 'Block or report user'”
- **PNG:** `shots/final-gate-2/home/light-1440.png`, `shots/final-gate-critic-0/oh-l-a.png`, `docs/reference/org-home/light-1440.png`, `shots/final-gate-2/explore-repos/dark-1440.png`, `shots/final-gate-2/explore-repos/light-1440.png`, `shots/final-gate-2/org-home/dark-1440.png`, `shots/final-gate-2/org-home/light-1440.png`, `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-2/user-profile-stars-tab/dark-1440.png`
- **Fix:** None.

### FG2-012 — Gitea teacup logo in the header, on the sign-in page and in the footer
- **Class:** inherent — Gitea logo must stay (ARCHITECTURE §11) · **Owner:** navigation · **Impact:** 80 (judge reasons 80 in 55 pairs + critic weight 0) · weakest route 7.0 · **Gate 1:** FG-016
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j3), blame (8.5/8.5/7.5; j2), directory-tree (8.5/8.5/7.5; j1), releases (7.5/7.5/8.5; j1), repo-issues (8.5/8.5/7.5; j2), branches (8.0/8.0/8.0; j2), compare-two-tags (8.0/8.0/8.0; j2), explore-repos (8.5/8.5/8.0; j4), org-home (8.5/8.5/8.0; j2), pr-conversation-open (8.5/8.5/8.0; j1) … +23 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 74, content 6
- **Judges say:** “A's footer shows a green Gitea teapot logo, 'Powered by Gitea', 'English', 'Licenses', 'API' and 'Version: 1.27.3'” / “A's header has a hamburger, a green teapot logo, 'Page Not Found' as the title, a '+' dropdown and issue/PR/bell icon buttons, not the GitHub marketing header”
- **PNG:** `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2-pairs/p001.png`, `shots/final-gate-2-pairs/p003.png`
- **Fix:** None (keep). The AppHeader override uses the Gitea logo as the mark.

### FG2-013 — Upstream pluralisation / word-order bugs: '1 commits', '1 changed files', '1 Participants', 'merged 1 commits from main into main'
- **Class:** inherent — Gitea strings/locale (upstream plural bugs) · **Owner:** foundation · **Impact:** 76 (judge reasons 76 in 32 pairs + critic weight 0) · weakest route 8.0 · **Gate 1:** FG-014
- **Routes** (light/dark/390 critic score; j = judge reasons): commit-detail (8.0/8.0/8.0; j5), pr-conversation-open (8.5/8.5/8.0; j12), repo-issue (8.5/8.5/8.0; j5), pr-commits-tab (9.0/9.0/8.5; j8), pr-conversation-closed-unmerged (8.5/8.5/8.5; j8), repo-pull-files (9.0/9.0/8.5; j13), repo-pull (9.0/9.0/8.7; j9), pr-files-changed-unified (9.0/9.0/8.8; j16)
- **Schemes / viewports:** dark, light / 1440; judge variants content 40, page 36
- **Judges say:** “B's sidebar says '1 Participants' (grammar) and 'No Assignees'/'No Milestone' in title case; GitHub says 'No one assigned'/'No milestone'” / “B's sidebar has Time Tracker, Due Date, Dependencies, 'Reference: octo-org/grex#358', Pin/Lock/Delete and '1 Participants'”
- **PNG:** `shots/final-gate-2/commit-detail/dark-1440.png`, `shots/final-gate-2/commit-detail/light-1440.png`, `shots/final-gate-2/pr-conversation-open/dark-1440.png`, `shots/final-gate-2/pr-conversation-open/light-1440.png`, `shots/final-gate-2/repo-issue/dark-1440.png`, `shots/final-gate-2/repo-issue/light-1440.png`, `shots/final-gate-2/pr-commits-tab/dark-1440.png`, `shots/final-gate-2/pr-commits-tab/light-1440.png`, `shots/final-gate-2-pairs/p029.png`, `shots/final-gate-2-pairs/p030.png`
- **Fix:** None.

### FG2-014 — Settings / admin NavList: no leading 16px Octicons (every settings page), and user/repo settings open with a 'User Settings' / 'Settings' group heading github.com does not have
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 37 (judge reasons 0 in 0 pairs + critic weight 37) · weakest route 8.0 · **Gate 1:** FG-050
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings (8.5/8.5/8.0; C190), repo-settings (8.5/8.5/8.0; C005), repo-settings-hooks (8.5/8.5/8.0; C162), site-admin (8.5/8.5/8.0; C168), user-settings-keys (8.5/8.5/8.0; C095), user-settings-security (8.1/8.1/8.1; C067), repo-settings-deploykeys (8.2/8.2/8.2; C070), user-settings (8.2/8.2/8.2; C044 C045), repo-settings-branches (8.3/8.3/8.3; C135)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C005 repo-settings [minor] Settings NavList lacks leading Octicons and group headings; C044 user-settings [major] Settings NavList has no leading Octicons; C067 user-settings-security [major] Settings NavList has no leading Octicons; C070 repo-settings-deploykeys [major] Repo settings NavList lacks Octicons and adds a 'Settings' heading; C095 user-settings-keys [minor] Settings NavList items have no leading Octicons; no empty-state Box; C135 repo-settings-branches [minor] Settings NavList items have no leading octicons; C162 repo-settings-hooks [nit] Settings nav lacks icons and groups; C168 site-admin [minor] Admin NavList items have no leading Octicons; C190 org-settings [minor] Settings NavList has no leading icons; C045 user-settings [minor] 'User Settings' group heading at top of nav
- **PNG:** `shots/final-gate-critic-0/repo-settings-light-1440-t0.png`, `shots/final-gate-2/user-settings/light-1440.png`, `shots/final-gate-2/user-settings-security/light-1440.png`, `shots/final-gate-2/repo-settings-deploykeys/light-1440.png`, `shots/final-gate-2/user-settings-keys/light-1440.png`, `shots/final-gate-2/repo-settings-branches/light-1440.png`, `shots/final-gate-critic-7/site-admin_light1440_0.png`, `shots/final-gate-2/org-settings/dark-390.png`, `shots/final-gate-2/org-settings/dark-1440.png`, `shots/final-gate-2/org-settings/light-390.png`
- **Fix:** Leading icon per item via `::before` mask keyed on the item href (masks already exist in icons: person, gear, paintbrush, shield-lock, key, apps, organization, people, git-branch, tag, webhook, server, repo, package, play…); 16px, 8px gap, `--fgColor-muted`. Hide/demote the top-level 'User Settings' / 'Settings' heading (keep lower group headings, 12px/600 muted). Rejected in loop 1 for budget only (NAV-I3): trim first — one shared mask rule + `--gh-nav-icon` custom property set per href keeps it to ~1.5 KB.
- **Why this class:** Pseudo-elements on existing links; 4 majors across settings pages (the strongest settings tell per critic C044).

### FG2-015 — File toolbar: 'Raw | Permalink | History' as text buttons plus copy/download/edit/delete/RSS icons; lone 'Code' segment on images; file info in mono; no lines/loc
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 27 (judge reasons 24 in 12 pairs + critic weight 3) · weakest route 7.5 · **Gate 1:** FG-021
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.5/8.5/7.5; j8), file-view-image-playground (8.5/8.5/7.5; C101), file-view-markdown (8.6/8.6/8.2; j8; C051), repo-code-file (8.6/8.6/8.3; j8; C049)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 12, content 12
- **Critic:** C049 repo-code-file [nit] File toolbar composition; C051 file-view-markdown [nit] Toolbar lacks line/loc count and outline button; C101 file-view-image-playground [nit] Lone 'Code' segment for an image; mono file info
- **Judges say:** “A's toolbar has 'Raw | Permalink | History' plus copy/download/edit/delete/RSS icons; GitHub has Raw/copy/download/edit/symbols” / “B's toolbar has 'Raw | Permalink | History'; its info is '22 KiB' with no line count”
- **PNG:** `shots/final-gate-2/file-view-image-playground/light-1440.png`, `shots/final-gate-2/blame/dark-390.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-390.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/file-view-image-playground/dark-390.png`, `shots/final-gate-2/file-view-image-playground/dark-1440.png`, `shots/final-gate-2/file-view-image-playground/light-390.png`, `shots/final-gate-2/file-view-image-playground/light-1440.png`, `shots/final-gate-2/file-view-markdown/dark-390.png`
- **Fix:** Keep Raw as the one text button; Permalink → link IconButton, History → history IconButton (aria-label/tooltip from the existing text via `font-size:0` + mask, text stays for AT); trash/RSS keep IconButton style in a second group. Hide the SegmentedControl when it has a single item (image/binary). File info sans 12px muted. '(N loc)' is Gitea data (inherent FG-009).
- **Why this class:** Restyle of existing controls; nothing removed.

### FG2-016 — Branches page: no 'Branches' title, no Overview/Active/Stale/All tabs, no column-header row, 5 icon buttons per row, 'Default Branch' box
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 25 (judge reasons 16 in 4 pairs + critic weight 9) · weakest route 8.0 · **Gate 1:** FG-024
- **Routes** (light/dark/390 critic score; j = judge reasons): branches (8.0/8.0/8.0; j16; C028 C029)
- **Schemes / viewports:** dark, light / 1440; judge variants content 9, page 7
- **Critic:** C028 branches [major] Branches page lacks GitHub's title, UnderlineNav and table header; C029 branches [minor] Five inline action icons per row instead of trash + kebab
- **Judges say:** “A has no 'Branches' page title and no Overview/Active/Stale/All tabs” / “A shows a '445 Commits · 14 Branches · 16 Tags' bar and a separate 'Default Branch' box”
- **PNG:** `shots/final-gate-critic-1/br-light.png`, `shots/final-gate-2/branches/dark-1440.png`, `shots/final-gate-2/branches/light-1440.png`, `shots/final-gate-2-pairs/p069.png`, `shots/final-gate-2-pairs/p070.png`, `shots/final-gate-2-pairs/p071.png`
- **Fix:** Rejected in gate 1 (FG-024: no locale keys for Updated / Check status / Behind|Ahead; kebab needs a row rewrite; §7 e). Still no slot. CSS-only mitigation (pages/repo): collapse the rss/download/rename icons into a hover-revealed group (visible on row hover/focus-within, always visible < 768), keep trash visible — nothing removed.
- **Why this class:** Column headers and tabs need markup + strings Gitea lacks.

### FG2-017 — README badges, logos, demo GIFs and the Dependabot score render as broken alt-text links
- **Class:** inherent — External images blocked by --stable capture (ERR_BLOCKED_BY_CLIENT) · **Owner:** integrator/tools · **Impact:** 25 (judge reasons 24 in 12 pairs + critic weight 1) · weakest route 8.2 · **Gate 1:** FG-023
- **Routes** (light/dark/390 critic score; j = judge reasons): file-view-markdown (8.6/8.6/8.2; j8; C052), pr-conversation-closed-unmerged (8.5/8.5/8.5; j8), repo-home (9.0/9.0/8.5; j8)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 12, content 12
- **Critic:** C052 file-view-markdown [nit] Console errors are the harness blocking external images
- **Judges say:** “In B, README images do not load: broken image alt text ('grex', 'rust build status', 'grex demo') shows as underlined links instead of the logo and badges” / “In B the Dependabot compatibility badge image is broken and shows as a link”
- **PNG:** `shots/final-gate-2/file-view-markdown/dark-390.png`, `shots/final-gate-2/file-view-markdown/dark-1440.png`, `shots/final-gate-2/file-view-markdown/light-390.png`, `shots/final-gate-2/file-view-markdown/light-1440.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/dark-390.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/light-390.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/light-1440.png`, `shots/final-gate-2/repo-home/dark-390.png`, `shots/final-gate-2/repo-home/dark-1440.png`
- **Fix:** None for the theme. (Capture-policy decision for the integrator: allow-list shields.io / raw.githubusercontent.com for judge pairs, or accept.)

### FG2-018 — 'Browse at this commit' button uses octicon-file-code on every commit row (commits, PR Commits tab, compare, compare form); github.com uses octicon-code (<>)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 24 (judge reasons 11 in 9 pairs + critic weight 13) · weakest route 7.5 · **Gate 1:** FG-086
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-compare-form-playground (8.0/8.0/7.5; C198), compare-two-tags (8.0/8.0/8.0; j2; C014), pr-commits-tab (9.0/9.0/8.5; j5; C012), pr-commits-tab-playground (9.0/9.0/8.5; C157), repo-commits (8.5/8.5/8.5; j4; C175)
- **Schemes / viewports:** dark, light / 1440; judge variants content 7, page 4
- **Critic:** C012 pr-commits-tab [minor] Browse-at-commit icon is octicon-file-code instead of octicon-code; C014 compare-two-tags [minor] octicon-file-code browse icon on every commit row; C157 pr-commits-tab-playground [nit] Browse button icon; C175 repo-commits [minor] Browse-files button uses octicon-file-code instead of octicon-code; C198 pr-compare-form-playground [minor] Commit row uses file-code icon
- **Judges say:** “A has a different right-side icon (a clock-like browse icon instead of <>)” / “A commit row shows the full name 'David Ko 6 years ago' instead of 'innobead committed on May 31, 2021'; the second action icon differs from GitHub's '<>' browse icon”
- **PNG:** `shots/final-gate-critic-0/pc-icons.png`, `shots/final-gate-critic-0/ct-l.png`, `shots/final-gate-critic-7/commits_icons_zoom.png`, `shots/final-gate-2/pr-compare-form-playground/dark-1440.png`, `shots/final-gate-2/pr-compare-form-playground/light-1440.png`, `shots/final-gate-2/compare-two-tags/dark-1440.png`, `shots/final-gate-2/compare-two-tags/light-1440.png`, `shots/final-gate-2/pr-commits-tab/dark-1440.png`, `shots/final-gate-2/pr-commits-tab/light-1440.png`, `shots/final-gate-2/pr-commits-tab-playground/dark-1440.png`
- **Fix:** Apply the existing mask (icons PR-IC-1 DONE: `--gh-octicon-code` in src/icons/octicon-masks.css, pruned until referenced) to the browse button in `#commits-table` / `.commit-list` rows — one un-page-scoped rule so the commits page, PR Commits tab, compare and the new-PR compare form all get it (critics assigned it to icons; the mask is ready, the rule belongs to the commit list owner). Gate-1 FG-086, still open.
- **Why this class:** CSS mask.

### FG2-019 — Branch picker, 'Go to file' and 'Add File' sit in the content toolbar; github.com puts branch picker + file search at the top of the Files tree pane
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 24 (judge reasons 20 in 15 pairs + critic weight 4) · weakest route 7.5 · **Gate 1:** FG-025
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.5/8.5/7.5; j3), directory-tree (8.5/8.5/7.5; j5; C126), file-view-markdown (8.6/8.6/8.2; j7), repo-code-file (8.6/8.6/8.3; j5; C048)
- **Schemes / viewports:** dark, light / 1440; judge variants page 10, content 10
- **Critic:** C048 repo-code-file [minor] Branch picker and Go to file in main column, not tree pane; C126 directory-tree [nit] Branch picker and Go to file not in the tree pane; no column header row
- **Judges say:** “B has the Gitea header and file tree placement (branch selector above content)” / “B has 'Go to file' with a T hint, 'Add File', '…' and 'History' buttons in the top bar, with the branch selector above the content rather than in the sidebar”
- **PNG:** `shots/final-gate-critic-2/rcf-light-top.png`, `docs/reference/directory-tree/light-1440.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`, `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2/file-view-markdown/dark-1440.png`, `shots/final-gate-2/file-view-markdown/light-1440.png`, `shots/final-gate-2/repo-code-file/dark-1440.png`, `shots/final-gate-2/repo-code-file/light-1440.png`
- **Fix:** Still blocked: the markup lives in the Modern theme's `repo/view_content.tmpl` override (gate-1 FG-025, rejected: a, d). Not proposed for the last slot. No CSS path (cross-container move).
- **Why this class:** Cross-container move inside a Modern-owned template.

### FG2-020 — 390: repo / profile / org UnderlineNav hides its icons below 1200px and the selected tab ends up inside '…' (only the overflow button carries the underline)
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 20 (judge reasons 0 in 0 pairs + critic weight 20) · weakest route 7.5 · **Gate 1:** FG-029
- **Routes** (light/dark/390 critic score; j = judge reasons): action-job (8.5/8.5/7.5; C116), package-detail-npm (8.0/8.0/7.5; C111), repo-issues (8.5/8.5/7.5; C173), repo-settings-collab (8.0/8.0/7.5; C113), user-profile (8.5/8.5/8.0; C147), user-profile-stars-tab (8.5/8.5/8.0; C189), wiki-home (9.0/9.0/8.5; C155), wiki-page-list (9.0/9.0/8.5; C182)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C111 package-detail-npm [minor] Mobile: active 'Packages' tab hidden in UnderlineNav overflow; C113 repo-settings-collab [minor] Mobile: active 'Settings' tab hidden in overflow; C116 action-job [minor] Mobile: active 'Actions' tab hidden in overflow; C147 user-profile [nit] Mobile tabs drop icons; C155 wiki-home [nit] Active tab hidden in overflow on mobile; C173 repo-issues [minor] Mobile UnderlineNav hides its icons; C182 wiki-page-list [minor] Mobile nav has no icons, and the overflow '…' gets the active underline; C189 user-profile-stars-tab [minor] Mobile profile tabs have no icons and '…' gets the active underline
- **PNG:** `shots/final-gate-critic-4/pkg-390-0.png`, `shots/final-gate-critic-4/collab-390.png`, `shots/final-gate-critic-4/aj-390.png`, `shots/final-gate-critic-6/up-390-a.png`, `docs/reference/repo-issues/light-390.png`, `docs/reference/wiki-page-list/light-390.png`, `docs/reference/user-profile-stars-tab/light-390.png`, `shots/final-gate-2/action-job/dark-390.png`, `shots/final-gate-2/action-job/light-390.png`, `shots/final-gate-2/package-detail-npm/dark-390.png`
- **Fix:** < 768: keep the 16px icons (github.com 390 keeps them; underline-nav.css L111-123 hides them) but cut item padding to 8px / gap 4px and hide the counters of non-selected items, so more tabs fit 358px and overflow-menu.ts keeps the selected one visible more often. When it still lands in the popup, keep the loop-1 underline on the trigger (CSS cannot swap it back). Measure Packages / Settings / Actions / Wiki / profile Stars selected at 390.
- **Why this class:** Existing markup; overflow-menu.ts decides by width, so narrower items keep the selected tab visible.

### FG2-021 — Commit day groups read 'May 31, 2021'; github.com reads 'Commits on May 31, 2021' (commits page, PR Commits tab, compare)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 20 (judge reasons 19 in 11 pairs + critic weight 1) · weakest route 8.0 · **Gate 1:** FG-019
- **Routes** (light/dark/390 critic score; j = judge reasons): compare-two-tags (8.0/8.0/8.0; j5), pr-commits-tab (9.0/9.0/8.5; j8), repo-commits (8.5/8.5/8.5; j6; C177)
- **Schemes / viewports:** dark, light / 1440; judge variants content 10, page 9
- **Critic:** C177 repo-commits [nit] Day label has no 'Commits on' prefix
- **Judges say:** “A lists commits newest-first with relative '2 years ago' dates, no 'Commits on <date>' labels and no Verified badges, and author names are not underlined links” / “B has no Commits/Files changed tabs, and 'Nov 14, 2025' date headers where GitHub has 'Commits on ...'; there are no Verified badges”
- **PNG:** `shots/final-gate-2/compare-two-tags/dark-1440.png`, `shots/final-gate-2/compare-two-tags/light-1440.png`, `shots/final-gate-2/pr-commits-tab/dark-1440.png`, `shots/final-gate-2/pr-commits-tab/light-1440.png`, `shots/final-gate-2/repo-commits/dark-1440.png`, `shots/final-gate-2/repo-commits/light-1440.png`, `shots/final-gate-2-pairs/p045.png`, `shots/final-gate-2-pairs/p046.png`, `shots/final-gate-2-pairs/p047.png`
- **Fix:** `html:lang(en) .gh-commit-day-title > span::before { content: "Commits on " }` (English only, same precedent as the 'Public' Label FG-041: other locales keep the bare date). No template change; the day rows come from our commits_list.tmpl override.
- **Why this class:** Generated text on our own markup; §7 accepted the missing prefix only because there is no locale key — CSS content under :lang(en) closes it without a key.

### FG2-022 — Actions list: no 'Actions' sidebar heading and no 'All workflows' title + 'Showing runs from all workflows' subtitle above the runs Box (also on the empty-filter state)
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 19 (judge reasons 13 in 4 pairs + critic weight 6) · weakest route 8.4 · **Gate 1:** FG-049
- **Routes** (light/dark/390 critic score; j = judge reasons): actions-empty-filter (8.5/8.5/8.4; C072), actions-list (8.5/8.5/8.5; j13; C035)
- **Schemes / viewports:** dark, light / 1440; judge variants page 6, content 7
- **Critic:** C035 actions-list [minor] Missing Actions page chrome; C072 actions-empty-filter [minor] No 'All workflows' heading or filter input above runs Box
- **Judges say:** “B's Actions sidebar has no 'Actions' title and no Management/Caches section; it lists 'All Workflows' (capital W) and 'CI'” / “B has no 'All workflows / Showing runs from all workflows' heading and no 'Filter workflow runs' input”
- **PNG:** `shots/final-gate-critic-1/act-light-0.png`, `shots/final-gate-2/actions-empty-filter/light-1440.png`, `shots/final-gate-2/actions-empty-filter/dark-1440.png`, `shots/final-gate-2/actions-empty-filter/light-1440.png`, `shots/final-gate-2/actions-list/dark-1440.png`, `shots/final-gate-2/actions-list/light-1440.png`, `shots/final-gate-2-pairs/p133.png`, `shots/final-gate-2-pairs/p134.png`, `shots/final-gate-2-pairs/p135.png`
- **Fix:** English-only generated text (precedent FG-041): `html:lang(en)` `::before` 'Actions' (20px/600) above the workflow NavList; on the runs column `::before` 'All workflows' (20px/600) + `::after`-free subtitle via a second pseudo on the Box header wrapper, shown only when the first NavList item is selected (`:has(.ui.vertical.menu > .item.active:first-child)`); for a selected workflow show nothing (its name is not reachable in CSS). 'Filter workflow runs' input: no Gitea feature (inherent).
- **Why this class:** Gate 1 rejected the template (FG-049, a ≤ 10); the judge count grew — CSS generated text closes most of it without a slot.

### FG2-023 — Labels and Milestones pages lack the issues NavList sidebar the Issues list now has; they show the Labels | Milestones toggle instead (github.com: left sidebar with Milestones / Labels selected)
- **Class:** theme-fixable-template · **Owner:** pages/issues-prs · **Impact:** 18 (judge reasons 18 in 8 pairs + critic weight 0) · weakest route 8.5 · **Gate 1:** FG-017
- **Routes** (light/dark/390 critic score; j = judge reasons): labels (8.5/8.5/8.5; j9), milestones (8.5/8.5/8.5; j9)
- **Schemes / viewports:** dark, light / 1440; judge variants page 8, content 10
- **Judges say:** “A has no issues sidebar and uses Labels/Milestones toggle buttons with a Search box” / “B has a Labels/Milestones toggle, a '13 labels' header and a New Label button; there is no left sidebar and no Active/Archived tabs”
- **PNG:** `shots/final-gate-2/labels/dark-1440.png`, `shots/final-gate-2/labels/light-1440.png`, `shots/final-gate-2/milestones/dark-1440.png`, `shots/final-gate-2/milestones/light-1440.png`, `shots/final-gate-2-pairs/p105.png`, `shots/final-gate-2-pairs/p106.png`, `shots/final-gate-2-pairs/p107.png`
- **Fix:** **Last template slot (8/8) — proposed.** Override `templates/repo/issue/navbar.tmpl` (one file, 4 lines upstream): `{{if and (StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-") (or .PageIsLabels (and .PageIsMilestones .State))}}` (`.State` only exists on the Milestones list; NewMilestone/EditMilestone also set PageIsMilestones) render `<nav class="gh-issues-nav">` (Issues → {{.RepoLink}}/issues, divider, Milestones, Labels; `selected` + aria-current on the current one; keys repo.issues / repo.milestones / repo.labels; Octicons issue-opened / milestone / tag) `{{else}}` + upstream 4 lines verbatim + `{{end}}` (no trailing newline) — other themes and the other two callers (milestone_new, choose) keep upstream bytes. pages/issues-prs lays it out: `.repository:is(.labels,.milestones) > .ui.container { display:grid; grid-template-columns: 256px 1fr; gap:24px }`, `.issue-navbar { display: contents }`, nav `grid-row: 1 / span 20`, everything else column 2; < 768 the nav collapses like the Issues list. Reuses the existing `.gh-issues-nav*` styles.
- **Why this class:** §7 a: the judges' sidebar tell continues from FG-017 (impact 45 in gate 1) and is the highest-impact template item left; b: .RepoLink / .PageIsLabels / .PageIsMilestones are in ctx; c: existing locale keys; d: else-branch = upstream bytes; e: 8 of 8. CSS cannot create the nav (the partial only holds two links). The partial is shared by 4 templates — the github branch is gated on PageIsLabels/PageIsMilestones (see the page-class leak check item).

### FG2-024 — 404 is a Primer Blankslate; github.com shows the illustrated Octocat 'This is not the web page you are looking for' page
- **Class:** inherent — github.com's 404 is a trademarked Octocat illustration (§11: no GitHub marks) · **Owner:** pages/people · **Impact:** 17 (judge reasons 14 in 4 pairs + critic weight 3) · weakest route 7.0 · **Gate 1:** FG-031
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j14; C024)
- **Schemes / viewports:** dark, light / 1440; judge variants page 6, content 8
- **Critic:** C024 not-found [minor] 404 is a generic blankslate, not github.com's 404
- **Judges say:** “A has no 'Find code, projects, and people on GitHub' search box and no large marketing footer (newsletter, Platform/Ecosystem/Support/Company columns)” / “A's 404 is a plain triangle icon and text with no Octocat illustration”
- **PNG:** `shots/final-gate-critic-1/nf-00.png`, `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2-pairs/p021.png`, `shots/final-gate-2-pairs/p022.png`, `shots/final-gate-2-pairs/p023.png`
- **Fix:** None (cannot copy GitHub art). Optional: nothing. C024 also asks for a search field on the 404 page: no Gitea template data / markup for it (template-level; inherent with the art).

### FG2-025 — Releases (≥ 768): tag / commit / Compare sit in a left metadata column beside each card; github.com puts tag + commit in the byline and Compare at the card's top right
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 15 (judge reasons 9 in 5 pairs + critic weight 6) · weakest route 7.5 · **Gate 1:** FG-013
- **Routes** (light/dark/390 critic score; j = judge reasons): releases (7.5/7.5/8.5; j8; C080), release-detail (8.5/8.5/8.5; j1)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 5, content 4
- **Critic:** C080 releases [major] Desktop keeps the classic left meta column; current github.com has Release list nav and in-card tag/commit/Compare
- **Judges say:** “B's tag and commit info sits in a left gutter beside each release card” / “A shows '16 Releases / 16 Tags' toggle with RSS Feed and New Release buttons, a 'Stable' badge where GitHub has 'Latest', and a left column with tag/sha/Compare”
- **PNG:** `docs/reference/releases/light-1440.png`, `shots/final-gate-2/releases/dark-390.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-390.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2/release-detail/dark-390.png`, `shots/final-gate-2/release-detail/dark-1440.png`, `shots/final-gate-2/release-detail/light-390.png`, `shots/final-gate-2/release-detail/light-1440.png`, `shots/final-gate-2-pairs/p077.png`
- **Fix:** Reuse the 390 reorder (already in tags-releases.css) at ≥ 768: single-column card, tag + short SHA as muted byline items, Compare as a small button at the card's top right. Remove the deliberate exception at tags-releases.css:11.
- **Why this class:** Critic C080: CSS-reachable, the mobile layout already does it.

### FG2-026 — Wiki clone input has no 'Clone this wiki locally' label; revision count shown as '1 🕒' at the right instead of '· 1 revision' in the byline
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 15 (judge reasons 14 in 8 pairs + critic weight 1) · weakest route 8.5 · **Gate 1:** FG-022
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-home (9.0/9.0/8.5; j8), wiki-page (9.0/9.0/8.5; j6; C011)
- **Schemes / viewports:** dark, light / 1440; judge variants content 7, page 7
- **Critic:** C011 wiki-page [nit] Revision count and clone label differ
- **Judges say:** “B's clone URL is 'http://localhost:3000/octo-org/…' with no 'Clone this wiki locally' heading” / “B has a localhost clone URL with no 'Clone this wiki locally' heading”
- **PNG:** `shots/final-gate-critic-0/wp-l.png`, `shots/final-gate-2/wiki-home/dark-1440.png`, `shots/final-gate-2/wiki-home/light-1440.png`, `shots/final-gate-2/wiki-page/dark-1440.png`, `shots/final-gate-2/wiki-page/light-1440.png`, `shots/final-gate-2-pairs/p085.png`, `shots/final-gate-2-pairs/p086.png`, `shots/final-gate-2-pairs/p087.png`
- **Fix:** English-only generated label (precedent FG-041): `html:lang(en) .gh-wiki-clone::before { content: "Clone this wiki locally"; flex-basis:100% }` with `flex-wrap:wrap` on the action input (or on `.gh-wiki-aside`), 14px/600 above the input; the localhost URL is instance data (inherent). Revision counter: move next to the byline via `order` and style muted (count text is Gitea's).
- **Why this class:** Generated label under :lang(en) on our own wiki override markup.

### FG2-027 — PR list shows the left NavList (ORC-9 override) but github.com's PR list has no sidebar (centred 1232px column, filters in the query bar)
- **Class:** theme-fixable-template · **Owner:** pages/issues-prs · **Impact:** 14 (judge reasons 8 in 4 pairs + critic weight 6) · weakest route 7.5 · **Gate 1:** FG-017
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pulls (8.0/8.0/7.5; j8; C096)
- **Schemes / viewports:** dark, light / 1440; judge variants page 4, content 4
- **Critic:** C096 repo-pulls [major] Left NavList sidebar not present on github.com PR list
- **Judges say:** “B's sidebar lists All pull requests / Assigned to you / Created by you / Review requested / Reviewed by you / Mentioning you” / “A's button says 'New Pull Request' and its sidebar has Review requested/Reviewed by you”
- **PNG:** `docs/reference/repo-pulls/light-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2/repo-pulls/dark-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2-pairs/p033.png`, `shots/final-gate-2-pairs/p034.png`, `shots/final-gate-2-pairs/p035.png`
- **Fix:** Edit of the existing `repo/issue/list.tmpl` override (no new slot): render `.gh-issues-nav` only when `not .PageIsPullList`; on PRs render upstream's type filter as before. pages/issues-prs: centred container layout on `.repository.pulls` (check scope: `.repository.pulls` vs `.repository.issue-list` — see the leak check).
- **Why this class:** Our own override over-applied; fix is inside it.

### FG2-028 — Footer: 'Version: 1.27.3' still shown next to the attribution; no top rule and the link row wraps to 2 lines at 390
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 13 (judge reasons 11 in 7 pairs + critic weight 2) · weakest route 7.0 · **Gate 1:** FG-026
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j2), branches (8.0/8.0/8.0; j2), site-admin (8.5/8.5/8.0; C169), explore-orgs (8.5/8.5/8.5; C075), pr-commits-tab (9.0/9.0/8.5; j2), repo-pull-files (9.0/9.0/8.5; j1), user-profile-repositories-tab (8.5/8.5/8.5; j2), wiki-home (9.0/9.0/8.5; j1), wiki-page-list (9.0/9.0/8.5; j1)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 5, content 6
- **Critic:** C075 explore-orgs [nit] Centered Gitea footer instead of github.com © footer; C169 site-admin [nit] Gitea footer instead of Primer footer
- **Judges say:** “A's footer shows a green Gitea teapot logo, 'Powered by Gitea', 'English', 'Licenses', 'API' and 'Version: 1.27.3'” / “B's footer is Gitea's (Powered by Gitea, Version 1.27.3)”
- **PNG:** `shots/final-gate-critic-7/site-admin_m_3.png`, `shots/final-gate-2/not-found/dark-390.png`, `shots/final-gate-2/not-found/dark-1440.png`, `shots/final-gate-2/not-found/light-390.png`, `shots/final-gate-2/not-found/light-1440.png`, `shots/final-gate-2/branches/dark-390.png`, `shots/final-gate-2/branches/dark-1440.png`, `shots/final-gate-2/branches/light-390.png`, `shots/final-gate-2/branches/light-1440.png`, `shots/final-gate-2/site-admin/dark-390.png`
- **Fix:** In github-* themes drop the version span from view (diagnostic, not a function; app.ini SHOW_FOOTER_VERSION=false would be the all-themes alternative — owner consent needed) and keep the logo + 'Powered by Gitea', language, theme, Licenses, API. Add the 1px `--borderColor-muted` top rule github.com draws; < 768 centre the row with 16px/8px gaps so it wraps as one group, not mid-row.
- **Why this class:** Footer restyle is allowed; attribution stays (FG-004 inherent).

### FG2-029 — Packages: list rows lack the leading 16px package icon; search + Type select + button fused into one 1216px input group; detail title '(1.0.0)' bold in parentheses; versions page has no title and version names are not links-blue; install command clipped at 390 with no copy
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 13 (judge reasons 0 in 0 pairs + critic weight 13) · weakest route 7.5 · **Gate 1:** FG-061
- **Routes** (light/dark/390 critic score; j = judge reasons): package-detail-npm (8.0/8.0/7.5; C110), package-versions (7.5/7.5/7.5; C194 C195), packages-generic (8.5/8.5/8.0; C019), packages-org (8.0/8.0/8.0; C087)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C087 packages-org [minor] Package list/filter keep Gitea structure; C110 package-detail-npm [minor] Title '(1.0.0)' bold in parentheses; no package icon/Latest label; C194 package-versions [minor] No page title; only a 14px breadcrumb; C195 package-versions [minor] Version name is bold default text, not a link; C019 packages-generic [nit] Install command clipped on mobile with no copy affordance
- **PNG:** `docs/reference/apx1-package-detail-npm/light-1440.png`, `shots/final-gate-2/package-detail-npm/light-1440.png`, `shots/final-gate-2/package-versions/light-1440.png`, `shots/final-gate-critic-0/pg-390.png`, `shots/final-gate-2/package-detail-npm/dark-390.png`, `shots/final-gate-2/package-detail-npm/dark-1440.png`, `shots/final-gate-2/package-detail-npm/light-390.png`, `shots/final-gate-2/package-detail-npm/light-1440.png`, `shots/final-gate-2/package-versions/dark-390.png`, `shots/final-gate-2/package-versions/dark-1440.png`
- **Fix:** Row icon via mask; split the filter into TextInput (flex 1) + Type select as a separate 32px button; title: name 600, version muted 400 (parentheses are template text: leave); versions page: 24px Subhead from the breadcrumb's last item, version name `--fgColor-accent` 600; install `<pre>` `overflow-x:auto` (copy button is template: skip).
- **Why this class:** CSS on existing markup.

### FG2-030 — 390 directory / blame toolbar wraps into 3 rows (branch + compare + breadcrumb / Go to file + Add File / lone '…'), ~111px
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 12 (judge reasons 0 in 0 pairs + critic weight 12) · weakest route 7.0 · **Gate 1:** FG-078
- **Routes** (light/dark/390 critic score; j = judge reasons): blame-playground-multiple-authors (7.5/7.5/7.0; C179), blame (8.5/8.5/7.5; C153), directory-tree (8.5/8.5/7.5; C124)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C124 directory-tree [major] @390 toolbar wraps into 3 rows; C153 blame [minor] Mobile file toolbar wraps to 3 rows; C179 blame-playground-multiple-authors [minor] Mobile file toolbar wraps into 3 rows with the kebab alone
- **PNG:** `docs/reference/directory-tree/light-390.png`, `shots/final-gate-critic-5/directory-tree/z-mobile-toolbar.png`, `shots/final-gate-2/blame-playground-multiple-authors/dark-390.png`, `shots/final-gate-2/blame-playground-multiple-authors/light-390.png`, `shots/final-gate-2/blame/dark-390.png`, `shots/final-gate-2/blame/light-390.png`, `shots/final-gate-2/directory-tree/dark-390.png`, `shots/final-gate-2/directory-tree/light-390.png`
- **Fix:** < 768: row 1 = branch picker + breadcrumb (ellipsis), row 2 = Go to file (flex 1) + Add File + '…' + History icon; hide the compare IconButton label; never leave '…' alone on a row. github.com hides Go to file at this width — do not hide ours (feature), just pack it.
- **Why this class:** Flex layout.

### FG2-031 — 390 issue/PR lists: the NavList becomes a clipped horizontal strip ('Created by y…') and the 7 filter dropdowns wrap onto 2 rows in the Box header
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 12 (judge reasons 0 in 0 pairs + critic weight 12) · weakest route 7.5 · **Gate 1:** FG-074
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issues (8.5/8.5/7.5; C170 C172), repo-pulls (8.0/8.0/7.5; C098), issues-list-closed (9.0/9.0/8.5; C082)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C082 issues-list-closed [minor] @390 overflowing NavList pill row and filter bar wrap; C098 repo-pulls [minor] Mobile: 7 filter dropdowns wrap onto two rows in Box header; C170 repo-issues [minor] Mobile left NavList becomes a clipped horizontal strip; C172 repo-issues [minor] Mobile filter bar wraps all 7 filters onto 2 rows
- **PNG:** `docs/reference/issues-list-closed/light-390.png`, `shots/final-gate-critic-4/pulls-390-top.png`, `docs/reference/repo-issues/light-390.png`, `shots/final-gate-critic-7/repo-issues_m_0.png`, `shots/final-gate-2/repo-issues/dark-390.png`, `shots/final-gate-2/repo-issues/light-390.png`, `shots/final-gate-2/repo-pulls/dark-390.png`, `shots/final-gate-2/repo-pulls/light-390.png`, `shots/final-gate-2/issues-list-closed/dark-390.png`, `shots/final-gate-2/issues-list-closed/light-390.png`
- **Fix:** < 768: NavList → a single 'All issues ▾'-style disclosure (show only the selected item; others in a `<details>`-free overflow: horizontal scroll with fade mask if no markup), filters on one horizontally scrolling row (`flex-wrap:nowrap; overflow-x:auto`) with a fade — no filter hidden.
- **Why this class:** CSS on existing markup.

### FG2-032 — Settings empty states (webhooks, deploy keys, collaborators, protected branches, OAuth2 apps, org hooks) are centred muted text or an empty Box, not a Primer Blankslate
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 12 (judge reasons 0 in 0 pairs + critic weight 12) · weakest route 7.5 · **Gate 1:** FG-064
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-settings-collab (8.0/8.0/7.5; C112), repo-settings-hooks (8.5/8.5/8.0; C161), repo-settings-deploykeys (8.2/8.2/8.2; C071), repo-settings-branches (8.3/8.3/8.3; C136), org-settings-hooks (8.5/8.5/8.5; C018), user-settings-applications (8.5/8.5/8.5; C089)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C018 org-settings-hooks [nit] Empty state is plain centred text, not a Blankslate; C071 repo-settings-deploykeys [nit] Bare empty state; C089 user-settings-applications [nit] Empty 'Authorized OAuth2 Applications' shows only a paragraph; C112 repo-settings-collab [minor] Collaborators section is an empty Box with a centered input; C136 repo-settings-branches [minor] Empty protection list is plain text, not a Blankslate; C161 repo-settings-hooks [minor] Empty state not Primer-like
- **PNG:** `shots/final-gate-critic-0/osh-l.png`, `shots/final-gate-2/repo-settings-collab/light-1440.png`, `shots/final-gate-2/repo-settings-collab/dark-1440.png`, `shots/final-gate-2/repo-settings-collab/light-1440.png`, `shots/final-gate-2/repo-settings-hooks/dark-1440.png`, `shots/final-gate-2/repo-settings-hooks/light-1440.png`, `shots/final-gate-2/repo-settings-deploykeys/dark-1440.png`, `shots/final-gate-2/repo-settings-deploykeys/light-1440.png`, `shots/final-gate-2/repo-settings-branches/dark-1440.png`, `shots/final-gate-2/repo-settings-branches/light-1440.png`
- **Fix:** One shared rule for the settings empty segment: bordered Box, 32px padding, 24px Octicon via `::before` mask keyed on the page class (webhook / key / people / git-branch / apps), text 16px/600 heading style for the first line. Collaborators: put the add-collaborator input row in the Box header, not centred in an empty Box.
- **Why this class:** Existing text; icons are pseudo-elements.

### FG2-033 — Logged-out auth pages (login, signup, forgot/reset password, OpenID) keep a lone hamburger IconButton at the top-left; github.com auth pages have no chrome (and a muted footer band)
- **Class:** theme-fixable-css · **Owner:** pages/auth · **Impact:** 12 (judge reasons 3 in 2 pairs + critic weight 9) · weakest route 8.0 · **Gate 1:** FG-063
- **Routes** (light/dark/390 critic score; j = judge reasons): forgot-password (8.0/8.0/8.0; C040), openid-signin (8.3/8.3/8.3; C074), login (9.0/9.0/8.5; j3; C094), reset-password-badcode (8.5/8.5/8.5; C093), signup (8.5/8.5/8.5; C120)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 3
- **Critic:** C040 forgot-password [minor] Stray hamburger icon on logged-out auth pages; C074 openid-signin [nit] Lone hamburger in slim auth header; C093 reset-password-badcode [minor] Lone hamburger button floats top-left on the auth page; C094 login [nit] Footer lacks github.com's muted band; lone hamburger on auth header; C120 signup [nit] Lone hamburger IconButton top-left on desktop auth page
- **Judges say:** “A has a hamburger icon at top left and a 'Powered by Gitea' footer, where GitHub has a gray footer bar with Terms/Privacy/Docs” / “A has a 'Powered by Gitea' footer and a hamburger icon, and lacks the Google/Apple buttons”
- **PNG:** `shots/final-gate-critic-1/forgot-password-d-00.png`, `docs/reference/login/light-1440.png`, `shots/final-gate-2/login/light-1440.png`, `shots/final-gate-critic-4/login-390-l.png`, `shots/final-gate-2/signup/light-1440.png`, `shots/final-gate-2/forgot-password/dark-390.png`, `shots/final-gate-2/forgot-password/dark-1440.png`, `shots/final-gate-2/forgot-password/light-390.png`, `shots/final-gate-2/forgot-password/light-1440.png`, `shots/final-gate-2/openid-signin/dark-390.png`
- **Fix:** `.gh-app-header--auth .gh-app-header-menu { display:none }` on sign-in / sign-up / forgot / reset / openid (every form already links Register ↔ Sign In and the logo links home, so no page becomes unreachable); make sure forgot/reset/openid get `--auth` (ORC-11). Footer: `--bgColor-muted` band with top border on auth pages only.
- **Why this class:** Deliberate in loop 1 (FG-063 kept the drawer); 5 critics + judges still flag it.

### FG2-034 — 390: README box header wraps to two rows (pencil alone on row 2, ~66px) — the blob-header mobile rule `.file-header .file-header-left { flex: 1 0 100% }` also hits `#readme h4.file-header`
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 12 (judge reasons 0 in 0 pairs + critic weight 12) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home-markdown-showcase-playground (9.0/9.0/8.0; C025), repo-home-readme-with-images-and-tables (9.0/9.0/8.0; C030)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C025 repo-home-markdown-showcase-playground [major] README box header wraps to two rows at 390; C030 repo-home-readme-with-images-and-tables [major] README box header wraps to two rows at 390
- **PNG:** `shots/final-gate-critic-1/mdm-01.png`, `shots/final-gate-critic-1/rdm-01.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/dark-390.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/light-390.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-390.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-390.png`
- **Fix:** Scope the rule in src/code/file-view.css (~l.284, mobile block) to the file view: `.non-diff-file-content > .file-header .file-header-left`, or exclude `#readme`. Verify repo-home, repo-home-readme-with-images-and-tables and the markdown showcase at 390.
- **Why this class:** Our own selector leak (same class of bug as the page-class leaks).

### FG2-035 — Milestone rows: bare '0%' under the bar (github.com '0% complete · 2 open · 0 closed'), inline red Delete / danger 'Close'
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 12 (judge reasons 10 in 4 pairs + critic weight 2) · weakest route 8.5 · **Gate 1:** FG-073
- **Routes** (light/dark/390 critic score; j = judge reasons): milestone-issues (8.5/8.5/8.5; C020), milestones (8.5/8.5/8.5; j10; C156)
- **Schemes / viewports:** dark, light / 1440; judge variants page 5, content 5
- **Critic:** C156 milestones [nit] Progress meta sparse; C020 milestone-issues [nit] Close milestone rendered as danger button
- **Judges say:** “A's milestone row shows 'Updated 4 months ago', 'Dec 31, 9998' as a bogus due date, inline Edit/Close/red Delete links and a plain '0%' progress bar” / “GitHub shows 'No due date · 0/2 issues closed' and '0% complete 2 open 0 closed'”
- **PNG:** `shots/final-gate-critic-0/mi-l.png`, `shots/final-gate-2/milestone-issues/dark-1440.png`, `shots/final-gate-2/milestone-issues/light-1440.png`, `shots/final-gate-2/milestones/dark-1440.png`, `shots/final-gate-2/milestones/light-1440.png`, `shots/final-gate-2-pairs/p109.png`, `shots/final-gate-2-pairs/p110.png`, `shots/final-gate-2-pairs/p111.png`
- **Fix:** Put the percentage, open and closed counts on one muted 12px row under the bar (flex order of existing spans); Close = default button, Delete = danger only on hover (Primer). 'Dec 31, 9998' is data (inherent).
- **Why this class:** Flex order + CSS.

### FG2-036 — Open / Closed switch reads '⊙ 8 Open ✓ 51 Closed' (icons, count before label); github.com 'Open 8 | Closed 51' with CounterLabels (issues, PRs, milestones)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 11 (judge reasons 7 in 6 pairs + critic weight 4) · weakest route 7.5 · **Gate 1:** FG-039
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issues (8.5/8.5/7.5; j2; C171), issues-list-closed (9.0/9.0/8.5; j3; C083), milestones (8.5/8.5/8.5; j2)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3, page 4
- **Critic:** C083 issues-list-closed [nit] State toggle uses classic '⊙ 8 Open ✓ 51 Closed' instead of 'Open 8 | Closed 51' CounterLabels; C171 repo-issues [minor] Classic Open/Closed toggle instead of the current CounterLabel style
- **Judges say:** “B's issue list has checkboxes and Gitea filters (Label/Milestone/Project/Author/Assignee/Type/Sort) instead of the query bar and 'Open 8 / Closed 51' tabs” / “B shows '1 Open / 6 Closed' with icons instead of 'Open 1 / Closed 6' counters”
- **PNG:** `docs/reference/repo-issues/light-1440.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2/issues-list-closed/dark-1440.png`, `shots/final-gate-2/issues-list-closed/light-1440.png`, `shots/final-gate-2/milestones/dark-1440.png`, `shots/final-gate-2/milestones/light-1440.png`, `shots/final-gate-2-pairs/p017.png`, `shots/final-gate-2-pairs/p018.png`, `shots/final-gate-2-pairs/p101.png`
- **Fix:** Partial in CSS: hide the two state icons in `.small-menu-items` on list pages, selected item 600 + default colour, unselected muted. Count and label are one text node in openclose.tmpl, so the CounterLabel after the label needs a template (no slot) — say so in the reply.
- **Why this class:** Icons/weight are CSS; count order is template.

### FG2-037 — Commit page: no 'Commit <sha7>' H1 above the message Box; the message is the title inside the Box with Browse Source / Operations
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 11 (judge reasons 8 in 4 pairs + critic weight 3) · weakest route 8.0 · **Gate 1:** FG-045
- **Routes** (light/dark/390 critic score; j = judge reasons): commit-detail (8.0/8.0/8.0; j8; C009)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3, page 5
- **Critic:** C009 commit-detail [minor] Commit header structure differs from github.com
- **Judges say:** “B's commit page has 'Browse Source' and 'Operations' buttons in title case and an '…' expander; there's no 'Commit 99cc347' title” / “B has no 'Commit 99cc347' heading; the commit title sits in a box with 'Browse Source' and 'Operations' buttons”
- **PNG:** `shots/final-gate-critic-0/cd-l.png`, `docs/reference/commit-detail/light-1440.png`, `shots/final-gate-2/commit-detail/dark-1440.png`, `shots/final-gate-2/commit-detail/light-1440.png`, `shots/final-gate-2-pairs/p065.png`, `shots/final-gate-2-pairs/p066.png`, `shots/final-gate-2-pairs/p067.png`
- **Fix:** Gate-1 rejection stands (FG-045, §7 e) unless the last slot goes here; it does not (lower impact than the labels/milestones NavList). CSS mitigation: none (the SHA is not reachable as text for ::before).
- **Why this class:** Needs an H1 with the short SHA (template).

### FG2-038 — Compare page: 'Compare commits' title with a bottom rule and no description; '74 Commits' as a grey Box header with tag labels (github.com: Commits | Files changed tabs); SHA plain text (github.com: small bordered button)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 11 (judge reasons 7 in 4 pairs + critic weight 4) · weakest route 8.0 · **Gate 1:** FG-113
- **Routes** (light/dark/390 critic score; j = judge reasons): compare-two-tags (8.0/8.0/8.0; j7; C013 C015)
- **Schemes / viewports:** dark, light / 1440; judge variants content 4, page 3
- **Critic:** C013 compare-two-tags [minor] Compare header and commits section structure differ; C015 compare-two-tags [nit] Commit sha is plain text, not a bordered button
- **Judges say:** “A has a '74 Commits' header with tag pills instead of GitHub's Commits/Files changed tabs and contributors count” / “B has a '74 Commits' bar with tag chips and no Commits/Files changed tabs or '3 contributors'”
- **PNG:** `shots/final-gate-critic-0/ct-l.png`, `shots/final-gate-2/compare-two-tags/dark-1440.png`, `shots/final-gate-2/compare-two-tags/light-1440.png`, `shots/final-gate-2-pairs/p129.png`, `shots/final-gate-2-pairs/p130.png`, `shots/final-gate-2-pairs/p131.png`
- **Fix:** Drop the title's bottom rule; restyle the '74 Commits' Box header as a single selected UnderlineNav item ('Commits' + Counter) on the page background; SHA in the compare list as the 24px bordered mono button (like repo commits). Tabs / Files changed switch: Gitea shows both on one page (inherent).
- **Why this class:** Restyle only.

### FG2-039 — Labels rows repeat '0 open issues/pull requests' and Edit / Delete on every row (github.com: non-zero icon counts only, actions in a kebab); no 'Search all labels' / Active-Archived header
- **Class:** theme-fixable-template · **Owner:** pages/issues-prs · **Impact:** 11 (judge reasons 8 in 4 pairs + critic weight 3) · weakest route 8.5 · **Gate 1:** FG-051
- **Routes** (light/dark/390 critic score; j = judge reasons): labels (8.5/8.5/8.5; j8; C131)
- **Schemes / viewports:** dark, light / 1440; judge variants content 4, page 4
- **Critic:** C131 labels [minor] Labels page structure differs from current github.com
- **Judges say:** “B shows '0 open issues/pull requests' text plus Edit/Delete on each row” / “B has no left sidebar, a Labels/Milestones toggle, a New Label button and '0 open issues/pull requests' plus Edit/Delete on each row”
- **PNG:** `shots/final-gate-2/labels/light-1440.png`, `docs/reference/labels/light-1440.png`, `shots/final-gate-2/labels/dark-1440.png`, `shots/final-gate-2/labels/light-1440.png`, `shots/final-gate-2-pairs/p105.png`, `shots/final-gate-2-pairs/p106.png`, `shots/final-gate-2-pairs/p107.png`
- **Fix:** Gate-1 FG-051 rejected (a ≤ 10). CSS mitigation: Edit/Delete as 28px invisible IconButtons revealed on row hover/focus-within (always visible < 768); counts muted 12px. Zero counts cannot be detected in CSS.
- **Why this class:** Kebab + conditional counts need markup.

### FG2-040 — 390 settings/admin: page heading squeezed to 3 lines beside its action button (users, repos, orgs); ToggleSwitches wrap under their labels; full NavList (~460px) precedes the content
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 10 (judge reasons 0 in 0 pairs + critic weight 10) · weakest route 7.5 · **Gate 1:** FG-065
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-dashboard-config-settings (8.0/8.0/7.5; C091), admin-orgs (8.5/8.5/7.5; C114), admin-repos (8.5/8.5/7.5; C088), site-admin-users (8.5/8.5/8.0; C004)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C004 site-admin-users [nit] Subhead does not stack on mobile; C088 admin-repos [minor] @390 page heading squeezed into 3 lines next to the action button; C091 admin-dashboard-config-settings [minor] @390 ToggleSwitches wrap under their labels; C114 admin-orgs [minor] Mobile: heading wraps 3 lines beside button; full NavList (~460px) precedes content
- **PNG:** `shots/final-gate-critic-0/site-admin-users-390.png`, `shots/final-gate-critic-4/aorgs-390.png`, `shots/final-gate-2/admin-dashboard-config-settings/dark-390.png`, `shots/final-gate-2/admin-dashboard-config-settings/dark-1440.png`, `shots/final-gate-2/admin-dashboard-config-settings/light-390.png`, `shots/final-gate-2/admin-dashboard-config-settings/light-1440.png`, `shots/final-gate-2/admin-orgs/dark-390.png`, `shots/final-gate-2/admin-orgs/dark-1440.png`, `shots/final-gate-2/admin-orgs/light-390.png`, `shots/final-gate-2/admin-orgs/light-1440.png`
- **Fix:** < 768: Subhead stacks (heading 100%, actions below, left-aligned); toggle rows `flex-wrap:nowrap` with the switch `flex-shrink:0`; collapse the admin NavList to its selected item + disclosure (or move it after the content with `order`).
- **Why this class:** Layout only.

### FG2-041 — README header is a single 'README.md' bar, not github.com's 'README | <license> license' tabs
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 10 (judge reasons 10 in 8 pairs + critic weight 0) · weakest route 8.0 · **Gate 1:** FG-034
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home-readme-with-images-and-tables (9.0/9.0/8.0; j6), repo-home (9.0/9.0/8.5; j4)
- **Schemes / viewports:** dark, light / 1440; judge variants content 5, page 5
- **Judges say:** “A's README header is 'README.md' with a pencil icon, not GitHub's 'README | Apache-2.0 license' tabs; the README badges render as broken-image alt-text links” / “A's README header is 'README.md' with a pencil icon, and its badges render as broken alt-text links”
- **PNG:** `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`, `shots/final-gate-2/repo-home/light-1440.png`, `shots/final-gate-2-pairs/p013.png`, `shots/final-gate-2-pairs/p014.png`, `shots/final-gate-2-pairs/p015.png`
- **Fix:** Rejected in gate 1 (FG-034: impact 13, §7 e) and not proposed for the last slot (lower impact than the labels/milestones NavList). CSS part: readme-header-style.
- **Why this class:** A second tab needs the license file link and markup (template).

### FG2-042 — Settings details: 2FA is prose + buttons (github.com: method Box rows), org avatar upload is a native file input under the form, appearance uses Selects, cache 'Test' button 8px low, description-less org row off-centre, header copy
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 10 (judge reasons 0 in 0 pairs + critic weight 10) · weakest route 8.0 · **Gate 1:** FG-079
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings (8.5/8.5/8.0; C191), user-settings-security (8.1/8.1/8.1; C068), user-settings (8.2/8.2/8.2; C046), site-admin-config (9.0/9.0/8.5; C023), user-settings-appearance (8.5/8.5/8.5; C076), user-settings-orgs (9.0/9.0/8.5; C038)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C023 site-admin-config [nit] 'Test' button in Cache Configuration sits lower than the other values; C038 user-settings-orgs [nit] A row without a description is top-aligned against its avatar; C046 user-settings [nit] Header action copy and missing avatar column; C068 user-settings-security [minor] 2FA shown as prose + button instead of method Box rows; C076 user-settings-appearance [nit] Theme/language are native Selects, not github.com's appearance cards; C191 org-settings [minor] Avatar upload is a native file input below the form
- **PNG:** `shots/final-gate-critic-1/sac-m-04.png`, `shots/final-gate-critic-1/uso-light.png`, `shots/final-gate-2/org-settings/dark-390.png`, `shots/final-gate-2/org-settings/dark-1440.png`, `shots/final-gate-2/org-settings/light-390.png`, `shots/final-gate-2/org-settings/light-1440.png`, `shots/final-gate-2/user-settings-security/dark-390.png`, `shots/final-gate-2/user-settings-security/dark-1440.png`, `shots/final-gate-2/user-settings-security/light-390.png`, `shots/final-gate-2/user-settings-security/light-1440.png`
- **Fix:** Security page: render each method section (TOTP, WebAuthn) as a Box row (title + status Label + action on the right). Org settings: style the file input as a Primer button + muted file name, align Update/Delete. Align `Test` button with `align-self:center`; centre description-less rows. C046/C076 need template changes: skip.
- **Why this class:** Mostly CSS on existing markup.

### FG2-043 — Seed data carries visible markers: '[seed]' descriptions, 'theme-seed' / 'migrated-from-github' topics, org README naming tools/seed/seed.mjs and 'GitHub-lookalike Gitea theme', '(seeded test account)' bios, 'Smoke edit' runs by admin
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 10 (judge reasons 10 in 6 pairs + critic weight 0) · weakest route 8.2 · **Gate 1:** FG-015
- **Routes** (light/dark/390 critic score; j = judge reasons): action-run (8.7/8.7/8.2; j2), actions-list (8.5/8.5/8.5; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants page 5, content 5
- **Judges say:** “B's run meta reads 'CI #183: Commit 9994cec061 pushed by admin' with a 10-char SHA and relative '4 months ago' dates; GitHub shows absolute 'Sep 27, 2:30 PM UTC'” / “A's meta reads 'CI #183: Commit 9994cec061 pushed by admin' with relative '4 months ago' dates”
- **PNG:** `shots/final-gate-2/action-run/dark-1440.png`, `shots/final-gate-2/action-run/light-1440.png`, `shots/final-gate-2/actions-list/dark-1440.png`, `shots/final-gate-2/actions-list/light-1440.png`, `shots/final-gate-2-pairs/p133.png`, `shots/final-gate-2-pairs/p134.png`, `shots/final-gate-2-pairs/p135.png`
- **Fix:** tools/seed: keep a machine-readable marker (repo/org metadata or a manifest) instead of visible '[seed]' prefixes, '(migrated from …)' suffixes, 'theme-seed'/'migrated-from-github' topics and the seed-note README; give smoke runs neutral titles. Never touch pre-seed data (admin/jiri, ai/jiri). Idempotent re-seed.
- **Why this class:** Not a theme defect; removable by the seed tool. Remaining content differences (owner names, counts) stay inherent.

### FG2-044 — Directory listing has no 'Name | Last commit message | Last commit date' header row; '..' parent row sits flush at the top
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 9 (judge reasons 9 in 4 pairs + critic weight 0) · weakest route 7.5 · **Gate 1:** FG-044
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.5/8.5/7.5; j9)
- **Schemes / viewports:** dark, light / 1440; judge variants content 4, page 5
- **Judges say:** “B's file table has no 'Name / Last commit message / Last commit date' header row” / “A's directory table has no Name/Last commit message/Last commit date header row”
- **PNG:** `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`, `shots/final-gate-2-pairs/p057.png`, `shots/final-gate-2-pairs/p058.png`, `shots/final-gate-2-pairs/p059.png`
- **Fix:** Gate-1 FG-044 rejected (Modern-owned `repo/view_list.tmpl`). A CSS approximation exists: the list is a grid, so `#repo-files-table::before` (col 1 'Name') and `::after` with `order:-1` (last column 'Last commit date') under `:lang(en)` give 2 of 3 labels — judge it at the next critic round; not scheduled here.
- **Why this class:** A real header row needs the Modern-owned template.

### FG2-045 — 390: diff summary ('20 changed files with 106 additions…') and the file-tree toggle are hidden in the PR Files / compare toolbars
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 9 (judge reasons 0 in 0 pairs + critic weight 9) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-compare-form-playground (8.0/8.0/7.5; C197), pr-compare-new-playground (8.2/8.2/7.8; C142), pr-files-changed-unified-playground-large-diff (8.8/8.8/8.2; C132)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C132 pr-files-changed-unified-playground-large-diff [minor] @390 diff stats summary and file-tree toggle hidden; C142 pr-compare-new-playground [minor] @390 diff stats summary hidden; C197 pr-compare-form-playground [minor] Mobile hides the changed-files summary
- **PNG:** `shots/final-gate-critic-5/pr-files-changed-unified-playground-large-diff/light-390-0.png`, `shots/final-gate-2/pr-compare-form-playground/dark-390.png`, `shots/final-gate-2/pr-compare-form-playground/light-390.png`, `shots/final-gate-2/pr-compare-new-playground/dark-390.png`, `shots/final-gate-2/pr-compare-new-playground/light-390.png`, `shots/final-gate-2/pr-files-changed-unified-playground-large-diff/dark-390.png`, `shots/final-gate-2/pr-files-changed-unified-playground-large-diff/light-390.png`
- **Fix:** < 768 keep `.diff-detail-stats` visible as a 12px muted line under the toolbar (stack) and keep the tree toggle IconButton; hide nothing that Gitea shows at 1440.
- **Why this class:** Visibility of existing elements.

### FG2-046 — Org settings Labels empty state: centred muted text over a 440px select with a 3-line italic option and 'Use Label Set'; '0 labels' as a 24px Subhead instead of a Box header
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 9 (judge reasons 0 in 0 pairs + critic weight 9) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings-labels (7.5/7.5/7.5; C192 C193)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C192 org-settings-labels [major] Empty state is not a Primer Blankslate; C193 org-settings-labels [minor] '0 labels' is a 24px Subhead, not a Box header
- **PNG:** `shots/final-gate-2/org-settings-labels/light-1440.png`, `shots/final-gate-2/org-settings-labels/dark-1440.png`, `shots/final-gate-2/org-settings-labels/light-1440.png`
- **Fix:** Blankslate Box (24px tag icon via mask, heading, the label-set select + button as the action row, select single-line with ellipsis); '0 labels' + Sort in a muted Box header like the repo labels page.
- **Why this class:** Critic C192 (major): CSS-reachable restyle.

### FG2-047 — Wiki sidebar polish: clone input touches the ToC box at 390 (0 gap), CLS 0.165 from details.gh-wiki-pages opening after load, Pages rows indented 37px with an empty gutter
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 9 (judge reasons 0 in 0 pairs + critic weight 9) · weakest route 7.8 · **Gate 1:** FG-022
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-page-playground (8.2/8.2/7.8; C055 C056 C057)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C055 wiki-page-playground [minor] Clone input touches ToC box on mobile; C056 wiki-page-playground [minor] CLS from details.gh-wiki-pages at 390; C057 wiki-page-playground [minor] Pages rows indented 37px with empty gutter
- **PNG:** `shots/final-gate-critic-2/wiki-page-playground-390-pair-1.png`, `shots/final-gate-critic-2/wiki-side-l.png`, `shots/final-gate-2/wiki-page-playground/dark-390.png`, `shots/final-gate-2/wiki-page-playground/dark-1440.png`, `shots/final-gate-2/wiki-page-playground/light-390.png`, `shots/final-gate-2/wiki-page-playground/light-1440.png`
- **Fix:** 24px gap between the clone Box and the ToC; `details.gh-wiki-pages` is already rendered `open` in our override, so find the late shift (probe the CLS source at 390: list height after font/JS, or the clone input width) and reserve it (min-height / fixed row height); rows 16px indent (or add the chevron github.com draws).
- **Why this class:** CSS + our own override markup (no new slot).

### FG2-048 — Repo sidebar has no stars / watching / forks rows (github.com About box lists them)
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 9 (judge reasons 9 in 6 pairs + critic weight 0) · weakest route 8.0 · **Gate 1:** FG-043
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home-readme-with-images-and-tables (9.0/9.0/8.0; j5), repo-home (9.0/9.0/8.5; j4)
- **Schemes / viewports:** dark, light / 1440; judge variants content 6, page 3
- **Judges say:** “A has no Activity/stars/watching/forks list, no 'Used by', no Contributors and no '+ 15 releases' link” / “A has no Activity/stars/watching/forks, 'Used by' or Contributors”
- **PNG:** `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`, `shots/final-gate-2/repo-home/light-1440.png`, `shots/final-gate-2-pairs/p014.png`, `shots/final-gate-2-pairs/p015.png`, `shots/final-gate-2-pairs/p016.png`
- **Fix:** Gate-1 FG-043 rejected (a ≤ 10, §7 e); unchanged.
- **Why this class:** Needs markup.

### FG2-049 — Tag rows and compare/commit lists still show 10-character SHAs (github.com 7); commits-list SHA in mono where the critic measured github.com sans
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 9 (judge reasons 8 in 4 pairs + critic weight 1) · weakest route 8.5 · **Gate 1:** FG-018
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-commits (8.5/8.5/8.5; C176), tags (8.8/8.8/8.6; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants content 4, page 4
- **Critic:** C176 repo-commits [nit] Commit SHA uses the monospace stack
- **Judges say:** “A's rows use relative dates, 10-char SHAs and 'Release details', with no '…' button next to the tag” / “B's rows use relative dates, 10-char SHAs and 'Release details', with no '…' ellipsis”
- **PNG:** `shots/final-gate-2/repo-commits/dark-1440.png`, `shots/final-gate-2/repo-commits/light-1440.png`, `shots/final-gate-2/tags/dark-1440.png`, `shots/final-gate-2/tags/light-1440.png`, `shots/final-gate-2-pairs/p073.png`, `shots/final-gate-2-pairs/p074.png`, `shots/final-gate-2-pairs/p075.png`
- **Fix:** Clip the SHA text to 7ch: `.tag-list .sha, #commits-table .sha … { display:inline-block; max-width:7ch; overflow:hidden; text-overflow:clip; font-family:mono }` (the link/title keeps the full SHA). Verify the font question (C176) against docs/reference/repo-commits before changing mono → sans.
- **Why this class:** CSS clip of existing text.

### FG2-050 — 390: PR TabNav (Conversation / Commits / Files Changed) clips 'Files Changed' and its counter at the right edge
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 8 (judge reasons 0 in 0 pairs + critic weight 8) · weakest route 6.5 · **Gate 1:** FG-029
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-split-playground-large-diff (8.5/8.5/6.5; C108), pr-conversation-playground-large-diff-reviews (8.5/8.5/8.0; C085), pr-files-changed-unified-playground-large-diff (8.8/8.8/8.2; C133), repo-pull-files (9.0/9.0/8.5; C151)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C085 pr-conversation-playground-large-diff-reviews [minor] @390 PR tabnav cuts off 'Files Changed' and its count; C108 pr-files-changed-split-playground-large-diff [minor] Mobile: 'Files Changed 20' tab clipped at right edge; C133 pr-files-changed-unified-playground-large-diff [nit] @390 active tab clipped; C151 repo-pull-files [nit] Mobile PR tabs clipped
- **PNG:** `shots/final-gate-critic-4/pfs-390-0.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-390.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-390.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-1440.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/dark-390.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/dark-1440.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/light-390.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/light-1440.png`, `shots/final-gate-2/pr-files-changed-unified-playground-large-diff/dark-390.png`
- **Fix:** < 768: `.pull.tabular.menu` items padding 8px, gap 0, icon 16px kept, font 14px; if still > 358px allow `overflow-x:auto` with a right-edge fade mask (github.com also scrolls here) and `scroll-snap`; never clip the counter.
- **Why this class:** CSS on existing tabs.

### FG2-051 — Projects: board's 4th column clipped at 1440 with no scroll cue; column wells end at y≈763 regardless of content; mobile header buttons break into two rows; list Open/Closed without Counters and inline Edit/Close/Delete
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 8 (judge reasons 0 in 0 pairs + critic weight 8) · weakest route 7.5 · **Gate 1:** FG-055
- **Routes** (light/dark/390 critic score; j = judge reasons): project-board (8.0/8.0/7.5; C158 C159 C160), projects-list (8.5/8.5/8.5; C134)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C158 project-board [minor] Last column clipped at 1440; C159 project-board [minor] Columns fixed height; C160 project-board [nit] Mobile header button group breaks apart; C134 projects-list [nit] Open/Closed lack Counter pills; per-row actions inline
- **PNG:** `docs/reference/apx1-projects-list/light-1440.png`, `shots/final-gate-2/projects-list/light-1440.png`, `shots/final-gate-2/project-board/dark-390.png`, `shots/final-gate-2/project-board/dark-1440.png`, `shots/final-gate-2/project-board/light-390.png`, `shots/final-gate-2/project-board/light-1440.png`, `shots/final-gate-2/projects-list/dark-390.png`, `shots/final-gate-2/projects-list/dark-1440.png`, `shots/final-gate-2/projects-list/light-390.png`, `shots/final-gate-2/projects-list/light-1440.png`
- **Fix:** Board: `overflow-x:auto` + right fade, columns `min-height: calc(100vh - header)` instead of a fixed height; header button group `flex-wrap:nowrap` with overflow; list header counts as Counters if separate spans; row actions revealed on hover.
- **Why this class:** CSS.

### FG2-052 — 390 comment headers wrap: 'commented 4 months / ago', '(Migrated from github.com)' on its own line, kebab/reactions squeezing the time
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 8 (judge reasons 0 in 0 pairs + critic weight 8) · weakest route 8.0 · **Gate 1:** FG-046
- **Routes** (light/dark/390 critic score; j = judge reasons): issue-detail-playground-reactions-alerts-tables (8.5/8.5/8.0; C104), issue-playground-1 (8.5/8.5/8.0; C165), pr-conversation-open (8.5/8.5/8.0; C184), repo-issue (8.5/8.5/8.0; C077)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C104 issue-detail-playground-reactions-alerts-tables [minor] Mobile comment headers wrap 'ago' to a second line; C165 issue-playground-1 [minor] Comment header wraps orphan 'ago' on mobile; C077 repo-issue [nit] @390 comment headers and composer toolbar wrap to two lines; C184 pr-conversation-open [nit] Mobile comment header wraps mid-timestamp
- **PNG:** `shots/final-gate-critic-4/idp-390-0.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/dark-390.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/dark-1440.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/light-390.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/light-1440.png`, `shots/final-gate-2/issue-playground-1/dark-390.png`, `shots/final-gate-2/issue-playground-1/dark-1440.png`, `shots/final-gate-2/issue-playground-1/light-390.png`, `shots/final-gate-2/issue-playground-1/light-1440.png`, `shots/final-gate-2/pr-conversation-open/dark-390.png`
- **Fix:** < 768: header is one flex row `min-width:0`; author + time truncate with ellipsis (`white-space:nowrap` on the time), reactions/kebab `flex-shrink:0`; the '(Migrated …)' note drops to a second 12px muted line as a whole. Composer toolbar (C077): single row with overflow.
- **Why this class:** Flex layout.

### FG2-053 — Release detail reuses the list chrome (Releases | Tags toggle, RSS Feed, New Release) instead of a 'Releases / v1.4.6' breadcrumb
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 8 (judge reasons 5 in 3 pairs + critic weight 3) · weakest route 8.5 · **Gate 1:** FG-110
- **Routes** (light/dark/390 critic score; j = judge reasons): release-detail (8.5/8.5/8.5; j5; C102)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3, page 2
- **Critic:** C102 release-detail [minor] Detail page reuses list chrome instead of 'Releases / v1.4.6' breadcrumb
- **Judges say:** “B has no Contributors section, no reactions and no 'Releases / v1.4.6' breadcrumb” / “A has a '16 Releases | 16 Tags' segmented control plus 'RSS Feed' and 'New Release' buttons, with no 'Releases / v1.4.6' breadcrumb”
- **PNG:** `shots/final-gate-2/release-detail/light-1440.png`, `docs/reference/release-detail/light-1440.png`, `shots/final-gate-2/release-detail/dark-1440.png`, `shots/final-gate-2/release-detail/light-1440.png`, `shots/final-gate-2-pairs/p081.png`, `shots/final-gate-2-pairs/p082.png`, `shots/final-gate-2-pairs/p084.png`
- **Fix:** Rejected in gate 1 (FG-110, a ≤ 10) and still low impact; not proposed for the last slot. No CSS path (the breadcrumb needs the tag name as text).
- **Why this class:** Breadcrumb needs markup.

### FG2-054 — 390 anonymous AppHeader overflows by 6px when the context crumb is long ('Page Not Found'); Register button ends at x=396
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 6.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found-anon (8.0/8.0/6.5; C118 C119)
- **Schemes / viewports:** light / 390, 1440
- **Critic:** C118 not-found-anon [major] 390: header overflows viewport by 6px (Register button right=396); C119 not-found-anon [nit] 'Page Not Found' crumb in the header
- **PNG:** `shots/final-gate-2/not-found-anon/light-390.png`, `shots/final-gate-critic-4/nf-390.png`, `shots/final-gate-2/not-found-anon/light-1440.png`, `shots/final-gate-2/not-found-anon/light-390.png`, `shots/final-gate-2/not-found-anon/light-1440.png`
- **Fix:** `.gh-app-header-end { flex-shrink: 0 }` and let `.gh-app-header-context` shrink with `min-width:0; overflow:hidden; text-overflow:ellipsis` (integrator note in navigation.md, loop 1). Check /nope-404 and /user/forgot_password anonymous at 390: scrollWidth must be 390.
- **Why this class:** Flex sizing; the only critic major on navigation this gate.

### FG2-055 — 390: full-bleed file box / commit bar / blame box keep 6px radius and side borders at the viewport edge while the breadcrumb keeps the 16px gutter
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.0 · **Gate 1:** FG-054
- **Routes** (light/dark/390 critic score; j = judge reasons): blame-playground-multiple-authors (7.5/7.5/7.0; C180), file-view-image-playground (8.5/8.5/7.5; C100), file-view-large-file-playground (8.5/8.5/8.0; C079)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C079 file-view-large-file-playground [minor] @390 full-bleed commit box and file Box keep 6px radius and side borders at the viewport edge; C100 file-view-image-playground [minor] Mobile: full-bleed file box and commit bar keep radius and side borders; C180 blame-playground-multiple-authors [nit] Mobile file box is edge-to-edge while the page keeps a 16px gutter
- **PNG:** `shots/final-gate-critic-4/fvi-390-zoom.png`, `shots/final-gate-2/blame-playground-multiple-authors/dark-390.png`, `shots/final-gate-2/blame-playground-multiple-authors/light-390.png`, `shots/final-gate-2/file-view-image-playground/dark-390.png`, `shots/final-gate-2/file-view-image-playground/light-390.png`, `shots/final-gate-2/file-view-large-file-playground/dark-390.png`, `shots/final-gate-2/file-view-large-file-playground/light-390.png`
- **Fix:** Either drop radius + left/right borders on the full-bleed boxes (Primer responsive Box) or return them to the 16px gutter; pick one for file view, image view and blame (code/file-view.css:303, FG-054).
- **Why this class:** CSS.

### FG2-056 — 390 run / job view: full Summary / jobs sidebar stacks below the content; no job selector under the title; no 'Search logs' input
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): action-job (8.5/8.5/7.5; C115), action-run (8.7/8.7/8.2; C062), action-job-ok (8.8/8.8/8.3; C140)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C062 action-run [minor] Mobile shows full jobs sidebar below graph; C115 action-job [minor] No 'Search logs' input; mobile job list stacks below log; C140 action-job-ok [nit] @390 no job selector in header
- **PNG:** `docs/reference/crit-app-action-job/light-390.png`, `shots/final-gate-critic-4/aj-390.png`, `shots/final-gate-2/action-job/dark-390.png`, `shots/final-gate-2/action-job/light-390.png`, `shots/final-gate-2/action-run/dark-390.png`, `shots/final-gate-2/action-run/light-390.png`, `shots/final-gate-2/action-job-ok/dark-390.png`, `shots/final-gate-2/action-job-ok/light-390.png`
- **Fix:** < 768: move the jobs list above the content (`order:-1`) as a compact 1-row list (selected job only + count), keep the rest reachable below. 'Search logs' has no Gitea feature (Vue view): skip.
- **Why this class:** order/layout on the Vue view (lazy CSS → important file).

### FG2-057 — Profile README Box has no '<user> / README.md' caption header
- **Class:** theme-fixable-template · **Owner:** pages/people · **Impact:** 7 (judge reasons 7 in 4 pairs + critic weight 0) · weakest route 8.0 · **Gate 1:** FG-053
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile (8.5/8.5/8.0; j7)
- **Schemes / viewports:** dark, light / 1440; judge variants content 4, page 3
- **Judges say:** “B's README card has no 'user/README.md' breadcrumb header” / “B README card does not show the 'pemistahl / README.md' label and uses a table-style layout”
- **PNG:** `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-2-pairs/p009.png`, `shots/final-gate-2-pairs/p010.png`, `shots/final-gate-2-pairs/p011.png`
- **Fix:** Gate-1 FG-053 rejected (a ≤ 10). CSS could only add a static 'README.md' caption (the user name is not reachable in CSS); worth it as a cheap partial: `.user.profile #readme::before { content: "README.md" }` mono 12px in a Box header.
- **Why this class:** Full caption needs the user name (template).

### FG2-058 — 390: split diff soft-wraps into ~13-character columns (page 44,250px tall vs 9,236 at 1440)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 6.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-split-playground-large-diff (8.5/8.5/6.5; C106)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C106 pr-files-changed-split-playground-large-diff [major] Mobile: split diff soft-wraps into ~13-char columns
- **PNG:** `shots/final-gate-critic-4/pfs-390-0.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-390.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-390.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-1440.png`
- **Fix:** < 768 in split view: `.code-diff-split td.lines-code { white-space: pre }` inside a horizontally scrolling `.diff-file-body` (overflow-x:auto), min column width ~40ch; or render the split table with `table-layout:auto` + scroll. Do not force unified (user preference).
- **Why this class:** CSS on the diff table.

### FG2-059 — Issue page content spans 1232px (x=104-1336) while other repo pages span 1216px; PR compare form is fluid (1376px)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.5 · **Gate 1:** FG-119
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-compare-form-playground (8.0/8.0/7.5; C196), issue-playground-1 (8.5/8.5/8.0; C164)
- **Schemes / viewports:** light / 1440
- **Critic:** C164 issue-playground-1 [minor] Issue container 8px wider than rest of site; C196 pr-compare-form-playground [minor] Page is fluid (1376px) instead of container-xl (1280px)
- **PNG:** `shots/final-gate-2/pr-compare-form-playground/light-1440.png`, `shots/final-gate-2/issue-playground-1/light-1440.png`
- **Fix:** Use the same container rule as other repo pages on `.repository.view.issue` and `.repository.compare.pull` (verify with the leak check which pages each scope reaches).
- **Why this class:** CSS.

### FG2-060 — 390 latest-commit bar: both author names and the connector are ellipsized ('Joel Nati… a… Peter M. …'); github.com keeps names on one line and moves actions to a second line
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.5/8.5/7.5; C125)
- **Schemes / viewports:** light / 390
- **Critic:** C125 directory-tree [major] @390 latest-commit bar truncates authors and the connector word
- **PNG:** `shots/final-gate-2/directory-tree/light-390.png`, `shots/final-gate-2/directory-tree/light-390.png`
- **Fix:** < 768: `#repo-files-table .repo-file-line` (latest commit) wraps into two rows: avatars + authors + 'and' (no ellipsis on the connector, `flex-shrink:0`) + time on row 1; message/SHA/history on row 2.
- **Why this class:** Flex layout of existing markup.

### FG2-061 — In-text and meta author links are not underlined (github.com underlines them: 'X opened on …', inline body links)
- **Class:** theme-fixable-css · **Owner:** foundation · **Impact:** 6 (judge reasons 4 in 4 pairs + critic weight 2) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issues (8.5/8.5/7.5; j1; C174), compare-two-tags (8.0/8.0/8.0; j2), user-settings-security (8.1/8.1/8.1; C069), issues-list-closed (9.0/9.0/8.5; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants page 3, content 1
- **Critic:** C069 user-settings-security [nit] Inline body link not underlined; C174 repo-issues [nit] Author in row meta is plain text, not an underlined muted link
- **Judges say:** “A's metadata reads 'opened 3 years ago by X' with a plain username; GitHub reads 'X opened on Sep 14, 2024' with an underlined username” / “A lists commits newest-first with relative '2 years ago' dates, no 'Commits on <date>' labels and no Verified badges, and author names are not underlined links”
- **PNG:** `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2/compare-two-tags/dark-1440.png`, `shots/final-gate-2/compare-two-tags/light-1440.png`, `shots/final-gate-2/user-settings-security/dark-1440.png`, `shots/final-gate-2/user-settings-security/light-1440.png`, `shots/final-gate-2/issues-list-closed/dark-1440.png`, `shots/final-gate-2/issues-list-closed/light-1440.png`, `shots/final-gate-2-pairs/p017.png`, `shots/final-gate-2-pairs/p101.png`
- **Fix:** Primer link-underline behaviour: `.markup p a`, `.flex-item-body a.muted`, issue/commit meta author links → `text-decoration: underline; text-underline-offset: .2rem` (github.com default 'link underlines' preference). Check the reference PNGs for which meta links are underlined before widening.
- **Why this class:** CSS.

### FG2-062 — Release 'Downloads' disclosure: native marker, no Counter, collapsed on every release (the with-assets route never shows its assets); no divider under the byline at 390
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 6 (judge reasons 1 in 1 pairs + critic weight 5) · weakest route 7.5 · **Gate 1:** FG-037
- **Routes** (light/dark/390 critic score; j = judge reasons): releases (7.5/7.5/8.5; C081), releases-playground-with-assets-prerelease-draft (8.5/8.5/7.8; C129), release-detail (8.5/8.5/8.5; j1; C103)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 1
- **Critic:** C081 releases [nit] Assets disclosure lacks CounterLabel; mobile full-width New Release button; C103 release-detail [nit] 'Downloads' without counter; mobile missing hr under byline; C129 releases-playground-with-assets-prerelease-draft [minor] Downloads summary uses the native marker, has no counter, and is always collapsed
- **Judges say:** “A's asset section is titled 'Downloads' with no count badge; sizes are in MiB/KiB with info icons; there are no sha256 digests or copy buttons”
- **PNG:** `shots/final-gate-critic-4/rel-390a.png`, `shots/final-gate-2/releases/dark-390.png`, `shots/final-gate-2/releases/dark-1440.png`, `shots/final-gate-2/releases/light-390.png`, `shots/final-gate-2/releases/light-1440.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/dark-390.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/dark-1440.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/light-390.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/light-1440.png`, `shots/final-gate-2/release-detail/dark-390.png`
- **Fix:** `summary::marker` off + Octicon triangle-right/down mask, 16px/600; optional Counter via `details:has(li:nth-child(N):last-child) summary::after` (N ≤ 12). The open/closed default is Gitea behaviour (template attribute): leave it. Add the 1px divider under the byline < 768. 'Downloads' wording stays (inherent).
- **Why this class:** CSS on existing disclosure.

### FG2-063 — New-repository form is a 768px boxed card with a grey 'New Repository' Box header; github.com/new is an unboxed page (24px heading + subtitle + Subhead rule, Owner / name side by side)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-create (7.5/7.5/7.5; C092)
- **Schemes / viewports:** light / 1440
- **Critic:** C092 repo-create [major] New-repo form sits in a boxed card with a gray Box-header; github.com/new is an unboxed page
- **PNG:** `shots/final-gate-2/repo-create/light-1440.png`
- **Fix:** `.repository.new-repo`: drop the attached segment border/bg; header → 24px Subhead with bottom rule; grid Owner '/' Repository name on one row. Visibility radio cards: template-level, skip.
- **Why this class:** Critic C092 (major): CSS-reachable.

### FG2-064 — 390 releases: header row (Releases | Tags, RSS, New Release) inset 15px more than the cards; title row strands the red status × and the 'Stable' label on their own lines
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.8 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): releases-playground-with-assets-prerelease-draft (8.5/8.5/7.8; C127 C128)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C127 releases-playground-with-assets-prerelease-draft [minor] @390 header row inset 15px more than the cards; C128 releases-playground-with-assets-prerelease-draft [minor] @390 title row wraps awkwardly
- **PNG:** `shots/final-gate-critic-5/releases-playground-with-assets-prerelease-draft/z-mobile-header-inset.png`, `shots/final-gate-critic-5/releases-playground-with-assets-prerelease-draft/light-390-1.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/dark-390.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/light-390.png`
- **Fix:** Align the header row to the 16px gutter; title row `flex-wrap:wrap` with the status icon inline before the title and the label inline after it.
- **Why this class:** CSS.

### FG2-065 — Auth forms: 'Account recovery is disabled' message is bare centred text (github.com: 340px bordered muted Box); OpenID logo drawn in the heading and field label
- **Class:** theme-fixable-css · **Owner:** pages/auth · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 8.0 · **Gate 1:** FG-092
- **Routes** (light/dark/390 critic score; j = judge reasons): forgot-password (8.0/8.0/8.0; C041), openid-signin (8.3/8.3/8.3; C073)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C041 forgot-password [minor] Mail-disabled message has no container; C073 openid-signin [minor] OpenID logo in heading and field label
- **PNG:** `shots/final-gate-critic-1/fp-light.png`, `shots/final-gate-2/forgot-password/dark-1440.png`, `shots/final-gate-2/forgot-password/light-1440.png`, `shots/final-gate-2/openid-signin/dark-1440.png`, `shots/final-gate-2/openid-signin/light-1440.png`
- **Fix:** Wrap the forgot-password message in the same 340px auth Box (`--bgColor-muted`, 1px border, 6px radius, 16px padding); hide `fontawesome-openid` inside `h4.ui.top.attached` and `label` on `.user.signin.openid` (brand icon, presentational there).
- **Why this class:** CSS on existing markup.

### FG2-066 — People details: dashboard repo filter looks focused at rest (autofocus + accent border), 40px README inset at 390 on org home, row avatars centred against multi-line meta, ragged team meta column, 'Block user' 12px and tight vcard rows, no Star button on starred rows
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 8.0 · **Gate 1:** FG-083
- **Routes** (light/dark/390 critic score; j = judge reasons): org-home (8.5/8.5/8.0; C007), user-profile (8.5/8.5/8.0; C145), user-profile-stars-tab (8.5/8.5/8.0; C188), org-teams (8.4/8.4/8.4; C065), home (8.5/8.5/8.5; C002), explore-users (8.8/8.8/8.7; C043)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C002 home [nit] Autofocused repo filter still looks focused at rest; C007 org-home [nit] README box too padded on mobile; C043 explore-users [nit] Row avatars vertically centred; C065 org-teams [nit] Ragged right meta column; C145 user-profile [nit] Block user text small, vcard rows tight; C188 user-profile-stars-tab [nit] No Starred/Star button on each row
- **PNG:** `shots/final-gate-critic-0/home-left-zoom.png`, `shots/final-gate-critic-0/oh-390-a.png`, `shots/final-gate-critic-2/explore-users-390-pair.png`, `shots/final-gate-2/org-home/dark-390.png`, `shots/final-gate-2/org-home/dark-1440.png`, `shots/final-gate-2/org-home/light-390.png`, `shots/final-gate-2/org-home/light-1440.png`, `shots/final-gate-2/user-profile/dark-390.png`, `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-390.png`
- **Fix:** `.repos-search input:focus:placeholder-shown` border `--borderColor-default`; org README Box-body 16px < 768; `align-items:flex-start` on explore/user rows; fixed-width right column for team meta; 'Block user' 14px, vcard row gap 8px. C188 needs markup: skip.
- **Why this class:** CSS.

### FG2-067 — 390 repo home: the whole sidebar (description, topics, size, code search, Releases, Languages) sits between the file list and the README
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 8.0 · **Gate 1:** FG-078
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home-markdown-showcase-playground (9.0/9.0/8.0; C026), repo-home-readme-with-images-and-tables (9.0/9.0/8.0; C031)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C026 repo-home-markdown-showcase-playground [minor] Mobile section order puts the whole sidebar above the README; C031 repo-home-readme-with-images-and-tables [minor] Mobile: whole About/Releases/Languages sidebar sits before the README
- **PNG:** `shots/final-gate-critic-1/mdm-01.png`, `shots/final-gate-critic-1/rdm-01.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/dark-390.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/light-390.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-390.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-390.png`
- **Fix:** < 768: grid/flex `order` so description + topics stay above the file list (under the title) and Releases / Languages / code search follow the README (github.com mobile order).
- **Why this class:** order only.

### FG2-068 — Diff file header: diffstat '+3 −3 ■■■■■' at the right (github.com: count + blocks before the file name), no expand/collapse chevron look, rename-only files show an empty body
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 5 (judge reasons 2 in 2 pairs + critic weight 3) · weakest route 6.5 · **Gate 1:** FG-096
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-split-playground-large-diff (8.5/8.5/6.5; C109), repo-pull-files (9.0/9.0/8.5; j1), pr-files-changed-unified (9.0/9.0/8.8; j1; C059 C060)
- **Schemes / viewports:** dark, light / 1440; judge variants content 2
- **Critic:** C059 pr-files-changed-unified [nit] Diffstat position in file header; C060 pr-files-changed-unified [nit] No markdown highlighting in diff; C109 pr-files-changed-split-playground-large-diff [nit] Rename-only file has empty body and no chevron
- **Judges say:** “B's diff file header has a 'Viewed' checkbox and no expand-all icon or code/rich view toggle” / “A file header is missing GitHub's collapse/expand controls, the diffstat count before the filename, and the code/file view buttons”
- **PNG:** `shots/final-gate-critic-4/pfs-light-3.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-1440.png`, `shots/final-gate-2/repo-pull-files/dark-1440.png`, `shots/final-gate-2/repo-pull-files/light-1440.png`, `shots/final-gate-2/pr-files-changed-unified/dark-1440.png`, `shots/final-gate-2/pr-files-changed-unified/light-1440.png`, `shots/final-gate-2-pairs/p042.png`, `shots/final-gate-2-pairs/p126.png`
- **Fix:** `.diff-file-header`: `order` the stats before the name, chevron fold button first (Octicon chevron-down, rotate when folded); rename-only (empty body) → muted 'File renamed without changes.' is template text — style the empty body as a 32px muted row. C060 markdown highlighting is Chroma: skip.
- **Why this class:** Flex order + CSS.

### FG2-069 — Overlay details: single-select filter menus show radio circles (Primer: check mark), labels SelectPanel rows show full pills (Primer: dot + name + description), compare SelectPanel has no title, branch names break mid-word, Flash icon wraps under text at 390
- **Class:** theme-fixable-css · **Owner:** overlays · **Impact:** 5 (judge reasons 0 in 0 pairs + critic weight 5) · weakest route 7.8 · **Gate 1:** FG-121
- **Routes** (light/dark/390 critic score; j = judge reasons): releases-playground-with-assets-prerelease-draft (8.5/8.5/7.8; C130), repo-issue (8.5/8.5/8.0; C078), repo-home (9.0/9.0/8.5; C150), user-profile-repositories-tab (8.5/8.5/8.5; C017), user-settings-account (9.0/9.0/8.5; C037)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C017 user-profile-repositories-tab [nit] Filter menu uses radio circles instead of check marks; C037 user-settings-account [nit] Flash icon wraps under the text on mobile; C078 repo-issue [nit] Labels SelectPanel rows show pill labels instead of dot + name + description; C130 releases-playground-with-assets-prerelease-draft [nit] Compare SelectPanel has no title header; C150 repo-home [nit] Branch picker breaks names mid-word
- **PNG:** `shots/final-gate-critic-0/st-up.png`, `shots/final-gate-critic-1/usam-01.png`, `shots/final-gate-critic-5/live/releases-playground-with-assets-prerelease-draft/states/light-1440-compare-open.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/dark-390.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/dark-1440.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/light-390.png`, `shots/final-gate-2/releases-playground-with-assets-prerelease-draft/light-1440.png`, `shots/final-gate-2/repo-issue/dark-390.png`, `shots/final-gate-2/repo-issue/dark-1440.png`, `shots/final-gate-2/repo-issue/light-390.png`
- **Fix:** Radio → check Octicon on the selected item; label rows: 14px colour dot (from the inline background) + name + muted description; branch items `overflow-wrap:normal; text-overflow:ellipsis`; Flash grid (icon column + text column). SelectPanel titles need markup: skip.
- **Why this class:** CSS.

### FG2-070 — Profile: follower / following counts not bold (github.com: bold default-colour counts, muted lowercase labels)
- **Class:** theme-fixable-template · **Owner:** pages/people · **Impact:** 5 (judge reasons 2 in 2 pairs + critic weight 3) · weakest route 8.0 · **Gate 1:** FG-052
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile (8.5/8.5/8.0; j1; C144), user-profile-stars-tab (8.5/8.5/8.0; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants content 1, page 1
- **Critic:** C144 user-profile [minor] Follower counts not bold
- **Judges say:** “B has an RSS icon after '3 Followers · 2 Following', a public email and a 'Joined on Sep 29, 2026' line; GitHub uses lowercase 'followers'/'following' with bold counts” / “A profile shows the email, 'Joined on …', an RSS icon and 'Block user' (GitHub: 'Block or report user'); 'Followers · Following' are capitalized with no bold numbers”
- **PNG:** `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-critic-6/up-l-left.png`, `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-2/user-profile-stars-tab/dark-1440.png`, `shots/final-gate-2/user-profile-stars-tab/light-1440.png`, `shots/final-gate-2-pairs/p010.png`, `shots/final-gate-2-pairs/p143.png`
- **Fix:** No CSS path: count and label are one text node (`{{.NumFollowers}} {{ctx.Locale.Tr "user.followers"}}` in shared/user/profile_big_avatar.tmpl) and that override was rejected (PPL-T1). Not proposed for the last slot (impact below the labels/milestones NavList).
- **Why this class:** Needs a wrapper element (template).

### FG2-071 — Actions run rows: 'Commit 9994cec061' shows the 10-character SHA underlined
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 5 (judge reasons 5 in 4 pairs + critic weight 0) · weakest route 8.5 · **Gate 1:** FG-018
- **Routes** (light/dark/390 critic score; j = judge reasons): actions-list (8.5/8.5/8.5; j5)
- **Schemes / viewports:** dark, light / 1440; judge variants page 3, content 2
- **Judges say:** “B's run meta reads 'CI #183: Commit 9994cec061 pushed by admin' with a 10-char SHA and relative '4 months ago' dates; GitHub shows absolute 'Sep 27, 2:30 PM UTC'” / “A's meta reads 'CI #183: Commit 9994cec061 pushed by admin' with relative '4 months ago' dates”
- **PNG:** `shots/final-gate-2/actions-list/dark-1440.png`, `shots/final-gate-2/actions-list/light-1440.png`, `shots/final-gate-2-pairs/p133.png`, `shots/final-gate-2-pairs/p134.png`, `shots/final-gate-2-pairs/p135.png`
- **Fix:** Clip the commit link in `.run-list-item-meta` (or equivalent) to 7ch, no underline until hover, mono 12px.
- **Why this class:** CSS.

### FG2-072 — Issue/PR details: unlinked PR author muted 400 (github.com semibold default), copy icon inside the branch label, sidebar Delete not danger, uneven sidebar heading gaps, doubled gaps in 'Remove WIP: prefix', merge-box icons float on wrapped lines
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5 · **Gate 1:** FG-069
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-draft-wip-playground (8.0/8.0/7.5; C186 C187), issue-playground-1 (8.5/8.5/8.0; C166), repo-pull (9.0/9.0/8.7; C122)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C122 repo-pull [nit] Unlinked author in PR meta is muted regular, not semibold; C166 issue-playground-1 [nit] Sidebar Delete not danger; heading gaps inconsistent; C186 pr-draft-wip-playground [nit] 'Remove  WIP:  prefix' has doubled gaps; C187 pr-draft-wip-playground [nit] Mobile merge-box status icons misaligned
- **PNG:** `shots/final-gate-critic-5/repo-pull/z-meta-light.png`, `shots/final-gate-2/pr-draft-wip-playground/dark-1440.png`, `shots/final-gate-2/pr-draft-wip-playground/light-1440.png`, `shots/final-gate-2/issue-playground-1/dark-1440.png`, `shots/final-gate-2/issue-playground-1/light-1440.png`, `shots/final-gate-2/repo-pull/dark-1440.png`, `shots/final-gate-2/repo-pull/light-1440.png`
- **Fix:** Author 600 `--fgColor-default`; copy IconButton after the branch label; sidebar Delete `--fgColor-danger`; 8px heading→content gap everywhere; collapse whitespace around the WIP `<strong>` (word-spacing on the container); merge-box icons `align-self:flex-start` with 2px top offset.
- **Why this class:** CSS.

### FG2-073 — PR timeline commit SHAs drawn as bordered chips ('2d51c41304'); github.com uses plain muted mono links
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5 · **Gate 1:** FG-084
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-draft-wip-playground (8.0/8.0/7.5; C185), pr-conversation-playground-large-diff-reviews (8.5/8.5/8.0; C086)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C086 pr-conversation-playground-large-diff-reviews [nit] Timeline commit SHAs rendered as bordered chips; C185 pr-draft-wip-playground [minor] Timeline commit SHA drawn as a bordered box
- **PNG:** `shots/final-gate-critic-7/draft_sha_zoom.png`, `shots/final-gate-2/pr-draft-wip-playground/dark-1440.png`, `shots/final-gate-2/pr-draft-wip-playground/light-1440.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/dark-1440.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/light-1440.png`
- **Fix:** `.timeline .commit-sha` / `.shabox` in timeline commit rows: no border/background, `--fgColor-muted` mono 12px, 7ch clip.
- **Why this class:** CSS.

### FG2-074 — New-PR compare: '1 Commits' is an empty 54px Box header with no body; range editor on white (github.com muted); 8px timeline stub at 390
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.8 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-compare-new-playground (8.2/8.2/7.8; C141 C143)
- **Schemes / viewports:** light / 390, 1440
- **Critic:** C141 pr-compare-new-playground [minor] '1 Commits' is an empty Box header bar; C143 pr-compare-new-playground [nit] Range editor box is white, not muted
- **PNG:** `shots/final-gate-critic-5/pr-compare-new-playground/z-mobile-commits.png`, `shots/final-gate-2/pr-compare-new-playground/light-390.png`, `shots/final-gate-2/pr-compare-new-playground/light-1440.png`
- **Fix:** Collapse the empty Box header (no border when no rows follow; or restyle as a muted heading line), range editor `--bgColor-muted`, drop the rail stub < 768.
- **Why this class:** CSS.

### FG2-075 — 390 admin tables: heavy radial scroll shadow on the right edge (skips the header row) and ellipsized cells although the table scrolls; sort indicator is a filled caret
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 8.0 · **Gate 1:** FG-082
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-emails (8.7/8.7/8.0; C137 C138)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C137 admin-emails [minor] @390 heavy table scroll shadow; cells truncated; C138 admin-emails [nit] Sort indicator is a filled caret
- **PNG:** `shots/final-gate-critic-5/admin-emails/z-scroll-light.png`, `shots/final-gate-2/admin-emails/dark-1440.png`, `shots/final-gate-2/admin-emails/light-1440.png`
- **Fix:** Drop the scroll shadow (tables.css:169-174; Primer DataTable scrolls plain); `white-space:nowrap` without ellipsis inside scrolling tables; sort caret → arrow-up/arrow-down Octicon mask.
- **Why this class:** CSS.

### FG2-076 — Controls details: textarea shows a partial third line at 390, tag-search button focus ring hugs the icon inside the input, disabled checkbox label not muted, native date input
- **Class:** theme-fixable-css · **Owner:** controls · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 8.0 · **Gate 1:** FG-089
- **Routes** (light/dark/390 critic score; j = judge reasons): issue-playground-1 (8.5/8.5/8.0; C167), repo-settings (8.5/8.5/8.0; C006), admin-user-edit (8.5/8.5/8.5; C163), tags (8.8/8.8/8.6; C054)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C006 repo-settings [nit] Description textarea clips a partial third line at 390; C054 tags [nit] Search-button focus ring hugs icon inside input; C163 admin-user-edit [nit] Disabled checkbox label not muted; C167 issue-playground-1 [nit] Native date input
- **PNG:** `shots/final-gate-critic-0/repo-settings-390-a.png`, `shots/final-gate-critic-2/live/tags/states/light-1440-search-btn-focus-clip.png`, `shots/final-gate-2/issue-playground-1/dark-390.png`, `shots/final-gate-2/issue-playground-1/dark-1440.png`, `shots/final-gate-2/issue-playground-1/light-390.png`, `shots/final-gate-2/issue-playground-1/light-1440.png`, `shots/final-gate-2/repo-settings/dark-390.png`, `shots/final-gate-2/repo-settings/dark-1440.png`, `shots/final-gate-2/repo-settings/light-390.png`, `shots/final-gate-2/repo-settings/light-1440.png`
- **Fix:** Textarea min-height in whole lines (3 × 20px + padding); focus ring on the input group, not the inner icon button; `.ui.checkbox.disabled label` `--fgColor-disabled`; date input: 32px TextInput look + calendar Octicon mask over the native indicator.
- **Why this class:** CSS.

### FG2-077 — README box header: 46px grey bar with 'README.md' + pencil; github.com draws a white header with an underlined 'README' tab (accent bar) and a TOC button
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 8.0 · **Gate 1:** FG-034
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home-readme-with-images-and-tables (9.0/9.0/8.0; C032), repo-home (9.0/9.0/8.5; C148)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C148 repo-home [minor] README box header differs from GitHub; C032 repo-home-readme-with-images-and-tables [nit] README box header content differs from github.com
- **PNG:** `shots/final-gate-critic-1/rd-00.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`, `shots/final-gate-2/repo-home/light-1440.png`
- **Fix:** `#readme > .file-header`: `--bgColor-default`, 16px inset, the file name styled as a selected UnderlineNav item (book icon, 2px `--underlineNav-borderColor-active` bar at the bottom edge); pencil as a 28px invisible IconButton at the right. The 'README | license' tab pair itself is template-only (FG-034, rejected).
- **Why this class:** Restyle of existing header; the tab pair stays template.

### FG2-078 — Split diff: the inline review comment row's empty left half is white while neighbouring empty split cells are muted
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 6.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-split-playground-large-diff (8.5/8.5/6.5; C107)
- **Schemes / viewports:** light / 1440
- **Critic:** C107 pr-files-changed-split-playground-large-diff [minor] Inline review comment row: left half white, not muted
- **PNG:** `shots/final-gate-critic-4/pfs-light-3.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-1440.png`
- **Fix:** `.code-diff-split tr.add-comment td:empty, … td.add-comment-left:not(:has(.comment))` → `--diffBlob-emptyLine-bgColor` / `--bgColor-muted`, both schemes.
- **Why this class:** CSS.

### FG2-079 — Markdown editor outside issue/PR forms (admin notices, releases, wiki, milestones) gets no composer Box: Write/Preview tabs and toolbar float above a separate textarea
- **Class:** theme-fixable-css · **Owner:** controls · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-dashboard-config-settings (8.0/8.0/7.5; C090)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C090 admin-dashboard-config-settings [minor] Markdown editor outside issue forms gets no composer Box
- **PNG:** `shots/final-gate-2/admin-dashboard-config-settings/dark-1440.png`, `shots/final-gate-2/admin-dashboard-config-settings/light-1440.png`
- **Fix:** Move the composer chrome from pages/issues-prs composer.css (scoped to `:is(#comment-form,#new-issue,.code-comments-list form.comment-form)`) into a generic `.combo-markdown-editor` rule in controls; pages/issues-prs keeps only page deviations. Coordinate the move (ownership lint).
- **Why this class:** Selector scope too narrow; component belongs in controls.

### FG2-080 — 390 blame group header: no relative date (github.com right-aligns '3 years ago') and muted background (github.com default bg)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.5 · **Gate 1:** FG-028
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.5/8.5/7.5; C152)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C152 blame [minor] Mobile blame header lacks date, uses muted bg
- **PNG:** `shots/final-gate-2/blame/dark-390.png`, `shots/final-gate-2/blame/light-390.png`
- **Fix:** < 768: show the blame info's `relative-time` right-aligned in the group header and use `--bgColor-default`.
- **Why this class:** Visibility/colour of existing elements.

### FG2-081 — 390: repo description starting with an emoji wraps into a lone-emoji line (flex item split) on explore / list rows
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): explore-repos (8.5/8.5/8.0; C021)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C021 explore-repos [minor] Emoji-led repo description wraps onto its own line at 390
- **PNG:** `shots/final-gate-critic-1/explore-m-00.png`, `shots/final-gate-2/explore-repos/dark-390.png`, `shots/final-gate-2/explore-repos/light-390.png`
- **Fix:** `.flex-item-body:has(> .emoji)` (or the description body) `display:block` so emoji and text stay inline.
- **Why this class:** CSS.

### FG2-082 — New-issue form: no 'Create new issue' heading and no 'Add a title' / 'Add a description' labels
- **Class:** theme-fixable-template · **Owner:** pages/issues-prs · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): issue-new-playground (8.0/8.0/8.0; C117)
- **Schemes / viewports:** light / 390, 1440
- **Critic:** C117 issue-new-playground [minor] Classic layout without 'Create new issue' heading and field labels
- **PNG:** `shots/final-gate-2/issue-new-playground/light-1440.png`, `shots/final-gate-2/issue-new-playground/light-390.png`, `shots/final-gate-2/issue-new-playground/light-1440.png`
- **Fix:** Template-level and low impact; not proposed (no slot).
- **Why this class:** Needs markup/keys.

### FG2-083 — Merge-style dropdown items are 54px tall single-line rows (Primer ActionList 32px, or title + description)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-playground-large-diff-reviews (8.5/8.5/8.0; C084)
- **Schemes / viewports:** light / 1440
- **Critic:** C084 pr-conversation-playground-large-diff-reviews [minor] Merge-style menu items are 54px tall with a single title line
- **PNG:** `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/light-1440.png`
- **Fix:** Merge-style menu items: 32px min-height, 6px 8px padding (the PR merge form is lazy chunk CSS → `*.important.css`).
- **Why this class:** CSS.

### FG2-084 — Notifications: row title turns accent blue on hover (github.com does not); Unread/Read nav without icons
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0 · **Gate 1:** FG-047
- **Routes** (light/dark/390 critic score; j = judge reasons): notifications (8.0/8.0/8.0; C121)
- **Schemes / viewports:** light / 1440
- **Critic:** C121 notifications [minor] Gitea notification layout, not GitHub's inbox
- **PNG:** `shots/final-gate-2/notifications/light-1440.png`, `shots/final-gate-critic-5/live/notifications/states/light-1440-row-hover-clip.png`, `shots/final-gate-2/notifications/light-1440.png`
- **Fix:** No colour change on row hover (background `--bgColor-muted` only); inbox/check icons on the two NavList items via masks. Filter bar / grouping / Saved-Done are github.com-only (inherent).
- **Why this class:** CSS.

### FG2-085 — Workflow graph: connector edges invisible (horizontal path with a zero-height bbox is fully masked by the objectBoundingBox edge mask); only port dots render
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.2 · **Gate 1:** FG-038
- **Routes** (light/dark/390 critic score; j = judge reasons): action-run (8.7/8.7/8.2; C061)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C061 action-run [minor] Workflow graph connector edges invisible
- **PNG:** `shots/final-gate-critic-2/ar-graph-l.png`, `shots/final-gate-2/action-run/dark-1440.png`, `shots/final-gate-2/action-run/light-1440.png`
- **Fix:** `.workflow-graph .graph-svg g[mask] { mask: none }` (nodes paint above edges), both schemes; verify Lint → Build edge on action-run light/dark. Upstream bug, visible only because our graph draws edges.
- **Why this class:** CSS workaround.

### FG2-086 — 390 markdown file view: body padding 16px (github.com 32px) — paragraphs 356px wide vs 324
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.2 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): file-view-markdown (8.6/8.6/8.2; C050)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C050 file-view-markdown [minor] Markdown padding 16px at 390 vs GitHub 32px
- **PNG:** `shots/final-gate-2/file-view-markdown/dark-390.png`, `shots/final-gate-2/file-view-markdown/light-390.png`
- **Fix:** `.file-view.markup` at < 768: padding 32px (github.com `.markdown-body` at small widths keeps 32px in the blob view).
- **Why this class:** CSS.

### FG2-087 — File view main column right gutter 32px (box ends x=1408) vs github.com 16px (x=1424)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.3 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-code-file (8.6/8.6/8.3; C047)
- **Schemes / viewports:** light / 1440
- **Critic:** C047 repo-code-file [minor] Main column right gutter 32px vs GitHub 16px
- **PNG:** `shots/final-gate-2/repo-code-file/light-1440.png`
- **Fix:** Reduce the repo file view's right padding to 16px at ≥ 1280 (container of `.repo-view-content`).
- **Why this class:** CSS.

### FG2-088 — Org header tabs start at x=112 inside the container while repo tabs (and github.com's org UnderlineNav) are flush-left at x=16
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.4 · **Gate 1:** FG-030
- **Routes** (light/dark/390 critic score; j = judge reasons): org-teams (8.4/8.4/8.4; C064)
- **Schemes / viewports:** light / 1440
- **Critic:** C064 org-teams [minor] Org header/tabs inset to container, unlike repo header
- **PNG:** `shots/final-gate-2/org-teams/light-1440.png`, `shots/final-gate-2/org-teams/light-1440.png`
- **Fix:** Give the org header UnderlineNav the same full-bleed 16px/24px inset as the repo UnderlineNav (coordinate with pages/people NAV-P1, which owns the org band).
- **Why this class:** Layout of existing elements.

### FG2-089 — Dashboard feed pagination: the current page ('1', class item, no href, no .active) is plain text instead of the filled accent pill
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.5 · **Gate 1:** FG-059
- **Routes** (light/dark/390 critic score; j = judge reasons): home (8.5/8.5/8.5; C001)
- **Schemes / viewports:** light / 1440
- **Critic:** C001 home [minor] Feed pagination current page not styled as current
- **PNG:** `shots/final-gate-critic-0/home-light-pag.png`, `shots/final-gate-2/home/light-1440.png`, `shots/final-gate-2/home/light-1440.png`
- **Fix:** `.pagination .item:not(.navigation):not([href])` → current-page style (`--bgColor-accent-emphasis`, `--fgColor-onEmphasis`, 6px radius) — same as `.active.item`.
- **Why this class:** Selector gap.

### FG2-090 — Tags Box header reads '16 Tags' with no tag Octicon (github.com: '(tag) Tags')
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 3 (judge reasons 2 in 2 pairs + critic weight 1) · weakest route 8.6 · **Gate 1:** FG-095
- **Routes** (light/dark/390 critic score; j = judge reasons): tags (8.8/8.8/8.6; j2; C053)
- **Schemes / viewports:** dark, light / 1440; judge variants content 2
- **Critic:** C053 tags [nit] Box header lacks tag Octicon
- **Judges say:** “B's card header is '16 Tags' with a 'Search tags…' input and no tag icon” / “B's card is headed '16 Tags' with a search box and no tag icon”
- **PNG:** `shots/final-gate-2/tags/dark-1440.png`, `shots/final-gate-2/tags/light-1440.png`, `shots/final-gate-2-pairs/p074.png`, `shots/final-gate-2-pairs/p076.png`
- **Fix:** `::before` with the existing `--gh-octicon-tag` mask (icons PR-IC-1), 16px `--fgColor-muted`, in the tags Box header (count text is Gitea's). Gate-1 FG-095, still open.
- **Why this class:** Pseudo-element.

### FG2-091 — Team member avatars spaced 4px (github.com overlapping AvatarStack); issue label text 600/12px line-height (Primer IssueLabel 500/18px)
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 7.5 · **Gate 1:** FG-058
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pulls (8.0/8.0/7.5; C099), org-teams (8.4/8.4/8.4; C066)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C066 org-teams [nit] Avatars not an overlapping AvatarStack; C099 repo-pulls [nit] Issue label weight/line-height
- **PNG:** `shots/final-gate-2/repo-pulls/dark-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2/org-teams/dark-1440.png`, `shots/final-gate-2/org-teams/light-1440.png`
- **Fix:** Org teams avatar row: negative 8px margin + 2px `--bgColor-default` ring; `.ui.label` issue labels font-weight 500, line-height 18px.
- **Why this class:** CSS.

### FG2-092 — AppHeader details: search placeholder 'Search repos…' / 'Search code…' (github.com 'Type / to search'); blue site-admin shield badge on the header avatar
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): explore-repos (8.5/8.5/8.0; C022), explore-users (8.8/8.8/8.7; C042)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C022 explore-repos [nit] Header search wording differs from github.com; C042 explore-users [nit] Site-admin shield badge on header avatar
- **PNG:** `shots/final-gate-critic-1/explore-light-top.png`, `shots/final-gate-critic-2/us-hdr-l.png`, `shots/final-gate-2/explore-repos/dark-1440.png`, `shots/final-gate-2/explore-repos/light-1440.png`, `shots/final-gate-2/explore-users/dark-1440.png`, `shots/final-gate-2/explore-users/light-1440.png`
- **Fix:** Placeholder: keep (no '/' shortcut in Gitea; do not advertise one) — optional: use the neutral key `search.search` in `custom/gh_head_navbar.tmpl` (our own file, no new override). Admin shield: 12px, `--fgColor-muted` on `--bgColor-default` ring instead of the accent fill, or hide on the header avatar only (the admin link stays in the avatar menu).
- **Why this class:** Own template + CSS; nits.

### FG2-093 — 390 issue/PR header: 'Edit' sits on its own row above the title (+40px)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-open (8.5/8.5/8.0; C183), pr-conversation-closed-unmerged (8.5/8.5/8.5; C033)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C033 pr-conversation-closed-unmerged [nit] Edit button gets its own row above the title at 390; C183 pr-conversation-open [nit] Mobile: Edit button sits on its own row above the title
- **PNG:** `shots/final-gate-critic-1/prm-00.png`, `shots/final-gate-2/pr-conversation-open/dark-390.png`, `shots/final-gate-2/pr-conversation-open/light-390.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/dark-390.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/light-390.png`
- **Fix:** < 768: title first, Edit / New issue buttons on the meta row (flex `order`).
- **Why this class:** order only.

### FG2-094 — Profile sidebar: the organizations avatar row has no 'Organizations' heading
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile (8.5/8.5/8.0; C146), user-profile-repositories-tab (8.5/8.5/8.5; C016)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C016 user-profile-repositories-tab [nit] Organizations section has no heading; C146 user-profile [nit] No 'Organizations' heading
- **PNG:** `shots/final-gate-critic-0/up-l.png`, `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-2/user-profile-repositories-tab/dark-1440.png`, `shots/final-gate-2/user-profile-repositories-tab/light-1440.png`
- **Fix:** `html:lang(en)` generated 16px/600 'Organizations' heading before the org avatar row (precedent FG-041).
- **Why this class:** Generated text (English only).

### FG2-095 — Actions details: matrix label inside the node card (github.com: tab on the card's top edge); job log panel has a 1px border (github.com borderless)
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 8.2 · **Gate 1:** FG-072
- **Routes** (light/dark/390 critic score; j = judge reasons): action-run (8.7/8.7/8.2; C063), action-job-ok (8.8/8.8/8.3; C139)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C063 action-run [nit] Matrix label inside card rather than tab; C139 action-job-ok [nit] Log panel has a 1px border
- **PNG:** `docs/reference/crit-app-action-job/light-1440.png`, `shots/final-gate-2/action-job-ok/light-1440.png`, `shots/final-gate-2/action-run/dark-1440.png`, `shots/final-gate-2/action-run/light-1440.png`, `shots/final-gate-2/action-job-ok/dark-1440.png`, `shots/final-gate-2/action-job-ok/light-1440.png`
- **Fix:** Matrix label as a 20px tab above the card border; drop the log container border (keep the muted/inset bg).
- **Why this class:** CSS.

### FG2-096 — Markdown code-block copy button: always visible in READMEs (github.com: on hover/focus), missing on the repo-pull comment block
- **Class:** theme-fixable-css · **Owner:** markdown · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 8.5 · **Gate 1:** FG-087
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home (9.0/9.0/8.5; C149), repo-pull (9.0/9.0/8.7; C123)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C123 repo-pull [nit] Markdown code block lacks the copy IconButton; C149 repo-home [nit] Code-block copy button always visible
- **PNG:** `docs/reference/repo-pull/light-1440.png`, `shots/final-gate-2/repo-pull/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`, `shots/final-gate-2/repo-home/light-1440.png`, `shots/final-gate-2/repo-pull/dark-1440.png`, `shots/final-gate-2/repo-pull/light-1440.png`
- **Fix:** `.markup pre:not(:hover):not(:focus-within) .code-copy { opacity:0 }` (keep it focusable); check why the PR comment's fenced block has no `.code-copy` (JS adds it after render — maybe the lazy content; if markup-less, skip).
- **Why this class:** CSS.

### FG2-097 — Short pages pin the footer to the viewport bottom, leaving a large empty gap; github.com's footer follows the content
- **Class:** theme-fixable-css · **Owner:** foundation · **Impact:** 2 (judge reasons 2 in 2 pairs + critic weight 0) · weakest route 8.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile-repositories-tab (8.5/8.5/8.5; j1), wiki-page-list (9.0/9.0/8.5; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants page 2
- **Judges say:** “B page ends short and a large grey empty area shows beneath it” / “B's page leaves a large empty gap before the footer, whereas GitHub's footer follows right after the content”
- **PNG:** `shots/final-gate-2/user-profile-repositories-tab/dark-1440.png`, `shots/final-gate-2/user-profile-repositories-tab/light-1440.png`, `shots/final-gate-2/wiki-page-list/dark-1440.png`, `shots/final-gate-2/wiki-page-list/light-1440.png`, `shots/final-gate-2-pairs/p091.png`, `shots/final-gate-2-pairs/p145.png`
- **Fix:** Drop the flex-grow on `.page-content` (or `min-height` on body) in github-* themes so the footer follows content, with 40px top margin like github.com. Check wiki-page-list, empty settings pages, 404.
- **Why this class:** CSS.

### FG2-098 — Markdown `<details>` (ToC box) uses the native ▼ marker instead of an Octicon chevron
- **Class:** theme-fixable-css · **Owner:** markdown · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 7.8 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-page-playground (8.2/8.2/7.8; C058)
- **Schemes / viewports:** light / 1440
- **Critic:** C058 wiki-page-playground [nit] Native details marker and grey Mermaid theme
- **PNG:** `shots/final-gate-2/wiki-page-playground/light-1440.png`
- **Fix:** `.markup details > summary::marker { content:'' }` + chevron-right/down mask. The grey Mermaid theme in the same critic is inherent (FG2-100, mermaid-iframe).
- **Why this class:** CSS.

### FG2-099 — Commit page diff: file tree collapsed by default (github.com shows it left of the diff)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.0 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): commit-detail (8.0/8.0/8.0; C010)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C010 commit-detail [nit] Diff file tree collapsed by default
- **PNG:** `shots/final-gate-critic-0/cd-l.png`, `shots/final-gate-2/commit-detail/dark-1440.png`, `shots/final-gate-2/commit-detail/light-1440.png`
- **Fix:** Nit. The tree visibility is a per-user Gitea toggle (localStorage/JS); CSS cannot open it without fighting the toggle. Tooling option: open it in the capture state. Otherwise leave.
- **Why this class:** Mostly state; kept as a CSS nit.

### FG2-100 — Mermaid: neutral grey light theme and 100px blank space at 390
- **Class:** inherent — Mermaid renders in a same-origin iframe sized by Gitea (CSS cannot reach the SVG theme/size) · **Owner:** markdown · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.0 · **Gate 1:** FG-112
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home-markdown-showcase-playground (9.0/9.0/8.0; C027)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C027 repo-home-markdown-showcase-playground [nit] Mermaid theme and iframe height
- **PNG:** `shots/final-gate-critic-1/md-06.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/dark-390.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/light-390.png`
- **Fix:** None.

### FG2-101 — Issue label colours (bright cyan / solid green) differ from github.com's muted pills
- **Class:** inherent — Label colours are seeded data rendered as inline style !important (CONTEXT: exempt) · **Owner:** data-display · **Impact:** 1 (judge reasons 1 in 1 pairs + critic weight 0) · weakest route 8.5 · **Gate 1:** FG-116
- **Routes** (light/dark/390 critic score; j = judge reasons): labels (8.5/8.5/8.5; j1)
- **Schemes / viewports:** dark / 1440; judge variants content 1
- **Judges say:** “In B, the github_actions and rust labels render as plain gray outline chips with no fill”
- **PNG:** `shots/final-gate-2/labels/dark-1440.png`, `shots/final-gate-2-pairs/p108.png`
- **Fix:** None.

### FG2-102 — Judge pairs pad the shorter capture with the harness grey, so a short page reads as 'ends short, grey area beneath'
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 1 (judge reasons 1 in 1 pairs + critic weight 0) · weakest route 8.5 · **Gate 1:** new
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile-repositories-tab (8.5/8.5/8.5; j1)
- **Schemes / viewports:** light / 1440; judge variants page 1
- **Judges say:** “B page ends short and a large grey empty area shows beneath it”
- **PNG:** `shots/final-gate-2/user-profile-repositories-tab/light-1440.png`, `shots/final-gate-2-pairs/p145.png`
- **Fix:** tools/judge pair compositor: pad the shorter side with that page's own body background (sample the last row) instead of the canvas grey, or crop both sides to the shorter height. The sticky footer itself is FG2-097 (foundation).
- **Why this class:** Capture/compositing artefact.

### FG2-103 — Brand logos reported as non-Octicon (webhook menu gitea/feishu/matrix, gitea-npm)
- **Class:** inherent — Brand logos kept by ARCHITECTURE §6 (webhook providers, package types) · **Owner:** icons · **Impact:** 0 (judge reasons 0 in 0 pairs + critic weight 0) · weakest route 10.0 · **Gate 1:** FG-120
- **Fix:** None.

### FG2-104 — Font stack is the Primer system stack, github.com uses Mona Sans VF (reads slightly heavier)
- **Class:** inherent — Mona Sans VF excluded by ARCHITECTURE §11 (no GitHub brand fonts) · **Owner:** foundation · **Impact:** 0 (judge reasons 0 in 0 pairs + critic weight 0) · weakest route 10.0 · **Gate 1:** FG-122
- **Fix:** None (policy). See pr-title-weight for the one weight tweak.

### FG2-105 — No check for page-class scope leaks: page-folder rules scoped by a shared Gitea page class (.repository.commits, .repository.pull, .repository.view.issue, .dashboard.issues, .user.signin, .organization.settings…) reach templates the folder never targeted (user-reported twice)
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 0 (judge reasons 0 in 0 pairs + critic weight 0) · weakest route 10.0 · **Gate 1:** new
- **Fix:** Build `build/page-scope-check.mjs` (run by `build.mjs` after lint; warning by default, error under `--strict`, so the final gate fails on an unintended match):
   1. **Selectors → scopes.** Parse every rule in `src/pages/**/*.css` (postcss-selector-parser; expand `:is()` / `:where()` / selector lists). For each selector take the page-class compound: the class set of the compound that carries `.page-content` or, when absent, the leading compound whose classes are all Gitea page classes (the vocabulary is the union of step 2's class sets), e.g. `.repository.commits`, `.page-content.dashboard.issues`, `.repository.view.issue.pull`. Record folder, file:line and the full selector.
   2. **Templates → page classes (static).** Scan `/Users/michael/work/gitea/gitea-src-1.27.3/templates/**/*.tmpl` for `class="page-content …"` (and the `role="main"` div): expand `{{if}}…{{else}}…{{end}}` fragments into every branch (e.g. `repository file list {{if .IsBlame}}blame{{end}}` → `{repository,file,list}` and `{repository,file,list,blame}`), resolve `{{.pageClass}}` through every `(dict "pageClass" "…")` call site (org/settings/layout_head, admin/layout_head, user/settings/layout_head…) and through `ctx.Data["PageClass"]`-style setters in routers if present. Include our own overrides in `templates/` (they win over upstream) and the Modern theme's overrides in CUSTOM_PATH (read-only). Output: template → list of class sets.
   3. **Routes → page classes (live, authoritative).** For every route in `tools/shoot/routes.json` (+ the states that navigate), fetch the page as admin (and anonymous for auth:false) from http://localhost:3000 and read `document.querySelector('.page-content, [role=main]').classList` (reuse tools/shoot/lib for login/cookies; no screenshots). Cache to `shots/page-classes.json`.
   4. **Match.** A scope matches a template/route when its class set ⊆ the page's class set. Print, per folder and per scope: every matching route id + URL and every matching template path, with the selector count and first file:line.
   5. **Intent.** Each page folder declares what it targets in `src/pages/<folder>/scopes.json` (`{"<scope>": ["repo/commits.tmpl", …]}`, seeded by the tool's first run and reviewed by the folder owner). Any matching template not listed is flagged `LEAK` (e.g. `.repository.commits` → `repo/activity.tmpl`, `repo/graph.tmpl` when only `repo/commits.tmpl` is intended; `.repository.pull` / `.repository.view.issue` → PR Conversation / Commits / Files tabs and `repo/diff/compare.tmpl`; `.dashboard.issues` → `user/dashboard/issues.tmpl` serving /issues AND /pulls, plus `user/dashboard/milestones.tmpl`; `.user.signin` → openid, webauthn-prompt, link-account; `.repository.milestones` vs `.repository.milestone-issue-list`). Also flag scopes that match nothing (dead rules, budget).
   6. Report: `docs/page-scope-report.md` (table folder × scope × matched templates/routes, LEAK rows first) + JSON for tools. Add the report path to STATUS.json; fail `--strict` on any LEAK not waived in scopes.json with a reason.
   Known shared shells to seed the fixtures/tests: repo/commits.tmpl + repo/activity.tmpl + repo/graph.tmpl (`repository commits`); repo/issue/view.tmpl + repo/pulls/{files,commits}.tmpl + repo/diff/compare.tmpl (`repository … pull …`); user/dashboard/issues.tmpl (/issues, /pulls) + user/dashboard/milestones.tmpl (`dashboard issues`); repo/issue/navbar.tmpl partial shared by labels / milestones / milestone_new / choose.
- **Why this class:** Not a theme defect per se: a build/lint gap. Two user-reported regressions came from page-folder selectors whose page-class scope is shared by several Gitea pages; the lint only checks ownership, not reach. Not scored by critics or judges (impact 0); requested by the user.


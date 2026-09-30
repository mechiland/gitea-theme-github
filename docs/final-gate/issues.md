# Final gate #1 — deduplicated, ranked issue list (loop iteration 1)

Inputs: `docs/final-gate/raw.json` (8 whole-site critic reports, 101 routes, 211 issues), 1264 blind-judge reasons (8 judges × 38 pairs = 304 judgments, 303 correct; the one miss is org-members light content, pair p150, where the github.com side was the go-gitea org itself), `docs/final-gate/scores.json`. Reasons were joined with the blind key (route, scheme, page/content variant) and mapped to issues with per-issue patterns (script: scratchpad `fg_defs.py`/`fg_map.py`); 1263/1264 reasons map to at least one issue (the unmapped one is the judge’s “close to a guess” remark).

**Ranking:** impact = judge-count + Σ critic severity weight (blocker 12, major 6, minor 3, nit 1); ties → weakest affected route (lowest min(light, dark, 390) critic score) first. judge-count = number of judge reasons citing the tell; a reason naming several tells counts for each, so counts overlap. Machine-readable: `docs/final-gate/issues.json`.

**Classes:** inherent 19, theme-fixable-css 82, theme-fixable-template 16, tooling 5. `tooling` = not a theme defect (capture/seed), owner integrator/tools.

**Budget reminder for builders:** pages/repo has 143 B left under its 30 KiB cap; every folder must trim before adding (STATUS.json budget).

## Read this first

- **The top of the list is inherent.** 19 inherent issues carry 1753 of the judge-reason citations: the judges mostly identified the clone by Gitea data, strings and features (seeded/migrated content, relative dates, Title Case, Gitea-only controls, GitHub-only features, the logo and “Powered by Gitea”) and by the logged-out reference. None of these may be hidden.
- **Biggest theme-fixable levers:** FG-007 header (124 reasons, template), FG-011 default-avatar placeholder (95, CSS — needs the §11 sign-off noted there), FG-017 issues-page layout (45, template), FG-018 SHA presentation (33, CSS), FG-019 commit day groups (26, template), FG-021 file-view Code|Blame control (29, template), FG-022 wiki Pages box (21, template), FG-024 branches table (11, template), FG-025 tree-pane branch picker (22, template).
- **Blockers/majors from the critics** (weak mobile routes): FG-020 mobile overflow, FG-028 mobile blame, FG-032 dark diff double paint, FG-075 split add-side numbers, FG-076 md syntax leak, FG-067 dashboard CLS, FG-071 reply icon, FG-070 review gutter, FG-046 mobile comment header, FG-057 admin table clip, FG-055 project board toolbar.
- **Tooling bug:** FG-033 — capture order leaks the diff-style preference (repo-pull-files `?style=split` → commit-detail rendered split; 7 judge reasons cite the split view). Fix before the next gate; also FG-056 lazy images, FG-118 tall 390 captures, FG-105 mailer.
- **Earlier rejection to revisit:** the wiki Pages box was rejected in wave 3 because “.Pages is only loaded for ?action=_pages” — that is wrong for 1.27.3: `routers/web/repo/wiki.go` renderViewPage sets `ctx.Data["Pages"]` on every wiki view (the “Page: Home” dropdown already lists them). Commit day groups were rejected for upkeep, not feasibility; they are now a top per-page tell.


## Header decision (FG-HEADER = FG-007): template override, github-* branch only

**Decision: `theme-fixable-template`.** The judges' #1 structural tell (124 judge reasons on 37 routes;
critics C033/C189 on every signed-in route) cannot be closed with CSS:

| github.com signed-in AppHeader part | Gitea 1.27.3 markup (`templates/base/head_navbar.tmpl`) | CSS-reachable? |
|---|---|---|
| Hamburger → global nav drawer | `#navbar-expand-toggle` exists but is `.only-mobile`; Gitea JS only toggles `.navbar-menu-open` | partly (could be shown on desktop), but the drawer would be the whole `.navbar-left` column |
| Logo | `#navbar-logo` (Gitea logo, stays per §11) | yes (done) |
| Context crumbs `owner / repo`, org or page name | not in the navbar DOM (repo title lives in `.repo-header`, a different subtree; org/user/page names elsewhere or nowhere) | **no** (absolute-positioning `.repo-title` into the bar works on repo pages only and collides with the links) |
| Search field | no form or input in the navbar | **no** |
| Issues / Pull requests icon buttons next to the bell | text links in `.navbar-left`; the bell/+/avatar are in `.navbar-right` | **no** (cannot move across containers; icon-masking the text links in place leaves them on the left) |
| Create `+▾`, notifications, avatar | present in `.navbar-right` | yes (done) |

§7 allows it: the layout is unreachable by CSS, the branch is active only for `github-*` themes, and the non-GitHub
output stays byte-identical. The spec explicitly permits a template override for header structure. No JavaScript is added.

### Files

1. **`templates/base/head_navbar.tmpl`** (new override, integrator installs, listed in ARCHITECTURE §7):
   ```
   {{if StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-"}}{{template "custom/gh_head_navbar" .}}{{else}}<nav id="navbar" aria-label="{{ctx.Locale.Tr "aria.navbar"}}">
   …upstream 1.27.3 lines 2–181 verbatim…
   {{template "base/head_banner"}}
   {{end}}
   ```
   No newline after `{{end}}`: the else-branch then emits upstream's bytes exactly (upstream ends with
   `{{template "base/head_banner"}}\n`). Verify with gitea-auto, modern and studio: rendered HTML of /, /octo-org/grex,
   /explore/repos, /user/login (anonymous) and /-/admin must be byte-identical before/after (modulo CSRF/timing).
2. **`templates/custom/gh_head_navbar.tmpl`** (new, github-only; must end with `{{template "base/head_banner"}}`).

### Markup (`custom/gh_head_navbar.tmpl`)

Keep every JS hook Gitea 1.27.3 queries: `#navbar` (utils.ts toggleFullScreen), `#navbar .user-menu`
(repo-view-file-tree.ts: signed-in check), `.notification_count` (notification.ts), `.active-stopwatch`,
`.active-stopwatch-popup`, `.stopwatch-link/-commit/-cancel/-issue`, `.header-stopwatch-dot` (stopwatch.ts), the
Fomantic `.ui.dropdown.jump.item` create/avatar menus (overlays styles their popups, NO-1), and the
`custom/extra_links` hook. `#navbar-expand-toggle` is intentionally absent (common-page.ts returns early when it is missing).

```html
<nav id="navbar" class="gh-app-header{{if or .PageIsSignIn .PageIsSignUp}} gh-app-header--auth{{end}}" aria-label="{{ctx.Locale.Tr "aria.navbar"}}">
  <div class="gh-app-header-start">
    {{if not (and .IsSigned .MustChangePassword)}}
    <details class="gh-app-header-menu">                      {{/* native disclosure: no JS, keyboard + aria-expanded for free */}}
      <summary class="item gh-icon-btn" aria-label="{{ctx.Locale.Tr "home.nav_menu"}}">{{svg "octicon-three-bars"}}</summary>
      <div class="gh-app-header-drawer">
        <div class="gh-drawer-head"><img width="24" height="24" src="{{AssetUrlPrefix}}/img/logo.svg" alt="" aria-hidden="true"></div>
        <nav class="gh-drawer-list" aria-label="{{ctx.Locale.Tr "home.nav_menu"}}">
          {{if .IsSigned}}
            <a class="item{{if .PageIsDashboard}} active{{end}}" href="{{AppSubUrl}}/">{{svg "octicon-home"}} {{ctx.Locale.Tr "dashboard"}}</a>
            {{/* then EXACTLY upstream's link block (same conditions, hrefs, locale keys and `active` logic): */}}
            {{/* Issues (UnitGlobalDisabled check), Pull Requests, Milestones (ShowMilestonesDashboardPage), Explore */}}
            {{/* each with a leading Octicon: issue-opened, git-pull-request, milestone, telescope */}}
          {{else if .IsLandingPageOrganizations}} {{/* upstream anonymous Explore → /explore/organizations */}}
          {{else}} {{/* upstream anonymous Explore → /explore/repos */}}
          {{end}}
          {{template "custom/extra_links" .}}
          {{if not .IsSigned}}<a class="item" target="_blank" href="https://docs.gitea.com">{{svg "octicon-question"}} {{ctx.Locale.Tr "help"}}</a>{{end}}
        </nav>
      </div>
    </details>
    {{end}}
    <a class="item" id="navbar-logo" href="{{AppSubUrl}}/" aria-label="{{if .IsSigned}}{{ctx.Locale.Tr "dashboard"}}{{else}}{{ctx.Locale.Tr "home_title"}}{{end}}">
      <img width="32" height="32" src="{{AssetUrlPrefix}}/img/logo.svg" alt="{{ctx.Locale.Tr "logo"}}" aria-hidden="true">
    </a>
    <div class="gh-app-header-context">
      {{if .Repository}}
        <a class="gh-context-item" href="{{.Repository.Owner.HomeLink}}">{{.Repository.Owner.Name}}</a><span class="gh-context-sep" aria-hidden="true">/</span><a class="gh-context-item" href="{{.RepoLink}}">{{.Repository.Name}}</a>
      {{else if .ContextUser}}
        <a class="gh-context-item" href="{{.ContextUser.HomeLink}}">{{.ContextUser.Name}}</a>
      {{else if .Title}}
        <span class="gh-context-item">{{.Title}}</span>   {{/* "Dashboard", "Explore", "Notifications", "Settings", … (Gitea titles) */}}
      {{end}}
    </div>
  </div>

  <div class="gh-app-header-end">
    {{if and .IsSigned .MustChangePassword}}
      {{/* upstream MustChangePassword avatar dropdown, verbatim */}}
    {{else}}
      {{$searchURL := print AppSubUrl "/explore/repos"}}{{if .Repository}}{{$searchURL = print .RepoLink "/search"}}{{end}}
      <form class="gh-app-header-search" role="search" method="get" action="{{$searchURL}}">
        {{svg "octicon-search"}}
        <input type="search" name="q" aria-label="{{ctx.Locale.Tr "search.search"}}" autocomplete="off"
               placeholder="{{if .Repository}}{{ctx.Locale.Tr "search.code_kind"}}{{else}}{{ctx.Locale.Tr "search.repo_kind"}}{{end}}">
      </form>
      <a class="item gh-icon-btn gh-app-header-search-link" href="{{$searchURL}}" aria-label="{{ctx.Locale.Tr "search.search"}}">{{svg "octicon-search"}}</a> {{/* < 768 only */}}
      {{if .IsSigned}}
        <span class="gh-app-header-divider" aria-hidden="true"></span>
        {{/* upstream create "+▾" dropdown, verbatim */}}
        {{if not ctx.Consts.RepoUnitTypeIssues.UnitGlobalDisabled}}
          <a class="item gh-icon-btn{{if .PageIsIssues}} active{{end}}" href="{{AppSubUrl}}/issues" aria-label="{{ctx.Locale.Tr "issues"}}" data-tooltip-content="{{ctx.Locale.Tr "issues"}}">{{svg "octicon-issue-opened"}}</a>
        {{end}}
        {{if not ctx.Consts.RepoUnitTypePullRequests.UnitGlobalDisabled}}
          <a class="item gh-icon-btn{{if .PageIsPulls}} active{{end}}" href="{{AppSubUrl}}/pulls" aria-label="{{ctx.Locale.Tr "pull_requests"}}" data-tooltip-content="{{ctx.Locale.Tr "pull_requests"}}">{{svg "octicon-git-pull-request"}}</a>
        {{end}}
        {{template "base/head_navbar_icons" dict "PageGlobalData" .PageGlobalData}}   {{/* stopwatch + bell/.notification_count, rendered once */}}
        {{/* upstream avatar dropdown, verbatim (keeps .user-menu, admin shield badge, all items) */}}
      {{else}}
        {{/* upstream anonymous Register + Sign In links (same hrefs/active), styled as Primer default + outline buttons */}}
      {{end}}
    {{end}}
  </div>

  {{/* upstream active-stopwatch popup block, verbatim */}}
</nav>
{{template "base/head_banner"}}
```

### Behaviour and styling (navigation owns `.gh-app-header*`; overlays keeps the dropdown popups; pages/auth owns `.gh-app-header--auth`)

- 64px bar, 16px padding, 8px gaps, bg `--bgColor-inset`/header token (unchanged colours). Hamburger, Issues, PRs,
  bell: 32px IconButtons with `--button-default-borderColor-rest` border (github.com draws them bordered). Logo 32px.
- Context: `gh-context-item` 14px/600 `--fgColor-default`, 6px radius hover `--control-transparent-bgColor-hover`,
  `/` separator `--fgColor-muted`; truncate with ellipsis (owner max ~160px).
- Search: 32px TextInput look, leading search icon, min 272px, grows to 350px at ≥1280, placeholder
  `--fgColor-muted`. **No `/` kbd hint** (Gitea has no `/` shortcut; do not advertise one). Divider 1px × 20px before `+▾`.
- Drawer: `details[open] > .gh-app-header-drawer` = Primer Overlay pinned left (position fixed, inset-block 0,
  width 320px, `--overlay-bgColor`, `--shadow-floating-large`, radius 0 12px 12px 0, z-index overlay);
  `details[open] > summary::before` = fixed full-viewport backdrop `--overlay-backdrop-bgColor` (click closes: the backdrop
  is part of the summary). Items = NavList rows (32px, 16px icon, 8px gap, selected = `--control-transparent-bgColor-selected`
  + 4px accent bar), Primer motion tokens.
- < 768px: hide the search form, show `.gh-app-header-search-link`; context shows the repo name only (owner hidden);
  keep `+▾` and the avatar visible (closes FG-068).
- Repo pages: drop the navbar's bottom rule when the repo header follows (`body:has(.repo-header) #navbar`), so AppHeader +
  repo UnderlineNav read as one block (C190).
- `.gh-app-header--auth` (sign-in / sign-up): no search, no right-side buttons except Register/Sign In inside the drawer,
  logo centred, transparent bar, no rule — github.com's auth pages show only the mark (closes FG-063; links stay reachable
  through the hamburger drawer, nothing is removed).
- The old Explore active pill (C027) disappears with the text links.

### What it will not fix
The judges compared against **logged-out** github.com (Platform/Solutions/Resources marketing bar), so a signed-in AppHeader
still differs from those captures (FG-010); the Gitea logo stays (FG-016). Target is the signed-in AppHeader a daily
github.com user sees.

### Verification (integrator)
`gitea manager reload-templates` (refuses a broken template); byte-identity check for non-GitHub themes (above); JS hooks:
bell count updates via the event stream, stopwatch popup opens, create/avatar menus open, file tree still detects signed-in,
fullscreen (e.g. project board) hides the header; no console errors; CLS unchanged; screenshots light/dark 1440/390 +
drawer-open state.


## Ranked list (all classes)

| Rank | Id | Class | Owner | Judges | Critic wt | Impact | Title |
|---|---|---|---|---|---|---|---|
| 1 | FG-001 | inherent | integrator/tools | 273 | 3 | 276 | github.com-only features absent: Checks tab, Achievements, star Lists / starred topics, Explore Topics/Trending/Collections, Pinned + sparklines + Top languages, Sponsor, Contributors / Used by, release sha256 + reactions, Actions Usage/Caches/Workflow+Event filters, blame age legend, code folding, new PR-files toolbar (File filter / Jump to), branch Active/Stale data |
| 2 | FG-002 | inherent | foundation | 223 | 3 | 226 | Gitea wording differs from github.com ('Description' vs 'About', 'Stable' vs 'Latest', 'Downloads' vs 'Assets', 'Compare commits', 'Browse Source', 'Starred Repositories', 'Members', '445 Commits', '8 Open / 51 Closed', 'Release details', 'Register now.'…) |
| 3 | FG-003 | inherent | integrator/tools | 169 | 0 | 169 | Migrated data differs: '(Migrated from github.com)' on comments, no timeline events, no Verified / CI check counts / Bot badges / linked-PR icons, commit authors shown by full name, different counts |
| 4 | FG-004 | inherent | navigation | 167 | 0 | 167 | 'Powered by Gitea' footer attribution |
| 5 | FG-005 | inherent | pages/repo | 142 | 0 | 142 | Gitea-only repo controls present: extra repo tabs (Packages, Projects, Releases, Wiki, Activity), RSS buttons, Add File, compare icon, Manage Topics, repo size, sidebar code search, Commit Graph, 'This Branch' search, Operations, tag pills in commit titles, branch-row actions (RSS/download/rename) |
| 6 | FG-006 | inherent | foundation | 141 | 0 | 141 | Title Case UI strings: 'Pull Requests', 'Files Changed', 'New Issue', 'New Page', 'Sign In', 'Remember This Device', 'Run Details', 'Source Code (ZIP)'… |
| 7 | FG-007 | theme-fixable-template | navigation | 124 | 6 | 130 | Global header is Gitea's text-link bar (Issues / Pull Requests / Milestones / Explore), not github.com's signed-in AppHeader |
| 8 | FG-008 | inherent | pages/issues-prs | 123 | 1 | 124 | Gitea-only issue/PR features present: sidebar Time Tracker, Due Date, Dependencies, Reference, Pin/Lock/Delete, 'No Branch/Tag Specified', WIP hint; merge box, Viewed/Review progress, bulk-select checkboxes, Project/Type filters, branch chips, H1/H2/H3 toolbar |
| 9 | FG-009 | inherent | foundation | 104 | 0 | 104 | Relative dates ('4 years ago') where github.com shows absolute dates ('on May 17, 2023'); KiB/MiB sizes and no '(N loc)' |
| 10 | FG-010 | inherent | integrator/tools | 100 | 0 | 100 | Reference pages are logged-out github.com: marketing header (Platform/Solutions…), 'Sign up for free' banner instead of a composer, 'New issue' instead of 'Edit', marketing footer, Google/Apple SSO |
| 11 | FG-011 | theme-fixable-css | data-display | 95 | 0 | 95 | Gitea default avatar (teacup logo image) on migrated authors, commit authors and blame rows |
| 12 | FG-012 | inherent | pages/people | 84 | 4 | 88 | Gitea-only people/org features present: org Members/Teams/Worktime tabs, New Repository/Migration/Team buttons, RSS + Follow on org, profile email/'Joined on'/Block user/gear, member admin (Hidden, Member Role, 2FA, Make visible/Remove/Leave), explore Repositories/Users/Organizations nav, Filter/Sort |
| 13 | FG-013 | inherent | pages/actions-packages-projects | 71 | 0 | 71 | Gitea-only controls on releases/tags/wiki/actions: RSS Feed + New Release, counted Releases/Tags toggle, 'Search tags', left release metadata column, 'Delete Page', wiki revision counter, 'Default Branch: master', Actor/Status/Branch run filters |
| 14 | FG-014 | inherent | foundation | 70 | 0 | 70 | Upstream pluralisation / word-order bugs: '1 commits', '1 changed files', '1 Participants', 'merged 1 commits from main into main' |
| 15 | FG-015 | tooling | integrator/tools | 50 | 0 | 50 | Seed data carries visible markers: '[seed]' descriptions, 'theme-seed' / 'migrated-from-github' topics, org README naming tools/seed/seed.mjs and 'GitHub-lookalike Gitea theme', '(seeded test account)' bios, 'Smoke edit' runs by admin |
| 16 | FG-016 | inherent | navigation | 49 | 0 | 49 | Gitea teacup logo in the header, on the sign-in page and in the footer |
| 17 | FG-017 | theme-fixable-template | pages/issues-prs | 45 | 0 | 45 | Issues / PRs / Labels / Milestones pages lack github.com's issues layout: left NavList (Issues, Assigned to me, Created by me, Mentioned, Milestones, Labels) and an 'All issues' heading + query bar |
| 18 | FG-018 | theme-fixable-css | pages/repo | 33 | 7 | 40 | Commit SHAs are 10 characters (and sans-serif on the commits list / PR commits tab); github.com shows 7-char 12px mono muted |
| 19 | FG-019 | theme-fixable-template | pages/repo | 26 | 9 | 35 | Commit lists are a flat Box ('445 Commits' / '1 Commits' header) instead of github.com's 'Commits on <date>' timeline groups (commits page, PR Commits tab, compare) |
| 20 | FG-020 | theme-fixable-css | code | 0 | 30 | 30 | Horizontal page overflow at 390: directory latest-commit row (404-421px) and unified diff with inline review comment (754px) |
| 21 | FG-021 | theme-fixable-template | code | 29 | 0 | 29 | File / blame header: Gitea 'Raw \| Permalink \| Blame \| History' group (+ 'Normal View' / 'Unescape') instead of github.com's Code \| Blame (Preview for .md) SegmentedControl with Raw / copy / download icon buttons |
| 22 | FG-022 | theme-fixable-template | pages/repo | 21 | 6 | 27 | Wiki sidebar is a 'Page: Home' dropdown + green 'Code' clone button instead of github.com's 'Pages (N)' Box with filter and 'Clone this wiki locally' input |
| 23 | FG-023 | inherent | integrator/tools | 24 | 2 | 26 | README badges, logos, demo GIFs and the Dependabot score render as broken alt-text links |
| 24 | FG-024 | theme-fixable-template | pages/repo | 11 | 12 | 23 | Branches page: no 'Branches' title, no column-header row (Branch / Updated / Check status / Behind\|Ahead / Pull request), 5 icon buttons per row instead of delete + kebab |
| 25 | FG-025 | theme-fixable-template | code | 22 | 0 | 22 | Branch picker, 'Go to file' and 'Add File' sit above the content instead of in the file-tree pane header (github.com: branch picker + search at the top of the tree) |
| 26 | FG-026 | theme-fixable-css | navigation | 21 | 0 | 21 | Footer shows 'Version: 1.27.3' and 'Page: 27ms Template: 3ms' diagnostics next to the attribution |
| 27 | FG-027 | theme-fixable-css | pages/actions-packages-projects | 7 | 12 | 19 | Actions list is a centred container with a borderless NavList, not github.com's full-bleed split PageLayout (sidebar pinned left with border, 1056px runs Box) |
| 28 | FG-028 | theme-fixable-css | code | 0 | 18 | 18 | Mobile blame: code is entirely off-screen (blame column ~312px, table 1038-2031px wide) |
| 29 | FG-029 | theme-fixable-css | navigation | 0 | 17 | 17 | Mobile UnderlineNav: selected tab clipped off-screen ('± Fi…') with no scroll cue; selected underline drawn under the overflow '…' button |
| 30 | FG-030 | theme-fixable-css | navigation | 0 | 15 | 15 | Org header / dashboard context bar have no 1px bottom border (repo header has one); schemes treat the bar differently |
| 31 | FG-031 | inherent | pages/people | 12 | 3 | 15 | 404 is a Primer Blankslate; github.com shows the illustrated Octocat 'This is not the web page you are looking for' page |
| 32 | FG-032 | theme-fixable-css | code | 0 | 15 | 15 | Dark diffs painted twice (tr and td both tinted): additions/deletions/hunk rows visibly over-saturated |
| 33 | FG-033 | tooling | integrator/tools | 7 | 6 | 13 | Capture order leaks the admin's diff-style preference: repo-pull-files (?style=split) makes commit-detail render split |
| 34 | FG-034 | theme-fixable-template | code | 10 | 3 | 13 | README box header is a single 'README.md' bar with a pencil; github.com has 'README \| <license> license' tabs |
| 35 | FG-035 | theme-fixable-css | pages/actions-packages-projects | 0 | 12 | 12 | Projects list: Open/Closed switch outside the Box, 28px 'New Project', inline red Delete per row, mobile order flips |
| 36 | FG-036 | theme-fixable-css | pages/repo | 0 | 12 | 12 | Commit list titles: 16px/400 (compare) or 14px/500 (commits) vs github.com 14px/600; inline code drawn as a grey chip |
| 37 | FG-037 | theme-fixable-css | pages/repo | 0 | 11 | 11 | Release 'Downloads' uses the browser's disclosure triangle at 20px bold; mobile release header/meta wraps with orphan '·'; bare red × status glyph |
| 38 | FG-038 | theme-fixable-css | pages/actions-packages-projects | 7 | 4 | 11 | Run graph: zoom controls top-right (github.com bottom-right) with non-Octicon icons; matrix/node cards use default bg in dark; 390 graph node off-canvas and full job list stacked |
| 39 | FG-039 | theme-fixable-css | pages/issues-prs | 9 | 2 | 11 | Labels \| Milestones switch is plain text with no selected container |
| 40 | FG-040 | theme-fixable-css | pages/repo | 5 | 6 | 11 | Wiki page list rows too dense (36px vs 54px), link too heavy, extra Subhead rule, narrow container, date right-aligned / separate line on mobile |
| 41 | FG-041 | theme-fixable-css | navigation | 10 | 0 | 10 | No 'Public' Label beside the repo name in the repo header |
| 42 | FG-042 | theme-fixable-css | navigation | 8 | 2 | 10 | Repo header: action order RSS / Unwatch / Star / Fork (github.com: Watch / Fork / Star) and Settings tab pushed to the far right |
| 43 | FG-043 | theme-fixable-template | pages/repo | 10 | 0 | 10 | Repo sidebar has no stars / watching / forks rows (github.com About box lists them) |
| 44 | FG-044 | theme-fixable-template | code | 9 | 0 | 9 | Directory listing has no 'Name \| Last commit message \| Last commit date' Box header row |
| 45 | FG-045 | theme-fixable-template | pages/repo | 6 | 3 | 9 | Commit page has no 'Commit <sha7>' H1 above the message Box; Code tab not marked active |
| 46 | FG-046 | theme-fixable-css | data-display | 0 | 9 | 9 | Mobile comment header wraps to 3 rows (~85px): name/time, '(Migrated from github.com)', then reactions/kebab |
| 47 | FG-047 | theme-fixable-css | pages/people | 0 | 9 | 9 | Notifications: unread counter outlined (not a CounterLabel), icon-only green 'Mark all as read', no selected state on mobile Unread/Read |
| 48 | FG-048 | theme-fixable-css | controls | 0 | 9 | 9 | Action-input searches are 28px/12px with an attached square search button (Semantic look); Primer TextInput is 32px/14px with a leading icon |
| 49 | FG-049 | theme-fixable-template | pages/actions-packages-projects | 8 | 0 | 8 | Actions list has no 'Actions' sidebar heading and no 'All workflows' title + subtitle |
| 50 | FG-050 | theme-fixable-css | navigation | 0 | 8 | 8 | Settings / admin NavList items have no leading 16px Octicons (github.com settings sidebars always have them) |
| 51 | FG-051 | theme-fixable-template | pages/issues-prs | 8 | 0 | 8 | Labels rows repeat '0 open issues/pull requests' text and Edit/Delete links on every row (github.com: compact icon counts, actions in a kebab) |
| 52 | FG-052 | theme-fixable-css | pages/people | 5 | 3 | 8 | Profile: follower counts not bold, Follow button has a person icon, Overview tab uses info icon (github.com: book), topic tags oversized |
| 53 | FG-053 | theme-fixable-template | pages/people | 7 | 1 | 8 | Profile README Box has no '<user> / README.md' mono caption header |
| 54 | FG-054 | theme-fixable-css | code | 0 | 7 | 7 | File-tree pane is inset with no full-height right border (github.com: flush-left 320px pane with border-right); file box not full-bleed at 390 |
| 55 | FG-055 | theme-fixable-css | pages/actions-packages-projects | 0 | 7 | 7 | Project board: toolbar button group truncated at 390 ('New Column' off-screen), 4th column cut at the container edge at 1440 |
| 56 | FG-056 | tooling | integrator/tools | 0 | 7 | 7 | Lazy-loaded images (README media, review avatars) never load in full-page captures |
| 57 | FG-057 | theme-fixable-css | pages/settings-admin | 0 | 7 | 7 | Admin repos table clipped at 1440 (scrollWidth 1052 > 934; Created cut, operations hidden) |
| 58 | FG-058 | theme-fixable-css | data-display | 0 | 7 | 7 | Org labels empty state not a Blankslate; branch refs as green-outlined labels (github.com: accent-muted commit-ref); commits Box 2px wider than siblings |
| 59 | FG-059 | theme-fixable-css | navigation | 0 | 7 | 7 | Mobile pagination shows only the current page and chevrons (no Previous/Next labels, page numbers hidden) |
| 60 | FG-060 | theme-fixable-css | controls | 0 | 7 | 7 | 'Add dependency…' select (32px, native double arrow) next to a 28px '+' button: bottoms misaligned by 4px |
| 61 | FG-061 | theme-fixable-css | pages/actions-packages-projects | 0 | 7 | 7 | Packages: names not Link blue, meta links bold+underlined, install <pre> overflows at 390, keywords plain text, 'View all' misaligned |
| 62 | FG-062 | theme-fixable-css | pages/settings-admin | 0 | 7 | 7 | Settings buttons: three primary greens on one page, mixed 28/32px sizes, 'Leave' at 32px where github.com uses btn-sm |
| 63 | FG-063 | theme-fixable-template | pages/auth | 3 | 4 | 7 | Auth pages show the full global navbar (Explore / Help / Register / Sign In); github.com auth pages show only the centred mark |
| 64 | FG-064 | theme-fixable-css | pages/settings-admin | 0 | 7 | 7 | Empty states are bare text (webhooks, deploy keys, collaborators), not bordered Blankslates |
| 65 | FG-065 | theme-fixable-css | pages/settings-admin | 0 | 7 | 7 | Settings/admin at 390: every 'Run' button wraps under its text, banner editor toolbar wraps with dangling separators, 'New Organization' on its own line |
| 66 | FG-066 | theme-fixable-css | pages/issues-prs | 0 | 6 | 6 | Inline review thread header: author not emphasised (muted regular), caret/avatar outside the thread box |
| 67 | FG-067 | theme-fixable-css | pages/people | 0 | 6 | 6 | Dashboard CLS 0.365 at 390 (Vue repo list grows 4 times while loading) |
| 68 | FG-068 | theme-fixable-css | navigation | 0 | 6 | 6 | Mobile (390) signed-in header shows only hamburger, logo and bell; avatar and create (+) are missing |
| 69 | FG-069 | theme-fixable-css | pages/issues-prs | 0 | 6 | 6 | New-issue Preview tab collapses to 0 height; org labels page mixes 28px and 32px buttons |
| 70 | FG-070 | theme-fixable-css | pages/issues-prs | 0 | 6 | 6 | Mobile PR conversation: review diff boxes break the 16px gutter (left=4px) |
| 71 | FG-071 | theme-fixable-css | pages/issues-prs | 0 | 6 | 6 | Review 'Reply' button icon invisible in light (white svg on #f6f8fa) |
| 72 | FG-072 | theme-fixable-css | pages/actions-packages-projects | 0 | 6 | 6 | Actions controls: row kebab hover turns accent-blue, Re-run split button 28px, gear menu uses checkbox squares, mobile job list ignores the 16px gutter |
| 73 | FG-073 | theme-fixable-css | pages/issues-prs | 3 | 3 | 6 | Milestone row: '0%' left of a fixed-width bar; github.com: full-width bar with '0% complete · 2 open · 0 closed' below |
| 74 | FG-074 | theme-fixable-css | pages/issues-prs | 0 | 6 | 6 | Mobile: bulk-select checkboxes on every issue row; head-branch pill wraps over 3 lines |
| 75 | FG-075 | theme-fixable-css | code | 0 | 6 | 6 | Split diff: addition-side line-number cells are neutral grey instead of green (#aceebb / #1c4428) |
| 76 | FG-076 | theme-fixable-css | code | 0 | 6 | 6 | Markdown-source syntax rules leak into rendered .md preview code blocks (.na underlined navy, .nt uncoloured) |
| 77 | FG-077 | theme-fixable-css | pages/people | 5 | 1 | 6 | Repo rows on org home / profile / explore have no 'Public' Label |
| 78 | FG-078 | theme-fixable-css | pages/repo | 0 | 5 | 5 | Mobile repo pages: full 17-entry file list + counter row, directory toolbar wraps to 3 rows, copy-path button orphaned |
| 79 | FG-079 | theme-fixable-css | pages/settings-admin | 0 | 5 | 5 | Settings details: config dl rows without Box-row separators, email list not in a Box, token/OAuth 'Generate' as <summary> triangles, ToggleSwitch mid-row, org description textarea full width |
| 80 | FG-080 | theme-fixable-css | pages/people | 0 | 5 | 5 | Explore users/orgs listed as separate bordered cards with 16px gaps; sidebar rule stops mid-page |
| 81 | FG-081 | theme-fixable-css | code | 0 | 4 | 4 | Blame metadata ~5px above the code baseline; irregular hunk row heights (20/25/26/31px) |
| 82 | FG-082 | theme-fixable-css | pages/settings-admin | 0 | 4 | 4 | Admin tables: status icons accent-blue/green mixed, trash and edit pencils accent-blue (Primer: muted icon buttons, danger on hover) |
| 83 | FG-083 | theme-fixable-css | pages/people | 0 | 4 | 4 | Dashboard: heatmap does not fill its Box (~165px empty), repo search autofocused with accent ring in every capture |
| 84 | FG-084 | theme-fixable-css | pages/issues-prs | 0 | 4 | 4 | Timeline: commit summaries in monospace, label pills ~4px above the baseline, SHA as bordered chip |
| 85 | FG-085 | theme-fixable-css | pages/actions-packages-projects | 0 | 4 | 4 | Action run/job views shift on mount at 390 (CLS 0.06-0.074) |
| 86 | FG-086 | theme-fixable-css | pages/repo | 3 | 1 | 4 | Commit rows' browse button uses octicon-file-code; github.com uses code (<>) |
| 87 | FG-087 | theme-fixable-css | markdown | 0 | 4 | 4 | Code-block copy button always visible and borderless, overlapping code at 390 (github.com: bordered 32px IconButton on hover) |
| 88 | FG-088 | theme-fixable-css | code | 4 | 0 | 4 | ```console block renders monochrome; github.com colours the output lines (chroma emits .go spans) |
| 89 | FG-089 | theme-fixable-css | controls | 0 | 4 | 4 | Controls details: comment editor double border, label edit modal inputs 27/28/32px, default-branch value in placeholder colour, help text capped at ~550px |
| 90 | FG-090 | theme-fixable-css | pages/repo | 0 | 4 | 4 | Image view footer CLS 0.022 at 1440; repo-create is a boxed form (github.com /new is unboxed with owner/name side by side) |
| 91 | FG-091 | theme-fixable-css | icons | 0 | 4 | 4 | Non-Octicon icons left: gitea-running (Actions status filter), gitea-colorblind-* (theme menu) |
| 92 | FG-092 | theme-fixable-css | pages/auth | 0 | 4 | 4 | Auth forms: signup uses 40px controls in a 352px column (github.com/login 32px, 340px), 'Account Recovery' heading 20px semibold, double space before the required '*' |
| 93 | FG-093 | theme-fixable-css | code | 0 | 4 | 4 | File info bar ('798 lines · 39 KiB · Go', '676 B · 96x96px') in monospace; github.com uses 12px sans muted |
| 94 | FG-094 | theme-fixable-css | overlays | 0 | 4 | 4 | Flash banners: danger icon in fgColor-default with 4px gap; validation flash has no Octicon/dismiss |
| 95 | FG-095 | theme-fixable-css | pages/repo | 3 | 1 | 4 | Tags Box header has no tag Octicon |
| 96 | FG-096 | theme-fixable-css | code | 0 | 3 | 3 | Diff row pitch 20px (github.com commit view ~24px); bottom expander cell 72px inset vs 88px gutter |
| 97 | FG-097 | theme-fixable-css | code | 3 | 0 | 3 | Directory icons: outlined grey in dark / different style from github.com's filled folders |
| 98 | FG-098 | theme-fixable-css | pages/repo | 0 | 3 | 3 | Mobile branches rows become 3-line stacked cards (github.com keeps a horizontally scrolling table) |
| 99 | FG-099 | theme-fixable-css | data-display | 0 | 3 | 3 | Milestone big progress bar touches the viewport edge at 390 (Gitea width:min(420px,96vw)) |
| 100 | FG-100 | theme-fixable-css | code | 0 | 3 | 3 | Mobile code chrome: 88px line-number gutter, latest-commit message dropped, diff summary text hidden |
| 101 | FG-101 | theme-fixable-css | pages/people | 0 | 3 | 3 | Org members at 390: ~170px rows (names wrap, Hidden label on its own line, buttons stacked); '2FA: ×' bare glyph |
| 102 | FG-102 | theme-fixable-css | pages/people | 0 | 3 | 3 | Org teams: staggered two-column card grid with unequal headers (github.com: one Box, one row per team) |
| 103 | FG-103 | theme-fixable-css | overlays | 0 | 3 | 3 | Destructive confirm dialogs use a green primary 'Confirm' (Primer: danger button) |
| 104 | FG-104 | theme-fixable-css | pages/people | 0 | 3 | 3 | Explore meta-row link hover underlines the '·' separator |
| 105 | FG-105 | tooling | integrator/tools | 0 | 3 | 3 | Forgot-password form never exercised (mailer disabled: page only shows 'Account recovery is disabled') |
| 106 | FG-106 | theme-fixable-css | pages/people | 0 | 3 | 3 | /user/settings header 8px lower than other settings tabs (profile.css:24 .user.profile > :first-child also matches settings) |
| 107 | FG-107 | theme-fixable-css | pages/repo | 0 | 3 | 3 | Wiki _Sidebar renders as a bulleted underlined list; Edit/New Page/Delete Page header buttons are 28px |
| 108 | FG-108 | theme-fixable-css | pages/issues-prs | 0 | 3 | 3 | PR/issue list titles read heavier than github.com (system font at 600; 500 matches Mona Sans visually) |
| 109 | FG-109 | theme-fixable-css | navigation | 0 | 3 | 3 | Mobile repo header keeps a full RSS / Watch / Star / Fork button row (~40px) under the title |
| 110 | FG-110 | theme-fixable-template | pages/repo | 3 | 0 | 3 | Single release page has no 'Releases / v1.4.6' breadcrumb (shows the list's Releases/Tags toggle) |
| 111 | FG-111 | theme-fixable-css | data-display | 0 | 2 | 2 | Mobile tables clip columns with no scroll affordance (admin users, admin emails) |
| 112 | FG-112 | inherent | markdown | 0 | 2 | 2 | Mermaid: neutral grey light theme and 100px blank space at 390 |
| 113 | FG-113 | theme-fixable-css | pages/repo | 0 | 1 | 1 | Compare range editor box is white (github.com #f6f8fa) |
| 114 | FG-114 | theme-fixable-css | icons | 0 | 1 | 1 | PR 'Files Changed' tab uses octicon-diff (bare ±); github.com uses file-diff |
| 115 | FG-115 | theme-fixable-css | navigation | 0 | 1 | 1 | Repo UnderlineNav: Issues tab not selected on milestone issue lists (only PageIsIssueList sets it) |
| 116 | FG-116 | inherent | data-display | 1 | 0 | 1 | Issue label colours (bright cyan / solid green) differ from github.com's muted pills |
| 117 | FG-117 | theme-fixable-css | navigation | 0 | 1 | 1 | Admin NavList group chevrons (right/down) differ from Primer (down rotating to up) |
| 118 | FG-118 | tooling | integrator/tools | 0 | 1 | 1 | 390 full-page captures blank below ~17,000 device px (Chromium limit) |
| 119 | FG-119 | theme-fixable-css | foundation | 0 | 1 | 1 | Repo sub-page container 1216px (x=112-1328) vs github.com 1232px (104-1336) at 1440 |
| 120 | FG-120 | inherent | icons | 0 | 1 | 1 | Brand logos reported as non-Octicon (webhook menu gitea/feishu/matrix, gitea-npm) |
| 121 | FG-121 | theme-fixable-css | overlays | 0 | 1 | 1 | Long ActionMenu (theme picker) has no scroll affordance |
| 122 | FG-122 | inherent | foundation | 0 | 1 | 1 | Font stack is the Primer system stack, github.com uses Mona Sans VF (reads slightly heavier) |

## Theme-fixable issues by owner (ranked)

- **navigation** (12): FG-007 header, FG-026 footer-meta, FG-029 mobile-tabs, FG-030 band-borders, FG-041 public-badge, FG-042 repo-header-order, FG-050 settings-navlist-icons, FG-059 mobile-pagination, FG-068 header-mobile, FG-109 repo-header-mobile, FG-115 tab-active, FG-117 navlist-chevrons
- **pages/repo** (17): FG-018 sha-style, FG-019 commits-day-groups, FG-022 wiki-pages-box, FG-024 branches-structure, FG-036 commit-title-type, FG-037 release-assets, FG-040 wiki-list-rows, FG-043 about-stats, FG-045 commit-page-h1, FG-078 repo-mobile, FG-086 browse-icon, FG-090 misc-repo, FG-095 tags-header-icon, FG-098 branches-mobile, FG-107 wiki-content, FG-110 release-breadcrumb, FG-113 compare-range
- **code** (16): FG-020 mobile-overflow, FG-021 file-view-toolbar, FG-025 tree-branch-picker, FG-028 mobile-blame, FG-032 dark-diff-double, FG-034 readme-tabs, FG-044 dir-table-header, FG-054 tree-divider, FG-075 split-add-num, FG-076 md-syntax-leak, FG-081 blame-rhythm, FG-088 console-output, FG-093 file-info-mono, FG-096 diff-rows, FG-097 folder-icons, FG-100 mobile-code-chrome
- **data-display** (5): FG-011 gitea-default-avatar, FG-046 mobile-comment-header, FG-058 dd-misc, FG-099 milestone-progress-mobile, FG-111 mobile-tables
- **pages/issues-prs** (11): FG-017 issues-dashboard, FG-039 issue-subnav, FG-051 labels-rows, FG-066 inline-review-header, FG-069 issues-misc, FG-070 mobile-review-gutter, FG-071 reply-icon, FG-073 milestone-progress, FG-074 mobile-issue-rows, FG-084 timeline-details, FG-108 pr-title-weight
- **integrator/tools** (5): FG-015 seed-markers, FG-033 diff-style-leak, FG-056 lazy-images, FG-105 forgot-password-mailer, FG-118 tall-capture
- **pages/actions-packages-projects** (8): FG-027 actions-layout, FG-035 projects-list, FG-038 action-run-graph, FG-049 actions-headings, FG-055 project-board-mobile, FG-061 packages, FG-072 actions-controls, FG-085 actions-cls
- **pages/people** (11): FG-047 notifications, FG-052 profile-details, FG-053 profile-readme-caption, FG-067 dashboard-cls, FG-077 list-public-label, FG-080 explore-rows, FG-083 dashboard-misc, FG-101 org-people-mobile, FG-102 org-teams-grid, FG-104 explore-hover, FG-106 settings-header-offset
- **pages/settings-admin** (6): FG-057 admin-table-clip, FG-062 settings-buttons, FG-064 settings-blankslates, FG-065 settings-mobile, FG-079 settings-misc, FG-082 admin-tables
- **controls** (3): FG-048 search-inputs, FG-060 select-button-align, FG-089 controls-misc
- **pages/auth** (2): FG-063 auth-header, FG-092 auth-forms
- **overlays** (3): FG-094 flash-icons, FG-103 danger-confirm, FG-121 menu-scroll
- **icons** (2): FG-091 non-octicons, FG-114 files-tab-icon
- **markdown** (1): FG-087 codeblock-copy
- **foundation** (1): FG-119 container-width

## Inherent issues (not to be hidden)

- FG-001 (273 judge reasons, critic wt 3) — GitHub-only feature/data with no Gitea equivalent (cannot be created by a theme): github.com-only features absent: Checks tab, Achievements, star Lists / starred topics, Explore Topics/Trending/Collections, Pinned + sparklines + Top languages, Sponsor, Contributors / Used by, release sha256 + reactions, Actions Usage/Caches/Workflow+Event filters, blame age legend, code folding, new PR-files toolbar (File filter / Jump to), branch Active/Stale data
- FG-002 (223 judge reasons, critic wt 3) — Gitea strings/locale: Gitea wording differs from github.com ('Description' vs 'About', 'Stable' vs 'Latest', 'Downloads' vs 'Assets', 'Compare commits', 'Browse Source', 'Starred Repositories', 'Members', '445 Commits', '8 Open / 51 Closed', 'Release details', 'Register now.'…)
- FG-003 (169 judge reasons, critic wt 0) — Seeded content differs from github.com (Gitea migration does not import timeline events, check runs, signatures, bot flags or account links): Migrated data differs: '(Migrated from github.com)' on comments, no timeline events, no Verified / CI check counts / Bot badges / linked-PR icons, commit authors shown by full name, different counts
- FG-004 (167 judge reasons, critic wt 0) — 'Powered by Gitea' attribution must stay (footer restyle allowed, attribution kept): 'Powered by Gitea' footer attribution
- FG-005 (142 judge reasons, critic wt 0) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only repo controls present: extra repo tabs (Packages, Projects, Releases, Wiki, Activity), RSS buttons, Add File, compare icon, Manage Topics, repo size, sidebar code search, Commit Graph, 'This Branch' search, Operations, tag pills in commit titles, branch-row actions (RSS/download/rename)
- FG-006 (141 judge reasons, critic wt 0) — Gitea strings/locale (text-transform cannot produce sentence case; locale overrides would change every theme): Title Case UI strings: 'Pull Requests', 'Files Changed', 'New Issue', 'New Page', 'Sign In', 'Remember This Device', 'Run Details', 'Source Code (ZIP)'…
- FG-008 (123 judge reasons, critic wt 1) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only issue/PR features present: sidebar Time Tracker, Due Date, Dependencies, Reference, Pin/Lock/Delete, 'No Branch/Tag Specified', WIP hint; merge box, Viewed/Review progress, bulk-select checkboxes, Project/Type filters, branch chips, H1/H2/H3 toolbar
- FG-009 (104 judge reasons, critic wt 0) — Gitea strings/locale: <relative-time> attributes and IEC sizes are set in Go helpers, not templates or CSS: Relative dates ('4 years ago') where github.com shows absolute dates ('on May 17, 2023'); KiB/MiB sizes and no '(N loc)'
- FG-010 (100 judge reasons, critic wt 0) — github.com reference is logged-out; ours is signed in as admin: Reference pages are logged-out github.com: marketing header (Platform/Solutions…), 'Sign up for free' banner instead of a composer, 'New issue' instead of 'Edit', marketing footer, Google/Apple SSO
- FG-012 (84 judge reasons, critic wt 4) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only people/org features present: org Members/Teams/Worktime tabs, New Repository/Migration/Team buttons, RSS + Follow on org, profile email/'Joined on'/Block user/gear, member admin (Hidden, Member Role, 2FA, Make visible/Remove/Leave), explore Repositories/Users/Organizations nav, Filter/Sort
- FG-013 (71 judge reasons, critic wt 0) — Gitea-only feature/data that must not be hidden (restyle only): Gitea-only controls on releases/tags/wiki/actions: RSS Feed + New Release, counted Releases/Tags toggle, 'Search tags', left release metadata column, 'Delete Page', wiki revision counter, 'Default Branch: master', Actor/Status/Branch run filters
- FG-014 (70 judge reasons, critic wt 0) — Gitea strings/locale (upstream plural bugs): Upstream pluralisation / word-order bugs: '1 commits', '1 changed files', '1 Participants', 'merged 1 commits from main into main'
- FG-016 (49 judge reasons, critic wt 0) — Gitea logo must stay (ARCHITECTURE §11): Gitea teacup logo in the header, on the sign-in page and in the footer
- FG-023 (24 judge reasons, critic wt 2) — External images blocked by --stable capture (ERR_BLOCKED_BY_CLIENT): README badges, logos, demo GIFs and the Dependabot score render as broken alt-text links
- FG-031 (12 judge reasons, critic wt 3) — github.com's 404 is a trademarked Octocat illustration (§11: no GitHub marks): 404 is a Primer Blankslate; github.com shows the illustrated Octocat 'This is not the web page you are looking for' page
- FG-112 (0 judge reasons, critic wt 2) — Mermaid renders in a same-origin iframe sized by Gitea (CSS cannot reach the SVG theme/size): Mermaid: neutral grey light theme and 100px blank space at 390
- FG-116 (1 judge reasons, critic wt 0) — Label colours are seeded data rendered as inline style !important (CONTEXT: exempt): Issue label colours (bright cyan / solid green) differ from github.com's muted pills
- FG-120 (0 judge reasons, critic wt 1) — Brand logos kept by ARCHITECTURE §6 (webhook providers, package types): Brand logos reported as non-Octicon (webhook menu gitea/feishu/matrix, gitea-npm)
- FG-122 (0 judge reasons, critic wt 1) — Mona Sans VF excluded by ARCHITECTURE §11 (no GitHub brand fonts): Font stack is the Primer system stack, github.com uses Mona Sans VF (reads slightly heavier)

## Details

### FG-001 — github.com-only features absent: Checks tab, Achievements, star Lists / starred topics, Explore Topics/Trending/Collections, Pinned + sparklines + Top languages, Sponsor, Contributors / Used by, release sha256 + reactions, Actions Usage/Caches/Workflow+Event filters, blame age legend, code folding, new PR-files toolbar (File filter / Jump to), branch Active/Stale data
- **Class:** inherent — GitHub-only feature/data with no Gitea equivalent (cannot be created by a theme) · **Owner:** integrator/tools · **Impact:** 276 (judge reasons 273 in 113 pairs + critic weight 3) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j9; C179), directory-tree (8.0/8.0/5.5; j3), commit-detail (7.5/7.5/6.0; j8), branches (7.5/7.5/7.0; j9), repo-issue (8.5/8.5/7.0; j4), action-run (8.5/8.5/7.5; j7), actions-list (7.5/7.5/8.0; j14; C049), compare-two-tags (7.5/7.5/7.5; j7), org-members (8.0/8.0/7.5; j9), pr-conversation-closed-unmerged (8.5/8.5/7.5; j4) … +21 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 141, page 132
- **Critic:** C028 explore-repos [nit] Repo cards lack a trailing Star button; C179 blame [nit] HTML inside markdown not syntax-coloured; no age heat bar; C049 actions-list [nit] Pagination has First/Last items
- **Judges say:** “B has GitHub's Explore/Topics/Trending/Collections subnav and a Trending developers panel” / “B has no 'Add a custom footer/sidebar' placeholders”
- **PNG:** `shots/final-gate-critic-1/al-l-b.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate-pairs/p001.png`
- **Fix:** None.

### FG-002 — Gitea wording differs from github.com ('Description' vs 'About', 'Stable' vs 'Latest', 'Downloads' vs 'Assets', 'Compare commits', 'Browse Source', 'Starred Repositories', 'Members', '445 Commits', '8 Open / 51 Closed', 'Release details', 'Register now.'…)
- **Class:** inherent — Gitea strings/locale · **Owner:** foundation · **Impact:** 226 (judge reasons 223 in 95 pairs + critic weight 3) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j7), commit-detail (7.5/7.5/6.0; j8), branches (7.5/7.5/7.0; j6), repo-issue (8.5/8.5/7.0; j5), action-run (8.5/8.5/7.5; j8), compare-two-tags (7.5/7.5/7.5; j13), milestones (8.0/8.0/7.5; j6), org-members (8.0/8.0/7.5; j9), repo-commits (7.5/7.5/7.5; j8), wiki-home (7.5/7.5/7.5; j4) … +17 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 107, content 116
- **Critic:** C042 repo-home-readme-with-images-and-tables [nit] Sidebar says 'Description' plus extra Search code and Manage Topics; C172 repo-home [nit] 'Description' heading instead of 'About'; no Public label; C198 pr-conversation-open [nit] Minor chrome differences only
- **Judges say:** “A is headed '445 Commits' and has Gitea's 'Commit Graph' button, '14 Branches 16 Tags' and a 'This Branch' search dropdown” / “B says 'edited this page 4 years ago' without a '1 revision' link”
- **PNG:** `shots/final-gate-critic-6/rh-l-00.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate-pairs/p002.png`
- **Fix:** None.

### FG-003 — Migrated data differs: '(Migrated from github.com)' on comments, no timeline events, no Verified / CI check counts / Bot badges / linked-PR icons, commit authors shown by full name, different counts
- **Class:** inherent — Seeded content differs from github.com (Gitea migration does not import timeline events, check runs, signatures, bot flags or account links) · **Owner:** integrator/tools · **Impact:** 169 (judge reasons 169 in 81 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j7), commit-detail (7.5/7.5/6.0; j4), branches (7.5/7.5/7.0; j5), repo-issue (8.5/8.5/7.0; j15), compare-two-tags (7.5/7.5/7.5; j9), milestones (8.0/8.0/7.5; j8), org-members (8.0/8.0/7.5; j1), pr-conversation-closed-unmerged (8.5/8.5/7.5; j16), repo-commits (7.5/7.5/7.5; j11), repo-pull (8.5/8.5/7.5; j15) … +16 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 86, page 83
- **Judges say:** “B commit bar shows the full names 'Joel Nativdad and Peter M. Stahl' where GitHub shows logins and stacked avatars” / “B gives every comment a large Gitea-logo avatar in the left gutter, with '(Migrated from github.com)' after the author”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate-pairs/p002.png`, `shots/final-gate-pairs/p010.png`
- **Fix:** None for the theme.

### FG-004 — 'Powered by Gitea' footer attribution
- **Class:** inherent — 'Powered by Gitea' attribution must stay (footer restyle allowed, attribution kept) · **Owner:** navigation · **Impact:** 167 (judge reasons 167 in 85 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j8), commit-detail (7.5/7.5/6.0; j7), branches (7.5/7.5/7.0; j8), not-found (7.0/7.0/7.0; j8), action-run (8.5/8.5/7.5; j8), milestones (8.0/8.0/7.5; j8), org-members (8.0/8.0/7.5; j8), pr-conversation-closed-unmerged (8.5/8.5/7.5; j1), pr-files-changed-unified (9.0/7.5/8.0; j8), repo-pull-files (8.0/8.0/7.5; j8) … +12 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 85, page 82
- **Judges say:** “B footer reads 'Powered by Gitea Version: 1.27.3 Page: 27ms Template: 3ms'” / “B footer reads 'Powered by Gitea'”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate/not-found/dark-1440.png`, `shots/final-gate/not-found/light-1440.png`, `shots/final-gate-pairs/p005.png`, `shots/final-gate-pairs/p006.png`
- **Fix:** None; footer layout already mirrors github.com's single-row footer.

### FG-005 — Gitea-only repo controls present: extra repo tabs (Packages, Projects, Releases, Wiki, Activity), RSS buttons, Add File, compare icon, Manage Topics, repo size, sidebar code search, Commit Graph, 'This Branch' search, Operations, tag pills in commit titles, branch-row actions (RSS/download/rename)
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/repo · **Impact:** 142 (judge reasons 142 in 65 pairs + critic weight 0) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j5), directory-tree (8.0/8.0/5.5; j11), commit-detail (7.5/7.5/6.0; j10), branches (7.5/7.5/7.0; j8), repo-issue (8.5/8.5/7.0; j1), action-run (8.5/8.5/7.5; j2), actions-list (7.5/7.5/8.0; j4), compare-two-tags (7.5/7.5/7.5; j6), milestones (8.0/8.0/7.5; j4), pr-files-changed-unified (9.0/7.5/8.0; j1) … +16 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 90, page 52
- **Judges say:** “A is headed '445 Commits' and has Gitea's 'Commit Graph' button, '14 Branches 16 Tags' and a 'This Branch' search dropdown” / “A has Gitea's repo tabs (Packages, Releases 53, Activity, Settings)”
- **PNG:** `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate-pairs/p013.png`, `shots/final-gate-pairs/p014.png`
- **Fix:** None beyond Primer styling (already done).

### FG-006 — Title Case UI strings: 'Pull Requests', 'Files Changed', 'New Issue', 'New Page', 'Sign In', 'Remember This Device', 'Run Details', 'Source Code (ZIP)'…
- **Class:** inherent — Gitea strings/locale (text-transform cannot produce sentence case; locale overrides would change every theme) · **Owner:** foundation · **Impact:** 141 (judge reasons 141 in 78 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j1), branches (7.5/7.5/7.0; j6), repo-issue (8.5/8.5/7.0; j6), action-run (8.5/8.5/7.5; j7), actions-list (7.5/7.5/8.0; j4), compare-two-tags (7.5/7.5/7.5; j5), milestones (8.0/8.0/7.5; j7), pr-conversation-closed-unmerged (8.5/8.5/7.5; j3), pr-files-changed-unified (9.0/7.5/8.0; j9), repo-pull (8.5/8.5/7.5; j6) … +14 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 65, content 76
- **Judges say:** “B uses Title Case ('Pull Requests', 'No Milestone', 'No Assignees')” / “B uses Title Case 'New Page'”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate/action-run/dark-1440.png`, `shots/final-gate/action-run/light-1440.png`, `shots/final-gate-pairs/p005.png`, `shots/final-gate-pairs/p006.png`
- **Fix:** None required. Possible partial mitigation (not recommended): html:lang(en) + text-transform:lowercase + ::first-letter uppercase only works on block/inline-block text-only buttons, not on flex tab items with leading icons.

### FG-007 — Global header is Gitea's text-link bar (Issues / Pull Requests / Milestones / Explore), not github.com's signed-in AppHeader
- **Class:** theme-fixable-template · **Owner:** navigation · **Impact:** 130 (judge reasons 124 in 74 pairs + critic weight 6) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j3), directory-tree (8.0/8.0/5.5; j3), commit-detail (7.5/7.5/6.0; j2), branches (7.5/7.5/7.0; j4), not-found (7.0/7.0/7.0; j3; C033), repo-issue (8.5/8.5/7.0; j4), action-run (8.5/8.5/7.5; j4), actions-list (7.5/7.5/8.0; j4), compare-two-tags (7.5/7.5/7.5; j4), milestones (8.0/8.0/7.5; j3) … +28 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 124
- **Critic:** C033 not-found [minor] Signed-in header information architecture differs from github.com (cross-cutting); C189 site-admin [nit] Global header differs from GitHub's signed-in AppHeader; C027 explore-repos [nit] Header 'Explore' link shows a grey active pill; C190 repo-issues [nit] Divider between global bar and repo header
- **Judges say:** “B global header has the Gitea teacup logo and Issues/Pull Requests/Milestones/Explore nav” / “A has the Gitea logo header and a 'Powered by Gitea' footer”
- **PNG:** `shots/final-gate-critic-1/er-l-a.png`, `shots/final-gate/repo-issues/light-1440.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`
- **Fix:** github-* branch in templates/base/head_navbar.tmpl rendering the AppHeader markup specified in docs/final-gate/issues.md → 'Header decision' (hamburger that opens a nav drawer holding Gitea's links, logo, context crumbs, search field, create menu, Issues / Pull requests / Notifications icon buttons, avatar); navigation restyles it. Gitea logo stays as the AppHeader mark.
- **Why this class:** CSS cannot create the context crumbs (needs .Repository / .ContextUser / page data) or a working search form, and cannot move Gitea's text links into a drawer while keeping them reachable. §7: layout unreachable by CSS, github-* branch only, else-branch = upstream bytes.

### FG-008 — Gitea-only issue/PR features present: sidebar Time Tracker, Due Date, Dependencies, Reference, Pin/Lock/Delete, 'No Branch/Tag Specified', WIP hint; merge box, Viewed/Review progress, bulk-select checkboxes, Project/Type filters, branch chips, H1/H2/H3 toolbar
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/issues-prs · **Impact:** 124 (judge reasons 123 in 41 pairs + critic weight 1) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issue (8.5/8.5/7.0; j14; C088), milestones (8.0/8.0/7.5; j6), pr-conversation-closed-unmerged (8.5/8.5/7.5; j14), pr-files-changed-unified (9.0/7.5/8.0; j11), repo-pull (8.5/8.5/7.5; j11), repo-pull-files (8.0/8.0/7.5; j10), issues-list-closed (9.0/9.0/8.0; j11), pr-commits-tab (8.5/8.5/8.0; j1), pr-conversation-open (8.5/8.5/8.0; j19), repo-issues (8.5/8.5/8.0; j9) … +1 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 60, content 63
- **Critic:** C088 repo-issue [nit] Labels SelectPanel lacks title row; H1/H2/H3 toolbar glyphs
- **Judges say:** “B sidebar is Gitea's: Time Tracker, Due Date, Dependencies, Reference, gear icons, 'No Branch/Tag Specified'” / “B has no timeline events for label or commit references”
- **PNG:** `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-1440.png`, `shots/final-gate/pr-files-changed-unified/dark-1440.png`, `shots/final-gate/pr-files-changed-unified/light-1440.png`, `shots/final-gate-pairs/p017.png`, `shots/final-gate-pairs/p018.png`
- **Fix:** None beyond Primer styling. (Labels SelectPanel 'Apply labels' title needs template overrides of several filter templates: OV-5, rejected, keep rejected.)

### FG-009 — Relative dates ('4 years ago') where github.com shows absolute dates ('on May 17, 2023'); KiB/MiB sizes and no '(N loc)'
- **Class:** inherent — Gitea strings/locale: <relative-time> attributes and IEC sizes are set in Go helpers, not templates or CSS · **Owner:** foundation · **Impact:** 104 (judge reasons 104 in 61 pairs + critic weight 0) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j8), directory-tree (8.0/8.0/5.5; j1), repo-issue (8.5/8.5/7.0; j1), actions-list (7.5/7.5/8.0; j6), pr-files-changed-unified (9.0/7.5/8.0; j1), repo-commits (7.5/7.5/7.5; j2), wiki-home (7.5/7.5/7.5; j2), wiki-page-list (7.5/7.5/7.5; j8), file-view-markdown (8.0/8.0/8.0; j7), issues-list-closed (9.0/9.0/8.0; j8) … +10 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 52, content 52
- **Judges say:** “A has a 'Downloads' section with KiB/MiB sizes and info icons, with no sha256 digests” / “B sidebar is headed 'Description', not 'About', and shows '[seed]' text, 'Manage Topics', a '5.4 MiB' size and a 'Search code...' box”
- **PNG:** `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`, `shots/final-gate-pairs/p013.png`, `shots/final-gate-pairs/p014.png`
- **Fix:** None.

### FG-010 — Reference pages are logged-out github.com: marketing header (Platform/Solutions…), 'Sign up for free' banner instead of a composer, 'New issue' instead of 'Edit', marketing footer, Google/Apple SSO
- **Class:** inherent — github.com reference is logged-out; ours is signed in as admin · **Owner:** integrator/tools · **Impact:** 100 (judge reasons 100 in 49 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j2), commit-detail (7.5/7.5/6.0; j1), not-found (7.0/7.0/7.0; j12), repo-issue (8.5/8.5/7.0; j8), action-run (8.5/8.5/7.5; j1), milestones (8.0/8.0/7.5; j4), pr-conversation-closed-unmerged (8.5/8.5/7.5; j7), pr-files-changed-unified (9.0/7.5/8.0; j7), repo-pull (8.5/8.5/7.5; j11), repo-pull-files (8.0/8.0/7.5; j6) … +8 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 48, page 52
- **Judges say:** “B has an 'Edit' button instead of 'New issue'” / “A has a 'Sign in with OpenID' button instead of Continue with Google/Apple”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/not-found/dark-1440.png`, `shots/final-gate/not-found/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate-pairs/p005.png`, `shots/final-gate-pairs/p006.png`
- **Fix:** None for the theme. Optional tooling: capture signed-in github.com references (the target is the signed-in UI) so judges compare like with like.

### FG-011 — Gitea default avatar (teacup logo image) on migrated authors, commit authors and blame rows
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 95 (judge reasons 95 in 55 pairs + critic weight 0) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j7), directory-tree (8.0/8.0/5.5; j8), commit-detail (7.5/7.5/6.0; j5), repo-issue (8.5/8.5/7.0; j8), compare-two-tags (7.5/7.5/7.5; j8), org-members (8.0/8.0/7.5; j1), pr-conversation-closed-unmerged (8.5/8.5/7.5; j7), repo-commits (7.5/7.5/7.5; j8), repo-pull (8.5/8.5/7.5; j7), file-view-markdown (8.0/8.0/8.0; j6) … +5 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 49, page 46
- **Judges say:** “B puts a Gitea teacup avatar before the author” / “B gives every comment a large Gitea-logo avatar in the left gutter, with '(Migrated from github.com)' after the author”
- **PNG:** `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate-pairs/p013.png`, `shots/final-gate-pairs/p015.png`
- **Fix:** Replace the placeholder only: img.ui.avatar[src$='/assets/img/avatar_default.png'] → neutral Primer placeholder (bgColor-neutral-muted circle + fgColor-muted person Octicon) via object-position + background/mask, or a token data-URI per scheme (integrator adds the token). The navbar logo and footer logo are untouched.
- **Why this class:** The default-avatar image is a content placeholder, not site branding; §11 keeps the Gitea logo in the chrome (header, footer, sign-in). Orchestrator: confirm this reading of §11 before building.

### FG-012 — Gitea-only people/org features present: org Members/Teams/Worktime tabs, New Repository/Migration/Team buttons, RSS + Follow on org, profile email/'Joined on'/Block user/gear, member admin (Hidden, Member Role, 2FA, Make visible/Remove/Leave), explore Repositories/Users/Organizations nav, Filter/Sort
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/people · **Impact:** 88 (judge reasons 84 in 24 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-members (8.0/8.0/7.5; j16; C050 C052), explore-repos (8.0/8.0/8.0; j11), org-home (8.5/8.5/8.5; j19), user-profile (8.5/8.5/8.5; j8), user-profile-repositories-tab (8.5/8.5/8.5; j16), user-profile-stars-tab (8.5/8.5/8.5; j14)
- **Schemes / viewports:** dark, light / 1440; judge variants content 41, page 43
- **Critic:** C050 org-members [minor] No 'People' left column; C052 org-members [nit] '2FA: ×' bare glyph line
- **Judges say:** “A is a Gitea explore page with a left menu of Repositories/Users/Organizations and Filter/Sort buttons” / “A cards show the star, PR and fork counts separated by '·' dots in Gitea's format”
- **PNG:** `docs/reference/org-members/light-1440.png`, `shots/final-gate/org-members/dark-1440.png`, `shots/final-gate/org-members/light-1440.png`, `shots/final-gate/explore-repos/dark-1440.png`, `shots/final-gate/explore-repos/light-1440.png`, `shots/final-gate/org-home/dark-1440.png`, `shots/final-gate/org-home/light-1440.png`, `shots/final-gate/user-profile/dark-1440.png`, `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate-pairs/p001.png`
- **Fix:** None.

### FG-013 — Gitea-only controls on releases/tags/wiki/actions: RSS Feed + New Release, counted Releases/Tags toggle, 'Search tags', left release metadata column, 'Delete Page', wiki revision counter, 'Default Branch: master', Actor/Status/Branch run filters
- **Class:** inherent — Gitea-only feature/data that must not be hidden (restyle only) · **Owner:** pages/actions-packages-projects · **Impact:** 71 (judge reasons 71 in 26 pairs + critic weight 0) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): actions-list (7.5/7.5/8.0; j3), wiki-home (7.5/7.5/7.5; j9), wiki-page-list (7.5/7.5/7.5; j8), releases (8.5/8.5/8.0; j17), wiki-page (8.0/8.0/8.0; j9), tags (9.0/9.0/8.5; j14), release-detail (8.8/8.8/8.8; j11)
- **Schemes / viewports:** dark, light / 1440; judge variants content 36, page 35
- **Judges say:** “B has a 'Delete Page' red button and a revision-count clock icon” / “A wiki has a 'Page: Home' select, a green Code button and a 'Delete Page' button”
- **PNG:** `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`, `shots/final-gate/wiki-home/dark-1440.png`, `shots/final-gate/wiki-home/light-1440.png`, `shots/final-gate/wiki-page-list/dark-1440.png`, `shots/final-gate/wiki-page-list/light-1440.png`, `shots/final-gate/releases/dark-1440.png`, `shots/final-gate/releases/light-1440.png`, `shots/final-gate-pairs/p073.png`, `shots/final-gate-pairs/p074.png`
- **Fix:** None.

### FG-014 — Upstream pluralisation / word-order bugs: '1 commits', '1 changed files', '1 Participants', 'merged 1 commits from main into main'
- **Class:** inherent — Gitea strings/locale (upstream plural bugs) · **Owner:** foundation · **Impact:** 70 (judge reasons 70 in 28 pairs + critic weight 0) · weakest route 6.0
- **Routes** (light/dark/390 critic score; j = judge reasons): commit-detail (7.5/7.5/6.0; j7), repo-issue (8.5/8.5/7.0; j1), pr-conversation-closed-unmerged (8.5/8.5/7.5; j5), pr-files-changed-unified (9.0/7.5/8.0; j15), repo-pull (8.5/8.5/7.5; j7), repo-pull-files (8.0/8.0/7.5; j15), pr-commits-tab (8.5/8.5/8.0; j16), pr-conversation-open (8.5/8.5/8.0; j4)
- **Schemes / viewports:** dark, light / 1440; judge variants content 36, page 34
- **Judges say:** “B has a '1 changed files with 3 additions and 3 deletions' summary bar, a '0 / 1 files viewed' progress bar and a green 'Review' dropdown” / “B header reads 'innobead merged 1 commits from main into main 6 years ago' — plural error, and it lacks the fork owner prefix”
- **PNG:** `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-1440.png`, `shots/final-gate/pr-files-changed-unified/dark-1440.png`, `shots/final-gate/pr-files-changed-unified/light-1440.png`, `shots/final-gate-pairs/p029.png`, `shots/final-gate-pairs/p037.png`
- **Fix:** None.

### FG-015 — Seed data carries visible markers: '[seed]' descriptions, 'theme-seed' / 'migrated-from-github' topics, org README naming tools/seed/seed.mjs and 'GitHub-lookalike Gitea theme', '(seeded test account)' bios, 'Smoke edit' runs by admin
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 50 (judge reasons 50 in 32 pairs + critic weight 0) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): action-run (8.5/8.5/7.5; j2), actions-list (7.5/7.5/8.0; j4), org-members (8.0/8.0/7.5; j1), wiki-page-list (7.5/7.5/7.5; j1), explore-repos (8.0/8.0/8.0; j9), file-view-markdown (8.0/8.0/8.0; j2), issues-list-closed (9.0/9.0/8.0; j2), repo-code-file (8.5/8.5/8.0; j1), repo-home (8.5/8.5/8.0; j6), org-home (8.5/8.5/8.5; j7) … +3 more
- **Schemes / viewports:** dark, light / 1440; judge variants content 27, page 23
- **Judges say:** “A repo cards show '[seed]' descriptions and octo-org/alice-dev/bob-dev owners” / “A run was triggered by 'admin' on octo-org/theme-playground”
- **PNG:** `shots/final-gate/action-run/dark-1440.png`, `shots/final-gate/action-run/light-1440.png`, `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`, `shots/final-gate/org-members/dark-1440.png`, `shots/final-gate/org-members/light-1440.png`, `shots/final-gate/wiki-page-list/dark-1440.png`, `shots/final-gate/wiki-page-list/light-1440.png`, `shots/final-gate-pairs/p001.png`, `shots/final-gate-pairs/p002.png`
- **Fix:** tools/seed: keep a machine-readable marker (repo/org metadata or a manifest) instead of visible '[seed]' prefixes, '(migrated from …)' suffixes, 'theme-seed'/'migrated-from-github' topics and the seed-note README; give smoke runs neutral titles. Never touch pre-seed data (admin/jiri, ai/jiri). Idempotent re-seed.
- **Why this class:** Not a theme defect; removable by the seed tool. Remaining content differences (owner names, counts) stay inherent.

### FG-016 — Gitea teacup logo in the header, on the sign-in page and in the footer
- **Class:** inherent — Gitea logo must stay (ARCHITECTURE §11) · **Owner:** navigation · **Impact:** 49 (judge reasons 49 in 34 pairs + critic weight 0) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j2), repo-issue (8.5/8.5/7.0; j4), action-run (8.5/8.5/7.5; j2), milestones (8.0/8.0/7.5; j4), org-members (8.0/8.0/7.5; j1), pr-conversation-closed-unmerged (8.5/8.5/7.5; j1), repo-commits (7.5/7.5/7.5; j2), wiki-home (7.5/7.5/7.5; j1), wiki-page-list (7.5/7.5/7.5; j1), explore-repos (8.0/8.0/8.0; j2) … +13 more
- **Schemes / viewports:** dark, light / 1440; judge variants page 42, content 7
- **Judges say:** “B global header has the Gitea teacup logo and Issues/Pull Requests/Milestones/Explore nav” / “A header has the Gitea logo”
- **PNG:** `shots/final-gate/not-found/dark-1440.png`, `shots/final-gate/not-found/light-1440.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate/action-run/dark-1440.png`, `shots/final-gate/action-run/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate-pairs/p003.png`, `shots/final-gate-pairs/p005.png`
- **Fix:** None (keep). The AppHeader override uses the Gitea logo as the mark.

### FG-017 — Issues / PRs / Labels / Milestones pages lack github.com's issues layout: left NavList (Issues, Assigned to me, Created by me, Mentioned, Milestones, Labels) and an 'All issues' heading + query bar
- **Class:** theme-fixable-template · **Owner:** pages/issues-prs · **Impact:** 45 (judge reasons 45 in 20 pairs + critic weight 0) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): milestones (8.0/8.0/7.5; j10), issues-list-closed (9.0/9.0/8.0; j11), labels (8.5/8.5/8.0; j7), repo-issues (8.5/8.5/8.0; j9), repo-pulls (8.6/8.6/8.3; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants page 20, content 25
- **Judges say:** “B milestones sit under the repo Issues tab with Labels/Milestones sub-tabs and a search bar, not in GitHub's Issues sidebar layout” / “B has no Issues left sidebar (Assigned to me, Created by me, Views…) and no 'is:issue state:open' query box”
- **PNG:** `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/issues-list-closed/dark-1440.png`, `shots/final-gate/issues-list-closed/light-1440.png`, `shots/final-gate/labels/dark-1440.png`, `shots/final-gate/labels/light-1440.png`, `shots/final-gate/repo-issues/dark-1440.png`, `shots/final-gate/repo-issues/light-1440.png`, `shots/final-gate-pairs/p017.png`, `shots/final-gate-pairs/p018.png`
- **Fix:** github-* branch in templates/repo/issue/list.tmpl (+ labels / milestones pages): left NavList linking to existing Gitea filters (?type=all|assigned|created_by|mentioned, milestones, labels) and a Subhead 'Issues'/'Pull requests' above Gitea's search input restyled as the query bar. No new functionality, no removed filters.
- **Why this class:** A sidebar column and links need markup; CSS cannot create them. (Optional, large: rank vs cost before starting.)

### FG-018 — Commit SHAs are 10 characters (and sans-serif on the commits list / PR commits tab); github.com shows 7-char 12px mono muted
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 40 (judge reasons 33 in 20 pairs + critic weight 7) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j1), commit-detail (7.5/7.5/6.0; j6), compare-two-tags (7.5/7.5/7.5; j5), repo-commits (7.5/7.5/7.5; j8; C191), pr-commits-tab (8.5/8.5/8.0; j5), pr-draft-wip-playground (8.5/8.5/8.0; C200), repo-code-file (8.5/8.5/8.0; j1), tags (9.0/9.0/8.5; j7)
- **Schemes / viewports:** dark, light / 1440; judge variants page 19, content 14
- **Critic:** C191 repo-commits [major] Commit SHA is sans-serif and titles are too light; C200 pr-draft-wip-playground [nit] Timeline commit SHA drawn as a bordered chip
- **Judges say:** “A shows long SHAs (e.g. 99cc347707) and a Gitea logo for the author avatars” / “B tag rows show 'Release details' and long SHAs; GitHub shows 'Notes' and 'Downloads' plus short SHAs and absolute dates”
- **PNG:** `docs/reference/repo-commits/light-1440.png`, `shots/final-gate-critic-7/repo-commits/zoom-row-ours.png`, `docs/reference/pr-conversation-open/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`, `shots/final-gate/repo-commits/dark-1440.png`
- **Fix:** Render SHA links as ui-monospace 12px fgColor-muted with inline-size:7ch; overflow:hidden (href, tooltip and copy button keep the full SHA). Applies to #commits-table td.sha, commit page parent/commit, tag rows, timeline commit rows (issues-prs owns the timeline selector: C200 bordered chip → plain mono link).
- **Why this class:** Visual truncation of existing text; the full SHA stays in the link and clipboard.

### FG-019 — Commit lists are a flat Box ('445 Commits' / '1 Commits' header) instead of github.com's 'Commits on <date>' timeline groups (commits page, PR Commits tab, compare)
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 35 (judge reasons 26 in 12 pairs + critic weight 9) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): compare-two-tags (7.5/7.5/7.5; j10; C017), repo-commits (7.5/7.5/7.5; j8), pr-commits-tab (8.5/8.5/8.0; j8; C015), pr-commits-tab-playground (8.0/8.0/8.0; C183)
- **Schemes / viewports:** dark, light / 1440; judge variants page 12, content 14
- **Critic:** C015 pr-commits-tab [minor] Commits shown in a '1 Commits' Box instead of a date-grouped timeline; C183 pr-commits-tab-playground [minor] Commit list is a Box with a '2 Commits' header, and SHAs are in sans; C017 compare-two-tags [minor] Commit list typography and SHA treatment differ
- **Judges say:** “A commits are not grouped under 'Commits on <date>' headers with the timeline line” / “B lists '74 Commits' flat, not grouped by date, and has no Commits/Files changed tabs”
- **PNG:** `shots/final-gate/pr-commits-tab/light-1440.png`, `shots/final-gate-critic-6/prc-sha.png`, `shots/final-gate/pr-commits-tab-playground/light-1440.png`, `docs/reference/pr-commits-tab/light-1440.png`, `shots/final-gate-critic-0/ct-l-z.png`, `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`, `shots/final-gate/repo-commits/dark-1440.png`, `shots/final-gate/repo-commits/light-1440.png`, `shots/final-gate/pr-commits-tab/dark-1440.png`
- **Fix:** github-* branch in templates/repo/commits_list.tmpl: before each row whose committer day differs from the previous row, close the Box and emit a timeline header (git-commit Octicon + date via DateUtils.AbsoluteShort; 'Commits on' via :lang(en) CSS or date only); pages/repo styles it (12px muted, 16px gutter line, one Box per day).
- **Why this class:** Grouping needs per-row date state; CSS cannot insert rows. Previously REJECTED for upkeep (integrator w3); it is now the #2 per-page tell (~40 judge reasons on 3 routes) — revisit.

### FG-020 — Horizontal page overflow at 390: directory latest-commit row (404-421px) and unified diff with inline review comment (754px)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 30 (judge reasons 0 in 0 pairs + critic weight 30) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-unified-playground-large-diff (8.5/8.5/5.0; C152), directory-tree (8.0/8.0/5.5; C143), pr-files-changed-split-playground-large-diff (8.5/8.5/6.8; C122)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C143 directory-tree [blocker] Horizontal page overflow at 390 (regression); C152 pr-files-changed-unified-playground-large-diff [blocker] Page renders 754px wide at 390; C122 pr-files-changed-split-playground-large-diff [major] Mobile: inline review thread crushed into ~110px split column
- **PNG:** `shots/final-gate/directory-tree/light-390.png`, `shots/final-gate-critic-5/prf-l390-tail.png`, `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-44230.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-390.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-390.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-1440.png`, `shots/final-gate/directory-tree/dark-390.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-390.png`
- **Fix:** directory-tree: let a.m-commit-count wrap/shrink (github.com wraps into a 2-line commit box). Unified diff: contain the table (overflow-x:auto on .file-body, pre in inline comments white-space:pre-wrap / max-width:100%). Split diff at <768: let .conversation-holder span both columns (colspan via grid) or fall back to unified layout for comment rows.
- **Why this class:** CSS.

### FG-021 — File / blame header: Gitea 'Raw | Permalink | Blame | History' group (+ 'Normal View' / 'Unescape') instead of github.com's Code | Blame (Preview for .md) SegmentedControl with Raw / copy / download icon buttons
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 29 (judge reasons 29 in 12 pairs + critic weight 0) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j13), file-view-markdown (8.0/8.0/8.0; j8), repo-code-file (8.5/8.5/8.0; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants content 15, page 14
- **Judges say:** “B file view has no Preview/Code/Blame segmented control; it shows Gitea's Raw/Permalink/Blame/History buttons and '22 KiB'” / “B file view header reads '448 lines · 16 KiB · Rust' with Raw/Permalink/Blame/History buttons instead of GitHub's Code/Blame toggle and '447 lines (399 loc) · 16 KB'”
- **PNG:** `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/file-view-markdown/dark-1440.png`, `shots/final-gate/file-view-markdown/light-1440.png`, `shots/final-gate/repo-code-file/dark-1440.png`, `shots/final-gate/repo-code-file/light-1440.png`, `shots/final-gate-pairs/p025.png`, `shots/final-gate-pairs/p026.png`, `shots/final-gate-pairs/p027.png`
- **Fix:** github-* branch in templates/repo/view_file.tmpl (and repo/blame.tmpl header): left SegmentedControl [Preview (markdown only) | Code | Blame] built from the existing links (Preview/Code = the current file URL with/without ?display=source, Blame = .RepoLink/blame/…), right: Raw button + copy-raw / download icon buttons; Permalink, History, RSS, edit, delete stay as icon buttons (or in a kebab ActionMenu using a Fomantic dropdown). code styles it.
- **Why this class:** CSS cannot create the missing 'Code' segment nor move Blame out of the right-hand button group into a separate control; non-GitHub themes keep upstream bytes.

### FG-022 — Wiki sidebar is a 'Page: Home' dropdown + green 'Code' clone button instead of github.com's 'Pages (N)' Box with filter and 'Clone this wiki locally' input
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 27 (judge reasons 21 in 8 pairs + critic weight 6) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-home (7.5/7.5/7.5; j9; C180), wiki-page (8.0/8.0/8.0; j12; C014)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants content 11, page 10
- **Critic:** C014 wiki-page [minor] Wiki sidebar is a dropdown plus a green Code button, not a Pages Box; C180 wiki-home [minor] Wiki sidebar is Gitea's select plus Code button, not GitHub's Pages box and clone input
- **Judges say:** “B wiki has a 'Page: Home' dropdown and a green 'Code' clone button instead of GitHub's 'Pages 1' box and 'Clone this wiki locally'” / “A wiki has a 'Page: Home' select, a green Code button and a 'Delete Page' button”
- **PNG:** `shots/final-gate/wiki-page/light-1440.png`, `shots/final-gate-critic-6/wiki-d.png`, `shots/final-gate/wiki-home/dark-390.png`, `shots/final-gate/wiki-home/dark-1440.png`, `shots/final-gate/wiki-home/light-390.png`, `shots/final-gate/wiki-home/light-1440.png`, `shots/final-gate/wiki-page/dark-390.png`, `shots/final-gate/wiki-page/dark-1440.png`, `shots/final-gate/wiki-page/light-390.png`, `shots/final-gate/wiki-page/light-1440.png`
- **Fix:** github-* branch in templates/repo/wiki/view.tmpl: right-column Box 'Pages <count>' with the existing filter input and the .Pages list (data IS loaded on view: routers/web/repo/wiki.go renderViewPage sets ctx.Data["Pages"]; the earlier rejection assumed ?action=_pages only), plus a 'Clone this wiki locally' input group from .CloneButtonOriginLink.HTTPS with the copy button. Keep 'New Page', 'Edit', 'Delete Page' and the revisions link.
- **Why this class:** Moving a Fomantic dropdown menu and a tippy-only clone popup into a static sidebar is not CSS-reachable (tippy-target is display:none !important; lint forbids display in *.important.css).

### FG-023 — README badges, logos, demo GIFs and the Dependabot score render as broken alt-text links
- **Class:** inherent — External images blocked by --stable capture (ERR_BLOCKED_BY_CLIENT) · **Owner:** integrator/tools · **Impact:** 26 (judge reasons 24 in 12 pairs + critic weight 2) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-closed-unmerged (8.5/8.5/7.5; j8), file-view-markdown (8.0/8.0/8.0; j8; C068), repo-home (8.5/8.5/8.0; j8; C171)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants content 12, page 12
- **Critic:** C068 file-view-markdown [nit] External README images and badges blocked by the shooter; C171 repo-home [nit] External README badges and images blocked in the capture
- **Judges say:** “B README badges and the logo render as broken alt-text links (images blocked)” / “B README badges render as broken alt-text links”
- **PNG:** `shots/final-gate/file-view-markdown/light-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-390.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-390.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-1440.png`, `shots/final-gate/file-view-markdown/dark-390.png`, `shots/final-gate/file-view-markdown/dark-1440.png`, `shots/final-gate/file-view-markdown/light-390.png`, `shots/final-gate/file-view-markdown/light-1440.png`, `shots/final-gate/repo-home/dark-390.png`
- **Fix:** None for the theme. (Capture-policy decision for the integrator: allow-list shields.io / raw.githubusercontent.com for judge pairs, or accept.)

### FG-024 — Branches page: no 'Branches' title, no column-header row (Branch / Updated / Check status / Behind|Ahead / Pull request), 5 icon buttons per row instead of delete + kebab
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 23 (judge reasons 11 in 4 pairs + critic weight 12) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): branches (7.5/7.5/7.0; j11; C036 C037 C038)
- **Schemes / viewports:** dark, light / 1440; judge variants page 6, content 5
- **Critic:** C036 branches [major] Branch table has no column-header row; C037 branches [minor] No 'Branches' page title or Overview/Active/Stale/All UnderlineNav; C038 branches [minor] 5 icon buttons per row vs GitHub's delete plus kebab
- **Judges say:** “B no 'Overview/Active/Stale/All' tabs and no table header (Branch/Updated/Check status/Behind|Ahead/Pull request)” / “B no 'Branches' page title”
- **PNG:** `shots/final-gate-critic-1/br-l.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate-pairs/p069.png`, `shots/final-gate-pairs/p070.png`, `shots/final-gate-pairs/p071.png`
- **Fix:** github-* branch in templates/repo/branch/list.tmpl: Subhead 'Branches' (repo.branches key), a <thead>-style Box header row using existing locale keys, per-row actions: delete icon button + kebab ActionMenu (Fomantic dropdown) holding create-branch / RSS / download / rename. Overview/Active/Stale tabs stay out (no Gitea data).
- **Why this class:** Header row and kebab need markup; CSS cannot move actions into a menu. Previously REJECTED (integrator w3) mainly for the tabs, which this spec drops.

### FG-025 — Branch picker, 'Go to file' and 'Add File' sit above the content instead of in the file-tree pane header (github.com: branch picker + search at the top of the tree)
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 22 (judge reasons 22 in 13 pairs + critic weight 0) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; j2), directory-tree (8.0/8.0/5.5; j7), file-view-markdown (8.0/8.0/8.0; j5), repo-code-file (8.5/8.5/8.0; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants content 14, page 8
- **Judges say:** “B shows the branch selector and breadcrumb above the file table, not in the sidebar with the file tree the way GitHub does” / “B file tree has Gitea's layout, with the branch selector outside the tree”
- **PNG:** `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/file-view-markdown/dark-1440.png`, `shots/final-gate/file-view-markdown/light-1440.png`, `shots/final-gate/repo-code-file/dark-1440.png`, `shots/final-gate/repo-code-file/light-1440.png`, `shots/final-gate-pairs/p025.png`, `shots/final-gate-pairs/p026.png`
- **Fix:** Additive github-* branch in the Modern-owned override templates/repo/view_content.tmpl (integrator only, additive, CONTEXT): when the file tree is shown, render the branch dropdown + 'Go to file' search in the tree pane header; keep the main toolbar's other controls. code styles the pane header.
- **Why this class:** The controls live in a different container than the Vue tree pane; display:contents/grid hacks across the Modern override are too fragile. Must stay byte-identical for non-GitHub themes (and for Modern).

### FG-026 — Footer shows 'Version: 1.27.3' and 'Page: 27ms Template: 3ms' diagnostics next to the attribution
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 21 (judge reasons 21 in 15 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j4), milestones (8.0/8.0/7.5; j5), org-members (8.0/8.0/7.5; j3), wiki-home (7.5/7.5/7.5; j1), wiki-page-list (7.5/7.5/7.5; j2), labels (8.5/8.5/8.0; j2), pr-commits-tab (8.5/8.5/8.0; j2), user-profile (8.5/8.5/8.5; j1), user-profile-repositories-tab (8.5/8.5/8.5; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants content 16, page 5
- **Judges say:** “B footer reads 'Powered by Gitea Version: 1.27.3 Page: 27ms Template: 3ms'” / “B footer reads 'Powered by Gitea Version: 1.27.3 Page: 6ms Template: 3ms' with green Gitea teacup logo in footer and global header”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/org-members/dark-1440.png`, `shots/final-gate/org-members/light-1440.png`, `shots/final-gate/wiki-home/dark-1440.png`, `shots/final-gate/wiki-home/light-1440.png`, `shots/final-gate-pairs/p010.png`, `shots/final-gate-pairs/p058.png`
- **Fix:** In github-* themes render the version/timing spans as the least prominent footer items (after the link row, fgColor-muted, same 12px) — or hide only the timing span (diagnostic output, not a function). Keep the Gitea logo, 'Powered by Gitea', language and theme menus, Licenses, API. Alternative (integrator, all themes): app.ini SHOW_FOOTER_VERSION / SHOW_FOOTER_TEMPLATE_LOAD_TIME — needs the owner's consent, not a theme change.
- **Why this class:** Restyling the footer is explicitly allowed (keep logo + 'Powered by Gitea').

### FG-027 — Actions list is a centred container with a borderless NavList, not github.com's full-bleed split PageLayout (sidebar pinned left with border, 1056px runs Box)
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 19 (judge reasons 7 in 4 pairs + critic weight 12) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): actions-empty-filter (7.5/7.5/8.0; C080), actions-list (7.5/7.5/8.0; j7; C046)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 3, content 4
- **Critic:** C046 actions-list [major] Not a full-bleed PageLayout; no page title or filter input; C080 actions-empty-filter [major] Actions list layout is not GitHub's full-width split layout
- **Judges say:** “B run titles are 'Smoke edit 2026...' by 'admin'” / “B's Actions sidebar lists only 'All Workflows' (title case) and 'CI', with no 'Actions' heading, Management or Caches section”
- **PNG:** `shots/final-gate-critic-1/al-l-a.png`, `docs/reference/actions-list/light-1440.png`, `shots/final-gate/actions-empty-filter/light-1440.png`, `shots/final-gate/actions-empty-filter/dark-390.png`, `shots/final-gate/actions-empty-filter/dark-1440.png`, `shots/final-gate/actions-empty-filter/light-390.png`, `shots/final-gate/actions-empty-filter/light-1440.png`, `shots/final-gate/actions-list/dark-390.png`, `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-390.png`
- **Fix:** Full-bleed two-pane layout at ≥1012px: sidebar flush left (~336px) with border-right, main pane from x≈360. The 'Actions' / 'All workflows' headings need template text: see actions-headings.
- **Why this class:** CSS layout.

### FG-028 — Mobile blame: code is entirely off-screen (blame column ~312px, table 1038-2031px wide)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 18 (judge reasons 0 in 0 pairs + critic weight 18) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; C176), blame-playground-multiple-authors (8.0/8.0/5.0; C194)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C176 blame [major] Mobile blame shows no code at all; C194 blame-playground-multiple-authors [blocker] At 390 the code is entirely off-screen; only the blame column shows
- **PNG:** `shots/final-gate/blame/light-390.png`, `shots/final-gate-critic-6/bl-m0.png`, `shots/final-gate/blame-playground-multiple-authors/{light,dark}-390.png`, `shots/final-gate-critic-7/blame-playground-multiple-authors/light-390-0.png`, `shots/final-gate/blame/dark-390.png`, `shots/final-gate/blame/light-390.png`, `shots/final-gate/blame-playground-multiple-authors/dark-390.png`, `shots/final-gate/blame-playground-multiple-authors/light-390.png`
- **Fix:** <768px: stack each blame hunk header (avatar, message, age) above its lines (github.com), or collapse .blame-info to avatar + age (~72px) so code starts on screen.
- **Why this class:** CSS layout.

### FG-029 — Mobile UnderlineNav: selected tab clipped off-screen ('± Fi…') with no scroll cue; selected underline drawn under the overflow '…' button
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 17 (judge reasons 0 in 0 pairs + critic weight 17) · weakest route 6.8
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-split-playground-large-diff (8.5/8.5/6.8; C123), pr-conversation-playground-large-diff-reviews (8.0/8.5/7.0; C099), pr-conversation-closed-unmerged (8.5/8.5/7.5; C045), pr-files-changed-unified (9.0/7.5/8.0; C074), repo-pull-files (8.0/8.0/7.5; C175), org-settings-hooks (8.0/8.0/8.0; C022), pr-commits-tab (8.5/8.5/8.0; C016), releases (8.5/8.5/8.0; C093), tags (9.0/9.0/8.5; C070)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C016 pr-commits-tab [nit] Mobile tabnav clips 'Files Changed'; C045 pr-conversation-closed-unmerged [nit] Mobile PR tabs clip 'Files Changed' to 'Fil'; C074 pr-files-changed-unified [minor] At 390 the selected 'Files Changed' tab is clipped off-screen; C099 pr-conversation-playground-large-diff-reviews [minor] Mobile PR tabs clipped, header actions stacked; C123 pr-files-changed-split-playground-large-diff [minor] Mobile PR tab bar clips active 'Files Changed' tab; C175 repo-pull-files [minor] PR tab strip clips the active 'Files Changed' tab at 390; C022 org-settings-hooks [nit] Overflow '···' carries the active underline on mobile; C070 tags [nit] At 390 the coral active underline sits under the overflow button; C093 releases [nit] Active tab indicator under overflow kebab
- **PNG:** `shots/final-gate-critic-2/prf-l390.png`, `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-0.png`, `shots/final-gate-critic-6/prf-m0.png`, `shots/final-gate-critic-2/tags-l390.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/dark-390.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/light-390.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/light-1440.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/dark-390.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/dark-1440.png`
- **Fix:** <768px: tighten item padding/gap so PR tabs (Conversation / Commits / Files changed) fit 358px; add a right-edge fade mask as scroll affordance; when the selected item is inside the overflow menu, do not paint the selected underline on the '…' trigger (Primer keeps the selected item visible, so style the trigger as neutral).
- **Why this class:** Existing markup; no JS needed.

### FG-030 — Org header / dashboard context bar have no 1px bottom border (repo header has one); schemes treat the bar differently
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 15 (judge reasons 0 in 0 pairs + critic weight 15) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): home (7.5/7.5/7.0; C002), org-settings-labels (7.0/7.0/7.0; C207), org-settings (8.0/7.5/8.0; C202), package-versions (8.0/7.5/8.0; C208), packages-org (8.0/7.5/8.0; C100)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C002 home [minor] Dashboard context bar has no bottom border in light; C100 packages-org [minor] Org header has no bottom border; C202 org-settings [minor] Org header underline nav has no bottom border; C207 org-settings-labels [minor] Org header nav has no bottom border (same as org-settings); C208 package-versions [minor] Org header nav has no bottom border
- **PNG:** `shots/final-gate/home/light-1440.png`, `shots/final-gate-critic-0/home-l-a.png`, `shots/final-gate-critic-7/org-settings/zoom-dark-orgnav.png`, `shots/final-gate/home/dark-1440.png`, `shots/final-gate/home/light-1440.png`, `shots/final-gate/org-settings-labels/dark-1440.png`, `shots/final-gate/org-settings-labels/light-1440.png`, `shots/final-gate/org-settings/dark-1440.png`, `shots/final-gate/org-settings/light-1440.png`, `shots/final-gate/package-versions/dark-1440.png`
- **Fix:** Give the org header UnderlineNav (.overflow-menu under the org header container) and the dashboard context bar the same full-width 1px --borderColor-default bottom rule as the repo header, in both schemes.
- **Why this class:** Border on existing elements.

### FG-031 — 404 is a Primer Blankslate; github.com shows the illustrated Octocat 'This is not the web page you are looking for' page
- **Class:** inherent — github.com's 404 is a trademarked Octocat illustration (§11: no GitHub marks) · **Owner:** pages/people · **Impact:** 15 (judge reasons 12 in 4 pairs + critic weight 3) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; j12; C031)
- **Schemes / viewports:** dark, light / 1440; judge variants page 6, content 6
- **Critic:** C031 not-found [minor] 404 is a Blankslate, github.com's is an illustrated hero
- **Judges say:** “A is a plain Gitea '404 Not Found' with a warning icon and a 'Powered by Gitea' footer” / “B has GitHub's Star Wars Octocat 404 illustration and a search box”
- **PNG:** `shots/final-gate/not-found/light-1440.png`, `docs/reference/not-found/light-1440.png`, `shots/final-gate/not-found/dark-1440.png`, `shots/final-gate/not-found/light-1440.png`, `shots/final-gate-pairs/p021.png`, `shots/final-gate-pairs/p022.png`, `shots/final-gate-pairs/p023.png`
- **Fix:** None (cannot copy GitHub art). Optional: nothing.

### FG-032 — Dark diffs painted twice (tr and td both tinted): additions/deletions/hunk rows visibly over-saturated
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 15 (judge reasons 0 in 0 pairs + critic weight 15) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-compare-form-playground (8.0/7.5/7.5; C209), pr-files-changed-unified (9.0/7.5/8.0; C073), repo-pull-files (8.0/8.0/7.5; C174)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C073 pr-files-changed-unified [major] Dark diff backgrounds stacked twice (tr and td both painted); C209 pr-compare-form-playground [major] Dark diff backgrounds painted twice (tr and td); C174 repo-pull-files [minor] Dark hunk header row too blue
- **PNG:** `shots/final-gate/pr-files-changed-unified/dark-1440.png`, `docs/reference/.../dark-1440.png`, `shots/final-gate-critic-7/pr-compare-form-playground/zoom-dark-diff.png`, `shots/final-gate/repo-pull-files/dark-1440.png`, `docs/reference/repo-pull-files/dark-1440.png`, `shots/final-gate/pr-compare-form-playground/dark-1440.png`, `shots/final-gate/pr-compare-form-playground/light-1440.png`, `shots/final-gate/pr-files-changed-unified/dark-1440.png`, `shots/final-gate/pr-files-changed-unified/light-1440.png`, `shots/final-gate/repo-pull-files/dark-1440.png`
- **Fix:** Paint only the cells (or only the row) in src/code/diff.css (~224-280); re-check hunk row (#152843 → #111d2e) and number cells against github.com dark. Light is correct (opaque tokens).
- **Why this class:** CSS.

### FG-033 — Capture order leaks the admin's diff-style preference: repo-pull-files (?style=split) makes commit-detail render split
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 13 (judge reasons 7 in 4 pairs + critic weight 6) · weakest route 6.0
- **Routes** (light/dark/390 critic score; j = judge reasons): commit-detail (7.5/7.5/6.0; j7; C011)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants content 3, page 4
- **Critic:** C011 commit-detail [major] Rendered as split diff because the capture order leaks the preference
- **Judges say:** “B diff is split view with 'parent fa3e8ed71c commit 99cc347707' pills and '1 changed files with 2 additions and 2 deletions' (bad plural)” / “B '1 changed files with 2 additions and 2 deletions'; split diff with Gitea layout”
- **PNG:** `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate-critic-0/cd-l-m.png`, `shots/final-gate/commit-detail/dark-390.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-390.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate-pairs/p065.png`, `shots/final-gate-pairs/p066.png`, `shots/final-gate-pairs/p067.png`
- **Fix:** tools/shoot: pin ?style=unified on every diff route that is not explicitly split (commit-detail, compare-two-tags, pr-files-changed-unified*, pr-compare-*), or restore the preference right after each ?style=split route; re-capture commit-detail. Baseline preference is unified (CONTEXT).
- **Why this class:** Tooling bug.

### FG-034 — README box header is a single 'README.md' bar with a pencil; github.com has 'README | <license> license' tabs
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 13 (judge reasons 10 in 7 pairs + critic weight 3) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home (8.5/8.5/8.0; j3; C170), repo-home-readme-with-images-and-tables (9.0/9.0/8.5; j7)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 4, content 6
- **Critic:** C170 repo-home [minor] README box header wraps to two lines at 390
- **Judges say:** “B README header reads 'README.md' with a pencil icon instead of README / MIT license tabs” / “B README tab shows 'README.md' with pencil; GitHub has README | MIT license tabs”
- **PNG:** `shots/final-gate-critic-6/rh-m1.png`, `shots/final-gate/repo-home/dark-390.png`, `shots/final-gate/repo-home/dark-1440.png`, `shots/final-gate/repo-home/light-390.png`, `shots/final-gate/repo-home/light-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/dark-390.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/light-390.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-pairs/p013.png`
- **Fix:** github-* branch in the README header (repo/view_file.tmpl, ReadmeInList): UnderlineNav-style tabs 'README' + '<license name> license' (from .DetectedRepoLicenses / LICENSE file link) + edit pencil at the right; also fix the 390 wrap (C170: header 75px, pencil drops to a 2nd line).
- **Why this class:** Tabs need data and links that CSS cannot create.

### FG-035 — Projects list: Open/Closed switch outside the Box, 28px 'New Project', inline red Delete per row, mobile order flips
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 12 (judge reasons 0 in 0 pairs + critic weight 12) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): projects-list (7.5/7.5/7.0; C155 C156 C157 C158), org-projects (8.0/8.0/7.5; C058 C059)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C155 projects-list [minor] Open/Closed state switch sits outside the list Box; C156 projects-list [minor] Page primary button is 28px; C157 projects-list [minor] Row actions always visible, including a red Delete; C158 projects-list [nit] Mobile header order flips; C058 org-projects [nit] 'New Project' is a small (28px) button; C059 org-projects [nit] Mobile toolbar order reversed
- **PNG:** `docs/reference/crit-app-projects-list/light-1440.png`, `shots/final-gate-critic-1/org-projects-mob.png`, `shots/final-gate/projects-list/dark-390.png`, `shots/final-gate/projects-list/dark-1440.png`, `shots/final-gate/projects-list/light-390.png`, `shots/final-gate/projects-list/light-1440.png`, `shots/final-gate/org-projects/dark-390.png`, `shots/final-gate/org-projects/dark-1440.png`, `shots/final-gate/org-projects/light-390.png`, `shots/final-gate/org-projects/light-1440.png`
- **Fix:** Counters in the Box header; 32px primary; row actions as muted text/invisible buttons (danger only on hover); keep desktop order at 390.
- **Why this class:** CSS.

### FG-036 — Commit list titles: 16px/400 (compare) or 14px/500 (commits) vs github.com 14px/600; inline code drawn as a grey chip
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 12 (judge reasons 0 in 0 pairs + critic weight 12) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): compare-two-tags (7.5/7.5/7.5; C017), repo-commits (7.5/7.5/7.5; C191 C192)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C191 repo-commits [major] Commit SHA is sans-serif and titles are too light; C017 compare-two-tags [minor] Commit list typography and SHA treatment differ; C192 repo-commits [minor] Inline code in commit titles drawn as a grey chip
- **PNG:** `docs/reference/repo-commits/light-1440.png`, `shots/final-gate-critic-7/repo-commits/zoom-row-ours.png`, `shots/final-gate-critic-0/ct-l-z.png`, `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`, `shots/final-gate/repo-commits/dark-1440.png`, `shots/final-gate/repo-commits/light-1440.png`
- **Fix:** .commit-summary 14px semibold fgColor-default; author bold fgColor-default; inline code in commit titles plain mono without background.
- **Why this class:** CSS.

### FG-037 — Release 'Downloads' uses the browser's disclosure triangle at 20px bold; mobile release header/meta wraps with orphan '·'; bare red × status glyph
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 11 (judge reasons 0 in 0 pairs + critic weight 11) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): releases-playground-with-assets-prerelease-draft (8.0/8.0/7.0; C146 C147 C148), releases (8.5/8.5/8.0; C092), release-detail (8.8/8.8/8.8; C118)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C118 release-detail [nit] Downloads disclosure triangle oversized; C146 releases-playground-with-assets-prerelease-draft [minor] Downloads summary uses the native disclosure marker at 20px bold; C092 releases [minor] Release meta wraps with orphan separator on mobile; C147 releases-playground-with-assets-prerelease-draft [minor] Mobile release title row wraps awkwardly; C148 releases-playground-with-assets-prerelease-draft [nit] Bare red × commit-status glyph beside titles
- **PNG:** `shots/final-gate/release-detail/light-1440.png`, `shots/final-gate-critic-5/rel-light-390-1.png`, `shots/final-gate/releases-playground-with-assets-prerelease-draft/dark-390.png`, `shots/final-gate/releases-playground-with-assets-prerelease-draft/dark-1440.png`, `shots/final-gate/releases-playground-with-assets-prerelease-draft/light-390.png`, `shots/final-gate/releases-playground-with-assets-prerelease-draft/light-1440.png`, `shots/final-gate/releases/dark-390.png`, `shots/final-gate/releases/dark-1440.png`, `shots/final-gate/releases/light-390.png`, `shots/final-gate/releases/light-1440.png`
- **Fix:** summary: list-style none + chevron Octicon mask, 16px/600; mobile meta wraps without leading separators; status icon as muted IconButton.
- **Why this class:** CSS.

### FG-038 — Run graph: zoom controls top-right (github.com bottom-right) with non-Octicon icons; matrix/node cards use default bg in dark; 390 graph node off-canvas and full job list stacked
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 11 (judge reasons 7 in 4 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): action-run (8.5/8.5/7.5; j7; C075 C076)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 4, content 3
- **Critic:** C075 action-run [minor] 390: graph node off-canvas, full job sidebar stacked, CLS 0.074; C076 action-run [nit] Dark graph nodes and matrix box use the default background, not the overlay
- **Judges say:** “A workflow graph zoom buttons use a different icon set” / “B graph cards lack GitHub matrix styling; zoom icons top right instead of bottom-right fullscreen/-/+”
- **PNG:** `shots/final-gate-critic-2/ar-l390.png`, `docs/reference/action-run/light-390.png`, `shots/final-gate/action-run/dark-390.png`, `shots/final-gate/action-run/dark-1440.png`, `shots/final-gate/action-run/light-390.png`, `shots/final-gate/action-run/light-1440.png`, `shots/final-gate-pairs/p137.png`, `shots/final-gate-pairs/p138.png`, `shots/final-gate-pairs/p139.png`
- **Fix:** Position the graph toolbar bottom-right, mask its icons with Octicons (zoom-in/zoom-out/screen-full), overlay bg for nodes in dark, fit the graph at 390.
- **Why this class:** CSS on the Vue view.

### FG-039 — Labels | Milestones switch is plain text with no selected container
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 11 (judge reasons 9 in 7 pairs + critic weight 2) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): milestones (8.0/8.0/7.5; j5; C182), labels (8.5/8.5/8.0; j4; C151)
- **Schemes / viewports:** dark, light / 1440; judge variants page 5, content 4
- **Critic:** C151 labels [nit] Labels/Milestones switch has no selected container; C182 milestones [nit] Labels/Milestones subnav is plain text
- **Judges say:** “B milestones sit under the repo Issues tab with Labels/Milestones sub-tabs and a search bar, not in GitHub's Issues sidebar layout” / “B labels page has Labels/Milestones sub-tabs and a New Label button”
- **PNG:** `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/labels/dark-1440.png`, `shots/final-gate/labels/light-1440.png`, `shots/final-gate-pairs/p105.png`, `shots/final-gate-pairs/p106.png`, `shots/final-gate-pairs/p107.png`
- **Fix:** Primer SegmentedControl / subnav: bordered pair, selected item bgColor-emphasis-less fill.
- **Why this class:** CSS.

### FG-040 — Wiki page list rows too dense (36px vs 54px), link too heavy, extra Subhead rule, narrow container, date right-aligned / separate line on mobile
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 11 (judge reasons 5 in 3 pairs + critic weight 6) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-page-list (7.5/7.5/7.5; j5; C196 C197)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 3, content 2
- **Critic:** C196 wiki-page-list [minor] Page rows too dense, link too heavy, extra Subhead rule; C197 wiki-page-list [minor] Mobile 'Last updated' right-aligned on a separate line
- **Judges say:** “B shows 'Default Branch: master' text above the list and a divider under the title. GitHub shows no branch text” / “B dates are relative ('Last updated 4 years ago'), right-aligned in a thin row. GitHub reads 'Last updated on May 17, 2023', centered in a taller row”
- **PNG:** `shots/final-gate-critic-7/wiki-page-list/zoom-row.png`, `shots/final-gate/wiki-page-list/dark-390.png`, `docs/reference/wiki-page-list/dark-390.png`, `shots/final-gate/wiki-page-list/dark-390.png`, `shots/final-gate/wiki-page-list/dark-1440.png`, `shots/final-gate/wiki-page-list/light-390.png`, `shots/final-gate/wiki-page-list/light-1440.png`, `shots/final-gate-pairs/p089.png`, `shots/final-gate-pairs/p091.png`, `shots/final-gate-pairs/p092.png`
- **Fix:** Box rows 16px padding (54px), link 400, no rule under 'Pages', full container width, 'Last updated' in the middle column (mobile: left-aligned under the title).
- **Why this class:** CSS.

### FG-041 — No 'Public' Label beside the repo name in the repo header
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 10 (judge reasons 10 in 8 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j2), compare-two-tags (7.5/7.5/7.5; j1), pr-conversation-closed-unmerged (8.5/8.5/7.5; j1), repo-pull (8.5/8.5/7.5; j1), wiki-page-list (7.5/7.5/7.5; j2), file-view-markdown (8.0/8.0/8.0; j1), releases (8.5/8.5/8.0; j1), repo-home-readme-with-images-and-tables (9.0/9.0/8.5; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants content 7, page 3
- **Judges say:** “B has no 'Public' badge beside the repo name” / “B repo header has Unwatch/Packages/Releases 53/Activity/Settings and no Public badge”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-1440.png`, `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`, `shots/final-gate-pairs/p040.png`, `shots/final-gate-pairs/p056.png`
- **Fix:** html:lang(en) .repo-header .repo-title:not(:has(~ .ui.label, .ui.label)) ::after → Primer Label 'Public' (only when Gitea renders no Private/Internal/Mirror/Template label). Scope to :lang(en) so other locales get no English text.
- **Why this class:** Generated content on an existing element, conditional on the absence of Gitea's visibility label.

### FG-042 — Repo header: action order RSS / Unwatch / Star / Fork (github.com: Watch / Fork / Star) and Settings tab pushed to the far right
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 10 (judge reasons 8 in 6 pairs + critic weight 2) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j2), branches (7.5/7.5/7.0; C040), milestones (8.0/8.0/7.5; j2), repo-pull (8.5/8.5/7.5; j1), pr-conversation-open (8.5/8.5/8.0; j2), repo-settings (8.5/8.5/8.0; C009), repo-home-readme-with-images-and-tables (9.0/9.0/8.5; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants content 6, page 2
- **Critic:** C009 repo-settings [nit] Settings tab right-aligned in repo nav; C040 branches [nit] Repo header action order differs
- **Judges say:** “B branch text 'wants to merge 1 commits from X into main' (grammar 'commits', reversed order) vs GitHub 'wants to merge 1 commit into pemistahl:main from ...'” / “A file list order differs: LICENSE and README.md sit at the end with coveralls.json”
- **PNG:** `shots/final-gate/repo-settings/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/branches/dark-1440.png`, `shots/final-gate/branches/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`, `shots/final-gate-pairs/p040.png`
- **Fix:** flex order: RSS icon button last (or first, visually separated), then Watch, Fork, Star; Settings tab flows after the other tabs (no margin-left:auto). Keep every control.
- **Why this class:** Flex order / margins only.

### FG-043 — Repo sidebar has no stars / watching / forks rows (github.com About box lists them)
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 10 (judge reasons 10 in 8 pairs + critic weight 0) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-home (8.5/8.5/8.0; j5), repo-home-readme-with-images-and-tables (9.0/9.0/8.5; j5)
- **Schemes / viewports:** dark, light / 1440; judge variants page 6, content 4
- **Judges say:** “B has no Sponsor button, Contributors, 'Sponsor this project' or stars/watching/forks list” / “B has no Used by, Contributors, or stars/watching/forks list”
- **PNG:** `shots/final-gate/repo-home/dark-1440.png`, `shots/final-gate/repo-home/light-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-pairs/p013.png`, `shots/final-gate-pairs/p014.png`, `shots/final-gate-pairs/p015.png`
- **Fix:** Low priority: github-* branch in the repo home sidebar template adding star/eye/repo-forked rows from .Repository.NumStars/NumWatches/NumForks.
- **Why this class:** Needs data; CSS cannot create it.

### FG-044 — Directory listing has no 'Name | Last commit message | Last commit date' Box header row
- **Class:** theme-fixable-template · **Owner:** code · **Impact:** 9 (judge reasons 9 in 4 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j9)
- **Schemes / viewports:** dark, light / 1440; judge variants content 5, page 4
- **Judges say:** “B file table has no 'Name / Last commit message / Last commit date' header row” / “A directory view has no 'Name / Last commit message / Last commit date' table header”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate-pairs/p057.png`, `shots/final-gate-pairs/p058.png`, `shots/final-gate-pairs/p059.png`
- **Fix:** Additive github-* branch in templates/repo/view_list.tmpl (Modern's override; integrator only, additive) emitting a header row in sub-directories using existing locale keys where they exist (fallback: :lang(en) CSS text). code styles it as a Box header (#f6f8fa / #151b23, 12px/600 muted).
- **Why this class:** Header row needs markup in the grid; CR-3 was rejected because the file is Modern's override — the context doc allows additive integrator edits, so this is a decision for the orchestrator.

### FG-045 — Commit page has no 'Commit <sha7>' H1 above the message Box; Code tab not marked active
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 9 (judge reasons 6 in 4 pairs + critic weight 3) · weakest route 6.0
- **Routes** (light/dark/390 critic score; j = judge reasons): commit-detail (7.5/7.5/6.0; j6; C012)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3, page 3
- **Critic:** C012 commit-detail [minor] Commit header structure differs from GitHub
- **Judges say:** “B commit page has no 'Commit 99cc347' title, no file tree sidebar, no 'Search within code', no Comments section” / “B commit page lacks 'Commit 99cc347' title, file tree, Comments section”
- **PNG:** `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate-pairs/p065.png`, `shots/final-gate-pairs/p066.png`, `shots/final-gate-pairs/p067.png`
- **Fix:** Low priority: github-* branch in templates/repo/commit_page.tmpl adding <h1>Commit <ShortSha></h1>. Code tab active state: CSS on .repository.commit (the tab exists) if the template does not set it.
- **Why this class:** The heading text needs the SHA, which is not in any attribute CSS can read.

### FG-046 — Mobile comment header wraps to 3 rows (~85px): name/time, '(Migrated from github.com)', then reactions/kebab
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 9 (judge reasons 0 in 0 pairs + critic weight 9) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issue (8.5/8.5/7.0; C086), repo-pull (8.5/8.5/7.5; C140)
- **Schemes / viewports:** light / 390
- **Critic:** C086 repo-issue [major] Mobile comment header wraps to 3 rows (85px); C140 repo-pull [minor] Mobile comment header wraps to 3 lines
- **PNG:** `shots/final-gate/repo-issue/light-390.png`, `shots/final-gate-critic-5/pull-light-390-0.png`, `shots/final-gate/repo-issue/light-390.png`, `shots/final-gate/repo-pull/light-390.png`
- **Fix:** <768: keep reaction + kebab on the first row (absolute right), let the meta text wrap under the name; ~40px.
- **Why this class:** CSS.

### FG-047 — Notifications: unread counter outlined (not a CounterLabel), icon-only green 'Mark all as read', no selected state on mobile Unread/Read
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 9 (judge reasons 0 in 0 pairs + critic weight 9) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): notifications (7.5/7.5/7.0; C136 C137 C138)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C136 notifications [minor] Unread counter drawn as an outlined circle, not a Primer CounterLabel; C137 notifications [minor] 'Mark all as read' is an icon-only green primary button; C138 notifications [minor] Mobile Unread/Read switch has no selected indicator
- **PNG:** `shots/final-gate-critic-5/notif-light-top.png`, `shots/final-gate/notifications/light-390.png`, `shots/final-gate/notifications/dark-390.png`, `shots/final-gate/notifications/dark-1440.png`, `shots/final-gate/notifications/light-390.png`, `shots/final-gate/notifications/light-1440.png`
- **Fix:** CounterLabel fill; default (neutral) button; SegmentedControl selected state.
- **Why this class:** CSS.

### FG-048 — Action-input searches are 28px/12px with an attached square search button (Semantic look); Primer TextInput is 32px/14px with a leading icon
- **Class:** theme-fixable-css · **Owner:** controls · **Impact:** 9 (judge reasons 0 in 0 pairs + critic weight 9) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-projects (8.0/8.0/7.5; C057), site-admin-users (8.5/8.5/8.0; C006), admin-orgs (8.5/8.5/8.3; C129)
- **Schemes / viewports:** light / 1440
- **Critic:** C006 site-admin-users [minor] Search input is 28px/12px with a Semantic-style attached button; C057 org-projects [minor] Search input is 28px/12px with a trailing attached button; C129 admin-orgs [minor] Search input 28px with small text
- **PNG:** `shots/final-gate/admin-orgs/light-1440.png`, `shots/final-gate/org-projects/light-1440.png`, `shots/final-gate/site-admin-users/light-1440.png`, `shots/final-gate/admin-orgs/light-1440.png`
- **Fix:** .ui.action.input (search forms) → medium 32px, 14px, leading search icon, button detached or invisible.
- **Why this class:** CSS.

### FG-049 — Actions list has no 'Actions' sidebar heading and no 'All workflows' title + subtitle
- **Class:** theme-fixable-template · **Owner:** pages/actions-packages-projects · **Impact:** 8 (judge reasons 8 in 4 pairs + critic weight 0) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): actions-list (7.5/7.5/8.0; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants page 4, content 4
- **Judges say:** “B actions sidebar has only 'All Workflows / CI', with no Management/Caches” / “B actions sidebar only has 'All Workflows / CI'”
- **PNG:** `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`, `shots/final-gate-pairs/p133.png`, `shots/final-gate-pairs/p134.png`, `shots/final-gate-pairs/p135.png`
- **Fix:** Low priority: github-* branch in templates/repo/actions/list.tmpl adding the two headings (actions.actions / existing keys). The 'Filter workflow runs' input has no Gitea backend: out of scope.
- **Why this class:** Needs text elements.

### FG-050 — Settings / admin NavList items have no leading 16px Octicons (github.com settings sidebars always have them)
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 8 (judge reasons 0 in 0 pairs + critic weight 8) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings (8.0/7.5/8.0; C204), user-settings (8.0/8.0/8.0; C063), site-admin-config (8.5/8.5/8.5; C029), user-settings-keys (8.8/8.8/8.6; C111)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C029 site-admin-config [minor] Settings/admin NavList items have no leading Octicons; C063 user-settings [minor] Settings NavList has no leading Octicons and no group headings; C111 user-settings-keys [nit] Settings sidebar items have no leading octicons; C204 org-settings [nit] Settings NavList lacks leading icons and org context block
- **PNG:** `shots/final-gate-critic-1/sac-light-a.png`, `shots/final-gate/user-settings/light-1440.png`, `shots/final-gate/user-settings-keys/light-1440.png`, `shots/final-gate/org-settings/dark-1440.png`, `shots/final-gate/org-settings/light-1440.png`, `shots/final-gate/user-settings/dark-1440.png`, `shots/final-gate/user-settings/light-1440.png`, `shots/final-gate/site-admin-config/dark-1440.png`, `shots/final-gate/site-admin-config/light-1440.png`, `shots/final-gate/user-settings-keys/dark-1440.png`
- **Fix:** Add ::before masks (var(--gh-octicon-…), request the masks from icons/integrator) keyed on the item href (user settings: person, gear, paintbrush, shield-lock, key, apps, organization, …; repo settings: gear, people, shield, webhook, key, …; admin: server, people, organization, repo, …). Group headings (Access / Code…) are template-only: skip.
- **Why this class:** Pseudo-elements on existing links.

### FG-051 — Labels rows repeat '0 open issues/pull requests' text and Edit/Delete links on every row (github.com: compact icon counts, actions in a kebab)
- **Class:** theme-fixable-template · **Owner:** pages/issues-prs · **Impact:** 8 (judge reasons 8 in 4 pairs + critic weight 0) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): labels (8.5/8.5/8.0; j8)
- **Schemes / viewports:** dark, light / 1440; judge variants page 4, content 4
- **Judges say:** “B rows have Edit/Delete actions and '0 open issues/pull requests' text” / “Every B row repeats '0 open issues/pull requests' plus Edit/Delete links. GitHub shows only a compact PR or issue icon with a count, and only when it is non-zero”
- **PNG:** `shots/final-gate/labels/dark-1440.png`, `shots/final-gate/labels/light-1440.png`, `shots/final-gate-pairs/p105.png`, `shots/final-gate-pairs/p106.png`, `shots/final-gate-pairs/p107.png`
- **Fix:** Low priority: github-* branch in templates/repo/issue/labels/label_list.tmpl: counts as issue-opened/git-pull-request icon + number, Edit/Delete in a kebab ActionMenu.
- **Why this class:** Splitting the count text and building a menu needs markup.

### FG-052 — Profile: follower counts not bold, Follow button has a person icon, Overview tab uses info icon (github.com: book), topic tags oversized
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 8 (judge reasons 5 in 4 pairs + critic weight 3) · weakest route 8.5
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile (8.5/8.5/8.5; j3; C168), user-profile-repositories-tab (8.5/8.5/8.5; j1; C020), user-profile-stars-tab (8.5/8.5/8.5; j1; C201)
- **Schemes / viewports:** dark, light / 1440; judge variants page 2, content 3
- **Critic:** C020 user-profile-repositories-tab [nit] Follower counts not bold; Follow button has an icon; no Public label; C168 user-profile [nit] Follower counts not bold; README box lacks 'user / README.md' caption; no 'Organizations' heading; C201 user-profile-stars-tab [nit] Topic tags slightly oversized
- **Judges say:** “B Follow button has person icon; GitHub has plain 'Follow'” / “A Follow button has person icon; no Achievements”
- **PNG:** `shots/final-gate/user-profile-repositories-tab/light-1440.png`, `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate/user-profile/dark-1440.png`, `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate/user-profile-repositories-tab/dark-1440.png`, `shots/final-gate/user-profile-repositories-tab/light-1440.png`, `shots/final-gate/user-profile-stars-tab/dark-1440.png`, `shots/final-gate/user-profile-stars-tab/light-1440.png`, `shots/final-gate-pairs/p010.png`, `shots/final-gate-pairs/p012.png`
- **Fix:** Counts 600 fgColor-default; hide the svg inside the Follow button (icon only, button stays); mask the Overview tab icon with octicon-book; topic-tag 22px / 10px padding.
- **Why this class:** CSS.

### FG-053 — Profile README Box has no '<user> / README.md' mono caption header
- **Class:** theme-fixable-template · **Owner:** pages/people · **Impact:** 8 (judge reasons 7 in 4 pairs + critic weight 1) · weakest route 8.5
- **Routes** (light/dark/390 critic score; j = judge reasons): user-profile (8.5/8.5/8.5; j7; C168)
- **Schemes / viewports:** dark, light / 1440; judge variants content 4, page 3
- **Critic:** C168 user-profile [nit] Follower counts not bold; README box lacks 'user / README.md' caption; no 'Organizations' heading
- **Judges say:** “A README box has no 'user / README.md' label header” / “B README box lacks 'user / README.md' label”
- **PNG:** `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate/user-profile/dark-1440.png`, `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate-pairs/p009.png`, `shots/final-gate-pairs/p010.png`, `shots/final-gate-pairs/p011.png`
- **Fix:** github-* branch in templates/user/profile.tmpl (README block): Box header with '<name> / README.md' in 12px mono.
- **Why this class:** Needs the username text in a new element.

### FG-054 — File-tree pane is inset with no full-height right border (github.com: flush-left 320px pane with border-right); file box not full-bleed at 390
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; C178), directory-tree (8.0/8.0/5.5; C145), repo-code-file (8.5/8.5/8.0; C065)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C065 repo-code-file [nit] File tree column is inset; at 390 the file box is not full-bleed; C145 directory-tree [minor] File-tree pane has no full-height divider; C178 blame [minor] No vertical divider between file tree and content
- **PNG:** `docs/reference/repo-code-file/light-1440.png`, `shots/final-gate-critic-2/rcf-l390.png`, `shots/final-gate-critic-6/bl-light-0.png`, `shots/final-gate/blame/dark-390.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-390.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-390.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-390.png`
- **Fix:** Make the tree pane flush with the page edge with a full-height 1px --borderColor-default right border; content starts after it. At 390 make the file box full-bleed.
- **Why this class:** CSS.

### FG-055 — Project board: toolbar button group truncated at 390 ('New Column' off-screen), 4th column cut at the container edge at 1440
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 6.5
- **Routes** (light/dark/390 critic score; j = judge reasons): project-board (8.0/8.0/6.5; C184 C185)
- **Schemes / viewports:** light / 390, 1440
- **Critic:** C184 project-board [major] Toolbar button group truncated at 390; C185 project-board [nit] Fourth column cut at the container edge at 1440
- **PNG:** `shots/final-gate/project-board/light-390.png`, `shots/final-gate-critic-6/pb-m.png`, `shots/final-gate/project-board/light-1440.png`, `shots/final-gate/project-board/light-390.png`, `shots/final-gate/project-board/light-1440.png`
- **Fix:** Wrap the toolbar (or overflow menu) at <768; board scroll container with padding-right.
- **Why this class:** CSS.

### FG-056 — Lazy-loaded images (README media, review avatars) never load in full-page captures
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 6.8
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-split-playground-large-diff (8.5/8.5/6.8; C125), repo-home-markdown-showcase-playground (9.0/9.0/8.5; C034), repo-home-readme-with-images-and-tables (9.0/9.0/8.5; C041)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C034 repo-home-markdown-showcase-playground [minor] Lazy README images never captured (tooling); C041 repo-home-readme-with-images-and-tables [minor] Lazy README images missing from capture (tooling); C125 pr-files-changed-split-playground-large-diff [nit] Blank avatar in last review thread
- **PNG:** `shots/final-gate-critic-1/pg-l-4.png`, `shots/final-gate-critic-1/rp-cmp3.png`, `shots/final-gate-critic-4/prsplit-live-thread2.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/light-1440.png`, `shots/final-gate/repo-home-markdown-showcase-playground/dark-1440.png`, `shots/final-gate/repo-home-markdown-showcase-playground/light-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate/repo-home-readme-with-images-and-tables/light-1440.png`
- **Fix:** tools/shoot: scroll the page (or set loading=eager via page script) before the full-page screenshot and wait for img.complete.
- **Why this class:** Tooling bug.

### FG-057 — Admin repos table clipped at 1440 (scrollWidth 1052 > 934; Created cut, operations hidden)
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-repos (7.0/7.0/7.5; C102 C103)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C102 admin-repos [major] Table clipped at 1440; C103 admin-repos [nit] Minor CLS on table
- **PNG:** `shots/final-gate/admin-repos/dark-390.png`, `shots/final-gate/admin-repos/dark-1440.png`, `shots/final-gate/admin-repos/light-390.png`, `shots/final-gate/admin-repos/light-1440.png`
- **Fix:** Tighter cell padding / wrapping so the table fits the column at desktop widths.
- **Why this class:** CSS.

### FG-058 — Org labels empty state not a Blankslate; branch refs as green-outlined labels (github.com: accent-muted commit-ref); commits Box 2px wider than siblings
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings-labels (7.0/7.0/7.0; C205), pr-compare-form-playground (8.0/7.5/7.5; C210), pr-compare-new-playground (8.5/8.5/7.5; C166)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C205 org-settings-labels [minor] Empty state is not a Blankslate; C210 pr-compare-form-playground [minor] Branch refs rendered as green-outlined labels; C166 pr-compare-new-playground [nit] Commits Box is ~2px wider than sibling boxes
- **PNG:** `shots/final-gate/org-settings-labels/dark-390.png`, `shots/final-gate/org-settings-labels/dark-1440.png`, `shots/final-gate/org-settings-labels/light-390.png`, `shots/final-gate/org-settings-labels/light-1440.png`, `shots/final-gate/pr-compare-form-playground/dark-390.png`, `shots/final-gate/pr-compare-form-playground/dark-1440.png`, `shots/final-gate/pr-compare-form-playground/light-390.png`, `shots/final-gate/pr-compare-form-playground/light-1440.png`, `shots/final-gate/pr-compare-new-playground/dark-390.png`, `shots/final-gate/pr-compare-new-playground/dark-1440.png`
- **Fix:** Blankslate pattern; .ui.sha.label → commit-ref style; box widths.
- **Why this class:** CSS.

### FG-059 — Mobile pagination shows only the current page and chevrons (no Previous/Next labels, page numbers hidden)
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): home (7.5/7.5/7.0; C004), issues-list-closed (9.0/9.0/8.0; C095), releases (8.5/8.5/8.0; C091)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C004 home [nit] Mobile pagination shows chevrons only; feed boxes short of the right edge; C091 releases [minor] Mobile pagination shows only current page; C095 issues-list-closed [minor] Mobile pagination hides page numbers
- **PNG:** `shots/final-gate/home/dark-390.png`, `shots/final-gate/home/dark-1440.png`, `shots/final-gate/home/light-390.png`, `shots/final-gate/home/light-1440.png`, `shots/final-gate/issues-list-closed/dark-390.png`, `shots/final-gate/issues-list-closed/dark-1440.png`, `shots/final-gate/issues-list-closed/light-390.png`, `shots/final-gate/issues-list-closed/light-1440.png`, `shots/final-gate/releases/dark-390.png`, `shots/final-gate/releases/dark-1440.png`
- **Fix:** At <768px show 'Previous'/'Next' labels (Gitea hides them) or at least the page numbers around the current page, like github.com mobile.
- **Why this class:** Visibility of existing labels/items.

### FG-060 — 'Add dependency…' select (32px, native double arrow) next to a 28px '+' button: bottoms misaligned by 4px
- **Class:** theme-fixable-css · **Owner:** controls · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issue (8.5/8.5/7.0; C087), repo-pull (8.5/8.5/7.5; C139), issue-detail-playground-reactions-alerts-tables (8.6/8.6/8.4; C120)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C087 repo-issue [minor] Dependency select taller than attached + button; C139 repo-pull [minor] Dependency select and '+' button heights mismatch; C120 issue-detail-playground-reactions-alerts-tables [nit] Native double-arrow on 'Add dependency…' select
- **PNG:** `shots/final-gate-critic-5/pull-light-dep.png`, `shots/final-gate-critic-4/issue-light-1.png`, `shots/final-gate/repo-issue/dark-390.png`, `shots/final-gate/repo-issue/dark-1440.png`, `shots/final-gate/repo-issue/light-390.png`, `shots/final-gate/repo-issue/light-1440.png`, `shots/final-gate/repo-pull/dark-390.png`, `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-390.png`, `shots/final-gate/repo-pull/light-1440.png`
- **Fix:** Same control size in the input group; Primer single chevron (appearance:none + mask).
- **Why this class:** CSS.

### FG-061 — Packages: names not Link blue, meta links bold+underlined, install <pre> overflows at 390, keywords plain text, 'View all' misaligned
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): packages-org (8.0/7.5/8.0; C101), packages-generic (8.0/8.0/8.0; C023), packages-repo (8.0/8.0/8.0; C187), package-detail-npm (8.5/8.5/8.1; C126 C127)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C101 packages-org [nit] Package list styling; C187 packages-repo [nit] Meta links underlined and bold; package name not a link colour; C126 package-detail-npm [minor] Install snippet <pre> overflows and is clipped at 390; C127 package-detail-npm [nit] Keywords rendered as plain text; C023 packages-generic [nit] 'View all' not baseline-aligned with 'Versions (2)'
- **PNG:** `shots/final-gate/packages-repo/light-1440.png`, `shots/final-gate-critic-4/package-detail-npm-390-0.png`, `shots/final-gate/package-detail-npm/light-1440.png`, `shots/final-gate/packages-generic/light-1440.png`, `shots/final-gate/packages-org/dark-390.png`, `shots/final-gate/packages-org/dark-1440.png`, `shots/final-gate/packages-org/light-390.png`, `shots/final-gate/packages-org/light-1440.png`, `shots/final-gate/packages-generic/dark-390.png`, `shots/final-gate/packages-generic/dark-1440.png`
- **Fix:** Link colours per github.com; pre overflow-x:auto with padding for the copy button; keywords as topic Labels; baseline align.
- **Why this class:** CSS.

### FG-062 — Settings buttons: three primary greens on one page, mixed 28/32px sizes, 'Leave' at 32px where github.com uses btn-sm
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-settings-branches (8.0/8.0/7.5; C159), user-settings-orgs (8.5/8.5/8.0; C055), user-settings-security (8.0/8.0/8.0; C078)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C078 user-settings-security [minor] Three primary green buttons on one page; C159 repo-settings-branches [minor] Mixed button sizes and primary overuse; C055 user-settings-orgs [nit] Leave buttons are medium (32px)
- **PNG:** `shots/final-gate/user-settings-security/light-1440.png`, `shots/final-gate/repo-settings-branches/dark-1440.png`, `shots/final-gate/repo-settings-branches/light-1440.png`, `shots/final-gate/user-settings-orgs/dark-1440.png`, `shots/final-gate/user-settings-orgs/light-1440.png`, `shots/final-gate/user-settings-security/dark-1440.png`, `shots/final-gate/user-settings-security/light-1440.png`
- **Fix:** One primary per view (secondary adds as default), consistent 32px, org rows btn-sm.
- **Why this class:** CSS.

### FG-063 — Auth pages show the full global navbar (Explore / Help / Register / Sign In); github.com auth pages show only the centred mark
- **Class:** theme-fixable-template · **Owner:** pages/auth · **Impact:** 7 (judge reasons 3 in 2 pairs + critic weight 4) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): forgot-password (8.0/8.0/8.0; C060), reset-password-badcode (9.0/9.0/8.5; C109), login (8.8/8.8/8.7; j3)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants page 3
- **Critic:** C060 forgot-password [minor] Global navbar shown on the auth page; C109 reset-password-badcode [nit] Auth heading and mobile header
- **Judges say:** “B has a full top nav (Explore/Help, Sign In/Register); GitHub login has no nav” / “A has a Gitea header with Explore/Help/Sign In/Register and the teacup logo above a 'Sign In' heading; GitHub shows the Octocat and 'Sign in to GitHub' with no nav bar”
- **PNG:** `shots/final-gate/forgot-password/light-1440.png`, `docs/reference/login/light-1440.png`, `shots/final-gate/forgot-password/dark-390.png`, `shots/final-gate/forgot-password/dark-1440.png`, `shots/final-gate/forgot-password/light-390.png`, `shots/final-gate/forgot-password/light-1440.png`, `shots/final-gate/reset-password-badcode/dark-390.png`, `shots/final-gate/reset-password-badcode/dark-1440.png`, `shots/final-gate/reset-password-badcode/light-390.png`, `shots/final-gate/reset-password-badcode/light-1440.png`
- **Fix:** Part of the head_navbar override: on PageIsSignIn / PageIsSignUp / forgot / reset pages render a slim header (logo only, centred above the form) and move Explore / Help / Register / Sign In links into the auth footer row (links kept, not removed). pages/auth styles it.
- **Why this class:** Moving links requires markup; hiding them would remove anonymous navigation.

### FG-064 — Empty states are bare text (webhooks, deploy keys, collaborators), not bordered Blankslates
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings-hooks (8.0/8.0/8.0; C021), repo-settings-deploykeys (8.0/8.0/8.0; C079), repo-settings-collab (8.6/8.6/8.5; C128)
- **Schemes / viewports:** light / 1440
- **Critic:** C021 org-settings-hooks [minor] No Blankslate or Box for empty webhooks; subhead says 'Settings'; C079 repo-settings-deploykeys [minor] Empty state is bare text, not a bordered Blankslate; C128 repo-settings-collab [nit] No empty state for collaborators
- **PNG:** `shots/final-gate/org-settings-hooks/light-1440.png`, `shots/final-gate/repo-settings-deploykeys/light-1440.png`, `shots/final-gate/repo-settings-collab/light-1440.png`, `shots/final-gate/org-settings-hooks/light-1440.png`, `shots/final-gate/repo-settings-deploykeys/light-1440.png`, `shots/final-gate/repo-settings-collab/light-1440.png`
- **Fix:** Box + Blankslate styling around Gitea's empty-state text (collaborators: style the empty list container). Subhead 'Settings' vs 'Webhooks' is template text: skip.
- **Why this class:** CSS.

### FG-065 — Settings/admin at 390: every 'Run' button wraps under its text, banner editor toolbar wraps with dangling separators, 'New Organization' on its own line
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 7 (judge reasons 0 in 0 pairs + critic weight 7) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-dashboard-config-settings (8.5/8.5/8.0; C105), site-admin (8.5/8.5/8.0; C188), user-settings-orgs (8.5/8.5/8.0; C056)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C188 site-admin [minor] Every 'Run' button wraps under its text at 390; C105 admin-dashboard-config-settings [minor] Banner editor toolbar wraps with dangling separators on mobile; C056 user-settings-orgs [nit] Mobile 'New Organization' wraps onto its own line
- **PNG:** `shots/final-gate/site-admin/light-390.png`, `shots/final-gate-critic-7/site-admin/light-390-0.png`, `shots/final-gate-critic-1/user-settings-orgs-mob.png`, `shots/final-gate/admin-dashboard-config-settings/dark-390.png`, `shots/final-gate/admin-dashboard-config-settings/dark-1440.png`, `shots/final-gate/admin-dashboard-config-settings/light-390.png`, `shots/final-gate/admin-dashboard-config-settings/light-1440.png`, `shots/final-gate/site-admin/dark-390.png`, `shots/final-gate/site-admin/dark-1440.png`, `shots/final-gate/site-admin/light-390.png`
- **Fix:** Action right-aligned on the first line, text wraps; toolbar separators hidden when wrapped.
- **Why this class:** CSS.

### FG-066 — Inline review thread header: author not emphasised (muted regular), caret/avatar outside the thread box
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-unified-playground-large-diff (8.5/8.5/5.0; C153), pr-files-changed-split-playground-large-diff (8.5/8.5/6.8; C124)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C124 pr-files-changed-split-playground-large-diff [minor] Review thread header author not emphasised; avatar+caret outside box; C153 pr-files-changed-unified-playground-large-diff [minor] Inline review comment header is muted, with a speech caret
- **PNG:** `shots/final-gate-critic-4/prsplit-thread.png`, `shots/final-gate-critic-5/prf-inline-comment.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-1440.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/light-1440.png`
- **Fix:** Author 600 fgColor-default like conversation comments; no caret on diff-embedded threads.
- **Why this class:** CSS.

### FG-067 — Dashboard CLS 0.365 at 390 (Vue repo list grows 4 times while loading)
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): home (7.5/7.5/7.0; C001)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C001 home [major] Mobile CLS 0.365 on dashboard
- **PNG:** `shots/final-gate/home/dark-390.png`, `shots/final-gate/home/light-390.png`
- **Fix:** Reserve the repo-list height (min-height placeholder) in .flex-container-main.
- **Why this class:** CSS (§10 budget: CLS must not exceed gitea-auto).

### FG-068 — Mobile (390) signed-in header shows only hamburger, logo and bell; avatar and create (+) are missing
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): not-found (7.0/7.0/7.0; C032), user-profile (8.5/8.5/8.5; C169)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C032 not-found [minor] Mobile signed-in header shows only hamburger, logo and bell; C169 user-profile [minor] Mobile global header shows only hamburger, logo and bell
- **PNG:** `shots/final-gate-critic-1/not-found-mob.png`, `shots/final-gate-critic-6/up-m.png`, `shots/final-gate/not-found/dark-390.png`, `shots/final-gate/not-found/light-390.png`, `shots/final-gate/user-profile/dark-390.png`, `shots/final-gate/user-profile/light-390.png`
- **Fix:** At <768px keep the '+' and avatar dropdown triggers visible in the collapsed bar (github.com mobile AppHeader keeps the avatar at the right). If the head_navbar override (header issue) lands first, do it there.
- **Why this class:** Pure layout of existing markup.

### FG-069 — New-issue Preview tab collapses to 0 height; org labels page mixes 28px and 32px buttons
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings-labels (7.0/7.0/7.0; C206), issue-new-playground (8.4/8.4/8.3; C133)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C133 issue-new-playground [minor] Preview tab collapses to 0 height; upload bar still shown; C206 org-settings-labels [minor] Mixed button sizes on one page
- **PNG:** `shots/final-gate-critic-4/issuenew-preview.png`, `shots/final-gate/org-settings-labels/dark-1440.png`, `shots/final-gate/org-settings-labels/light-1440.png`, `shots/final-gate/issue-new-playground/dark-1440.png`, `shots/final-gate/issue-new-playground/light-1440.png`
- **Fix:** min-height 'Nothing to preview' area, hide the attachment bar in preview; 'New Label' medium 32px.
- **Why this class:** CSS.

### FG-070 — Mobile PR conversation: review diff boxes break the 16px gutter (left=4px)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-playground-large-diff-reviews (8.0/8.5/7.0; C097)
- **Schemes / viewports:** light / 390
- **Critic:** C097 pr-conversation-playground-large-diff-reviews [major] Review conversation box breaks the mobile gutter
- **PNG:** `shots/final-gate/pr-conversation-playground-large-diff-reviews/light-390.png`
- **Fix:** .conversation-holder margin to the 16px gutter at <768.
- **Why this class:** CSS.

### FG-071 — Review 'Reply' button icon invisible in light (white svg on #f6f8fa)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-playground-large-diff-reviews (8.0/8.5/7.0; C096)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C096 pr-conversation-playground-large-diff-reviews [major] Reply button icon invisible in light
- **PNG:** `shots/final-gate/pr-conversation-playground-large-diff-reviews/dark-1440.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/light-1440.png`
- **Fix:** .code-comments-list .comment-form-reply svg → fgColor-muted.
- **Why this class:** CSS.

### FG-072 — Actions controls: row kebab hover turns accent-blue, Re-run split button 28px, gear menu uses checkbox squares, mobile job list ignores the 16px gutter
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): action-job-ok (8.5/8.5/7.5; C163 C165), actions-list (7.5/7.5/8.0; C047), action-job (8.6/8.6/8.3; C132)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C047 actions-list [minor] Row kebab hover turns accent-blue with no background; C163 action-job-ok [nit] Re-run split button is 28px; C132 action-job [nit] Gear menu uses checkbox squares; C165 action-job-ok [nit] Mobile job list ignores the 16px gutter
- **PNG:** `shots/final-gate-critic-1/live/actions-list/states/light-1440-row-kebab-hover-clip.png`, `shots/final-gate-critic-4/actionjob-states.png`, `shots/final-gate/action-job-ok/dark-390.png`, `shots/final-gate/action-job-ok/dark-1440.png`, `shots/final-gate/action-job-ok/light-390.png`, `shots/final-gate/action-job-ok/light-1440.png`, `shots/final-gate/actions-list/dark-390.png`, `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-390.png`, `shots/final-gate/actions-list/light-1440.png`
- **Fix:** Invisible IconButton hover; 32px re-run; checkmarks only on selected; 16px gutter.
- **Why this class:** CSS.

### FG-073 — Milestone row: '0%' left of a fixed-width bar; github.com: full-width bar with '0% complete · 2 open · 0 closed' below
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 3 in 2 pairs + critic weight 3) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): milestones (8.0/8.0/7.5; j3; C181)
- **Schemes / viewports:** dark, light / 390, 1440; judge variants content 3
- **Critic:** C181 milestones [minor] Progress bar has fixed width and '0%' leads it
- **Judges say:** “In B the percentage sits to the left of the progress bar. It has a separate search box, a 'New Milestone' button and '1 Open / 6 Closed' with icons”
- **PNG:** `shots/final-gate-critic-6/ms-m.png`, `shots/final-gate/milestones/dark-390.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-390.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate-pairs/p110.png`, `shots/final-gate-pairs/p112.png`
- **Fix:** Bar full row width; percentage text moved below the bar (order/flex-wrap).
- **Why this class:** CSS.

### FG-074 — Mobile: bulk-select checkboxes on every issue row; head-branch pill wraps over 3 lines
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-closed-unmerged (8.5/8.5/7.5; C044), issues-list-closed (9.0/9.0/8.0; C094)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C094 issues-list-closed [minor] Per-row checkboxes on mobile; C044 pr-conversation-closed-unmerged [minor] Mobile head-branch pill wraps across 3 lines
- **PNG:** `shots/final-gate-critic-1/pr-mob-l.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-390.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-390.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-1440.png`, `shots/final-gate/issues-list-closed/dark-390.png`, `shots/final-gate/issues-list-closed/dark-1440.png`, `shots/final-gate/issues-list-closed/light-390.png`, `shots/final-gate/issues-list-closed/light-1440.png`
- **Fix:** <768: hide the bulk-select column (github.com does; bulk actions stay on desktop) — confirm with owner that this is not 'hiding functionality' (it is a narrow-viewport layout choice); branch pill nowrap + ellipsis + max-width.
- **Why this class:** CSS.

### FG-075 — Split diff: addition-side line-number cells are neutral grey instead of green (#aceebb / #1c4428)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pull-files (8.0/8.0/7.5; C173)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C173 repo-pull-files [major] Split diff: addition-side line-number cell is neutral grey instead of green
- **PNG:** `shots/final-gate-critic-6/prf-num.png`, `shots/final-gate/repo-pull-files/{light,dark}-1440.png`, `shots/final-gate/repo-pull-files/dark-390.png`, `shots/final-gate/repo-pull-files/dark-1440.png`, `shots/final-gate/repo-pull-files/light-390.png`, `shots/final-gate/repo-pull-files/light-1440.png`
- **Fix:** Style the right-hand .lines-num of added lines with --diffBlob-additionNum-bgColor.
- **Why this class:** CSS.

### FG-076 — Markdown-source syntax rules leak into rendered .md preview code blocks (.na underlined navy, .nt uncoloured)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 6 (judge reasons 0 in 0 pairs + critic weight 6) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): file-view-markdown (8.0/8.0/8.0; C067)
- **Schemes / viewports:** light / 1440
- **Critic:** C067 file-view-markdown [major] Markdown-source syntax rules leak into rendered .md preview code blocks
- **PNG:** `shots/final-gate-critic-2/fvm-light-script.png`, `shots/final-gate/file-view-markdown/light-1440.png`
- **Fix:** Exclude .markup descendants from the .md-file selectors in src/code/syntax.css:95 and src/code/editor.css:107.
- **Why this class:** CSS.

### FG-077 — Repo rows on org home / profile / explore have no 'Public' Label
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 6 (judge reasons 5 in 5 pairs + critic weight 1) · weakest route 8.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-home (8.5/8.5/8.5; j1; C010), user-profile-repositories-tab (8.5/8.5/8.5; j4)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3, page 2
- **Critic:** C010 org-home [nit] No Public label or sparkline on repo rows
- **Judges say:** “A has no 'Public' badges and no sparkline activity graphs” / “B repo list lacks Public badge, sparkline, license, language colours; 'Search repos...' with Filter/Sort”
- **PNG:** `shots/final-gate/org-home/dark-1440.png`, `shots/final-gate/org-home/light-1440.png`, `shots/final-gate/user-profile-repositories-tab/dark-1440.png`, `shots/final-gate/user-profile-repositories-tab/light-1440.png`, `shots/final-gate-pairs/p052.png`, `shots/final-gate-pairs/p145.png`, `shots/final-gate-pairs/p146.png`
- **Fix:** Same technique as public-badge (html:lang(en), only when Gitea renders no visibility label on the row).
- **Why this class:** Generated content.

### FG-078 — Mobile repo pages: full 17-entry file list + counter row, directory toolbar wraps to 3 rows, copy-path button orphaned
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 5 (judge reasons 0 in 0 pairs + critic weight 5) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; C144), file-view-image-playground (8.7/8.7/8.3; C116), repo-home-readme-with-images-and-tables (9.0/9.0/8.5; C043)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C043 repo-home-readme-with-images-and-tables [nit] Mobile shows the full file list and a counter row; C144 directory-tree [minor] Mobile toolbar wraps into three rows; C116 file-view-image-playground [nit] Copy-path button orphaned on its own line at 390
- **PNG:** `shots/final-gate-critic-1/rp-mob.png`, `docs/reference/directory-tree/light-390.png`, `shots/final-gate-critic-4/file-view-image-playground-390-0.png`, `shots/final-gate/directory-tree/dark-390.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-390.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/file-view-image-playground/dark-390.png`, `shots/final-gate/file-view-image-playground/dark-1440.png`, `shots/final-gate/file-view-image-playground/light-390.png`
- **Fix:** <768px: single toolbar row (branch, breadcrumb, kebab); copy button stays on the breadcrumb line. (File-list truncation to ~10 rows + 'View all files' would need a template: skip.)
- **Why this class:** CSS.

### FG-079 — Settings details: config dl rows without Box-row separators, email list not in a Box, token/OAuth 'Generate' as <summary> triangles, ToggleSwitch mid-row, org description textarea full width
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 5 (judge reasons 0 in 0 pairs + critic weight 5) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-settings (8.0/7.5/8.0; C203), admin-dashboard-config-settings (8.5/8.5/8.0; C106), site-admin-config (8.5/8.5/8.5; C030), user-settings-account (8.5/8.5/8.5; C054), user-settings-applications (8.5/8.5/8.5; C104)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C030 site-admin-config [nit] Config dl rows are 26px with no Box-row separators; C054 user-settings-account [nit] Email list not in a Box; C104 user-settings-applications [nit] Disclosure summaries instead of buttons; C106 admin-dashboard-config-settings [nit] ToggleSwitch placed mid-row; C203 org-settings [nit] Description textarea full width while inputs are 440px
- **PNG:** `shots/final-gate-critic-1/sac-light-b.png`, `shots/final-gate/org-settings/dark-1440.png`, `shots/final-gate/org-settings/light-1440.png`, `shots/final-gate/admin-dashboard-config-settings/dark-1440.png`, `shots/final-gate/admin-dashboard-config-settings/light-1440.png`, `shots/final-gate/site-admin-config/dark-1440.png`, `shots/final-gate/site-admin-config/light-1440.png`, `shots/final-gate/user-settings-account/dark-1440.png`, `shots/final-gate/user-settings-account/light-1440.png`
- **Fix:** Box rows; summary styled as a default button (no marker); toggles at row end; textarea max-width 440px.
- **Why this class:** CSS.

### FG-080 — Explore users/orgs listed as separate bordered cards with 16px gaps; sidebar rule stops mid-page
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 5 (judge reasons 0 in 0 pairs + critic weight 5) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): explore-orgs (8.0/8.0/8.0; C082 C083), explore-users (8.0/8.0/8.0; C062)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C062 explore-users [minor] Users listed as separate cards with 16px gaps, not a Primer Box with rows; C082 explore-orgs [nit] Orgs rendered as separate bordered cards; C083 explore-orgs [nit] Sidebar vertical rule ends mid-page
- **PNG:** `shots/final-gate/explore-users/light-1440.png`, `shots/final-gate/explore-orgs/light-1440.png`, `shots/final-gate/explore-orgs/dark-390.png`, `shots/final-gate/explore-orgs/dark-1440.png`, `shots/final-gate/explore-orgs/light-390.png`, `shots/final-gate/explore-orgs/light-1440.png`, `shots/final-gate/explore-users/dark-390.png`, `shots/final-gate/explore-users/dark-1440.png`, `shots/final-gate/explore-users/light-390.png`, `shots/final-gate/explore-users/light-1440.png`
- **Fix:** One Box with divided rows; sidebar border full height.
- **Why this class:** CSS.

### FG-081 — Blame metadata ~5px above the code baseline; irregular hunk row heights (20/25/26/31px)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): blame (8.0/8.0/5.0; C177), blame-playground-multiple-authors (8.0/8.0/5.0; C195)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C177 blame [minor] Blame metadata sits ~5px above the code baseline; C195 blame-playground-multiple-authors [nit] Irregular blame hunk row heights
- **PNG:** `shots/final-gate-critic-6/bl-zoom.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/blame-playground-multiple-authors/dark-1440.png`, `shots/final-gate/blame-playground-multiple-authors/light-1440.png`
- **Fix:** Align .blame-info text to the first code line; fixed 20px row pitch.
- **Why this class:** CSS.

### FG-082 — Admin tables: status icons accent-blue/green mixed, trash and edit pencils accent-blue (Primer: muted icon buttons, danger on hover)
- **Class:** theme-fixable-css · **Owner:** pages/settings-admin · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-emails (7.5/7.5/7.0; C161), admin-orgs (8.5/8.5/8.3; C130)
- **Schemes / viewports:** light / 1440
- **Critic:** C161 admin-emails [minor] Status and action icons use inconsistent colors; C130 admin-orgs [nit] Accent-blue edit pencils
- **PNG:** `shots/final-gate/admin-emails/light-1440.png`, `shots/final-gate/admin-orgs/light-1440.png`, `shots/final-gate/admin-emails/light-1440.png`, `shots/final-gate/admin-orgs/light-1440.png`
- **Fix:** Status icons success/muted; row actions muted IconButtons.
- **Why this class:** CSS.

### FG-083 — Dashboard: heatmap does not fill its Box (~165px empty), repo search autofocused with accent ring in every capture
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): home (7.5/7.5/7.0; C003 C005)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C003 home [minor] Heatmap does not fill its Box; C005 home [nit] Repo search input autofocused with accent ring
- **PNG:** `shots/final-gate/home/dark-390.png`, `shots/final-gate/home/dark-1440.png`, `shots/final-gate/home/light-390.png`, `shots/final-gate/home/light-1440.png`
- **Fix:** Heatmap width 100%; focus ring only on :focus-visible.
- **Why this class:** CSS.

### FG-084 — Timeline: commit summaries in monospace, label pills ~4px above the baseline, SHA as bordered chip
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-conversation-playground-large-diff-reviews (8.0/8.5/7.0; C098), pr-draft-wip-playground (8.5/8.5/8.0; C199)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C098 pr-conversation-playground-large-diff-reviews [minor] Timeline commit summary uses monospace; C199 pr-draft-wip-playground [nit] Timeline label pills sit above the text baseline
- **PNG:** `shots/final-gate-critic-7/pr-draft-wip-playground/zoom-timeline.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/dark-1440.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/light-1440.png`, `shots/final-gate/pr-draft-wip-playground/dark-1440.png`, `shots/final-gate/pr-draft-wip-playground/light-1440.png`
- **Fix:** Commit messages sans, SHA mono link (see sha-style), vertical-align labels to text.
- **Why this class:** CSS.

### FG-085 — Action run/job views shift on mount at 390 (CLS 0.06-0.074)
- **Class:** theme-fixable-css · **Owner:** pages/actions-packages-projects · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): action-job-ok (8.5/8.5/7.5; C164), action-job (8.6/8.6/8.3; C131)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C131 action-job [minor] CLS 0.0599 at 390; C164 action-job-ok [nit] Layout shift on mount at 390
- **PNG:** `shots/final-gate/action-job-ok/dark-390.png`, `shots/final-gate/action-job-ok/dark-1440.png`, `shots/final-gate/action-job-ok/light-390.png`, `shots/final-gate/action-job-ok/light-1440.png`, `shots/final-gate/action-job/dark-390.png`, `shots/final-gate/action-job/dark-1440.png`, `shots/final-gate/action-job/light-390.png`, `shots/final-gate/action-job/light-1440.png`
- **Fix:** Reserve .action-view-left / .action-view-body sizes before mount.
- **Why this class:** CSS (§10).

### FG-086 — Commit rows' browse button uses octicon-file-code; github.com uses code (<>)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 4 (judge reasons 3 in 3 pairs + critic weight 1) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-commits (7.5/7.5/7.5; j2; C193), pr-commits-tab (8.5/8.5/8.0; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants page 3
- **Critic:** C193 repo-commits [nit] Browse button icon is file-code, not code
- **Judges say:** “A inlines a tag chip 'v1.4.6' in the commit title. The trailing icon is a browse-files icon rather than GitHub's '<>' code icon” / “A commit row shows 'David Ko 6 years ago', a 10-char SHA and a different trailing icon”
- **PNG:** `shots/final-gate/repo-commits/dark-1440.png`, `shots/final-gate/repo-commits/light-1440.png`, `shots/final-gate/pr-commits-tab/dark-1440.png`, `shots/final-gate/pr-commits-tab/light-1440.png`, `shots/final-gate-pairs/p045.png`, `shots/final-gate-pairs/p047.png`, `shots/final-gate-pairs/p119.png`
- **Fix:** Mask the svg with --gh-octicon-code (request the mask from icons).
- **Why this class:** CSS mask.

### FG-087 — Code-block copy button always visible and borderless, overlapping code at 390 (github.com: bordered 32px IconButton on hover)
- **Class:** theme-fixable-css · **Owner:** markdown · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pull (8.5/8.5/7.5; C141), issue-detail-playground-reactions-alerts-tables (8.6/8.6/8.4; C119)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C119 issue-detail-playground-reactions-alerts-tables [minor] Code-block copy button always visible, overlaps code; C141 repo-pull [nit] Markdown code-block copy button is borderless
- **PNG:** `shots/final-gate-critic-4/issue-detail-playground-reactions-alerts-tables-390-0.png`, `shots/final-gate/repo-pull/dark-390.png`, `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-390.png`, `shots/final-gate/repo-pull/light-1440.png`, `shots/final-gate/issue-detail-playground-reactions-alerts-tables/dark-390.png`, `shots/final-gate/issue-detail-playground-reactions-alerts-tables/dark-1440.png`, `shots/final-gate/issue-detail-playground-reactions-alerts-tables/light-390.png`, `shots/final-gate/issue-detail-playground-reactions-alerts-tables/light-1440.png`
- **Fix:** Reveal on pre:hover / :focus-within, bordered IconButton, pre padding-right.
- **Why this class:** CSS.

### FG-088 — ```console block renders monochrome; github.com colours the output lines (chroma emits .go spans)
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 4 (judge reasons 4 in 3 pairs + critic weight 0) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pull (8.5/8.5/7.5; j4)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3, page 1
- **Judges say:** “B code block not syntax-highlighted (plain grey) vs GitHub blue-colored console output” / “B's code block has no syntax colouring and the long line is cut off”
- **PNG:** `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`, `shots/final-gate-pairs/p037.png`, `shots/final-gate-pairs/p038.png`, `shots/final-gate-pairs/p040.png`
- **Fix:** Map .chroma .go (Generic.Output) / .gp (prompt) to the prettylights tokens github.com uses for ShellSession output; verify on /octo-org/grex/pulls/42.
- **Why this class:** CSS.

### FG-089 — Controls details: comment editor double border, label edit modal inputs 27/28/32px, default-branch value in placeholder colour, help text capped at ~550px
- **Class:** theme-fixable-css · **Owner:** controls · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-create (7.5/7.5/7.5; C108), repo-settings-branches (8.0/8.0/7.5; C160), labels (8.5/8.5/8.0; C150), issue-detail-playground-reactions-alerts-tables (8.6/8.6/8.4; C121)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C121 issue-detail-playground-reactions-alerts-tables [nit] Comment editor double border; C150 labels [nit] Edit modal input heights are inconsistent; C160 repo-settings-branches [nit] Current default branch value renders in placeholder color; C108 repo-create [nit] Help text capped narrow, ragged wraps
- **PNG:** `shots/final-gate-critic-4/issue-dark-editor.png`, `shots/final-gate/repo-create/dark-390.png`, `shots/final-gate/repo-create/dark-1440.png`, `shots/final-gate/repo-create/light-390.png`, `shots/final-gate/repo-create/light-1440.png`, `shots/final-gate/repo-settings-branches/dark-390.png`, `shots/final-gate/repo-settings-branches/dark-1440.png`, `shots/final-gate/repo-settings-branches/light-390.png`, `shots/final-gate/repo-settings-branches/light-1440.png`, `shots/final-gate/labels/dark-390.png`
- **Fix:** Borderless textarea inside the editor Box; one input height; .default.text fgColor-default when it is a value; captions max-width none.
- **Why this class:** CSS.

### FG-090 — Image view footer CLS 0.022 at 1440; repo-create is a boxed form (github.com /new is unboxed with owner/name side by side)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-create (7.5/7.5/7.5; C107), file-view-image-playground (8.7/8.7/8.3; C117)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C117 file-view-image-playground [nit] CLS 0.0223 from footer at 1440; C107 repo-create [minor] Boxed Gitea form rather than GitHub /new layout
- **PNG:** `shots/final-gate/repo-create/dark-1440.png`, `shots/final-gate/repo-create/light-1440.png`, `shots/final-gate/file-view-image-playground/dark-1440.png`, `shots/final-gate/file-view-image-playground/light-1440.png`
- **Fix:** Reserve image box height; /repo/create: unbox, 24px heading row, owner + name side by side (visibility stays Gitea's checkbox).
- **Why this class:** CSS.

### FG-091 — Non-Octicon icons left: gitea-running (Actions status filter), gitea-colorblind-* (theme menu)
- **Class:** theme-fixable-css · **Owner:** icons · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): actions-list (7.5/7.5/8.0; C048), user-settings-appearance (8.5/8.5/8.5; C084)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C048 actions-list [minor] Non-Octicon gitea-running icon in status filter; C084 user-settings-appearance [nit] Non-Octicon colorblind icons in theme menu
- **PNG:** `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`, `shots/final-gate/user-settings-appearance/dark-1440.png`, `shots/final-gate/user-settings-appearance/light-1440.png`
- **Fix:** CSS masks with Octicons (dot-fill / sync for running; eye for colorblind) in github themes; brand logos (gitea-gitea, feishu, matrix, npm) stay by §6.
- **Why this class:** CSS mask.

### FG-092 — Auth forms: signup uses 40px controls in a 352px column (github.com/login 32px, 340px), 'Account Recovery' heading 20px semibold, double space before the required '*'
- **Class:** theme-fixable-css · **Owner:** pages/auth · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): signup (8.0/8.0/8.0; C134), openid-signin (8.5/8.5/8.5; C081)
- **Schemes / viewports:** light / 1440
- **Critic:** C134 signup [minor] Auth form uses 40px large controls in a 352px column; C081 openid-signin [nit] Double space before the required asterisk in the label
- **PNG:** `shots/final-gate/openid-signin/light-1440.png`, `shots/final-gate/signup/light-1440.png`, `shots/final-gate/openid-signin/light-1440.png`
- **Fix:** Match github.com/login sizes; collapse the label whitespace (white-space / word-spacing on the asterisk span).
- **Why this class:** CSS.

### FG-093 — File info bar ('798 lines · 39 KiB · Go', '676 B · 96x96px') in monospace; github.com uses 12px sans muted
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): file-view-large-file-playground (9.0/9.0/8.0; C089), file-view-image-playground (8.7/8.7/8.3; C115)
- **Schemes / viewports:** light / 1440
- **Critic:** C089 file-view-large-file-playground [minor] File info bar in monospace; C115 file-view-image-playground [nit] File meta in monospace
- **PNG:** `shots/final-gate/file-view-image-playground/light-1440.png`, `shots/final-gate/file-view-large-file-playground/light-1440.png`, `shots/final-gate/file-view-image-playground/light-1440.png`
- **Fix:** .file-info: --fontStack-sansSerif 12px fgColor-muted (beats tw-font-mono via code.important.css if needed).
- **Why this class:** CSS.

### FG-094 — Flash banners: danger icon in fgColor-default with 4px gap; validation flash has no Octicon/dismiss
- **Class:** theme-fixable-css · **Owner:** overlays · **Impact:** 4 (judge reasons 0 in 0 pairs + critic weight 4) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): signup (8.0/8.0/8.0; C135), user-settings-account (8.5/8.5/8.5; C053)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C053 user-settings-account [minor] Danger flash icon has the wrong colour and gap; C135 signup [nit] Validation flash has no Octicon or close button
- **PNG:** `shots/final-gate-critic-1/usa-flash-l.png`, `shots/final-gate/signup/dark-1440.png`, `shots/final-gate/signup/light-1440.png`, `shots/final-gate/user-settings-account/dark-1440.png`, `shots/final-gate/user-settings-account/light-1440.png`
- **Fix:** .flash-error .svg fgColor-danger, 12px gap; ::before alert mask when Gitea renders no icon.
- **Why this class:** CSS.

### FG-095 — Tags Box header has no tag Octicon
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 4 (judge reasons 3 in 3 pairs + critic weight 1) · weakest route 8.5
- **Routes** (light/dark/390 critic score; j = judge reasons): tags (9.0/9.0/8.5; j3; C069)
- **Schemes / viewports:** dark, light / 1440; judge variants page 2, content 1
- **Critic:** C069 tags [nit] Box header lacks the tag Octicon
- **Judges say:** “B has a '16 Tags' header and a 'Search tags...' input inside the box. GitHub has a 'Tags' header with a tag icon and no search” / “A has GitHub 'Tags' box header with tag icon, 'Notes'/'Downloads' links and '...' buttons”
- **PNG:** `docs/reference/tags/light-1440.png`, `shots/final-gate/tags/light-1440.png`, `shots/final-gate/tags/dark-1440.png`, `shots/final-gate/tags/light-1440.png`, `shots/final-gate-pairs/p073.png`, `shots/final-gate-pairs/p075.png`, `shots/final-gate-pairs/p076.png`
- **Fix:** ::before mask octicon-tag in the Box header.
- **Why this class:** CSS.

### FG-096 — Diff row pitch 20px (github.com commit view ~24px); bottom expander cell 72px inset vs 88px gutter
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 5.0
- **Routes** (light/dark/390 critic score; j = judge reasons): pr-files-changed-unified-playground-large-diff (8.5/8.5/5.0; C154), commit-detail (7.5/7.5/6.0; C013), pr-compare-new-playground (8.5/8.5/7.5; C167)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C013 commit-detail [nit] Diff row height 20px vs 24px; C154 pr-files-changed-unified-playground-large-diff [nit] Bottom expand cell is inset relative to the line-number columns; C167 pr-compare-new-playground [nit] Bottom diff expander inset
- **PNG:** `shots/final-gate-critic-5/cmp-expander.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`, `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate/pr-compare-new-playground/dark-1440.png`, `shots/final-gate/pr-compare-new-playground/light-1440.png`
- **Fix:** Check the new github.com diff row height before changing; align the bottom expander with the line-number gutter.
- **Why this class:** CSS.

### FG-097 — Directory icons: outlined grey in dark / different style from github.com's filled folders
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 3 (judge reasons 3 in 3 pairs + critic weight 0) · weakest route 5.5
- **Routes** (light/dark/390 critic score; j = judge reasons): directory-tree (8.0/8.0/5.5; j2), repo-code-file (8.5/8.5/8.0; j1)
- **Schemes / viewports:** dark, light / 1440; judge variants content 3
- **Judges say:** “B folder icons are grey outlined, not the GitHub filled folder style; no 'Public' badge beside repo name” / “A has blue folder icons in tree, branch dropdown in main column, 'Add File' button, '445 Commits' in commit bar with Gitea avatar”
- **PNG:** `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/repo-code-file/dark-1440.png`, `shots/final-gate/repo-code-file/light-1440.png`, `shots/final-gate-pairs/p026.png`, `shots/final-gate-pairs/p058.png`, `shots/final-gate-pairs/p060.png`
- **Fix:** Use the filled octicon-file-directory-fill in --treeViewItem-leadingVisual-iconColor-rest for both schemes (check the dark token).
- **Why this class:** CSS mask/colour.

### FG-098 — Mobile branches rows become 3-line stacked cards (github.com keeps a horizontally scrolling table)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): branches (7.5/7.5/7.0; C039)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C039 branches [minor] Mobile rows become stacked cards
- **PNG:** `shots/final-gate-critic-1/br-mob-l.png`, `shots/final-gate/branches/dark-390.png`, `shots/final-gate/branches/light-390.png`
- **Fix:** <768px keep one row per branch in an overflow-x:auto Box.
- **Why this class:** CSS.

### FG-099 — Milestone big progress bar touches the viewport edge at 390 (Gitea width:min(420px,96vw))
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): milestone-issues (8.0/8.0/7.5; C024)
- **Schemes / viewports:** light / 390
- **Critic:** C024 milestone-issues [minor] Milestone progress bar touches the viewport edge on mobile
- **PNG:** `shots/final-gate/milestone-issues/light-390.png`, `shots/final-gate/milestone-issues/light-390.png`
- **Fix:** src/data-display/progress.css: width:100%; max-width:420px.
- **Why this class:** CSS.

### FG-100 — Mobile code chrome: 88px line-number gutter, latest-commit message dropped, diff summary text hidden
- **Class:** theme-fixable-css · **Owner:** code · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): compare-two-tags (7.5/7.5/7.5; C019), pr-compare-form-playground (8.0/7.5/7.5; C211), file-view-large-file-playground (9.0/9.0/8.0; C090)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C090 file-view-large-file-playground [nit] Wide mobile line-number gutter; commit message dropped; C019 compare-two-tags [nit] Mobile hides the diff summary text; C211 pr-compare-form-playground [nit] Mobile hides the diff stats line
- **PNG:** `shots/final-gate/compare-two-tags/dark-390.png`, `shots/final-gate/compare-two-tags/light-390.png`, `shots/final-gate/pr-compare-form-playground/dark-390.png`, `shots/final-gate/pr-compare-form-playground/light-390.png`, `shots/final-gate/file-view-large-file-playground/dark-390.png`, `shots/final-gate/file-view-large-file-playground/light-390.png`
- **Fix:** Narrower gutter at 390; keep the '25 changed files with…' summary visible (wrap instead of hide).
- **Why this class:** CSS.

### FG-101 — Org members at 390: ~170px rows (names wrap, Hidden label on its own line, buttons stacked); '2FA: ×' bare glyph
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-members (8.0/8.0/7.5; C051)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C051 org-members [minor] Mobile member rows are cramped (about 170px each)
- **PNG:** `shots/final-gate-critic-1/om-mob.png`, `shots/final-gate/org-members/dark-1440.png`, `shots/final-gate/org-members/light-1440.png`
- **Fix:** One-line rows with a single trailing button group; 2FA as a muted Label.
- **Why this class:** CSS.

### FG-102 — Org teams: staggered two-column card grid with unequal headers (github.com: one Box, one row per team)
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): org-teams (7.5/7.5/7.5; C077)
- **Schemes / viewports:** light / 390, 1440
- **Critic:** C077 org-teams [minor] Team cards in a staggered two-column grid with unequal header heights
- **PNG:** `shots/final-gate/org-teams/light-1440.png`, `shots/final-gate-critic-2/ot-l390.png`, `shots/final-gate/org-teams/light-390.png`, `shots/final-gate/org-teams/light-1440.png`
- **Fix:** Single Box with a row per team.
- **Why this class:** CSS.

### FG-103 — Destructive confirm dialogs use a green primary 'Confirm' (Primer: danger button)
- **Class:** theme-fixable-css · **Owner:** overlays · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): labels (8.5/8.5/8.0; C149)
- **Schemes / viewports:** dark / 390
- **Critic:** C149 labels [minor] Destructive confirm uses a green primary button
- **PNG:** `shots/final-gate/labels/dark-390.png`
- **Fix:** Style the confirm button of delete modals (data-modal-confirm / .delete modals) as danger.
- **Why this class:** CSS.

### FG-104 — Explore meta-row link hover underlines the '·' separator
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): explore-repos (8.0/8.0/8.0; C026)
- **Schemes / viewports:** light / 1440
- **Critic:** C026 explore-repos [minor] Meta-row link hover underlines the '·' separator
- **PNG:** `shots/final-gate-critic-1/live/explore-repos/states/light-1440-meta-hover-clip.png`, `shots/final-gate-critic-1/er-meta.png`, `shots/final-gate/explore-repos/light-1440.png`
- **Fix:** src/pages/people/repo-list.css:127: separator pseudo-element display:inline-block (or outside the link).
- **Why this class:** CSS.

### FG-105 — Forgot-password form never exercised (mailer disabled: page only shows 'Account recovery is disabled')
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): forgot-password (8.0/8.0/8.0; C061)
- **Schemes / viewports:** light / 1440
- **Critic:** C061 forgot-password [minor] Form never exercised (mailer disabled)
- **PNG:** `shots/final-gate/forgot-password/light-1440.png`
- **Fix:** Enable a dummy mailer (e.g. [mailer] PROTOCOL=dummy) for the capture instance, or drop the route from the gate.
- **Why this class:** Tooling/config.

### FG-106 — /user/settings header 8px lower than other settings tabs (profile.css:24 .user.profile > :first-child also matches settings)
- **Class:** theme-fixable-css · **Owner:** pages/people · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): user-settings (8.0/8.0/8.0; C064)
- **Schemes / viewports:** light / 1440
- **Critic:** C064 user-settings [minor] Profile tab settings header is 8px lower than on other settings tabs
- **PNG:** `shots/final-gate/user-settings/light-1440.png`, `shots/final-gate/user-settings/light-1440.png`
- **Fix:** Add :not(.settings) to src/pages/people/profile.css:24.
- **Why this class:** CSS.

### FG-107 — Wiki _Sidebar renders as a bulleted underlined list; Edit/New Page/Delete Page header buttons are 28px
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-page-playground (8.0/8.0/8.0; C071)
- **Schemes / viewports:** light / 1440
- **Critic:** C071 wiki-page-playground [minor] Wiki 'Pages' sidebar renders as a bulleted, underlined markdown list
- **PNG:** `shots/final-gate/wiki-page-playground/light-1440.png`, `shots/final-gate/wiki-page-playground/light-1440.png`
- **Fix:** Sidebar Box: no bullets/underline; header buttons medium 32px.
- **Why this class:** CSS.

### FG-108 — PR/issue list titles read heavier than github.com (system font at 600; 500 matches Mona Sans visually)
- **Class:** theme-fixable-css · **Owner:** pages/issues-prs · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.3
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pulls (8.6/8.6/8.3; C112)
- **Schemes / viewports:** light / 1440
- **Critic:** C112 repo-pulls [minor] PR list titles read heavier than github.com
- **PNG:** `shots/final-gate-critic-4/pulls-rows.png`, `shots/final-gate/repo-pulls/light-1440.png`
- **Fix:** Try 500 on list titles only; critic to confirm against the reference.
- **Why this class:** CSS.

### FG-109 — Mobile repo header keeps a full RSS / Watch / Star / Fork button row (~40px) under the title
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 3 (judge reasons 0 in 0 pairs + critic weight 3) · weakest route 8.3
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pulls (8.6/8.6/8.3; C113)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C113 repo-pulls [minor] Mobile repo header keeps RSS/Watch/Star/Fork row
- **PNG:** `shots/final-gate-critic-4/pulls-390-top.png`, `shots/final-gate/repo-pulls/dark-390.png`, `shots/final-gate/repo-pulls/light-390.png`
- **Fix:** At <768px collapse the row to icon-only 28px buttons on the title line (github.com shows title + Public only on sub-pages). Do not remove the buttons.
- **Why this class:** Layout of existing buttons.

### FG-110 — Single release page has no 'Releases / v1.4.6' breadcrumb (shows the list's Releases/Tags toggle)
- **Class:** theme-fixable-template · **Owner:** pages/repo · **Impact:** 3 (judge reasons 3 in 3 pairs + critic weight 0) · weakest route 8.8
- **Routes** (light/dark/390 critic score; j = judge reasons): release-detail (8.8/8.8/8.8; j3)
- **Schemes / viewports:** dark, light / 1440; judge variants content 2, page 1
- **Judges say:** “A single-release page lacks the 'Releases / v1.4.6' breadcrumb” / “B release page has '16 Releases / 16 Tags' toggle, RSS Feed and New Release buttons instead of 'Releases / v1.4.6' breadcrumb”
- **PNG:** `shots/final-gate/release-detail/dark-1440.png`, `shots/final-gate/release-detail/light-1440.png`, `shots/final-gate-pairs/p082.png`, `shots/final-gate-pairs/p083.png`, `shots/final-gate-pairs/p084.png`
- **Fix:** Low priority: github-* branch in templates/repo/release/list.tmpl for the single-release view: Breadcrumbs 'Releases / <tag>' in place of the toggle.
- **Why this class:** Needs text/links CSS cannot create.

### FG-111 — Mobile tables clip columns with no scroll affordance (admin users, admin emails)
- **Class:** theme-fixable-css · **Owner:** data-display · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 7.0
- **Routes** (light/dark/390 critic score; j = judge reasons): admin-emails (7.5/7.5/7.0; C162), site-admin-users (8.5/8.5/8.0; C008)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C008 site-admin-users [nit] Mobile table clipped without scroll affordance; C162 admin-emails [nit] Mobile table hides columns without affordance
- **PNG:** `shots/final-gate-critic-0/sau-l-m.png`, `shots/final-gate/admin-emails/dark-390.png`, `shots/final-gate/admin-emails/dark-1440.png`, `shots/final-gate/admin-emails/light-390.png`, `shots/final-gate/admin-emails/light-1440.png`, `shots/final-gate/site-admin-users/dark-390.png`, `shots/final-gate/site-admin-users/dark-1440.png`, `shots/final-gate/site-admin-users/light-390.png`, `shots/final-gate/site-admin-users/light-1440.png`
- **Fix:** Right-edge fade / visible scrollbar on overflowing .ui.attached.table.segment.
- **Why this class:** CSS.

### FG-112 — Mermaid: neutral grey light theme and 100px blank space at 390
- **Class:** inherent — Mermaid renders in a same-origin iframe sized by Gitea (CSS cannot reach the SVG theme/size) · **Owner:** markdown · **Impact:** 2 (judge reasons 0 in 0 pairs + critic weight 2) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): wiki-page-playground (8.0/8.0/8.0; C072), repo-home-markdown-showcase-playground (9.0/9.0/8.5; C035)
- **Schemes / viewports:** dark, light / 390, 1440
- **Critic:** C072 wiki-page-playground [nit] Mermaid light theme is neutral grey, not GitHub's default lavender; C035 repo-home-markdown-showcase-playground [nit] Mermaid iframe leaves 100px of blank space at 390
- **PNG:** `shots/final-gate-critic-1/pg-mob-l3.png`, `shots/final-gate/wiki-page-playground/dark-390.png`, `shots/final-gate/wiki-page-playground/dark-1440.png`, `shots/final-gate/wiki-page-playground/light-390.png`, `shots/final-gate/wiki-page-playground/light-1440.png`, `shots/final-gate/repo-home-markdown-showcase-playground/dark-390.png`, `shots/final-gate/repo-home-markdown-showcase-playground/dark-1440.png`, `shots/final-gate/repo-home-markdown-showcase-playground/light-390.png`, `shots/final-gate/repo-home-markdown-showcase-playground/light-1440.png`
- **Fix:** None.

### FG-113 — Compare range editor box is white (github.com #f6f8fa)
- **Class:** theme-fixable-css · **Owner:** pages/repo · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): compare-two-tags (7.5/7.5/7.5; C018)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C018 compare-two-tags [nit] Range editor box is white
- **PNG:** `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`
- **Fix:** --bgColor-muted.
- **Why this class:** CSS.

### FG-114 — PR 'Files Changed' tab uses octicon-diff (bare ±); github.com uses file-diff
- **Class:** theme-fixable-css · **Owner:** icons · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pull (8.5/8.5/7.5; C142)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C142 repo-pull [nit] 'Files Changed' tab uses the diff icon
- **PNG:** `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`
- **Fix:** Mask with --gh-octicon-file-diff (navigation applies it on the tab).
- **Why this class:** CSS mask.

### FG-115 — Repo UnderlineNav: Issues tab not selected on milestone issue lists (only PageIsIssueList sets it)
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 7.5
- **Routes** (light/dark/390 critic score; j = judge reasons): milestone-issues (8.0/8.0/7.5; C025)
- **Schemes / viewports:** light / 1440
- **Critic:** C025 milestone-issues [nit] Issues tab not active on milestone page
- **PNG:** `shots/final-gate/milestone-issues/light-1440.png`
- **Fix:** Mark the Issues tab selected on .repository.milestone-issue (and other issue sub-pages) by CSS on the existing a.item[href$='/issues'].
- **Why this class:** CSS on existing element.

### FG-116 — Issue label colours (bright cyan / solid green) differ from github.com's muted pills
- **Class:** inherent — Label colours are seeded data rendered as inline style !important (CONTEXT: exempt) · **Owner:** data-display · **Impact:** 1 (judge reasons 1 in 1 pairs + critic weight 0) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-issues (8.5/8.5/8.0; j1)
- **Schemes / viewports:** light / 1440; judge variants page 1
- **Judges say:** “A label colors (bright cyan 'enhancement', solid green 'new feature') differ from GitHub's muted pills; A missing linked-PR icon on #16”
- **PNG:** `shots/final-gate/repo-issues/light-1440.png`, `shots/final-gate-pairs/p017.png`
- **Fix:** None.

### FG-117 — Admin NavList group chevrons (right/down) differ from Primer (down rotating to up)
- **Class:** theme-fixable-css · **Owner:** navigation · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): site-admin-users (8.5/8.5/8.0; C007)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C007 site-admin-users [nit] NavList group chevrons
- **PNG:** `shots/final-gate/site-admin-users/dark-1440.png`, `shots/final-gate/site-admin-users/light-1440.png`
- **Fix:** Mask chevron-down and rotate 180deg when expanded.
- **Why this class:** Icon restyle.

### FG-118 — 390 full-page captures blank below ~17,000 device px (Chromium limit)
- **Class:** tooling · **Owner:** integrator/tools · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.0
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-code-file (8.5/8.5/8.0; C066)
- **Schemes / viewports:** dark, light / 390
- **Critic:** C066 repo-code-file [nit] Tooling artefact: 390 full-page capture blank after line 409
- **PNG:** `shots/final-gate/repo-code-file/{light,dark}-390.png`, `shots/final-gate-critic-2/live-rcf-390-bottom.png`, `shots/final-gate/repo-code-file/dark-390.png`, `shots/final-gate/repo-code-file/light-390.png`
- **Fix:** tools/shoot: capture tall mobile pages in segments and stitch.
- **Why this class:** Tooling bug.

### FG-119 — Repo sub-page container 1216px (x=112-1328) vs github.com 1232px (104-1336) at 1440
- **Class:** theme-fixable-css · **Owner:** foundation · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.3
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-pulls (8.6/8.6/8.3; C114)
- **Schemes / viewports:** dark, light / 1440
- **Critic:** C114 repo-pulls [nit] Container 1216px vs 1232px
- **PNG:** `shots/final-gate-critic-4/pulls-repohead.png`, `shots/final-gate/repo-pulls/dark-1440.png`, `shots/final-gate/repo-pulls/light-1440.png`
- **Fix:** Check .ui.container padding against Primer container-xl (1280 incl. 24px padding → 1232 content).
- **Why this class:** CSS.

### FG-120 — Brand logos reported as non-Octicon (webhook menu gitea/feishu/matrix, gitea-npm)
- **Class:** inherent — Brand logos kept by ARCHITECTURE §6 (webhook providers, package types) · **Owner:** icons · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.5
- **Routes** (light/dark/390 critic score; j = judge reasons): repo-settings-hooks (8.5/8.5/8.5; C186)
- **Schemes / viewports:** light / 1440
- **Critic:** C186 repo-settings-hooks [nit] Brand logos in the Add Webhook menu reported as non-Octicon
- **PNG:** `shots/final-gate/repo-settings-hooks/light-1440.png`
- **Fix:** None.

### FG-121 — Long ActionMenu (theme picker) has no scroll affordance
- **Class:** theme-fixable-css · **Owner:** overlays · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.5
- **Routes** (light/dark/390 critic score; j = judge reasons): user-settings-appearance (8.5/8.5/8.5; C085)
- **Schemes / viewports:** light / 1440
- **Critic:** C085 user-settings-appearance [nit] Theme menu has no scroll affordance
- **PNG:** `shots/final-gate/user-settings-appearance/light-1440.png`
- **Fix:** Bottom fade / visible scrollbar in overflowing menus.
- **Why this class:** CSS.

### FG-122 — Font stack is the Primer system stack, github.com uses Mona Sans VF (reads slightly heavier)
- **Class:** inherent — Mona Sans VF excluded by ARCHITECTURE §11 (no GitHub brand fonts) · **Owner:** foundation · **Impact:** 1 (judge reasons 0 in 0 pairs + critic weight 1) · weakest route 8.7
- **Routes** (light/dark/390 critic score; j = judge reasons): login (8.8/8.8/8.7; C110)
- **Schemes / viewports:** light / 1440
- **Critic:** C110 login [nit] Font stack differs from github.com (Mona Sans VF) by policy
- **PNG:** `shots/final-gate-critic-4/login-cmp.png`, `shots/final-gate/login/light-1440.png`
- **Fix:** None (policy). See pr-title-weight for the one weight tweak.


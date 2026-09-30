# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-015 [tooling] Seed data carries visible markers: '[seed]' descriptions, 'theme-seed' / 'migrated-from-github' topics, org README naming tools/seed/seed.mjs and 'GitHub-lookalike Gitea theme', '(seeded test account)' bios, 'Smoke edit' runs by admin** — impact 50 (judges 50, critic wt 0; routes: action-run, actions-list, org-members, wiki-page-list, explore-repos, file-view-markdown …)
   - Fix: tools/seed: keep a machine-readable marker (repo/org metadata or a manifest) instead of visible '[seed]' prefixes, '(migrated from …)' suffixes, 'theme-seed'/'migrated-from-github' topics and the seed-note README; give smoke runs neutral titles. Never touch pre-seed data (admin/jiri, ai/jiri). Idempotent re-seed.
   - PNG: `shots/final-gate/action-run/dark-1440.png`, `shots/final-gate/action-run/light-1440.png`, `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`
2. **FG-033 [tooling] Capture order leaks the admin's diff-style preference: repo-pull-files (?style=split) makes commit-detail render split** — impact 13 (judges 7, critic wt 6; routes: commit-detail)
   - Fix: tools/shoot: pin ?style=unified on every diff route that is not explicitly split (commit-detail, compare-two-tags, pr-files-changed-unified*, pr-compare-*), or restore the preference right after each ?style=split route; re-capture commit-detail. Baseline preference is unified (CONTEXT).
   - Critic refs: C011 (commit-detail, major)
   - PNG: `shots/final-gate/commit-detail/light-1440.png`, `shots/final-gate-critic-0/cd-l-m.png`, `shots/final-gate/commit-detail/dark-390.png`, `shots/final-gate/commit-detail/dark-1440.png`
3. **FG-056 [tooling] Lazy-loaded images (README media, review avatars) never load in full-page captures** — impact 7 (judges 0, critic wt 7; routes: pr-files-changed-split-playground-large-diff, repo-home-markdown-showcase-playground, repo-home-readme-with-images-and-tables)
   - Fix: tools/shoot: scroll the page (or set loading=eager via page script) before the full-page screenshot and wait for img.complete.
   - Critic refs: C034 (repo-home-markdown-showcase-playground, minor), C041 (repo-home-readme-with-images-and-tables, minor), C125 (pr-files-changed-split-playground-large-diff, nit)
   - PNG: `shots/final-gate-critic-1/pg-l-4.png`, `shots/final-gate-critic-1/rp-cmp3.png`, `shots/final-gate-critic-4/prsplit-live-thread2.png`, `shots/final-gate/pr-files-changed-split-playground-large-diff/dark-1440.png`
4. **FG-105 [tooling] Forgot-password form never exercised (mailer disabled: page only shows 'Account recovery is disabled')** — impact 3 (judges 0, critic wt 3; routes: forgot-password)
   - Fix: Enable a dummy mailer (e.g. [mailer] PROTOCOL=dummy) for the capture instance, or drop the route from the gate.
   - Critic refs: C061 (forgot-password, minor)
   - PNG: `shots/final-gate/forgot-password/light-1440.png`
5. **FG-118 [tooling] 390 full-page captures blank below ~17,000 device px (Chromium limit)** — impact 1 (judges 0, critic wt 1; routes: repo-code-file)
   - Fix: tools/shoot: capture tall mobile pages in segments and stitch.
   - Critic refs: C066 (repo-code-file, nit)
   - PNG: `shots/final-gate/repo-code-file/{light,dark}-390.png`, `shots/final-gate-critic-2/live-rcf-390-bottom.png`, `shots/final-gate/repo-code-file/dark-390.png`, `shots/final-gate/repo-code-file/light-390.png`

**Template overrides requested by final gate #1** (integrator installs; github-* branch only; non-GitHub output byte-identical; list each in ARCHITECTURE §7). Ranked:
- FG-007 (navigation, impact 130) Global header is Gitea's text-link bar (Issues / Pull Requests / Milestones / Explore), not github.com's signed-in AppHeader — github-* branch in templates/base/head_navbar.tmpl rendering the AppHeader markup specified in docs/final-gate/issues.md → 'Header decision' (hamburger that opens a nav drawer holding Gitea's links, logo, context crumbs, search field, create menu, Issues / Pull requests / Notifications icon buttons, avatar); navigation restyles it. Gitea logo stays as the AppHeader mark.
- FG-017 (pages/issues-prs, impact 45) Issues / PRs / Labels / Milestones pages lack github.com's issues layout: left NavList (Issues, Assigned to me, Created by me, Mentioned, Milestones, Labels) and an 'All issues' heading + query bar — github-* branch in templates/repo/issue/list.tmpl (+ labels / milestones pages): left NavList linking to existing Gitea filters (?type=all|assigned|created_by|mentioned, milestones, labels) and a Subhead 'Issues'/'Pull requests' above Gitea's search input restyled as the query bar. No new functionality, no removed filters.
- FG-019 (pages/repo, impact 35) Commit lists are a flat Box ('445 Commits' / '1 Commits' header) instead of github.com's 'Commits on <date>' timeline groups (commits page, PR Commits tab, compare) — github-* branch in templates/repo/commits_list.tmpl: before each row whose committer day differs from the previous row, close the Box and emit a timeline header (git-commit Octicon + date via DateUtils.AbsoluteShort; 'Commits on' via :lang(en) CSS or date only); pages/repo styles it (12px muted, 16px gutter line, one Box per day).
- FG-021 (code, impact 29) File / blame header: Gitea 'Raw | Permalink | Blame | History' group (+ 'Normal View' / 'Unescape') instead of github.com's Code | Blame (Preview for .md) SegmentedControl with Raw / copy / download icon buttons — github-* branch in templates/repo/view_file.tmpl (and repo/blame.tmpl header): left SegmentedControl [Preview (markdown only) | Code | Blame] built from the existing links (Preview/Code = the current file URL with/without ?display=source, Blame = .RepoLink/blame/…), right: Raw button + copy-raw / download icon buttons; Permalink, History, RSS, edit, delete stay as icon buttons (or in a kebab ActionMenu using a Fomantic dropdown). code styles it.
- FG-022 (pages/repo, impact 27) Wiki sidebar is a 'Page: Home' dropdown + green 'Code' clone button instead of github.com's 'Pages (N)' Box with filter and 'Clone this wiki locally' input — github-* branch in templates/repo/wiki/view.tmpl: right-column Box 'Pages <count>' with the existing filter input and the .Pages list (data IS loaded on view: routers/web/repo/wiki.go renderViewPage sets ctx.Data["Pages"]; the earlier rejection assumed ?action=_pages only), plus a 'Clone this wiki locally' input group from .CloneButtonOriginLink.HTTPS with the copy button. Keep 'New Page', 'Edit', 'Delete Page' and the revisions link.
- FG-024 (pages/repo, impact 23) Branches page: no 'Branches' title, no column-header row (Branch / Updated / Check status / Behind|Ahead / Pull request), 5 icon buttons per row instead of delete + kebab — github-* branch in templates/repo/branch/list.tmpl: Subhead 'Branches' (repo.branches key), a <thead>-style Box header row using existing locale keys, per-row actions: delete icon button + kebab ActionMenu (Fomantic dropdown) holding create-branch / RSS / download / rename. Overview/Active/Stale tabs stay out (no Gitea data).
- FG-025 (code, impact 22) Branch picker, 'Go to file' and 'Add File' sit above the content instead of in the file-tree pane header (github.com: branch picker + search at the top of the tree) — Additive github-* branch in the Modern-owned override templates/repo/view_content.tmpl (integrator only, additive, CONTEXT): when the file tree is shown, render the branch dropdown + 'Go to file' search in the tree pane header; keep the main toolbar's other controls. code styles the pane header.
- FG-034 (code, impact 13) README box header is a single 'README.md' bar with a pencil; github.com has 'README | <license> license' tabs — github-* branch in the README header (repo/view_file.tmpl, ReadmeInList): UnderlineNav-style tabs 'README' + '<license name> license' (from .DetectedRepoLicenses / LICENSE file link) + edit pencil at the right; also fix the 390 wrap (C170: header 75px, pencil drops to a 2nd line).
- FG-043 (pages/repo, impact 10) Repo sidebar has no stars / watching / forks rows (github.com About box lists them) — Low priority: github-* branch in the repo home sidebar template adding star/eye/repo-forked rows from .Repository.NumStars/NumWatches/NumForks.
- FG-044 (code, impact 9) Directory listing has no 'Name | Last commit message | Last commit date' Box header row — Additive github-* branch in templates/repo/view_list.tmpl (Modern's override; integrator only, additive) emitting a header row in sub-directories using existing locale keys where they exist (fallback: :lang(en) CSS text). code styles it as a Box header (#f6f8fa / #151b23, 12px/600 muted).
- FG-045 (pages/repo, impact 9) Commit page has no 'Commit <sha7>' H1 above the message Box; Code tab not marked active — Low priority: github-* branch in templates/repo/commit_page.tmpl adding <h1>Commit <ShortSha></h1>. Code tab active state: CSS on .repository.commit (the tab exists) if the template does not set it.
- FG-049 (pages/actions-packages-projects, impact 8) Actions list has no 'Actions' sidebar heading and no 'All workflows' title + subtitle — Low priority: github-* branch in templates/repo/actions/list.tmpl adding the two headings (actions.actions / existing keys). The 'Filter workflow runs' input has no Gitea backend: out of scope.
- FG-051 (pages/issues-prs, impact 8) Labels rows repeat '0 open issues/pull requests' text and Edit/Delete links on every row (github.com: compact icon counts, actions in a kebab) — Low priority: github-* branch in templates/repo/issue/labels/label_list.tmpl: counts as issue-opened/git-pull-request icon + number, Edit/Delete in a kebab ActionMenu.
- FG-053 (pages/people, impact 8) Profile README Box has no '<user> / README.md' mono caption header — github-* branch in templates/user/profile.tmpl (README block): Box header with '<name> / README.md' in 12px mono.
- FG-063 (pages/auth, impact 7) Auth pages show the full global navbar (Explore / Help / Register / Sign In); github.com auth pages show only the centred mark — Part of the head_navbar override: on PageIsSignIn / PageIsSignUp / forgot / reset pages render a slim header (logo only, centred above the form) and move Explore / Help / Register / Sign In links into the auth footer row (links kept, not removed). pages/auth styles it.
- FG-110 (pages/repo, impact 3) Single release page has no 'Releases / v1.4.6' breadcrumb (shows the list's Releases/Tags toggle) — Low priority: github-* branch in templates/repo/release/list.tmpl for the single-release view: Breadcrumbs 'Releases / <tag>' in place of the toggle.

# Integrator decisions (final gate #1 follow-up, 2026-09-30)

## Tooling (this folder)
- **FG-015 DONE (seed data).** Live data fixed through the API with the seed token (`node tools/seed/seed.mjs --only=tidy`,
  idempotent: 1st run 21 changes, 2nd run 0): octo-org/{grex,prom_ex,folderify} descriptions and topics now equal the
  github.com originals (no `[seed]`, no `(migrated from …)`, no `theme-seed` / `migrated-from-github`); theme-playground
  "Markdown, diff and CI showcase" (topic `theme-seed` dropped; fork bob-dev/theme-playground follows); `.profile`
  descriptions emptied; octo-org / pixel-guild descriptions neutral; " (seeded test account)" removed from the four bios;
  octo-org/.profile README rewritten; playground README/LICENSE/package.json/ci.yml and wiki Home/FAQ neutralised (one
  commit, PR #16 still mergeable). seed.mjs / content.mjs produce the same clean content on a re-run (manifest +
  hidden `<!-- theme-seed -->` MARK stay the machine-readable markers; manifest has a `markers` block). smoke.mjs now names
  its commit/PR "Update <file>" and its branch `patch-<ts>`.
  Left (not seed data or not changeable): README line 3 "A seeded repository…" (editing main would conflict with PR #16 —
  orchestrator's call), ~115 existing "Smoke issue/PR/edit" issues, PRs, commits and Actions runs by admin (titles of
  issues/PRs could be PATCHed; commits/runs cannot be renamed), npm package metadata keyword (immutable without re-publish).
  Pre-seed data (admin, ai, admin/jiri, ai/jiri) and admin/eveland untouched; nothing deleted.
- **FG-033 DONE.** routes.json pins `?style=unified` on commit-detail, compare-two-tags, pr-compare-new-playground,
  pr-compare-form-playground (PR files routes already carried an explicit style); shoot.mjs `pinDiffStyle()` adds
  `style=unified` to any diff URL of other route files; shoot.mjs reads the admin's `diff_view_style`
  (GET /api/v1/user/settings) before the run and PATCHes it back afterwards (`summary.json → diffViewStyle`).
  Verified: `repo-pull-files` (split) + `commit-detail` run → commit-detail unified (shots/integrator-tools-verify/commit-detail/light-1440.png);
  a split-only run ended with `{before: unified, afterRun: split, restored: unified}` and the API reads unified afterwards.
- **FG-056 DONE.** Before the full-page capture (gitea target) `img/iframe[loading=lazy]` become eager, the page is walked
  once and the capture waits (≤ 8 s) for every image to load or fail; the shifts this causes are removed from the CLS total
  and logged as `lazyImages.cls` (per-page JSON also has forcedEager / images / notLoaded). Verified: prom_ex README
  (15 lazy images) — sponsor logos, badges all present (shots/integrator-tools-verify/repo-home-readme-with-images-and-tables/light-1440.png), notLoaded 0.
- **FG-118 DONE.** Pages taller than 15,000 device px are captured in clipped segments and stitched with Pillow
  (`tiledCapture` in the page JSON). Verified: repo-code-file 390 (9,649 CSS px @2x, 2 segments) now shows lines 353–447 and the
  footer (was blank below ~17,000 px); prom_ex 390 3 segments. Shorter pages keep the single-shot path.
- **FG-105 environment (not changed).** Needs `[mailer] ENABLED=true, PROTOCOL=dummy` in app.ini + a restart — orchestrator
  decision ORC-10; otherwise inherent to the capture instance (drop the route from the gate).

## Template requests (§7: a high impact, b data in ctx, c existing locale keys, d byte-identical github-only branch, e ≤ 8 new overrides)
| FG | Template(s) | Decision | Reason |
|---|---|---|---|
| FG-007 (+FG-063) | base/head_navbar.tmpl + custom/gh_head_navbar.tmpl | **APPROVED** (orchestrator) | a 130; b all data upstream already uses; c keys `home.nav_menu`, `dashboard`, `search.search`, `search.code_kind`, `search.repo_kind`, upstream keys; d else-branch = upstream verbatim, no newline after `{{end}}`. ORC-5 |
| FG-017 | repo/issue/list.tmpl | **APPROVED (issue/PR list only)** | a 45 (3 of its 5 routes); b `.ViewType`, `.State`, `.PageIsPullList`, `.IsSigned`, `.RepoLink`; c `repo.issues.filter_type.*`, `repo.milestones`, `repo.labels` (wording "you" not "me"); d inline `{{if github}}` blocks, no whitespace outside actions. Labels / Milestones pages rejected (e). ORC-9 |
| FG-019 | repo/commits_list.tmpl | **APPROVED** | a 35; b `.Commits[].GitCommit.Committer.When`; grouping possible with template funcs only (`$ghDay` assignment inside range, `When.Format "2006-01-02"`, label `DateUtils.AbsoluteShort (DateUtils.ParseLegacy "<day>T12:00:00Z")`); c no "Commits on" key → date only; d inline blocks. Caveat: group key = committer-local day, label shown in the viewer's zone (same day within ±12 h). ORC-6 |
| FG-021 | repo/view_file.tmpl + repo/blame.tmpl | **APPROVED** | a 29 (blame critic 5.0 route); b `.HasSourceRenderedToggle`, `.IsDisplayingSource`, `.IsRepresentableAsText`, `.RefTypeNameSubURL`, `.TreePath`; c `preview`, `repo.code`, `repo.blame`; d inline blocks (README box path untouched). ORC-7 |
| FG-022 | repo/wiki/view.tmpl | **APPROVED (no filter, no clone heading)** | a 27; b `.Pages` set by renderViewPage on every view (earlier rejection was wrong), `.CloneButtonOriginLink` rewritten to the wiki clone link by middleware; c `repo.wiki.pages`, `copy_url`; filter input needs JS (§10) and "Clone this wiki locally" has no key → omitted; d `{{if not github}}` around the upstream button row + inline aside. ORC-8 |
| FG-044 | repo/view_list.tmpl (Modern's override) | REJECTED | a 9 (lowest candidate); the file is the Modern theme's live override — any edit risks Modern's output (d) for a small gain; column texts partly without keys (c) |
| FG-024 | repo/branch/list.tmpl | REJECTED | c no keys for Updated / Check status / Behind-Ahead headers; kebab needs a full row rewrite; e cap |
| FG-025 | repo/view_content.tmpl (Modern's override) | REJECTED | d Modern-owned file; branch dropdown + Vue file tree pane restructure is fragile; impact 22 < approved set; e |
| FG-034 | repo/view_file.tmpl README header | REJECTED | a 13; license tab needs extra link logic; e (would grow the approved view_file branch; revisit next gate) |
| FG-043, 045, 049, 051, 053, 110 | various | REJECTED | a ≤ 10 each; e cap |
Total new overrides: 7 files (head_navbar, gh_head_navbar, commits_list, view_file, blame, wiki/view, issue/list) ≤ 8.
Class names for the builders: navigation.md, pages-auth.md, pages-repo.md, code.md, pages-issues-prs.md (same date).
Byte-identity baseline for other themes: shots/orc5/before/ + shots/orc5/html-snapshot.sh (ORCHESTRATOR.md).

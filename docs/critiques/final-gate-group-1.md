# Final gate, group 1 (critic 1)

Theme `github-auto`, Gitea 1.27.3. Inputs: `shots/final-gate/<route>/` (4 captures and JSON logs per route), `docs/reference/<route>/` where present, plus my own live run with `--states --measure` in `shots/final-gate-critic-1/live/` (theme left at github-auto). Crops and composites I looked at are in `shots/final-gate-critic-1/`. The logged-out marketing header on github.com is an expected difference. Our signed-in header is compared with github.com's signed-in AppHeader.

Scale: 10 means indistinguishable, 8.5 means it matches with nits, 7 means recognisably GitHub-inspired, 5 means recoloured Gitea.

## Audit logs (all 13 routes × 4 captures)

- There are no unresolved CSS vars, no off-palette colours, no other-scheme-only colours, no unlayered Gitea CSS and no horizontal overflow. CLS is at most 0.0004 on every capture.
- Console errors fall into three groups, and none of them is a theme defect:
  - `not-found`: a 404 on the main document, which is expected.
  - `repo-home-readme-with-images-and-tables`: 5 shields.io badges fail with `ERR_BLOCKED_BY_CLIENT` because the shooter blocks third-party requests.
  - `pr-conversation-closed-unmerged`: 1 dependabot badge, also blocked by the shooter.
- Non-Octicon icons: `gitea-running` (1×) in the Actions status-filter menu (`actions-list`).
- Masked Vue icons: 2–3 per repo page. These are known and listed.

## Scores

| Route | Light 1440 | Dark 1440 | Mobile 390 |
|---|---|---|---|
| explore-repos | 8 | 8 | 8 |
| site-admin-config | 8.5 | 8.5 | 8.5 |
| not-found | 7 | 7 | 7 |
| repo-home-markdown-showcase-playground | 9 | 9 | 8.5 |
| branches | 7.5 | 7.5 | 7 |
| repo-home-readme-with-images-and-tables | 9 | 9 | 8.5 |
| pr-conversation-closed-unmerged | 8.5 | 8.5 | 7.5 |
| actions-list | 7.5 | 7.5 | 8 |
| org-members | 8 | 8 | 7.5 |
| user-settings-account | 8.5 | 8.5 | 8.5 |
| user-settings-orgs | 8.5 | 8.5 | 8 |
| org-projects | 8 | 8 | 7.5 |
| forgot-password | 8 | 8 | 8 |

## Issues per route

### explore-repos (ref: github.com/explore; the page type differs, so the comparison is with GitHub search results and trending cards)
- **minor, pages/people.** When you hover a meta link, its underline runs on under the "·" separator (`live/explore-repos/states/light-1440-meta-hover-clip.png`, zoom `er-meta.png`).
  - Cause: `src/pages/people/repo-list.css:127` puts the separator in `a::after`, so it is part of the link's text decoration.
  - github.com never underlines the separators.
  - Fix: make the pseudo-element `display:inline-block` (inline-block pseudos don't inherit the underline), or move the dot outside the link.
- **nit, navigation.** The header link "Explore" gets a grey active pill (`er-l-a.png`). github.com's signed-in header has no text nav links and no active pill.
- **nit, pages/people.** Repo cards have no trailing Star button, unlike GitHub's repo cards. This is a template limit.

### site-admin-config (Gitea-only; judged as a native Primer settings page)
- **minor, pages/settings-admin.** The admin NavList items have no leading 16px Octicons (`sac-light-a.png`). Every github.com settings NavList item has one (person, gear, paintbrush…). The same applies to the user settings sidebar.
- **nit, pages/settings-admin.** Config `<dl>` rows are 26px tall with no Box-row separators; only Gitea's group dividers show. GitHub key/value boxes use full Box rows. Reads fine otherwise, in both schemes and on mobile.

### not-found (ref: github.com's illustrated 404)
- **minor, pages/people (or foundation, the 404 page scope).**
  - github.com's 404 is a bespoke illustrated hero ("This is not the web page you are looking for") with a search box underneath.
  - Ours is a Primer Blankslate (alert icon, 32px "404 Not Found").
  - It is clean and native-looking, but a GitHub user would not mistake it for GitHub's 404. The score reflects that.
- **minor, navigation.** The signed-in header at 390 shows only the hamburger, logo and bell (`not-found-mob.png`). github.com's mobile AppHeader keeps the user avatar (and the create/search affordances) on the right.
- **minor, navigation (cross-cutting, seen on every signed-in route).** The desktop header has text links (Issues / Pull Requests / Milestones / Explore). github.com's signed-in header has a context breadcrumb, a "Type / to search" input and icon buttons (issues, PRs, notifications). The metrics match: 64px tall, #f6f8fa / #010409 background, 32px bordered icon buttons, round 32px avatar. The information architecture does not.

### repo-home-markdown-showcase-playground (Gitea-only data; markdown judged against github-markdown-css)
- The markdown is at parity in both schemes: headings, lists, task lists, tables, alerts, prettylights code including the diff fences (`pg-diff*.png`), footnotes, math, details and definition lists.
- **minor, tools/shoot (integrator).**
  - The "Media" section renders empty in the captures: "Local PNG image:" and "Local SVG…" have no picture (`pg-l-4.png`). The same happens on prom_ex, where stagira.png, dashboards_preview.png and apache_bench_stress_test.png are missing.
  - I checked with `shots/final-gate-critic-1/imgcheck.mjs`. The images serve with HTTP 200 and load once scrolled: `naturalWidth` goes from 0 to 96/320. They are `loading="lazy"` and the full-page capture never scrolls, so this is a capture artifact, not a theme defect.
  - Fix: the shooter should scroll through the page before capturing, otherwise every README review underreports.
- **nit, markdown.** At 390 the mermaid iframe stays 172px tall while its SVG is 72px, which leaves 100px of blank space under the diagram (`pg-mob-l3.png`, measured by `mermcheck.mjs`). This may be upstream Gitea iframe sizing.

### branches (ref: github.com/pemistahl/grex/branches)
- Measured parity:
  - repo header #f6f8fa / #0d1117
  - UnderlineNav items 30px / 14px / 600
  - counters 20px
  - branch-name pill 12px mono on #ddf4ff
  - search 32px
- **major, pages/repo.** The branch table has no column-header row. github.com has Branch / Updated / Check status / Behind|Ahead / Pull request on a #f6f8fa / #151b23 header (`br-l.png` vs `br-ref-l.png`). Gitea's template has no header row, so fixing it needs a template or `::before` construction.
- **minor, pages/repo.** github.com has a "Branches" 24px h1 with an Overview/Active/Stale/All UnderlineNav. Ours puts Gitea's "445 Commits · 14 Branches · 16 Tags" summary bar and a 14px "Default Branch" heading in that place. This is a template limit.
- **minor, pages/repo.** Each row has 5 invisible icon buttons (create branch, RSS, download, rename, delete). github.com has delete plus a kebab. The rows read busier than GitHub's.
- **nit, navigation.** Repo header action order is RSS, Watch, Star, Fork. github.com's order is Watch/Notifications, Fork, Star.
- **minor, pages/repo (mobile).** At 390 each branch becomes a stacked card (`br-mob-l.png`). github.com keeps a horizontally scrolling table. The cards are tidy but not GitHub.

### repo-home-readme-with-images-and-tables (ref: github.com/akoutmos/prom_ex)
- This is near-identical to github.com: the file table, latest-commit bar, sidebar, topics, Releases/Latest label, language bar, README rendering and both tables. Dark folder icons are grey #9198a1, as on github.com (`rp-d-z.png` vs `rp-ref-d-z.png`).
- **minor, tools/shoot.** Lazy images are missing from the capture (see the playground entry), so the page looks emptier than it is.
- **nit, pages/repo.** The sidebar heading says "Description" where github.com says "About". It also has an extra "Search code…" input and a "Manage Topics" link (Gitea features).
- **nit, pages/repo (mobile).** At 390 we show the full 17-entry file list and a Watch/Star/Fork counter row. github.com truncates to ~10 rows with "View all files" and hides the counters.

### pr-conversation-closed-unmerged (ref: github.com/pemistahl/grex/pull/348)
- Matches github.com: title and #348, the Closed StateLabel, tabs with counters, diffstat blocks, comment Box headers, sidebar sections and label rendering. The dark `github_actions` label matches github.com's outline treatment exactly (`pr-d-lab.png` vs `pr-ref-d-lab.png`).
- **minor, pages/issues-prs (mobile).**
  - At 390 the deleted head-branch pill `dependabot/github_actions/actions/upload-artifact-6` wraps mid-token across 3 lines (`pr-mob-l.png`).
  - github.com truncates it to one line ("dependabot/gith…") with a copy button.
  - Fix: `white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:…` on the head-branch pill.
- **nit, pages/issues-prs (mobile).** The PR tab bar clips "Files Changed" to "Fil" at the right edge, with no visible scroll affordance.
- **note (data, not theme).** The timeline has no commit, label, closed or branch-deleted events because the migration didn't import them. Instead there is Gitea's "Pull request closed" box.

### actions-list (ref: github.com/pemistahl/grex/actions)
- Measured parity:
  - box header 66px on #f6f8fa, 16px padding
  - rows about 80px
  - UnderlineNav active item 90.9px
  - status icons, branch pills and the "…" kebab
- **major, pages/actions-packages-projects.**
  - github.com uses a full-bleed PageLayout:
    - the sidebar is pinned to the left edge with a right border and an "Actions" title
    - the main pane has an "All workflows" title, a "Showing runs from all workflows" subtitle and a 300px "Filter workflow runs" input
    - the runs Box is 1056px wide
  - Ours is the centred 1280px container with a borderless NavList and a 962px Box, with no page title or filter input (`al-l-a.png` vs `al-ref.png`).
- **minor, pages/actions-packages-projects.** Hovering the row kebab turns the "…" icon accent blue with no background (`live/actions-list/states/light-1440-row-kebab-hover-clip.png`). github.com's invisible IconButton keeps the muted icon and adds a neutral-muted background.
- **minor, icons (integrator).** `svg.gitea-running` is a non-Octicon in the status-filter menu, flagged by the audit. It should be masked with an Octicon (`dot-fill` / `sync` spinner) like the other Vue icons.
- **nit, navigation.** Pagination has First/Last items, which github.com doesn't have. The current page chip (#0969da) matches.

### org-members (ref: github.com/orgs/go-gitea/people)
- Matches: org header (32px avatar, 20px name, UnderlineNav with coral indicator), 48px round avatars, 16px name links, outline "Hidden" labels, 28px small buttons, and correct dark danger buttons.
- **minor, pages/people.** github.com's People page has a left column with a "People" h2 and an "Organization permissions / Members" menu. Ours is single-column, with Gitea's info text and a green "Manage teams and members" button. This is a template limit.
- **minor, pages/people (mobile).** At 390 the rows are cramped (`om-mob.png`):
  - "alice-dev (Alice Anders)" wraps to 2 lines
  - the Hidden label drops to its own line
  - "Member Role:" and the role split across lines
  - the two buttons stack vertically

  The rows grow to about 170px. github.com's rows stay 1–2 lines with a single trailing button.
- **nit, pages/people.** The "2FA: ×" line has no GitHub equivalent. It is Gitea data, but a muted Label would read as more native than a bare × glyph.

### user-settings-account (Gitea-only)
- **minor, overlays.** In the "Delete Your Account" danger flash, the alert icon is fgColor-default with a 4px gap (`usa-flash-l.png`). Primer `.flash-error .octicon` is fgColor-danger with a 12px right margin.
- **nit, pages/settings-admin.** The email address and its Primary/Activated labels sit as bare text. github.com lists emails in a Box with rows.
- Otherwise native: 24px Subheads with border, a semibold red danger Subhead (as in Primer), 32px inputs and buttons, the btn-danger "Confirm Deletion" button, and correct focus rings. Dark is equally clean.

### user-settings-orgs (Gitea-only)
- The settings header override (48px avatar, name, "Settings" subtitle, Profile button) and the NavList active indicator (4×24px bar at −8px, `uso-nav-l.png`) are Primer-exact.
- **nit, pages/settings-admin.** "Leave" buttons measure 32px (medium). github.com's organisation rows use `btn-sm` (28px).
- **nit, pages/settings-admin (mobile).** "New Organization" wraps onto its own right-aligned line under "Manage Organizations" (`user-settings-orgs-mob.png`), leaving an awkward gap above the Subhead border.

### org-projects (Gitea-only; empty state)
- **minor, pages/actions-packages-projects.** The search input on this page measures differently from the site's other search fields:

  | | This page | explore / org-members / github.com |
  |---|---|---|
  | Height | 28px | 32px |
  | Font size | 12px | 14px |
  | Search button | trailing, attached | leading icon inside the input |

  Measured in `live/org-projects/light-1440.measure.json`; see `org-projects` light-1440 vs `explore-repos`. github.com's projects list search ("Search all projects") is a 32px input with a leading icon.
- **nit, pages/actions-packages-projects.** "New Project" is 28px (small). github.com's "New project" is a 32px medium primary button, and this site's own "Manage teams and members" is 32px.
- **nit, pages/actions-packages-projects (mobile).** At 390 "New Project" jumps to the left, above the Open/Closed counts (`org-projects-mob.png`), which reverses the desktop order.
- The Blankslate (24px icon, 20px semibold title, muted body) and the org header are good in both schemes.

### forgot-password (Gitea-only)
- **minor, pages/auth.** The global anonymous navbar (Explore, Help, Sign In, Register) is shown. github.com's auth pages (login, password_reset) have no global header, only the centred mark above the title (`docs/reference/login/light-1440.png`).
- **minor, tools/shoot and seed (integrator).** Mail is not configured, so the page only shows "Account recovery is disabled…" and the `validation-error` state captures the same text. The actual email form, input and button are never exercised by the gate.
- The title is 20px/600, the same as github.com's login title (per `docs/reference/login/*.measure.json`), and it is consistent with our sign-in page.

## Overall

- Repo home, README/markdown and the PR conversation are effectively at parity with github.com in light and dark.
- Settings and admin pages read as native Primer.
- The remaining gaps are structural:
  - the branches table has no column header row
  - Actions is not a full-bleed PageLayout
  - the signed-in header's information architecture differs
  - mobile row density on members and branches
  - one real CSS bug: the underlined "·" on the explore meta row
- Two tooling gaps skew the review:
  - lazy README images are never captured
  - forgot-password never shows its form

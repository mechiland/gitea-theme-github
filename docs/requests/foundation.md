# Change requests from foundation

## 1. [BLOCKER, integrator] Stop Vite's preload-helper from re-injecting Gitea's index.css unlayered (wave 1, round 2)

**What.** On pages that lazy-load chunks (repo home: RepoFileSearch, katex, mermaid …) Vite's
`preload-helper` appends `<link rel="stylesheet" href="/assets/css/index.<hash>.css">`, because it only skips a CSS
dependency when a `<link>` with the same href **and `rel="stylesheet"`** already exists. Our github branch of
`templates/base/head_style.tmpl` (and `tools/shoot/lib/preview.mjs`) only emits `rel="preload"` + `@import … layer(gitea)`,
so the helper adds an unlayered copy and all of Gitea's CSS then beats every `gh.*` layer (~0.3 s after load).

**Why / evidence** (`shots/foundation-r3/probe-{preview,fixed,builtin}.json`, `shots/foundation-probe.mjs`,
repo home `/octo-org/theme-playground`):

| | preview today (injected) | with the fix below | built-in gitea-auto |
|---|---|---|---|
| container x / w @1440 | 80 / 1280 | 112 / 1216 (github.com 112 / 1216) | 80 / 1280 |
| container x @390 | 8 | 16 (github.com 16) | 8 |
| nav → content gap | 14 | 24 (github.com 24) | 14 |
| body line-height | 20 | 21 | 20 |
| kbd font/lh/pad/radius | 11/11/2px 4px/4 | 11/10/4/6 (Primer kbd.scss) | 11/11/2px 4px/4 |
| focus ring dark | rgb(68,147,248) | rgb(31,111,235) (github.com) | – |
| CLS light @390 | 0.553 | 0.275 | 0.252 |
| CLS light @1440 | 0.039 | 0.0001 | 0 |

Pages without lazy chunks (commits, releases, settings, explore …) are identical in both columns, so the fix has no
side effect there. With the fix, the only `index.css` stylesheet link in the DOM is the inert one
(`media="not all"`), verified in the probe (`injected: ["not all"]`).

**Exact proposed diff** — `templates/base/head_style.tmpl` (github branch, line 6) — add an inert stylesheet link
next to the preload:

```diff
-{{range StringUtils.Split (StringUtils.ToString (AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css")) "\""}}{{if StringUtils.Contains . ".css"}}<link rel="preload" as="style" href="{{.}}">{{end}}{{end}}
+{{range StringUtils.Split (StringUtils.ToString (AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css")) "\""}}{{if StringUtils.Contains . ".css"}}<link rel="preload" as="style" href="{{.}}"><link rel="stylesheet" href="{{.}}" media="not all">{{end}}{{end}}
```

`tools/shoot/lib/preview.mjs` line 22 — same thing:

```diff
-      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
+      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><link rel="stylesheet" href="${m[1]}" media="not all"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
```

Verify afterwards on `/octo-org/theme-playground`:
`[...document.querySelectorAll('link[rel=stylesheet]')].filter(l => /\/assets\/css\/index\./.test(l.href)).map(l => l.media)`
→ `["not all"]` only.

(Exactly this HTML rewrite is what `shots/foundation-probe.mjs fixed` does; all numbers above come from it.)

### Status (wave 1, round 3): request 1 is STILL NOT APPLIED

Re-checked at round 3: `templates/base/head_style.tmpl` line 6 and `tools/shoot/lib/preview.mjs` line 22 still emit only
the preload + `@import … layer(gitea)`. The diff above is unchanged and still the whole fix. It remains the
single blocker for foundation (repo home + file views render Gitea's unlayered index.css over every gh layer).
Nothing in `src/foundation` can compensate: unlayered CSS beats every layer, and restating all of foundation in
`*.important.css` is exactly what ARCHITECTURE forbids.

## 2. [ownership, ARCHITECTURE §5 table] `.help` moves from foundation to controls (wave 1, round 3)

**What.** Round 3 removed `.help` from `src/foundation/helpers.css`. The critic found form captions defined twice
(foundation `.help` + controls `.ui.form .help, .form .help`). Every `.help` in the Gitea 1.27.3 templates sits inside a
form (the 10 template files without a form class are partials included in forms), and Gitea itself only styles
`.form .help`, so controls is the natural single owner.

**Proposed diff** (ARCHITECTURE.md, ownership table, `foundation` row): drop `` `.help`, `` from the owned-selector list
and add it to the `controls` row.

## 3. [FYI, pages/repo + integrator] Repo home @390 CLS is a Gitea progressive-render shift (wave 1, round 3)

Measured with `shots/foundation-cls.mjs` (fixed = inert-link fix applied; 10 runs each, light, 390):
fixed mean 0.242, fixed without the gh.foundation layer 0.222, built-in gitea-auto 0.218. It is a single shift on
every mode: `.repo-home-filelist` moves down by the height of `.repo-home-sidebar-top` (~300px) because the
file list precedes the sidebar in the DOM and the mobile grid (repo/home.css:31-47) puts the sidebar in row 1
after it has been parsed. Foundation adds ~0.02 only by scaling that shift (github.com-correct 21px line-height and
16px gutter make the sidebar taller). A real fix belongs to pages/repo (e.g. reserve the sidebar row, or move
`home_sidebar_top` before the file list in the template) — not something foundation should undo.

### Status (wave 1, round 4): request 1 is STILL NOT APPLIED

Re-checked at round 4: `templates/base/head_style.tmpl` line 6 and `tools/shoot/lib/preview.mjs` line 22 are unchanged
(preload + `@import … layer(gitea)` only). The diff under #1 is still the complete fix. Round-4 preview captures still
show the injected unlayered index.css on repo home (CLS 0.553 light/dark @390, container 80/1280 @1440).

## 4. [FYI, pages/repo] Repo home toolbar wraps at 390 once the 16px gutter applies (wave 1, round 4)

With the inert-link fix, the container gutter at 390 becomes github.com's 16px (built-in: 8px). "Go to file" +
"Add File" then fill row 1 of the repo-home toolbar and "Code" drops to row 2 (critic r3,
`shots/critic-foundation-r3/fixed/repo-home-fixed-dark-390.png`). github.com collapses that toolbar to icon buttons
below 544px; the toolbar layout belongs to pages/repo. Foundation's gutter should stay 16px.

## 5. [FYI, pages/auth] Login / sign-up card at 390 is still inset by the page grid (wave 1, round 4)

Card measures x=34 w=322 @390 (github.com 16/358). The remaining 18px per side is Gitea's
`.ui.page.grid` / very-relaxed column padding on the auth pages, which pages/auth owns. Foundation deliberately does
not restyle `.ui.grid` gutters (see src/foundation/layout.css).

## 6. [FYI, all page folders] Plain heading margins are now Primer-based (wave 1, round 4)

`src/foundation/typography.css` now gives plain h1–h6 (outside .markup, not `.ui.header`, no `tw-m*` utility)
`margin: 0 0 8px` (Primer typography-base 0 + GitHub's usual `mb-2`), and 0 bottom when the heading is the last child.
This replaces Fomantic `calc(2rem - .1428em) 0 1rem` (h2 24.6/14, h3 25.1/14, h6 UA 28/28). Visible plain headings
checked: webhook "Trigger On:", admin auth "GMail Settings:", editor "Commit Changes" (gap to next element 14 → 8).
If a page needs a different gap, set it in the page folder (later layer wins).

# Integrator (between wave 1 and wave 2, 2026-09-30)

- **#1 — PARTIAL (source DONE, live install PENDING).** The inert link is in the project's
  `templates/base/head_style.tmpl` (github branch, next to the preload, with a comment) and in
  `tools/shoot/lib/preview.mjs` line 22, exactly as proposed. Installing it into
  `CUSTOM_PATH/templates/base/head_style.tmpl` and running `gitea manager reload-templates` was **blocked by this
  session's permission policy** (the classifier refused the write to the live template plus the docker exec), so the
  running server still serves the old github branch. The user must approve or perform that step: copy the github
  branch line from `templates/base/head_style.tmpl` into the live file (keep the else-branch and its
  `modern_revision` byte-for-byte), then reload templates. Until then the shoot audit flags every page with an
  unlayered index.css (`problems: unlayered Gitea index.css link`, `totals.pagesWithUnlayeredGiteaCss`).
- **#2 — DONE.** ARCHITECTURE §5: `.help` moved from the foundation row to the controls row.
- **#3, #4, #5 — FORWARDED** to pages/repo and pages/auth (wave 3 briefs; recorded in docs/STATUS.json openIssues).
- **#6 — noted.**
- **Seam fix by the integrator in `src/foundation/typography.css` (ownership conflict with data-display):** the two
  heading-margin rules reached into `.empty-placeholder` (data-display owns blankslates, D-1) and set h2 margin-top 0
  after the 48px icon (critic r4 major: gap 25 → 0 on projects/packages/wiki/worktime/actions empty states).
  Added `.empty-placeholder *` to both `:not()` lists, and tightened the utility exclusion from `[class*="tw-m"]`
  (which also matched tw-mx-/tw-max-/tw-min-/tw-mono) to `[class*="tw-m-"], [class*="tw-mt-"], [class*="tw-mb-"],
  [class*="tw-my-"]` (critic r4 nit). No other change in the folder. Lint clean.

# Integrator (end of wave 2, 2026-09-30)
- **#1 — DONE (live).** CUSTOM_PATH/templates/base/head_style.tmpl now carries the inert `media="not all"` link (identical to
  the project copy modulo `github_revision`; installed by the orchestrator at 03:50). Full audit shots/integrate-w2:
  `pagesWithUnlayeredGiteaCss: 0` on 272 pages. `npm run deploy` now also reports template drift (`templatesPending`).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-119 [theme-fixable-css] Repo sub-page container 1216px (x=112-1328) vs github.com 1232px (104-1336) at 1440** — impact 1 (judges 0, critic wt 1; routes: repo-pulls)
   - Fix: Check .ui.container padding against Primer container-xl (1280 incl. 24px padding → 1232 content).
   - Critic refs: C114 (repo-pulls, nit)
   - PNG: `shots/final-gate-critic-4/pulls-repohead.png`, `shots/final-gate/repo-pulls/dark-1440.png`, `shots/final-gate/repo-pulls/light-1440.png`

### Final gate #1 — foundation (wave L1, round 1)
- **FG-119 — DONE.** Measured github.com content edges (`shots/foundation-gl1-ghedges.mjs github`, logged-out, 2026-09-30):
  github.com has two repo containers. Rails `container-xl` pages (repo home, PR conversation, compare, release,
  pulse, forks, profiles) = 1216 @1440 (x=112) / 1216 @1280 (x=32); React PageLayout pages (issue view, pulls list) =
  1232 @1440 (x=104) / 1232 @1280 (x=24), 24px gutter from 768px, 16px below. The repo-pulls evidence predates the
  FG-017 template: the Gitea pulls list is now pages/issues-prs' full-width `.gh-issues-layout`, so no `.ui.container`
  is left there. The remaining 1216-vs-1232 page was the **issue view**: `src/foundation/layout.css` now sets
  `--page-margin-x: 24px` from 768px on `.page-content.repository.view.issue` without `> .ui.container > .pull.tabs`
  (a PR conversation stays 1216, like github.com). Measured on Gitea after deploy (repo-issue):
  1440 104/1232, 1280 24/1232, 1012 24/964, 1000 24, 800 24, 767 16, 390 16. These match github.com at every width
  measured. PR, repo home, release detail, org, and profile are unchanged (112/1216 @1440).

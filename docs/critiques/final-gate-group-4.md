# Final gate — critic group 4

Theme: `github-auto`. Sources: `shots/final-gate/<route>/` (full run) plus a fresh live run with `--states --measure` in
`shots/final-gate-critic-4/live/`. Crops and side-by-sides are in `shots/final-gate-critic-4/`. Only login, repo-pulls
and release-detail have github.com references. The other routes are judged on whether they read as a native Primer page.

## Audit logs (all 52 captures)
- Console errors: 0 on every route except not-found-anon. That route has 1 error, the expected `404` of the main
  document (`expectStatus: 404`), so it is not a defect.
- Failed requests 0, unresolved vars 0, off-palette colors 0, unlayered Gitea CSS 0, horizontal overflow false everywhere.
- Non-Octicon icons: `fontawesome-openid` (login, the OpenID brand glyph) and `gitea-npm` (package type logo). Both
  are brand marks with no Octicon equivalent, so they are acceptable. All other non-Octicon icons are masked
  (`gitea-double-chevron-left`, `material-file`).
- CLS: action-job 390 = **0.0599** (`.action-view-body`, `.action-view-left`). file-view-image-playground 1440 =
  0.0223 (`footer.page-footer`). The rest are 0 or under 0.007.
- Measured against github.com (login, repo-pulls, release-detail): button, primary button, input, link, underline-nav
  and counter metrics all match. The only systematic difference is `Mona Sans VF` on github.com versus the system stack
  here. ARCHITECTURE §11 excludes that font on purpose, so it is not scored as a defect. It is still why GitHub's
  500/600 text looks slightly lighter than ours.

## Scores (light 1440 / dark 1440 / mobile 390)

| Route | Light | Dark | 390 | Verdict |
|---|---|---|---|---|
| login | 8.8 | 8.8 | 8.7 | Form, button and divider metrics identical to github.com/login |
| user-settings-keys | 8.8 | 8.8 | 8.6 | Native Primer settings page; add-key panel state is good |
| repo-pulls | 8.6 | 8.6 | 8.3 | Classic GitHub PR list; labels exact in both schemes |
| file-view-image-playground | 8.7 | 8.7 | 8.3 | Tree and file header match; dark folders correctly muted |
| release-detail | 8.8 | 8.8 | 8.8 | Near-identical box, markdown and asset table; mobile excellent |
| issue-detail-playground-reactions-alerts-tables | 8.6 | 8.6 | 8.4 | Conversation, sidebar and timeline read as GitHub |
| pr-files-changed-split-playground-large-diff | 8.5 | 8.5 | **6.8** | Diff colors exact Primer; mobile inline thread broken |
| package-detail-npm | 8.5 | 8.5 | 8.1 | Primer boxes; mobile pre clipping |
| repo-settings-collab | 8.6 | 8.6 | 8.5 | Disabled Remove buttons are correct (teams include all repos) |
| admin-orgs | 8.5 | 8.5 | 8.3 | Clean Primer table; small controls |
| action-job | 8.6 | 8.6 | 8.3 | Step list and gear menu fine; mobile CLS |
| issue-new-playground | 8.4 | 8.4 | 8.3 | Good editor chrome; preview state collapses |
| not-found-anon | 8.7 | 8.7 | 8.7 | Primer blankslate |

## Issues (most severe first)

### MAJOR
1. **pr-files-changed-split 390: inline review thread crushed into the right split column** (owner `code`).
   At 390 the conversation holder sits only in the new-side cell, about 110 CSS px wide. The header wraps word by word
   ("bob-dev / commented / 4 months / ago"), and the code block in the comment shows only `ex|`, so it cannot be read.
   GitHub lets a review thread span the full diff width. Fix: at narrow widths, make the split-view conversation row span
   both sides (`colspan`-like: hide the empty old-side cell and let the new-side cell take 100%), and drop the
   outside avatar gutter. Evidence: `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-44230.png`,
   `shots/final-gate/pr-files-changed-split-playground-large-diff/light-390.png` near y=45000.

### MINOR
2. **PR tab bar on mobile clips the active tab** (owner `navigation`). At 390, Conversation / Commits / Files Changed
   are cut at the viewport edge ("± Fi"). The active "Files Changed" tab is not visible and there is no scroll
   affordance. Evidence: `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-0.png`.
3. **Inline review thread header: author not emphasised, and avatar plus bubble pointer outside the box** (owner
   `code`). "carol-ops commented 4 months ago" is uniformly muted; GitHub shows the author in fgColor-default,
   semibold. Timeline-style avatars with a caret sit outside the thread box; GitHub review threads are a plain bordered
   box. Evidence: `shots/final-gate-critic-4/prsplit-thread.png`.
4. **Package install `<pre>` overflows on mobile** (owner `pages/actions-packages-projects`).
   `@octo-org:registry=http://localhost:3000/api/pac…` runs past the code block's right padding and is clipped; the copy
   button overlaps the text. Needs `overflow-x:auto` or `word-break:break-all` on the setup snippets. Evidence:
   `shots/final-gate-critic-4/package-detail-npm-390-0.png`.
5. **action-job 390 CLS = 0.0599** (owner `pages/actions-packages-projects`). The shift comes from
   `.action-view-body` / `.action-view-left` reflowing after the Vue mount. ARCHITECTURE §10 requires CLS no higher than
   the built-in theme's; the gitea-auto baseline for this route needs checking. Evidence:
   `shots/final-gate/action-job/light-390.json`.
6. **Markdown code-block copy button always visible and overlapping code** (owner `markdown`). On GitHub the clipboard
   button appears only on hover or focus of the snippet. Here it sits on top of the code: `fill: cu` is truncated under
   it at 390, and `mode: 'light'` in the PR thread. Evidence:
   `shots/final-gate-critic-4/issue-detail-playground-reactions-alerts-tables-390-0.png`,
   `shots/final-gate-critic-4/prsplit-thread2-light.png`.
7. **issue-new Preview tab collapses to 0 height, and the "Drop files" bar stays visible** (owner `pages/issues-prs`).
   GitHub shows a min-height preview area ("Nothing to preview") and hides the attachment footer in preview. Evidence:
   `shots/final-gate-critic-4/issuenew-preview.png`.
8. **Repo PR list title weight reads heavier than github.com** (owner `pages/issues-prs`). Ours is 16px/600 system font;
   the reference list title renders lighter (Mona Sans VF). With the system stack, weight 500 would match the visual
   weight more closely. Evidence: `shots/final-gate-critic-4/pulls-rows.png`.
9. **Mobile repo header keeps the RSS/Watch/Star/Fork button row** (owner `navigation`). This row adds about 40px under
   the title on every repo page at 390. github.com hides these actions on narrow repo sub-pages (only the title and
   "Public" remain). Evidence: `shots/final-gate-critic-4/pulls-390-top.png`.
10. **Admin search input is 28px with small text** (owner `pages/settings-admin`). `Search orgs…` measures 28px tall
    (y 155–182); Primer's default TextInput next to a 32px Sort control is 32px. Evidence:
    `shots/final-gate/admin-orgs/light-1440.png`.

### NIT
11. File view meta `676 B · 96x96px` is set in monospace; GitHub uses the sans UI font at 12px, muted (owner `code`).
    `shots/final-gate/file-view-image-playground/light-1440.png` at 360,328.
12. At 390 the file path copy button wraps onto its own line under the breadcrumb (owner `pages/repo`).
    `shots/final-gate-critic-4/file-view-image-playground-390-0.png`.
13. The release "Downloads" disclosure triangle is a large filled glyph; GitHub's "Assets" uses a small caret plus a
    counter (owner `pages/repo`). `shots/final-gate/release-detail/light-1440.png` at 135,720.
14. The "Add dependency…" select shows a native double-arrow indicator instead of Primer's single chevron (owner
    `controls`). `shots/final-gate-critic-4/issue-light-1.png` at 1283,180.
15. The Actions gear menu uses square checkbox glyphs; GitHub's ActionMenu uses checkmarks only on selected items
    (owner `pages/actions-packages-projects`). `shots/final-gate-critic-4/actionjob-states.png`.
16. Admin table edit actions are accent-blue pencils; GitHub table row actions are muted icon buttons (owner
    `pages/settings-admin`).
17. The comment editor shows a double border (outer box plus inset textarea border). GitHub's editor textarea is
    borderless inside the box (owner `controls`). `shots/final-gate-critic-4/issue-dark-editor.png`.
18. The repo-page container is 1216px wide (x 112–1328) versus 1232px on github.com (x 104–1336) (owner
    `foundation`). `shots/final-gate-critic-4/pulls-repohead.png`.
19. The bob-dev avatar in the last split-diff thread renders as an empty circle in both runs. This is likely a lazy
    `<img>` never entering the viewport during full-page capture (capture artifact, integrator/tools).
    `shots/final-gate-critic-4/prsplit-live-thread2.png`.

## Not defects (checked)
- The collab "Remove" buttons are disabled because every seeded team has `IncludesAllRepositories`
  (`templates/repo/settings/collaboration.tmpl:97`).
- The dark overlay background is #010409, which matches the generated Primer dark token `--overlay-bgColor`.
- Diff colors were sampled and match Primer exactly: add `#dafbe1`/`#aceebb`, del `#ffebe9`/`#ffcecb`, hunk
  `#ddf4ff`/`#b6e3ff`, empty cell `#f6f8fa`, and the dark alpha blends.
- Title Case strings ("Sign In", "New Pull Request") come from Gitea locale, not the theme.

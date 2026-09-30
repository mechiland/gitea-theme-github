# Critique: data-display, wave L1 (final gate #1 loop), round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.5 / 10. Pass, with nits.**

- Gates: 0 console errors that belong to the theme, 0 literal colours, smoke green (13/13 steps).
- One transient CSS load error happened during the run. It came from a concurrent deploy by another folder. I re-shot that page and it was clean (see below).
- Items fixed: FG-011, FG-046, FG-058, FG-099, DD-W3B-1 and PR-DD-1. I checked each one on screen and measured it.
- FG-111 still has no visible effect on any page I probed. The builder says so openly: it waits on DD-SA-1 in pages/settings-admin.

## What I verified

- **Lint:** `node build/lint.mjs data-display` gives 0 errors and 0 warnings (290 selectors).
- **Build:** `npm run build` gives `folders["data-display"] = {status:"ok", lintErrors:0, lintWarnings:0, files:16, bytes:49847}`. The build as a whole prints OVER BUDGET for the three theme files (325–330 KB). That is a whole-theme problem, not this folder's.
- **Served CSS vs dist:** the SHA differs (dist `41d6…68e7`, served `68ec…c4f8`), so I did not deploy.
  - The only newer sources are in `src/markdown/`, which another builder is working on.
  - No file in `src/data-display` is newer than the deployed file.
  - The FG-011 rule is byte-identical in served and dist, so the live data-display CSS is current.
- **Our screenshots:** `shots/critic-data-display-wL1-r1/`, from routes file `shots/critic-data-display-wL1-r1-routes.json`.
  - 18 routes from routes.json plus 3 of mine (`dd-editor`, `dd-user-keys`, `dd-repo-labels-empty`), with data-display measure selectors added.
  - Light and dark, 1440 and 390, with `--states --measure`: 84 pages.
  - 0 unresolved vars that hit live DOM, 0 non-Octicon icons, 0 unlayered Gitea CSS.
- **The one console error:** `admin-emails/dark-390`, `net::ERR_CONTENT_LENGTH_MISMATCH` on `theme-github-auto.css`. Another folder deployed while the page loaded, so it rendered unthemed. I re-shot `admin-emails` in all 4 combinations and all were clean (0 errors).
  - The only off-palette colour (`rgba(0,0,0,1)`, 79 hits) came from that same unthemed page.
- **Other problems in the run:**
  - `repo-home` `tooltip-hover` state timed out. That is the overlays folder's state, not this one.
  - `dd-editor` CLS is 0.36–0.80 from the CodeMirror load, not this folder.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` exits 0 with 13/13 ok and 0 console errors (`shots/critic-data-display-wL1-r1-smoke.log`).
- **github.com probes (logged out, read-only):**
  - Pages: pemistahl/grex (home, issues/35 at 390, labels, pull/42, compare v1.4.5...v1.4.6).
  - Scripts: `shots/critic-ddl1-gh.mjs` (evaluate + element shot) and `shots/critic-ddl1-crop.mjs` (element crops at 2x).
  - Crops: `shots/critic-data-display-wL1-r1/crops/`, plus `shots/critic-data-display-wL1-r1-{gh,ours}-issue35-header-390.png`.

## Final-gate items, checked

| Item | Ours (measured) | github.com / spec | Verdict |
|---|---|---|---|
| FG-011 default avatar | `img.ui.avatar[src$=avatar_default.png]`: object-position -448px, 2 radial gradients `rgb(89,99,110)` on `rgba(129,139,152,0.12)`, radius full, 1px `--avatar-borderColor` ring. Seen at 40px (issues/35, pulls/42), 18px (blame), 16px (commits, compare), 20px (directory-tree, commit-detail). Readable at every size, both schemes. | neutral placeholder (ruling) | **Fixed** (`crops/issue35-top-{light,dark}.png`, `crops/commits-light.png`, `crops/blame-dark.png`, `crops/pull-dark-1440.png`) |
| FG-046 mobile header | issues/35 at 390: all 8 headers 53px, right cluster at top +4px, x=305, w=52. pulls/42: 53px. Playground pulls/16: 38 / 34.3 / 53.3px | issues/35 at 390: 37px (1 line) or 52.8px (2 lines); right cluster at top +4px | **Fixed.** Ours is always 2 lines on migrated comments because of "(Migrated from github.com)". The small wrap issues are listed below (`crops/pg16-hdrs-390.png`, `repo-issue/states/*-390-comment-menu-open.png`, `*-reaction-picker-open.png`) |
| FG-058 branch refs | `a.ui.green.sha.label`: 20px tall, padding 2px 6px, 12px mono/400, line-height 15px, `rgb(221,244,255)` / `rgb(9,105,218)`, radius 6px, no border | pull/42 `.branch-name`: **22px**, 2px 6px, 12px mono/400, line-height **18px**, same colours, radius 6px | Fixed, but 2px short (issue 4) |
| FG-058 Box widths | compare (playground): branch picker, "1 Commits" header and commit table all x=32, w=1376. The diff-file-box is also 32/1376 (inner header 33/1374 inside its own border, one visible 1px line, `crops/pcf-diffbox-corner-light.png`). Editor header and segment: 337/1071 | flush siblings | **Fixed.** No double borders on compare, editor, labels, settings or admin pages that I checked |
| FG-058 Blankslate | org-settings labels: description 14px muted, centred; select 440px, centred; primary button 16px below. Fine at 1440 and at 390 dark | Primer Blankslate | Fixed. It has no heading and no icon (the builder disclosed this) (`org-settings-labels/light-1440.png`, `crops/osl-390-dark.png`) |
| FG-099 | `.milestone-progress-big` at 390: x=16, w=358, right gutter 16px, 8px tall, radius 6px; doc width 390 | 16px gutter | **Fixed** (`crops/ms-390-light.png`) |
| FG-111 | `/-/admin/users` and `/-/admin/emails` at 390: `background-image: none` (scrollWidth 811 and 539 vs clientWidth 356). compare `commit-table` and `diff-file-body`: also `none` | visible scroll affordance | **Not live anywhere I probed** (`crops/adminusers-rest-light.png`). It depends on DD-SA-1 (filed in docs/requests/pages-settings-admin.md, line 62) |
| DD-W3B-1 | `.ui.label[style]` 12px / **600**, 20px, padding 0 8px, radius full | `prc-Token-IssueLabel` 12px / 600, 20px, 0 8px | **Fixed, identical** (`dd-repo-labels-empty/light-1440.png`) |
| PR-DD-1 | topic 24px, padding 0 12px, 12px/600, line-height 22px, widths 39.6 / 139.3 | TopicTag **25.5px**, 2px 12px, 12px/600, line-height 19.5px, widths 39.6 / 139.3 | Text centred, widths identical, 1.5px short (issue 5) (`crops/topics-ours-light.png`) |

## Issues, most important first

1. **Minor: FG-111 has no visible effect yet.**
   - Where: admin users at 390 (scrollWidth 811 / clientWidth 356) and admin emails at 390 (539 / 356).
   - Both still clip columns with no shade: the computed `background-image` on `.ui.attached.table.segment` is `none`.
   - The pages/settings-admin shorthand wins. The compare `commit-table` and `diff-file-body` are also overridden, by pages/repo and code.
   - Evidence: `crops/adminusers-rest-light.png`.
   - DD-SA-1 is filed, so this is a cross-folder dependency, not a data-display defect.
   - The integrator should apply DD-SA-1 and then re-shoot admin-users at 390, light and dark, at rest and mid-scroll.
2. **Minor: at <768px the author-to-verb gap differs between the opening post and replies.**
   - Where: issues/35 at 390.
   - The opening post author span has no margin: the gap to "commented" is one space, about 4px.
   - Reply authors carry `tw-mr-1` (3.5px) plus the space, about 7.5px.
   - With the new inline flow (FG-046), the flex `gap` no longer evens this out. Visible in `repo-issue/states/light-390-reaction-picker-open.png` (sarkiroka vs pemistahl).
   - Suggested fix: `.comment-header-left > .tw-mr-1 { margin-right: 0 }` inside the same media query.
3. **Minor: review-conversation headers on playground pulls/16 at 390 leave an orphan "ago" on line 2.**
   - The header is 53.3px, and "ago" sits at the left edge under the avatar.
   - github.com wraps the same way but keeps the timestamp together.
   - Suggested fix: `white-space: nowrap` on `relative-time` (or on the `a` wrapping it) inside `.comment-header-left` at <768px.
   - Evidence: `crops/pg16-hdrs-390.png`.
4. **Nit: branch ref height is 20px vs github.com's 22px.**
   - Cause: `line-height: var(--text-caption-lineHeight)` computes 15px. github.com `.branch-name` computes 18px (pull/42, measured today).
   - `--text-body-lineHeight-small` (18px for 12px) would match.
   - The octicon has margin-right 4px; Primer uses `margin: 1px -2px 0 0` plus a space. That is within tolerance.
5. **Nit: topic pill is 24px vs TopicTag's 25.5px.**
   - The builder chose 24px, the older Primer spec. Widths match to 0.1px.
   - Padding `2px 12px` with line-height 19.5px would match exactly.
6. **Nit: two new raw px spacing values** (the lint allows them, but the brief says spacing comes from tokens):
   - `labels.css:243 padding: 2px var(--base-size-6)`
   - `timeline.css:243 padding-top: 2px`
   - Both should be `var(--base-size-2)`.
   - Older ones remain: `labels.css:279,312`, `list-rows.css:79,162`, `progress.css:41`, `timeline.css:58,118,208,209`.
7. **Nit, out of scope, noted:**
   - The migrated-author header still shows Gitea's MigrationIcon (octicon-mark-github). That is the icons/templates folders' call.
   - The Blankslate has no heading or icon.

## Regression spot checks (flush Box change, site-wide)

- No overhang or double border on:
  - compare (both pages)
  - web editor: tabular header and segment at 337/1071
  - user keys and repo settings (Subhead, 392/936)
  - repo labels (`dd-repo-labels-empty/light-1440.png`)
  - admin users and emails
  - PR conversation (`crops/pull-dark-1440.png`)
- The diff-file-box keeps one 1px border (`crops/pcf-diffbox-corner-light.png`).

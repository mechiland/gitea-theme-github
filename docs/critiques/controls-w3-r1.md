# Critique: controls, wave 3, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.
Mode: real captures (theme registered; `appearance.htmlTheme = github-auto`), not PREVIEW.

## Verdict
- **Score: 8.6 / 10. Pass** (≥ 8.5, 0 console errors, 0 literal colours on controls surfaces, smoke green 12/12).
- Both w3-r0 blockers are fixed and verified by my own measurements and screenshots:
  - Dropzone: token-only dashed box, no more off-palette `rgba(0,0,0,.8)`.
  - Input groups: input and attached button now share one height on every group I measured.
- Buttons, focus rings, hover and press states are still pixel-identical to github.com. I re-sampled 6 states × 2 schemes against a fresh github.com capture.
- What keeps the score below 9: one seam regression caused by change (4), which shrank the issue/milestone/project filter text to 12px while github.com uses 14px. The new dropzone also has no keyboard focus indicator. The rest are nits.

## Hygiene (my own runs)
| Check | Result |
|---|---|
| `node build/lint.mjs controls` | 0 errors, 0 warnings, 380 selectors |
| `npm run build` → `dist/build-report.json` | `folders.controls = {status: ok, lintErrors: 0, lintWarnings: 0, files: 11, bytes: 62166}`. The build prints OVER BUDGET for the three theme files (388–399 KB); that is a whole-build issue, not controls |
| Served vs dist | `theme-github-{auto,light,dark}.css` SHA-256 is the same in dist and on :3000 (auto `093db45d9e22…`), so I did not deploy |
| grep src/controls | No hex, rgb() or hsl() outside a comment (`dropzone.important.css:5` quotes the library rule). No `!important` outside `*.important.css` |
| Shoot: 30 routes × light/dark × 1440/390, `--states --measure` → `shots/critic-controls-w3r1/` (routes: `shots/critic-controls-w3r1-routes.json`, which adds packages-org, package-versions, upload-file and wiki-new) | 120 pages. 0 console errors, 0 failed requests, 0 unresolved vars, 0 pages with unlayered Gitea CSS, maxCLS 0.034 |
| Off-palette | Only `#rel-container > svg` fill `#000` on graph (4 pages): code folder. **0 on controls surfaces**; the dropzone is clean on release-new, upload-file and issue pages |
| Non-Octicon icons | `gitea-colorblind-*` (appearance), `fontawesome-openid` (login/signup) and `gitea-npm` (packages): icons folder |
| State failures | milestones `search-btn-hover` timed out (tooling: `.first()` hits a hidden element), so I measured it with my probe. repo-home `star-focus`/`watch-focus` are not focusable because Gitea renders `<a role=button>` without `href`. Both are known and not theme defects |
| Reference: github.com logged out → `shots/critic-controls-w3r1-ref/` | login, repo-home, repo-issues-grex, milestones, issue-view, repo-file with states and measure: 24 pages, 0 errors. Nothing was submitted |
| Smoke: `node tools/shoot/smoke.mjs --theme github-auto` | **Green**, 12 of 12 steps, 0 console errors. Log: `shots/critic-controls-w3r1-smoke.log`; final screenshot: `shots/20260930-050854-smoke-github-auto/final.png` |

**Process note (my error):** I first started smoke in parallel with the shoot and then killed it with `pkill -f tools/shoot/smoke.mjs`. It stopped after `switch-theme-alt`, which left the admin theme on gitea-auto for about 15 seconds. The restarted shoot put it back to github-auto, and the later sequential smoke ended on github-auto.
- I also ran `pkill -f tools/shoot/shoot.mjs`. That pattern would have killed any other agent's shoot run in flight at that moment.
- Any capture another agent took between about 04:59:54 and 05:00:30 may show gitea-auto. It should be re-run.

## Builder's claims, checked
| # | Claim | My result | Evidence |
|---|---|---|---|
| 1 | Dropzone is token-only, dashed, radius 6, padding 16, `--bgColor-muted`, min-height 0 | **Confirmed.** release-new and upload-file are 55px high: 1px dashed `#d1d9e0` / `#3d444d`, radius 6, padding 16, bg `#f6f8fa` / `#151b23`. The issue composer is unaffected (pages file bar, 35px) | `probe1/relnew-dz-{light,dark}.png`, `upload-dz-*`, `issue-dz-*` |
| 2 | Input groups: equal heights, square buttons | **Confirmed.** milestones 32/32×32, projects 32/32×32 (also at 390), repo home 32/32×32, issues 32/32×32, packages and package versions 28/28/28×28 | `probe1/{ms,proj,home,iss,pkg,pkgv}-ig-*.png`, `proj-390-*.png` |
| 3 | APP-C1: small Select is 28px, 8px leading padding, 12px text | **Confirmed.** The package "Type" select is 120×28, padding 3 32 3 8, 12/20. It is joined (-1px, radius 0) | `probe1/pkg-ig-dark.png` |
| 4 | Small inputs are 12px | True, but see **issue 1** (seam regression) | |
| 5 | Date input baseline | **Confirmed.** A date input and a text input with the same value, side by side at 2x, share one baseline. "yyyy" is not clipped | `probe2/due-cmp-{light,dark}.png` |
| 6 | settings/branches at 320/390 | **Confirmed:** no horizontal scroll. At 320 the Select is **281**px (the builder said 283) and the button wraps. At 390 they share one row: Select 166.9, button 176.1. See nit 5 | `probe1/sb-{320,390}-*.png`, `sheets/sb-390-light.png` |
| 7 | Text-only `.ui.icon.button` uses Primer padding | **Confirmed with injected markup:** tiny 140.7×28 with 8px padding, medium 166.1×32 with 12px; the icon-only button stays 32×32 | `probe2/ib-{light,dark}.png` |
| 8 | Last-child margin-right is 0 | **Confirmed.** A 30-route scan at 1440 and 390 found no adjacent standalone buttons touching. The remaining 3.5px margins are on non-last buttons (Update Avatar, Commit Changes, add-code-comment), which is intended spacing. The only "touch" is the joined Labels\|Milestones group (-1px, intended) | `shots/critic-controls-w3r1-margin.log` |
| 9 | SegmentedControl icons are 16px; the graph Select fits the 28px track | **Confirmed:** file-view toggle 56×28 with 16×16 icons; graph Select 250×28 | `probe1/seg-*.png`, `graph-seg-*.png` |

## Ours vs github.com (dominant pixel colours of the state clips, 1440, fresh reference)
| State | light | dark |
|---|---|---|
| Code hover | (28,129,57)/(28,114,54): identical | (41,144,59)/(72,160,88): identical |
| Code pressed | (25,121,53)/(26,108,51): identical | (46,154,64)/(77,169,92): identical |
| Code focus-visible | ring (9,105,218): identical | ring (31,111,235): identical |
| Branch hover | (239,242,245)/(209,217,224): identical | (38,44,54)/(61,68,77): identical |
| Branch focus-visible | (9,105,218): identical | (31,111,235): identical |
| Go to file focus | (9,105,218): identical | (31,111,235): identical |

Sheets: `shots/critic-controls-w3r1/sheets/{login,repohome,settings,misc}.png`.

## Issues (ranked)

### 1. MINOR (seam regression from change 4): the issues, milestones and projects filter inputs are 32px high with 12px text
- **Where:** `/octo-org/grex/issues`, `/octo-org/grex/milestones`, `/octo-org/theme-playground/projects`, in both schemes at 1440 and 390.
- **Selector:** `.list-header-search .ui.small.action.input > input`.
- **Measured:** 32px high, **12px** text, padding 0 8 0 12. In w3-r0 the same input was 14px (`shots/critic-controls-r0/repo-issues-grex/light-1440.measure.json`). github.com's issue filter is 32px at **14px**.
- **Cause:**
  - pages/issues-prs (`src/pages/issues-prs/list.css:20`) upsizes the height and padding to medium but not the font-size.
  - Controls' new `.ui.form .ui.small.input > input { font-size: small }` now wins over the old `.ui.form input` 14px.
  - The result is a mixed-size control: a medium box with small text.
- **Fix:**
  - Preferred, in pages/issues-prs: add `font-size: var(--text-body-size-medium)` to that rule.
  - Or, in controls: size small inputs only when the input is not overridden. That is not possible in CSS, so the fix belongs to pages. Controls should tell pages/issues-prs, because change 4 caused it.
- **Evidence:**
  - `probe1/iss-ig-light.png` and `sheets/ms-top-light.png`
  - `probe1/results.json`: iss/ms/proj input font `12px/20px`, h 32

### 2. MINOR (a11y): the dropzone's click target has no keyboard focus indicator
- **Where:** `/octo-org/theme-playground/releases/new` and `/_upload/main/`, in both schemes.
- **Selector:** `.ui.dropzone .dz-message .dz-button`.
- **Measured:** with keyboard focus (`:focus-visible` true) the outline style is `none`, and nothing changes on screen.
- **Cause:** the lazy unlayered library CSS sets `.dropzone .dz-message .dz-button { outline: inherit }` at specificity 0,3,0. That beats `button:focus-visible` and foundation's layered ring. Gitea's own theme has the same defect, but controls now owns this surface through `dropzone.important.css`.
- **Fix (token-only, in `dropzone.important.css`):**
  `.ui.dropzone .dz-message .dz-button:focus-visible { outline: var(--focus-outline-width) solid var(--focus-outlineColor) !important; outline-offset: var(--focus-outline-offset) !important; border-radius: var(--borderRadius-small) }`
  (outline is not display or visibility, so it is allowed in an important file).
- **Evidence:** `probe2/dz-focus-{light,dark}.png`, `probe2/results.json` (`fv: true`, outline `none`).

### 3. NIT: dropzone hover stays muted
- The text colour only moves from muted to default (Gitea `!important`).
- github.com attach areas make the text link blue (`--fgColor-accent`) on hover.
- **Evidence:** `probe1/relnew-dz-hover-light.png`.

### 4. NIT (seam, pages/issues-prs): the issue sidebar "Add dependency…" group is uneven
- The select is 293×**32** and the joined "+" button is 28×**28**. The button's bottom edge sits 4px above the select's.
- **Cause:** pages sets sidebar `.ui.button` to 28px but leaves the `.ui.search.selection.dropdown` at controls' 32px min-height.
- **Fix:** in pages/issues-prs, add the sidebar dependency selection to its small rule, or give it the `small` class behaviour through `.issue-content-right .ui.action.input > .ui.selection.dropdown { min-height: var(--control-small-size) }`.
- **Evidence:** `sheets/sidebar-zoom.png` (from `shots/20260930-050854-smoke-github-auto/final.png`) and the eval output in this session.

### 5. NIT: the settings/branches row carries a 15px gap, and at 320 the Select stops 7px short of the right edge
- **Cause:** Gitea's `tw-mr-2` (7px) is added to the row gap of 8px.
- **Measured:** at 390 the Select ends at 182.9 and the button starts at 197.9. At 320 the Select's right edge is 297 against a 304 column.
- **Expected:** Primer rows use one 8px gap.
- Tailwind is `!important` in Gitea, so the fix needs a `.important.css`. It is optional.

### 6. NIT: the default-branch Select shows its value in placeholder colour
- The value `main` renders in `--fgColor-muted` because Gitea puts it in `.default.text` (`templates/repo/settings/branches.tmpl:19`).
- A Primer Select with a value uses `--fgColor-default`.
- Fixing this means treating `.default.text` inside a selection that has a non-empty hidden input as a value. That is a template/semantics question, so it is optional.

### 7. NIT: the commit-graph Select in the SegmentedControl track uses 14px text in a 28px control
- **Measured:** 250×28 at 14/20.
- A small Select, which the graph's tiny group implies, is 12px.
- The Mono/Color IconButton gutter was already forwarded to pages/repo.

### Seen, not scored against controls
- Page sizing: login at 40px/16px matches github.com's login (352×40, 16px input). Projects "New Project" is 28px next to the 32px search (pages/actions-packages-projects).
- Graph svg `#000` fill (code). Non-Octicon icons (icons folder).

## Measurements (1440; ours vs github.com unless noted)
| Control | Property | Ours | github.com / Primer | OK |
|---|---|---|---|---|
| Code (primary) | box / radius / font | 108.9×32, r 6, 14/500 | 108.9×32, r 6, 14/500 | yes |
| Code (primary) | bg / border / shadow, light | `#1f883d` / rgba(31,35,40,.15) / 0 1px 1px .04, 0 1px 2px .03 | same | yes |
| Code (primary) | bg / border, dark | `#238636` / rgba(255,255,255,.15) | same | yes |
| Code | line-height | 20px | 21px | nit |
| Hover/press/focus (6 states × 2 schemes) | dominant pixels | identical | identical | yes |
| Login primary | box | 352×40, r 6, 14/500 | 352×40, r 6, 14/500 | yes |
| Login input (focused) | border / ring | 1px `#0969da` + 2px outline offset -1 | 1px `#0969da` + 1px inset ring (Primer CSS) | yes |
| Login input | height / font | 40 / 16px | 40 / 16px | yes |
| Checkbox | size / r / border | 16 / 3 / `#818b98` (`#656c76` dark) | Primer 16 / 3 / control-borderColor-emphasis | yes |
| Input group, milestones | input / button | 32 / 32×32 | equal, square | yes |
| Input group, projects (1440 and 390) | input / button | 32 / 32×32 | equal, square | yes |
| Input group, repo home | input / button | 32 / 32×32 | 32×32 IconButton | yes |
| Input group, packages | input / select / button | 28 / 28 / 28×28 | equal | yes |
| Small Select (APP-C1) | h / padding-left / font | 28 / 8 / 12px | Primer Select small 28 / 8 / 12 | yes |
| Issues filter input | font-size | 12px (w3-r0: 14px) | 14px | **no** |
| Issues filter input | height | 32 | 32 | yes |
| Dropzone (release-new) | border / r / padding / h | 1px dashed `#d1d9e0`, r 6, 16, 55px | quiet dashed token box | yes |
| Dropzone button | focus-visible | no outline | 2px accent ring | **no** |
| Date input | text baseline vs text input | 0px difference | same baseline | yes |
| Text-only icon button (injected) | padding tiny / medium | 8 / 12 | Primer 8 / 12 | yes |
| SegmentedControl (file view) | box / icon | 56×28, icon 16 | icon 16 | yes |
| settings/branches at 320 | Select width, h-scroll | 281px, 0 | no overflow | yes |
| settings/branches at 390 | Select–button gap | 15px | 8px | nit |
| Sidebar dependency group | select / button height | 32 / 28 | equal | nit (pages) |
| Counter | box / font | 20 high, 12/500/18 | same | yes |

## Artifacts
- **Routes:** `shots/critic-controls-w3r1-routes.json`.
- **Runs:** `shots/critic-controls-w3r1/` and `shots/critic-controls-w3r1-ref/`, with logs `shots/critic-controls-w3r1{,-ref,-smoke}.log`.
- **Probes:**
  - `shots/critic-controls-w3r1-probe.mjs` and `-probe2.mjs`, with tasks `-tasks{1,2}.json` (output in `probe1/` and `probe2/`)
  - `-eval.mjs`
  - `-margin.mjs`
  - `-grid.py` (sheets in `shots/critic-controls-w3r1/sheets/`)

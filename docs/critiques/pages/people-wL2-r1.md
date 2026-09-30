# Critique: pages/people, wave L2, round 1 (final gate #2)

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.7 / 10. Pass** (≥ 8.5, 0 console errors, 0 literal colours, smoke green).

| gate | result |
|---|---|
| lint (`node build/lint.mjs pages/people`) | 0 errors, 0 warnings, 338 selectors |
| build | `folders["pages/people"]`: status ok, 12 files, 67,632 bytes. The whole build is over budget (auto 308.3 KB, light 303.3, dark 304.3), but that comes from all folders together; other folders were building at the same time. |
| served CSS | Served and dist differ only by concurrent builds of other folders (315,686 vs 315,4xx–315,695 bytes). The served file contains this round's rules (`"README.md"`, `"Organizations"`), so I did not deploy. |
| shoot (7 routes × light/dark × 1440/390, `--states --measure`) | 28 pages, 0 problems, 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, max CLS 0.0117 (home 390) |
| states | 96 state PNGs, 0 `-FAILED` |
| smoke | **green**: 14/14 steps ok, 0 console errors (`shots/20260930-164436-smoke-github-auto/`) |

## Evidence
- Run: `shots/critic-pages/people-wL2-r1/`. Routes: `shots/critic-pages/people-wL2-r1-routes.json`. I added user-profile `block-hover` (1440 and 390), `block-focus` and `org-avatar-hover`.
- Probes:
  - `people-wL2-r1-probe.mjs`: ours, all 4 scheme×viewport combinations. Output in `people-wL2-r1-probe.json`, typed-filter PNGs in `people-wL2-r1-probe/`.
  - `people-wL2-r1-probe2.mjs`: explore rows and the org README.
  - `people-wL2-r1-gh.mjs`: github.com pemistahl, mojombo (1440 and 390) and microsoft (390). Output in `people-wL2-r1-gh.out`.
- Crops: `shots/critic-pages/people-wL2-r1-crops/`:
  - `cap-{light,dark,gh}-zoom.png`
  - `side-{ours,gh}.png`
  - `up-l390-top.png` and `gh-up-l390-top.png`
  - `filter-sheet.png`, `states-sheet.png`
  - `home-*`, `eu-l390.png`, `orghome-l390.png`
- Reference: re-captured `docs/reference/{user-profile,org-home,user-profile-stars-tab}` with `--measure`.

## Builder claims checked
| claim | verdict | evidence |
|---|---|---|
| Dashboard filter at rest | **done** | Autofocused and empty (`:focus-visible` true): border 209,217,224 (dark 61,68,77), no outline. Typed "gr": border 9,105,218 and a 2px solid accent outline, offset −2 (dark 31,111,235). `filter-sheet.png` |
| Explore rows top-aligned | **done** | Users and orgs, 1440 and 390: avatar y = title y on every row (153/153, 232/232 …; 390: 201/201, 324/324). align-items is flex-start. `eu-l390.png` |
| Teams counts column | **done** | "N members · N repositories" starts at x=1098.8 on all 3 rows. Leave starts at 1259.4. `org-teams/light-1440.png` |
| Block user 14px, vcard pitch | **done** | 14/400/21, `--fgColor-muted`. vcard rows are 29px apart (630/659/688/717). github.com: 25px rows, 29px apart. The follower line bottom to the first detail's text is 20px on both. |
| Org README 390 padding | **agree, no change** | Ours: box x=16, padding 24, content x=41. github.com/microsoft at 390: box x=16, body padding 24, article x=41. Identical. |
| FG2-057 README caption | **done (partial)** | 12/18 mono, 16px margin-bottom. "README" default and ".md" muted in light and dark (zoomed). Our first heading is at y=227; github.com's article is at y=228. github.com's caption is "pemistahl / README.md", where the user name is default and "/" and ".md" are muted. The "user /" part is still missing (template). |
| FG2-094 Organizations heading | **done** | 16/600/24, `--fgColor-default`. Section rule `--borderColor-muted` (rgba 209,217,224,0.7), padding-top 16. The heading-to-avatar gap is 9px against github.com's 8px (1px: Gitea's 3px `.user-orgs` li padding). |

## Issues, ranked
1. **Minor (a11y trade-off, dashboard filter).** A keyboard user who Tabs or clicks into the empty "Search repos…" filter gets no visible focus indicator, only the caret.
   - Probe `filterFocusEmpty` / `filterClickEmpty`: border `--borderColor-default`, outline none, in both schemes.
   - Primer and github.com always show the 2px accent ring on a focused input (github.com never autofocuses this field).
   - The builder documented this. It does not fully meet WCAG 2.4.7.
   - Cheaper compromise: keep the ring off only until the first user interaction, which needs JS. Or keep a 1px accent border without the ring; C002 objected to that. Record it as a known trade-off.
2. **Minor (CSS-only, cheap): the org home README has no "README.md" caption.**
   - github.com org READMEs show `text-mono text-small mb-3` "README.md" as a single default-colour link (microsoft at 390: 12/18 mono at x=41, 16px above the content).
   - For orgs there is no user-name part, so the caption FG2-057 added for `.user.profile` would be a *complete* match on `.organization #readme_profile`.
   - Ours: `#readme_profile::before` content `""` on /octo-org (`orghome-l390.png`).
3. **Minor (known, not tuned): profile at 390 has a 32px gap between Follow and the Organizations rule.** github.com has 16px (pemistahl 390: Follow bottom 371.5 → rule 388). Ours: Follow bottom 424 → rule 456. `up-l390-top.png` vs `gh-up-l390-top.png`.
4. **Minor (template, PPL-T1): follower counts are not bold, and the labels are capitalised** ("3 Followers"). github.com: "**297** followers", with the count 600 `--fgColor-default`.
5. **Minor carry-over (wL1-r2 #1): phone dashboard CLS.** The seed now lists 9 repos (a new `ai/jiri-new`), and home 390 CLS went from ≈0 to 0.0117 (source `div.flex-container-main`). The fixed 445px reservation still fits only 8 rows. Small here, but at 15 rows it is about 0.11, as measured last round.
6. **Nit: "Block user" is 400.** github.com's `Button--link` "Block or report user" is 14/**500**/21 muted. Hover matches github.com (muted plus underline, checked live).
7. **Nit: the follower-line icon is octicon-person.** github.com uses octicon-people. This could be masked in CSS, like the Overview book icon.
8. **Nit (carry-over): the profile tab bar starts 16px left of github.com's** (x=432 vs 448). The UnderlineNav item itself matches exactly: 103.141×30 on both.

## What is good
- Every claim I checked holds, with numbers, in light and dark at 1440 and 390.
- The README caption's colour split is exact: the 6ch stop falls between "README" and ".md", and its vertical rhythm matches github.com within 1px.
- Organizations heading, section rules, vcard pitch, Follow button (32px, r6, `--button-default-bgColor-rest`, 14/500) and Block hover match github.com.
- 0 off-palette, 0 unresolved vars, 0 console errors across 28 pages and 96 states, and the smoke test is green.

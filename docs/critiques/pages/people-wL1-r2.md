# Critique: pages/people, wave L1, round 2 (final gate #1)

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.6 / 10. Pass** (≥ 8.5, 0 console errors, 0 literal colours, smoke green).

| gate | result |
|---|---|
| lint (`node build/lint.mjs pages/people`) | 0 errors, 0 warnings, 334 selectors |
| build | `folders["pages/people"]`: status ok, 12 files, 66,331 bytes |
| budget (shared, all folders) | over: auto 338.6 KB, light 333.3 KB, dark 334.5 KB (not this folder alone) |
| served CSS | `dist/theme-github-auto.css` = served file, sha1 a48367a3…, so I did not deploy |
| shoot (13 routes × light/dark × 1440/390, `--states --measure`) | 52 pages, 0 problems, 0 console errors, 0 failed requests, 0 off-palette, 0 unresolved vars, 0 non-Octicon icons, max CLS 0.0024 |
| states | 102 state captures (`--states`), 0 `-FAILED` |
| smoke (`tools/shoot/smoke.mjs --theme github-auto`) | **green**: 13/13 steps ok, 0 console errors (`shots/20260930-131626-smoke-github-auto/`) |

## Evidence
- Run: `shots/critic-pages/people-wL1-r2/`. Routes file: `shots/critic-pages/people-wL1-r2-routes.json`.
  - I dropped the stale navbar menu states, which belong to the navigation folder.
  - I fixed the explore `row-link-hover` and members `member-btn-*` selectors, and added an org `tab-hover` state.
- Crops and contact sheets: `shots/critic-pages/people-wL1-r2-crops/` (`states-{light,dark}-{0,1,2}.png`, `teams-*.png`, `home-*390-top.png`, `notif-*390-top.png`, `orghome-*`).
- Probes (read-only):
  - `people-wL1-r2-probe.mjs`, output in `people-wL1-r2-probe-gitea-{light,dark}-{1440,390}.json`.
  - `people-wL1-r2-gap.mjs` (teams gap and org sidebar spacing).
  - `people-wL1-r2-cls.mjs`: the dashboard with the `/repo/search` response rewritten to N rows. Screenshots are in `people-wL1-r2-probe/`.
- The github.com references are today's `docs/reference/{user-profile,org-home,org-members,...}`.

## Builder claims checked
| # | claim | verdict | evidence |
|---|---|---|---|
| 1 | Phone dashboard: no nested scroller | **done** | All 8 rows are visible at 390 in light and dark (`crops/home-l390-top.png`). The probe finds 0 scrollers. CLS is 0.0000147, caused only by `loading-icon` 227→223. |
| 2 | Org sidebar headings 16/400 | **done** | "Members" and "Teams" are 16/400/24 (the `strong` is 400 too), with 16px padding-bottom. This matches github.com "People" at 16/400/24. |
| 3 | Follower counts bold | not done (template, PPL-T1) | Still 14/400 `--fgColor-muted`. github.com: the number is 14/600 `--fgColor-default`. |
| 4 | Org Overview home icon and Projects table icon | **done** | Seen in `orghome-l1440-top.png`, with 16px glyphs. |
| 5 | Teams alignment and Leave gap | **done** | Avatars are at x=1015 in all 3 rows. The counts end at 1251.4 and Leave starts at 1259.4, an 8.0px gap. Hover (danger fill) and focus (2px accent ring) are correct at 1440 and 390. |
| 6 | Phone heatmap insets | **done** | Weeks clip 16px inside the 1px outline on home and on the Public Activity tab, in light and dark. |
| 7 | Notifications at 390: same-height toolbar | **done** | Mark all as read and the SegmentedControl are both 32px, in the same row. The track, knob and hover colours match the Primer tokens (dark track #010409 = `--controlTrack-bgColor-rest`, knob `--controlKnob-bgColor-rest`). |
| 8 | Org home CLS | **done** | 0 on all 4 org-home captures. The run's max is 0.0024 (explore/profile repo lists). |

## Issues, ranked
1. **Minor→major (real-world CLS), phone dashboard with a list size other than 8.** The fixed 445px reservation only fits the seed. I measured it with `people-wL1-r2-cls.mjs` (390, light, `/repo/search` rewritten):

   | rows | CLS | feed y (CSS px) | what happens |
   |---|---|---|---|
   | 8 (seed) | 0.0000147 | 560 | no shift |
   | 2 | **0.1125** | 560 → 386 | feed moves up |
   | 15 + pager | **0.1091** | 560 → 810 | feed moves down |
   | 0 | 0 | 560 | 445px block stays, with about 250px of blank space under "There are no repositories yet." (`people-wL1-r2-probe/home-390-light-N0.png`) |

   - 15 rows is Gitea's page size, so any active user with 15 or more repos exceeds the 0.1 "good" CWV threshold on every phone dashboard load.
   - It is still far below the built-in 0.375, so FG-067's hard limit is met; "ideally ~0" is met only for the seed.
   - Suggestions:
     - Reserve for the page-size case (15 rows plus pager, about 695px), because users with many repos are the common case. For short lists, accept the upward shift or use `min-height` only.
     - Drop the reservation for the empty state, which has no `.repo-owner-name-list` but does have `.empty-repo-or-org`, so `:has()` can reach it.
2. **Minor (template, integrator PPL-T1): follower counts are not bold.** See claim 3.
3. **Nit: the profile tab bar starts 16px left of github.com.** The first item is at x=432; github.com's is at 448. Not addressed; the builder knows about it.
4. **Nit (navigation surface): at 390 the active profile tab can sit inside the overflow "…".**
   - On Public Activity the only cue is the coral underline under "…" (`crops/activity-d390-members-l390.png`).
   - github.com's UnderlineNav scrolls horizontally and keeps the selected tab visible.
   - This belongs to overflow-menu, not this folder, but it is visible on the people pages.
5. **Nit (accepted in r1): dashboard repo search focus.** It shows an accent 1px border only. The other search inputs on these pages show a 2px focus ring (`home/states/*-search-focus-clip.png` vs `explore-repos/states/*-390-search-focus-clip.png`).
6. **Nit (not CSS-doable, recorded):** "Public archive" and "Public template" labels. FG-053, the README "user / README.md" caption, is a template item.
7. **Nit:** the profile Repositories Filter menu keeps Gitea's radio rows (Archived / Not Archived…). github.com uses Type / Language / Sort menus with check marks. This is Gitea's markup and is acceptable.

## What is good
- Every r1 issue that CSS can fix is fixed and verified by pixel and computed-style checks.
- Hover, focus-visible and press states render correctly in light and dark across the dashboard, notifications, explore, profile, org, members and teams: 102 captures, none failed.
- Profile and org UnderlineNav items match github.com exactly (103.1×30, pad 0 8, 14/600/30, r6). CounterLabels match: 20h, pad 0 6, 12/500/18, `--bgColor-neutral-muted`.

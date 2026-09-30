# Critique: pages/people, wave L1, round 1 (final gate #1)

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.4 / 10. Not a pass.** Pass needs 8.5 or more; the other gates are green:

| gate | result |
|---|---|
| lint (`node build/lint.mjs pages/people`) | 0 errors, 0 warnings, 325 selectors |
| build | folder `status: "ok"`, 63,628 bytes |
| budget (shared, all folders) | over: auto 333.2 KB, light 327.9 KB, dark 329.1 KB |
| served CSS | matches `dist/` byte for byte (sha1 e1f683e8…), so no deploy was needed |
| console errors | 0 |
| failed requests | 0 |
| off-palette colours | 0 |
| unresolved vars | 0 |
| non-Octicon icons | 0 |
| smoke test | **green**: every step ok, 0 console errors (`shots/20260930-124912-smoke-github-auto/smoke.json`) |

The audit covered 52 pages (13 routes × light/dark × 1440/390).

## Evidence

- **Screenshots:** `shots/critic-pages/people-r1/`, from my own routes file `shots/critic-pages-people-routes.json`.
  - Its 12 routes are the 11 briefed routes plus `user-settings` (for the FG-106 check).
  - I added a 13th route, `user-profile-activity-tab` (heatmap), and extra states: mark-all hover/focus/press, SegmentedControl hover/focus, teams link and button hover/focus, members buttons, profile tab hover.
  - Some state files in that folder (e.g. `*-action-focus-FAILED.png`) are older and not from my run.
- **Crops:** `shots/critic-pages/people-r1-crops/`.
- **Computed-style probes:** `shots/critic-pages/people-r1-probe-{gitea,github}-*.json`, produced by `shots/critic-people-probe.mjs` (read-only; github.com logged out, no clicks).
- **Settings and scroller probe:** `shots/critic-people-settings.mjs`.

## Builder claims checked

| item | verdict | evidence |
|---|---|---|
| FG-067 home CLS at 390 | **done**, CLS 0 in both schemes, but see issue 1 | `home/*-390.json`: cls 0 / 0 |
| FG-047 notifications | **done** | CounterLabel 20px, 12/500, bg `--bgColor-neutral-muted`, transparent border. Mark all as read is 28px, 12/500, padding 0 8px, default-button colours. SegmentedControl track `--controlTrack-bgColor-rest` with a knob and 1px border. Hover, focus and press all look right (`crops/notif-states.png`). |
| FG-052 Follow button text only | **done** | 296×32, 14/500, no svg. github.com: 296×32, 14/500. |
| FG-052 Overview book icon | **done**, better than the builder claimed | The `--gh-octicon-book` mask now exists (icons shipped it). The profile Overview tab shows the book in every capture. |
| FG-052 topic tags | **done** | 24px, padding 0 10px, 12/500/22, pill radius. github.com: 24px, 0 10px, 12/500/22. |
| FG-052 follower counts bold | **not done** (template) | Ours 14/400 muted. github.com: the number is 14/600 in `--fgColor-default`. |
| FG-077 Public label | **done** | 49.6×20, padding 0 6px, 12/500/18, 1px `--borderColor-default`, muted text. It matches github.com exactly (49.6×20). Present on org home and profile Repositories; absent on Stars. |
| FG-080 explore users/orgs as one Box | **done** | One Box with radius 6 and a 1px default border; rows divided by `--borderColor-muted`. The sidebar rule runs to the footer. |
| FG-083 heatmap fill | **done** | Dashboard 1440: the svg is 980px wide inside a 1012px Box. Profile Public Activity 1440 also fills (`crops/activity-l1440.png`), which the builder had not checked. |
| FG-083 autofocus ring | **partial, accepted** | Accent border only, no 2px ring (`home/states/*-search-focus-clip.png`). |
| FG-101 org People rows | **done** | Desktop rows 80/81px (github.com: 81). Phone rows 116/117px. Avatar 48, name 16/400, 2FA as a muted Label. |
| FG-102 org Teams | **done** | One Box with a row per team; phones stack. See issue 5. |
| FG-104 explore separators | **done** | The hover underline covers "Go" only, not the ' · ' (`crops/misc-states.png`). |
| FG-106 settings header | **done** | The header and nav are at y=163 on /user/settings, /account, /appearance and /security (1440). The builder's "88" was measured on a different element; the pages are consistent. |

## Issues, ranked

1. **Major: dashboard at 390, the repo list is a nested scroller that hides rows with no cue.**
   - Probe: `#dashboard-repo-list .ui.attached.table.segment` has `overflow-y: auto`, scrollHeight 232 against clientHeight 171.
   - So 2 of the 8 seeded repos (`admin/jiri`, `ai/jiri`) are below the fold of an inner scroller.
   - Nothing shows that more rows exist: no fade mask, no shadow, and overlay scrollbars on touch (`crops/home-l390-top.png`, `home-d390-top.png`).
   - Users with fewer than about 6 repos get blank space instead.
   - github.com never nests a scroller in the dashboard's Top repositories. It shows N rows plus a "Show more" button.
   - CLS 0 is real, but it was bought with lost discoverability.
   - Options:
     - add a bottom fade mask and scroll-shadow on that scroller, using a `mask-image` gradient built from tokens;
     - or reserve the height with `min-height` only, not a fixed `height`, and accept the small shift;
     - or size the reservation for 8 rows (29px each) and let the "Show more" / pagination row live inside it.
2. **Minor, carried over from w3-r2 and still open: the org-home sidebar headings are semibold.**
   - "Members" and "Teams" are 16/**600**/24 (`.profile .five.wide > .top.header`, org.css:109).
   - github.com/go-gitea "People", "Sponsors", "Top languages" measured 16/**400**/24 today, with a 16px bottom margin.
3. **Minor (known, template): follower counts are not bold.** "3 Followers · 2 Following" is 14/400 `--fgColor-muted`. github.com has the numbers at 14/600 `--fgColor-default`. Needs `shared/user/profile_big_avatar.tmpl:21` split into two spans (integrator).
4. **Nit: the org Overview tab keeps Gitea's info icon.**
   - github.com's org Overview uses `octicon-home` (`crops/org-tab-icons.png`).
   - `--gh-octicon-home` already exists in `src/icons/octicon-masks.css`, so this is the same one-liner as the profile book mask, if the org menu is this folder's surface.
   - The Projects tab glyph also differs (Gitea `project-symlink`; github.com `table`).
5. **Nit: org Teams at 1440, the Leave button crowds the counts.**
   - In the Owners row, "5 repositories" ends at x≈1255 and Leave starts at x=1259.4: a 4px gap, where the Primer scale wants 8 or more.
   - That row's avatars and counts sit about 55px left of the other rows (the builder knew about this).
   - Hover (danger fill) and focus-visible (2px accent ring) are correct.
6. **Nit, carried over: the phone heatmap starts flush against the Box border.** The oldest visible week and the "Apr" label touch the left border at 390 (`crops/home-l390-top.png`, x=17 CSS against border x=16).
7. **Nit: notifications at 390 mix control sizes in one row.** "Mark all as read" is 28px (small) next to the 32px SegmentedControl; they are centred, with tops at y=90 and y=88. GitHub pairs same-size controls in a toolbar row; use a medium button at ≥ 390 or a small SegmentedControl.
8. **Nit: org home 1440 CLS 0.024 appears intermittently.**
   - Seen in both schemes of my run and in the builder's r1; 0 in r1b and r1f; the Gitea baseline is 0.
   - Sources: `div.label-list`, `div.item-body`, `div.item.ui.small` at t = 67–107 ms, i.e. first paint of the repo rows.
   - The new "Public" `::before` on `.label-list` is a plausible contributor.
   - Well under 0.1 but not zero.
9. **Nit (edge case, not in the seed): "Public" appears only when Gitea renders no label.**
   - A public archived repo shows only "Archived", where github.com shows "Public archive".
   - A public template shows "Template", where github.com shows "Public template".
10. **Known and accepted, recorded:**
    - FG-053, the README caption, is a template item.
    - The whole-theme budget is exceeded; this is shared, not this folder alone.
    - The home navbar states (create menu, avatar menu, mobile menu) fail in shoot because their selectors target the old navbar. That belongs to navigation/tools.

## Measurements (ours vs github.com, light 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| Follow | box / font | 296×32, r6, 14/500 | 296×32, r6, 14/500 | yes |
| follower count | font / colour | 14/400 muted | 14/600 fg-default | no |
| profile tab | height / font | 30, 14/600 active | 30, 14/600 active | yes |
| profile tab bar | first item x | 432 | 448 | no (16px, nit) |
| topic tag | box / font | 24h, pad 0 10, 12/500/22, pill | 24h, pad 0 10, 12/500/22, r24 | yes |
| Public label | box / font | 49.6×20, pad 0 6, 12/500/18, 1px border-default | 49.6×20, pad 0 6, 12/500/18 | yes |
| org sidebar heading | font | 16/600/24 | 16/400/24 | no |
| org repo name | font | 16/600/24 accent | 16/600/24 | yes |
| members row | height | 80–81 | 81 | yes |
| members avatar | size | 48, round | 48, round | yes |
| members name | font | 16/400/24 | 16/400/24 | yes |
| members 390 row | height | 116–117 (was ~170) | n/a | yes |
| CounterLabel (notifications) | box / font | 21×20, pad 0 6, 12/500/18, neutral-muted | Primer: min-width 20, 12/500/18 | yes |
| Mark all as read | box / font | 129×28, pad 0 8, 12/500, default | Primer small: 28, pad 0 8, 12 | yes |
| SegmentedControl (390) | track / knob | 32h, r6, controlTrack / controlKnob, 1px border | Primer: 32h, r6 | yes |
| notification row | height / padding | 64, 8 16 8 32 | n/a (Primer Box row) | yes |
| heatmap (dashboard 1440) | svg / Box width | 980 / 1012 | fills | yes |
| home 390 repo list | visible / total | 171 / 232px, 2 rows hidden | all rows + Show more | no |
| teams Leave gap | gap to counts | 4px | ≥ 8 (Primer scale) | no |
| home CLS 390 | CLS | 0 / 0 | ≤ 0.1 | yes |
| explore users row | avatar / name | 40 / 16/500 accent | n/a | yes |

## What is good

- Notifications now reads as GitHub's inbox, with the correct Primer components at both widths and in both schemes.
- Profile and org geometry still match github.com closely. The Public label and topic tags match to the pixel.
- The org People list matches github.com's 81px rows.
- Teams and explore users/orgs finally read as one Box each.
- Every hover, focus and press state I captured renders correctly in light and dark.

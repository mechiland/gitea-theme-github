# Critique: pages/auth, wave L1, round 2

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision 16a2e4a586. `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the same
SHA-256 (6026d66b…), so I did not deploy.

## Verdict

**Score: 8.7 / 10. PASS on the design bar, with nits.** It is up from 8.6 because both folder-owned issues from round 1 are fixed.
Raw console errors: 4, all of them the expected 404 document load on `not-found-anon`.

- Lint: `node build/lint.mjs pages/auth` gives 0 errors, 0 warnings and 80 selectors. `npm run build` shows
  `folders["pages/auth"]` as `status "ok"` (13 files, 24,070 B). FYI outside this folder: all three bundles print OVER BUDGET
  (auto is 333.7 KB).
- Literal colours: 0. There are 0 off-palette colours on 24 captures (6 routes × light/dark × 1440/390).
- Unresolved vars: 0. Failed requests: 0. CLS: 0. Pages with problems: 0.
- Console errors: 4. Each is "Failed to load resource: 404" on `not-found-anon/{light,dark}-{1440,390}`, which is the
  route's own `expectStatus: 404` document. The other 20 captures have 0.
- Non-Octicon icons: `fontawesome-openid`, 16 occurrences (login, signup, openid). It is the icons folder's brand-glyph exception.
- Smoke: **green**, 12/12 steps, 0 console errors (`shots/critic-pages/auth-wL1r2-smoke.log`).

## Evidence

- Ours: `shots/critic-pages/auth-wL1-r2/`, captured with `--states --measure` using the routes file
  `shots/critic-pages/auth-wL1r2-routes.json`. That file is my round 1 file plus provider-hover and provider-focus states and
  divider/provider/primary/openid-intro measures.
- github.com/login (logged out): `shots/critic-pages/auth-wL1-r2-ref/login/`. The provider states FAILED there because of a
  selector mismatch, so the computed-style probe below replaces them.
- Positions: `shots/critic-pages/auth-wL1r2-pos.txt` (round 1 script `auth-wL1-pos.mjs`, both targets).
- Computed states: `shots/critic-pages/auth-wL1r2-probe.txt` (script `auth-wL1r2-probe.mjs`). It covers rest, hover,
  keyboard focus and pressed for the primary and provider buttons, plus input focus, in light and dark. The pressed state
  uses mouse-down only, on a throwaway page. Nothing was clicked or submitted on github.com.
- Contact sheets: `shots/critic-pages/auth-wL1r2-states.png` (ours and github side by side for the primary and input states)
  and `shots/critic-pages/auth-wL1r2-hdr-states.png` (hamburger and mark hover/focus/press on login, signup and recover,
  4 scheme/viewport combos each).

## Builder claims checked

| claim | result |
|---|---|
| "or" divider 20px below primary, 20px above provider (login 400→420, 441→461) | **confirmed**, identical at 1440 and 390 |
| sign-up 526→546, 567→587 | **confirmed** |
| github.com/login 364→384, 405→425 | **confirmed** |
| OpenID intro centred | **confirmed** (`openid-signin/light-1440.png`, `dark-390.png`) |
| forgot-password still full bar with the logo twice; gh_head_navbar.tmpl:11 lacks `.IsResetDisable` | **confirmed** (`forgot-password/dark-1440.png`; template line 11 read) |
| PA-L1-1 reminder and PA-L1-2 filed | **confirmed** (docs/requests/integrator.md lines 465-470) |
| lint 0/0 with 80 selectors, deploy current | **confirmed** |
| 0 problem pages, 0 failed requests, CLS 0, 4 expected 404 console errors | **confirmed** |

## Measurements, ours vs github.com/login (1440; light unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| primary → divider | gap | 20 (400→420) | 20 (364→384) | yes |
| divider → provider | gap | 20 (441→461) | 20 (405→425) | yes |
| divider | text | 14/400/21, fgColor-default | 14/400/21 | yes |
| mark | box | 696,46 48×48 (171 at 390) | same | yes |
| title / label / input | top | 108 / 162 / 187 | 108 / 162 / 187 | yes |
| primary | top | 360 | 324 | no (Gitea's "Remember This Device" row, content) |
| primary | box, radius, padding | 352×40, r6, 16px | 352×40, r6, 16px | yes |
| primary | bg rest/hover/active (light) | #1f883d / #1c8139 / #197935 | same | yes |
| primary | bg rest/hover/active (dark) | #238636 / #29903b / #2e9a40 | same | yes |
| primary | focus-visible | 2px solid accent, offset -2, inset 3px white | same | yes |
| primary | resting box-shadow | 2-layer shadow | none | nit (controls) |
| provider | box, padding, radius | 352×40, 12px, r6 | 352×40, 12px, r6 | yes |
| provider | bg rest/hover/active (light) | #f6f8fa / #eff2f5 / #e6eaef | same | yes |
| provider | bg rest/hover/active (dark) | #212830 / #262c36 / #2a313c | same | yes |
| provider | border | #d1d9e0 (dark #3d444d) | same | yes |
| provider | focus-visible | 2px solid accent, offset -2 | same | yes |
| provider | icon | 16×16, top+12, fgColor-muted #59636e | 16×16, top+12, button fg #25292e | nit |
| provider | line-height | 20px | 21px | nit (invisible at 40px box) |
| input | focus | 1px accent border + 2px outline at -1px | 1px accent border + 1px inset shadow | yes (same 2px visual) |
| font family | body | system stack | "Mona Sans VF" first | nit (foundation) |

## Issues, most important first

1. **minor (integrator, template): forgot-password still renders the full global header.** `forgot-password`, all
   schemes and widths (`shots/critic-pages/auth-wL1-r2/forgot-password/dark-1440.png`). It shows a 64px bar with the
   hamburger, logo, "Forgot Password" crumb, search, Sign In and Register. The title's 48px ::before logo sits under it, so the logo appears twice. The
   cause is `templates/custom/gh_head_navbar.tmpl:11`, where `$isAuth` does not test `.IsResetDisable`. PA-L1-1 is filed and the CSS
   is ready. The builder was right not to hide Sign In and Register in CSS. FG-063 stays open on this route until the integrator applies it.
2. **minor (content): Gitea copy pushes the form down.** "Remember This Device" (Title Case, and a row github does not have) puts
   the primary at y360 against 324. Titles read "Sign In" and "Register", not "Sign in to …". The Gitea cup is a lighter mark than
   the Octocat. All of this is locale, template or brand content.
3. **nit (navigation-owned): the page footer.** github.com/login ends in a full-width `--bgColor-muted` strip of centred
   links (Terms, Privacy…, stacked at 390). Ours shows Gitea's site footer row: logo, Powered by, GitHub, English,
   Licenses, API, Version. It wraps to 2 lines at 390 (`login/dark-390.png`). `.page-footer` belongs to navigation, not
   this folder.
4. **nit (this folder, optional): the provider button's leading icon colour.** Ours is `--fgColor-muted` (#59636e /
   #9198a1). github.com/login's Apple glyph uses the button text colour (#25292e / #f0f6fc). Primer React's default
   Button also mutes leading visuals, so either choice can be defended. It is listed only for completeness.
5. **nit (deliberate): the hamburger at the top-left.** github.com/login has no header control. Ours is a correct
   invisible IconButton, and its hover, press and focus states match in both schemes and both widths
   (`auth-wL1r2-hdr-states.png`). The drawer lists Explore, Help, Register and Sign In, with the current page marked
   (`login/states/dark-390-menu-open.png`). I accept it for reachability.
6. **nit (foundation, controls):** the typeface is the system stack rather than Mona Sans, so "Sign In" reads heavier at the same 500
   weight (`auth-wL1r2-states.png`). The primary button also has a resting shadow where github.com has `none`.
7. **Not covered (template, integrator, needs a session):** 2FA, scratch code, WebAuthn and link-account keep the full bar.
   PA-L1-2 is filed.

## Round 1 issues, status

- #1 forgot-password full bar: still open (integrator PA-L1-1).
- #2 "or" divider gap: **fixed** (20/20 on login and signup at both widths, same as github).
- #7 OpenID intro alignment: **fixed**.
- The remaining round 1 items were content or other folders' work and are unchanged.

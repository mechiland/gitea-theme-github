# Critique: pages/auth, wave L1, round 1

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision 03b09fc295. Before capturing, I checked that `dist/theme-github-auto.css` and the served
`/assets/css/theme-github-auto.css` have the same SHA-256 (f674c853…). I did not deploy.

## Verdict

**Score: 8.6 / 10. PASS on the design bar, with nits.** Raw console errors: 4, all of them the expected 404 document load on
`not-found-anon` (see below).

- Lint: `node build/lint.mjs pages/auth` gives 0 errors, 0 warnings and 79 selectors. The build report shows `folders["pages/auth"]`
  as `status "ok"` (13 files, 23,727 B), and every folder is ok. FYI outside this folder's scope: all three bundles print
  OVER BUDGET (auto is 331.2 KB).
- Literal colours: 0. There are 0 off-palette colours on 24 captures (6 routes × light/dark × 1440/390).
- Unresolved vars: 3 distinct names, 0 of them live. They are `--gh-octicon-screen-full`, `--gh-octicon-dash` and
  `--gh-octicon-plus`, used on `.graph-controls` and owned by the icons folder, not this one.
- Failed requests: 0. CLS: 0. Failed states: 0.
- Console errors: 4. Each is "Failed to load resource: 404" on `not-found-anon`, which is the route's own
  `expectStatus: 404` document, one per scheme and viewport. The 20 non-404 captures have 0.
- Non-Octicon icons: `fontawesome-openid`, 16 occurrences on login, signup and openid. It is a brand glyph, the icons
  folder's exception.
- Smoke: **green**, 12/12 steps (`shots/critic-pages/auth-wL1-smoke.log`).

The slim auth header does what the brief asks. On login, sign-up, recover_account and login/openid, the positions I
measured match the live github.com/login to the pixel at both widths. The remaining differences are one spacing
gap carried over from wave 3, forgot-password (which still gets the full bar until the integrator's template change
lands), the deliberate hamburger, and Gitea copy and brand content.

## Evidence

- Ours: `shots/critic-pages/auth-wL1-r1/`, captured with `--states --measure`. The routes file is
  `shots/critic-pages/auth-wL1-routes.json`: the builder's file plus logo-hover, menu-press, menu-open on openid and
  forgot-password, and header measures.
- github.com/login reference (logged out): `shots/critic-pages/auth-wL1-r1-ref/login/`, with the same primary and input states.
- Positions: `shots/critic-pages/auth-wL1-pos.txt` (script `auth-wL1-pos.mjs`, both targets). OpenID label probe:
  `auth-wL1-lbl.mjs`.
- Contact sheets: `shots/critic-pages/auth-wL1-hdr-states.png` (hamburger and mark states, 4 scheme/viewport combos) and
  `shots/critic-pages/auth-wL1-primary-states.png` (ours next to github.com for input focus and primary
  hover/press/focus/disabled, light and dark).

## Measurements: header area, ours vs github.com/login (light; dark is identical in geometry)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| auth header | bar | transparent, 0 border, no shadow (nav 1440×94) | no bar | yes |
| mark | box 1440 | x696 y46 48×48 | x696 y46 48×48 | yes |
| mark | box 390 | x171 y46 48×48 | x171 y46 48×48 | yes |
| title | top / font | y108, 20px/600/30px | y108, 20/600/30 | yes |
| first label | top | y162 | y162 | yes |
| first input | top / size | y187, 352×40 (358×40 at 390) | y187, 352×40 (358×40) | yes |
| hamburger | box / radius | 32×32 at 16,16, r6, invisible (transparent rest) | n/a (github shows none) | deliberate |
| hamburger | hover / press | --button-invisible-bgColor-hover / -active fill, tooltip "Navigation Menu" | n/a | yes (Primer IconButton invisible) |
| hamburger / mark | focus-visible | 2px accent ring, r6 | n/a | yes |
| primary → "or" divider | gap | **12px** (400→412) | **20px** (364→384) | **no** |
| divider → provider | gap | 20 | 20 | yes |
| provider → footer line | gap | 20 | 20 | yes |
| primary button | font / box | 14/500/20, 352×40, r6 | 14/500/20, 352×40, r6 | yes |
| primary button | resting shadow | 0 1px 1px rgba(31,35,40,.04)… | none | nit (controls) |
| input focus | ring | 1px accent border + 2px outline at -1px (2px visual) | 1px accent border + 1px inset accent (2px visual) | yes |
| font family | body | -apple-system stack | "Mona Sans VF" first | nit (foundation) |
| OpenID label | icon, text, "*" spacing | 16px icon, 4px, text, 4px, "*" (flex gap 4px) | n/a | yes, FG-092 double space fixed |

## Issues, most important first

1. **minor: forgot-password still renders the full global header.** Route `forgot-password`, all schemes and widths:
   `shots/critic-pages/auth-wL1-r1/forgot-password/light-1440.png` shows a 64px muted bar with the hamburger, logo, "Forgot Password"
   crumb, search, Sign In and Register, and the title's own 48px ::before logo underneath, so the logo appears twice. This is
   one of the three routes FG-063 cites. I verified the cause in the source: `routers/web/auth/password.go:36-41` sets only
   `IsResetDisable` when `MailService == nil`, and `custom/gh_head_navbar.tmpl:11` does not test for it. The fix belongs to
   the integrator (PA-L1-1 is filed correctly, and the CSS is ready). FG-063 stays open on this route until that lands.
2. **minor (carried from wave 3, issue 1, still unfixed): the "or" divider sits 8px too close to the primary button.**
   Login: button bottom 400, `.divider.divider-text` top 412, a 12px gap. github.com: 364 → 384, a 20px gap. On signup the gap is 16px
   (button bottom 526, divider 542). Neither matches github's 20px, and the two pages do not match each other. The fix is in providers.css: give the divider a
   `--base-size-20` top gap.
3. **minor (content, known): copy and brand.** The title reads "Sign In" / "Register" rather than "Sign in to Gitea".
   Title Case on "Remember This Device" pushes the form 36px lower than github (primary at y360 vs 324). The Gitea cup fills about
   48×34 of its 48×48 box, so the mark reads lighter than the Octocat. All of this is deliberate or a template/locale
   matter.
4. **nit (deliberate): the hamburger at the top-left.** github.com/login has no header control. Ours is a well-behaved
   Primer invisible IconButton that stays out of the centred column at both widths (16..48 vs mark 171..219 at 390). I
   accept it for reachability, and the drawer lists Explore, Help, Register and Sign In (current page highlighted).
   Correction to the builder's gap list: the drawer is **no longer unstyled**. `login/states/light-1440-menu-open.png` and
   `dark-390-menu-open.png` show a styled side drawer with a backdrop, so navigation has shipped it since the builder's shots.
5. **nit (foundation, not this folder): typeface.** github.com now sets "Mona Sans VF" first. At the same 500 weight,
   ours (system font) renders "Sign In" visibly heavier (`auth-wL1-primary-states.png`).
6. **nit (controls-owned): the primary button's resting shadow.** github.com measures `none`.
7. **nit: the OpenID intro paragraph** is left-aligned (`text-align: start`) under a centred title
   (`openid-signin/light-1440.png`). It was reported last round and is unchanged.
8. **Not covered (template, integrator):** 2FA, scratch, webauthn, activate and link-account set none of
   `PageIsSignIn/PageIsSignUp/IsResetRequest/IsResetForm` (grep of routers/web/auth). They keep the full bar and the ::before
   logo. Those routes need a session, so this is not verifiable here.

## Claims checked

- Mark at 696,46 48×48 (171 at 390), title y108, label y162, inputs y187 40px, column 352/358: **confirmed** on
  login, signup, openid and recover_account (the recover_account label is at y262 because of its flash).
- Transparent bar, no bottom rule: **confirmed** (bg transparent, border-bottom 0, box-shadow none).
- Hamburger: 32px invisible IconButton at 16/16, hover, press and open fills, marker hidden, focus ring: **confirmed** in
  light and dark at 1440 and 390 (`auth-wL1-hdr-states.png`).
- Title ::before logo skipped under the auth header: **confirmed** (no ::before on login, signup, openid or recover). It still shows on
  forgot-password, as expected for a non-auth header.
- OpenID's own 100px logo link hidden: **confirmed** (`openid-signin/light-1440.png`, with "Back to Sign In" kept).
- FG-092 double space: **confirmed fixed** (label is a flex row with a 4px gap: icon 544–560, text 564–642, "*" after 4px).
- Lint 0/0 and deploy current: **confirmed**.
- "drawer unstyled": **outdated**, it is styled now (issue 4).

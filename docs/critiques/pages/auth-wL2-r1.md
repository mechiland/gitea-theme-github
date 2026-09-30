# Critique: pages/auth, wave L2, round 1

Critic: independent GitHub design-systems reviewer (I write no theme code). Date: 2026-09-30.
Build revision e2980edc53. `npm run build` gives `folders["pages/auth"]` = `ok` (0 lint errors, 0 warnings, 14 files,
25,637 B). `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the same SHA-256
(91482c90…), so I did not deploy. FYI outside this folder: all three bundles are OVER BUDGET (auto is 314.3 KB).

## Verdict

**Score: 8.8 / 10. PASS on the design bar, with nits.** Both final-gate-2 items are fixed. The 404 page is now a correct
Primer Blankslate. I checked it number by number against Primer React 38.40.0's `Blankslate-11d7a7fd.css`, fetched from unpkg.
One claim is wrong. The builder said the footer band has **no top border**, but it has one (issue 1). The fix is one
line in this folder.

- Lint (`node build/lint.mjs pages/auth`): 0 errors, 0 warnings, 81 selectors. Literal colours: 0. There are no `!important`
  outside the `*.important.css` files, and none of those use display or visibility.
- My shoot covers 8 routes × light/dark × 1440/390 = 32 captures, plus states and measure. Pages with problems: 0. Failed
  requests: 0. CLS: 0. Off-palette colours: 0 on every capture.
- Console errors: 12 raw. All 12 are "Failed to load resource: 404", the document response of the three `expectStatus: 404`
  routes (not-found, not-found-anon, repo-404-path × 4). **Unexpected console errors: 0.**
- Unresolved vars: `--gh-octicon-calendar` is listed with 0 matched elements. It comes from `src/controls/inputs.css`, not this folder.
- Non-Octicon icons: `fontawesome-openid` × 1 remains on login and signup, inside the "Sign in with OpenID" provider button.
  That is the icons folder's brand-glyph exception. On OpenID sign-in it is now 0: both glyphs are hidden (`vis=0` in the probe).
- Smoke: **green**. All 13 steps pass with 0 console errors (`shots/critic-pages/auth-wL2r1-smoke.log`).

## Evidence

- Ours: `shots/critic-pages/auth-wL2-r1/`, from routes file `shots/critic-pages/auth-wL2r1-routes.json`. It has login, signup,
  forgot-password, openid-signin, reset-password-badcode, not-found (signed in), not-found-anon, and a new
  **repo-404-path** (`/octo-org/grex/src/branch/main/no-such-file-theme-check`). That route goes through `HandleGitError`, so
  Gitea sets `NotFoundGoBackURL` and the "Go Back" action renders. The builder said this state could not be screenshotted.
- github.com (logged out, captured today): `shots/critic-pages/auth-wL2-r1-ref/{login,not-found}/`. The provider and
  footer-link states FAILED there on selectors. I measured the footer live with `shots/critic-pages/auth-wL2r1-ghfoot.mjs`
  (hover and computed styles only; nothing was clicked or submitted).
- Geometry probe, both targets, 4 scheme/width combinations each: `shots/critic-pages/auth-wL2r1-probe.txt` (script `auth-wL2r1-probe.mjs`).
- State contact sheet: `shots/critic-pages/auth-wL2r1-states.png`. It covers footer-link hover and focus, logo focus, 404 action
  hover and focus, primary focus and provider focus. Zooms: `auth-wL2r1-footfocus-zoom.png` and `auth-wL2r1-logofocus-zoom.png`.
- PNGs I read: login light-1440 and dark-390 (ours and ref), forgot-password light-1440, dark-390 and validation-error,
  openid-signin dark-1440, signup light-390, reset-password-badcode dark-1440, not-found light-1440 (ours and ref),
  not-found-anon dark-390, repo-404-path light-1440, login dark-390 validation-error, and the contact sheet.

## Builder claims checked

| claim | result |
|---|---|
| Hamburger gone on login, signup, forgot, reset-badcode and OpenID | **confirmed**. `.gh-app-header-menu` is in the DOM but not visible on all 5 routes × 4 combos |
| Mark still at 696,46, 48×48 | **confirmed** (171,46 at 390) |
| Footer band: `--bgColor-muted`, 16px padding, 12/18 muted links, no logo | **confirmed** |
| Links 32px apart | **partly**. The gap is 48px between "Powered by Gitea" and the right-hand group, then 16/16/16 inside the group. github.com has 32/32/32/40/48 |
| Band at y=850, h=50, **no top border** | **wrong**. The band is at y=849, h=51, with `border-top: 1px solid --borderColor-muted` (rgba(209,217,224,.7), dark rgba(61,68,77,.7)). It comes from navigation/footer.css:18 and footer-band.css does not reset it. github.com/login measured today: y=850, h=50, border 0 |
| `.full.height` grows only on auth-header pages | **confirmed**. On all 5 auth routes the band is pinned to the viewport bottom (1440: 849; 390: 767) |
| Forgot-password Box: muted bg, 1px `--borderColor-default`, r6, 16px padding, left, 14px, 352 wide | **confirmed** (544,162, 352×97; 358 wide at 390) |
| OpenID glyph hidden in title and label, nonOcticon 0 | **confirmed** on openid-signin |
| Blankslate large spacious: padding 80/40, 32px icon, heading 32/600/48 with margin 8/4, description 16/24 muted +8 | **confirmed**: box 640 wide at 400,104; title at y=232 = 104+80+32+8+8 |
| Action 24px below the description | **confirmed** on repo-404-path: description ends at 356, action at 380 (1440). At 390: 290 → 314. This equals Primer's 8+16 grid gap |
| <544px: padding 44/28, 24px icon, heading 16/600/24, description 14/21 | **confirmed** |
| not-found-anon at 390 has scrollWidth 396 | **not reproduced**. scrollWidth is 390 today and the audit shows horizontalOverflow false (navigation may have fixed it) |

## Measurements (1440, light unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| footer band | box | 0,849 1440×51 | 0,850 1440×50 | no (1px) |
| footer band | border-top | 1px `--borderColor-muted` | 0 | no |
| footer band | bg | #f6f8fa / dark #151b23 | #f6f8fa / #151b23 | yes |
| footer band | padding | 16px | 16px 0 | yes |
| footer link | font / colour | 12/400/18, #59636e (dark #9198a1) | 12/400/18, #59636e (#9198a1) | yes |
| footer link | hover | accent + underline | accent #0969da + underline | yes |
| footer link | gaps | 48,16,16,16 | 32,32,32,40,48 | nit |
| footer at 390 | layout | 2 centred rows, band 767 h77 | 6 stacked rows, band 664 h180 | nit (content) |
| mark | box | 696,46 48×48 | 696,46 48×48 | yes |
| hamburger | visible | no (0×0) | none | yes |
| title | top / font | 108, 20/600/30 | 108, 20/600/30 | yes |
| primary | box / radius / font | 352×40, r6, 14/500/20 | 352×40, r6, 14/500/20 | yes |
| primary | top | 360 | 324 | no (Gitea "Remember This Device" row) |
| primary | bg light / dark | #1f883d / #238636 | #1f883d / #238636 | yes |
| input | box / radius / font | 352×40, r6, 16px | 352×40, r6, 16px | yes |
| input focus | border | 1px #0969da (dark #1f6feb) | same | yes |
| recovery Box | box / bg / border / radius / padding | 352×97, muted, 1px #d1d9e0, r6, 16 | Primer Box (muted, default border, r6, 16) | yes |
| Blankslate | padding / width | 80/40, 640 | Primer large spacious 80/40 | yes |
| Blankslate heading | font / margin | 32/600/48, 8 0 4 | title-large 32/600/1.5, 8/4 | yes |
| Blankslate description | font / colour | 16/400/24, #59636e | body-large, fgColor-muted | yes |
| Blankslate description | text-wrap | normal (wraps 1 long + 1 short line) | balance | nit |
| Blankslate action | spacing | +24 (356→380) | 8+16 | yes |
| Blankslate action | focus box | 437×24, full description width | inline, hugs the text | no |
| Blankslate visual | icon | octicon-alert **16** path at 32px (2× stroke) | a 24-grid glyph at 32 keeps a 1.5px stroke | nit |
| Blankslate <544 | heading / padding | 16/600/24, 44/28 | title-small, 44/28 | yes |

## Issues, most important first

1. **minor (this folder, footer-band.css): the auth footer band keeps navigation's 1px top rule, and the builder reported it absent.**
   Every auth route, both schemes, both widths. The pixel at y=849 is #dce2e8 in light and #313840 in dark, where the reference is
   white or #0d1117. Evidence: `login/light-1440.png` (pixel sampled), `login/dark-390.png` (visible line above the band) and
   `auth-wL2r1-footfocus-zoom.png`. Measured: band y=849, h=51, `border-top: 1px solid rgba(209,217,224,.7)`.
   github.com/login: y=850, h=50, border 0. Fix: `border-top: 0` (or `border-top-width: 0`) in
   `.full.height:has(> .gh-app-header--auth) + .page-footer`.
2. **minor (this folder, status.css): the Blankslate action is a full-width block, so its focus ring spans the whole
   description width.** On repo-404-path, `a.tw-block.tw-my-4` "Go Back" is 437×24 at 1440 (302 wide at 390), and the
   focus outline draws a 437px rectangle around a 60px word (`repo-404-path/states/{light,dark}-1440-action-focus-clip.png`).
   The hover and click target also covers the whole row. Primer's `Blankslate.SecondaryAction` is an inline Link that hugs
   its text. Gitea's Tailwind is `important: true` (tailwind.config.ts:27), so `tw-block` cannot be overridden without
   touching display, which is forbidden in `.important.css`. Fix it without display: `width: fit-content; margin-inline: auto`
   on `.status-page-error > .tw-text-center > a`, in the normal file, since `tw-block` sets no width.
3. **nit (this folder, status.css): Blankslate details.** (a) Primer sets `text-wrap: balance` on the heading and description.
   Ours wraps "…does not exist or you are not / authorized to view it." into one long line and one short line
   (`not-found/light-1440.png`). (b) The visual is the 16px octicon-alert path scaled to 32px, so its stroke is about 3px, heavier than
   Primer's large visuals, which use a 24-grid glyph. Using `--gh-octicon-alert-24`, if icons exposes it, would fix this.
4. **nit (navigation / content): the footer contents differ from github.com's auth footer.** Ours shows "Powered by Gitea",
   the theme menu (monitor icon, "GitHub"), the language menu (globe, "English"), Licenses and API. github.com shows six text-only
   links. Inside our right-hand group the items are 16px apart, not 32. At 390 github stacks one link per row. Ours uses two
   centred rows with "Powered by Gitea" wrapped to the second row (`login/dark-390.png`). The builder acknowledged this.
5. **nit (foundation FG2-097, affects this folder's 404): on 404 pages the site footer floats mid-viewport.** On not-found
   the footer rule is at y=476 (1440) and y=326 (390), with about 370px of empty page below it (`not-found/light-1440.png`,
   `not-found-anon/dark-390.png`). This is the site-wide footer model, not this folder's. The builder's auth-only re-grow does
   not cover status pages, and that seems right to keep, but the foundation should know it shows here.
6. **inherent (content, §11): the 404 is not github.com's 404.** github.com serves a marketing page: Octocat illustration,
   search field, big marketing footer (`shots/critic-pages/auth-wL2-r1-ref/not-found/light-1440.png`). A Primer Blankslate
   is the right design-system answer when the art cannot be used, and Gitea's template has no search markup.
   Titles are also Gitea copy ("Sign In", "Register", "Go Back", "Remember This Device"), and the mark is the Gitea cup.

## Round-over-round

- L1-r2 #5 (the lone hamburger): **fixed**. Nothing becomes unreachable: the forms link to each other and the mark links home.
- L1-r2 #3 (the footer on auth pages): **mostly fixed**. The band exists and is pinned to the bottom. Only the top rule
  (issue 1) and the content differences remain.
- FG2-065 (the recovery message Box and the OpenID glyph): **fixed**.
- The 404 moved from a centred 48px bold muted title to a Primer Blankslate: **fixed**, apart from the action's block
  width and the balance and icon nits.

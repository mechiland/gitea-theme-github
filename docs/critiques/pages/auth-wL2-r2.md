# Critique: pages/auth, wave L2, round 2

Critic: independent GitHub design-systems reviewer (I write no theme code). Date: 2026-09-30.
Build revision b567dcf076. `node build/lint.mjs pages/auth` gives 0 errors, 0 warnings, 86 selectors. `npm run build` gives
`folders["pages/auth"]` = `ok` (14 files, 27,264 B). `dist/theme-github-auto.css` and the served
`/assets/css/theme-github-auto.css` have the same SHA-256 (dc430964…), so I did not deploy. FYI outside this folder: all three
bundles are still OVER BUDGET (auto is 321.9 KB).

## Verdict

**Score: 9.0 / 10. PASS on the design bar.** Both round-1 minors are fixed and I verified them by measurement. So is the
`text-wrap: balance` nit. On the five auth routes the page matches github.com/login to the pixel for mark, title, controls,
primary button and the footer band's box, colours, type and gap rhythm. What is left is content (Gitea copy and footer items),
the 16-grid alert glyph (waiting on icons PA-L2-IC1), and issues owned by other folders.

- Literal colours: 0. `!important` appears only in `*.important.css`, and never on display or visibility.
- My shoot: 8 routes × light/dark × 1440/390 = 32 captures, with states and measure. Pages with problems: 0. Failed requests: 0.
  CLS: 0. Off-palette colours: 0 on every capture. Failed states: 0.
- Console errors: **12 raw**. All 12 are "Failed to load resource: 404", the document response of the three
  `expectStatus: 404` routes (not-found, not-found-anon, repo-404-path × 4). Each one also appears in `expectedFailures`.
  **Unexpected console errors: 0.**
- Unresolved vars: only `--gh-octicon-calendar` (0 matched elements), from controls/inputs.css.
- Non-Octicon icons: 8 = `fontawesome-openid` × 1 on login and signup × 4 captures each. This is the provider button's brand glyph
  (icons exception). openid-signin shows 0.
- Smoke (`node tools/shoot/smoke.mjs --theme github-auto`): **green**, 13/13 steps pass, 0 console errors
  (`shots/critic-pages/auth-wL2r2-smoke.log`).

## Evidence

- Ours: `shots/critic-pages/auth-r2/`, from routes file `shots/critic-pages/auth-wL2r2-routes.json` (the same 8 routes and states as
  round 1, including repo-404-path, which renders the "Go Back" action).
- github.com (logged out, captured today): `shots/critic-pages/auth-wL2-r2-ref/{login,not-found}/`. Footer measured live with
  `auth-wL2r2-ghfoot.mjs` → `auth-wL2r2-ghfoot.txt` (hover and computed styles only; nothing clicked or submitted).
- Geometry probe, both targets, 4 scheme/width combinations: `shots/critic-pages/auth-wL2r2-probe.txt`.
- Focus rings, ours vs github.com: `auth-wL2r2-focus.txt`. Footer language dropdown opened on login: `auth-wL2r2-langdd-{light-1440,dark-390}.png`.
- PNGs I read: login light-1440 and dark-390 (ours and ref), signup light-390, forgot-password light-1440 validation-error,
  openid-signin dark-1440, reset-password-badcode dark-390, not-found light-1440, not-found-anon dark-390,
  repo-404-path light-1440 action-focus-clip and dark-1440 action-hover-clip, login footer-link focus-clip (light) and
  hover-clip (dark), and the language dropdown dark-390.

## Builder claims checked

| claim | result |
|---|---|
| Band has no top border; 0,850 1440×50 at 1440 on login | **confirmed** on all 5 auth routes × both schemes: `border-top: 0px none`, 0,850 1440×50. github.com: 0,850 1440×50, border 0 |
| Link gaps 32/32/32/32 at 1440 | **confirmed**: 513→611.9 \| 643.9→703.5 \| 735.5→794.3 \| 826.3→876.1 \| 908.1, so every gap is 32.0 |
| "github.com has 32 between every link" | **partly**: github.com measures 32/32/32/40/48. The last two items (Manage cookies, Do not share…) are buttons with inline padding. For text links 32 is right, so uniform 32 is the correct choice |
| < 768: one link per row, 8px apart | **confirmed**, and github.com does the same (26px pitch = 18 + 8) |
| Dropdowns take the 18px line height | **confirmed**: GitHub and English are 18 tall in the band. On non-auth pages they are still 16 and 15 (navigation) |
| 390 rows at 711/737/763/789/815, band 0,690 390×154 | **band confirmed** (0,690 390×154 on login, forgot, openid and reset; 0,700 on signup, which scrolls to 854). **Row tops measure 706/732/758/784/810**, not 711…; the 26px pitch and the 16+5×18+4×8+16 = 154 math hold. The builder's numbers look like a different reference point. Nit |
| Holds on login + openid; signup, forgot and reset not probed | I probed all 5: **identical** numbers on every route and scheme |
| 404 "Go Back" 60.7×24 centred at 1440, 54×21 at 390 | **confirmed**: 689.6,380 60.7×24 (1440) and 168,314 54×21 (390). Margin is 24px above, auto sides. The focus ring hugs the word (`repo-404-path/states/light-1440-action-focus-clip.png`) |
| `text-wrap: balance` on heading and description | **confirmed**: the not-found description is 560×48, two even lines ("…either **does** / **not exist** or …"). At 390 it is also two balanced lines |
| Lint 0/0/86, build ok 14 files 27,264 B | **confirmed** |
| 12 console errors, all the expected 404 documents | **confirmed** |
| nonOcticon 8 | **confirmed** (fontawesome-openid × 8, provider button) |
| Smoke 13/13 | **confirmed** |
| PA-L2-IC1 filed | **confirmed** (docs/requests/icons.md:325). `alert-24.svg` exists in @primer/octicons |

## Measurements (1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| footer band | box | 0,850 1440×50 | 0,850 1440×50 | yes |
| footer band | border-top | 0 | 0 | yes |
| footer band | bg light / dark | #f6f8fa / #151b23 | #f6f8fa / #151b23 | yes |
| footer band | padding | 16px | 16px 0 (ul) | yes |
| footer link | font / colour | 12/400/18, #59636e (dark #9198a1) | 12/400/18, #59636e (#9198a1) | yes |
| footer link | gaps | 32/32/32/32 | 32/32/32/40/48 | yes |
| footer link | hover | accent + underline | #0969da (dark #4493f8) + underline | yes |
| footer link | focus | 2px accent, offset −2px, no underline | 2px accent, offset 0, underline | no (foundation) |
| footer at 390 | band | 0,690 390×154, 5 rows at 26px pitch | 0,664 390×180, 6 rows at 26px pitch | yes (1 item fewer) |
| title | box / font | y108, 20/600/30 system stack | y108, 20/600/30 **Mona Sans VF** | nit (foundation font) |
| primary | box / radius / font | 352×40, r6, 14/500/20 | 352×40, r6, 14/500/20 | yes |
| primary | top | 360 | 324 | no (Gitea "Remember This Device" row, inherent) |
| primary | bg light / dark | #1f883d / #238636 | #1f883d / #238636 | yes |
| secondary (provider) | box / bg / border | 352×40, #f6f8fa, 1px #d1d9e0 | 352×40, #f6f8fa, 1px #d1d9e0 | yes |
| input (focused) | box / radius / font | 352×40, r6, 16px | 352×40, r6, 16px | yes |
| input (focused) | ring | border #0969da + 2px outline −2 | border #0969da + 1px inset shadow | yes (same 2px look) |
| Blankslate | box / padding | 640 wide, 80/40 | Primer large spacious 80/40 | yes |
| Blankslate heading | font / margin | 32/600/48, 8 0 4, balance | title-large, 8/4, balance | yes |
| Blankslate description | font / colour / wrap | 16/400/24 #59636e, balance (560×48, 2 even lines) | body-large, fgColor-muted, balance | yes |
| Blankslate action | box | 60.7×24 centred, +24 below the description | inline Link hugging its text, 8+16 | yes |
| Blankslate action | focus | 2px #0969da, offset −2px (on the glyph edges) | Link focus 2px, offset 0 | nit (foundation) |
| Blankslate visual | icon | alert-16 path at 32px (24px < 544) | 24-grid glyph | nit (icons PA-L2-IC1) |
| Blankslate < 544 | heading / padding / action | 16/600/24, 44/28, 54×21 | title-small, 44/28 | yes |

## Issues, most important first

1. **nit (icons dependency, status.css): the Blankslate visual is the 16-grid `alert` drawn at 32px.** Its stroke is about 3px
   (`not-found/light-1440.png`, `repo-404-path/states/*-clip.png`), heavier than Primer's 24-grid large visual.
   It waits on icons PA-L2-IC1 (`alert-24` mask), after which this is a one-token swap here.
2. **nit (foundation, all links): the focus outline sits inside the link box.** `outline: 2px solid --focus-outlineColor;
   outline-offset: -2px` draws over the glyph edges: the "P" of "Powered by Gitea" and the "G" of "Go Back" touch the ring
   (`login/states/light-1440-footer-link-focus-clip.png`, `repo-404-path/states/light-1440-action-focus-clip.png`).
   github.com's login links and footer links measure offset 0, and the footer link also underlines on focus (`auth-wL2r2-focus.txt`).
   This is not this folder's rule. Foundation owns the global `:focus-visible`.
3. **nit (content, inherent): the auth footer shows Gitea's items**, not github.com's six text links: "Powered by Gitea", a
   theme menu with the monitor icon, a language menu with the globe, Licenses and API. The geometry now matches github.com exactly (see the table).
4. **nit (navigation): the footer dropdown menus draw their items in `--fgColor-muted`** (#59636e / #9198a1, 14/20, 32 tall).
   Primer ActionList items use `--fgColor-default`. The same happens on non-auth pages (`auth-wL2r2-langdd-dark-390.png`),
   so the colour is inherited from the footer, not set by this folder. The menu opens upward and stays usable at 390.
5. **nit (foundation font): the auth title uses the system stack.** github.com's "Sign in to GitHub" h1 is `"Mona Sans VF"` at
   20/600, which renders narrower and lighter. Compare `login/light-1440.png` with the ref. That is a site-wide web-font policy decision, not this folder's.
6. **nit (foundation FG2-097 / navigation): on 404 pages the site footer follows the content.** It sits at y=476 (1440),
   with about 370px of blank page below. The non-auth footer there also has 16/15/18px-tall items, so they are mis-aligned by
   1–2px (GitHub 497, English 497.5, links 496). The not-found-anon title truncates to "Page N…" at 390 (header).
   scrollWidth is 390, so there is no overflow. None of these is this folder's surface.
7. **nit (report accuracy): the 390 row tops the builder reported (711/737/…) do not match my measurement.** Link boxes measure
   706/732/758/784/810 on every auth route. The pitch and band height the builder gave are correct.
8. **inherent (content, §11):** github.com's 404 is a marketing Octocat page with search. A Primer Blankslate is the right
   design-system answer. Gitea's copy ("Sign In", "Register", "Go Back", "Remember This Device") pushes the primary button
   to y=360, against 324 on github.com.

## Round-over-round

- r1 #1 (the footer band's top rule): **fixed**, with border 0 and a 0,850 1440×50 box on every auth route and scheme.
- r1 #2 (the full-width "Go Back" block and its 437px focus ring): **fixed**. It is now 60.7×24, centred, and the ring hugs the word.
- r1 #3a (text-wrap balance): **fixed**. r1 #3b (the 16-grid alert glyph): **open**, blocked on icons PA-L2-IC1.
- r1 #4 (footer gaps 48/16/16/16 and the 2-row 390 layout): **fixed** geometrically (32 uniform, one per row at 390). The content difference is inherent.
- r1 #5 (the 404 footer floats) and #6 (inherent): unchanged, as expected.

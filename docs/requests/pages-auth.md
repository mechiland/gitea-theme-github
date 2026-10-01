# pages/auth: incoming requests and status

## Forwarded items handled (wave 3, round 1)
- foundation.md #5 [FYI, pages/auth] "Login / sign-up card at 390 is still inset by the page grid": **DONE**. pages/auth resets
  `.ui.page.grid` and the column on the auth pages. At 390 the inputs and buttons now measure x=16 w=358, the same as
  github.com (`shots/pages-auth-r1/login/light-390.measure.json`).
- controls.md #3 (pages/auth bullet) "github.com /login uses large 40px inputs and buttons": **DONE**. Inputs, the primary
  button and the provider buttons are 40px (`--control-large-size`), inputs use 16px text, and all widths are 352 at 1440 and
  358 at 390. These match `docs/reference/login/*.measure.json`.

## Design decision (for critics)
The wave-3 brief describes the classic github.com login: a 340px column, a 24px/300 title and the form inside a muted Box
with a second "New to GitHub?" Box. The live github.com/login captured in `docs/reference/login` (2026-09-30) no longer
looks like that. It has a 352px column, a 48px mark, a 20px/600/30px title, no Box, 40px controls, an "or" divider,
full-width provider buttons, and a plain centred "New to GitHub? Create an account" line. pages/auth follows the captured
reference, which the critics compare against, and applies the same system to sign-up, forgot/reset password, activation,
2FA and OpenID.


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **DONE (wave L1 r1)** — styled `.gh-app-header--auth` in src/pages/auth/app-header.css: login / sign-up / recover / OpenID measure mark 696,46,48×48 and title y=108 (github.com/login: 696,46 / 108); forgot_password still gets the full bar because this instance has no mailer (`IsResetDisable` only) → integrator.md PA-L1-1. **FG-063 [theme-fixable-template] Auth pages show the full global navbar (Explore / Help / Register / Sign In); github.com auth pages show only the centred mark** — impact 7 (judges 3, critic wt 4; routes: forgot-password, reset-password-badcode, login)
   - Fix: Part of the head_navbar override: on PageIsSignIn / PageIsSignUp / forgot / reset pages render a slim header (logo only, centred above the form) and move Explore / Help / Register / Sign In links into the auth footer row (links kept, not removed). pages/auth styles it.
   - Critic refs: C060 (forgot-password, minor), C109 (reset-password-badcode, nit)
   - PNG: `shots/final-gate/forgot-password/light-1440.png`, `docs/reference/login/light-1440.png`, `shots/final-gate/forgot-password/dark-390.png`, `shots/final-gate/forgot-password/dark-1440.png`
2. **DONE in part (wave L1 r1)** — "OpenID URI  *" double space fixed (label is a flex row, 4px icon/text/marker). Not changed, with evidence: 40px controls / 352px column and the 20px/600/30px title are what github.com/login measures today (docs/reference/login/light-1440.measure.json: inputs and buttons 352×40; live h1 20px/600/30px, 2026-09-30); the critic's 32px / 340px / "lighter and larger" heading is the pre-2025 login design, and github.com/signup + /password_reset return "Access is temporarily restricted" to the capture, so there is no newer reference for those pages. **FG-092 [theme-fixable-css] Auth forms: signup uses 40px controls in a 352px column (github.com/login 32px, 340px), 'Account Recovery' heading 20px semibold, double space before the required '*'** — impact 4 (judges 0, critic wt 4; routes: signup, openid-signin)
   - Fix: Match github.com/login sizes; collapse the label whitespace (white-space / word-spacing on the asterisk span).
   - Critic refs: C134 (signup, minor), C081 (openid-signin, nit)
   - PNG: `shots/final-gate/openid-signin/light-1440.png`, `shots/final-gate/signup/light-1440.png`, `shots/final-gate/openid-signin/light-1440.png`

# Integrator (final gate #1 follow-up, 2026-09-30): FG-063 auth header APPROVED — rides on the FG-007 AppHeader (install ORC-5)
On sign-in / sign-up / forgot-password / reset-password pages for signed-out visitors (`PageIsSignIn`, `PageIsSignUp`,
`IsResetRequest`, `IsResetForm`) the header is `nav#navbar.gh-app-header.gh-app-header--auth` with only
`details.gh-app-header-menu` (hamburger; its drawer additionally holds Register / Sign In after Explore / Help) and
`a#navbar-logo`. No context crumbs, no search, no right-hand buttons are rendered. You own `.gh-app-header--auth`: centre
the 48px mark over the form like github.com/login (transparent bar, no bottom rule); keep the hamburger reachable (it is the
only path to Explore / Help / Register from these pages). Structure of the rest: docs/requests/navigation.md (same date).

# Integrator FG-063 follow-up: **DONE (wave L1 r1)** — `.gh-app-header--auth`: transparent bar, no rule, 48px mark centred
(y=46), hamburger kept as a 32px invisible IconButton at 16/16 (hover/active/open fills --button-invisible-*, focus ring from
foundation), title's own ::before logo skipped under this header, OpenID's own 100px logo link hidden (the mark replaces
it; "Back to Sign In" stays). Drawer styling is navigation's (FYI appended to navigation.md).

# Wave L1 round 2 (2026-09-30) — critic auth-wL1-r1 follow-ups
- **DONE** issue 2 "primary → 'or' divider 12px/16px vs 20px": providers.css divider margin is now `--base-size-20 0 --base-size-12`.
  Measured: login button bottom 400 → divider 420 (20), divider bottom 441 → provider 461 (20); signup 526 → 546 (20), 567 → 587 (20).
  github.com/login: 364 → 384 (20), 405 → 425 (20). Same at 390.
- **DONE** issue 7 "OpenID intro left-aligned under a centred title": the intro `.inline.field` is centred (other-pages.css).
- **OPEN (integrator)** issue 1 / FG-063 on forgot-password: still the full bar (template line 11 lacks `.IsResetDisable`);
  re-filed as a reminder in integrator.md with PA-L1-2 (2FA / scratch / WebAuthn / link-account via `.Link` prefix).


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **DONE (wave L2 r1)** — hamburger `display:none` under `.gh-app-header--auth` (0×0 on login / signup / forgot / reset-badcode / OpenID; mark still 696,46,48×48) and its IconButton rules deleted; new footer-band.css: `--bgColor-muted` band, 16px padding, 32px link gap, no mark, pinned to the viewport bottom (`.full.height` re-grows on these pages only, foundation FG2-097 FYI) — measured 1440: y=850 h=50, same as github.com/login; no top border because github.com/login has none (checked live 2026-09-30). Evidence shots/pages-auth-L2r1/{login,signup,forgot-password,openid-signin,reset-password-badcode}/*. **FG2-033 [theme-fixable-css] Logged-out auth pages (login, signup, forgot/reset password, OpenID) keep a lone hamburger IconButton at the top-left; github.com auth pages have no chrome (and a muted footer band)** — impact 12 (judges 3, critic wt 9; gate 1 FG-063; routes: forgot-password, openid-signin, login, reset-password-badcode, signup)
   - Fix: `.gh-app-header--auth .gh-app-header-menu { display:none }` on sign-in / sign-up / forgot / reset / openid (every form already links Register ↔ Sign In and the logo links home, so no page becomes unreachable); make sure forgot/reset/openid get `--auth` (ORC-11). Footer: `--bgColor-muted` band with top border on auth pages only.
   - Critic refs: C040 (forgot-password, minor), C074 (openid-signin, nit), C093 (reset-password-badcode, minor), C094 (login, nit), C120 (signup, nit)
   - PNG: `shots/final-gate-critic-1/forgot-password-d-00.png`, `docs/reference/login/light-1440.png`, `shots/final-gate-2/login/light-1440.png`, `shots/final-gate-critic-4/login-390-l.png`
2. **DONE (wave L2 r1)** — forgot-password `p.center` (disabled / resend-limit message) is a Box: `--bgColor-muted`, 1px `--borderColor-default`, 6px radius, 16px padding, left-aligned 14px text, 352px (the auth column; github.com/login's current column, not the old 340px); `fontawesome-openid` hidden in the OpenID title and label (audit: nonOcticon 0, hidden 2). **FG2-065 [theme-fixable-css] Auth forms: 'Account recovery is disabled' message is bare centred text (github.com: 340px bordered muted Box); OpenID logo drawn in the heading and field label** — impact 6 (judges 0, critic wt 6; gate 1 FG-092; routes: forgot-password, openid-signin)
   - Fix: Wrap the forgot-password message in the same 340px auth Box (`--bgColor-muted`, 1px border, 6px radius, 16px padding); hide `fontawesome-openid` inside `h4.ui.top.attached` and `label` on `.user.signin.openid` (brand icon, presentational there).
   - Critic refs: C041 (forgot-password, minor), C073 (openid-signin, minor)
   - PNG: `shots/final-gate-critic-1/fp-light.png`, `shots/final-gate-2/forgot-password/dark-1440.png`, `shots/final-gate-2/forgot-password/light-1440.png`, `shots/final-gate-2/openid-signin/dark-1440.png`

# Wave L2 round 1 (2026-09-30) — 404 / status pages
- **DONE** not-found / not-found-anon: status.css now follows Primer React's Blankslate (size large, spacious) exactly:
  padding 80/40, 32px muted alert visual 8px above, heading `--text-title-shorthand-large` (32/600/48) margin 8px 4px,
  description `--text-body-shorthand-large` muted + 8px, action 24px below (8 + 16); below 544px Primer's container-query
  step-down: padding 44/28, 24px visual, heading title-small 16/600/24, description 14px. Measured (anon + signed-in):
  1440 box 640 wide, title 32px/600/48 at y=232; 390 title 16px/600/24. No GitHub art (§11) and no search box (no markup).
  Still open elsewhere: not-found-anon at 390 has scrollWidth 396 (header, navigation FG2-054).

# Wave L2 round 2 (2026-09-30) — critic auth-wL2-r1 follow-ups
- **DONE** issue 1 "band keeps navigation's 1px top rule": footer-band.css `border-top: 0`. Measured login 1440 band
  0,850 1440x50, bt 0 (github.com/login 0,850 1440x50, bt 0), light + dark.
- **DONE** issue 4 (part in this folder) "link gaps 48/16/16/16": the auth band flattens left/right groups (their 8px
  margins → 0, both groups gap 32) → gaps 32/32/32/32 at 1440 (github.com 32 between every item). Below 768 (github.com's
  breakpoint, probed 767 vs 768) one item per row, 8px apart, centred; the theme/language dropdowns inherit the 18px line
  so every row is 18 tall (26px pitch, like github.com): 390 band 0,690 390x154 (5 items; github.com 6 items → 180).
  Footer contents (Powered by / theme / language / Licenses / API vs Terms / Privacy / …) stay Gitea's (navigation/content).
- **DONE** issue 2 "Go Back full-width block": `width: fit-content` + inline auto margins (the margin lives in
  status.important.css because of tw-my-4) → 60.7x24 centred at 1440 (54x21 at 390); focus ring hugs the word.
- **DONE** issue 3a: `text-wrap: balance` on the Blankslate heading and description.
- **OPEN (icons)** issue 3b: 16-grid alert scaled to 32px — requested a 24-grid mask (docs/requests/icons.md PA-L2-IC1).
- **Not changed** issue 5 (404 footer follows content): foundation FG2-097 model, measured on github.com Rails pages.

# Integrator (L2b, 2026-09-30)
- PA-L2-IC1 — mask `--gh-octicon-alert-24` available (data URI, ~0.9 KB once referenced); swap it in status.css in your next round.
- Known/expected, not a defect: the intentional 404 routes (`not-found`, `not-found-anon`) log their 404 document as one
  console error per page ("Failed to load resource: … 404"); that is why the pages/auth pass rule (0 console errors) failed.
  The audit totals in STATUS.json list them separately.

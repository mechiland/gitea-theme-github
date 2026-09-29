# Critique: pages/auth, wave 3, round 1

Critic: independent GitHub design-systems reviewer (writes no theme code).
Date: 2026-09-30. Deployed revision f7af056f0d. `dist/theme-github-auto.css` and the served
`/assets/css/theme-github-auto.css` have the same SHA-256 (ccdada86…), so the served CSS was current and I did not deploy.

## Verdict

**Score: 8.6 / 10. PASS, with nits.**

- Lint: `node build/lint.mjs pages/auth` gives 0 errors, 0 warnings and 62 selectors. The build report shows `folders["pages/auth"].status = "ok"` (12 files, 19,023 B), and every folder is ok.
- Literal colours: 0. The shoot audit found 0 off-palette colours on all 32 captures.
- Unresolved CSS variables: 0. Failed requests: 0. CLS: 0 on every capture. Horizontal overflow: none.
- Console errors: 0 attributable to the theme. The raw tool count is 8, one per 404 capture (not-found and not-found-anon × 2 schemes × 2 viewports). Each is Chromium's "Failed to load resource: 404" for the 404 document itself, which the audit lists under `expectedFailures`. github.com's own 404 capture (`docs/reference/not-found/light-1440.json`) logs the same error. The 24 non-404 captures have 0.
- Smoke: **green**, 12/12 steps (`shots/20260930-044548-smoke-github-auto/smoke.json`).

The builder chose the live github.com/login capture over the brief's classic Box design. I agree with that choice: the critics measure against `docs/reference/login`, and that capture has no Box, a 352px column, a 20/600 title and 40px controls. Against that reference the sign-in page is very close. Every control is the right size, colour, radius and weight, in both schemes and at both widths. Most of the remaining gaps come from Gitea content (the title copy, the extra "Remember This Device" row, the navbar) rather than from the CSS.

## Evidence

- Ours: `shots/critic-pages/auth-r1/` (8 routes × light/dark × 1440/390, `--states --measure`; routes file `shots/critic-pages/auth-routes.json`, which extends the builder's file with extra measures and states).
- Reference: `shots/critic-pages/auth-r1-ref/login/` (github.com/login, logged out, same states apart from submitEmpty; the provider and passkey selectors did not resolve there).
- Element positions for both targets: `shots/critic-pages/auth-pos.json` (script `shots/critic-pages/auth-pos.mjs`).
- State contact sheets: `shots/critic-pages/auth-states-cmp.png`, `auth-states-cmp2.png` (ours on the left, github.com on the right) and `auth-states-ours.png`.

## Measurements: login, ours vs github.com (light and dark, 1440 and 390)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| column | content width 1440 / 390 | 352 / 358 | 352 / 358 | yes |
| mark | size | 48×48 box (Gitea logo, ::before) | 48×48 | yes |
| mark → title | gap | 12px | 14px | nit (2px) |
| title | font | 20px / 600 / 30px, fgColor-default | 20 / 600 / 30 | yes |
| title → first label | gap | 24px | 24px | yes |
| label | font / margin-bottom | 14 / 600 / 21, 4px | 14 / 600 / 21, 4px | yes |
| input | box | 352×40 (358×40 at 390), radius 6, 1px #d1d9e0 / dark #3d444d | same | yes |
| input | text / padding | 16px / 400 / 20px, 12px inline | 16 / 400 / 20, 12px | yes |
| field → field | gap | 16px | 16px | yes |
| forgot link | font / colour | 14 / 400 / 21, #0969da (dark #4493f8) | same | yes |
| primary button | box / font | 352×40, radius 6, 14 / 500, bg #1f883d (dark #238636), border rgba(31,35,40,.15) | same | yes |
| primary button | box-shadow | 0 1px 1px rgba(31,35,40,.04),… (controls-owned) | none | nit |
| primary → "or" divider | gap | **12px** | **20px** | **no** |
| divider | font / rules | 14 / 400 / 21, 1px borderColor-default, 8px to the text | same | yes |
| divider → provider button | gap | 20px | 20px | yes |
| provider button | box / font | 352×40, 14 / 500, bg #f6f8fa (dark #212830), border #d1d9e0 | same | yes |
| last provider → footer line | gap | 20px | 20px | yes |
| footer line | font | 14 / 400 / 21, centred | same | yes |
| footer → passkey | gap | 16px | 16px | yes |
| passkey link | font / colour | 14 / 500, accent | 14 / 500, accent | yes |
| primary focus-visible | ring | 2px accent outline + inner white (clip) | same look | yes |
| input focus | ring | accent border + ring, visually 2px | accent border + 1px inset accent | yes |
| hover / pressed / disabled (primary) | colours | match visually in light and dark (clips) | — | yes |
| flash (error) | font / padding | 14 / 21, 20px 16px, danger-muted bg | Primer Flash: 20px 16px | yes |

## Issues, most important first

1. **minor: the "or" divider is 8px too close to the primary button.** Route login, both schemes, both widths. The primary button bottom is at 448 and `.divider.divider-text` top at 460, a 12px gap. On github.com the button bottom is at 364 and the divider top at 384, a 20px gap (`auth-pos.json`). This contradicts the builder's claim that every vertical position is within 2px apart from the 34px shift. Fix in providers.css: a 20px top gap before the divider (for example `margin: var(--base-size-20) 0 var(--base-size-12)`, or 8px of top margin on the provider block). Also visible on signup (`signup/light-1440.png`).
2. **minor (content, known gap): the title copy and the doubled logo.** The title reads "Sign In" / "Register" rather than "Sign in to Gitea", and the Gitea logo appears in both the navbar and the 48px mark. It is deliberate and documented, but a GitHub user will notice it on first look. The copy needs a locale or template override (integrator).
3. **minor (content, known gap): "Remember This Device".** This Title Case checkbox row has no github.com counterpart and pushes the button and everything below it down 34px. It is kept for function, which I accept.
4. **nit: mark-to-title gap is 12px vs 14px** (header.css `margin: 0 auto var(--base-size-12)`). Also, the Gitea cup artwork fills only about 48×34 of its 48×48 box, so the mark looks lighter than GitHub's round mark.
5. **nit: OpenID page** (`openid-signin/dark-1440.png`). The label reads "OpenID URI  *": the required marker is shown and there is a double space after the icon. The intro paragraph is left-aligned under a centred title. The `fontawesome-openid` icon in the title, the label and the provider button is the only non-Octicon on these pages (20 occurrences across login, signup and openid). It is a brand logo, so it is presumably the icons folder's deliberate exception and outside this folder's scope.
6. **nit: forgot-password.** The recovery-disabled message is centred (Gitea's `.center` class). github.com's reset page is a left-aligned form. The mail-enabled form state was not verifiable on this instance (mail is disabled), so the builder and I both only saw the message state.
7. **nit (controls-owned, not this folder):** the primary button has a resting shadow that github.com/login does not have (measured `none`).
8. **Not verified (not reachable):** twofa, twofa_scratch, webauthn, activate, link-account, change_passwd, 500 and 503. I reviewed them against the templates only. The selectors match the Gitea 1.27.3 template classes: twofa and scratch are `.page-content.user.signin`, webauthn is `.signin.webauthn-prompt`, and 500 and 503 use `.status-page-error`. `oauth2-authorize-application-box` (grant.tmpl) is not covered by this folder.

## Other pages (screenshots reviewed)

- **Sign-up** (`signup/*`, plus validation errors in light and dark at 390): same system as sign-in, with 4 fields at a 16px rhythm, a 40px full-width primary button, the divider, the provider button and a centred "Already have an account? Sign in now!". The error flash sits after the title with a danger border on the input. Good.
- **Login validation error** (`login/states/light-1440-validation-error.png`): the flash comes after the title (reordered correctly) and the empty input has a red border. Good.
- **Reset password, bad code** (`reset-password-badcode/light-390.png`): the flash, a 40px input and a full-width button, all consistent.
- **404** (`not-found/*`, `not-found-anon/*`): a centred Blankslate with a 32px muted alert octicon, a 32px semibold "404 Not Found" and a 16px muted description with default-colour strong text. It reads well in light and dark and at 390 there is no overflow. GitHub's illustrated 404 is intentionally not copied, as the brief asks.

## Claims checked

- 390 widths of 358×40 for inputs, primary and secondary buttons: **confirmed**.
- 1440 widths of 352 everywhere: **confirmed**.
- "every vertical position within 2px except the remember row": **not confirmed**. The primary-to-divider gap is off by 8px (issue 1).
- 0 off-palette colours and 0 page problems: **confirmed**. 8 console errors, all the expected 404 document: **confirmed**.
- No `display` or `visibility` in the `*.important.css` files: **confirmed** by reading them.

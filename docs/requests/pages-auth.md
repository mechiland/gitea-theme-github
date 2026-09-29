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

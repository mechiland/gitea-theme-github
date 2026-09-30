# Critique: overlays, wave L1, round 1

Critic: independent design-systems review. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score 8.5 / 10. PASS.**

The three final-gate items the builder claimed are fixed, and I verified them myself.

- **FG-103, danger button.** It matches Primer's danger button value for value in every state I could reproduce: rest, hover, pressed and keyboard focus, in light and dark. I compared it against the Primer React ConfirmationDialog in the primer.style storybook and against a local page built with @primer/css.
- **FG-094, flash icons.** The variant-coloured leading Octicon is present on both paths: messages where Gitea renders an svg, and icon-less `.flash-message`s.
- **FG-121, scroll cue.** Scroll shades appear only on lists that actually overflow, and the height caps end mid-row as the builder described.

What keeps this from a higher score:

- **Destructive dialogs the heuristic misses (known gap, plus one new miss).** The project board's Delete Column and Delete Project dialogs are still green. So is the repo-settings Archive dialog, which I found this round.
- **Dark-mode scroll shade.** In dark it reads as a light haze.
- **Small spacing differences** from the current Primer Flash and ConfirmationDialog specs.

Gates:

- **Lint.** 0 errors, 2 warnings (both from earlier rounds).
- **Build.** `folders.overlays = {status: ok, files: 9, bytes: 51473}`.
- **Served files.** Served == dist, sha256 prefixes: auto 0c7b1b1e42d8, light 7713e639d0fc, dark 627b68afc601. I did not deploy.
- **Console.** 0 errors on 40 shoot pages, 85 probe captures and the smoke run.
- **Colours and vars.** Off-palette 0, unresolved vars 0.
- **Smoke test.** Green, 12/12 steps (`shots/20260930-130057-smoke-github-auto/smoke.json`).

## How I verified

- **shoot.mjs** with `--states --measure`.
  - Routes file: `shots/critic-overlays-wL1-r1-routes.json`. Routes: labels, branches, repo-settings, repo-issues, user-settings-appearance, user-settings-account, signup, login, project-board and admin-user-edit, each × light/dark × 1440/390.
  - Output: `shots/critic-overlays-wL1-r1/`. I used a new directory because `shots/critic-overlays-r1/` holds the wave-1 critic run.
  - Results: 40 pages, 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, 0 unlayered Gitea CSS.
  - Four problems, all shoot-state selector timeouts, all pre-existing, none from overlays: repo-issues `labels-btn-hover` at 1440 and `select-all` at 390, in both schemes.
  - Non-Octicon icons: only Gitea's `gitea-colorblind-*` theme icons in the theme picker, and they are masked.
- **Probe.** `shots/critic-overlays-wL1-r1-probe.mjs`, output `shots/critic-overlays-wL1-r1/probe/` with `probe.json`: 85 captures, 0 console errors.
  - The press states hold the mouse button down and the context is closed, so no click is ever dispatched. No Enter is pressed. Nothing was deleted.
  - Dialog OK buttons measured at rest, hover, press and keyboard focus on:
    - Labels "Delete Label" (id-less fetch-action);
    - Delete Branch;
    - admin Delete User;
    - repo delete;
    - two controls that should stay green: rename-branch (green, correct) and archive-repo.
  - Project board: Delete Column and Delete Project.
  - Flash: `/user/settings/account` `.ui.red.message`; a real login failure flash (wrong password on our own Gitea); injected error/warning/info/success `.flash-message`s.
  - Menus:
    - theme picker at rest, scrolled to the middle and scrolled to the end, at 1440, 800 and 390;
    - label filter, sort menu, branch picker, issue sidebar labels.
- **Reference (read-only).**
  - Primer React storybook, `shots/critic-overlays-wL1-r1-sb.mjs` → `shots/critic-overlays-wL1-r1/storybook/` (28 captures + `sb.json`): ConfirmationDialog, deprecated Flash (danger / success / with-icon-action-dismiss), Banner (critical / multiline), light/dark × 1440/390.
  - Local @primer/css 22.3.2 page (`shots/critic-overlays-wL1-r1-ref/primer-ref.html`): `.btn-danger` states. @primer/css 22 no longer ships `.flash`, so the flash reference is Primer React.
  - github.com logged-out has neither delete dialogs nor error flashes, and I must not submit forms there, so I did not capture it.

## FG-103: destructive confirm button

Measured (probe.json):

| state | ours light | Primer light | ours dark | Primer dark |
|---|---|---|---|---|
| rest | bg #f6f8fa, fg #d1242f, border #d1d9e0, 32px, 14px/500, r 6px | same (ConfirmationDialog "Delete it!": bg #f6f8fa, fg #d1242f, border #d1d9e0, shadow rgba(31,35,40,.04) 0 1px 0) | bg #212830, fg #fa5e55, border #3d444d | same |
| hover | bg #cf222e, fg #fff, border rgba(31,35,40,.15) | same | bg #b62324, fg #fff | same |
| pressed | bg #a40e26, fg #fff | same (@primer/css adds inset rgba(76,0,20,.2) 0 1px 0) | bg #da3633 | same |
| focus-visible | 2px solid #0969da, offset −2px, no inner ring | same | 2px solid #1f6feb, offset −2px | same |

Padding is 12px, which matches Primer React ConfirmationDialog; @primer/css `.btn` uses 16px.

Screenshots: `probe/labels-del-*-clip.png`, `probe/branch-del-*`, `probe/admin-user-del-*`, `probe/primer-ref-*-clip.png`, and `storybook/components-confirmationdialog--default-*.png`.

## FG-094: flash icons

- **Account page.** `/user/settings/account`, `.ui.red.message > p > svg`: 16px, colour --fgColor-danger (#d1242f light / #f85149 dark), margin-right 12px, vertically centred on the 21px line (top +3).
  - The first character starts **15.8px** after the icon, not the claimed 12px. The markup's whitespace text node adds about 3.8px.
- **Icon-less `.flash-message`.** The icon is a `::before` mask: 16px at left 16 / top 22.5, and the text starts at x=45 (28px of padding, icon + 12px).
  - Variant colours: error #d1242f/#f85149, warning #9a6700/#d29922, info #0969da/#4493f8, success #1a7f37/#3fb950.
  - Each variant uses the right Octicon: alert, alert, info, check-circle.
  - Screenshots: `probe/flash-login-light-390.png` (real server flash) and `probe/flash-injected-dark-390-clip.png` (three-line wrap with a link; the icon stays on line 1).
  - The signup validation flash (`signup/states/*-validation-error*.png`) is correct in both schemes.
- **Box.** 20px 16px padding, border --borderColor-danger-muted, bg --bgColor-danger-muted, 6px radius, 14px/21px text.
  - Primer React Flash (storybook) differs: padding 16px, icon 8px margin + 8px message padding (text 16px after the icon), 67px tall on one line against our 63px.
  - Ours follows the legacy github.com `.flash` spec (20px 16px, 12px gap), which github.com still serves server-side. Nit.

## FG-121: menu scroll cue

- **Caps (theme picker, a Select).** 248px = 8 + 7.5×32 at 1440, 152px = 8 + 4.5×32 at 800, and 120px = 8 + 3.5×32 at 390.
  - The branch picker and issue sidebar labels scroll areas are 304px (9.5 rows).
  - The label filter keeps Gitea's 500px. It happens to end mid-row (12.56 rows visible).
- **Shades.** Built from the local cover gradients plus scroll-attached radial shades.
  - They appear at the top only when scrollTop > 0 (`probe/theme-menu-mid-*`, `-end-*`) and at the bottom only when content is below.
  - The sort menu does not overflow (272/272) and shows no shade (`probe/sort-menu-dark-1440-clip.png`).
- **Dark mode.** The shade is --borderColor-default (#3d444d) over #010409, sampled as a light band from rgb(61,68,77) fading to the background within 8px (`probe/theme-menu-mid-dark-1440-clip.png`). It reads as a glow, not a shadow. See issue 3.

## Issues (most important first)

### 1. MINOR: the repo "Archive This Repo" dialog stays green (new miss)

- **Where.** `/octo-org/grex/settings` → Danger Zone → Archive, `#archive-repo-modal .actions > .ui.primary.ok.button`.
- **Measured.** bg #1f883d / #238636, fg #fff (`probe/archive-repo-light-1440-clip.png`, `-dark-1440`).
- **Expected.** GitHub's archive confirmation uses the danger button. Every other Danger Zone modal here already renders danger through `ModalButtonDangerText`.
- **Fix (overlays).** Add `[id^="archive-"]` to the id list in `dialog.css`, in both rules.

### 2. MINOR (known gap, partly fixable upstream): project board Delete Column and Delete Project confirms stay green

- **Where.** `/octo-org/theme-playground/projects/2`: "Delete Column" and "Delete Project" OK buttons are #1f883d / #238636 (`probe/project-col-del-dark-1440-clip.png`, `probe/project-del-*`).
- **Why CSS can't fix it.** The page mixes in a harmless "set default column" confirm, and CSS cannot see which trigger was used.
- **Upstream route.** Gitea already supports this: `confirmFetchAction` passes `confirmButtonColor: 'red'` when the trigger has the class `red` or `negative` (`web_src/js/features/common-fetch-action.ts:207`).
  - An integrator template change in the github-* branch could add `negative` to the destructive `link-action` triggers: `templates/projects/view.tmpl` lines 51 and 112, and similar triggers elsewhere.
  - Gitea would then render `ui red ok button`, which controls already draws as danger. That removes the body:has heuristic's blind spot.
- **Next step.** The builder should file this in `docs/requests/overlays.md` for the integrator.

### 3. MINOR: in dark mode the scroll shade is a light haze

- **Where.** `.ui.dropdown > .menu` and `.ui.dropdown .scrolling.menu` backgrounds (`action-menu.css:316-323`), dark, any overflowing list (`probe/theme-menu-mid-dark-1440-clip.png`, `probe/branch-menu-dark-390-clip.png`).
- **Measured.** At the edge the band is rgb(61,68,77) on an rgb(1,4,9) overlay. It is lighter than the surface, so it reads as a highlight.
- **Reference.** github.com / Primer overlays show no shade at all.
- **Suggested fix.** In dark, draw the shade in a shadow colour instead, for example --overlay-backdrop-bgColor or the colour of --shadow-floating-small. Or keep the light shade but only at about half the height.
- **Light mode** is subtle and fine.

### 4. NIT: flash icon-to-text gap is 15.8px where Gitea renders the svg

- **Where.** `.ui.message > p:first-child > .svg:first-child` on `/user/settings/account` (`probe/flash-account-light-1440-clip.png`).
- **Measured against target.** 12px margin + a ~3.8px space glyph = 15.8px, against the 12px the builder claimed and the legacy github.com spec. Primer React's 16px is effectively the same, so this is only a spec-consistency nit.
- **Fix.** Either accept it, or `margin-right: calc(var(--base-size-12) - 0.25em)`. The flash-message `::before` path is exact.

### 5. NIT: flash box follows the legacy github.com `.flash`, not current Primer React Flash

- **Ours.** 20px/16px padding, 63px on one line.
- **Primer React Flash.** 16px padding, 67px on one line, with the icon in a 24px-high visual slot.
- Both specs are GitHub's own, so this is not a defect. Recorded for the final gate.

### 6. NIT (not new this round): ConfirmationDialog width

- The Gitea confirm modal is 480px (`--overlay-width-medium`).
- Primer React ConfirmationDialog is 320px (storybook `components-confirmationdialog--default-light-1440.png`: 320×217).
- The button labels are Gitea's "Yes" / "Confirm", not GitHub's verb labels. That is a known gap (Gitea copy).

### 7. Known, accepted: flash messages have no dismiss button

That needs markup and JS, so it is not a CSS task.

## Builder claims checked

| claim | result |
|---|---|
| Lint clean, 2 old warnings | confirmed (0 errors, 2 warnings) |
| Served files verified | confirmed (served sha256 == dist) |
| Account icon: variant colour, 12px margin | colour confirmed. The margin is 12px, but the text starts 15.8px after the icon (issue 4) |
| Hanging icon, top 22.5px, text 12px after the icon | confirmed (left 16, top 22.5, text x=45) |
| Danger rest/hover/active/focus values | confirmed exactly, light and dark |
| Labels / Delete Branch / admin Delete User danger; repo delete unchanged | confirmed |
| Project board stays green | confirmed (Delete Column and Delete Project) |
| Caps 7.5 / 4.5 / 3.5 Select rows, 9.5 scrolling rows | confirmed (248 / 152 / 120 / 304 px) |
| Shades only toward hidden content | confirmed (the sort menu shows none; top shade appears only when scrolled) |

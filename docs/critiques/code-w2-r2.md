# Critique: code (src/code), wave 2, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Verdict: **8.5 / 10, pass.** Console errors 0, literal colours 0, smoke green.

All three round-1 majors are fixed, and I verified each one myself. The syntax claim holds in direction but not in exact size: the numbers are slightly higher than the builder reported, and files outside the five used to derive the rules improve much less (details below).

## What I verified myself

| Check | Result |
|---|---|
| `node build/lint.mjs code` | 0 errors, 0 warnings, 380 selectors |
| `npm run build` | `folders.code` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 11, bytes: 70311}` |
| Served vs dist | sha1 identical for auto `4a7a200f95d8`, light `db502454a037` and dark `f07229e55066`. I did not redeploy. |
| Shoot: 17 routes × light/dark × 1440/390, `--states --measure`, into `shots/critic-code-r2` | Routes are the builder's 16 plus `repo-code-file-dfa`; routes file `shots/critic-code-r2-routes.json`.<br>68 pages: 0 console errors, 0 failed requests, 0 off-palette colours, 0 non-Octicon icons (1888 masked), 0 pages with unlayered Gitea CSS.<br>Only unresolved var: `--indent-markers`, from CodeMirror's injected CSS, 0 live matches.<br>One of my own states (`raw-focus`) failed because my Gitea selector was wrong. Not a theme defect. |
| github.com reference, logged out | 6 routes with states and `--measure`, into `shots/critic-code-r2-ref` |
| Smoke `node tools/shoot/smoke.mjs --theme github-auto` | **green**: 12/12 steps, 0 console errors (`shots/20260930-040029-smoke-github-auto/smoke.json`) |
| Admin diff style | My `?style=split` route saved "split". I reset it with `/pulls/42/files?style=unified` and checked that the commit page renders unified again (0 split, 1 unified). |

## Round-1 majors: re-verified

1. **Web editor active line number: fixed.**
   - My probe (`ed.js` on `/_edit/main/SMOKE.md`) measured `.cm-activeLineGutter` at rgb(31,35,40) on rgba(129,139,152,.12) in light, and rgb(240,246,252) on rgba(101,108,118,.2) in dark.
   - Gutter padding measures `0 8px 0 16px`.
   - Line 20 is clearly readable in `shots/critic-code-r2/web-editor/states/{light,dark}-1440-editor-focus-clip.png`.
2. **Mobile blob header: fixed as far as CSS allows.**
   - It is now 360×72, two rows: the info line, then [Raw | Blame] [copy | download] [pencil] (`states/light-390-header-390.png`).
   - GitHub's is 390×46 (`shots/critic-code-r2-ref/repo-code-file/states/light-390-header-390.png`); that remaining gap needs a template change.
3. **Rust syntax: large gains on the derivation files, modest ones elsewhere.**
   - I compared every character's colour with github.com for whole files, against the round-1 CSS injected by route interception (`shots/critic-code-r2-work/syn.mjs`, `cmp.py`). Percentages are characters coloured differently from github.com:

     | File | r1 CSS | r2 CSS | Used to derive the rules? |
     |---|---|---|---|
     | main.rs (light) | 16.7 % | **7.1 %** (lines 1–219: 0.8 %) | yes |
     | main.rs (dark) | 16.7 % | 7.1 % | yes |
     | dfa.rs | 22.3 % | **13.2 %** | yes |
     | cluster.rs (light / dark) | 28.7 % | **16.6 % / 16.7 %** | no |
     | component.rs | 33.3 % | **26.9 %** | no |
     | grapheme.rs | 26.2 % | **24.9 %** | no |
     | format.rs | 19.3 % | **19.8 %** (slightly worse) | no |

   - The builder's 5.4 % (main.rs) and 11.0 % (dfa.rs) are a little lower than my whole-file numbers. The direction is confirmed.
   - On the four files not used to derive the rules, the average goes from 26.9 % to 22.1 %. The "may fit other Rust code less well" caveat is real.

Round-1 minors and nits I confirmed:
- **Diffstat:** +3 −3 renders as 2 green, 2 red and 1 neutral 8 px square, the same as github.com (`shots/critic-code-r2-work/diffstat-sbs.png`).
- **"+" add-comment button:** it now straddles the boundary, and the +/− marker is visible.
- **Inline code in commit subjects:** plain mono, matching GitHub (`home-l.png` against `gh-home-l.png`).
- **Blob header groups:** copy+download and pencil+trash are bordered 28 px groups. The disabled state on a tag view (`tag-hdr-l.png`) uses bg rgb(239,242,245), a border of rgba(129,139,152,.1) and an icon of rgb(129,139,152), which are Primer's default-button disabled tokens.

## Measured equal to github.com (ours = GitHub)

- **Blob header:** 46 = 46 px. Background rgb(246,248,250) light and rgb(21,27,35) dark. Border rgb(209,217,224) light and rgb(61,68,77) dark.
- **Raw button:** 42.1×28 = 42.1×28. Padding 0 8, radius 6, 12 px / 500, colour rgb(37,41,46), shadow `rgba(31,35,40,.04) 0 1px 0`. Line-height is 20 against 18.
- **Line numbers:** 12/20, rgb(89,99,110) light and rgb(145,152,161) dark. The digits end 56 px from the box edge on both.
- **File tree:** selected item 32 against 32.2 px, rgba(101,108,118,.2) in dark on both.
- **File list:**
  - Rows are 41 = 41 px and 14 px.
  - "445 Commits" is 119.2×28 against 116×28.
- **Diff:**
  - File header 1374×41 on both, with padding 4/8 and radius 6.
  - Number columns 88×28.
  - Hunk row bg rgb(221,244,255) and hunk number rgb(182,227,255), the same on both.
  - At 390 the unified diff is nearly pixel-identical (`pr390-sbs.png`).

## Issues (most important first)

### 1. MINOR: Rust highlighting is still visibly off on the first screen of the files not used to derive the rules

- **Where:** `repo-code-file-dfa`, dark 1440. Compare `shots/critic-code-r2-work/dfa-d.png` with `gh-dfa-d.png`. Lines 1–45 of dfa.rs differ on 11.0 % of characters, component.rs on 23.6 %.
- **Struct fields are inconsistent.** In `pub(crate) struct Dfa<'a> { alphabet: BTreeSet<…>, graph: StableGraph<…>, initial_state: State, … }`, only `initial_state` is blue. GitHub colours all five fields blue.
  - Cause: `.w:first-child + .n:has(+ .nc + .p)` requires the `.nc` to be followed by `.p`. For `BTreeSet<` the next token is `.o`.
  - Suggested fix: `.w:first-child + .n:has(+ :is(.nc, .kt, .nb))`.
- **Module segments turn orange by mistake.** A segment just before `::{` is coloured orange: `io` in `use std::io::{…}` (main.rs line 23, first screen), and `stable_graph`, `cmp` and `collections` in dfa.rs. GitHub keeps them default.
  - Cause: the rule `.k + .w + .n + .n:has(+ .p)` also matches the `{` punctuation.
  - Suggested fix: require `.p + .w:last-child`, which is only true for the closing `;`.
- **Remaining gaps are expected.** Names inside `{…}` import lists, and `#[derive(Clone, Debug…)]` names (one `.cp` span, blue against GitHub's orange), cannot be fixed with CSS.
- **Maintainability.** About 90 machine-derived n-gram selectors are hard to review, and one held-out file (format.rs) got slightly worse. Keep the leave-one-out validation and add at least two files that were not used to derive the rules (cluster.rs and component.rs) as a guard.

### 2. MINOR: Markdown source view is still at 27.5 % of characters differing, unchanged from round 1

- **Where:** `README.md?display=source` against `?plain=1`.
- **Measured:** 5194 of 18880 characters (`syn/gt-README.md-light.json`). The round-1 CSS gives the same number.
- **Out of reach for CSS:** most of it is GitHub highlighting the fenced code inside the markdown (constant colour on prose in the `grex -h` block, entity colour on `RegExpBuilder::from`).
- **Class-level mismatches** that a rule could fix:
  - Link punctuation `](`, `[`, `)`, `[![`: GitHub uses the string colour, ours is default (208 runs).
  - The inline-code backtick: GitHub uses string, ours uses constant (48 runs).
  - Escapes such as `\u` and `\.`: GitHub uses default, ours uses string (100 runs).

### 3. MINOR: at <768 px, History and Delete file are unreachable from the file view

- `file-view.css` hides Permalink, History, RSS and trash below 768 px. I proposed this in round 1, and I am correcting it here.
- On github.com mobile, History stays reachable through the history icon in the latest-commit box, and Delete through the kebab (`shots/critic-code-r2-ref/repo-code-file/states/light-390-header-390.png`).
- Ours hides the History button, and `#repo-file-commit-box` has no history link, so there is no path to either.
- **Fix:** keep the History button as an icon-only button (the history octicon) at <768 px. It fits on the second row: Raw|Blame, copy|download, pencil, history.

### 4. MINOR (template, acknowledged): blob header structure

- Missing on ours: the Code/Blame segmented control, the "N lines (M loc)" format, and the pencil ▾ split button.
- Ours shows [Raw | Permalink | Blame | History]. GitHub shows [Raw | copy | download] (`light-1440-file-action-hover-clip.png` on both targets).
- The mobile header is 72 against 46 px.

### 5. NIT

- **Mobile blob box:** it has a 16 px side gutter at 390 (box x = 16), while GitHub's blob box runs edge to edge (x = 0). That is page layout, likely pages-repo.
- **Commit detail at 390:** the file header wraps onto two rows (path, then +2 −2 and the squares), where GitHub keeps the stats before the filename on one row (`commit-d390.png`).
- **Unfixed items the builder acknowledged:**
  - Rust char literals inside `#[arg(...)]` (`'D'`, `'S'`, `'W'`) are constant blue, where GitHub uses string.
  - `use indoc::indoc;` is orange.
- **Directory view:** no table head row (CR-3 filed). Blame has no heat stripe (Gitea emits no age data). Hidden `svg-mfi-*` pool flattening (comment kept).
- **CLS:** web-editor 0.804 at 390. Round 1 showed it does not come from this folder.

## Score rationale

- **Desktop:** every code surface I measured (file list, file tree, blob header and body, diffs unified and split, hunk and expander states, diffstat, web-editor chrome) matches github.com within 1–3 px in both schemes, and reads as GitHub.
- **Mobile:** the blob header is now reasonable, and the unified diff at 390 is nearly identical.
- **What remains:**
  - Syntax colours differ on about 7–27 % of characters in Rust files, and the gap is visible on the first screen of dfa.rs and component.rs. Two simple, fixable CSS defects are part of it (issue 1).
  - Items that need template changes.
- **Verdict:** this is "matches with nits": **8.5**. Fixing the two Rust position bugs and keeping History reachable on mobile would firm it up.

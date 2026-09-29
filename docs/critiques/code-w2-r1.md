# Critique: code (src/code), wave 2, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Verdict: **8.2 / 10, not a pass (below 8.5).** Console errors 0, literal colours 0, smoke green.

## What I verified myself

| Check | Result |
|---|---|
| `node build/lint.mjs code` | 0 errors, 0 warnings, 343 selectors. The full lint run is also clean. |
| `npm run build` | `folders.code` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 11, bytes: 56739}` |
| Served vs dist | `theme-github-auto.css` sha1 is identical (`1c20c27…` before my CLS experiment, `3a978c1…` after the final rebuild; both matched the served bytes). I did not redeploy. |
| Shoot: 16 routes (the builder's 15 plus `web-editor` = `/_edit/main/SMOKE.md`, view only) × light/dark × 1440/390, `--states --measure`, output in `shots/critic-code-r1` | 64 pages: 0 console errors, 0 failed requests, 0 off-palette colours, 0 live unresolved vars, 0 non-Octicon icons (1652 masked), 0 pages with unlayered Gitea CSS. 24 state captures, none failed. |
| Unresolved vars | Only `--indent-markers`, from CodeMirror's own injected CSS (`.ͼ1 .cm-indent-markers::before`), with 0 live matches. Not this folder. |
| github.com reference (logged out), 10 routes with states and `--measure`, output in `shots/critic-code-r1-ref` | captured. My routes file is `shots/critic-code-r1-routes.json` and adds code-specific measure selectors for both targets. |
| Smoke `node tools/shoot/smoke.mjs --theme github-auto` | **green**: 12/12 steps, 0 console errors (`shots/20260930-032813-smoke-github-auto/smoke.json`) |
| CLS | High values: web-editor 0.804 at 390 (0.357 at 1440), repo-home 0.35 at 390, file-view-markdown 0.18 at 390. I tested with the served CSS swapped for a build without the code folder (`shots/critic-code-r1-work/cls.mjs`, 3 runs each). The values are identical: web-editor 0.804, then 0.804; repo-home 0.23–0.27 in both; markdown 0.11–0.18 in both. **None of it comes from this folder.** The editor shift is `div.commit-form-wrapper`, which moves when CodeMirror mounts. |
| Syntax, my own per-character check | Probes `chars-gh.js` and `chars-gt.js` with `cmpchars.py`: GitHub's DOM colours against ours, lines aligned by text, first 219 lines of grex `src/main.rs`. **780 of 5472 non-space characters differ (14.3 %), in both light and dark.** |

Side effect I fixed: visiting `?style=split` saves the admin's diff style. When I finished, I reset it by opening a `?style=unified` page, and confirmed the commit page renders unified again.

## Where it is already indistinguishable (measured, ours = github.com)

- **Repo file list** (`repo-home`, light and dark, 1440 and 390; `shots/critic-code-r1-work/home-l*.png`, `home-d390.png`):
  - Rows 41 px with 16 px left padding and 14/21 text.
  - Folder icon rgb(84,174,255) in light. In dark, folders and files are muted, as on GitHub.
  - Commit avatar 20 px round with the same 1 px inset shadow.
  - "445 Commits" button is 28 px tall, 8 px padding, radius 6, 12 px / 500 (119×28 against 116×28).
  - The mobile layout (avatar, author, age … history icon) matches GitHub.
- **Blob view** (`blob-l.png`, `blob-hdr-l.png`):
  - Header 46 = 46 px, `--bgColor-muted`, radius 6 6 0 0.
  - Raw button 42.1×28 on both, same bg, border, radius and shadow.
  - File info 12/18 mono muted.
  - Line numbers 12/20 rgb(89,99,110).
  - The selected-line highlight (`sel.png`) and its line menu button are visually identical.
- **File tree** (`st-tree-dark.png`):
  - Items 32 (GitHub 32.2).
  - Selected item rgba(129,139,152,.15) with radius 6, plus the accent bar.
  - Nesting offset (34 px to the icon) is the same.
  - Hover is the same.
- **Diffs** (`pr-l.png`, `pr-hdr-l.png`, `prsplit-d.png`, `pr-390.png`):
  - File header 41 px, padding 4/8, bg rgb(246,248,250) light and rgb(21,27,35) dark.
  - Path 12 px mono.
  - Number columns 88 px (2×44).
  - Hunk rows 28 px, `hunkLine` rgb(221,244,255) light and rgba(56,139,253,.1) dark; `hunkNum` rgb(182,227,255) and rgb(12,45,107).
  - Addition, deletion and word colours match.
  - The expander hover (solid accent with a white icon) matches GitHub's `Expand Up` state pixel for pixel.
  - Split view in dark and unified at 390 are very close.

## Issues (most important first)

### 1. MAJOR: web editor, the active line's number is invisible in both schemes

- **Where:** `web-editor`, `shots/critic-code-r1/web-editor/states/{light,dark}-1440-editor-focus.png`, zoomed in `shots/critic-code-r1-work/editor-zoom.png`. Line 20 has no readable number.
- **Measured** (`ed.js` probe) on `.cm-activeLineGutter`:
  - Light: color **rgb(255,255,255)** on rgba(129,139,152,.12) over white.
  - Dark: color **rgb(13,17,23)** on rgba(101,108,118,.2) over #0d1117.
  - Contrast is about 1.1:1.
- **Cause:** `code.important.css` (and `editor.css`) set `color: var(--codeMirror-gutterMarker-fgColor-default)`. In Primer 11.10 that token is `var(--bgColor-default)`. It is meant for a marker drawn on an emphasis background, not for a line number.
- **Fix:** in `code.important.css`, `.code-editor-container .cm-activeLineGutter { color: var(--fgColor-default) !important; }`, and the same in `editor.css`.
- **Related minor:** `.cm-gutters .cm-lineNumbers .cm-gutterElement { padding: 0 8px 0 16px }` in `editor.css` never applies, because CodeMirror's unlayered base theme wins. It measures `0 3px 0 5px`, so the gutter is 22.8 px wide and numbers sit 5 px from the edge. Move it to the important file or drop it.

### 2. MAJOR: syntax colours, 14.3 % of Rust characters still differ, and the gap shows on the first screen of every Rust file

- **Where:** `repo-code-file`, `blob-l.png` and `blob-390.png`, lines 19–24 and 26.
- **What happens:** GitHub colours the imported types orange (`ArgAction`, `Parser`, `RegExpBuilder`, `Itertools`, `BufRead`, `Error`, `ErrorKind`, `IsTerminal`, `Read`, `PathBuf`, `Command`, `Write`). Ours renders them all in `--fgColor-default`.
- **Mismatch buckets** (light; dark is the same):
  - GitHub constant blue rgb(5,80,174) vs our default: 361 characters. These are struct fields such as `is_digit_converted` and `file_path`, plus `&`.
  - Entity purple rgb(102,57,186) vs default: 272. Method calls such as `with_verbose_mode`, `into`, `parse`, `from`, and `Ok`/`Err`.
  - Variable orange rgb(149,56,0) vs default: 131.
  - rgb(10,48,105) string vs constant blue: 9. These are char literals `'D'`, `'S'`, `'W'`.
- **Scope of the fix:** most of this is Chroma emitting plain `.n` and cannot be fixed per class. The builder is right about that.
- **Fixable now:**
  - The Rust `.o` → inherit rule contradicts GitHub on `&`, which GitHub renders blue.
  - `Ok` and `Err` (`.nb` in Rust, forced to inherit) are coloured by GitHub in call position.
  - Rust char literals (`.sc` or `.lsc`) should get `--prettylights-syntax-string`.
  - Recheck `.nb` in Rust against the samples above.
- My number (14.3 % over 219 lines) is close to the builder's 16.7 % for the whole file, so the claim holds. It is still the most visible remaining difference on desktop.

### 3. MAJOR (mobile): the blob header is 108 px at 390, GitHub's is 46 px

- **Where:** `repo-code-file` light 390, `blob-390.png`. Measure: `.file-header` 360×**108** against GitHub's 390×**46**.
- **Ours** wraps onto three rows: the info line, then Raw/Permalink/Blame/History with download/copy/rss, then edit/delete on their own row.
- **GitHub** keeps one row: Code/Blame, symbols, and a kebab.
- **This is reachable in CSS today.** `display:none` is allowed in normal files. Below 768 px:
  - Hide `.file-header-right` secondary actions: Permalink, History, the rss link and delete (`.btn-octicon-danger`).
  - Keep Raw and Blame plus the download, copy and edit icon buttons.
  - Allow the info line to take its own row at most.
- That gives 2 rows (about 82 px) instead of 3. The builder listed this as needing a template change, but most of the gain needs none.

### 4. MINOR: diffstat squares are cut from a proportional bar

- **Where:** `pr-files-changed-unified`, `shots/critic-code-r1-work/diffstat.png` (4× zoom).
- **Ours**, for +3 −3: green, green, then a square that is half green and half red, then red, red. Squares are sharp.
- **GitHub**, for 6 changes: 2 green, 2 red, 1 neutral grey (`--bgColor-neutral-muted`), with slightly rounded corners.
- The half-and-half square is the obvious tell.
- **Fix:** a `linear-gradient` background with hard stops at multiples of 9 px can't read the ratio. The quantisation needs the width in whole squares, so this is template or JS territory. Keep it as a known gap, or at least round the ratio in the mask. As it stands the defect is visible.

### 5. MINOR: blob header button grouping differs from GitHub

- **Where:** `blob-hdr-l.png`.
- **GitHub:** a bordered ButtonGroup [Raw | copy | download] at 28 px with `--button-default-*`, then [pencil | ▾], then an invisible symbols icon.
- **Ours:** a bordered [Raw | Permalink | Blame | History] group, then five *invisible* icons (download, copy, rss, pencil, trash).
- CSS can make download and copy look like one bordered group: default-button border, a `--button-default-bgColor-rest` background, and adjacent radii.
- The missing Code/Blame segmented control and the "N lines (M loc)" format are template-level (acknowledged).

### 6. MINOR: the "+" add-comment button covers the diff marker

- **Where:** `shots/critic-code-r1/pr-files-changed-unified/states/{light,dark}-1440-add-comment-hover-clip.png`.
- The 20 px accent square sits over the `+`/`−` marker column and the first character of code.
- I could not verify GitHub's position, because the button is not visible logged out. On classic github.com it straddles the number/code boundary and leaves the marker visible.
- **Suggestion:** shift it left by one marker width, about 10 px.

### 7. MINOR: the diff code text starts 24 px after the numbers; GitHub's starts at 22 px

- `diff-code` padding-left measured 4 px (plus the 10 px escape column and the 10 px marker column), against GitHub's 22 px.
- The builder acknowledges this (the escape column is kept for Gitea's unicode toggle).
- A 2 px offset is not noticeable in the screenshots I looked at.

### 8. NIT

- **Directory view** (`dir-d.png`): GitHub has a "Name / Last commit message / Last commit date" table head row, and ours has none. This is template or pages/repo territory.
- **Inline `<code>` in commit messages:** in the file list header and rows, ours shows a grey chip. GitHub's renders it as plain mono with no visible chip on the muted header row.
- **Palette audit workaround:** `svg[id^="svg-mfi-"] * { fill: muted }` flattens a hidden symbol pool only to satisfy the audit. It is harmless, but it hides the colours from the audit rather than fixing anything visible. Keep the comment explaining this.
- **Blame:** the heat stripe and the Older/Newer legend are missing (acknowledged; Gitea emits no age data). Gitea also segments blame differently from GitHub (content, not CSS).

## Score rationale

- **Desktop:** the file list, file tree, blob body and diffs (unified, split, dark, 390) are measured equal to GitHub within 1–2 px, and read as GitHub.
- **Holding the score below 8.5:**
  - The unreadable active line number in the web editor, a clear defect in both schemes that a GitHub user would hit on every edit.
  - Syntax colouring missing on types, fields and method calls: 14 % of characters, visible on the first screen of every Rust file.
  - The three-row mobile blob header.
  - The diffstat half-square.
- **Fixes 1 and 3 are small CSS changes. With those two done and the Rust `&`/`Ok`/char fixes in, I would expect ≥ 8.5.**

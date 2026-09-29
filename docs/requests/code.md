# Requests from `icons` (wave 1, round 1)

## C-1 File-type icons like github.com (colours verified live on github.com/go-gitea/gitea)
Light: directory `rgb(84,174,255)` = `var(--treeViewItem-leadingVisual-iconColor-rest)`, file `rgb(89,99,110)` = `var(--fgColor-muted)`.
Dark: both `rgb(145,152,161)` = `--fgColor-muted` (the token already resolves that way in dark). 16px.
Gitea hooks (`web_src/css/base.css:878-889`, global): `.svg.octicon-file-directory-fill, .svg.octicon-file-directory-open-fill,
.svg.octicon-file-submodule { color: var(--color-primary) }` and `.svg.octicon-file, .svg.octicon-file-symlink-file,
.svg.octicon-file-directory-symlink { color: var(--color-secondary-dark-7) }`. Proposed (code owns these selectors):
```css
.svg.octicon-file-directory-fill,
.svg.octicon-file-directory-open-fill { color: var(--treeViewItem-leadingVisual-iconColor-rest); }
.svg.octicon-file, .svg.octicon-file-symlink-file, .svg.octicon-file-directory-symlink,
.svg.octicon-file-submodule { color: var(--fgColor-muted); }   /* submodule colour on GitHub not verified yet */
```
(Note: `--treeViewItem-leadingVisual-iconColor-rest` is currently pruned from dist — referencing it keeps it.)

## C-2 Material file icons → Octicons, theme-scoped (only needed if the integrator keeps FILE_ICON_THEME = material)
Needs `src/icons/octicon-masks.css` in the build (docs/requests/icons.md I-4). Tested by injection on /admin/jiri under
the GitHub preview: `shots/icons-r1-mask-filelist-compare.png`.
```css
svg.git-entry-icon { background-color: var(--fgColor-muted); mask: var(--gh-octicon-file) center / contain no-repeat; }
svg.git-entry-icon > use { visibility: hidden; }
svg.git-entry-icon.octicon-file-submodule { mask-image: var(--gh-octicon-file-submodule); }
```
(Directories are already basic Octicons: `FOLDER_ICON_THEME` defaults to `basic`.)

## C-3 Tree view chevrons 12px
github.com code tree: `octicon-chevron-right` / `chevron-down` render at 12px (103 samples). Vue file tree
(`.view-file-tree-items .item-toggle .svg`) uses 16. Set width/height/min-width/min-height to `var(--base-size-12)`.

# Round 2 (icons)
## C-1 (clarified) directory colour depends on the token being kept AND on integrator I-6
- Referencing `var(--treeViewItem-leadingVisual-iconColor-rest)` from `src/code` keeps it in dist (pruning keeps
  referenced tokens). **After your build, verify** `svg.octicon-file-directory-fill` computes to rgb(84,174,255) light
  and rgb(145,152,161) dark. If the token were pruned the colour falls back to inherit (critic r1: black / invisible
  folders in the round-1 mask test — that test injected C-1 without the token).
- On repo home / file view the rule is currently overridden ~1 s after load by an **unlayered** copy of Gitea's
  index.css that Vite re-inserts (integrator request I-6 in docs/requests/icons.md). Measured with C-1 in `@layer gh.code`
  and the token defined: before the lazy load rgb(84,174,255); after: rgb(9,105,218). With the I-6 fix it stays
  rgb(84,174,255) / rgb(145,152,161) (`shots/icons-r2/unlayered-index-css.json`).
- C-2 re-verified with the token and masks defined: every material file icon renders a muted octicon-file mask,
  light rgb(89,99,110) / dark rgb(145,152,161), 16px (`shots/icons-r2/cmp-d.png`, `sim/report-filelist.json`).

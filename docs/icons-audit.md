# Icon decisions

The icon policy is in [ARCHITECTURE.md §6](../ARCHITECTURE.md#6-icon-policy-srcicons).
`src/icons/gen-icons.mjs` generates the SVG overrides, CSS masks and `src/icons/manifest.json` from the pinned
Octicons package. The manifest records the generated set; this document keeps the reasons for replacements and
exceptions. Source call sites below refer to Gitea 1.27.3 and should be re-checked on upgrades.

## 1. Generation and installation

- Regenerate with `node src/icons/gen-icons.mjs`; verify with `node src/icons/gen-icons.mjs --check`.
- Gitea 1.27.3 ships Octicons 19.28.1. The generator uses pinned Octicons 19.38.0 and Gitea's SVGO normalization.
  Of the 376 existing Octicons, only `octicon-project-template` and `octicon-repo-forked-locked` have changed drawings.
- Server overrides retain Gitea's original filename and `svg <name>` class plus the replacement's Octicon class.
  They apply to every theme and take effect after Gitea restarts.
- `npm run deploy` copies overrides and removes retired files recorded in its `.gh-icons-manifest.json`.
  CSS masks handle Vue/JS icons, which are bundled into Gitea and cannot be replaced by server files.
- Masks use Gitea's served SVG files when available; drawings absent from Gitea, such as `alert-24`, use data URIs.
  The build prunes masks that no stylesheet references.

## 2. Server replacements

| Gitea icon | Octicon |
|---|---|
| `gitea-exclamation` | `octicon-alert` |
| `gitea-eclipse` | `octicon-device-desktop` |
| `gitea-whitespace` | `octicon-gear` |
| `gitea-split` | `octicon-split-view` |
| `gitea-join` | `octicon-rows` |
| `gitea-lock` | `octicon-verified` |
| `gitea-lock-cog` | `octicon-shield-check` |
| `gitea-unlock` | `octicon-unlock` |
| `fontawesome-save` | `octicon-check` |
| `fontawesome-send` | `octicon-key` |
| `material-invert-colors` | `octicon-circle` |
| `material-palette` | `octicon-paintbrush` |
| `material-folder-symlink` | `octicon-file-directory-symlink` |

These replacements preserve the original meaning across all themes: warning, system theme, diff controls,
signature state, save, credentials, graph color mode and directory symlink.

The signature icons need special care:

- `gitea-lock` means verified by a known user; `gitea-lock-cog` means verified by the instance or a trusted key.
  `shield-check` also avoids the original cog's fixed white cut-out on dark backgrounds.
- `gitea-unlock` serves both unsigned and signed-but-unverified commits, so the global replacement stays `unlock`.
  Using `unverified` globally would label unsigned commits incorrectly. The GitHub themes hide unsigned badges and
  mask signed-but-unverified badges as `unverified` in `src/data-display/`.
- A signed commit with an unknown key can lack `commit-is-signed` in Gitea's markup. Without a stable DOM marker,
  the theme cannot distinguish it from an unsigned commit.

`material-invert-colors` uses a hollow `circle` for monochrome mode: `circle-slash` reads as blocked.
`fontawesome-send` is used for access tokens, so `key` conveys its meaning better than a paper plane.

## 3. Deliberately retained icons

- **First/Last chevrons:** `gitea-double-chevron-left/right` are used for pagination and the left chevron also
  connects PR base/head branches. A global replacement cannot represent both meanings correctly. Theme-scoped
  styles hide controls absent from GitHub or use `move-to-start`, `move-to-end` and `arrow-left` masks per context.
- **Running status:** `gitea-running` has the same ring/dot/arc paths as GitHub's running Actions indicator. Keep
  its attention color and rotation rather than replacing it with a static glyph.
- **Unchecked checkbox:** `gitea-empty-checkbox` matches the outline of Octicons' checkbox. There is no equivalent
  unchecked Octicon with the same geometry.
- **Brands:** keep Gitea, Git, IDE, migration provider, OAuth, webhook service and package registry logos. The
  filename alone does not make an icon an interface glyph; npm package rows, for example, retain the npm logo.
- **Colorblind theme markers:** keep the global files, but hide the markers in the GitHub theme picker. The option's
  text still identifies the variant; changing both markers to the same glyph would discard that distinction.
- **OpenID/Windows authentication logos:** retain the global files as provider logos. Page-specific styles may hide
  redundant logos where the form already identifies the provider.

## 4. Material file icons

Material file icons are SVG symbols rendered through `<use>`, not standalone override files. The GitHub themes
mask them in `src/code/file-icons.css` to show file/directory Octicons without changing Gitea's global
`FILE_ICON_THEME` setting. Directory and file colors use the corresponding Primer tokens.

## 5. Theme-scoped mappings

- `src/icons/theme-menu.css`: theme marker presentation.
- `src/icons/pr-tabs.css` and `src/icons/nav-tabs.css`: Files changed and Projects tabs.
- `src/icons/sort-arrows.css`: table sort controls.
- `src/navigation/nav-list.css`: URL-specific settings, organization, repository and admin sidebar icons.
- Other component/page folders own masks for their own Vue/JS controls and special icon contexts.

Use 16px drawings by default, 24px drawings where appropriate for large blankslate/header icons, and 12px for
small metadata. Keep mask decisions scoped to their surface so other themes and unrelated uses remain meaningful.

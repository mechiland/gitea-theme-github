# Changelog

## 0.3.0 - 2026-11-02

### Compatibility

- Keep one installable package for Gitea 1.27.x and 28.x, verified on 1.27.3, 28.0.0, 28.1.0, 28.2.0 and 28.3.0.
- Correct avatar alignment on forced password changes while preserving each Gitea version's native navbar layout. See [#9](https://github.com/mechiland/gitea-theme-github/pull/9).

### Build and CI

- Share the supported-version matrix across source checks, package metadata and CI. Scan CSS variables and page scopes against every target, and isolate live caches by version and instance.
- Gate releases on visual regression checks and the five-version container/browser matrix. All versions test the same archive, and publication verifies their SHA-256 reports.
- Add visual comparisons against an approved baseline on Gitea 1.27.3 and 28.2.0, including PR review menus and reply editors. See [#8](https://github.com/mechiland/gitea-theme-github/pull/8).

### Upgrading from 0.2.2

Extract the new package over the existing installation, then run `gitea manager reload-templates` (or restart Gitea) to load the template changes and refresh the CSS cache key. No runtime templates or icons were added or removed. The package now includes `COMPATIBILITY.json` with the supported series, tested versions and build revision.

[Full comparison](https://github.com/mechiland/gitea-theme-github/compare/v0.2.2...v0.3.0)

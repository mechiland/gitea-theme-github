# Disposable Gitea compatibility checks

`build/gitea-versions.json` defines the five CI targets: 1.27.3 and 28.0.0–28.3.0.
Build once, then test the **same tarball** against each version. No Gitea-specific package variant is generated.

```sh
npm ci
npm run upstream
npm test
npm run lint -- --strict
npm run build -- --strict
npm run package
npx playwright install chromium
npm run compat -- --version 28.3.0 --package dist/gitea-theme-github-<version>-gitea1.27-28.tar.gz
```

The check needs Docker. It chooses a free loopback port and creates a unique container with a fresh SQLite database,
local test users, a repository, source files, Markdown/Mermaid, an issue, a two-commit pull request and a wiki.
It never connects to an existing Gitea instance. Container and data cleanup runs on success and failure.

The native forced-password navbar is rendered first with upstream templates, then compared with the package installed.
The GitHub forced-password navbar must use the common flex layout. Both are captured at desktop/mobile widths.
Repository home, directory, file, blame, commit history, issue, PR conversation/commits/diffs, wiki and settings pages
are opened with GitHub/native auto themes, light/dark schemes and 1440/390px viewports. The check also exercises fixed
light/dark themes, Mermaid rendering and actual clipboard copy. It rejects render errors, unexpected login redirects,
JavaScript exceptions, unlayered index.css and GitHub-theme horizontal overflow.

Reports and screenshots are written to `shots/compat/<version>/` (override with `--out`). `report.json` records the
input archive SHA-256. CI uploads the reports even on failure; the release job requires every version to pass and
its reported checksum to match the archive being published. The package also includes `COMPATIBILITY.json`.

This focused test does not replace `tools/shoot/` visual audits or `tools/shoot/smoke.mjs` for issue editing, merging,
workflow execution and other write-heavy flows. It does not verify every browser engine. Normal source checks are
independent of local custom themes; optional live page-scope checks require `--version`, verify `/api/v1/version`,
and isolate cached page classes by Gitea version and instance URL. Set `GITEA_STORAGE_STATE` to the desired browser
storage-state file when inspecting a live instance.

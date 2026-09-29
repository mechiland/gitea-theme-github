# Requests for pages/issues-prs

# Pointer from the integrator (2026-09-30)
- **P-1 (from icons, docs/requests/icons.md "P-1 → pages/issues-prs"):** PR-list "base ← head" glyph. The server file
  `gitea-double-chevron-left` is Gitea's original `«`; mask it in GitHub themes with `--gh-octicon-arrow-left` (12px):
  `#issue-list .branches > .svg.gitea-double-chevron-left { background-color: currentColor; mask: var(--gh-octicon-arrow-left) center / contain no-repeat; }`
  `#issue-list .branches > .svg.gitea-double-chevron-left > * { visibility: hidden; }`
- **From controls #3/#10:** issue-title buttons height; issue-list toolbar upsizing to 32px (github.com medium);
  comment-form buttons on mobile (controls keeps natural width — say if you want full width).
- **From data-display D-3:** timeline cross-reference state icons 12px (if page-scoped).
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.

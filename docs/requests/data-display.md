# Requests from `icons` (wave 1, round 1)

## D-1 Blankslate icon size (`.empty-placeholder`)
github.com blankslate (releases/tags empty state, measured): `svg.octicon.blankslate-icon` **24px**, colour
`rgb(89,99,110)` = `--fgColor-muted`, margin-bottom 8px, margin-right 4px (`shots/icons-gh-blankslate-releases.png`).
Gitea hard-codes 48px in every `.empty-placeholder` (`templates/org/home.tmpl:15`, `projects/list.tmpl:81,87`,
`user/notification/notification_div.tmpl:84`, `shared/search/code/search.tmpl:29`, `repo/actions/runs_list.tmpl:4`,
`repo/actions/no_workflows.tmpl:2`, `package/shared/list.tmpl:47`, `org/worktime/empty_placeholder.tmpl:4`).
```css
.empty-placeholder > .svg {
  width: var(--base-size-24); height: var(--base-size-24);
  min-width: var(--base-size-24); min-height: var(--base-size-24);   /* Gitea sets min-* from the width/height attrs */
  color: var(--fgColor-muted);
  margin-bottom: var(--base-size-8);
}
```

## D-2 Commit status icon 16px
`repo/icons/commit_status.tmpl` renders every state at 18px (`.commit-status.icon`); github.com shows the latest-commit
status at 16px (repo home: no non-16 octicons besides the logo). Set `.svg.commit-status` width/height/min-* to
`var(--base-size-16)`. After the icon restart the error/warning glyph is `octicon-alert` (class `gitea-exclamation octicon-alert`).

## D-3 Timeline cross-reference state icons 12px
github.com issue timeline: referenced issue/PR state icons (`issue-closed`, `issue-opened`, `git-merge`, `skip`) are
12px (github.com/go-gitea/gitea/issues/1, 42 samples). Applies to Gitea's timeline reference events (owner may be
pages/issues-prs if it is page-scoped).

# Round 2 (icons)
## D-4 No signature badge for unsigned commits
`repo/commit_page.tmpl:174` renders `commit_sign_badge` without a Commit, so `.ui.label.commit-sign-badge` is always
shown — for an unsigned commit with no `commit-is-signed` class and the `gitea-unlock` icon (after the restart:
`octicon-unverified`). github.com shows no badge for unsigned commits ("Unverified" is only for signed commits whose
signature can't be verified; Gitea adds `commit-is-signed sign-warning` there). Proposed (data-display owns `.ui.label*`):
```css
.commit-sign-badge:not(.commit-is-signed) { display: none; }
```
Verified by injection on /octo-org/theme-playground/commit/3f8fcd62 (unsigned): badge hidden, the rest of the header
unchanged (`shots/icons-r2/sim/sign-badge-*-proposals.png`, report tag `sign-badge-*-proposals`: `w: 0, visible: false`).
Commit lists are unaffected (the template already omits the badge there when unsigned).

export const meta = {
  name: 'github-theme-wave',
  description: 'Run one wave of the GitHub theme: per-folder builder→critic loops (≤4 rounds, pass ≥8.5), then the integrator',
  phases: [
    { title: 'Build & critique', detail: 'one builder per folder, independent critic after each round' },
    { title: 'Integrate', detail: 'integrator applies change requests, fixes seams, updates STATUS.json' },
  ],
}

const ROOT = '/Users/michael/work/gitea/gitea-theme-github'
const W = args
const MAX_ROUNDS = W.maxRounds || 4
const reqFile = (f) => `${ROOT}/docs/requests/${f.id.replace('/', '-')}.md`

const COMMON = `
You are part of a multi-agent team building the "GitHub" theme for Gitea 1.27.3 (make a self-hosted Gitea look and behave like github.com, light + dark).
Project root: ${ROOT}. READ FIRST: ${ROOT}/docs/CONTEXT.md, ${ROOT}/ARCHITECTURE.md (cascade/@layer model, token layer, lint, ownership table, icon & template policies), ${ROOT}/docs/research/gitea-1.27.3.md (Gitea source facts, selectors per area), ${ROOT}/tools/shoot/README.md (screenshot/audit/measure tooling).
Sources of truth: Primer Primitives tokens (already generated into ${ROOT}/src/tokens/generated/, names verbatim e.g. --bgColor-default, --button-primary-bgColor-rest, --control-medium-size, --borderRadius-medium), Primer CSS component SCSS in ${ROOT}/node_modules/@primer/css/<module>/*.scss (exact component specs: buttons/, forms/, navigation/, labels/, box/, tooltips/, toasts/, avatars/, markdown/, header/, pagination/, alerts/ etc.), Octicons in ${ROOT}/node_modules/@primer/octicons/build/svg, primer.style docs (you may browse https://primer.style/product/components/... and github.com with Playwright or WebFetch), and the Gitea 1.27.3 source at /Users/michael/work/gitea/gitea-src-1.27.3 (templates/, web_src/css/) — base selectors on that source, not memory.
Hard rules:
- Edit ONLY files you own (stated below). Shared changes (token mapping src/tokens/*, build/*, templates/*, tools/*, app.ini, another folder) → write a change request to ${ROOT}/docs/requests/<your-folder-id>.md (append; say what/why/exact proposed diff). Never edit another folder.
- No literal colors anywhere in your folder (hex/rgb/hsl/named) — Primer tokens only (var(--…)); type, radii, shadows, z-index, durations from tokens; spacing from --base-size-*/--space-*/--stack-*/--control-* tokens. The lint (node build/lint.mjs) enforces this; a folder with lint errors is dropped from the build.
- Our CSS is in @layer gh.<folder>, above Gitea's CSS (layer "gitea"): win by layer, use plain low-specificity selectors, NO !important in normal files. Only to beat unlayered lazy-chunk CSS, inline styles or Gitea !important use a <name>.important.css file in your folder (never display/visibility there).
- Deploy with: cd ${ROOT} && npm run deploy (builds all folders from src, copies to Gitea, verifies served bytes). It is safe to run any time; never restart Gitea (the integrator does that) and never change the admin theme to anything but github-auto.
- Screenshots: node tools/shoot/shoot.mjs --target gitea --theme github-auto --only <route ids> [--states] [--measure] --out shots/<your-folder-id>-r<round>. If the theme is not registered yet the tool runs in PREVIEW mode automatically (equivalent rendering). Add routes/states you need to tools/shoot/routes.json ONLY via a change request, or pass your own routes file with --routes shots/<your-folder-id>-routes.json (copy + extend routes.json into your own file — that's allowed).
- Reference: node tools/shoot/shoot.mjs --target github --only <ids> --routes <file> (writes docs/reference/<id>/…). github.com is captured logged-out. Never submit forms on github.com, never log in anywhere on github.com.
- Look at every screenshot you rely on (Read the PNG). Never claim anything you have not screenshotted and looked at. Report real numbers; never inflate.
- Only touch seeded data in Gitea (octo-org/*, seeded users) — read-only viewing of other pages is fine. Never touch admin/jiri, ai/jiri, admin/eveland content.
- Do not git commit (the orchestrator commits between waves).
`

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'what you built/changed this round' },
    files: { type: 'array', items: { type: 'string' } },
    screenshotsReviewed: { type: 'array', items: { type: 'string' }, description: 'PNG paths you actually looked at' },
    deployOk: { type: 'boolean' },
    lintErrors: { type: 'number' },
    changeRequests: { type: 'array', items: { type: 'string' } },
    knownGaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'files', 'deployOk', 'lintErrors', 'knownGaps'],
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number', description: '0-10: 10 indistinguishable from github.com, 8.5 matches with nits, 7 recognisably GitHub-inspired, 5 recoloured Gitea' },
    consoleErrors: { type: 'number' },
    literalColors: { type: 'number', description: 'lint literal-color errors in this folder + off-palette colors attributable to this folder' },
    smoke: { type: 'string', enum: ['green', 'red', 'skipped-seed-missing', 'not-run'] },
    measurements: { type: 'array', items: { type: 'object', properties: { control: { type: 'string' }, property: { type: 'string' }, ours: { type: 'string' }, github: { type: 'string' }, ok: { type: 'boolean' } }, required: ['control', 'property', 'ours', 'github', 'ok'] } },
    issues: { type: 'array', description: 'ranked most important first', items: { type: 'object', properties: { severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] }, title: { type: 'string' }, detail: { type: 'string', description: 'where (route/state/scheme/viewport/selector), measured vs expected, evidence PNG path' } }, required: ['severity', 'title', 'detail'] } },
    screenshotsReviewed: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['score', 'consoleErrors', 'literalColors', 'smoke', 'issues', 'summary', 'measurements'],
}

function builderPrompt(f, round, lastCritic, lastBuild) {
  return `${COMMON}
ROLE: builder for folder "${f.id}". You own ONLY: ${f.owns}. Wave ${W.wave}, round ${round}/${f.maxRounds || MAX_ROUNDS}.
FIRST read ${reqFile(f)} if it exists: other folders and the integrator forward requests to you there (mark each one you handle DONE with a one-line note). Your own outgoing change requests go to the OWNER's request file (docs/requests/<owner-id>.md, integrator = docs/requests/integrator.md).
SCOPE / BRIEF:
${f.brief}
Routes to verify with (ids in tools/shoot/routes.json; extend in your own routes file if needed): ${f.routes}
${round === 1 ? `This is the first round: study the Gitea markup (templates + live DOM via Playwright), the Primer spec for each component, and github.com/primer.style reference, then implement. Organize your folder as index.css @importing one file per component.` : `Previous round summary: ${lastBuild ? lastBuild.summary : 'n/a'}
An independent critic scored round ${round - 1}: ${lastCritic.score}/10 (pass needs ≥ 8.5, zero console errors, zero literal colors, smoke green). Critic summary: ${lastCritic.summary}
RANKED ISSUES to fix (fix all blockers/majors first, then as many minors/nits as possible):
${lastCritic.issues.map((i, n) => `${n + 1}. [${i.severity}] ${i.title} — ${i.detail}`).join('\n')}
Measurements that were off:
${(lastCritic.measurements || []).filter((m) => !m.ok).map((m) => `- ${m.control} ${m.property}: ours ${m.ours} vs github ${m.github}`).join('\n') || '(none listed)'}`}
Work loop: implement → node build/lint.mjs ${f.id} → npm run deploy → screenshot light+dark, 1440+390, the interaction states that matter for your components (hover, focus-visible, active/pressed, disabled, open, error) → Read the PNGs → compare against reference side by side and with --measure numbers → iterate until you believe it matches github.com. Don't stop at "looks close": measure heights, paddings, radii, border colors, font sizes/weights, line-heights, focus rings, hover/pressed colors, icon size/baseline.
Return the structured summary (be honest in knownGaps).`
}

function criticPrompt(f, round, build) {
  return `${COMMON}
ROLE: independent critic — a GitHub design-systems reviewer. You WRITE NO THEME CODE and edit no files except your own notes under ${ROOT}/docs/critiques/${f.id}-w${W.wave}-r${round}.md (write your full critique there too; ids with '/' use '-' in file names). You may create your own routes file under shots/ and run any tools.
Folder under review: "${f.id}" (owns: ${f.owns}). Wave ${W.wave}, round ${round}. Builder's claim: ${build ? build.summary : '(builder returned nothing)'}; builder's known gaps: ${build ? (build.knownGaps || []).join('; ') : ''}.
Brief the builder worked from:
${f.brief}
Relevant routes: ${f.routes}
Do your OWN verification — don't trust the builder:
1. node build/lint.mjs ${f.id} (count errors), npm run build to be sure the folder is included (dist/build-report.json → folders["${f.id}"].status must be "ok"). Do NOT run deploy unless the served files are stale (compare dist vs http://localhost:3000/assets/css/theme-github-auto.css).
2. Screenshots in light AND dark, 1440 AND 390, with --states (hover, focus-visible, active, disabled, open dropdown/modal where relevant, validation error) → shots/critic-${f.id}-r${round}. Read the PNGs. Check the JSON logs: console errors, failed requests, unresolved CSS vars, off-palette colors (attribute them: is it this folder's surface?), non-Octicon icons.
3. Capture github.com reference for comparable pages/components (logged out) and primer.style component docs when github.com logged-out lacks the component; compare side by side. MEASURE with --measure on both (control heights, padding, radii, border colors, font sizes and weights, line heights, focus ring width/color/offset, hover and pressed colors, icon size and baseline alignment, spacing on the Primer scale) and fill the measurements array with real numbers.
4. Smoke test: node tools/shoot/smoke.mjs --theme github-auto → green/red; if it prints SKIPPED because the seed is missing, report "skipped-seed-missing".
Score 0–10 strictly: 10 = indistinguishable from github.com, 8.5 = matches with nits, 7 = recognisably GitHub-inspired, 5 = recoloured Gitea. Pass requires ≥ 8.5 AND zero console errors AND zero literal colors AND smoke green (skipped-seed-missing is recorded, not a pass by itself). Rank issues most important first with precise evidence (route, scheme, viewport, state, selector, measured vs expected, PNG path). Never inflate.`
}

function passes(c) {
  if (!c) return false
  const smokeOk = c.smoke === 'green' || (W.allowSmokeSkip && c.smoke === 'skipped-seed-missing')
  return c.score >= 8.5 && c.consoleErrors === 0 && c.literalColors === 0 && smokeOk
}

async function runFolder(f) {
  const rounds = []
  let lastCritic = null
  let lastBuild = null
  const maxR = f.maxRounds || MAX_ROUNDS
  if (f.startWithCritic) {
    const c0 = await agent(criticPrompt(f, 0, { summary: f.startWithCritic, knownGaps: [] }), { label: `critic:${f.id}#0`, phase: 'Build & critique', schema: CRITIC_SCHEMA, effort: 'high' })
    rounds.push({ round: 0, build: null, critic: c0 })
    log(`${f.id} re-score (round 0): ${c0 ? c0.score : 'n/a'}`)
    if (passes(c0)) return summarize(f, rounds)
    lastCritic = c0 || { score: 0, issues: [], summary: 'critic failed', measurements: [] }
  }
  for (let round = 1; round <= maxR; round++) {
    const build = await agent(builderPrompt(f, round, lastCritic, lastBuild), { label: `build:${f.id}#${round}`, phase: 'Build & critique', schema: BUILD_SCHEMA })
    const critic = await agent(criticPrompt(f, round, build), { label: `critic:${f.id}#${round}`, phase: 'Build & critique', schema: CRITIC_SCHEMA, effort: 'high' })
    rounds.push({ round, build, critic })
    log(`${f.id} round ${round}: score ${critic ? critic.score : 'n/a'}${critic ? ` (console ${critic.consoleErrors}, literal ${critic.literalColors}, smoke ${critic.smoke})` : ''}`)
    lastCritic = critic || { score: 0, issues: [{ severity: 'blocker', title: 'critic failed', detail: 'no critique returned' }], summary: 'critic failed', measurements: [] }
    lastBuild = build
    if (passes(critic)) break
  }
  return summarize(f, rounds)
}

function summarize(f, rounds) {
  const final = rounds[rounds.length - 1]
  return { id: f.id, passed: passes(final.critic), finalScore: final.critic ? final.critic.score : null, rounds: rounds.map((r) => ({ round: r.round, score: r.critic && r.critic.score, consoleErrors: r.critic && r.critic.consoleErrors, literalColors: r.critic && r.critic.literalColors, smoke: r.critic && r.critic.smoke, topIssues: r.critic ? r.critic.issues.slice(0, 8) : [], builderGaps: r.build ? r.build.knownGaps : [] })) }
}

phase('Build & critique')
const results = await pipeline(W.folders, (f) => runFolder(f))

phase('Integrate')
const integ = await agent(`${COMMON}
ROLE: INTEGRATOR (the only agent allowed to touch src/tokens/*, build/*, templates/*, tools/*, app.ini, docs/STATUS.json, and to restart Gitea). Wave ${W.wave} builders are done.
Results per folder (JSON): ${JSON.stringify(results)}
Tasks:
1. Read every change request in ${ROOT}/docs/requests/*.md. Apply the sound ones (token mapping tweaks in src/tokens/gitea-map.css, build fixes, routes.json additions, tools fixes). Reject unsound ones with a written reason appended to the request file. Mark handled requests as DONE/REJECTED in the file.
1b. You may be blocked by the permission policy from writing Gitea's live CUSTOM_PATH templates or running docker commands. If so, do NOT retry around it: write the exact change (file, full new content or diff, and the command) to ${ROOT}/docs/requests/ORCHESTRATOR.md and continue; the orchestrator applies it.
2. Fix seams between folders (duplicate-ownership lint errors, conflicting rules) — by moving rules to the owning folder or telling the owner; you may edit folders ONLY to resolve an ownership conflict, and must document it in the owner's request file.
3. ${W.integratorExtra || ''}
4. Gitea restart policy: only if needed (new theme files not yet registered, or icons changed) AND no migration in progress (check: sqlite3 -readonly /Users/michael/work/gitea/gitea/gitea/gitea.db "select id,status,repo_id,message from task where status in (0,1)" must return no rows; status 1 = running) AND no critic/builder is running (they're all done now). To restart: first make sure app.ini [ui] THEMES lists every theme currently offered plus github-auto,github-light,github-dark (current offered themes: gitea-auto, gitea-light, gitea-dark and their -protanopia-deuteranopia / -tritanopia variants, modern, modern-light, modern-dark, studio, studio-tritanopia — verify on /user/settings/appearance), keep DEFAULT_THEME unchanged, then: docker restart gitea-server, wait for http://localhost:3000/api/v1/version, and verify github-auto is offered and every previously offered theme still is. If a migration is running, do NOT restart; record "restart pending" in STATUS.json instead.
5. npm run deploy; run a full screenshot pass: node tools/shoot/shoot.mjs --target gitea --theme github-auto --out shots/integrate-w${W.wave} (all routes, both schemes, both viewports), check summary.json (console errors, failed requests, unresolved vars, off-palette colors, non-Octicon icons), look at a representative sample of PNGs, and node tools/shoot/smoke.mjs --theme github-auto.
6. Update ${ROOT}/docs/STATUS.json: phase, per-folder {score, rounds, passed, openIssues (top ones)}, templateOverrides, pinned versions, theme sizes from dist/build-report.json, restart status, global audit totals. Keep existing keys.
Return a concise report: requests applied/rejected, seams fixed, restart done or pending (why), audit totals, smoke result, remaining risks.`, { label: 'integrator', phase: 'Integrate' })

return { results, integrator: integ }
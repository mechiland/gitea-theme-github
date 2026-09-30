export const meta = {
  name: 'github-theme-final-gate',
  description: 'Final gate: whole-site critics score every route in both schemes, then blind judges try to tell ours from github.com',
  phases: [
    { title: 'Whole-site critique', detail: 'route groups, every route × light/dark × 1440/390' },
    { title: 'Blind judges', detail: 'shuffled A/B pairs, each judged by 2 judges' },
  ],
}
const ROOT = '/Users/michael/work/gitea/gitea-theme-github'
const G = args // {run, groups: [[routeIds]], pairsDir, judgeAssignments: [[pairIds]]}

const ROUTE_SCHEMA = {
  type: 'object',
  properties: {
    routes: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, light: { type: 'number' }, dark: { type: 'number' }, mobile: { type: 'number', description: '390 score (both schemes)' },
      issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] }, title: { type: 'string' }, detail: { type: 'string' }, owner: { type: 'string', description: 'owning folder per ARCHITECTURE.md §5' } }, required: ['severity', 'title', 'detail', 'owner'] } },
    }, required: ['id', 'light', 'dark', 'mobile', 'issues'] } },
    summary: { type: 'string' },
  },
  required: ['routes', 'summary'],
}
const JUDGE_SCHEMA = {
  type: 'object',
  properties: { judgments: { type: 'array', items: { type: 'object', properties: {
    pair: { type: 'string' }, github: { type: 'string', enum: ['A', 'B'] }, confidence: { type: 'number', description: '0.5 = pure guess, 1 = certain' },
    reasons: { type: 'array', items: { type: 'string' }, description: 'concrete visual tells that gave the non-GitHub side away (or why you could not tell)' },
  }, required: ['pair', 'github', 'confidence', 'reasons'] } } },
  required: ['judgments'],
}

phase('Whole-site critique')
const critiques = await parallel(G.groups.map((ids, i) => () => agent(`You are a senior GitHub design-systems reviewer doing the FINAL whole-site gate for a Gitea 1.27.3 theme that must be indistinguishable from github.com (light + dark). You write no code. Read ${ROOT}/docs/CONTEXT.md and ${ROOT}/ARCHITECTURE.md §5 (folder ownership, to attribute issues).
Screenshots of ours (fresh full run, theme github-auto): ${ROOT}/${G.run}/<routeId>/{light,dark}-{1440,390}.png (+ .json audit logs, states/ subfolder). github.com references (logged-out; the logged-out marketing header and 'Sign in' are expected differences, judge the page body and our logged-in header against github.com's signed-in header as you know it): ${ROOT}/docs/reference/<routeId>/{light,dark}-{1440,390}.png where present. Route definitions: ${ROOT}/tools/shoot/routes.json.
Your routes: ${ids.join(', ')}.
For EVERY route: look at all four of ours (light/dark × 1440/390; full pages can be tall — crop regions with python3 PIL into ${ROOT}/shots/final-gate-critic-${i}/ and Read the crops; don't skip the lower parts) and the reference where present; check the JSON logs (console errors, failed requests, unresolved vars, off-palette colors, non-Octicon icons, CLS, horizontal overflow). You may take extra live screenshots/measurements with node tools/shoot/shoot.mjs --theme github-auto --only <id> --measure --out shots/final-gate-critic-${i}/live (never change the admin theme to anything else).
Score each route separately for light, dark (1440) and mobile (390): 10 = indistinguishable from github.com, 8.5 = matches with nits, 7 = recognisably GitHub-inspired, 5 = recoloured Gitea. Gitea-only pages without a GitHub counterpart are judged on whether they read as a native Primer/GitHub page. Be strict and honest; every issue must be concrete (where, measured vs expected, PNG path) and attributed to its owning folder. Write your report also to ${ROOT}/docs/critiques/final-gate-group-${i}.md.`, { label: `final-critic:${i}`, phase: 'Whole-site critique', schema: ROUTE_SCHEMA, effort: 'high' })))

phase('Blind judges')
const judges = await parallel(G.judgeAssignments.map((pairIds, j) => () => agent(`You are a blind judge and a daily github.com user. Each image ${G.pairsDir}/<pair>.png shows two screenshots side by side, labelled A (left) and B (right). Exactly one side is a real github.com page; the other is a self-hosted clone trying to look like github.com. Browser chrome and URL are cut away. Some pairs are cropped to the page body (no global header).
Judge ONLY from the images. Do not open, list, grep or read any other file or directory (no keys, no logs, no source, no other folders) — only the PNGs named below via the Read tool.
Pairs to judge (${pairIds.length}): ${pairIds.join(', ')}.
For each pair say which side is github.com (A or B), your confidence (0.5 = pure guess … 1.0 = certain) and the concrete visual reasons (spacing, typography, color, icon, component shape, layout, content differences, logos, wording). If you truly can't tell, say so and give 0.5. Be specific: reasons will be turned into bug reports.`, { label: `judge:${j}`, phase: 'Blind judges', schema: JUDGE_SCHEMA })))

return { critiques, judges }

// Lossless size step (integrator, loop 1): factor shared selector prefixes of CONSECUTIVE style rules into CSS nesting.
//
//   P X{a}P>Y{b}        →  P{& X{a}&>Y{b}}
//   P X,P Y{a}          →  P{& X,& Y{a}}
//   P{a}P X{b}          →  P{a;& X{b}}
//
// `&` is `:is(P)`; P is one complex selector (never a list), so matching and specificity are unchanged, and only runs of
// adjacent rules in the same container are grouped, so the cascade order inside every layer / @media is unchanged.
// Applied recursively (a nested group can factor again). P never contains a pseudo-element. Runs on the final minified,
// renamed text (dist/theme-github-*.css only; *.src.css stays flat for coverage / debugging). Needs CSS nesting in the
// browser (Chrome/Edge 112+, Safari 16.5+, Firefox 117+) — build.mjs TARGETS say so; `--no-nest` turns it off.
import postcss from 'postcss';

// split at top-level characters in `seps` (outside (), [], strings; honours backslash escapes)
function scan(s, onTop) {
  let d = 0, q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { i++; continue; }
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '(' || c === '[') d++;
    else if (c === ')' || c === ']') d--;
    else if (!d) onTop(c, i);
  }
}
export function splitList(sel) {
  const out = []; let last = 0;
  scan(sel, (c, i) => { if (c === ',') { out.push(sel.slice(last, i)); last = i + 1; } });
  out.push(sel.slice(last));
  return out;
}
const PSEUDO_ELEMENT = /::|:(before|after|first-line|first-letter)\b/i;
// every prefix of a complex selector that ends right before a top-level combinator
function prefixes(sel) {
  const res = [];
  scan(sel, (c, i) => {
    if (c === ' ' || c === '>' || c === '+' || c === '~') {
      const p = sel.slice(0, i);
      if (p && !/[ >+~]$/.test(p) && !PSEUDO_ELEMENT.test(p)) res.push(p);
    }
  });
  return res;
}

function factor(nodes) {
  const out = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type === 'atrule' && node.nodes) {
      const kids = factor(node.nodes.slice());
      node.removeAll();
      for (const k of kids) { node.append(k); }
      for (const k of node.nodes) k.raws.before = '';
      out.push(node); i++; continue;
    }
    if (node.type !== 'rule') { out.push(node); i++; continue; }
    const members = splitList(node.selector);
    let common = prefixes(members[0]);
    for (const m of members.slice(1)) { const pm = new Set(prefixes(m)); common = common.filter((p) => pm.has(p)); }
    let best = null;
    for (const p of common) {
      let j = i, count = 0;
      while (j < nodes.length && nodes[j].type === 'rule') {
        const ms = j === i ? members : splitList(nodes[j].selector);
        if (!ms.every((m) => m.startsWith(p) && prefixes(m).includes(p))) break;
        count += ms.length; j++;
      }
      const gain = count * (p.length - 1) - (p.length + 2);
      if (gain > 0 && (j - i >= 2 || count >= 2) && (!best || gain > best.gain)) best = {p, j, gain};
    }
    // the rule itself can be the parent when it is exactly the prefix of the following rules: P{a}P X{b} → P{a;& X{b}}
    if (members.length === 1 && !PSEUDO_ELEMENT.test(node.selector) && node.nodes.every((n) => n.type === 'decl')) {
      const p = node.selector;
      let j = i + 1, count = 0;
      while (j < nodes.length && nodes[j].type === 'rule') {
        const ms = splitList(nodes[j].selector);
        if (!ms.every((m) => m.startsWith(p) && prefixes(m).includes(p))) break;
        count += ms.length; j++;
      }
      const gain = count * (p.length - 1) - 1;
      if (j > i + 1 && gain > 0 && (!best || gain > best.gain)) best = {p, j, gain, self: true};
    }
    if (!best) { out.push(node); i++; continue; }
    const parent = best.self ? node.clone() : postcss.rule({selector: best.p, raws: {before: '', between: '', after: '', semicolon: false}});
    parent.raws.before = '';
    const kids = nodes.slice(best.self ? i + 1 : i, best.j).map((r) => {
      const k = r.clone();
      k.selector = splitList(r.selector).map((m) => `&${m.slice(best.p.length)}`).join(',');
      k.raws.before = '';
      return k;
    });
    for (const k of factor(kids)) parent.append(k);
    for (const k of parent.nodes) k.raws.before = '';
    out.push(parent);
    i = best.j;
  }
  return out;
}

export function nest(css) {
  const root = postcss.parse(css);
  const nodes = factor(root.nodes.slice());
  root.removeAll();
  for (const n of nodes) { n.raws.before = n.raws.before || ''; root.append(n); }
  for (const n of root.nodes) n.raws.before = '';
  root.raws.after = '';
  return root.toString();
}

// Self-check used by build.mjs: lower both texts with Lightning CSS for a browser without nesting and compare the
// resulting flat rules member by member (container path + selector + declarations, in order). Adjacent rules with
// identical declarations may be merged differently by the lowering, which is why the comparison is per selector member.
export function verifyNest(flat, nested, transform) {
  const low = (c) => transform({filename: 'verify.css', code: Buffer.from(c), minify: false, targets: {chrome: 100 << 16}}).code.toString();
  const seq = (css) => {
    const out = [];
    postcss.parse(css).walkRules((r) => {
      let path = ''; for (let p = r.parent; p && p.type !== 'root'; p = p.parent) path = `${p.type === 'atrule' ? `@${p.name} ${p.params}` : p.selector}>${path}`;
      const decls = r.nodes.filter((n) => n.type === 'decl').map((d) => `${d.prop}:${d.value}${d.important ? '!' : ''}`).join(';');
      for (const m of splitList(r.selector)) out.push(`${path}${m.trim()}{${decls}}`);
    });
    return out;
  };
  const a = seq(low(flat)), b = seq(low(nested));
  if (a.length !== b.length) return {ok: false, reason: `rule count ${a.length} vs ${b.length}`};
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return {ok: false, reason: `first difference at #${i}: ${a[i].slice(0, 200)} ≠ ${b[i].slice(0, 200)}`};
  return {ok: true, members: a.length};
}

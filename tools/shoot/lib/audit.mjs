// In-page audit. `pageAudit` is serialized and executed via page.evaluate(),
// so it must be fully self-contained (no closures over module scope).
//
// Reports:
//   - cssVars: var(--x) references that are never defined anywhere (stylesheets,
//     inline styles, @property) and that compute to empty on :root and on sample
//     elements matching the referencing rules.
//   - colors: every visible element's color / background / borders / outline /
//     fill / stroke / box-shadow colors, normalized to rgba and matched against
//     the allowed palette (Primer primitives). User content and derived colors
//     go to an "exempt" bucket.
//   - icons: svg.svg elements without an octicon-* class.
//   - cls / timing.

export const INIT_SCRIPT = `
  window.__shootCLS = 0; window.__shootShifts = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shootCLS += e.value;
        if (window.__shootShifts.length < 20) window.__shootShifts.push({ value: +e.value.toFixed(4), t: Math.round(e.startTime),
          sources: (e.sources || []).slice(0, 3).map((s) => s.node && s.node.nodeType === 1 ? (s.node.id ? '#' + s.node.id : s.node.tagName.toLowerCase() + (s.node.classList.length ? '.' + [...s.node.classList].slice(0, 3).join('.') : '')) : null) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
`;

export const FREEZE_CSS = `
*, *::before, *::after {
  animation-duration: 0s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
  caret-color: transparent !important; scroll-behavior: auto !important;
}`;

/** Wait for fonts, finish/cancel running animations, two rAFs + small settle. */
export async function settle(page, ms = 250) {
  await page.evaluate(async () => {
    try { await document.fonts.ready; } catch {}
    for (const a of document.getAnimations ? document.getAnimations() : []) {
      try { if (a.effect && a.effect.getTiming().iterations === Infinity) a.cancel(); else a.finish(); } catch {}
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }).catch(() => {});
  await page.waitForTimeout(ms);
}

export function pageAudit({ palette, otherPalette, target }) {
  const MAX_SAMPLES = 5;
  const allowed = new Set(Object.keys(palette || {}));
  const other = new Set(Object.keys(otherPalette || {}));
  const allowedList = [...allowed].map((k) => k.match(/[\d.]+/g).map(Number));

  // ---------- helpers ----------
  const cssPath = (el) => {
    const parts = [];
    let n = el;
    for (let i = 0; n && n.nodeType === 1 && i < 4; i++, n = n.parentElement) {
      if (n.id && !/^\d/.test(n.id)) { parts.unshift(n.tagName.toLowerCase() + '#' + CSS.escape(n.id)); break; }
      let s = n.tagName.toLowerCase();
      const cls = [...n.classList].filter((c) => !/^tw-|^js-|^\d/.test(c)).slice(0, 3);
      if (cls.length) s += '.' + cls.map((c) => CSS.escape(c)).join('.');
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const cx = cvs.getContext('2d', { willReadFrequently: true });
  const normCache = new Map();
  const norm = (c) => {
    if (normCache.has(c)) return normCache.get(c);
    let out;
    const m = c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      const a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      out = `rgba(${Math.round(+m[1])},${Math.round(+m[2])},${Math.round(+m[3])},${+a.toFixed(2)})`;
    } else {
      cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      out = `rgba(${d[0]},${d[1]},${d[2]},${+(d[3] / 255).toFixed(2)})`;
    }
    normCache.set(c, out);
    return out;
  };
  const inPalette = (key) => {
    if (allowed.has(key)) return true;
    const [r, g, b, a] = key.match(/[\d.]+/g).map(Number);
    for (const [R, G, B, A] of allowedList) {
      if (Math.abs(R - r) <= 1 && Math.abs(G - g) <= 1 && Math.abs(B - b) <= 1 && Math.abs(A - a) <= 0.02) return true;
    }
    return false;
  };
  const COLOR_RE = /(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|hsla?\([^)]*\))/g;

  // ---------- 1. CSS variables ----------
  const defined = new Set();
  const refs = new Map(); // name -> {count, withFallback, selectors:Set}
  const unreadableSheets = [];
  // var() parser: refs nested inside another var()'s fallback are only
  // recorded as fallback refs (they matter only if the outer var is undefined).
  const addRef = (name, hasFallback, selector, inFallback) => {
    let r = refs.get(name);
    if (!r) refs.set(name, (r = { count: 0, withFallback: 0, fallbackOnly: 0, selectors: new Set() }));
    if (inFallback) { r.fallbackOnly++; return; }
    r.count++; if (hasFallback) r.withFallback++;
    if (selector && r.selectors.size < 8) r.selectors.add(selector);
  };
  const parseVars = (text, selector, inFallback) => {
    let i = 0;
    while ((i = text.indexOf('var(', i)) !== -1) {
      let depth = 0, j = i + 3, comma = -1;
      for (; j < text.length; j++) {
        const ch = text[j];
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (depth === 0) break; }
        else if (ch === ',' && depth === 1 && comma < 0) comma = j;
      }
      const inner = text.slice(i + 4, j);
      const name = (comma < 0 ? inner : text.slice(i + 4, comma)).trim();
      const fallback = comma < 0 ? '' : text.slice(comma + 1, j).trim();
      if (/^--[\w-]+$/.test(name)) addRef(name, fallback !== '', selector, inFallback);
      if (fallback) parseVars(fallback, selector, true);
      i = j + 1;
    }
  };
  const scanDecl = (text, selector) => {
    for (const m of text.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) defined.add(m[1]);
    parseVars(text, selector, false);
  };
  const walk = (rules, parentSel) => {
    for (const rule of rules) {
      try {
        if (rule.type === 1 /* style */) {
          const sel = rule.selectorText;
          scanDecl(rule.style.cssText, sel);
          if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, sel);
        } else if (rule.constructor && rule.constructor.name === 'CSSPropertyRule') {
          defined.add(rule.name);
        } else if (rule.type === 5 /* font-face */ || rule.type === 6 /* page */) {
          scanDecl(rule.style.cssText, null);
        } else if (rule.cssRules) {
          walk(rule.cssRules, parentSel);
        } else if (rule.style) {
          scanDecl(rule.style.cssText, parentSel || null);
        }
      } catch {}
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, null); } catch { unreadableSheets.push(sheet.href || '(inline)'); }
  }
  for (const el of document.querySelectorAll('[style]')) scanDecl(el.getAttribute('style') || '', null);
  const rootCS = getComputedStyle(document.documentElement);
  const unresolved = [];
  const unresolvedWithFallback = [];
  for (const [name, r] of refs) {
    if (defined.has(name) || r.count === 0) continue;
    if (rootCS.getPropertyValue(name).trim() !== '') continue;
    // sample elements matching referencing rules: maybe defined at runtime by JS on the element
    let resolvedSomewhere = false; let matched = 0;
    for (const sel of r.selectors) {
      let els = [];
      try { els = [...document.querySelectorAll(sel.replace(/::?(before|after|placeholder|marker|selection|-webkit-[\w-]+|backdrop|file-selector-button)\b/g, ''))].slice(0, 3); } catch {}
      for (const el of els) { matched++; if (getComputedStyle(el).getPropertyValue(name).trim() !== '') resolvedSomewhere = true; }
    }
    if (resolvedSomewhere) continue;
    const entry = { name, refs: r.count, withFallback: r.withFallback, fallbackRefs: r.fallbackOnly, matchedElements: matched, selectors: [...r.selectors].slice(0, MAX_SAMPLES) };
    (r.withFallback === r.count ? unresolvedWithFallback : unresolved).push(entry);
    // note: refs whose only use is inside another var()'s fallback are ignored
  }
  unresolved.sort((a, b) => b.matchedElements - a.matchedElements || b.refs - a.refs);

  // ---------- 2. colors ----------
  const INLINE_PROPS = { color: ['color'], 'background-color': ['background-color', 'background'], 'border-color': ['border-color', 'border', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color'],
    'outline-color': ['outline-color', 'outline'], fill: ['fill', 'color'], stroke: ['stroke', 'color'], 'box-shadow': ['box-shadow'] };
  // explicit inline color on the element itself (or, for inherited text color / currentColor fill, on an ancestor)
  const inlineSets = (el, prop) => {
    const names = INLINE_PROPS[prop] || [prop];
    const inherits = prop === 'color' || prop === 'fill' || prop === 'stroke';
    for (let n = el, d = 0; n && n.nodeType === 1 && d < (inherits ? 8 : 1); n = n.parentElement, d++) {
      if (n.style && names.some((p) => n.style.getPropertyValue(p))) return true;
      if (n.hasAttribute && (n.hasAttribute('fill') && prop === 'fill')) return true;
    }
    return false;
  };
  const exemptReason = (el, prop) => {
    if (el.closest('img, picture, video, canvas, .avatar, .Avatar, .avatar-user, .avatar-group-item')) return 'avatar/image';
    if (el.closest('.chroma, .code-inner, .lines-code, .code-diff .lines-code, .highlight, .blob-code, [class^="pl-"], [class*=" pl-"], .cm-editor, .monaco-editor')) return 'syntax';
    if (el.closest('.repo-language-color, .color-icon, .language-color, .language-stats, .repository-lang-color, [itemprop="programmingLanguage"] + .repo-language-color')) return 'language-color';
    if (el.closest('.ui.label[style], .labels-list .ui.label, .IssueLabel, .Label[style], .IssueLabel--big, .label-list .ui.label, a.label[style]')) return 'label';
    if (el.closest('.markup [style], .markdown-body [style], .render-content [style]')) return 'markdown-inline';
    if (el.closest('.emoji, g-emoji, .reaction .emoji')) return 'emoji';
    if (inlineSets(el, prop)) return 'inline-style';
    if (el.closest('.ContributionCalendar, .heatmap, #user-heatmap, .activity-heatmap-container')) return 'heatmap';
    return null;
  };
  const off = new Map(); const exempt = new Map(); const otherScheme = new Map();
  let checked = 0, okCount = 0;
  const add = (map, key, prop, el, extra) => {
    let e = map.get(key);
    if (!e) map.set(key, (e = { color: key, count: 0, props: {}, samples: [], ...(extra || {}) }));
    e.count++; e.props[prop] = (e.props[prop] || 0) + 1;
    if (e.samples.length < MAX_SAMPLES) { const p = cssPath(el); if (!e.samples.includes(p)) e.samples.push(p); }
  };
  const check = (el, prop, raw, cs) => {
    if (!raw || raw === 'none' || raw === 'transparent') return;
    const key = norm(raw);
    if (key.endsWith(',0)')) return; // fully transparent
    checked++;
    const reason = exemptReason(el, prop);
    if (reason) { add(exempt, reason + ' ' + key, prop, el, { reason }); return; }
    if (prop !== 'color' && cs && norm(cs.color) === key && prop !== 'background-color') {
      // currentColor-derived (border/outline/fill/stroke default to currentColor)
      if (inPalette(key)) { okCount++; return; }
      add(exempt, 'currentColor ' + key, prop, el, { reason: 'currentColor' }); return;
    }
    if (inPalette(key)) { okCount++; return; }
    if (other.has(key)) add(otherScheme, key, prop, el);
    add(off, key, prop, el);
  };
  const hasOwnText = (el) => {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  };
  const all = document.querySelectorAll('body *');
  let visibleCount = 0;
  for (const el of all) {
    if (el.closest('head, script, style, noscript, template')) continue;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    visibleCount++;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toLowerCase();
    const isSvgChild = el instanceof SVGElement && tag !== 'svg';
    if (hasOwnText(el) || /^(input|textarea|select|button|svg)$/.test(tag)) check(el, 'color', cs.color, null);
    if (!isSvgChild) check(el, 'background-color', cs.backgroundColor, cs);
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (parseFloat(cs[`border-${side}-width`]) > 0 && cs[`border-${side}-style`] !== 'none' && cs[`border-${side}-style`] !== 'hidden') {
        check(el, 'border-color', cs[`border-${side}-color`], cs);
      }
    }
    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) check(el, 'outline-color', cs.outlineColor, cs);
    if (el instanceof SVGElement) {
      if (cs.fill && cs.fill !== 'none' && !cs.fill.startsWith('url(')) check(el, 'fill', cs.fill, cs);
      if (cs.stroke && cs.stroke !== 'none' && !cs.stroke.startsWith('url(')) check(el, 'stroke', cs.stroke, cs);
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') for (const c of cs.boxShadow.match(COLOR_RE) || []) check(el, 'box-shadow', c, cs);
  }
  const sortTop = (m) => [...m.values()].sort((a, b) => b.count - a.count);

  // ---------- 3. icons ----------
  const icons = new Map(); let octicons = 0;
  for (const svg of document.querySelectorAll('svg.svg')) {
    const cls = [...svg.classList];
    if (cls.some((c) => c.startsWith('octicon-'))) { octicons++; continue; }
    const name = cls.find((c) => /^(gitea|material|fontawesome|fa|octicon|svg-)-?/.test(c) && c !== 'svg') || cls.filter((c) => c !== 'svg').join('.') || '(unnamed)';
    let e = icons.get(name);
    if (!e) icons.set(name, (e = { name, count: 0, samples: [] }));
    e.count++; if (e.samples.length < 3) e.samples.push(cssPath(svg));
  }

  // ---------- 4. timing ----------
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const cssRes = res.filter((r) => r.initiatorType === 'link' || /\.css(\?|$)/.test(r.name));

  return {
    htmlTheme: document.documentElement.dataset.theme || document.documentElement.getAttribute('data-color-mode') || null,
    title: document.title,
    url: location.href,
    signedIn: target === 'gitea' ? !!document.querySelector('.navbar-right .navbar-avatar, #navbar .avatar') : null,
    cssVars: { referenced: refs.size, defined: defined.size, unresolved, unresolvedWithFallback, unreadableSheets },
    colors: {
      visibleElements: visibleCount, checked, inPalette: okCount,
      offPaletteDistinct: off.size, offPaletteTotal: [...off.values()].reduce((s, e) => s + e.count, 0),
      offPalette: sortTop(off).slice(0, 60),
      otherSchemeOnly: sortTop(otherScheme).slice(0, 20),
      exempt: sortTop(exempt).slice(0, 40),
    },
    icons: { octicons, nonOcticon: [...icons.values()].sort((a, b) => b.count - a.count) },
    cls: { total: +(window.__shootCLS || 0).toFixed(4), shifts: window.__shootShifts || [] },
    timing: nav ? {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd),
      transferSize: nav.transferSize, resources: res.length,
      cssResources: cssRes.length, cssTransferBytesPerfApi: cssRes.reduce((s, r) => s + (r.transferSize || 0), 0),
    } : null,
    document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth },
  };
}

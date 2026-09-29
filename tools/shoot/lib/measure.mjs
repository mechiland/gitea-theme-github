// Default measure set: logical control name -> selector per target.
// Numbers dumped for both targets under the same logical name so a critic can
// diff ours vs github.com directly (compare.mjs renders the diff table).
export const DEFAULT_MEASURES = [
  { name: 'header', gitea: '#navbar', github: '.AppHeader, header.HeaderMktg, header[role=banner]' },
  { name: 'button', gitea: '.ui.button:not(.primary):not(.red):not(.basic):not(.icon):not(.link-action)', github: '.btn:not(.btn-primary):not(.btn-danger), button.Button--secondary, a.Button--secondary' },
  { name: 'button-primary', gitea: '.ui.primary.button', github: '.btn-primary, .Button--primary' },
  { name: 'button-small', gitea: '.ui.small.button, .ui.tiny.button, .ui.mini.button', github: '.btn-sm, .Button--small' },
  { name: 'input-text', gitea: 'input[type=text]:not([type=hidden]), input[type=search], input[type=email], input[type=password], input:not([type])', github: '.form-control, .FormControl-input, input[type=text], input[type=search]' },
  { name: 'textarea', gitea: 'textarea', github: 'textarea' },
  { name: 'underline-nav-item', gitea: '.ui.secondary.pointing.menu .item, .overflow-menu-items .item', github: '.UnderlineNav-item, .UnderlineNav-body a, nav[aria-label] .UnderlineItem' },
  { name: 'underline-nav-item-active', gitea: '.ui.secondary.pointing.menu .active.item, .overflow-menu-items .active.item', github: '.UnderlineNav-item.selected, .UnderlineNav-item[aria-current]:not([aria-current=false]), .UnderlineItem[aria-current=page]' },
  { name: 'label', gitea: '.ui.label:not(.small)', github: '.Label, .IssueLabel' },
  { name: 'label-small', gitea: '.ui.label.small, .ui.small.label', github: '.Label--small, .IssueLabel' },
  { name: 'counter', gitea: '.ui.label.small.circular, .menu .item .ui.label, .ui.circular.label', github: '.Counter' },
  { name: 'box', gitea: '.ui.segment, .ui.attached.segment', github: '.Box' },
  { name: 'box-header', gitea: '.ui.top.attached.header', github: '.Box-header' },
  { name: 'box-row', gitea: '.flex-item, .flex-list > .flex-item', github: '.Box-row' },
  { name: 'dropdown-menu', gitea: '.ui.dropdown .menu', github: '.dropdown-menu, .ActionListWrap' },
  { name: 'link', gitea: '.page-content a:not(.ui):not(.item)', github: 'main a:not(.btn):not(.Button)' },
  { name: 'body-text', gitea: 'body', github: 'body' },
  { name: 'page-heading', gitea: '.page-content h1, .page-content .ui.header', github: 'main h1, .h1' },
  { name: 'markdown-h1', gitea: '.markup h1', github: '.markdown-body h1' },
  { name: 'markdown-h2', gitea: '.markup h2', github: '.markdown-body h2' },
  { name: 'markdown-p', gitea: '.markup p', github: '.markdown-body p' },
  { name: 'markdown-code', gitea: '.markup code:not(pre code)', github: '.markdown-body code:not(pre code)' },
  { name: 'markdown-pre', gitea: '.markup pre', github: '.markdown-body pre, .markdown-body .highlight pre' },
  { name: 'markdown-table', gitea: '.markup table', github: '.markdown-body table' },
  { name: 'markdown-td', gitea: '.markup table td, .markup table th', github: '.markdown-body table td, .markdown-body table th' },
  { name: 'avatar', gitea: 'img.avatar, img.ui.avatar', github: 'img.avatar' },
  { name: 'tooltip-trigger', gitea: '[data-tooltip-content]', github: '[aria-label][data-view-component] ' },
];

export const MEASURE_PROPS = [
  'height', 'width', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-bottom',
  'border-top-left-radius', 'border-top-width', 'border-top-color', 'border-bottom-color', 'border-bottom-width',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'color', 'background-color', 'box-shadow', 'outline-style', 'outline-color', 'outline-width', 'outline-offset', 'gap',
];

/** In-page: for each {name, selector} record metrics of up to `limit` visible matches. */
export function pageMeasure({ items, props, limit }) {
  const out = {};
  for (const { name, selector } of items) {
    const rec = { selector, matched: 0, samples: [] };
    let els = [];
    try { els = [...document.querySelectorAll(selector)]; } catch (e) { rec.error = String(e.message || e); out[name] = rec; continue; }
    rec.matched = els.length;
    for (const el of els) {
      if (rec.samples.length >= limit) break;
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(el);
      const m = { text: (el.innerText || el.value || '').trim().slice(0, 40), box: { w: +r.width.toFixed(1), h: +r.height.toFixed(1) } };
      for (const p of props) m[p] = cs.getPropertyValue(p);
      rec.samples.push(m);
    }
    out[name] = rec;
  }
  return out;
}

export function measureItems(route, target) {
  const items = DEFAULT_MEASURES.filter((m) => m[target]).map((m) => ({ name: m.name, selector: m[target] }));
  const extra = (route.measure && route.measure[target]) || [];
  for (const e of extra) {
    const it = typeof e === 'string' ? { name: e, selector: e } : e;
    const i = items.findIndex((x) => x.name === it.name);
    if (i >= 0) items[i] = it; else items.push(it);
  }
  return items;
}

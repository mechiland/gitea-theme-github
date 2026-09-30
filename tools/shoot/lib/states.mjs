// Shared page helpers for tools that replay shoot.mjs routes without screenshots (coverage.mjs).
// Mirrors shoot.mjs: in-flight request tracking (networkidle never fires on signed-in Gitea pages) and the
// interaction-state actions of routes.json `states[]` (hover / focus / press / disable / click / submitEmpty).

const LONG_LIVED = /(\/user\/events|eventsource|\/-\/events|websocket|collector\.github\.com|\/_private\/browser\/stats|live-update|alive\.github)/i;

export function trackInflight(page) {
  const inflight = new Set();
  page.__lastNet = Date.now();
  const skip = (r) => LONG_LIVED.test(r.url()) || ['eventsource', 'websocket', 'manifest', 'other'].includes(r.resourceType());
  page.on('request', (r) => { if (!skip(r)) { inflight.add(r); page.__lastNet = Date.now(); } });
  const done = (r) => { if (inflight.delete(r)) page.__lastNet = Date.now(); };
  page.on('requestfinished', done); page.on('requestfailed', done);
  page.__inflight = inflight;
}

export async function waitReady(page, { idleMs = 500, timeout = 15000 } = {}) {
  const t0 = Date.now();
  if (!page.__inflight) trackInflight(page);
  while (Date.now() - t0 < timeout) {
    if (page.__inflight.size === 0 && Date.now() - page.__lastNet >= idleMs) break;
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
}

/** states of a route that apply to `target` at viewport width `vw`, with `selector` resolved */
export function statesFor(route, target, vw) {
  return (route.states || []).filter((s) => !s.target || s.target === target)
    .map((s) => ({ ...s, selector: (s.selectors ? s.selectors[target] : s.selector) }))
    .filter((s) => s.selector && !(target === 'github' && s.action === 'submitEmpty') && (!s.viewports || s.viewports.map(Number).includes(vw)));
}

/** Performs one state action exactly like shoot.mjs runStates (page already loaded and settled). */
export async function performState(page, st) {
  const res = {};
  const loc = page.locator(st.selector).first();
  await loc.waitFor({ state: st.action === 'submitEmpty' ? 'attached' : 'visible', timeout: 8000 });
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  switch (st.action) {
    case 'hover': await loc.hover(); break;
    case 'focus': {
      await page.keyboard.press('Shift');
      await loc.focus();
      let fv = await loc.evaluate((el) => el.matches(':focus-visible'));
      if (!fv) { await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); fv = await loc.evaluate((el) => el.matches(':focus-visible')); }
      res.focusVisible = fv;
      break;
    }
    case 'press': {
      const b = await loc.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down(); // never released: the page is discarded afterwards
      break;
    }
    case 'disable': case 'disabled':
      await loc.evaluate((el) => { el.setAttribute('disabled', ''); el.setAttribute('aria-disabled', 'true'); });
      break;
    case 'click': await loc.click(); break;
    case 'submitEmpty': {
      const submit = await loc.evaluateHandle((el, native) => {
        const form = el.tagName === 'FORM' ? el : el.closest('form');
        if (!form) throw new Error('no form for selector');
        if (!native) form.noValidate = true;
        for (const i of form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]), textarea')) i.value = '';
        return form.querySelector('button[type=submit], button:not([type]), input[type=submit]') || form;
      }, !!st.native);
      const nav = page.waitForNavigation({ timeout: 8000 }).catch(() => null);
      await submit.asElement().click();
      await nav;
      await waitReady(page);
      break;
    }
    default: throw new Error(`unknown action ${st.action}`);
  }
  await page.waitForTimeout(st.wait ?? 350);
  return res;
}

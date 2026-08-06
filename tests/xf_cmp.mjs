import { chromium } from 'playwright';

const TARGETS = [
  ['.sidenav-menu', ['position','width','backgroundColor','zIndex','borderRightColor','top','left']],
  ['.app-topbar', ['position','height','marginLeft','left','right','zIndex','backgroundColor']],
  ['.content-page', ['marginLeft','paddingTop','minHeight']],
  ['.side-nav-link', ['padding','fontSize','color','gap','lineHeight']],
  ['.side-nav-title', ['fontSize','textTransform','letterSpacing','padding','color']],
  ['.sidenav-toggle-button', ['display']],
  ['.button-on-hover', ['display','position','right','top']],
  ['.page-title-head', ['margin','padding']],
];

async function grab(url, label) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 160)); });
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('http://127.0.0.1')) return r.continue();
    return r.abort();
  });
  try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e) { errs.push('GOTO: ' + e.message); }
  await p.waitForTimeout(1800);

  const res = await p.evaluate((TARGETS) => {
    const out = {};
    for (const [sel, props] of TARGETS) {
      const el = document.querySelector(sel);
      if (!el) { out[sel] = null; continue; }
      const cs = getComputedStyle(el);
      const o = {};
      for (const pr of props) o[pr] = cs[pr];
      const r = el.getBoundingClientRect();
      o.__rect = `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
      out[sel] = o;
    }
    out.__meta = {
      htmlAttrs: [...document.documentElement.attributes].map(a => a.name + '=' + a.value).join(' '),
      hasSideNav: !!document.querySelector('.side-nav'),
      collapses: document.querySelectorAll('.side-nav .collapse').length,
      simplebar: !!document.querySelector('.sidenav-menu .simplebar-content-wrapper'),
      simplebarAny: !!document.querySelector('[data-simplebar]'),
      jq: typeof window.$ !== 'undefined',
      bootstrapJs: typeof window.bootstrap !== 'undefined',
      configJs: typeof window.config !== 'undefined',
      hzScroll: document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth + 1,
    };
    return out;
  }, TARGETS);

  await b.close();
  return { label, res, errs };
}

const insUrl = process.argv[2];
const pkgUrl = process.argv[3];
const [ins, pkg] = await Promise.all([grab(insUrl, 'TEMPLATE'), grab(pkgUrl, 'PACKAGE')]);

console.log('\n=== META ===');
console.log('TEMPLATE:', JSON.stringify(ins.res.__meta));
console.log('PACKAGE :', JSON.stringify(pkg.res.__meta));

console.log('\n=== COMPUTED STYLE DIFF (TEMPLATE vs PACKAGE) ===');
for (const [sel] of TARGETS) {
  const a = ins.res[sel], b = pkg.res[sel];
  if (!a && !b) { console.log(`\n${sel}: MISSING IN BOTH`); continue; }
  if (!a) { console.log(`\n${sel}: missing in TEMPLATE`); continue; }
  if (!b) { console.log(`\n${sel}: !! MISSING IN PACKAGE`); continue; }
  const diffs = Object.keys(a).filter(k => a[k] !== b[k]);
  if (!diffs.length) { console.log(`\n${sel}: OK (identical)`); continue; }
  console.log(`\n${sel}:  <<< ${diffs.length} DIFF >>>`);
  for (const k of diffs) console.log(`   ${k}\n      tpl: ${a[k]}\n      pkg: ${b[k]}`);
}

console.log('\n=== JS ERRORS ===');
console.log('TEMPLATE:', ins.errs.length ? ins.errs : 'none');
console.log('PACKAGE :', pkg.errs.length ? pkg.errs : 'none');

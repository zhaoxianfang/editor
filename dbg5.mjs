import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8904/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.includes('127.0.0.1') || u.includes('unpkg.com') || u.includes('jsdelivr')) r.continue(); else r.abort();
});
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const n = window.__dag.graph.getNodes()[0];
  const r1 = { has: typeof n.setPortProp };
  let r2 = null;
  try { n.setPortProp('out1', 'attrs/circle', { fill: '#fff', stroke: '#ff0000', r: 8 }); r2 = { ok: true }; } catch (e) { r2 = { ok: false, err: String(e) }; }
  const portBody = document.querySelector('.x6-port-body');
  const bodyStroke = portBody ? portBody.getAttribute('stroke') : null;
  return { r1, r2, bodyStroke, bodyCount: document.querySelectorAll('.x6-port-body').length };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();

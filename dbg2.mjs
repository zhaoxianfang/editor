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
  const api = { setPorts: typeof n.setPorts, getPorts: typeof n.getPorts, setPortProp: typeof n.setPortProp, prop: typeof n.prop, getProp: typeof n.getProp };
  // 测试 setPorts
  n.setPorts({ groups: { in: { position: 'top' }, out: { position: 'bottom' } }, items: [{ id: 'in', group: 'in' }, { id: 'out1', group: 'out' }] });
  const after = n.getPorts();
  return { api, after: after.map(p => ({ id: p.id, group: p.group })), edges: window.__dag.graph.getEdges().length };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();

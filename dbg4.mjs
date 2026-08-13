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
  const before = n.prop(['ports']);
  const itemsBefore = JSON.stringify(before.items.map(i => i.id));
  const g = n.prop(['ports', 'groups']);
  const groupsBefore = JSON.stringify(g ? Object.keys(g) : null);
  // 通过 prop 设置整个 ports 对象（groups + 保留 items）
  const newPorts = { groups: { in: { position: 'top' }, out: { position: 'bottom' } }, items: before.items };
  n.prop(['ports'], newPorts);
  const after = n.prop(['ports']);
  const itemsAfter = after && after.items ? JSON.stringify(after.items.map(i => i.id)) : 'MISSING';
  const groupsAfter = JSON.stringify(after && after.groups ? Object.keys(after.groups) : null);
  const portList = n.getPorts().map(p => p.id);
  return { itemsBefore, groupsBefore, itemsAfter, groupsAfter, portList, edges: window.__dag.graph.getEdges().length };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();

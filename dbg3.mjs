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
  const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(n)).filter(k => /port|prop/i.test(k));
  const methods = {};
  proto.forEach(k => { methods[k] = typeof n[k]; });
  // 试试 node.prop 数组路径
  n.prop(['ports', 'groups'], { in: { position: 'top' }, out: { position: 'bottom' } });
  const g1 = n.prop(['ports', 'groups']);
  n.prop('ports/groups', { in: { position: 'left' }, out: { position: 'right' } });
  const g2 = n.getProp(['ports', 'groups']);
  return { methods, g1: g1 && g1.in && g1.in.position, g2: g2 && g2.in && g2.in.position, items: (n.getProp(['ports','items'])||[]).length };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();

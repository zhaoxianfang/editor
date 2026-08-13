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
const before = await page.evaluate(() => {
  const n = window.__dag.graph.getNodes()[0];
  return { groups: n.getProp('ports/groups'), portsObj: n.getProp('ports') };
});
console.log('BEFORE:', JSON.stringify(before).slice(0, 300));
await page.click('.dir-btn[data-dir="TB"]');
await page.waitForTimeout(500);
const after = await page.evaluate(() => {
  const n = window.__dag.graph.getNodes()[0];
  const g = n.getProp('ports/groups');
  return { groups: g, items: n.getProp('ports/items') };
});
console.log('AFTER:', JSON.stringify(after).slice(0, 500));
await browser.close();

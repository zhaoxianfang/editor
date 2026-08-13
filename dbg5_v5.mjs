import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', String(e)));
await page.goto('http://127.0.0.1:8904/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__dag, { timeout: 20000 });
await page.waitForTimeout(800);
// 给 n1 加 2 个出口并保存
await page.evaluate(() => {
  const g = window.__dag.graph;
  const n = g.getCellById('n1');
  const d = n.getData();
  d.outs = [{ label: '', cond: '' }, { label: '', cond: '' }];
  n.setData(d);
  window.__dag.graph = g;
});
const read = (dir) => page.evaluate((dd) => {
  const g = window.__dag.graph;
  const n = g.getCellById('n1');
  const ports = n.prop('ports');
  const view = g.findViewByCell(n);
  const arr = Array.from(view.container.querySelectorAll('.x6-port')).map(p => {
    const tr = p.getAttribute('transform') || '';
    const m = tr.match(/matrix\([-\d.]+,[-\d.]+,[-\d.]+,[-\d.]+,([-\d.]+),([-\d.]+)\)/);
    return { x: m ? +m[1] : null, y: m ? +m[2] : null, cls: p.getAttribute('class') };
  });
  return { size: n.getSize(), items: JSON.parse(JSON.stringify(ports.items)).map(i => ({ id: i.id, args: i.args })), arr };
}, dir);
console.log('TB config:', JSON.stringify(await read('TB'), null, 1));
await page.evaluate(() => { window.__dag.setDirection('LR'); });
await page.waitForTimeout(500);
console.log('LR config:', JSON.stringify(await read('LR'), null, 1));
await browser.close();

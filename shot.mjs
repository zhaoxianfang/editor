import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8904/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.includes('127.0.0.1') || u.includes('unpkg.com') || u.includes('jsdelivr')) r.continue(); else r.abort();
});
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/shot_lr.png' });
// 运行中截图
await page.click('#btn-run');
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/shot_running.png' });
await page.click('#btn-stop');
// 编辑面板
await page.evaluate(() => window.__dag.openEditor(window.__dag.graph.getNodes()[0]));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/shot_editor.png' });
// TB
await page.evaluate(() => window.__dag.hideEditor());
await page.click('.dir-btn[data-dir="TB"]');
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/shot_tb.png' });
await browser.close();
console.log('screenshots saved');

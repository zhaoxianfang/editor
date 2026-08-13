import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8904/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.includes('127.0.0.1') || u.includes('unpkg.com') || u.includes('jsdelivr')) r.continue(); else r.abort();
});
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const ta = document.querySelector('.code-ta');
  if (ta) ta.value = 'function onRun(ctx) {\n  return ctx.output;\n}';
  const t = document.getElementById('ed-code');
  if (t) t.value = 'function onRun(ctx) {\n  return ctx.output;\n}';
  const r = document.querySelector('.code-host') && document.querySelector('.code-host')._render;
  if (r) r();
});
await page.evaluate(() => window.__dag.openEditor(window.__dag.graph.getNodes()[0]));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shot_editor_full.png' });
await browser.close();
console.log('saved');

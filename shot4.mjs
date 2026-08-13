import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8904/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.includes('127.0.0.1') || u.includes('unpkg.com') || u.includes('jsdelivr')) r.continue(); else r.abort();
});
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(1000);
await page.evaluate(() => window.__dag.openEditor(window.__dag.graph.getNodes()[0]));
await page.waitForTimeout(600);
const host = await page.$('.code-host');
if (host) {
  await host.screenshot({ path: '/tmp/host_only.png' });
  console.log('host screenshot saved');
} else console.log('host not found');
await browser.close();

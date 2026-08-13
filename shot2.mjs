import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8904/index.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await page.route('**/*', r => {
  const u = r.request().url();
  if (u.includes('127.0.0.1') || u.includes('unpkg.com') || u.includes('jsdelivr')) r.continue(); else r.abort();
});
await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(1000);
await page.evaluate(() => window.__dag.openEditor(window.__dag.graph.getNodes()[0]));
await page.waitForTimeout(600);
const domInfo = await page.evaluate(() => {
  const dataTa = document.getElementById('ed-code');
  const host = document.querySelector('.code-host');
  const ta = document.querySelector('.code-ta');
  const pre = document.querySelector('.code-pre');
  const gutter = document.querySelector('.code-gutter');
  const edField = dataTa ? dataTa.closest('.ed-field') : null;
  return {
    dataTaDisplay: dataTa ? getComputedStyle(dataTa).display : 'missing',
    hostExists: !!host,
    hostDisplay: host ? getComputedStyle(host).display : null,
    hostHeight: host ? getComputedStyle(host).height : null,
    hostRect: host ? { w: host.offsetWidth, h: host.offsetHeight } : null,
    taExists: !!ta,
    taDisplay: ta ? getComputedStyle(ta).display : null,
    preExists: !!pre,
    gutterExists: !!gutter,
    edFieldHTML: edField ? edField.innerHTML.slice(0, 800) : null,
  };
});
console.log(JSON.stringify(domInfo, null, 1));
await browser.close();

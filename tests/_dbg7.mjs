// 静态复现：bundle 渲染 full.md 4 图，检查 SVG 警告
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const url = 'http://127.0.0.1:8931/tests/_fc_static.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const svgErrors = [];
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && /attribute|Expected|svg/i.test(t)) svgErrors.push(t);
  else if (m.type() === 'error') console.log('[console.error]', t);
});
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const res = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.flowchart').forEach((el, i) => {
    const svg = el.querySelector('svg');
    out.push({
      i: i + 1,
      svg: !!svg,
      w: svg ? svg.getAttribute('width') : '-',
      h: svg ? svg.getAttribute('height') : '-',
      viewBox: svg ? svg.getAttribute('viewBox') : '-',
      paths: svg ? svg.querySelectorAll('path').length : 0,
      badPath: svg ? Array.from(svg.querySelectorAll('path')).filter(p => /NaN|Infinity|object Object|^M,|,,/.test(p.getAttribute('d') || '')).length : 0
    });
  });
  return out;
});

console.log(JSON.stringify(res, null, 2));
console.log('=== SVG WARNINGS (' + svgErrors.length + ') ===');
svgErrors.forEach(e => console.log(e));
await browser.close();

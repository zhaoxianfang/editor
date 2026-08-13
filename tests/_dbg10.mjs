// 复现实验：编辑器 defaults + 窄容器
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text()); });
await page.goto('http://127.0.0.1:8931/tests/_fc_static2.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const res = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.flowchart')).map((el, i) => {
    const svg = el.querySelector('svg');
    return {
      i: i + 1,
      w: svg ? svg.getAttribute('width') : '-',
      h: svg ? svg.getAttribute('height') : '-',
      vb: svg ? svg.getAttribute('viewBox') : '-'
    };
  });
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

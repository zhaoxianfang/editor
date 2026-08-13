// 对比：内联 bundle vs 独立 bundle 下 flowchart 内部 symbol 尺寸
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto('http://127.0.0.1:8931/examples/all-features.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(async () => {
  const out = {};
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');

  // 在内联环境下 parse 并检查内部状态
  const d1 = flowchart.parse(src);
  out.inline = {
    fcVersion: flowchart.toString ? String(flowchart).slice(0, 80) : 'n/a',
    raphaelVer: window.Raphael && Raphael.version,
    symbols: d1.symbols ? d1.symbols.map(s => ({ w: s.width, h: s.height, x: s.getX && s.getX(), y: s.getY && s.getY() })) : 'no-symbols'
  };

  // 现在用独立 bundle 覆盖内联 flowchart，再测
  await new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = '/lib/flowchart.bundle.min.js?t=' + Date.now();
    s.onload = resolve;
    s.onerror = () => { out.overloadErr = 'load failed'; resolve(); };
    document.head.appendChild(s);
  });
  out.raphaelVerAfter = window.Raphael && Raphael.version;
  const d2 = flowchart.parse(src);
  out.standalone = {
    symbols: d2.symbols ? d2.symbols.map(s => ({ w: s.width, h: s.height, x: s.getX && s.getX(), y: s.getY && s.getY() })) : 'no-symbols'
  };
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

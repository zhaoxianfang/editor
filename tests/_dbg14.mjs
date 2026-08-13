// 对比内联 vs 独立 bundle 的 symbol 测量（修正 symbols 遍历）
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

  const snapshot = (chart) => {
    try {
      const syms = chart.symbols ? Object.values(chart.symbols) : [];
      return {
        symCount: syms.length,
        syms: syms.slice(0, 5).map(s => ({ w: s.width, h: s.height, x: s.getX ? s.getX() : null, y: s.getY ? s.getY() : null })),
        lineCount: chart.lines ? (Array.isArray(chart.lines) ? chart.lines.length : Object.keys(chart.lines).length) : -1
      };
    } catch (e) { return { err: String(e && e.message) }; }
  };

  out.inline = snapshot(flowchart.parse(src));
  out.inline.raphael = window.Raphael && Raphael.version;

  // 用独立 bundle 覆盖
  await new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = '/lib/flowchart.bundle.min.js?t=' + Date.now();
    s.onload = resolve;
    s.onerror = () => { out.overloadErr = 'load failed'; resolve(); };
    document.head.appendChild(s);
  });
  out.standalone = snapshot(flowchart.parse(src));
  out.standalone.raphael = window.Raphael && Raphael.version;
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

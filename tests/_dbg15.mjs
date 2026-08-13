// 决定性对比：内联 bundle 渲染 vs 独立 bundle 覆盖后渲染
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto('http://127.0.0.1:8931/examples/all-features.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(async () => {
  const out = {};
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');
  const opts = { 'line-width': 2, 'line-length': 50, 'text-margin': 10, 'font-size': 14 };

  const renderTo = (id) => {
    const el = document.createElement('div');
    el.id = id;
    el.style.width = '440px';
    document.body.appendChild(el);
    try {
      const d = flowchart.parse(src);
      d.drawSVG(el, opts);
      const svg = el.querySelector('svg');
      return { w: svg.getAttribute('width'), h: svg.getAttribute('height'), vb: svg.getAttribute('viewBox') };
    } catch (e) { return { err: String(e && e.message) }; }
  };

  // 1) 内联环境渲染
  out.inlineRender = renderTo('inline-render');

  // 2) 独立 bundle 覆盖后渲染
  await new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = '/lib/flowchart.bundle.min.js?t=' + Date.now();
    s.onload = resolve;
    s.onerror = () => { out.overloadErr = 'load failed'; resolve(); };
    document.head.appendChild(s);
  });
  out.standaloneRender = renderTo('standalone-render');

  // 3) 对比 flowchart 函数签名（toString 头）
  out.fcToString = String(flowchart).slice(0, 120);
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

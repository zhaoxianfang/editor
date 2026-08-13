// 追踪 Raphael setSize 调用，定位 NaN 来源；对比内联 vs 独立
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

  const traceRender = async (id, tag) => {
    const el = document.createElement('div');
    el.id = id;
    el.style.width = '440px';
    document.body.appendChild(el);
    const logs = [];
    const R = window.Raphael;
    const origSetSize = R.prototype.setSize;
    R.prototype.setSize = function(w, h) {
      logs.push('setSize(' + w + ', ' + h + ') wNaN=' + (typeof w === 'number' && isNaN(w)) + ' hNaN=' + (typeof h === 'number' && isNaN(h)));
      return origSetSize.call(this, w, h);
    };
    try {
      const d = flowchart.parse(src);
      d.drawSVG(el, opts);
      const svg = el.querySelector('svg');
      out[tag] = { logs, svg: svg ? { w: svg.getAttribute('width'), h: svg.getAttribute('height') } : null };
    } catch (e) {
      out[tag] = { logs, err: String(e && e.message) };
    } finally {
      R.prototype.setSize = origSetSize;
    }
  };

  await traceRender('tr-inline', 'inline');
  // 覆盖独立 bundle
  await new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = '/lib/flowchart.bundle.min.js?t=' + Date.now();
    s.onload = resolve; s.onerror = resolve;
    document.head.appendChild(s);
  });
  await traceRender('tr-stand', 'standalone');
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

// 捕获 flowchart 实际创建的 paper，对比引用来源
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto('http://127.0.0.1:8931/examples/all-features.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  const R = window.Raphael;
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');
  const el = document.createElement('div');
  el.style.width = '440px';
  document.body.appendChild(el);
  const chart = flowchart.parse(src);
  chart.drawSVG(el, { 'line-width': 2, 'line-length': 50, 'text-margin': 10, 'font-size': 14 });
  const fp = chart.diagram && chart.diagram.paper;
  out.windowRaphael = R.version;
  out.flowchartPaper = fp ? {
    version: fp.version,
    setSizeIsWindowFn: fp.setSize === R.fn.setSize,
    protoCtor: fp.canvas ? fp.canvas.tagName : 'n/a',
    protoChain: (function() {
      const arr = [];
      let p = fp;
      while (p && arr.length < 4) { arr.push(Object.getOwnPropertyNames(p).length + ' props'); p = Object.getPrototypeOf(p); }
      return arr;
    })()
  } : 'no paper';
  out.flowchartSetSizeType = fp ? typeof fp.setSize : 'n/a';
  out.diagramExists = !!chart.diagram;
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

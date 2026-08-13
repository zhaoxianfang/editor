// 实测内联环境 Raphael 结构 + patch fn 与 prototype 后渲染
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto('http://127.0.0.1:8931/examples/all-features.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  const R = window.Raphael;
  out.version = R.version;
  out.protoIsFn = R.prototype === R.fn;
  out.fnSetSize = typeof R.fn.setSize;
  out.protoSetSize = typeof R.prototype.setSize;

  // 创建 paper 检查 setSize 引用
  const d = document.createElement('div');
  d.style.width = '440px';
  document.body.appendChild(d);
  const p = new R(d);
  out.paperSetSize = typeof p.setSize;
  out.paperSetSizeIsFn = p.setSize === R.fn.setSize;
  out.paperVersion = p.version;

  // patch fn.setSize（=== prototype）
  const orig = R.fn.setSize;
  const calls = [];
  R.fn.setSize = function(w, h) {
    calls.push([w, h]);
    return orig.call(this, w, h);
  };
  // 用同一 Raphael 渲染（flowchart.parse + drawSVG）
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');
  const el = document.createElement('div');
  el.style.width = '440px';
  document.body.appendChild(el);
  const dg = flowchart.parse(src);
  dg.drawSVG(el, { 'line-width': 2, 'line-length': 50, 'text-margin': 10, 'font-size': 14 });
  const svg = el.querySelector('svg');
  out.afterPatch = {
    calls,
    svgW: svg && svg.getAttribute('width'),
    svgH: svg && svg.getAttribute('height')
  };
  R.fn.setSize = orig;
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

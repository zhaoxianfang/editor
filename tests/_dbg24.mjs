// 读取实际运行函数源码，确认各副本
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto('http://127.0.0.1:8931/examples/all-features.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');
  const opts = { 'line-width': 2, 'line-length': 40, 'text-margin': 8, 'font-size': 14 };

  const el = document.createElement('div');
  el.style.width = '440px';
  document.body.appendChild(el);
  const chart = flowchart.parse(src);
  chart.drawSVG(el, opts);
  const dg = chart.diagram;
  const paper = dg.paper;

  const g = paper.set();
  const t = paper.text(0, 0, 'x');

  // 函数源码
  out.paperSetSrc = paper.set.toString().slice(0, 300);
  out.pushSrc = g.push.toString().slice(0, 300);
  out.textSrc = paper.text.toString().slice(0, 200);
  out.engineCreateSrc = (paper.rect ? paper.rect : paper.circle).toString().slice(0, 300);

  // Element 类源码与原型
  out.textCtorSrc = t.constructor.toString().slice(0, 300);
  // 原型链上的 constructor 指向
  out.textProtoIsEl = Object.getPrototypeOf(t) === Object.getPrototypeOf(paper.rect(0,0,5,5));
  // 原型是否含 raphael 标记
  const proto = Object.getPrototypeOf(t);
  out.protoKeys = Object.getOwnPropertyNames(proto).slice(0, 25).join(',');
  out.protoCtorName = proto.constructor && proto.constructor.name;

  // window.Element 现在是什么？（修复后应恢复原生）
  out.windowElementIsNative = (typeof window.Element === 'function') && (String(window.Element).includes('[native code]') || window.Element.toString().includes('function Element() { [native code] }'));
  out.windowElementSrc = (typeof window.Element === 'function') ? window.Element.toString().slice(0, 80) : String(window.Element);

  // 页面脚本清单
  out.scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

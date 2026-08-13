// 空白页直接加载修复后的 raphael.min.js，验证 window.Element 状态
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage();
const results = {};
const errs = [];
page.on('pageerror', e => errs.push(String(e.message)));

await page.goto('http://127.0.0.1:8931/', { waitUntil: 'domcontentloaded' });
// 加载前
results.before = await page.evaluate(() => ({
  isNative: String(window.Element).includes('[native code]'),
  name: window.Element && window.Element.name
}));
// 加载 raphael
await page.addScriptTag({ url: 'http://127.0.0.1:8931/lib/raphael.min.js' });
results.afterLoad = await page.evaluate(() => ({
  isNative: String(window.Element).includes('[native code]'),
  name: window.Element && window.Element.name,
  raphaelVersion: window.Raphael && window.Raphael.version
}));
// 再加载一次（第二个副本）
await page.addScriptTag({ url: 'http://127.0.0.1:8931/lib/raphael.min.js' });
results.afterSecond = await page.evaluate(() => ({
  isNative: String(window.Element).includes('[native code]'),
  name: window.Element && window.Element.name
}));
// 测试两个副本 paper 的 set push
results.pushTest = await page.evaluate(() => {
  const out = {};
  const d1 = document.createElement('div'); d1.style.width='400px'; document.body.appendChild(d1);
  const p1 = new window.Raphael(d1);
  const g1 = p1.set(); const t1 = p1.text(0,0,'x'); g1.push(t1);
  out.selfPushLen = g1.length;
  out.winElementIsRaphael = !String(window.Element).includes('[native code]');
  return out;
});
results.errors = errs;
console.log(JSON.stringify(results, null, 2));
await browser.close();

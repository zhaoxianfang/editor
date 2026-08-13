// 探查 paper.set / paper.text / 元素的 Raphael 副本归属
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
  const s0 = dg.symbols[0];

  // 1. text 属于哪个 paper
  out.textPaperIsChartPaper = s0.text.paper === paper;
  out.textPaperCtorName = s0.text.paper && s0.text.paper.constructor.name;
  out.paperCtorName = paper.constructor.name;

  // 2. paper.set / paper.text 的函数来源
  const pWin = new window.Raphael(document.createElement('div'));
  out.paperSetIsWinFn = paper.set === pWin.set;
  out.paperTextIsWinFn = paper.text === pWin.text;
  out.paperRectIsWinFn = paper.rect === pWin.rect;

  // 3. 同一个 paper 里 set.push(同 paper 的 text) —— 已经失败，再验证 rect
  const g = paper.set();
  const r = paper.rect(0, 0, 10, 10);
  g.push(r);
  out.rectPushLen = g.length;

  // 4. text/rect 构造器与 paper.text 构造器
  out.textCtorName = s0.text.constructor.name;
  out.rectCtorName = r.constructor.name;

  // 5. 关键：window.Raphael 的 paper 上 set.push 自己 text 是否成功（对照组：纯 2.1.2 环境）
  const gw = window.Raphael.prototype.set ? null : null;
  const dW = document.createElement('div'); dW.style.width='440px'; document.body.appendChild(dW);
  const pw = new window.Raphael(dW);
  const gW = pw.set();
  const tW = pw.text(0, 0, 'x');
  gW.push(tW);
  out.winSelfPushLen = gW.length;
  const gW2 = pw.set();
  const rW = pw.rect(0,0,10,10);
  gW2.push(rW);
  out.winSelfRectPushLen = gW2.length;

  // 6. 纯 bundle 环境对照：把 bundle 单独重载（新 document 不行），改用 flowchart.bundle.min.js 直接覆盖测试
  //    在单独页测试（_fc_static 已证明 OK）——这里只记录 window.flowchart 的归属
  out.winFlowchartVersion = typeof flowchart === 'object' ? (flowchart.version || 'n/a') : 'n/a';

  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

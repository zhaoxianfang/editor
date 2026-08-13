// 决定性探针：group.push 为何静默失败（构造器不匹配？）
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

  out.paperVersion = paper.version;
  out.winVersion = window.Raphael.version;

  // 构造器对比
  const elClass = Object.getPrototypeOf(s0.text).constructor;
  out.textCtorName = elClass.name;
  out.setCtorName = Object.getPrototypeOf(s0.group).constructor.name;
  // push 的 $b.constructor 是什么？通过手动构造验证：新 set push 文本
  const g2 = paper.set();
  g2.push(s0.text);
  out.pushAfterLen = g2.length;
  out.pushAfterItemsLen = g2.items.length;
  // 直接调用底层 Set 类的 push 检查类型
  out.textCtorIsElClass = s0.text.constructor === elClass;
  // 检查 text 的原型链：text 是否为 $b 实例（其原型是否带 raphael 元素方法）
  out.textProtoHasAttr = typeof s0.text.attr === 'function';
  out.groupProtoHasPush = typeof s0.group.push === 'function';

  // 关键：flowchart 源码里 Symbol 构造如何 push —— 用相同方式手动复现
  const t2 = paper.text(0, 0, 'hello');
  out.t2CtorIsTextCtor = t2.constructor === s0.text.constructor;
  const g3 = paper.set();
  g3.push(t2);
  out.g3Len = g3.length;

  // RaphaelA 里 element 类是不是只有一个？比较 paper.rect 创建的
  const r1 = paper.rect(0, 0, 10, 10);
  out.rectCtorSameAsText = r1.constructor === s0.text.constructor;

  // window.Raphael(2.1.2) 新建 paper 的元素能否 push 进 RaphaelA set？
  const d2 = document.createElement('div'); d2.style.width='440px'; document.body.appendChild(d2);
  const pWin = new window.Raphael(d2);
  const tWin = pWin.text(0, 0, 'win');
  const gWin = paper.set();
  gWin.push(tWin);
  out.winTextIntoBundleSet = gWin.length;

  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

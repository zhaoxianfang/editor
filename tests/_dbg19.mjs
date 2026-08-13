// 检查 flowchart（RaphaelA）paper 内文本/路径测量；对比 window.Raphael(RaphaelB)
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto('http://127.0.0.1:8931/examples/all-features.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');
  const el = document.createElement('div');
  el.style.width = '440px';
  document.body.appendChild(el);
  const chart = flowchart.parse(src);
  chart.drawSVG(el, { 'line-width': 2, 'line-length': 50, 'text-margin': 10, 'font-size': 14 });
  const paper = chart.diagram.paper;
  const canvas = paper.canvas;
  out.canvasTag = canvas.tagName;
  out.svgSize = { w: canvas.getAttribute('width'), h: canvas.getAttribute('height'), vb: canvas.getAttribute('viewBox') };
  out.childCount = canvas.children.length;
  // 检查 text 元素测量
  const texts = Array.from(canvas.querySelectorAll('text')).slice(0, 3);
  out.texts = texts.map(t => {
    try {
      const bb = t.getBBox();
      return { content: (t.textContent || '').slice(0, 12), bbW: bb.width, bbH: bb.height, x: bb.x, y: bb.y, wNaN: isNaN(bb.width), hNaN: isNaN(bb.height) };
    } catch (e) { return { err: e.message }; }
  });
  // RaphaelA 创建的 text 的 Raphael 方法（getBBox 是 SVG 原生，但 Raphael text 有额外方法）
  out.textProto = texts[0] ? { hasAttr: typeof texts[0].attr, isRaphaelEl: !!(texts[0].raphael) } : null;
  // 对比：window.Raphael(RaphaelB) 新建 paper 的文本测量
  const R = window.Raphael;
  const d2 = document.createElement('div');
  d2.style.width = '440px';
  document.body.appendChild(d2);
  const p2 = new R(d2);
  const t2 = p2.text(10, 10, 'Hello');
  const bb2 = t2.getBBox();
  out.winRaphaelText = { bbW: bb2.width, bbH: bb2.height, wNaN: isNaN(bb2.width) };
  out.sameRef = paper.setSize === p2.setSize;
  // 检查 line 相关的 textPath
  out.paths = Array.from(canvas.querySelectorAll('path')).slice(0, 3).map(pp => ({ d: (pp.getAttribute('d') || '').slice(0, 50) }));
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

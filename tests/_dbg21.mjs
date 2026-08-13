// 深探：symbol.group / text / symbol 节点的真实结构与 Raphael 归属
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
  el.id = 'probe';
  el.style.width = '440px';
  document.body.appendChild(el);
  const chart = flowchart.parse(src);
  chart.drawSVG(el, opts);
  const dg = chart.diagram;
  const paper = dg.paper;

  out.paperIsWindow = paper === (function(){}) // placeholder
  // paper 归属：与 window.Raphael 新建的 paper 比较
  const d2 = document.createElement('div'); d2.style.width='440px'; document.body.appendChild(d2);
  const p2 = new window.Raphael(d2);
  out.paperSameAsWindow = paper.setSize === p2.setSize;
  out.paperVersion = paper.version;
  out.windowRaphaelVersion = window.Raphael.version;

  // set 的类型
  out.setType = typeof paper.set;
  const st = paper.set();
  out.setProtoCtor = st.constructor && st.constructor.name;
  out.setPushType = typeof st.push;
  out.setAddType = typeof st.add;

  const s0 = dg.symbols[0];
  out.s0 = {
    key: s0.key,
    symbolType: s0.symbolType,
    groupLen: s0.group.length,
    groupItemsLen: s0.group.items ? s0.group.items.length : 'no items',
    hasText: !!s0.text,
    textNodeInSvg: s0.text ? (s0.text.node.parentNode === paper.canvas) : null,
    hasSymbol: !!s0.symbol,
    symbolNodeInSvg: s0.symbol ? (s0.symbol.node.parentNode === paper.canvas) : null,
    textBBoxW: s0.text ? s0.text.getBBox().width : null,
    symbolNodeName: s0.symbol ? s0.symbol.node.nodeName : null
  };

  // SVG 结构
  const svg = el.querySelector('svg');
  out.svgChildren = Array.from(svg.children).map(c => c.nodeName + (c.getAttribute('class') ? '.' + c.getAttribute('class').replace(/\s+/g,'.') : ''));
  out.svgChildCount = svg.children.length;
  // 文本是否在 svg 中
  const texts = svg.querySelectorAll('text');
  out.svgTexts = texts.length;
  out.textHasRaphaelWrap = texts.length ? !!(texts[0].raphael) : null;

  // paper 上到底有几个 set/元素包装（Raphael 内部用 events? 改为查 _viewBoxShift 等）
  out.canvasId = svg.getAttribute('id');
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

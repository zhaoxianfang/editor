// 钩住 FlowChart.prototype.render 记录内部状态，定位内联环境下 2x2/Infinity 的确切来源
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

  // 先渲染一次拿到 diagram 原型
  const el0 = document.createElement('div');
  el0.style.width = '440px';
  document.body.appendChild(el0);
  const c0 = flowchart.parse(src);
  c0.drawSVG(el0, opts);
  const proto = Object.getPrototypeOf(c0.diagram);
  out.protoKeys = Object.getOwnPropertyNames(proto).filter(k => !k.startsWith('__')).join(',');
  out.fcPaperVersion = c0.diagram.paper.version;

  // 钩住 render
  const origRender = proto.render;
  const calls = [];
  let after = null;
  proto.render = function () {
    const paper = this.paper;
    const origSS = paper.setSize, origSVB = paper.setViewBox;
    paper.setSize = function (w, h) { calls.push(['setSize', w, h]); return origSS.call(this, w, h); };
    paper.setViewBox = function (x, y, w, h, fit) { calls.push(['setViewBox', x, y, w, h, fit]); return origSVB.call(this, x, y, w, h, fit); };
    const r = origRender.call(this);
    after = {
      maxXFromLine: this.maxXFromLine,
      minXFromSymbols: this.minXFromSymbols,
      paperSize: [paper.width, paper.height],
      symbols: this.symbols.map(s => ({
        w: s.width, h: s.height,
        gx: s.group.getBBox().x, gy: s.group.getBBox().y,
        gLen: s.group.length,
        gw: s.group.getBBox().width, gh: s.group.getBBox().height
      })),
      lines: this.lines.map(l => {
        try {
          const bb = l.getBBox();
          return { x: bb.x, y: bb.y, x2: bb.x2, y2: bb.y2, w: bb.width, h: bb.height };
        } catch (e) { return { err: e.message }; }
      })
    };
    return r;
  };

  // 第二次渲染（走被钩住的 render）
  const el = document.createElement('div');
  el.id = 'tr-probe';
  el.style.width = '440px';
  document.body.appendChild(el);
  try {
    const chart = flowchart.parse(src);
    chart.drawSVG(el, opts);
    const svg = el.querySelector('svg');
    out.finalSvg = svg ? { w: svg.getAttribute('width'), h: svg.getAttribute('height'), vb: svg.getAttribute('viewBox'), nChildren: svg.children.length } : null;
  } catch (e) {
    out.err = String(e && e.stack || e);
  }
  out.calls = calls;
  out.after = after;
  out.winRaphaelVersion = window.Raphael && window.Raphael.version;
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

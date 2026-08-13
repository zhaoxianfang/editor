// 在 all-features 页面环境中手动渲染流程图（绕过编辑器路径），隔离变量
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const url = 'http://127.0.0.1:8931/examples/all-features.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('[err]', m.text()); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(() => {
  const out = {};
  const fc = window.xfEditor && xfEditor._flowchart;
  out.fcType = typeof fc;
  out.winFcType = typeof window.flowchart;
  out.raphaelType = typeof window.Raphael;

  // 1) 手动：新容器 + parse + drawSVG（模拟编辑器 defaults）
  const src = document.querySelector('.flowchart').getAttribute('data-fc-source');
  const el = document.createElement('div');
  el.id = 'manual-fc';
  el.style.width = '440px';
  document.body.appendChild(el);
  try {
    const d = flowchart.parse(src);
    d.drawSVG(el, {
      'line-width': 2, 'line-length': 50, 'text-margin': 10, 'font-size': 14,
      'font-color': '#1f2937', 'line-color': '#4b5563', 'element-color': '#4b5563', 'fill': '#ffffff'
    });
    const svg = el.querySelector('svg');
    out.manualSvg = { w: svg && svg.getAttribute('width'), h: svg && svg.getAttribute('height'), vb: svg && svg.getAttribute('viewBox') };
    // 2) 文本测量
    const paper = new Raphael(el, 440, 200);
    const t = paper.text(10, 10, 'Hello World 测量');
    const bb = t.getBBox();
    out.textBBox = { w: bb.width, h: bb.height, x: bb.x, y: bb.y };
    out.rect = { w: el.offsetWidth, h: el.offsetHeight };
  } catch (e) {
    out.manualErr = String(e && e.stack || e);
  }
  // 3) 编辑器渲染出的 SVG 状态
  out.editorSvgs = Array.from(document.querySelectorAll('.flowchart svg')).map(s => ({
    w: s.getAttribute('width'), h: s.getAttribute('height'), vb: s.getAttribute('viewBox')
  }));
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();

// 探针：定位编辑器实例自动渲染流程图未触发的原因
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://127.0.0.1:8931/examples/flowchart.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const probe = await page.evaluate(() => {
  const out = {};
  const fcs = document.querySelectorAll('.flowchart');
  out.fcCount = fcs.length;
  out.fcInfo = Array.from(fcs).map((el, i) => {
    const r = el.getBoundingClientRect();
    return {
      i, w: Math.round(r.width), h: Math.round(r.height),
      display: getComputedStyle(el).display,
      visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      init: el.getAttribute('data-fc-initialized'),
      svgCount: el.querySelectorAll('svg').length,
      text: (el.textContent || '').slice(0, 40)
    };
  });
  out.windowFlowchart = typeof window.flowchart;
  out.xfFlowchart = typeof (window.xfEditor && xfEditor._flowchart);
  out.raphael = typeof window.Raphael;
  out.underscore = typeof window._;
  // 编辑器实例
  const ed = window.xfEditor && xfEditor.editorInstances ? xfEditor.editorInstances[0] : null;
  out.editorInstances = window.xfEditor && xfEditor.editorInstances ? xfEditor.editorInstances.length : -1;
  if (ed) {
    out.flowchartTimer = ed.flowchartTimer;
    out.settingsFlowChart = ed.settings && ed.settings.flowChart;
    const pc = ed.previewContainer;
    out.previewContainerFound = !!(pc && pc.length);
    out.pcFcCount = pc ? pc.find('.flowchart').length : -1;
    out.pcSeqCount = pc ? pc.find('.sequence-diagram').length : -1;
  }
  return out;
});

// 手动触发渲染，验证链路
const manual = await page.evaluate(() => {
  const ed = window.xfEditor && xfEditor.editorInstances ? xfEditor.editorInstances[0] : null;
  if (!ed) return { err: 'no instance' };
  const fc = ed.previewContainer.find('.flowchart')[0];
  if (!fc) return { err: 'no .flowchart in previewContainer' };
  try {
    window.dom(fc).flowChart();
    return {
      ok: true,
      svgCount: fc.querySelectorAll('svg').length,
      rectCount: fc.querySelectorAll('rect').length,
      init: fc.getAttribute('data-fc-initialized')
    };
  } catch (e) {
    return { err: String(e && e.stack || e) };
  }
});

console.log('=== PROBE ===');
console.log(JSON.stringify(probe, null, 2));
console.log('=== MANUAL ===');
console.log(JSON.stringify(manual, null, 2));
console.log('=== LOGS ===');
logs.forEach(l => console.log(l));

await browser.close();

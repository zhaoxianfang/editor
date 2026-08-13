// 探针2：monkey-patch 捕获 _renderFlowChart 调用链，检查 DOM 层级
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://127.0.0.1:8931/examples/flowchart.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

// 注入补丁：在所有脚本加载前 hook
await page.addInitScript(() => {
  window.__fcTrace = [];
  window.__fcPatch = () => {
    if (window.xfEditor && !window.__fcPatched) {
      window.__fcPatched = true;
      const orig = xfEditor._renderFlowChart;
      xfEditor._renderFlowChart = function($c, s) {
        window.__fcTrace.push({
          t: Date.now(),
          hasContainer: !!($c && $c.length),
          fcFound: $c ? $c.find('.flowchart').length : -1,
          flowChartSetting: !!(s && s.flowChart)
        });
        return orig.apply(this, arguments);
      };
      const orig2 = xfEditor.fn && xfEditor.fn.flowChartAndSequenceDiagramRender;
      if (orig2) {
        xfEditor.fn.flowChartAndSequenceDiagramRender = function() {
          window.__fcTrace.push({ t: Date.now(), caller: 'flowChartAndSequenceDiagramRender' });
          return orig2.apply(this, arguments);
        };
      }
    }
  };
  setInterval(window.__fcPatch, 50);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const probe = await page.evaluate(() => {
  const out = {};
  out.fcTrace = window.__fcTrace || [];
  // DOM 层级：找 .flowchart 与 .xf_editor-preview-container
  const fc = document.querySelector('.flowchart');
  if (fc) {
    out.fcHtml = fc.outerHTML.slice(0, 200);
    let chain = [];
    let n = fc;
    while (n && n !== document.body) {
      chain.push(n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(/\s+/).join('.') : ''));
      n = n.parentElement;
    }
    out.fcChain = chain;
  }
  // 找编辑器根
  const edRoot = document.querySelector('#test-xfEditor');
  if (edRoot) {
    out.edHasChildren = edRoot.children.length;
    out.edClasses = edRoot.className;
    const pv = edRoot.querySelector('.xf_editor-preview-container');
    out.pvFound = !!pv;
    out.pvFcCount = pv ? pv.querySelectorAll('.flowchart').length : -1;
    out.pvHtmlLen = pv ? pv.innerHTML.length : -1;
  }
  out.domFn = typeof window.dom;
  return out;
});

console.log('=== PROBE2 ===');
console.log(JSON.stringify(probe, null, 2));
console.log('=== LOGS ===');
logs.forEach(l => console.log(l));

await browser.close();

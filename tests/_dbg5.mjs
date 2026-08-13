// 探针3：patch flowChart 方法 + 守卫值探测
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const url = process.argv[2] || 'http://127.0.0.1:8931/examples/flowchart.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));

await page.addInitScript(() => {
  window.__t = [];
  const tryPatch = () => {
    if (!window.xfEditor || !window.xfEditor.dom) return;
    const dom = window.xfEditor.dom;
    const fn = dom('x').constructor.fn || dom.fn;
    if (!fn) return;
    if (window.__tPatched) return;
    window.__tPatched = true;
    // patch _renderFlowChart 内部守卫：记录每个 .flowchart 的可见性与宽度
    const origRender = xfEditor._renderFlowChart;
    xfEditor._renderFlowChart = function($c, s) {
      if ($c && $c.length && s && s.flowChart) {
        $c.find('.flowchart').each(function() {
          const $fc = dom(this);
          let hiddenVal, widthVal, err;
          try { hiddenVal = $fc.is(':hidden'); } catch (e) { err = 'is:' + e.message; }
          try { widthVal = $fc.width(); } catch (e) { err = (err || '') + ' width:' + e.message; }
          window.__t.push({
            guard: 'fc-inspect',
            hiddenVal, widthVal, err,
            init: $fc.attr('data-fc-initialized'),
            parentChainDisplay: (function() {
              const arr = [];
              let n = this;
              while (n && n.nodeType === 1) {
                arr.push(n.tagName.toLowerCase() + ':' + getComputedStyle(n).display + ':' + n.offsetWidth);
                n = n.parentElement;
              }
              return arr.slice(0, 5);
            }).call(this),
            hasFlowChartFn: typeof fn.flowChart
          });
        });
      }
      return origRender.apply(this, arguments);
    };
    // patch flowChart 方法
    const origFlowChart = fn.flowChart;
    fn.flowChart = function(opts) {
      window.__t.push({ guard: 'flowChart-called', el: this[0] && this[0].className, hasOrig: !!origFlowChart });
      return origFlowChart ? origFlowChart.apply(this, arguments) : this;
    };
  };
  setInterval(tryPatch, 40);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const probe = await page.evaluate(() => {
  const out = {};
  out.trace = window.__t || [];
  const fc = document.querySelector('.flowchart');
  out.fcSvg = fc ? fc.querySelectorAll('svg').length : -1;
  out.fcText = fc ? fc.textContent.slice(0, 60) : '-';
  return out;
});

console.log('=== TRACE ===');
console.log(JSON.stringify(probe, null, 2));
console.log('=== LOGS ===');
logs.forEach(l => console.log(l));

await browser.close();

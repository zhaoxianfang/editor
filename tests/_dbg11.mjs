// 探针：在 flowChart() 调用瞬间记录容器可见性
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
const url = 'http://127.0.0.1:8931/examples/all-features.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error' && /svg|attribute|Infinity/i.test(m.text())) console.log('[svg-warn]', m.text()); });

await page.addInitScript(() => {
  window.__fcCalls = [];
  const tryHook = () => {
    if (!window.xfEditor || !window.xfEditor.dom) return;
    const fn = window.xfEditor.dom.fn;
    if (!fn || window.__hooked) return;
    window.__hooked = true;
    const orig = fn.flowChart;
    fn.flowChart = function(opts) {
      const el = this[0];
      let info = {};
      if (el) {
        info.offsetW = el.offsetWidth;
        info.offsetH = el.offsetHeight;
        info.rects = el.getClientRects().length;
        const chain = [];
        let n = el;
        while (n && n.nodeType === 1 && chain.length < 6) {
          chain.push(n.tagName.toLowerCase() + '.display:' + getComputedStyle(n).display + '.offW:' + n.offsetWidth);
          n = n.parentElement;
        }
        info.chain = chain;
        info.previewVisible = (function(){
          const pv = el.closest('.xf_editor-preview');
          return pv ? !!(pv.offsetWidth || pv.offsetHeight) : 'n/a';
        })();
      }
      window.__fcCalls.push({ at: performance.now(), ...info });
      return orig ? orig.apply(this, arguments) : this;
    };
  };
  setInterval(tryHook, 30);
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

const res = await page.evaluate(() => ({
  calls: window.__fcCalls,
  svgs: Array.from(document.querySelectorAll('.flowchart svg')).map(s => ({
    w: s.getAttribute('width'), h: s.getAttribute('height'), vb: s.getAttribute('viewBox')
  }))
}));
console.log(JSON.stringify(res, null, 2));
await browser.close();

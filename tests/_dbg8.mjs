// 深入检查 all-features 编辑器实例中每个流程图 SVG 的几何与错误
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const url = 'http://127.0.0.1:8931/examples/all-features.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const svgWarns = [];
page.on('console', m => {
  if (m.type() === 'error' && /attribute|Expected|Infinity|NaN/i.test(m.text())) svgWarns.push(m.text());
});
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

const res = await page.evaluate(() => {
  const out = { fcs: [], editor: {} };
  document.querySelectorAll('.flowchart').forEach((el, i) => {
    const svg = el.querySelector('svg');
    out.fcs.push({
      i,
      init: el.getAttribute('data-fc-initialized'),
      svg: !!svg,
      widthAttr: svg ? svg.getAttribute('width') : '-',
      heightAttr: svg ? svg.getAttribute('height') : '-',
      viewBox: svg ? svg.getAttribute('viewBox') : '-',
      clientW: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
      clientH: svg ? Math.round(svg.getBoundingClientRect().height) : 0,
      badPaths: svg ? Array.from(svg.querySelectorAll('path')).filter(p => /NaN|Infinity|object Object|^M,/.test(p.getAttribute('d') || '')).length : -1,
      pathCount: svg ? svg.querySelectorAll('path').length : 0,
      hasRaw: /st\s*=>\s*start/i.test(el.textContent || ''),
      textLen: (el.textContent || '').length
    });
  });
  // 编辑器实例信息
  const ed = document.querySelector('#test-xfEditor');
  out.editor.hasEd = !!ed;
  if (ed) {
    out.editor.textareaVal = (ed.querySelector('textarea')?.value || '').length;
    out.editor.watchEnabled = true;
  }
  // 页面中是否还有其它 .flowchart（页面正文内嵌）
  out.docFlowchartCount = document.querySelectorAll('.flowchart').length;
  return out;
});

console.log(JSON.stringify(res, null, 2));
console.log('=== SVG WARNINGS (' + svgWarns.length + ') ===');
svgWarns.forEach(w => console.log(w));
await browser.close();

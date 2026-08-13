// 全面回归：编辑器实例 + 纯预览 bundle 的流程图渲染验证
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:8931/examples/';
const targets = [
  { file: 'flowchart.html',          kind: 'editor', expect: 1 },   // 编辑器实例
  { file: 'full-preview.html',       kind: 'preview', expect: 4 },  // 纯预览 bundle 4 图
  { file: 'all-features.html',       kind: 'preview', expect: 1 },  // 功能大合集
  { file: 'sequence-diagram.html',   kind: 'editor', expect: 1 },   // 时序图编辑器
];

const browser = await chromium.launch();
let fail = 0;

for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));

  await page.goto(base + t.file, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const res = await page.evaluate(() => {
    const out = { fcs: [], sds: [] };
    document.querySelectorAll('.flowchart').forEach((el, i) => {
      const svg = el.querySelector('svg');
      out.fcs.push({
        i,
        init: el.getAttribute('data-fc-initialized'),
        svg: !!svg,
        rects: svg ? svg.querySelectorAll('rect,path,ellipse,polygon').length : 0,
        texts: svg ? svg.querySelectorAll('text').length : 0,
        hasRaw: /st\s*=>\s*start/i.test(el.textContent || ''),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
        overflow: el.scrollHeight > el.clientHeight + 2
      });
    });
    document.querySelectorAll('.sequence-diagram').forEach((el, i) => {
      const svg = el.querySelector('svg');
      out.sds.push({
        i,
        init: el.getAttribute('data-sd-initialized'),
        svg: !!svg,
        hasRaw: /participant\b/i.test(el.textContent || '')
      });
    });
    return out;
  });

  let ok = true;
  if (res.fcs.length < t.expect) { ok = false; console.log(`  !! ${t.file}: 期望 ${t.expect} 个流程图，实际 ${res.fcs.length}`); }
  res.fcs.forEach(f => {
    if (!f.svg || f.rects === 0) { ok = false; console.log(`  !! ${t.file} 图#${f.i}: 未渲染 (svg=${f.svg} rects=${f.rects})`); }
    if (f.hasRaw) { ok = false; console.log(`  !! ${t.file} 图#${f.i}: 残留原始 markdown`); }
    if (f.overflow) { ok = false; console.log(`  !! ${t.file} 图#${f.i}: 纵向溢出`); }
    console.log(`  [${t.file}] 图#${f.i}: init=${f.init} svg=${f.svg} shapes=${f.rects} texts=${f.texts} raw=${f.hasRaw} size=${f.w}x${f.h} overflow=${f.overflow}`);
  });
  res.sds.forEach(s => {
    if (!s.svg) { ok = false; console.log(`  !! ${t.file} 时序图#${s.i}: 未渲染`); }
    if (s.hasRaw) { ok = false; console.log(`  !! ${t.file} 时序图#${s.i}: 残留原始 markdown`); }
    console.log(`  [${t.file}] 时序图#${s.i}: init=${s.init} svg=${s.svg} raw=${s.hasRaw}`);
  });
  if (errors.length) { ok = false; errors.forEach(e => console.log(`  !! ${t.file} ${e}`)); }
  if (ok) console.log(`PASS ${t.file}`);
  else { fail++; console.log(`FAIL ${t.file}`); }
  await page.close();
}

await browser.close();
console.log(fail === 0 ? '\n=== ALL PASS ===' : `\n=== ${fail} FAILED ===`);
process.exit(fail === 0 ? 0 : 1);

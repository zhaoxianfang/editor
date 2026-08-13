// 检查编辑器渲染的 flow 源码是否完整（data-fc-source 对比 full.md 原始块）
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';

const url = 'http://127.0.0.1:8931/examples/all-features.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const res = await page.evaluate(async () => {
  const out = {};
  const fcs = document.querySelectorAll('.flowchart');
  out.count = fcs.length;
  out.sources = Array.from(fcs).map((el, i) => ({
    i,
    src: el.getAttribute('data-fc-source') || '(none)',
    srcLen: (el.getAttribute('data-fc-source') || '').length
  }));
  // 获取 full.md 原文对比
  const md = await (await fetch('md/full.md', { cache: 'no-store' })).text();
  const blocks = [];
  const re = /```flow\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)) !== null) blocks.push({ start: m.index, len: m[1].length, first: m[1].split('\n')[0], src: m[1] });
  out.mdBlocks = blocks.map(b => ({ len: b.len, first: b.first }));
  // 对比
  out.compare = fcs.length && blocks.length
    ? Array.from(fcs).map((el, i) => {
        const src = el.getAttribute('data-fc-source') || '';
        const b = blocks[i] || {};
        return {
          i,
          srcLen: src.length,
          mdLen: b.len,
          match: src.trim() === (b.src || '').trim(),
          srcHead: src.split('\n').slice(0, 3).join(' | '),
          mdHead: b.first
        };
      })
    : null;
  return out;
});

console.log(JSON.stringify(res, null, 2));
await browser.close();

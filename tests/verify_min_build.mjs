// 验证 xf_editor.min.js 产物：echarts 渲染 + 无 JS 错误 + 图表 id 稳定
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = '/Users/aha/www/xfeditor';
const PORT = 8911;

const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/examples/echarts.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); res.end('404'); return; }
  const ext = path.extname(fp);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

await new Promise(r => server.listen(PORT, r));
console.log('server on', PORT);

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
const consoleErrors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

// 拦截外网（echarts CDN 等），允许本地 127.0.0.1
await page.route('**/*', route => {
  const u = route.request().url();
  if (u.includes('127.0.0.1') || u.includes('localhost') || u.startsWith('data:')) return route.continue();
  return route.abort();
});

await page.goto(`http://127.0.0.1:${PORT}/examples/echarts.html`, { waitUntil: 'load', timeout: 30000 });
// 等待编辑器渲染 + echarts 初始化
await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  const charts = document.querySelectorAll('.xf_editor-echarts');
  const ids = Array.from(charts).map(c => c.id);
  // 检查 data-config 是否被正确设置且是合法 JSON（修复点：单引号 -> &apos; 解码）
  let validConfig = 0, badConfig = 0;
  charts.forEach(c => {
    try {
      const cfg = JSON.parse((c.getAttribute('data-config') || '').replace(/&apos;/g, "'"));
      if (cfg && typeof cfg === 'object') validConfig++;
    } catch(e) { badConfig++; }
  });
  return {
    chartCount: charts.length,
    ids,
    validConfig,
    badConfig,
    hasCanvas: document.querySelectorAll('.xf_editor-echarts canvas').length
  };
});

console.log('=== 验证结果 ===');
console.log('图表 div 数量:', result.chartCount);
console.log('图表 id:', result.ids.join(', '));
console.log('data-config 合法 JSON 数:', result.validConfig, ' 非法:', result.badConfig);
console.log('canvas 渲染数:', result.hasCanvas);
console.log('pageerror:', errors.length, errors);
console.log('console.error:', consoleErrors.length, consoleErrors);

await browser.close();
server.close();

const ok = errors.length === 0 && consoleErrors.length === 0 && result.chartCount >= 5 && result.badConfig === 0 && result.hasCanvas >= 1;
console.log(ok ? '\n✅ VERIFY PASS' : '\n❌ VERIFY FAIL');
process.exit(ok ? 0 : 1);

// 批量回归：加载核心示例页，检查 JS 错误 / 本地资源失败 / 横向溢出
import { chromium } from '/Users/aha/www/xfeditor/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';

const ROOT = '/Users/aha/www/xfeditor', PORT = 8914;
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); res.end('404'); return; }
  const ext = path.extname(fp);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

// 核心示例页（均为 examples 目录真实存在的文件，覆盖渲染管线各分支）
const PAGES = [
  'index.html', 'echarts.html', 'flowchart.html', 'sequence-diagram.html',
  'formula.html', 'all-features.html', 'code-fold.html', 'footnote.html',
  'custom-toolbar.html', 'extends.html', 'html-preview-markdown-to-html.html',
  'full-preview.html', 'multi-xfEditor.html', 'change-mode.html', 'columns.html',
  'copybook.html', 'auto-height.html', 'font-size.html', 'event-handlers.html',
  'table-edit.html', 'table-fix.html', 'image-upload.html', 'at-links.html',
  'canvas-graffiti.html', 'dynamic-create-xfEditor.html', 'multi-languages.html'
];

await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch();
let totalErrors = 0, failedPages = [];

for (const pageFile of PAGES) {
  const page = await browser.newPage();
  const errors = [], consoleErrors = [], failedReq = [];
  page.on('pageerror', e => errors.push(e.message));
  // 仅统计本地（127.0.0.1）资源导致的 console error，排除外网被拦截的 ERR_FAILED
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (t.includes('net::ERR_FAILED') || t.includes('Failed to load resource')) {
      // 本地资源缺失（404）才计入；外网被 abort 不计入
      const loc = (m.location() && m.location().url) || '';
      if (loc.includes('127.0.0.1') || loc.includes('localhost')) consoleErrors.push(t);
    } else {
      consoleErrors.push(t);
    }
  });
  page.on('requestfailed', r => { const u = r.url(); if (u.includes('127.0.0.1')) failedReq.push(u + ' ' + (r.failure()?.errorText||'')); });
  // 拦截外网
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.includes('127.0.0.1') || u.includes('localhost') || u.startsWith('data:')) return route.continue();
    return route.abort();
  });
  try {
    const resp = await page.goto(`http://127.0.0.1:${PORT}/examples/${pageFile}`, { waitUntil: 'load', timeout: 20000 });
    if (!resp || resp.status() === 404) { failedPages.push({ page: pageFile, fatal: 'HTTP ' + (resp?resp.status():'ERR') }); totalErrors++; await page.close(); continue; }
    await page.waitForTimeout(3500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (errors.length || consoleErrors.length || failedReq.length || overflow > 5) {
      failedPages.push({ page: pageFile, errors, consoleErrors, failedReq, overflow });
      totalErrors += errors.length + consoleErrors.length + failedReq.length;
    }
  } catch(e) {
    failedPages.push({ page: pageFile, fatal: e.message });
    totalErrors++;
  }
  await page.close();
}

await browser.close();
server.close();

console.log('=== 示例页回归 ===');
console.log('检查页面数:', PAGES.length);
if (failedPages.length === 0) {
  console.log('✅ 全部通过（无 JS 错误 / 本地资源失败 / 横向溢出）');
} else {
  console.log('❌ 失败页面:', failedPages.length);
  for (const f of failedPages) {
    console.log('  -', f.page, '| errors:', f.errors?.length||0, 'console:', f.consoleErrors?.length||0, 'reqFail:', f.failedReq?.length||0, 'overflow:', f.overflow, 'editorOk:', f.editorOk, f.fatal?('FATAL: '+f.fatal):'');
    if (f.errors) console.log('     pageerrors:', f.errors.slice(0,3));
    if (f.consoleErrors) console.log('     console:', f.consoleErrors.slice(0,3));
  }
}
process.exit(failedPages.length === 0 ? 0 : 1);

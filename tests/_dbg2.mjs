import { chromium } from 'playwright';
const URL = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message}`));
await page.goto(URL, { waitUntil: 'networkidle' }).catch(e => logs.push('GOTO: '+e.message));
await page.waitForTimeout(3500);

const info = await page.evaluate(() => {
  const el = document.querySelector('.flowchart');
  const r = {};
  r.textContentSample = el ? el.textContent.slice(0, 80) : 'NO EL';
  r.hasSvg = el ? !!el.querySelector('svg') : false;
  // try manual render
  try {
    if (window.jQuery) {
      window.jQuery(el).flowChart();
    } else if (window.$ && window.$.fn && window.$.fn.flowChart) {
      window.$(el).flowChart();
    }
    r.manualRender = 'called';
  } catch(e) { r.manualRender = 'ERR: ' + e.message; }
  return r;
});
await page.waitForTimeout(1500);
const info2 = await page.evaluate(() => {
  const el = document.querySelector('.flowchart');
  return { afterManualHasSvg: el ? !!el.querySelector('svg') : false, rects: el && el.querySelector('svg') ? el.querySelectorAll('rect,path,ellipse,polygon').length : 0 };
});
console.log(JSON.stringify({...info, ...info2}, null, 2));
console.log('=== LOGS ===');
console.log(logs.join('\n'));
await browser.close();

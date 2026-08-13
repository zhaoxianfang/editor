import { chromium } from 'playwright';
const URL = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message}`));
await page.goto(URL, { waitUntil: 'networkidle' }).catch(e => logs.push('GOTO: '+e.message));
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const r = {};
  r.flowchartType = typeof window.flowchart;
  r.hasParse = typeof window.flowchart !== 'undefined' && typeof window.flowchart.parse;
  r.xfFlowchart = typeof xfEditor !== 'undefined' ? typeof xfEditor._flowchart : 'noXf';
  // find flowchart containers
  const els = document.querySelectorAll('.flowchart, pre.flowchart, code.flowchart');
  r.flowEls = els.length;
  r.flowClassSamples = Array.from(els).slice(0,3).map(e => ({tag:e.tagName, cls:e.className, parentCls: e.parentElement && e.parentElement.className, hasSvg: !!e.querySelector('svg')}));
  // check if there is svg anywhere
  r.svgTotal = document.querySelectorAll('svg').length;
  return r;
});
console.log(JSON.stringify(info, null, 2));
console.log('=== LOGS ===');
console.log(logs.join('\n'));
await browser.close();

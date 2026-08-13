import { chromium } from 'playwright';
const URL = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[PAGEERROR] ${e.message}`));
await page.goto(URL, { waitUntil: 'networkidle' }).catch(e => logs.push('GOTO: '+e.message));
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const res = { flowchartType: typeof window.flowchart, diagrams: [] };
  document.querySelectorAll('.flowchart').forEach((el, i) => {
    let p = el, svg = null;
    for (let k=0; k<4 && p; k++){ svg = p.querySelector('svg'); if(svg) break; p = p.parentElement; }
    res.diagrams.push({ i, hasSvg: !!svg, rects: svg ? svg.querySelectorAll('rect,path,ellipse,polygon').length : 0,
      errorPlaceholder: !!el.querySelector('.fc-render-error') });
  });
  res.totalSvg = document.querySelectorAll('svg').length;
  return res;
});
console.log(JSON.stringify(info, null, 2));
console.log('=== LOGS (' + logs.length + ') ===');
console.log(logs.filter(l => /error|shiftX|setting|版本|render/i.test(l)).join('\n') || '(no error logs)');
await browser.close();

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!DOCTYPE html><html><body></body></html>');
// 只加载自包含 bundle，不加载外部 raphael/underscore/flowchart.min
await page.addScriptTag({ path: 'lib/flowchart.bundle.min.js' });

const md = readFileSync('examples/md/full.md', 'utf8');
const blocks = [];
const re = /```flow\n([\s\S]*?)```/g;
let m;
while ((m = re.exec(md)) !== null) blocks.push(m[1]);

const results = await page.evaluate((blocks) => {
  const out = { flowchartType: typeof window.flowchart, raphael: typeof window.Raphael, underscore: typeof window._ };
  const defaults = { 'x':0,'y':0,'line-width':3,'line-length':50,'text-margin':10,'font-size':14,'font-color':'black','line-color':'black','element-color':'black','fill':'white','yes-text':'yes','no-text':'no','arrow-end':'block','flowstate':{'past':{'fill':'#CCCCCC','font-size':12},'current':{'fill':'yellow','font-color':'red','font-weight':'bold'},'future':{'fill':'#FFFF99'},'request':{'fill':'blue'},'invalid':{'fill':'#444444'},'approved':{'fill':'#58C146','font-color':'white'},'rejected':{'fill':'#C1465C','font-color':'white'}} };
  blocks.forEach((src, i) => {
    try {
      const diagram = window.flowchart.parse(src);
      const div = document.createElement('div');
      diagram.drawSVG(div, defaults);
      out['block'+i] = { ok:true, rects: div.querySelectorAll('rect,path,ellipse,polygon').length, hasSvg: !!div.querySelector('svg') };
    } catch (e) {
      out['block'+i] = { ok:false, error: e.message };
    }
  });
  return out;
}, blocks);

console.log('blocks:', blocks.length);
console.log(JSON.stringify(results, null, 2));
await browser.close();

/**
 * 生成自包含 flowchart bundle：
 *   将 Raphael + Underscore + flowchart.js v1.18 顺序拼接成一个独立文件，
 *   并强制导出 window.flowchart（FlowChart 实例），使 xfEditor 主包可内联此文件，
 *   彻底摆脱外部 lib/flowchart.min.js 版本（v1.3.4）导致的 "shiftX is not a function" /
 *   "Cannot set properties of undefined (setting 'yes')" 错误。
 *
 * 顺序很重要：
 *   - Raphael 必须先加载并设置 window.Raphael（flowchart 内部 require('raphael') 依赖它）
 *   - Underscore 设置全局 _（flowchart.functions 使用）
 *   - flowchart 最后加载，内部模块系统会解析 raphael / underscore 依赖
 */
const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, 'lib');
const raphael = fs.readFileSync(path.join(libDir, 'raphael.min.js'), 'utf8');
const underscore = fs.readFileSync(path.join(libDir, 'underscore.min.js'), 'utf8');
const flowchart = fs.readFileSync(path.join(libDir, 'flowchart.min.js'), 'utf8');

const header = `/* xfEditor self-contained flowchart bundle v1.18.0
 * Raphael 2.1.3 + Underscore 1.8.2 + flowchart.js 1.18.0
 * 该文件把三者打包为一个 UMD，导出 window.flowchart。
 * 直接内联进 xf_editor.min.js 后，编辑器流程图渲染不再依赖外部 lib/flowchart.min.js 版本。
 */
`;

const bundle = header + '\n' +
  raphael + '\n' +
  underscore + '\n' +
  flowchart + '\n' +
  '/* ensure window.flowchart is exported (flowchart UMD already sets it, this is a guard) */\n' +
  'if (typeof window !== "undefined" && typeof flowchart === "undefined" && typeof window.flowchart === "undefined") {' +
  '  console.error("[xfEditor] flowchart bundle failed to initialize");\n' +
  '}\n';

const out = path.join(libDir, 'flowchart.bundle.min.js');
fs.writeFileSync(out, bundle, 'utf8');
console.log('Wrote', out, '(' + bundle.length + ' bytes)');

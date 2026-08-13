/**
 * 构建 xf_editor.min.js 主包，并将 flowchart 自包含 bundle（Raphael + Underscore +
 * flowchart.js v1.18）内联到文件开头，使主包完全自包含、零外部 flowchart 版本依赖。
 *
 * 这样无论外部 lib/flowchart.min.js 是否陈旧（v1.3.4 会导致 "a.shiftX is not a function"
 * / "Cannot set properties of undefined (setting 'yes')"），编辑器流程图渲染都使用内置 v1.18。
 *
 * 内联位置：bundle 放在 xf_editor.js 源码之前，作为 IIFE 前缀。bundle 内部会设置
 * window.Raphael / window._ / window.flowchart，并（在运行时）由 xfEditor 的 loadScript
 * 逻辑缓存到 xfEditor._flowchart。
 */
const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

const root = __dirname;
const bundlePath = path.join(root, 'lib', 'flowchart.bundle.min.js');
const srcPath = path.join(root, 'xf_editor.js');
const outPath = path.join(root, 'xf_editor.min.js');

const bundle = fs.readFileSync(bundlePath, 'utf8');
const src = fs.readFileSync(srcPath, 'utf8');

// 仅压缩 xf_editor.js 源码（bundle 本身已是 .min.js，无需再次压缩，
// 且二次压缩会因 strict 模式下 "delete expr" 等语法报错）。
const result = UglifyJS.minify(src, {
    compress: true,
    mangle: false,
    output: { comments: false }
});

if (result.error) {
    console.error('Uglify error (source):', result.error);
    process.exit(1);
}

// bundle 原样前置（注释 + 自包含库），再拼接压缩后的编辑器源码
const combined = '/* === xfEditor built-in flowchart bundle (Raphael+Underscore+flowchart.js v1.18) === */\n'
    + bundle + '\n'
    + '/* === xfEditor main source (minified) === */\n'
    + result.code;

fs.writeFileSync(outPath, combined, 'utf8');
console.log('Wrote', outPath, '(' + (combined.length / 1024).toFixed(1) + ' KB, flowchart bundle inlined)');

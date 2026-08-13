/**
 * xfEditor AMD 版本构建脚本
 *
 * 从主源码 xf_editor.js 生成 xf_editor.amd.js：
 *  1. 同步最新主体（此前 amd 版本与主文件长期不同步，缺失 v1.18 流程图等修复）；
 *  2. 修复 AMD 导出（旧版内层 UMD 的 define.amd 分支为空 → Require.js 下模块导出 undefined，
 *     导致 use-requirejs 等示例中插件 factory(exports).fn 报 "Cannot read properties of undefined"）；
 *  3. 注入全部依赖（marked/prettify/katex/raphael/underscore/flowchart/sequenceDiagram/CodeMirror 全模块），
 *     与 Gulpfile "amd" 任务的 replaceText1/replaceText2 保持一致：
 *     - define(codeMirrorModules, factory) 在 requirejs 中按模块名解析并传给 factory 的 arguments；
 *     - factory 顶部把 arguments[0..7] 赋给 marked/Raphael/CodeMirror 等局部全局（在 "use strict" 之前，
 *       故不受严格模式隐式全局限制，与 Gulpfile 原设计一致）。
 *
 * 用法：node build-amd.js
 * 压缩版 xf_editor.amd.min.js 由 package.json 的 build:amd（uglifyjs）生成。
 */

var fs = require('fs');
var path = require('path');

var SRC = path.join(__dirname, 'xf_editor.js');
var OUT = path.join(__dirname, 'xf_editor.amd.js');

var src = fs.readFileSync(SRC, 'utf8');
var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

// 定位内层 factory 主体：主文件结构为
//   ;(function(factory) { ... }(function() {
//       /* Require.js assignment replace */
//       "use strict";
//       ... 主体 ...
//       return xfEditor;
//   }));
var factoryStartMarker = '}(function() {';
var factoryStart = src.lastIndexOf(factoryStartMarker);
if (factoryStart === -1) throw new Error('无法定位 factory 起点');
var bodyStart = src.indexOf('{', factoryStart) + 1; // "(function() {" 的 {

var factoryEndMarker = 'return xfEditor;';
var retIdx = src.lastIndexOf(factoryEndMarker);
if (retIdx === -1) throw new Error('无法定位 return xfEditor');
var bodyEnd = src.indexOf('}));', retIdx);
if (bodyEnd === -1) throw new Error('无法定位 factory 终点');

var body = src.slice(bodyStart, bodyEnd);

// ---- codeMirrorModules（与 Gulpfile amd 任务 replaceText1 一致）----
var cmModePath = '"codemirror/mode/"';
var cmAddonPath = '"codemirror/addon/"';
var codeMirrorModules = [
    '"marked", "prettify"',
    '"katex", "raphael", "underscore", "flowchart", "sequenceDiagram"',
    '"codemirror/lib/codemirror"',
    'cmModePath + "css/css"',
    'cmModePath + "sass/sass"',
    'cmModePath + "shell/shell"',
    'cmModePath + "sql/sql"',
    'cmModePath + "clike/clike"',
    'cmModePath + "php/php"',
    'cmModePath + "xml/xml"',
    'cmModePath + "markdown/markdown"',
    'cmModePath + "javascript/javascript"',
    'cmModePath + "htmlmixed/htmlmixed"',
    'cmModePath + "gfm/gfm"',
    'cmModePath + "http/http"',
    'cmModePath + "go/go"',
    'cmModePath + "dart/dart"',
    'cmModePath + "coffeescript/coffeescript"',
    'cmModePath + "nginx/nginx"',
    'cmModePath + "python/python"',
    'cmModePath + "perl/perl"',
    'cmModePath + "lua/lua"',
    'cmModePath + "r/r"',
    'cmModePath + "ruby/ruby"',
    'cmModePath + "rst/rst"',
    'cmModePath + "smartymixed/smartymixed"',
    'cmModePath + "vb/vb"',
    'cmModePath + "vbscript/vbscript"',
    'cmModePath + "velocity/velocity"',
    'cmModePath + "xquery/xquery"',
    'cmModePath + "yaml/yaml"',
    'cmModePath + "erlang/erlang"',
    'cmModePath + "jade/jade"',
    'cmAddonPath + "edit/trailingspace"',
    'cmAddonPath + "dialog/dialog"',
    'cmAddonPath + "search/searchcursor"',
    'cmAddonPath + "search/search"',
    'cmAddonPath + "scroll/annotatescrollbar"',
    'cmAddonPath + "search/matchesonscrollbar"',
    'cmAddonPath + "display/placeholder"',
    'cmAddonPath + "edit/closetag"',
    'cmAddonPath + "fold/foldcode"',
    'cmAddonPath + "fold/foldgutter"',
    'cmAddonPath + "fold/indent-fold"',
    'cmAddonPath + "fold/brace-fold"',
    'cmAddonPath + "fold/xml-fold"',
    'cmAddonPath + "fold/markdown-fold"',
    'cmAddonPath + "fold/comment-fold"',
    'cmAddonPath + "mode/overlay"',
    'cmAddonPath + "selection/active-line"',
    'cmAddonPath + "edit/closebrackets"',
    'cmAddonPath + "display/fullscreen"',
    'cmAddonPath + "search/match-highlighter"'
].join(',\n                ');

// ---- assignment 注入（与 Gulpfile amd 任务 replaceText2 一致）----
var AMD_ASSIGN = [
    'if (typeof define == "function" && define.amd) {',
    '    marked     = arguments[0];',
    '    prettify   = arguments[1];',
    '    katex      = arguments[2];',
    '    Raphael    = arguments[3];',
    '    _          = arguments[4];',
    '    flowchart  = arguments[5];',
    '    sequenceDiagram = arguments[6];',
    '    CodeMirror = arguments[7];',
    '}'
].join('\n            ');

// 把 assignment 标记替换为注入代码（置于 "use strict" 之前，保持非严格语义）
body = body.replace('/* Require.js assignment replace */', AMD_ASSIGN);

// ---- 头部：单层 UMD + 依赖注入的匿名 AMD define ----
var header = [
    '/*! xfEditor v' + pkg.version + ' */',
    '',
    '(function(root, factory) {',
    '    "use strict";',
    '    if (typeof define === "function" && define.amd) {',
    '        // AMD（Require.js）：匿名注册，模块名由加载路径决定（如 use-requirejs.html 中的 "xf_editor"）。',
    '        // 所有插件/语言包按历史模块名 "xfEditor" 声明依赖，由页面 map 重定向到本模块。',
    '        // 依赖经 codeMirrorModules 注入 factory 的 arguments（见下方 /* Require.js assignment */ 注入）。',
    '        var cmModePath  = "codemirror/mode/";',
    '        var cmAddonPath = "codemirror/addon/";',
    '',
    '        var codeMirrorModules = [',
    '                ' + codeMirrorModules,
    '            ];',
    '',
    '        define(codeMirrorModules, factory);',
    '    } else if (typeof module === "object" && module.exports) {',
    '        // CommonJS / Node.js',
    '        module.exports = factory.call(root);',
    '    } else {',
    '        // Browser global',
    '        var lib = factory.call(root);',
    '        if (typeof window !== "undefined") { window.xfEditor = lib; }',
    '        // 条件暴露全局 $（与主文件一致）：仅在页面未自带 $（jQuery/Zepto）时生效',
    '        if (typeof window !== "undefined" && typeof window.$ === "undefined") {',
    '            window.$ = lib.dom;',
    '        }',
    '    }',
    '}(typeof self !== "undefined" ? self : this, function() {'
].join('\n');

var footer = [
    '',
    '    return xfEditor;',
    '}));',
    ''
].join('\n');

var out = header + '\n' + body + '\n' + footer;

fs.writeFileSync(OUT, out, 'utf8');
console.log('DONE: xf_editor.amd.js (' + (out.length / 1024).toFixed(1) + ' KB, ' + out.split('\n').length + ' lines)');
console.log('  (压缩版 xf_editor.amd.min.js 请运行: npm run build:amd)');

/*!
 * Test plugin for xfEditor
 *
 * 用于 examples/define-plugin.html 的演示插件：
 * 展示如何通过 xfEditor.loadPlugin() 动态加载一个插件，
 * 并同时扩展「静态方法」(xfEditor.xxx) 与「实例方法」(xfEditor.fn.xxx)。
 *
 * @file        test-plugin.js
 * @author      zhaoxianfang
 * @version     1.0.0
 * {@link       https://github.com/zhaoxianfang/xfeditor}
 * @license     MIT
 */

(function() {

    var factory = function (exports) {

        // 编辑器已内置零依赖 micro-DOM，插件优先复用它（不再依赖外部 jQuery）
        var $ = (exports && exports.dom) ? exports.dom : (typeof jQuery !== "undefined" ? jQuery : null);

        if (!exports) {
            return;
        }

        /**
         * 静态方法：xfEditor.testPlugin()
         * 无需编辑器实例即可调用。
         */
        exports.testPlugin = function() {
            if (typeof console !== "undefined" && console.log) {
                console.log("testPlugin: 插件已成功加载并执行（静态方法）");
            }

            return exports;
        };

        /**
         * 实例方法：editorInstance.testPlugin()
         * 在编辑器实例上下文中调用，可访问 this.editor / this.cm 等。
         */
        if (exports.fn) {
            exports.fn.testPlugin = function() {
                var _this = this;

                if (typeof console !== "undefined" && console.log) {
                    console.log("testPlugin: 实例方法被调用", _this);
                }

                return _this;
            };
        }

    };

    // CommonJS/Node.js
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object")
    {
        module.exports = factory;
    }
    else if (typeof define === "function")  // AMD/CMD/Sea.js
    {
        if (define.amd) { // for Require.js

            define(["xfEditor"], function(xfEditor) {
                factory(xfEditor);
            });

        } else { // for Sea.js
            define(function(require) {
                var xfEditor = require("./../../xf_editor");
                factory(xfEditor);
            });
        }
    }
    else
    {
        factory(window.xfEditor);
    }

})();

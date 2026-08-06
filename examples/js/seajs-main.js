define(function(require){
	var xfEditor = require("xf_editor");
	// 使用编辑器内置的 micro-DOM，无需 jQuery
	var $ = xfEditor.dom;

    require("../../src/js/languages/en"); // 加载英语语言包

    console.log($, xfEditor);

    var testEditor;

    // 原生 fetch 替代 $.get
    fetch("md/full.md").then(function(res){
        return res.text();
    }).then(function(md){
        testEditor = xfEditor("test-xfEditor", {
            width: "90%",
            height: 640,
            path : '../lib/',
            markdown : md,
            //toolbar  : false,             //关闭工具栏
            htmlDecode : true,            // 开启HTML标签解析，为了安全性，默认不开启
            tex : true,                   // 开启科学公式TeX语言支持，默认关闭
            //previewCodeHighlight : false,  // 关闭预览窗口的代码高亮，默认开启
            flowChart : true,              // 疑似Sea.js与Raphael.js有冲突，必须先加载Raphael.js，xfEditor才能在Sea.js下正常进行；
            sequenceDiagram : true,        // 同上
            onload : function() {
                console.log('onload', this);
                //this.fullscreen();
                //this.unwatch();
                //this.watch().fullscreen();

                //this.setMarkdown("#PHP");
                //this.width("100%");
                //this.height(480);
                //this.resize("100%", 640);
            }
        });
    });

    $("#show-btn").on('click', function(){
        testEditor.show();
    });

    $("#hide-btn").on('click', function(){
        testEditor.hide();
    });

    $("#get-md-btn").on('click', function(){
        console.log(testEditor.getMarkdown());
        xfEditor.notify("Markdown 内容已输出到控制台（F12 查看）", "success", 3000);
    });

    $("#get-html-btn").on('click', function() {
        console.log(testEditor.getHTML());
        xfEditor.notify("HTML 内容已输出到控制台（F12 查看）", "success", 3000);
    });

    $("#watch-btn").on('click', function() {
        testEditor.watch();
    });

    $("#unwatch-btn").on('click', function() {
        testEditor.unwatch();
    });

    $("#preview-btn").on('click', function() {
        testEditor.previewing();
    });

    $("#fullscreen-btn").on('click', function() {
        testEditor.fullscreen();
    });

    $("#show-toolbar-btn").on('click', function() {
        testEditor.showToolbar();
    });

    $("#close-toolbar-btn").on('click', function() {
        testEditor.hideToolbar();
    });
});

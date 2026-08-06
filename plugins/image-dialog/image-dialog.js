/*!
 * Image (upload) dialog plugin for xf_editor
 *
 * @file        image-dialog.js
 * @author zhaoxianfang
 * @version     1.3.4
 * @updateTime  2015-06-09
 * {@link       https://github.com/zhaoxianfang/xfeditor}
 * @license     MIT
 */

(function() {

    var factory = function (exports) {

		var pluginName   = "image-dialog";

		exports.fn.imageDialog = function() {

            var _this       = this;
            var cm          = this.cm;
            var lang        = this.lang;
            var editor      = this.editor;
            var settings    = this.settings;
            var cursor      = cm.getCursor();
            var selection   = cm.getSelection();
            var imageLang   = lang.dialog.image;
            var classPrefix = this.classPrefix;
            var iframeName  = classPrefix + "image-iframe";
			var dialogName  = classPrefix + pluginName, dialog;

			cm.focus();

            var loading = function(show) {
                var _loading = dialog.find("." + classPrefix + "dialog-mask");
                _loading[(show) ? "show" : "hide"]();
            };

            if (editor.find("." + dialogName).length < 1)
            {
                var guid   = (new Date).getTime();
                // 是否有可用的上传地址：imageUpload 已开启且 imageUploadURL 非空
                var hasUploadURL = !!(settings.imageUpload && settings.imageUploadURL && String(settings.imageUploadURL).trim() !== "");
                // 本地上传按钮始终在 imageUpload 开启时显示（不受 imageUploadURL 是否配置约束）
                var showLocalUpload = !!settings.imageUpload;

                var action = "";
                if (hasUploadURL)
                {
                    action = settings.imageUploadURL + (settings.imageUploadURL.indexOf("?") >= 0 ? "&" : "?") + "guid=" + guid;
                    if (settings.crossDomainUpload)
                    {
                        action += "&callback=" + settings.uploadCallbackURL + "&dialog_id=xfEditor-image-dialog-" + guid;
                    }
                }

                var dialogContent = ( (hasUploadURL) ? "<form action=\"" + action +"\" target=\"" + iframeName + "\" method=\"post\" enctype=\"multipart/form-data\" class=\"" + classPrefix + "form\">" : "<div class=\"" + classPrefix + "form\">" ) +
                                        ( (hasUploadURL) ? "<iframe name=\"" + iframeName + "\" id=\"" + iframeName + "\" guid=\"" + guid + "\"></iframe>" : "" ) +
                                        "<label>" + imageLang.url + "</label>" +
                                        "<input type=\"text\" data-url />" + (function(){
                                            return (showLocalUpload) ? "<div class=\"" + classPrefix + "file-input\">" +
                                                                                "<input type=\"file\" name=\"" + classPrefix + "image-file\" accept=\"image/*\" />" +
                                                                                "<input type=\"button\" value=\"" + imageLang.uploadButton + "\" />" +
                                                                            "</div>" : "";
                                        })() +
                                        "<br/>" +
                                        "<label>" + imageLang.alt + "</label>" +
                                        "<input type=\"text\" value=\"" + selection + "\" data-alt />" +
                                        "<br/>" +
                                        "<label>" + imageLang.link + "</label>" +
                                        "<input type=\"text\" value=\"http://\" data-link />" +
                                        "<br/>" +
                                        "<label>" + (imageLang.size || "尺寸 (宽x高)") + "</label>" +
                                        "<input type=\"text\" placeholder=\"例如: 300x200\" data-size style=\"width:120px;\" />" +
                                        "<br/>" +
                                        ( (hasUploadURL) ? "</form>" : "</div>");

                //var imageFooterHTML = "<button class=\"" + classPrefix + "btn " + classPrefix + "image-manager-btn\" style=\"float:left;\">" + imageLang.managerButton + "</button>";

                dialog = this.createDialog({
                    title      : imageLang.title,
                    width      : (showLocalUpload) ? 465 : 380,
                    height     : 300,
                    name       : dialogName,
                    content    : dialogContent,
                    mask       : settings.dialogShowMask,
                    drag       : settings.dialogDraggable,
                    lockScreen : settings.dialogLockScreen,
                    maskStyle  : {
                        opacity         : settings.dialogMaskOpacity,
                        backgroundColor : settings.dialogMaskBgColor
                    },
                    buttons : {
                        enter : [lang.buttons.enter, function() {
                            var url  = this.find("[data-url]").val();
                            var alt  = this.find("[data-alt]").val();
                            var link = this.find("[data-link]").val();
                            var size = this.find("[data-size]").val().trim();

                            if (url === "")
                            {
                                xfEditor.notify(imageLang.imageURLEmpty, "warning");
                                return false;
                            }

							var altAttr = (alt !== "") ? " \"" + alt + "\"" : "";
                            var sizeStr = "";
                            if (size && /^\d+\s*x\s*\d+$/.test(size)) {
                                var sizeParts = size.replace(/\s/g, "").split("x");
                                sizeStr = "<" + sizeParts[0] + "," + sizeParts[1] + ">";
                            }

                            // ★ 无上传地址：把图片（本地 base64 或远程 URL）转成涂鸦语法块插入
                            if (!hasUploadURL)
                            {
                                var insertCanvas = function(dataUri) {
                                    var editorCm = _this.cm;
                                    if (!editorCm || typeof editorCm.replaceSelection !== "function") return;
                                    editorCm.focus();
                                    var align = "center";
                                    var block = _this._buildCanvasBlock(dataUri, align, alt || "");
                                    editorCm.replaceSelection("\n" + block + "\n");
                                };

                                if (/^data:image\//i.test(url)) {
                                    insertCanvas(url);
                                    this.hide().lockScreen(false).hideMask();
                                    this.remove();
                                    return false;
                                }

                                // 远程图片：下载为 base64 再插入
                                loading(true);
                                _this.fileToDataURL(url, function(err, dataUri) {
                                    loading(false);
                                    if (err || !dataUri) {
                                        xfEditor.notify(imageLang.loadImageFail || "图片加载失败，请检查地址或网络。", "error", 5000);
                                        return;
                                    }
                                    insertCanvas(dataUri);
                                    this.hide().lockScreen(false).hideMask();
                                    this.remove();
                                }.bind(this));

                                return false;
                            }

                            // ★ fix: 通过 editor instance 获取 cm，避免闭包捕获过期引用
                            var editorCm = _this.cm;
                            if (editorCm && typeof editorCm.replaceSelection === "function") {
                                editorCm.focus();
                                if (link === "" || link === "http://")
                                {
                                    editorCm.replaceSelection("![" + alt + "](" + url + altAttr + ")" + sizeStr);
                                }
                                else
                                {
                                    editorCm.replaceSelection("[![" + alt + "](" + url + altAttr + ")]" + "(" + link + altAttr + ")" + sizeStr);
                                }

                                if (alt === "") {
                                    editorCm.setCursor(cursor.line, cursor.ch + 2);
                                }
                            }

                            this.hide().lockScreen(false).hideMask();

                            //删除对话框
                            this.remove();

                            return false;
                        }],

                        cancel : [lang.buttons.cancel, function() {
                            this.hide().lockScreen(false).hideMask();

                            //删除对话框
                            this.remove();
                            
                            return false;
                        }]
                    }
                });

                dialog.attr("id", classPrefix + "image-dialog-" + guid);

                // 上传功能仅在启用时设置，对话框始终显示
                if (settings.imageUpload) {
                    var fileInput  = dialog.find("[name=\"" + classPrefix + "image-file\"]");

                    // Paste upload support
                    dialog.on("paste", function(e) {
                        var items = (e.clipboardData || e.originalEvent.clipboardData).items;
                        if (!items || items.length === 0) return;

                        for (var i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf("image") !== -1) {
                                var blob = items[i].getAsFile();
                                var fileObj = new File([blob], "pasted-image-" + Date.now() + ".png", { type: "image/png" });
                                var dataTransfer = new DataTransfer();
                                dataTransfer.items.add(fileObj);
                                fileInput[0].files = dataTransfer.files;
                                fileInput.trigger("change");
                                e.preventDefault();
                                return;
                            }
                        }
                    });

                    fileInput.on("change", function() {
                        var fileName  = fileInput.val();
                        var isImage   = new RegExp("(\\.(" + settings.imageFormats.join("|") + "))$", "i"); // /(\.(webp|jpg|jpeg|gif|bmp|png))$/

                        if (fileName === "")
                        {
                            xfEditor.notify(imageLang.uploadFileEmpty, "warning");

                            return false;
                        }

                        if (!isImage.test(fileName))
                        {
                            xfEditor.notify(imageLang.formatNotAllowed + settings.imageFormats.join(", "), "warning");

                            return false;
                        }

                        // ★ 无上传地址：将本地图片读取为 base64 填入地址框（图片名称写入 alt），
                        //   由「确认」按钮统一转换并插入涂鸦块；粘贴/选择文件均走此分支
                        if (!hasUploadURL)
                        {
                            var file = fileInput.get(0).files[0];
                            if (!file) return false;
                            loading(true);
                            _this.fileToDataURL(file, function(err, dataUri) {
                                loading(false);
                                if (err || !dataUri) {
                                    xfEditor.notify(imageLang.loadImageFail || "图片读取失败，请重试。", "error", 5000);
                                    return;
                                }
                                var baseName = fileName.replace(/^.*[\\\/]/, "");
                                dialog.find("[data-url]").val(dataUri);
                                var altEl = dialog.find("[data-alt]");
                                if (altEl.length > 0) {
                                    altEl.val(altEl.val() || baseName);
                                }
                            });
                            return false;
                        }

                        loading(true);

                        var submitHandler = function() {

                            var uploadIframe = document.getElementById(iframeName);

                            uploadIframe.onload = function() {

                                loading(false);

                                var body = (uploadIframe.contentWindow ? uploadIframe.contentWindow : uploadIframe.contentDocument).document.body;
                                var json = (body.innerText) ? body.innerText : ( (body.textContent) ? body.textContent : null);

                                try {
                                    json = (typeof JSON.parse !== "undefined") ? JSON.parse(json) : eval("(" + json + ")");
                                } catch(err) {
                                    xfEditor.notify("上传响应解析失败，请检查服务器返回格式。", "error", 5000);
                                    return false;
                                }

                                if(!settings.crossDomainUpload)
                                {
                                  if (json.success === 1)
                                  {
                                      dialog.find("[data-url]").val(json.url);
                                  }
                                  else
                                  {
                                      xfEditor.notify(json.message || "上传失败，未知错误。", "error", 5000);
                                  }
                                }

                                return false;
                            };
                        };

                        // ★ v1.17.18: 先解绑旧 handler 再绑定，防止累积绑定导致多次上传
                        dialog.find("[type=\"submit\"]").off("click", submitHandler).on("click", submitHandler).trigger("click");
                    });
                }
            }

			dialog = editor.find("." + dialogName);
			dialog.find("[type=\"text\"]").val("");
			dialog.find("[type=\"file\"]").val("");
			dialog.find("[data-link]").val("http://");

			this.dialogShowMask(dialog);
			this.dialogLockScreen();
			dialog.show();

		};

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

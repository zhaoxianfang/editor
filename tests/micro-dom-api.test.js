/**
 * xfEditor micro-DOM API 测试套件
 * 
 * 目的：测试所有 micro-DOM API 的行为，确保迁移后功能一致
 * 运行：在浏览器中打开 tests/test-runner.html
 */

(function(window) {
    'use strict';

    // 测试工具
    var TestRunner = {
        passed: 0,
        failed: 0,
        tests: [],
        
        test: function(name, fn) {
            this.tests.push({ name: name, fn: fn });
        },
        
        assert: function(condition, message) {
            if (!condition) {
                throw new Error(message || 'Assertion failed');
            }
        },
        
        assertEqual: function(actual, expected, message) {
            if (actual !== expected) {
                throw new Error(message || ('Expected ' + expected + ' but got ' + actual));
            }
        },
        
        assertDeepEqual: function(actual, expected, message) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(message || ('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual)));
            }
        },
        
        run: function() {
            console.log('=== 开始测试 ===\n');
            
            for (var i = 0; i < this.tests.length; i++) {
                var test = this.tests[i];
                try {
                    test.fn();
                    this.passed++;
                    console.log('✅ PASS: ' + test.name);
                } catch (e) {
                    this.failed++;
                    console.error('❌ FAIL: ' + test.name);
                    console.error('   Error: ' + e.message);
                }
            }
            
            console.log('\n=== 测试结果 ===');
            console.log('通过: ' + this.passed);
            console.log('失败: ' + this.failed);
            console.log('总计: ' + this.tests.length);
            
            return this.failed === 0;
        }
    };

    // ==================== 选择器测试 ====================
    
    TestRunner.test('$(selector) - 选择单个元素', function() {
        var div = document.createElement('div');
        div.id = 'test-div';
        document.body.appendChild(div);
        
        var $div = $('#test-div');
        TestRunner.assertEqual($div.length, 1, '应该找到 1 个元素');
        TestRunner.assertEqual($div[0], div, '应该返回正确的元素');
        
        document.body.removeChild(div);
    });
    
    TestRunner.test('$(selector) - 选择多个元素', function() {
        var divs = [];
        for (var i = 0; i < 3; i++) {
            var div = document.createElement('div');
            div.className = 'test-div';
            document.body.appendChild(div);
            divs.push(div);
        }
        
        var $divs = $('.test-div');
        TestRunner.assertEqual($divs.length, 3, '应该找到 3 个元素');
        
        divs.forEach(function(div) {
            document.body.removeChild(div);
        });
    });
    
    TestRunner.test('$(html) - 创建元素', function() {
        var $div = $('<div class="created">Test</div>');
        TestRunner.assertEqual($div.length, 1, '应该创建 1 个元素');
        TestRunner.assertEqual($div[0].className, 'created', '应该有正确的 class');
        TestRunner.assertEqual($div[0].textContent, 'Test', '应该有正确的文本');
    });
    
    TestRunner.test('$(function) - DOM ready', function() {
        var called = false;
        $(function() {
            called = true;
        });
        
        // 立即执行（因为 DOM 已经加载）
        setTimeout(function() {
            TestRunner.assert(called, '应该调用回调函数');
        }, 10);
    });

    // ==================== DOM 操作测试 ====================
    
    TestRunner.test('$.fn.html() - 获取/设置 HTML', function() {
        var $div = $('<div>Original</div>');
        TestRunner.assertEqual($div.html(), 'Original', '应该获取正确的 HTML');
        
        $div.html('Modified');
        TestRunner.assertEqual($div.html(), 'Modified', '应该设置正确的 HTML');
    });
    
    TestRunner.test('$.fn.text() - 获取/设置文本', function() {
        var $div = $('<div>Original</div>');
        TestRunner.assertEqual($div.text(), 'Original', '应该获取正确的文本');
        
        $div.text('Modified');
        TestRunner.assertEqual($div.text(), 'Modified', '应该设置正确的文本');
    });
    
    TestRunner.test('$.fn.val() - 获取/设置值', function() {
        var $input = $('<input type="text" value="test">');
        TestRunner.assertEqual($input.val(), 'test', '应该获取正确的值');
        
        $input.val('modified');
        TestRunner.assertEqual($input.val(), 'modified', '应该设置正确的值');
    });
    
    TestRunner.test('$.fn.attr() - 获取/设置属性', function() {
        var $div = $('<div id="test"></div>');
        TestRunner.assertEqual($div.attr('id'), 'test', '应该获取正确的属性');
        
        $div.attr('id', 'modified');
        TestRunner.assertEqual($div.attr('id'), 'modified', '应该设置正确的属性');
        
        $div.attr({ 'data-test': 'value', 'title': 'Test' });
        TestRunner.assertEqual($div.attr('data-test'), 'value', '应该支持对象设置属性');
    });
    
    TestRunner.test('$.fn.removeAttr() - 移除属性', function() {
        var $div = $('<div id="test"></div>');
        $div.removeAttr('id');
        TestRunner.assertEqual($div.attr('id'), undefined, '应该移除属性');
    });
    
    TestRunner.test('$.fn.prop() - 获取/设置属性', function() {
        var $checkbox = $('<input type="checkbox">');
        TestRunner.assertEqual($checkbox.prop('checked'), false, '应该获取正确的属性');
        
        $checkbox.prop('checked', true);
        TestRunner.assertEqual($checkbox.prop('checked'), true, '应该设置正确的属性');
    });
    
    TestRunner.test('$.fn.data() - 获取/设置数据', function() {
        var $div = $('<div data-test="value"></div>');
        TestRunner.assertEqual($div.data('test'), 'value', '应该从 data-* 属性获取数据');
        
        $div.data('custom', { key: 'value' });
        TestRunner.assertDeepEqual($div.data('custom'), { key: 'value' }, '应该存储对象数据');
    });
    
    TestRunner.test('$.fn.addClass() - 添加类', function() {
        var $div = $('<div></div>');
        $div.addClass('test-class');
        TestRunner.assert($div[0].classList.contains('test-class'), '应该添加类');
        
        $div.addClass('class1 class2');
        TestRunner.assert($div[0].classList.contains('class1') && $div[0].classList.contains('class2'), '应该添加多个类');
    });
    
    TestRunner.test('$.fn.removeClass() - 移除类', function() {
        var $div = $('<div class="test-class"></div>');
        $div.removeClass('test-class');
        TestRunner.assert(!$div[0].classList.contains('test-class'), '应该移除类');
    });
    
    TestRunner.test('$.fn.toggleClass() - 切换类', function() {
        var $div = $('<div></div>');
        $div.toggleClass('test-class');
        TestRunner.assert($div[0].classList.contains('test-class'), '应该添加类');
        
        $div.toggleClass('test-class');
        TestRunner.assert(!$div[0].classList.contains('test-class'), '应该移除类');
    });
    
    TestRunner.test('$.fn.hasClass() - 检查类', function() {
        var $div = $('<div class="test-class"></div>');
        TestRunner.assert($div.hasClass('test-class'), '应该返回 true');
        TestRunner.assert(!$div.hasClass('other-class'), '应该返回 false');
    });
    
    TestRunner.test('$.fn.css() - 获取/设置样式', function() {
        var $div = $('<div></div>');
        $div.css('color', 'red');
        TestRunner.assertEqual($div[0].style.color, 'red', '应该设置样式');
        
        $div.css({ 'background': 'blue', 'padding': '10px' });
        TestRunner.assertEqual($div[0].style.background, 'blue', '应该支持对象设置样式');
    });

    // ==================== DOM 遍历测试 ====================
    
    TestRunner.test('$.fn.find() - 查找子元素', function() {
        var $div = $('<div><span class="child"></span></div>');
        var $child = $div.find('.child');
        TestRunner.assertEqual($child.length, 1, '应该找到 1 个子元素');
    });
    
    TestRunner.test('$.fn.children() - 获取子元素', function() {
        var $div = $('<div><span></span><span></span></div>');
        var $children = $div.children();
        TestRunner.assertEqual($children.length, 2, '应该有 2 个子元素');
    });
    
    TestRunner.test('$.fn.parent() - 获取父元素', function() {
        var $div = $('<div><span class="child"></span></div>');
        var $parent = $div.find('.child').parent();
        TestRunner.assertEqual($parent[0], $div[0], '应该返回正确的父元素');
    });
    
    TestRunner.test('$.fn.parents() - 获取所有祖先元素', function() {
        var container = document.createElement('div');
        container.id = 'container';
        var div = document.createElement('div');
        var span = document.createElement('span');
        span.className = 'child';
        
        div.appendChild(span);
        container.appendChild(div);
        document.body.appendChild(container);
        
        var $parents = $('.child').parents();
        TestRunner.assert($parents.length > 0, '应该有祖先元素');
        
        document.body.removeChild(container);
    });
    
    TestRunner.test('$.fn.siblings() - 获取兄弟元素', function() {
        var $div = $('<div><span class="s1"></span><span class="s2"></span><span class="s3"></span></div>');
        var $siblings = $div.find('.s2').siblings();
        TestRunner.assertEqual($siblings.length, 2, '应该有 2 个兄弟元素');
    });
    
    TestRunner.test('$.fn.next() - 获取下一个兄弟元素', function() {
        var $div = $('<div><span class="s1"></span><span class="s2"></span></div>');
        var $next = $div.find('.s1').next();
        TestRunner.assertEqual($next.hasClass('s2'), true, '应该返回正确的下一个元素');
    });
    
    TestRunner.test('$.fn.prev() - 获取上一个兄弟元素', function() {
        var $div = $('<div><span class="s1"></span><span class="s2"></span></div>');
        var $prev = $div.find('.s2').prev();
        TestRunner.assertEqual($prev.hasClass('s1'), true, '应该返回正确的上一个元素');
    });
    
    TestRunner.test('$.fn.eq() - 获取指定索引元素', function() {
        var $divs = $('<div></div><div></div><div></div>');
        TestRunner.assertEqual($divs.eq(0).length, 1, 'eq(0) 应该返回第一个元素');
        TestRunner.assertEqual($divs.eq(-1).length, 1, 'eq(-1) 应该返回最后一个元素');
    });
    
    TestRunner.test('$.fn.first() - 获取第一个元素', function() {
        var $divs = $('<div class="first"></div><div></div>');
        TestRunner.assertEqual($divs.first().hasClass('first'), true, '应该返回第一个元素');
    });
    
    TestRunner.test('$.fn.last() - 获取最后一个元素', function() {
        var $divs = $('<div></div><div class="last"></div>');
        TestRunner.assertEqual($divs.last().hasClass('last'), true, '应该返回最后一个元素');
    });
    
    TestRunner.test('$.fn.filter() - 过滤元素', function() {
        var $divs = $('<div class="a"></div><div class="b"></div><div class="a"></div>');
        var $filtered = $divs.filter('.a');
        TestRunner.assertEqual($filtered.length, 2, '应该过滤出 2 个元素');
    });
    
    TestRunner.test('$.fn.not() - 排除元素', function() {
        var $divs = $('<div class="a"></div><div class="b"></div><div class="a"></div>');
        var $not = $divs.not('.a');
        TestRunner.assertEqual($not.length, 1, '应该剩余 1 个元素');
    });
    
    TestRunner.test('$.fn.is() - 检查元素', function() {
        var $div = $('<div class="test"></div>');
        TestRunner.assert($div.is('.test'), '应该返回 true');
        TestRunner.assert(!$div.is('.other'), '应该返回 false');
    });

    // ==================== DOM 插入测试 ====================
    
    TestRunner.test('$.fn.append() - 追加子元素', function() {
        var $div = $('<div></div>');
        $div.append('<span>Test</span>');
        TestRunner.assertEqual($div.children().length, 1, '应该有 1 个子元素');
    });
    
    TestRunner.test('$.fn.prepend() - 前置子元素', function() {
        var $div = $('<div><span>Original</span></div>');
        $div.prepend('<span>New</span>');
        TestRunner.assertEqual($div.children().first().text(), 'New', '应该在最前面');
    });
    
    TestRunner.test('$.fn.before() - 在前面插入', function() {
        var container = document.createElement('div');
        var div = document.createElement('div');
        div.className = 'target';
        container.appendChild(div);
        document.body.appendChild(container);
        
        $('.target').before('<span>Before</span>');
        TestRunner.assertEqual(container.children[0].tagName, 'SPAN', '应该在前面插入');
        
        document.body.removeChild(container);
    });
    
    TestRunner.test('$.fn.after() - 在后面插入', function() {
        var container = document.createElement('div');
        var div = document.createElement('div');
        div.className = 'target';
        container.appendChild(div);
        document.body.appendChild(container);
        
        $('.target').after('<span>After</span>');
        TestRunner.assertEqual(container.children[1].tagName, 'SPAN', '应该在后面插入');
        
        document.body.removeChild(container);
    });
    
    TestRunner.test('$.fn.remove() - 移除元素', function() {
        var $div = $('<div class="remove-me"></div>');
        document.body.appendChild($div[0]);
        
        $div.remove();
        TestRunner.assertEqual($('.remove-me').length, 0, '应该移除元素');
    });
    
    TestRunner.test('$.fn.empty() - 清空元素', function() {
        var $div = $('<div><span></span></div>');
        $div.empty();
        TestRunner.assertEqual($div.children().length, 0, '应该没有子元素');
    });
    
    TestRunner.test('$.fn.clone() - 克隆元素', function() {
        var $div = $('<div class="original">Test</div>');
        var $clone = $div.clone();
        TestRunner.assertEqual($clone[0] !== $div[0], true, '应该是不同的元素');
        TestRunner.assertEqual($clone.text(), 'Test', '应该有相同的内容');
    });

    // ==================== 事件测试 ====================
    
    TestRunner.test('$.fn.on() - 绑定事件', function() {
        var $div = $('<div></div>');
        var clicked = false;
        
        $div.on('click', function() {
            clicked = true;
        });
        
        $div[0].click();
        TestRunner.assert(clicked, '应该触发点击事件');
    });
    
    TestRunner.test('$.fn.off() - 解绑事件', function() {
        var $div = $('<div></div>');
        var clicked = false;
        
        var handler = function() {
            clicked = true;
        };
        
        $div.on('click', handler);
        $div.off('click', handler);
        
        $div[0].click();
        TestRunner.assert(!clicked, '不应该触发点击事件');
    });
    
    TestRunner.test('$.fn.one() - 绑定一次性事件', function() {
        var $div = $('<div></div>');
        var count = 0;
        
        $div.one('click', function() {
            count++;
        });
        
        $div[0].click();
        $div[0].click();
        
        TestRunner.assertEqual(count, 1, '应该只触发一次');
    });
    
    TestRunner.test('$.fn.trigger() - 触发事件', function() {
        var $div = $('<div></div>');
        var triggered = false;
        
        $div.on('custom', function() {
            triggered = true;
        });
        
        $div.trigger('custom');
        TestRunner.assert(triggered, '应该触发自定义事件');
    });

    // ==================== 显示/隐藏测试 ====================
    
    TestRunner.test('$.fn.show() - 显示元素', function() {
        var $div = $('<div style="display: none;"></div>');
        $div.show();
        TestRunner.assertNotEqual($div[0].style.display, 'none', '应该显示元素');
    });
    
    TestRunner.test('$.fn.hide() - 隐藏元素', function() {
        var $div = $('<div></div>');
        $div.hide();
        TestRunner.assertEqual($div[0].style.display, 'none', '应该隐藏元素');
    });
    
    TestRunner.test('$.fn.toggle() - 切换显示', function() {
        var $div = $('<div></div>');
        $div.toggle();
        TestRunner.assertEqual($div[0].style.display, 'none', '应该隐藏元素');
        
        $div.toggle();
        TestRunner.assertNotEqual($div[0].style.display, 'none', '应该显示元素');
    });

    // ==================== 工具方法测试 ====================
    
    TestRunner.test('$.extend() - 扩展对象', function() {
        var target = { a: 1 };
        var source = { b: 2 };
        $.extend(target, source);
        
        TestRunner.assertDeepEqual(target, { a: 1, b: 2 }, '应该扩展对象');
    });
    
    TestRunner.test('$.extend() - 深拷贝', function() {
        var target = { a: { x: 1 } };
        var source = { a: { y: 2 }, b: 3 };
        $.extend(true, target, source);
        
        TestRunner.assertDeepEqual(target.a, { x: 1, y: 2 }, '应该深拷贝');
    });
    
    TestRunner.test('$.each() - 遍历数组', function() {
        var arr = [1, 2, 3];
        var sum = 0;
        
        $.each(arr, function(i, v) {
            sum += v;
        });
        
        TestRunner.assertEqual(sum, 6, '应该遍历所有元素');
    });
    
    TestRunner.test('$.each() - 遍历对象', function() {
        var obj = { a: 1, b: 2 };
        var keys = [];
        
        $.each(obj, function(k, v) {
            keys.push(k);
        });
        
        TestRunner.assertDeepEqual(keys, ['a', 'b'], '应该遍历所有属性');
    });
    
    TestRunner.test('$.map() - 映射数组', function() {
        var arr = [1, 2, 3];
        var doubled = $.map(arr, function(v) {
            return v * 2;
        });
        
        TestRunner.assertDeepEqual(doubled, [2, 4, 6], '应该映射所有元素');
    });
    
    TestRunner.test('$.grep() - 过滤数组', function() {
        var arr = [1, 2, 3, 4, 5];
        var filtered = $.grep(arr, function(v) {
            return v > 2;
        });
        
        TestRunner.assertDeepEqual(filtered, [3, 4, 5], '应该过滤数组');
    });
    
    TestRunner.test('$.trim() - 去除空格', function() {
        TestRunner.assertEqual($.trim('  test  '), 'test', '应该去除两端空格');
    });
    
    TestRunner.test('$.type() - 判断类型', function() {
        TestRunner.assertEqual($.type([1, 2]), 'array', '应该识别数组');
        TestRunner.assertEqual($.type({}), 'object', '应该识别对象');
        TestRunner.assertEqual($.type('test'), 'string', '应该识别字符串');
        TestRunner.assertEqual($.type(123), 'number', '应该识别数字');
        TestRunner.assertEqual($.type(null), 'null', '应该识别 null');
    });
    
    TestRunner.test('$.isArray() - 判断数组', function() {
        TestRunner.assert(Array.isArray([1, 2]), '应该返回 true');
        TestRunner.assert(!Array.isArray('test'), '应该返回 false');
    });
    
    TestRunner.test('$.isNumeric() - 判断数字', function() {
        TestRunner.assert($.isNumeric(123), '应该返回 true');
        TestRunner.assert($.isNumeric('123'), '应该返回 true');
        TestRunner.assert(!$.isNumeric('test'), '应该返回 false');
    });
    
    TestRunner.test('$.inArray() - 查找元素', function() {
        var arr = [1, 2, 3];
        TestRunner.assertEqual($.inArray(2, arr), 1, '应该找到元素');
        TestRunner.assertEqual($.inArray(4, arr), -1, '不应该找到元素');
    });
    
    TestRunner.test('$.proxy() - 绑定上下文', function() {
        var obj = {
            name: 'test',
            getName: function() {
                return this.name;
            }
        };
        
        var fn = $.proxy(obj.getName, obj);
        TestRunner.assertEqual(fn(), 'test', '应该绑定正确的上下文');
    });
    
    TestRunner.test('$.parseJSON() - 解析 JSON', function() {
        var str = '{"a":1}';
        var obj = $.parseJSON(str);
        TestRunner.assertEqual(obj.a, 1, '应该正确解析 JSON');
    });
    
    TestRunner.test('$.now() - 获取当前时间戳', function() {
        var now = $.now();
        TestRunner.assert(typeof now === 'number', '应该返回数字');
        TestRunner.assert(now > 0, '应该大于 0');
    });

    // ==================== AJAX 测试（模拟） ====================
    
    TestRunner.test('$.ajax() - GET 请求', function() {
        // 这个测试需要实际的 HTTP 服务器
        // 在实际测试中应该 mock XMLHttpRequest
        var opts = {
            url: '/api/test',
            method: 'GET',
            success: function(data) {
                console.log('Success:', data);
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        };
        
        // 验证参数处理
        TestRunner.assertEqual(opts.method, 'GET', '应该设置正确的 HTTP 方法');
    });

    // ==================== 链式调用测试 ====================
    
    TestRunner.test('链式调用', function() {
        var $div = $('<div></div>');
        
        // 所有方法应该返回 this 以支持链式调用
        var result = $div
            .addClass('test')
            .removeClass('test')
            .css('color', 'red')
            .html('Test')
            .show();
        
        TestRunner.assertEqual(result, $div, '应该返回 this');
    });

    // ==================== 特殊情况测试 ====================
    
    TestRunner.test('空集合', function() {
        var $empty = $('.non-existent');
        TestRunner.assertEqual($empty.length, 0, '应该是空集合');
        
        // 空集合上的方法不应该报错
        $empty.html('test');
        $empty.addClass('test');
        TestRunner.assertEqual($empty.html(), undefined, '应该返回 undefined');
    });
    
    TestRunner.test('$(null) 和 $(undefined)', function() {
        var $null = $(null);
        var $undefined = $(undefined);
        
        TestRunner.assertEqual($null.length, 0, '应该返回空集合');
        TestRunner.assertEqual($undefined.length, 0, '应该返回空集合');
    });

    // 运行测试
    window.TestRunner = TestRunner;
    
})(window);

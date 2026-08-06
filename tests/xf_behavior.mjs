import { chromium } from 'playwright';

const URL = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 140)); });
await p.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
await p.goto(URL, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
// 关闭模板首页自动弹出的推广 offcanvas / modal，避免遮罩拦截点击
await p.evaluate(() => {
  document.querySelectorAll('.offcanvas.show').forEach(o => o.classList.remove('show'));
  document.querySelectorAll('.offcanvas-backdrop, .modal-backdrop').forEach(b => b.remove());
  document.querySelectorAll('.modal.show').forEach(m => { m.classList.remove('show'); m.style.display = 'none'; });
  document.body.classList.remove('modal-open', 'offcanvas-backdrop');
  document.body.style.overflow = '';
});
await p.waitForTimeout(300);

const results = [];
const ok = (n, v, extra = '') => results.push(`${v ? 'PASS' : 'FAIL'}  ${n}${extra ? '   ' + extra : ''}`);

// app.js 是否真正接管
const hasApp = await p.evaluate(() => typeof window.LayoutCustomizer !== 'undefined' || !!document.querySelector('html').getAttribute('data-sidenav-size'));
ok('app.js/LayoutCustomizer 生效（html[data-sidenav-size] 存在）', hasApp);

// 1) 侧边栏折叠切换（桌面宽度）
const before = await p.getAttribute('html', 'data-sidenav-size');
const toggle = await p.$('.sidenav-toggle-button');
ok('.sidenav-toggle-button 存在', !!toggle);
if (toggle) {
  await toggle.click();
  await p.waitForTimeout(500);
  const after = await p.getAttribute('html', 'data-sidenav-size');
  ok('点击后 data-sidenav-size 改变（单次点击未被双重绑定抵消）', before !== after, `${before} -> ${after}`);
  const w1 = await p.evaluate(() => document.querySelector('.sidenav-menu')?.getBoundingClientRect().width);
  ok('折叠后侧边栏宽度收窄', w1 < 200, 'width=' + Math.round(w1));
  await toggle.click();
  await p.waitForTimeout(500);
  const back = await p.getAttribute('html', 'data-sidenav-size');
  ok('再次点击可还原', back === before, `${after} -> ${back}`);
}

// 2) 子菜单 Bootstrap Collapse
const sub = await p.$('.side-nav .side-nav-link[data-bs-toggle="collapse"]');
ok('子菜单使用 Bootstrap Collapse 标记', !!sub);
if (sub) {
  const targetSel = await sub.getAttribute('href');
  const wasShown = await p.evaluate(s => document.querySelector(s)?.classList.contains('show'), targetSel);
  await sub.click();
  await p.waitForTimeout(700);
  const nowShown = await p.evaluate(s => document.querySelector(s)?.classList.contains('show'), targetSel);
  ok('点击父菜单可展开/收起子菜单', wasShown !== nowShown, `${wasShown} -> ${nowShown}`);
}

// 3) 主题切换
const themeBtn = await p.$('#light-dark-mode');
ok('#light-dark-mode 存在', !!themeBtn);
if (themeBtn) {
  const t0 = await p.getAttribute('html', 'data-bs-theme');
  await themeBtn.click();
  await p.waitForTimeout(500);
  const t1 = await p.getAttribute('html', 'data-bs-theme');
  ok('主题可切换', t0 !== t1, `${t0} -> ${t1}`);
}

// 4) 窄屏 offcanvas
await p.setViewportSize({ width: 700, height: 900 });
await p.waitForTimeout(800);
const sizeSm = await p.getAttribute('html', 'data-sidenav-size');
ok('窄屏自动切到 offcanvas', sizeSm === 'offcanvas', 'size=' + sizeSm);
const tg2 = await p.$('.sidenav-toggle-button');
if (tg2) {
  await tg2.click();
  await p.waitForTimeout(600);
  const enabled = await p.evaluate(() => document.documentElement.classList.contains('sidebar-enable'));
  const backdrop = await p.evaluate(() => !!document.getElementById('custom-backdrop'));
  ok('窄屏点击出现抽屉(sidebar-enable)', enabled);
  ok('窄屏出现模板遮罩 #custom-backdrop', backdrop);
}

console.log(results.join('\n'));
console.log('\nJS ERRORS:', errs.length ? errs.slice(0, 8) : 'none');
await b.close();

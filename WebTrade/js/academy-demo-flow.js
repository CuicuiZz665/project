/*!
 * academy-demo-flow.js — 「开设模拟账户」弹窗流程（academy.html 外壳注入，同 js/i18n.js 机制）
 * 流程：点击页面任意「开设模拟账户」链接（hero ghost / 课程弹窗底部等包体原有入口）
 * → 弹窗（开通成功 + 头像切换指引，版本B文案）→ 确认后 localStorage 记状态。
 * 不改按钮文案、不注入任何可见元素；文案为英文原文，走 i18n 多语言词条，
 * 注入节点后须调 I18N.reapply() 补翻（observer 随解包失效）。
 * 改动本文件后需 bump academy.html 外壳引用的 ?v=。
 */
(function () {
  'use strict';
  if (window.__ginxDemoFlowLoaded) return;
  window.__ginxDemoFlowLoaded = true;

  var LS_KEY = 'ginx_demo_account_opened';
  /* 包体原始链接指向 index.html#demo、且文案为开设模拟账户的入口才接入本流程 */
  var DEMO_HREF = 'index.html#demo';
  var DEMO_LABELS = ['Open Demo Account', '开设模拟账户'];

  /* 文案 key = 页面渲染的英文原文，与 i18n/<lang>/academy.json 对应 */
  var TXT = {
    title: 'Demo Account Activated 🎉',
    body: '10,000 USDT in demo funds has been credited to your account.',
    steps: 'Next: tap the avatar at the top right and switch to “Demo Account” under “Switch Account”. Once switched, you can enter a competition and start your demo trading journey.',
    ok: 'Got it, switch now'
  };

  var css = [
    '.ginx-demo-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;',
    'justify-content:center;padding:20px;background:rgba(5,3,1,.62);',
    '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);',
    'opacity:0;transition:opacity .25s ease;}',
    '.ginx-demo-overlay.ginx-show{opacity:1;}',
    '.ginx-demo-modal{position:relative;width:min(430px,100%);padding:34px 30px 28px;',
    'border-radius:22px;border:1px solid rgba(247,147,26,.3);',
    'background:linear-gradient(165deg,#1d150c,#120d07);',
    'box-shadow:0 30px 80px rgba(0,0,0,.6);text-align:center;',
    'transform:translateY(14px) scale(.96);transition:transform .25s ease;}',
    '.ginx-demo-overlay.ginx-show .ginx-demo-modal{transform:none;}',
    '.ginx-demo-close{position:absolute;top:10px;right:14px;width:34px;height:34px;',
    'border:0;background:transparent;border-radius:50%;color:rgba(255,255,255,.45);',
    'font-size:24px;line-height:1;cursor:pointer;transition:color .2s ease,background .2s ease;}',
    '.ginx-demo-close:hover{color:#fff;background:rgba(255,255,255,.08);}',
    '.ginx-demo-title{margin:0 0 12px;font-size:22px;font-weight:800;letter-spacing:-.01em;',
    'background:linear-gradient(120deg,#ffd08a,#f7931a 70%);',
    '-webkit-background-clip:text;background-clip:text;color:transparent;}',
    '.ginx-demo-body{margin:0;font-size:14px;line-height:1.7;color:rgba(236,240,248,.78);}',
    '.ginx-demo-steps{margin-top:14px;padding:12px 14px;border-radius:14px;text-align:left;',
    'background:rgba(247,147,26,.08);border:1px solid rgba(247,147,26,.22);',
    'font-size:13.5px;line-height:1.8;color:#ffd9a3;}',
    '.ginx-demo-ok{display:block;width:100%;margin-top:20px;min-height:46px;',
    'border:0;border-radius:999px;cursor:pointer;',
    'background:linear-gradient(90deg,#FFB13B 0%,#F7931A 55%,#FF7A1A 100%);',
    'color:#14100a;font-size:14.5px;font-weight:800;letter-spacing:.01em;',
    'transition:transform .2s ease,filter .2s ease;}',
    '.ginx-demo-ok:hover{transform:translateY(-1px);filter:brightness(1.06);}',
    '@media (max-width:560px){.ginx-demo-modal{padding:28px 20px 22px;}}'
  ].join('');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.appendChild(document.createTextNode(text));
    return n;
  }

  /* i18n.js 的 MutationObserver 随外壳 DOM 被解包替换而失效，
     后注入节点需主动触发一次全量套词（仅 zh 等非基础语言时有 map，EN 模式为空操作） */
  function reapplyI18n() {
    try {
      if (window.I18N && typeof window.I18N.reapply === 'function') window.I18N.reapply();
    } catch (e) {}
  }

  function labelOf(a) {
    return (a.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isDemoLink(a) {
    return !!a &&
      a.tagName === 'A' &&
      a.getAttribute('href') === DEMO_HREF &&
      DEMO_LABELS.indexOf(labelOf(a)) >= 0;
  }

  function openPopup(trigger) {
    if (document.querySelector('.ginx-demo-overlay')) return;
    var overlay = el('div', 'ginx-demo-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var modal = el('div', 'ginx-demo-modal');

    var close = el('button', 'ginx-demo-close', '×');
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closePopup);

    var title = el('h3', 'ginx-demo-title', TXT.title);
    title.id = 'ginx-demo-modal-title';
    overlay.setAttribute('aria-labelledby', 'ginx-demo-modal-title');

    var ok = el('button', 'ginx-demo-ok', TXT.ok);

    modal.appendChild(close);
    modal.appendChild(title);
    modal.appendChild(el('p', 'ginx-demo-body', TXT.body));
    modal.appendChild(el('div', 'ginx-demo-steps', TXT.steps));
    modal.appendChild(ok);
    overlay.appendChild(modal);

    function closePopup() {
      overlay.classList.remove('ginx-show');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 260);
      document.removeEventListener('keydown', onKey);
      if (trigger && trigger.focus) trigger.focus();
    }
    function onKey(e) { if (e.key === 'Escape') closePopup(); }

    ok.addEventListener('click', function () {
      try { localStorage.setItem(LS_KEY, '1'); } catch (e) {}
      closePopup();
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('ginx-show'); });
    reapplyI18n();
    ok.focus();
  }

  /* 全页委托：包体原有的所有「开设模拟账户」链接统一接入，点击弹窗不跳转 */
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var a = target.closest('a[href="' + DEMO_HREF + '"]');
    if (!isDemoLink(a)) return;
    e.preventDefault();
    openPopup(a);
  }, true);

  var style = document.createElement('style');
  style.id = 'ginx-demo-flow-style';
  style.textContent = css;
  document.head.appendChild(style);
})();

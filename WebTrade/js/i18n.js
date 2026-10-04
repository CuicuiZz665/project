/* ============================================================
 * GinX 静态站 i18n 引擎（fetch 动态文案切换）
 * ------------------------------------------------------------
 * 约定：
 *  - 词条文件：i18n/<lang>/<page>.json，page 名与 html 文件同名。
 *    key = 页面原始文案（空白归一化后），value = 该语言译文；
 *    基础语言文件为恒等映射（可直接当翻译模板改）。
 *  - 引擎按文本节点 / 常用属性（placeholder|title|alt|aria-label）
 *    / meta description|keywords / <title> 全量匹配替换；
 *    首次命中时把原文记在节点上（__i18nOrig），可无限次来回切换。
 *  - MutationObserver 监听后续 DOM 注入（自解压包 / 页面 JS 渲染），
 *    自动补翻新节点。
 *  - 语言选择存 localStorage('ginx_i18n_lang')，默认 = 页面基础语言
 *    （按正文 CJK 占比自动检测），不做浏览器语言自动切换。
 *  - 悬浮切换钮：左下角 EN | 中。在 script 标签上加
 *    data-i18n-widget="off" 可隐藏（页面自带切换器时用）。
 *  - 必须通过 http 访问（fetch 不支持 file://），本地用
 *    python3 -m http.server 8643 预览。
 *  - 词条请求强制 no-store（改 JSON 即时生效，无需 bump 任何 ?v=）；
 *    仅引擎代码本身变化时才 VER bump + 离线包页面 ?v= 同步。
 * ============================================================ */
(function () {
  'use strict';

  // 同页可能插入多个 i18n.js 引用（head + body 尾），只初始化一次
  if (window.__ginxI18nLoaded) return;
  window.__ginxI18nLoaded = true;

  // 必须在脚本执行瞬间捕获（延迟启动后 document.currentScript 为 null）
  var ownScript = document.currentScript;

  var VER = '20260924n';
  var SUPPORTED = ['en', 'zh'];
  var STORE_KEY = 'ginx_i18n_lang';
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  var SKIP_SEL = 'script,style,noscript,svg,template,code,pre,textarea,[data-i18n-skip]';

  function pageName() {
    var p = location.pathname.split('/').pop();
    if (!p) return 'index';
    return p.replace(/\.html?$/i, '') || 'index';
  }

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function hasLetter(s) { return /[A-Za-z\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(s); }

  function detectBase() {
    try {
      var t = (document.body && document.body.innerText || '').slice(0, 20000);
      var cjk = (t.match(/[\u4e00-\u9fff]/g) || []).length;
      var lat = (t.match(/[A-Za-z]/g) || []).length;
      return cjk > lat ? 'zh' : 'en';
    } catch (e) { return 'en'; }
  }

  var state = {
    page: pageName(),
    base: detectBase(),
    lang: null,
    map: null,       // 当前语言的词条表（lang === base 时为 null）
    applied: 0,      // 最近一次 apply 实际改写的节点数
    ready: false,
    error: null
  };
  var cache = {};    // lang -> map|null

  /* ---------- 应用 / 还原 ---------- */

  function applyTextNodes(map) {
    var n, applied = 0;
    var w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, null);
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (!p || p.closest(SKIP_SEL)) continue;
      var raw = n.nodeValue;
      if (!raw || !raw.trim()) continue;
      var orig = n.__i18nOrig || (n.__i18nOrig = raw);
      var key = norm(orig);
      if (!key || !hasLetter(key)) continue;
      var t = map[key];
      if (t === undefined) continue;
      var lead = /^\s*/.exec(orig)[0], tail = /\s*$/.exec(orig)[0];
      var nv = lead + t + tail;
      if (n.nodeValue !== nv) { n.nodeValue = nv; applied++; }
    }
    return applied;
  }

  function applyAttrs(map) {
    var applied = 0;
    var sel = ATTRS.map(function (a) { return '[' + a + ']'; }).join(',');
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest(SKIP_SEL)) return;
      ATTRS.forEach(function (a) {
        var raw = el.getAttribute(a);
        if (raw == null) return;
        var store = el.__i18nAttrOrig || (el.__i18nAttrOrig = {});
        if (!(a in store)) store[a] = raw;
        var key = norm(store[a]);
        if (!key || !hasLetter(key)) return;
        var t = map[key];
        if (t === undefined) return;
        var nv = t;
        if (el.getAttribute(a) !== nv) { el.setAttribute(a, nv); applied++; }
      });
    });
    return applied;
  }

  function applyMeta(map) {
    var applied = 0;
    ['description', 'keywords'].forEach(function (nm) {
      var m = document.querySelector('meta[name="' + nm + '"]');
      if (!m) return;
      var raw = m.getAttribute('content');
      if (raw == null) return;
      if (!m.__i18nMetaOrig) m.__i18nMetaOrig = raw;
      var t = map['__meta:' + nm + '__'];
      if (t === undefined) return;
      if (m.getAttribute('content') !== t) { m.setAttribute('content', t); applied++; }
    });
    return applied;
  }

  function applyAll() {
    if (!state.map) return;
    state.applied = applyTextNodes(state.map) + applyAttrs(state.map) + applyMeta(state.map);
    document.documentElement.lang = state.lang;
  }

  function restoreAll() {
    var n, applied = 0;
    var w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, null);
    while ((n = w.nextNode())) {
      if (n.__i18nOrig && n.nodeValue !== n.__i18nOrig) { n.nodeValue = n.__i18nOrig; applied++; }
    }
    document.querySelectorAll('*').forEach(function (el) {
      var s = el.__i18nAttrOrig;
      if (s) Object.keys(s).forEach(function (a) {
        if (el.getAttribute(a) !== s[a]) { el.setAttribute(a, s[a]); applied++; }
      });
      if (el.__i18nMetaOrig && el.tagName === 'META' && el.getAttribute('content') !== el.__i18nMetaOrig) {
        el.setAttribute('content', el.__i18nMetaOrig); applied++;
      }
    });
    state.applied = applied;
    document.documentElement.lang = state.base;
  }

  /* ---------- 载入词条 ---------- */

  function fetchMap(lang) {
    if (lang in cache) return Promise.resolve(cache[lang]);
    var url = 'i18n/' + lang + '/' + state.page + '.json?v=' + VER;
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('i18n: ' + url + ' -> ' + r.status);
      return r.json();
    }).then(function (m) {
      cache[lang] = m;
      return m;
    }).catch(function (e) {
      cache[lang] = null;
      state.error = String(e && e.message || e);
      console.warn('[i18n] 词条加载失败（用 http 预览，检查 i18n/' + lang + '/' + state.page + '.json）:', state.error);
      return null;
    });
  }

  function useLang(lang, save) {
    if (SUPPORTED.indexOf(lang) < 0) return Promise.resolve(false);
    state.lang = lang;
    if (save) { try { localStorage.setItem(STORE_KEY, lang); } catch (e) {} }
    if (lang === state.base) {
      state.map = null;
      restoreAll();
      syncWidget();
      dispatch();
      return Promise.resolve(true);
    }
    return fetchMap(lang).then(function (m) {
      state.map = m;
      state.ready = !!m;
      applyAll();
      syncWidget();
      dispatch();
      return !!m;
    });
  }

  function dispatch() {
    try { document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: state.lang, base: state.base, page: state.page, applied: state.applied } })); } catch (e) {}
  }

  /* ---------- 观察后续注入 ---------- */

  var timer = null;
  function scheduleApply() {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      if (state.map) applyAll();
    }, 150);
  }

  function observe() {
    if (window.MutationObserver) {
      new MutationObserver(function () { scheduleApply(); }).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true
      });
    }
  }

  /* ---------- 悬浮切换钮 ---------- */

  var widget = null;
  var WIDGET_LABELS = { en: 'EN', zh: '中文' };

  function buildWidget() {
    var off = (ownScript && ownScript.getAttribute('data-i18n-widget') === 'off');
    try { if (localStorage.getItem('ginx_i18n_widget_off') === '1') off = true; } catch (e) {}
    if (off || SUPPORTED.length < 2) return;

    widget = document.createElement('div');
    widget.id = '__i18n_switch';
    widget.setAttribute('data-i18n-skip', '1');
    widget.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:2px;'
      + 'padding:3px;border-radius:999px;background:rgba(10,11,14,.82);backdrop-filter:blur(6px);'
      + 'box-shadow:0 2px 10px rgba(0,0,0,.25);font:600 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
    SUPPORTED.forEach(function (lg) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = lg;
      b.textContent = WIDGET_LABELS[lg] || lg;
      b.style.cssText = 'border:0;cursor:pointer;padding:6px 10px;border-radius:999px;color:#9aa3b2;background:transparent;';
      b.addEventListener('click', function () { useLang(lg, true); });
      widget.appendChild(b);
    });
    (document.body || document.documentElement).appendChild(widget);
    syncWidget();
  }

  function syncWidget() {
    if (!widget) return;
    Array.prototype.forEach.call(widget.children, function (b) {
      var on = b.dataset.lang === state.lang;
      b.style.background = on ? '#f7931a' : 'transparent';
      b.style.color = on ? '#0a0b0e' : '#9aa3b2';
    });
  }

  /* ---------- 启动 ---------- */

  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
  if (saved && SUPPORTED.indexOf(saved) < 0) saved = null;
  state.lang = saved || state.base;

  observe();

  function boot() {
    buildWidget();
    if (state.lang !== state.base) useLang(state.lang, false);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // 自解压包在 DOMContentLoaded 里重建 DOM，稍等一拍再套词条
      setTimeout(boot, 60);
    });
  } else {
    boot();
  }
  // 兜底：load 之后再补一次（覆盖加载器晚注入的节点）
  window.addEventListener('load', function () { if (state.map) setTimeout(applyAll, 300); });

  window.I18N = {
    supported: SUPPORTED,
    page: state.page,
    get base() { return state.base; },
    get lang() { return state.lang; },
    setLang: function (l) { return useLang(l, true); },
    reapply: applyAll,
    state: state
  };
})();

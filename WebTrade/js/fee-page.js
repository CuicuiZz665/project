/* 费率总览页：主 tab 切换 + hash 直达（#fee-trading / #fee-swap） */
(() => {
  const tabButtons = document.querySelectorAll('[data-fee-tab]');
  const panels = document.querySelectorAll('[data-fee-panel]');
  if (!tabButtons.length || !panels.length) return;

  const activate = (name) => {
    // 未知 hash（含已删除 tab 的旧链接）直接忽略，保持当前状态
    if (![...tabButtons].some((btn) => btn.dataset.feeTab === name)) return;
    tabButtons.forEach((btn) => {
      const on = btn.dataset.feeTab === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.feePanel === name);
    });
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => activate(btn.dataset.feeTab));
  });

  const fromHash = () => {
    const m = (location.hash || '').match(/^#fee-([a-z]+)$/);
    if (m) activate(m[1]);
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();

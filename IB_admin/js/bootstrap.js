(function bootstrapAdminApp() {
  const dependencyScripts = [
    "vendor/react/react.production.min.js",
    "vendor/react/react-dom.production.min.js",
    "vendor/dayjs/dayjs.min.js",
    "vendor/antd/antd.min.js"
  ];
  const appScripts = [
    "js/namespace.js",
    "js/mock-data.js",
    "js/shared-actions.js",
    "js/customer-page.js",
    "js/login-log-page.js",
    "js/operation-log-page.js",
    "js/blacklist-page.js",
    "js/whitelist-page.js",
    "js/agent-page.js",
    "js/agent-application-page.js",
    "js/agent-level-page.js",
    "js/commission-page.js",
    "js/commission-record-page.js",
    "js/dashboard-page.js",
    "js/workbench-page.js",
    "js/activity-page.js",
    "js/activity-application-page.js",
    "js/point-details-page.js",
    "js/wheel-page.js",
    "js/coupon-page.js",
    "js/badge-page.js",
    "js/ad-pages.js",
    "js/message-pages.js",
    "js/mail-push-pages.js",
    "js/version-setting-page.js",
    "js/change-password-page.js",
    "js/funds-manage-page.js",
    "js/finance-shared.js",
    "js/deposit-page.js",
    "js/withdraw-pages.js",
    "js/network-config-page.js",
    "js/fund-flow-page.js",
    "js/order-list-page.js",
    "js/role-settings-page.js",
    "js/user-settings-page.js",
    "js/global-nav.js",
    "js/notification-bell.js",
    "js/antd-app.js"
  ];
  const appVersion = "20261027-tc2";
  const scriptTimeout = 12000;

  function showDependencyError(detail) {
    const root = document.getElementById("root");
    if (!root) return;
    root.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;background:#f5f7fb;color:#30343b;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;padding:24px;border:1px solid #edf0f5;border-radius:8px;background:#fff;">
          <strong style="display:block;margin-bottom:8px;font-size:16px;">组件资源加载失败</strong>
          <span>请确认 vendor 目录下的 React、ReactDOM、dayjs 与 antd 资源存在后刷新页面。</span>
          ${detail ? `<div style="margin-top:10px;color:#8b93a1;">${detail}</div>` : ""}
        </div>
      </div>
    `;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      let done = false;
      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;
        reject(new Error(`Timed out loading ${src}`));
      }, scriptTimeout);
      script.async = false;
      script.src = src.startsWith("js/") ? `${src}?v=${appVersion}` : src;
      script.onload = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  async function start() {
    try {
      for (const src of dependencyScripts) await loadScript(src);
      if (!window.React || !window.ReactDOM || !window.dayjs || !window.antd) {
        throw new Error("Required CDN globals are unavailable.");
      }
      for (const src of appScripts) {
        await loadScript(src);
      }
    } catch (error) {
      showDependencyError(error.message);
    }
  }

  start();
})();

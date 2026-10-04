(function startAdminApp(app) {
  function start() {
    const toast = new app.Toast();
    const confirm = new app.ConfirmDialog();
    const ruleManager = new app.RuleManager({
      data: app.mockData.rules,
      toast,
      confirm
    });
    const deliveryManager = new app.DeliveryManager({
      data: app.mockData.deliveries,
      options: app.mockData.cascaderOptions,
      toast,
      confirm
    });
    const shell = new app.AppShell({
      breadcrumbs: app.mockData.breadcrumbs,
      toast,
      ruleManager,
      deliveryManager
    });

    confirm.init();
    shell.init();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window.AdminApp);

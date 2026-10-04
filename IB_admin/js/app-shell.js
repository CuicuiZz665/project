(function registerAppShell(app) {
  const { $, $$ } = app.dom;

  app.AppShell = class AppShell {
    constructor({ breadcrumbs, toast, ruleManager, deliveryManager }) {
      this.breadcrumbs = breadcrumbs;
      this.toast = toast;
      this.ruleManager = ruleManager;
      this.deliveryManager = deliveryManager;
    }

    init() {
      $$("[data-nav-toggle]").forEach(item => item.addEventListener("click", () => this.toggleGroup(item)));
      $$("[data-page]").forEach(item => item.addEventListener("click", () => this.switchPage(item.dataset.page)));
      this.ruleManager.init();
      this.deliveryManager.init();
      this.syncNavigation("rules");
    }

    switchPage(page) {
      $("#rulesView").hidden = page !== "rules";
      $("#deliveryView").hidden = page !== "delivery";
      $("#breadcrumb").innerHTML = this.breadcrumbs[page];
      this.syncNavigation(page);
      $("#columnPanel").classList.add("hidden");
      this.toast.show(page === "rules" ? "已切换到积分获取设置" : "已切换到投递管理");
    }

    toggleGroup(button) {
      const group = button.closest(".nav-group");
      const shouldExpand = !group.classList.contains("expanded");
      group.classList.toggle("expanded", shouldExpand);
      button.setAttribute("aria-expanded", String(shouldExpand));
      if (shouldExpand && button.dataset.defaultPage) this.switchPage(button.dataset.defaultPage);
    }

    syncNavigation(page) {
      $$("[data-page]").forEach(item => item.classList.toggle("active", item.dataset.page === page));
      $$("[data-nav-group]").forEach(group => {
        const parent = $("[data-nav-toggle]", group);
        const containsPage = Boolean($(`[data-page="${page}"]`, group));
        group.classList.toggle("expanded", containsPage);
        parent.setAttribute("aria-expanded", String(containsPage));
      });
    }
  };
})(window.AdminApp);

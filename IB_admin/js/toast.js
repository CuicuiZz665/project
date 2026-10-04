(function registerToast(app) {
  const { $ } = app.dom;

  app.Toast = class Toast {
    constructor(selector = "#toast") {
      this.el = $(selector);
      this.timer = null;
    }

    show(message) {
      this.el.textContent = message;
      this.el.classList.add("show");
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.el.classList.remove("show"), 1800);
    }
  };
})(window.AdminApp);

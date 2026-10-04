(function registerConfirmDialog(app) {
  const { $ } = app.dom;

  app.ConfirmDialog = class ConfirmDialog {
    constructor() {
      this.overlay = $("#confirmOverlay");
      this.title = $("#confirmTitle");
      this.body = $("#confirmBody");
      this.action = null;
    }

    init() {
      $("#closeConfirmBtn").addEventListener("click", () => this.close());
      $("#cancelConfirmBtn").addEventListener("click", () => this.close());
      $("#okConfirmBtn").addEventListener("click", () => {
        if (this.action) this.action();
        this.close();
      });
      this.overlay.addEventListener("click", event => {
        if (event.target === this.overlay) this.close();
      });
    }

    ask(title, body, action) {
      this.title.textContent = title;
      this.body.textContent = body;
      this.action = action;
      this.overlay.classList.remove("hidden");
    }

    close() {
      this.overlay.classList.add("hidden");
      this.action = null;
    }
  };
})(window.AdminApp);

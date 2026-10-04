(function registerDeliveryManager(app) {
  const { $ } = app.dom;
  const { escapeHtml } = app.utils;

  app.DeliveryManager = class DeliveryManager {
    constructor({ data, options, toast, confirm }) {
      this.deliveries = data;
      this.toast = toast;
      this.confirm = confirm;
      this.state = {
        page: 1,
        pageSize: 5
      };
      this.els = {
        body: $("#deliveryBody"),
        pagination: $("#deliveryPagination"),
        keyword: $("#deliveryKeyword"),
        objectFilter: $("#deliveryObjectFilter"),
        statusFilter: $("#deliveryStatusFilter")
      };
      this.modal = new app.DeliveryModal({
        data,
        options,
        toast,
        confirm,
        onSave: (itemData, editingId) => this.save(itemData, editingId)
      });
    }

    init() {
      this.modal.init();
      $("#openCreate").addEventListener("click", () => this.modal.open("add"));
      $("#moreDeliveryFilter").addEventListener("click", () => this.toast.show("更多筛选面板已模拟展开"));
      $("#searchDeliveryBtn").addEventListener("click", () => {
        this.state.page = 1;
        this.render();
        this.toast.show("投递列表已查询");
      });
      $("#resetDeliveryBtn").addEventListener("click", () => {
        this.els.keyword.value = "";
        this.els.objectFilter.value = "请选择";
        this.els.statusFilter.value = "选择状态";
        this.state.page = 1;
        this.render();
        this.toast.show("投递筛选已重置");
      });
      this.els.keyword.addEventListener("keydown", event => {
        if (event.key === "Enter") $("#searchDeliveryBtn").click();
      });
      this.els.objectFilter.addEventListener("change", () => {
        this.state.page = 1;
        this.render();
      });
      this.els.statusFilter.addEventListener("change", () => {
        this.state.page = 1;
        this.render();
      });
      this.els.body.addEventListener("click", event => this.handleAction(event));
      $("#closeDetail").addEventListener("click", () => this.hideDetail());
      $("#drawerMask").addEventListener("click", () => this.hideDetail());
      this.render();
    }

    render() {
      const keyword = this.els.keyword.value.trim().toLowerCase();
      const objectFilter = this.els.objectFilter.value;
      const statusFilter = this.els.statusFilter.value;
      const list = this.deliveries.filter(item => {
        const keywordMatched = !keyword || `${item.name}${item.object}${item.method}`.toLowerCase().includes(keyword);
        const objectMatched = objectFilter === "请选择" || item.object.includes(objectFilter);
        const statusMatched = statusFilter === "选择状态" || item.status === statusFilter;
        return keywordMatched && objectMatched && statusMatched;
      });
      const pagination = app.renderPagination({
        container: this.els.pagination,
        total: list.length,
        page: this.state.page,
        pageSize: this.state.pageSize,
        onChange: ({ page, pageSize }) => {
          this.state.page = page;
          this.state.pageSize = pageSize;
          this.render();
        }
      });
      this.state.page = pagination.page;
      const pageRows = list.slice(pagination.start, pagination.end);
      this.els.body.innerHTML = pageRows.map(item => `
        <tr>
          <td><button class="link name-link" data-delivery-action="detail" data-id="${item.id}">${escapeHtml(item.name)}</button></td>
          <td>${escapeHtml(item.object)}</td>
          <td>${escapeHtml(item.method)}</td>
          <td>${escapeHtml(item.count)}</td>
          <td><span class="tag ${item.status === "启用" ? "on" : ""}">${escapeHtml(item.status)}</span></td>
          <td>${escapeHtml(item.start)}</td>
          <td>${escapeHtml(item.end)}</td>
          <td>${this.actionHtml(item)}</td>
        </tr>
      `).join("") || `<tr><td colspan="8" class="muted" style="text-align:center;padding:32px;">暂无数据</td></tr>`;
    }

    actionHtml(item) {
      if (item.status === "作废") return '<span class="muted">不可操作</span>';
      if (item.status === "启用") return `<button class="btn danger" data-delivery-action="void" data-id="${item.id}">作废</button>`;
      return `<div class="row-actions"><button class="btn primary" data-delivery-action="edit" data-id="${item.id}">修改</button><button class="btn primary" data-delivery-action="enable" data-id="${item.id}">启用</button><button class="btn danger" data-delivery-action="void" data-id="${item.id}">作废</button></div>`;
    }

    handleAction(event) {
      const button = event.target.closest("[data-delivery-action]");
      if (!button) return;
      const item = this.deliveries.find(entry => entry.id === Number(button.dataset.id));
      if (!item) return;
      if (button.dataset.deliveryAction === "detail") this.showDetail(item.id);
      if (button.dataset.deliveryAction === "edit") this.modal.open("edit", item);
      if (button.dataset.deliveryAction === "enable") this.confirm.ask("确认启用", `启用后投递任务“${item.name}”将生效。`, () => {
        item.status = "启用";
        this.render();
        this.toast.show("投递任务已启用");
      });
      if (button.dataset.deliveryAction === "void") this.confirm.ask("确认作废", `作废后投递任务“${item.name}”不可启用。`, () => {
        item.status = "作废";
        this.render();
        this.toast.show("投递任务已作废");
      });
    }

    save(itemData, editingId) {
      if (editingId) Object.assign(this.deliveries.find(item => item.id === editingId), itemData);
      else this.deliveries.unshift({ id: Date.now(), ...itemData });
      this.state.page = 1;
      this.render();
    }

    showDetail(id) {
      const data = this.deliveries.find(item => item.id === Number(id));
      if (!data) return;
      $("#detailName").textContent = data.name;
      $("#detailObject").textContent = data.objectDetail;
      $("#detailMethod").textContent = data.method;
      $("#detailCount").textContent = data.count;
      $("#detailStart").textContent = data.start;
      $("#detailEnd").textContent = data.end;
      $("#detailEvent").textContent = data.event;
      $("#detailParam").innerHTML = data.param;
      $("#detailStatus").innerHTML = `<span class="tag ${data.status === "启用" ? "on" : ""}">${escapeHtml(data.status)}</span>`;
      $("#detailOperator").textContent = data.operator;
      $("#drawerMask").classList.add("show");
      $("#detailDrawer").classList.add("show");
    }

    hideDetail() {
      $("#drawerMask").classList.remove("show");
      $("#detailDrawer").classList.remove("show");
    }
  };
})(window.AdminApp);

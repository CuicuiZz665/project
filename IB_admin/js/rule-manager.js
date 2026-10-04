(function registerRuleManager(app) {
  const { $, $$ } = app.dom;
  const { escapeHtml } = app.utils;

  app.RuleManager = class RuleManager {
    constructor({ data, toast, confirm }) {
      this.rules = data;
      this.toast = toast;
      this.confirm = confirm;
      this.state = {
        editingId: null,
        page: 1,
        pageSize: 5,
        sortKey: "",
        sortAsc: true,
        visibleColumns: new Set(["externalName", "triggerEvent", "cyclePeriod", "reward", "taskType", "timeRange", "status"]),
        languages: ["英语"],
        activeLang: "英语"
      };
      this.els = {
        body: $("#rulesBody"),
        pagination: $("#pagination"),
        keyword: $("#ruleKeyword"),
        statusFilter: $("#statusFilter"),
        columnPanel: $("#columnPanel")
      };
      this.modal = new app.RuleModal({
        state: this.state,
        toast: this.toast,
        confirm: this.confirm,
        onSave: (data, editingId, title) => this.saveRule(data, editingId, title)
      });
    }

    init() {
      this.modal.init();
      $("#addRuleBtn").addEventListener("click", () => this.modal.open("add"));
      $("#columnBtn").addEventListener("click", () => this.els.columnPanel.classList.toggle("hidden"));
      this.els.body.addEventListener("click", event => this.handleRuleAction(event));
      $$("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
          const key = th.dataset.col;
          this.state.sortAsc = this.state.sortKey === key ? !this.state.sortAsc : true;
          this.state.sortKey = key;
          this.render();
          this.toast.show("排序已更新");
        });
      });
      $$("[data-toggle-column]").forEach(input => {
        input.addEventListener("change", event => {
          const column = event.target.dataset.toggleColumn;
          if (event.target.checked) this.state.visibleColumns.add(column);
          else this.state.visibleColumns.delete(column);
          this.syncColumnVisibility();
        });
      });
      $("#searchBtn").addEventListener("click", () => {
        this.state.page = 1;
        this.render();
        this.toast.show(`查询到 ${this.filteredRules().length} 条规则`);
      });
      $("#resetBtn").addEventListener("click", () => {
        this.els.keyword.value = "";
        this.els.statusFilter.value = "选择状态";
        this.state.page = 1;
        this.render();
        this.toast.show("筛选已重置");
      });
      this.els.keyword.addEventListener("keydown", event => {
        if (event.key === "Enter") $("#searchBtn").click();
      });
      this.els.statusFilter.addEventListener("change", () => {
        this.state.page = 1;
        this.render();
      });
      document.addEventListener("click", event => {
        if (!event.target.closest("#columnPanel") && !event.target.closest("#columnBtn")) this.els.columnPanel.classList.add("hidden");
      });
      this.render();
    }

    rewardHtml(rule) {
      const rewards = [];
      if (Number(rule.rewardXp) > 0) rewards.push(`<span class="reward-pill xp">${rule.rewardXp} XP</span>`);
      if (Number(rule.rewardDrop) > 0) rewards.push(`<span class="reward-pill drop">${rule.rewardDrop} Drop</span>`);
      return `<div class="reward-cell">${rewards.join("") || '<span class="muted">-</span>'}</div>`;
    }

    ruleActionHtml(rule) {
      const primary = rule.status === "启用"
        ? `<button class="btn-danger" data-rule-action="disable" data-id="${rule.id}">禁 用</button>`
        : `<button class="btn-link" data-rule-action="enable" data-id="${rule.id}" ${rule.status === "禁用" ? "disabled" : ""}>启 用</button>`;
      const edit = rule.canEdit ? `<button class="btn-link" data-rule-action="edit" data-id="${rule.id}">修 改</button>` : "";
      return `${primary}${edit}<button class="btn-link" data-rule-action="copy" data-id="${rule.id}">复 制</button>`;
    }

    filteredRules() {
      const keyword = this.els.keyword.value.trim().toLowerCase();
      const status = this.els.statusFilter.value;
      let list = this.rules.filter(rule => {
        const matchedKeyword = !keyword || `${rule.internalName}${rule.externalName}${rule.triggerEvent}`.toLowerCase().includes(keyword);
        const matchedStatus = status === "选择状态" || rule.status === status;
        return matchedKeyword && matchedStatus;
      });
      if (this.state.sortKey) {
        list = [...list].sort((a, b) => String(a[this.state.sortKey]).localeCompare(String(b[this.state.sortKey]), "zh-CN"));
        if (!this.state.sortAsc) list.reverse();
      }
      return list;
    }

    cell(column, html, extra = "") {
      const hidden = this.state.visibleColumns.has(column) ? "" : "display:none;";
      return `<td data-column="${column}" class="${extra}" style="${hidden}">${html}</td>`;
    }

    syncColumnVisibility() {
      $$("[data-column]").forEach(node => {
        node.style.display = this.state.visibleColumns.has(node.dataset.column) ? "" : "none";
      });
    }

    render() {
      const list = this.filteredRules();
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
      this.els.body.innerHTML = pageRows.map(rule => `
        <tr>
          <td>${escapeHtml(rule.internalName)}</td>
          ${this.cell("externalName", escapeHtml(rule.externalName))}
          ${this.cell("triggerEvent", escapeHtml(rule.triggerEvent))}
          ${this.cell("cyclePeriod", escapeHtml(rule.cyclePeriod))}
          ${this.cell("reward", this.rewardHtml(rule))}
          ${this.cell("taskType", escapeHtml(rule.taskType))}
          ${this.cell("timeRange", escapeHtml(rule.timeRange), "muted")}
          ${this.cell("status", `<span class="status"><i class="dot ${rule.status === "启用" ? "" : "off"}"></i>${escapeHtml(rule.status)}</span>`)}
          <td>${this.ruleActionHtml(rule)}</td>
        </tr>
      `).join("") || `<tr><td colspan="9" class="muted" style="text-align:center;padding:32px;">暂无数据</td></tr>`;
      this.syncColumnVisibility();
    }

    handleRuleAction(event) {
      const button = event.target.closest("button[data-rule-action]");
      if (!button) return;
      const rule = this.rules.find(item => item.id === Number(button.dataset.id));
      if (!rule) return;
      if (button.dataset.ruleAction === "edit") this.modal.open("edit", rule);
      if (button.dataset.ruleAction === "copy") this.modal.open("copy", rule);
      if (button.dataset.ruleAction === "disable") this.confirm.ask("确认禁用", `禁用后规则“${rule.internalName}”不会继续发放奖励。`, () => {
        rule.status = "禁用";
        this.render();
        this.toast.show("规则已禁用");
      });
      if (button.dataset.ruleAction === "enable") this.confirm.ask("确认启用", `启用后规则“${rule.internalName}”将按当前条件发放奖励。`, () => {
        rule.status = "启用";
        this.render();
        this.toast.show("规则已启用");
      });
    }

    saveRule(data, editingId, title) {
      if (editingId) {
        Object.assign(this.rules.find(item => item.id === editingId), data);
        this.toast.show("规则已修改");
      } else {
        this.rules.unshift({ id: Date.now(), ...data, status: "待启用", canEdit: true });
        this.toast.show(title === "复制规则" ? "规则已复制" : "规则已新增");
      }
      this.state.page = 1;
      this.render();
    }
  };
})(window.AdminApp);

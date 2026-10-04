(function registerDeliveryModal(app) {
  const { $, $$ } = app.dom;
  const { escapeHtml } = app.utils;

  app.DeliveryModal = class DeliveryModal {
    constructor({ data, options, toast, confirm, onSave }) {
      this.deliveries = data;
      this.options = options;
      this.toast = toast;
      this.confirm = confirm;
      this.onSave = onSave;
      this.state = { editingId: null, selectedType: null, selectedSecond: 0, selectedThird: 0 };
      this.els = {
        createMask: $("#createMask"),
        modalTitle: $("#deliveryModalTitle"),
        nameInput: $("#deliveryNameInput"),
        cascader: $("#deliveryCascader"),
        value: $("#deliveryValue"),
        secondCol: $("#secondCol"),
        thirdCol: $("#thirdCol"),
        boxes: { coupon: $("#couponBox"), bonus: $("#bonusBox"), points: $("#pointsBox") },
        method: $("#deliveryMethod"),
        autoSection: $("#autoSection"),
        manualSection: $("#manualSection"),
        eventSelect: $("#eventSelect"),
        paramLabel: $("#paramLabel"),
        probabilityInput: $("#probabilityInput"),
        pointValueLabel: $("#pointValueLabel")
      };
    }

    init() {
      $$(".close-create, .modal-head .close").forEach(button => button.addEventListener("click", () => this.close()));
      this.els.value.addEventListener("focus", () => this.els.cascader.classList.add("open"));
      this.els.value.addEventListener("click", () => this.els.cascader.classList.add("open"));
      this.els.cascader.addEventListener("click", event => this.handleCascaderClick(event));
      this.els.createMask.addEventListener("click", event => {
        if (event.target === this.els.createMask) this.close();
        if (!this.els.cascader.contains(event.target)) this.els.cascader.classList.remove("open");
      });
      this.els.eventSelect.addEventListener("change", () => this.syncEventParam());
      this.els.method.addEventListener("change", () => this.syncDeliveryMethod());
      $("#confirmDeliveryBtn").addEventListener("click", () => this.confirmDelivery());
      $("#importUsersBtn").addEventListener("click", () => {
        $("#manualUserIds").value = "870206426, 983850083, 762300118";
        this.toast.show("已模拟批量导入");
      });
      $("#exportTemplateBtn").addEventListener("click", () => this.toast.show("模板已模拟导出"));
      $("#clearUsersBtn").addEventListener("click", () => {
        $("#manualUserIds").value = "";
        this.toast.show("UserID 已清空");
      });
      this.syncDeliveryMethod();
    }

    renderCascader(type, secondIndex = 0, thirdIndex = 0) {
      const config = this.options[type];
      this.state.selectedType = type;
      this.state.selectedSecond = secondIndex;
      this.state.selectedThird = thirdIndex;
      this.els.secondCol.innerHTML = config.second.map((item, index) => `<button class="cascader-item${index === secondIndex ? " active" : ""}" type="button" data-second="${index}">${item}</button>`).join("");
      this.els.thirdCol.innerHTML = config.third.map((item, index) => `<button class="cascader-item${index === thirdIndex ? " active" : ""}" type="button" data-third="${index}">${item}</button>`).join("");
      this.els.thirdCol.hidden = config.third.length === 0;
      this.els.cascader.classList.toggle("two-col", config.third.length === 0);
      const thirdText = config.third.length ? ` / ${config.third[thirdIndex]}` : "";
      this.els.value.value = `${config.text} / ${config.second[secondIndex]}${thirdText}`;
      Object.values(this.els.boxes).forEach(box => box.hidden = true);
      this.els.boxes[type].hidden = false;
      if (type === "points") this.els.pointValueLabel.textContent = config.second[secondIndex];
    }

    resetSelection() {
      this.state.selectedType = null;
      this.els.value.value = "";
      this.els.secondCol.innerHTML = "";
      this.els.thirdCol.innerHTML = "";
      this.els.thirdCol.hidden = false;
      this.els.cascader.classList.remove("open", "two-col");
      $$("[data-type]", this.els.cascader).forEach(button => button.classList.remove("active"));
      Object.values(this.els.boxes).forEach(box => box.hidden = true);
    }

    open(mode, item) {
      this.state.editingId = mode === "edit" ? item?.id : null;
      this.els.modalTitle.textContent = mode === "edit" ? "修改投递" : "新建投递";
      this.els.nameInput.value = item?.name || "积分大转盘投递";
      this.resetSelection();
      if (item?.key) {
        const typeButton = $(`[data-type="${item.key}"]`, this.els.cascader);
        typeButton?.classList.add("active");
        this.renderCascader(item.key);
      }
      this.els.method.value = item?.method || "自动";
      $("#deliveryStartInput").value = item?.start ? `${item.start}:00` : "2026-09-01 00:00:00";
      $("#deliveryEndInput").value = item?.end ? `${item.end}:00` : "2026-09-30 00:00:00";
      this.syncDeliveryMethod();
      this.els.createMask.classList.add("show");
    }

    close() {
      this.els.createMask.classList.remove("show");
      this.state.editingId = null;
    }

    selectedObject() {
      if (!this.state.selectedType) return { object: "积分-XP", objectDetail: "积分 -> XP", key: "points" };
      const config = this.options[this.state.selectedType];
      const second = config.second[this.state.selectedSecond];
      const third = config.third[this.state.selectedThird];
      return {
        key: this.state.selectedType,
        object: this.state.selectedType === "coupon" ? `${second}-${third}` : `${config.text}-${second}`,
        objectDetail: `${config.text} -> ${second}${third ? ` -> ${third}` : ""}`
      };
    }

    confirmDelivery() {
      const selected = this.selectedObject();
      const method = this.els.method.value;
      const count = selected.key === "bonus" ? ($("#bonusCountInput").value || "25") : selected.key === "points" ? ($("#pointCountInput").value || "1") : "0";
      const probability = selected.key === "bonus" ? ($("#bonusProbInput").value || "15%") : ($("#probabilityInput").value || "30%");
      const amount = selected.key === "bonus" ? ($("#bonusAmountInput").value || "100") : ($("#pointAmountInput").value || "100");
      const itemData = {
        ...selected,
        name: this.els.nameInput.value.trim() || "未命名投递",
        method,
        count,
        status: "未启用",
        start: $("#deliveryStartInput").value.replace(":00", ""),
        end: $("#deliveryEndInput").value.replace(":00", ""),
        event: method === "自动" ? this.els.eventSelect.value : "手动投递",
        param: selected.key === "bonus"
          ? `<span class="pill gold">金额：${escapeHtml(amount)}</span><span class="pill gold">发放数量（份）：${escapeHtml(count)}</span><span class="pill gold">中奖概率：${escapeHtml(probability)}</span>`
          : selected.key === "points"
            ? `<span class="pill blue">${escapeHtml(this.els.pointValueLabel.textContent)}：${escapeHtml(amount)}</span><span class="pill blue">发放数量（份）：${escapeHtml(count)}</span><span class="pill blue">中奖概率：${escapeHtml(probability)}</span>`
            : `<span class="pill">指定用户：${escapeHtml($("#manualUserIds").value || "870206426")}</span>`,
        operator: "Bella"
      };
      this.confirm.ask("确认投递", `将保存投递任务“${itemData.name}”。`, () => {
        const wasEditing = Boolean(this.state.editingId);
        this.onSave(itemData, this.state.editingId);
        this.close();
        this.toast.show(wasEditing ? "投递已修改" : "投递已新增");
      });
    }

    handleCascaderClick(event) {
      const item = event.target.closest(".cascader-item");
      if (!item) return;
      if (item.dataset.type) {
        $$("[data-type]", this.els.cascader).forEach(button => button.classList.remove("active"));
        item.classList.add("active");
        this.renderCascader(item.dataset.type);
      }
      if (item.dataset.second) {
        const activeType = $("[data-type].active", this.els.cascader)?.dataset.type;
        if (!activeType) return;
        this.renderCascader(activeType, Number(item.dataset.second), 0);
        if (this.options[activeType].third.length === 0) this.els.cascader.classList.remove("open");
      }
      if (item.dataset.third) {
        const activeType = $("[data-type].active", this.els.cascader)?.dataset.type;
        const secondIndex = Number($(".active", this.els.secondCol)?.dataset.second || 0);
        this.renderCascader(activeType, secondIndex, Number(item.dataset.third));
        this.els.cascader.classList.remove("open");
      }
    }

    syncEventParam() {
      const wheel = this.els.eventSelect.value === "大转盘";
      this.els.paramLabel.textContent = wheel ? "中奖概率" : "事件参数";
      this.els.probabilityInput.value = wheel ? "30%" : "";
      this.els.probabilityInput.placeholder = wheel ? "请输入中奖概率" : "请输入事件参数";
    }

    syncDeliveryMethod() {
      const auto = this.els.method.value === "自动";
      this.els.autoSection.hidden = !auto;
      this.els.manualSection.hidden = auto;
    }
  };
})(window.AdminApp);

(function registerRuleModal(app) {
  const { $ } = app.dom;

  app.RuleModal = class RuleModal {
    constructor({ state, toast, confirm, onSave }) {
      this.state = state;
      this.toast = toast;
      this.confirm = confirm;
      this.onSave = onSave;
      this.els = {
        overlay: $("#ruleOverlay"),
        title: $("#modal-title"),
        internalName: $("#internalName"),
        taskType: $("#taskType"),
        rewardXp: $("#rewardXp"),
        rewardDrop: $("#rewardDrop"),
        triggerEvent: $("#triggerEvent"),
        eventParam: $("#eventParam"),
        accountType: $("#accountType"),
        jumpType: $("#jumpType"),
        jumpTargetField: $("#jumpTargetField"),
        jumpTarget: $("#jumpTarget"),
        mediaMode: $("#mediaMode"),
        uploadField: $("#uploadField"),
        uploadBox: $("#uploadBox"),
        languageTabs: $("#languageTabs"),
        externalName: $("#externalName"),
        ruleDesc: $("#ruleDesc"),
        popupText: $("#popupText"),
        cycleCount: $("#cycleCount"),
        cyclePeriod: $("#cyclePeriod"),
        triggerDatesField: $("#triggerDatesField"),
        startTime: $("#startTime"),
        endTime: $("#endTime")
      };
    }

    init() {
      $("#closeModalBtn").addEventListener("click", () => this.close());
      $("#cancelBtn").addEventListener("click", () => this.close());
      $("#saveBtn").addEventListener("click", () => this.save());
      this.els.triggerEvent.addEventListener("change", () => this.syncTriggerDefaults());
      this.els.jumpType.addEventListener("change", () => this.syncJumpType());
      this.els.mediaMode.addEventListener("change", () => this.syncMediaMode());
      this.els.uploadBox.addEventListener("click", () => {
        this.els.uploadBox.textContent = "已选择：task-guide-video.mp4";
        this.toast.show("附件已模拟上传");
      });
      this.els.cyclePeriod.addEventListener("change", () => this.syncCyclePeriod());
      this.els.rewardXp.addEventListener("input", () => this.clearRewardError());
      this.els.rewardDrop.addEventListener("input", () => this.clearRewardError());
      this.els.overlay.addEventListener("click", event => {
        if (event.target === this.els.overlay) this.close();
      });
      this.els.languageTabs.addEventListener("click", event => this.handleLanguageClick(event));
    }

    clearRewardError() {
      this.els.rewardXp.closest(".field").classList.remove("error");
    }

    syncTriggerDefaults() {
      const event = this.els.triggerEvent.value;
      const options = event === "开仓"
        ? ["交易账号类型 (必选)", "≥交易量"]
        : event === "连续签到"
          ? ["签到天数", "是否首次连续签到"]
          : ["完成状态"];
      this.els.eventParam.innerHTML = options.map(option => `<option>${option}</option>`).join("");
      this.els.accountType.closest(".field").classList.toggle("hidden-field", event !== "开仓");
      if (event === "开仓" && !this.els.rewardDrop.value) this.els.rewardDrop.value = "100";
      if (event !== "开仓" && !this.els.rewardXp.value) this.els.rewardXp.value = event === "连续签到" ? "33" : "150";
    }

    syncJumpType() {
      this.els.jumpTargetField.classList.toggle("hidden-field", this.els.jumpType.value === "无跳转");
      this.els.jumpTarget.placeholder = this.els.jumpType.value === "外部链接" ? "https://example.com" : "/task/detail";
    }

    syncMediaMode() {
      this.els.uploadField.classList.toggle("hidden-field", !this.els.mediaMode.checked);
    }

    syncCyclePeriod() {
      this.els.triggerDatesField.classList.toggle("hidden-field", this.els.cyclePeriod.value === "不限");
    }

    renderLanguageTabs() {
      const normalTabs = this.state.languages.map(lang => `
        <span class="tab ${lang === this.state.activeLang ? "active" : ""}" data-lang="${lang}">
          ${lang}${lang !== "英语" ? '<button data-remove-lang="' + lang + '">×</button>' : ""}
        </span>
      `).join("");
      this.els.languageTabs.innerHTML = `${normalTabs}<span class="tab" id="addLangBtn">+ 添加语言</span>`;
    }

    handleLanguageClick(event) {
      const remove = event.target.closest("[data-remove-lang]");
      const tab = event.target.closest("[data-lang]");
      if (event.target.id === "addLangBtn") {
        const next = this.state.languages.includes("繁体中文") ? "简体中文" : "繁体中文";
        if (!this.state.languages.includes(next)) this.state.languages.push(next);
        this.state.activeLang = next;
        this.els.externalName.value = "";
        this.renderLanguageTabs();
        this.toast.show(`已添加${next}`);
      } else if (remove) {
        this.state.languages = this.state.languages.filter(lang => lang !== remove.dataset.removeLang);
        this.state.activeLang = "英语";
        this.renderLanguageTabs();
      } else if (tab) {
        this.state.activeLang = tab.dataset.lang;
        this.renderLanguageTabs();
      }
    }

    open(mode, rule) {
      this.state.editingId = mode === "edit" ? rule?.id : null;
      this.state.languages = ["英语"];
      this.state.activeLang = "英语";
      this.els.title.textContent = mode === "edit" ? "修改规则" : mode === "copy" ? "复制规则" : "新增规则";
      this.els.internalName.value = rule?.internalName ? (mode === "copy" ? `${rule.internalName}-副本` : rule.internalName) : "";
      this.els.taskType.value = rule?.taskType || "请选择任务类型";
      this.els.rewardXp.value = rule?.rewardXp || "";
      this.els.rewardDrop.value = rule?.rewardDrop || "";
      this.els.triggerEvent.value = rule?.triggerEvent === "首次连续签到" ? "连续签到" : (rule?.triggerEvent || "开仓");
      this.els.accountType.value = "统一交易帐户";
      this.els.jumpType.value = "无跳转";
      this.els.jumpTarget.value = "";
      this.els.mediaMode.checked = false;
      this.els.uploadBox.textContent = "点击模拟上传图片或视频";
      this.els.externalName.value = rule?.externalName?.replace(/^英语:\s*/, "") || "";
      this.els.ruleDesc.value = rule ? `${rule.internalName}任务规则说明` : "";
      this.els.popupText.value = "";
      this.els.cycleCount.value = "循环";
      this.els.cyclePeriod.value = rule?.cyclePeriod || "不限";
      this.els.startTime.value = "";
      this.els.endTime.value = "";
      this.clearRewardError();
      this.renderLanguageTabs();
      this.syncTriggerDefaults();
      this.syncJumpType();
      this.syncMediaMode();
      this.syncCyclePeriod();
      this.els.overlay.classList.remove("hidden");
    }

    close() {
      this.els.overlay.classList.add("hidden");
      this.state.editingId = null;
    }

    collectForm() {
      return {
        internalName: this.els.internalName.value.trim() || "未命名规则",
        externalName: `${this.state.activeLang}: ${this.els.externalName.value.trim() || this.els.internalName.value.trim() || "未命名规则"}`,
        triggerEvent: this.els.triggerEvent.value === "连续签到" ? "首次连续签到" : this.els.triggerEvent.value,
        cyclePeriod: this.els.cyclePeriod.value,
        rewardXp: Number(this.els.rewardXp.value || 0),
        rewardDrop: Number(this.els.rewardDrop.value || 0),
        taskType: this.els.taskType.value === "请选择任务类型" ? "全部" : this.els.taskType.value,
        timeRange: this.els.startTime.value || this.els.endTime.value ? `${this.els.startTime.value || "-"} 至 ${this.els.endTime.value || "-"}` : "-"
      };
    }

    save() {
      const data = this.collectForm();
      if (data.rewardXp <= 0 && data.rewardDrop <= 0) {
        this.els.rewardXp.closest(".field").classList.add("error");
        this.toast.show("XP 和 Drop 至少填写一个奖励值");
        return;
      }
      this.confirm.ask("确认保存", `将保存规则“${data.internalName}”，奖励为 ${data.rewardXp || 0} XP / ${data.rewardDrop || 0} Drop。`, () => {
        this.onSave(data, this.state.editingId, this.els.title.textContent);
        this.close();
      });
    }
  };
})(window.AdminApp);

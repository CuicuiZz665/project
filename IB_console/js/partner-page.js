(function registerPartnerPage(app) {
  const e = React.createElement;
  const useSyncExternalStore = React.useSyncExternalStore;

  /* ---------------------------------------------------------------
     合伙人列表页共享状态（一页两区）：
     · plans  分佣比例（一行 = 一个比例 + 专属邀请码）
     · people 直客与子代理全员（直客与直客明细页同源，同 UID）
     两层比例：链接注册时复制分佣比例作为个人固定比例，
     之后仅能通过「修改固定返佣比例」按人调整（rateOverridden）。
  --------------------------------------------------------------- */

  let idSeed = 0;

  function nextId(prefix) {
    idSeed += 1;
    return `${prefix}-${Date.now().toString(36)}-${idSeed}`;
  }

  function makeInviteCode() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  function parseRatioNumber(raw) {
    // 兼容把半角/全角逗号当小数点的输入（22,22 / 22，22 → 22.22）
    return Number(String(raw).replace(/[,，]/g, "."));
  }

  function normalizeRatio(value) {
    // 比例直接按百分比数字填写（11.111 → 11），空值按 0 处理
    const raw = String(value == null ? "" : value).trim();
    if (raw === "") return "0";
    const num = parseRatioNumber(raw);
    if (!Number.isFinite(num)) return raw;
    return String(Math.round(Math.min(100, Math.max(0, num))));
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
    } catch (error) {
      /* 原型环境剪贴板不可用时忽略 */
    }
  }

  // 抽屉汇总：把 "12,480.00" 之类字符串求和后按千分位输出
  function sumOf(rows, key) {
    const total = rows.reduce((sum, row) => {
      const num = Number(String(row[key] == null ? "" : row[key]).replace(/,/g, ""));
      return sum + (Number.isFinite(num) ? num : 0);
    }, 0);
    return total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // 某分佣比例当前绑定的成员（人数口径 = 当前绑定；解除后自动减员）
  function planMembers(people, plan) {
    return people.filter(person => person.type === "agent" && person.code === plan.code);
  }

  function createStore() {
    const peopleConfig = app.mockData.partnerPeople;
    // 按注册时间倒序，最新成员在前
    const sortedPeople = []
      .concat(peopleConfig.rows.map(row => Object.assign({}, row)))
      .concat(peopleConfig.directRows.map(row => Object.assign({}, row)))
      .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));
    let state = {
      plans: app.mockData.partnerPlans.rows.map(row => Object.assign({}, row)),
      people: sortedPeople,
      // 直客明细页兼容：被「设为合伙人」的直客 UID，该页据此过滤显示
      convertedUids: {},
      planModal: { open: false },
      successPlan: null,
      convertTarget: null,
      rateTarget: null,
      cancelTarget: null,
      voidTarget: null,
      drawerPlanId: null
    };
    const listeners = new Set();
    const emit = () => listeners.forEach(fn => fn());
    const update = patch => {
      state = Object.assign({}, state, patch);
      emit();
    };
    const findPerson = id => state.people.find(person => person.id === id);
    return {
      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      getSnapshot: () => state,
      openCreate() {
        update({ planModal: { open: true } });
      },
      closePlan() {
        update({ planModal: { open: false } });
      },
      // 新建分佣比例 → 「添加成功」完成态（新建默认「正常」）
      submitPlan(data) {
        const plan = Object.assign({ id: nextId("plan"), code: makeInviteCode(), status: "active" }, data);
        update({
          plans: [plan].concat(state.plans),
          planModal: { open: false },
          successPlan: plan
        });
        return plan;
      },
      closeSuccess() {
        update({ successPlan: null });
      },
      openConvert(id) {
        const person = findPerson(id);
        if (person) update({ convertTarget: Object.assign({}, person) });
      },
      closeConvert() {
        update({ convertTarget: null });
      },
      // 直客 → 子代理：独立设置固定比例（不生成邀请码）；同步标记 UID 供直客明细页过滤
      confirmConvert(id, ratio) {
        const person = findPerson(id);
        if (!person) return;
        update({
          people: state.people.map(item => (item.id === id
            ? Object.assign({}, item, { type: "agent", rate: ratio, rateOverridden: false })
            : item)),
          convertedUids: Object.assign({}, state.convertedUids, { [person.uid]: true }),
          convertTarget: null
        });
      },
      openRate(id) {
        const person = findPerson(id);
        if (person) update({ rateTarget: Object.assign({}, person) });
      },
      closeRate() {
        update({ rateTarget: null });
      },
      confirmRate(id, ratio) {
        update({
          people: state.people.map(item => (item.id === id
            ? Object.assign({}, item, { rate: ratio, rateOverridden: true })
            : item)),
          rateTarget: null
        });
      },
      openCancel(id) {
        const person = findPerson(id);
        if (person) update({ cancelTarget: Object.assign({}, person) });
      },
      closeCancel() {
        update({ cancelTarget: null });
      },
      // 解除：固定比例失效，降回直客（下表类型变直客；原直客转化的会重新出现在直客明细）
      confirmCancel(id) {
        const person = findPerson(id);
        if (!person) return;
        const nextConverted = Object.assign({}, state.convertedUids);
        delete nextConverted[person.uid];
        update({
          people: state.people.map(item => (item.id === id
            ? Object.assign({}, item, { type: "direct", code: null, rate: null, rateOverridden: false })
            : item)),
          convertedUids: nextConverted,
          cancelTarget: null
        });
      },
      openDrawer(planId) {
        update({ drawerPlanId: planId });
      },
      closeDrawer() {
        update({ drawerPlanId: null });
      },
      openVoid(planId) {
        const plan = state.plans.find(item => item.id === planId);
        if (plan) update({ voidTarget: Object.assign({}, plan) });
      },
      closeVoid() {
        update({ voidTarget: null });
      },
      // 作废：比例立即失效（成员注册时已复制的固定比例不受影响）
      confirmVoid(planId) {
        update({
          plans: state.plans.map(item => (item.id === planId
            ? Object.assign({}, item, { status: "invalid" })
            : item)),
          voidTarget: null
        });
      }
    };
  }

  const partnerStore = createStore();
  app.partnerStore = partnerStore;

  /* ---------------------------------------------------------------
     通用小件
  --------------------------------------------------------------- */

  function useOverlayBehavior(onClose) {
    React.useEffect(() => {
      const onKey = event => {
        if (event.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);
    React.useEffect(() => {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }, []);
  }

  function PlusIcon() {
    return e("svg", { className: "ib-plus-icon", viewBox: "0 0 12 12", fill: "none" },
      e("path", { d: "M6 1.5v9M1.5 6h9", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }));
  }

  function SearchIcon() {
    return e("svg", { className: "ib-search-icon", viewBox: "0 0 16 16", fill: "none" }, [
      e("circle", { key: "c", cx: "7", cy: "7", r: "4.4", stroke: "currentColor", strokeWidth: "1.3" }),
      e("path", { key: "l", d: "M10.4 10.4L14 14", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })
    ]);
  }

  function RatioInput({ value, error, placeholder, autoFocus, onChange, onBlur, onKeyDown }) {
    return e("span", { className: "ib-pf-input-wrap" }, [
      e("input", {
        className: `ib-pf-input${error ? " has-error" : ""}`,
        key: "input",
        type: "text",
        inputMode: "decimal",
        value: value,
        placeholder: placeholder,
        autoFocus: autoFocus,
        onChange: onChange,
        onBlur: onBlur,
        onKeyDown: onKeyDown
      }),
      e("span", { className: "ib-pf-unit", key: "unit" }, "%")
    ]);
  }

  /* ---------------------------------------------------------------
     弹窗 A：添加分佣比例（上区专用）
  --------------------------------------------------------------- */

  function validateForm(formConfig, values) {
    const errors = {};
    formConfig.fields.forEach(field => {
      const raw = String(values[field.key] == null ? "" : values[field.key]).trim();
      if (field.required && raw === "") {
        errors[field.key] = `请填写${field.label}`;
        return;
      }
      if (field.ratio && raw !== "") {
        const num = parseRatioNumber(raw);
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          errors[field.key] = formConfig.ratioRangeHint;
        }
      }
    });
    return errors;
  }

  function PlanForm({ formConfig }) {
    const [values, setValues] = React.useState(() => {
      const initial = {};
      formConfig.fields.forEach(field => {
        initial[field.key] = "";
      });
      return initial;
    });
    const [errors, setErrors] = React.useState({});
    const [expanded, setExpanded] = React.useState(false);
    useOverlayBehavior(partnerStore.closePlan);

    const setValue = (key, value) => {
      setValues(prev => Object.assign({}, prev, { [key]: value }));
      setErrors(prev => (prev[key] ? Object.assign({}, prev, { [key]: undefined }) : prev));
    };

    const handleSave = () => {
      const nextErrors = validateForm(formConfig, values);
      const hasError = Object.keys(nextErrors).some(key => nextErrors[key]);
      if (hasError) {
        setErrors(nextErrors);
        // 折叠区内有错误时自动展开，保证错误可见
        const hiddenKeys = new Set(formConfig.fields.filter(field => field.collapsed).map(field => field.key));
        if (Object.keys(nextErrors).some(key => nextErrors[key] && hiddenKeys.has(key))) {
          setExpanded(true);
        }
        return;
      }
      const data = {};
      formConfig.fields.forEach(field => {
        if (field.readOnly) return;
        const raw = String(values[field.key] == null ? "" : values[field.key]).trim();
        data[field.key] = field.ratio ? normalizeRatio(raw) : raw;
      });
      partnerStore.submitPlan(data);
    };

    const renderField = (field, index) => {
      const readOnly = !!field.readOnly;
      const input = e("input", {
        className: `ib-pf-input${errors[field.key] ? " has-error" : ""}${readOnly ? " is-readonly" : ""}${field.date ? " is-date" : ""}`,
        key: "input",
        type: field.date ? "date" : "text",
        inputMode: field.ratio ? "decimal" : "text",
        value: values[field.key],
        placeholder: field.placeholder,
        readOnly: readOnly,
        autoFocus: index === 0,
        onChange: event => setValue(field.key, event.target.value),
        // 失焦即按百分比四舍五入展示：22.22 → 22、23.99 → 24
        onBlur: field.ratio && !readOnly
          ? () => {
              const raw = String(values[field.key] == null ? "" : values[field.key]).trim();
              if (raw === "") return;
              const num = parseRatioNumber(raw);
              // 非法或超出 0~100 的输入保持原样，交由保存时校验报错
              if (!Number.isFinite(num) || num < 0 || num > 100) return;
              setValue(field.key, String(Math.round(num)));
            }
          : undefined,
        onKeyDown: event => {
          if (event.key === "Enter") handleSave();
        }
      });
      return e("div", {
        className: "ib-pf-field",
        style: { gridColumn: `span ${field.span}` },
        key: field.key
      }, [
        e("label", { className: "ib-pf-label", key: "label" }, [
          field.label,
          field.required
            ? e("span", { className: "ib-pf-required", key: "star" }, "*")
            : null,
          field.optionalTag
            ? e("span", { className: "ib-pf-optional-tag", key: "tag" }, `（${field.optionalTag}）`)
            : null
        ]),
        field.ratio
          ? e(RatioInput, {
              key: "ratio",
              value: values[field.key],
              error: errors[field.key],
              placeholder: field.placeholder,
              autoFocus: index === 0,
              onChange: event => setValue(field.key, event.target.value),
              // 失焦即按百分比四舍五入展示：22.22 → 22、23.99 → 24
              onBlur: () => {
                const raw = String(values[field.key] == null ? "" : values[field.key]).trim();
                if (raw === "") return;
                const num = parseRatioNumber(raw);
                // 非法或超出 0~100 的输入保持原样，交由保存时校验报错
                if (!Number.isFinite(num) || num < 0 || num > 100) return;
                setValue(field.key, String(Math.round(num)));
              },
              onKeyDown: event => {
                if (event.key === "Enter") handleSave();
              }
            })
          : input,
        errors[field.key]
          ? e("span", { className: "ib-pf-error", key: "error" }, errors[field.key])
          : null
      ]);
    };

    const mainFields = formConfig.fields.filter(field => !field.collapsed);
    const hiddenFields = formConfig.fields.filter(field => field.collapsed);

    return e("div", {
      className: "ib-partner-overlay",
      onClick: event => {
        if (event.target === event.currentTarget) partnerStore.closePlan();
      }
    },
      e("div", { className: "ib-partner-modal", role: "dialog", "aria-modal": "true" }, [
        e("div", { className: "ib-partner-modal-head", key: "head" }, [
          e("span", { className: "ib-partner-modal-title", key: "title" }, formConfig.createTitle),
          e("button", {
            className: "ib-partner-modal-close",
            type: "button",
            key: "close",
            "aria-label": "关闭",
            onClick: partnerStore.closePlan
          }, "✕")
        ]),
        e("div", { className: "ib-partner-modal-body", key: "body" }, [
          e("div", { className: "ib-pf-grid", key: "main" },
            mainFields.map((field, index) => renderField(field, index))),
          e("button", {
            className: `ib-pf-collapse${expanded ? " is-open" : ""}`,
            type: "button",
            key: "collapse",
            onClick: () => setExpanded(prev => !prev)
          }, [
            expanded ? formConfig.collapseLabelOpen : formConfig.collapseLabel,
            e("span", { className: "ib-pf-collapse-caret", key: "caret" }, "▾")
          ]),
          expanded
            ? e("div", { className: "ib-pf-more", key: "more" }, [
                e("div", { className: "ib-pf-notice", key: "notice" }, formConfig.collapseHint),
                e("div", { className: "ib-pf-grid", key: "grid" },
                  hiddenFields.map((field, index) => renderField(field, index + mainFields.length)))
              ])
            : null
        ]),
        e("div", { className: "ib-partner-modal-foot", key: "foot" }, [
          e("button", {
            className: "ib-btn-cancel",
            type: "button",
            key: "cancel",
            onClick: partnerStore.closePlan
          }, formConfig.cancelLabel),
          e("button", {
            className: "ib-btn-primary",
            type: "button",
            key: "save",
            onClick: handleSave
          }, formConfig.saveLabel)
        ])
      ]));
  }

  /* ---------------------------------------------------------------
     弹窗 B：添加成功完成态（仅新建分佣比例；展示专属邀请链接）
  --------------------------------------------------------------- */

  function SuccessView({ plan, formConfig }) {
    // 记录最近复制的链接 key（web / miniapp），两条各自独立变绿
    const [copiedKey, setCopiedKey] = React.useState(null);
    useOverlayBehavior(partnerStore.closeSuccess);

    const copyInviteLink = link => {
      copyText(`${link.baseUrl}${plan.code}`);
      setCopiedKey(link.key);
      window.setTimeout(() => setCopiedKey(prev => (prev === link.key ? null : prev)), 1500);
    };

    const line = formConfig.success.line
      .replace("{name}", plan.name)
      .replace("{contract}", plan.contract)
      .replace("{expire}", plan.expireAt || "永久")
      .replace("{code}", plan.code);

    return e("div", {
      className: "ib-partner-overlay",
      onClick: event => {
        if (event.target === event.currentTarget) partnerStore.closeSuccess();
      }
    },
      e("div", { className: "ib-partner-modal ib-partner-modal-success", role: "dialog", "aria-modal": "true" }, [
        e("div", { className: "ib-partner-modal-head ib-ps-head", key: "head" },
          e("button", {
            className: "ib-partner-modal-close",
            type: "button",
            key: "close",
            "aria-label": "关闭",
            onClick: partnerStore.closeSuccess
          }, "✕")),
        e("div", { className: "ib-ps-body", key: "body" }, [
          e("div", { className: "ib-ps-check", key: "check" },
            e("svg", { className: "ib-ps-check-svg", viewBox: "0 0 52 52" }, [
              e("circle", {
                key: "ring",
                cx: "26", cy: "26", r: "24",
                fill: "#1A3A1A",
                stroke: "rgba(76, 175, 80, 0.45)",
                strokeWidth: "1.5"
              }),
              e("path", {
                key: "tick",
                d: "M15.5 27l7.5 7.5L37 20.5",
                fill: "none",
                stroke: "#4CAF50",
                strokeWidth: "3.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              })
            ])),
          e("div", { className: "ib-ps-title", key: "title" }, formConfig.success.title),
          e("div", { className: "ib-ps-line", key: "line" }, [
            e("strong", { key: "name" }, `「${plan.name}」`),
            e("span", { key: "rest" }, line.replace(`「${plan.name}」`, ""))
          ]),
          e("div", { className: "ib-ps-links", key: "links" },
            formConfig.inviteLinks.map(link => {
              const copied = copiedKey === link.key;
              return e("div", { className: "ib-ps-link", key: link.key }, [
                e("span", { className: "ib-ps-link-label", key: "label" }, link.label),
                e("span", { className: "ib-ps-link-value ib-num", key: "value" }, `${link.baseUrl}${plan.code}`),
                e("button", {
                  className: `ib-ps-copy${copied ? " is-copied" : ""}`,
                  type: "button",
                  key: "copy",
                  onClick: () => copyInviteLink(link)
                }, copied ? formConfig.success.copiedLabel : formConfig.success.copyLabel)
              ]);
            })),
          e("p", { className: "ib-ps-hint", key: "hint" }, formConfig.success.hint)
        ]),
        e("div", { className: "ib-partner-modal-foot ib-ps-foot", key: "foot" },
          e("button", {
            className: "ib-btn-primary",
            type: "button",
            key: "done",
            onClick: partnerStore.closeSuccess
          }, formConfig.success.doneLabel))
      ]));
  }

  // 外壳挂载：添加/编辑弹窗与成功完成态（全局唯一实例）
  function PartnerModal() {
    const state = useSyncExternalStore(partnerStore.subscribe, partnerStore.getSnapshot);
    if (state.successPlan) {
      return e(SuccessView, { key: "success", plan: state.successPlan, formConfig: app.mockData.partnerForm });
    }
    if (!state.planModal.open) return null;
    return e(PlanForm, { key: "plan-create", formConfig: app.mockData.partnerForm });
  }

  /* ---------------------------------------------------------------
     弹窗 C：设为合伙人（直客 → 子代理，独立比例，不生成邀请码）
  --------------------------------------------------------------- */

  function ConvertModal({ person, config }) {
    const [ratio, setRatio] = React.useState("");
    const [error, setError] = React.useState(null);
    useOverlayBehavior(partnerStore.closeConvert);

    const handleSave = () => {
      const raw = ratio.trim();
      if (raw === "") {
        setError(config.requiredHint);
        return;
      }
      const num = parseRatioNumber(raw);
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        setError(config.ratioRangeHint);
        return;
      }
      partnerStore.confirmConvert(person.id, normalizeRatio(raw));
    };

    return e("div", {
      className: "ib-partner-overlay",
      onClick: event => {
        if (event.target === event.currentTarget) partnerStore.closeConvert();
      }
    },
      e("div", { className: "ib-partner-modal ib-mini-modal", role: "dialog", "aria-modal": "true" }, [
        e("div", { className: "ib-partner-modal-head", key: "head" }, [
          e("span", { className: "ib-partner-modal-title", key: "title" }, config.title),
          e("button", {
            className: "ib-partner-modal-close",
            type: "button",
            key: "close",
            "aria-label": "关闭",
            onClick: partnerStore.closeConvert
          }, "✕")
        ]),
        e("div", { className: "ib-partner-modal-body", key: "body" }, [
          e("div", { className: "ib-pf-notice", key: "notice" }, config.notice),
          e("div", { className: "ib-pf-grid", key: "grid" }, [
            e("div", { className: "ib-pf-field", style: { gridColumn: "span 6" }, key: "name" }, [
              e("label", { className: "ib-pf-label", key: "label" }, config.nameLabel),
              e("input", {
                className: "ib-pf-input is-readonly",
                key: "input",
                type: "text",
                value: person.name,
                readOnly: true
              })
            ]),
            e("div", { className: "ib-pf-field", style: { gridColumn: "span 6" }, key: "ratio" }, [
              e("label", { className: "ib-pf-label", key: "label" }, [
                config.ratioLabel,
                e("span", { className: "ib-pf-required", key: "star" }, "*")
              ]),
              e(RatioInput, {
                key: "input",
                value: ratio,
                error: error,
                placeholder: config.ratioPlaceholder,
                autoFocus: true,
                onChange: event => {
                  setRatio(event.target.value);
                  setError(null);
                },
                onBlur: () => {
                  const raw = ratio.trim();
                  if (raw === "") return;
                  const num = parseRatioNumber(raw);
                  if (Number.isFinite(num) && num >= 0 && num <= 100) setRatio(String(Math.round(num)));
                },
                onKeyDown: event => {
                  if (event.key === "Enter") handleSave();
                }
              }),
              error
                ? e("span", { className: "ib-pf-error", key: "error" }, error)
                : null
            ])
          ])
        ]),
        e("div", { className: "ib-partner-modal-foot", key: "foot" }, [
          e("button", {
            className: "ib-btn-cancel",
            type: "button",
            key: "cancel",
            onClick: partnerStore.closeConvert
          }, config.cancelLabel),
          e("button", {
            className: "ib-btn-primary",
            type: "button",
            key: "save",
            onClick: handleSave
          }, config.saveLabel)
        ])
      ]));
  }

  /* ---------------------------------------------------------------
     弹窗 D：修改固定返佣比例（仅对该成员生效）
  --------------------------------------------------------------- */

  function RateModal({ person, config }) {
    const [ratio, setRatio] = React.useState("");
    const [error, setError] = React.useState(null);
    useOverlayBehavior(partnerStore.closeRate);

    const handleSave = () => {
      const raw = ratio.trim();
      if (raw === "") {
        setError(config.requiredHint);
        return;
      }
      const num = parseRatioNumber(raw);
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        setError(config.ratioRangeHint);
        return;
      }
      partnerStore.confirmRate(person.id, normalizeRatio(raw));
    };

    return e("div", {
      className: "ib-partner-overlay",
      onClick: event => {
        if (event.target === event.currentTarget) partnerStore.closeRate();
      }
    },
      e("div", { className: "ib-partner-modal ib-mini-modal", role: "dialog", "aria-modal": "true" }, [
        e("div", { className: "ib-partner-modal-head", key: "head" }, [
          e("span", { className: "ib-partner-modal-title", key: "title" }, config.title),
          e("button", {
            className: "ib-partner-modal-close",
            type: "button",
            key: "close",
            "aria-label": "关闭",
            onClick: partnerStore.closeRate
          }, "✕")
        ]),
        e("div", { className: "ib-partner-modal-body", key: "body" }, [
          e("div", { className: "ib-pf-notice", key: "notice" }, config.notice),
          e("div", { className: "ib-pf-grid", key: "grid" }, [
            e("div", { className: "ib-pf-field", style: { gridColumn: "span 6" }, key: "current" }, [
              e("label", { className: "ib-pf-label", key: "label" }, config.currentLabel),
              e("input", {
                className: "ib-pf-input is-readonly",
                key: "input",
                type: "text",
                value: `${person.rate}%`,
                readOnly: true
              })
            ]),
            e("div", { className: "ib-pf-field", style: { gridColumn: "span 6" }, key: "next" }, [
              e("label", { className: "ib-pf-label", key: "label" }, [
                config.newLabel,
                e("span", { className: "ib-pf-required", key: "star" }, "*")
              ]),
              e(RatioInput, {
                key: "input",
                value: ratio,
                error: error,
                placeholder: config.ratioPlaceholder,
                autoFocus: true,
                onChange: event => {
                  setRatio(event.target.value);
                  setError(null);
                },
                onBlur: () => {
                  const raw = ratio.trim();
                  if (raw === "") return;
                  const num = parseRatioNumber(raw);
                  if (Number.isFinite(num) && num >= 0 && num <= 100) setRatio(String(Math.round(num)));
                },
                onKeyDown: event => {
                  if (event.key === "Enter") handleSave();
                }
              }),
              error
                ? e("span", { className: "ib-pf-error", key: "error" }, error)
                : null
            ])
          ])
        ]),
        e("div", { className: "ib-partner-modal-foot", key: "foot" }, [
          e("button", {
            className: "ib-btn-cancel",
            type: "button",
            key: "cancel",
            onClick: partnerStore.closeRate
          }, config.cancelLabel),
          e("button", {
            className: "ib-btn-primary",
            type: "button",
            key: "save",
            onClick: handleSave
          }, config.saveLabel)
        ])
      ]));
  }

  /* ---------------------------------------------------------------
     弹窗 E：通用确认窗（解除固定分佣 / 作废分佣比例）
  --------------------------------------------------------------- */

  function ConfirmDialog({ labels, body, onCancel, onConfirm }) {
    useOverlayBehavior(onCancel);
    return e("div", {
      className: "ib-partner-overlay",
      onClick: event => {
        if (event.target === event.currentTarget) onCancel();
      }
    },
      e("div", { className: "ib-partner-modal ib-confirm-modal", role: "dialog", "aria-modal": "true" }, [
        e("div", { className: "ib-partner-modal-head", key: "head" }, [
          e("span", { className: "ib-partner-modal-title", key: "title" }, labels.title),
          e("button", {
            className: "ib-partner-modal-close",
            type: "button",
            key: "close",
            "aria-label": "关闭",
            onClick: onCancel
          }, "✕")
        ]),
        e("div", { className: "ib-confirm-body", key: "body" },
          e("p", { key: "text" }, body)),
        e("div", { className: "ib-partner-modal-foot", key: "foot" }, [
          e("button", {
            className: "ib-btn-cancel",
            type: "button",
            key: "cancel",
            onClick: onCancel
          }, labels.cancelLabel),
          e("button", {
            className: "ib-btn-primary",
            type: "button",
            key: "confirm",
            onClick: onConfirm
          }, labels.confirmLabel)
        ])
      ]));
  }

  /* ---------------------------------------------------------------
     抽屉：某邀请码的注册客户明细（人数口径 = 当前绑定）
  --------------------------------------------------------------- */

  function PeopleDrawer({ plan }) {
    const state = useSyncExternalStore(partnerStore.subscribe, partnerStore.getSnapshot);
    const config = app.mockData.partnerPeople.drawer;
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
    useOverlayBehavior(partnerStore.closeDrawer);

    const members = planMembers(state.people, plan);
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? members.filter(member =>
          ["name", "uid", "username"].some(prop => String(member[prop]).toLowerCase().includes(keyword)))
      : members;
    const totalPages = Math.max(1, Math.ceil(filtered.length / config.pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * config.pageSize, currentPage * config.pageSize);

    const pageButtons = [];
    for (let num = 1; num <= totalPages; num += 1) {
      pageButtons.push(e("button", {
        className: `ib-page-btn ib-num${num === currentPage ? " is-active" : ""}`,
        type: "button",
        key: num,
        onClick: () => setPage(num)
      }, num));
    }

    const statValues = {
      count: String(members.length),
      active: String(members.filter(member => member.status === "活跃").length),
      volume: sumOf(members, "volume"),
      rebate: sumOf(members, "rebate")
    };

    const numericKeys = new Set(config.columns.filter(col => col.numeric).map(col => col.key));

    const renderCell = (col, member) => {
      if (col.key === "status") {
        return e("span", { className: `ib-dc-status${member.status === "活跃" ? " is-active" : ""}` }, member.status);
      }
      if (col.key === "rate") {
        return [
          `${member.rate}%`,
          member.rateOverridden
            ? e("span", {
                className: "ib-rate-tag",
                key: "tag",
                title: config.adjustedTitle
              }, config.adjustedTag)
            : null
        ];
      }
      return member[col.key];
    };

    return e("div", {
      className: "ib-drawer-overlay",
      onClick: event => {
        if (event.target === event.currentTarget) partnerStore.closeDrawer();
      }
    },
      e("aside", { className: "ib-drawer", role: "dialog", "aria-modal": "true" }, [
        e("div", { className: "ib-drawer-head", key: "head" }, [
          e("div", { className: "ib-drawer-head-left", key: "left" }, [
            e("div", { className: "ib-drawer-title", key: "title" }, [
              `${config.titlePrefix} ${plan.code} ${config.titleSuffix}`,
              e("span", { className: "ib-drawer-count ib-num", key: "count" }, `${members.length} ${config.countUnit}`)
            ]),
            e("div", { className: "ib-drawer-sub", key: "sub" }, `「${plan.name}」· 合约分佣比例 ${plan.contract}% · ${plan.expireAt || "永久"}`)
          ]),
          e("button", {
            className: "ib-partner-modal-close",
            type: "button",
            key: "close",
            "aria-label": "关闭",
            onClick: partnerStore.closeDrawer
          }, "✕")
        ]),
        e("div", { className: "ib-drawer-stats", key: "stats" },
          config.stats.map(stat => e("div", { className: "ib-drawer-stat", key: stat.key }, [
            e("span", { className: "ib-drawer-stat-label", key: "label" }, stat.label),
            e("span", { className: "ib-drawer-stat-value ib-num", key: "value" }, statValues[stat.key])
          ]))),
        e("div", { className: "ib-drawer-body", key: "body" }, [
          e("div", { className: "ib-partner-toolbar ib-toolbar-end", key: "toolbar" },
            e("div", { className: "ib-search-input", key: "search" }, [
              e(SearchIcon, { key: "icon" }),
              e("input", {
                key: "input",
                type: "text",
                value: search,
                placeholder: config.searchPlaceholder,
                onChange: event => {
                  setSearch(event.target.value);
                  setPage(1);
                }
              }),
              search
                ? e("button", {
                    className: "ib-search-clear",
                    type: "button",
                    key: "clear",
                    "aria-label": "清空搜索",
                    onClick: () => {
                      setSearch("");
                      setPage(1);
                    }
                  }, "✕")
                : null
            ])),
          e("div", { className: "ib-partner-table-wrap", key: "table-wrap" },
            e("table", { className: "ib-partner-table is-drawer" }, [
              e("thead", { key: "head" },
                e("tr", null,
                  config.columns.map(col => e("th", {
                    key: col.key,
                    className: col.numeric ? "is-numeric" : null
                  }, col.label)))),
              e("tbody", { key: "body" },
                pageRows.length === 0
                  ? e("tr", { key: "empty" },
                      e("td", { className: "ib-partner-empty", colSpan: config.columns.length }, config.emptyText))
                  : pageRows.map(member => e("tr", { key: member.id },
                      config.columns.map(col => e("td", {
                        key: col.key,
                        className: numericKeys.has(col.key) ? "is-numeric ib-num" : null
                      }, renderCell(col, member))))))
            ])),
          e("div", { className: "ib-partner-foot", key: "foot" }, [
            e("span", { className: "ib-partner-total ib-num", key: "total" }, `共 ${filtered.length} 条`),
            e("div", { className: "ib-pager", key: "pager" }, [
              e("span", { className: "ib-page-size", key: "size" }, `${config.pageSize}条/页`),
              e("button", {
                className: "ib-page-btn",
                type: "button",
                key: "prev",
                disabled: currentPage <= 1,
                onClick: () => setPage(currentPage - 1)
              }, "‹"),
              pageButtons,
              e("button", {
                className: "ib-page-btn",
                type: "button",
                key: "next",
                disabled: currentPage >= totalPages,
                onClick: () => setPage(currentPage + 1)
              }, "›")
            ])
          ])
        ])
      ]));
  }

  /* ---------------------------------------------------------------
     上区：分佣比例列表
  --------------------------------------------------------------- */

  function PlanSection({ state }) {
    const config = app.mockData.partnerPlans;
    const inviteLinks = app.mockData.partnerForm.inviteLinks;
    const [copiedKey, setCopiedKey] = React.useState(null);
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");

    const copyCodeLink = (plan, link) => {
      copyText(`${link.baseUrl}${plan.code}`);
      setCopiedKey(`${plan.id}:${link.key}`);
      window.setTimeout(() => setCopiedKey(prev => (prev === `${plan.id}:${link.key}` ? null : prev)), 1200);
    };

    // 状态筛选（全部/正常/失效）与搜索叠加过滤；搜索框对 计划名称 / 合约分佣比例 / 地址（Web 与 Miniapp 两条）
    // 做模糊匹配（比例兼容带 % 输入）
    const keyword = search.trim().toLowerCase();
    const filtered = state.plans.filter(plan => {
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      if (!keyword) return true;
      const haystack = [
        plan.name,
        plan.code,
        String(plan.contract),
        `${plan.contract}%`
      ]
        .concat(inviteLinks.map(link => `${link.baseUrl}${plan.code}`))
        .concat(inviteLinks.map(link => `${link.shortHead}${plan.code}`))
        .join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
    const rows = filtered.map(plan =>
      Object.assign({}, plan, { memberCount: planMembers(state.people, plan).length }));
    const totalPages = Math.max(1, Math.ceil(rows.length / config.pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = rows.slice((currentPage - 1) * config.pageSize, currentPage * config.pageSize);

    const renderCell = (col, row) => {
      // 地址两列（web / miniapp）：列 key 与 inviteLinks[].key 对应；缩略前缀 + 邀请码完整露出，悬停显示完整链接，点击复制
      const linkConfig = inviteLinks.find(link => link.key === col.key);
      if (linkConfig) {
        const copied = copiedKey === `${row.id}:${linkConfig.key}`;
        return e("button", {
          className: `ib-code-copy ib-num${copied ? " is-copied" : ""}`,
          type: "button",
          title: `${linkConfig.baseUrl}${row.code}`,
          onClick: () => copyCodeLink(row, linkConfig)
        }, copied ? "已复制" : `${linkConfig.shortHead}${row.code}`);
      }
      if (col.key === "contract") {
        return `${row.contract}%`;
      }
      if (col.key === "expireAt") {
        return row.expireAt || config.permanentLabel;
      }
      if (col.key === "memberCount") {
        return e("button", {
          className: "ib-count-link ib-num",
          type: "button",
          title: config.countTitle,
          onClick: () => partnerStore.openDrawer(row.id)
        }, String(row.memberCount));
      }
      if (col.key === "status") {
        const invalid = row.status === "invalid";
        return e("span", { className: `ib-dc-status${invalid ? "" : " is-active"}` },
          config.statusLabels[invalid ? "invalid" : "active"]);
      }
      if (col.key === "op") {
        // 已失效的比例不可再作废，操作列显示 —
        return row.status === "invalid"
          ? e("span", { className: "ib-op-none" }, "—")
          : e("button", {
              className: "ib-op-btn",
              type: "button",
              title: config.voidHint,
              onClick: () => partnerStore.openVoid(row.id)
            }, config.voidLabel);
      }
      return row[col.key];
    };

    const headCells = config.columns
      .map(col => e("th", {
        key: col.key,
        className: col.key === "op" ? "ib-col-op" : (col.numeric ? "is-numeric" : null)
      }, col.label));

    const bodyRows = pageRows.length === 0
      ? [e("tr", { key: "empty" },
          e("td", { className: "ib-partner-empty", colSpan: config.columns.length }, config.emptyText))]
      : pageRows.map(row => e("tr", { key: row.id },
          config.columns.map(col => e("td", {
            key: col.key,
            className: col.key === "op" ? "ib-col-op" : (col.numeric ? "is-numeric ib-num" : null)
          }, renderCell(col, row)))));

    return e("div", { className: "ib-card ib-partner-card" }, [
      e("div", { className: "ib-section-head", key: "head" }, [
        e("div", { className: "ib-section-head-left", key: "left" }, [
          e("h2", { className: "ib-section-title", key: "title" }, config.title),
          e("span", { className: "ib-section-hint", key: "hint" }, config.hint)
        ]),
        e("div", { className: "ib-section-head-right", key: "right" }, [
          // 状态筛选（搜索框左侧）：全部 / 正常 / 失效
          e("div", { className: "ib-status-filter", key: "status-filter" }, [
            e("span", { className: "ib-filter-label", key: "label" }, config.statusFilterLabel),
            e("span", { className: "ib-status-select", key: "select" }, [
              e("select", {
                key: "sel",
                value: statusFilter,
                "aria-label": config.statusFilterLabel,
                onChange: event => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }
              },
                config.statusOptions.map(opt => e("option", { key: opt.key, value: opt.key }, opt.label))),
              e("span", { className: "ib-status-caret", key: "caret" }, "▾")
            ])
          ]),
          e("div", { className: "ib-search-input", key: "search" }, [
            e(SearchIcon, { key: "icon" }),
            e("input", {
              key: "input",
              type: "text",
              value: search,
              placeholder: config.searchPlaceholder,
              onChange: event => {
                setSearch(event.target.value);
                setPage(1);
              }
            }),
            search
              ? e("button", {
                  className: "ib-search-clear",
                  type: "button",
                  key: "clear",
                  "aria-label": "清空搜索",
                  onClick: () => {
                    setSearch("");
                    setPage(1);
                  }
                }, "✕")
              : null
          ]),
          e("button", {
            className: "ib-btn-tool-primary",
            type: "button",
            key: "add",
            onClick: partnerStore.openCreate
          }, [e(PlusIcon, { key: "icon" }), config.addLabel])
        ])
      ]),
      e("div", { className: "ib-partner-table-wrap", key: "table-wrap" },
        e("table", { className: "ib-partner-table is-plans" }, [
          e("thead", { key: "head" }, e("tr", null, headCells)),
          e("tbody", { key: "body" }, bodyRows)
        ])),
      e("div", { className: "ib-partner-foot", key: "foot" }, [
        e("span", { className: "ib-partner-total ib-num", key: "total" },
          config.totalLabel.replace("{n}", String(rows.length))),
        e("div", { className: "ib-pager", key: "pager" }, [
          e("span", { className: "ib-page-size", key: "size" }, `${config.pageSize}条/页`),
          e("button", {
            className: "ib-page-btn",
            type: "button",
            key: "prev",
            disabled: currentPage <= 1,
            onClick: () => setPage(currentPage - 1)
          }, "‹"),
          ...Array.from({ length: totalPages }, (_, index) => index + 1).map(num =>
            e("button", {
              className: `ib-page-btn ib-num${num === currentPage ? " is-active" : ""}`,
              type: "button",
              key: num,
              onClick: () => setPage(num)
            }, num)),
          e("button", {
            className: "ib-page-btn",
            type: "button",
            key: "next",
            disabled: currentPage >= totalPages,
            onClick: () => setPage(currentPage + 1)
          }, "›")
        ])
      ])
    ]);
  }

  /* ---------------------------------------------------------------
     下区：直客与子代理（直客/子代理标签切换 + 设为合伙人 / 修改比例 / 解除）
  --------------------------------------------------------------- */

  function PeopleSection({ state }) {
    const config = app.mockData.partnerPeople;
    // 直客/子代理标签与搜索框均为即时过滤；搜索框对 UID / 昵称做模糊匹配
    const [typeFilter, setTypeFilter] = React.useState("direct");
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);

    const keyword = search.trim().toLowerCase();
    const filtered = state.people.filter(person =>
      person.type === typeFilter &&
      (!keyword ||
        String(person.uid).toLowerCase().includes(keyword) ||
        person.name.toLowerCase().includes(keyword)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / config.pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * config.pageSize, currentPage * config.pageSize);

    const pageButtons = [];
    for (let num = 1; num <= totalPages; num += 1) {
      pageButtons.push(e("button", {
        className: `ib-page-btn ib-num${num === currentPage ? " is-active" : ""}`,
        type: "button",
        key: num,
        onClick: () => setPage(num)
      }, num));
    }

    // 直客标签下隐藏仅子代理展示的列（累计返佣 / 所属邀请码）
    const columns = config.columns.filter(col => !col.agentOnly || typeFilter === "agent");
    const numericKeys = new Set(columns.filter(col => col.numeric).map(col => col.key));

    const renderCell = (col, row) => {
      if (col.key === "rate") {
        return row.type === "agent"
          ? [
              `${row.rate}%`,
              row.rateOverridden
                ? e("span", { className: "ib-rate-tag", key: "tag", title: app.mockData.partnerPeople.drawer.adjustedTitle },
                    app.mockData.partnerPeople.drawer.adjustedTag)
                : null
            ]
          : e("span", { className: "ib-op-none" }, "—");
      }
      if (col.key === "code") {
        return row.code || e("span", { className: "ib-op-none" }, "—");
      }
      return row[col.key];
    };

    const renderOps = row => {
      if (row.type === "direct") {
        return e("button", {
          className: "ib-op-btn is-primary",
          type: "button",
          key: "convert",
          onClick: () => partnerStore.openConvert(row.id)
        }, config.setPartnerLabel);
      }
      return e("div", { className: "ib-ops", key: "ops" }, [
        e("button", {
          className: "ib-op-btn",
          type: "button",
          key: "rate",
          onClick: () => partnerStore.openRate(row.id)
        }, config.editRateLabel),
        e("button", {
          className: "ib-op-btn",
          type: "button",
          key: "cancel",
          title: config.cancelHint,
          onClick: () => partnerStore.openCancel(row.id)
        }, config.cancelLabel)
      ]);
    };

    const headCells = columns
      .map(col => e("th", {
        key: col.key,
        className: col.numeric ? "is-numeric" : null
      }, col.label))
      .concat([e("th", { className: "ib-col-op", key: "op" }, config.opLabel)]);

    const bodyRows = pageRows.length === 0
      ? [e("tr", { key: "empty" },
          e("td", { className: "ib-partner-empty", colSpan: columns.length + 1 }, config.emptyText))]
      : pageRows.map(row => {
          const cells = columns
            .map(col => e("td", {
              key: col.key,
              className: numericKeys.has(col.key) ? "is-numeric ib-num" : null
            }, renderCell(col, row)))
            .concat([e("td", { className: "ib-col-op", key: "op" }, renderOps(row))]);
          return e("tr", { key: row.id }, cells);
        });

    return e("div", { className: "ib-card ib-partner-card" }, [
      // 标题行右侧直接放 直客/子代理标签切换 + 搜索框，与上区布局一致
      e("div", { className: "ib-section-head", key: "head" }, [
        e("div", { className: "ib-section-head-left", key: "left" }, [
          e("h2", { className: "ib-section-title", key: "title" }, config.title),
          e("span", { className: "ib-section-hint", key: "hint" }, config.hint)
        ]),
        e("div", { className: "ib-section-head-right", key: "right" }, [
          e("div", {
            className: "ib-filter-tabs",
            key: "tabs",
            role: "tablist",
            "aria-label": config.filterBar.typeLabel
          }, config.typeTabs.map(tab =>
            e("button", {
              className: `ib-filter-tab${typeFilter === tab.key ? " is-active" : ""}`,
              type: "button",
              key: tab.key,
              role: "tab",
              "aria-selected": typeFilter === tab.key,
              onClick: () => {
                setTypeFilter(tab.key);
                setPage(1);
              }
            }, tab.label))),
          e("div", { className: "ib-search-input", key: "search" }, [
            e(SearchIcon, { key: "icon" }),
            e("input", {
              key: "input",
              type: "text",
              value: search,
              placeholder: config.filterBar.searchPlaceholder,
              onChange: event => {
                setSearch(event.target.value);
                setPage(1);
              }
            }),
            search
              ? e("button", {
                  className: "ib-search-clear",
                  type: "button",
                  key: "clear",
                  "aria-label": "清空搜索",
                  onClick: () => {
                    setSearch("");
                    setPage(1);
                  }
                }, "✕")
              : null
          ])
        ])
      ]),
      e("div", { className: "ib-partner-table-wrap", key: "table-wrap" },
        e("table", { className: `ib-partner-table is-people${typeFilter === "direct" ? " is-direct" : ""}` }, [
          e("thead", { key: "head" }, e("tr", null, headCells)),
          e("tbody", { key: "body" }, bodyRows)
        ])),
      e("div", { className: "ib-partner-foot", key: "foot" }, [
        e("span", { className: "ib-partner-total ib-num", key: "total" }, `共 ${filtered.length} 条`),
        e("div", { className: "ib-pager", key: "pager" }, [
          e("span", { className: "ib-page-size", key: "size" }, `${config.pageSize}条/页`),
          e("button", {
            className: "ib-page-btn",
            type: "button",
            key: "prev",
            disabled: currentPage <= 1,
            onClick: () => setPage(currentPage - 1)
          }, "‹"),
          pageButtons,
          e("button", {
            className: "ib-page-btn",
            type: "button",
            key: "next",
            disabled: currentPage >= totalPages,
            onClick: () => setPage(currentPage + 1)
          }, "›")
        ])
      ])
    ]);
  }

  /* ---------------------------------------------------------------
     默认跟踪链接横条（页头下、上区上）：复用总览页 linkCard 数据，
     渐变描边一行式；地址复制 1.2s 变绿，「二维码」弹浮层（点外部 / Esc 关）
  --------------------------------------------------------------- */

  function CopyIcon() {
    return e("svg", { className: "ib-copy-icon", viewBox: "0 0 16 16", fill: "none" }, [
      e("rect", { key: "back", x: "5.5", y: "5.5", width: "8", height: "8", rx: "1.5", stroke: "currentColor", strokeWidth: "1.2" }),
      e("path", { key: "front", d: "M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10H4", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })
    ]);
  }

  function CheckIcon() {
    return e("svg", { className: "ib-copy-icon", viewBox: "0 0 16 16", fill: "none" }, [
      e("path", { key: "check", d: "M3.5 8.5L6.5 11.5L12.5 4.5", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" })
    ]);
  }

  // 二维码占位点阵：三个定位角 + 确定性伪随机数据点，仅模拟外观
  function QrPlaceholder() {
    const size = 21;
    const zones = [[0, 0], [0, size - 7], [size - 7, 0]];
    const finderCell = (r, c) => {
      for (let z = 0; z < zones.length; z += 1) {
        const dr = r - zones[z][0];
        const dc = c - zones[z][1];
        if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
          return dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
        }
      }
      return null;
    };
    const cells = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const inFinder = finderCell(r, c);
        const on = inFinder === null ? (r * 31 + c * 17 + 11) % 7 < 3 : inFinder;
        if (on) cells.push(e("rect", { key: `${r}-${c}`, x: c, y: r, width: 1, height: 1 }));
      }
    }
    return e("svg", {
      className: "ib-qr-glyph",
      viewBox: `0 0 ${size} ${size}`,
      shapeRendering: "crispEdges",
      "aria-hidden": "true"
    }, cells);
  }

  function LinkBar() {
    const link = app.mockData.overview.linkCard;
    const [copiedField, setCopiedField] = React.useState(null);
    const [qrOpen, setQrOpen] = React.useState(false);
    const qrAnchorRef = React.useRef(null);

    React.useEffect(() => {
      if (!qrOpen) return undefined;
      const onPointerDown = event => {
        if (qrAnchorRef.current && !qrAnchorRef.current.contains(event.target)) setQrOpen(false);
      };
      const onKeyDown = event => {
        if (event.key === "Escape") setQrOpen(false);
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("keydown", onKeyDown, true);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown, true);
        document.removeEventListener("keydown", onKeyDown, true);
      };
    }, [qrOpen]);

    const handleCopy = field => {
      copyText(field.copyValue || field.value);
      setCopiedField(field.label);
      window.setTimeout(() => setCopiedField(prev => (prev === field.label ? null : prev)), 1200);
    };

    const codeField = link.fields.find(field => field.code);

    return e("div", { className: "ib-card ib-linkbar" }, [
      e("div", { className: "ib-linkbar-title", key: "title" }, [
        e("div", { className: "ib-linkbar-title-row", key: "row" }, [
          e("span", { className: "ib-linkbar-name", key: "name" }, link.title),
          e("span", { className: "ib-badge-live", key: "badge" }, link.liveBadge)
        ])
      ]),
      e("div", { className: "ib-linkbar-fields", key: "fields" },
        link.fields.map(field => {
          const copied = copiedField === field.label;
          return e("div", { className: `ib-linkbar-field${field.code ? " is-code" : ""}`, key: field.label }, [
            e("span", { className: "ib-linkbar-field-label", key: "label" }, field.label),
            e("div", { className: `ib-linkbar-field-value ib-num${field.code ? " is-code" : ""}`, key: "value" }, [
              e("span", { className: "ib-linkbar-field-text", key: "text" }, field.value),
              field.copyable
                ? e("button", {
                    className: `ib-copy-btn${copied ? " is-copied" : ""}`,
                    type: "button",
                    key: "copy",
                    title: copied ? "已复制" : "复制地址",
                    onClick: () => handleCopy(field)
                  }, copied ? e(CheckIcon, { key: "check" }) : e(CopyIcon, { key: "icon" }))
                : null
            ])
          ]);
        })),
      e("div", { className: "ib-linkbar-actions", key: "actions" },
        e("span", { className: "ib-linkbar-qr-anchor", ref: qrAnchorRef }, [
          e("button", {
            className: "ib-btn-qr",
            type: "button",
            key: "qr",
            "aria-expanded": qrOpen,
            onClick: () => setQrOpen(open => !open)
          }, link.qrLabel),
          qrOpen
            ? e("div", { className: "ib-linkbar-qrpop", key: "qrpop" }, [
                e("div", { className: "ib-qr-plate", key: "plate" }, e(QrPlaceholder, { key: "glyph" })),
                e("span", { className: "ib-linkbar-qrpop-code", key: "code" }, [
                  "推荐码 ",
                  e("b", { className: "ib-num", key: "b" }, codeField ? codeField.value : "")
                ])
              ])
            : null
        ]))
    ]);
  }

  /* ---------------------------------------------------------------
     合伙人列表页：上「分佣比例」+ 下「直客与子代理」
  --------------------------------------------------------------- */

  function PartnerPage({ data }) {
    const state = useSyncExternalStore(partnerStore.subscribe, partnerStore.getSnapshot);
    const peopleConfig = app.mockData.partnerPeople;
    const plansConfig = app.mockData.partnerPlans;
    const drawerPlan = state.drawerPlanId
      ? state.plans.find(plan => plan.id === state.drawerPlanId)
      : null;

    return e("div", { className: "ib-page" }, [
      e("div", { className: "ib-page-head", key: "head" }, [
        e("h1", { className: "ib-page-title", key: "title" }, data.pageTitle)
      ]),
      e("div", { className: "ib-stack", key: "stack" }, [
        e(LinkBar, { key: "linkbar" }),
        e(PlanSection, { state, key: "plans" }),
        e(PeopleSection, { state, key: "people" })
      ]),
      state.convertTarget
        ? e(ConvertModal, { key: "convert", person: state.convertTarget, config: peopleConfig.convert })
        : null,
      state.rateTarget
        ? e(RateModal, { key: "rate", person: state.rateTarget, config: peopleConfig.rateForm })
        : null,
      state.cancelTarget
        ? e(ConfirmDialog, {
            key: "cancel",
            labels: peopleConfig.cancelConfirm,
            body: peopleConfig.cancelConfirm.body.replace("{name}", state.cancelTarget.name),
            onCancel: partnerStore.closeCancel,
            onConfirm: () => partnerStore.confirmCancel(state.cancelTarget.id)
          })
        : null,
      state.voidTarget
        ? e(ConfirmDialog, {
            key: "void",
            labels: plansConfig.voidConfirm,
            body: plansConfig.voidConfirm.body.replace("{name}", state.voidTarget.name),
            onCancel: partnerStore.closeVoid,
            onConfirm: () => partnerStore.confirmVoid(state.voidTarget.id)
          })
        : null,
      drawerPlan
        ? e(PeopleDrawer, { key: `drawer-${drawerPlan.id}`, plan: drawerPlan })
        : null
    ]);
  }

  app.PartnerModal = PartnerModal;
  app.PartnerPage = PartnerPage;
})(window.IBApp);

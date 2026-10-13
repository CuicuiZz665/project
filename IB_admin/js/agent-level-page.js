(function registerAgentLevelPage(app) {
  const {
    Button,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  const LANGUAGE_OPTIONS = ["简体中文", "English", "繁體中文", "日本語", "한국어", "Tiếng Việt"];

  function formatAmount(value) {
    return Number(value).toLocaleString("en-US");
  }

  function nowText() {
    const now = new Date();
    const pad = num => String(num).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  // 本地 antd 静态 Modal.confirm 在该 vendor 组合下确定/取消后不会自动销毁，这里显式 destroy
  function confirmAction(options) {
    const ref = Modal.confirm({
      okText: "确认",
      cancelText: "取消",
      ...options,
      onOk: () => {
        options.onOk();
        ref.destroy();
      },
      onCancel: () => ref.destroy()
    });
    return ref;
  }

  function AgentLevelPage({ levels, setLevels, rules, agents }) {
    const [keyword, setKeyword] = React.useState();
    const [editing, setEditing] = React.useState(null);
    const [langTabs, setLangTabs] = React.useState(["英语"]);
    const [activeLang, setActiveLang] = React.useState("英语");
    const [langNames, setLangNames] = React.useState({});
    const [form] = Form.useForm();

    const sortedLevels = React.useMemo(
      () => [...levels].sort((a, b) => a.sort - b.sort),
      [levels]
    );

    function ruleOf(level) {
      return rules.find(rule => String(rule.id) === String(level.commissionRuleId)) || null;
    }

    function agentCountOf(levelName) {
      return agents.filter(agent => agent.level === levelName).length;
    }

    const visibleLevels = sortedLevels.filter(level => !keyword || level.name === keyword);

    function resetFilters() {
      setKeyword(undefined);
    }

    function openCreate() {
      const nextSort = sortedLevels.length
        ? Math.max(...sortedLevels.map(level => level.sort)) + 1
        : 1;
      setEditing({ id: null, sort: nextSort });
      setLangTabs(["英语"]);
      setActiveLang("英语");
      setLangNames({});
      form.setFieldsValue({
        commissionRuleId: undefined,
        activeCustomers: undefined,
        teamHoldings: undefined
      });
    }

    function prefillEditor(level, nameSuffix) {
      const langs = (level.languages && level.languages.length
        ? level.languages
        : [{ lang: "简体中文", name: level.name }]
      ).map(item => ({ ...item, name: nameSuffix ? `${item.name}${nameSuffix}` : item.name }));
      setLangTabs(langs.map(item => item.lang));
      setActiveLang(langs[0].lang);
      setLangNames(Object.fromEntries(langs.map(item => [item.lang, item.name])));
      form.setFieldsValue({
        commissionRuleId: level.commissionRuleId ? String(level.commissionRuleId) : undefined,
        activeCustomers: level.upgrade.activeCustomers || undefined,
        teamHoldings: level.upgrade.teamHoldings || undefined
      });
    }

    function openEdit(level) {
      setEditing(level);
      prefillEditor(level);
    }

    function openCopy(level) {
      const nextSort = sortedLevels.length
        ? Math.max(...sortedLevels.map(item => item.sort)) + 1
        : 1;
      setEditing({ ...level, id: null, sort: nextSort, mode: "copy" });
      prefillEditor(level, "-副本");
    }

    function switchLang(lang) {
      setActiveLang(lang);
    }

    function removeLang(lang) {
      if (langTabs.length <= 1) {
        message.warning("至少保留一个语言配置");
        return;
      }
      const next = langTabs.filter(item => item !== lang);
      setLangTabs(next);
      if (activeLang === lang) setActiveLang(next[0]);
    }

    function addLang() {
      const next = LANGUAGE_OPTIONS.find(item => !langTabs.includes(item));
      if (!next) {
        message.warning("全部语言均已添加");
        return;
      }
      setLangTabs([...langTabs, next]);
      setActiveLang(next);
      message.success(`已添加${next}`);
    }

    function closeEditor() {
      setEditing(null);
      form.resetFields();
    }

    async function saveLevel() {
      let values;
      try {
        values = await form.validateFields();
      } catch {
        return;
      }
      const primaryName = String(langNames[langTabs[0]] || "").trim();
      if (!primaryName) {
        message.error("请输入等级名称");
        setActiveLang(langTabs[0]);
        return;
      }
      const langs = langTabs
        .map(lang => ({ lang, name: String(langNames[lang] || "").trim() }))
        .filter(item => item.name);
      const primary = langs.find(item => item.lang === "简体中文") || langs[0];
      const isEditing = Boolean(editing.id);
      if (levels.some(level => level.name === primary.name && level.id !== editing.id)) {
        message.error(`等级名称「${primary.name}」已存在`);
        return;
      }
      const payload = {
        name: primary.name,
        languages: langs,
        upgrade: {
          match: isEditing ? (editing.upgrade.match || "任意") : "任意",
          activeCustomers: values.activeCustomers || 0,
          teamHoldings: values.teamHoldings || 0
        },
        commissionRuleId: values.commissionRuleId || null
      };
      const commit = () => {
        setLevels(list => isEditing
          ? list.map(item => (item.id === editing.id ? { ...item, ...payload, operator: "Amy", updatedAt: nowText() } : item))
          : [...list, {
            id: `level-${Date.now()}`,
            sort: editing.sort,
            status: "启用",
            isDefault: false,
            color: editing.color || "#1677ff",
            rebateRate: editing.rebateRate ?? 40,
            marketingRate: editing.marketingRate ?? 0,
            protectionDays: editing.protectionDays ?? 0,
            remark: editing.remark || "",
            operator: "Amy",
            updatedAt: nowText(),
            ...payload
          }]
        );
        message.success(isEditing
          ? `等级「${payload.name}」已更新`
          : editing.mode === "copy" ? `等级「${payload.name}」已复制` : `等级「${payload.name}」已创建`);
        closeEditor();
      };
      const count = isEditing ? agentCountOf(editing.name) : 0;
      if (isEditing && count > 0) {
        confirmAction({
          title: "确认保存等级修改？",
          content: `当前有 ${count} 个代理处于「${editing.name}」等级，保存后新配置将影响这些代理的等级权益计算。`,
          okText: "确认保存",
          cancelText: "取消",
          onOk: commit
        });
        return;
      }
      commit();
    }

    function removeLevel(level) {
      if (level.isDefault) {
        message.warning("默认等级不可删除，请先将其他等级设为默认");
        return;
      }
      const count = agentCountOf(level.name);
      if (count > 0) {
        message.warning(`该等级下存在 ${count} 个代理，无法删除`);
        return;
      }
      confirmAction({
        title: `确认删除等级「${level.name}」？`,
        content: "删除后不可恢复，升级通道将跳过该等级。",
        okText: "删除",
        okButtonProps: { danger: true },
        cancelText: "取消",
        onOk: () => {
          setLevels(list => list.filter(item => item.id !== level.id));
          message.success(`等级「${level.name}」已删除`);
        }
      });
    }

    function setDefaultLevel(level) {
      if (level.isDefault) return;
      confirmAction({
        title: `确认将「${level.name}」设为默认等级？`,
        content: "设置后新加入的代理商将默认分配到该等级。",
        okText: "确认设置",
        cancelText: "取消",
        onOk: () => {
          setLevels(list => list.map(item => ({ ...item, isDefault: item.id === level.id })));
          message.success(`「${level.name}」已设为默认等级`);
        }
      });
    }

    function renderUpgrade(level) {
      const { upgrade } = level;
      const conditions = [
        upgrade.activeCustomers > 0 ? `活跃客户 ≥ ${formatAmount(upgrade.activeCustomers)} 人` : null,
        upgrade.teamHoldings > 0 ? `团队持仓 ≥ ${formatAmount(upgrade.teamHoldings)} 元` : null
      ].filter(Boolean);
      if (!conditions.length) {
        return e(Text, { type: "secondary" }, "新代理默认等级，无需等级考核");
      }
      return e("div", { className: "level-upgrade-cell" }, [
        e("div", { className: "level-condition-pills", key: "pills" },
          conditions.map(item => e(Tag, { key: item }, item))),
        e(Text, { type: "secondary", key: "match", className: "level-match-hint" },
          `满足${upgrade.match === "全部" ? "全部" : "任意"}条件`)
      ]);
    }

    function renderLinkedRule(level) {
      const rule = ruleOf(level);
      if (!rule) return e(Text, { type: "secondary" }, "-");
      return e("div", { className: "level-upgrade-cell" }, [
        e("span", { key: "name" }, rule.name),
        rule.status === "停用"
          ? e(Tag, { key: "status" }, "已停用")
          : null
      ]);
    }

    const columns = [
      {
        title: "等级名称",
        dataIndex: "name",
        width: 150,
        render: (value, record) => e(Space, { size: 4 }, [
          e(Tag, { key: "tag", color: record.color }, value),
          record.isDefault ? e(Tag, { key: "default", color: "blue" }, "默认") : null
        ])
      },
      { title: "关联佣金规则", key: "rule", width: 150, render: (_, record) => renderLinkedRule(record) },
      { title: "分佣比例", dataIndex: "rebateRate", width: 100, render: value => `${value}%` },
      { title: "营销激励", dataIndex: "marketingRate", width: 100, render: value => `${value}%` },
      { title: "等级考核规则", key: "upgrade", width: 280, render: (_, record) => renderUpgrade(record) },
      { title: "更新时间(GMT+0)", dataIndex: "updatedAt", width: 170, render: value => value || "-" },
      { title: "操作人", dataIndex: "operator", width: 90, render: value => value || "-" },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 230,
        render: (_, record) => e(Space, { size: 0, wrap: true }, [
          e(Button, { key: "edit", type: "link", size: "small", onClick: () => openEdit(record) }, "修改"),
          e(Button, { key: "copy", type: "link", size: "small", onClick: () => openCopy(record) }, "复制"),
          e(Button, {
            key: "default",
            type: "link",
            size: "small",
            disabled: record.isDefault,
            onClick: () => setDefaultLevel(record)
          }, "设为默认"),
          e(Button, {
            key: "delete",
            type: "link",
            size: "small",
            danger: true,
            onClick: () => removeLevel(record)
          }, "删除")
        ])
      }
    ];

    return e("section", { className: "page-surface agent-level-page" }, [
      e("div", { className: "toolbar config-toolbar", key: "toolbar" }, [
        e("div", { className: "config-filter-row", key: "filters" }, [
          e("label", { className: "config-filter-item", key: "name" }, [
            e("span", null, "等级名称："),
            e(Select, {
              value: keyword,
              onChange: setKeyword,
              placeholder: "请输入等级名称",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: sortedLevels.map(level => ({ value: level.name, label: level.name }))
            })
          ]),
          e(Space, { key: "buttons", size: 8 }, [
            e(Button, { type: "primary", key: "search", onClick: () => setKeyword(keyword) }, "查询"),
            e(Button, { key: "reset", onClick: resetFilters }, "重置")
          ])
        ]),
        e(Button, { key: "add", type: "primary", onClick: openCreate }, "新增等级")
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: visibleLevels,
        pagination: false,
        scroll: { x: 1250 }
      }),
      e(Drawer, {
        key: "editor",
        title: editing?.id
          ? `编辑代理等级「${editing.name}」`
          : editing?.mode === "copy" ? `复制代理等级「${editing.name}」` : "新增代理等级",
        open: Boolean(editing),
        onClose: closeEditor,
        width: 720,
        destroyOnClose: true,
        footer: e("div", { className: "drawer-footer-actions" }, [
          e(Button, { key: "cancel", onClick: closeEditor }, "取 消"),
          e(Button, { key: "ok", type: "primary", onClick: saveLevel }, "确 定")
        ])
      }, editing && e(Form, { form, layout: "vertical", requiredMark: true }, [
        e("div", { className: "form-section-title", key: "lang-title" }, [
          e("span", { key: "req", style: { color: "#ff4d4f", marginRight: 4 } }, "*"),
          "语言配置"
        ]),
        e("div", { className: "tabs", key: "lang-tabs" }, [
          ...langTabs.map(lang => e("span", {
            key: lang,
            className: `tab${lang === activeLang ? " active" : ""}`,
            onClick: () => switchLang(lang)
          }, [
            lang,
            lang !== langTabs[0] ? e("button", {
              key: "rm",
              type: "button",
              title: "移除该语言",
              onClick: event => {
                event.stopPropagation();
                removeLang(lang);
              }
            }, "×") : null
          ])),
          e("span", { key: "add", className: "tab", onClick: addLang }, "+ 添加语言")
        ]),
        e(Form.Item, { key: "name", label: "等级名称", required: true }, e(Input, {
          maxLength: 20,
          placeholder: "请输入等级名称",
          value: langNames[activeLang] || "",
          onChange: event => setLangNames(prev => ({ ...prev, [activeLang]: event.target.value }))
        })),
        e("div", { className: "form-section-title", key: "rule-title" }, "规则配置"),
        e(Form.Item, {
          key: "rule",
          label: "佣金配置",
          name: "commissionRuleId",
          rules: [{ required: true, message: "请选择佣金配置" }]
        }, e(Select, {
          placeholder: "请选择佣金配置",
          allowClear: true,
          options: rules.map(rule => ({
            value: String(rule.id),
            label: `${rule.name}（${rule.status}）`
          }))
        })),
        e(Form.Item, {
          key: "active",
          label: "活跃客户数≥",
          name: "activeCustomers",
          rules: [{ required: true, message: "请输入活跃客户数门槛" }]
        }, e(InputNumber, {
          min: 0,
          precision: 0,
          style: { width: "100%" },
          placeholder: "请输入活跃客户数门槛"
        })),
        e(Form.Item, {
          key: "holdings",
          label: "团队持仓量≥",
          name: "teamHoldings",
          rules: [{ required: true, message: "请输入团队持仓量门槛" }]
        }, e(InputNumber, {
          min: 0,
          style: { width: "100%" },
          placeholder: "请输入团队持仓量门槛"
        }))
      ]))
    ]);
  }

  app.AgentLevelPage = AgentLevelPage;
})(window.AdminApp);

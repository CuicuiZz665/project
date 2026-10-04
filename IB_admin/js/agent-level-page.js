(function registerAgentLevelPage(app) {
  const {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  const levelColorOptions = [
    { value: "#8c8c8c", label: "石墨灰" },
    { value: "#13c2c2", label: "靛青" },
    { value: "#52c41a", label: "草木绿" },
    { value: "#1677ff", label: "品牌蓝" },
    { value: "#722ed1", label: "星紫" },
    { value: "#faad14", label: "鎏金" },
    { value: "#fa541c", label: "熔岩橙" },
    { value: "#f5222d", label: "绯红" }
  ];

  function formatAmount(value) {
    return Number(value).toLocaleString("en-US");
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
    const [keyword, setKeyword] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState();
    const [editing, setEditing] = React.useState(null);
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

    const visibleLevels = sortedLevels.filter(level => {
      const term = keyword.trim().toLowerCase();
      return (!term || level.name.toLowerCase().includes(term))
        && (!statusFilter || level.status === statusFilter);
    });

    function resetFilters() {
      setKeyword("");
      setStatusFilter(undefined);
    }

    function openCreate() {
      const nextSort = sortedLevels.length
        ? Math.max(...sortedLevels.map(level => level.sort)) + 1
        : 1;
      setEditing({ id: null, sort: nextSort });
      form.setFieldsValue({
        name: "",
        color: "#1677ff",
        upgrade: { match: "任意", directCustomers: 0, teamMembers: 0, netDeposit: 0, teamLots: 0 },
        rebateRate: 40,
        marketingRate: 0,
        protectionDays: 0,
        commissionRuleId: undefined,
        remark: ""
      });
    }

    function openEdit(level) {
      setEditing(level);
      form.setFieldsValue({
        name: level.name,
        color: level.color,
        upgrade: { ...level.upgrade },
        rebateRate: level.rebateRate,
        marketingRate: level.marketingRate,
        protectionDays: level.protectionDays,
        commissionRuleId: level.commissionRuleId ? String(level.commissionRuleId) : undefined,
        remark: level.remark || ""
      });
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
      const isEditing = Boolean(editing.id);
      const payload = {
        name: values.name.trim(),
        color: values.color,
        upgrade: values.upgrade,
        rebateRate: values.rebateRate,
        marketingRate: values.marketingRate || 0,
        protectionDays: values.protectionDays || 0,
        commissionRuleId: values.commissionRuleId || null,
        remark: values.remark || ""
      };
      const commit = () => {
        setLevels(list => isEditing
          ? list.map(item => (item.id === editing.id ? { ...item, ...payload } : item))
          : [...list, {
            id: `level-${Date.now()}`,
            sort: editing.sort,
            status: "启用",
            isDefault: false,
            ...payload
          }]
        );
        message.success(isEditing ? `等级「${payload.name}」已更新` : `等级「${payload.name}」已创建`);
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

    function moveLevel(level, direction) {
      const index = sortedLevels.findIndex(item => item.id === level.id);
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= sortedLevels.length) return;
      const current = sortedLevels[index];
      const neighbor = sortedLevels[target];
      setLevels(list => list.map(item => {
        if (item.id === current.id) return { ...item, sort: neighbor.sort };
        if (item.id === neighbor.id) return { ...item, sort: current.sort };
        return item;
      }));
      message.success(`已将「${level.name}」${direction === "up" ? "上移" : "下移"}`);
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

    function toggleLevelStatus(level, next) {
      const apply = () => {
        setLevels(list => list.map(item => (
          item.id === level.id ? { ...item, status: next ? "启用" : "停用" } : item
        )));
        message.success(`等级「${level.name}」已${next ? "启用" : "停用"}`);
      };
      if (next) {
        apply();
        return;
      }
      if (level.isDefault) {
        message.warning("默认等级不可停用");
        return;
      }
      const count = agentCountOf(level.name);
      if (count > 0) {
        confirmAction({
          title: "确认停用该等级？",
          content: `当前有 ${count} 个代理处于「${level.name}」等级，停用后该等级不再参与升级计算与权益发放。`,
          okText: "确认停用",
          cancelText: "取消",
          onOk: apply
        });
        return;
      }
      apply();
    }

    function renderUpgrade(level) {
      const { upgrade } = level;
      const conditions = [
        upgrade.directCustomers > 0 ? `直客 ≥ ${upgrade.directCustomers} 人` : null,
        upgrade.teamMembers > 0 ? `团队 ≥ ${upgrade.teamMembers} 人` : null,
        upgrade.netDeposit > 0 ? `净入金 ≥ ${formatAmount(upgrade.netDeposit)} USDT` : null,
        upgrade.teamLots > 0 ? `手数 ≥ ${formatAmount(upgrade.teamLots)} 手` : null
      ].filter(Boolean);
      if (!conditions.length) {
        return e(Text, { type: "secondary" }, "新代理默认等级，无需升级条件");
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
      { title: "排序", dataIndex: "sort", width: 70 },
      {
        title: "等级名称",
        dataIndex: "name",
        width: 150,
        render: (value, record) => e(Space, { size: 4 }, [
          e(Tag, { key: "tag", color: record.color }, value),
          record.isDefault ? e(Tag, { key: "default", color: "blue" }, "默认") : null
        ])
      },
      { title: "升级条件", key: "upgrade", width: 280, render: (_, record) => renderUpgrade(record) },
      { title: "可获返佣", dataIndex: "rebateRate", width: 100, render: value => `${value}%` },
      { title: "营销激励", dataIndex: "marketingRate", width: 100, render: value => `${value}%` },
      {
        title: "保护期",
        dataIndex: "protectionDays",
        width: 90,
        render: value => (value ? `${value} 天` : "-")
      },
      { title: "关联佣金规则", key: "rule", width: 150, render: (_, record) => renderLinkedRule(record) },
      {
        title: "代理数",
        key: "agentCount",
        width: 90,
        render: (_, record) => e("strong", null, String(agentCountOf(record.name)))
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 90,
        render: (_, record) => e(Switch, {
          size: "small",
          checked: record.status === "启用",
          onChange: value => toggleLevelStatus(record, value)
        })
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 290,
        render: (_, record) => {
          const index = sortedLevels.findIndex(item => item.id === record.id);
          return e(Space, { size: 0, wrap: true }, [
            e(Button, { key: "edit", type: "link", size: "small", onClick: () => openEdit(record) }, "编辑"),
            e(Button, {
              key: "up",
              type: "link",
              size: "small",
              disabled: index <= 0,
              onClick: () => moveLevel(record, "up")
            }, "上移"),
            e(Button, {
              key: "down",
              type: "link",
              size: "small",
              disabled: index >= sortedLevels.length - 1,
              onClick: () => moveLevel(record, "down")
            }, "下移"),
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
          ]);
        }
      }
    ];

    return e("section", { className: "page-surface agent-level-page" }, [
      e("div", { className: "toolbar config-toolbar", key: "toolbar" }, [
        e("div", { className: "config-filter-row", key: "filters" }, [
          e("label", { className: "config-filter-item", key: "name" }, [
            e("span", null, "等级名称："),
            e(Input, {
              value: keyword,
              onChange: event => setKeyword(event.target.value),
              placeholder: "请输入等级名称",
              allowClear: true
            })
          ]),
          e("label", { className: "config-filter-item", key: "status" }, [
            e("span", null, "状态："),
            e(Select, {
              value: statusFilter,
              onChange: setStatusFilter,
              placeholder: "全部状态",
              allowClear: true,
              className: "select-input",
              options: ["启用", "停用"].map(value => ({ value, label: value }))
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
        scroll: { x: 1500 }
      }),
      e(Modal, {
        key: "editor",
        title: editing?.id ? `编辑等级「${editing.name}」` : "新增等级",
        open: Boolean(editing),
        onCancel: closeEditor,
        onOk: saveLevel,
        okText: "保存",
        cancelText: "取消",
        width: 640,
        destroyOnClose: true
      }, editing && e(Form, { form, layout: "vertical", requiredMark: "optional" }, [
        e(Row, { key: "base", gutter: 16 }, [
          e(Col, { span: 12, key: "name" }, e(Form.Item, {
            label: "等级名称",
            name: "name",
            rules: [
              { required: true, message: "请输入等级名称" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const duplicated = levels.some(level => (
                    level.name === value.trim() && level.id !== editing.id
                  ));
                  return duplicated
                    ? Promise.reject(new Error("等级名称已存在"))
                    : Promise.resolve();
                }
              }
            ]
          }, e(Input, { maxLength: 20, placeholder: "如 V7" }))),
          e(Col, { span: 12, key: "color" }, e(Form.Item, {
            label: "等级颜色",
            name: "color"
          }, e(Select, {
            options: levelColorOptions.map(option => ({
              value: option.value,
              label: e("span", null, [
                e("span", { key: "dot", className: "color-dot", style: { background: option.value } }),
                option.label
              ])
            }))
          })))
        ]),
        e("div", { className: "form-section-title", key: "upgrade-title" }, "升级条件"),
        e(Form.Item, { key: "match", label: "满足方式", name: ["upgrade", "match"] }, e(Radio.Group, {
          optionType: "button",
          buttonStyle: "solid",
          options: [
            { value: "任意", label: "满足任意条件" },
            { value: "全部", label: "满足全部条件" }
          ]
        })),
        e(Row, { key: "conditions", gutter: 16 }, [
          e(Col, { span: 12, key: "direct" }, e(Form.Item, {
            label: "直客数量（人）",
            name: ["upgrade", "directCustomers"]
          }, e(InputNumber, { min: 0, precision: 0, style: { width: "100%" }, placeholder: "0" }))),
          e(Col, { span: 12, key: "members" }, e(Form.Item, {
            label: "团队成员数（人）",
            name: ["upgrade", "teamMembers"]
          }, e(InputNumber, { min: 0, precision: 0, style: { width: "100%" }, placeholder: "0" }))),
          e(Col, { span: 12, key: "deposit" }, e(Form.Item, {
            label: "团队净入金（USDT）",
            name: ["upgrade", "netDeposit"]
          }, e(InputNumber, { min: 0, style: { width: "100%" }, placeholder: "0" }))),
          e(Col, { span: 12, key: "lots" }, e(Form.Item, {
            label: "团队交易手数（手）",
            name: ["upgrade", "teamLots"]
          }, e(InputNumber, { min: 0, precision: 0, style: { width: "100%" }, placeholder: "0" })))
        ]),
        e(Text, { type: "secondary", key: "upgrade-hint" }, "填写 0 表示该条件不参与判定；默认等级无需配置升级条件。"),
        e("div", { className: "form-section-title", key: "benefit-title" }, "等级权益"),
        e(Row, { key: "benefits", gutter: 16 }, [
          e(Col, { span: 12, key: "rebate" }, e(Form.Item, {
            label: "可获返佣比例（%）",
            name: "rebateRate",
            rules: [{ required: true, message: "请输入可获返佣比例" }]
          }, e(InputNumber, {
            min: 0,
            max: 100,
            style: { width: "100%" },
            formatter: value => (value === null || value === undefined ? "" : `${value}%`),
            parser: value => value.replace("%", "")
          }))),
          e(Col, { span: 12, key: "marketing" }, e(Form.Item, {
            label: "营销激励比例（%）",
            name: "marketingRate"
          }, e(InputNumber, {
            min: 0,
            max: 100,
            style: { width: "100%" },
            formatter: value => (value === null || value === undefined ? "" : `${value}%`),
            parser: value => value.replace("%", "")
          })))
        ]),
        e(Form.Item, {
          key: "protection",
          label: "等级保护期（天）",
          name: "protectionDays",
          extra: "保护期内代理不因业绩下滑被降级，0 表示不设置保护期"
        }, e(InputNumber, { min: 0, max: 365, precision: 0, style: { width: "100%" }, placeholder: "0" })),
        e(Form.Item, {
          key: "rule",
          label: "关联佣金规则",
          name: "commissionRuleId",
          extra: "该等级代理默认绑定的佣金规则，可在代理商列表单独调整"
        }, e(Select, {
          placeholder: "请选择佣金规则",
          allowClear: true,
          options: rules.map(rule => ({
            value: String(rule.id),
            label: `${rule.name}（${rule.status}）`
          }))
        })),
        e(Form.Item, { key: "remark", label: "备注", name: "remark" }, e(Input.TextArea, {
          rows: 2,
          maxLength: 100,
          placeholder: "选填"
        }))
      ]))
    ]);
  }

  app.AgentLevelPage = AgentLevelPage;
})(window.AdminApp);

(function registerCommissionPage(app) {
  const {
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  const rateRows = [
    { group: "合约", key: "contract", label: "全部" },
    { group: "合约", key: "contractTrader", label: "Trader" },
    { group: "合约", key: "contractApi", label: "API" },
    { group: "合约", key: "contractTraderApi", label: "Trader & API" },
    { group: "现货", key: "spot", label: "全部" },
    { group: "现货", key: "spotTrader", label: "Trader" },
    { group: "现货", key: "spotApi", label: "API" },
    { group: "现货", key: "spotTraderApi", label: "Trader & API" }
  ];

  const zeroRates = () => ({
    contract: 0, contractTrader: 0, contractApi: 0, contractTraderApi: 0,
    spot: 0, spotTrader: 0, spotApi: 0, spotTraderApi: 0
  });

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

  const percentInput = value => (value === null || value === undefined ? "" : `${value}%`);
  const percentParse = value => value.replace("%", "");

  function CommissionPage({ rules, setRules, levels, agents }) {
    const [keyword, setKeyword] = React.useState("");
    const [levelFilter, setLevelFilter] = React.useState();
    const [statusFilter, setStatusFilter] = React.useState();
    const [editing, setEditing] = React.useState(null);
    const [effectiveType, setEffectiveType] = React.useState("立即生效");
    const [relatedRule, setRelatedRule] = React.useState(null);
    const [form] = Form.useForm();

    function agentCountOf(ruleId) {
      return agents.filter(agent => String(agent.commissionRuleId) === String(ruleId)).length;
    }

    function relatedAgentsOf(ruleId) {
      return agents.filter(agent => String(agent.commissionRuleId) === String(ruleId));
    }

    function levelNamesUsing(ruleId) {
      return levels
        .filter(level => String(level.commissionRuleId) === String(ruleId))
        .map(level => level.name);
    }

    const visibleRules = rules.filter(rule => {
      const term = keyword.trim().toLowerCase();
      return (!term
          || rule.name.toLowerCase().includes(term)
          || String(rule.id).toLowerCase().includes(term))
        && (!levelFilter || rule.levelId === levelFilter)
        && (!statusFilter || rule.status === statusFilter);
    });

    function resetFilters() {
      setKeyword("");
      setLevelFilter(undefined);
      setStatusFilter(undefined);
    }

    function openCreate() {
      setEditing({ id: null });
      setEffectiveType("立即生效");
      form.setFieldsValue({
        name: "",
        levelId: undefined,
        rates: zeroRates(),
        marketingRate: 0,
        selfCommission: false,
        settleCycle: "日结",
        settleCoin: "USDT",
        effectiveType: "立即生效",
        effectiveAt: undefined,
        remark: ""
      });
    }

    function openEdit(rule) {
      setEditing(rule);
      setEffectiveType(rule.effectiveType);
      form.setFieldsValue({
        name: rule.name,
        levelId: rule.levelId,
        rates: { ...zeroRates(), ...rule.rates },
        marketingRate: rule.marketingRate,
        selfCommission: rule.selfCommission,
        settleCycle: rule.settleCycle,
        settleCoin: rule.settleCoin,
        effectiveType: rule.effectiveType,
        effectiveAt: rule.effectiveType === "定时生效" && rule.effectiveAt && rule.effectiveAt !== "-"
          ? dayjs(rule.effectiveAt)
          : undefined,
        remark: rule.remark || ""
      });
    }

    function closeEditor() {
      setEditing(null);
      form.resetFields();
    }

    async function saveRule() {
      let values;
      try {
        values = await form.validateFields();
      } catch {
        return;
      }
      const isEditing = Boolean(editing.id);
      const level = levels.find(item => item.id === values.levelId);
      const now = dayjs().format("YYYY-MM-DD HH:mm");
      const payload = {
        name: values.name.trim(),
        levelId: values.levelId,
        levelName: level ? level.name : "-",
        rates: { ...zeroRates(), ...values.rates },
        marketingRate: values.marketingRate || 0,
        selfCommission: Boolean(values.selfCommission),
        settleCycle: values.settleCycle,
        settleCoin: values.settleCoin,
        effectiveType: values.effectiveType,
        effectiveAt: values.effectiveType === "定时生效"
          ? values.effectiveAt.format("YYYY-MM-DD HH:mm")
          : "-",
        remark: values.remark || "",
        updatedAt: now,
        operator: "Andy"
      };
      const commit = () => {
        setRules(list => isEditing
          ? list.map(item => (item.id === editing.id ? { ...item, ...payload } : item))
          : [...list, {
            id: `rule-${Date.now()}`,
            status: "停用",
            ...payload
          }]
        );
        message.success(isEditing
          ? `佣金规则「${payload.name}」已更新`
          : `佣金规则「${payload.name}」已创建，默认停用，启用后生效`);
        closeEditor();
      };
      const count = isEditing ? agentCountOf(editing.id) : 0;
      if (isEditing && count > 0) {
        confirmAction({
          title: "确认保存规则修改？",
          content: `该规则当前关联 ${count} 个代理，保存后新比例将应用于这些代理的后续佣金结算。`,
          okText: "确认保存",
          cancelText: "取消",
          onOk: commit
        });
        return;
      }
      commit();
    }

    function copyRule(rule) {
      const now = dayjs().format("YYYY-MM-DD HH:mm");
      setRules(list => [...list, {
        ...JSON.parse(JSON.stringify(rule)),
        id: `rule-${Date.now()}`,
        name: `${rule.name}-副本`,
        status: "停用",
        effectiveType: "立即生效",
        effectiveAt: "-",
        updatedAt: now,
        operator: "Andy"
      }]);
      message.success(`已复制为「${rule.name}-副本」，新规则默认停用`);
    }

    function toggleRuleStatus(rule, next) {
      const apply = () => {
        setRules(list => list.map(item => (
          item.id === rule.id ? { ...item, status: next ? "启用" : "停用", updatedAt: dayjs().format("YYYY-MM-DD HH:mm"), operator: "Andy" } : item
        )));
        message.success(`规则「${rule.name}」已${next ? "启用" : "停用"}`);
      };
      if (next) {
        apply();
        return;
      }
      const count = agentCountOf(rule.id);
      if (count > 0) {
        confirmAction({
          title: "确认停用该佣金规则？",
          content: `该规则当前关联 ${count} 个代理，停用后这些代理将暂停分佣结算。`,
          okText: "确认停用",
          cancelText: "取消",
          onOk: apply
        });
        return;
      }
      apply();
    }

    function deleteRule(rule) {
      const count = agentCountOf(rule.id);
      if (count > 0) {
        message.warning(`该规则关联 ${count} 个代理，无法删除`);
        return;
      }
      const levelNames = levelNamesUsing(rule.id);
      if (levelNames.length) {
        message.warning(`等级「${levelNames.join("、")}」正在引用该规则，无法删除`);
        return;
      }
      confirmAction({
        title: `确认删除佣金规则「${rule.name}」？`,
        content: "删除后不可恢复。",
        okText: "删除",
        okButtonProps: { danger: true },
        cancelText: "取消",
        onOk: () => {
          setRules(list => list.filter(item => item.id !== rule.id));
          message.success(`佣金规则「${rule.name}」已删除`);
        }
      });
    }

    function renderRateCell(record, kind) {
      const rates = record.rates || zeroRates();
      const prefix = kind === "contract" ? "contract" : "spot";
      return e("div", { className: "level-upgrade-cell" }, [
        e("span", { key: "main" }, `${rates[prefix]}%`),
        e("span", { key: "sub", className: "config-sub-line" },
          `Trader ${rates[`${prefix}Trader`]}% · API ${rates[`${prefix}Api`]}% · T&A ${rates[`${prefix}TraderApi`]}%`)
      ]);
    }

    const columns = [
      { title: "规则ID", dataIndex: "id", width: 80 },
      { title: "规则名称", dataIndex: "name", width: 120, render: value => e("strong", null, value) },
      {
        title: "关联等级",
        dataIndex: "levelName",
        width: 110,
        render: (value, record) => {
          const level = levels.find(item => item.id === record.levelId);
          return e(Tag, { color: level ? level.color : undefined }, value);
        }
      },
      { title: "合约返佣", key: "contract", width: 190, render: (_, record) => renderRateCell(record, "contract") },
      { title: "现货返佣", key: "spot", width: 180, render: (_, record) => renderRateCell(record, "spot") },
      { title: "营销激励", dataIndex: "marketingRate", width: 90, render: value => `${value}%` },
      {
        title: "自返佣",
        dataIndex: "selfCommission",
        width: 90,
        render: value => (value ? e(Tag, { color: "green" }, "允许") : e(Tag, null, "禁止"))
      },
      {
        title: "结算",
        key: "settle",
        width: 120,
        render: (_, record) => `${record.settleCycle} · ${record.settleCoin}`
      },
      {
        title: "生效时间",
        key: "effective",
        width: 150,
        render: (_, record) => (record.effectiveType === "定时生效" ? record.effectiveAt : "立即生效")
      },
      {
        title: "关联代理数",
        key: "agentCount",
        width: 100,
        render: (_, record) => e(Button, {
          type: "link",
          size: "small",
          onClick: () => setRelatedRule(record)
        }, String(agentCountOf(record.id)))
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 80,
        render: value => e(Tag, { color: value === "启用" ? "green" : "default" }, value)
      },
      { title: "更新时间", dataIndex: "updatedAt", width: 150 },
      { title: "操作人", dataIndex: "operator", width: 90 },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 250,
        render: (_, record) => e(Space, { size: 0, wrap: true }, [
          e(Button, { key: "edit", type: "link", size: "small", onClick: () => openEdit(record) }, "编辑"),
          e(Button, { key: "copy", type: "link", size: "small", onClick: () => copyRule(record) }, "复制"),
          e(Button, {
            key: "toggle",
            type: "link",
            size: "small",
            onClick: () => toggleRuleStatus(record, record.status !== "启用")
          }, record.status === "启用" ? "停用" : "启用"),
          e(Button, {
            key: "delete",
            type: "link",
            size: "small",
            danger: true,
            onClick: () => deleteRule(record)
          }, "删除")
        ])
      }
    ];

    const relatedColumns = [
      { title: "用户ID", dataIndex: "userId", width: 120 },
      { title: "代理ID", dataIndex: "agentId", width: 80 },
      { title: "代理等级", dataIndex: "level", width: 100, render: value => e(Tag, { color: "blue" }, value) },
      { title: "分佣状态", dataIndex: "commissionStatus", width: 100, render: value => e(Tag, { color: "green" }, value) },
      {
        title: "自返佣",
        dataIndex: "selfCommissionEnabled",
        width: 90,
        render: value => (value ? e(Tag, { color: "green" }, "已开启") : e(Text, { type: "secondary" }, "未开启"))
      },
      { title: "成为代理时间", dataIndex: "createdAt", width: 170 }
    ];

    const relatedAgents = relatedRule ? relatedAgentsOf(relatedRule.id) : [];

    return e("section", { className: "page-surface commission-page" }, [
      e("div", { className: "toolbar config-toolbar", key: "toolbar" }, [
        e("div", { className: "config-filter-row", key: "filters" }, [
          e("label", { className: "config-filter-item", key: "keyword" }, [
            e("span", null, "规则名称/ID："),
            e(Input, {
              value: keyword,
              onChange: event => setKeyword(event.target.value),
              placeholder: "请输入规则名称或ID",
              allowClear: true
            })
          ]),
          e("label", { className: "config-filter-item", key: "level" }, [
            e("span", null, "关联等级："),
            e(Select, {
              value: levelFilter,
              onChange: setLevelFilter,
              placeholder: "全部等级",
              allowClear: true,
              className: "select-input",
              options: levels.map(level => ({ value: level.id, label: level.name }))
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
        e(Button, { key: "add", type: "primary", onClick: openCreate }, "新增佣金规则")
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: visibleRules,
        pagination: { pageSize: 6, showSizeChanger: true },
        scroll: { x: 2000 }
      }),
      e(Modal, {
        key: "editor",
        title: editing?.id ? `编辑佣金规则「${editing.name}」` : "新增佣金规则",
        open: Boolean(editing),
        onCancel: closeEditor,
        onOk: saveRule,
        okText: "保存",
        cancelText: "取消",
        width: 820,
        destroyOnClose: true
      }, editing && e(Form, {
        form,
        layout: "vertical",
        requiredMark: "optional",
        onValuesChange: changed => {
          if (changed.effectiveType) setEffectiveType(changed.effectiveType);
        }
      }, [
        e(Row, { key: "base", gutter: 16 }, [
          e(Col, { span: 12, key: "name" }, e(Form.Item, {
            label: "规则名称",
            name: "name",
            rules: [
              { required: true, message: "请输入规则名称" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const duplicated = rules.some(rule => (
                    rule.name === value.trim() && rule.id !== editing.id
                  ));
                  return duplicated
                    ? Promise.reject(new Error("规则名称已存在"))
                    : Promise.resolve();
                }
              }
            ]
          }, e(Input, { maxLength: 30, placeholder: "如 V4-活动版" }))),
          e(Col, { span: 12, key: "level" }, e(Form.Item, {
            label: "关联代理等级",
            name: "levelId",
            rules: [{ required: true, message: "请选择关联代理等级" }]
          }, e(Select, {
            placeholder: "请选择代理等级",
            options: levels.map(level => ({
              value: level.id,
              label: `${level.name}（${level.status}）`
            }))
          })))
        ]),
        e("div", { className: "form-section-title", key: "rate-title" }, "品种返佣比例"),
        e("div", { className: "commission-rate-wrap", key: "rate-matrix" }, [
          ...["合约", "现货"].map(group => e("div", { className: "commission-rate-group", key: group }, [
            e("div", { className: "commission-rate-group-title", key: "title" },
              group === "合约" ? "合约（U 本位 / 币本位）" : "现货"),
            e("div", { className: "commission-rate-grid", key: "grid" },
              rateRows.filter(row => row.group === group).map(row => e("div", { className: "commission-rate-item", key: row.key }, [
                e("span", { key: "label" }, row.label),
                e(Form.Item, { key: "input", name: ["rates", row.key], noStyle: true }, e(InputNumber, {
                  min: 0,
                  max: 100,
                  style: { width: 120 },
                  formatter: percentInput,
                  parser: percentParse
                }))
              ])))
          ])),
          e(Text, { type: "secondary", key: "hint" }, "子渠道比例为 0 时，按对应品种「全部」比例执行。")
        ]),
        e("div", { className: "form-section-title", key: "settle-title" }, "结算与生效"),
        e(Row, { key: "settle", gutter: 16 }, [
          e(Col, { span: 8, key: "marketing" }, e(Form.Item, {
            label: "营销激励比例（%）",
            name: "marketingRate"
          }, e(InputNumber, {
            min: 0,
            max: 100,
            style: { width: "100%" },
            formatter: percentInput,
            parser: percentParse
          }))),
          e(Col, { span: 8, key: "cycle" }, e(Form.Item, {
            label: "结算周期",
            name: "settleCycle",
            rules: [{ required: true, message: "请选择结算周期" }]
          }, e(Select, {
            options: ["日结", "周结", "月结"].map(value => ({ value, label: value }))
          }))),
          e(Col, { span: 8, key: "coin" }, e(Form.Item, {
            label: "结算币种",
            name: "settleCoin",
            rules: [{ required: true, message: "请选择结算币种" }]
          }, e(Select, {
            options: ["USDT", "USD"].map(value => ({ value, label: value }))
          })))
        ]),
        e(Form.Item, {
          key: "self",
          label: "允许自返佣",
          name: "selfCommission",
          valuePropName: "checked",
          extra: "开启后，使用该规则的代理自有交易同样按规则计算返佣"
        }, e(Radio.Group, {
          options: [
            { value: true, label: "允许" },
            { value: false, label: "禁止" }
          ]
        })),
        e(Form.Item, { key: "effective", label: "生效方式", name: "effectiveType" }, e(Radio.Group, {
          options: [
            { value: "立即生效", label: "立即生效" },
            { value: "定时生效", label: "定时生效" }
          ]
        })),
        effectiveType === "定时生效" ? e(Form.Item, {
          key: "effectiveAt",
          label: "生效时间",
          name: "effectiveAt",
          rules: [{ required: true, message: "请选择生效时间" }]
        }, e(DatePicker, {
          showTime: { format: "HH:mm" },
          format: "YYYY-MM-DD HH:mm",
          style: { width: "100%" }
        })) : null,
        e(Form.Item, { key: "remark", label: "备注", name: "remark" }, e(Input.TextArea, {
          rows: 2,
          maxLength: 100,
          placeholder: "选填"
        }))
      ])),
      e(Drawer, {
        key: "related",
        title: relatedRule ? `佣金规则「${relatedRule.name}」关联代理` : "",
        open: Boolean(relatedRule),
        onClose: () => setRelatedRule(null),
        width: 760
      }, relatedRule && [
        e(Text, { type: "secondary", key: "hint" }, `共 ${relatedAgents.length} 个代理正在使用该规则。`),
        e(Table, {
          key: "table",
          rowKey: "id",
          size: "small",
          columns: relatedColumns,
          dataSource: relatedAgents,
          pagination: false
        })
      ])
    ]);
  }

  app.CommissionPage = CommissionPage;
})(window.AdminApp);

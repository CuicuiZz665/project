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
  const { ListActions } = app.sharedActions;

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

  const percentInput = value => (value === null || value === undefined || value === "" ? "" : `${value}%`);
  const percentParse = value => value.replace("%", "");

  const emptySymbolFilter = () => ({ code: null, listed: null });
  const rateText = value => `${value}%`;
  const feeText = (margin, rate) => `${parseFloat((margin * rate / 100).toFixed(6))}元`;

  function CommissionPage({ rules, setRules, levels, agents }) {
    const [keyword, setKeyword] = React.useState();
    const [levelFilter, setLevelFilter] = React.useState();
    const [effectiveFilter, setEffectiveFilter] = React.useState();
    const [auditFilter, setAuditFilter] = React.useState();
    const [editing, setEditing] = React.useState(null);
    const [viewing, setViewing] = React.useState(null);
    const [effectiveType, setEffectiveType] = React.useState("立即生效");
    const [creating, setCreating] = React.useState(false);
    const [symbolDraft, setSymbolDraft] = React.useState(emptySymbolFilter);
    const [symbolFilter, setSymbolFilter] = React.useState(emptySymbolFilter);
    const [symbolRateDraft, setSymbolRateDraft] = React.useState({});
    const [fillRate, setFillRate] = React.useState();
    const [form] = Form.useForm();

    function agentCountOf(ruleId) {
      return agents.filter(agent => String(agent.commissionRuleId) === String(ruleId)).length;
    }

    const visibleRules = rules.filter(rule => {
      return (!keyword || rule.name === keyword)
        && (!levelFilter || rule.levelId === levelFilter)
        && (!effectiveFilter || rule.status === effectiveFilter)
        && (!auditFilter || rule.auditStatus === auditFilter);
    });

    function resetFilters() {
      setKeyword(undefined);
      setLevelFilter(undefined);
      setEffectiveFilter(undefined);
      setAuditFilter(undefined);
    }

    function openCreate() {
      setSymbolDraft(emptySymbolFilter());
      setSymbolFilter(emptySymbolFilter());
      setSymbolRateDraft({});
      setFillRate(undefined);
      form.setFieldsValue({
        name: "",
        floorRate: undefined,
        marketingRate: undefined
      });
      setCreating(true);
    }

    function backToList() {
      setCreating(false);
      form.resetFields();
    }

    async function submitCreate() {
      let values;
      try {
        values = await form.validateFields();
      } catch {
        return;
      }
      const name = String(values.name || "").trim();
      if (rules.some(rule => rule.name === name)) {
        message.error(`佣金规则名称「${name}」已存在`);
        return;
      }
      const symbols = app.mockData.commissionSymbols || [];
      setRules(list => [...list, {
        id: `rule-${Date.now()}`,
        name,
        levelId: undefined,
        levelName: "-",
        status: "停用",
        rates: zeroRates(),
        floorRate: values.floorRate ?? 0,
        marketingRate: values.marketingRate || 0,
        symbolRates: symbols.map(item => ({
          code: item.code,
          rate: symbolRateDraft[item.code] ?? null
        })),
        settleCycle: "日结",
        settleCoin: "CNY",
        effectiveType: "立即生效",
        effectiveAt: "-",
        remark: "",
        auditStatus: "待审核",
        approvedAt: "-",
        createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm"),
        operator: "Andy"
      }]);
      message.success(`佣金规则「${name}」已创建，默认停用，启用后生效`);
      backToList();
    }

    function openEdit(rule) {
      setEditing(rule);
      setEffectiveType(rule.effectiveType);
      form.setFieldsValue({
        name: rule.name,
        levelId: rule.levelId,
        rates: { ...zeroRates(), ...rule.rates },
        marketingRate: rule.marketingRate,
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
            auditStatus: "待审核",
            approvedAt: "-",
            createdAt: now,
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
        auditStatus: "待审核",
        approvedAt: "-",
        createdAt: now,
        effectiveType: "立即生效",
        effectiveAt: "-",
        updatedAt: now,
        operator: "Andy"
      }]);
      message.success(`已复制为「${rule.name}-副本」，新规则默认停用`);
    }

    function viewRule(rule) {
      setViewing(rule);
    }

    function closeView() {
      setViewing(null);
    }

    function renderCreatePage() {
      const symbols = app.mockData.commissionSymbols || [];
      const listedFilter = symbolFilter.listed === null || symbolFilter.listed === undefined
        ? null
        : Boolean(symbolFilter.listed);
      const visibleSymbols = symbols.filter(item => (
        (!symbolFilter.code || item.code === symbolFilter.code)
        && (listedFilter === null || item.listed === listedFilter)
      ));
      const symbolRows = visibleSymbols.map(item => ({
        key: item.code,
        code: item.code,
        name: item.name,
        margin: item.margin,
        listed: item.listed,
        feeRate: item.feeRate
      }));
      const estimateText = record => {
        const rate = symbolRateDraft[record.code];
        if (rate === undefined || rate === null || rate === "") {
          return e("span", { className: "symbol-off-text" }, "-");
        }
        const fee = record.margin * record.feeRate / 100;
        return feeText(fee, rate);
      };
      const symbolColumns = [
        { title: "品种代码", dataIndex: "code", width: 130 },
        { title: "品种名称", dataIndex: "name", width: 130 },
        { title: "持仓量(Margin * 杠杆)", dataIndex: "margin", width: 180, render: value => `${value}元` },
        {
          title: "上/下架状态",
          key: "listed",
          width: 120,
          render: (_, record) => (record.listed
            ? e(Tag, { color: "green" }, "上架")
            : e("span", { className: "symbol-off-text" }, "下架"))
        },
        { title: "费率", dataIndex: "feeRate", width: 100, render: rateText },
        { title: "预计分佣金额", key: "estimate", width: 140, render: (_, record) => estimateText(record) },
        {
          title: "分佣比例",
          key: "rate",
          width: 170,
          render: (_, record) => e(InputNumber, {
            min: 0,
            max: 100,
            size: "small",
            style: { width: 150 },
            placeholder: "请输入分佣比例",
            formatter: percentInput,
            parser: percentParse,
            value: symbolRateDraft[record.code],
            onChange: value => setSymbolRateDraft(prev => ({ ...prev, [record.code]: value }))
          })
        }
      ];
      const baseItem = (label, name, key) => e(Form.Item, {
        key,
        label,
        name,
        colon: false,
        style: { marginBottom: 0 },
        rules: [{ required: true, message: `请输入${label}` }]
      }, e(InputNumber, {
        min: 0,
        max: 100,
        style: { width: 220 },
        placeholder: `请输入${label}`,
        formatter: percentInput,
        parser: percentParse
      }));

      return e("section", { className: "page-surface commission-create-page" }, [
        e("div", { className: "commission-create-head", key: "head" }, [
          e("span", { className: "commission-create-title", key: "title" }, "新增佣金规则"),
          e(Space, { key: "actions" }, [
            e(Button, { key: "back", onClick: backToList }, "返 回"),
            e(Button, { key: "submit", type: "primary", onClick: submitCreate }, "创 建")
          ])
        ]),
        e(Form, {
          form,
          key: "body",
          className: "commission-create-body",
          layout: "horizontal",
          colon: false,
          labelCol: { flex: "0 0 auto" },
          wrapperCol: { flex: "1" }
        }, [
          e("div", { className: "commission-create-base", key: "base" }, [
            e(Form.Item, {
              key: "name",
              label: "佣金规则名称",
              name: "name",
              colon: false,
              style: { marginBottom: 0 },
              rules: [{ required: true, message: "请输入佣金规则名称" }]
            }, e(Input, { style: { width: 220 }, placeholder: "请输入佣金规则名称" })),
            baseItem("保底分佣比例", "floorRate", "floor"),
            baseItem("营销激励比例", "marketingRate", "marketing")
          ]),
          e("div", { className: "commission-create-section", key: "symbols" }, [
            e("span", { className: "commission-create-section-title", key: "symbol-title" }, "品种佣金明细"),
            e("div", { className: "config-filter-row", key: "symbol-filters" }, [
              e("label", { className: "config-filter-item", key: "code" }, [
                e("span", null, "品种代码"),
                e(Select, {
                  value: symbolDraft.code,
                  onChange: value => setSymbolDraft(prev => ({ ...prev, code: value })),
                  placeholder: "请选择品种代码",
                  allowClear: true,
                  showSearch: true,
                  optionFilterProp: "label",
                  className: "keyword-select",
                  options: symbols.map(item => ({ value: item.code, label: item.code }))
                })
              ]),
              e("label", { className: "config-filter-item", key: "listed" }, [
                e("span", null, "上/下架状态"),
                e(Select, {
                  value: symbolDraft.listed,
                  onChange: value => setSymbolDraft(prev => ({ ...prev, listed: value === undefined ? null : value })),
                  placeholder: "请选择上/下架状态",
                  allowClear: true,
                  className: "select-input",
                  options: [{ value: true, label: "上架" }, { value: false, label: "下架" }]
                })
              ]),
              e(ListActions, {
                key: "buttons",
                onQuery: () => setSymbolFilter({ ...symbolDraft }),
                onReset: () => {
                  setSymbolDraft(emptySymbolFilter());
                  setSymbolFilter(emptySymbolFilter());
                }
              }),
              e(Space, { key: "fill", size: 8, style: { marginLeft: "auto" } }, [
                e(InputNumber, {
                  key: "input",
                  min: 0,
                  max: 100,
                  style: { width: 130 },
                  placeholder: "如 80",
                  formatter: percentInput,
                  parser: percentParse,
                  value: fillRate,
                  onChange: setFillRate
                }),
                e(Button, {
                  key: "apply",
                  onClick: () => {
                    if (fillRate === undefined || fillRate === null || fillRate === "") {
                      message.warning("请先输入要填充的分佣比例");
                      return;
                    }
                    const codes = symbols.map(item => item.code);
                    setSymbolRateDraft(prev => {
                      const next = { ...prev };
                      codes.forEach(code => { next[code] = fillRate; });
                      return next;
                    });
                    message.success(`已为全部 ${codes.length} 个品种统一填充分佣比例 ${fillRate}%`);
                  }
                }, "一键填充")
              ])
            ]),
            e(Table, {
              key: "symbol-table",
              rowKey: "key",
              columns: symbolColumns,
              dataSource: symbolRows,
              pagination: false,
              scroll: { x: 980 },
              locale: { emptyText: "暂无数据" }
            })
          ])
        ])
      ]);
    }

    const columns = [
      { title: "佣金规则名称", dataIndex: "name", width: 140, render: value => e("strong", null, value) },
      {
        title: "关联等级",
        dataIndex: "levelName",
        width: 110,
        render: (value, record) => {
          const level = levels.find(item => item.id === record.levelId);
          return e(Tag, { color: level ? level.color : undefined }, value);
        }
      },
      { title: "保底佣金比例", dataIndex: "floorRate", width: 110, render: value => `${value ?? 0}%` },
      { title: "营销激励", dataIndex: "marketingRate", width: 90, render: value => `${value}%` },
      {
        title: "审核状态",
        dataIndex: "auditStatus",
        width: 100,
        render: value => e(Tag, {
          color: value === "已通过" ? "green" : value === "待审核" ? "gold" : "red"
        }, value || "-")
      },
      {
        title: "生效状态",
        dataIndex: "status",
        width: 90,
        render: value => e(Tag, { color: value === "启用" ? "green" : "default" }, value)
      },
      { title: "创建时间(GMT+8)", dataIndex: "createdAt", width: 170 },
      { title: "审核通过时间", dataIndex: "approvedAt", width: 160, render: value => value || "-" },
      { title: "操作人", dataIndex: "operator", width: 90 },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 160,
        render: (_, record) => e(Space, { size: 0, wrap: true }, [
          e(Button, { key: "view", type: "link", size: "small", onClick: () => viewRule(record) }, "查看"),
          e(Button, { key: "copy", type: "link", size: "small", onClick: () => copyRule(record) }, "复制"),
          e(Button, { key: "edit", type: "link", size: "small", onClick: () => openEdit(record) }, "修改")
        ])
      }
    ];

    if (creating) return renderCreatePage();

    return e("section", { className: "page-surface commission-page" }, [
      e("div", { className: "toolbar config-toolbar", key: "toolbar" }, [
        e("div", { className: "config-filter-row", key: "filters" }, [
          e("label", { className: "config-filter-item", key: "keyword" }, [
            e("span", null, "佣金规则名称："),
            e(Select, {
              value: keyword,
              onChange: setKeyword,
              placeholder: "请输入佣金规则名称",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: rules.map(rule => ({ value: rule.name, label: rule.name }))
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
          e("label", { className: "config-filter-item", key: "effective" }, [
            e("span", null, "生效状态："),
            e(Select, {
              value: effectiveFilter,
              onChange: setEffectiveFilter,
              placeholder: "全部生效状态",
              allowClear: true,
              className: "select-input",
              options: ["启用", "停用"].map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "config-filter-item", key: "audit" }, [
            e("span", null, "审核状态："),
            e(Select, {
              value: auditFilter,
              onChange: setAuditFilter,
              placeholder: "全部审核状态",
              allowClear: true,
              className: "select-input",
              options: ["已通过", "待审核", "已拒绝"].map(value => ({ value, label: value }))
            })
          ]),
          e(ListActions, {
            key: "buttons",
            onReset: resetFilters,
            trailing: [
              e(Button, { key: "add", type: "primary", onClick: openCreate }, "新增佣金规则")
            ]
          })
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: visibleRules,
        pagination: { pageSize: 6, showSizeChanger: true },
        scroll: { x: 1240 }
      }),
      e(Modal, {
        key: "editor",
        title: editing?.id ? `修改佣金规则「${editing.name}」` : "新增佣金规则",
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
            label: "佣金规则名称",
            name: "name",
            rules: [
              { required: true, message: "请输入佣金规则名称" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const duplicated = rules.some(rule => (
                    rule.name === value.trim() && rule.id !== editing.id
                  ));
                  return duplicated
                    ? Promise.reject(new Error("佣金规则名称已存在"))
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
            options: ["CNY"].map(value => ({ value, label: value }))
          })))
        ]),
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
        key: "viewer",
        title: viewing ? `佣金规则详情「${viewing.name}」` : "佣金规则详情",
        open: Boolean(viewing),
        onClose: closeView,
        width: 560,
        destroyOnClose: true
      }, viewing && [
        e("dl", { className: "customer-detail-list", key: "base" }, [
          e("div", { className: "customer-detail-row", key: "name" }, [
            e("dt", null, "佣金规则名称"),
            e("dd", null, e("strong", null, viewing.name))
          ]),
          e("div", { className: "customer-detail-row", key: "level" }, [
            e("dt", null, "关联等级"),
            e("dd", null, e(Tag, {
              color: (levels.find(item => item.id === viewing.levelId) || {}).color
            }, viewing.levelName || "-"))
          ]),
          e("div", { className: "customer-detail-row", key: "floor" }, [
            e("dt", null, "保底佣金比例"),
            e("dd", null, `${viewing.floorRate ?? 0}%`)
          ]),
          e("div", { className: "customer-detail-row", key: "marketing" }, [
            e("dt", null, "营销激励"),
            e("dd", null, `${viewing.marketingRate ?? 0}%`)
          ]),
          e("div", { className: "customer-detail-row", key: "status" }, [
            e("dt", null, "生效状态"),
            e("dd", null, e(Tag, { color: viewing.status === "启用" ? "green" : "default" }, viewing.status))
          ]),
          e("div", { className: "customer-detail-row", key: "audit" }, [
            e("dt", null, "审核状态"),
            e("dd", null, e(Tag, {
              color: viewing.auditStatus === "已通过" ? "green" : viewing.auditStatus === "待审核" ? "gold" : "red"
            }, viewing.auditStatus || "-"))
          ]),
          e("div", { className: "customer-detail-row", key: "cycle" }, [
            e("dt", null, "结算周期"),
            e("dd", null, viewing.settleCycle || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "coin" }, [
            e("dt", null, "结算币种"),
            e("dd", null, viewing.settleCoin || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "effectiveType" }, [
            e("dt", null, "生效方式"),
            e("dd", null, viewing.effectiveType || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "effectiveAt" }, [
            e("dt", null, "生效时间"),
            e("dd", null, viewing.effectiveAt || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "createdAt" }, [
            e("dt", null, "创建时间"),
            e("dd", null, viewing.createdAt || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "approvedAt" }, [
            e("dt", null, "审核通过时间"),
            e("dd", null, viewing.approvedAt || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "updatedAt" }, [
            e("dt", null, "更新时间"),
            e("dd", null, viewing.updatedAt || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "operator" }, [
            e("dt", null, "操作人"),
            e("dd", null, viewing.operator || "-")
          ]),
          e("div", { className: "customer-detail-row", key: "remark" }, [
            e("dt", null, "备注"),
            e("dd", null, viewing.remark || "-")
          ])
        ]),
        e("div", { className: "form-section-title", key: "rate-title" }, "品种返佣比例"),
        e("div", { className: "commission-rate-wrap", key: "rate-matrix" },
          ...["合约", "现货"].map(group => e("div", { className: "commission-rate-group", key: group }, [
            e("div", { className: "commission-rate-group-title", key: "title" },
              group === "合约" ? "合约（U 本位 / 币本位）" : "现货"),
            e("div", { className: "commission-rate-grid", key: "grid" },
              rateRows.filter(row => row.group === group).map(row => e("div", { className: "commission-rate-item", key: row.key }, [
                e("span", { key: "label" }, row.label),
                e("span", { key: "value", className: "commission-rate-view-value" },
                  `${(viewing.rates && viewing.rates[row.key]) ?? 0}%`)
              ])))
          ])))
      ])
    ]);
  }

  app.CommissionPage = CommissionPage;
})(window.AdminApp);

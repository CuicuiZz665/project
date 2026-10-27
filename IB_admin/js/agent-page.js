(function registerAgentPage(app) {
  const {
    Button,
    Drawer,
    Input,
    Modal,
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
  const { ListActions, ColumnSettingsTrigger } = app.sharedActions;

  function AgentPage({ agents = [] }) {
    const [userIdFilter, setUserIdFilter] = React.useState();
    const [agentIdFilter, setAgentIdFilter] = React.useState();
    const [parentAgentIdFilter, setParentAgentIdFilter] = React.useState();
    const [level, setLevel] = React.useState();
    const [userTypeFilter, setUserTypeFilter] = React.useState();
    const [commissionStatusFilter, setCommissionStatusFilter] = React.useState();
    const [protectionFilter, setProtectionFilter] = React.useState();
    const [moreFiltersOpen, setMoreFiltersOpen] = React.useState(false);
    const [structureAgent, setStructureAgent] = React.useState(null);
    const [detailAgent, setDetailAgent] = React.useState(null);
    const [selectedAgentIds, setSelectedAgentIds] = React.useState([]);
    const [parentByAgent, setParentByAgent] = React.useState({});
    const [transferOpen, setTransferOpen] = React.useState(false);
    const [transferPassport, setTransferPassport] = React.useState("");
    const [transferTargetPassport, setTransferTargetPassport] = React.useState("");
    const [selfCommissionByAgent, setSelfCommissionByAgent] = React.useState(() => (
      Object.fromEntries(agents.map(agent => [agent.id, Boolean(agent.selfCommissionEnabled)]))
    ));

    const parentOf = agent => parentByAgent[agent.id] ?? agent.parentAgentId;

    const userIdOptions = React.useMemo(
      () => [...new Set(agents.map(agent => agent.userId))].sort(),
      [agents]
    );
    const agentIdOptions = React.useMemo(
      () => [...new Set(agents.map(agent => String(agent.agentId)))].sort(),
      [agents]
    );
    const parentAgentIdOptions = React.useMemo(
      () => [...new Set(agents.map(agent => String(parentOf(agent))))]
        .filter(value => value && value !== "-")
        .sort(),
      [agents, parentByAgent]
    );

    const filteredAgents = React.useMemo(() => {
      return agents.filter(agent => {
        const userIdMatched = !userIdFilter || agent.userId === userIdFilter;
        const agentIdMatched = !agentIdFilter || String(agent.agentId) === agentIdFilter;
        const parentAgentIdMatched = !parentAgentIdFilter
          || String(parentOf(agent)) === parentAgentIdFilter;
        const userTypeMatched = !userTypeFilter || agent.userType === userTypeFilter;
        const commissionStatusMatched = !commissionStatusFilter
          || agent.commissionStatus === commissionStatusFilter;
        const protectionMatched = !protectionFilter || agent.protection === protectionFilter;
        return userIdMatched && agentIdMatched && parentAgentIdMatched
          && (!level || agent.level.includes(level)) && userTypeMatched
          && commissionStatusMatched && protectionMatched;
      });
    }, [agents, userIdFilter, agentIdFilter, parentAgentIdFilter, level, userTypeFilter, commissionStatusFilter, protectionFilter, parentByAgent]);

    function updateSelfCommission(agent, nextValue) {
      const save = () => {
        setSelfCommissionByAgent(current => ({ ...current, [agent.id]: nextValue }));
        message.success(`UserID ${agent.userId} 的自返佣已${nextValue ? "开启" : "关闭"}`);
      };
      if (!nextValue) {
        save();
        return;
      }
      const confirmRef = Modal.confirm({
        title: "确认开启自返佣？",
        content: `开启后，代理商 UserID ${agent.userId} 的自有交易可按当前佣金规则获得返佣。`,
        okText: "确认开启",
        cancelText: "取消",
        onOk: () => {
          save();
          confirmRef.destroy();
        },
        onCancel: () => confirmRef.destroy()
      });
    }

    function openTransfer() {
      setTransferPassport("");
      setTransferTargetPassport("");
      setTransferOpen(true);
    }

    function confirmTransfer() {
      const passport = transferPassport.trim();
      const targetPassport = transferTargetPassport.trim();
      if (!passport) {
        message.error("请输入客户通行证");
        return;
      }
      if (!targetPassport) {
        message.error("请输入目标代理通行证");
        return;
      }
      setTransferOpen(false);
      message.success(`客户 ${passport} 已划转至目标代理 ${targetPassport}`);
    }

    const columns = [
      {
        title: "用户ID",
        dataIndex: "userId",
        width: 150,
        render: (value, record) => e(Button, {
          type: "link",
          size: "small",
          onClick: () => setDetailAgent(record)
        }, value)
      },
      { title: "佣金规则名称", dataIndex: "commissionRuleName", width: 140 },
      {
        title: "代理等级",
        dataIndex: "level",
        width: 150,
        render: value => e(Tag, { color: "blue" }, value)
      },
      {
        title: "上级代理ID",
        width: 140,
        render: (_, record) => {
          const parent = parentOf(record);
          return parent && parent !== "-" ? parent : e(Text, { type: "secondary" }, "-");
        }
      },
      { title: "用户类型", dataIndex: "userType", width: 130 },
      { title: "佣金规则ID", dataIndex: "commissionRuleId", width: 110 },
      {
        title: "分佣状态",
        dataIndex: "commissionStatus",
        width: 120,
        render: value => e(Tag, { color: "green" }, value)
      },
      { title: "等级保护", dataIndex: "protection", width: 120 },
      { title: "成为代理时间", dataIndex: "createdAt", width: 170 },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 270,
        render: (_, record) => e(Space, { size: 2, wrap: true }, [
          e(Button, {
            key: "structure",
            type: "link",
            size: "small",
            onClick: () => setStructureAgent(record)
          }, "查看结构"),
          e(Button, { key: "level", type: "link", size: "small" }, "修改等级"),
          e(Switch, {
            key: "switch",
            size: "small",
            checked: Boolean(selfCommissionByAgent[record.id]),
            checkedChildren: "自反",
            unCheckedChildren: "自反",
            onChange: value => updateSelfCommission(record, value)
          })
        ])
      }
    ];

    return e("section", { className: "page-surface agent-page" }, [
      e("div", { className: "toolbar agent-toolbar", key: "toolbar" }, [
        e("div", { className: "agent-filter-row", key: "filter-row" }, [
          e("label", { className: "agent-filter-item", key: "user" }, [
            e("span", null, "用户ID："),
            e(Select, {
              value: userIdFilter,
              onChange: setUserIdFilter,
              placeholder: "请输入用户ID",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: userIdOptions.map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "agent-filter-item", key: "agent" }, [
            e("span", null, "代理ID："),
            e(Select, {
              value: agentIdFilter,
              onChange: setAgentIdFilter,
              placeholder: "请输入代理ID",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: agentIdOptions.map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "agent-filter-item", key: "parent" }, [
            e("span", null, "上级代理ID："),
            e(Select, {
              value: parentAgentIdFilter,
              onChange: setParentAgentIdFilter,
              placeholder: "请输入上级代理ID",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: parentAgentIdOptions.map(value => ({ value, label: value }))
            })
          ]),
          e(Button, {
            key: "more",
            type: "link",
            className: "agent-more-filter",
            onClick: () => setMoreFiltersOpen(value => !value)
          }, "更多筛选"),
          e(ListActions, {
            key: "query",
            onReset: () => {
              setUserIdFilter(undefined);
              setAgentIdFilter(undefined);
              setParentAgentIdFilter(undefined);
              setLevel(undefined);
              setUserTypeFilter(undefined);
              setCommissionStatusFilter(undefined);
              setProtectionFilter(undefined);
              setMoreFiltersOpen(false);
            }
          })
        ]),
        moreFiltersOpen && e("div", { className: "agent-more-filter-row", key: "more-row" }, [
          e("label", { className: "agent-filter-item", key: "level" }, [
            e("span", null, "代理等级："),
            e(Select, {
              value: level,
              onChange: setLevel,
              placeholder: "请选择代理等级",
              allowClear: true,
              className: "select-input",
              options: ["V1", "V3", "V4", "V6"].map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "agent-filter-item", key: "user-type" }, [
            e("span", null, "用户类型："),
            e(Select, {
              value: userTypeFilter,
              onChange: setUserTypeFilter,
              placeholder: "请选择用户类型",
              allowClear: true,
              className: "select-input",
              options: ["Partner", "Sub Partner"].map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "agent-filter-item", key: "commission-status" }, [
            e("span", null, "分佣状态："),
            e(Select, {
              value: commissionStatusFilter,
              onChange: setCommissionStatusFilter,
              placeholder: "请选择分佣状态",
              allowClear: true,
              className: "select-input",
              options: ["已分佣", "未分佣"].map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "agent-filter-item", key: "protection" }, [
            e("span", null, "保护期状态："),
            e(Select, {
              value: protectionFilter,
              onChange: setProtectionFilter,
              placeholder: "请选择保护期状态",
              allowClear: true,
              className: "select-input",
              options: ["保护期内", "非保护期"].map(value => ({ value, label: value }))
            })
          ])
        ]),
        e("div", { className: "agent-action-row", key: "actions" }, [
          e(Space, { key: "operations", size: 8, wrap: true }, [
            e(Button, { type: "primary", key: "protect" }, "批量保护"),
            e(Button, { key: "unprotect" }, "批量取消"),
            e(Button, {
              key: "transfer",
              onClick: openTransfer
            }, selectedAgentIds.length ? `划转代理(${selectedAgentIds.length})` : "划转代理"),
            e(Button, { key: "export", onClick: () => message.success("代理商列表已导出") }, "导出"),
            e(Space, { key: "add", size: 0 }, [
              e(Input, { placeholder: "请输入用户ID", key: "input", className: "agent-add-input" }),
              e(Button, { key: "button", disabled: true }, "添加代理")
            ]),
            e(ColumnSettingsTrigger, { key: "columns" })
          ])
        ])
      ]),
      e(Table, {
        rowKey: "id",
        columns,
        dataSource: filteredAgents,
        rowSelection: {
          selectedRowKeys: selectedAgentIds,
          onChange: keys => setSelectedAgentIds(keys)
        },
        pagination: { pageSize: 6, showSizeChanger: true },
        scroll: { x: 1560 }
      }),
      e(Modal, {
        key: "transfer-modal",
        className: "agent-transfer-modal",
        title: "划转用户",
        open: transferOpen,
        onCancel: () => setTransferOpen(false),
        onOk: confirmTransfer,
        okText: "确定",
        cancelText: "取消",
        destroyOnClose: true
      }, transferOpen && e("div", { className: "agent-transfer-form", key: "form" }, [
        e("div", { className: "agent-transfer-field", key: "passport" }, [
          e("span", { key: "label", className: "agent-transfer-label" }, [
            e("i", { key: "req", className: "agent-transfer-req" }, "*"),
            " 客户通行证"
          ]),
          e(Input, {
            key: "input",
            value: transferPassport,
            onChange: event => setTransferPassport(event.target.value),
            placeholder: "客户通行证",
            allowClear: true
          })
        ]),
        e("div", { className: "agent-transfer-field", key: "target" }, [
          e("span", { key: "label", className: "agent-transfer-label" }, [
            e("i", { key: "req", className: "agent-transfer-req" }, "*"),
            " 目标代理通行证"
          ]),
          e(Input, {
            key: "input",
            value: transferTargetPassport,
            onChange: event => setTransferTargetPassport(event.target.value),
            placeholder: "目标代理通行证",
            allowClear: true
          })
        ])
      ])),
      e(Drawer, {
        key: "detail-drawer",
        title: "代理商详情",
        open: Boolean(detailAgent),
        onClose: () => setDetailAgent(null),
        destroyOnClose: true,
        width: 520
      }, detailAgent && e("dl", { className: "customer-detail-list", key: "detail-list" }, [
        e("div", { className: "customer-detail-row", key: "userId" }, [
          e("dt", null, "用户ID"),
          e("dd", null, detailAgent.userId)
        ]),
        e("div", { className: "customer-detail-row", key: "agentId" }, [
          e("dt", null, "代理ID"),
          e("dd", null, detailAgent.agentId)
        ]),
        e("div", { className: "customer-detail-row", key: "level" }, [
          e("dt", null, "代理等级"),
          e("dd", null, e(Tag, { color: "blue" }, detailAgent.level))
        ]),
        e("div", { className: "customer-detail-row", key: "parent" }, [
          e("dt", null, "上级代理ID"),
          e("dd", null, parentOf(detailAgent) || "-")
        ]),
        e("div", { className: "customer-detail-row", key: "userType" }, [
          e("dt", null, "用户类型"),
          e("dd", null, detailAgent.userType)
        ]),
        e("div", { className: "customer-detail-row", key: "ruleId" }, [
          e("dt", null, "佣金规则ID"),
          e("dd", null, detailAgent.commissionRuleId)
        ]),
        e("div", { className: "customer-detail-row", key: "ruleName" }, [
          e("dt", null, "佣金规则名称"),
          e("dd", null, detailAgent.commissionRuleName)
        ]),
        e("div", { className: "customer-detail-row", key: "commissionStatus" }, [
          e("dt", null, "分佣状态"),
          e("dd", null, e(Tag, { color: "green" }, detailAgent.commissionStatus))
        ]),
        e("div", { className: "customer-detail-row", key: "protection" }, [
          e("dt", null, "等级保护"),
          e("dd", null, detailAgent.protection)
        ]),
        e("div", { className: "customer-detail-row", key: "teamCount" }, [
          e("dt", null, "团队人数"),
          e("dd", null, detailAgent.teamCount)
        ]),
        e("div", { className: "customer-detail-row", key: "teamHoldings" }, [
          e("dt", null, "团队持仓量"),
          e("dd", null, detailAgent.teamHoldings)
        ]),
        e("div", { className: "customer-detail-row", key: "createdAt" }, [
          e("dt", null, "成为代理时间"),
          e("dd", null, detailAgent.createdAt)
        ]),
        e("div", { className: "customer-detail-row", key: "selfCommission" }, [
          e("dt", null, "自返佣"),
          e("dd", null, selfCommissionByAgent[detailAgent.id] ? "开启" : "关闭")
        ])
      ])),
      e(Modal, {
        key: "structure-modal",
        className: "agent-structure-modal",
        title: null,
        open: Boolean(structureAgent),
        onCancel: () => setStructureAgent(null),
        footer: null,
        width: "92%",
        destroyOnClose: true
      }, structureAgent && e("div", { className: "agent-structure-view" }, [
        e("div", { className: "agent-structure-toolbar", key: "toolbar" }, [
          e(Text, { type: "secondary", key: "current" }, `当前代理ID：${structureAgent.agentId}`),
          e(Space, { key: "actions", size: 8 }, [
            e(Button, {
              key: "back",
              onClick: () => setStructureAgent(null)
            }, "返回"),
            e(ColumnSettingsTrigger, { key: "columns" })
          ])
        ]),
        e(Table, {
          key: "table",
          rowKey: "id",
          size: "middle",
          pagination: false,
          columns: [
            { title: "层级", dataIndex: "level", width: 160 },
            { title: "代理ID", dataIndex: "userId", width: 280 },
            { title: "佣金规则ID", dataIndex: "commissionRuleId", width: 180 },
            { title: "用户类型", dataIndex: "userType", width: 280 },
            { title: "团队人数", dataIndex: "teamCount", width: 180 },
            { title: "Trade 人数", dataIndex: "tradeCount", width: 180 },
            { title: "团队持仓量", dataIndex: "teamHoldings", width: 280 },
            { title: "成为代理时间", dataIndex: "createdAt", width: 260 }
          ],
          dataSource: [{
            ...structureAgent,
            tradeCount: structureAgent.tradeCount || 0
          }],
          scroll: { x: 1800 }
        })
      ]))
    ]);
  }

  app.AgentPage = AgentPage;
})(window.AdminApp);

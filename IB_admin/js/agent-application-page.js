(function registerAgentApplicationPage(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Popover,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const e = React.createElement;

  const STATUS_OPTIONS = ["待审核", "已通过", "已驳回"];
  const EXPORT_HEADERS = ["用户ID", "联系方式", "交易平台", "平台下近三月持仓量", "推广模式", "申请时间", "审核状态", "操作人", "拒绝原因"];
  const EXPORT_FIELDS = ["userId", "contact", "platform", "holdings", "promoMode", "appliedAt", "status", "operator", "rejectReason"];

  const columnOptions = [
    { key: "contact", label: "联系方式" },
    { key: "proofs", label: "影响力证明" },
    { key: "platform", label: "交易平台" },
    { key: "holdings", label: "平台下近三月持仓量" },
    { key: "promoMode", label: "推广模式" },
    { key: "appliedAt", label: "申请时间" },
    { key: "status", label: "审核状态" },
    { key: "rejectReason", label: "拒绝原因" },
    { key: "operator", label: "操作人" }
  ];
  // 与源系统一致：默认隐藏 拒绝原因 列。
  const defaultColumnKeys = columnOptions.map(item => item.key)
    .filter(key => key !== "rejectReason");

  const statusTagColor = { "待审核": "gold", "已通过": "success", "已驳回": "error" };

  const emptyFilters = () => ({ userId: null, status: null, operator: null, range: null });

  function normalizeRange(range) {
    if (!range || !range[0] || !range[1]) return null;
    return [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")];
  }

  function AgentApplicationPage(props) {
    const applications = (props && props.applications) || app.mockData.agentApplications || [];
    const [draft, setDraft] = React.useState(emptyFilters);
    const [applied, setApplied] = React.useState(emptyFilters);
    const [page, setPage] = React.useState(1);
    const [pageSize] = React.useState(5);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState(defaultColumnKeys);
    const [columnDraft, setColumnDraft] = React.useState(defaultColumnKeys);
    const [columnsOpen, setColumnsOpen] = React.useState(false);

    const updateDraft = patch => setDraft(prev => Object.assign({}, prev, patch));

    const filtered = React.useMemo(() => {
      return applications.filter(item => {
        const matchedUser = !applied.userId || item.userId === applied.userId;
        const matchedStatus = !applied.status || item.status === applied.status;
        const matchedOperator = !applied.operator || item.operator === applied.operator;
        const appliedDate = item.appliedAt.slice(0, 10);
        const matchedRange = !applied.range
          || (appliedDate >= applied.range[0] && appliedDate <= applied.range[1]);
        return matchedUser && matchedStatus && matchedOperator && matchedRange;
      });
    }, [applications, applied]);

    const search = () => {
      setApplied({
        userId: draft.userId,
        status: draft.status,
        operator: draft.operator,
        range: normalizeRange(draft.range)
      });
      setPage(1);
    };

    const reset = () => {
      setDraft(emptyFilters());
      setApplied(emptyFilters());
      setPage(1);
    };

    const exportCsv = () => {
      const csv = [EXPORT_HEADERS, ...filtered.map(item => EXPORT_FIELDS.map(field => item[field]))]
        .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `代理申请列表_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`已导出 ${filtered.length} 条代理申请`);
    };

    const columnMap = {
      contact: {
        title: "联系方式",
        dataIndex: "contact",
        width: 145,
        ellipsis: true
      },
      proofs: {
        title: "影响力证明",
        dataIndex: "proofs",
        width: 110,
        render: proofs => e(Space, { direction: "vertical", size: 0 },
          (proofs || []).map(proof => e(Button, {
            key: proof.label,
            type: "link",
            size: "small",
            className: "cell-link",
            onClick: () => window.open(proof.url, "_blank")
          }, proof.label)))
      },
      platform: { title: "交易平台", dataIndex: "platform", width: 95 },
      holdings: { title: "平台下近三月持仓量", dataIndex: "holdings", width: 120 },
      promoMode: {
        title: "推广模式",
        dataIndex: "promoMode",
        width: 145,
        ellipsis: true
      },
      appliedAt: { title: "申请时间", dataIndex: "appliedAt", width: 105 },
      status: {
        title: "审核状态",
        dataIndex: "status",
        width: 95,
        render: value => value === "-"
          ? e("span", null, value)
          : e(Tag, { color: statusTagColor[value] || "default" }, value)
      },
      rejectReason: {
        title: "拒绝原因",
        dataIndex: "rejectReason",
        width: 170,
        ellipsis: true
      },
      operator: { title: "操作人", dataIndex: "operator", width: 90 }
    };

    const columns = [
      {
        title: "用户ID",
        dataIndex: "userId",
        width: 105,
        render: value => e(Button, {
          type: "link",
          size: "small",
          className: "cell-link",
          onClick: () => message.info(`模拟打开客户详情：${value}`)
        }, value)
      },
      ...visibleColumns.map(key => columnMap[key]),
      { title: "操作", key: "actions", width: 80, render: () => e("span", null, "-") }
    ];

    const columnPanel = e("div", { className: "column-panel login-log-column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("span", { key: "title" }, "显示字段"),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${columnDraft.length}/${columnOptions.length}`)
      ]),
      e("div", { className: "column-panel-sub", key: "sub" }, "选择列表中需要展示的信息"),
      e("div", { className: "login-log-column-actions", key: "actions" }, [
        e(Button, { key: "all", size: "small", onClick: () => setColumnDraft(defaultColumnKeys) }, "全选"),
        e(Button, { key: "clear", size: "small", onClick: () => setColumnDraft([]) }, "清空"),
        e(Button, { key: "reset", size: "small", onClick: () => setColumnDraft(defaultColumnKeys) }, "恢复默认")
      ]),
      e("div", { className: "login-log-column-list", key: "list" }, [
        e("div", { className: "login-log-column-list-head", key: "list-head" }, [
          e("span", { key: "label" }, "列表字段"),
          e("span", { key: "count" }, `${columnDraft.length}/${columnOptions.length}`)
        ]),
        e(Checkbox.Group, {
          key: "group",
          className: "login-log-column-grid",
          value: columnDraft,
          onChange: values => setColumnDraft(values)
        }, columnOptions.map(item => e(Checkbox, { key: item.key, value: item.key }, item.label)))
      ]),
      e("div", { className: "column-panel-footer", key: "footer" }, [
        e(Button, { key: "cancel", onClick: () => { setColumnDraft(visibleColumns); setColumnsOpen(false); } }, "取消"),
        e(Button, { key: "apply", type: "primary", onClick: () => { setVisibleColumns(columnDraft); setColumnsOpen(false); } }, "应用")
      ])
    ]);

    const filterItem = (label, control, key) => e("label", { className: "customer-filter-item", key }, [
      e("span", { key: "label" }, label),
      control
    ]);

    const userIdOptions = React.useMemo(
      () => [...new Set(applications.map(item => item.userId))].sort(),
      [applications]
    );
    const operatorOptions = React.useMemo(
      () => [...new Set(applications.map(item => item.operator))].sort(),
      [applications]
    );

    return e("section", { className: "page-surface agent-application-page" }, [
      e("div", { className: "toolbar login-log-toolbar", key: "toolbar" }, [
        e("div", { className: "login-log-filter-area", key: "filters" }, [
          e(Space, { wrap: true, size: 8, key: "primary" }, [
            filterItem("用户ID :", e(Select, {
              value: draft.userId,
              onChange: value => updateDraft({ userId: value }),
              placeholder: "请输入用户ID",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: userIdOptions.map(value => ({ value, label: value }))
            }), "userId"),
            filterItem("状态 :", e(Select, {
              value: draft.status,
              onChange: value => updateDraft({ status: value }),
              placeholder: "请选择状态",
              allowClear: true,
              className: "select-input",
              options: STATUS_OPTIONS.map(value => ({ value, label: value }))
            }), "status")
          ]),
          moreOpen
            ? e("div", { className: "login-log-more-row", key: "more" },
                e(Space, { wrap: true, size: 8 }, [
                  filterItem("操作人 :", e(Select, {
                    value: draft.operator,
                    onChange: value => updateDraft({ operator: value }),
                    placeholder: "请输入操作人",
                    allowClear: true,
                    showSearch: true,
                    optionFilterProp: "label",
                    className: "keyword-select",
                    options: operatorOptions.map(value => ({ value, label: value }))
                  }), "operator"),
                  filterItem("申请时间 :", e(RangePicker, {
                    value: draft.range,
                    onChange: range => updateDraft({ range }),
                    format: "YYYY-MM-DD",
                    className: "login-log-range"
                  }), "range")
                ]))
            : null
        ]),
        e(Space, { wrap: true, size: 8, key: "actions" }, [
          e(Button, {
            key: "more",
            type: "link",
            onClick: () => setMoreOpen(open => !open)
          }, moreOpen ? "收起筛选" : "更多筛选"),
          e(Button, { key: "search", type: "primary", onClick: search }, "查 询"),
          e(Button, { key: "reset", onClick: reset }, "重置"),
          e(Button, { key: "export", onClick: exportCsv }, "导 出"),
          e(Popover, {
            key: "columns",
            trigger: "click",
            placement: "bottomRight",
            open: columnsOpen,
            onOpenChange: open => {
              setColumnDraft(visibleColumns);
              setColumnsOpen(open);
            },
            content: columnPanel
          }, e(Button, null, "列设置"))
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 1000 },
        locale: { emptyText: "暂无数据" },
        pagination: {
          current: page,
          pageSize,
          total: filtered.length,
          showTotal: total => `共 ${total} 条`,
          onChange: next => setPage(next)
        }
      })
    ]);
  }

  app.AgentApplicationPage = AgentApplicationPage;
})(window.AdminApp);

(function registerOperationLogPage(app) {
  const {
    Button,
    DatePicker,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const e = React.createElement;
  const { exportCsv: runExportCsv, ListActions, ColumnSettings, ExportTrigger, SearchInput } = app.sharedActions;

  const ACTION_OPTIONS = ["新增", "编辑", "删除", "通过", "驳回", "打款", "发布", "作废", "导出"];
  const RESULT_OPTIONS = ["成功", "失败"];

  const columnOptions = [
    { key: "module", label: "操作模块" },
    { key: "action", label: "操作类型" },
    { key: "detail", label: "操作内容" },
    { key: "operator", label: "操作人" },
    { key: "ip", label: "IP" },
    { key: "result", label: "操作结果" },
    { key: "operatedAt", label: "操作时间" }
  ];
  const defaultColumnKeys = columnOptions.map(item => item.key);

  const emptyFilters = () => ({
    keyword: "",
    action: "",
    result: "",
    module: "",
    operator: "",
    range: null
  });

  function normalizeRange(range) {
    if (!range || !range[0] || !range[1]) return null;
    return [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")];
  }

  function actionTagColor(action) {
    if (action === "通过") return "success";
    if (action === "驳回" || action === "删除") return "error";
    if (action === "新增") return "blue";
    if (action === "编辑") return "gold";
    if (action === "发布") return "purple";
    if (action === "打款") return "cyan";
    return "default";
  }

  function OperationLogPage(props) {
    const logs = (props && props.logs) || app.mockData.operationLogs || [];
    const [draft, setDraft] = React.useState(emptyFilters);
    const [applied, setApplied] = React.useState(emptyFilters);
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState(defaultColumnKeys);

    const draftRef = React.useRef(draft);
    const updateDraft = patch => setDraft(prev => {
      const next = Object.assign({}, prev, patch);
      draftRef.current = next;
      return next;
    });

    const moduleOptions = React.useMemo(
      () => [...new Set(logs.map(log => log.module))],
      [logs]
    );
    const operatorOptions = React.useMemo(
      () => [...new Set(logs.map(log => log.operator))],
      [logs]
    );

    const filtered = React.useMemo(() => {
      const keyword = applied.keyword.trim().toLowerCase();
      return logs.filter(log => {
        const text = [log.module, log.detail, log.operator, log.ip, log.action].join(" ").toLowerCase();
        const operatedDate = log.operatedAt.slice(0, 10);
        return (!keyword || text.includes(keyword))
          && (!applied.action || log.action === applied.action)
          && (!applied.result || log.result === applied.result)
          && (!applied.module || log.module === applied.module)
          && (!applied.operator || log.operator === applied.operator)
          && (!applied.range || operatedDate >= applied.range[0])
          && (!applied.range || operatedDate <= applied.range[1]);
      });
    }, [logs, applied]);

    const search = () => {
      const current = draftRef.current;
      setApplied({
        keyword: current.keyword,
        action: current.action,
        result: current.result,
        module: current.module,
        operator: current.operator,
        range: current.range
      });
      setPage(1);
    };

    const reset = () => {
      const cleared = emptyFilters();
      draftRef.current = cleared;
      setDraft(cleared);
      setApplied(emptyFilters());
      setPage(1);
      setPageSize(20);
    };

    const exportCsv = () => runExportCsv(
      "操作日志",
      ["ID", "操作模块", "操作类型", "操作内容", "操作人", "IP", "操作结果", "操作时间"],
      filtered.map(log => [log.id, log.module, log.action, log.detail, log.operator, log.ip, log.result, log.operatedAt]),
      `已导出 ${filtered.length} 条操作日志`
    );

    const renderLink = value => e(Button, {
      type: "link",
      size: "small",
      className: "cell-link",
      onClick: () => message.success(`已复制 ${value}`)
    }, value);

    const columnMap = {
      module: {
        title: "操作模块",
        dataIndex: "module",
        width: 150
      },
      action: {
        title: "操作类型",
        dataIndex: "action",
        width: 100,
        render: value => e(Tag, { color: actionTagColor(value) }, value)
      },
      detail: {
        title: "操作内容",
        dataIndex: "detail",
        width: 360,
        render: value => e("span", { className: "ua-cell cell-ellipsis", title: value }, value)
      },
      operator: {
        title: "操作人",
        dataIndex: "operator",
        width: 100,
        render: renderLink
      },
      ip: {
        title: "IP",
        dataIndex: "ip",
        width: 140,
        render: value => e("span", { className: "mono-cell" }, value)
      },
      result: {
        title: "操作结果",
        dataIndex: "result",
        width: 100,
        render: value => e(Tag, { color: value === "成功" ? "success" : "error" }, value)
      },
      operatedAt: {
        title: "操作时间",
        dataIndex: "operatedAt",
        width: 170
      }
    };

    const columns = [
      {
        title: "ID",
        dataIndex: "id",
        width: 110,
        render: renderLink
      },
      ...visibleColumns.map(key => columnMap[key])
    ];

    const selectFilter = (label, field, options, placeholder) => e("label", { className: "customer-filter-item", key: field }, [
      e("span", { key: "label" }, label),
      e(Select, {
        key: "select",
        value: draft[field],
        onChange: value => {
          updateDraft({ [field]: value });
          setApplied(prev => Object.assign({}, prev, { [field]: value }));
          setPage(1);
        },
        className: "select-input",
        placeholder,
        allowClear: true,
        options: [{ value: "", label: "全部" }].concat(options.map(value => ({ value, label: value })))
      })
    ]);

    return e("section", { className: "page-surface operation-log-page" }, [
      e("div", { className: "toolbar login-log-toolbar", key: "toolbar" }, [
        e("div", { className: "login-log-filter-area", key: "filters" }, [
          e(Space, { wrap: true, size: 8, key: "primary" }, [
            e("label", { className: "customer-filter-item", key: "keyword" }, [
              e("span", { key: "label" }, "关键词"),
              e(SearchInput, {
                key: "input",
                value: draft.keyword,
                onChange: event => updateDraft({ keyword: event.target.value }),
                onSearch: search,
                placeholder: "搜索模块、内容、操作人、IP",
                allowClear: true,
                className: "keyword-input"
              })
            ]),
            selectFilter("操作类型", "action", ACTION_OPTIONS, "请选择操作类型"),
            e("label", { className: "customer-filter-item", key: "range" }, [
              e("span", { key: "label" }, "操作时间(GMT+8)"),
              e(RangePicker, {
                key: "picker",
                value: draft.range,
                onChange: range => {
                  updateDraft({ range });
                  setApplied(prev => Object.assign({}, prev, { range: normalizeRange(range) }));
                  setPage(1);
                },
                format: "YYYY-MM-DD",
                className: "login-log-range"
              })
            ]),
            e(ListActions, {
              key: "actions-core",
              onReset: reset,
              extra: e(Button, {
                key: "more",
                type: "link",
                onClick: () => setMoreOpen(open => !open)
              }, moreOpen ? "收起筛选" : "更多筛选"),
              trailing: [
                e(ExportTrigger, { key: "export-pin", onClick: exportCsv }),
                e(ColumnSettings, {
                  key: "columns",
                  options: columnOptions,
                  value: visibleColumns,
                  defaultValue: defaultColumnKeys,
                  onChange: setVisibleColumns
                })
              ]
            })
          ]),
          moreOpen
            ? e("div", { className: "login-log-more-row", key: "more" },
                e(Space, { wrap: true, size: 8 }, [
                  selectFilter("操作模块", "module", moduleOptions, "请选择操作模块"),
                  selectFilter("操作人", "operator", operatorOptions, "请选择操作人"),
                  selectFilter("操作结果", "result", RESULT_OPTIONS, "请选择操作结果")
                ]))
            : null
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 1230 },
        locale: { emptyText: "暂无符合条件的操作日志" },
        pagination: {
          current: page,
          pageSize,
          total: filtered.length,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: total => `共 ${total} 条`,
          onChange: (next, size) => {
            setPage(next);
            setPageSize(size);
          }
        }
      })
    ]);
  }

  app.OperationLogPage = OperationLogPage;
})(window.AdminApp);

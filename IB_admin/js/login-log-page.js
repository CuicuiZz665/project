(function registerLoginLogPage(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Dropdown,
    Input,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const e = React.createElement;

  const COUNTRY_OPTIONS = ["CHN", "SGP", "GBR", "USA", "JPN"];
  const METHOD_OPTIONS = ["邮箱登录", "手机登录", "Google OAuth", "Apple OAuth", "钱包登录"];
  const EXPORT_HEADERS = ["ID", "请求 ID", "用户 ID", "是否最新一次登录", "IP", "国家", "User Agent", "登录方式", "登录时间"];
  const EXPORT_FIELDS = ["id", "requestId", "userId", "latest", "ip", "country", "ua", "method", "loginAt"];

  const emptyFilters = () => ({
    keyword: "",
    latest: "",
    country: "",
    method: "",
    range: null,
    userId: "",
    requestId: "",
    ip: "",
    ua: ""
  });

  function normalizeRange(range) {
    if (!range || !range[0] || !range[1]) return null;
    return [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")];
  }

  function methodTagColor(method) {
    if (method.includes("OAuth")) return "blue";
    if (method.includes("钱包")) return "orange";
    return "default";
  }

  function LoginLogPage(props) {
    const logs = (props && props.logs) || app.mockData.loginLogs || [];
    const [draft, setDraft] = React.useState(emptyFilters);
    const [applied, setApplied] = React.useState(emptyFilters);
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState([
      "requestId", "userId", "latest", "ip", "country", "ua", "method", "loginAt"
    ]);

    const updateDraft = patch => setDraft(prev => Object.assign({}, prev, patch));

    const filtered = React.useMemo(() => {
      const keyword = applied.keyword.trim().toLowerCase();
      const userId = applied.userId.trim().toLowerCase();
      const requestId = applied.requestId.trim().toLowerCase();
      const ip = applied.ip.trim().toLowerCase();
      const ua = applied.ua.trim().toLowerCase();
      return logs.filter(log => {
        const text = EXPORT_FIELDS.map(field => log[field]).join(" ").toLowerCase();
        const loginDate = log.loginAt.slice(0, 10);
        return (!keyword || text.includes(keyword))
          && (!applied.latest || log.latest === applied.latest)
          && (!applied.country || log.country === applied.country)
          && (!applied.method || log.method === applied.method)
          && (!applied.range || loginDate >= applied.range[0])
          && (!applied.range || loginDate <= applied.range[1])
          && (!userId || log.userId.toLowerCase().includes(userId))
          && (!requestId || log.requestId.toLowerCase().includes(requestId))
          && (!ip || log.ip.toLowerCase().includes(ip))
          && (!ua || log.ua.toLowerCase().includes(ua));
      });
    }, [logs, applied]);

    const search = () => {
      setApplied({
        keyword: draft.keyword,
        latest: draft.latest,
        country: draft.country,
        method: draft.method,
        range: normalizeRange(draft.range),
        userId: draft.userId,
        requestId: draft.requestId,
        ip: draft.ip,
        ua: draft.ua
      });
      setPage(1);
    };

    const reset = () => {
      setDraft(emptyFilters());
      setApplied(emptyFilters());
      setPage(1);
      setPageSize(20);
    };

    const exportCsv = () => {
      const csv = [EXPORT_HEADERS, ...filtered.map(log => EXPORT_FIELDS.map(field => log[field]))]
        .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `用户登录日志_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`已导出 ${filtered.length} 条登录日志`);
    };

    const renderLink = value => e(Button, {
      type: "link",
      size: "small",
      className: "cell-link",
      onClick: () => message.success(`已复制 ${value}`)
    }, value);

    const columnMap = {
      requestId: {
        title: "请求 ID",
        dataIndex: "requestId",
        width: 200,
        render: value => e("span", { className: "mono-cell", title: value }, value)
      },
      userId: {
        title: "用户 ID",
        dataIndex: "userId",
        width: 120,
        render: renderLink
      },
      latest: {
        title: "是否最新一次登录",
        dataIndex: "latest",
        width: 160,
        render: value => e(Tag, { color: value === "是" ? "green" : "default" }, value)
      },
      ip: {
        title: "IP",
        dataIndex: "ip",
        width: 130,
        render: value => e("span", { className: "mono-cell" }, value)
      },
      country: {
        title: "国家",
        dataIndex: "country",
        width: 80
      },
      ua: {
        title: "User Agent",
        dataIndex: "ua",
        width: 360,
        render: value => e("span", { className: "ua-cell", title: value }, value)
      },
      method: {
        title: "登录方式",
        dataIndex: "method",
        width: 120,
        render: value => e(Tag, { color: methodTagColor(value) }, value)
      },
      loginAt: {
        title: "登录时间",
        dataIndex: "loginAt",
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

    const columnMenu = e(Checkbox.Group, {
      value: visibleColumns,
      onChange: setVisibleColumns,
      className: "column-menu"
    }, Object.entries(columnMap).map(([key, column]) => e(Checkbox, { key, value: key }, column.title)));

    const textFilter = (label, field, placeholder, className) => e("label", { className: "customer-filter-item", key: field }, [
      e("span", { key: "label" }, label),
      e(Input, {
        key: "input",
        value: draft[field],
        onChange: event => updateDraft({ [field]: event.target.value }),
        onPressEnter: search,
        placeholder,
        allowClear: true,
        className: className || "keyword-input"
      })
    ]);

    const selectFilter = (label, field, options) => e("label", { className: "customer-filter-item", key: field }, [
      e("span", { key: "label" }, label),
      e(Select, {
        key: "select",
        value: draft[field],
        onChange: value => updateDraft({ [field]: value }),
        className: "select-input",
        options: [{ value: "", label: "全部" }].concat(options.map(value => ({ value, label: value })))
      })
    ]);

    return e("section", { className: "page-surface login-log-page" }, [
      e("div", { className: "toolbar login-log-toolbar", key: "toolbar" }, [
        e("div", { className: "login-log-filter-area", key: "filters" }, [
          e(Space, { wrap: true, size: 8, key: "primary" }, [
            textFilter("关键词", "keyword", "请输入 ID、请求 ID、用户 ID、IP"),
            selectFilter("是否最新", "latest", ["是", "否"]),
            selectFilter("国家", "country", COUNTRY_OPTIONS),
            selectFilter("登录方式", "method", METHOD_OPTIONS),
            e("label", { className: "customer-filter-item", key: "range" }, [
              e("span", { key: "label" }, "登录时间(GMT+0)"),
              e(RangePicker, {
                key: "picker",
                value: draft.range,
                onChange: range => updateDraft({ range }),
                format: "YYYY-MM-DD",
                className: "login-log-range"
              })
            ])
          ]),
          moreOpen
            ? e("div", { className: "login-log-more-row", key: "more" },
                e(Space, { wrap: true, size: 8 }, [
                  textFilter("用户 ID", "userId", "例如 513058481"),
                  textFilter("请求 ID", "requestId", "例如 req_9x..."),
                  textFilter("IP", "ip", "例如 103.86.99.21"),
                  textFilter("User Agent", "ua", "Chrome、Safari、iOS")
                ]))
            : null
        ]),
        e(Space, { wrap: true, size: 8, key: "actions" }, [
          e(Button, {
            key: "more",
            type: "link",
            onClick: () => setMoreOpen(open => !open)
          }, moreOpen ? "收起筛选" : "更多筛选"),
          e(Button, { key: "search", type: "primary", onClick: search }, "搜 索"),
          e(Button, { key: "reset", type: "link", onClick: reset }, "重置"),
          e(Button, { key: "export", onClick: exportCsv }, "导 出"),
          e(Dropdown, {
            key: "columns",
            trigger: ["click"],
            dropdownRender: () => e("div", { className: "dropdown-panel" }, columnMenu)
          }, e(Button, { title: "列设置" }, "列设置"))
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 1320 },
        locale: { emptyText: "暂无符合条件的登录日志" },
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

  app.LoginLogPage = LoginLogPage;
})(window.AdminApp);

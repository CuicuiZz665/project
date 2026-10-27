(function registerLoginLogPage(app) {
  const {
    AutoComplete,
    Button,
    DatePicker,
    Input,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const e = React.createElement;
  const { exportCsv: runExportCsv, ListActions, ColumnSettings, ExportTrigger, SearchInput } = app.sharedActions;

  const COUNTRY_OPTIONS = ["CHN", "SGP", "GBR", "USA", "JPN"];
  const METHOD_OPTIONS = ["邮箱登录", "手机登录", "微信登录", "支付宝登录", "Apple 登录"];
  const KEYWORD_GROUPS = [
    { label: "ID", field: "id" },
    { label: "请求 ID", field: "requestId" },
    { label: "用户 ID", field: "userId" },
    { label: "IP", field: "ip" }
  ];
  const EXPORT_HEADERS = ["ID", "请求 ID", "用户 ID", "邮箱", "IP", "国家", "User Agent", "设备UUID", "客户端时区", "Canvas指纹", "Audio指纹", "屏幕分辨率", "设备指纹", "登录方式", "登录时间"];
  const EXPORT_FIELDS = ["id", "requestId", "userId", "email", "ip", "country", "ua", "deviceUuid", "timezone", "canvasFp", "audioFp", "screen", "deviceFp", "method", "loginAt"];
  const TEXT_FILTER_FIELDS = ["email", "ua", "deviceUuid", "timezone"];

  const columnOptions = [
    { key: "requestId", label: "请求 ID" },
    { key: "userId", label: "用户 ID" },
    { key: "email", label: "邮箱" },
    { key: "ip", label: "IP" },
    { key: "country", label: "国家" },
    { key: "ua", label: "User Agent" },
    { key: "deviceUuid", label: "设备UUID" },
    { key: "timezone", label: "客户端时区" },
    { key: "canvasFp", label: "Canvas指纹" },
    { key: "audioFp", label: "Audio指纹" },
    { key: "screen", label: "屏幕分辨率" },
    { key: "deviceFp", label: "设备指纹" },
    { key: "method", label: "登录方式" },
    { key: "loginAt", label: "登录时间" }
  ];
  const defaultColumnKeys = columnOptions.map(item => item.key);

  const emptyFilters = () => ({
    keyword: "",
    country: "",
    method: "",
    range: null,
    email: "",
    ua: "",
    deviceUuid: "",
    timezone: ""
  });

  function normalizeRange(range) {
    if (!range || !range[0] || !range[1]) return null;
    return [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")];
  }

  function methodTagColor(method) {
    if (method.includes("Apple")) return "blue";
    if (method.includes("微信") || method.includes("支付宝")) return "green";
    return "default";
  }

  function LoginLogPage(props) {
    const logs = (props && props.logs) || app.mockData.loginLogs || [];
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

    const keywordOptions = React.useMemo(() => KEYWORD_GROUPS
      .map(group => ({
        label: group.label,
        options: [...new Set(logs.map(log => String(log[group.field])))].map(value => ({
          value,
          label: value,
          searchText: value
        }))
      }))
      .filter(group => group.options.length), [logs]);

    const filtered = React.useMemo(() => {
      const keyword = applied.keyword.trim().toLowerCase();
      const textInputs = TEXT_FILTER_FIELDS.map(field => [field, applied[field].trim().toLowerCase()]);
      return logs.filter(log => {
        const text = EXPORT_FIELDS.map(field => log[field]).join(" ").toLowerCase();
        const loginDate = log.loginAt.slice(0, 10);
        return (!keyword || text.includes(keyword))
          && (!applied.country || log.country === applied.country)
          && (!applied.method || log.method === applied.method)
          && (!applied.range || loginDate >= applied.range[0])
          && (!applied.range || loginDate <= applied.range[1])
          && textInputs.every(([field, input]) => !input || String(log[field]).toLowerCase().includes(input));
      });
    }, [logs, applied]);

    const search = () => {
      const current = draftRef.current;
      const next = {
        keyword: current.keyword,
        country: current.country,
        method: current.method,
        range: normalizeRange(current.range)
      };
      TEXT_FILTER_FIELDS.forEach(field => { next[field] = current[field]; });
      setApplied(next);
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
      "用户登录日志",
      EXPORT_HEADERS,
      filtered.map(log => EXPORT_FIELDS.map(field => log[field])),
      `已导出 ${filtered.length} 条登录日志`
    );

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
        width: 190,
        render: value => e("span", { className: "mono-cell" }, value)
      },
      userId: {
        title: "用户 ID",
        dataIndex: "userId",
        width: 110,
        render: renderLink
      },
      email: {
        title: "邮箱",
        dataIndex: "email",
        width: 200
      },
      ip: {
        title: "IP",
        dataIndex: "ip",
        width: 140,
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
        width: 160,
        render: value => e("span", { className: "ua-cell cell-ellipsis" }, value)
      },
      deviceUuid: {
        title: "设备UUID",
        dataIndex: "deviceUuid",
        width: 170,
        render: value => e("span", { className: "mono-cell cell-ellipsis" }, value)
      },
      timezone: {
        title: "客户端时区",
        dataIndex: "timezone",
        width: 130
      },
      canvasFp: {
        title: "Canvas指纹",
        dataIndex: "canvasFp",
        width: 130,
        render: value => e("span", { className: "mono-cell cell-ellipsis" }, value)
      },
      audioFp: {
        title: "Audio指纹",
        dataIndex: "audioFp",
        width: 130,
        render: value => e("span", { className: "mono-cell cell-ellipsis" }, value)
      },
      screen: {
        title: "屏幕分辨率",
        dataIndex: "screen",
        width: 110
      },
      deviceFp: {
        title: "设备指纹",
        dataIndex: "deviceFp",
        width: 130,
        render: value => e("span", { className: "mono-cell cell-ellipsis" }, value)
      },
      method: {
        title: "登录方式",
        dataIndex: "method",
        width: 110,
        render: value => e(Tag, { color: methodTagColor(value) }, value)
      },
      loginAt: {
        title: "登录时间",
        dataIndex: "loginAt",
        width: 160
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

    const textFilter = (label, field, placeholder, className) => e("label", { className: "customer-filter-item", key: field }, [
      e("span", { key: "label" }, label),
      e(SearchInput, {
        key: "input",
        value: draft[field],
        onChange: event => updateDraft({ [field]: event.target.value }),
        onSearch: search,
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
        onChange: value => {
          updateDraft({ [field]: value });
          setApplied(prev => Object.assign({}, prev, { [field]: value }));
          setPage(1);
        },
        className: "select-input",
        options: [{ value: "", label: "全部" }].concat(options.map(value => ({ value, label: value })))
      })
    ]);

    return e("section", { className: "page-surface login-log-page" }, [
      e("div", { className: "toolbar login-log-toolbar", key: "toolbar" }, [
        e("div", { className: "login-log-filter-area", key: "filters" }, [
          e(Space, { wrap: true, size: 8, key: "primary" }, [
            e("label", { className: "customer-filter-item", key: "keyword" }, [
              e("span", { key: "label" }, "关键词"),
              e(AutoComplete, {
                key: "autocomplete",
                value: draft.keyword,
                onChange: value => updateDraft({ keyword: value || "" }),
                onSelect: value => {
                  updateDraft({ keyword: value });
                  setApplied(prev => Object.assign({}, prev, { keyword: value }));
                  setPage(1);
                },
                className: "keyword-select",
                placeholder: "搜索或选择 ID、请求 ID、用户 ID、IP",
                allowClear: true,
                options: keywordOptions,
                onPressEnter: search,
                onKeyDown: event => {
                  if (event.key === "Enter") setTimeout(search, 0);
                },
                filterOption: (input, option) =>
                  String(option.searchText || "").toLowerCase().includes(String(input).toLowerCase())
              })
            ]),
            e("label", { className: "customer-filter-item", key: "range" }, [
              e("span", { key: "label" }, "登录时间(GMT+8)"),
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
                  textFilter("邮箱", "email", "例如 gmail.com"),
                  selectFilter("国家", "country", COUNTRY_OPTIONS),
                  textFilter("User Agent", "ua", "Chrome、Safari、iOS"),
                  textFilter("设备UUID", "deviceUuid", "例如 5f8ac2e4", "select-input"),
                  textFilter("客户端时区", "timezone", "例如 Asia/Shanghai", "select-input"),
                  selectFilter("登录方式", "method", METHOD_OPTIONS)
                ]))
            : null
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 2060 },
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

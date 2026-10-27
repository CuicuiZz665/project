(function registerCommissionRecordPage(app) {
  const {
    Button,
    DatePicker,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const e = React.createElement;
  const { exportCsv: runExportCsv, ListActions, ColumnSettings, ExportTrigger } = app.sharedActions;

  const SETTLE_STATUS_OPTIONS = ["未结算", "已结算", "已驳回"];
  const EXPORT_HEADERS = ["订单号", "品种", "持仓量", "佣金金额", "结算时间", "结算状态"];
  const EXPORT_FIELDS = ["orderId", "symbol", "holdings", "commission", "settledAt", "settleStatus"];
  const SETTLE_TAG_COLOR = { "已结算": "success", "已驳回": "error" };

  const columnOptions = [
    { key: "symbol", label: "品种" },
    { key: "holdings", label: "持仓量" },
    { key: "commission", label: "佣金金额" },
    { key: "settledAt", label: "结算时间" },
    { key: "settleStatus", label: "结算状态" }
  ];
  const defaultColumnKeys = columnOptions.map(item => item.key);

  const emptyFilters = () => ({ orderId: null, symbol: null, settleStatus: null, settledRange: null });

  function normalizeRange(range) {
    if (!range || !range[0] || !range[1]) return null;
    return [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")];
  }

  // 佣金分配明细弹窗：筛选只在弹窗内部生效，数据按订单号过滤。
  function CommissionDetailModal({ record, distributions, levels, onClose }) {
    const [userId, setUserId] = React.useState(null);
    const [level, setLevel] = React.useState(null);
    const [applied, setApplied] = React.useState({ userId: null, level: null });

    const recordRows = React.useMemo(() => (distributions || [])
      .filter(item => !record || item.orderId === record.orderId), [record, distributions]);
    const pidOptions = React.useMemo(
      () => [...new Set(recordRows.map(item => item.pid))].sort(),
      [recordRows]
    );

    const rows = React.useMemo(() => recordRows.filter(item => {
      const matchedUser = !applied.userId || item.pid === applied.userId;
      const matchedLevel = !applied.level || item.level === applied.level;
      return matchedUser && matchedLevel;
    }), [recordRows, applied]);

    if (!record) return null;
    return e(Modal, {
      title: "佣金分配明细",
      open: true,
      width: 640,
      footer: null,
      onCancel: onClose,
      destroyOnClose: true
    }, [
      e("div", { className: "commission-detail-filters", key: "filters" },
        e(Space, { wrap: true, size: 8 }, [
          e("label", { className: "customer-filter-item", key: "user" }, [
            e("span", { key: "label" }, "用户ID :"),
            e(Select, {
              value: userId,
              onChange: setUserId,
              placeholder: "请输入用户ID",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: pidOptions.map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "customer-filter-item", key: "level" }, [
            e("span", { key: "label" }, "代理等级 :"),
            e(Select, {
              value: level,
              onChange: setLevel,
              placeholder: "请选择代理等级",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "select-input",
              options: levels.map(name => ({ value: name, label: name }))
            })
          ]),
          e(ListActions, {
            key: "actions-core",
            onQuery: () => setApplied({ userId, level }),
            onReset: () => {
              setUserId(null);
              setLevel(null);
              setApplied({ userId: null, level: null });
            }
          })
        ])),
      e(Table, {
        key: "table",
        rowKey: (row, index) => `${row.pid}-${index}`,
        columns: [
          { title: "用户ID", dataIndex: "pid", width: 180 },
          { title: "代理等级", dataIndex: "level", width: 160 },
          { title: "分配佣金金额", dataIndex: "amount", width: 160 }
        ],
        dataSource: rows,
        pagination: {
          total: rows.length,
          pageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: [20],
          showTotal: total => `共 ${total} 条`
        }
      })
    ]);
  }

  function CommissionRecordPage(props) {
    const records = (props && props.records) || app.mockData.commissionRecords || [];
    const distributions = (props && props.distributions) || app.mockData.commissionDistributions || [];
    const levels = (props && props.levels) || (app.mockData.agentLevels || []).map(item => item.name);
    const [draft, setDraft] = React.useState(emptyFilters);
    const [applied, setApplied] = React.useState(emptyFilters);
    const [page, setPage] = React.useState(1);
    const [pageSize] = React.useState(5);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState(defaultColumnKeys);
    const [detailRecord, setDetailRecord] = React.useState(null);

    const updateDraft = patch => setDraft(prev => Object.assign({}, prev, patch));

    const filtered = React.useMemo(() => {
      return records.filter(item => {
        const matchedOrder = !applied.orderId || item.orderId === applied.orderId;
        const matchedSymbol = !applied.symbol || item.symbol === applied.symbol;
        const matchedStatus = !applied.settleStatus || item.settleStatus === applied.settleStatus;
        const settledDate = item.settledAt.slice(0, 10);
        const matchedSettled = !applied.settledRange
          || (settledDate >= applied.settledRange[0] && settledDate <= applied.settledRange[1]);
        return matchedOrder && matchedSymbol && matchedStatus && matchedSettled;
      });
    }, [records, applied]);

    const orderIdOptions = React.useMemo(
      () => [...new Set(records.map(item => item.orderId))].sort(),
      [records]
    );
    const symbolOptions = React.useMemo(
      () => [...new Set(records.map(item => item.symbol))].sort(),
      [records]
    );

    const search = () => {
      setApplied({
        orderId: draft.orderId,
        symbol: draft.symbol,
        settleStatus: draft.settleStatus,
        settledRange: normalizeRange(draft.settledRange)
      });
      setPage(1);
    };

    const reset = () => {
      setDraft(emptyFilters());
      setApplied(emptyFilters());
      setPage(1);
    };

    const exportCsv = () => runExportCsv(
      "佣金记录管理",
      EXPORT_HEADERS,
      filtered.map(item => EXPORT_FIELDS.map(field => item[field])),
      `已导出 ${filtered.length} 条佣金记录`
    );

    const columnMap = {
      symbol: { title: "品种", dataIndex: "symbol", width: 110 },
      holdings: { title: "持仓量", dataIndex: "holdings", width: 110 },
      commission: {
        title: "佣金金额",
        dataIndex: "commission",
        width: 110,
        render: (value, record) => e(Button, {
          type: "link",
          size: "small",
          className: "cell-link",
          onClick: () => setDetailRecord(record)
        }, value)
      },
      settledAt: { title: "结算时间", dataIndex: "settledAt", width: 130 },
      settleStatus: {
        title: "结算状态",
        dataIndex: "settleStatus",
        width: 100,
        render: value => SETTLE_TAG_COLOR[value]
          ? e(Tag, { color: SETTLE_TAG_COLOR[value] }, value)
          : e("span", null, value)
      }
    };

    const columns = [
      { title: "订单号", dataIndex: "orderId", width: 180 },
      ...visibleColumns.map(key => columnMap[key]),
      { title: "操作", key: "actions", width: 90, render: () => e("span", null, "-") }
    ];

    const filterItem = (label, control, key) => e("label", { className: "customer-filter-item", key }, [
      e("span", { key: "label" }, label),
      control
    ]);

    return e("section", { className: "page-surface commission-record-page" }, [
      e("div", { className: "toolbar login-log-toolbar", key: "toolbar" }, [
        e("div", { className: "login-log-filter-area", key: "filters" }, [
          e(Space, { wrap: true, size: 8, key: "primary" }, [
            filterItem("订单号 :", e(Select, {
              value: draft.orderId,
              onChange: value => {
                updateDraft({ orderId: value });
                setApplied(prev => Object.assign({}, prev, { orderId: value }));
                setPage(1);
              },
              placeholder: "请输入订单ID",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: orderIdOptions.map(value => ({ value, label: value }))
            }), "orderId"),
            filterItem("品种 :", e(Select, {
              value: draft.symbol,
              onChange: value => {
                updateDraft({ symbol: value });
                setApplied(prev => Object.assign({}, prev, { symbol: value }));
                setPage(1);
              },
              placeholder: "请输入交易品种",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "label",
              className: "keyword-select",
              options: symbolOptions.map(value => ({ value, label: value }))
            }), "symbol"),
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
                  filterItem("结算状态 :", e(Select, {
                    value: draft.settleStatus,
                    onChange: value => {
                      updateDraft({ settleStatus: value });
                      setApplied(prev => Object.assign({}, prev, { settleStatus: value }));
                      setPage(1);
                    },
                    placeholder: "请选择结算状态",
                    allowClear: true,
                    className: "select-input",
                    options: SETTLE_STATUS_OPTIONS.map(value => ({ value, label: value }))
                  }), "settleStatus"),
                  filterItem("结算时间 :", e(RangePicker, {
                    value: draft.settledRange,
                    onChange: range => {
                      updateDraft({ settledRange: range });
                      setApplied(prev => Object.assign({}, prev, { settledRange: normalizeRange(range) }));
                      setPage(1);
                    },
                    format: "YYYY-MM-DD",
                    className: "login-log-range"
                  }), "settledRange")
                ]))
            : null
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 960 },
        locale: { emptyText: "暂无数据" },
        pagination: {
          current: page,
          pageSize,
          total: filtered.length,
          showTotal: total => `共 ${total} 条`,
          onChange: next => setPage(next)
        }
      }),
      e(CommissionDetailModal, {
        key: "detail",
        record: detailRecord,
        distributions,
        levels,
        onClose: () => setDetailRecord(null)
      })
    ]);
  }

  app.CommissionRecordPage = CommissionRecordPage;
})(window.AdminApp);

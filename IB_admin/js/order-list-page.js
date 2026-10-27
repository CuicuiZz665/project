(function registerOrderListPage(app) {
  const {
    Button,
    Checkbox,
    Descriptions,
    Drawer,
    Dropdown,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const e = React.createElement;

  const SO_TYPE_COLORS = { 0: "blue", 1: "geekblue", 2: "cyan", 3: "purple" };

  // 列设置分组，与参考系统一致
  const COLUMN_GROUPS = [
    { key: "customer", label: "客户与账号" },
    { key: "order", label: "订单信息" },
    { key: "trade", label: "交易信息" },
    { key: "amount", label: "价格与金额" }
  ];

  const COLUMN_META = [
    { key: "user_code", group: "customer", defaultVisible: true },
    { key: "login", group: "customer", defaultVisible: true },
    { key: "trade_account_type_name", group: "customer", defaultVisible: true },
    { key: "ticket", group: "order", defaultVisible: true },
    { key: "source", group: "trade", defaultVisible: true },
    { key: "trade_volume", group: "trade", defaultVisible: true },
    { key: "so_type_name", group: "trade", defaultVisible: false },
    { key: "leverage", group: "trade", defaultVisible: false },
    { key: "margin_order", group: "amount", defaultVisible: false },
    { key: "profit", group: "amount", defaultVisible: true },
    { key: "funding_fee", group: "amount", defaultVisible: false }
  ];

  const DEFAULT_VISIBLE_KEYS = COLUMN_META.filter(item => item.defaultVisible).map(item => item.key);

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function signedColor(value) {
    return String(value).startsWith("+") ? "#3f8600" : String(value).startsWith("-") ? "#cf1322" : undefined;
  }

  // 客户详情抽屉（与资金流水一致的承接方式）
  function CustomerMiniDrawer({ open, userCode, onClose }) {
    const customer = (app.mockData.customers || []).find(item => item.userId === userCode);
    const detail = customer ? (app.mockData.customerDetails?.[customer.userId] || {}) : null;
    return e(Drawer, {
      open,
      onClose,
      width: 480,
      destroyOnClose: true,
      title: "客户详情"
    }, !customer ? e("span", null, `未找到客户 ${textOrDash(userCode)}`) : [
      e(Descriptions, {
        key: "base",
        column: 1,
        bordered: true,
        size: "small",
        items: [
          { key: "userId", label: "客户编号", children: customer.userId },
          { key: "name", label: "昵称", children: textOrDash(customer.name) },
          { key: "email", label: "邮箱", children: textOrDash(customer.email) },
          { key: "registerType", label: "注册方式", children: textOrDash(customer.registerType) },
          { key: "registeredAt", label: "注册时间(GMT+0)", children: textOrDash(customer.registeredAt) },
          { key: "country", label: "国家/地区", children: textOrDash(customer.country) },
          { key: "service", label: "所属客服", children: customer.service || "未分配" }
        ]
      }),
      detail && detail.balance ? e(Descriptions, {
        key: "assets",
        title: "资产总览",
        column: 1,
        bordered: true,
        size: "small",
        style: { marginTop: 16 },
        items: [
          { key: "balance", label: "余额", children: detail.balance },
          { key: "equity", label: "净值", children: detail.equity },
          { key: "marginFree", label: "可用保证金", children: detail.marginFree },
          { key: "totalDeposit", label: "累计充值", children: detail.totalDeposit },
          { key: "totalWithdrawal", label: "累计提现", children: detail.totalWithdrawal }
        ]
      }) : null
    ]);
  }

  function OrderDetailDrawer({ open, record, onClose }) {
    if (!record) return null;
    return e(Drawer, {
      open,
      onClose,
      size: "large",
      destroyOnClose: true,
      title: "订单详情"
    }, e(Descriptions, {
      column: 2,
      bordered: true,
      size: "small",
      items: [
        { key: "user", label: "用户ID", children: textOrDash(record.user_code) },
        { key: "login", label: "子账号ID", children: textOrDash(record.login) },
        { key: "accountType", label: "账号类型", children: textOrDash(record.trade_account_type_name) },
        { key: "ticket", label: "订单号", children: textOrDash(record.ticket) },
        { key: "source", label: "品种", children: textOrDash(record.source) },
        { key: "soType", label: "交易模式", children: textOrDash(record.so_type_name) },
        { key: "leverage", label: "杠杆", children: textOrDash(record.leverage) },
        { key: "margin", label: "保证金", children: `¥${textOrDash(record.margin_order)}` },
        { key: "profit", label: "盈亏", children: e("span", { style: { color: signedColor(record.profit) } }, textOrDash(record.profit)) },
        { key: "funding", label: "Funding Fee", children: textOrDash(record.funding_fee) }
      ]
    }));
  }

  function OrderListPage({ orders }) {
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({});
    const [expanded, setExpanded] = React.useState(false);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailRecord, setDetailRecord] = React.useState(null);
    const [customerOpen, setCustomerOpen] = React.useState(false);
    const [customerCode, setCustomerCode] = React.useState(null);
    const [exportOpen, setExportOpen] = React.useState(false);
    const [exportForm] = Form.useForm();
    const [visibleKeys, setVisibleKeys] = React.useState(DEFAULT_VISIBLE_KEYS);
    const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);
    const [columnDraft, setColumnDraft] = React.useState(DEFAULT_VISIBLE_KEYS);

    const accountTypes = app.mockData.orderAccountTypes || [];
    const accountOptions = [{ label: "全部", value: -1 }, ...accountTypes.map(item => ({ label: item.name, value: item.code }))];

    const filtered = (orders || []).filter(order =>
      (!applied.user_code || String(order.user_code).includes(applied.user_code.trim()))
      && (!applied.login || String(order.login).includes(applied.login.trim()))
      && (!applied.ticket || String(order.ticket).includes(applied.ticket.trim()))
      && (applied.account_type === undefined || applied.account_type === null || applied.account_type === -1 || order.trade_account_type_name === (accountTypes.find(item => item.code === applied.account_type) || {}).name)
    );

    function openCustomer(code) {
      setCustomerCode(code);
      setCustomerOpen(true);
    }

    function handleExport() {
      exportForm.validateFields().then(values => {
        message.success(`正在导出 ${values.filename || "orders"}.${values.format}（原型演示）`);
        setExportOpen(false);
        exportForm.resetFields();
      }).catch(() => {});
    }

    function applyColumnDraft() {
      setVisibleKeys(columnDraft);
      setColumnPanelOpen(false);
      message.success("列设置已更新");
    }

    const allColumns = {
      user_code: {
        title: "用户ID",
        dataIndex: "user_code",
        fixed: "left",
        width: 140,
        render: (value, record) => e("a", {
          style: { userSelect: "text" },
          onClick: event => { event.preventDefault(); event.stopPropagation(); openCustomer(record.user_code); }
        }, textOrDash(value))
      },
      login: { title: "子账号ID", dataIndex: "login", width: 140 },
      trade_account_type_name: { title: "账号类型", dataIndex: "trade_account_type_name", width: 140 },
      ticket: { title: "订单号", dataIndex: "ticket", width: 160 },
      source: { title: "品种", dataIndex: "source", width: 120 },
      trade_volume: { title: "订单数", dataIndex: "trade_volume", width: 100 },
      so_type_name: {
        title: "交易模式",
        dataIndex: "so_type_name",
        width: 120,
        render: (value, record) => value ? e(Tag, { color: SO_TYPE_COLORS[record.so_type] || "default" }, value) : "-"
      },
      leverage: { title: "杠杆", dataIndex: "leverage", width: 120 },
      margin_order: { title: "保证金", dataIndex: "margin_order", width: 120 },
      profit: {
        title: "盈亏",
        dataIndex: "profit",
        width: 120,
        render: value => e("span", { style: { color: signedColor(value) } }, textOrDash(value))
      },
      funding_fee: { title: "Funding Fee", dataIndex: "funding_fee", width: 120 }
    };

    // 列顺序固定按元数据定义，勾选只控制显隐
    const columns = COLUMN_META.filter(item => visibleKeys.includes(item.key)).map(item => allColumns[item.key]).filter(Boolean);

    const secondaryActive =
      (applied.account_type !== undefined && applied.account_type !== null && applied.account_type !== -1 ? 1 : 0);

    const columnPanel = e("div", { style: { maxWidth: 560 } }, [
      e("div", {
        key: "panel",
        style: { border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, background: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,0.08)" }
      }, [
        e("div", { key: "header", style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, [
          e("span", { key: "title", style: { fontWeight: 500 } }, "列设置"),
          e("div", { key: "actions" }, e(Space, null, [
            e(Button, { key: "all", size: "small", type: "link", onClick: () => setColumnDraft(COLUMN_META.map(item => item.key)) }, "全选"),
            e(Button, { key: "reset", size: "small", type: "link", onClick: () => setColumnDraft(DEFAULT_VISIBLE_KEYS) }, "重置"),
            e(Button, { key: "ok", size: "small", type: "primary", onClick: applyColumnDraft }, "确定")
          ]))
        ]),
        e("div", { key: "groups", style: { maxHeight: 320, overflow: "auto" } },
          COLUMN_GROUPS.map(group => e("div", { key: group.key, style: { marginBottom: 8 } }, [
            e("div", { key: "label", style: { fontSize: 12, color: "#888", margin: "6px 0" } }, group.label),
            e(Checkbox.Group, {
              key: "items",
              value: columnDraft.filter(key => COLUMN_META.find(item => item.key === key && item.group === group.key)),
              onChange: checkedKeys => {
                const groupKeys = COLUMN_META.filter(item => item.group === group.key).map(item => item.key);
                setColumnDraft(draft => [
                  ...draft.filter(key => !groupKeys.includes(key)),
                  ...groupKeys.filter(key => checkedKeys.includes(key))
                ]);
              },
              options: COLUMN_META.filter(item => item.group === group.key).map(item => ({ label: allColumns[item.key].title, value: item.key }))
            })
          ])))
      ])
    ]);

    return e("section", { key: "order-list", className: "page-surface" }, [
      e(Form, {
        key: "filters",
        form,
        layout: "inline",
        className: "toolbar",
        onFinish: values => setApplied(values),
        style: { rowGap: 16 }
      }, [
        e("div", { key: "primary", style: { display: "flex", gap: 16, flexWrap: "wrap", width: "100%" } }, [
          e(Form.Item, { key: "user", label: "用户ID", name: "user_code" },
            e(Input, { allowClear: true, placeholder: "输入用户ID", style: { width: 160 } })),
          e(Form.Item, { key: "login", label: "子账号", name: "login" },
            e(Input, { allowClear: true, placeholder: "请输入子账号", style: { width: 160 } })),
          e(Form.Item, { key: "ticket", label: "订单号", name: "ticket" },
            e(Input, { allowClear: true, placeholder: "请输入订单号", style: { width: 190 } })),
          e(Form.Item, { key: "toggle" },
            e(Button, { type: "text", htmlType: "button", "aria-expanded": expanded, onClick: () => setExpanded(!expanded) }, [
              expanded ? "收起筛选" : "更多筛选",
              secondaryActive > 0 ? e("span", { key: "count", style: { marginLeft: 4, color: "#1677ff" } }, secondaryActive) : null
            ])),
          e(Form.Item, { key: "actions" },
            e(Space, null, [
              e(Button, { key: "search", type: "primary", htmlType: "submit" }, "查询"),
              e(Button, { key: "reset", onClick: () => { form.resetFields(); setApplied({}); } }, "重置")
            ]))
        ]),
        e("div", { key: "secondary", hidden: !expanded, style: { display: expanded ? "flex" : "none", gap: 16, flexWrap: "wrap", width: "100%" } }, [
          e(Form.Item, { key: "account-type", label: "账号类型", name: "account_type", initialValue: -1 },
            e(Select, { options: accountOptions, style: { width: 150 } }))
        ])
      ]),
      e("div", { key: "toolbar", style: { marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8, position: "relative" } }, [
        e(Button, { key: "export", onClick: () => { exportForm.setFieldsValue({ format: "xlsx", filename: "" }); setExportOpen(true); } }, "导出"),
        e(Button, { key: "columns", onClick: () => { setColumnDraft(visibleKeys); setColumnPanelOpen(!columnPanelOpen); } }, "列设置"),
        columnPanelOpen ? e("div", {
          key: "panel-wrap",
          style: { position: "absolute", top: 40, right: 0, zIndex: 20 }
        }, columnPanel) : null
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1300 },
        locale: { emptyText: "暂无数据" },
        onRow: record => ({
          onClick: () => { setDetailRecord(record); setDetailOpen(true); },
          style: { cursor: "pointer" }
        })
      }),
      e(Modal, {
        key: "export",
        open: exportOpen,
        title: "导出数据",
        okText: "导出",
        cancelText: "取消",
        onOk: handleExport,
        onCancel: () => setExportOpen(false),
        destroyOnClose: true
      }, e(Form, { form: exportForm, layout: "vertical" }, [
        e(Form.Item, { key: "filename", label: "文件名", name: "filename" },
          e(Input, { placeholder: "orders" })),
        e(Form.Item, { key: "format", label: "文件格式", name: "format", rules: [{ required: true }] },
          e(Select, { options: [{ label: "xlsx", value: "xlsx" }, { label: "csv", value: "csv" }, { label: "xls", value: "xls" }] }))
      ])),
      e(OrderDetailDrawer, {
        key: "detail",
        open: detailOpen,
        record: detailRecord,
        onClose: () => { setDetailOpen(false); setDetailRecord(null); }
      }),
      e(CustomerMiniDrawer, {
        key: "customer",
        open: customerOpen,
        userCode: customerCode,
        onClose: () => { setCustomerOpen(false); setCustomerCode(null); }
      })
    ]);
  }

  app.OrderListPage = OrderListPage;
})(window.AdminApp);

(function registerDepositPage(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Form,
    Input,
    Select,
    Space,
    Table,
    Tag,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const e = React.createElement;
  const { textOrDash, ProgressiveFilters, ExportModal, CustomerMiniDrawer } = app.financeShared;

  // 列设置分组与默认显隐，与参考系统一致
  const COLUMN_GROUPS = [
    { key: "customer", label: "客户信息" },
    { key: "route", label: "充值链路" },
    { key: "order", label: "订单信息" },
    { key: "amount", label: "金额信息" },
    { key: "transaction", label: "交易信息" },
    { key: "status", label: "状态信息" }
  ];
  const COLUMN_META = [
    { key: "user_code", group: "customer", visible: true },
    { key: "from", group: "route", visible: true },
    { key: "network", group: "route", visible: true },
    { key: "to", group: "route", visible: true },
    { key: "order_no", group: "order", visible: true },
    { key: "received_at", group: "order", visible: true },
    { key: "third_no", group: "order", visible: true },
    { key: "deposit_type_text", group: "order", visible: true },
    { key: "platform_text", group: "route", visible: true },
    { key: "apply_amount", group: "amount", visible: true },
    { key: "currency", group: "amount", visible: true },
    { key: "pay_amount", group: "amount", visible: true },
    { key: "pay_currency", group: "amount", visible: true },
    { key: "rate", group: "amount", visible: true },
    { key: "tx_hash", group: "transaction", visible: true },
    { key: "email", group: "transaction", visible: false },
    { key: "deposit_status_text", group: "status", visible: true },
    { key: "status", group: "status", visible: true }
  ];
  const DEFAULT_VISIBLE_KEYS = COLUMN_META.filter(item => item.visible).map(item => item.key);

  function DepositPage({ deposits }) {
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({});
    const [exportOpen, setExportOpen] = React.useState(false);
    const [exportForm] = Form.useForm();
    const [customerOpen, setCustomerOpen] = React.useState(false);
    const [customerCode, setCustomerCode] = React.useState(null);
    const [visibleKeys, setVisibleKeys] = React.useState(DEFAULT_VISIBLE_KEYS);
    const [columnDraft, setColumnDraft] = React.useState(DEFAULT_VISIBLE_KEYS);
    const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

    const statusOptions = (app.mockData.depositAuditStatusOptions || []).map(item => ({ label: item.name, value: item.code }));
    const depositStatusOptions = (app.mockData.depositStatusOptions || []).map(item => ({ label: item.name, value: item.code }));
    const depositTypeOptions = (app.mockData.depositTypeOptions || []).map(item => ({ label: item.name, value: item.code }));
    const channelOptions = (app.mockData.channelOptions || []).map(item => ({ label: item.name, value: item.code }));

    const filtered = (deposits || []).filter(row =>
      (!applied.user_code || String(row.user_code).includes(applied.user_code.trim()))
      && (!applied.status || row.status.code === applied.status)
      && (!applied.deposit_status || row.deposit_status_text === (depositStatusOptions.find(item => item.value === applied.deposit_status) || {}).label)
      && (!applied.deposit_type || row.deposit_type_text === (depositTypeOptions.find(item => item.value === applied.deposit_type) || {}).label)
      && (!applied.channel || row.platform_text === (channelOptions.find(item => item.value === applied.channel) || {}).label)
      && (!applied.received_time || (row.received_at >= applied.received_time[0].format("YYYY-MM-DD HH:mm:ss") && row.received_at <= applied.received_time[1].format("YYYY-MM-DD HH:mm:ss")))
    );

    function openCustomer(code) {
      setCustomerCode(code);
      setCustomerOpen(true);
    }

    const secondaryActive =
      (applied.deposit_type ? 1 : 0) + (applied.channel ? 1 : 0) + (applied.received_time ? 1 : 0);

    const allColumns = {
      user_code: {
        title: "用户ID", dataIndex: "user_code", fixed: "left", width: 130,
        render: (value, record) => e("a", {
          style: { userSelect: "text" },
          onClick: event => { event.preventDefault(); event.stopPropagation(); openCustomer(record.user_code); }
        }, textOrDash(value))
      },
      from: { title: "充值来源", dataIndex: "from", width: 150 },
      network: { title: "网络", dataIndex: "network", width: 110 },
      to: { title: "充值去向", dataIndex: "to", width: 180 },
      order_no: { title: "订单号", dataIndex: "order_no", width: 190, ellipsis: true },
      received_at: { title: "充值时间", dataIndex: "received_at", width: 180 },
      third_no: { title: "三方订单号", dataIndex: "third_no", width: 180, ellipsis: true },
      deposit_type_text: { title: "充值类型", dataIndex: "deposit_type_text", width: 130 },
      platform_text: { title: "支付通道", dataIndex: "platform_text", width: 140 },
      apply_amount: { title: "充值金额", dataIndex: "apply_amount", width: 130 },
      currency: { title: "充值币种", dataIndex: "currency", width: 100 },
      pay_amount: { title: "实际支付金额", dataIndex: "pay_amount", width: 140 },
      pay_currency: { title: "实际支付币种", dataIndex: "pay_currency", width: 120 },
      rate: { title: "系统汇率", dataIndex: "rate", width: 110 },
      tx_hash: { title: "哈希值", dataIndex: "tx_hash", width: 220, ellipsis: true },
      email: { title: "邮箱地址", dataIndex: "email", width: 200, ellipsis: true },
      deposit_status_text: {
        title: "充值状态", dataIndex: "deposit_status_text", width: 120,
        render: value => value ? e(Tag, { color: value === "已到账" ? "success" : value === "失败" ? "error" : "processing" }, value) : "-"
      },
      status: {
        title: "状态", dataIndex: "status", fixed: "right", width: 120,
        render: value => value ? app.financeShared.auditTag(value.code, value.text) : "-"
      }
    };
    // 列顺序固定按元数据定义，勾选只控制显隐
    const columns = COLUMN_META.filter(item => visibleKeys.includes(item.key)).map(item => allColumns[item.key]);

    const columnPanel = e("div", {
      style: { border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, background: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,0.08)", maxWidth: 560 }
    }, [
      e("div", { key: "header", style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, [
        e("span", { key: "title", style: { fontWeight: 500 } }, "列设置"),
        e(Space, { key: "actions" }, [
          e(Button, { key: "all", size: "small", type: "link", onClick: () => setColumnDraft(COLUMN_META.map(item => item.key)) }, "全选"),
          e(Button, { key: "reset", size: "small", type: "link", onClick: () => setColumnDraft(DEFAULT_VISIBLE_KEYS) }, "重置"),
          e(Button, { key: "ok", size: "small", type: "primary", onClick: () => { setVisibleKeys(columnDraft); setColumnPanelOpen(false); message.success("列设置已更新"); } }, "确定")
        ])
      ]),
      e("div", { key: "groups", style: { maxHeight: 320, overflow: "auto" } },
        COLUMN_GROUPS.map(group => {
          const groupKeys = COLUMN_META.filter(item => item.group === group.key).map(item => item.key);
          return e("div", { key: group.key, style: { marginBottom: 8 } }, [
            e("div", { key: "label", style: { fontSize: 12, color: "#888", margin: "6px 0" } }, group.label),
            e(Checkbox.Group, {
              key: "items",
              value: columnDraft.filter(key => groupKeys.includes(key)),
              onChange: checked => setColumnDraft(draft => [...draft.filter(key => !groupKeys.includes(key)), ...checked]),
              options: groupKeys.map(key => ({ label: allColumns[key].title, value: key }))
            })
          ]);
        }))
    ]);

    return e("section", { key: "deposit", className: "page-surface" }, [
      e(ProgressiveFilters, {
        key: "filters",
        form,
        activeSecondaryCount: secondaryActive,
        onSubmit: values => setApplied(values),
        onReset: () => { form.resetFields(); setApplied({}); },
        primary: [
          e(Form.Item, { key: "user", label: "User ID", name: "user_code" },
            e(Input, { allowClear: true, placeholder: "User ID", style: { width: 200 } })),
          e(Form.Item, { key: "status", label: "状态", name: "status" },
            e(Select, { allowClear: true, placeholder: "状态", options: statusOptions, style: { width: 160 } })),
          e(Form.Item, { key: "deposit-status", label: "充值状态", name: "deposit_status" },
            e(Select, { allowClear: true, placeholder: "充值状态", options: depositStatusOptions, style: { width: 160 } }))
        ],
        secondary: [
          e(Form.Item, { key: "type", label: "充值类型", name: "deposit_type" },
            e(Select, { allowClear: true, placeholder: "充值类型", options: depositTypeOptions, style: { minWidth: 180 } })),
          e(Form.Item, { key: "channel", label: "支付通道", name: "channel" },
            e(Select, { allowClear: true, placeholder: "支付通道", options: channelOptions, style: { minWidth: 180 } })),
          e(Form.Item, { key: "time", label: "充值时间", name: "received_time" },
            e(RangePicker, { showTime: true, style: { width: 320 } }))
        ]
      }),
      e("div", { key: "toolbar", style: { marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8, position: "relative" } }, [
        e(Button, { key: "export", onClick: () => { exportForm.setFieldsValue({ format: "xlsx", filename: "" }); setExportOpen(true); } }, "导出"),
        e(Button, { key: "columns", onClick: () => { setColumnDraft(visibleKeys); setColumnPanelOpen(!columnPanelOpen); } }, "列设置"),
        columnPanelOpen ? e("div", { key: "panel", style: { position: "absolute", top: 40, right: 0, zIndex: 20 } }, columnPanel) : null
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 2300 },
        locale: { emptyText: "暂无数据" }
      }),
      e(ExportModal, {
        key: "export-modal",
        open: exportOpen,
        form: exportForm,
        defaultFilename: "deposits",
        onExport: values => {
          message.success(`正在导出 ${values.filename || "deposits"}.${values.format}（原型演示）`);
          setExportOpen(false);
          exportForm.resetFields();
        },
        onCancel: () => setExportOpen(false)
      }),
      e(CustomerMiniDrawer, {
        key: "customer",
        open: customerOpen,
        userCode: customerCode,
        onClose: () => { setCustomerOpen(false); setCustomerCode(null); }
      })
    ]);
  }

  app.DepositPage = DepositPage;
})(window.AdminApp);

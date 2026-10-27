(function registerWithdrawPages(app) {
  const {
    Alert,
    Button,
    DatePicker,
    Descriptions,
    Drawer,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { TextArea } = Input;
  const { Text, Title } = Typography;
  const e = React.createElement;
  const { textOrDash, auditTag, ProgressiveFilters, ExportModal, CustomerMiniDrawer } = app.financeShared;

  // 提现去向单元格：银行卡/链上信息悬浮展示
  function WithdrawToCell({ record }) {
    const dialog = record.dialog || {};
    const isBank = record.dialog_style === 1;
    const rows = isBank
      ? [
          { label: "国家/地区", value: dialog.country },
          { label: "名", value: dialog.first_name },
          { label: "姓", value: dialog.last_name },
          { label: "银行卡号", value: dialog.bank_card_no },
          { label: "银行代码", value: dialog.bank_code },
          { label: "银行名称", value: dialog.bank_name },
          { label: "银行地址", value: dialog.address },
          { label: "分行代码", value: dialog.branch_code },
          { label: "分行名称", value: dialog.branch_name }
        ]
      : [
          { label: "提现去向", value: dialog.to || record.to },
          { label: "网络", value: dialog.network || record.network },
          { label: "哈希值", value: dialog.tx_hash || record.tx_hash }
        ];
    const content = e("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
      rows.map((row, index) => e(Text, { key: `${row.label}-${index}`, style: { display: "block", color: "#fff" } }, `${row.label}: ${textOrDash(row.value)}`)));
    return e(antd.Popover, { placement: "topLeft", title: isBank ? "收款银行信息" : "链上信息", content },
      e("span", { style: { cursor: "pointer", display: "block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
        textOrDash(record.to)));
  }

  // 提现详情抽屉（风控/财务共用）
  function WithdrawDetailDrawer({ open, record, title, onClose }) {
    if (!record) return null;
    const isChain = record.dialog_style !== undefined && record.dialog_style !== 1;
    return e(Drawer, {
      open,
      onClose,
      size: "large",
      destroyOnClose: true,
      title
    }, e(Descriptions, {
      column: 2,
      bordered: true,
      size: "small",
      items: [
        { key: "user", label: "用户ID", children: textOrDash(record.user_code) },
        { key: "sub", label: "子账号", children: textOrDash(record.sub_account_id) },
        { key: "email", label: "邮箱地址", children: textOrDash(record.email) },
        { key: "order", label: "订单号", children: textOrDash(record.order_no) },
        { key: "third", label: "三方订单号", children: textOrDash(record.third_no) },
        { key: "from", label: "提现来源", children: textOrDash(record.from) },
        { key: "to", label: "提现去向", children: textOrDash(record.to) },
        { key: "channel", label: "提现通道", children: textOrDash(record.platform_text) },
        { key: "fee", label: "手续费", children: `¥${textOrDash(record.fee_amount)}` },
        { key: "amount", label: "提现金额", children: `¥${textOrDash(record.apply_amount)}` },
        { key: "currency", label: "提现币种", children: textOrDash(record.currency) },
        { key: "net", label: "实际到账", children: textOrDash(record.net_amount) },
        { key: "payCurrency", label: "实际到账币种", children: textOrDash(record.pay_currency) },
        { key: "rate", label: "系统汇率", children: textOrDash(record.rate) },
        { key: "time", label: "提现时间", children: textOrDash(record.withdrawal_time) },
        { key: "received", label: "到账时间", children: textOrDash(record.received_at) },
        ...(isChain ? [
          { key: "network", label: "网络", children: textOrDash(record.network) },
          { key: "hash", label: "哈希值", children: textOrDash(record.tx_hash) }
        ] : []),
        { key: "risk", label: "风控状态", children: auditTag(record.status?.risk_status, record.status?.text) },
        { key: "finance", label: "财务状态", children: auditTag(record.status?.finance_status, record.status?.text) },
        { key: "riskReason", label: "风控驳回原因", children: textOrDash(record.risk_reason) },
        { key: "financeReason", label: "财务驳回原因", children: textOrDash(record.finance_reason) },
        { key: "operator", label: "操作人", children: textOrDash(record.operator_name) }
      ]
    }));
  }

  // 风控通过确认弹窗：特殊客户提示 + 风控信息 + 赠金情况
  function RiskApproveModal({ open, record, bonusData, onOk, onCancel }) {
    const specialType = String(record?.type_text || "").trim();
    return e(Modal, {
      className: "withdrawal-approve-confirm-modal",
      open,
      title: "确认同意此次提现申请吗？",
      onOk,
      onCancel,
      okText: "确认",
      cancelText: "取消",
      width: 640
    }, [
      specialType ? e(Alert, {
        key: "notice",
        className: "withdrawal-approve-confirm-modal__notice",
        showIcon: true,
        type: "warning",
        title: `该用户是${specialType}用户`,
        style: { marginBottom: 16 }
      }) : null,
      e("section", { key: "risk", className: "withdrawal-approve-confirm-modal__risk-section" }, [
        e(Title, { key: "title", level: 5, style: { marginBottom: 12 } }, "提现风控信息"),
        e("div", { key: "grid", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 } }, [
          e(Space, { key: "count", size: "small" }, [
            e(Text, { type: "secondary" }, "当日提现次数"),
            e(Text, { strong: true, style: { color: "#cf1322" } }, `${textOrDash(record?.daily_withdraw_count)} 次`)
          ]),
          e(Space, { key: "amount", size: "small" }, [
            e(Text, { type: "secondary" }, "当日总提现金额"),
            e(Text, { strong: true, style: { color: "#cf1322" } }, `¥${textOrDash(record?.daily_total_withdraw_amount)}`)
          ])
        ])
      ]),
      e(Descriptions, {
        key: "bonus",
        title: "赠金情况",
        column: 1,
        size: "small",
        bordered: true,
        items: [
          { key: "in", label: "合计发放赠金", children: textOrDash(bonusData?.in) },
          { key: "out", label: "合计扣除赠金", children: textOrDash(bonusData?.out) },
          { key: "net", label: "总赠金", children: textOrDash(bonusData?.net) }
        ]
      })
    ]);
  }

  // 共用列表外壳：mode = risk | finance
  function WithdrawPage({ mode, withdrawals, setWithdrawals }) {
    const isFinance = mode === "finance";
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({});
    const [exportOpen, setExportOpen] = React.useState(false);
    const [exportForm] = Form.useForm();
    const [customerOpen, setCustomerOpen] = React.useState(false);
    const [customerCode, setCustomerCode] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailRecord, setDetailRecord] = React.useState(null);
    const [approveOpen, setApproveOpen] = React.useState(false);
    const [approveRecord, setApproveRecord] = React.useState(null);
    const [reasonOpen, setReasonOpen] = React.useState(false);
    const [reason, setReason] = React.useState("");
    const [rejectRecord, setRejectRecord] = React.useState(null);
    const [handleOpen, setHandleOpen] = React.useState(false);
    const [handleHash, setHandleHash] = React.useState("");
    const [handleRecord, setHandleRecord] = React.useState(null);

    const statusOptions = ((isFinance ? app.mockData.financeStatusOptions : app.mockData.riskStatusOptions) || [])
      .map(item => ({ label: item.name, value: item.code }));
    const channelOptions = (app.mockData.channelOptions || []).map(item => ({ label: item.name, value: item.code }));

    const filtered = (withdrawals || []).filter(row =>
      (!applied.user_code || String(row.user_code).includes(applied.user_code.trim()))
      && (!applied.order_no || String(row.order_no).includes(applied.order_no.trim()))
      && (!applied.status || row.status[isFinance ? "finance_status" : "risk_status"] === applied.status)
      && (!applied.channel || row.platform_text === (channelOptions.find(item => item.value === applied.channel) || {}).label)
      && (!applied.withdraw_time || (row.withdrawal_time >= applied.withdraw_time[0].format("YYYY-MM-DD HH:mm:ss") && row.withdrawal_time <= applied.withdraw_time[1].format("YYYY-MM-DD HH:mm:ss")))
    );

    function updateRecord(id, patch) {
      setWithdrawals(list => list.map(item => item.id === id ? Object.assign({}, item, patch) : item));
    }

    // —— 风控：通过 ——
    function openApprove(record) {
      setApproveRecord(record);
      setApproveOpen(true);
    }
    function confirmApprove() {
      if (!approveRecord) return;
      updateRecord(approveRecord.id, {
        status: Object.assign({}, approveRecord.status, { risk_status: "approved", text: "已通过" }),
        operator_name: "Rita",
        can_handle_risk: 0
      });
      setApproveOpen(false);
      setApproveRecord(null);
      message.success("操作成功");
    }

    // —— 驳回（风控/财务共用）——
    function openReject(record) {
      setRejectRecord(record);
      setReason("");
      setReasonOpen(true);
    }
    function confirmReject() {
      if (!reason.trim()) {
        message.warning("请填写驳回原因");
        return;
      }
      if (!rejectRecord) return;
      const statusPatch = isFinance
        ? { finance_status: "rejected", text: "已驳回" }
        : { risk_status: "rejected", text: "已驳回" };
      updateRecord(rejectRecord.id, {
        status: Object.assign({}, rejectRecord.status, statusPatch),
        [isFinance ? "finance_reason" : "risk_reason"]: reason.trim(),
        operator_name: isFinance ? "QQ" : "Rita",
        [isFinance ? "can_fail_finance" : "can_handle_risk"]: 0
      });
      setReasonOpen(false);
      setRejectRecord(null);
      message.success("操作成功");
    }

    // —— 财务：处理（填 Hash）——
    function openHandle(record) {
      setHandleRecord(record);
      setHandleHash("");
      setHandleOpen(true);
    }
    function confirmHandle() {
      if (!handleHash.trim()) {
        message.warning("请填写Hash值");
        return;
      }
      if (!handleRecord) return;
      updateRecord(handleRecord.id, {
        status: Object.assign({}, handleRecord.status, { finance_status: "approved", text: "已通过" }),
        tx_hash: handleHash.trim(),
        operator_name: "QQ",
        can_handle_finance: 0
      });
      setHandleOpen(false);
      setHandleRecord(null);
      message.success("操作成功");
    }

    // —— 财务：重新发起钱包提现 ——
    function handleRetry(record) {
      updateRecord(record.id, { can_manual_retry: 0, operator_name: "QQ" });
      message.success("已重新发起钱包提现");
    }

    const columns = [
      {
        title: "用户ID", dataIndex: "user_code", fixed: "left", width: 110,
        render: (value, record) => e("a", {
          style: { userSelect: "text" },
          onClick: event => { event.preventDefault(); event.stopPropagation(); setCustomerCode(record.user_code); setCustomerOpen(true); }
        }, textOrDash(value))
      },
      { title: "特殊客户", dataIndex: "type_text", width: 90, render: value => textOrDash(value === "" ? undefined : value) },
      { title: "提现来源", dataIndex: "from", width: 110 },
      { title: "提现去向", dataIndex: "to", width: 260, render: (_, record) => e(WithdrawToCell, { record }) },
      { title: "订单号", dataIndex: "order_no", ellipsis: true, width: 180 },
      { title: "三方订单号", dataIndex: "third_no", ellipsis: true, width: 180 },
      { title: "提现通道", dataIndex: "platform_text", width: 110 },
      { title: "提现币种", dataIndex: "currency", width: 90 },
      { title: "提现金额", dataIndex: "apply_amount", width: 110 },
      { title: "实际到账币种", dataIndex: "pay_currency", width: 110 },
      { title: "实际到账", dataIndex: "pay_amount", width: 110 },
      { title: "手续费", dataIndex: "fee_amount", width: 90 },
      { title: "系统汇率", dataIndex: "rate", width: 90 },
      { title: "提现时间", dataIndex: "withdrawal_time", width: 170 },
      ...(isFinance ? [{ title: "到账时间", dataIndex: "received_at", width: 170 }] : []),
      { title: "哈希值", dataIndex: "tx_hash", ellipsis: true, width: 220 },
      { title: "网络", dataIndex: "network", width: 90 },
      { title: "邮箱地址", dataIndex: "email", ellipsis: true, width: 180 },
      { title: "驳回原因", dataIndex: isFinance ? "finance_reason" : "risk_reason", ellipsis: true, width: 160 },
      {
        title: isFinance ? "财务状态" : "风控状态",
        dataIndex: "status",
        fixed: "right",
        width: isFinance ? 110 : 100,
        render: value => value ? auditTag(value[isFinance ? "finance_status" : "risk_status"], value.text) : "-"
      },
      { title: "操作人", dataIndex: "operator_name", fixed: "right", width: 100, render: value => textOrDash(value) },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: isFinance ? 220 : 130,
        render: (_, record) => {
          if (isFinance) {
            const canHandle = record.can_handle_finance === 1;
            const canReject = record.can_fail_finance === 1;
            const canRetry = record.can_manual_retry === 1;
            if (!canHandle && !canReject && !canRetry) return "-";
            return e(Space, { size: 4, wrap: true }, [
              canHandle ? e(Button, { key: "handle", type: "primary", size: "small", onClick: event => { event.stopPropagation(); openHandle(record); } }, "处理") : null,
              canReject ? e(Button, { key: "reject", danger: true, type: "primary", size: "small", onClick: event => { event.stopPropagation(); openReject(record); } }, "驳回") : null,
              canRetry ? e(Button, { key: "retry", size: "small", onClick: event => { event.stopPropagation(); handleRetry(record); } }, "重新发起钱包提现") : null
            ]);
          }
          if (record.can_handle_risk !== 1) return "-";
          return e(Space, { size: "small" }, [
            e(Button, { key: "approve", type: "primary", size: "small", onClick: event => { event.stopPropagation(); openApprove(record); } }, "通过"),
            e(Button, { key: "reject", danger: true, type: "primary", size: "small", onClick: event => { event.stopPropagation(); openReject(record); } }, "驳回")
          ]);
        }
      }
    ];

    const secondaryActive = (applied.channel ? 1 : 0) + (applied.withdraw_time ? 1 : 0);
    const pageTitle = isFinance ? "提现审核-财务" : "提现审核-风控";

    return e("section", { key: `withdraw-${mode}`, className: `page-surface withdraw-${mode}-page` }, [
      e(ProgressiveFilters, {
        key: "filters",
        form,
        activeSecondaryCount: secondaryActive,
        onSubmit: values => setApplied(values),
        onReset: () => { form.resetFields(); setApplied({}); },
        instantFields: ["status", "channel", "withdraw_time"],
        primary: [
          e(Form.Item, { key: "user", label: "User ID", name: "user_code" },
            e(app.sharedActions.SearchInput, { allowClear: true, placeholder: "User ID", style: { width: 200 }, onSearch: () => form.submit() })),
          e(Form.Item, { key: "order", label: "订单号", name: "order_no" },
            e(app.sharedActions.SearchInput, { allowClear: true, placeholder: "订单号", style: { width: 200 }, onSearch: () => form.submit() })),
          e(Form.Item, { key: "status", label: "状态", name: "status" },
            e(Select, { allowClear: true, placeholder: "状态", options: statusOptions, style: { width: 160 } }))
        ],
        secondary: [
          e(Form.Item, { key: "channel", label: "提现通道", name: "channel" },
            e(Select, { allowClear: true, placeholder: "提现通道", options: channelOptions, style: { minWidth: 180 } })),
          e(Form.Item, { key: "time", label: "提现时间", name: "withdraw_time" },
            e(RangePicker, { showTime: true, style: { width: 320 } }))
        ],
        // 导出钉在筛选表单右上角（挂 Form 层，见 ProgressiveFilters aside 说明）
        aside: [
          e(app.sharedActions.ExportTrigger, { key: "export-pin", onClick: () => { exportForm.setFieldsValue({ format: "xlsx", filename: "" }); setExportOpen(true); } })
        ]
      }),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 2700 },
        locale: { emptyText: "暂无数据" },
        onRow: record => ({
          onClick: () => { setDetailRecord(record); setDetailOpen(true); },
          style: { cursor: "pointer" }
        })
      }),
      e(ExportModal, {
        key: "export-modal",
        open: exportOpen,
        form: exportForm,
        defaultFilename: isFinance ? "withdraw-finance" : "withdraw-risk",
        onExport: values => {
          message.success(`正在导出 ${values.filename || (isFinance ? "withdraw-finance" : "withdraw-risk")}.${values.format}（原型演示）`);
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
      }),
      e(WithdrawDetailDrawer, {
        key: "detail",
        open: detailOpen,
        record: detailRecord,
        title: pageTitle,
        onClose: () => { setDetailOpen(false); setDetailRecord(null); }
      }),
      !isFinance ? e(RiskApproveModal, {
        key: "approve",
        open: approveOpen,
        record: approveRecord,
        bonusData: approveRecord ? (app.mockData.withdrawalBonusByUser || {})[approveRecord.user_code] : null,
        onOk: confirmApprove,
        onCancel: () => { setApproveOpen(false); setApproveRecord(null); }
      }) : null,
      e(Modal, {
        key: "reject",
        open: reasonOpen,
        title: "驳回",
        onOk: confirmReject,
        onCancel: () => { setReasonOpen(false); setRejectRecord(null); },
        okText: "确定",
        cancelText: "取消"
      },
        e(TextArea, { rows: 4, value: reason, onChange: event => setReason(event.target.value), placeholder: "请输入驳回原因" })),
      isFinance ? e(Modal, {
        key: "handle",
        open: handleOpen,
        title: "处理",
        onOk: confirmHandle,
        onCancel: () => { setHandleOpen(false); setHandleRecord(null); },
        okText: "确定",
        cancelText: "取消"
      },
        e(TextArea, { rows: 4, value: handleHash, onChange: event => setHandleHash(event.target.value), placeholder: "请输入Hash值" })) : null
    ]);
  }

  app.WithdrawRiskPage = function WithdrawRiskPage(props) {
    return e(WithdrawPage, Object.assign({ mode: "risk" }, props));
  };
  app.WithdrawFinancePage = function WithdrawFinancePage(props) {
    return e(WithdrawPage, Object.assign({ mode: "finance" }, props));
  };
})(window.AdminApp);

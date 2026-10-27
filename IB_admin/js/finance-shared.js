(function registerFinanceShared(app) {
  const {
    Button,
    Descriptions,
    Drawer,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tag,
    Typography
  } = antd;
  const e = React.createElement;
  const { ListActions } = app.sharedActions;

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  // 状态码 → 标签（充值提现页共用：待审核/已通过/已驳回/已撤销/已失败）
  const AUDIT_TAG_MAP = {
    pending: { label: "待审核", color: "warning" },
    approved: { label: "已通过", color: "success" },
    success: { label: "已通过", color: "success" },
    failed: { label: "已失败", color: "error" },
    rejected: { label: "已驳回", color: "error" },
    cancelled: { label: "已撤销", color: "default" }
  };

  function auditTag(code, fallbackText) {
    const meta = AUDIT_TAG_MAP[code];
    if (!meta) return textOrDash(fallbackText);
    return e(Tag, { color: meta.color }, meta.label);
  }

  // 渐进筛选：主筛选行 + 更多筛选/收起筛选（带已选计数）；
  // 全局"回车即查/点选即查"交互：文本字段由 SearchInput 回车提交（走 onFinish），
  // instantFields 列出的点选类字段（下拉/日期等）改动即通过 onValuesChange 立即应用；
  // actions 传随重置组排的页面级操作；aside 传钉在表单右上角的元素（导出/列设置/面板）
  function ProgressiveFilters({ form, primary, secondary, activeSecondaryCount = 0, loading, onSubmit, onReset, actions, aside, instantFields }) {
    const [expanded, setExpanded] = React.useState(false);
    const instant = instantFields || [];
    return e(Form, {
      form,
      layout: "inline",
      className: "progressive-filter-form",
      onFinish: onSubmit,
      onValuesChange: changed => {
        if (Object.keys(changed).some(key => instant.includes(key))) onSubmit(form.getFieldsValue());
      },
      style: { rowGap: 16 }
    }, [
      e("div", { key: "primary", style: { display: "flex", gap: 16, flexWrap: "wrap", width: "100%" } }, [
        ...primary,
        secondary ? e(Form.Item, { key: "toggle" },
          e(Button, {
            type: "text",
            htmlType: "button",
            "aria-expanded": expanded,
            onClick: () => setExpanded(!expanded)
          }, [
            expanded ? "收起筛选" : "更多筛选",
            activeSecondaryCount > 0 ? e("span", { key: "count", style: { marginLeft: 4, color: "#1677ff" } }, activeSecondaryCount) : null
          ])) : null,
        e(Form.Item, { key: "actions" },
          e(ListActions, { onReset, trailing: actions }))
      ]),
      secondary ? e("div", {
        key: "secondary",
        hidden: !expanded,
        style: { display: expanded ? "flex" : "none", gap: 16, flexWrap: "wrap", width: "100%" }
      }, secondary) : null,
      ...(aside || [])
    ]);
  }

  // 导出数据弹窗：文件名 + 文件格式
  function ExportModal({ open, form, defaultFilename, onExport, onCancel }) {
    function handleOk() {
      form.validateFields().then(values => {
        onExport(values);
      }).catch(() => {});
    }
    return e(Modal, {
      open,
      title: "导出数据",
      okText: "导出",
      cancelText: "取消",
      onOk: handleOk,
      onCancel,
      destroyOnClose: true
    }, e(Form, { form, layout: "vertical" }, [
      e(Form.Item, { key: "filename", label: "文件名", name: "filename" },
        e(Input, { placeholder: defaultFilename })),
      e(Form.Item, { key: "format", label: "文件格式", name: "format", rules: [{ required: true }] },
        e(Select, { options: [
          { label: "xlsx", value: "xlsx" },
          { label: "csv", value: "csv" },
          { label: "xls", value: "xls" }
        ] }))
    ]));
  }

  // 客户详情抽屉（与资金流水/订单列表一致的承接方式）
  function CustomerMiniDrawer({ open, userCode, onClose }) {
    const customer = (app.mockData.customers || []).find(item => item.userId === userCode);
    const detail = customer ? (app.mockData.customerDetails?.[customer.userId] || {}) : null;
    return e(Drawer, {
      open,
      onClose,
      width: 480,
      destroyOnClose: true,
      title: "客户详情"
    }, !customer ? e(Typography.Text, { type: "secondary" }, `未找到客户 ${textOrDash(userCode)}`) : [
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

  app.financeShared = {
    textOrDash,
    auditTag,
    ProgressiveFilters,
    ExportModal,
    CustomerMiniDrawer
  };
})(window.AdminApp);

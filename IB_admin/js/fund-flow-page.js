(function registerFundFlowPage(app) {
  const {
    Button,
    Cascader,
    DatePicker,
    Descriptions,
    Drawer,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { Text } = Typography;
  const e = React.createElement;
  const { ListActions, ExportTrigger, SearchInput } = app.sharedActions;

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function toTreeOptions(types) {
    return (types || []).map(type => ({
      label: type.name,
      value: type.code,
      children: (type.sub_types || []).length ? toTreeOptions(type.sub_types) : undefined
    }));
  }

  // 客户详情抽屉：参考系统点击 User ID 打开客户详情，这里用客户列表数据承接
  function CustomerMiniDrawer({ open, userCode, onClose }) {
    const customers = app.mockData.customers || [];
    const customer = customers.find(item => item.userId === userCode);
    const detail = customer ? (app.mockData.customerDetails?.[customer.userId] || {}) : null;
    return e(Drawer, {
      open,
      onClose,
      width: 480,
      destroyOnClose: true,
      title: "客户详情"
    }, !customer ? e(Text, { type: "secondary" }, `未找到客户 ${textOrDash(userCode)}`) : [
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

  function FundFlowPage({ flows }) {
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({});
    const [exportOpen, setExportOpen] = React.useState(false);
    const [exportForm] = Form.useForm();
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailUserCode, setDetailUserCode] = React.useState(null);
    const fundTypes = app.mockData.fundFlowTypes || [];
    const treeOptions = toTreeOptions(fundTypes);

    // 资金类型级联值匹配：flow.fund_type_text 形如 “交易账户-充值”
    function matchFundType(flow, selected) {
      if (!selected || !selected.length) return true;
      const [typeName, subName] = flow.fund_type_text.split("-");
      if (selected.length >= 1 && selected[0]) {
        const type = fundTypes.find(item => item.code === selected[0]);
        if (!type || type.name !== typeName) return false;
      }
      if (selected.length >= 2 && selected[1]) {
        const sub = (fundTypes.find(item => item.code === selected[0])?.sub_types || []).find(item => item.code === selected[1]);
        if (!sub || sub.name !== subName) return false;
      }
      return true;
    }

    const list = (flows || []).filter(flow =>
      (!applied.user_code || String(flow.user_code).includes(applied.user_code.trim()))
      && (!applied.ticket || String(flow.id).includes(applied.ticket.trim()))
      && matchFundType(flow, applied.fund_type)
      && (!applied.created_time || (flow.created_at >= applied.created_time[0].format("YYYY-MM-DD HH:mm:ss") && flow.created_at <= applied.created_time[1].format("YYYY-MM-DD HH:mm:ss")))
    );

    function handleExport() {
      exportForm.validateFields().then(values => {
        message.success(`正在导出 ${values.filename || "fund-flows"}.${values.format}（原型演示）`);
        setExportOpen(false);
        exportForm.resetFields();
      }).catch(() => {});
    }

    const columns = [
      {
        title: "User ID",
        dataIndex: "user_code",
        fixed: "left",
        width: "10%",
        render: (value, record) => e("a", {
          style: { userSelect: "text" },
          onClick: event => {
            event.preventDefault();
            event.stopPropagation();
            setDetailUserCode(record.user_code);
            setDetailOpen(true);
          }
        }, textOrDash(value))
      },
      { title: "资金类型", dataIndex: "fund_type_text", width: "10%" },
      { title: "生成时间(GMT+0)", dataIndex: "created_at", width: "15%" },
      { title: "来源", dataIndex: "from" },
      { title: "去向", dataIndex: "to" },
      {
        title: "金额",
        dataIndex: "amount",
        width: "10%",
        render: value => e("span", { style: { color: String(value).startsWith("+") ? "#3f8600" : String(value).startsWith("-") ? "#cf1322" : undefined } }, textOrDash(value))
      },
      { title: "余额", dataIndex: "after_balance", width: "10%" }
    ];

    const secondaryActive = (applied.fund_type && applied.fund_type.length ? 1 : 0) + (applied.created_time ? 1 : 0);
    const [expanded, setExpanded] = React.useState(false);

    return e("section", { key: "fund-flow", className: "page-surface" }, [
      e(Form, {
        key: "filters",
        form,
        layout: "inline",
        className: "toolbar",
        onFinish: values => setApplied(values),
        onValuesChange: changed => {
          if (["fund_type", "created_time"].some(key => key in changed)) setApplied(form.getFieldsValue());
        },
        style: { rowGap: 16 }
      }, [
        e("div", { key: "primary", style: { display: "flex", gap: 16, flexWrap: "wrap", width: "100%" } }, [
          e(Form.Item, { key: "user", label: "User ID", name: "user_code" },
            e(SearchInput, { allowClear: true, placeholder: "User ID", style: { width: 200 }, onSearch: () => form.submit() })),
          e(Form.Item, { key: "ticket", label: "订单号", name: "ticket" },
            e(SearchInput, { allowClear: true, placeholder: "订单号", style: { width: 200 }, onSearch: () => form.submit() })),
          e(Form.Item, { key: "toggle" },
            e(Button, { type: "text", htmlType: "button", "aria-expanded": expanded, onClick: () => setExpanded(!expanded) }, [
              expanded ? "收起筛选" : "更多筛选",
              secondaryActive > 0 ? e("span", { key: "count", style: { marginLeft: 4, color: "#1677ff" } }, secondaryActive) : null
            ])),
          // 导出钉在卡片右上角（挂主行层，避开 antd Form.Item 的 relative 锚点）
          e(Form.Item, { key: "actions" },
            e(ListActions, {
              onReset: () => { form.resetFields(); setApplied({}); }
            })),
          e(ExportTrigger, { key: "export-pin", onClick: () => { exportForm.setFieldsValue({ format: "xlsx", filename: "" }); setExportOpen(true); } })
        ]),
        e("div", { key: "secondary", hidden: !expanded, style: { display: expanded ? "flex" : "none", gap: 16, flexWrap: "wrap", width: "100%" } }, [
          e(Form.Item, { key: "fund-type", label: "资金类型", name: "fund_type" },
            e(Cascader, {
              allowClear: true,
              showSearch: true,
              changeOnSelect: true,
              placeholder: "资金类型",
              options: treeOptions,
              style: { minWidth: 220, maxWidth: 420 }
            })),
          e(Form.Item, { key: "time", label: "生成时间(GMT+0)", name: "created_time" },
            e(RangePicker, { showTime: true, style: { width: 320 } }))
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: list,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1100 },
        locale: { emptyText: "暂无数据" }
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
          e(Input, { placeholder: "fund-flows" })),
        e(Form.Item, { key: "format", label: "文件格式", name: "format", rules: [{ required: true }] },
          e(Select, { options: [{ label: "xlsx", value: "xlsx" }, { label: "csv", value: "csv" }, { label: "xls", value: "xls" }] }))
      ])),
      e(CustomerMiniDrawer, {
        key: "detail",
        open: detailOpen,
        userCode: detailUserCode,
        onClose: () => { setDetailOpen(false); setDetailUserCode(null); }
      })
    ]);
  }

  app.FundFlowPage = FundFlowPage;
})(window.AdminApp);

(function registerFundsManagePage(app) {
  const {
    Alert,
    Button,
    Card,
    DatePicker,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { TextArea } = Input;
  const { Text } = Typography;
  const e = React.createElement;
  const { ListActions, SearchInput } = app.sharedActions;

  const DIRECTION_OPTIONS = [
    { label: "发放", value: "grant" },
    { label: "扣除", value: "deduct" }
  ];
  const DIRECTION_FILTER_OPTIONS = [
    { label: "发放", value: 1 },
    { label: "扣除", value: -1 }
  ];
  const SOURCE_OPTIONS = [
    { label: "系统", value: 1 },
    { label: "人工", value: 2 }
  ];
  const BATCH_STATUS_OPTIONS = [
    { label: "执行中", value: 1 },
    { label: "部分成功", value: 2 },
    { label: "成功", value: 3 },
    { label: "失败", value: 4 },
    { label: "已取消", value: 5 }
  ];
  const BATCH_STATUS_COLORS = { 1: "processing", 2: "warning", 3: "success", 4: "error", 5: "default" };

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function fmtMoney(value) {
    return value === undefined || value === null || value === "" ? "-" : `¥${value}`;
  }

  function directionText(direction) {
    return direction === "grant" || direction === 1 ? "发放" : direction === "deduct" || direction === -1 ? "扣除" : direction;
  }

  function nowStr() {
    return dayjs().format("YYYY-MM-DD HH:mm:ss");
  }

  // —— 单条操作提交表单 ——

  function SingleOperateForm({ form, fundTypes, activityTypes, onSubmit }) {
    const [submitting, setSubmitting] = React.useState(false);
    const fundTypeWatch = Form.useWatch("fund_type", form);
    const needActivity = activityTypes.includes(fundTypeWatch);

    function handleFinish(values) {
      setSubmitting(true);
      onSubmit(values, () => setSubmitting(false));
    }

    return e(Form, {
      form,
      layout: "horizontal",
      onFinish: handleFinish,
      initialValues: { direction: "grant" },
      labelCol: { style: { width: 110 } },
      style: { display: "flex", flexDirection: "column", gap: 12 }
    }, [
      e(Form.Item, { key: "direction", label: "管理方向", name: "direction", rules: [{ required: true, message: "请选择管理方向" }], style: { marginBottom: 0 } },
        e(Radio.Group, null, [
          e(Radio.Button, { key: "deduct", value: "deduct" }, "扣除"),
          e(Radio.Button, { key: "grant", value: "grant" }, "发放")
        ])),
      e(Form.Item, { key: "fund-type", label: "资金类型", name: "fund_type", rules: [{ required: true, message: "请选择资金类型" }], style: { marginBottom: 0 } },
        e(Select, { placeholder: "请选择资金类型", options: fundTypes.map(item => ({ label: item, value: item })), style: { width: 280 } })),
      e(Form.Item, { key: "amount", label: "扣除/发放金额", name: "amount", rules: [{ required: true, message: "请输入金额" }], style: { marginBottom: 0 } },
        e(InputNumber, { placeholder: "请输入扣除/发放金额", min: 0, precision: 2, style: { width: 280 } })),
      e(Form.Item, {
        key: "user-codes",
        label: "用户ID",
        name: "user_codes",
        rules: [
          { required: true, message: "请输入用户ID" },
          { validator: (_, value) => value && value.split(";").filter(item => item.trim()).length > 10
            ? Promise.reject(new Error("最多只能输入10个账号"))
            : Promise.resolve() }
        ],
        style: { marginBottom: 0 }
      },
        e(TextArea, { placeholder: "请输入用户ID，多个用户ID用；分割（最多十个）", rows: 2, style: { width: 360 } })),
      needActivity ? e(Form.Item, { key: "activity", label: "活动名称", name: "activity_name", rules: [{ required: true, message: "请输入活动名称" }], style: { marginBottom: 0 } },
        e(Input, { placeholder: "请输入活动名称", style: { width: 280 } })) : null,
      e(Form.Item, { key: "reason", label: "原因描述", name: "external_reason", rules: [{ required: true, message: "请输入原因描述" }], style: { marginBottom: 0 } },
        e(TextArea, { placeholder: "请输入原因描述", rows: 2, style: { width: 360 } })),
      e(Form.Item, { key: "submit", style: { marginBottom: 0 } },
        e(Button, { type: "primary", htmlType: "submit", loading: submitting }, "提交"))
    ]);
  }

  // —— 单条/批量 列表筛选（更多筛选渐进展开）；
  // 与 finance-shared 同款"回车即查/点选即查"：instantFields 里的字段改动即应用 ——
  function ProgressiveFilters({ form, primary, secondary, activeSecondaryCount, onSubmit, onReset, instantFields }) {
    const [expanded, setExpanded] = React.useState(false);
    const instant = instantFields || [];
    return e(Form, {
      form,
      layout: "inline",
      onFinish: onSubmit,
      onValuesChange: changed => {
        if (Object.keys(changed).some(key => instant.includes(key))) onSubmit(form.getFieldsValue());
      },
      style: { gap: 16, flexWrap: "wrap" }
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
          e(ListActions, { onReset }))
      ]),
      secondary ? e("div", { key: "secondary", hidden: !expanded, style: { display: expanded ? "flex" : "none", gap: 16, flexWrap: "wrap", width: "100%" } }, secondary) : null
    ]);
  }

  // —— 批量操作结果弹窗（提交确认 / 详情查看） ——

  function BatchResultModal({ open, mode, detail, onClose, onSubmit, submitting }) {
    if (!detail) return null;
    const isConfirm = mode === "confirm";
    const items = detail.items || [];
    const columns = [
      { title: "序号", key: "index", width: 60, render: (_, __, index) => index + 1 },
      { title: "用户ID", dataIndex: "user_code", width: 120 },
      { title: "金额", dataIndex: "amount", width: 100, render: fmtMoney },
      { title: "活动名称", dataIndex: "activity_name", width: 150, render: textOrDash },
      { title: "原因描述", dataIndex: "reason", width: 150, render: textOrDash },
      ...(mode === "view" && detail.status !== 0 ? [{ title: "失败原因", dataIndex: "error_message", width: 150, render: textOrDash }] : [])
    ];
    return e(Modal, {
      open,
      title: isConfirm ? "批量操作-提交确认" : "批量操作-详情查看",
      onClose: null,
      onCancel: onClose,
      width: 1100,
      footer: isConfirm || detail.status === 0
        ? e(Space, { style: { width: "100%", justifyContent: "flex-start" } }, [
            e(Button, { key: "submit", type: "primary", onClick: onSubmit, loading: submitting }, "提交"),
            e(Button, { key: "cancel", onClick: onClose }, "取消")
          ])
        : e(Space, { style: { width: "100%", justifyContent: "flex-end" } },
            e(Button, { key: "close", onClick: onClose }, "关闭"))
    }, [
      e(Alert, {
        key: "dir",
        type: "info",
        showIcon: true,
        style: { marginBottom: 16 },
        message: `管理方向：${directionText(detail.direction)} | 资金类型：${detail.fundTypeText}`
      }),
      e(Alert, {
        key: "valid",
        type: "success",
        showIcon: true,
        style: { marginBottom: 16 },
        message: `有效信息：${detail.validCount}条（总金额：¥${detail.totalAmount}）`
      }),
      !isConfirm && detail.summary ? e(Descriptions, {
        key: "summary",
        title: "汇总信息",
        column: 3,
        size: "small",
        bordered: true,
        style: { marginBottom: 16 }
      }, [
        e(Descriptions.Item, { key: "total-count", label: "总数量" }, detail.summary.total_count),
        e(Descriptions.Item, { key: "success-count", label: "成功数量" }, detail.summary.success_count),
        e(Descriptions.Item, { key: "fail-count", label: "失败数量" }, detail.summary.fail_count),
        e(Descriptions.Item, { key: "total-amount", label: "总金额" }, fmtMoney(detail.summary.total_amount)),
        e(Descriptions.Item, { key: "success-amount", label: "成功金额" }, fmtMoney(detail.summary.success_amount)),
        e(Descriptions.Item, { key: "fail-amount", label: "失败金额" }, fmtMoney(detail.summary.fail_amount))
      ]) : null,
      e(Table, {
        key: "items",
        title: () => "信息详情",
        columns,
        dataSource: items,
        rowKey: (_, index) => String(index),
        pagination: { pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: total => `共 ${total} 条` },
        size: "small",
        scroll: { x: 900 }
      })
    ]);
  }

  function FundsManagePage({ records, setRecords, batchRecords, setBatchRecords, fundTypes }) {
    const [activeTab, setActiveTab] = React.useState("single");

    // 单条操作
    const [operateForm] = Form.useForm();
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [pendingSubmit, setPendingSubmit] = React.useState(null);

    // 单条列表
    const [singleForm] = Form.useForm();
    const [singleApplied, setSingleApplied] = React.useState({});

    // 批量上传
    const [uploadForm] = Form.useForm();
    const [batchResultOpen, setBatchResultOpen] = React.useState(false);
    const [batchResultMode, setBatchResultMode] = React.useState("confirm");
    const [batchDetail, setBatchDetail] = React.useState(null);

    // 批量列表
    const [batchForm] = Form.useForm();
    const [batchApplied, setBatchApplied] = React.useState({});

    const activityTypes = ["活动奖励", "赠金调整"];

    function confirmSingle(values, done) {
      setPendingSubmit(values);
      setConfirmOpen(true);
      done();
    }

    function submitSingle() {
      if (!pendingSubmit) return;
      const codes = pendingSubmit.user_codes.split(";").map(item => item.trim()).filter(Boolean);
      const baseId = records.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const newRecords = codes.map((code, index) => ({
        id: baseId + index,
        user_code: code,
        direction: directionText(pendingSubmit.direction),
        payable_deduction_amount: Number(pendingSubmit.amount).toFixed(2),
        amount: Number(pendingSubmit.amount).toFixed(2),
        operation_source: "人工",
        fund_type_text: pendingSubmit.fund_type,
        reason: pendingSubmit.external_reason,
        remark: pendingSubmit.activity_name || "",
        operator_name: "Andy",
        created_at: nowStr()
      }));
      setRecords(list => [...newRecords, ...list]);
      message.success("提交成功");
      setConfirmOpen(false);
      setPendingSubmit(null);
      operateForm.resetFields();
      operateForm.setFieldsValue({ direction: "grant" });
    }

    const singleFiltered = records.filter(record =>
      (!singleApplied.user_code || record.user_code.includes(singleApplied.user_code.trim()))
      && (!singleApplied.direction || record.direction === singleApplied.direction)
      && (!singleApplied.operation_source || record.operation_source === singleApplied.operation_source)
      && (!singleApplied.fund_type || record.fund_type_text === singleApplied.fund_type)
      && (!singleApplied.operate_time || (record.created_at >= singleApplied.operate_time[0].format("YYYY-MM-DD HH:mm:ss") && record.created_at <= singleApplied.operate_time[1].format("YYYY-MM-DD HH:mm:ss")))
    );

    const singleColumns = [
      { title: "用户ID", dataIndex: "user_code", width: 100 },
      { title: "管理方向", dataIndex: "direction", width: 80, render: value => e(Tag, { color: value === "发放" ? "green" : "red" }, value) },
      { title: "操作金额", dataIndex: "payable_deduction_amount", width: 120, render: fmtMoney },
      { title: "实际金额", dataIndex: "amount", width: 120, render: fmtMoney },
      { title: "操作来源", dataIndex: "operation_source", width: 80 },
      { title: "资金类型", dataIndex: "fund_type_text", width: 120 },
      { title: "对外原因描述", dataIndex: "reason", width: 150, ellipsis: true, render: textOrDash },
      { title: "活动名称", dataIndex: "remark", width: 150, render: textOrDash },
      { title: "操作人", dataIndex: "operator_name", width: 100 },
      { title: "操作时间", dataIndex: "created_at", width: 160 }
    ];

    function handleUpload() {
      const fundType = uploadForm.getFieldValue("fund_type");
      if (!fundType) {
        message.warning("请先选择资金类型");
        return false;
      }
      const direction = uploadForm.getFieldValue("direction") || "grant";
      const items = [
        { user_code: "315899879", amount: "300.00", activity_name: `${fundType}-批量`, reason: "批量导入发放", error_message: "" },
        { user_code: "499516984", amount: "500.00", activity_name: `${fundType}-批量`, reason: "批量导入发放", error_message: "" },
        { user_code: "766328994", amount: "120.00", activity_name: `${fundType}-批量`, reason: "批量导入发放", error_message: "" }
      ];
      setBatchDetail({
        direction,
        fundTypeText: fundType,
        validCount: items.length,
        totalAmount: items.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2),
        items,
        status: 0
      });
      setBatchResultMode("confirm");
      setBatchResultOpen(true);
      message.success("上传解析成功");
      return false;
    }

    function downloadTemplate() {
      const fundType = uploadForm.getFieldValue("fund_type");
      if (!fundType) {
        message.warning("请先选择资金类型");
        return;
      }
      message.success("模板已开始下载（原型演示）");
    }

    function submitBatch() {
      if (!batchDetail) return;
      const detail = batchDetail;
      const nextId = batchRecords.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      setBatchRecords(list => [{
        id: nextId,
        direction_text: directionText(batchDetail.direction),
        fund_type_text: batchDetail.fundTypeText,
        created_by_name: "Andy",
        created_at: nowStr(),
        total_count: batchDetail.items.length,
        success_count: batchDetail.items.length,
        fail_count: 0,
        success_amount: batchDetail.totalAmount,
        status: 3,
        status_text: "成功",
        remark: ""
      }, ...list]);
      app.mockData.fundBatchItemsByJob[nextId] = detail.items;
      setBatchResultOpen(false);
      setBatchDetail(null);
      Modal.confirm({
        title: "提交成功",
        icon: null,
        content: e("div", { style: { padding: "16px 0", textAlign: "center" } }, [
          e("div", { key: "icon", style: { fontSize: 48, marginBottom: 16, color: "#52c41a" } }, "✓"),
          e("div", { key: "text", style: { fontSize: 16 } }, "批量操作提交成功")
        ]),
        okText: "确认",
        cancelText: "取消",
        width: 400,
        onOk: () => {},
        onCancel: () => {}
      });
    }

    function viewBatchDetail(record) {
      const items = app.mockData.fundBatchItemsByJob[record.id] || [];
      setBatchDetail({
        direction: record.direction_text === "发放" ? "grant" : "deduct",
        fundTypeText: record.fund_type_text,
        validCount: record.total_count,
        totalAmount: record.success_amount,
        items,
        summary: {
          total_count: record.total_count,
          success_count: record.success_count,
          fail_count: record.fail_count,
          total_amount: record.success_amount,
          success_amount: record.success_amount,
          fail_amount: "0.00"
        },
        status: record.status
      });
      setBatchResultMode("view");
      setBatchResultOpen(true);
    }

    const batchFiltered = batchRecords.filter(record =>
      (!batchApplied.created_by || record.created_by_name.includes(batchApplied.created_by.trim()))
      && (!batchApplied.direction || record.direction_text === batchApplied.direction)
      && (!batchApplied.fund_type || record.fund_type_text === batchApplied.fund_type)
      && (!batchApplied.status || record.status === batchApplied.status)
      && (!batchApplied.created_time || (record.created_at >= batchApplied.created_time[0].format("YYYY-MM-DD HH:mm:ss") && record.created_at <= batchApplied.created_time[1].format("YYYY-MM-DD HH:mm:ss")))
    );

    const batchColumns = [
      { title: "管理方向", dataIndex: "direction_text", width: 80, render: value => e(Tag, { color: value === "发放" ? "green" : "red" }, value) },
      { title: "资金类型", dataIndex: "fund_type_text", width: 120 },
      { title: "操作人", dataIndex: "created_by_name", width: 100 },
      { title: "操作时间", dataIndex: "created_at", width: 160 },
      { title: "提交信息数量", dataIndex: "total_count", width: 120 },
      { title: "成功信息数量", dataIndex: "success_count", width: 120, render: value => e("span", { style: { color: "#52c41a" } }, value) },
      { title: "失败信息数量", dataIndex: "fail_count", width: 120, render: value => e("span", { style: { color: "#ff4d4f" } }, value) },
      { title: "成功信息总金额", dataIndex: "success_amount", width: 130, render: value => e("span", { style: { color: Number(String(value).replace(/,/g, "")) >= 0 ? "#52c41a" : "#ff4d4f" } }, fmtMoney(value)) },
      { title: "结果状态", dataIndex: "status_text", width: 100, render: (value, record) => e(Tag, { color: BATCH_STATUS_COLORS[record.status] || "default" }, value) },
      { title: "结果详情", dataIndex: "remark", width: 100, render: (_, record) => e(Button, { type: "link", size: "small", onClick: () => viewBatchDetail(record) }, "查看") }
    ];

    const singleSecondaryActive = (singleApplied.fund_type ? 1 : 0) + (singleApplied.operate_time ? 1 : 0);
    const batchSecondaryActive = (batchApplied.status ? 1 : 0) + (batchApplied.created_time ? 1 : 0);

    return e("section", { className: "page-surface" }, [
      e(Card, { title: "资金管理", styles: { body: { paddingTop: 16 } } }, [
      e(Tabs, {
        key: "tabs",
        activeKey: activeTab,
        onChange: setActiveTab,
        destroyOnHidden: true,
        style: { flex: 1, minHeight: 0 },
        items: [
          {
            key: "single",
            label: "单条操作",
            children: e("div", { style: { height: "100%", overflow: "auto" } }, [
              e("div", { key: "operate", style: { marginBottom: 8 } },
                e(SingleOperateForm, { form: operateForm, fundTypes, activityTypes, onSubmit: confirmSingle })),
              e("hr", { key: "divider", style: { border: "none", borderTop: "1px dashed #d9d9d9", margin: "8px 0" } }),
              e(ProgressiveFilters, {
                key: "filters",
                form: singleForm,
                loading: false,
                activeSecondaryCount: singleSecondaryActive,
                onSubmit: values => setSingleApplied(values),
                onReset: () => { singleForm.resetFields(); setSingleApplied({}); },
                instantFields: ["direction", "operation_source", "fund_type", "operate_time"],
                primary: [
                  e(Form.Item, { key: "user", label: "用户ID", name: "user_code" },
                    e(SearchInput, { allowClear: true, placeholder: "用户ID", style: { width: 160 }, onSearch: () => singleForm.submit() })),
                  e(Form.Item, { key: "direction", label: "管理方向", name: "direction" },
                    e(Select, { allowClear: true, placeholder: "管理方向", options: DIRECTION_FILTER_OPTIONS.map(item => ({ label: item.label, value: item.label })), style: { width: 160 } })),
                  e(Form.Item, { key: "source", label: "操作来源", name: "operation_source" },
                    e(Select, { allowClear: true, placeholder: "操作来源", options: SOURCE_OPTIONS.map(item => ({ label: item.label, value: item.label })), style: { width: 160 } }))
                ],
                secondary: [
                  e(Form.Item, { key: "fund-type", label: "资金类型", name: "fund_type" },
                    e(Select, { allowClear: true, placeholder: "资金类型", options: fundTypes.map(item => ({ label: item, value: item })), style: { width: 180 } })),
                  e(Form.Item, { key: "time", label: "操作时间", name: "operate_time" },
                    e(RangePicker, { showTime: true, style: { width: 320 } }))
                ]
              }),
              e("div", { key: "table-gap", style: { height: 16 } }),
              e(Table, {
                key: "table",
                rowKey: "id",
                columns: singleColumns,
                dataSource: singleFiltered,
                pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
                scroll: { x: 1300 },
                locale: { emptyText: "暂无数据" }
              })
            ])
          },
          {
            key: "batch",
            label: "批量操作",
            children: e("div", { style: { height: "100%", overflow: "auto" } }, [
              e(Form, {
                key: "upload",
                form: uploadForm,
                layout: "horizontal",
                initialValues: { direction: "grant" },
                labelCol: { style: { width: 110 } },
                style: { display: "flex", flexDirection: "column", gap: 12 }
              }, [
                e(Form.Item, { key: "direction", label: "管理方向", name: "direction", style: { marginBottom: 0 } },
                  e(Radio.Group, null, [
                    e(Radio.Button, { key: "deduct", value: "deduct" }, "扣除"),
                    e(Radio.Button, { key: "grant", value: "grant" }, "发放")
                  ])),
                e(Form.Item, {
                  key: "fund-type",
                  label: "资金类型",
                  name: "fund_type",
                  rules: [{ required: true, message: "请选择资金类型" }],
                  style: { marginBottom: 0 }
                },
                  e(Space, null, [
                    e(Select, {
                      placeholder: "请选择资金类型",
                      options: fundTypes.map(item => ({ label: item, value: item })),
                      style: { width: 220 },
                      onChange: value => uploadForm.setFieldValue("fund_type", value)
                    }),
                    e(Button, { onClick: downloadTemplate }, "下载模板")
                  ])),
                e(Form.Item, { key: "upload", label: "", style: { marginBottom: 0 } },
                  e(Button, { type: "primary", onClick: handleUpload }, "上传文件"))
              ]),
              e("hr", { key: "divider", style: { border: "none", borderTop: "1px dashed #d9d9d9", margin: "8px 0" } }),
              e(ProgressiveFilters, {
                key: "filters",
                form: batchForm,
                loading: false,
                activeSecondaryCount: batchSecondaryActive,
                onSubmit: values => setBatchApplied(values),
                onReset: () => { batchForm.resetFields(); setBatchApplied({}); },
                instantFields: ["direction", "fund_type", "status", "created_time"],
                primary: [
                  e(Form.Item, { key: "operator", label: "操作人ID", name: "created_by" },
                    e(SearchInput, { allowClear: true, placeholder: "操作人ID", style: { width: 160 }, onSearch: () => batchForm.submit() })),
                  e(Form.Item, { key: "direction", label: "管理方向", name: "direction" },
                    e(Select, { allowClear: true, placeholder: "管理方向", options: DIRECTION_FILTER_OPTIONS.map(item => ({ label: item.label, value: item.label })), style: { width: 160 } })),
                  e(Form.Item, { key: "fund-type", label: "资金类型", name: "fund_type" },
                    e(Select, { allowClear: true, placeholder: "资金类型", options: fundTypes.map(item => ({ label: item, value: item })), style: { width: 180 } }))
                ],
                secondary: [
                  e(Form.Item, { key: "status", label: "结果状态", name: "status" },
                    e(Select, { allowClear: true, placeholder: "结果状态", options: BATCH_STATUS_OPTIONS, style: { width: 160 } })),
                  e(Form.Item, { key: "time", label: "操作时间", name: "created_time" },
                    e(RangePicker, { showTime: true, style: { width: 320 } }))
                ]
              }),
              e("div", { key: "table-gap", style: { height: 16 } }),
              e(Table, {
                key: "table",
                rowKey: "id",
                columns: batchColumns,
                dataSource: batchFiltered,
                pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
                scroll: { x: 1400 },
                locale: { emptyText: "暂无数据" }
              })
            ])
          }
        ]
      }),
      e(Modal, {
        key: "single-confirm",
        title: e("span", null, [
          "确认提交",
          " - ",
          e("span", { key: "dir", style: { color: pendingSubmit?.direction === "grant" ? "#52c41a" : "#ff4d4f" } },
            pendingSubmit ? directionText(pendingSubmit.direction) : "")
        ]),
        open: confirmOpen,
        onOk: submitSingle,
        onCancel: () => { setConfirmOpen(false); setPendingSubmit(null); },
        okText: "确认",
        cancelText: "取消",
        width: 500
      }, pendingSubmit ? [
        e("div", { key: "reason", style: { marginBottom: 16 } }, [
          e("div", { key: "label", style: { fontWeight: 500, marginBottom: 8 } }, "原因描述："),
          e("div", { key: "value", style: { color: "#666" } }, pendingSubmit.external_reason)
        ]),
        e("div", { key: "codes" }, [
          e("div", { key: "label", style: { fontWeight: 500, marginBottom: 8 } }, "用户ID："),
          e("div", { key: "value", style: { color: "#1677ff", wordBreak: "break-all", background: "#f5f5f5", padding: 12, borderRadius: 4 } }, pendingSubmit.user_codes)
        ]),
        pendingSubmit.activity_name ? e("div", { key: "activity", style: { marginTop: 16 } }, [
          e("div", { key: "label", style: { fontWeight: 500, marginBottom: 8 } }, "活动名称："),
          e("div", { key: "value", style: { color: "#666" } }, pendingSubmit.activity_name)
        ]) : null,
        e("div", { key: "amount", style: { marginTop: 16 } }, [
          e("div", { key: "label", style: { fontWeight: 500, marginBottom: 8 } }, "金额："),
          e("div", { key: "value", style: { color: "#52c41a", fontSize: 16 } }, `¥${Number(pendingSubmit.amount).toFixed(2)}`)
        ])
      ] : null),
      e(BatchResultModal, {
        key: "batch-result",
        open: batchResultOpen,
        mode: batchResultMode,
        detail: batchDetail,
        onClose: () => { setBatchResultOpen(false); setBatchDetail(null); },
        onSubmit: submitBatch,
        submitting: false
      })
    ])
    ]);
  }

  app.FundsManagePage = FundsManagePage;
})(window.AdminApp);

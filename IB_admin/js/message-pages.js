(function registerMessagePages(app) {
  const {
    Button,
    Form,
    Input,
    Modal,
    Radio,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const { TextArea } = Input;
  const e = React.createElement;

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function langLabel(key) {
    const found = (app.mockData.messageLanguages || []).find(item => item.key === key || item.value === key);
    return found ? found.value : key;
  }

  // 多语言对象 { 英语: "xx" } 按语言逐行渲染：语言（加粗）：内容
  function renderLocaleObject(value) {
    if (!value || typeof value !== "object") return textOrDash(value);
    const entries = Object.entries(value).filter(([, text]) => text);
    if (!entries.length) return "-";
    return e("div", null, entries.map(([lang, text]) => e(Typography.Paragraph, {
      key: lang,
      style: { marginBottom: 2 },
      ellipsis: { rows: 2 }
    }, [
      e(Text, { strong: true, key: "lang" }, `${langLabel(lang)}：`),
      e(Text, { key: "text" }, text)
    ])));
  }

  // —— 消息管理 ——

  function MessageManagePage({ messages, setMessages }) {
    const [createOpen, setCreateOpen] = React.useState(false);
    const [form] = Form.useForm();
    const [modal, modalContextHolder] = antd.Modal.useModal();
    const langOptions = app.mockData.messageLanguages || [];
    const typeWatch = Form.useWatch("type", form);

    function closeCreate() {
      setCreateOpen(false);
      form.resetFields();
    }

    function doSend(values) {
      const title = {};
      const content = {};
      (values.localeConfigs || []).forEach(row => {
        if (row.lang && row.title) title[row.lang] = row.title;
        if (row.lang && row.content) content[row.lang] = row.content;
      });
      const nextId = messages.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      setMessages(list => [{
        id: nextId,
        resource: values.type === 1 ? "指定客户" : "所有客户",
        user_code: values.type === 1 ? (values.targetIds || "").trim() : "",
        title,
        content,
        created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        status: 0
      }, ...list]);
      message.success("消息发送成功");
      closeCreate();
    }

    function handleOk() {
      form.validateFields().then(values => {
        modal.confirm({
          title: "确认发送",
          content: "确认发送消息给客户吗？",
          okText: "确定",
          cancelText: "取消",
          onOk: () => doSend(values)
        });
      }).catch(() => {});
    }

    // 重置按钮在取消键上：点击“重置”还原表单而不是关闭弹窗
    function handleCancel(event) {
      if (event?.currentTarget?.dataset?.action === "reset") {
        form.resetFields();
        form.setFieldsValue({ type: 0 });
        return;
      }
      closeCreate();
    }

    const columns = [
      { title: "发送类型", dataIndex: "resource", width: "15%", render: textOrDash },
      {
        title: "发送子账户",
        dataIndex: "user_code",
        width: "20%",
        render: value => {
          if (typeof value === "string") {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : "全部";
          }
          return value === null || value === undefined ? "全部" : textOrDash(value);
        }
      },
      { title: "外部展示标题", dataIndex: "title", width: "35%", render: renderLocaleObject },
      { title: "内容", dataIndex: "content", width: "35%", render: renderLocaleObject },
      { title: "发送时间", dataIndex: "created_at", width: 170, render: textOrDash },
      {
        title: "状态",
        dataIndex: "status",
        width: 90,
        fixed: "right",
        render: value => e(Tag, { color: Number(value) === 1 ? "success" : "default" }, Number(value) === 1 ? "已查看" : "未查看")
      }
    ];

    return e("section", { key: "message-manage", className: "page-surface" }, [
      modalContextHolder,
      e("div", { key: "toolbar", style: { marginBottom: 12 } },
        e(Button, { type: "primary", onClick: () => setCreateOpen(true) }, "创建")),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: messages,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1200 },
        locale: { emptyText: "暂无数据" }
      }),
      e(Modal, {
        key: "create",
        open: createOpen,
        width: 640,
        destroyOnClose: true,
        forceRender: true,
        onCancel: handleCancel,
        onOk: handleOk,
        title: "创建消息",
        okText: "发送",
        cancelText: "重置",
        cancelButtonProps: { "data-action": "reset" },
        styles: { body: { maxHeight: "75vh", overflow: "auto" } }
      }, e(Form, { form, layout: "vertical", initialValues: { type: 0, localeConfigs: [{ lang: "英语", title: "", content: "" }] }, onFinish: doSend }, [
        e(Form.Item, { key: "type", label: "发送类型", name: "type", rules: [{ required: true, message: "请选择发送类型" }] },
          e(Radio.Group, null, [
            e(Radio, { key: "all", value: 0 }, "所有客户"),
            e(Radio, { key: "specific", value: 1 }, "指定客户")
          ])),
        typeWatch === 1 ? e(Form.Item, {
          key: "target",
          label: "指定客户",
          name: "targetIds",
          rules: [{ required: true, message: "请输入通行证 ID，多个请用逗号分隔" }]
        },
          e(Input, { placeholder: "通行证 ID，多个请用逗号分隔" })) : null,
        e(Form.List, {
          key: "locales",
          name: "localeConfigs",
          rules: [{
            validator: (_, value) => (!value || value.length === 0)
              ? Promise.reject(new Error("请先添加语言配置"))
              : Promise.resolve()
          }]
        }, (fields, { add, remove }, { errors }) => e(React.Fragment, null, [
          e("div", {
            key: "header",
            style: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "2px solid #f0f0f0", fontWeight: 500, color: "#595959" }
          }, [
            e("div", { key: "lang", style: { width: 160 } }, "选择语言"),
            e("div", { key: "title", style: { flex: 1 } }, "外部展示标题"),
            e("div", { key: "content", style: { flex: 1.4 } }, "内容"),
            e("div", { key: "actions", style: { width: 48 } })
          ]),
          fields.map(field => e("div", {
            key: field.key,
            style: { display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0f0f0" }
          }, [
            e(Form.Item, {
              key: "lang",
              name: [field.name, "lang"],
              rules: [{ required: true, message: "请选择语言" }],
              style: { width: 160, marginBottom: 0 }
            },
              e(Select, { options: langOptions.map(item => ({ label: item.value, value: item.value })), placeholder: "选择语言" })),
            e(Form.Item, {
              key: "title",
              name: [field.name, "title"],
              rules: [{ required: true, message: "请输入该语言的标题" }],
              style: { flex: 1, marginBottom: 0 }
            },
              e(Input, { placeholder: "请输入该语言的标题" })),
            e(Form.Item, {
              key: "content",
              name: [field.name, "content"],
              rules: [{ required: true, message: "请输入该语言的内容" }],
              style: { flex: 1.4, marginBottom: 0 }
            },
              e(TextArea, { rows: 2, placeholder: "请输入该语言的内容" })),
            e(Button, {
              key: "remove",
              type: "link",
              danger: true,
              disabled: fields.length <= 1,
              onClick: () => remove(field.name)
            }, "移除")
          ])),
          e(Form.ErrorList, { key: "errors", errors }),
          e("div", { key: "add", style: { padding: "12px 0" } },
            e("a", { onClick: () => add({ lang: langOptions[0]?.value || "", title: "", content: "" }) }, "+ 新增语言配置"))
        ]))
      ]))
    ]);
  }

  // —— 查询验证码 ——

  function EmailCodePage({ logs, setLogs }) {
    const [form] = Form.useForm();
    const [code, setCode] = React.useState("");

    function handleQuery(values) {
      setCode("");
      const email = values.email.trim();
      const known = (app.mockData.emailCodeLogs || []).find(item => item.email === email);
      if (!known) {
        message.warning("未查询到验证码，请确认邮箱地址");
      } else {
        setCode(String(100000 + email.length * 13771).slice(0, 6));
      }
      setLogs(list => [{
        email,
        reason: values.reason.trim(),
        user_code: known ? known.user_code : "0",
        operator_name: "Andy",
        operated_at: dayjs().format("YYYY-MM-DD HH:mm:ss")
      }, ...list]);
    }

    async function handleCopy() {
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        message.success("已复制");
      } catch (error) {
        message.error("复制失败");
      }
    }

    const columns = [
      { title: "邮箱地址", dataIndex: "email", width: "24%", render: textOrDash },
      { title: "查询原因", dataIndex: "reason", width: "28%", render: textOrDash },
      { title: "用户ID", dataIndex: "user_code", width: "14%", render: value => String(value ?? "") === "0" ? textOrDash(null) : textOrDash(value) },
      { title: "操作人", dataIndex: "operator_name", width: "16%", render: textOrDash },
      { title: "操作时间(GMT+0)", dataIndex: "operated_at", width: "18%", render: textOrDash }
    ];

    return e("section", { key: "email-code", className: "page-surface" }, [
      e(Form, {
        key: "query-form",
        form,
        labelCol: { style: { flex: "0 0 180px", textAlign: "start" } },
        wrapperCol: { style: { flex: "0 0 auto" } },
        layout: "horizontal",
        onValuesChange: () => setCode(""),
        onFinish: handleQuery,
        initialValues: { email: "", reason: "" },
        style: { display: "flex", flexDirection: "column", gap: 20 }
      }, [
        e(Form.Item, {
          key: "email",
          label: "邮箱地址",
          name: "email",
          style: { marginBottom: 0 },
          rules: [
            { required: true, message: "请输入邮箱地址" },
            { type: "email", message: "邮箱格式不正确" }
          ]
        },
          e(Input, { allowClear: true, placeholder: "请输入邮箱地址", style: { width: 220 } })),
        e(Form.Item, {
          key: "reason",
          label: "查询原因",
          name: "reason",
          style: { marginBottom: 0 },
          rules: [{ required: true, message: "请输入查询原因" }]
        },
          e(Input, { allowClear: true, placeholder: "请输入查询原因", style: { width: 220 } })),
        e(Form.Item, { key: "submit", style: { marginBottom: 12 } },
          e(Button, { type: "primary", htmlType: "submit" }, "查询验证码")),
        e(Form.Item, { key: "result", label: "验证码", style: { marginBottom: 0 } },
          e(Space, { size: 12 }, [
            e(Input, { "aria-label": "验证码", placeholder: "验证码", readOnly: true, style: { width: 220 }, value: code }),
            e(Button, { type: "primary", onClick: handleCopy }, "复制")
          ]))
      ]),
      e("div", { key: "divider", style: { height: 16 } }),
      e(Table, {
        key: "table",
        rowKey: record => `${record.email}-${record.reason}-${record.operated_at ?? ""}`,
        columns,
        dataSource: logs,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        locale: { emptyText: "暂无数据" }
      })
    ]);
  }

  app.MessageManagePage = MessageManagePage;
  app.EmailCodePage = EmailCodePage;
})(window.AdminApp);

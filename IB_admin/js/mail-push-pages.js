(function registerMailPushPages(app) {
  const {
    Button,
    Card,
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
  const { Text, Title, Paragraph } = Typography;
  const { TextArea } = Input;
  const e = React.createElement;

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function langLabel(key) {
    const found = (app.mockData.messageLanguages || []).find(item => item.key === key || item.value === key);
    return found ? found.value : key;
  }

  const CONTENT_STYLE_MAP = {
    0: { label: "默认", color: "default" },
    1: { label: "绿色", color: "green" },
    2: { label: "红色", color: "red" }
  };

  function parseBlocks(content) {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object" && "v" in parsed) return [parsed];
    } catch (error) { /* 纯文本内容 */ }
    return [];
  }

  function parseVariables(content) {
    if (!content) return [];
    const list = Array.from(String(content).matchAll(/\{\{([^{}]+)\}\}/g));
    return [...new Set(list.map(match => `{{${match[1].trim()}}}`))];
  }

  // —— 变量侧栏：点击插入到内容末尾（原型模拟光标插入） ——
  function VariablesPanel({ variables, onInsert }) {
    return e(Card, {
      size: "small",
      title: "该事件可用变量",
      style: { width: 320 }
    }, [
      e(Text, { key: "desc", type: "secondary" }, "点击插入到当前内容光标处"),
      !variables.length
        ? e(Text, { key: "empty", type: "secondary" }, "暂无数据")
        : e("div", { key: "list" }, variables.map(item => e("div", {
            key: item.variable,
            onClick: () => onInsert && onInsert(item.variable),
            style: { borderRadius: 8, padding: 12, margin: "8px 0", border: "1px solid #f0f0f0", cursor: "pointer" }
          }, [
            e(Text, { key: "name", strong: true, style: { display: "block" } }, item.variable),
            e(Text, { key: "desc-item", type: "secondary", style: { display: "block", marginTop: 4 } }, item.description)
          ])))
    ]);
  }

  // —— 测试发送弹窗（邮件 type=1 / 站内信 type=2 共用） ——
  function TestSendModal({ open, record, onCancel }) {
    const [form] = Form.useForm();
    const isSite = record?.type === 2;
    const variables = record ? parseVariables(typeof record.content === "string" ? record.content : "") : [];

    React.useEffect(() => {
      if (!open) return;
      const initialVars = {};
      variables.forEach(item => { initialVars[item] = ""; });
      form.setFieldsValue({ receiver: undefined, vars: initialVars });
    }, [open, record, form]);

    function handleOk() {
      form.validateFields().then(() => {
        message.success("测试发送完成");
        onCancel();
      }).catch(() => {});
    }

    return e(Modal, {
      open,
      title: e(Text, null, ["测试发送", " - ", record?.title || "-"]),
      onCancel,
      onOk: handleOk,
      destroyOnClose: true,
      forceRender: true,
      maskClosable: false,
      okText: "确定",
      cancelText: "取消"
    }, e(Form, { form, layout: "vertical" }, [
      ...variables.map(name => e(Form.Item, {
        key: name,
        label: name,
        name: ["vars", name],
        rules: [{ required: true, message: "请输入变量值" }]
      },
        e(Input, { placeholder: "请输入变量值" }))),
      e(Form.Item, {
        key: "receiver",
        label: isSite ? "接收账号" : "接收邮箱",
        name: "receiver",
        rules: [{ required: true, message: isSite ? "请输入接收账号" : "请输入接收邮箱" }]
      },
        e(TextArea, { rows: 3, placeholder: (isSite ? "请输入接收账号" : "请输入接收邮箱") + "，多个请用逗号分隔" }))
    ]));
  }

  // —— 通知列表外壳：列表 + 筛选 + 删除确认；新建/修改/测试/详情由页面层弹窗承接 ——
  function NoticeListShell({ notices, setNotices, includeLayoutColumn, onCreate, onEdit, onTest, onRow }) {
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({});
    const events = app.mockData.mailEvents || [];
    const langOptions = app.mockData.messageLanguages || [];

    const eventOptions = events.map(item => ({ label: String(item.description ?? ""), value: String(item.value ?? "") })).filter(item => item.value);
    const langSelectOptions = langOptions.map(item => ({ label: item.value ?? "-", value: item.value })).filter(item => item.value);

    const filtered = (notices || []).filter(notice =>
      (!applied.event_key || notice.event_key === applied.event_key)
      && (!applied.lang || notice.lang === applied.lang)
      && (!applied.title || String(notice.title || "").includes(String(applied.title).trim()))
    );

    function handleDelete(record) {
      Modal.confirm({
        title: "确认删除该消息模板？",
        okText: "确定",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk: () => {
          setNotices(list => list.filter(item => item.id !== record.id));
          message.success("删除成功");
        }
      });
    }

    const columns = [
      { title: "外部展示标题", dataIndex: "title", render: textOrDash },
      { title: "语言", dataIndex: "lang", width: 140, render: value => textOrDash(langLabel(value)) }
    ];
    if (includeLayoutColumn) {
      columns.push({ title: "Layout 模版", dataIndex: "layout_name", render: textOrDash });
    }
    columns.push(
      { title: "触发事件", dataIndex: "event_text", render: (value, record) => textOrDash(String(value || "").trim() || record.event_key) },
      {
        title: "操作",
        key: "actions",
        width: 220,
        fixed: "right",
        render: (_, record) => e(Space, { key: "space" }, [
          e(Button, { key: "edit", type: "primary", size: "small", onClick: event => { event.stopPropagation(); onEdit(record); } }, "修改"),
          e(Button, { key: "test", type: "primary", size: "small", onClick: event => { event.stopPropagation(); onTest(record); } }, "测试"),
          e(Button, { key: "delete", type: "primary", size: "small", danger: true, onClick: event => { event.stopPropagation(); handleDelete(record); } }, "删除")
        ])
      }
    );

    return e("section", { key: "notice-shell", className: "page-surface" }, [
      e(Form, { key: "filters", layout: "inline", className: "toolbar", form, onFinish: values => setApplied(values) }, [
        e(Form.Item, { key: "event", label: "触发事件", name: "event_key" },
          e(Select, { allowClear: true, placeholder: "触发事件", style: { minWidth: 220 }, options: eventOptions })),
        e(Form.Item, { key: "lang", label: "语言", name: "lang" },
          e(Select, { allowClear: true, placeholder: "语言", style: { minWidth: 160 }, options: langSelectOptions })),
        e(Form.Item, { key: "title", label: "标题", name: "title" },
          e(Input, { allowClear: true, placeholder: "标题", style: { minWidth: 220, width: 220 } })),
        e(Form.Item, { key: "actions" },
          e(Space, null, [
            e(Button, { key: "search", type: "primary", htmlType: "submit" }, "查询"),
            e(Button, { key: "reset", onClick: () => { form.resetFields(); setApplied({}); } }, "重置")
          ]))
      ]),
      e("div", { key: "toolbar", style: { marginBottom: 12 } },
        e(Button, { type: "primary", onClick: onCreate }, "创建")),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1100 },
        onRow: record => ({ onClick: () => onRow && onRow(record), style: { cursor: "pointer" } })
      })
    ]);
  }

  // —— 邮件管理 ——

  function MailListPage({ notices, setNotices, layouts }) {
    const [form] = Form.useForm();
    const [formOpen, setFormOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [testOpen, setTestOpen] = React.useState(false);
    const [testRecord, setTestRecord] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailRecord, setDetailRecord] = React.useState(null);

    const layoutOptions = layouts.map(item => ({ label: item.name, value: item.id }));
    const eventOptions = (app.mockData.mailEvents || []).map(item => ({ label: item.description, value: item.value }));
    const langOptions = (app.mockData.messageLanguages || []).map(item => ({ label: item.value, value: item.value }));
    const eventKeyWatch = Form.useWatch("event_key", form);
    const variablesSource = app.mockData.mailEventVariables?.[eventKeyWatch] || [];

    React.useEffect(() => {
      if (!formOpen) return;
      if (editing) {
        form.setFieldsValue({
          lang: editing.lang,
          event_key: editing.event_key,
          title: editing.title,
          layout_id: editing.layout_id,
          content: editing.content
        });
      } else {
        form.resetFields();
      }
    }, [formOpen, editing, form]);

    function closeForm() {
      setFormOpen(false);
      setEditing(null);
    }

    function handlePublish() {
      form.validateFields().then(values => {
        if (!values.content || values.content.trim() === "") {
          message.error("请输入内容");
          return;
        }
        const layout = layouts.find(item => item.id === values.layout_id);
        const event = (app.mockData.mailEvents || []).find(item => item.value === values.event_key);
        if (editing) {
          setNotices(list => list.map(item => item.id === editing.id
            ? Object.assign({}, item, values, { layout_name: layout?.name || "-" }) : item));
          message.success("更新成功");
        } else {
          const nextId = notices.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          setNotices(list => [{
            id: nextId,
            ...values,
            layout_name: layout?.name || "-",
            event_text: event?.description || values.event_key
          }, ...list]);
          message.success("创建成功");
        }
        closeForm();
      }).catch(() => {});
    }

    function insertVariable(name) {
      if (!name) return;
      form.setFieldValue("content", `${form.getFieldValue("content") || ""}${name}`);
    }

    return e("section", { key: "mail-list", className: "page-surface" }, [
      e(NoticeListShell, {
        key: "shell",
        notices,
        setNotices,
        includeLayoutColumn: true,
        onCreate: () => { setEditing(null); setFormOpen(true); },
        onEdit: record => { setEditing(record); setFormOpen(true); },
        onTest: record => { setTestRecord({ ...record, type: 1 }); setTestOpen(true); },
        onRow: record => { setDetailRecord(record); setDetailOpen(true); }
      }),
      e(Modal, {
        key: "form",
        open: formOpen,
        width: 1200,
        destroyOnClose: true,
        maskClosable: false,
        title: editing ? "修改消息模板" : "新建消息模板",
        onCancel: closeForm,
        footer: e(Space, null, [
          e(Button, { key: "cancel", onClick: closeForm }, "取消"),
          e(Button, { key: "publish", type: "primary", onClick: handlePublish }, "发布")
        ]),
        styles: { body: { maxHeight: "75vh", overflow: "auto" } }
      }, e("div", { style: { display: "flex", gap: 16, alignItems: "flex-start" } }, [
        e("div", { key: "form-body", style: { flex: 1, minWidth: 0, maxWidth: 780 } },
          e(Form, { form, layout: "vertical" }, [
            e(Form.Item, { key: "lang", label: "语言", name: "lang", rules: [{ required: true, message: "请选择语言" }] },
              e(Select, { options: langOptions, showSearch: true, optionFilterProp: "label" })),
            e(Form.Item, { key: "event", label: "触发事件", name: "event_key", rules: [{ required: true, message: "请选择触发事件" }] },
              e(Select, { options: eventOptions, showSearch: true, optionFilterProp: "label" })),
            e(Form.Item, { key: "title", label: "标题", name: "title", rules: [{ required: true, message: "请输入标题" }] },
              e(Input, { placeholder: "标题" })),
            e(Form.Item, { key: "layout", label: "Layout 模版", name: "layout_id", rules: [{ required: true, message: "请选择 Layout 模版" }] },
              e(Select, { options: layoutOptions, showSearch: true, optionFilterProp: "label", placeholder: "Layout 模版" })),
            e(Form.Item, { key: "content", label: "内容", required: true },
              e(Form.Item, {
                name: "content",
                noStyle: true,
                rules: [{ required: true, message: "请输入内容" }]
              },
                e(TextArea, { rows: 8, placeholder: "请输入内容" })))
          ])),
        e("div", { key: "vars", style: { flexShrink: 0 } },
          e(VariablesPanel, { variables: variablesSource, onInsert: insertVariable }))
      ])),
      e(TestSendModal, {
        key: "test",
        open: testOpen,
        record: testRecord,
        onCancel: () => { setTestOpen(false); setTestRecord(null); }
      }),
      e(Drawer, {
        key: "detail",
        open: detailOpen,
        onClose: () => { setDetailOpen(false); setDetailRecord(null); },
        size: "large",
        destroyOnClose: true,
        title: "邮件模板详情"
      }, detailRecord ? [
        e(Descriptions, {
          key: "desc",
          column: 1,
          bordered: true,
          size: "small",
          items: [
            { key: "title", label: "标题", children: textOrDash(detailRecord.title) },
            { key: "lang", label: "语言", children: textOrDash(langLabel(detailRecord.lang)) },
            { key: "event", label: "触发事件", children: textOrDash(detailRecord.event_text || detailRecord.event_key) },
            { key: "layout", label: "Layout 模版", children: textOrDash(detailRecord.layout_name) }
          ]
        }),
        e(Title, { key: "content-title", level: 5, style: { marginTop: 16 } }, "内容"),
        e("div", {
          key: "content",
          style: { border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 },
          dangerouslySetInnerHTML: { __html: detailRecord.content || "-" }
        })
      ] : null)
    ]);
  }

  // —— 站内信管理 ——

  function SiteListPage({ notices, setNotices }) {
    const [form] = Form.useForm();
    const [formOpen, setFormOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [testOpen, setTestOpen] = React.useState(false);
    const [testRecord, setTestRecord] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailRecord, setDetailRecord] = React.useState(null);

    const allEvents = app.mockData.mailEvents || [];
    const langOptions = (app.mockData.messageLanguages || []).map(item => ({ label: item.value, value: item.value }));
    const eventTypeOptions = [
      { value: 1, label: "系统事件" },
      { value: 2, label: "交易事件" }
    ];
    const pageOptions = (app.mockData.mailInternalPages || []).map(item => ({ label: item.label, value: item.value }));
    const contentStyleOptions = [
      { value: 0, label: "默认" },
      { value: 1, label: "绿色" },
      { value: 2, label: "红色" }
    ];
    const eventTypeWatch = Form.useWatch("event_type", form);
    const eventKeyWatch = Form.useWatch("event_key", form);
    const SYSTEM_EVENTS = ["register", "kyc_approved", "password_changed"];
    const TRADE_EVENTS = ["deposit_success", "withdraw_audit"];
    const eventOptions = allEvents
      .filter(item => (eventTypeWatch === 2 ? TRADE_EVENTS : SYSTEM_EVENTS).includes(item.value))
      .map(item => ({ label: item.description, value: item.value }));
    const variablesSource = app.mockData.mailEventVariables?.[eventKeyWatch] || [];

    React.useEffect(() => {
      if (!formOpen) return;
      if (editing) {
        const blocks = parseBlocks(editing.content);
        form.setFieldsValue({
          lang: editing.lang,
          event_type: editing.event_type,
          event_key: editing.event_key,
          link: editing.link || undefined,
          title: editing.title,
          content_items: blocks.length ? blocks.map(block => ({ k: block.k, v: block.v, t: block.t ?? 0 })) : [{ k: "", v: "", t: 0 }]
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ event_type: 1, content_items: [{ k: "", v: "", t: 0 }] });
      }
    }, [formOpen, editing, form]);

    function closeForm() {
      setFormOpen(false);
      setEditing(null);
    }

    function handlePublish() {
      form.validateFields().then(values => {
        const blocks = (values.content_items || []).map(row => ({ k: row.k, v: row.v, t: row.t ?? 0 }));
        const event = allEvents.find(item => item.value === values.event_key);
        if (editing) {
          setNotices(list => list.map(item => item.id === editing.id
            ? Object.assign({}, item, values, {
                event_text: event?.description || values.event_key,
                content: JSON.stringify(blocks)
              }) : item));
          message.success("更新成功");
        } else {
          const nextId = notices.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          setNotices(list => [{
            id: nextId,
            ...values,
            event_text: event?.description || values.event_key,
            content: JSON.stringify(blocks)
          }, ...list]);
          message.success("创建成功");
        }
        closeForm();
      }).catch(() => {});
    }

    function insertVariable(name) {
      if (!name) return;
      const rows = form.getFieldValue("content_items") || [];
      if (!rows.length) return;
      const lastIndex = rows.length - 1;
      form.setFieldValue(["content_items", lastIndex, "v"], `${(rows[lastIndex] || {}).v || ""}${name}`);
    }

    return e("section", { key: "site-list", className: "page-surface" }, [
      e(NoticeListShell, {
        key: "shell",
        notices,
        setNotices,
        includeLayoutColumn: false,
        onCreate: () => { setEditing(null); setFormOpen(true); },
        onEdit: record => { setEditing(record); setFormOpen(true); },
        onTest: record => { setTestRecord({ ...record, type: 2 }); setTestOpen(true); },
        onRow: record => { setDetailRecord(record); setDetailOpen(true); }
      }),
      e(Modal, {
        key: "form",
        open: formOpen,
        width: 1200,
        destroyOnClose: true,
        maskClosable: false,
        title: editing ? "修改消息模板" : "新建消息模板",
        onCancel: closeForm,
        footer: e(Space, null, [
          e(Button, { key: "cancel", onClick: closeForm }, "取消"),
          e(Button, { key: "publish", type: "primary", onClick: handlePublish }, "发布")
        ]),
        styles: { body: { maxHeight: "75vh", overflow: "auto" } }
      }, e("div", { style: { display: "flex", gap: 16, alignItems: "flex-start" } }, [
        e("div", { key: "form-body", style: { flex: 1, minWidth: 0, maxWidth: 820 } },
          e(Form, { form, layout: "vertical" }, [
            e(Form.Item, { key: "lang", label: "语言", name: "lang", rules: [{ required: true, message: "请选择语言" }] },
              e(Select, { options: langOptions, showSearch: true, optionFilterProp: "label" })),
            e(Form.Item, { key: "event-type", label: "事件类型", name: "event_type", rules: [{ required: true, message: "请选择事件类型" }] },
              e(Select, {
                options: eventTypeOptions,
                placeholder: "事件类型",
                onChange: () => form.setFieldValue("event_key", undefined)
              })),
            e(Form.Item, { key: "event", label: "触发事件", name: "event_key", rules: [{ required: true, message: "请选择触发事件" }] },
              e(Select, { options: eventOptions, showSearch: true, optionFilterProp: "label", disabled: !eventTypeWatch })),
            e(Form.Item, { key: "link", label: "内部链接", name: "link" },
              e(Select, { allowClear: true, showSearch: true, optionFilterProp: "label", placeholder: "内部链接", options: pageOptions })),
            e(Form.Item, { key: "title", label: "标题", name: "title", rules: [{ required: true, message: "请输入标题" }] },
              e(Input, { placeholder: "标题" })),
            e(Form.Item, { key: "content", label: "内容", required: true },
              e(Form.List, { name: "content_items" }, (fields, { add, remove }) => e("div", null, [
                e("div", { key: "add-row", style: { marginBottom: 8 } },
                  e(Button, { type: "link", onClick: () => add({ k: "", v: "", t: 0 }) }, "添加一行")),
                fields.map(field => e("div", {
                  key: field.key,
                  style: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }
                }, [
                  e("span", { key: "drag", style: { color: "#999", cursor: "grab", lineHeight: "32px" }, title: "拖动" }, "⋮⋮"),
                  e(Form.Item, {
                    key: "k",
                    name: [field.name, "k"],
                    rules: [{ required: true, message: "请输入标题" }],
                    style: { marginBottom: 0, flex: 1 }
                  },
                    e(Input, { placeholder: "标题" })),
                  e(Form.Item, {
                    key: "v",
                    name: [field.name, "v"],
                    rules: [{ required: true, message: "请输入内容" }],
                    style: { marginBottom: 0, flex: 1.6 }
                  },
                    e(Input, { placeholder: "请输入内容" })),
                  e(Form.Item, {
                    key: "t",
                    name: [field.name, "t"],
                    style: { marginBottom: 0, width: 110 }
                  },
                    e(Select, { options: contentStyleOptions })),
                  fields.length > 1 ? e(Button, {
                    key: "remove",
                    type: "link",
                    danger: true,
                    onClick: () => remove(field.name)
                  }, "删除") : e("span", { key: "placeholder", style: { width: 40 } })
                ]))
              ])))
          ])),
        e("div", { key: "vars", style: { flexShrink: 0 } },
          e(VariablesPanel, { variables: variablesSource, onInsert: insertVariable }))
      ])),
      e(TestSendModal, {
        key: "test",
        open: testOpen,
        record: testRecord,
        onCancel: () => { setTestOpen(false); setTestRecord(null); }
      }),
      e(Drawer, {
        key: "detail",
        open: detailOpen,
        onClose: () => { setDetailOpen(false); setDetailRecord(null); },
        size: "large",
        destroyOnClose: true,
        title: "站内信详情"
      }, detailRecord ? (() => {
        const blocks = parseBlocks(detailRecord.content);
        const pageLabel = (app.mockData.mailInternalPages || []).find(item => item.value === detailRecord.link)?.label;
        return [
          e(Descriptions, {
            key: "desc",
            column: 1,
            bordered: true,
            size: "small",
            items: [
              { key: "title", label: "标题", children: textOrDash(detailRecord.title) },
              { key: "lang", label: "语言", children: textOrDash(langLabel(detailRecord.lang)) },
              { key: "eventType", label: "事件类型", children: detailRecord.event_type === 1 ? "系统事件" : detailRecord.event_type === 2 ? "交易事件" : "-" },
              { key: "event", label: "触发事件", children: textOrDash(detailRecord.event_text || detailRecord.event_key) },
              { key: "link", label: "内部链接", children: textOrDash(pageLabel || detailRecord.link) }
            ]
          }),
          e(Title, { key: "content-title", level: 5, style: { marginTop: 16 } }, "内容"),
          detailRecord.event_type === 1
            ? e(Paragraph, { key: "plain", style: { whiteSpace: "pre-wrap" } },
                blocks.length && blocks[0].v ? String(blocks[0].v) : textOrDash(detailRecord.content))
            : blocks.length
              ? e(Space, { key: "blocks", direction: "vertical", size: "middle", style: { width: "100%" } },
                  blocks.map((block, index) => {
                    const style = CONTENT_STYLE_MAP[String(block.t ?? 0)];
                    return e("div", {
                      key: `${block.k ?? "content"}-${index}`,
                      style: { border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }
                    }, [
                      e(Space, { key: "head", style: { marginBottom: 8 } }, [
                        e(Text, { key: "k", strong: true }, textOrDash(block.k || "标题")),
                        e(Tag, { key: "t", color: style?.color }, style?.label || "-")
                      ]),
                      e(Paragraph, { key: "v", style: { marginBottom: 0, whiteSpace: "pre-wrap" } }, textOrDash(block.v))
                    ]);
                  }))
              : e(Paragraph, { key: "raw", style: { whiteSpace: "pre-wrap" } }, textOrDash(detailRecord.content))
        ];
      })() : null)
    ]);
  }

  // —— Layout 管理 ——

  function MailTemplatePage({ layouts, setLayouts }) {
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [form] = Form.useForm();
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [detailRecord, setDetailRecord] = React.useState(null);

    React.useEffect(() => {
      if (!modalOpen) return;
      if (editing) form.setFieldsValue({ name: editing.name, content: editing.content });
      else form.resetFields();
    }, [modalOpen, editing, form]);

    function closeForm() {
      setModalOpen(false);
      setEditing(null);
    }

    function handleSave(status) {
      form.validateFields().then(values => {
        if (editing) {
          setLayouts(list => list.map(item => item.id === editing.id
            ? Object.assign({}, item, { name: values.name, content: values.content, status }) : item));
          message.success("更新成功");
        } else {
          const nextId = layouts.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          setLayouts(list => [{
            id: nextId,
            name: values.name,
            content: values.content,
            status,
            updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss")
          }, ...list]);
          message.success("创建成功");
        }
        closeForm();
      }).catch(() => {});
    }

    function handleDelete(record) {
      Modal.confirm({
        title: "确认删除该 Layout 模版？",
        okText: "确定",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk: () => {
          setLayouts(list => list.filter(item => item.id !== record.id));
          message.success("删除成功");
        }
      });
    }

    const columns = [
      { title: "Layout 名称", dataIndex: "name", width: 200, render: textOrDash },
      {
        title: "内容",
        dataIndex: "content",
        render: value => value
          ? e(Paragraph, { ellipsis: { rows: 2 }, style: { marginBottom: 0 } }, value)
          : textOrDash(value)
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 120,
        render: value => e(Tag, { color: Number(value) === 1 ? "green" : "default" }, Number(value) === 1 ? "已发布" : "未发布")
      },
      { title: "最后修改时间(GMT+0)", dataIndex: "updated_at", width: 180, render: textOrDash },
      {
        title: "操作",
        key: "actions",
        width: 200,
        fixed: "right",
        render: (_, record) => e(Space, { key: "space" }, [
          e(Button, { key: "edit", type: "primary", size: "small", onClick: event => { event.stopPropagation(); setEditing(record); setModalOpen(true); } }, "修改"),
          e(Button, { key: "delete", type: "primary", size: "small", danger: true, onClick: event => { event.stopPropagation(); handleDelete(record); } }, "删除")
        ])
      }
    ];

    return e("section", { key: "mail-templates", className: "page-surface" }, [
      e("div", { key: "toolbar", className: "toolbar", style: { justifyContent: "flex-end" } },
        e(Button, { type: "primary", onClick: () => { setEditing(null); setModalOpen(true); } }, "创建")),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: layouts,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1000 },
        onRow: record => ({
          onClick: () => { setDetailRecord(record); setDetailOpen(true); },
          style: { cursor: "pointer" }
        })
      }),
      e(Modal, {
        key: "modal",
        open: modalOpen,
        width: 960,
        destroyOnClose: true,
        maskClosable: false,
        title: editing ? "修改 Layout 模版" : "新建 Layout 模版",
        onCancel: closeForm,
        footer: e(Space, null, [
          e(Button, { key: "cancel", onClick: closeForm }, "取消"),
          e(Button, { key: "draft", onClick: () => handleSave(0) }, "保存草稿"),
          e(Button, { key: "publish", type: "primary", onClick: () => handleSave(1) }, "发布")
        ]),
        styles: { body: { maxHeight: "70vh", overflow: "auto" } }
      }, e(Form, { form, layout: "vertical", style: { maxWidth: 900 } }, [
        e(Form.Item, { key: "name", label: "模版名称", name: "name", rules: [{ required: true, message: "请输入模版名称" }] },
          e(Input)),
        e(Form.Item, { key: "content", label: "内容", required: true }, [
          e(Text, { key: "hint", type: "danger", style: { display: "block", margin: "4px 0" } }, "参数示例：邮件内容 {{content}}"),
          e(Form.Item, {
            key: "content-inner",
            name: "content",
            noStyle: true,
            rules: [{ required: true, message: "请输入内容" }]
          },
            e(TextArea, { rows: 8, placeholder: "请输入内容" }))
        ])
      ])),
      e(Drawer, {
        key: "detail",
        open: detailOpen,
        onClose: () => { setDetailOpen(false); setDetailRecord(null); },
        size: "large",
        destroyOnClose: true,
        title: "Layout 详情"
      }, detailRecord ? [
        e(Descriptions, {
          key: "desc",
          column: 1,
          bordered: true,
          size: "small",
          items: [
            { key: "name", label: "模版名称", children: textOrDash(detailRecord.name) },
            { key: "status", label: "状态", children: e(Tag, { color: Number(detailRecord.status) === 1 ? "green" : "default" }, Number(detailRecord.status) === 1 ? "已发布" : "未发布") },
            { key: "updatedAt", label: "最后修改时间(GMT+0)", children: textOrDash(detailRecord.updated_at) }
          ]
        }),
        e(Title, { key: "content-title", level: 5, style: { marginTop: 16 } }, "内容"),
        e("div", {
          key: "content",
          style: { border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 },
          dangerouslySetInnerHTML: { __html: detailRecord.content || "-" }
        })
      ] : null)
    ]);
  }

  app.MailListPage = MailListPage;
  app.SiteListPage = SiteListPage;
  app.MailTemplatePage = MailTemplatePage;
})(window.AdminApp);

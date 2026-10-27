(function registerUserSettingsPage(app) {
  const { Button, Checkbox, Form, Input, Modal, Popover, Select, Space, Table, Tag, message } = antd;
  const e = React.createElement;
  const { ListActions, ColumnSettingsTrigger, SearchInput } = app.sharedActions;

  const userColumnOptions = [
    { key: "name", label: "姓名" },
    { key: "role", label: "角色" },
    { key: "level", label: "层级" },
    { key: "email", label: "邮箱" },
    { key: "phone", label: "电话" },
    { key: "region", label: "市/区" },
    { key: "registeredAt", label: "注册时间(GMT+8)" }
  ];
  const allUserColumnKeys = userColumnOptions.map(item => item.key);
  const defaultUserColumnKeys = [...allUserColumnKeys];

  function randomPassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i += 1) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  function UserSettingsPage({ users, roles, onSaveUser }) {
    const [draft, setDraft] = React.useState({ keyword: "", role: undefined, status: "启用" });
    const [filters, setFilters] = React.useState({ keyword: "", role: undefined, status: "启用" });
    const [visibleKeys, setVisibleKeys] = React.useState(defaultUserColumnKeys);
    const [columnDraft, setColumnDraft] = React.useState(defaultUserColumnKeys);
    const [columnsOpen, setColumnsOpen] = React.useState(false);
    const [creating, setCreating] = React.useState(false);
    const [password, setPassword] = React.useState(randomPassword());
    const [form] = Form.useForm();

    const visibleUsers = users.filter(user => {
      const word = filters.keyword.trim().toLowerCase();
      return (!word || [user.name, user.email, user.phone].join(" ").toLowerCase().includes(word))
        && (!filters.role || user.roleId === filters.role)
        && (!filters.status || user.status === filters.status);
    });

    function openCreate() {
      setPassword(randomPassword());
      form.resetFields();
      setCreating(true);
    }

    function closeCreate() {
      setCreating(false);
      form.resetFields();
    }

    async function saveUser() {
      const values = await form.validateFields();
      const role = roles.find(item => item.id === values.roleId);
      onSaveUser({
        id: `user-${Date.now()}`,
        name: values.name.trim(),
        roleId: role.id,
        role: role.name,
        level: values.level || "-",
        email: values.email?.trim() || "-",
        phone: values.phone?.trim() || "-",
        region: values.region?.trim() || "-",
        address: values.address?.trim() || "-",
        registeredAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        status: values.status || "启用"
      });
      message.success("保存成功");
      closeCreate();
    }

    function copyPassword() {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(password).then(() => message.success("已复制"));
      } else {
        message.info(`密码：${password}`);
      }
    }

    function resetPassword(record) {
      Modal.confirm({
        title: "确认重置密码",
        content: "重置后将生成新的随机密码，需及时通知用户。",
        okText: "确认",
        cancelText: "取消",
        onOk: () => message.success(`已重置 ${record.name} 的密码`)
      });
    }

    function toggleStatus(record) {
      const disabling = record.status !== "停用";
      Modal.confirm({
        title: disabling ? "确认停用该用户？" : "确认启用该用户？",
        okText: "确认",
        cancelText: "取消",
        onOk: () => {
          onSaveUser(Object.assign({}, record, { status: disabling ? "停用" : "启用" }));
          message.success(disabling ? "已停用" : "已启用");
        }
      });
    }

    const columnMap = {
      name: { title: "姓名", dataIndex: "name", width: 130, render: value => e("strong", null, value) },
      role: { title: "角色", dataIndex: "role", width: 150, render: value => e(Tag, null, value || "未关联") },
      level: { title: "层级", dataIndex: "level", width: 100 },
      email: { title: "邮箱", dataIndex: "email", width: 190 },
      phone: { title: "电话", dataIndex: "phone", width: 140 },
      region: { title: "市/区", dataIndex: "region", width: 150 },
      registeredAt: { title: "注册时间(GMT+8)", dataIndex: "registeredAt", width: 180 }
    };
    const columns = [
      ...visibleKeys.map(key => ({ ...columnMap[key], key })),
      {
        title: "操作",
        key: "actions",
        width: 180,
        fixed: "right",
        render: (_, record) => e(Space, { size: 0 }, [
          e(Button, { key: "reset", type: "link", size: "small", onClick: () => resetPassword(record) }, "重置密码"),
          record.status === "停用"
            ? e(Button, { key: "enable", type: "link", size: "small", onClick: () => toggleStatus(record) }, "启用")
            : e(Button, { key: "disable", type: "link", size: "small", danger: true, onClick: () => toggleStatus(record) }, "停用")
        ])
      }
    ];

    const columnPanel = e("div", { className: "column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("span", { key: "title" }, "显示字段"),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${columnDraft.length}/${userColumnOptions.length}`)
      ]),
      e("div", { className: "column-panel-sub", key: "sub" }, "选择列表中需要展示的信息"),
      e("div", { className: "column-panel-links", key: "links" }, [
        e(Button, { key: "all", type: "link", size: "small", onClick: () => setColumnDraft(allUserColumnKeys) }, "全选"),
        e(Button, { key: "clear", type: "link", size: "small", onClick: () => setColumnDraft([]) }, "清空"),
        e(Button, { key: "reset", type: "link", size: "small", onClick: () => setColumnDraft(defaultUserColumnKeys) }, "恢复默认")
      ]),
      e(Checkbox.Group, {
        key: "group",
        className: "column-panel-group",
        value: columnDraft,
        onChange: values => setColumnDraft(values)
      }, userColumnOptions.map(item => e(Checkbox, { key: item.key, value: item.key }, item.label))),
      e("div", { className: "column-panel-footer", key: "footer" }, [
        e(Button, { key: "cancel", size: "small", onClick: () => { setColumnDraft(visibleKeys); setColumnsOpen(false); } }, "取消"),
        e(Button, { key: "apply", size: "small", type: "primary", onClick: () => { setVisibleKeys(columnDraft); setColumnsOpen(false); } }, "应用")
      ])
    ]);

    return e("section", { className: "page-surface user-settings-page" }, [
      e("div", { className: "toolbar", key: "toolbar" },
        e(Space, { wrap: true }, [
          e(SearchInput, {
            key: "keyword",
            value: draft.keyword,
            placeholder: "搜索姓名 / 账号 / 邮箱",
            allowClear: true,
            className: "keyword-input",
            onChange: event => setDraft(Object.assign({}, draft, { keyword: event.target.value })),
            onSearch: () => setFilters({ ...draft })
          }),
          e(Select, {
            key: "role",
            value: draft.role,
            placeholder: "请选择角色",
            allowClear: true,
            className: "select-input",
            options: roles.map(role => ({ value: role.id, label: role.name })),
            onChange: value => {
              setDraft(Object.assign({}, draft, { role: value }));
              setFilters(Object.assign({}, draft, { role: value }));
            }
          }),
          e(Select, {
            key: "status",
            value: draft.status,
            placeholder: "状态",
            allowClear: true,
            className: "select-input",
            options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }],
            onChange: value => {
              setDraft(Object.assign({}, draft, { status: value }));
              setFilters(Object.assign({}, draft, { status: value }));
            }
          }),
          e(ListActions, {
            key: "actions-core",
            onReset: () => {
              const cleared = { keyword: "", role: undefined, status: "启用" };
              setDraft(cleared);
              setFilters(cleared);
            },
            trailing: [
              e(Button, { key: "add", type: "primary", onClick: openCreate }, "添加"),
              e(Popover, {
                key: "columns",
                trigger: "click",
                placement: "bottomRight",
                open: columnsOpen,
                onOpenChange: open => {
                  setColumnDraft(visibleKeys);
                  setColumnsOpen(open);
                },
                content: columnPanel
              }, e(ColumnSettingsTrigger))
            ]
          })
        ])),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: visibleUsers,
        pagination: { pageSize: 4, showTotal: total => `共 ${total} 条`, showSizeChanger: false },
        scroll: { x: 1160 }
      }),
      e(Modal, {
        key: "create",
        title: "新建用户",
        open: creating,
        onCancel: closeCreate,
        onOk: saveUser,
        okText: "保存",
        cancelText: "取消",
        width: 560,
        destroyOnClose: true,
        maskClosable: false
      }, e(Form, { form, layout: "vertical" }, [
        e(Form.Item, { key: "name", label: "姓名", name: "name", rules: [{ required: true, message: "请输入姓名" }] }, e(Input, { placeholder: "请输入姓名" })),
        e(Form.Item, { key: "email", label: "邮箱", name: "email" }, e(Input, { placeholder: "example@company.com" })),
        e(Form.Item, { key: "phone", label: "电话", name: "phone" }, e(Input, { placeholder: "请输入手机号" })),
        e(Form.Item, { key: "region", label: "市/区", name: "region" }, e(Input, { placeholder: "如：上海" })),
        e(Form.Item, { key: "role", label: "角色", name: "roleId", rules: [{ required: true, message: "请选择角色" }] }, e(Select, { placeholder: "请选择角色", options: roles.map(role => ({ value: role.id, label: role.name })) })),
        e(Form.Item, { key: "level", label: "层级", name: "level" }, e(Select, { placeholder: "请选择层级", options: [], notFoundContent: "暂无层级选项" })),
        e(Form.Item, { key: "address", label: "地址", name: "address" }, e(Input, { placeholder: "请输入地址" })),
        e(Form.Item, { key: "status", label: "状态", name: "status", initialValue: "启用" }, e(Select, { options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }] })),
        e(Form.Item, { key: "password", label: "密码", required: true }, e("div", { className: "password-field" }, [
          e(Input, { key: "value", value: password, readOnly: true }),
          e(Button, { key: "refresh", onClick: () => setPassword(randomPassword()) }, "↻"),
          e(Button, { key: "copy", onClick: copyPassword }, "复制")
        ]))
      ]))
    ]);
  }

  app.UserSettingsPage = UserSettingsPage;
})(window.AdminApp);

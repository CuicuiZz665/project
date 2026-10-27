(function registerRoleSettingsPage(app) {
  const { Button, Checkbox, Form, Input, Modal, Popover, Space, Table, Typography, message } = antd;
  const { Text } = Typography;
  const e = React.createElement;
  const { ColumnSettingsTrigger, SearchInput } = app.sharedActions;

  const permissionTree = [
    {
      value: "代理管理", label: "代理管理", children: [
        { value: "佣金配置管理", label: "佣金配置管理", children: [{ value: "佣金记录管理", label: "佣金记录管理" }, { value: "佣金配置列表", label: "佣金配置列表" }] },
        { value: "代理等级管理", label: "代理等级管理", children: [{ value: "代理等级配置", label: "代理等级配置" }] },
        { value: "代理关系管理", label: "代理关系管理", children: [{ value: "代理商修改等级", label: "代理商修改等级" }, { value: "代理商列表", label: "代理商列表" }, { value: "代理申请列表", label: "代理申请列表" }] }
      ]
    },
    {
      value: "客户管理", label: "客户管理", children: [
        { value: "数据看板", label: "数据看板", children: [{ value: "数据概览", label: "数据概览" }] },
        { value: "特殊客户", label: "特殊客户", children: [{ value: "黑名单", label: "黑名单" }, { value: "白名单", label: "白名单" }] },
        { value: "客户管理", label: "客户管理", children: [{ value: "用户登录日志", label: "用户登录日志" }, { value: "客户列表", label: "客户列表" }] }
      ]
    },
    { value: "订单管理", label: "订单管理", children: [{ value: "订单列表", label: "订单列表" }] },
    {
      value: "内容管理", label: "内容管理", children: [
        { value: "广告位管理", label: "广告位管理", children: [{ value: "广告列表", label: "广告列表" }, { value: "广告位条目配置", label: "广告位条目配置" }] },
        { value: "消息管理", label: "消息管理", children: [{ value: "查询验证码", label: "查询验证码" }, { value: "消息管理", label: "消息管理" }] },
        { value: "邮件PUSH", label: "邮件PUSH", children: [{ value: "邮件管理", label: "邮件管理" }, { value: "站内信管理", label: "站内信管理" }, { value: "Layout管理", label: "Layout管理" }] }
      ]
    },
    {
      value: "市场活动", label: "市场活动", children: [
        { value: "活动配置", label: "活动配置" },
        { value: "报名列表", label: "报名列表" },
        {
          value: "Prop", label: "Prop", children: [
            { value: "资金管理", label: "资金管理", children: [{ value: "返现结算", label: "返现结算" }, { value: "费用流水", label: "费用流水" }, { value: "财务明细", label: "财务明细" }] },
            { value: "比赛用户统计", label: "比赛用户统计" }, { value: "资格赛设置", label: "资格赛设置" }, { value: "比赛列表", label: "比赛列表" }
          ]
        }
      ]
    },
    {
      value: "激励中心", label: "激励中心", children: [
        { value: "积分配置", label: "积分配置" }, { value: "积分明细", label: "积分明细" }, { value: "徽章列表", label: "徽章列表" }
      ]
    },
    {
      value: "发放管理", label: "发放管理", children: [
        { value: "优惠券管理", label: "优惠券管理", children: [{ value: "优惠券核销", label: "优惠券核销" }, { value: "优惠券操作管理", label: "优惠券操作管理" }, { value: "优惠券列表", label: "优惠券列表" }] },
        { value: "投递管理", label: "投递管理", children: [{ value: "投递记录", label: "投递记录" }, { value: "投递列表", label: "投递列表" }, { value: "投递操作设置", label: "投递操作设置" }] }
      ]
    },
    {
      value: "资金管理", label: "资金管理", children: [
        { value: "资金管理", label: "资金管理" },
        { value: "充值提现管理", label: "充值提现管理", children: [{ value: "充值提现网络配置", label: "充值提现网络配置" }, { value: "汇率管理", label: "汇率管理" }, { value: "充值管理", label: "充值管理" }, { value: "提现管理-风控审核", label: "提现管理-风控审核" }, { value: "提现管理-财务操作", label: "提现管理-财务操作" }] },
        { value: "流水管理", label: "流水管理", children: [{ value: "资金流水", label: "资金流水" }] }
      ]
    },
    { value: "品种", label: "品种", children: [{ value: "品种", label: "品种", children: [{ value: "品种类标", label: "品种类标" }] }] },
    {
      value: "设置", label: "设置", children: [
        { value: "版本控制", label: "版本控制" },
        { value: "角色管理", label: "角色管理", children: [{ value: "编辑角色", label: "编辑角色" }, { value: "创建角色", label: "创建角色" }, { value: "角色管理设置", label: "角色管理设置" }] },
        { value: "用户管理", label: "用户管理", children: [{ value: "用户设置管理", label: "用户设置管理" }] },
        { value: "修改密码", label: "修改密码" }
      ]
    }
  ];

  function leafValues(node) {
    if (!node.children?.length) return [node.value];
    return node.children.flatMap(leafValues);
  }

  const roleColumnOptions = [
    { key: "name", label: "角色名称" },
    { key: "parent", label: "角色上级" },
    { key: "permissions", label: "权限" }
  ];
  const allRoleColumnKeys = roleColumnOptions.map(item => item.key);
  const defaultRoleColumnKeys = [...allRoleColumnKeys];

  function RoleSettingsPage({ roles, onSaveRole, onDeleteRole }) {
    const [keyword, setKeyword] = React.useState("");
    const [appliedKeyword, setAppliedKeyword] = React.useState("");
    const [view, setView] = React.useState(null);
    const [checkedPermissions, setCheckedPermissions] = React.useState([]);
    const [visibleKeys, setVisibleKeys] = React.useState(defaultRoleColumnKeys);
    const [columnDraft, setColumnDraft] = React.useState(defaultRoleColumnKeys);
    const [columnsOpen, setColumnsOpen] = React.useState(false);
    const [form] = Form.useForm();

    const visibleRoles = roles.filter(role => role.name.toLowerCase().includes(appliedKeyword.trim().toLowerCase()));

    function openForm(role, parentId) {
      setView(role ? { mode: "edit", editing: role } : { mode: "create", parentId: parentId || null });
      setCheckedPermissions(role?.permissions || []);
      form.setFieldsValue({ name: role?.name || "" });
    }

    function closeForm() {
      setView(null);
      form.resetFields();
      setCheckedPermissions([]);
    }

    function togglePermission(values, checked) {
      const next = checked
        ? Array.from(new Set([...checkedPermissions, ...values]))
        : checkedPermissions.filter(value => !values.includes(value));
      setCheckedPermissions(next);
    }

    function renderPermissionNode(node, depth) {
      const leaves = leafValues(node);
      const checkedCount = leaves.filter(value => checkedPermissions.includes(value)).length;
      const nodeBlock = e("div", {
        className: "role-permission-node",
        style: { paddingLeft: depth * 22 },
        key: `${node.value}-${depth}`
      }, e(Checkbox, {
        checked: checkedCount === leaves.length,
        indeterminate: checkedCount > 0 && checkedCount < leaves.length,
        onChange: event => togglePermission(leaves, event.target.checked)
      }, node.label));
      if (!node.children?.length) return nodeBlock;
      return [nodeBlock, ...node.children.map(child => renderPermissionNode(child, depth + 1))];
    }

    async function saveRole() {
      const values = await form.validateFields();
      const editing = view.mode === "edit" ? view.editing : null;
      onSaveRole({
        id: editing?.id || `role-${Date.now()}`,
        name: values.name.trim(),
        parentId: editing ? editing.parentId : view.parentId,
        permissions: [...checkedPermissions]
      });
      message.success(editing ? "保存成功" : "添加成功");
      closeForm();
    }

    function deleteRole(record) {
      Modal.confirm({
        title: "确认删除该角色？",
        content: "删除后将不可恢复",
        okText: "确认",
        cancelText: "取消",
        onOk: () => {
          onDeleteRole(record.id);
          message.success("删除成功");
        }
      });
    }

    function parentName(parentId) {
      return roles.find(role => role.id === parentId)?.name || "-";
    }

    const columnMap = {
      name: { title: "角色名称", dataIndex: "name", width: 180, render: value => e("strong", null, value) },
      parent: { title: "角色上级", dataIndex: "parentId", width: 160, render: parentName },
      permissions: { title: "权限", dataIndex: "permissions", render: values => e(Text, { type: "secondary" }, values.join("、") || "-") }
    };
    const columns = [
      ...visibleKeys.map(key => ({ ...columnMap[key], key })),
      {
        title: "操作",
        key: "actions",
        width: 230,
        render: (_, record) => e(Space, { size: 0 }, [
          e(Button, { key: "edit", type: "link", size: "small", onClick: () => openForm(record) }, "修改"),
          e(Button, { key: "delete", type: "link", danger: true, size: "small", onClick: () => deleteRole(record) }, "删除"),
          e(Button, { key: "child", type: "link", size: "small", onClick: () => openForm(null, record.id) }, "添加子角色")
        ])
      }
    ];

    const columnPanel = e("div", { className: "column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("span", { key: "title" }, "显示字段"),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${columnDraft.length}/${roleColumnOptions.length}`)
      ]),
      e("div", { className: "column-panel-sub", key: "sub" }, "选择列表中需要展示的信息"),
      e("div", { className: "column-panel-links", key: "links" }, [
        e(Button, { key: "all", type: "link", size: "small", onClick: () => setColumnDraft(allRoleColumnKeys) }, "全选"),
        e(Button, { key: "clear", type: "link", size: "small", onClick: () => setColumnDraft([]) }, "清空"),
        e(Button, { key: "reset", type: "link", size: "small", onClick: () => setColumnDraft(defaultRoleColumnKeys) }, "恢复默认")
      ]),
      e(Checkbox.Group, {
        key: "group",
        className: "column-panel-group",
        value: columnDraft,
        onChange: values => setColumnDraft(values)
      }, roleColumnOptions.map(item => e(Checkbox, { key: item.key, value: item.key }, item.label))),
      e("div", { className: "column-panel-footer", key: "footer" }, [
        e(Button, { key: "cancel", size: "small", onClick: () => { setColumnDraft(visibleKeys); setColumnsOpen(false); } }, "取消"),
        e(Button, { key: "apply", size: "small", type: "primary", onClick: () => { setVisibleKeys(columnDraft); setColumnsOpen(false); } }, "应用")
      ])
    ]);

    if (view) {
      const editing = view.mode === "edit" ? view.editing : null;
      return e("section", { className: "page-surface role-form-page" },
        e(Form, { form, layout: "vertical", className: "role-form" }, [
          e("div", { className: "role-form-title", key: "title" }, editing ? "编辑角色" : "创建角色"),
          e(Form.Item, { key: "name", label: "角色名称", name: "name", rules: [{ required: true, message: "请输入角色名称" }] }, e(Input, { maxLength: 30, placeholder: "请输入角色名称", className: "role-name-input" })),
          e("div", { className: "role-permission-title", key: "permission-title" }, "权限配置"),
          e("div", { className: "role-permission-panel", key: "permission-panel" },
            permissionTree.map(node => renderPermissionNode(node, 0))),
          e("div", { className: "role-form-footer", key: "footer" }, [
            e(Button, { key: "cancel", onClick: closeForm }, "取消"),
            e(Button, { key: "save", type: "primary", onClick: saveRole }, "保存")
          ])
        ]));
    }

    return e("section", { className: "page-surface role-settings-page" }, [
      e("div", { className: "toolbar", key: "toolbar" },
        e(Space, { wrap: true }, [
          e("span", { key: "label", className: "toolbar-label" }, "角色名称 :"),
          e(SearchInput, {
            key: "input",
            value: keyword,
            placeholder: "请输入角色名称",
            allowClear: true,
            className: "keyword-input",
            onChange: event => setKeyword(event.target.value),
            onSearch: () => setAppliedKeyword(keyword)
          })
        ]),
        e(Space, null, [
          e(Button, { key: "add", type: "primary", onClick: () => openForm(null) }, "添加角色"),
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
        ])),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: visibleRoles,
        pagination: { showTotal: total => `共 ${total} 条`, showSizeChanger: false }
      })
    ]);
  }

  app.RoleSettingsPage = RoleSettingsPage;
})(window.AdminApp);

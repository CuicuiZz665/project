(function registerBlacklistPage(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Form,
    Input,
    Modal,
    Popover,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { Text } = Typography;
  const e = React.createElement;

  const SORT_OPTIONS = ["添加时间", "注册时间"];
  const RESTRICTION_OPTIONS = ["限制登录", "限制入金", "限制出金", "限制开仓"];
  const EXPORT_HEADERS = ["用户ID", "注册方式", "注册时间(GMT+0)", "邮箱", "收款账号", "最后操作人", "添加时间(GMT+0)", "拉黑原因", "是否充值", "权限限制"];
  const RESTRICTION_TAG_COLOR = { "限制登录": "orange", "限制入金": "gold", "限制出金": "error", "限制开仓": "purple" };

  // 列设置分组：操作列固定不可取消，与源系统一致。
  const columnGroups = [
    { key: "customer", label: "客户信息", columns: [{ key: "userId", label: "用户ID" }] },
    { key: "register", label: "注册信息", columns: [{ key: "registerType", label: "注册方式" }, { key: "registeredAt", label: "注册时间(GMT+0)" }] },
    { key: "contact", label: "联系与地址", columns: [{ key: "email", label: "邮箱" }, { key: "walletAddress", label: "收款账号" }] },
    { key: "record", label: "名单信息", columns: [{ key: "reason", label: "拉黑原因" }, { key: "operator", label: "最后操作人" }, { key: "operatedAt", label: "添加时间" }] },
    { key: "status", label: "状态与权限", columns: [{ key: "deposited", label: "是否充值" }, { key: "restriction", label: "权限限制" }] }
  ];
  const allColumnKeys = columnGroups.flatMap(group => group.columns.map(item => item.key));
  const defaultColumnKeys = [...allColumnKeys];

  const emptyFilters = () => ({ userId: null, email: "", sortBy: "添加时间", addedRange: null, registerRange: null });

  function normalizeRange(range) {
    if (!range || !range[0] || !range[1]) return null;
    return [range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD")];
  }

  function formatDate(value) {
    const now = new Date();
    const pad = num => String(num).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  // 修改权限弹窗：读写该行的权限限制复选框。
  function RestrictionModal({ record, onSave, onClose }) {
    const [checked, setChecked] = React.useState(record ? [...record.restrictions] : []);
    if (!record) return null;
    return e(Modal, {
      title: "修改权限",
      open: true,
      width: 520,
      footer: null,
      onCancel: onClose,
      destroyOnClose: true
    }, [
      e("div", { className: "restriction-modal-label", key: "label" }, "权限限制"),
      e(Checkbox.Group, {
        key: "group",
        className: "restriction-modal-group",
        value: checked,
        onChange: setChecked
      }, RESTRICTION_OPTIONS.map(value => e(Checkbox, { key: value, value }, value))),
      e("div", { className: "restriction-modal-footer", key: "footer" }, [
        e(Button, { key: "cancel", onClick: onClose }, "取 消"),
        e(Button, { key: "save", type: "primary", onClick: () => onSave(checked) }, "保 存")
      ])
    ]);
  }

  // 添加黑名单弹窗：用户ID + 原因(200字) + 强制下线 + 权限限制。
  function AddBlacklistModal({ open, onOk, onCancel }) {
    const [form] = Form.useForm();
    if (!open) return null;
    return e(Modal, {
      title: "添加黑名单",
      open: open,
      width: 520,
      footer: null,
      onCancel: onCancel,
      destroyOnClose: true
    }, e(Form, {
      form: form,
      layout: "vertical",
      className: "admin-form blacklist-add-form"
    }, [
      e(Form.Item, {
        key: "userId",
        name: "userId",
        label: "用户 ID",
        rules: [{ required: true, message: "请输入用户ID" }]
      }, e(Input, { placeholder: "用户ID" })),
      e(Form.Item, {
        key: "reason",
        name: "reason",
        label: "原因",
        rules: [{ required: true, message: "请输入原因" }]
      }, e(Input.TextArea, {
        rows: 4,
        maxLength: 200,
        showCount: true,
        placeholder: "原因"
      })),
      e(Form.Item, {
        key: "forceOffline",
        name: "forceOffline",
        label: "是否强制下线",
        valuePropName: "checked",
        initialValue: true
      }, e(Switch, { checkedChildren: "是", unCheckedChildren: "否" })),
      e(Form.Item, {
        key: "restrictions",
        name: "restrictions",
        label: "权限限制",
        initialValue: [...RESTRICTION_OPTIONS]
      }, e(Checkbox.Group, null, RESTRICTION_OPTIONS.map(value => e(Checkbox, { key: value, value }, value)))),
      e("div", { key: "footer", className: "restriction-modal-footer" }, [
        e(Button, { key: "cancel", onClick: onCancel }, "取 消"),
        e(Button, {
          key: "ok",
          type: "primary",
          onClick: () => {
            form.validateFields().then(values => onOk(values)).catch(() => {});
          }
        }, "确 定")
      ])
    ]));
  }

  function BlacklistPage(props) {
    const [list, setList] = React.useState(() => ((props && props.list) || app.mockData.blacklist || []).map(item => ({ ...item, restrictions: [...(item.restrictions || [])] })));
    const [draft, setDraft] = React.useState(emptyFilters);
    const [applied, setApplied] = React.useState(emptyFilters);
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [mergeMode, setMergeMode] = React.useState(true);
    const [visibleColumns, setVisibleColumns] = React.useState(defaultColumnKeys);
    const [columnDraft, setColumnDraft] = React.useState(defaultColumnKeys);
    const [columnsOpen, setColumnsOpen] = React.useState(false);
    const [addOpen, setAddOpen] = React.useState(false);
    const [restrictionRecord, setRestrictionRecord] = React.useState(null);

    const updateDraft = patch => setDraft(prev => Object.assign({}, prev, patch));

    const filtered = React.useMemo(() => {
      const userId = applied.userId || "";
      const email = applied.email.trim().toLowerCase();
      let rows = list.filter(item => {
        const matchedUser = !userId || item.userId.includes(userId);
        const matchedEmail = !email || item.email.toLowerCase().includes(email);
        const addedDate = item.operatedAt.slice(0, 10);
        const registerDate = item.registeredAt.slice(0, 10);
        const matchedAdded = !applied.addedRange
          || (addedDate >= applied.addedRange[0] && addedDate <= applied.addedRange[1]);
        const matchedRegister = !applied.registerRange
          || (registerDate >= applied.registerRange[0] && registerDate <= applied.registerRange[1]);
        return matchedUser && matchedEmail && matchedAdded && matchedRegister;
      });
      const timeField = applied.sortBy === "注册时间" ? "registeredAt" : "operatedAt";
      rows = [...rows].sort((a, b) => String(b[timeField]).localeCompare(String(a[timeField])));
      return rows;
    }, [list, applied]);

    const search = () => {
      setApplied({
        userId: draft.userId,
        email: draft.email,
        sortBy: draft.sortBy,
        addedRange: normalizeRange(draft.addedRange),
        registerRange: normalizeRange(draft.registerRange)
      });
      setPage(1);
    };

    const reset = () => {
      setDraft(emptyFilters());
      setApplied(emptyFilters());
      setPage(1);
    };

    const exportCsv = () => {
      const csv = [EXPORT_HEADERS, ...filtered.map(item => [
        item.userId, item.registerType, item.registeredAt, item.email, item.walletAddress,
        item.operator, item.operatedAt, item.reason, item.deposited, item.restrictions.join("/")
      ])]
        .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `黑名单_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`已导出 ${filtered.length} 条黑名单记录`);
    };

    function addBlacklist(values) {
      setList(prev => [{
        id: Date.now(),
        userId: values.userId.trim(),
        registerType: "邮箱注册",
        registeredAt: formatDate(),
        email: "-",
        walletAddress: "-",
        operator: "Amy",
        operatedAt: formatDate(),
        reason: values.reason.trim(),
        deposited: "否",
        restrictions: values.restrictions || []
      }, ...prev]);
      setAddOpen(false);
      setPage(1);
      message.success(`用户 ${values.userId.trim()} 已加入黑名单`);
    }

    function saveRestriction(record, restrictions) {
      setList(prev => prev.map(item => item.id === record.id ? { ...item, restrictions } : item));
      setRestrictionRecord(null);
      message.success(`用户 ${record.userId} 权限已更新`);
    }

    function removeBlacklist(record) {
      const ref = Modal.confirm({
        title: "确认删除",
        content: `将把用户 ${record.userId} 移出黑名单，删除后该用户恢复正常访问。`,
        okText: "删 除",
        okButtonProps: { danger: true },
        cancelText: "取 消",
        onOk: () => {
          setList(prev => prev.filter(item => item.id !== record.id));
          message.success(`用户 ${record.userId} 已移出黑名单`);
          ref.destroy();
        },
        onCancel: () => ref.destroy()
      });
    }

    const merged = (item, kind) => kind === "register"
      ? [e("div", { key: "type", className: "stacked-strong" }, item.registerType), e("div", { key: "time", className: "stacked-muted" }, item.registeredAt)]
      : [e("div", { key: "op", className: "stacked-strong" }, item.operator), e("div", { key: "time", className: "stacked-muted" }, item.operatedAt)];

    const optionalColumnMap = {
      userId: {
        title: "用户ID", dataIndex: "userId", width: 110, fixed: "left",
        render: value => e(Button, {
          type: "link", size: "small", className: "cell-link",
          onClick: () => message.info(`模拟打开客户详情：${value}`)
        }, value)
      },
      registerType: { title: "注册方式", dataIndex: "registerType", width: 100 },
      registeredAt: { title: "注册时间(GMT+0)", dataIndex: "registeredAt", width: 160 },
      email: { title: "邮箱", dataIndex: "email", width: 190, ellipsis: true },
      walletAddress: { title: "收款账号", dataIndex: "walletAddress", width: 120, ellipsis: true },
      reason: { title: "拉黑原因", dataIndex: "reason", width: 230, ellipsis: true },
      operator: { title: "最后操作人", dataIndex: "operator", width: 100 },
      operatedAt: { title: "添加时间", dataIndex: "operatedAt", width: 160 },
      deposited: { title: "是否充值", dataIndex: "deposited", width: 90 },
      restriction: {
        title: "权限限制", dataIndex: "restrictions", width: 110,
        render: (restrictions, record) => e(Button, {
          type: "link", size: "small", className: "cell-link",
          onClick: () => setRestrictionRecord(record)
        }, (restrictions || []).map(value => e(Tag, {
          key: value, color: RESTRICTION_TAG_COLOR[value] || "default", className: "restriction-tag"
        }, value)))
      }
    };

    const columns = React.useMemo(() => {
      const show = key => visibleColumns.includes(key);
      const cols = [];
      if (show("userId")) cols.push(optionalColumnMap.userId);
      if (mergeMode) {
        if (show("registerType") || show("registeredAt")) {
          cols.push({
            title: "注册信息", key: "registerMerged", width: 170,
            render: (_, item) => e("div", { className: "stacked-cell" }, merged(item, "register"))
          });
        }
      } else {
        if (show("registerType")) cols.push(optionalColumnMap.registerType);
        if (show("registeredAt")) cols.push(optionalColumnMap.registeredAt);
      }
      if (show("email")) cols.push(optionalColumnMap.email);
      if (show("walletAddress")) cols.push(optionalColumnMap.walletAddress);
      if (mergeMode) {
        if (show("operator") || show("operatedAt")) {
          cols.push({
            title: "操作信息", key: "operateMerged", width: 160,
            render: (_, item) => e("div", { className: "stacked-cell" }, merged(item, "operate"))
          });
        }
      } else {
        if (show("operator")) cols.push(optionalColumnMap.operator);
        if (show("operatedAt")) cols.push(optionalColumnMap.operatedAt);
      }
      if (show("reason")) cols.push(optionalColumnMap.reason);
      if (show("deposited")) cols.push(optionalColumnMap.deposited);
      if (show("restriction")) cols.push(optionalColumnMap.restriction);
      cols.push({
        title: "操作", key: "actions", fixed: "right", width: 175,
        render: (_, record) => e(Space, { size: 8 }, [
          e(Button, {
            key: "edit", type: "primary", size: "small",
            onClick: () => setRestrictionRecord(record)
          }, "修改权限"),
          e(Button, {
            key: "delete", danger: true, size: "small",
            onClick: () => removeBlacklist(record)
          }, "删 除")
        ])
      });
      return cols;
    }, [visibleColumns, mergeMode, list]);

    const columnPanel = e("div", { className: "group-column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("div", { key: "titles" }, [
          e("div", { className: "group-column-title" }, "显示字段"),
          e("div", { className: "column-panel-sub" }, "选择列表中需要展示的信息")
        ]),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${columnDraft.length}/${allColumnKeys.length}`)
      ]),
      e("div", { className: "group-column-merge", key: "merge" }, [
        e("span", { key: "label" }, "融合显示"),
        e(Switch, {
          key: "switch",
          checked: mergeMode,
          onChange: setMergeMode
        })
      ]),
      e("div", { className: "group-column-actions", key: "actions" }, [
        e(Button, {
          key: "all", size: "small", icon: e(Checkbox, { checked: true, disabled: true }),
          onClick: () => setColumnDraft(allColumnKeys)
        }, "全选"),
        e(Button, { key: "clear", size: "small", onClick: () => setColumnDraft([]) }, "清空"),
        e(Button, { key: "reset", size: "small", onClick: () => setColumnDraft(defaultColumnKeys) }, "恢复默认")
      ]),
      e("div", { className: "group-column-grid", key: "grid" }, columnGroups.map(group => {
        const groupKeys = group.columns.map(item => item.key);
        const selectedCount = groupKeys.filter(key => columnDraft.includes(key)).length;
        return e("div", { className: "group-column-card", key: group.key }, [
          e("div", { className: "group-column-card-head", key: "head" }, [
            e("span", { key: "label" }, group.label),
            e("span", { key: "count" }, `${selectedCount}/${groupKeys.length}`)
          ]),
          e(Checkbox.Group, {
            key: "group",
            className: "group-column-checks",
            value: columnDraft,
            onChange: values => setColumnDraft(values)
          }, group.columns.map(item => e(Checkbox, { key: item.key, value: item.key }, item.label)))
        ]);
      })),
      e("div", { className: "column-panel-footer", key: "footer" }, [
        e(Button, { key: "cancel", onClick: () => { setColumnDraft(visibleColumns); setColumnsOpen(false); } }, "取 消"),
        e(Button, { key: "apply", type: "primary", onClick: () => { setVisibleColumns(columnDraft); setColumnsOpen(false); } }, "应 用")
      ])
    ]);

    const filterItem = (label, control, key) => e("label", { className: "customer-filter-item", key }, [
      e("span", { key: "label" }, label),
      control
    ]);

    return e("section", { className: "page-surface blacklist-page" }, [
      e("div", { className: "toolbar login-log-toolbar", key: "toolbar" }, [
        e("div", { className: "login-log-filter-area", key: "filters" }, [
          e(Space, { wrap: true, size: 8, key: "primary" }, [
            filterItem("用户ID :", e(Input, {
              value: draft.userId,
              onChange: event => updateDraft({ userId: event.target.value }),
              onPressEnter: search,
              placeholder: "请输入用户ID",
              allowClear: true,
              className: "keyword-input"
            }), "userId"),
            filterItem("邮箱 :", e(Input, {
              value: draft.email,
              onChange: event => updateDraft({ email: event.target.value }),
              onPressEnter: search,
              placeholder: "请输入邮箱",
              allowClear: true,
              className: "keyword-input"
            }), "email")
          ]),
          e(Space, { wrap: true, size: 8, key: "buttons" }, [
            e(Button, {
              key: "more",
              type: "link",
              onClick: () => setMoreOpen(open => !open)
            }, moreOpen ? "收起筛选" : "更多筛选"),
            e(Button, { key: "search", type: "primary", onClick: search }, "查 询"),
            e(Button, { key: "reset", onClick: reset }, "重置")
          ]),
          moreOpen ? e("div", { className: "blacklist-more-area", key: "more" }, [
            filterItem("排序方式 :", e(Select, {
              value: draft.sortBy,
              onChange: value => updateDraft({ sortBy: value }),
              className: "select-input",
              options: SORT_OPTIONS.map(value => ({ value, label: value }))
            }), "sortBy"),
            filterItem("添加时间(GMT+0) :", e(RangePicker, {
              value: draft.addedRange,
              onChange: range => updateDraft({ addedRange: range }),
              format: "YYYY-MM-DD",
              className: "login-log-range"
            }), "addedRange"),
            filterItem("注册时间(GMT+0) :", e(RangePicker, {
              value: draft.registerRange,
              onChange: range => updateDraft({ registerRange: range }),
              format: "YYYY-MM-DD",
              className: "login-log-range"
            }), "registerRange")
          ]) : null
        ]),
        e(Space, { wrap: true, size: 8, key: "actions" }, [
          e(Button, { key: "export", onClick: exportCsv }, "导 出"),
          e(Button, { key: "add", type: "primary", onClick: () => setAddOpen(true) }, "添加黑名单"),
          e(Popover, {
            key: "columns",
            trigger: "click",
            placement: "bottomRight",
            open: columnsOpen,
            onOpenChange: open => {
              setColumnDraft(visibleColumns);
              setColumnsOpen(open);
            },
            content: columnPanel
          }, e(Button, null, "列设置"))
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 1560 },
        locale: { emptyText: "暂无数据" },
        pagination: {
          current: page,
          pageSize,
          total: filtered.length,
          showSizeChanger: true,
          pageSizeOptions: [20],
          showTotal: total => `共 ${total} 条`,
          onChange: (next, size) => {
            setPage(next);
            setPageSize(size);
          }
        }
      }),
      addOpen ? e(AddBlacklistModal, {
        key: "add",
        open: true,
        onOk: addBlacklist,
        onCancel: () => setAddOpen(false)
      }) : null,
      restrictionRecord ? e(RestrictionModal, {
        key: `restriction-${restrictionRecord.id}`,
        record: restrictionRecord,
        onSave: restrictions => saveRestriction(restrictionRecord, restrictions),
        onClose: () => setRestrictionRecord(null)
      }) : null
    ]);
  }

  app.BlacklistPage = BlacklistPage;
})(window.AdminApp);

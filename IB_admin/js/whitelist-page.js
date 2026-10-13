(function registerWhitelistPage(app) {
  const {
    Button,
    Checkbox,
    Input,
    Modal,
    Popover,
    Space,
    Table,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  const EXPORT_HEADERS = ["用户ID", "昵称", "注册方式", "注册时间(GMT+0)", "邮箱", "收款账号", "最后操作人", "添加时间(GMT+0)", "国家/地区", "是否充值"];

  // 列设置分组：操作列固定不可取消，与源系统一致。
  const columnGroups = [
    { key: "customer", label: "客户信息", columns: [{ key: "userId", label: "用户ID" }, { key: "nickName", label: "昵称" }] },
    { key: "register", label: "注册信息", columns: [{ key: "registerType", label: "注册方式" }, { key: "registeredAt", label: "注册时间(GMT+0)" }] },
    { key: "contact", label: "联系与地址", columns: [{ key: "email", label: "邮箱" }, { key: "walletAddress", label: "收款账号" }] },
    { key: "record", label: "名单信息", columns: [{ key: "operator", label: "最后操作人" }, { key: "operatedAt", label: "添加时间" }, { key: "country", label: "国家/地区" }] },
    { key: "status", label: "状态与权限", columns: [{ key: "deposited", label: "是否充值" }] }
  ];
  const allColumnKeys = columnGroups.flatMap(group => group.columns.map(item => item.key));
  const defaultColumnKeys = [...allColumnKeys];

  function formatDate(value) {
    const now = new Date();
    const pad = num => String(num).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  function WhitelistPage(props) {
    const [list, setList] = React.useState(() => ((props && props.list) || app.mockData.whitelist || []).map(item => ({ ...item })));
    const [userId, setUserId] = React.useState("");
    const [appliedUserId, setAppliedUserId] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const [addUserId, setAddUserId] = React.useState("");
    const [visibleColumns, setVisibleColumns] = React.useState(defaultColumnKeys);
    const [columnDraft, setColumnDraft] = React.useState(defaultColumnKeys);
    const [columnsOpen, setColumnsOpen] = React.useState(false);

    const filtered = React.useMemo(() => {
      const term = appliedUserId.trim();
      return list.filter(item => !term || item.userId.includes(term));
    }, [list, appliedUserId]);

    const search = () => {
      setAppliedUserId(userId);
      setPage(1);
    };

    const reset = () => {
      setUserId("");
      setAppliedUserId("");
      setPage(1);
    };

    const exportCsv = () => {
      const csv = [EXPORT_HEADERS, ...filtered.map(item => [
        item.userId, item.nickName, item.registerType, item.registeredAt, item.email,
        item.walletAddress, item.operator, item.operatedAt, item.country, item.deposited
      ])]
        .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `白名单_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`已导出 ${filtered.length} 条白名单记录`);
    };

    function addWhitelist() {
      const target = addUserId.trim();
      if (!target) return;
      setList(prev => [{
        id: Date.now(),
        userId: target,
        nickName: "Mock User",
        registerType: "邮箱注册",
        registeredAt: formatDate(),
        email: "-",
        walletAddress: "-",
        operator: "Amy",
        operatedAt: formatDate(),
        country: "-",
        deposited: "否"
      }, ...prev]);
      setAddUserId("");
      setPage(1);
      message.success(`用户 ${target} 已加入白名单`);
    }

    function removeWhitelist(record) {
      const ref = Modal.confirm({
        title: "确认删除",
        content: `将把用户 ${record.userId} 移出白名单，删除后该用户不再享受白名单权益。`,
        okText: "删 除",
        okButtonProps: { danger: true },
        cancelText: "取 消",
        onOk: () => {
          setList(prev => prev.filter(item => item.id !== record.id));
          message.success(`用户 ${record.userId} 已移出白名单`);
          ref.destroy();
        },
        onCancel: () => ref.destroy()
      });
    }

    const optionalColumnMap = {
      userId: {
        title: "用户ID", dataIndex: "userId", width: 110,
        render: value => e(Button, {
          type: "link", size: "small", className: "cell-link",
          onClick: () => message.info(`模拟打开客户详情：${value}`)
        }, value)
      },
      nickName: {
        title: "昵称", dataIndex: "nickName", width: 140, ellipsis: true,
        render: value => e(Text, { type: "secondary" }, value)
      },
      registerType: { title: "注册方式", dataIndex: "registerType", width: 100 },
      registeredAt: { title: "注册时间(GMT+0)", dataIndex: "registeredAt", width: 160 },
      email: { title: "邮箱", dataIndex: "email", width: 180, ellipsis: true },
      walletAddress: { title: "收款账号", dataIndex: "walletAddress", width: 120, ellipsis: true },
      operator: { title: "最后操作人", dataIndex: "operator", width: 100 },
      operatedAt: { title: "添加时间", dataIndex: "operatedAt", width: 160 },
      country: { title: "国家/地区", dataIndex: "country", width: 90 },
      deposited: { title: "是否充值", dataIndex: "deposited", width: 90 }
    };

    const columns = React.useMemo(() => {
      const show = key => visibleColumns.includes(key);
      const cols = [];
      if (show("userId") || show("nickName")) {
        cols.push({
          title: "客户", key: "customer", width: 130, fixed: "left",
          render: (_, item) => e("div", { className: "stacked-cell" }, [
            show("userId") ? e(Button, {
              key: "id", type: "link", size: "small", className: "cell-link",
              onClick: () => message.info(`模拟打开客户详情：${item.userId}`)
            }, item.userId) : null,
            show("nickName") ? e("div", { key: "nick", className: "stacked-muted" }, item.nickName) : null
          ])
        });
      }
      if (show("registerType") || show("registeredAt")) {
        cols.push({
          title: "注册信息", key: "registerMerged", width: 170,
          render: (_, item) => e("div", { className: "stacked-cell" }, [
            show("registerType") ? e("div", { key: "type", className: "stacked-strong" }, item.registerType) : null,
            show("registeredAt") ? e("div", { key: "time", className: "stacked-muted" }, item.registeredAt) : null
          ])
        });
      }
      if (show("email")) cols.push(optionalColumnMap.email);
      if (show("walletAddress")) cols.push(optionalColumnMap.walletAddress);
      if (show("operator") || show("operatedAt")) {
        cols.push({
          title: "操作信息", key: "operateMerged", width: 160,
          render: (_, item) => e("div", { className: "stacked-cell" }, [
            show("operator") ? e("div", { key: "op", className: "stacked-strong" }, item.operator) : null,
            show("operatedAt") ? e("div", { key: "time", className: "stacked-muted" }, item.operatedAt) : null
          ])
        });
      }
      if (show("country")) cols.push(optionalColumnMap.country);
      if (show("deposited")) cols.push(optionalColumnMap.deposited);
      cols.push({
        title: "操作", key: "actions", fixed: "right", width: 110,
        render: (_, record) => e(Button, {
          danger: true, size: "small",
          onClick: () => removeWhitelist(record)
        }, "删 除")
      });
      return cols;
    }, [visibleColumns, list]);

    const columnPanel = e("div", { className: "group-column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("div", { key: "titles" }, [
          e("div", { className: "group-column-title" }, "显示字段"),
          e("div", { className: "column-panel-sub" }, "选择列表中需要展示的信息")
        ]),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${columnDraft.length}/${allColumnKeys.length}`)
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

    return e("section", { className: "page-surface whitelist-page" }, [
      e("div", { className: "toolbar", key: "toolbar" }, [
        e(Space, { wrap: true, size: 8, key: "filters" }, [
          e("label", { className: "customer-filter-item", key: "userId" }, [
            e("span", { key: "label" }, "用户ID :"),
            e(Input, {
              value: userId,
              onChange: event => setUserId(event.target.value),
              onPressEnter: search,
              placeholder: "请输入用户ID",
              allowClear: true,
              className: "keyword-input"
            })
          ]),
          e(Button, { key: "search", type: "primary", onClick: search }, "查 询"),
          e(Button, { key: "reset", onClick: reset }, "重置")
        ]),
        e(Space, { wrap: true, size: 8, key: "actions" }, [
          e(Button, { key: "export", onClick: exportCsv }, "导 出"),
          e(Space, { key: "add", size: 0 }, [
            e(Input, {
              value: addUserId,
              onChange: event => setAddUserId(event.target.value),
              onPressEnter: addWhitelist,
              placeholder: "请输入需要添加的用户ID",
              className: "whitelist-add-input"
            }),
            e(Button, {
              type: "primary",
              disabled: !addUserId.trim(),
              onClick: addWhitelist
            }, "添加白名单")
          ]),
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
        scroll: { x: 1180 },
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
      })
    ]);
  }

  app.WhitelistPage = WhitelistPage;
})(window.AdminApp);

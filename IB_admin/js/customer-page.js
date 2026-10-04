(function registerCustomerPage(app) {
  const {
    Button,
    Drawer,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  function renderPlainOrDash(value) {
    return value && value !== "-"
      ? value
      : e(Text, { type: "secondary" }, "-");
  }

  function serviceSearchText(service) {
    return [service.name, service.nickname, service.uid, service.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function serviceOptionLabel(service) {
    return e(Space, { size: 6 }, [
      e("span", { key: "name" }, service.nickname || service.name),
      service.uid && e(Text, { key: "uid", type: "secondary" }, service.uid)
    ]);
  }

  function makeServiceOptions(services, includeUnassigned = false) {
    const options = (services || []).map(service => ({
      value: service.name,
      label: serviceOptionLabel(service),
      labelText: service.nickname || service.name,
      searchText: serviceSearchText(service)
    }));
    return includeUnassigned
      ? options.concat({ value: "__none__", label: "未分配", labelText: "未分配", searchText: "未分配" })
      : options;
  }

  function filterServiceOption(input, option) {
    return String(option?.searchText || "")
      .toLowerCase()
      .includes(input.trim().toLowerCase());
  }

  function detailExtraOf(customer) {
    const defaultAccountNo = `${customer.userId}`.slice(-6);
    const detail = app.mockData.customerDetails?.[customer.userId] || {};
    return {
      firstName: "-",
      lastName: "-",
      countryName: customer.country,
      specialCustomer: "-",
      totalDeposit: customer.deposited ? "250" : "0",
      totalWithdrawal: "0",
      netDeposit: customer.deposited ? "250" : "0",
      tradeCount: customer.deposited ? "4" : "0",
      bonusAmount: customer.deposited ? "100" : "0",
      unlockedBonusAmount: "0",
      bonusStatus: customer.deposited ? "正常" : "-",
      network: "-",
      totalAssets: "0",
      accounts: customer.deposited ? [{
        accountNo: defaultAccountNo,
        subAccountId: defaultAccountNo,
        type: "统一交易账户",
        status: "正常",
        openedAt: customer.registeredAt,
        tradeMode: "逐仓",
        positionMode: "双向",
        totalDeposit: "250",
        totalWithdrawal: "0",
        netDeposit: "250",
        pnl: "0",
        pnlRate: "0.00%",
        orders: "0"
      }] : [],
      tradeRecords: [],
      fundRecords: [],
      subAccountFundRecords: [],
      bonusRecords: [],
      partnerRecords: [],
      followingRecords: [],
      followerRecords: [],
      activityRecords: [],
      ...detail
    };
  }

  function renderDetailRows(rows, key = "rows") {
    return e("dl", { className: "customer-detail-list", key }, rows.map(([label, value]) => (
      e("div", { className: "customer-detail-row", key: label }, [
        e("dt", { key: "dt" }, label),
        e("dd", { key: "dd" }, value && value !== "-" ? value : "-")
      ])
    )));
  }

  function renderSubAccountCards(accounts = []) {
    if (!accounts.length) {
      return e("div", { className: "customer-empty-tab", key: "accounts" }, [
        e("strong", { key: "title" }, "暂无交易账户"),
        e("span", { key: "desc" }, "该客户当前没有可展示的交易账户信息")
      ]);
    }
    return e("div", { className: "customer-subaccount-list", key: "accounts" }, accounts.map(account => (
      e("section", { className: "customer-subaccount-card", key: account.accountNo }, [
        e("div", { className: "customer-subaccount-head", key: "head" }, [
          e("div", { className: "customer-subaccount-title", key: "title" }, [
            e("strong", { key: "account" }, `交易账号 # ${account.accountNo}`),
            e(Text, { key: "id", type: "secondary" }, `子账号 ID ${account.subAccountId || account.accountNo}`)
          ]),
          e(Tag, { key: "type", color: account.type === "模拟账户" ? "blue" : "processing" }, account.type)
        ]),
        e("div", { className: "customer-subaccount-highlight", key: "highlight" }, [
          ["净充值金额", account.netDeposit],
          ["累计盈利", account.pnl],
          ["累计盈利率", account.pnlRate],
          ["总订单", account.orders]
        ].map(([label, value]) => e("div", { className: "customer-subaccount-metric", key: label }, [
          e("span", { key: "label" }, label),
          e("strong", { key: "value" }, value || "-")
        ]))
        ),
        e("div", { className: "customer-subaccount-grid", key: "grid" }, [
          ["开通时间", account.openedAt],
          ["交易模式", account.tradeMode],
          ["持仓模式", account.positionMode],
          ["总充值金额", account.totalDeposit],
          ["总提现金额", account.totalWithdrawal]
        ].map(([label, value]) => e("div", { className: "customer-subaccount-field", key: label }, [
          e("span", { key: "label" }, label),
          e("strong", { key: "value" }, value || "-")
        ])))
      ])
    )));
  }

  function renderCustomerSidebar(customer, extra) {
    return e("aside", { className: "customer-detail-sidebar", key: "sidebar" }, [
      e("div", { className: "customer-profile", key: "profile" }, [
        e("div", { className: "customer-profile-avatar", key: "avatar" }),
        e("strong", { key: "name" }, customer.name),
        e(Tag, { key: "deposit", color: customer.deposited ? "green" : "default" }, customer.deposited ? "已充值" : "未充值")
      ]),
      e("div", { className: "customer-sidebar-section", key: "basic" }, [
        e("h3", { key: "title" }, "基本信息"),
        renderDetailRows([
          ["用户ID", customer.userId],
          ["国家/地区", extra.countryName || customer.country],
          ["特殊客户", extra.specialCustomer],
          ["总充值金额", extra.totalDeposit],
          ["总提现金额", extra.totalWithdrawal],
          ["净充值金额", extra.netDeposit],
          ["总订单", extra.tradeCount],
          ["赠金金额", extra.bonusAmount],
          ["已解锁赠金金额", extra.unlockedBonusAmount],
          ["赠金状态", extra.bonusStatus],
          ["邮箱", customer.email],
          ["网络", extra.network],
          ["钱包地址", customer.walletAddress]
        ], "basic-list")
      ])
    ]);
  }

  function renderDetailFilterBar(fields) {
    return e("div", { className: "customer-detail-filter" }, fields.map(field => (
      e("label", { className: "customer-detail-filter-item", key: field.label }, [
        e("span", { key: "label" }, field.label),
        field.type === "select"
          ? e(Select, {
            key: "control",
            placeholder: field.placeholder || "全部",
            allowClear: true,
            className: field.wide ? "customer-detail-control wide" : "customer-detail-control",
            options: (field.options || []).map(value => ({ value, label: value }))
          })
          : field.type === "range"
            ? e(Input, {
              key: "control",
              placeholder: "Start date  →  End date",
              allowClear: true,
              className: "customer-detail-range"
            })
            : e(Input, {
              key: "control",
              placeholder: field.placeholder || field.label,
              allowClear: true,
              className: "customer-detail-control"
            })
      ])
    )).concat([
      e(Button, { key: "search", type: "primary" }, "查 询"),
      e(Button, { key: "reset" }, "重置")
    ]));
  }

  function renderRecordTable({ filters = [], columns, data, total, summary }) {
    return e("div", { className: "customer-record-panel" }, [
      summary && e("div", { className: "customer-record-summary", key: "summary" }, summary.map(([label, value]) => (
        e("div", { className: "customer-record-summary-item", key: label }, [
          e("span", { key: "label" }, label),
          e("strong", { key: "value" }, value || "-")
        ])
      ))),
      filters.length ? e("div", { key: "filters" }, renderDetailFilterBar(filters)) : null,
      e(Table, {
        key: "table",
        rowKey: "id",
        size: "middle",
        columns,
        dataSource: data || [],
        pagination: {
          pageSize: 20,
          total: total ?? (data || []).length,
          showSizeChanger: true,
          showTotal: value => `共 ${value} 条`
        },
        scroll: { x: "max-content" }
      })
    ]);
  }

  function renderTradeRecords(extra) {
    return renderRecordTable({
      filters: [
        { label: "子账号", type: "select", placeholder: "请选择子账号", options: (extra.accounts || []).map(account => account.accountNo) },
        { label: "订单号", placeholder: "请输入订单号" },
        { label: "是否平仓", type: "select", options: ["全部", "是", "否"] },
        { label: "开仓时间(GMT+0)", type: "range", wide: true },
        { label: "平仓时间(GMT+0)", type: "range", wide: true }
      ],
      columns: [
        { title: "订单号", dataIndex: "orderNo", width: 140 },
        { title: "开仓价", dataIndex: "openPrice", width: 100 },
        { title: "平仓价", dataIndex: "closePrice", width: 100 },
        { title: "保证金", dataIndex: "margin", width: 110 },
        { title: "盈亏", dataIndex: "pnl", width: 100 },
        { title: "开平仓费用", dataIndex: "fee", width: 120 },
        { title: "资金费", dataIndex: "fundingFee", width: 100 },
        { title: "开仓时间(GMT+0)", dataIndex: "openedAt", width: 150 },
        { title: "平仓时间(GMT+0)", dataIndex: "closedAt", width: 150 },
        { title: "是否平仓", dataIndex: "closed", width: 90, render: value => e(Tag, { color: value === "是" ? "green" : "default" }, value) },
        { title: "平仓类型", dataIndex: "closeType", width: 110, render: value => e(Tag, null, value) }
      ],
      data: extra.tradeRecords,
      total: extra.tradeRecords?.length
    });
  }

  function renderFundRecords(customer, extra) {
    return renderRecordTable({
      summary: [
        ["资金账号 ID", customer.userId],
        ["总资产", extra.totalAssets]
      ],
      filters: [
        { label: "订单号", placeholder: "订单号" },
        { label: "资金类型", type: "select", placeholder: "资金类型", options: ["入金", "资金划转", "红包", "赠金", "提现"] },
        { label: "生成时间(GMT+0)", type: "range", wide: true }
      ],
      columns: [
        { title: "用户ID", dataIndex: "userId", width: 120 },
        { title: "资金类型", dataIndex: "fundType", width: 120 },
        { title: "生成时间(GMT+0)", dataIndex: "createdAt", width: 170 },
        { title: "来源", dataIndex: "source", width: 190 },
        { title: "去向", dataIndex: "target", width: 120 },
        { title: "金额", dataIndex: "amount", width: 100 },
        { title: "变动后余额", dataIndex: "balanceAfter", width: 120 }
      ],
      data: extra.fundRecords,
      total: extra.fundRecords?.length
    });
  }

  function renderSimpleRecords(records, columns) {
    return renderRecordTable({
      filters: [
        { label: "订单号", placeholder: "订单号" },
        { label: "生成时间(GMT+0)", type: "range", wide: true }
      ],
      columns,
      data: records,
      total: records?.length
    });
  }

  function CustomerPage({ customers = [], services = [] }) {
    const [keyword, setKeyword] = React.useState("");
    const [depositStatus, setDepositStatus] = React.useState();
    const [serviceFilter, setServiceFilter] = React.useState();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const [serviceByCustomer, setServiceByCustomer] = React.useState(() => (
      Object.fromEntries(customers.map(customer => [customer.id, customer.service || null]))
    ));
    const [assignOpen, setAssignOpen] = React.useState(false);
    const [assignUserIds, setAssignUserIds] = React.useState([]);
    const [assignService, setAssignService] = React.useState();
    const [selectedCustomerIds, setSelectedCustomerIds] = React.useState([]);
    const [detail, setDetail] = React.useState(null);

    const serviceOf = customer => (customer.id in serviceByCustomer
      ? serviceByCustomer[customer.id]
      : customer.service) ?? null;

    const filteredCustomers = React.useMemo(() => {
      const term = keyword.trim().toLowerCase();
      return customers.filter(customer => {
        const keywordMatched = !term
          || [customer.userId, customer.name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term);
        const depositMatched = !depositStatus || (customer.deposited ? "是" : "否") === depositStatus;
        const serviceMatched = !serviceFilter
          || (serviceFilter === "__none__" ? !serviceOf(customer) : serviceOf(customer) === serviceFilter);
        return keywordMatched && depositMatched && serviceMatched;
      });
    }, [customers, keyword, depositStatus, serviceFilter, serviceByCustomer]);

    React.useEffect(() => {
      setPage(1);
    }, [keyword, depositStatus, serviceFilter]);

    const pageRows = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
    const serviceOptions = React.useMemo(() => makeServiceOptions(services, true), [services]);
    const assignServiceOptions = React.useMemo(() => makeServiceOptions(services).concat({
      value: "__none__",
      label: "未分配（清空客服）",
      labelText: "未分配（清空客服）",
      searchText: "未分配 清空客服 取消分配"
    }), [services]);

    const assignTags = [...new Set(assignUserIds.map(value => value.trim()).filter(Boolean))];
    const matchedAssignCustomers = assignTags
      .map(tag => customers.find(customer => customer.userId === tag))
      .filter(Boolean);
    const invalidAssignTags = assignTags
      .filter(tag => !customers.some(customer => customer.userId === tag));

    function openAssign() {
      const preset = customers
        .filter(customer => selectedCustomerIds.includes(customer.id))
        .map(customer => customer.userId);
      setAssignUserIds(preset);
      setAssignService(undefined);
      setAssignOpen(true);
    }

    function executeAssign() {
      const isClearing = assignService === "__none__";
      const targetService = isClearing ? null : assignService;
      let assignedCount = 0;
      let reboundCount = 0;
      let unassignedCount = 0;
      let skippedCount = 0;
      const nextServiceByCustomer = { ...serviceByCustomer };
      matchedAssignCustomers.forEach(customer => {
        const current = serviceOf(customer);
        if (current === targetService) {
          skippedCount += 1;
          return;
        }
        nextServiceByCustomer[customer.id] = targetService;
        if (isClearing) unassignedCount += 1;
        else if (current) reboundCount += 1;
        else assignedCount += 1;
      });
      setAssignOpen(false);
      setSelectedCustomerIds([]);
      if (!assignedCount && !reboundCount && !unassignedCount) {
        message.info(`所选 ${skippedCount} 个客户${isClearing ? "均已无客服" : `均已属于客服 ${assignService}`}，无需变更`);
        return;
      }
      setServiceByCustomer(nextServiceByCustomer);
      const summaryParts = [`共 ${assignTags.length} 个客户`];
      if (assignedCount) summaryParts.push(`分配 ${assignedCount} 个`);
      if (reboundCount) summaryParts.push(`换绑 ${reboundCount} 个`);
      if (unassignedCount) summaryParts.push(`取消分配 ${unassignedCount} 个`);
      if (skippedCount) summaryParts.push(`跳过 ${skippedCount} 个（${isClearing ? "已无客服" : "已是该客服"}）`);
      message.success(summaryParts.join("，"));
    }

    function confirmAssign() {
      if (!assignTags.length) {
        message.error("请输入至少一个客户编号");
        return;
      }
      if (invalidAssignTags.length) {
        message.error(`未匹配客户编号：${invalidAssignTags.join("、")}`);
        return;
      }
      if (!assignService) {
        message.warning("请选择目标客服");
        return;
      }
      if (assignService === "__none__") {
        const clearCount = matchedAssignCustomers.filter(customer => serviceOf(customer)).length;
        if (!clearCount) {
          executeAssign();
          return;
        }
        Modal.confirm({
          title: "取消客服分配",
          content: `确定取消 ${clearCount} 个客户的客服分配吗？取消后这些客户将不再隶属于任何客服。`,
          okText: "确认取消分配",
          okButtonProps: { danger: true },
          cancelText: "再想想",
          onOk: executeAssign
        });
        return;
      }
      executeAssign();
    }

    function resetFilters() {
      setKeyword("");
      setDepositStatus(undefined);
      setServiceFilter(undefined);
      setPage(1);
    }

    const columns = [
      {
        title: "所属客服",
        width: 110,
        render: (_, record) => {
          const service = serviceOf(record);
          return service
            ? e(Tag, { color: "geekblue" }, service)
            : e(Text, { type: "secondary" }, "-");
        }
      },
      {
        title: "客户",
        width: 200,
        render: (_, record) => e("div", { className: "customer-id-cell" }, [
          e(Button, {
            key: "id",
            type: "link",
            className: "customer-id-link",
            onClick: () => setDetail(record)
          }, record.userId),
          e("span", { key: "name" }, record.name)
        ])
      },
      {
        title: "上级代理ID",
        dataIndex: "parentAgentId",
        width: 130,
        render: renderPlainOrDash
      },
      {
        title: "注册信息",
        width: 210,
        render: (_, record) => e("div", { className: "customer-register-cell" }, [
          e("span", { key: "type" }, record.registerType),
          e("span", { key: "time" }, record.registeredAt)
        ])
      },
      {
        title: "邮箱",
        dataIndex: "email",
        width: 210,
        render: renderPlainOrDash
      },
      {
        title: "钱包地址",
        width: 90,
        align: "center",
        render: () => e(Text, { type: "secondary" }, "-")
      },
      {
        title: "国家/地区",
        dataIndex: "country",
        width: 100
      },
      {
        title: "是否充值",
        width: 90,
        align: "center",
        render: (_, record) => e(Tag, { color: record.deposited ? "green" : "default" }, record.deposited ? "是" : "否")
      }
    ];

    return e("section", { className: "page-surface customer-page" }, [
      e("div", { className: "toolbar customer-toolbar", key: "toolbar" }, [
        e(Space, { wrap: true, size: 8, key: "filters" }, [
          e("label", { className: "customer-filter-item", key: "keyword" }, [
            e("span", { key: "label" }, "关键词"),
            e(Input, {
              value: keyword,
              onChange: event => setKeyword(event.target.value),
              onPressEnter: () => setPage(1),
              placeholder: "请输入UID或昵称",
              allowClear: true,
              className: "keyword-input"
            })
          ]),
          e("label", { className: "customer-filter-item", key: "deposit" }, [
            e("span", { key: "label" }, "充值状态"),
            e(Select, {
              value: depositStatus,
              onChange: value => setDepositStatus(value),
              placeholder: "全部",
              allowClear: true,
              className: "select-input",
              options: ["是", "否"].map(value => ({ value, label: value }))
            })
          ]),
          e("label", { className: "customer-filter-item", key: "service" }, [
            e("span", { key: "label" }, "所属客服"),
            e(Select, {
              value: serviceFilter,
              onChange: value => setServiceFilter(value),
              placeholder: "全部",
              allowClear: true,
              showSearch: true,
              optionFilterProp: "searchText",
              optionLabelProp: "labelText",
              filterOption: filterServiceOption,
              className: "select-input",
              options: serviceOptions
            })
          ]),
          e(Button, {
            key: "search",
            type: "primary",
            onClick: () => setPage(1)
          }, "搜 索"),
          e(Button, {
            key: "reset",
            onClick: resetFilters
          }, "重置")
        ]),
        e(Space, { wrap: true, size: 8, key: "actions" }, [
          e(Button, { key: "export" }, "导 出"),
          e(Button, {
            key: "assign",
            type: "primary",
            onClick: openAssign
          }, selectedCustomerIds.length ? `分配客服(${selectedCustomerIds.length})` : "分配客服"),
          e(Button, { key: "columns" }, "列设置")
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: pageRows,
        rowSelection: {
          selectedRowKeys: selectedCustomerIds,
          onChange: keys => setSelectedCustomerIds(keys)
        },
        pagination: {
          current: page,
          pageSize,
          total: filteredCustomers.length,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条`,
          onChange: (next, size) => {
            setPage(next);
            setPageSize(size);
          }
        },
        scroll: { x: 1140 }
      }),
      e(Modal, {
        key: "assign-modal",
        className: "customer-assign-modal",
        title: "分配客服",
        open: assignOpen,
        onCancel: () => setAssignOpen(false),
        onOk: confirmAssign,
        okText: "确 定",
        cancelText: "取 消",
        destroyOnClose: true
      }, assignOpen && e("div", { className: "batch-assign-form", key: "form" }, [
        e("div", { className: "batch-assign-field", key: "user" }, [
          e("span", { key: "label" }, "客户编号"),
          e(Select, {
            key: "input",
            mode: "tags",
            value: assignUserIds,
            onChange: values => setAssignUserIds(values),
            tokenSeparators: [",", "，", ";", "；"],
            placeholder: "请输入客户编号后回车，支持批量，如 315899879",
            suffixIcon: null,
            style: { width: "100%" }
          })
        ]),
        assignTags.length ? e("div", { className: "batch-assign-list", key: "list" },
          assignTags.map(tag => {
            const customer = customers.find(item => item.userId === tag);
            return e("div", {
              key: tag,
              className: customer ? "batch-assign-row" : "batch-assign-row is-invalid"
            }, [
              e("span", { key: "main", className: "batch-assign-main" },
                customer ? `${customer.userId} · ${customer.name}` : tag),
              e("span", { key: "meta", className: "batch-assign-meta" },
                customer ? `当前客服：${serviceOf(customer) || "未分配"}` : "未匹配")
            ]);
          })
        ) : null,
        e("div", { className: "batch-assign-hint", key: "hint" },
          "可输入多个客户编号，或先在列表勾选客户后点击「分配客服」带入"),
        e("div", { className: "batch-assign-field", key: "service" }, [
          e("span", { key: "label" }, "目标客服"),
          e(Select, {
            key: "select",
            value: assignService,
            onChange: setAssignService,
            placeholder: "请选择客服",
            showSearch: true,
            optionFilterProp: "searchText",
            optionLabelProp: "labelText",
            filterOption: filterServiceOption,
            options: assignServiceOptions
          })
        ]),
        assignService === "__none__" ? e("div", { className: "batch-assign-warning", key: "warning" },
          "已选择清空客服：确定后将取消所选客户的客服分配，使其不再隶属于任何客服") : null
      ])),
      e(Drawer, {
        key: "detail-drawer",
        title: "客户详情",
        open: Boolean(detail),
        width: "calc(100vw - 360px)",
        onClose: () => setDetail(null),
        destroyOnClose: true,
        className: "customer-detail-drawer"
      }, detail && (() => {
        const extra = detailExtraOf(detail);
        const mainWithSidebar = content => e("div", { className: "customer-detail-layout" }, [
          e("main", { className: "customer-detail-main", key: "main" }, content),
          renderCustomerSidebar(detail, extra)
        ]);
        const subAccountFundColumns = [
          { title: "子账号ID", dataIndex: "subAccountId", width: 130 },
          { title: "资金类型", dataIndex: "fundType", width: 120 },
          { title: "生成时间(GMT+0)", dataIndex: "createdAt", width: 170 },
          { title: "来源", dataIndex: "source", width: 150 },
          { title: "去向", dataIndex: "target", width: 120 },
          { title: "金额", dataIndex: "amount", width: 100 },
          { title: "变动后余额", dataIndex: "balanceAfter", width: 120 }
        ];
        const bonusColumns = [
          { title: "用户ID", dataIndex: "userId", width: 120 },
          { title: "赠金类型", dataIndex: "bonusType", width: 120 },
          { title: "生成时间(GMT+0)", dataIndex: "createdAt", width: 170 },
          { title: "金额", dataIndex: "amount", width: 100 },
          { title: "解锁金额", dataIndex: "unlockedAmount", width: 110 },
          { title: "状态", dataIndex: "status", width: 100, render: value => e(Tag, { color: value === "正常" ? "green" : "default" }, value) }
        ];
        const partnerColumns = [
          { title: "Partner ID", dataIndex: "partnerId", width: 130 },
          { title: "等级", dataIndex: "level", width: 100 },
          { title: "上级代理ID", dataIndex: "parentAgentId", width: 130 },
          { title: "佣金规则", dataIndex: "commissionRule", width: 130 },
          { title: "创建时间", dataIndex: "createdAt", width: 170 }
        ];
        const followColumns = [
          { title: "高手ID", dataIndex: "traderId", width: 120 },
          { title: "高手昵称", dataIndex: "traderName", width: 130 },
          { title: "跟随金额", dataIndex: "amount", width: 110 },
          { title: "跟随状态", dataIndex: "status", width: 110 },
          { title: "创建时间", dataIndex: "createdAt", width: 170 }
        ];
        const followerColumns = [
          { title: "跟单者ID", dataIndex: "followerId", width: 120 },
          { title: "跟单者昵称", dataIndex: "followerName", width: 130 },
          { title: "跟单金额", dataIndex: "amount", width: 110 },
          { title: "分成比例", dataIndex: "shareRate", width: 100 },
          { title: "创建时间", dataIndex: "createdAt", width: 170 }
        ];
        const activityColumns = [
          { title: "活动ID", dataIndex: "activityId", width: 120 },
          { title: "活动名称", dataIndex: "activityName", width: 180 },
          { title: "参与时间", dataIndex: "joinedAt", width: 170 },
          { title: "奖励", dataIndex: "reward", width: 120 },
          { title: "状态", dataIndex: "status", width: 100 }
        ];
        return e("div", { className: "customer-detail", key: detail.id }, [
          e(Tabs, {
            key: "tabs",
            className: "customer-tabs",
            items: [
              {
                key: "subAccounts",
                label: "子账号信息",
                children: mainWithSidebar([
                  renderSubAccountCards(extra.accounts),
                  e("div", { className: "customer-open-account", key: "open" },
                    e(Button, { type: "primary" }, "开通赠金账号")
                  )
                ])
              }
            ].concat([
              { key: "trades", label: "交易记录", children: mainWithSidebar(renderTradeRecords(extra)) },
              { key: "funds", label: "资金记录", children: mainWithSidebar(renderFundRecords(detail, extra)) },
              { key: "subFunds", label: "子账号资金记录", children: mainWithSidebar(renderSimpleRecords(extra.subAccountFundRecords, subAccountFundColumns)) },
              { key: "bonus", label: "赠金记录", children: mainWithSidebar(renderSimpleRecords(extra.bonusRecords, bonusColumns)) },
              { key: "partner", label: "Partner Program", children: mainWithSidebar(renderSimpleRecords(extra.partnerRecords, partnerColumns)) },
              { key: "following", label: "跟随的高手", children: mainWithSidebar(renderSimpleRecords(extra.followingRecords, followColumns)) },
              { key: "followers", label: "跟单者", children: mainWithSidebar(renderSimpleRecords(extra.followerRecords, followerColumns)) },
              { key: "activities", label: "活动参与", children: mainWithSidebar(renderSimpleRecords(extra.activityRecords, activityColumns)) }
            ])
          })
        ]);
      })())
    ]);
  }

  app.CustomerPage = CustomerPage;
})(window.AdminApp);

(function registerCustomerPage(app) {
  const {
    Button,
    DatePicker,
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
  const { RangePicker } = DatePicker;
  const { Text } = Typography;
  const e = React.createElement;

  function renderPlainOrDash(value) {
    return value && value !== "-"
      ? value
      : e(Text, { type: "secondary" }, "-");
  }

  /* ---------- 数字与空值规范 ---------- */

  function isBlank(value) {
    return value == null || value === "" || value === "-";
  }

  function parseNum(value) {
    const n = Number(String(value ?? "").replace(/[,%\s¥$]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function fmtAmount(value, unit = "USDT") {
    if (isBlank(value)) return "—";
    const n = parseNum(value);
    if (n == null) return value;
    const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n < 0 ? "-" : ""}${abs}${unit ? ` ${unit}` : ""}`;
  }

  function fmtSigned(value, unit = "USDT") {
    if (isBlank(value)) return "—";
    const n = parseNum(value);
    if (n == null) return value;
    const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n > 0 ? "+" : n < 0 ? "-" : ""}${abs}${unit ? ` ${unit}` : ""}`;
  }

  function fmtCount(value) {
    if (isBlank(value)) return "—";
    const n = parseNum(value);
    if (n == null) return value;
    return n.toLocaleString("en-US");
  }

  function fmtPercent(value) {
    if (isBlank(value)) return "—";
    const n = parseNum(value);
    if (n == null) return value;
    return `${n.toFixed(2)}%`;
  }

  function fmtSum(value, unit = "USDT") {
    return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
  }

  function signedClass(value) {
    const n = parseNum(value);
    if (n == null || n === 0) return "";
    return n > 0 ? "is-up" : "is-down";
  }

  /* 保证金比例越高越接近强平风险：≥80% 红色、≥50% 橙色 */
  function ratioClass(value) {
    const n = parseNum(value);
    if (n == null) return "";
    if (n >= 80) return "ratio-danger";
    if (n >= 50) return "ratio-warning";
    return "";
  }

  /* ---------- 一键复制 ---------- */

  const COPY_ICON = e("svg", {
    key: "icon",
    viewBox: "0 0 24 24",
    width: 12,
    height: 12,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  }, [
    e("rect", { key: "r", x: 9, y: 9, width: 13, height: 13, rx: 2, ry: 2 }),
    e("path", { key: "p", d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
  ]);

  function CopyButton({ value, title = "复制" }) {
    function fallbackCopy() {
      try {
        const input = document.createElement("textarea");
        input.value = String(value);
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      } catch (err) { /* 原型环境忽略复制失败 */ }
    }

    function handleCopy() {
      const finish = () => message.success("复制成功");
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(String(value)).then(finish, () => {
            fallbackCopy();
            finish();
          });
          return;
        }
      } catch (err) { /* 走降级方案 */ }
      fallbackCopy();
      finish();
    }

    return e(Button, {
      type: "text",
      size: "small",
      className: "customer-copy-btn",
      onClick: handleCopy,
      title,
      "aria-label": title
    }, [COPY_ICON]);
  }

  /* ---------- 详情数据装配 ---------- */

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
      realNameStatus: "-",
      kycStatus: "-",
      phone: "-",
      kycAt: "-",
      registerIp: "-",
      deviceFingerprint: "-",
      lastLoginAt: "-",
      lastLoginIp: "-",
      loginDevice: "-",
      note: "",
      riskTags: [],
      accounts: customer.deposited ? [{
        accountNo: defaultAccountNo,
        subAccountId: defaultAccountNo,
        type: "统一交易账户",
        status: "正常",
        openedAt: customer.registeredAt,
        tradeMode: "逐仓",
        positionMode: "双向",
        balance: "250.00",
        equity: "250.00",
        credit: "0",
        marginUsed: "0",
        marginFree: "250.00",
        marginRatio: "-",
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
      partnerInfo: { isAgent: "-", userType: "-", userLevel: "-", parentAgentId: "-", agentLevel: "-", agentSince: "-" },
      levelChangeRecords: [],
      commissionInfo: { settled: "-", pending: "-" },
      followingRecords: [],
      followerRecords: [],
      activityRecords: [],
      ...detail
    };
  }

  /* 用户级资产汇总条只统计真实账户，模拟盘不计入 */
  function sumAccounts(accounts, key) {
    return (accounts || [])
      .filter(account => account.type !== "模拟账户")
      .reduce((sum, account) => sum + (parseNum(account[key]) || 0), 0);
  }

  function recordCount(records) {
    return (records || []).length;
  }

  function tabLabel(label, count) {
    if (count == null) return label;
    return e("span", { className: "customer-tab-label" }, [
      e("span", { key: "l" }, label),
      e("span", { className: "customer-tab-count", key: "c" }, count)
    ]);
  }

  function renderDetailRows(rows, key = "rows") {
    return e("dl", { className: "customer-detail-list", key }, rows.map(([label, value], index) => (
      e("div", { className: "customer-detail-row", key: index }, [
        e("dt", { key: "dt" }, label),
        e("dd", { key: "dd" }, isBlank(value) ? "—" : value)
      ])
    )));
  }

  /* ---------- 顶部身份区（昵称/UID/标签/主操作） ---------- */

  function renderDetailHeader(customer, extra, actions) {
    return e("div", { className: "customer-detail-header", key: "header" }, [
      e("div", { className: "customer-header-top", key: "top" }, [
        e("div", { className: "customer-header-identity", key: "identity" }, [
          e("div", { className: "customer-profile-avatar", key: "avatar" },
            (customer.name || "?").charAt(0).toUpperCase()),
          e("div", { className: "customer-header-name-block", key: "nameblock" }, [
            e("div", { className: "customer-header-name", key: "name" }, [
              e("strong", { key: "n" }, customer.name),
              e("span", { key: "uid", className: "customer-header-uid" }, `UID：${customer.userId}`),
              e(CopyButton, { key: "copy", value: customer.userId, title: "复制 UID" })
            ]),
            e("div", { className: "customer-header-tags", key: "tags" }, [
              e(Tag, { key: "dep", color: customer.deposited ? "green" : "default" },
                customer.deposited ? "已充值" : "未充值"),
              e(Tag, { key: "country" }, extra.countryName || customer.country),
              e(Tag, { key: "special" },
                isBlank(extra.specialCustomer) ? "正常客户" : extra.specialCustomer)
            ])
          ])
        ]),
        e(Space, { key: "actions", wrap: true, size: 8, className: "customer-header-actions" }, actions)
      ]),
      e("div", { className: "customer-header-meta", key: "meta" }, [
        e("span", { key: "reg" }, `${customer.registerType ? customer.registerType.replace(/注册$/, "") + " " : ""}注册于 ${customer.registeredAt}`)
      ])
    ]);
  }

  /* 用户级资产总览卡片：余额为主指标，入金/提现/净入金/赠金为次要指标，只统计真实账户 */
  function renderAssetStrip(extra) {
    const accounts = extra.accounts || [];
    const hasAssets = accounts.some(account => account.type !== "模拟账户");
    return e("div", { className: "customer-asset-block", key: "assets" },
      hasAssets
        ? e("div", { className: "customer-asset-card", key: "card" }, [
          e("div", { className: "customer-asset-main", key: "main" }, [
            e("span", { key: "l", className: "customer-asset-label" }, [
              "总余额",
              e("i", { key: "u", className: "metric-unit" }, "USDT")
            ]),
            e("strong", { key: "v", className: "customer-asset-balance" },
              fmtSum(sumAccounts(accounts, "balance"), null)),
            e("span", { key: "cap", className: "customer-asset-caption" }, "客户当前资产合计")
          ]),
          e("div", { className: "customer-asset-grid", key: "grid" }, [
            ["总入金", fmtSum(sumAccounts(accounts, "totalDeposit"), null), ""],
            ["总提现", fmtSum(sumAccounts(accounts, "totalWithdrawal"), null), ""],
            ["净入金", fmtSum(sumAccounts(accounts, "netDeposit"), null), ""],
            ["赠金金额", fmtAmount(extra.bonusAmount, null), " is-orange"]
          ].map(([label, value, cls]) => e("div", { className: "customer-asset-field", key: label }, [
            e("span", { key: "l", className: "customer-asset-label" }, [
              label,
              e("i", { key: "u", className: "metric-unit" }, "USDT")
            ]),
            e("strong", { key: "v", className: cls.trim() || undefined }, value)
          ])))
        ])
        : e("div", { className: "customer-asset-empty", key: "empty" }, "该客户尚未入金，暂无资产数据"));
  }

  /* ---------- 子账号卡片（核心指标 + 次要字段折叠） ---------- */

  function isZeroAccount(account) {
    return !account
      || ((parseNum(account.equity) || 0) === 0
        && (parseNum(account.netDeposit) || 0) === 0
        && (parseNum(account.orders) || 0) === 0);
  }

  function SubAccountCard({ account }) {
    const isDemo = account.type === "模拟账户";
    const collapsedByDefault = isDemo || isZeroAccount(account);
    const [expanded, setExpanded] = React.useState(!collapsedByDefault);

    function toggle() {
      setExpanded(prev => !prev);
    }

    function handleKeyDown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    }

    return e("section", {
      className: `customer-subaccount-card${expanded ? " is-expanded" : " is-collapsed"}`,
      key: account.accountNo
    }, [
      e("div", {
        className: "customer-subaccount-head",
        key: "head",
        role: "button",
        tabIndex: 0,
        "aria-expanded": expanded,
        onClick: toggle,
        onKeyDown: handleKeyDown
      }, [
        e("span", { className: `customer-subaccount-chevron${expanded ? " open" : ""}`, key: "chevron" }, "▸"),
        e("div", { className: "customer-subaccount-title", key: "title" }, [
          e("span", { className: "customer-subaccount-name", key: "name" }, [
            e("strong", { key: "no" }, "交易账号"),
            e("span", { key: "id", className: "customer-subaccount-id" }, `ID：${account.accountNo}`),
            e(CopyButton, { key: "copy", value: account.accountNo, title: "复制交易账号" })
          ]),
          !expanded ? e("span", { className: "customer-subaccount-inline", key: "inline" }, [
            e("span", { key: "eq" }, [
              "净值",
              e("i", { key: "u", className: "metric-unit" }, "USDT"),
              ` ${fmtAmount(account.equity, null)}`
            ]),
            e("span", { key: "rate" }, `盈利率 ${fmtPercent(account.pnlRate)}`)
          ]) : null
        ]),
        e("span", { className: "customer-subaccount-tags", key: "tags" }, [
          e(Tag, { key: "type", color: isDemo ? "default" : "processing" }, account.type),
          isBlank(account.status) || account.status === "-"
            ? null
            : e(Tag, { key: "status", color: account.status === "正常" ? "green" : "red" }, account.status)
        ])
      ]),
      expanded ? e("div", { className: "customer-subaccount-body", key: "body" }, [
        e("div", { className: "customer-subaccount-highlight", key: "highlight" }, [
          ["余额", fmtAmount(account.balance, null), "", true],
          ["净值", fmtAmount(account.equity, null), "", true],
          ["累计盈利", fmtSigned(account.pnl, null), signedClass(account.pnl), true],
          ["累计盈利率", fmtPercent(account.pnlRate), signedClass(account.pnlRate), false],
          ["总订单", fmtCount(account.orders), "", false]
        ].map(([label, value, cls, money]) => e("div", { className: "customer-subaccount-metric", key: label }, [
          e("span", { key: "l" }, [
            label,
            money ? e("i", { key: "u", className: "metric-unit" }, "USDT") : null
          ]),
          e("strong", { key: "v", className: cls }, value)
        ]))),
        e("div", { className: "customer-subaccount-grid", key: "grid" }, [
          ["可用保证金", fmtAmount(account.marginFree, null), "", true],
          ["已用保证金", fmtAmount(account.marginUsed, null), "", true],
          ["保证金比例", fmtPercent(account.marginRatio), ratioClass(account.marginRatio), false],
          ["净值", fmtAmount(account.equity, null), "", true],
          ["净充值金额", fmtAmount(account.netDeposit, null), "", true],
          ["历史总充值金额", fmtAmount(account.totalDeposit, null), "", true],
          ["历史总提现金额", fmtAmount(account.totalWithdrawal, null), "", true],
          ["交易模式", isBlank(account.tradeMode) ? "—" : account.tradeMode, "", false],
          ["持仓模式", isBlank(account.positionMode) ? "—" : account.positionMode, "", false],
          ["最后交易", isBlank(account.lastTrade) ? "—" : account.lastTrade, "", false],
          ["开通时间", isBlank(account.openedAt) ? "—" : account.openedAt, "", false]
        ].map(([label, value, cls, money]) => e("div", { className: "customer-subaccount-field", key: label }, [
          e("span", { key: "l" }, [
            label,
            money ? e("i", { key: "u", className: "metric-unit" }, "USDT") : null
          ]),
          e("strong", { key: "v", className: cls }, value)
        ])))
      ]) : null
    ]);
  }

  function renderSubAccountCards(accounts = []) {
    if (!accounts.length) {
      return e("div", { className: "customer-empty-tab", key: "accounts" }, [
        e("strong", { key: "title" }, "暂无交易账户"),
        e("span", { key: "desc" }, "该客户当前没有可展示的交易账户信息")
      ]);
    }
    return e("div", { className: "customer-subaccount-list", key: "accounts" },
      accounts.map(account => e(SubAccountCard, { key: account.accountNo, account })));
  }

  /* ---------- 次要信息（默认折叠，展开后剩余字段按顺序平铺，备注单独一组） ---------- */

  function moreInfoRows(customer, extra) {
    const riskTags = Array.isArray(extra.riskTags) ? extra.riskTags : [];
    const walletValue = customer.walletAddress;
    return [
      ["邮箱", customer.email],
      ["钱包地址", isBlank(walletValue) ? "—" : e("span", { key: "wv", className: "customer-wallet-value" }, [
        e("span", {
          key: "t",
          className: "customer-wallet-text",
          title: walletValue
        }, walletValue.length > 18 ? `${walletValue.slice(0, 9)}…${walletValue.slice(-9)}` : walletValue),
        e(CopyButton, { key: "c", value: walletValue, title: "复制钱包地址" })
      ])],
      ["注册 IP", extra.registerIp],
      ["登录 IP", extra.lastLoginIp],
      ["登录设备", extra.loginDevice],
      ["设备指纹", extra.deviceFingerprint],
      ["赠金状态", extra.bonusStatus],
      ["特殊客户", extra.specialCustomer],
      ["风险标签", riskTags.length
        ? e("span", { key: "tags", className: "customer-risk-tags" },
          riskTags.map(tag => e(Tag, { key: tag, color: "red" }, tag)))
        : "无风险标签"],
      ["上级代理ID", customer.parentAgentId]
    ];
  }

  function MoreInfoSection({ customer, extra, note, noteMeta, onSaveNote }) {
    const [expanded, setExpanded] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState("");

    function startEdit() {
      setDraft(note || "");
      setEditing(true);
    }

    function cancelEdit() {
      setEditing(false);
    }

    function saveEdit() {
      onSaveNote(draft);
      setEditing(false);
    }

    return e("div", { className: "customer-more-info", key: "more-info" }, [
      e("button", {
        className: `customer-more-toggle${expanded ? " open" : ""}`,
        type: "button",
        "aria-expanded": expanded,
        onClick: () => setExpanded(prev => !prev),
        key: "toggle"
      }, [
        e("span", { className: "customer-more-chevron", key: "c" }, "▸"),
        e("span", { key: "t" }, expanded ? "收起信息" : "更多信息")
      ]),
      expanded ? e("div", { className: "customer-more-grid", key: "grid" }, [
        renderDetailRows(moreInfoRows(customer, extra), "more-list"),
        e("div", { className: "customer-sidebar-section customer-more-note", key: "note" }, [
          e("h3", { key: "t" }, [
            e("span", { key: "label" }, "备注"),
            editing
              ? e("span", { key: "actions", className: "customer-note-actions" }, [
                e(Button, { key: "save", type: "link", size: "small", onClick: saveEdit }, "保存"),
                e(Button, { key: "cancel", type: "link", size: "small", onClick: cancelEdit }, "取消")
              ])
              : e(Button, { key: "edit", type: "link", size: "small", onClick: startEdit }, "编辑")
          ]),
          editing
            ? e(Input.TextArea, {
              key: "ta",
              value: draft,
              onChange: event => setDraft(event.target.value),
              rows: 3,
              maxLength: 200,
              showCount: true,
              autoFocus: true,
              placeholder: "记录跟进情况、风险提示等（仅内部可见）"
            })
            : e("p", { className: "customer-note-text", key: "text" }, isBlank(note) ? "暂无备注" : note),
          !editing && noteMeta ? e("div", { className: "customer-note-meta", key: "meta" },
            `操作人 ${noteMeta.editor} · ${noteMeta.at}`) : null
        ])
      ]) : null
    ]);
  }

  /* Partner Program 卡片：复用交易账号卡片的折叠交互与样式 */
  function PartnerCard({ title, summary, children }) {
    const [expanded, setExpanded] = React.useState(true);

    function toggle() {
      setExpanded(prev => !prev);
    }

    function handleKeyDown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    }

    return e("section", { className: "customer-subaccount-card customer-partner-card" }, [
      e("div", {
        className: "customer-subaccount-head",
        role: "button",
        tabIndex: 0,
        "aria-expanded": expanded,
        onClick: toggle,
        onKeyDown: handleKeyDown
      }, [
        e("span", { className: `customer-subaccount-chevron${expanded ? " open" : ""}` }, "▸"),
        e("div", { className: "customer-subaccount-title" }, [
          e("span", { className: "customer-subaccount-name" }, [
            e("strong", null, title)
          ]),
          !expanded && summary ? e("span", { className: "customer-subaccount-inline" }, summary) : null
        ])
      ]),
      expanded ? e("div", { className: "customer-subaccount-body" }, children) : null
    ]);
  }

  function renderPartnerInfo(extra) {
    const info = extra.partnerInfo || {};
    const levelChanges = Array.isArray(extra.levelChangeRecords) ? extra.levelChangeRecords : [];
    const commission = extra.commissionInfo || {};
    return e("div", { className: "customer-partner-stack", key: "partner" }, [
      e(PartnerCard, {
        key: "info",
        title: "代理商信息",
        summary: [
          e("span", { key: "t" }, `用户类型 ${isBlank(info.userType) ? "—" : info.userType}`),
          e("span", { key: "a" }, `是否代理商 ${isBlank(info.isAgent) ? "—" : info.isAgent}`)
        ]
      }, e("div", { className: "customer-subaccount-grid", key: "rows" }, [
        ["是否代理商", info.isAgent],
        ["用户类型", info.userType],
        ["用户层级", info.userLevel],
        ["上级代理ID", info.parentAgentId],
        ["代理等级", info.agentLevel],
        ["成为代理时间", info.agentSince]
      ].map(([label, value]) => e("div", { className: "customer-subaccount-field", key: label }, [
        e("span", { key: "l" }, label),
        e("strong", { key: "v" }, isBlank(value) ? "—" : value)
      ])))),
      e(PartnerCard, {
        key: "commission",
        title: "佣金记录",
        summary: [
          e("span", { key: "s" }, [
            "累计已结算",
            e("i", { key: "u", className: "metric-unit" }, "USDT"),
            ` ${fmtAmount(commission.settled, null)}`
          ]),
          e("span", { key: "p" }, [
            "待结算",
            e("i", { key: "u2", className: "metric-unit" }, "USDT"),
            ` ${fmtAmount(commission.pending, null)}`
          ])
        ]
      }, e("div", { className: "customer-subaccount-grid", key: "rows" }, [
        ["累计已结算佣金", fmtAmount(commission.settled, null), true],
        ["待结算佣金", fmtAmount(commission.pending, null), true]
      ].map(([label, value, money]) => e("div", { className: "customer-subaccount-field", key: label }, [
        e("span", { key: "l" }, [
          label,
          money ? e("i", { key: "u", className: "metric-unit" }, "USDT") : null
        ]),
        e("strong", { key: "v" }, value)
      ])))),
      e(PartnerCard, {
        key: "levels",
        title: "等级变更记录",
        summary: [e("span", { key: "c" }, `共 ${levelChanges.length} 条变更记录`)]
      }, e(Table, {
        key: "level-table",
        rowKey: "id",
        size: "middle",
        columns: [
          { title: "变更前等级", dataIndex: "beforeLevel" },
          { title: "变更后等级", dataIndex: "afterLevel" },
          { title: "变更前佣金规则名称", dataIndex: "beforeRule" },
          { title: "变更后佣金规则名称", dataIndex: "afterRule" },
          { title: "变更时间", dataIndex: "changedAt" },
          { title: "操作人", dataIndex: "operator" }
        ],
        dataSource: levelChanges,
        pagination: false
      }))
    ]);
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

  function renderDetailFilterBar(fields) {
    return e("div", { className: "customer-detail-filter" }, fields.map(field => (
      e("label", { className: "customer-detail-filter-item", key: field.label }, [
        e("span", { key: "label" }, field.label),
        field.type === "select"
          ? e(Select, {
            key: "control",
            placeholder: field.placeholder || "全部",
            allowClear: true,
            showSearch: Boolean(field.searchable),
            optionFilterProp: field.searchable ? "value" : undefined,
            className: field.wide ? "customer-detail-control wide" : "customer-detail-control",
            options: (field.options || []).map(value => ({ value, label: value }))
          })
          : field.type === "rangePicker"
            ? e(RangePicker, {
              key: "control",
              format: "YYYY-MM-DD",
              className: "customer-detail-range"
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
      summary && e("div", { className: "customer-record-summary", key: "summary" }, summary.map(([label, value], index) => (
        e("div", { className: "customer-record-summary-item", key: index }, [
          e("span", { key: "label" }, label),
          e("strong", { key: "value" }, isBlank(value) ? "—" : value)
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
        { title: "开仓时间(GMT+0)", dataIndex: "openedAt", width: 150 },
        { title: "平仓时间(GMT+0)", dataIndex: "closedAt", width: 150 },
        { title: "是否平仓", dataIndex: "closed", width: 90, render: value => e(Tag, { color: value === "是" ? "green" : "default" }, value) },
        { title: "平仓类型", dataIndex: "closeType", width: 110, render: value => e(Tag, null, value) }
      ],
      data: extra.tradeRecords,
      total: extra.tradeRecords?.length
    });
  }

  /* 资金记录三合一：主账户流水 + 子账号流水 + 赠金，按时间倒序合并 */
  function mergedFundRows(extra) {
    const main = (extra.fundRecords || []).map(r => ({ ...r, accountType: "主账户", accountId: r.userId }));
    const sub = (extra.subAccountFundRecords || []).map(r => ({ ...r, accountType: "子账号", accountId: r.subAccountId }));
    const bonus = (extra.bonusRecords || []).map(r => ({
      id: `bonus-${r.id}`,
      userId: r.userId,
      accountType: "主账户",
      accountId: r.userId,
      fundType: "赠金",
      createdAt: r.createdAt,
      source: `系统（${r.bonusType}）`,
      target: "—",
      amount: r.amount,
      balanceAfter: "—",
      orderNo: "—"
    }));
    return [...main, ...sub, ...bonus]
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  function renderFundRecords(extra) {
    const rows = mergedFundRows(extra);
    return renderRecordTable({
      filters: [
        { label: "账户ID", placeholder: "请输入账户ID" },
        { label: "单号", placeholder: "交易单号/订单号" },
        { label: "账号类型", type: "select", placeholder: "请选择账号类型", searchable: true, options: ["主账户", "子账号"] },
        { label: "资金类型", type: "select", placeholder: "请选择资金类型", searchable: true, options: ["入金", "资金划转", "红包", "赠金", "提现"] },
        { label: "生成时间(GMT+0)", type: "range", wide: true }
      ],
      columns: [
        { title: "账号类型", dataIndex: "accountType", width: 100 },
        { title: "账号ID", dataIndex: "accountId", width: 140 },
        { title: "资金类型", dataIndex: "fundType", width: 110 },
        { title: "单号", dataIndex: "orderNo", width: 190 },
        { title: "来源", dataIndex: "source", width: 190 },
        { title: "去向", dataIndex: "target", width: 120 },
        { title: "金额", dataIndex: "amount", width: 100 },
        { title: "变动后余额", dataIndex: "balanceAfter", width: 120 },
        { title: "生成时间(GMT+0)", dataIndex: "createdAt", width: 170 }
      ],
      data: rows,
      total: rows.length
    });
  }

  function renderActivityRecords(extra) {
    return renderRecordTable({
      filters: [
        { label: "奖励来源", type: "select", placeholder: "请选择奖励来源", searchable: true, options: ["大转盘活动", "邀请好友"] },
        { label: "获取时间(GMT+0)", type: "rangePicker" }
      ],
      columns: [
        { title: "奖励来源", dataIndex: "source" },
        { title: "获取时间(GMT+0)", dataIndex: "obtainedAt" },
        { title: "奖励明细", dataIndex: "rewardDetail" }
      ],
      data: extra.activityRecords,
      total: extra.activityRecords?.length
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
    const [noteByCustomer, setNoteByCustomer] = React.useState({});
    const [noteMetaByCustomer, setNoteMetaByCustomer] = React.useState({});

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

    function confirmAction(options) {
      const ref = Modal.confirm({
        okText: "确认",
        cancelText: "取消",
        ...options,
        onOk: () => {
          options.onOk();
          ref.destroy();
        },
        onCancel: () => ref.destroy()
      });
      return ref;
    }

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
        confirmAction({
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

    function saveNoteValue(value) {
      if (!detail) return;
      setNoteByCustomer(prev => ({ ...prev, [detail.id]: value.trim() }));
      setNoteMetaByCustomer(prev => ({ ...prev, [detail.id]: { editor: "admin", at: "刚刚" } }));
      message.success("备注已保存（原型演示，仅本地生效）");
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
        const noteValue = detail.id in noteByCustomer
          ? noteByCustomer[detail.id]
          : (extra.note || "");
        const noteMeta = noteMetaByCustomer[detail.id] || null;
        const headerActions = [
          e(Button, {
            key: "bonus",
            type: "primary",
            onClick: () => confirmAction({
              title: "开通赠金账号",
              content: `确认为客户 ${detail.userId}（${detail.name}）开通赠金账号吗？`,
              onOk: () => message.success("已提交赠金账号开通申请（原型演示）")
            })
          }, "开通赠金账号"),
          e(Button, {
            key: "offline",
            danger: true,
            onClick: () => confirmAction({
              title: "客户下线",
              content: `确定让客户 ${detail.userId}（${detail.name}）下线吗？下线后客户将立即退出登录且无法再登录。`,
              okText: "确认下线",
              okButtonProps: { danger: true },
              onOk: () => message.success("客户已下线（原型演示）")
            })
          }, "客户下线")
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
        const partnerCount = extra.partnerInfo?.isAgent === "是" ? 1 : 0;
        return e("div", { className: "customer-detail", key: detail.id }, [
          renderDetailHeader(detail, extra, headerActions),
          renderAssetStrip(extra),
          e(MoreInfoSection, {
            key: "more",
            customer: detail,
            extra,
            note: noteValue,
            noteMeta,
            onSaveNote: saveNoteValue
          }),
          e(Tabs, {
            key: "tabs",
            className: "customer-tabs",
            items: [
              {
                key: "subAccounts",
                label: tabLabel("子账号信息", recordCount(extra.accounts)),
                children: renderSubAccountCards(extra.accounts)
              },
              {
                key: "trades",
                label: tabLabel("交易记录", recordCount(extra.tradeRecords)),
                children: renderTradeRecords(extra)
              },
              {
                key: "funds",
                label: tabLabel("资金记录", recordCount(extra.fundRecords) + recordCount(extra.subAccountFundRecords) + recordCount(extra.bonusRecords)),
                children: renderFundRecords(extra)
              },
              {
                key: "partner",
                label: tabLabel("Partner Program", partnerCount),
                children: renderPartnerInfo(extra)
              },
              {
                key: "following",
                label: tabLabel("跟随的高手", recordCount(extra.followingRecords)),
                children: renderSimpleRecords(extra.followingRecords, followColumns)
              },
              {
                key: "followers",
                label: tabLabel("跟单者", recordCount(extra.followerRecords)),
                children: renderSimpleRecords(extra.followerRecords, followerColumns)
              },
                  {
                    key: "activities",
                    label: tabLabel("活动记录", recordCount(extra.activityRecords)),
                    children: renderActivityRecords(extra)
                  }
            ]
          })
        ]);
      })())
    ]);
  }

  app.CustomerPage = CustomerPage;
})(window.AdminApp);

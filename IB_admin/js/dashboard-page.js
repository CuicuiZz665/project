(function registerDashboardPage(app) {
  const {
    Card,
    Col,
    DatePicker,
    Row,
    Segmented,
    Table,
    Tooltip,
    Typography
  } = antd;
  const { RangePicker } = DatePicker;
  const { Text, Title } = Typography;
  const e = React.createElement;

  const metricIconPaths = {
    user: [
      ["path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: 12, cy: 7, r: 4 }]
    ],
    users: [
      ["path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: 9, cy: 7, r: 4 }],
      ["path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }],
      ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]
    ],
    userPlus: [
      ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: 8.5, cy: 7, r: 4 }],
      ["line", { x1: 20, y1: 8, x2: 20, y2: 14 }],
      ["line", { x1: 23, y1: 11, x2: 17, y2: 11 }]
    ],
    userCheck: [
      ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: 8.5, cy: 7, r: 4 }],
      ["polyline", { points: "17 11 19 13 23 9" }]
    ],
    barChart: [
      ["line", { x1: 6, y1: 20, x2: 6, y2: 16 }],
      ["line", { x1: 12, y1: 20, x2: 12, y2: 10 }],
      ["line", { x1: 18, y1: 20, x2: 18, y2: 4 }]
    ],
    trendingUp: [
      ["polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }],
      ["polyline", { points: "17 6 23 6 23 12" }]
    ],
    dollar: [
      ["line", { x1: 12, y1: 1, x2: 12, y2: 23 }],
      ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }]
    ],
    activity: [
      ["polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }]
    ]
  };

  function renderMetricIcon(name) {
    return e("svg", {
      viewBox: "0 0 24 24",
      width: 18,
      height: 18,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true
    }, (metricIconPaths[name] || []).map(([tag, attrs], index) => e(tag, Object.assign({ key: index }, attrs))));
  }

  // 解析「1,234」「128.0万」这类展示值；自定义区间按周期系数折算后还原展示格式
  function parseStatNumber(text) {
    const match = String(text).match(/^(-?[\d,]+(?:\.\d+)?)\s*(万)?$/);
    if (!match) return null;
    const base = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(base)) return null;
    return { value: match[2] ? base * 10000 : base, useWan: Boolean(match[2]), decimals: (match[1].split(".")[1] || "").length };
  }

  function scaleStatText(text, factor) {
    const parsed = parseStatNumber(text);
    if (!parsed) return text;
    const scaled = parsed.value * factor;
    if (parsed.useWan || scaled >= 100000) {
      const wan = scaled / 10000;
      return `${wan.toFixed(wan >= 100 ? 0 : 1)}万`;
    }
    if (parsed.decimals > 0 && scaled < 1000) return scaled.toFixed(2);
    return Math.round(scaled).toLocaleString("en-US");
  }

  function statValue(text) {
    const parsed = parseStatNumber(text);
    if (parsed) return parsed.value;
    const num = Number(String(text).replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : 0;
  }

  function changePct(text) {
    const match = String(text || "").match(/^([+-]?\d+(?:\.\d+)?)%/);
    return match ? Number(match[1]) / 100 : 0;
  }

  function formatAxisValue(value) {
    if (value >= 10000) {
      const wan = value / 10000;
      return `${wan >= 100 ? Math.round(wan) : +wan.toFixed(1)}万`;
    }
    return Math.round(value).toLocaleString("zh-CN");
  }

  // 主趋势指标（单选切换）；净充值由 deposits - withdrawals 派生
  const mainTrendMetrics = [
    { id: "net", name: "净充值", unit: "元", pick: point => point.deposits - point.withdrawals },
    { id: "customers", name: "交易客户", unit: "人", pick: point => point.customers },
    { id: "registered", name: "新增注册", unit: "人", pick: point => point.registered },
    { id: "firstDepositCustomers", name: "新增首充", unit: "人", pick: point => point.firstDepositCustomers },
    { id: "lots", name: "订单数", unit: "笔", pick: point => point.lots },
    { id: "amount", name: "交易金额", unit: "元", pick: point => point.amount },
    { id: "deposits", name: "充值金额", unit: "元", pick: point => point.deposits },
    { id: "withdrawals", name: "提现金额", unit: "元", pick: point => point.withdrawals }
  ];

  // 迷你走势取值（首充转化率按日派生）
  function sparkValue(key, point) {
    if (key === "net") return point.deposits - point.withdrawals;
    if (key === "firstDepositRate") {
      return point.registered ? (point.firstDepositCustomers / point.registered) * 100 : 0;
    }
    return point[key];
  }

  function renderSparkline(values) {
    const nums = values.map(Number).filter(num => Number.isFinite(num));
    if (nums.length < 2) return null;
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    const span = max - min || 1;
    const height = 26;
    const step = 100 / (nums.length - 1);
    const points = nums.map((num, index) => {
      const x = (index * step).toFixed(2);
      const y = (height - 3 - ((num - min) / span) * (height - 6)).toFixed(2);
      return `${x},${y}`;
    });
    return e("svg", {
      className: "dashboard-metric-spark",
      viewBox: `0 0 100 ${height}`,
      preserveAspectRatio: "none",
      "aria-hidden": true
    }, [
      e("polyline", { points: `${points[0]},${height} ${points.join(" ")} ${points[points.length - 1]},${height}`, className: "dashboard-spark-area", key: "area" }),
      e("polyline", { points: points.join(" "), className: "dashboard-spark-line", key: "line" })
    ]);
  }

  function DashboardPage({ data, todos, onNavigate }) {
    const [dateMode, setDateMode] = React.useState("week");
    const [customRange, setCustomRange] = React.useState(() => [dayjs("2026-08-12"), dayjs("2026-09-11")]);
    const [mainMetric, setMainMetric] = React.useState("net");
    const [rankMetric, setRankMetric] = React.useState("orders");
    // 今日为实时数据，进入页面时记录「截至」时刻
    const [liveAt] = React.useState(() => dayjs());

    const customDays = customRange && customRange[0] && customRange[1]
      ? customRange[1].diff(customRange[0], "day") + 1
      : 7;
    const customFactor = Math.min(8, Math.max(0.15, customDays / 7));

    // 指标卡 2 组 × 4 张：page 为整卡点击跳转的页面 key；spark 为迷你走势取值键（近七日日序列）
    const metricGroups = [
      {
        label: "客户增长",
        metrics: [
          { key: "registered", label: "新增注册客户", unit: "人", icon: "user", tone: "blue", page: "customer", spark: "registered" },
          { key: "firstDepositCustomers", label: "新增首充客户", unit: "人", icon: "userPlus", tone: "cyan", page: "depositManage", spark: "firstDepositCustomers" },
          { key: "firstDepositRate", label: "首充转化率", icon: "userCheck", tone: "violet", spark: "firstDepositRate" },
          { key: "tradingCustomers", label: "交易客户数", unit: "人", icon: "users", tone: "green", page: "customer", spark: "customers" }
        ]
      },
      {
        label: "交易与资金",
        metrics: [
          { key: "tradingLots", label: "订单数", unit: "笔", icon: "barChart", tone: "orange", page: "orderList", spark: "lots" },
          { key: "tradingAmount", label: "交易金额", unit: "元", icon: "activity", tone: "teal", page: "orderList", spark: "amount" },
          {
            key: "netDeposits", label: "净充值", unit: "元", icon: "trendingUp", tone: "indigo", page: "fundFlow", spark: "net",
            subtitle: m => `充值 ${m.deposits.value} · 提现 ${m.withdrawals.value}`
          },
          {
            key: "ibRebateAmount", label: "代理返佣", unit: "元", icon: "dollar", tone: "rose", page: "commission",
            subtitle: m => `返佣客户 ${m.ibRebateCustomers.value} 人`
          }
        ]
      }
    ];

    // 周期指标集：今日/近七天/近三十天各有独立数据，自定义按天数系数折算（原型 mock）
    const metricSource = dateMode === "today" ? data.metricsToday : dateMode === "month" ? data.metricsMonth : data.metrics;
    const periodMetrics = dateMode === "custom"
      ? Object.keys(data.metrics).reduce((result, key) => {
        result[key] = Object.assign({}, data.metrics[key], { value: scaleStatText(data.metrics[key].value, customFactor) });
        return result;
      }, {})
      : metricSource;

    // 首充转化率派生：当前值 = 首充/注册；环比按两项各自 change 反推上期后作差（pt）
    const registeredNum = statValue(periodMetrics.registered.value);
    const firstDepositNum = statValue(periodMetrics.firstDepositCustomers.value);
    const rateNow = registeredNum ? firstDepositNum / registeredNum : 0;
    const prevRegistered = registeredNum / (1 + changePct(periodMetrics.registered.change));
    const prevFirstDeposit = firstDepositNum / (1 + changePct(periodMetrics.firstDepositCustomers.change));
    const ratePrev = prevRegistered ? prevFirstDeposit / prevRegistered : 0;
    const rateDelta = (rateNow - ratePrev) * 100;
    const derivedMetrics = Object.assign({}, periodMetrics, {
      firstDepositRate: {
        value: registeredNum ? `${Math.round(rateNow * 100)}%` : "-",
        change: `${rateDelta >= 0 ? "+" : ""}${rateDelta.toFixed(1)}pt`,
        note: periodMetrics.registered.note
      }
    });

    // 品种排行的周期折算
    const symbolFactor = dateMode === "today" ? 0.17 : dateMode === "week" ? 1 : dateMode === "month" ? 4.3 : customFactor;
    const periodSymbols = symbolFactor === 1 ? data.symbols : data.symbols.map(item => Object.assign({}, item, {
      lots: scaleStatText(item.lots, symbolFactor),
      amount: scaleStatText(item.amount, symbolFactor),
      orders: scaleStatText(item.orders, symbolFactor)
    }));

    // 主趋势序列粒度自动跟随统计时间：今日按小时，七天/三十天/短自定义按日，长自定义按月
    function resolveTrendBundle() {
      if (dateMode === "today") return { current: data.trendToday, prev: data.trendTodayPrev, granularity: "按小时" };
      if (dateMode === "week") return { current: data.trendWeek, prev: data.trendWeekPrev, granularity: "按日" };
      if (dateMode === "month" || customDays <= 31) return { current: data.trendDay, prev: data.trendDayPrev, granularity: "按日" };
      return { current: data.trendMonth, prev: data.trendMonthPrev, granularity: "按月" };
    }

    function renderMetricCard(metric) {
      const item = derivedMetrics[metric.key];
      if (!item) return null;
      const changeText = String(item.change || "");
      const changeDir = changeText.startsWith("+") ? "up" : changeText.startsWith("-") ? "down" : "flat";
      const changeArrow = changeDir === "up" ? "↑" : changeDir === "down" ? "↓" : "";
      const cardProps = {
        className: `dashboard-metric-card${metric.page ? " is-clickable" : ""}`,
        key: metric.key
      };
      if (metric.page && onNavigate) cardProps.onClick = () => onNavigate(metric.page);
      return e(Card, cardProps, [
        e("div", { className: "dashboard-metric-label", key: "label" }, [
          e(Text, { type: "secondary", key: "text" }, metric.label),
          item.change ? e("span", {
            className: `dashboard-metric-change is-${changeDir}`,
            title: item.note || "",
            key: "change"
          }, `${changeArrow} ${changeText}`) : null
        ]),
        e("strong", { key: "value" }, [
          item.value,
          metric.unit ? e("span", { className: "dashboard-metric-unit", key: "unit" }, metric.unit) : null
        ]),
        metric.subtitle ? e("div", { className: "dashboard-metric-sub", key: "sub" }, metric.subtitle(derivedMetrics)) : null,
        metric.spark ? renderSparkline((data.trendWeek || []).map(point => sparkValue(metric.spark, point))) : null,
        metric.icon ? e("span", { className: `dashboard-metric-icon tone-${metric.tone}`, key: "icon" }, renderMetricIcon(metric.icon)) : null
      ]);
    }

    function renderMainTrendCard() {
      const { current, prev, granularity } = resolveTrendBundle();
      const metricDef = mainTrendMetrics.find(item => item.id === mainMetric) || mainTrendMetrics[0];
      const currentValues = current.map(metricDef.pick);
      const prevValues = prev.map(metricDef.pick);
      const maxValue = Math.max(...currentValues, ...prevValues, 0);

      const chips = e("div", { className: "dashboard-main-chips", key: "chips" },
        mainTrendMetrics.map(item => e("button", {
          type: "button",
          key: item.id,
          className: `dashboard-chip${item.id === mainMetric ? " is-active" : ""}`,
          onClick: () => setMainMetric(item.id)
        }, item.name)));

      const legend = e("div", { className: "dashboard-chart-legend", key: "legend" }, [
        e("span", { className: "dashboard-legend-item", key: "cur" }, [
          e("span", { className: "dashboard-legend-dot", key: "dot" }),
          "当前周期"
        ]),
        e("span", { className: "dashboard-legend-item", key: "prev" }, [
          e("span", { className: "dashboard-legend-dot is-prev", key: "dot" }),
          "上期对比"
        ]),
        e("span", { className: "dashboard-legend-note", key: "note" }, `粒度 ${granularity}`)
      ]);

      if (!currentValues.length || !(maxValue > 0)) {
        return e(Card, { title: "趋势分析", className: "dashboard-analysis-card dashboard-main-card", key: "main" }, [
          chips,
          legend,
          e("div", { className: "dashboard-trend-empty", key: "empty" }, "暂无数据")
        ]);
      }

      const axisTicks = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0]
        .map(value => Math.round(value));
      const padX = 2;
      const xFor = index => padX + (100 - padX * 2) * index / (current.length - 1);
      const yFor = value => (maxValue ? 100 - (value / maxValue) * 96 : 100);
      const points = current.map((item, index) => ({
        x: xFor(index),
        y: yFor(currentValues[index]),
        label: item.label,
        value: currentValues[index]
      }));
      const prevPoints = prev.map((item, index) => ({ x: xFor(index), y: yFor(prevValues[index]) }));
      const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
      const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} 100 L ${points[0].x.toFixed(2)} 100 Z`;
      const prevPath = prevPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
      const labelStep = Math.max(1, Math.ceil(current.length / 7));
      const unitSuffix = metricDef.unit ? metricDef.unit : "";

      return e(Card, {
        title: "趋势分析",
        className: "dashboard-analysis-card dashboard-main-card",
        key: "main",
        extra: e(Text, { type: "secondary" }, "切换指标查看不同口径")
      }, [
        chips,
        legend,
        e("div", { className: "dashboard-trend-chart is-main", key: "chart" }, [
          e("div", { className: "dashboard-y-axis", key: "axis" }, axisTicks.map((value, index) =>
            e("span", { key: index }, formatAxisValue(value))
          )),
          e("div", { className: "dashboard-chart-plot", key: "plot" }, [
            e("div", { className: "dashboard-chart-grid", key: "grid" }, axisTicks.map((_, index) => e("span", { key: index }))),
            e("div", { className: "dashboard-line-chart", key: "line" }, [
              e("div", { className: "dashboard-line-canvas", key: "canvas" }, [
                e("svg", { className: "dashboard-line-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none", key: "svg" }, [
                  e("path", { d: areaPath, className: "dashboard-line-area", key: "area" }),
                  e("path", { d: prevPath, className: "dashboard-line-path-prev", key: "prev" }),
                  e("path", { d: linePath, className: "dashboard-line-path", key: "path" })
                ]),
                points.map(point => e(Tooltip, { title: `${point.label} · ${metricDef.name}：${formatAxisValue(point.value)}${unitSuffix}`, key: point.label },
                  e("span", { className: "dashboard-line-dot", style: { left: `${point.x}%`, top: `${point.y}%` } })
                ))
              ]),
              e("div", { className: "dashboard-line-labels", key: "labels" },
                current.map((item, index) => e("span", {
                  key: item.label,
                  className: index % labelStep === 0 || index === current.length - 1 ? "is-visible" : ""
                }, item.label)))
            ])
          ])
        ])
      ]);
    }

    function parseRankValue(text) {
      return Number(String(text).replace(/[^\d.-]/g, "")) || 0;
    }

    function formatRankTotal(value) {
      return Math.round(value).toLocaleString("en-US");
    }

    function renderRankingCard() {
      const totalLabels = { orders: "总订单数", amount: "总金额" };
      const totalUnits = { amount: "元" };
      const ranked = periodSymbols
        .map(item => ({ item, value: parseRankValue(item[rankMetric]) }))
        .sort((a, b) => b.value - a.value);
      const maxValue = ranked.length ? ranked[0].value : 0;
      const totalValue = ranked.reduce((sum, entry) => sum + entry.value, 0);
      const totalUnit = totalUnits[rankMetric] ? ` ${totalUnits[rankMetric]}` : "";
      return e(Card, {
        title: e("span", { key: "title" }, [
          "品种排行",
          e("span", { className: "dashboard-ranking-total", key: "total" },
            ` ${totalLabels[rankMetric]} ${formatRankTotal(totalValue)}${totalUnit}`)
        ]),
        className: "dashboard-analysis-card dashboard-ranking-card",
        key: "ranking",
        extra: e(Segmented, {
          size: "small",
          value: rankMetric,
          onChange: setRankMetric,
          options: [{ value: "orders", label: "订单数" }, { value: "amount", label: "金额" }]
        })
      }, [
        e("div", { className: "dashboard-ranking-list", key: "list" },
          ranked.map(({ item, value }, index) => e("div", { className: "dashboard-ranking-row", key: item.name }, [
            e("span", { className: "dashboard-rank-number", key: "index" }, String(index + 1).padStart(2, "0")),
            e("div", { className: "dashboard-rank-main", key: "main" }, [
              e("strong", { key: "name" }, item.name),
              e("div", { className: "dashboard-rank-progress", key: "progress" }, e("span", { style: { width: `${maxValue ? value / maxValue * 100 : 0}%` } }))
            ]),
            e("strong", { className: "dashboard-rank-value", key: "value" }, item[rankMetric])
          ])))
      ]);
    }

    // 转化漏斗：注册 → 首充 → 交易（口径：首充/交易不超过上一阶段，mock 已保证单调）
    function renderFunnelCard() {
      const stages = [
        { key: "registered", label: "注册客户" },
        { key: "firstDepositCustomers", label: "首次充值" },
        { key: "tradingCustomers", label: "交易客户" }
      ].map(stage => Object.assign({}, stage, {
        value: Math.round(statValue(periodMetrics[stage.key].value))
      }));
      const maxValue = Math.max(stages[0].value, 1);
      const rows = [];
      stages.forEach((stage, index) => {
        rows.push(e("div", { className: "dashboard-funnel-stage", key: stage.key }, [
          e("div", { className: "dashboard-funnel-meta", key: "meta" }, [
            e("span", { key: "label" }, stage.label),
            e("strong", { key: "value" }, `${stage.value.toLocaleString("zh-CN")} 人`)
          ]),
          e("div", { className: "dashboard-funnel-track", key: "track" },
            e("span", {
              className: `dashboard-funnel-fill tone-${index}`,
              style: { width: `${Math.min(100, stage.value / maxValue * 100)}%` }
            }))
        ]));
        const prevStage = stages[index - 1];
        if (prevStage && prevStage.value > 0) {
          const rate = Math.round(stage.value / prevStage.value * 100);
          rows.push(e("div", { className: "dashboard-funnel-rate", key: `${stage.key}-rate` }, [
            e("span", { className: "dashboard-funnel-arrow", key: "arrow" }, "↓"),
            `${index === 1 ? "首充率" : "交易率"} ${rate}%`
          ]));
        }
      });
      return e(Card, {
        title: "客户转化漏斗",
        extra: e(Text, { type: "secondary" }, "注册 → 首充 → 交易"),
        className: "dashboard-analysis-card dashboard-funnel-card",
        key: "funnel"
      }, e("div", { className: "dashboard-funnel" }, rows));
    }

    function renderTop5Card() {
      const rows = data.customersSummary || [];
      const pnlClass = text => (String(text).trim().startsWith("+") ? "is-profit" : "is-loss");
      const columns = [
        {
          title: "客户", key: "name",
          render: (_, row) => e("div", { className: "dashboard-customer-cell" }, [
            e("strong", { key: "name" }, row.name),
            e("span", { key: "account" }, row.account)
          ])
        },
        { title: "所属代理", dataIndex: "agent", key: "agent" },
        { title: "订单数", dataIndex: "lots", key: "lots" },
        { title: "净充值", dataIndex: "deposit", key: "deposit" },
        {
          title: "盈亏", dataIndex: "pnl", key: "pnl",
          render: text => e("span", { className: `dashboard-pnl ${pnlClass(text)}` }, text)
        },
        { title: "最近交易", dataIndex: "lastTrade", key: "lastTrade" }
      ];
      return e(Card, {
        title: "客户概览 Top 5",
        extra: e(Text, { type: "secondary" }, "按订单数 · 近七天"),
        className: "dashboard-analysis-card dashboard-summary-card dashboard-top-card",
        key: "top5"
      }, e(Table, {
        columns,
        dataSource: rows,
        rowKey: "id",
        size: "small",
        pagination: false,
        onRow: () => ({ onClick: () => onNavigate && onNavigate("customer") })
      }));
    }

    // 待办中心：审核/打款/报名等流程性待处理事项，点击直达处理页面（todos 由外层按角色权限过滤后传入）
    function renderTodoStrip() {
      if (!todos || !todos.length) return null;
      return e("section", { className: "dashboard-todo", key: "todos" }, [
        e("div", { className: "dashboard-todo-head", key: "head" }, [
          e("span", { className: "dashboard-todo-title", key: "title" }, "待办中心"),
          e(Text, { type: "secondary", key: "hint" }, "点击待办直达处理页面")
        ]),
        e("div", { className: "dashboard-todo-grid", key: "grid" },
          todos.map(item => e("div", {
            className: `dashboard-todo-item tone-${item.tone}${item.count ? "" : " is-empty"}`,
            key: item.key,
            role: "button",
            tabIndex: 0,
            onClick: () => onNavigate && onNavigate(item.page)
          }, [
            e("div", { className: "dashboard-todo-count", key: "count" }, [
              e("strong", { key: "num" }, String(item.count)),
              e("span", { key: "unit" }, item.unit)
            ]),
            e("div", { className: "dashboard-todo-meta", key: "meta" }, [
              e("span", { className: "dashboard-todo-label", key: "label" }, item.label),
              e("span", { className: "dashboard-todo-action", key: "action" }, item.count ? "去处理 →" : "暂无待办")
            ])
          ])))
      ]);
    }

    return e("div", { className: "dashboard-page" }, [
      e("div", { className: "dashboard-heading", key: "heading" }, [
        e("div", { className: "dashboard-heading-title", key: "title" }, [
          e(Title, { level: 3, key: "h" }, "数据概览"),
          dateMode === "today" ? e("span", { className: "dashboard-live-badge", key: "live" }, `实时 · 截至 ${liveAt.format("HH:mm")}`) : null
        ]),
        e("div", { className: "dashboard-time-filter", key: "time" }, [
          e("span", { className: "dashboard-time-filter-label", key: "label" }, "统计时间"),
          e(Segmented, {
            key: "mode",
            value: dateMode,
            onChange: setDateMode,
            options: [
              { value: "today", label: "今日" },
              { value: "week", label: "近七天" },
              { value: "month", label: "近三十天" },
              { value: "custom", label: "自定义" }
            ]
          }),
          dateMode === "custom" ? e(RangePicker, { key: "range", value: customRange, onChange: setCustomRange, format: "YYYY-MM-DD", allowClear: false }) : null
        ])
      ]),
      renderTodoStrip(),
      e("div", { className: "dashboard-metric-rows", key: "metrics" }, metricGroups.map(row =>
        e("section", { className: "dashboard-metric-row", key: row.label }, [
          e("div", { className: "dashboard-metric-group", key: "label" }, row.label),
          e("div", { className: "dashboard-metric-grid", key: "grid" }, row.metrics.map(renderMetricCard))
        ])
      )),
      e(Row, { gutter: [12, 12], className: "dashboard-main-grid", key: "main" }, [
        e(Col, { xs: 24, xl: 16, key: "trend" }, renderMainTrendCard()),
        e(Col, { xs: 24, xl: 8, key: "ranking" }, renderRankingCard())
      ]),
      e(Row, { gutter: [12, 12], className: "dashboard-main-grid", key: "secondary" }, [
        e(Col, { xs: 24, lg: 12, xl: 8, key: "funnel" }, renderFunnelCard()),
        e(Col, { xs: 24, lg: 12, xl: 16, key: "top5" }, renderTop5Card())
      ])
    ]);
  }

  app.DashboardPage = DashboardPage;
})(window.AdminApp);

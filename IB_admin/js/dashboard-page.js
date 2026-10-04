(function registerDashboardPage(app) {
  const {
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Drawer,
    Row,
    Segmented,
    Tooltip,
    Typography,
    message
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
    barChart: [
      ["line", { x1: 6, y1: 20, x2: 6, y2: 16 }],
      ["line", { x1: 12, y1: 20, x2: 12, y2: 10 }],
      ["line", { x1: 18, y1: 20, x2: 18, y2: 4 }]
    ],
    download: [
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
      ["polyline", { points: "7 10 12 15 17 10" }],
      ["line", { x1: 12, y1: 3, x2: 12, y2: 15 }]
    ],
    upload: [
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
      ["polyline", { points: "17 8 12 3 7 8" }],
      ["line", { x1: 12, y1: 3, x2: 12, y2: 15 }]
    ],
    trendingUp: [
      ["polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }],
      ["polyline", { points: "17 6 23 6 23 12" }]
    ],
    userCheck: [
      ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: 8.5, cy: 7, r: 4 }],
      ["polyline", { points: "17 11 19 13 23 9" }]
    ],
    award: [
      ["circle", { cx: 12, cy: 8, r: 7 }],
      ["polyline", { points: "8.21 13.89 7 23 12 20 17 23 15.79 13.88" }]
    ],
    send: [
      ["line", { x1: 22, y1: 2, x2: 11, y2: 13 }],
      ["polygon", { points: "22 2 15 22 11 13 2 9 22 2" }]
    ],
    dollar: [
      ["line", { x1: 12, y1: 1, x2: 12, y2: 23 }],
      ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }]
    ],
    arrowDown: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["polyline", { points: "8 12 12 16 16 12" }],
      ["line", { x1: 12, y1: 8, x2: 12, y2: 16 }]
    ],
    arrowUp: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["polyline", { points: "16 12 12 8 8 12" }],
      ["line", { x1: 12, y1: 16, x2: 12, y2: 8 }]
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

  function DashboardPage({ data, customers = [] }) {
    const [accountMode, setAccountMode] = React.useState("real");
    const [dateMode, setDateMode] = React.useState("week");
    const [customRange, setCustomRange] = React.useState(() => [dayjs("2026-08-12"), dayjs("2026-09-11")]);
    const [chartCount, setChartCount] = React.useState(3);
    const [visibleTrendIds, setVisibleTrendIds] = React.useState(["tradingLots", "tradingAmount", "tradingCustomers"]);
    const [isChartConfigOpen, setChartConfigOpen] = React.useState(false);
    const [draggingTrendId, setDraggingTrendId] = React.useState(null);
    const [trendPeriods, setTrendPeriods] = React.useState({});
    const [rankMetric, setRankMetric] = React.useState("lots");

    // 顶部指标卡：2 行 × 4 卡分组展示。人数类指标并入对应金额卡的副标题；
    // 交易手数/交易金额独立成卡：净入金金额整卡移至「资金与分成」首位，交易金额补原出金金额卡位，
    // 交易手数补原净入金金额卡位，入金/出金金额不再单独成卡（数值保留在净入金金额卡副标题）
    const metricRows = [
      {
        label: "客户与结果",
        metrics: [
          { key: "registered", label: "注册客户数", unit: "人", icon: "user", tone: "blue" },
          { key: "tradingCustomers", label: "交易客户数", unit: "人", icon: "users", tone: "violet" },
          { key: "firstDepositCustomers", label: "首次入金客户数", unit: "人", icon: "userPlus", tone: "cyan" },
          { key: "tradingLots", label: "交易手数", unit: "手", icon: "barChart", tone: "green" }
        ]
      },
      {
        label: "资金与分成",
        metrics: [
          {
            key: "netDeposits", label: "净入金金额", unit: "USDT", icon: "trendingUp", tone: "teal",
            subtitle: m => `入金 ${m.deposits.value} · 出金 ${m.withdrawals.value}`
          },
          { key: "tradingAmount", label: "交易金额", unit: "USDT", icon: "activity", tone: "orange" },
          {
            key: "ibRebateAmount", label: "IB返佣金额", unit: "USDT", icon: "dollar", tone: "indigo",
            subtitle: m => `返佣客户 ${m.ibRebateCustomers.value} 人`
          },
          {
            key: "expertRebatePaid", label: "高手已返金额", unit: "USDT", icon: "send", tone: "amber",
            subtitle: m => `返佣高手 ${m.expertRebateCustomers.value} 人`
          }
        ]
      }
    ];
    // 趋势模块使用独立清单：顶部卡片改为客户/资金/返佣口径后，交易手数、交易金额等历史曲线仍保留在趋势图里
    const trendOptions = [
      { id: "tradingLots", name: "交易手数", metric: "lots" },
      { id: "tradingAmount", name: "交易金额", metric: "amount" },
      { id: "tradingCustomers", name: "交易客户数", metric: "customers" },
      { id: "registered", name: "注册客户数", metric: "registered" },
      { id: "firstDepositCustomers", name: "首次入金客户数", metric: "firstDepositCustomers" },
      { id: "deposits", name: "入金金额", metric: "deposits" },
      { id: "withdrawals", name: "出金金额", metric: "withdrawals" },
      { id: "pnl", name: "交易量", metric: "volume" }
    ].map(item => Object.assign({}, item, { title: `${item.name}趋势` }));
    const chartCountOptions = [3, 4, 5, 6, 7, 8].map(value => ({ label: `${value} 张`, value }));
    const visibleTrends = visibleTrendIds.slice(0, chartCount)
      .map(id => trendOptions.find(item => item.id === id))
      .filter(Boolean);

    function setTrendDisplayCount(value) {
      const nextCount = Number(value);
      setChartCount(nextCount);
      setVisibleTrendIds(current => {
        if (current.length >= nextCount) return current.slice(0, nextCount);
        const additions = trendOptions.map(item => item.id).filter(id => !current.includes(id));
        return current.concat(additions).slice(0, nextCount);
      });
    }

    function toggleTrendSelection(id, checked) {
      if (!checked && visibleTrendIds.length <= 3) {
        message.warning("趋势图至少保留 3 项");
        return;
      }
      const nextIds = checked ? visibleTrendIds.concat(id) : visibleTrendIds.filter(item => item !== id);
      setVisibleTrendIds(nextIds);
      setChartCount(nextIds.length);
    }

    function moveTrend(droppedId) {
      if (!draggingTrendId || draggingTrendId === droppedId) return;
      setVisibleTrendIds(current => {
        const next = current.filter(id => id !== draggingTrendId);
        next.splice(next.indexOf(droppedId), 0, draggingTrendId);
        return next;
      });
      setDraggingTrendId(null);
    }
    function runQuery() {
      const rangeLabel = { today: "今日", week: "近七天", custom: "自定义时间" }[dateMode] || "近七天";
      message.success(`已更新全部${accountMode === "real" ? "实盘" : "模拟盘"}数据（${rangeLabel}）`);
    }

    function resetFilters() {
      setDateMode("week");
      setCustomRange([dayjs("2026-08-12"), dayjs("2026-09-11")]);
      message.success("筛选已重置");
    }

    function setTrendPeriod(id, period) {
      setTrendPeriods(current => Object.assign({}, current, { [id]: period }));
    }

    function renderTrendCard(trendItem, formatter) {
      const { title, metric, id } = trendItem;
      const period = trendPeriods[id] || "week";
      const trendData = period === "month" ? data.trendMonth : (period === "day" ? data.trendDay : data.trend);
      const maxValue = Math.max(...trendData.map(item => item[metric]));
      const periodSwitch = e(Segmented, {
        size: "small",
        value: period,
        onChange: value => setTrendPeriod(id, value),
        options: [{ value: "day", label: "日" }, { value: "week", label: "周" }, { value: "month", label: "月" }]
      });
      if (!trendData.length || !(maxValue > 0)) {
        return e(Card, { title, className: "dashboard-analysis-card", key: metric, extra: periodSwitch }, [
          e("div", { className: "dashboard-trend-empty", key: "empty" }, [
            e("svg", {
              viewBox: "0 0 24 24", width: 28, height: 28, fill: "none", stroke: "currentColor",
              strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, key: "icon"
            }, [
              e("polyline", { points: "3 17 9 11 13 15 21 7", key: "line" }),
              e("polyline", { points: "15 7 21 7 21 13", key: "arrow" })
            ]),
            e("span", { key: "text" }, "暂无数据")
          ])
        ]);
      }
      const metricLabel = {
        registered: "注册客户数",
        customers: "交易客户数",
        firstDepositCustomers: "首次入金客户数",
        lots: "交易手数",
        amount: "交易金额（USDT）",
        deposits: "入金金额（USDT）",
        withdrawals: "出金金额（USDT）",
        volume: "交易量"
      }[metric];
      const axisTicks = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0]
        .map(value => Math.round(value));
      const padX = 2;
      const xFor = index => padX + (100 - padX * 2) * index / (trendData.length - 1);
      const yFor = value => (maxValue ? 100 - (value / maxValue) * 96 : 100);
      const points = trendData.map((item, index) => ({
        x: xFor(index),
        y: yFor(item[metric]),
        label: item.label,
        value: item[metric]
      }));
      const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
      const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} 100 L ${points[0].x.toFixed(2)} 100 Z`;
      const labelStep = period === "month" ? 2 : (period === "day" ? 5 : 3);
      return e(Card, {
        title,
        className: "dashboard-analysis-card",
        key: metric,
        extra: periodSwitch
      }, [
        e("div", { className: "dashboard-chart-legend", key: "legend" }, [
          e("span", { className: "dashboard-legend-dot" }),
          e(Text, { type: "secondary" }, "当前周期")
        ]),
        e("div", { className: "dashboard-trend-chart", key: "chart" }, [
          e("div", { className: "dashboard-y-axis", key: "axis" }, axisTicks.map((value, index) =>
            e("span", { key: index }, formatter(value))
          )),
          e("div", { className: "dashboard-chart-plot", key: "plot" }, [
            e("div", { className: "dashboard-chart-grid", key: "grid" }, axisTicks.map((_, index) => e("span", { key: index }))),
            e("div", { className: "dashboard-line-chart", key: "line" }, [
              e("div", { className: "dashboard-line-canvas", key: "canvas" }, [
                e("svg", { className: "dashboard-line-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none", key: "svg" }, [
                  e("path", { d: areaPath, className: "dashboard-line-area", key: "area" }),
                  e("path", { d: linePath, className: "dashboard-line-path", key: "path" })
                ]),
                points.map(point => e(Tooltip, { title: `${point.label} · ${metricLabel}：${formatter(point.value)}`, key: point.label },
                  e("span", { className: "dashboard-line-dot", style: { left: `${point.x}%`, top: `${point.y}%` } })
                ))
              ]),
              e("div", { className: "dashboard-line-labels", key: "labels" },
                trendData.map((item, index) => e("span", {
                  key: item.label,
                  className: index % labelStep === 0 || index === trendData.length - 1 ? "is-visible" : ""
                }, item.label))
              )
            ])
          ])
        ])
      ]);
    }

    function parseRankValue(text) {
      return Number(String(text).replace(/[^\d.-]/g, "")) || 0;
    }

    function formatRankTotal(valueKey, value) {
      if (valueKey === "lots") {
        return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return Math.round(value).toLocaleString("en-US");
    }

    function renderRankingCard() {
      const totalLabels = { lots: "总手数", amount: "总金额", orders: "总订单数" };
      const totalUnits = { lots: "Lot", amount: "USDT" };
      const ranked = data.symbols
        .map(item => ({ item, value: parseRankValue(item[rankMetric]) }))
        .sort((a, b) => b.value - a.value);
      const maxValue = ranked.length ? ranked[0].value : 0;
      const totalValue = ranked.reduce((sum, entry) => sum + entry.value, 0);
      const totalUnit = totalUnits[rankMetric] ? ` ${totalUnits[rankMetric]}` : "";
      return e(Card, {
        title: e("span", { key: "title" }, [
          "交易品种排行",
          e("span", { className: "dashboard-ranking-total", key: "total" },
            ` ${totalLabels[rankMetric]} ${formatRankTotal(rankMetric, totalValue)}${totalUnit}`)
        ]),
        className: "dashboard-analysis-card dashboard-ranking-card",
        key: "ranking",
        extra: e(Segmented, {
          size: "small",
          value: rankMetric,
          onChange: setRankMetric,
          options: [{ value: "lots", label: "手数" }, { value: "amount", label: "交易金额" }, { value: "orders", label: "订单数" }]
        })
      }, [
        e("div", { className: "dashboard-ranking-list", key: "list" },
          ranked.map(({ item, value }, index) => e("div", { className: "dashboard-ranking-row", key: item.name }, [
            e("span", { className: "dashboard-rank-number", key: "index" }, `0${index + 1}`),
            e("div", { className: "dashboard-rank-main", key: "main" }, [
              e("strong", { key: "name" }, item.name),
              e("div", { className: "dashboard-rank-progress", key: "progress" }, e("span", { style: { width: `${maxValue ? value / maxValue * 100 : 0}%` } }))
            ]),
            e("strong", { className: "dashboard-rank-value", key: "value" }, item[rankMetric])
          ]))
        )
      ]);
    }

    const distributionColors = ["#1677ff", "#36b3f9", "#8b5cf6", "#c3cad6", "#13c2c2", "#faad14", "#f5780a", "#eb2f96"];

    function renderDistributionCard() {
      // 按品种类型聚合订单数，不展示具体品种
      const typeOrders = new Map();
      data.symbols.forEach(item => {
        const type = item.type || "其他";
        typeOrders.set(type, (typeOrders.get(type) || 0) + parseRankValue(item.orders));
      });
      const slices = Array.from(typeOrders.entries())
        .map(([name, orders]) => ({ name, orders }))
        .sort((a, b) => b.orders - a.orders)
        .map((entry, index) => Object.assign({}, entry, { color: distributionColors[index % distributionColors.length] }));
      const total = slices.reduce((sum, entry) => sum + entry.orders, 0);
      // 环形图用周长=100 的圆模拟扇区，相邻扇区留 0.8 的缝隙便于区分
      let cumulative = 0;
      const segments = slices.map(slice => {
        const pct = total ? slice.orders / total * 100 : 0;
        const segment = {
          key: slice.name,
          color: slice.color,
          dash: Math.max(pct - 0.8, 0.4),
          offset: 25 - cumulative
        };
        cumulative += pct;
        return segment;
      });
      return e(Card, {
        title: "订单分布",
        className: "dashboard-analysis-card dashboard-distribution-card",
        key: "distribution"
      }, [
        e("div", { className: "dashboard-donut-wrap", key: "donut" }, [
          e("svg", { className: "dashboard-donut-svg", viewBox: "0 0 42 42", key: "svg" }, [
            e("circle", { cx: 21, cy: 21, r: 15.9155, fill: "none", className: "dashboard-donut-track", key: "track" }),
            segments.map(segment => e("circle", {
              key: segment.key,
              cx: 21,
              cy: 21,
              r: 15.9155,
              fill: "none",
              stroke: segment.color,
              strokeWidth: 6.5,
              strokeDasharray: `${segment.dash} ${100 - segment.dash}`,
              strokeDashoffset: segment.offset
            }))
          ]),
          e("div", { className: "dashboard-donut-center", key: "center" }, [
            e("strong", { key: "total" }, total.toLocaleString("zh-CN")),
            e("span", { key: "label" }, "订单总数")
          ])
        ]),
        e("div", { className: "dashboard-donut-legend", key: "legend" }, slices.map(slice =>
          e("div", { className: "dashboard-donut-legend-item", key: slice.name }, [
            e("span", { className: "dashboard-donut-dot", style: { background: slice.color }, key: "dot" }),
            e("span", { className: "dashboard-donut-name", key: "name" }, slice.name),
            e("strong", { className: "dashboard-donut-pct", key: "pct" },
              `${total ? (slice.orders / total * 100).toFixed(1) : "0.0"}%`)
          ])
        )),
        e("div", { className: "dashboard-donut-footer", key: "footer" },
          `当前展示类型: 共 ${slices.length} 类`)
      ]);
    }

    function renderMetricCard(metric) {
      const item = data.metrics[metric.key];
      const rawValue = item && item.value != null ? String(item.value) : "";
      const numericValue = Number(rawValue.replace(/[^\d.-]/g, ""));
      const isEmpty = !rawValue || !Number.isFinite(numericValue) || numericValue === 0;
      return e(Card, { className: "dashboard-metric-card", key: metric.key }, [
        e("div", { className: "dashboard-metric-label", key: "label" },
          e(Text, { type: "secondary", key: "text" }, metric.label)
        ),
        e("strong", { key: "value" }, isEmpty ? "-" : [
          rawValue,
          metric.unit ? e("span", { className: "dashboard-metric-unit", key: "unit" }, metric.unit) : null
        ]),
        metric.subtitle ? e("div", { className: "dashboard-metric-sub", key: "sub" }, metric.subtitle(data.metrics)) : null,
        metric.icon ? e("span", { className: `dashboard-metric-icon tone-${metric.tone}`, key: "icon" }, renderMetricIcon(metric.icon)) : null
      ]);
    }

    return e("div", { className: "dashboard-page" }, [
      e("div", { className: "dashboard-heading", key: "heading" }, [
        e("div", { key: "title" }, [
          e(Title, { level: 3, key: "h" }, "数据概览")
        ]),
        e(Segmented, {
          key: "mode",
          className: `dashboard-mode-switch is-${accountMode}`,
          value: accountMode,
          onChange: setAccountMode,
          options: [
            {
              value: "real",
              label: e("span", { className: "dashboard-mode-option", key: "real" }, [
                e("i", { className: "dashboard-mode-dot is-real", "aria-hidden": true, key: "dot" }),
                "实盘"
              ])
            },
            {
              value: "demo",
              label: e("span", { className: "dashboard-mode-option", key: "demo" }, [
                e("i", { className: "dashboard-mode-dot is-demo", "aria-hidden": true, key: "dot" }),
                "模拟盘"
              ])
            }
          ]
        })
      ]),
      e(Card, { className: "dashboard-filter-card", key: "filters" }, [
        e("div", { className: "dashboard-filter-main", key: "main" }, [
          e("div", { className: "dashboard-filter-field dashboard-date-field", key: "date" }, [
            e("span", null, "统计时间"),
            e("div", { className: "dashboard-date-controls", key: "controls" }, [
              e(Segmented, {
                key: "mode",
                value: dateMode,
                onChange: setDateMode,
                options: [{ value: "today", label: "今日" }, { value: "week", label: "近七天" }, { value: "custom", label: "自定义" }]
              }),
              dateMode === "custom" ? e(RangePicker, { key: "range", value: customRange, onChange: setCustomRange, format: "YYYY-MM-DD", allowClear: false }) : null
            ])
          ]),
          e(Button, { type: "primary", className: "dashboard-query", onClick: runQuery, key: "query" }, "查询"),
          e(Button, { className: "dashboard-reset", onClick: resetFilters, key: "reset" }, "重置")
        ])
      ]),
      e("div", { className: "dashboard-metric-rows", key: "metrics" }, metricRows.map(row =>
        e("section", { className: "dashboard-metric-row", key: row.label }, [
          e("div", { className: "dashboard-metric-group", key: "label" }, row.label),
          e("div", { className: "dashboard-metric-grid", key: "grid" }, row.metrics.map(renderMetricCard))
        ])
      )),
      e("div", { className: "dashboard-trend-header", key: "trend-header" }, [
        e("div", { key: "title" }, [
          e("strong", null, "趋势分析")
        ]),
        e(Button, { key: "config", onClick: () => setChartConfigOpen(true) }, "图表配置")
      ]),
      e(Row, { gutter: [12, 12], className: "dashboard-main-grid dashboard-trend-grid", key: "trends" },
        visibleTrends.map(item => e(Col, { xs: 24, md: 12, xl: visibleTrends.length >= 4 ? 6 : 8, key: item.id },
          renderTrendCard(item, value => value.toLocaleString("zh-CN"))
        ))
      ),
      e(Row, { gutter: [12, 12], className: "dashboard-main-grid dashboard-ranking-grid", key: "rankings" }, [
        e(Col, { xs: 24, xl: 16, key: "symbol-ranking" }, renderRankingCard()),
        e(Col, { xs: 24, xl: 8, key: "order-distribution" }, renderDistributionCard())
      ]),
      e(Drawer, {
        key: "chart-config",
        title: "图表配置",
        open: isChartConfigOpen,
        onClose: () => setChartConfigOpen(false),
        width: 400,
        destroyOnClose: true
      }, [
        e("section", { className: "dashboard-config-section", key: "count" }, [
          e("div", { className: "dashboard-config-label", key: "label" }, "展示数量"),
          e(Segmented, { value: chartCount, onChange: setTrendDisplayCount, options: chartCountOptions, key: "segmented" })
        ]),
        e("section", { className: "dashboard-config-section", key: "metrics" }, [
          e("div", { className: "dashboard-config-label", key: "label" }, "展示指标"),
          e("p", { className: "dashboard-config-hint", key: "hint" }, "勾选指标后，可拖动已选项调整图表展示顺序。"),
          e("div", { className: "dashboard-config-list", key: "list" }, trendOptions.map(item => {
            const isSelected = visibleTrendIds.includes(item.id);
            return e("div", {
              className: `dashboard-config-item${isSelected ? " is-selected" : ""}`,
              draggable: isSelected,
              key: item.id,
              onDragStart: () => setDraggingTrendId(item.id),
              onDragEnd: () => setDraggingTrendId(null),
              onDragOver: event => event.preventDefault(),
              onDrop: () => moveTrend(item.id)
            }, [
              e(Checkbox, { checked: isSelected, onChange: event => toggleTrendSelection(item.id, event.target.checked), key: "checkbox" }, item.name),
              isSelected && e("span", { className: "dashboard-drag-handle", key: "handle", title: "拖动排序" }, "⋮⋮")
            ]);
          }))
        ])
      ])
    ]);
  }

  app.DashboardPage = DashboardPage;
})(window.AdminApp);

(function registerOverviewPage(app) {
  const e = React.createElement;

  function CopyIcon() {
    return e("svg", { className: "ib-copy-icon", viewBox: "0 0 16 16", fill: "none" }, [
      e("rect", { key: "back", x: "5.5", y: "5.5", width: "8", height: "8", rx: "1.5", stroke: "currentColor", strokeWidth: "1.2" }),
      e("path", { key: "front", d: "M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10H4", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })
    ]);
  }

  function RangeChip({ label }) {
    return e("button", { className: "ib-range-chip", type: "button" }, [
      label,
      e("span", { className: "ib-caret", key: "caret" }, "▾")
    ]);
  }

  function MetricCard({ metric }) {
    const head = [
      e("span", { className: "ib-metric-label", key: "label" }, metric.label)
    ];
    if (metric.action) {
      head.push(e("button", { className: "ib-btn-fund", type: "button", key: "action" }, metric.action.label));
    }
    if (metric.rangeChip) {
      head.push(e(RangeChip, { label: metric.rangeChip, key: "range" }));
    }
    return e("div", { className: "ib-card ib-metric-card" }, [
      e("div", { className: "ib-metric-head", key: "head" }, head),
      e("div", { className: "ib-metric-value ib-num", key: "value" }, metric.value),
      metric.sub || metric.subAction ? e("div", { className: "ib-metric-sub-row", key: "sub" }, [
        metric.sub ? e("span", { className: "ib-metric-sub ib-num", key: "subText" }, metric.sub) : null,
        metric.subAction ? e("button", { className: "ib-btn-ghost", type: "button", key: "subAction" }, metric.subAction.label) : null
      ]) : null
    ]);
  }

  function LevelCard({ level }) {
    return e("div", { className: "ib-card ib-level-card" }, [
      e("div", { className: "ib-level-left", key: "left" }, [
        e("div", { className: "ib-level-title-row", key: "title" }, [
          e("span", { className: "ib-card-title", key: "label" }, level.title),
          e("span", { className: "ib-badge-level", key: "badge" }, level.badge)
        ]),
        level.rows.map(row => e("div", { className: `ib-level-row${row.primary ? " is-primary" : ""}`, key: row.label }, [
          e("span", { key: "label" }, row.label),
          e("span", { className: "ib-level-val", key: "value" }, row.value)
        ]))
      ]),
      e("div", { className: "ib-level-right", key: "right" },
        level.note
          ? e("div", { className: "ib-level-note", key: "note" }, [
              e("div", { className: "ib-level-note-title", key: "title" }, level.note.title),
              e("div", { className: "ib-level-note-text", key: "text" }, level.note.text)
            ])
          : level.progress.map(item => e("div", { className: "ib-progress-block", key: item.name }, [
              e("div", { className: "ib-progress-label-row", key: "label" }, [
                e("span", { className: "ib-progress-name", key: "name" }, item.name),
                e("span", { className: "ib-progress-value ib-num", key: "value" }, item.value)
              ]),
              e("div", { className: "ib-progress-track", key: "track" },
                e("div", { className: "ib-progress-fill", style: { width: `${Math.min(100, item.current / item.total * 100)}%` } }))
            ])))
    ]);
  }

  function ShareIcon() {
    return e("svg", { className: "ib-share-icon", viewBox: "0 0 16 16", fill: "none" }, [
      e("circle", { key: "c1", cx: "13", cy: "3", r: "1.9", stroke: "currentColor", strokeWidth: "1.2" }),
      e("circle", { key: "c2", cx: "3", cy: "8", r: "1.9", stroke: "currentColor", strokeWidth: "1.2" }),
      e("circle", { key: "c3", cx: "13", cy: "13", r: "1.9", stroke: "currentColor", strokeWidth: "1.2" }),
      e("path", { key: "l1", d: "M4.7 7.1L11.3 4.1", stroke: "currentColor", strokeWidth: "1.2" }),
      e("path", { key: "l2", d: "M4.7 8.9L11.3 11.9", stroke: "currentColor", strokeWidth: "1.2" })
    ]);
  }

  function LinkCard({ link, onGoPartnerList }) {
    const handleCopy = field => {
      // 仅复制地址到剪贴板；发展下级合伙人的入口在「分享」按钮（跳转合伙人列表）
      const text = field.value;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        } else {
          const helper = document.createElement("textarea");
          helper.value = text;
          helper.style.position = "fixed";
          helper.style.opacity = "0";
          document.body.appendChild(helper);
          helper.select();
          document.execCommand("copy");
          document.body.removeChild(helper);
        }
      } catch (error) {
        /* 原型环境剪贴板不可用时忽略 */
      }
    };
    return e("div", { className: "ib-card ib-link-card" }, [
      e("div", { className: "ib-link-head", key: "head" }, [
        e("div", { className: "ib-link-head-left", key: "left" }, [
          e("span", { className: "ib-card-title", key: "title" }, link.title),
          e("span", { className: "ib-badge-live", key: "badge" }, link.liveBadge),
          e("button", {
            className: "ib-share-btn",
            type: "button",
            key: "share",
            title: link.shareLabel,
            "aria-label": link.shareLabel,
            onClick: onGoPartnerList
          }, [
            e(ShareIcon, { key: "icon" }),
            e("span", { key: "label" }, link.shareLabel)
          ])
        ]),
        e("button", { className: "ib-btn-qr", type: "button", key: "qr" }, link.qrLabel)
      ]),
      e("div", { className: "ib-link-fields", key: "fields" },
        link.fields.map(field => e("div", { className: "ib-link-field", key: field.label }, [
          e("span", { className: "ib-link-field-label", key: "label" }, field.label),
          e("div", { className: `ib-link-field-value ib-num${field.code ? " is-code" : ""}`, key: "value" }, [
            e("span", { className: "ib-link-field-text", key: "text" }, field.value),
            field.copyable
              ? e("button", {
                  className: "ib-copy-btn",
                  type: "button",
                  key: "copy",
                  title: "复制地址",
                  onClick: () => handleCopy(field)
                }, e(CopyIcon, null))
              : null
          ])
        ])))
    ]);
  }

  function buildSmoothPath(points) {
    if (points.length < 2) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const prev = points[i - 1] || p0;
      const next = points[i + 2] || p1;
      const c1x = p0.x + (p1.x - prev.x) / 6;
      const c1y = p0.y + (p1.y - prev.y) / 6;
      const c2x = p1.x - (next.x - p0.x) / 6;
      const c2y = p1.y - (next.y - p0.y) / 6;
      path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return path;
  }

  function TrendChart({ line }) {
    const width = 660;
    const height = 220;
    const padLeft = 42;
    const padRight = 12;
    const padTop = 10;
    const padBottom = 26;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;
    const maxValue = 1;
    const ticks = [1, 0.8, 0.6, 0.4, 0.2, 0];
    const xFor = index => padLeft + (plotWidth * index) / (line.days.length - 1);
    const yFor = value => padTop + plotHeight - (plotHeight * value) / maxValue;
    const points = line.values.map((value, index) => ({ x: xFor(index), y: yFor(value) }));
    const linePath = buildSmoothPath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`;
    const gradientId = "ib-chart-line-gradient";
    const fillId = "ib-chart-area-gradient";

    return e("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: height, role: "img" }, [
      e("defs", { key: "defs" }, [
        e("linearGradient", { id: gradientId, key: "line", x1: "0", y1: "0", x2: "1", y2: "0" }, [
          e("stop", { key: "s1", offset: "0", stopColor: line.fromColor }),
          e("stop", { key: "s2", offset: "1", stopColor: line.toColor })
        ]),
        e("linearGradient", { id: fillId, key: "area", x1: "0", y1: "0", x2: "0", y2: "1" }, [
          e("stop", { key: "s1", offset: "0", stopColor: line.fillFrom }),
          e("stop", { key: "s2", offset: "1", stopColor: "rgba(232, 64, 42, 0)" })
        ])
      ]),
      ticks.map(tick => {
        const y = yFor(tick);
        return e("g", { key: `tick-${tick}` }, [
          e("line", {
            key: "grid",
            x1: padLeft, x2: width - padRight, y1: y, y2: y,
            stroke: "#222222", strokeWidth: 1, strokeDasharray: "3 4"
          }),
          e("text", {
            key: "label", x: padLeft - 8, y: y + 4, textAnchor: "end",
            fill: "#7a7f87", fontSize: 11
          }, tick.toFixed(2))
        ]);
      }),
      line.days.map((day, index) => e("text", {
        key: day, x: xFor(index), y: height - 8, textAnchor: "middle",
        fill: "#7a7f87", fontSize: 11
      }, day)),
      e("path", { key: "area", d: areaPath, fill: `url(#${fillId})` }),
      e("path", {
        key: "line", d: linePath, fill: "none",
        stroke: `url(#${gradientId})`, strokeWidth: 2.4, strokeLinecap: "round"
      }),
      points.map((point, index) => e("circle", {
        key: `dot-${index}`, cx: point.x, cy: point.y, r: 3,
        fill: "#0d0d0d", stroke: index < points.length / 2 ? line.fromColor : line.toColor, strokeWidth: 1.8
      }))
    ]);
  }

  function ChartCard({ chart }) {
    return e("div", { className: "ib-card ib-chart-card" }, [
      e("div", { className: "ib-chart-head", key: "head" }, [
        e("div", { className: "ib-chart-tabs", key: "tabs" },
          chart.tabs.map(tab => e("button", {
            key: tab.id,
            type: "button",
            className: `ib-tab${tab.active ? " is-active" : ""}`
          }, tab.label))),
        e(RangeChip, { label: chart.rangeChip, key: "range" })
      ]),
      e(TrendChart, { line: chart.line, key: "chart" })
    ]);
  }

  function IncomeCard({ income }) {
    return e("div", { className: "ib-card ib-income-card" }, [
      e("div", { className: "ib-chart-head", key: "head" }, [
        e("div", { key: "title" }, [
          e("span", { className: "ib-card-title", key: "name" }, income.title),
          e("div", { className: "ib-income-sub", key: "sub" }, income.subtitle)
        ]),
        e(RangeChip, { label: income.rangeChip, key: "range" })
      ]),
      e("div", { className: "ib-income-list", key: "list" },
        income.rows.map(row => e("div", { key: row.id }, [
          e("div", { className: "ib-income-row-top", key: "top" }, [
            e("span", { className: "ib-income-name", key: "name" }, row.name),
            e("span", { className: "ib-income-value ib-num", key: "value" }, row.value),
            e("span", { className: "ib-income-percent ib-num", key: "percent" }, row.percent)
          ]),
          e("div", { className: "ib-income-bar", key: "bar" },
            e("div", { className: "ib-income-fill", style: { width: `${row.ratio}%` } }))
        ])))
    ]);
  }

  function FootCards({ cards }) {
    return e("div", { className: "ib-foot-grid" },
      cards.map(card => e("div", { className: "ib-card ib-foot-card", key: card.id }, [
        e("div", { className: "ib-chart-head", key: "head" }, [
          e("div", { key: "title" }, [
            e("span", { className: "ib-card-title", key: "name" }, card.title),
            e("div", { className: "ib-foot-sub", key: "sub" }, card.subtitle)
          ]),
          e(RangeChip, { label: card.rangeChip, key: "range" })
        ]),
        e("div", { className: "ib-foot-body", key: "body" }, card.emptyText || "")
      ])));
  }

  function OverviewPage({ data, onNavigate }) {
    return e("div", { className: "ib-page" }, [
      e("div", { className: "ib-page-head", key: "head" }, [
        e("h1", { className: "ib-page-title", key: "title" }, data.pageTitle),
        e("div", { className: "ib-page-head-actions", key: "actions" }, [
          e("button", { className: "ib-month-select", type: "button", key: "month" }, [
            data.monthLabel,
            e("span", { className: "ib-caret", key: "caret" }, "▾")
          ]),
          e("button", { className: "ib-btn-primary", type: "button", key: "export" }, data.exportLabel)
        ])
      ]),
      e("div", { className: "ib-metric-grid", key: "metrics" },
        data.metrics.map(metric => e(MetricCard, { metric, key: metric.id }))),
      e("div", { className: "ib-duo-grid", key: "duo" }, [
        e(LevelCard, { level: data.levelCard, key: "level" }),
        e(LinkCard, { link: data.linkCard, onGoPartnerList: () => onNavigate("partner-list"), key: "link" })
      ]),
      e("div", { className: "ib-duo-grid", key: "charts" }, [
        e(ChartCard, { chart: data.chartCard, key: "chart" }),
        e(IncomeCard, { income: data.incomeCard, key: "income" })
      ]),
      e(FootCards, { cards: data.footCards, key: "foot" })
    ]);
  }

  app.OverviewPage = OverviewPage;
})(window.IBApp);

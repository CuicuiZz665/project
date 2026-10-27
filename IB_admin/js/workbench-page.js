(function registerWorkbenchPage(app) {
  const { Button, Card, Col, Row, Tag, Typography } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  // 快捷入口图标（feather 风格线性 SVG，vendor antd 不带 @ant-design/icons）
  const QUICK_ICON_PATHS = {
    users: [["path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }], ["circle", { cx: 9, cy: 7, r: 4 }], ["path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }], ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]],
    chart: [["line", { x1: 18, y1: 20, x2: 18, y2: 10 }], ["line", { x1: 12, y1: 20, x2: 12, y2: 4 }], ["line", { x1: 6, y1: 20, x2: 6, y2: 14 }]],
    wallet: [["path", { d: "M21 12V7H5a2 2 0 0 1 0-4h14v4" }], ["path", { d: "M3 5v14a2 2 0 0 0 2 2h16v-5" }], ["path", { d: "M18 12a2 2 0 0 0 0 4h4v-4z" }]],
    shield: [["path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }]],
    share: [["circle", { cx: 18, cy: 5, r: 3 }], ["circle", { cx: 6, cy: 12, r: 3 }], ["circle", { cx: 18, cy: 19, r: 3 }], ["line", { x1: 8.59, y1: 13.51, x2: 15.42, y2: 17.49 }], ["line", { x1: 15.41, y1: 6.51, x2: 8.59, y2: 10.49 }]],
    dollar: [["line", { x1: 12, y1: 1, x2: 12, y2: 23 }], ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }]],
    gift: [["polyline", { points: "20 12 20 22 4 22 4 12" }], ["rect", { x: 2, y: 7, width: 20, height: 5 }], ["line", { x1: 12, y1: 22, x2: 12, y2: 7 }], ["path", { d: "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" }], ["path", { d: "M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" }]]
  };
  const NOTICE_TAG_COLORS = {
    "提现审核": "gold",
    "代理申请": "purple",
    "风控提醒": "red",
    "活动报名": "cyan",
    "系统公告": "blue"
  };
  const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

  function renderQuickIcon(name) {
    const paths = QUICK_ICON_PATHS[name] || QUICK_ICON_PATHS.chart;
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
    }, paths.map(([tag, attrs], index) => e(tag, Object.assign({ key: index }, attrs))));
  }

  function greetingFor(hour) {
    if (hour < 6) return "夜深了";
    if (hour < 9) return "早上好";
    if (hour < 12) return "上午好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  }

  // 工作台：进后台的第一站 —— 待办处理、快捷入口与最新通知（数据概览专注数据看板，两者分离）
  app.WorkbenchPage = function WorkbenchPage({ todos, quickPages, user, roleName, onNavigate }) {
    const now = dayjs();
    const todoItems = todos || [];
    const quickItems = quickPages || [];
    const notices = (app.mockData.adminNotifications || []).slice(0, 5);

    const todoSection = e("section", { className: "dashboard-todo", key: "todos" }, [
      e("div", { className: "dashboard-todo-head", key: "head" }, [
        e("span", { className: "dashboard-todo-title", key: "title" }, "待办中心"),
        e(Text, { type: "secondary", key: "hint" }, "点击待办直达处理页面")
      ]),
      todoItems.length
        ? e("div", { className: "dashboard-todo-grid", key: "grid" },
            todoItems.map(item => e("div", {
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
        : e("div", { className: "workbench-todo-empty", key: "empty" }, "当前角色暂无待办事项，一切顺利")
    ]);

    const quickCard = e(Card, {
      title: "快捷入口",
      className: "workbench-card",
      key: "quick",
      extra: e(Text, { type: "secondary" }, "按角色权限展示")
    }, quickItems.length
      ? e("div", { className: "workbench-quick-grid" },
          quickItems.map(item => e("div", {
            className: "workbench-quick-item",
            key: item.key,
            role: "button",
            tabIndex: 0,
            onClick: () => onNavigate && onNavigate(item.key)
          }, [
            e("span", { className: `workbench-quick-icon tone-${item.tone || "blue"}`, key: "icon" }, renderQuickIcon(item.icon)),
            e("span", { className: "workbench-quick-label", key: "label" }, item.label)
          ])))
      : e("div", { className: "workbench-todo-empty" }, "暂无可用的快捷入口"));

    const noticeCard = e(Card, {
      title: "最新通知",
      className: "workbench-card",
      key: "notice",
      extra: e(Button, {
        type: "link",
        size: "small",
        onClick: () => onNavigate && onNavigate("messageManage")
      }, "查看全部 →")
    }, e("div", { className: "workbench-notice-list" },
      notices.length
        ? notices.map(item => e("div", {
            className: `workbench-notice-item${item.read ? "" : " is-unread"}`,
            key: item.id,
            role: "button",
            tabIndex: 0,
            onClick: () => onNavigate && onNavigate(item.page)
          }, [
            e(Tag, { color: NOTICE_TAG_COLORS[item.type] || "default", key: "tag" }, item.type),
            e("span", { className: "workbench-notice-title", key: "title" }, item.title),
            e("span", { className: "workbench-notice-time", key: "time" }, item.time)
          ]))
        : e("div", { className: "workbench-todo-empty" }, "暂无通知")));

    return e("div", { className: "workbench-page" }, [
      e("section", { className: "workbench-welcome", key: "welcome" }, [
        e("span", { className: "workbench-welcome-mark", key: "mark" }, "Cui"),
        e("div", { className: "workbench-welcome-main", key: "main" }, [
          e("h3", { key: "hello" }, `${greetingFor(now.hour())}，${user || "管理员"}`),
          e("span", { className: "workbench-welcome-sub", key: "sub" },
            `今天是 ${now.year()}年${now.month() + 1}月${now.date()}日 星期${WEEK_LABELS[now.day()]}${roleName ? ` · 当前角色：${roleName}` : ""}`)
        ])
      ]),
      todoSection,
      e(Row, { gutter: [12, 12], className: "workbench-main-grid", key: "main" }, [
        e(Col, { xs: 24, xl: 14, key: "quick" }, quickCard),
        e(Col, { xs: 24, xl: 10, key: "notice" }, noticeCard)
      ])
    ]);
  };
})(window.AdminApp);

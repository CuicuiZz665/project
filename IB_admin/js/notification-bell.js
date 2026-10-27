(function registerNotificationBell(app) {
  const { Badge, Button, Popover, Tag } = antd;
  const e = React.createElement;

  const TYPE_TAG_COLORS = {
    "提现审核": "gold",
    "代理申请": "purple",
    "风控提醒": "red",
    "活动报名": "cyan",
    "系统公告": "blue"
  };

  const BELL_SVG = e("svg", {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  }, [
    e("path", { key: "bell", d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
    e("path", { key: "clapper", d: "M13.73 21a2 2 0 0 1-3.46 0" })
  ]);

  // 顶栏通知铃铛：面向管理员本人的待办/风控/公告通知（区别于面向客户的站内信管理）
  app.NotificationBell = function NotificationBell({ onNavigate }) {
    const [items, setItems] = React.useState(() => JSON.parse(JSON.stringify(app.mockData.adminNotifications || [])));
    const [open, setOpen] = React.useState(false);
    const unread = items.filter(item => !item.read).length;

    function markAllRead() {
      setItems(list => list.map(item => Object.assign({}, item, { read: true })));
    }

    function openItem(item) {
      setItems(list => list.map(entry => entry.id === item.id ? Object.assign({}, entry, { read: true }) : entry));
      setOpen(false);
      if (item.page && onNavigate) onNavigate(item.page);
    }

    const content = e("div", { className: "notice-popover" }, [
      e("div", { className: "notice-popover-head", key: "head" }, [
        e("strong", { key: "title" }, "通知"),
        e(Button, {
          key: "read-all",
          type: "link",
          size: "small",
          disabled: !unread,
          onClick: markAllRead
        }, "全部已读")
      ]),
      e("div", { className: "notice-popover-list", key: "list" },
        items.length
          ? items.map(item => e("div", {
              className: `notice-item${item.read ? "" : " is-unread"}`,
              key: item.id,
              role: "button",
              tabIndex: 0,
              onClick: () => openItem(item)
            }, [
              e("div", { className: "notice-item-top", key: "top" }, [
                e(Tag, { color: TYPE_TAG_COLORS[item.type] || "default", key: "tag" }, item.type),
                e("span", { className: "notice-item-time", key: "time" }, item.time)
              ]),
              e("div", { className: "notice-item-title", key: "title" }, item.title),
              e("span", { className: "notice-item-detail", key: "detail" }, item.detail)
            ]))
          : e("div", { className: "notice-empty", key: "empty" }, "暂无通知")),
      e("div", { className: "notice-popover-foot", key: "foot" },
        e(Button, {
          type: "link",
          size: "small",
          onClick: () => {
            setOpen(false);
            if (onNavigate) onNavigate("messageManage");
          }
        }, "查看全部 →"))
    ]);

    return e(Popover, {
      placement: "bottomRight",
      trigger: "click",
      open,
      onOpenChange: setOpen,
      content,
      overlayClassName: "notice-popover-overlay"
    }, e(Badge, {
      count: unread,
      size: "small",
      offset: [-2, 3]
    }, e(Button, {
      shape: "circle",
      title: "通知",
      "aria-label": `通知（${unread} 条未读）`
    }, BELL_SVG)));
  };
})(window.AdminApp);

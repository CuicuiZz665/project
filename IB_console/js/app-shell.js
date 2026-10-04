(function registerAppShell(app) {
  const e = React.createElement;

  const menuItemKeys = new Set(app.mockData.menus.map(item => item.key));

  function BrandLogo() {
    return e("svg", { className: "ib-brand-logo", viewBox: "0 0 34 34" }, [
      e("defs", { key: "defs" },
        e("linearGradient", { id: "ib-brand-gradient", x1: "0", y1: "0", x2: "1", y2: "1" }, [
          e("stop", { key: "s1", offset: "0", stopColor: "#ff8a00" }),
          e("stop", { key: "s2", offset: "1", stopColor: "#e8402a" })
        ])),
      e("path", {
        key: "g",
        d: "M21.8 5.8A11.3 11.3 0 1 0 28.3 17v-1.6h-10.6",
        fill: "none",
        stroke: "url(#ib-brand-gradient)",
        strokeWidth: "4.6",
        strokeLinecap: "round"
      })
    ]);
  }

  function Sidebar({ current }) {
    const { brand, user, menus } = app.mockData;
    return e("aside", { className: "ib-sidebar" }, [
      e("div", { className: "ib-brand", key: "brand" }, [
        e(BrandLogo, { key: "logo" }),
        e("div", { className: "ib-brand-text", key: "text" }, [
          e("span", { className: "ib-brand-name", key: "name" }, brand.name),
          e("span", { className: "ib-brand-sub", key: "sub" }, brand.sub)
        ])
      ]),
      e("ul", { className: "ib-menu", role: "menu", key: "menu" },
        menus.map(item => e("li", {
          key: item.key,
          role: "menuitem",
          className: `ib-menu-item${current === item.key ? " is-active" : ""}`,
          onClick: () => app.shell.navigate(item.key)
        }, item.label))),
      e("div", { className: "ib-sidebar-footer", key: "footer" },
        e("div", { className: "ib-user-row" }, [
          e("span", { className: "ib-user-avatar", key: "avatar" }, user.name.slice(0, 1)),
          e("div", { className: "ib-user-meta", key: "meta" }, [
            e("span", { className: "ib-user-name", key: "name" }, user.name),
            e("span", { className: "ib-user-uid", key: "uid" }, `UID ${user.uid}`)
          ]),
          e("button", { className: "ib-user-collapse", key: "collapse", title: "收起侧边栏" }, "⌃")
        ]))
    ]);
  }

  function Placeholder({ pageKey }) {
    const item = app.mockData.menus.find(entry => entry.key === pageKey);
    return e("div", { className: "ib-page" },
      e("div", { className: "ib-placeholder" },
        e("div", { className: "ib-placeholder-inner" }, [
          e("div", { className: "ib-placeholder-icon", key: "icon" }, "🧩"),
          e("strong", { key: "title" }, `${item ? item.label : "页面"} · 建设中`),
          e("span", { key: "desc" }, "将按线上系统实际情况补充。")
        ])));
  }

  function App() {
    const [current, setCurrent] = React.useState(app.shell.currentKey());

    React.useEffect(() => {
      const handler = () => setCurrent(app.shell.currentKey());
      window.addEventListener("hashchange", handler);
      return () => window.removeEventListener("hashchange", handler);
    }, []);

    const page = current === "overview"
      ? e(app.OverviewPage, { data: app.mockData.overview, onNavigate: app.shell.navigate, key: "overview" })
      : current === "partner-list"
        ? e(app.PartnerPage, { data: app.mockData.partnerList, key: "partner-list" })
        : current === "direct-customers"
          ? e(app.DirectCustomersPage, { data: app.mockData.directCustomers, key: "direct-customers" })
          : e(Placeholder, { pageKey: current, key: current });

    return e("div", { className: "ib-shell" }, [
      e(Sidebar, { current, key: "sidebar" }),
      e("main", { className: "ib-workspace", key: "workspace" }, page),
      e(app.PartnerModal, { key: "partner-modal" })
    ]);
  }

  app.shell = {
    navigate(key) {
      window.location.hash = menuItemKeys.has(key) ? `#/${key}` : "#/overview";
    },
    currentKey() {
      const key = window.location.hash.replace(/^#\//, "");
      return menuItemKeys.has(key) ? key : "overview";
    },
    init() {
      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(e(App));
    }
  };

  app.shell.init();
})(window.IBApp);

(function registerCustomerPage(app) {
  const e = React.createElement;
  const useSyncExternalStore = React.useSyncExternalStore;

  /* ---------------------------------------------------------------
     直客明细页：默认跟踪链接注册的客户列表。
     表格/工具栏/分页复用 partner.css 中 .ib-partner-* 样式。
  --------------------------------------------------------------- */

  function SearchIcon() {
    return e("svg", { className: "ib-search-icon", viewBox: "0 0 16 16", fill: "none" }, [
      e("circle", { key: "c", cx: "7", cy: "7", r: "4.4", stroke: "currentColor", strokeWidth: "1.3" }),
      e("path", { key: "l", d: "M10.4 10.4L14 14", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })
    ]);
  }

  function DirectCustomersPage({ data }) {
    // 订阅 partnerStore：已标记转化的直客自动从列表过滤（convertedUids）
    const state = useSyncExternalStore(app.partnerStore.subscribe, app.partnerStore.getSnapshot);
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);

    const visibleRows = data.rows.filter(row => !state.convertedUids[row.uid]);
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? visibleRows.filter(row =>
          ["name", "uid", "username"].some(
            prop => String(row[prop]).toLowerCase().includes(keyword)
          ))
      : visibleRows;
    const totalPages = Math.max(1, Math.ceil(filtered.length / data.pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * data.pageSize, currentPage * data.pageSize);

    const pageButtons = [];
    for (let num = 1; num <= totalPages; num += 1) {
      pageButtons.push(e("button", {
        className: `ib-page-btn ib-num${num === currentPage ? " is-active" : ""}`,
        type: "button",
        key: num,
        onClick: () => setPage(num)
      }, num));
    }

    const numericKeys = new Set(data.columns.filter(col => col.numeric).map(col => col.key));

    const renderCell = (col, row) => {
      if (col.key === "status") {
        return e("span", {
          className: `ib-dc-status${row.status === "活跃" ? " is-active" : ""}`
        }, row.status);
      }
      return row[col.key];
    };

    return e("div", { className: "ib-page" }, [
      e("div", { className: "ib-page-head", key: "head" }, [
        e("div", { className: "ib-partner-head-left", key: "left" }, [
          e("h1", { className: "ib-page-title", key: "title" }, data.pageTitle),
          e("span", { className: "ib-partner-hint", key: "hint" }, data.hint)
        ]),
        // 导出与合伙人列表一致，放在页头右上角
        e("button", { className: "ib-btn-export", type: "button", key: "export" }, data.exportLabel)
      ]),
      e("div", { className: "ib-card ib-partner-card", key: "card" }, [
        // 搜索框右对齐，与合伙人列表各卡片工具行一致
        e("div", { className: "ib-partner-toolbar ib-toolbar-end", key: "toolbar" },
          e("div", { className: "ib-search-input", key: "search" }, [
              e(SearchIcon, { key: "icon" }),
              e("input", {
                key: "input",
                type: "text",
                value: search,
                placeholder: data.searchPlaceholder,
                onChange: event => {
                  setSearch(event.target.value);
                  setPage(1);
                }
              }),
              search
                ? e("button", {
                    className: "ib-search-clear",
                    type: "button",
                    key: "clear",
                    "aria-label": "清空搜索",
                    onClick: () => {
                      setSearch("");
                      setPage(1);
                    }
                  }, "✕")
                : null
            ])
        ),
        e("div", { className: "ib-partner-table-wrap", key: "table-wrap" },
          e("table", { className: "ib-partner-table is-customers" }, [
            e("thead", { key: "head" },
              e("tr", null,
                data.columns.map(col => e("th", {
                  key: col.key,
                  className: col.numeric ? "is-numeric" : null
                }, col.label)))),
            e("tbody", { key: "body" },
              pageRows.length === 0
                ? e("tr", { key: "empty" },
                    e("td", { className: "ib-partner-empty", colSpan: data.columns.length }, data.emptyText))
                : pageRows.map(row => e("tr", { key: row.id },
                    data.columns.map(col => e("td", {
                      key: col.key,
                      className: numericKeys.has(col.key) ? "is-numeric ib-num" : null
                    }, renderCell(col, row))))
                  ))
          ])),
        e("div", { className: "ib-partner-foot", key: "foot" }, [
          e("span", { className: "ib-partner-total ib-num", key: "total" }, `共 ${filtered.length} 条`),
          e("div", { className: "ib-pager", key: "pager" }, [
            e("span", { className: "ib-page-size", key: "size" }, `${data.pageSize}条/页`),
            e("button", {
              className: "ib-page-btn",
              type: "button",
              key: "prev",
              disabled: currentPage <= 1,
              onClick: () => setPage(currentPage - 1)
            }, "‹"),
            pageButtons,
            e("button", {
              className: "ib-page-btn",
              type: "button",
              key: "next",
              disabled: currentPage >= totalPages,
              onClick: () => setPage(currentPage + 1)
            }, "›")
          ])
        ])
      ])
    ]);
  }

  app.DirectCustomersPage = DirectCustomersPage;
})(window.IBApp);

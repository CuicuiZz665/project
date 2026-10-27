(function registerPointDetailsPage(app) {
  const { Button, Checkbox, Dropdown, Input, Select, Space, Table, Tag, Typography, message } = antd;
  const { Text } = Typography;
  const e = React.createElement;
  const { ListActions, ColumnSettingsTrigger } = app.sharedActions;

  const sourceOptions = ["手续费", "连续签到", "首次连续签到", "手动触发", "活动兑换", "完课"].map(value => ({ value, label: value }));

  // 积分明细：激励中心下的独立叶子页，只读流水，支持筛选/列设置/分页。
  function PointDetailsPage({ details }) {
    const [keyword, setKeyword] = React.useState("");
    const [appliedKeyword, setAppliedKeyword] = React.useState("");
    const [source, setSource] = React.useState();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [visibleColumns, setVisibleColumns] = React.useState(["type", "refName", "courseInfo", "change", "time"]);

    const filtered = React.useMemo(() => {
      const term = appliedKeyword.trim().toLowerCase();
      return details.filter(item => {
        const keywordMatched = !term || `${item.userId}${item.refName}`.toLowerCase().includes(term);
        const sourceMatched = !source || item.source === source;
        return keywordMatched && sourceMatched;
      });
    }, [details, appliedKeyword, source]);

    const columnMap = {
      type: {
        title: "类型",
        key: "type",
        width: 130,
        render: (_, record) => {
          const label = record.ruleType === "课程任务" ? "课程任务" : record.taskType === "新手任务" ? "普通任务-新手" : "普通任务";
          return e(Tag, { color: record.ruleType === "课程任务" ? "purple" : "default" }, label);
        }
      },
      refName: {
        title: "内部规则名称",
        dataIndex: "refName",
        render: (_, record) => record.ruleType === "课程任务" ? "--" : record.refName
      },
      courseInfo: {
        title: "课程信息",
        key: "courseInfo",
        width: 160,
        render: (_, record) => record.ruleType === "课程任务" ? record.courseName || "-" : "--"
      },
      change: {
        title: "积分明细",
        dataIndex: "change",
        width: 110,
        render: value => e(Text, { type: value.startsWith("-") ? "danger" : "success" }, value)
      },
      time: { title: "获取时间(GMT+8)", dataIndex: "time", width: 170 }
    };

    const columns = [
      { title: "用户ID", dataIndex: "userId", width: 120 },
      ...visibleColumns.map(key => columnMap[key])
    ];

    const columnMenu = e(Checkbox.Group, {
      value: visibleColumns,
      onChange: setVisibleColumns,
      className: "column-menu"
    }, Object.entries(columnMap).map(([key, column]) => e(Checkbox, { key, value: key }, column.title)));

    function runQuery() {
      setPage(1);
      message.success(`查询到 ${filtered.length} 条明细`);
    }

    function resetFilters() {
      setKeyword("");
      setSource(undefined);
      setPage(1);
      message.success("筛选已重置");
    }

    return e("section", { className: "page-surface" },
      e("div", { className: "toolbar" },
        e(Space, { wrap: true },
          e(app.sharedActions.SearchInput, {
            value: keyword,
            onChange: event => setKeyword(event.target.value),
            onSearch: () => {
              setAppliedKeyword(keyword);
              setPage(1);
            },
            placeholder: "用户ID/内部规则名称",
            allowClear: true,
            className: "keyword-input"
          }),
          e(Select, {
            value: source,
            onChange: value => { setSource(value); setPage(1); },
            placeholder: "来源",
            allowClear: true,
            className: "select-input",
            options: sourceOptions
          }),
          e(ListActions, {
            key: "actions-core",
            onReset: () => {
              setKeyword("");
              setAppliedKeyword("");
              setSource(undefined);
              setPage(1);
            },
            trailing: [
              e(Dropdown, { key: "columns", trigger: ["click"], dropdownRender: () => e("div", { className: "dropdown-panel" }, columnMenu) },
                e(ColumnSettingsTrigger))
            ]
          }))),
      e(Table, {
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: {
          current: page,
          pageSize,
          total: filtered.length,
          showTotal: total => `共 ${total} 条`,
          onChange: (next, size) => { setPage(next); setPageSize(size); }
        },
        scroll: { x: 1000 }
      })
    );
  }

  app.PointDetailsPage = PointDetailsPage;
})(window.AdminApp);

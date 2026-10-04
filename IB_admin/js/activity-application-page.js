(function registerActivityApplicationPage(app) {
  const {
    Button,
    Checkbox,
    Dropdown,
    Input,
    InputNumber,
    Space,
    Table,
    Typography,
    message
  } = antd;
  const { Text } = Typography;
  const e = React.createElement;

  function ActivityApplicationPage({ applications, presetActivityId, onClearPreset }) {
    const [activityId, setActivityId] = React.useState();
    const [keyword, setKeyword] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [visibleColumns, setVisibleColumns] = React.useState(["name", "email", "message", "activityName", "submittedAt"]);

    React.useEffect(() => {
      if (presetActivityId == null) return;
      setActivityId(presetActivityId);
      setKeyword("");
      setPage(1);
      onClearPreset();
    }, [presetActivityId, onClearPreset]);

    const filtered = React.useMemo(() => {
      const term = keyword.trim().toLowerCase();
      return applications.filter(item => {
        const idMatched = activityId == null || item.activityRefId === activityId || (!item.activityRefId && String(item.id) === String(activityId));
        const keywordMatched = !term || `${item.name}${item.email}${item.message}${item.activityName}`.toLowerCase().includes(term);
        return idMatched && keywordMatched;
      });
    }, [applications, activityId, keyword]);

    const columnMap = {
      name: { title: "姓名", dataIndex: "name", width: 140 },
      email: { title: "邮箱", dataIndex: "email", width: 200 },
      message: { title: "留言", dataIndex: "message" },
      activityName: { title: "活动名称", dataIndex: "activityName", width: 220 },
      submittedAt: { title: "提交时间", dataIndex: "submittedAt", width: 160 }
    };

    const columns = [
      { title: "报名ID", dataIndex: "id", width: 90 },
      ...visibleColumns.map(key => columnMap[key])
    ];

    const columnMenu = e(Checkbox.Group, {
      value: visibleColumns,
      onChange: setVisibleColumns,
      className: "column-menu"
    }, Object.entries(columnMap).map(([key, column]) => e(Checkbox, { key, value: key }, column.title)));

    return e("section", { className: "page-surface" },
      e("div", { className: "toolbar" },
        e(Space, { wrap: true },
          e(InputNumber, {
            value: activityId,
            onChange: value => setActivityId(value),
            placeholder: "活动ID",
            className: "select-input",
            min: 1,
            precision: 0
          }),
          e(Input, {
            value: keyword,
            onChange: event => setKeyword(event.target.value),
            onPressEnter: () => { setPage(1); message.success(`查询到 ${filtered.length} 条报名`); },
            placeholder: "姓名/邮箱/留言关键词",
            allowClear: true,
            className: "keyword-input"
          }),
          e(Button, { type: "primary", onClick: () => { setPage(1); message.success(`查询到 ${filtered.length} 条报名`); } }, "查询"),
          e(Button, { onClick: () => { setActivityId(undefined); setKeyword(""); setPage(1); message.success("筛选已重置"); } }, "重置")),
        e(Dropdown, { trigger: ["click"], dropdownRender: () => e("div", { className: "dropdown-panel" }, columnMenu) },
          e(Button, null, "列设置"))),
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
        scroll: { x: 900 }
      })
    );
  }

  app.ActivityApplicationPage = ActivityApplicationPage;
})(window.AdminApp);

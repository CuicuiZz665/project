(function registerSharedActions(app) {
  const { Button, Checkbox, Input, Modal, Popover, Space, Tooltip } = antd;
  const e = React.createElement;

  // 统一 CSV 导出：BOM 头 + 引号转义 + 日期后缀文件名，行为沿用各页原实现
  function exportCsv(name, headers, rows, successMessage) {
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell === null || cell === undefined ? "" : cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    antd.message.success(successMessage || `已导出 ${rows.length} 条数据`);
  }

  // 统一确认弹窗：vendored antd 的 Modal.confirm 在 onOk/onCancel 后不会自动销毁，
  // 必须持有 ref 并在两个回调里调用 destroy（js/AGENTS.md 本地规则）
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

  // 统一 查询/重置 按钮组：全局采用"回车即查/点选即查"交互，不再渲染查询按钮——
  // 文本条件由 SearchInput 回车或点放大镜提交，点选条件（下拉/日期等）由各页在 onChange 里立即生效；
  // extra 用于插在按钮前的页面级开关（如 更多筛选/收起筛选）；
  // trailing 用于接在 重置 之后的页面级操作（如 新增），整组同处一个不换行的 Space；
  // 兼容旧调用：onQuery/submit/loading 参数已废弃，传了会被忽略
  function ListActions({ onReset, extra, trailing }) {
    const trailingButtons = trailing ? (Array.isArray(trailing) ? trailing : [trailing]) : [];
    return e(Space, { size: 8 }, [
      extra || null,
      e(Button, { key: "reset", onClick: onReset }, "重置"),
      ...trailingButtons
    ]);
  }

  // 检索输入框：右侧常驻放大镜图标（不随内容消失），回车或点图标即提交查询。
  // value/onChange 照常受控；onSearch(value) 在回车与点击图标时触发，由页面应用到筛选条件
  const SEARCH_ICON_SVG = e("svg", {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, e("path", { d: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" }));

  function SearchInput({ value, onChange, onSearch, placeholder, style, className, allowClear = true, onPressEnter, ...rest }) {
    const submit = () => onSearch && onSearch(typeof value === "string" ? value : "");
    return e(Input, {
      value,
      onChange,
      placeholder,
      style,
      className,
      allowClear,
      ...rest,
      suffix: onSearch ? e("span", {
        key: "suffix",
        role: "img",
        "aria-label": "搜索",
        title: "搜索",
        style: { display: "inline-flex", lineHeight: 0, fontSize: 14, color: "#8b93a1", cursor: "pointer" },
        onClick: submit
      }, SEARCH_ICON_SVG) : undefined,
      onPressEnter: event => {
        if (onPressEnter) onPressEnter(event);
        submit();
      }
    });
  }

  // 列设置触发器：幽灵圆形图标钮 + 悬停提示，钉在筛选卡片右上角（CSS 绝对定位，
  // 见 layout.css 的 .column-settings-pin），与查询/重置按钮组脱开；
  // 自带弹层的页面（Popover/Dropdown/自定义面板）把它作为触发元素传入，onClick 透传。
  const COLUMN_SETTINGS_ICON = e("span", {
    role: "img",
    "aria-label": "column-settings",
    className: "anticon",
    style: { display: "inline-flex", lineHeight: 0, fontSize: 14 }
  }, e("svg", {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, e("path", { d: "M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" })));

  function ColumnSettingsTrigger({ onClick, title }) {
    return e("span", { className: "column-settings-pin" },
      e(Tooltip, { title: title || "列设置" },
        e(Button, { type: "text", shape: "circle", "aria-label": "列设置", onClick }, COLUMN_SETTINGS_ICON)));
  }

  // 导出触发器：幽灵圆形图标钮（下载图标）+ 悬停提示，钉在筛选卡片右上角、列设置图标左侧
  // （见 layout.css 的 .export-pin）；弹窗式导出的页面把 onClick 指向打开导出弹窗
  const DOWNLOAD_ICON = e("span", {
    role: "img",
    "aria-label": "download",
    className: "anticon",
    style: { display: "inline-flex", lineHeight: 0, fontSize: 14 }
  }, e("svg", {
    viewBox: "0 0 24 24",
    width: "1em",
    height: "1em",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, e("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" })));

  function ExportTrigger({ onClick, title }) {
    return e("span", { className: "export-pin" },
      e(Tooltip, { title: title || "导出" },
        e(Button, { type: "text", shape: "circle", "aria-label": "导出", onClick }, DOWNLOAD_ICON)));
  }

  // 统一列设置弹层（平铺字段版）：options 为 [{ key, label }]，value 为已选 key 数组，
  // onChange 应用新选择，defaultValue 驱动 恢复默认；打开时草稿自动同步回当前生效值。
  // 分组版（黑名单/白名单）与自定义版（充值/订单列表）暂留页面内，不入此组件。
  function ColumnSettings({ options, value, defaultValue, onChange }) {
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState(value);
    const allKeys = options.map(item => item.key);
    const defaultKeys = defaultValue || allKeys;
    const panel = e("div", { className: "column-panel login-log-column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("span", { key: "title" }, "显示字段"),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${draft.length}/${options.length}`)
      ]),
      e("div", { className: "column-panel-sub", key: "sub" }, "选择列表中需要展示的信息"),
      e("div", { className: "login-log-column-actions", key: "actions" }, [
        e(Button, { key: "all", size: "small", onClick: () => setDraft(allKeys) }, "全选"),
        e(Button, { key: "clear", size: "small", onClick: () => setDraft([]) }, "清空"),
        e(Button, { key: "reset", size: "small", onClick: () => setDraft(defaultKeys) }, "恢复默认")
      ]),
      e("div", { className: "login-log-column-list", key: "list" }, [
        e("div", { className: "login-log-column-list-head", key: "list-head" }, [
          e("span", { key: "label" }, "列表字段"),
          e("span", { key: "count" }, `${draft.length}/${options.length}`)
        ]),
        e(Checkbox.Group, {
          key: "group",
          className: "login-log-column-grid",
          value: draft,
          onChange: values => setDraft(values)
        }, options.map(item => e(Checkbox, { key: item.key, value: item.key }, item.label)))
      ]),
      e("div", { className: "column-panel-footer", key: "footer" }, [
        e(Button, { key: "cancel", onClick: () => setOpen(false) }, "取消"),
        e(Button, {
          key: "apply",
          type: "primary",
          onClick: () => {
            onChange(draft);
            setOpen(false);
          }
        }, "应用")
      ])
    ]);
    return e(Popover, {
      trigger: "click",
      placement: "bottomRight",
      open,
      onOpenChange: next => {
        if (next) setDraft(value);
        setOpen(next);
      },
      content: panel
    }, e(ColumnSettingsTrigger));
  }

  app.sharedActions = { exportCsv, confirmAction, ListActions, ColumnSettings, ColumnSettingsTrigger, ExportTrigger, SearchInput };
})(window.AdminApp);

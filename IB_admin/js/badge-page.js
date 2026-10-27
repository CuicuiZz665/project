(function registerBadgePage(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Drawer,
    Form,
    Input,
    Modal,
    Popover,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { Text } = Typography;
  const e = React.createElement;

  const STATUS_OPTIONS = ["启用", "禁用"];
  const CONDITION_OPTIONS = ["总充值"];
  const LANG_OPTIONS = ["英语", "简体中文", "繁体中文"];
  // 原型模拟上传：从已有徽章图中随机取一张作为图标。
  const SAMPLE_ICONS = [...new Set((app.mockData.badges || []).map(item => item.icon))];

  const columnOptions = [
    { key: "icon", label: "图标" },
    { key: "languages", label: "徽章名称" },
    { key: "conditionType", label: "获取条件" },
    { key: "conditionText", label: "获取条件说明" },
    { key: "status", label: "状态" },
    { key: "createdAt", label: "创建时间(GMT+8)" },
    { key: "updatedAt", label: "更新时间(GMT+8)" }
  ];
  const allColumnKeys = columnOptions.map(item => item.key);
  // 与源系统一致：创建时间默认隐藏。
  const defaultColumnKeys = allColumnKeys.filter(key => key !== "createdAt");

  const emptyFilters = () => ({ keyword: "", status: null });

  function formatNow() {
    const now = new Date();
    const pad = num => String(num).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  // 徽章详情抽屉：点击行打开。
  function BadgeDetailDrawer({ badge, onClose }) {
    if (!badge) return null;
    return e(Drawer, {
      title: "徽章详情",
      open: true,
      width: 560,
      onClose: onClose,
      destroyOnClose: true
    }, e("div", { className: "badge-detail" }, [
      e("div", { className: "badge-detail-icon", key: "icon" }, e("img", { src: badge.icon, alt: "badge" })),
      e("div", { className: "detail-list", key: "fields" }, [
        e("div", { key: "id" }, [e(Text, { type: "secondary" }, "ID"), e("strong", null, String(badge.id))]),
        e("div", { key: "condType" }, [e(Text, { type: "secondary" }, "获取条件"), e("strong", null, badge.conditionType)]),
        e("div", { key: "condText" }, [e(Text, { type: "secondary" }, "限制条件"), e("strong", null, badge.conditionText)]),
        e("div", { key: "status" }, [e(Text, { type: "secondary" }, "状态"), e(Tag, { color: badge.status === "启用" ? "success" : "default" }, badge.status)])
      ]),
      e("div", { className: "badge-lang-title", key: "langTitle" }, "语言配置"),
      ...badge.languages.map((lang, index) => e("div", { className: "badge-lang-card", key: index }, [
        e("div", { key: "lang" }, [e(Text, { type: "secondary" }, "语言"), e("strong", null, lang.lang)]),
        e("div", { key: "name" }, [e(Text, { type: "secondary" }, "徽章名称"), e("strong", null, lang.name)]),
        e("div", { key: "desc" }, [e(Text, { type: "secondary" }, "获取条件描述"), e("strong", null, lang.desc || "-")])
      ])),
      e("div", { className: "detail-list", key: "times" }, [
        e("div", { key: "created" }, [e(Text, { type: "secondary" }, "创建时间(GMT+8)"), e("strong", null, badge.createdAt)]),
        e("div", { key: "updated" }, [e(Text, { type: "secondary" }, "更新时间(GMT+8)"), e("strong", null, badge.updatedAt)])
      ])
    ]));
  }

  // 创建/修改徽章抽屉：图标模拟上传 + 缩写(3字符) + 获取条件 + 多语言配置。
  function BadgeFormDrawer({ open, mode, badge, onCancel, onSave }) {
    const [form] = Form.useForm();
    const [icon, setIcon] = React.useState(null);
    const [langs, setLangs] = React.useState(["英语"]);
    const [activeLang, setActiveLang] = React.useState("英语");
    const [langData, setLangData] = React.useState({});
    React.useEffect(() => {
      if (!open) return;
      const initialLangs = badge ? badge.languages.map(item => item.lang) : ["英语"];
      const initialData = {};
      (badge ? badge.languages : [{ lang: "英语", name: "", desc: "" }]).forEach(item => {
        initialData[item.lang] = { name: item.name, desc: item.desc || "" };
      });
      setLangs(initialLangs);
      setActiveLang(initialLangs[0] || "英语");
      setLangData(initialData);
      setIcon(badge ? badge.icon : null);
      form.setFieldsValue({
        conditionType: badge?.conditionType || undefined
      });
    }, [open, mode, badge, form]);

    function updateLangData(field, value) {
      setLangData(prev => ({ ...prev, [activeLang]: { ...prev[activeLang], [field]: value } }));
    }

    function addLang() {
      const next = LANG_OPTIONS.find(option => !langs.includes(option));
      if (!next) return;
      setLangs(prev => [...prev, next]);
      setLangData(prev => ({ ...prev, [next]: { name: "", desc: "" } }));
      setActiveLang(next);
    }

    function removeLang(lang) {
      const next = langs.filter(item => item !== lang);
      setLangs(next);
      if (activeLang === lang) setActiveLang(next[0] || "英语");
    }

    function pickIcon() {
      const sample = SAMPLE_ICONS[Math.floor(Math.random() * SAMPLE_ICONS.length)] || "";
      setIcon(sample);
      message.success("图标已模拟上传");
    }

    async function handleSave() {
      const values = await form.validateFields();
      if (!icon) {
        message.error("请上传徽章图标");
        return;
      }
      const languages = langs.map(lang => ({
        lang,
        name: (langData[lang]?.name || "").trim(),
        desc: (langData[lang]?.desc || "").trim()
      }));
      const emptyLang = languages.find(item => !item.name);
      if (emptyLang) {
        message.error(`语言「${emptyLang.lang}」的徽章名称不能为空`);
        return;
      }
      onSave({
        conditionType: values.conditionType,
        conditionText: `${values.conditionType}：${languages.find(item => item.lang === "简体中文")?.name || languages[0].name}`,
        icon,
        languages
      });
    }

    return e(Drawer, {
      title: mode === "edit" ? "修改徽章" : mode === "copy" ? "复制徽章" : "创建徽章",
      open: open,
      width: 640,
      onClose: onCancel,
      destroyOnClose: true,
      footer: e("div", { className: "drawer-footer-actions" }, [
        e(Button, { key: "cancel", onClick: onCancel }, "取 消"),
        e(Button, {
          key: "ok", type: "primary",
          onClick: () => form.validateFields().then(handleSave).catch(() => {})
        }, "保 存")
      ])
    }, e(Form, {
      form: form,
      layout: "vertical",
      className: "admin-form badge-form"
    }, [
      e("div", { key: "card1", className: "drawer-form-card" }, [
        e("div", { className: "form-section-title" }, "基本信息"),
        e(Form.Item, { noStyle: true }, e("div", {
          className: "badge-icon-upload",
          onClick: pickIcon
        }, icon
          ? e("img", { src: icon, alt: "badge" })
          : [e("span", { key: "plus", className: "badge-icon-plus" }, "+"), e("span", { key: "text", className: "badge-icon-text" }, "选择图标")]))
      ]),
      e("div", { key: "card2", className: "drawer-form-card" }, [
        e("div", { className: "form-section-title" }, "获取条件"),
        e(Form.Item, { name: "conditionType", rules: [{ required: true, message: "请选择条件" }] }, e(Select, { placeholder: "请选择条件", options: CONDITION_OPTIONS.map(value => ({ value, label: value })) }))
      ]),
      e("div", { key: "card3", className: "drawer-form-card" }, [
        e("div", { className: "form-section-title" }, "语言配置"),
        e(Form.Item, { noStyle: true }, e(Tabs, {
          activeKey: activeLang,
          items: langs.map(lang => ({
            key: lang,
            label: e(Space, { size: 4 }, lang, lang !== "英语" ? e(Button, {
              type: "text", size: "small",
              onClick: event => {
                event.stopPropagation();
                removeLang(lang);
              }
            }, "x") : null)
          })).concat({ key: "__add", label: "+ 添加语言" }),
          onChange: key => key === "__add" ? addLang() : setActiveLang(key)
        })),
        activeLang ? [
          e(Form.Item, {
            key: `name-${activeLang}`,
            label: "徽章名称",
            required: true
          }, e(Input, {
            value: langData[activeLang]?.name || "",
            onChange: event => updateLangData("name", event.target.value),
            placeholder: "请输入该语言下的徽章名称"
          })),
          e(Form.Item, {
            key: `desc-${activeLang}`,
            label: "获取条件描述"
          }, e(Input.TextArea, {
            rows: 2,
            value: langData[activeLang]?.desc || "",
            onChange: event => updateLangData("desc", event.target.value),
            placeholder: "请输入获取条件描述"
          }))
        ] : null
      ])
    ]));
  }

  function BadgePage(props) {
    const [list, setList] = React.useState(() => ((props && props.list) || app.mockData.badges || []).map(item => ({ ...item, languages: item.languages.map(l => ({ ...l })) })));
    const [draft, setDraft] = React.useState(emptyFilters);
    const [applied, setApplied] = React.useState(emptyFilters);
    const [page, setPage] = React.useState(1);
    const [visibleColumns, setVisibleColumns] = React.useState(defaultColumnKeys);
    const [columnDraft, setColumnDraft] = React.useState(defaultColumnKeys);
    const [columnsOpen, setColumnsOpen] = React.useState(false);
    const [detail, setDetail] = React.useState(null);
    const [modalState, setModalState] = React.useState({ open: false, mode: "add", badge: null });

    const updateDraft = patch => setDraft(prev => Object.assign({}, prev, patch));

    const filtered = React.useMemo(() => {
      const term = applied.keyword.trim().toLowerCase();
      return list.filter(item => {
        const names = item.languages.map(l => `${l.lang}: ${l.name}`).join(" ").toLowerCase();
        const matchedKeyword = !term || names.toLowerCase().includes(term);
        const matchedStatus = !applied.status || item.status === applied.status;
        return matchedKeyword && matchedStatus;
      });
    }, [list, applied]);

    const search = () => {
      setApplied({ ...draft });
      setPage(1);
    };
    const reset = () => {
      setDraft(emptyFilters());
      setApplied(emptyFilters());
      setPage(1);
    };

    function saveBadge(data, mode, source) {
      if (mode === "edit") {
        setList(prev => prev.map(item => item.id === source.id ? { ...item, ...data, updatedAt: formatNow() } : item));
        message.success("徽章已修改");
      } else {
        setList(prev => [{
          id: Date.now(),
          status: "启用",
          createdAt: formatNow(),
          updatedAt: formatNow(),
          ...data
        }, ...prev]);
        message.success(mode === "copy" ? "徽章已复制" : "徽章已创建");
      }
      setModalState({ open: false, mode: "add", badge: null });
      setPage(1);
    }

    function toggleStatus(record) {
      const next = record.status === "启用" ? "禁用" : "启用";
      const displayName = (record.languages.find(item => item.lang === "简体中文") || record.languages[0] || {}).name || record.languages[0]?.lang;
      const ref = Modal.confirm({
        title: next === "禁用" ? "确认禁用" : "确认启用",
        content: next === "禁用"
          ? `禁用后徽章「${displayName}」将不再发放，已获得的客户不受影响。`
          : `启用后徽章「${displayName}」恢复发放。`,
        okText: next === "禁用" ? "禁 用" : "启 用",
        okButtonProps: next === "禁用" ? { danger: true } : {},
        cancelText: "取 消",
        onOk: () => {
          setList(prev => prev.map(item => item.id === record.id ? { ...item, status: next, updatedAt: formatNow() } : item));
          message.success(`徽章「${displayName}」已${next}`);
          ref.destroy();
        },
        onCancel: () => ref.destroy()
      });
    }

    const optionalColumnMap = {
      icon: {
        title: "图标", dataIndex: "icon", width: 90,
        render: value => e("img", { src: value, alt: "badge", className: "badge-icon" })
      },
      languages: {
        title: "徽章名称", key: "languages", width: 200,
        render: (_, record) => e("div", { className: "stacked-cell" }, record.languages.map(lang => e("div", { key: lang.lang }, `${lang.lang}: ${lang.name}`)))
      },
      conditionType: { title: "获取条件", dataIndex: "conditionType", width: 120 },
      conditionText: { title: "获取条件说明", dataIndex: "conditionText", width: 220, ellipsis: true },
      status: {
        title: "状态", dataIndex: "status", width: 90,
        render: value => e(Tag, { color: value === "启用" ? "success" : "default" }, value)
      },
      createdAt: { title: "创建时间(GMT+8)", dataIndex: "createdAt", width: 160 },
      updatedAt: { title: "更新时间(GMT+8)", dataIndex: "updatedAt", width: 160 }
    };

    const columns = React.useMemo(() => {
      const cols = visibleColumns.map(key => optionalColumnMap[key]).filter(Boolean);
      cols.push({
        title: "操作", key: "actions", fixed: "right", width: 230,
        render: (_, record) => e(Space, { size: 8 }, [
          e(Button, {
            key: "edit", type: "primary", size: "small",
            onClick: event => {
              event.stopPropagation();
              setModalState({ open: true, mode: "edit", badge: record });
            }
          }, "修 改"),
          e(Button, {
            key: "copy", size: "small",
            onClick: event => {
              event.stopPropagation();
              setModalState({ open: true, mode: "copy", badge: record });
            }
          }, "复 制"),
          e(Button, {
            key: "toggle", danger: record.status === "启用", size: "small",
            onClick: event => {
              event.stopPropagation();
              toggleStatus(record);
            }
          }, record.status === "启用" ? "禁 用" : "启 用")
        ])
      });
      return cols;
    }, [visibleColumns, list]);

    const columnPanel = e("div", { className: "column-panel login-log-column-panel" }, [
      e("div", { className: "column-panel-head", key: "head" }, [
        e("span", { key: "title" }, "显示字段"),
        e("span", { key: "count", className: "column-panel-count" }, `已选 ${columnDraft.length}/${columnOptions.length}`)
      ]),
      e("div", { className: "column-panel-sub", key: "sub" }, "选择列表中需要展示的信息"),
      e("div", { className: "login-log-column-actions", key: "actions" }, [
        e(Button, { key: "all", size: "small", onClick: () => setColumnDraft(allColumnKeys) }, "全选"),
        e(Button, { key: "clear", size: "small", onClick: () => setColumnDraft([]) }, "清空"),
        e(Button, { key: "reset", size: "small", onClick: () => setColumnDraft(defaultColumnKeys) }, "恢复默认")
      ]),
      e("div", { className: "login-log-column-list", key: "list" }, [
        e("div", { className: "login-log-column-list-head", key: "list-head" }, [
          e("span", { key: "label" }, "列表字段"),
          e("span", { key: "count" }, `${columnDraft.length}/${columnOptions.length}`)
        ]),
        e(Checkbox.Group, {
          key: "group",
          className: "login-log-column-grid",
          value: columnDraft,
          onChange: values => setColumnDraft(values)
        }, columnOptions.map(item => e(Checkbox, { key: item.key, value: item.key }, item.label)))
      ]),
      e("div", { className: "column-panel-footer", key: "footer" }, [
        e(Button, { key: "cancel", onClick: () => { setColumnDraft(visibleColumns); setColumnsOpen(false); } }, "取消"),
        e(Button, { key: "apply", type: "primary", onClick: () => { setVisibleColumns(columnDraft); setColumnsOpen(false); } }, "应用")
      ])
    ]);

    return e("section", { className: "page-surface badge-page" }, [
      e("div", { className: "toolbar", key: "toolbar" }, [
        e(Space, { key: "filters", wrap: true, size: 8 }, [
          e("label", { className: "customer-filter-item", key: "keyword" }, [
            e("span", { key: "label" }, "搜索词 :"),
            e(Input, {
              value: draft.keyword,
              onChange: event => updateDraft({ keyword: event.target.value }),
              onPressEnter: search,
              placeholder: "请输入名称关键字",
              allowClear: true,
              className: "keyword-input"
            })
          ]),
          e("label", { className: "customer-filter-item", key: "status" }, [
            e("span", { key: "label" }, "状态 :"),
            e(Select, {
              value: draft.status,
              onChange: value => updateDraft({ status: value }),
              placeholder: "选择状态",
              allowClear: true,
              className: "select-input",
              options: STATUS_OPTIONS.map(value => ({ value, label: value }))
            })
          ]),
          e(Button, { key: "search", type: "primary", onClick: search }, "查 询"),
          e(Button, { key: "reset", onClick: reset }, "重 置")
        ]),
        e(Space, { key: "actions" }, [
          e(Button, {
            key: "add", type: "primary",
            onClick: () => setModalState({ open: true, mode: "add", badge: null })
          }, "创 建"),
          e(Popover, {
            key: "columns",
            trigger: "click",
            placement: "bottomRight",
            open: columnsOpen,
            onOpenChange: open => {
              setColumnDraft(visibleColumns);
              setColumnsOpen(open);
            },
            content: columnPanel
          }, e(Button, null, "列设置"))
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 1180 },
        locale: { emptyText: "暂无数据" },
        pagination: {
          current: page,
          pageSize: 10,
          total: filtered.length,
          showTotal: total => `共 ${total} 条`,
          onChange: next => setPage(next)
        },
        onRow: record => ({
          onClick: () => setDetail(record)
        })
      }),
      detail ? e(BadgeDetailDrawer, {
        key: `detail-${detail.id}`,
        badge: detail,
        onClose: () => setDetail(null)
      }) : null,
      modalState.open ? e(BadgeFormDrawer, {
        key: `badge-${modalState.mode}-${modalState.badge ? modalState.badge.id : "new"}`,
        open: true,
        mode: modalState.mode,
        badge: modalState.badge,
        onCancel: () => setModalState({ open: false, mode: "add", badge: null }),
        onSave: data => saveBadge(data, modalState.mode, modalState.badge)
      }) : null
    ]);
  }

  app.BadgePage = BadgePage;
})(window.AdminApp);

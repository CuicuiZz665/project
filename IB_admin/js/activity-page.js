(function registerActivityPage(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Drawer,
    Dropdown,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Tabs,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { TextArea } = Input;
  const { Text } = Typography;
  const e = React.createElement;

  const activityTypeOptions = ["线下活动"];
  const cityOptions = ["伦敦", "吉隆坡", "新加坡"];
  const crowdOptions = ["贵金属投资者", "本地交易社区", "跟单交易学习者", "市场教育团体", "新手交易用户", "KOL/社区主理人"];
  const statusOptions = ["待上线", "上线", "作废"];
  const langPool = ["English", "日语", "俄语", "越南语"];
  const statusColor = { "待上线": "processing", "上线": "success", "作废": "error" };
  const langDeleteNote = "当前页面删除某个语言后，详情内容中对应语言的配置将同步删除，请确认后再操作。";

  // 本地 antd 静态 Modal.confirm 在该 vendor 组合下确定/取消后不会自动销毁，这里显式 destroy
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

  function UploadCard({ title, hint }) {
    return e("div", {
      style: {
        border: "1px dashed #d9d9d9",
        borderRadius: 8,
        padding: "16px 12px",
        textAlign: "center",
        cursor: "pointer",
        background: "#fff"
      },
      onClick: () => message.success(`${title}已模拟上传`)
    },
      e("div", { style: { fontSize: 20, color: "#1677ff", lineHeight: 1, marginBottom: 8 } }, "+"),
      e("div", null, e("strong", { style: { fontSize: 13 } }, title)),
      e(Text, { type: "secondary", style: { fontSize: 12, display: "block", marginTop: 4, lineHeight: 1.6 } }, hint)
    );
  }

  function LangTabs({ languages, activeLang, onActive, onAdd, onRemove }) {
    const canAdd = languages.length < langPool.length;
    return e("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } },
      languages.map(name => {
        const active = name === activeLang;
        return e("button", {
          key: name,
          type: "button",
          onClick: () => onActive(name),
          style: {
            height: 32,
            padding: "0 14px",
            borderRadius: 6,
            border: "none",
            background: "#f0f2f5",
            color: active ? "#1677ff" : "#595959",
            fontWeight: active ? 600 : 400,
            fontSize: 13,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center"
          }
        },
          name,
          languages.length > 1 && e("span", {
            onClick: event => {
              event.stopPropagation();
              onRemove(name);
            },
            style: { marginLeft: 8, fontSize: 13, lineHeight: 1, opacity: 0.65 }
          }, "×"));
      }),
      e("button", {
        type: "button",
        title: "新增语言配置",
        disabled: !canAdd,
        onClick: onAdd,
        style: {
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "none",
          background: "#f0f2f5",
          color: "#1677ff",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1,
          cursor: canAdd ? "pointer" : "not-allowed",
          opacity: canAdd ? 1 : 0.45
        }
      }, "+"));
  }

  function ActivityDrawer({ open, mode, record, onCancel, onSave }) {
    const [form] = Form.useForm();
    const [languages, setLanguages] = React.useState(["English"]);
    const [activeLang, setActiveLang] = React.useState("English");
    const [detailLang, setDetailLang] = React.useState("English");
    const introWatch = Form.useWatch(["detail", activeLangDetail(languages, detailLang), "intro"], form);
    const contentWatch = Form.useWatch(["detail", activeLangDetail(languages, detailLang), "content"], form);

    function activeLangDetail(list, current) {
      return list.includes(current) ? current : list[0];
    }

    React.useEffect(() => {
      if (!open) return;
      setLanguages(["English"]);
      setActiveLang("English");
      setDetailLang("English");
      form.setFieldsValue({
        type: record?.type || "线下活动",
        city: record?.city || "伦敦",
        timeRange: record ? [dayjs(record.startTime), dayjs(record.endTime)] : [],
        crowds: record?.crowds || [],
        signupRange: record && record.signupEnd ? [dayjs(record.signupStart), dayjs(record.signupEnd)] : [],
        lang: { English: { name: record?.name || "", summary: "" } },
        detail: { English: { intro: "", content: "" } }
      });
    }, [open, mode, record, form]);

    function addLanguage() {
      const next = langPool.find(name => !languages.includes(name));
      if (!next) return;
      setLanguages([...languages, next]);
      setActiveLang(next);
      setDetailLang(next);
    }

    function removeLanguage(name) {
      if (languages.length <= 1) return;
      const rest = languages.filter(item => item !== name);
      setLanguages(rest);
      if (activeLang === name) setActiveLang(rest[0]);
      if (detailLang === name) setDetailLang(rest[0]);
      message.info(langDeleteNote);
    }

    async function handleSave() {
      const values = await form.validateFields();
      const store = form.getFieldsValue(true);
      const langData = store.lang || {};
      const detailData = store.detail || {};
      const firstLang = languages.find(name => langData[name]?.name?.trim()) || "English";
      const range = values.timeRange || [];
      const signupRange = values.signupRange || [];
      const data = {
        name: langData[firstLang]?.name || "未命名活动",
        type: values.type,
        city: values.city,
        crowds: values.crowds || [],
        startTime: range[0] ? range[0].format("YYYY-MM-DD HH:mm:ss") : "",
        endTime: range[1] ? range[1].format("YYYY-MM-DD HH:mm:ss") : "",
        signupStart: signupRange[0] ? signupRange[0].format("YYYY-MM-DD HH:mm:ss") : "",
        signupEnd: signupRange[1] ? signupRange[1].format("YYYY-MM-DD HH:mm:ss") : "",
        languages: languages.map(name => ({
          name,
          nameValue: langData[name]?.name || "",
          summary: langData[name]?.summary || "",
          intro: detailData[name]?.intro || "",
          content: detailData[name]?.content || ""
        }))
      };
      onSave(data, mode, record?.id);
    }

    const basicLang = activeLang;
    const detailActive = languages.includes(detailLang) ? detailLang : languages[0];
    const modalTitle = e("div", null,
      e("div", { style: { fontSize: 17, fontWeight: 700 } }, mode === "edit" ? "修改活动" : mode === "copy" ? "复制活动" : "创建活动"),
      e(Text, { type: "secondary", style: { fontSize: 12, fontWeight: 400 } }, "先完善基础信息，再补充详情内容与多语言素材")
    );

    return e(Drawer, {
      open,
      title: modalTitle,
      width: 880,
      onClose: onCancel,
      destroyOnClose: true,
      footer: e("div", { className: "drawer-footer-actions" },
        e(Button, { onClick: onCancel }, "取消"),
        e(Button, { type: "primary", onClick: handleSave }, "保存"))
    },
      e(Form, { form, layout: "vertical", className: "admin-form" },
        e(Tabs, {
          items: [
            {
              key: "basic",
              label: "基础信息",
              children: e("div", null,
                e("div", { className: "drawer-form-card", key: "card-basic" }, e("div", { className: "form-section-title" }, "活动基础信息"), 
                e("div", { className: "form-grid-antd" },
                  e(Form.Item, { name: "type", label: "活动类型", rules: [{ required: true, message: "请选择活动类型" }] },
                    e(Select, { options: activityTypeOptions.map(value => ({ value, label: value })) })),
                  e(Form.Item, { name: "city", label: "线下城市", rules: [{ required: true, message: "请选择线下城市" }] },
                    e(Select, { placeholder: "请选择线下城市", options: cityOptions.map(value => ({ value, label: value })) }))), 
                e("div", { className: "form-grid-antd" },
                  e(Form.Item, { name: "signupRange", label: "报名时间", rules: [{ required: true, message: "请选择报名时间" }] },
                    e(RangePicker, {
                      showTime: true,
                      format: "YYYY-MM-DD HH:mm:ss",
                      placeholder: ["报名开始时间", "报名截止时间"],
                      className: "full-control"
                    })),
                  e(Form.Item, { name: "timeRange", label: "活动时间", rules: [{ required: true, message: "请选择活动时间" }] },
                    e(RangePicker, {
                      showTime: true,
                      format: "YYYY-MM-DD HH:mm:ss",
                      placeholder: ["开始时间", "结束时间"],
                      className: "full-control"
                    }))), 
                e("div", { className: "form-grid-antd" },
                  e(Form.Item, { name: "crowds", label: "适合人群" },
                    e(Select, {
                      mode: "multiple",
                      placeholder: "请选择适合人群",
                      maxTagCount: "responsive",
                      options: crowdOptions.map(value => ({ value, label: value }))
                    })))), e("div", { className: "drawer-form-card", key: "card-lang" }, 
                e("div", { className: "form-section-title" }, "活动名称与摘要多语言"), 
                e(Text, { type: "warning", style: { fontSize: 12, display: "block", marginBottom: 12 } }, langDeleteNote), 
                e(LangTabs, {
                  languages,
                  activeLang: basicLang,
                  onActive: setActiveLang,
                  onAdd: addLanguage,
                  onRemove: removeLanguage
                }), 
                e("div", { style: { background: "#f5f5f5", borderRadius: 8, padding: 20 } },
                  e("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", gap: "0 16px" } },
                    e(Form.Item, { label: "语言" },
                      e(Select, { disabled: true, value: basicLang, options: [{ value: basicLang, label: basicLang }] })),
                    e(Form.Item, {
                      name: ["lang", basicLang, "name"],
                      label: "活动名称",
                      rules: [{ required: true, message: "请输入当前语言下的活动名称" }]
                    },
                      e(Input, { placeholder: "请输入当前语言下的活动名称" }))),
                  e(Form.Item, {
                    name: ["lang", basicLang, "summary"],
                    label: "活动摘要",
                    style: { marginBottom: 16 },
                    rules: [{ required: true, message: "请输入当前语言下的活动摘要" }]
                  },
                    e(TextArea, { rows: 3, placeholder: "请输入当前语言下的活动摘要，用于前台活动列表和详情页顶部" })),
                  e("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 } },
                    e(UploadCard, {
                      title: "上传封面图 · 活动列表封面图",
                      hint: "用于前台活动列表卡片的视觉入口。建议上传 1:1 图片，支持 PNG/JPG。"
                    }),
                    e(UploadCard, {
                      title: "上传背景图 · 活动背景Banner",
                      hint: "用于前台背景展示。建议上传横版背景图，支持 PNG/JPG。"
                    })))
              ))
            },
            {
              key: "detail",
              label: "详情内容",
              children: e("div", null,
                e("div", { className: "drawer-form-card", key: "card-detail" }, e("div", { className: "form-section-title" }, "详情内容多语言"), 
                e(Text, { type: "warning", style: { fontSize: 12, display: "block", marginBottom: 12 } }, langDeleteNote), 
                e(LangTabs, {
                  languages,
                  activeLang: detailActive,
                  onActive: setDetailLang,
                  onAdd: addLanguage,
                  onRemove: removeLanguage
                }), 
                e("div", { style: { background: "#f5f5f5", borderRadius: 8, padding: 20 } },
                  e(Form.Item, { label: "语言" },
                    e(Select, { disabled: true, value: detailActive, options: [{ value: detailActive, label: detailActive }] })),
                  e(Form.Item, {
                    name: ["detail", detailActive, "intro"],
                    label: "活动介绍",
                    rules: [{ required: true, message: "请输入活动介绍内容" }]
                  },
                    e(TextArea, { rows: 5, placeholder: "请输入活动介绍内容" })),
                  e("div", { style: { textAlign: "right", marginTop: -16, marginBottom: 12 } },
                    e(Text, { type: "secondary", style: { fontSize: 12 } }, `${(introWatch || "").length} 字`)),
                  e(Form.Item, {
                    name: ["detail", detailActive, "content"],
                    label: "活动内容",
                    rules: [{ required: true, message: "请输入活动详细内容、流程、议程或规则说明" }]
                  },
                    e(TextArea, { rows: 6, placeholder: "请输入活动详细内容、流程、议程或规则说明" })),
                  e("div", { style: { textAlign: "right", marginTop: -16 } },
                    e(Text, { type: "secondary", style: { fontSize: 12 } }, `${(contentWatch || "").length} 字`)))
              ))
            }
          ]
        })
      )
    );
  }

  // 发布确认弹窗图标：vendor 未暴露图标库，这里内联 SVG（feather 描边风格）
  function PublishSendIcon({ size = 24 }) {
    return e("svg", {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      stroke: "#fff",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true
    },
      e("line", { x1: 22, y1: 2, x2: 11, y2: 13 }),
      e("polygon", { points: "22 2 15 22 11 13 2 9 22 2" }));
  }

  // 发布确认弹窗：居中单栏构图，仅保留一句主提示
  function PublishConfirmModal({ open, onCancel, onConfirm }) {
    return e(Modal, {
      open,
      onCancel,
      width: 400,
      centered: true,
      footer: null,
      destroyOnClose: true
    },
      e("div", { style: { padding: "28px 8px 14px", textAlign: "center" } },
        e("div", {
          style: {
            width: 56,
            height: 56,
            margin: "0 auto",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1677ff 0%, #4096ff 100%)",
            boxShadow: "0 8px 20px rgba(22, 119, 255, .28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }
        }, e(PublishSendIcon)),
        e("div", { style: { fontSize: 16, fontWeight: 600, color: "rgba(0, 0, 0, .88)", marginTop: 14 } }, "确认发布"),
        e("div", { style: { fontSize: 14, color: "rgba(0, 0, 0, .65)", lineHeight: 1.7, marginTop: 8 } }, "立即发布后，前台展示，不受活动时间限制"),
        e("div", { style: { display: "flex", justifyContent: "center", gap: 8, marginTop: 24 } },
          e(Button, { style: { minWidth: 88 }, onClick: onCancel }, "取消"),
          e(Button, { type: "primary", style: { minWidth: 88 }, onClick: onConfirm }, "确认发布"))));
  }

  function ActivityPage({ activities, setActivities, onViewSignups }) {
    const [keyword, setKeyword] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState();
    const [typeFilter, setTypeFilter] = React.useState();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [visibleColumns, setVisibleColumns] = React.useState(["name", "type", "status", "timeRange", "signupRange", "publishType", "operator"]);
    const [modalState, setModalState] = React.useState({ open: false, mode: "add", record: null });
    const [publishTarget, setPublishTarget] = React.useState(null);

    const filtered = React.useMemo(() => {
      const term = keyword.trim().toLowerCase();
      return activities.filter(item => {
        const keywordMatched = !term || item.name.toLowerCase().includes(term);
        const statusMatched = !statusFilter || item.status === statusFilter;
        const typeMatched = !typeFilter || item.type === typeFilter;
        return keywordMatched && statusMatched && typeMatched;
      });
    }, [activities, keyword, statusFilter, typeFilter]);

    const columnMap = {
      name: { title: "活动名称", dataIndex: "name", width: 220, render: (_, record) => e(Button, { type: "link", style: { padding: 0 }, onClick: () => setModalState({ open: true, mode: "edit", record }) }, record.name) },
      type: { title: "活动类型", dataIndex: "type", width: 110 },
      status: { title: "活动状态", dataIndex: "status", width: 100, render: value => e(Tag, { color: statusColor[value] }, value) },
      timeRange: { title: "活动时间", key: "timeRange", width: 340, render: (_, record) => e(Text, null, `${record.startTime} - ${record.endTime}`) },
      signupRange: { title: "报名时间", key: "signupRange", width: 340, render: (_, record) => e(Text, null, `${record.signupStart} - ${record.signupEnd}`) },
      publishType: { title: "发布类型", dataIndex: "publishType", width: 110 },
      operator: { title: "操作人", dataIndex: "operator", width: 100 }
    };

    function saveActivity(data, mode, editId) {
      if (mode === "edit") {
        setActivities(activities.map(item => item.id === editId ? { ...item, ...data } : item));
        message.success("活动已修改");
      } else {
        const nextId = activities.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        setActivities([{ id: nextId, status: "待上线", operator: "Bella", ...data }, ...activities]);
        message.success(mode === "copy" ? "活动已复制" : "活动已创建");
      }
      setPage(1);
      setModalState({ open: false, mode: "add", record: null });
    }

    function publishActivity(record) {
      setPublishTarget(record);
    }

    function confirmPublish() {
      if (!publishTarget) return;
      setActivities(activities.map(item => item.id === publishTarget.id ? { ...item, status: "上线" } : item));
      message.success("活动已发布");
      setPublishTarget(null);
    }

    function voidActivity(record) {
      confirmAction({
        title: "确认作废",
        content: `作废后活动“${record.name}”将从前台下线，不可恢复。`,
        onOk: () => {
          setActivities(activities.map(item => item.id === record.id ? { ...item, status: "作废" } : item));
          message.success("活动已作废");
        }
      });
    }

    const columns = [
      { title: "活动ID", dataIndex: "id", width: 90 },
      ...visibleColumns.map(key => columnMap[key]),
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 220,
        render: (_, record) => e(Space, { size: 4 },
          record.status !== "作废" && e(Button, { type: "link", size: "small", style: { padding: 0 }, onClick: () => setModalState({ open: true, mode: "edit", record }) }, "修改"),
          e(Button, { type: "link", size: "small", style: { padding: 0 }, onClick: () => setModalState({ open: true, mode: "copy", record }) }, "复制"),
          record.status === "待上线" && e(Button, { type: "link", size: "small", style: { padding: 0 }, onClick: () => publishActivity(record) }, "发布"),
          e(Dropdown, {
            trigger: ["click"],
            menu: {
              items: [
                { key: "signups", label: "报名列表" },
                ...(record.status !== "作废" ? [{ key: "void", label: "作废", danger: true }] : [])
              ],
              onClick: ({ key }) => {
                if (key === "signups") onViewSignups(record.id);
                if (key === "void") voidActivity(record);
              }
            }
          }, e(Button, { type: "link", size: "small", style: { padding: 0 } }, "更多")))
      }
    ];

    const columnMenu = e(Checkbox.Group, {
      value: visibleColumns,
      onChange: setVisibleColumns,
      className: "column-menu"
    }, Object.entries(columnMap).map(([key, column]) => e(Checkbox, { key, value: key }, column.title)));

    return e("section", { className: "page-surface" },
      e("div", { className: "toolbar" },
        e(Space, { wrap: true },
          e(Input, {
            value: keyword,
            onChange: event => setKeyword(event.target.value),
            onPressEnter: () => { setPage(1); message.success(`查询到 ${filtered.length} 条活动`); },
            placeholder: "请输入活动名称关键词",
            allowClear: true,
            className: "keyword-input"
          }),
          e(Select, {
            value: statusFilter,
            onChange: value => { setStatusFilter(value); setPage(1); },
            placeholder: "选择状态",
            allowClear: true,
            className: "select-input",
            options: statusOptions.map(value => ({ value, label: value }))
          }),
          e(Select, {
            value: typeFilter,
            onChange: value => { setTypeFilter(value); setPage(1); },
            placeholder: "全部类型",
            allowClear: true,
            className: "select-input",
            options: activityTypeOptions.map(value => ({ value, label: value }))
          }),
          e(Button, { type: "primary", onClick: () => { setPage(1); message.success(`查询到 ${filtered.length} 条活动`); } }, "查询"),
          e(Button, { onClick: () => { setKeyword(""); setStatusFilter(undefined); setTypeFilter(undefined); setPage(1); message.success("筛选已重置"); } }, "重置")),
        e(Space, null,
          e(Button, { type: "primary", onClick: () => setModalState({ open: true, mode: "add", record: null }) }, "创建"),
          e(Dropdown, { trigger: ["click"], dropdownRender: () => e("div", { className: "dropdown-panel" }, columnMenu) },
            e(Button, null, "列设置")))),
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
        scroll: { x: 1630 }
      }),
      e(PublishConfirmModal, {
        open: !!publishTarget,
        onCancel: () => setPublishTarget(null),
        onConfirm: confirmPublish
      }),
      e(ActivityDrawer, {
        open: modalState.open,
        mode: modalState.mode,
        record: modalState.record,
        onCancel: () => setModalState({ open: false, mode: "add", record: null }),
        onSave: saveActivity
      })
    );
  }

  app.ActivityPage = ActivityPage;
})(window.AdminApp);

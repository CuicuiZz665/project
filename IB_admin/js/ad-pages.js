(function registerAdPages(app) {
  const {
    Button,
    Checkbox,
    DatePicker,
    Form,
    Input,
    Modal,
    Popconfirm,
    Radio,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
    message
  } = antd;
  const { Text } = Typography;
  const { TextArea } = Input;
  const e = React.createElement;

  const TARGET_TYPE_OPTIONS = [
    { value: 1, label: "App 内原生路由" },
    { value: 2, label: "外链" }
  ];

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function langLabel(key) {
    const found = (app.mockData.messageLanguages || []).find(item => item.key === key || item.value === key);
    return found ? found.value : key;
  }

  // —— 广告位条目配置 ——

  function AdEntryPage({ entries, setEntries }) {
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [form] = Form.useForm();

    function openCreate() {
      setEditing(null);
      setModalOpen(true);
    }

    function openEdit(record) {
      setEditing(record);
      setModalOpen(true);
    }

    function closeModal() {
      setModalOpen(false);
      setEditing(null);
    }

    async function handleSubmit() {
      const values = await form.validateFields();
      if (editing) {
        setEntries(list => list.map(item => item.id === editing.id ? Object.assign({}, item, values) : item));
        message.success("更新成功");
      } else {
        const nextId = entries.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        setEntries(list => [{ id: nextId, ...values }, ...list]);
        message.success("创建成功");
      }
      closeModal();
    }

    function handleDelete(record) {
      Modal.confirm({
        title: "确认删除该条目?",
        content: e("div", { style: { marginTop: 12 } }, [
          e("div", { key: "name", style: { marginBottom: 4 } }, [e(Text, { strong: true, key: "l" }, "条目名称"), e(Text, { key: "v" }, `：${textOrDash(record.name)}`)]),
          e("div", { key: "id", style: { marginBottom: 4 } }, [e(Text, { strong: true, key: "l" }, "条目标识"), e(Text, { key: "v" }, `：${textOrDash(record.identifier)}`)]),
          e("div", { key: "desc" }, [e(Text, { strong: true, key: "l" }, "条目描述"), e(Text, { key: "v" }, `：${textOrDash(record.description)}`)])
        ]),
        okText: "确认",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk: () => {
          setEntries(list => list.filter(item => item.id !== record.id));
          message.success("删除成功");
        }
      });
    }

    React.useEffect(() => {
      if (modalOpen) {
        if (editing) form.setFieldsValue({ name: editing.name, identifier: editing.identifier, description: editing.description });
        else form.resetFields();
      }
    }, [modalOpen, editing, form]);

    const columns = [
      { title: "ID", dataIndex: "id", width: 80, render: textOrDash },
      { title: "条目名称", dataIndex: "name", render: textOrDash },
      { title: "条目标识", dataIndex: "identifier", render: textOrDash },
      { title: "条目描述", dataIndex: "description", ellipsis: true, render: textOrDash },
      {
        title: "操作",
        key: "actions",
        width: 160,
        fixed: "right",
        render: (_, record) => e(Space, { key: "space", size: "small" }, [
          e(Button, { key: "edit", size: "small", type: "primary", onClick: () => openEdit(record) }, "修改"),
          e(Button, { key: "delete", size: "small", danger: true, type: "primary", onClick: () => handleDelete(record) }, "删除")
        ])
      }
    ];

    return e("section", { key: "ad-entry", className: "page-surface" }, [
      e("div", { key: "toolbar", className: "toolbar", style: { justifyContent: "flex-end" } },
        e(Button, { key: "create", type: "primary", onClick: openCreate }, "新建条目")),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: entries,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 900 },
        locale: { emptyText: "暂无数据" }
      }),
      e(Modal, {
        key: "modal",
        title: editing ? "修改条目" : "新建条目",
        open: modalOpen,
        onOk: handleSubmit,
        onCancel: closeModal,
        okText: "确认",
        cancelText: "取消",
        destroyOnClose: true,
        forceRender: true
      }, e(Form, { form, layout: "vertical" }, [
        e(Form.Item, { key: "name", label: "条目名称", name: "name", rules: [{ required: true, message: "请输入条目名称" }] },
          e(Input, { maxLength: 50, placeholder: "条目名称" })),
        e(Form.Item, { key: "identifier", label: "条目标识", name: "identifier", rules: [{ required: true, message: "请输入条目标识" }] },
          e(Input, { maxLength: 50, placeholder: "条目标识" })),
        e(Form.Item, { key: "description", label: "条目描述", name: "description" },
          e(TextArea, { placeholder: "条目描述", rows: 3, maxLength: 200, showCount: true }))
      ]))
    ]);
  }

  // —— 广告列表：单条平台语言配置行 ——

  function AdLocaleRow({ index, locales, locale, langOptions, moduleOptions, disabled, onChange, onRemove, isMain }) {
    const fileEntry = locale.img_url ? [{ uid: "-1", name: String(locale.img_url).split("/").pop() || "image.png", status: "done" }] : [];
    function updateLocale(patch) {
      onChange(index, patch);
    }
    return e("div", { key: locale.key, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0f0f0" } }, [
      e("div", { key: "lang", style: { width: "8%", flexShrink: 0, textAlign: "center" } },
        e(Select, {
          size: "small",
          style: { width: "90%" },
          value: locale.lang,
          disabled,
          options: langOptions.map(item => ({ label: item.value, value: item.value, disabled: locales.some((other, otherIndex) => otherIndex !== index && other.lang === item.value) })),
          onChange: value => updateLocale({ lang: value })
        })),
      e("div", { key: "image", style: { width: "18%", flexShrink: 0 } },
        e(Upload, {
          accept: "image/*",
          listType: "picture-card",
          fileList: fileEntry,
          showUploadList: { showPreviewIcon: false },
          disabled,
          beforeUpload: () => {
            updateLocale({ img_url: `uploads/ads/${Date.now()}.png` });
            message.success("图片已模拟上传");
            return false;
          },
          onRemove: () => updateLocale({ img_url: undefined })
        }, !fileEntry.length ? e(Text, { type: "secondary", style: { fontSize: 12 } }, "选择图片") : null)),
      e("div", { key: "target-type", style: { width: "17%", flexShrink: 0 } },
        e(Select, {
          size: "small",
          style: { width: "100%" },
          value: locale.target_type,
          options: TARGET_TYPE_OPTIONS,
          placeholder: "选择类型",
          disabled,
          onChange: value => updateLocale({ target_type: value })
        })),
      e("div", { key: "target", style: { width: "27%", flexShrink: 0 } },
        locale.target_type === 2
          ? e(Input, { size: "small", placeholder: "跳转 URL", disabled, value: locale.link || "", onChange: event => updateLocale({ link: event.target.value }) })
          : locale.target_type === 1
            ? e(Select, {
                size: "small",
                style: { width: "100%" },
                value: locale.target_param,
                options: moduleOptions.map(item => ({ label: item.name || item.module, value: item.module })),
                placeholder: "选择内部模块",
                disabled,
                onChange: value => updateLocale({ target_param: value })
              })
            : e("span", { style: { color: "#bfbfbf", fontSize: 12 } }, "请先选择跳转类型")),
      e("div", { key: "sync", style: { width: "15%", flexShrink: 0, textAlign: "center" } },
        !isMain && !disabled ? e(Checkbox, {
          checked: Boolean(locale.useMainLangConfig),
          onChange: event => updateLocale({ useMainLangConfig: event.target.checked })
        }, "同步主语言") : null),
      e("div", { key: "remove", style: { width: "8%", flexShrink: 0, textAlign: "center" } },
        !isMain && locales.length > 1 && !disabled ? e("a", { style: { color: "#ff4d4f", fontSize: 12 }, onClick: () => onRemove(index) }, "移除") : null)
    ]);
  }

  function AdPlatformLocalePanel({ platform, locales, setLocales, langOptions, moduleOptions, mainLang, disabled }) {
    function updateLocale(index, patch) {
      setLocales(list => list.map((item, itemIndex) => itemIndex === index ? Object.assign({}, item, patch) : item));
    }
    function addLocale() {
      setLocales(list => {
        const used = new Set(list.map(item => item.lang));
        const next = langOptions.find(item => !used.has(item.value));
        return next ? [...list, { lang: next.value }] : list;
      });
    }
    function removeLocale(index) {
      setLocales(list => list.length <= 1 ? list : list.filter((_, itemIndex) => itemIndex !== index));
    }
    return e("div", { key: platform, style: { marginTop: 16 } }, [
      e("div", {
        key: "header",
        style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "2px solid #f0f0f0", fontWeight: 500, color: "#595959" }
      }, [
        e("div", { key: "lang", style: { width: "8%", textAlign: "center" } }, "语言"),
        e("div", { key: "image", style: { width: "18%" } }, "图片素材"),
        e("div", { key: "type", style: { width: "17%" } }, "跳转类型"),
        e("div", { key: "target", style: { width: "27%" } }, "跳转链接/模块"),
        e("div", { key: "quick", style: { width: "15%", textAlign: "center" } }, "快捷设置"),
        e("div", { key: "actions", style: { width: "8%", textAlign: "center" } }, "操作")
      ]),
      locales.map((locale, index) => e(AdLocaleRow, {
        key: `${platform}-${index}`,
        index,
        locale,
        locales,
        langOptions,
        moduleOptions,
        disabled,
        isMain: locale.lang === mainLang,
        onChange: updateLocale,
        onRemove: removeLocale
      })),
      !disabled ? e("div", { key: "add", style: { padding: "12px 0" } },
        e("a", { onClick: addLocale }, "+ 新增语言配置")) : null
    ]);
  }

  function AdFormModal({ open, mode, record, entries, platforms, modules, onCancel, onSave }) {
    const [form] = Form.useForm();
    const [activePlatforms, setActivePlatforms] = React.useState([]);
    const [activeTab, setActiveTab] = React.useState();
    // localeConfigsByPlatform: { iOS: [{lang, img_url, target_type, link, target_param, useMainLangConfig}] }
    const [localeConfigsByPlatform, setLocaleConfigsByPlatform] = React.useState({});
    const langOptions = app.mockData.messageLanguages || [];
    const mainLang = langOptions[0]?.value || "英语";
    const viewOnly = mode === "view";

    React.useEffect(() => {
      if (!open) return;
      if (record) {
        form.setFieldsValue({
          identifier: record.identifier,
          name: mode === "copy" ? `${record.name}-副本` : record.name,
          description: record.description,
          start_time: record.start_time ? dayjs(record.start_time) : undefined,
          end_time: record.end_time ? dayjs(record.end_time) : undefined
        });
        const grouped = {};
        (record.locale_configs || []).forEach(config => {
          if (!grouped[config.platform]) grouped[config.platform] = [];
          grouped[config.platform].push({ ...config });
        });
        activePlatforms.forEach(platform => {
          if (!grouped[platform]) grouped[platform] = [{ lang: mainLang }];
        });
        setActivePlatforms(record.platform || []);
        setLocaleConfigsByPlatform(grouped);
        setActiveTab((record.platform || [])[0]);
      } else {
        form.resetFields();
        setActivePlatforms([]);
        setLocaleConfigsByPlatform({});
        setActiveTab(undefined);
      }
    }, [open, mode, record, form]);

    function setLocalesOf(platform) {
      return list => setLocaleConfigsByPlatform(prev => Object.assign({}, prev, { [platform]: list }));
    }

    function togglePlatform(checkedValues) {
      setActivePlatforms(checkedValues);
      setLocaleConfigsByPlatform(prev => {
        const next = {};
        checkedValues.forEach(platform => {
          next[platform] = prev[platform] && prev[platform].length ? prev[platform] : [{ lang: mainLang }];
        });
        return next;
      });
      if (!checkedValues.includes(activeTab)) setActiveTab(checkedValues[0]);
    }

    async function handleOk() {
      if (viewOnly) {
        onCancel();
        return;
      }
      const values = await form.validateFields();
      if (!activePlatforms.length) {
        message.error("请至少选择一个投放平台");
        return;
      }
      const localeConfigs = [];
      activePlatforms.forEach(platform => {
        const locales = localeConfigsByPlatform[platform] || [];
        const mainConfig = locales.find(item => item.lang === mainLang);
        locales.forEach(locale => {
          if (locale.useMainLangConfig && mainConfig) {
            localeConfigs.push(Object.assign({}, mainConfig, { lang: locale.lang, platform, useMainLangConfig: true }));
            return;
          }
          localeConfigs.push({
            lang: locale.lang,
            platform,
            img_url: locale.img_url,
            target_type: locale.target_type,
            link: locale.target_type === 2 ? locale.link : undefined,
            target_param: locale.target_type === 1 ? locale.target_param : undefined
          });
        });
      });
      onSave({
        identifier: values.identifier,
        name: values.name,
        description: values.description,
        start_time: values.start_time ? values.start_time.format("YYYY-MM-DD HH:mm:ss") : "",
        end_time: values.end_time ? values.end_time.format("YYYY-MM-DD HH:mm:ss") : "",
        platform: activePlatforms,
        locale_configs: localeConfigs
      });
    }

    const title = mode === "edit" ? "编辑广告" : mode === "view" ? "查看广告" : record ? "复制广告" : "新建广告";

    const tabItems = activePlatforms.map(platform => ({
      key: platform,
      label: `${platform} 配置`,
      children: e(AdPlatformLocalePanel, {
        platform,
        locales: localeConfigsByPlatform[platform] || [],
        setLocales: setLocalesOf(platform),
        langOptions,
        moduleOptions: modules,
        mainLang,
        disabled: viewOnly
      })
    }));

    return e(Modal, {
      open,
      title,
      onOk: handleOk,
      onCancel,
      confirmLoading: false,
      centered: true,
      width: 1100,
      okText: viewOnly ? "关闭" : "确认",
      cancelText: "取消",
      styles: { body: { maxHeight: "70vh", overflow: "auto" } }
    }, [
      e(Form, { key: "form", form, layout: "horizontal", style: { maxWidth: 600 } }, [
        e(Form.Item, { key: "identifier", label: "关联条目", name: "identifier", rules: [{ required: true, message: "请选择条目" }] },
          e(Select, {
            placeholder: "请选择条目",
            options: entries.map(item => ({ label: item.name ? `${item.name} (#${item.identifier})` : `#${item.identifier}`, value: item.identifier })),
            disabled: viewOnly
          })),
        e(Form.Item, { key: "name", label: "广告名称", name: "name", rules: [{ required: true, message: "请输入广告名称" }] },
          e(Input, { placeholder: "请输入广告名称", maxLength: 80, disabled: viewOnly })),
        e(Form.Item, { key: "description", label: "广告描述", name: "description" },
          e(TextArea, { placeholder: "请输入广告描述", maxLength: 200, rows: 2, showCount: true, disabled: viewOnly })),
        e(Form.Item, { key: "start", label: "上线日期", name: "start_time", rules: [{ required: true, message: "请选择上线日期" }] },
          e(DatePicker, { showTime: true, style: { width: "100%" }, disabled: viewOnly })),
        e(Form.Item, {
          key: "end",
          label: "下线日期",
          name: "end_time",
          rules: [
            { required: true, message: "请选择下线日期" },
            { validator: (_, value) => (value && form.getFieldValue("start_time") && value.isBefore(form.getFieldValue("start_time")))
              ? Promise.reject(new Error("下线日期必须晚于上线日期"))
              : Promise.resolve() }
          ]
        },
          e(DatePicker, { showTime: true, style: { width: "100%" }, disabled: viewOnly })),
        e(Form.Item, {
          key: "platform",
          label: "投放平台",
          required: true,
          rules: [{ validator: () => !activePlatforms.length ? Promise.reject(new Error("请至少选择一个投放平台")) : Promise.resolve() }]
        },
          e(Checkbox.Group, {
            options: platforms.map(item => ({ label: item.label, value: item.code })),
            value: activePlatforms,
            onChange: togglePlatform,
            disabled: viewOnly
          }))
      ]),
      tabItems.length ? e(antd.Tabs, { key: "tabs", activeKey: activeTab, onChange: setActiveTab, items: tabItems }) : null
    ]);
  }

  function AdListPage({ ads, setAds, entries }) {
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({ identifier: undefined, platform: undefined, status: undefined });
    const [modalOpen, setModalOpen] = React.useState(false);
    const [mode, setMode] = React.useState("create");
    const [editing, setEditing] = React.useState(null);
    const platforms = app.mockData.adPlatformOptions || [];
    const statusOptions = app.mockData.adStatusOptions || [];
    const modules = app.mockData.adInternalModules || [];

    function applyFilters(values) {
      setApplied({ identifier: values.identifier, platform: values.platform, status: values.status });
    }

    const filtered = (ads || []).filter(ad =>
      (!applied.identifier || ad.identifier === applied.identifier)
      && (!applied.platform || (ad.platform || []).includes(applied.platform))
      && (applied.status === undefined || applied.status === null || applied.status === "" || ad.status === applied.status)
    );

    function openCreate() {
      if (!entries.length) {
        message.warning("请选择条目后再新建广告");
        return;
      }
      setMode("create");
      setEditing(null);
      setModalOpen(true);
    }
    function openModal(nextMode, record) {
      setMode(nextMode);
      setEditing(record || null);
      setModalOpen(true);
    }
    function closeModal() {
      setModalOpen(false);
      setEditing(null);
    }

    function handleSave(payload) {
      if (mode === "edit" && editing) {
        setAds(list => list.map(item => item.id === editing.id ? Object.assign({}, item, payload, { operate_user_name: "Bella" }) : item));
        message.success("修改广告成功");
      } else {
        const nextId = ads.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        const entry = entries.find(item => item.identifier === payload.identifier);
        const isOpen = payload.start_time <= dayjs().format("YYYY-MM-DD HH:mm:ss") && payload.end_time >= dayjs().format("YYYY-MM-DD HH:mm:ss");
        setAds(list => [{
          id: nextId,
          ...payload,
          operate_user_name: "Bella",
          status: isOpen ? 1 : 0,
          status_name: isOpen ? "启用" : "禁用"
        }, ...list]);
        message.success("新建广告成功");
      }
      closeModal();
    }

    function handleDelete(record) {
      Modal.confirm({
        title: "确认删除该广告？",
        content: e(Space, { key: "space", orientation: "vertical", className: "mx-u-w-full" }, [
          e(Text, { key: "id-l", strong: true }, "ID:"),
          e(Text, { key: "id-v" }, record.id ?? "-"),
          e(Text, { key: "name-l", strong: true }, "名称:"),
          e(Text, { key: "name-v" }, record.name ?? "-")
        ]),
        okText: "确认",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk: () => {
          setAds(list => list.filter(item => item.id !== record.id));
          message.success("删除成功");
        }
      });
    }

    const columns = [
      { title: "ID", dataIndex: "id", width: 80, render: textOrDash },
      { title: "名称", dataIndex: "name", width: 150, render: textOrDash },
      { title: "条目标识", dataIndex: "identifier", width: 120, render: textOrDash },
      { title: "投放平台", dataIndex: "platform", width: 100, render: value => textOrDash(Array.isArray(value) ? value.join("、") : value) },
      { title: "描述", dataIndex: "description", ellipsis: true, width: 150, render: textOrDash },
      { title: "上线日期", dataIndex: "start_time", width: 200, render: textOrDash },
      { title: "下线日期", dataIndex: "end_time", width: 200, render: textOrDash },
      {
        title: "配置语言",
        key: "languages",
        width: 150,
        render: (_, record) => {
          const langs = [...new Set((record.locale_configs || []).map(config => config.lang).filter(Boolean))];
          return langs.length ? e(Space, { size: 4, wrap: true }, langs.map(lang => e(Tag, { key: lang, color: "blue" }, langLabel(lang)))) : "-";
        }
      },
      { title: "配置人", dataIndex: "operate_user_name", width: 100, render: textOrDash },
      {
        title: "状态",
        dataIndex: "status_name",
        width: 80,
        fixed: "right",
        render: value => value === "-" ? value : e(Tag, { color: value === "启用" ? "success" : "default" }, value)
      },
      {
        title: "操作",
        key: "actions",
        width: 150,
        fixed: "right",
        render: (_, record) => e(Space, { size: "small" }, [
          e(Button, { key: "edit", size: "small", type: "primary", onClick: event => { event.stopPropagation(); openModal("edit", record); } }, "修改"),
          e(Button, { key: "copy", size: "small", onClick: event => { event.stopPropagation(); openModal("create", record); } }, "复制"),
          e(Button, { key: "delete", size: "small", danger: true, type: "primary", onClick: event => { event.stopPropagation(); handleDelete(record); } }, "删除")
        ])
      }
    ];

    return e("section", { key: "ad-list", className: "page-surface" }, [
      e(Form, {
        key: "filters",
        form,
        layout: "inline",
        className: "toolbar",
        onFinish: applyFilters
      }, [
        e(Form.Item, { key: "identifier", label: "条目标识" },
          e(Select, {
            placeholder: "请选择条目",
            options: entries.map(item => ({ label: item.name ? `${item.name} (${item.identifier})` : item.identifier, value: item.identifier })),
            allowClear: true,
            showSearch: true,
            optionFilterProp: "label",
            style: { width: 200 }
          })),
        e(Form.Item, { key: "platform", label: "投放平台" },
          e(Select, { placeholder: "请选择平台", options: platforms.map(item => ({ label: item.label, value: item.code })), allowClear: true, style: { width: 160 } })),
        e(Form.Item, { key: "status", label: "状态" },
          e(Select, { placeholder: "请选择状态", options: statusOptions.map(item => ({ label: item.label, value: item.code })), allowClear: true, style: { width: 160 } })),
        e(Form.Item, { key: "actions" },
          e(Space, null, [
            e(Button, { key: "search", type: "primary", htmlType: "submit" }, "查询"),
            e(Button, { key: "reset", onClick: () => { form.resetFields(); setApplied({ identifier: undefined, platform: undefined, status: undefined }); } }, "重置")
          ]))
      ]),
      e("div", { key: "toolbar", style: { marginBottom: 12 } },
        e(Button, { type: "primary", onClick: openCreate }, "新建广告")),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1600 },
        locale: { emptyText: "暂无广告" },
        onRow: record => ({ onClick: () => openModal("view", record), style: { cursor: "pointer" } })
      }),
      e(AdFormModal, {
        key: "modal",
        open: modalOpen,
        mode,
        record: editing,
        entries,
        platforms,
        modules,
        onCancel: closeModal,
        onSave: handleSave
      })
    ]);
  }

  app.AdEntryPage = AdEntryPage;
  app.AdListPage = AdListPage;
})(window.AdminApp);

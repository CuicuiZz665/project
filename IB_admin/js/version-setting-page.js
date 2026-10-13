(function registerVersionSettingPage(app) {
  const {
    Button,
    Card,
    Collapse,
    Descriptions,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Select,
    Skeleton,
    Space,
    Tag,
    Typography,
    message
  } = antd;
  const { Text, Title } = Typography;
  const { TextArea } = Input;
  const e = React.createElement;

  function textOrDash(value) {
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function langLabel(key) {
    const found = (app.mockData.messageLanguages || []).find(item => item.key === key || item.value === key);
    return found ? found.value : key;
  }

  const PLATFORM_ICONS = {
    miniapp: "🧩",
    testflight: "✈️",
    ios: "",
    android: "🤖",
    web: "🌐"
  };

  const FORCE_UPDATE_MAP = {
    1: { label: "是", color: "green" },
    0: { label: "否", color: "red" }
  };

  function fieldBox(label, children, full) {
    return e("div", {
      style: full
        ? { minWidth: 0, padding: "10px 12px", border: "1px solid #f0f0f0", borderRadius: 6, background: "#fafafa", gridColumn: "1 / -1" }
        : { minWidth: 0, padding: "10px 12px", border: "1px solid #f0f0f0", borderRadius: 6, background: "#fafafa" }
    }, [
      e(Text, { key: "label", type: "secondary" }, label),
      e("div", { key: "value", style: { minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" } }, children)
    ]);
  }

  function ReleaseLocaleBlock({ locale }) {
    return e("div", {
      style: { padding: 12, border: "1px solid #f0f0f0", borderRadius: 6, background: "#fafafa" }
    }, [
      e("div", { key: "head", style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } },
        e(Text, { strong: true }, langLabel(locale.lang))),
      e(Space, { key: "body", direction: "vertical", size: 8 }, [
        e("div", { key: "title" }, [
          e(Text, { key: "l", type: "secondary" }, "标题"),
          e("div", { key: "v" }, textOrDash(locale.title))
        ]),
        e("div", { key: "desc" }, [
          e(Text, { key: "l", type: "secondary" }, "描述"),
          e("div", { key: "v", style: { whiteSpace: "pre-wrap" } }, textOrDash(locale.description))
        ])
      ])
    ]);
  }

  function ReleaseCard({ release, platformLabel, onCreateForPlatform, onEdit }) {
    const locales = Array.isArray(release.locale_configs) ? release.locale_configs : [];
    const force = FORCE_UPDATE_MAP[release.is_forced_update];
    return e(Card, {
      title: e("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 } }, [
        e("span", {
          style: {
            width: 34, height: 34, borderRadius: 8, display: "inline-flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flex: "0 0 auto", background: "#f5f5f5"
          }
        }, PLATFORM_ICONS[release.platform] || "📦"),
        e(Space, { key: "meta", direction: "vertical", size: 0, style: { minWidth: 0 } }, [
          e(Text, { strong: true }, platformLabel),
          e("div", null, [
            e(Text, { type: "secondary" }, "强制更新："),
            e(Tag, { color: force?.color }, force?.label ?? textOrDash(release.is_forced_update))
          ])
        ])
      ]),
      styles: { header: { borderBottom: "1px solid #f0f0f0", background: "#fafafa" } },
      extra: e(Space, { size: "small" }, [
        e(Button, { key: "create", type: "primary", size: "small", onClick: () => onCreateForPlatform(release.platform) }, "新建版本"),
        e(Button, { key: "edit", size: "small", onClick: () => onEdit(release) }, "修改")
      ])
    }, [
      e("div", {
        key: "version-grid",
        style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, padding: 12, minWidth: 0 }
      }, [
        e("div", { key: "version", style: { padding: "12px 14px", border: "1px solid #f0f0f0", borderRadius: 6, background: "#fafafa" } }, [
          e(Text, { key: "l", type: "secondary" }, "版本号"),
          e(Title, { key: "v", level: 5, style: { margin: 0 } }, textOrDash(release.version))
        ]),
        e("div", { key: "build", style: { padding: "12px 14px", border: "1px solid #f0f0f0", borderRadius: 6, background: "#fafafa" } }, [
          e(Text, { key: "l", type: "secondary" }, "构建号"),
          e(Title, { key: "v", level: 5, style: { margin: 0 } }, textOrDash(release.build_number))
        ])
      ]),
      e(Space, { key: "meta", direction: "vertical", size: 16, style: { padding: 16, width: "100%", boxSizing: "border-box" } }, [
        e("div", {
          key: "info-grid",
          style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 12, minWidth: 0 }
        }, [
          fieldBox("下载地址", release.download_url
            ? e("a", { href: release.download_url, target: "_blank", rel: "noreferrer" }, release.download_url)
            : textOrDash(release.download_url), true),
          fieldBox("创建时间(GMT+0)", textOrDash(release.created_at)),
          fieldBox("更新时间(GMT+0)", textOrDash(release.updated_at))
        ]),
        e(Space, { key: "locales", direction: "vertical", size: 12, style: { width: "100%" } }, [
          e(Text, { key: "title", strong: true }, "多语言配置"),
          locales.length
            ? e(React.Fragment, { key: "list" }, [
                e(ReleaseLocaleBlock, { key: "first", locale: locales[0] }),
                locales.length > 1 ? e(Collapse, {
                  key: "rest",
                  bordered: false,
                  size: "small",
                  style: { background: "transparent" },
                  items: locales.slice(1).map((locale, index) => ({
                    key: String(index),
                    label: langLabel(locale.lang),
                    children: e(ReleaseLocaleBlock, { locale })
                  }))
                }) : null
              ])
            : e(Empty, { key: "empty", image: Empty.PRESENTED_IMAGE_SIMPLE, description: "暂无多语言配置" })
        ])
      ])
    ]);
  }

  function VersionSettingPage({ releases, setReleases }) {
    const [modalOpen, setModalOpen] = React.useState(false);
    const [mode, setMode] = React.useState("create");
    const [editing, setEditing] = React.useState(null);
    const [lockedPlatform, setLockedPlatform] = React.useState(null);
    const [form] = Form.useForm();

    const platformOptions = app.mockData.releasePlatformOptions || [];
    const languages = app.mockData.messageLanguages || [];
    const languageOptions = languages.map(item => ({ value: item.key ?? item.value ?? "", label: item.value ?? item.label ?? "-" })).filter(item => item.value);

    function openCreate(platform) {
      setMode("create");
      setEditing(null);
      setLockedPlatform(platform ?? null);
      setModalOpen(true);
    }
    function openEdit(record) {
      setMode("edit");
      setEditing(record);
      setLockedPlatform(null);
      setModalOpen(true);
    }
    function closeForm() {
      setModalOpen(false);
      setEditing(null);
      setLockedPlatform(null);
      form.resetFields();
    }

    React.useEffect(() => {
      if (!modalOpen) return;
      if (mode === "edit" && editing) {
        form.setFieldsValue({
          platform: editing.platform,
          version: editing.version,
          build_number: editing.build_number,
          is_forced_update: editing.is_forced_update,
          download_url: editing.download_url,
          locale_configs: editing.locale_configs
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          is_forced_update: 0,
          locale_configs: [{ lang: languageOptions[0]?.value, title: "", description: "" }]
        });
      }
    }, [modalOpen, mode, editing, form]);

    function handleSubmit() {
      form.validateFields().then(values => {
        if (mode === "edit" && editing) {
          setReleases(list => list.map(item => item.id === editing.id ? Object.assign({}, item, {
            is_forced_update: values.is_forced_update,
            download_url: values.download_url,
            locale_configs: values.locale_configs,
            updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss")
          }) : item));
          message.success("版本更新成功");
        } else {
          const nextId = releases.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          const platformLabel = platformOptions.find(item => item.code === values.platform)?.label || values.platform;
          setReleases(list => [...list, {
            id: nextId,
            platform: values.platform,
            version: values.version,
            build_number: values.build_number,
            is_forced_update: values.is_forced_update,
            download_url: values.download_url,
            created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            locale_configs: values.locale_configs,
            _platformLabel: platformLabel
          }]);
          message.success("版本新增成功");
        }
        closeForm();
      }).catch(() => {});
    }

    function platformLabelOf(code) {
      return platformOptions.find(item => item.code === code)?.label || code;
    }

    const isEdit = mode === "edit";
    const platformDisabled = isEdit || Boolean(lockedPlatform);

    return e("section", { key: "version-setting", className: "page-surface" }, [
      e("div", { key: "header", className: "toolbar" }, [
        e("div", { key: "title" }, e(Title, { level: 4, style: { margin: 0 } }, "版本设置")),
        e(Button, { key: "create", type: "primary", onClick: () => openCreate(null) }, "新增版本")
      ]),
      e("div", {
        key: "cards",
        style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: 16, minWidth: 0, marginTop: 16, overflow: "auto" }
      },
        releases.map(release => e(ReleaseCard, {
          key: release.id,
          release,
          platformLabel: release._platformLabel || platformLabelOf(release.platform),
          onCreateForPlatform: openCreate,
          onEdit: openEdit
        }))),
      e(Modal, {
        key: "modal",
        open: modalOpen,
        destroyOnClose: true,
        width: 760,
        title: isEdit ? "修改版本" : "新增版本",
        okText: isEdit ? "修改" : "新增",
        cancelText: "取消",
        confirmLoading: false,
        onCancel: closeForm,
        onOk: handleSubmit,
        styles: { body: { maxHeight: "72vh", overflow: "auto" } }
      }, e(Form, { form, layout: "vertical" }, [
        e(Form.Item, { key: "platform", label: "平台", name: "platform", rules: [{ required: true, message: "请选择平台" }] },
          e(Select, {
            disabled: platformDisabled,
            options: platformOptions.map(item => ({ value: item.code, label: item.label || item.code })),
            placeholder: "请选择平台",
            onChange: value => {
              if (value !== "testflight") form.setFieldValue("build_number", 0);
            }
          })),
        e(Form.Item, { key: "version", label: "版本号", name: "version", rules: [{ required: true, message: "请输入版本号" }] },
          e(Input, { disabled: isEdit, placeholder: "请输入版本号" })),
        e(Form.Item, {
          key: "build",
          label: "构建号",
          name: "build_number",
          dependencies: ["platform"],
          rules: [
            { required: true, message: "请输入构建号" },
            { validator: (_, value) => {
                const platform = form.getFieldValue("platform");
                const next = value ?? 0;
                if (platform === "testflight" && next <= 0) return Promise.reject(new Error("TestFlight 构建号必须大于 0"));
                if (platform && platform !== "testflight" && next !== 0) return Promise.reject(new Error("非 TestFlight 平台构建号必须为 0"));
                return Promise.resolve();
              } }
          ]
        },
          e(InputNumber, { min: 0, precision: 0, disabled: isEdit, style: { width: "100%" }, placeholder: "请输入构建号" })),
        e(Form.Item, { key: "forced", label: "强制更新", name: "is_forced_update", rules: [{ required: true, message: "请选择是否强更" }] },
          e(Radio.Group, { options: [{ value: 1, label: "是" }, { value: 0, label: "否" }] })),
        e(Form.Item, { key: "download", label: "下载地址", name: "download_url" },
          e(Input, { placeholder: "下载地址" })),
        e(Form.List, {
          key: "locales",
          name: "locale_configs",
          rules: [{
            validator: (_, value) => (!value || value.length === 0)
              ? Promise.reject(new Error("请至少添加一条多语言配置"))
              : Promise.resolve()
          }]
        }, (fields, { add, remove }) => e("div", null, [
          e(Text, { key: "label", strong: true }, "多语言配置"),
          e("div", { key: "hint", style: { height: 8 } }),
          fields.map(field => e("div", {
            key: field.key,
            style: { border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, marginBottom: 12 }
          }, [
            e("div", { key: "row-lang", style: { display: "flex", gap: 8, alignItems: "flex-start" } }, [
              e(Form.Item, {
                key: "lang",
                name: [field.name, "lang"],
                label: "语言",
                rules: [{ required: true, message: "请选择语言" }],
                style: { marginBottom: 8, flex: 1 }
              },
                e(Select, {
                  options: languageOptions.map(option => ({
                    ...option,
                    disabled: (form.getFieldValue("locale_configs") || []).some((row, index) => index !== field.name && row && row.lang === option.value)
                  })),
                  placeholder: "请选择语言"
                })),
              fields.length > 1 ? e(Button, {
                key: "remove",
                type: "link",
                danger: true,
                onClick: () => remove(field.name)
              }, "删除") : null
            ]),
            e(Form.Item, {
              key: "title",
              name: [field.name, "title"],
              label: "标题",
              rules: [{ required: true, message: "请输入标题" }],
              style: { marginBottom: 8 }
            },
              e(Input, { placeholder: "请输入标题" })),
            e(Form.Item, {
              key: "description",
              name: [field.name, "description"],
              label: "描述",
              rules: [{ required: true, message: "请输入描述" }],
              style: { marginBottom: 0 }
            },
              e(TextArea, { rows: 3, placeholder: "请输入描述" }))
          ])),
          e(Button, {
            key: "add",
            type: "dashed",
            block: true,
            onClick: () => add({ lang: undefined, title: "", description: "" })
          }, "+ 新增语言配置")
        ]))
      ]))
    ]);
  }

  app.VersionSettingPage = VersionSettingPage;
})(window.AdminApp);

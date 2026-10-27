(function registerNetworkConfigPage(app) {
  const {
    Badge,
    Button,
    Card,
    Form,
    Modal,
    Select,
    Space,
    Table,
    message
  } = antd;
  const e = React.createElement;
  const { textOrDash, ProgressiveFilters } = app.financeShared;

  // 网络行：PSP 通道选项依赖所选网络，须响应式监听
  function NetworkRow({ form, field, isEdit, networkOptions, channelsByNetwork, onRemove }) {
    const network = Form.useWatch(["network_rows", field.name, "network"], form);
    const channelOptions = (channelsByNetwork[network] || []).map(item => ({ label: item.name, value: item.code }));
    return e("div", {
      key: field.key,
      style: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }
    }, [
      e(Form.Item, {
        key: "network",
        label: "网络",
        name: [field.name, "network"],
        rules: [{ required: true, message: "必填" }],
        style: { marginBottom: 0 }
      },
        e(Select, {
          options: networkOptions,
          placeholder: "请选择",
          style: { width: 200 },
          disabled: isEdit,
          onChange: () => form.setFieldValue(["network_rows", field.name, "channel"], undefined)
        })),
      e(Form.Item, {
        key: "channel",
        label: "PSP通道",
        name: [field.name, "channel"],
        rules: network ? [{ required: true, message: "必填" }] : [],
        style: { marginBottom: 0 }
      },
        e(Select, { options: channelOptions, placeholder: "请选择", style: { width: 200 }, disabled: !network })),
      !isEdit && onRemove ? e(Button, {
        key: "remove",
        danger: true,
        size: "small",
        onClick: onRemove
      }, "删除") : null
    ]);
  }

  function NetworkConfigPage({ configs, setConfigs }) {
    const [form] = Form.useForm();
    const [applied, setApplied] = React.useState({});
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [viewRecord, setViewRecord] = React.useState(null);
    const [modalForm] = Form.useForm();

    const options = app.mockData.networkConfigOptions || {};
    const channelsByNetwork = app.mockData.channelsByNetwork || {};
    const configTypeOptions = (options.config_types || []).map(item => ({ label: item.name, value: item.code }));
    const currencyOptions = (options.currencies || []).map(item => ({ label: item.name, value: item.code }));
    const networkOptions = (options.networks || []).map(item => ({ label: item.name, value: item.code }));

    const filtered = (configs || []).filter(row =>
      (!applied.config_type || row.config_type === applied.config_type)
      && (!applied.network || row.network === applied.network)
      && (!applied.status || row.status === applied.status)
      && (!applied.channel || row.channel === applied.channel)
    );

    function openCreate() {
      setEditing(null);
      setModalOpen(true);
    }
    function openEdit(record) {
      setEditing(record);
      setModalOpen(true);
    }

    React.useEffect(() => {
      if (!modalOpen) return;
      if (editing) {
        modalForm.setFieldsValue({
          config_type: editing.config_type,
          currency: editing.currency,
          network_rows: [{ network: editing.network, channel: editing.channel }]
        });
      } else {
        modalForm.resetFields();
        modalForm.setFieldsValue({ network_rows: [{ network: undefined, channel: undefined }] });
      }
    }, [modalOpen, editing, modalForm]);

    function closeModal() {
      setModalOpen(false);
      setEditing(null);
    }

    function handleSubmit() {
      modalForm.validateFields().then(values => {
        const rows = values.network_rows || [];
        if (editing) {
          setConfigs(list => list.map(item => {
            if (item.id !== editing.id) return item;
            const row = rows[0] || {};
            return Object.assign({}, item, {
              currency: values.currency,
              network: row.network,
              network_text: (options.networks || []).find(net => net.code === row.network)?.name || row.network,
              channel: row.channel,
              channel_text: (channelsByNetwork[row.network] || []).find(ch => ch.code === row.channel)?.name || row.channel,
              updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              operator_name: "Bella"
            });
          }));
          message.success("保存成功");
        } else {
          const nextId = configs.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          const newRecords = rows.map((row, index) => ({
            id: nextId + index,
            currency: values.currency,
            config_type: values.config_type,
            config_type_text: (options.config_types || []).find(item => item.code === values.config_type)?.name || values.config_type,
            network: row.network,
            network_text: (options.networks || []).find(net => net.code === row.network)?.name || row.network,
            channel: row.channel,
            channel_text: (channelsByNetwork[row.network] || []).find(ch => ch.code === row.channel)?.name || row.channel,
            status: "disabled",
            status_text: "已停用",
            updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            operator_name: "Bella"
          }));
          setConfigs(list => [...newRecords, ...list]);
          message.success("创建成功");
        }
        closeModal();
      }).catch(() => {});
    }

    function enableConfig(record) {
      Modal.confirm({
        title: "确认启用",
        okText: "确认",
        cancelText: "取消",
        onOk: () => {
          setConfigs(list => list.map(item => item.id === record.id
            ? Object.assign({}, item, { status: "enabled", status_text: "已启用", updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss") })
            : item));
          message.success("已启用");
        }
      });
    }
    function disableConfig(record) {
      Modal.confirm({
        title: "确认停用",
        okText: "确认",
        cancelText: "取消",
        onOk: () => {
          setConfigs(list => list.map(item => item.id === record.id
            ? Object.assign({}, item, { status: "disabled", status_text: "已停用", updated_at: dayjs().format("YYYY-MM-DD HH:mm:ss") })
            : item));
          message.success("已停用");
        }
      });
    }
    function deleteConfig(record) {
      Modal.confirm({
        title: "确认删除",
        okText: "确认",
        cancelText: "取消",
        okButtonProps: { danger: true },
        onOk: () => {
          setConfigs(list => list.filter(item => item.id !== record.id));
          message.success("删除成功");
        }
      });
    }

    const columns = [
      { title: "币种", dataIndex: "currency", width: 80 },
      { title: "配置类型", dataIndex: "config_type_text", width: 100 },
      { title: "网络", dataIndex: "network_text", width: 120 },
      { title: "PSP通道", dataIndex: "channel_text", width: 120 },
      {
        title: "配置状态", dataIndex: "status_text", width: 100,
        render: (value, record) => e(Badge, { status: record.status === "enabled" ? "success" : "default", text: value })
      },
      { title: "更新时间", dataIndex: "updated_at", width: 160 },
      { title: "操作人", dataIndex: "operator_name", width: 100 },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 260,
        render: (_, record) => e(Space, { size: "small" }, [
          e(Button, { key: "edit", size: "small", type: "primary", onClick: () => openEdit(record) }, "修改"),
          e(Button, { key: "view", size: "small", onClick: () => setViewRecord(record) }, "查看"),
          record.status !== "enabled"
            ? e(Button, { key: "enable", size: "small", type: "primary", onClick: () => enableConfig(record) }, "启用")
            : e(Button, { key: "disable", size: "small", onClick: () => disableConfig(record) }, "停用"),
          record.status === "enabled"
            ? e(Button, {
                key: "delete",
                size: "small",
                danger: true,
                disabled: true,
                onClick: () => message.warning("请先关闭配置后再执行删除操作")
              }, "删除")
            : e(Button, { key: "delete", size: "small", danger: true, onClick: () => deleteConfig(record) }, "删除")
        ])
      }
    ];

    const secondaryActive = (applied.channel ? 1 : 0);
    const isEdit = Boolean(editing);

    return e("section", { key: "network-config", className: "page-surface" }, [
      e(ProgressiveFilters, {
        key: "filters",
        form,
        activeSecondaryCount: secondaryActive,
        onSubmit: values => setApplied(values),
        onReset: () => { form.resetFields(); setApplied({}); },
        primary: [
          e(Form.Item, { key: "type", label: "配置类型", name: "config_type" },
            e(Select, { allowClear: true, placeholder: "请选择", options: configTypeOptions, style: { width: 160 } })),
          e(Form.Item, { key: "network", label: "网络", name: "network" },
            e(Select, { allowClear: true, placeholder: "请选择", options: networkOptions, style: { width: 160 } })),
          e(Form.Item, { key: "status", label: "配置状态", name: "status" },
            e(Select, { allowClear: true, placeholder: "请选择", options: [
              { label: "已启用", value: "enabled" },
              { label: "已停用", value: "disabled" }
            ], style: { width: 160 } }))
        ],
        secondary: [
          e(Form.Item, { key: "channel", label: "PSP通道", name: "channel" },
            e(Select, {
              allowClear: true,
              placeholder: "请选择",
              style: { minWidth: 200 },
              options: Object.values(channelsByNetwork).flat().map(item => ({ label: item.name, value: item.code }))
            }))
        ]
      }),
      e("div", { key: "toolbar", style: { marginBottom: 12 } },
        e(Button, { type: "primary", onClick: openCreate }, "+ 新增")),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        pagination: { showSizeChanger: true, showTotal: total => `共 ${total} 条` },
        scroll: { x: 1100 },
        locale: { emptyText: "暂无数据" }
      }),
      e(Modal, {
        key: "modal",
        title: isEdit ? "编辑" : "新增",
        open: modalOpen,
        width: 600,
        onCancel: closeModal,
        onOk: handleSubmit,
        okText: isEdit ? "保存" : "创建",
        cancelText: "取消",
        destroyOnClose: true
      }, e(Form, { form: modalForm, layout: "vertical" }, [
        e(Form.Item, { key: "type", label: "配置类型", name: "config_type", rules: [{ required: true, message: "必填" }] },
          e(Select, { options: configTypeOptions, placeholder: "请选择", disabled: isEdit })),
        e(Form.Item, { key: "currency", label: "币种", name: "currency", rules: [{ required: true, message: "必填" }] },
          e(Select, { options: currencyOptions, placeholder: "请选择", disabled: isEdit })),
        e(Form.List, { key: "rows", name: "network_rows" }, (fields, { add, remove }) => e(Card, {
          size: "small",
          title: "网络-通道配置",
          extra: !isEdit ? e(Button, { size: "small", onClick: () => add({ network: undefined, channel: undefined }) }, "+ 添加网络") : null,
          style: { marginBottom: 16 }
        },
          fields.map(field => e(NetworkRow, {
            key: field.key,
            form: modalForm,
            field,
            isEdit,
            networkOptions,
            channelsByNetwork,
            onRemove: fields.length <= 1 ? null : () => remove(field.name)
          }))))
      ])),
      e(Modal, {
        key: "view",
        title: "查看",
        open: Boolean(viewRecord),
        width: 600,
        onCancel: () => setViewRecord(null),
        onOk: () => setViewRecord(null),
        okText: "关闭",
        cancelButtonProps: { style: { display: "none" } },
        destroyOnClose: true
      }, viewRecord ? e("div", null, [
        e("div", { key: "type", style: { marginBottom: 8 } }, `配置类型：${textOrDash(viewRecord.config_type_text)}`),
        e("div", { key: "currency", style: { marginBottom: 8 } }, `币种：${textOrDash(viewRecord.currency)}`),
        e("div", { key: "network", style: { marginBottom: 8 } }, `网络：${textOrDash(viewRecord.network_text)}`),
        e("div", { key: "channel", style: { marginBottom: 8 } }, `PSP通道：${textOrDash(viewRecord.channel_text)}`),
        e("div", { key: "status" }, `配置状态：${textOrDash(viewRecord.status_text)}`)
      ]) : null)
    ]);
  }

  app.NetworkConfigPage = NetworkConfigPage;
})(window.AdminApp);

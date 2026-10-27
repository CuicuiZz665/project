(function registerCouponPage(app) {
  const {
    Button,
    DatePicker,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { Text } = Typography;
  const e = React.createElement;
  const { ListActions, SearchInput } = app.sharedActions;

  const TYPE_OPTIONS = ["抹亏券", "交易返现券", "手续费减免券"];

  function CouponModal({ open, mode, coupon, onCancel, onSave }) {
    const [form] = Form.useForm();
    React.useEffect(() => {
      if (!open) return;
      form.setFieldsValue({
        name: coupon ? mode === "copy" ? `${coupon.name}-副本` : coupon.name : "",
        type: coupon?.type || "抹亏券",
        rule: coupon?.rule || "",
        range: coupon ? [dayjs(coupon.validStart), dayjs(coupon.validEnd)] : undefined,
        stock: coupon?.stock,
        remark: coupon?.remark || ""
      });
    }, [open, mode, coupon, form]);

    async function handleSave() {
      const values = await form.validateFields();
      onSave({
        name: values.name.trim(),
        type: values.type,
        rule: values.rule.trim(),
        validStart: values.range[0].format("YYYY-MM-DD"),
        validEnd: values.range[1].format("YYYY-MM-DD"),
        stock: values.stock,
        remark: values.remark || ""
      });
    }

    return e(Modal, {
      title: mode === "edit" ? "编辑优惠券" : mode === "copy" ? "复制优惠券" : "新增优惠券",
      open: open,
      width: 560,
      footer: null,
      onCancel: onCancel,
      destroyOnClose: true
    }, e(Form, {
      form: form,
      layout: "vertical",
      className: "admin-form"
    }, [
      e(Form.Item, {
        key: "name", name: "name", label: "券名称",
        rules: [{ required: true, message: "请输入券名称" }]
      }, e(Input, { placeholder: "如：抹亏券-XX活动专属" })),
      e("div", { className: "form-grid-antd", key: "grid" }, [
        e(Form.Item, { key: "type", name: "type", label: "券类型" }, e(Select, { options: TYPE_OPTIONS.map(value => ({ value, label: value })) })),
        e(Form.Item, {
          key: "stock", name: "stock", label: "库存（份）",
          rules: [{ required: true, message: "请输入库存" }]
        }, e(InputNumber, { min: 0, precision: 0, className: "full-control" }))
      ]),
      e(Form.Item, {
        key: "rule", name: "rule", label: "面额 / 使用规则",
        rules: [{ required: true, message: "请输入面额或使用规则" }]
      }, e(Input, { placeholder: "如：亏损 10 元以内全额抵扣" })),
      e(Form.Item, {
        key: "range", name: "range", label: "有效期",
        rules: [{ required: true, message: "请选择有效期" }]
      }, e(RangePicker, { format: "YYYY-MM-DD", className: "full-control" })),
      e(Form.Item, { key: "remark", name: "remark", label: "备注" }, e(Input.TextArea, { rows: 2, placeholder: "选填" })),
      e("div", { className: "restriction-modal-footer" }, [
        e(Button, { key: "cancel", onClick: onCancel }, "取 消"),
        e(Button, {
          key: "ok", type: "primary",
          onClick: () => form.validateFields().then(handleSave).catch(() => {})
        }, "保 存")
      ])
    ]));
  }

  function CouponPage({ coupons, setCoupons, wheelActivities }) {
    const [draft, setDraft] = React.useState({ keyword: "", status: null });
    const [applied, setApplied] = React.useState({ keyword: "", status: null });
    const [modalState, setModalState] = React.useState({ open: false, mode: "add", coupon: null });

    const filtered = React.useMemo(() => {
      const term = applied.keyword.trim().toLowerCase();
      return coupons.filter(item => {
        const matchedKeyword = !term || item.name.toLowerCase().includes(term);
        const matchedStatus = !applied.status || item.status === applied.status;
        return matchedKeyword && matchedStatus;
      });
    }, [coupons, applied]);

    const search = () => setApplied({ ...draft });
    const reset = () => {
      setDraft({ keyword: "", status: null });
      setApplied({ keyword: "", status: null });
    };

    // 引用守卫：被抽奖配置下的活动奖池引用的券不允许删除。
    function referencesOf(coupon) {
      return (wheelActivities || []).filter(activity => (activity.prizes || []).some(prize => prize.couponId === coupon.id));
    }

    function saveCoupon(data, mode, source) {
      if (mode === "edit") {
        setCoupons(prev => prev.map(item => item.id === source.id ? {
          ...item, ...data, updatedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`
        } : item));
        message.success("优惠券已修改");
      } else {
        setCoupons(prev => [{
          id: `c${Date.now()}`,
          status: "停用",
          operator: "Amy",
          updatedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
          ...data
        }, ...prev]);
        message.success(mode === "copy" ? "优惠券已复制（默认停用）" : "优惠券已新增");
      }
      setModalState({ open: false, mode: "add", coupon: null });
    }

    function removeCoupon(record) {
      const refs = referencesOf(record);
      if (refs.length) {
        const ref = Modal.confirm({
          title: "无法删除",
          content: `该券已被活动「${refs.map(item => item.name).join("、")}」奖池引用，请先在奖池中移除该奖品后再删除。`,
          okText: "知道了",
          cancelButtonProps: { style: { display: "none" } },
          onOk: () => ref.destroy(),
          onCancel: () => ref.destroy()
        });
        return;
      }
      const ref = Modal.confirm({
        title: "确认删除",
        content: `将删除优惠券「${record.name}」，删除后不可恢复。`,
        okText: "删 除",
        okButtonProps: { danger: true },
        cancelText: "取 消",
        onOk: () => {
          setCoupons(prev => prev.filter(item => item.id !== record.id));
          message.success(`优惠券「${record.name}」已删除`);
          ref.destroy();
        },
        onCancel: () => ref.destroy()
      });
    }

    function toggleStatus(record) {
      const refs = referencesOf(record);
      const next = record.status === "启用" ? "停用" : "启用";
      if (next === "停用" && refs.length) {
        message.warning(`该券正被活动「${refs.map(item => item.name).join("、")}」奖池引用，停用后新抽奖将不可再抽中该奖品`);
      }
      setCoupons(prev => prev.map(item => item.id === record.id ? { ...item, status: next } : item));
      message.success(`优惠券「${record.name}」已${next}`);
    }

    const columns = [
      { title: "券名称", dataIndex: "name", width: 240 },
      { title: "类型", dataIndex: "type", width: 110, render: value => e(Tag, null, value) },
      { title: "面额 / 使用规则", dataIndex: "rule", width: 230, ellipsis: true },
      {
        title: "有效期", key: "valid", width: 200,
        render: (_, record) => e("span", { className: "stacked-muted" }, `${record.validStart} 至 ${record.validEnd}`)
      },
      { title: "剩余库存", dataIndex: "stock", width: 90 },
      {
        title: "状态", dataIndex: "status", width: 90,
        render: (value, record) => e(Switch, {
          size: "small",
          checked: value === "启用",
          onChange: () => toggleStatus(record)
        })
      },
      { title: "更新时间", dataIndex: "updatedAt", width: 150, render: value => e("span", { className: "stacked-muted" }, value) },
      {
        title: "操作", key: "actions", fixed: "right", width: 110,
        render: (_, record) => e(Space, { size: 4 }, [
          e(Button, {
            key: "edit", type: "link", size: "small",
            onClick: () => setModalState({ open: true, mode: "edit", coupon: record })
          }, "编辑"),
          e(Button, {
            key: "delete", type: "link", size: "small", danger: true,
            onClick: () => removeCoupon(record)
          }, "删除")
        ])
      }
    ];

    return e("section", { className: "page-surface coupon-page" }, [
      e("div", { className: "toolbar", key: "toolbar" }, [
        e(Space, { key: "filters", wrap: true, size: 8 }, [
          e(SearchInput, {
            value: draft.keyword,
            onChange: event => setDraft({ ...draft, keyword: event.target.value }),
            onSearch: search,
            placeholder: "券名称",
            allowClear: true,
            className: "keyword-input"
          }),
          e(Select, {
            value: draft.status,
            onChange: value => {
              setDraft({ ...draft, status: value });
              setApplied({ ...draft, status: value });
            },
            placeholder: "状态",
            allowClear: true,
            className: "select-input",
            options: ["启用", "停用"].map(value => ({ value, label: value }))
          }),
          e(ListActions, {
            key: "actions-core",
            onReset: reset,
            trailing: [
              e(Text, { key: "hint", type: "secondary" }, "被活动奖池引用的券不可删除"),
              e(Button, {
                key: "add", type: "primary",
                onClick: () => setModalState({ open: true, mode: "add", coupon: null })
              }, "新增优惠券")
            ]
          })
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        scroll: { x: 1220 },
        locale: { emptyText: "暂无数据" },
        pagination: { pageSize: 10, showTotal: total => `共 ${total} 条` }
      }),
      modalState.open ? e(CouponModal, {
        key: `coupon-${modalState.mode}-${modalState.coupon ? modalState.coupon.id : "new"}`,
        open: true,
        mode: modalState.mode,
        coupon: modalState.coupon,
        onCancel: () => setModalState({ open: false, mode: "add", coupon: null }),
        onSave: data => saveCoupon(data, modalState.mode, modalState.coupon)
      }) : null
    ]);
  }

  app.CouponPage = CouponPage;
})(window.AdminApp);

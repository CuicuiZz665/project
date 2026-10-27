(function registerWheelPage(app) {
  const {
    Button,
    DatePicker,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message
  } = antd;
  const { RangePicker } = DatePicker;
  const { Text } = Typography;
  const { TextArea } = Input;
  const e = React.createElement;
  const { ListActions, SearchInput } = app.sharedActions;

  // 活动类型：后续新玩法在这里扩展选项即可。
  const TYPE_OPTIONS = [
    { value: "大转盘", label: "大转盘" },
    { value: "盲盒", label: "盲盒", disabled: true },
    { value: "刮刮卡", label: "刮刮卡", disabled: true }
  ];
  const PRIZE_TYPE_OPTIONS = ["优惠券", "积分", "奖励", "谢谢参与"];
  const ACCOUNT_TYPE_OPTIONS = ["资金账户", "模拟账户", "赠金账户"];
  const DELIVERY_METHOD_OPTIONS = ["自动", "人工"].map(value => ({ value, label: value }));
  const STATUS_FILTER_OPTIONS = ["进行中", "未开始", "已结束", "停用"].map(value => ({ value, label: value }));
  const IMPORTED_USER_IDS = "870206426, 983850083, 762300118";

  // vendor 未包含 @ant-design/icons，这里内联同款 SVG（上传/下载托盘图标）
  function trayIcon(paths) {
    return e("svg", {
      viewBox: "64 64 896 896",
      width: "1em",
      height: "1em",
      fill: "currentColor",
      "aria-hidden": "true"
    }, paths.map((d, index) => e("path", { key: index, d })));
  }
  const importIcon = trayIcon([
    "M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163c-3.2-4.1-9.4-4.1-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13z",
    "M838 656h-60c-4.4 0-8 3.6-8 8v74H254v-74c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v132c0 8.8 7.2 16 16 16h636c8.8 0 16-7.2 16-16V664c0-4.4-3.6-8-8-8z"
  ]);
  const exportIcon = trayIcon([
    "M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8z",
    "M878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 8.8 7.2 16 16 16h736c8.8 0 16-7.2 16-16V634c0-4.4-3.6-8-8-8z"
  ]);

  function nowText() {
    const now = new Date();
    const pad = num => String(num).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function prizeNameOf(prize, coupons) {
    if (prize.type === "优惠券") {
      const coupon = (coupons || []).find(item => item.id === prize.couponId);
      return coupon ? coupon.name : "未选择优惠券";
    }
    if (prize.type === "积分") return `${prize.pointsLabel || "XP"} ×${prize.pointsAmount || 0}`;
    if (prize.type === "奖励") return `奖励-${prize.accountType || "资金账户"} ${prize.amount || 0}`;
    return "谢谢参与";
  }

  // 抽奖配置抽屉：基础信息 + 奖池配置（概率合计须为 100%）+ 投递方式。
  function WheelDrawer({ open, mode, activity, activities, coupons, onCancel, onSave }) {
    const [form] = Form.useForm();
    const prizes = Form.useWatch("prizes", form) || [];
    const deliveryMethod = Form.useWatch("deliveryMethod", form) || "自动";
    // 批量导入后投递Userid 转为不可编辑，清空后恢复（见导入区提示文案）
    const [idsImported, setIdsImported] = React.useState(false);
    React.useEffect(() => {
      if (!open) return;
      setIdsImported(false);
      form.setFieldsValue({
        type: activity?.type || "大转盘",
        name: activity ? mode === "copy" ? `${activity.name}-副本` : activity.name : "",
        range: activity ? [dayjs(activity.start), dayjs(activity.end)] : undefined,
        deliveryMethod: activity?.deliveryMethod || "自动",
        manualUserIds: activity?.manualUserIds || undefined,
        prizes: activity ? activity.prizes.map((prize, index) => ({
          key: `row-${index}`,
          type: prize.type,
          couponId: prize.couponId || undefined,
          pointsLabel: prize.pointsLabel || "XP",
          pointsAmount: prize.pointsAmount,
          accountType: prize.accountType || "资金账户",
          amount: prize.amount,
          count: prize.count,
          percent: prize.percent
        })) : [{ key: "row-0", type: "优惠券", pointsLabel: "XP", accountType: "资金账户", count: undefined, percent: undefined }]
      });
    }, [open, mode, activity, form]);

    async function handleSave() {
      const values = await form.validateFields();
      const rows = (values.prizes || []).map((prize, index) => ({ ...prize, key: `p${index + 1}` }));
      if (!rows.length) {
        message.error("请至少配置一个奖品");
        return;
      }
      const percentSum = rows.reduce((sum, prize) => sum + (Number(prize.percent) || 0), 0);
      if (percentSum !== 100) {
        message.error(`奖池中奖概率合计须为 100%，当前为 ${percentSum}%`);
        return;
      }
      const invalid = rows.find(prize => prize.type === "优惠券" && !prize.couponId);
      if (invalid) {
        message.error("优惠券奖品尚未选择具体券");
        return;
      }
      if (values.deliveryMethod === "人工" && !String(values.manualUserIds || "").trim()) {
        message.error("请输入投递Userid");
        return;
      }
      const prizesPayload = rows.map(prize => ({
        key: prize.key,
        type: prize.type,
        couponId: prize.type === "优惠券" ? prize.couponId : null,
        pointsLabel: prize.type === "积分" ? prize.pointsLabel : undefined,
        pointsAmount: prize.type === "积分" ? prize.pointsAmount : undefined,
        accountType: prize.type === "奖励" ? prize.accountType : undefined,
        amount: prize.type === "奖励" ? prize.amount : undefined,
        count: prize.type === "谢谢参与" ? 0 : Number(prize.count) || 0,
        percent: Number(prize.percent)
      }));
      const data = {
        type: values.type,
        name: values.name,
        start: values.range[0].format("YYYY-MM-DD HH:mm"),
        end: values.range[1].format("YYYY-MM-DD HH:mm"),
        deliveryMethod: values.deliveryMethod,
        manualUserIds: values.deliveryMethod === "人工" ? String(values.manualUserIds).trim() : null,
        prizes: prizesPayload,
        operator: "Amy"
      };
      onSave(data);
    }

    function importUserIds() {
      form.setFieldValue("manualUserIds", IMPORTED_USER_IDS);
      setIdsImported(true);
      message.success("已模拟批量导入");
    }

    function clearUserIds() {
      form.setFieldValue("manualUserIds", "");
      setIdsImported(false);
      message.success("投递Userid 已清空，恢复编辑");
    }

    return e(Drawer, {
      title: mode === "edit" ? "编辑活动" : mode === "copy" ? "复制活动" : "新增",
      open: open,
      width: 760,
      onClose: onCancel,
      destroyOnClose: true,
      footer: e("div", { className: "drawer-footer-actions" }, [
        e(Button, { key: "cancel", onClick: onCancel }, "取消"),
        e(Button, { key: "save", type: "primary", onClick: handleSave }, "保存")
      ])
    }, e(Form, {
      form: form,
      layout: "vertical",
      className: "admin-form"
    }, [
      e("div", { className: "drawer-form-card", key: "card1" }, [
      e("div", { className: "form-section-title", key: "s1" }, "基础信息"),
      e(Form.Item, { key: "type", name: "type", label: "玩法类型" }, e(Select, { options: TYPE_OPTIONS })),
      e("div", { key: "nameRange", style: { display: "flex", gap: 16 } }, [
        e(Form.Item, {
          key: "name", name: "name", label: "抽奖名称", style: { flex: 1 },
          rules: [{ required: true, message: "请输入抽奖名称" }]
        }, e(Input, { placeholder: "如：积分大转盘" })),
        e(Form.Item, {
          key: "range", name: "range", label: "抽奖时间", style: { flex: 1 },
          rules: [{ required: true, message: "请选择抽奖时间" }]
        }, e(RangePicker, { showTime: { format: "HH:mm" }, format: "YYYY-MM-DD HH:mm", className: "full-control" }))
      ])
      ]),
      e("div", { className: "drawer-form-card", key: "card2" }, [
      e("div", { className: "form-section-title", key: "s2" }, "奖池配置"),
      e(Text, { key: "hint", type: "secondary" }, "优惠券奖品请先在 发放管理 > 优惠券管理 中创建并启用；各奖品中奖概率合计须为 100%。"),
      e(Form.List, { key: "list", name: "prizes" }, (fields, { add, remove }) => e("div", { className: "prize-list" }, [
        ...fields.map(field => {
          const prizeType = prizes[field.name]?.type;
          return e("div", { className: "prize-row", key: field.key }, [
            e(Form.Item, {
              name: [field.name, "type"],
              rules: [{ required: true, message: "选择类型" }],
              noStyle: true
            }, e(Select, { style: { width: 110 }, options: PRIZE_TYPE_OPTIONS.map(value => ({ value, label: value })) })),
            prizeType === "优惠券" ? e(Form.Item, {
              name: [field.name, "couponId"],
              rules: [{ required: true, message: "选择优惠券" }],
              noStyle: true
            }, e(Select, {
              style: { width: 220 },
              placeholder: "选择优惠券（仅列出已启用）",
              options: coupons.filter(coupon => coupon.status === "启用").map(coupon => ({ value: coupon.id, label: coupon.name }))
            })) : null,
            prizeType === "积分" ? [
              e(Form.Item, { key: "pl", name: [field.name, "pointsLabel"], noStyle: true }, e(Select, { style: { width: 80 }, options: ["XP", "金币"].map(value => ({ value, label: value })) })),
              e(Form.Item, { key: "pa", name: [field.name, "pointsAmount"], noStyle: true }, e(InputNumber, { min: 1, style: { width: 110 }, placeholder: "积分值" }))
            ] : null,
            prizeType === "奖励" ? [
              e(Form.Item, { key: "at", name: [field.name, "accountType"], noStyle: true }, e(Select, { style: { width: 110 }, options: ACCOUNT_TYPE_OPTIONS.map(value => ({ value, label: value })) })),
              e(Form.Item, { key: "am", name: [field.name, "amount"], noStyle: true }, e(InputNumber, { min: 1, style: { width: 110 }, placeholder: "金额" }))
            ] : null,
            prizeType === "谢谢参与" ? e("span", { className: "prize-thanks" }, "未中奖兜底，不发奖") : e(Form.Item, {
              name: [field.name, "count"],
              noStyle: true
            }, e(InputNumber, { min: 0, precision: 0, style: { width: 100 }, placeholder: "发放数量(份)" })),
            e(Form.Item, {
              name: [field.name, "percent"],
              rules: [{ required: true, message: "概率" }],
              noStyle: true
            }, e(InputNumber, { min: 0, max: 100, style: { width: 100 }, addonAfter: "%", placeholder: "概率" })),
            fields.length > 1 ? e(Button, {
              type: "link", danger: true, size: "small",
              onClick: () => remove(field.name)
            }, "移除") : null
          ]);
        }),
        e(Button, {
          type: "dashed", size: "small",
          onClick: () => add({ type: "优惠券", pointsLabel: "XP", accountType: "资金账户" })
        }, "+ 添加奖品")
      ]))
      ]),
      e("div", { className: "drawer-form-card", key: "card3" }, [
      e("div", { className: "form-section-title", key: "s3" }, "投递方式"),
      e(Form.Item, { key: "deliveryMethod", name: "deliveryMethod", label: "投递方式" },
        e(Select, { options: DELIVERY_METHOD_OPTIONS })),
      deliveryMethod === "人工" ? e("div", { className: "manual-panel", key: "manualPanel" }, [
        e(Form.Item, { key: "manualUserIds", name: "manualUserIds", label: "投递Userid" },
          e(TextArea, {
            rows: 4,
            placeholder: "支持英文逗号分隔批量ID",
            disabled: idsImported,
            allowClear: !idsImported
          })),
        e(Text, { key: "importHint", type: "secondary", style: { display: "block", fontSize: 12, marginBottom: 12 } },
          "批量导入后会覆盖输入框内容，转为不可编辑状态，清空后恢复操作。"),
        e(Space, { key: "importActions", wrap: true }, [
          e(Button, { key: "import", type: "primary", icon: importIcon, onClick: importUserIds }, "批量导入"),
          e(Button, { key: "template", icon: exportIcon, onClick: () => message.success("模板已模拟导出") }, "导出模板"),
          idsImported ? e(Button, { key: "clear", type: "link", onClick: clearUserIds }, "清空") : null
        ])
      ]) : null
      ])
    ]));
  }

  function statusOf(activity) {
    if (!activity.enabled) return { label: "停用", color: "default" };
    const now = nowText();
    if (now < activity.start) return { label: "未开始", color: "processing" };
    if (now > activity.end) return { label: "已结束", color: "default" };
    return { label: "进行中", color: "success" };
  }

  // 抽奖详情抽屉：与积分规则的规则详情同款 label/value 行样式，整行点击打开。
  function WheelDetailDrawer({ activity, coupons, onClose }) {
    const row = (label, value) => e("div", {
      key: label,
      style: {
        display: "flex",
        gap: 12,
        padding: "7px 0",
        borderBottom: "1px solid #f0f0f0",
        fontSize: 13,
        lineHeight: 1.6
      }
    }, e("span", { style: { flex: "0 0 104px", color: "#8a93a3" } }, label),
      e("span", { style: { flex: 1, minWidth: 0 } }, value));
    const prizeText = prize => {
      if (prize.type === "优惠券") {
        const coupon = (coupons || []).find(item => item.id === prize.couponId);
        return coupon ? coupon.name : "未选择优惠券";
      }
      if (prize.type === "积分") return `${prize.pointsLabel || "XP"} ×${prize.pointsAmount || 0}`;
      if (prize.type === "奖励") return `奖励-${prize.accountType || "资金账户"} ${prize.amount || 0}`;
      return "未中奖兜底，不发奖";
    };
    const prizes = activity?.prizes || [];
    const percentSum = prizes.reduce((sum, prize) => sum + (Number(prize.percent) || 0), 0);
    const status = activity ? statusOf(activity) : null;
    const body = activity ? e("div", null, [
      row("玩法类型", e(Tag, { color: "blue" }, activity.type)),
      row("抽奖名称", activity.name || "-"),
      row("活动标识", activity.marker || "-"),
      row("抽奖时间", `${activity.start} 至 ${activity.end}`),
      row("活动状态", e(Tag, { color: status.color }, status.label)),
      row("操作人", activity.operator || "-"),
      row("投递方式", activity.deliveryMethod === "人工"
        ? `人工（投递Userid：${activity.manualUserIds || "-"}）`
        : activity.deliveryMethod || "自动"),
      row("奖池配置", prizes.length ? e("div", null, prizes.map((prize, index) => e("div", {
        key: prize.key || index
      }, `${index + 1}. ${prize.type}：${prizeText(prize)} · ${prize.count || 0}份 · ${prize.percent}%`))) : "-"),
      row("概率合计", `${percentSum}%`)
    ]) : null;
    return e(Drawer, {
      open: !!activity,
      title: "抽奖详情",
      width: 560,
      onClose: onClose,
      destroyOnClose: true
    }, body);
  }

  function WheelPage({ activities, setActivities, coupons }) {
    const [draft, setDraft] = React.useState({ keyword: "", status: null });
    const [applied, setApplied] = React.useState({ keyword: "", status: null });
    const [drawerState, setDrawerState] = React.useState({ open: false, mode: "add", activity: null });
    const [detailActivity, setDetailActivity] = React.useState(null);

    const filtered = React.useMemo(() => {
      const term = applied.keyword.trim().toLowerCase();
      return activities.filter(item => {
        const matchedKeyword = !term || item.name.toLowerCase().includes(term);
        const matchedStatus = !applied.status || statusOf(item).label === applied.status;
        return matchedKeyword && matchedStatus;
      });
    }, [activities, applied]);

    const search = () => setApplied({ ...draft });
    const reset = () => {
      setDraft({ keyword: "", status: null });
      setApplied({ keyword: "", status: null });
    };

    function saveActivity(data, mode, source) {
      if (mode === "edit") {
        setActivities(prev => prev.map(item => item.id === source.id ? { ...item, ...data } : item));
        message.success("活动已修改");
      } else {
        setActivities(prev => [{
          id: Date.now(),
          marker: nextMarkerText(prev),
          enabled: mode === "copy" ? false : true,
          ...data
        }, ...prev]);
        message.success(mode === "copy" ? "活动已复制（默认停用）" : "活动已新增");
      }
      setDrawerState({ open: false, mode: "add", activity: null });
    }

    function nextMarkerText(list) {
      const now = new Date();
      const pad = num => String(num).padStart(2, "0");
      const seq = String(list.length + 1).padStart(3, "0");
      return `HD-${now.getFullYear()}${pad(now.getMonth() + 1)}-${seq}`;
    }

    function toggleEnabled(record) {
      const next = !record.enabled;
      setActivities(prev => prev.map(item => item.id === record.id ? { ...item, enabled: next } : item));
      message.success(`活动「${record.name}」已${next ? "启用" : "停用"}`);
    }

    function removeActivity(record) {
      setActivities(prev => prev.filter(item => item.id !== record.id));
      message.success(`活动「${record.name}」已删除`);
    }

    const columns = [
      { title: "抽奖名称", dataIndex: "name", width: 160 },
      { title: "玩法类型", dataIndex: "type", width: 90, render: value => e(Tag, { color: "blue" }, value) },
      {
        title: "奖池", key: "prizePool", width: 220,
        render: (_, record) => {
          const prizeList = record.prizes || [];
          const lineOf = (type, format) => {
            const matched = prizeList.filter(prize => prize.type === type);
            const text = matched.length ? matched.map(format).join("、") : "-";
            return e("div", { key: type, className: "stacked-muted" }, `${type}：${text}`);
          };
          return e("div", { className: "stacked-cell" }, [
            lineOf("优惠券", prize => {
              const coupon = coupons.find(item => item.id === prize.couponId);
              return coupon ? coupon.name : "未选择优惠券";
            }),
            lineOf("积分", prize => `${prize.pointsLabel || "XP"} ×${prize.pointsAmount || 0}`),
            lineOf("奖励", prize => `${prize.accountType || "资金账户"} ${prize.amount || 0}`)
          ]);
        }
      },
      {
        title: "状态", key: "status", width: 90,
        render: (_, record) => {
          const status = statusOf(record);
          return e(Tag, { color: status.color }, status.label);
        }
      },
      {
        title: "抽奖时间", key: "range", width: 190,
        render: (_, record) => e("div", { className: "stacked-cell" }, [
          e("div", { key: "start", className: "stacked-muted" }, record.start),
          e("div", { key: "end", className: "stacked-muted" }, `至 ${record.end}`)
        ])
      },
      { title: "操作人", dataIndex: "operator", width: 100, render: value => value || "-" },
      {
        title: "操作", key: "actions", fixed: "right", width: 220,
        render: (_, record) => e(Space, { size: 4, wrap: true }, [
          e(Button, {
            key: "edit", type: "link", size: "small",
            onClick: () => setDrawerState({ open: true, mode: "edit", activity: record })
          }, "编辑"),
          e(Button, {
            key: "copy", type: "link", size: "small",
            onClick: () => setDrawerState({ open: true, mode: "copy", activity: record })
          }, "复制"),
          e(Button, {
            key: "toggle", type: "link", size: "small",
            onClick: () => toggleEnabled(record)
          }, record.enabled ? "停用" : "启用"),
          e(Button, {
            key: "delete", type: "link", size: "small", danger: true,
            onClick: () => removeActivity(record)
          }, "删除")
        ])
      }
    ];

    return e("section", { className: "page-surface wheel-page" }, [
      e("div", { className: "toolbar", key: "toolbar" }, [
        e(Space, { key: "filters", wrap: true, size: 8 }, [
          e(SearchInput, {
            value: draft.keyword,
            onChange: event => setDraft({ ...draft, keyword: event.target.value }),
            onSearch: search,
            placeholder: "抽奖名称",
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
            options: STATUS_FILTER_OPTIONS
          }),
          e(ListActions, {
            key: "actions-core",
            onReset: reset,
            trailing: [
              e(Button, {
                key: "add",
                type: "primary",
                onClick: () => setDrawerState({ open: true, mode: "add", activity: null })
              }, "新增")
            ]
          })
        ])
      ]),
      e(Table, {
        key: "table",
        rowKey: "id",
        columns,
        dataSource: filtered,
        onRow: record => ({
          onClick: event => {
            if (event.target.closest("button")) return;
            setDetailActivity(record);
          }
        }),
        scroll: { x: 1100 },
        locale: { emptyText: "暂无数据" },
        pagination: { pageSize: 10, showTotal: total => `共 ${total} 条` }
      }),
      drawerState.open ? e(WheelDrawer, {
        key: `drawer-${drawerState.mode}-${drawerState.activity ? drawerState.activity.id : "new"}`,
        open: true,
        mode: drawerState.mode,
        activity: drawerState.activity,
        activities,
        coupons,
        onCancel: () => setDrawerState({ open: false, mode: "add", activity: null }),
        onSave: data => saveActivity(data, drawerState.mode, drawerState.activity)
      }) : null,
      detailActivity ? e(WheelDetailDrawer, {
        key: `detail-${detailActivity.id}`,
        activity: detailActivity,
        coupons,
        onClose: () => setDetailActivity(null)
      }) : null
    ]);
  }

  app.WheelPage = WheelPage;
})(window.AdminApp);

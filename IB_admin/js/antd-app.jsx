(function registerAntdAdminApp(app) {
  const {
    App: AntApp,
    Button,
    Cascader,
    Checkbox,
    ConfigProvider,
    DatePicker,
    Drawer,
    Dropdown,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tag,
    Typography,
    message,
    theme
  } = antd;
  const { Header, Sider, Content } = Layout;
  const { RangePicker } = DatePicker;
  const { TextArea } = Input;
  const { Text } = Typography;

  const statusColor = {
    "启用": "success",
    "禁用": "default",
    "待启用": "processing",
    "未启用": "default",
    "作废": "error"
  };

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeDateTime(value) {
    return value ? value.replace(":00", "") : "";
  }

  function makeDeliveryOptions(options) {
    return Object.entries(options).map(([key, config]) => ({
      value: key,
      label: config.text,
      children: config.second.map((second, secondIndex) => ({
        value: `${key}-${secondIndex}`,
        label: second,
        children: config.third.map((third, thirdIndex) => ({
          value: `${key}-${secondIndex}-${thirdIndex}`,
          label: third
        }))
      }))
    }));
  }

  function rewardNode(record) {
    const tags = [];
    if (Number(record.rewardXp) > 0) tags.push(<Tag color="blue" key="xp">{record.rewardXp} XP</Tag>);
    if (Number(record.rewardDrop) > 0) tags.push(<Tag color="gold" key="drop">{record.rewardDrop} 金币</Tag>);
    return tags.length ? <Space size={4} wrap>{tags}</Space> : <Text type="secondary">-</Text>;
  }

  const conditionParamMap = {
    "手续费": ["手续费金额"],
    "跟单": ["跟单金额", "跟单笔数"],
    "连续签到": ["签到天数"],
    "手动触发": []
  };
  const conditionDefaults = {
    "手续费金额": 100,
    "跟单金额": 100,
    "跟单笔数": 1,
    "签到天数": 5
  };

  function RuleDrawer({ open, mode, rule, onCancel, onSave }) {
    const [form] = Form.useForm();
    const [languages, setLanguages] = React.useState(["英语"]);
    const [activeLang, setActiveLang] = React.useState("英语");
    const triggerEvent = Form.useWatch("triggerEvent", form);
    const accountScope = Form.useWatch("accountScope", form);
    const accountTypes = Form.useWatch("accountTypes", form) || [];
    const conditions = Form.useWatch("conditions", form) || [];
    const relation = Form.useWatch("relation", form);
    const jumpType = Form.useWatch("jumpType", form);
    const mediaMode = Form.useWatch("mediaMode", form);
    const cyclePeriod = Form.useWatch("cyclePeriod", form);

    React.useEffect(() => {
      if (!open) return;
      setLanguages(["英语"]);
      setActiveLang("英语");
      form.setFieldsValue({
        internalName: rule?.internalName ? (mode === "copy" ? `${rule.internalName}-副本` : rule.internalName) : "",
        taskType: rule?.taskType || "全部",
        rewardValue: Number(rule?.rewardXp || rule?.rewardDrop || 0),
        rewardType: Number(rule?.rewardDrop || 0) > 0 && Number(rule?.rewardXp || 0) <= 0 ? "金币" : "XP",
        triggerEvent: rule?.triggerEvent === "首次连续签到" ? "连续签到" : (rule?.triggerEvent || "手续费"),
        accountScope: "all",
        accountTypes: [],
        conditions: [],
        relation: "all",
        jumpType: "无跳转",
        jumpTarget: "",
        mediaMode: false,
        externalName: rule?.externalName?.replace(/^英语:\s*/, "") || "",
        ruleDesc: rule ? `${rule.internalName}任务规则说明` : "",
        popupText: "",
        cycleCount: "循环",
        cyclePeriod: rule?.cyclePeriod || "不限",
        timeRange: []
      });
    }, [open, mode, rule, form]);

    React.useEffect(() => {
      if (!open || !triggerEvent) return;
      const params = conditionParamMap[triggerEvent] || [];
      form.setFieldValue("conditions", params.length ? [{ param: params[0], value: conditionDefaults[params[0]] }] : []);
      const rewardValue = form.getFieldValue("rewardValue");
      if (!rewardValue) {
        form.setFieldValue("rewardType", "XP");
        form.setFieldValue("rewardValue", triggerEvent === "连续签到" ? 33 : 150);
      }
    }, [triggerEvent]);

    const paramOptions = conditionParamMap[triggerEvent] || [];
    const usedParams = conditions.map(item => item?.param).filter(Boolean);
    const scopeText = accountScope === "custom"
      ? (accountTypes.length ? accountTypes.join("、") : "未选择账号")
      : "全部账号";
    const conditionText = conditions
      .filter(item => item?.param)
      .map(item => `${item.param} ≥ ${item.value ?? "—"}`)
      .join(relation === "any" ? " 或 " : " 且 ");
    const relationText = relation === "any" ? "任一达成即可" : "须全部达成";

    function addLanguage() {
      const next = languages.includes("繁体中文") ? "简体中文" : "繁体中文";
      if (!languages.includes(next)) setLanguages([...languages, next]);
      setActiveLang(next);
      form.setFieldValue("externalName", "");
      message.success(`已添加${next}`);
    }

    function removeLanguage(lang) {
      setLanguages(languages.filter(item => item !== lang));
      setActiveLang("英语");
    }

    async function handleSave() {
      const values = await form.validateFields();
      const rewardType = values.rewardType || "XP";
      const rewardValue = Number(values.rewardValue || 0);
      if (rewardValue <= 0) {
        message.warning("奖励值不能为空");
        return;
      }
      const range = values.timeRange || [];
      const rewardXp = rewardType === "XP" ? rewardValue : 0;
      const rewardDrop = rewardType === "金币" ? rewardValue : 0;
      const conditionSummary = values.triggerEvent === "手动触发"
        ? "后台人工触发"
        : (conditionText
          ? (conditions.length > 1 ? `${conditionText}（${relationText}）` : conditionText)
          : "未设置");
      const data = {
        internalName: values.internalName || "未命名规则",
        externalName: `${activeLang}: ${values.externalName || values.internalName || "未命名规则"}`,
        triggerEvent: values.triggerEvent === "连续签到" ? "首次连续签到" : values.triggerEvent,
        cyclePeriod: values.cyclePeriod,
        rewardXp,
        rewardDrop,
        taskType: values.taskType || "全部",
        timeRange: range.length
          ? `${range[0]?.format("YYYY-MM-DD HH:mm") || "-"} 至 ${range[1]?.format("YYYY-MM-DD HH:mm") || "-"}`
          : "-"
      };
      Modal.confirm({
        title: "确认保存",
        content: `将保存规则“${data.internalName}”，奖励为 ${rewardType} ${rewardValue}。达成条件：${conditionSummary}。`,
        onOk: () => onSave(data)
      });
    }

    const tabItems = languages.map(lang => ({
      key: lang,
      label: (
        <Space size={4}>
          {lang}
          {lang !== "英语" && <Button type="text" size="small" onClick={event => {
            event.stopPropagation();
            removeLanguage(lang);
          }}>x</Button>}
        </Space>
      )
    })).concat({ key: "__add", label: "+ 添加语言" });

    return (
      <Drawer
        title={mode === "edit" ? "修改规则" : mode === "copy" ? "复制规则" : "新增规则"}
        open={open}
        width={720}
        onClose={onCancel}
        destroyOnClose
        footer={
          <div className="drawer-footer-actions">
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="admin-form">
          <div className="form-section-title">基础信息</div>
          <Form.Item name="internalName" label="内部规则名称" rules={[{ required: true, message: "请输入内部规则名称" }]}>
            <Input placeholder="内部规则名称" />
          </Form.Item>

          <div className="form-section-title">任务与奖励</div>
          <div className="form-grid-antd">
            <Form.Item name="taskType" label="任务类型">
              <Select options={["全部", "新手任务"].map(value => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="rewardType" label="奖励类型" rules={[{ required: true, message: "请选择奖励类型" }]}>
              <Select options={["XP", "金币"].map(value => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="rewardValue" label="奖励值">
              <InputNumber min={0} precision={0} className="full-control" placeholder="0" />
            </Form.Item>
          </div>

          <div className="form-section-title">触发条件</div>
          <div className="form-grid-antd">
            <Form.Item name="triggerEvent" label="触发事件" rules={[{ required: true }]}>
              <Select options={["手续费", "跟单", "连续签到", "手动触发"].map(value => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="accountScope" label="账号类型">
              <Select
                options={[
                  { value: "all", label: "全部账号" },
                  { value: "custom", label: "指定账号类型" }
                ]}
              />
            </Form.Item>
            {accountScope === "custom" && (
              <Form.Item name="accountTypes" label="交易账号类型" rules={[{ required: true, message: "请选择交易账号类型" }]}>
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  placeholder="请选择适用的交易账号类型"
                  options={["模拟账户", "交易账户", "跟单账户"].map(value => ({ value, label: value }))}
                />
              </Form.Item>
            )}
          </div>
          {triggerEvent !== "手动触发" && (
            <>
              <div className="form-sub-title">
                达成条件
                <span className="form-sub-hint">客户达成以下条件即可获得对应奖励</span>
              </div>
              <Form.List name="conditions">
                {(fields, { add, remove }) => (
                  <div className="condition-list">
                    {fields.map(field => (
                      <div className="condition-row" key={field.key}>
                        <Form.Item name={[field.name, "param"]} rules={[{ required: true, message: "请选择参数" }]} noStyle>
                          <Select
                            style={{ width: 150 }}
                            placeholder="选择参数"
                            options={paramOptions
                              .filter(param => !usedParams.includes(param) || param === conditions[field.name]?.param)
                              .map(value => ({ value, label: value }))}
                          />
                        </Form.Item>
                        <span className="condition-op">≥</span>
                        <Form.Item name={[field.name, "value"]} rules={[{ required: true, message: "请输入数值" }]} noStyle>
                          <InputNumber min={1} precision={0} style={{ width: 150 }} placeholder="数值" />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button type="text" danger size="small" onClick={() => remove(field.name)}>移除</Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      size="small"
                      disabled={usedParams.length >= paramOptions.length}
                      onClick={() => {
                        const nextParam = paramOptions.find(param => !usedParams.includes(param));
                        if (nextParam) add({ param: nextParam, value: conditionDefaults[nextParam] });
                      }}
                    >
                      + 添加条件
                    </Button>
                  </div>
                )}
              </Form.List>
              {conditions.length > 1 && (
                <Form.Item name="relation" label="条件关系">
                  <antd.Radio.Group
                    options={[
                      { value: "any", label: "满足任一条件即可" },
                      { value: "all", label: "所有条件须全部达成" }
                    ]}
                  />
                </Form.Item>
              )}
            </>
          )}
          {triggerEvent === "手动触发" && (
            <Text type="secondary">手动触发事件由运营在后台人工执行，无需配置达成条件。</Text>
          )}
          <div className="rule-preview">
            <Text strong>规则逻辑：</Text>
            {triggerEvent === "手动触发" ? (
              <span>该规则由运营在后台人工触发，触发即判定任务完成。</span>
            ) : (
              <span>
                当「{scopeText}」发生「{triggerEvent}」，且
                <Text strong>{conditionText || "未设置条件"}</Text>
                {conditions.length > 1 ? `（${relationText}）` : ""}
                时，判定任务完成。
              </span>
            )}
          </div>

          <div className="form-section-title">展示与多语言</div>
          <div className="form-grid-antd">
            <Form.Item name="jumpType" label="跳转类型">
              <Select options={["无跳转", "内部页面", "外部链接"].map(value => ({ value, label: value }))} />
            </Form.Item>
            {jumpType !== "无跳转" && (
              <Form.Item name="jumpTarget" label="跳转目标">
                <Input placeholder={jumpType === "外部链接" ? "https://example.com" : "/task/detail"} />
              </Form.Item>
            )}
            <Form.Item name="mediaMode" label="看图/视频做任务模式" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </div>
          {mediaMode && (
            <Form.Item label="上传附件">
              <Button onClick={() => message.success("附件已模拟上传")}>点击模拟上传图片或视频</Button>
            </Form.Item>
          )}
          <Tabs
            activeKey={activeLang}
            items={tabItems}
            onChange={key => key === "__add" ? addLanguage() : setActiveLang(key)}
          />
          <div className="form-grid-antd">
            <Form.Item name="externalName" label="外部名称" rules={[{ required: true, message: "请输入外部名称" }]}>
              <Input placeholder="前端展示名称" />
            </Form.Item>
            <Form.Item name="ruleDesc" label="规则说明">
              <Input placeholder="任务规则说明" />
            </Form.Item>
          </div>
          <Form.Item name="popupText" label="弹窗正文文案">
            <TextArea rows={3} placeholder="请输入该语言环境下的弹窗引导文案..." />
          </Form.Item>

          <div className="form-section-title">循环与时间</div>
          <div className="form-grid-antd">
            <Form.Item name="cycleCount" label="循环次数">
              <Select options={["循环", "仅一次"].map(value => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="cyclePeriod" label="循环周期">
              <Select options={["不限", "按天", "按周"].map(value => ({ value, label: value }))} />
            </Form.Item>
            {cyclePeriod !== "不限" && (
              <Form.Item name="triggerDates" label="周期内可触发日期">
                <Select options={["不限", "周一至周五", "周六至周日"].map(value => ({ value, label: value }))} />
              </Form.Item>
            )}
          </div>
          <Form.Item name="timeRange" label="总任务生效时间">
            <RangePicker showTime format="YYYY-MM-DD HH:mm" className="full-control" />
          </Form.Item>
        </Form>
      </Drawer>
    );
  }

  function RulesPage({ rules, setRules }) {
    const [keyword, setKeyword] = React.useState("");
    const [status, setStatus] = React.useState();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(5);
    const [sorter, setSorter] = React.useState({});
    const [visibleColumns, setVisibleColumns] = React.useState(["externalName", "triggerEvent", "cyclePeriod", "reward", "taskType", "timeRange", "status"]);
    const [modalState, setModalState] = React.useState({ open: false, mode: "add", rule: null });

    const filteredRules = React.useMemo(() => {
      const term = keyword.trim().toLowerCase();
      let list = rules.filter(rule => {
        const matchedKeyword = !term || `${rule.internalName}${rule.externalName}${rule.triggerEvent}`.toLowerCase().includes(term);
        const matchedStatus = !status || rule.status === status;
        return matchedKeyword && matchedStatus;
      });
      if (sorter.field) {
        list = [...list].sort((a, b) => String(a[sorter.field]).localeCompare(String(b[sorter.field]), "zh-CN"));
        if (sorter.order === "descend") list.reverse();
      }
      return list;
    }, [rules, keyword, status, sorter]);

    const columnMap = {
      externalName: { title: "外部规则名称", dataIndex: "externalName", width: 180 },
      triggerEvent: { title: "触发事件", dataIndex: "triggerEvent", width: 120 },
      cyclePeriod: { title: "循环周期", dataIndex: "cyclePeriod", width: 100 },
      reward: { title: "奖励", key: "reward", width: 150, render: (_, record) => rewardNode(record) },
      taskType: { title: "任务类型", dataIndex: "taskType", width: 110 },
      timeRange: { title: "总任务生效时间", dataIndex: "timeRange", width: 180, render: value => <Text type="secondary">{value}</Text> },
      status: { title: "规则状态", dataIndex: "status", width: 110, sorter: true, render: value => <Tag color={statusColor[value]}>{value}</Tag> }
    };

    function saveRule(data) {
      if (modalState.mode === "edit") {
        setRules(rules.map(item => item.id === modalState.rule.id ? { ...item, ...data } : item));
        message.success("规则已修改");
      } else {
        setRules([{ id: Date.now(), ...data, status: "待启用", canEdit: true }, ...rules]);
        message.success(modalState.mode === "copy" ? "规则已复制" : "规则已新增");
      }
      setPage(1);
      setModalState({ open: false, mode: "add", rule: null });
    }

    function updateRuleStatus(record, nextStatus) {
      Modal.confirm({
        title: nextStatus === "启用" ? "确认启用" : "确认禁用",
        content: nextStatus === "启用"
          ? `启用后规则“${record.internalName}”将按当前条件发放奖励。`
          : `禁用后规则“${record.internalName}”不会继续发放奖励。`,
        onOk: () => {
          setRules(rules.map(item => item.id === record.id ? { ...item, status: nextStatus } : item));
          message.success(nextStatus === "启用" ? "规则已启用" : "规则已禁用");
        }
      });
    }

    const columns = [
      { title: "内部规则名称", dataIndex: "internalName", width: 170, sorter: true },
      ...visibleColumns.map(key => columnMap[key]),
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 180,
        render: (_, record) => (
          <Space size={4} wrap>
            {record.status === "启用" ? (
              <Button danger size="small" onClick={() => updateRuleStatus(record, "禁用")}>禁用</Button>
            ) : (
              <Button size="small" disabled={record.status === "禁用"} onClick={() => updateRuleStatus(record, "启用")}>启用</Button>
            )}
            {record.canEdit && <Button type="link" size="small" onClick={() => setModalState({ open: true, mode: "edit", rule: record })}>修改</Button>}
            <Button type="link" size="small" onClick={() => setModalState({ open: true, mode: "copy", rule: record })}>复制</Button>
          </Space>
        )
      }
    ];

    const columnMenu = (
      <Checkbox.Group value={visibleColumns} onChange={setVisibleColumns} className="column-menu">
        {Object.entries(columnMap).map(([key, column]) => (
          <Checkbox key={key} value={key}>{column.title}</Checkbox>
        ))}
      </Checkbox.Group>
    );

    return (
      <section className="page-surface">
        <div className="toolbar">
          <Space wrap>
            <Input value={keyword} onChange={event => setKeyword(event.target.value)} onPressEnter={() => {
              setPage(1);
              message.success(`查询到 ${filteredRules.length} 条规则`);
            }} placeholder="内部/外部名称" allowClear className="keyword-input" />
            <Select value={status} onChange={value => {
              setStatus(value);
              setPage(1);
            }} placeholder="选择状态" allowClear className="select-input" options={["启用", "禁用", "待启用"].map(value => ({ value, label: value }))} />
            <Button type="primary" onClick={() => {
              setPage(1);
              message.success(`查询到 ${filteredRules.length} 条规则`);
            }}>查询</Button>
            <Button onClick={() => {
              setKeyword("");
              setStatus(undefined);
              setPage(1);
              message.success("筛选已重置");
            }}>重置</Button>
          </Space>
          <Space>
            <Button type="primary" onClick={() => setModalState({ open: true, mode: "add", rule: null })}>新增规则</Button>
            <Dropdown trigger={["click"]} dropdownRender={() => <div className="dropdown-panel">{columnMenu}</div>}>
              <Button>列设置</Button>
            </Dropdown>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRules}
          pagination={{ current: page, pageSize, total: filteredRules.length, showSizeChanger: true, onChange: (next, size) => {
            setPage(next);
            setPageSize(size);
          }}}
          scroll={{ x: 1180 }}
          onChange={(_, __, tableSorter) => setSorter({ field: tableSorter.field, order: tableSorter.order })}
        />
        <RuleDrawer
          open={modalState.open}
          mode={modalState.mode}
          rule={modalState.rule}
          onCancel={() => setModalState({ open: false, mode: "add", rule: null })}
          onSave={saveRule}
        />
      </section>
    );
  }

  function DeliveryModal({ open, mode, item, options, onCancel, onSave }) {
    const [form] = Form.useForm();
    const method = Form.useWatch("method", form);
    const objectPath = Form.useWatch("objectPath", form);
    const event = Form.useWatch("event", form);
    const selectedKey = objectPath?.[0] || "points";

    React.useEffect(() => {
      if (!open) return;
      form.setFieldsValue({
        name: item?.name || "积分大转盘投递",
        objectPath: item?.key ? [item.key, `${item.key}-0`] : ["points", "points-0"],
        method: item?.method || "自动",
        timeRange: [
          dayjs(item?.start || "2026-09-01 00:00"),
          dayjs(item?.end || "2026-09-30 00:00")
        ],
        coupon: "抹亏券-测试待激活展示",
        bonusAmount: 100,
        bonusCount: item?.key === "bonus" ? Number(item.count || 25) : 25,
        bonusProbability: "15%",
        pointAmount: 100,
        pointCount: item?.key === "points" ? Number(item.count || 1) : 1,
        probability: "30%",
        event: item?.event || "大转盘",
        manualUserIds: "870206426, 983850083"
      });
    }, [open, item, form]);

    function selectedObject(values) {
      const path = values.objectPath || ["points", "points-0"];
      const type = path[0];
      const secondIndex = Number(String(path[1] || `${type}-0`).split("-")[1] || 0);
      const thirdIndex = Number(String(path[2] || `${type}-${secondIndex}-0`).split("-")[2] || 0);
      const config = options[type];
      const second = config.second[secondIndex];
      const third = config.third[thirdIndex];
      return {
        key: type,
        object: type === "coupon" ? `${second}-${third || config.third[0]}` : `${config.text}-${second}`,
        objectDetail: `${config.text} -> ${second}${third ? ` -> ${third}` : ""}`
      };
    }

    async function handleSave() {
      const values = await form.validateFields();
      const selected = selectedObject(values);
      const range = values.timeRange || [];
      const isBonus = selected.key === "bonus";
      const isPoints = selected.key === "points";
      const count = isBonus ? values.bonusCount : isPoints ? values.pointCount : "0";
      const probability = isBonus ? values.bonusProbability : values.probability;
      const amount = isBonus ? values.bonusAmount : values.pointAmount;
      const pointLabel = selected.object.split("-")[1] || "XP";
      const itemData = {
        ...selected,
        name: values.name || "未命名投递",
        method: values.method,
        count: String(count || 0),
        status: "未启用",
        start: normalizeDateTime(range[0]?.format("YYYY-MM-DD HH:mm:ss")),
        end: normalizeDateTime(range[1]?.format("YYYY-MM-DD HH:mm:ss")),
        event: values.method === "自动" ? values.event : "手动投递",
        param: isBonus
          ? `<span class="pill gold">金额：${amount || 100}</span><span class="pill gold">发放数量（份）：${count || 25}</span><span class="pill gold">中奖概率：${probability || "15%"}</span>`
          : isPoints
            ? `<span class="pill blue">${pointLabel}：${amount || 100}</span><span class="pill blue">发放数量（份）：${count || 1}</span><span class="pill blue">中奖概率：${probability || "30%"}</span>`
            : `<span class="pill">指定用户：${values.manualUserIds || "870206426"}</span>`,
        operator: "Bella"
      };
      Modal.confirm({
        title: "确认投递",
        content: `将保存投递任务“${itemData.name}”。`,
        onOk: () => onSave(itemData)
      });
    }

    return (
      <Modal
        title={mode === "edit" ? "修改投递" : "新建投递"}
        open={open}
        width={820}
        onCancel={onCancel}
        onOk={handleSave}
        okText="确认投递"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="admin-form">
          <div className="form-section-title">基础设置</div>
          <Form.Item name="name" label="投递任务名称" rules={[{ required: true, message: "请输入投递任务名称" }]}>
            <Input placeholder="请输入投递任务名称" />
          </Form.Item>
          <Form.Item name="objectPath" label="选择投递物" rules={[{ required: true, message: "请选择投递物" }]}>
            <Cascader options={makeDeliveryOptions(options)} placeholder="请选择投递物" changeOnSelect />
          </Form.Item>
          {selectedKey === "coupon" && (
            <Form.Item name="coupon" label="选择优惠券">
              <Select options={["抹亏券-测试待激活展示", "交易返现券-测试交易返现券", "手续费减免券-测试手续费减免券"].map(value => ({ value, label: value }))} />
            </Form.Item>
          )}
          {selectedKey === "bonus" && (
            <div className="form-grid-antd">
              <Form.Item name="bonusAmount" label="金额"><InputNumber min={0} className="full-control" /></Form.Item>
              <Form.Item name="bonusCount" label="发放数量（份）"><InputNumber min={0} precision={0} className="full-control" /></Form.Item>
              <Form.Item name="bonusProbability" label="中奖概率"><Input placeholder="请输入中奖概率" /></Form.Item>
            </div>
          )}
          {selectedKey === "points" && (
            <div className="form-grid-antd">
              <Form.Item name="pointCount" label="投递数量（份）"><InputNumber min={0} precision={0} className="full-control" placeholder="请输入投递数量" /></Form.Item>
              <Form.Item name="pointAmount" label={objectPath?.[1] === "points-1" ? "金币" : "XP"}><InputNumber min={0} precision={0} className="full-control" /></Form.Item>
              <Form.Item name="probability" label={event === "大转盘" ? "中奖概率" : "事件参数"}><Input placeholder={event === "大转盘" ? "请输入中奖概率" : "请输入事件参数"} /></Form.Item>
            </div>
          )}
          <div className="form-grid-antd">
            <Form.Item name="method" label="投递方式">
              <Select options={["自动", "人工"].map(value => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item name="timeRange" label="投递时间">
              <RangePicker showTime format="YYYY-MM-DD HH:mm" className="full-control" />
            </Form.Item>
          </div>
          {method === "自动" ? (
            <Form.Item name="event" label="触发事件">
              <Select options={["连续签到", "大转盘", "手动触发"].map(value => ({ value, label: value }))} />
            </Form.Item>
          ) : (
            <div className="manual-panel">
              <Form.Item name="manualUserIds" label="投递 UserID">
                <TextArea rows={4} placeholder="支持英文逗号分隔批量 ID" />
              </Form.Item>
              <Space wrap>
                <Button onClick={() => {
                  form.setFieldValue("manualUserIds", "870206426, 983850083, 762300118");
                  message.success("已模拟批量导入");
                }}>批量导入</Button>
                <Button onClick={() => message.success("模板已模拟导出")}>导出模板</Button>
                <Button onClick={() => {
                  form.setFieldValue("manualUserIds", "");
                  message.success("UserID 已清空");
                }}>清空</Button>
              </Space>
            </div>
          )}
        </Form>
      </Modal>
    );
  }

  function DeliveryPage({ deliveries, setDeliveries, options }) {
    const [keyword, setKeyword] = React.useState("");
    const [objectFilter, setObjectFilter] = React.useState();
    const [statusFilter, setStatusFilter] = React.useState();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(5);
    const [modalState, setModalState] = React.useState({ open: false, mode: "add", item: null });
    const [detail, setDetail] = React.useState(null);

    const filteredDeliveries = React.useMemo(() => {
      const term = keyword.trim().toLowerCase();
      return deliveries.filter(item => {
        const keywordMatched = !term || `${item.name}${item.object}${item.method}`.toLowerCase().includes(term);
        const objectMatched = !objectFilter || item.object.includes(objectFilter);
        const statusMatched = !statusFilter || item.status === statusFilter;
        return keywordMatched && objectMatched && statusMatched;
      });
    }, [deliveries, keyword, objectFilter, statusFilter]);

    function saveDelivery(data) {
      if (modalState.mode === "edit") {
        setDeliveries(deliveries.map(item => item.id === modalState.item.id ? { ...item, ...data } : item));
        message.success("投递已修改");
      } else {
        setDeliveries([{ id: Date.now(), ...data }, ...deliveries]);
        message.success("投递已新增");
      }
      setPage(1);
      setModalState({ open: false, mode: "add", item: null });
    }

    function updateDeliveryStatus(record, nextStatus) {
      Modal.confirm({
        title: nextStatus === "启用" ? "确认启用" : "确认作废",
        content: nextStatus === "启用"
          ? `启用后投递任务“${record.name}”将生效。`
          : `作废后投递任务“${record.name}”不可启用。`,
        onOk: () => {
          setDeliveries(deliveries.map(item => item.id === record.id ? { ...item, status: nextStatus } : item));
          message.success(nextStatus === "启用" ? "投递任务已启用" : "投递任务已作废");
        }
      });
    }

    const columns = [
      { title: "投递任务名", dataIndex: "name", width: 220, render: (_, record) => <Button type="link" onClick={() => setDetail(record)}>{record.name}</Button> },
      { title: "投递物", dataIndex: "object", width: 240 },
      { title: "投递方式", dataIndex: "method", width: 110 },
      { title: "投递个数", dataIndex: "count", width: 110 },
      { title: "操作状态", dataIndex: "status", width: 110, render: value => <Tag color={statusColor[value]}>{value}</Tag> },
      { title: "开始时间", dataIndex: "start", width: 160 },
      { title: "结束时间", dataIndex: "end", width: 160 },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 210,
        render: (_, record) => {
          if (record.status === "作废") return <Text type="secondary">不可操作</Text>;
          if (record.status === "启用") return <Button danger size="small" onClick={() => updateDeliveryStatus(record, "作废")}>作废</Button>;
          return (
            <Space size={4} wrap>
              <Button size="small" type="primary" onClick={() => setModalState({ open: true, mode: "edit", item: record })}>修改</Button>
              <Button size="small" type="primary" onClick={() => updateDeliveryStatus(record, "启用")}>启用</Button>
              <Button size="small" danger onClick={() => updateDeliveryStatus(record, "作废")}>作废</Button>
            </Space>
          );
        }
      }
    ];

    return (
      <section className="page-surface">
        <Text type="secondary">启用后可作废，作废后不可启用，仅在未启用下可修改</Text>
        <div className="toolbar">
          <Space wrap>
            <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="任务名" allowClear className="keyword-input" />
            <Select value={objectFilter} onChange={value => {
              setObjectFilter(value);
              setPage(1);
            }} placeholder="投递物" allowClear className="select-input" options={["抹亏券", "资金账户奖金", "XP", "金币"].map(value => ({ value, label: value }))} />
            <Select value={statusFilter} onChange={value => {
              setStatusFilter(value);
              setPage(1);
            }} placeholder="操作状态" allowClear className="select-input" options={["未启用", "启用", "作废"].map(value => ({ value, label: value }))} />
            <Button onClick={() => message.info("更多筛选面板已模拟展开")}>更多筛选</Button>
            <Button type="primary" onClick={() => {
              setPage(1);
              message.success("投递列表已查询");
            }}>查询</Button>
            <Button onClick={() => {
              setKeyword("");
              setObjectFilter(undefined);
              setStatusFilter(undefined);
              setPage(1);
              message.success("投递筛选已重置");
            }}>重置</Button>
          </Space>
          <Button type="primary" onClick={() => setModalState({ open: true, mode: "add", item: null })}>新建</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredDeliveries}
          pagination={{ current: page, pageSize, total: filteredDeliveries.length, showSizeChanger: true, onChange: (next, size) => {
            setPage(next);
            setPageSize(size);
          }}}
          scroll={{ x: 1370 }}
        />
        <DeliveryModal
          open={modalState.open}
          mode={modalState.mode}
          item={modalState.item}
          options={options}
          onCancel={() => setModalState({ open: false, mode: "add", item: null })}
          onSave={saveDelivery}
        />
        <Drawer title="投递任务详情" open={Boolean(detail)} width={520} onClose={() => setDetail(null)}>
          {detail && (
            <div className="detail-list">
              <div><Text type="secondary">投递任务名</Text><strong>{detail.name}</strong></div>
              <div><Text type="secondary">投递物</Text><span>{detail.objectDetail}</span></div>
              <div><Text type="secondary">投递方式</Text><span>{detail.method}</span></div>
              <div><Text type="secondary">投递个数</Text><span>{detail.count}</span></div>
              <div><Text type="secondary">开始时间</Text><span>{detail.start}</span></div>
              <div><Text type="secondary">结束时间</Text><span>{detail.end}</span></div>
              <div><Text type="secondary">触发事件</Text><span>{detail.event}</span></div>
              <div><Text type="secondary">事件参数</Text><span dangerouslySetInnerHTML={{ __html: detail.param }} /></div>
              <div><Text type="secondary">操作状态</Text><Tag color={statusColor[detail.status]}>{detail.status}</Tag></div>
              <div><Text type="secondary">操作人</Text><span>{detail.operator}</span></div>
            </div>
          )}
        </Drawer>
      </section>
    );
  }

  function AdminApp() {
    const [currentPage, setCurrentPage] = React.useState("overview");
    const [rules, setRules] = React.useState(() => cloneData(app.mockData.rules));
    const [deliveries, setDeliveries] = React.useState(() => cloneData(app.mockData.deliveries));
    const [agentLevels, setAgentLevels] = React.useState(() => cloneData(app.mockData.agentLevels));
    const [commissionRules, setCommissionRules] = React.useState(() => cloneData(app.mockData.commissionRules));
    const [openTabs, setOpenTabs] = React.useState(["overview"]);
    const menuItems = [
      {
        key: "customerGroup",
        label: "客户管理",
        children: [
          { key: "customer", label: "客户列表" },
          { key: "loginLog", label: "用户登录日志" },
          { key: "overview", label: "数据概览" }
        ]
      },
      {
        key: "agentGroup",
        label: "代理关系管理",
        children: [
          { key: "agent", label: "代理商列表" },
          { key: "agentLevel", label: "代理等级配置" },
          { key: "commission", label: "佣金配置管理" }
        ]
      },
      {
        key: "points",
        label: "积分",
        children: [{ key: "rules", label: "积分获取设置" }]
      },
      { key: "badge", label: "徽章列表", disabled: true },
      { key: "coupon", label: "优惠券管理", disabled: true },
      {
        key: "deliveryGroup",
        label: "投递管理",
        children: [
          { key: "delivery", label: "投递列表" },
          { key: "records", label: "投递记录", disabled: true }
        ]
      },
      { key: "funds", label: "出入金管理", disabled: true },
      {
        key: "systemGroup",
        label: "系统管理",
        children: [
          { key: "roles", label: "角色管理", disabled: true },
          { key: "users", label: "用户设置管理", disabled: true }
        ]
      }
    ];

    const navPages = app.buildNavIndex(menuItems);
    const navKeys = navPages.map(page => page.key);
    React.useEffect(() => {
      setOpenTabs(tabs => tabs.includes(currentPage) ? tabs : [...tabs, currentPage]);
    }, [currentPage]);
    function closeTab(key) {
      if (key === "overview") return;
      const index = openTabs.indexOf(key);
      if (index === -1) return;
      const next = openTabs.filter(tab => tab !== key);
      setOpenTabs(next);
      if (currentPage === key) setCurrentPage(next[index] || next[index - 1] || "overview");
    }
    function closeOtherTabs() {
      setOpenTabs(currentPage === "overview" ? ["overview"] : ["overview", currentPage]);
    }
    function closeAllTabs() {
      setOpenTabs(["overview"]);
      setCurrentPage("overview");
    }

    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 6,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }
        }}
      >
        <AntApp>
          <Layout className="admin-shell">
            <Sider width={232} className="admin-sider">
              <div className="brand"><span className="brand-mark"></span><span>Cui</span></div>
              <Menu
                mode="inline"
                selectedKeys={[currentPage]}
                defaultOpenKeys={["customerGroup", "agentGroup", "points", "deliveryGroup", "systemGroup"]}
                items={menuItems}
                onClick={({ key }) => {
                  if (navKeys.includes(key)) setCurrentPage(key);
                }}
              />
            </Sider>
            <Layout>
              <Header className="admin-header">
                <div className="page-tabbar-wrap">
                  <app.PageTabs
                    pages={navPages}
                    openTabs={openTabs}
                    activeKey={currentPage}
                    onChange={setCurrentPage}
                    onClose={closeTab}
                    onCloseOthers={closeOtherTabs}
                    onCloseAll={closeAllTabs}
                  />
                </div>
                <Space>
                  <app.GlobalSearch menuItems={menuItems} onNavigate={setCurrentPage} />
                  <Button shape="circle">?</Button>
                  <Button
                    shape="circle"
                    title="退出登录"
                    aria-label="退出登录"
                    onClick={() => {
                      const ref = Modal.confirm({
                        title: "退出登录",
                        content: "确定退出当前账号并返回登录页吗?",
                        okText: "退出",
                        cancelText: "取消",
                        onOk: () => {
                          ref.destroy();
                          window.location.href = "login.html";
                        },
                        onCancel: () => ref.destroy()
                      });
                    }}
                  >
                    <span
                      role="img"
                      aria-label="logout"
                      className="anticon anticon-logout"
                      style={{ display: "inline-flex", lineHeight: 0, fontSize: 14 }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="1em"
                        height="1em"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                  </Button>
                </Space>
              </Header>
              <Content className="admin-content">
                {currentPage === "overview" ? (
                  <app.DashboardPage data={app.mockData.dashboard} customers={app.mockData.customers} />
                ) : currentPage === "customer" ? (
                  <app.CustomerPage
                    customers={app.mockData.customers}
                    services={app.mockData.customerServices}
                  />
                ) : currentPage === "loginLog" ? (
                  <app.LoginLogPage logs={app.mockData.loginLogs} />
                ) : currentPage === "agent" ? (
                  <app.AgentPage agents={app.mockData.agents} />
                ) : currentPage === "agentLevel" ? (
                  <app.AgentLevelPage
                    levels={agentLevels}
                    setLevels={setAgentLevels}
                    rules={commissionRules}
                    agents={app.mockData.agents}
                  />
                ) : currentPage === "commission" ? (
                  <app.CommissionPage
                    rules={commissionRules}
                    setRules={setCommissionRules}
                    levels={agentLevels}
                    agents={app.mockData.agents}
                  />
                ) : currentPage === "rules" ? (
                  <RulesPage rules={rules} setRules={setRules} />
                ) : (
                  <DeliveryPage deliveries={deliveries} setDeliveries={setDeliveries} options={app.mockData.cascaderOptions} />
                )}
              </Content>
            </Layout>
          </Layout>
        </AntApp>
      </ConfigProvider>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<AdminApp />);
})(window.AdminApp);

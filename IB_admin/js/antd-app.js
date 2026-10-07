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
  const {
    Header,
    Sider,
    Content
  } = Layout;
  const {
    RangePicker
  } = DatePicker;
  const {
    TextArea
  } = Input;
  const {
    Text
  } = Typography;
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
    const xp = Number(record.rewardXp) || 0;
    const drop = Number(record.rewardDrop) || 0;
    if (xp > 0) return /*#__PURE__*/React.createElement(Tag, {
      color: "blue"
    }, xp, " XP");
    if (drop > 0) return /*#__PURE__*/React.createElement(Tag, {
      color: "gold"
    }, drop, " Drop");
    return /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "-");
  }
  const conditionParamMap = {
    "开仓": ["手数", "交易金额", "订单笔数"],
    "手续费": ["手续费金额"],
    "跟单": ["跟单金额", "跟单笔数"],
    "连续签到": ["签到天数"],
    "手动触发": []
  };
  const conditionDefaults = {
    "手数": 5,
    "交易金额": 1000,
    "订单笔数": 1,
    "手续费金额": 100,
    "跟单金额": 100,
    "跟单笔数": 1,
    "签到天数": 5
  };
  function LessonRow({
    form,
    field
  }) {
    const videoType = Form.useWatch(["courseLessons", field.name, "videoType"], form);
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Form.Item, {
      name: [field.name, "title"],
      label: "讲次标题",
      rules: [{
        required: true,
        message: "请输入讲次标题"
      }],
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "如：什么是外汇与 CFD 市场",
      maxLength: 40
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: [field.name, "videoType"],
      label: "视频来源",
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(antd.Radio.Group, {
      options: [{
        value: "视频链接",
        label: "视频链接"
      }, {
        value: "上传视频",
        label: "上传视频"
      }]
    })), videoType === "上传视频" ? /*#__PURE__*/React.createElement(Form.Item, {
      label: "视频文件",
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        form.setFieldValue(["courseLessons", field.name, "videoUrl"], `uploads/courses/${Date.now()}.mp4`);
        message.success("视频已模拟上传");
      }
    }, "上传视频（模拟）")) : /*#__PURE__*/React.createElement(Form.Item, {
      name: [field.name, "videoUrl"],
      label: "视频链接",
      rules: [{
        required: true,
        message: "请填写视频链接"
      }],
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "https://…（MP4 直链或视频平台地址）",
      allowClear: true
    })));
  }
  function LessonTabs({
    form,
    fields,
    add,
    remove
  }) {
    const keyList = fields.map(field => String(field.key));
    const [activeKey, setActiveKey] = React.useState();
    React.useEffect(() => {
      if (!keyList.includes(activeKey)) setActiveKey(keyList[keyList.length - 1]);
    }, [keyList.join("|")]);
    return /*#__PURE__*/React.createElement(Tabs, {
      type: "editable-card",
      activeKey,
      onChange: setActiveKey,
      onEdit: (targetKey, action) => {
        if (action === "add") {
          add({
            title: "",
            videoType: "视频链接",
            videoUrl: ""
          });
        } else if (action === "remove") {
          const index = fields.findIndex(field => String(field.key) === targetKey);
          if (index > -1) remove(index);
        }
      },
      items: fields.map((field, index) => ({
        key: String(field.key),
        label: `讲次 ${index + 1}`,
        forceRender: true,
        closable: fields.length > 1,
        children: /*#__PURE__*/React.createElement(LessonRow, {
          form: form,
          field: field
        })
      }))
    });
  }
  function RuleDrawer({
    open,
    mode,
    rule,
    courses,
    lessons,
    onCancel,
    onSave
  }) {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = React.useState("daily");
    const [languages, setLanguages] = React.useState(["英语"]);
    const [activeLang, setActiveLang] = React.useState("英语");
    const triggerEvent = Form.useWatch("triggerEvent", form);
    const accountScope = Form.useWatch("accountScope", form);
    const conditions = Form.useWatch("conditions", form) || [];
    const relation = Form.useWatch("relation", form);
    React.useEffect(() => {
      if (!open) return;
      setActiveTab(rule?.ruleType === "课程任务" ? "course" : "daily");
      setLanguages(["英语"]);
      setActiveLang("英语");
      const linkedCourse = rule?.courseId && courses ? courses.find(course => course.id === rule.courseId) : null;
      const linkedLessons = rule?.courseId && lessons ? lessons.filter(lesson => lesson.courseId === rule.courseId) : [];
      form.setFieldsValue({
        courseTitle: rule?.courseName ? mode === "copy" ? `${rule.courseName}-副本` : rule.courseName : "",
        courseIntro: linkedCourse?.intro || "",
        courseTriggerEvent: rule?.ruleType === "课程任务" && rule.triggerEvent ? rule.triggerEvent : "课程",
        courseLessons: linkedLessons.map(lesson => ({
          title: lesson.title,
          videoType: lesson.videoType === "上传" ? "上传视频" : "视频链接",
          videoUrl: lesson.videoUrl
        })),
        externalName: rule && rule.ruleType !== "课程任务" ? mode === "copy" ? `${rule.externalName.replace(/^英语:\s*/, "")}-副本` : rule.externalName.replace(/^英语:\s*/, "") : "",
        internalName: rule && rule.ruleType !== "课程任务" ? mode === "copy" ? `${rule.internalName}-副本` : rule.internalName : "",
        taskType: rule && rule.ruleType !== "课程任务" && rule.taskType && rule.taskType !== "全部" ? rule.taskType : undefined,
        cyclePeriod: rule && rule.ruleType !== "课程任务" ? rule.cyclePeriod || "不限" : "不限",
        cycleCount: rule && rule.ruleType !== "课程任务" ? rule.cycleCount || "循环" : "循环",
        triggerDates: rule && rule.ruleType !== "课程任务" ? rule.triggerDates || [] : [],
        cycleRange: rule && rule.ruleType !== "课程任务" && rule.timeRange && rule.timeRange.includes(" 至 ") ? [dayjs(rule.timeRange.split(" 至 ")[0]), dayjs(rule.timeRange.split(" 至 ")[1])] : undefined,
        rewardValue: Number(rule?.rewardXp || rule?.rewardDrop || 0),
        rewardType: Number(rule?.rewardDrop || 0) > 0 && Number(rule?.rewardXp || 0) <= 0 ? "Drop" : "XP",
        triggerEvent: rule && rule.ruleType !== "课程任务" ? rule?.triggerEvent === "首次连续签到" ? "连续签到" : rule?.triggerEvent || "开仓" : "开仓",
        accountScope: "all",
        conditions: [],
        relation: "all",
        ruleDesc: rule && rule.ruleType !== "课程任务" ? `${rule.internalName}任务规则说明` : ""
      });
    }, [open, mode, rule, courses, lessons, form]);
    React.useEffect(() => {
      if (!open || activeTab !== "course") return;
      const rows = form.getFieldValue("courseLessons");
      if (!rows || !rows.length) {
        form.setFieldValue("courseLessons", [{
          title: "",
          videoType: "视频链接",
          videoUrl: ""
        }]);
      }
    }, [open, activeTab, form]);
    React.useEffect(() => {
      if (!open || !triggerEvent) return;
      const params = conditionParamMap[triggerEvent] || [];
      form.setFieldValue("conditions", params.length ? [{
        param: params[0],
        value: conditionDefaults[params[0]]
      }] : []);
      const rewardValue = form.getFieldValue("rewardValue");
      if (triggerEvent === "开仓" && !rewardValue) {
        form.setFieldValue("rewardType", "Drop");
        form.setFieldValue("rewardValue", 100);
      }
      if (triggerEvent !== "开仓" && !rewardValue) {
        form.setFieldValue("rewardType", "XP");
        form.setFieldValue("rewardValue", triggerEvent === "连续签到" ? 33 : 150);
      }
    }, [triggerEvent]);
    const paramOptions = conditionParamMap[triggerEvent] || [];
    const usedParams = conditions.map(item => item?.param).filter(Boolean);
    const scopeText = !accountScope || accountScope === "all" ? "全部账号" : accountScope;
    const conditionText = conditions.filter(item => item?.param).map(item => `${item.param} ≥ ${item.value ?? "—"}`).join(relation === "any" ? " 或 " : " 且 ");
    const relationText = relation === "any" ? "任一达成即可" : "须全部达成";
    function addLanguage() {
      const next = languages.includes("繁体中文") ? "简体中文" : "繁体中文";
      if (!languages.includes(next)) setLanguages([...languages, next]);
      setActiveLang(next);
      form.setFieldValue("externalName", "");
      form.setFieldValue("courseTitle", "");
      message.success(`已添加${next}`);
    }
    function removeLanguage(lang) {
      setLanguages(languages.filter(item => item !== lang));
      setActiveLang("英语");
    }
    async function handleSave() {
      const values = await form.validateFields();
      if (activeTab === "course") {
        const courseName = values.courseTitle || "未命名课程";
        const courseRewardType = values.rewardType || "XP";
        const courseRewardValue = Number(values.rewardValue || 0);
        if (courseRewardValue <= 0) {
          message.warning("奖励值不能为空");
          return;
        }
        const data = {
          ruleType: "课程任务",
          internalName: courseName,
          externalName: `${activeLang}: ${courseName}`,
          triggerEvent: values.courseTriggerEvent || "课程",
          cyclePeriod: "不限",
          rewardXp: courseRewardType === "XP" ? courseRewardValue : 0,
          rewardDrop: courseRewardType === "Drop" ? courseRewardValue : 0,
          timeRange: "-"
        };
        const coursePayload = {
          course: {
            title: courseName,
            intro: values.courseIntro || "",
            rewardXp: courseRewardType === "XP" ? courseRewardValue : 0
          },
          lessons: (values.courseLessons || []).map(row => ({
            title: row.title,
            videoType: row.videoType || "视频链接",
            videoUrl: row.videoUrl
          })),
          updateCourseId: mode === "edit" ? rule?.courseId || null : null
        };
        const courseConfirmRef = Modal.confirm({
          title: "确认保存",
          content: `将保存课程任务“${courseName}”，奖励为 ${courseRewardType} ${courseRewardValue}。`,
          onOk: () => {
            courseConfirmRef.destroy();
            onSave(data, coursePayload);
          },
          onCancel: () => courseConfirmRef.destroy()
        });
        return;
      }
      const rewardType = values.rewardType || "XP";
      const rewardValue = Number(values.rewardValue || 0);
      if (rewardValue <= 0) {
        message.warning("奖励值不能为空");
        return;
      }
      const rewardXp = rewardType === "XP" ? rewardValue : 0;
      const rewardDrop = rewardType === "Drop" ? rewardValue : 0;
      const conditionSummary = values.triggerEvent === "手动触发" ? "后台人工触发" : conditionText ? conditions.length > 1 ? `${conditionText}（${relationText}）` : conditionText : "未设置";
      const cyclePeriod = values.cyclePeriod || "不限";
      const cycleRange = cyclePeriod !== "不限" ? values.cycleRange : null;
      const data = {
        ruleType: "普通任务",
        internalName: values.internalName || "未命名规则",
        externalName: `${activeLang}: ${values.externalName || "未命名规则"}`,
        triggerEvent: values.triggerEvent === "连续签到" ? "首次连续签到" : values.triggerEvent,
        cyclePeriod,
        rewardXp,
        rewardDrop,
        taskType: values.taskType || "全部",
        timeRange: cycleRange ? `${cycleRange[0].format("YYYY-MM-DD HH:mm:ss")} 至 ${cycleRange[1].format("YYYY-MM-DD HH:mm:ss")}` : "-",
        cycleCount: values.cycleCount || "循环",
        triggerDates: values.triggerDates || [],
        conditions: values.conditions || [],
        relation: values.relation || "all"
      };
      const dailyConfirmRef = Modal.confirm({
        title: "确认保存",
        content: `将保存规则“${data.internalName}”，奖励为 ${rewardType} ${rewardValue}。达成条件：${conditionSummary}。`,
        onOk: () => {
          dailyConfirmRef.destroy();
          onSave(data, null);
        },
        onCancel: () => dailyConfirmRef.destroy()
      });
    }
    const tabItems = languages.map(lang => ({
      key: lang,
      label: /*#__PURE__*/React.createElement(Space, {
        size: 4
      }, lang, lang !== "英语" && /*#__PURE__*/React.createElement(Button, {
        type: "text",
        size: "small",
        onClick: event => {
          event.stopPropagation();
          removeLanguage(lang);
        }
      }, "x"))
    })).concat({
      key: "__add",
      label: "+ 添加语言"
    });
    const langFieldsNode = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "externalName",
      label: "外部名称",
      rules: [{
        required: true,
        message: "请输入外部名称"
      }]
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "前端展示名称"
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "ruleDesc",
      label: "规则说明"
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "任务规则说明"
    }))));
    const drawerTitle = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 700
      }
    }, mode === "edit" ? "修改规则" : mode === "copy" ? "复制规则" : "新增规则"), /*#__PURE__*/React.createElement(Text, {
      type: "secondary",
      style: {
        fontSize: 12,
        fontWeight: 400
      }
    }, "请选择任务类型页签并完善对应配置"));
    const dailyTab = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      key: "card-basic",
      className: "drawer-form-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "基础信息"),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "internalName",
      label: "内部规则名称",
      rules: [{
        required: true,
        message: "请输入内部规则名称"
      }]
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "请输入内部规则名称"
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "taskType",
      label: "任务类型"
    }, /*#__PURE__*/React.createElement(Select, {
      placeholder: "请选择任务类型",
      allowClear: true,
      options: ["全部", "新手任务"].map(value => ({
        value,
        label: value
      }))
    })))), /*#__PURE__*/React.createElement("div", {
      key: "card-lang",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "展示与多语言"),  /*#__PURE__*/React.createElement(Tabs, {
      activeKey: activeLang,
      items: tabItems,
      onChange: key => key === "__add" ? addLanguage() : setActiveLang(key)
    }),  langFieldsNode), /*#__PURE__*/React.createElement("div", {
      key: "card-cond",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "触发条件"),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "triggerEvent",
      label: "触发事件",
      rules: [{
        required: true
      }]
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["开仓", "手续费", "跟单", "连续签到", "手动触发"].map(value => ({
        value,
        label: value
      }))
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "accountScope",
      label: "账号类型"
    }, /*#__PURE__*/React.createElement(Select, {
      options: [{
        value: "all",
        label: "全部账号"
      }, {
        value: "模拟账户",
        label: "模拟账户"
      }, {
        value: "交易账户",
        label: "交易账户"
      }, {
        value: "跟单账户",
        label: "跟单账户"
      }]
    }))),  triggerEvent !== "手动触发" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "form-sub-title"
    }, "达成条件", /*#__PURE__*/React.createElement("span", {
      className: "form-sub-hint"
    }, "客户达成以下条件即可获得对应奖励")), /*#__PURE__*/React.createElement(Form.List, {
      name: "conditions"
    }, (fields, _ref) => {
      let {
        add,
        remove
      } = _ref;
      return /*#__PURE__*/React.createElement("div", {
        className: "condition-list"
      }, fields.map(field => /*#__PURE__*/React.createElement("div", {
        className: "condition-row",
        key: field.key
      }, /*#__PURE__*/React.createElement(Form.Item, {
        name: [field.name, "param"],
        rules: [{
          required: true,
          message: "请选择参数"
        }],
        noStyle: true
      }, /*#__PURE__*/React.createElement(Select, {
        style: {
          width: 150
        },
        placeholder: "选择参数",
        options: paramOptions.filter(param => !usedParams.includes(param) || param === conditions[field.name]?.param).map(value => ({
          value,
          label: value
        }))
      })), /*#__PURE__*/React.createElement("span", {
        className: "condition-op"
      }, "≥"), /*#__PURE__*/React.createElement(Form.Item, {
        name: [field.name, "value"],
        rules: [{
          required: true,
          message: "请输入数值"
        }],
        noStyle: true
      }, /*#__PURE__*/React.createElement(InputNumber, {
        min: 1,
        precision: 0,
        style: {
          width: 150
        },
        placeholder: "数值"
      })), fields.length > 1 && /*#__PURE__*/React.createElement(Button, {
        type: "text",
        danger: true,
        size: "small",
        onClick: () => remove(field.name)
      }, "移除"))), /*#__PURE__*/React.createElement(Button, {
        type: "dashed",
        size: "small",
        disabled: usedParams.length >= paramOptions.length,
        onClick: () => {
          const nextParam = paramOptions.find(param => !usedParams.includes(param));
          if (nextParam) add({
            param: nextParam,
            value: conditionDefaults[nextParam]
          });
        }
      }, "+ 添加条件"));
    }), conditions.length > 1 && /*#__PURE__*/React.createElement(Form.Item, {
      name: "relation",
      label: "条件关系"
    }, /*#__PURE__*/React.createElement(antd.Radio.Group, {
      options: [{
        value: "any",
        label: "满足任一条件即可"
      }, {
        value: "all",
        label: "所有条件须全部达成"
      }]
    }))),  triggerEvent === "手动触发" && /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "手动触发事件由运营在后台人工执行，无需配置达成条件。"),  /*#__PURE__*/React.createElement("div", {
      className: "rule-preview"
    }, /*#__PURE__*/React.createElement(Text, {
      strong: true
    }, "规则逻辑："), triggerEvent === "手动触发" ? /*#__PURE__*/React.createElement("span", null, "该规则由运营在后台人工触发，触发即判定任务完成。") : /*#__PURE__*/React.createElement("span", null, "当「", scopeText, "」发生「", triggerEvent, "」，且", /*#__PURE__*/React.createElement(Text, {
      strong: true
    }, conditionText || "未设置条件"), conditions.length > 1 ? `（${relationText}）` : "", "时，判定任务完成。"))), /*#__PURE__*/React.createElement("div", {
      key: "card-reward",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "奖励"),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "rewardType",
      label: "奖励类型",
      rules: [{
        required: true,
        message: "请选择奖励类型"
      }]
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["XP", "Drop"].map(value => ({
        value,
        label: value
      }))
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "rewardValue",
      label: "奖励值"
    }, /*#__PURE__*/React.createElement(InputNumber, {
      min: 0,
      precision: 0,
      className: "full-control",
      placeholder: "0"
    })))), /*#__PURE__*/React.createElement("div", {
      key: "card-cycle",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "循环与时间"),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "cycleCount",
      label: "循环次数",
      initialValue: "循环",
      rules: [{
        required: true,
        message: "请选择循环次数"
      }]
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["循环", "单次"].map(value => ({
        value,
        label: value
      }))
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "cyclePeriod",
      label: "循环周期",
      rules: [{
        required: true,
        message: "请选择循环周期"
      }]
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["不限", "按天"].map(value => ({
        value,
        label: value
      }))
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "triggerDates",
      label: "周期内可触发日期"
    }, /*#__PURE__*/React.createElement(Select, {
      mode: "multiple",
      maxTagCount: "responsive",
      allowClear: true,
      placeholder: "周期内可触发日期",
      options: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map(value => ({
        value,
        label: value
      }))
    }))),  /*#__PURE__*/React.createElement(Form.Item, {
      name: "cycleRange",
      label: "总任务生效时间"
    }, /*#__PURE__*/React.createElement(RangePicker, {
      showTime: true,
      format: "YYYY-MM-DD HH:mm:ss",
      className: "full-control",
      placeholder: ["开始时间", "结束时间"]
    }))));
    const courseTab = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      key: "card-basic",
      className: "drawer-form-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "基础信息"),  /*#__PURE__*/React.createElement(Tabs, {
      activeKey: activeLang,
      items: tabItems,
      onChange: key => key === "__add" ? addLanguage() : setActiveLang(key)
    }),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "courseTitle",
      label: `课程名称（${activeLang}）`,
      rules: [{
        required: true,
        message: "请输入课程名称"
      }]
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "如：新手村",
      maxLength: 30
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "courseIntro",
      label: `课程简介（${activeLang}）`,
      rules: [{
        required: true,
        message: "请输入课程简介"
      }]
    }, /*#__PURE__*/React.createElement(TextArea, {
      rows: 3,
      maxLength: 120,
      placeholder: "展示在学院课程卡与导航简介位"
    })))), /*#__PURE__*/React.createElement("div", {
      key: "card-cond",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "触发条件"),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "courseTriggerEvent",
      label: "触发事件",
      rules: [{
        required: true,
        message: "请选择触发事件"
      }]
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["课程", "开仓", "手续费", "跟单", "连续签到", "手动触发"].map(value => ({
        value,
        label: value
      }))
    })))), /*#__PURE__*/React.createElement("div", {
      key: "card-lessons",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "章节视频", /*#__PURE__*/React.createElement("span", {
      className: "form-sub-hint"
    }, "客户完成任一讲次即判定任务完成，讲次顺序即播放顺序")),  /*#__PURE__*/React.createElement(Form.List, {
      name: "courseLessons"
    }, (fields, _ref2) => {
      let {
        add,
        remove
      } = _ref2;
      return /*#__PURE__*/React.createElement(LessonTabs, {
        form: form,
        fields: fields,
        add: add,
        remove: remove
      });
    })), /*#__PURE__*/React.createElement("div", {
      key: "card-reward",
      className: "drawer-form-card"
    },  /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "奖励"),  /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "rewardType",
      label: "奖励类型",
      rules: [{
        required: true,
        message: "请选择奖励类型"
      }]
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["XP", "Drop"].map(value => ({
        value,
        label: value
      }))
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "rewardValue",
      label: "奖励值"
    }, /*#__PURE__*/React.createElement(InputNumber, {
      min: 0,
      precision: 0,
      className: "full-control",
      placeholder: "0"
    })))));
    return /*#__PURE__*/React.createElement(Drawer, {
      title: drawerTitle,
      open: open,
      width: 720,
      onClose: onCancel,
      destroyOnClose: true,
      footer: /*#__PURE__*/React.createElement("div", {
        className: "drawer-footer-actions"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: onCancel
      }, "取消"), /*#__PURE__*/React.createElement(Button, {
        type: "primary",
        onClick: handleSave
      }, "保存"))
    }, /*#__PURE__*/React.createElement(Form, {
      form: form,
      layout: "vertical",
      className: "admin-form"
    }, /*#__PURE__*/React.createElement(Tabs, {
      activeKey: activeTab,
      onChange: setActiveTab,
      destroyInactiveTabPane: true,
      items: [{
        key: "daily",
        label: "日常任务",
        children: dailyTab
      }, {
        key: "course",
        label: "课程任务",
        children: courseTab
      }]
    })));
  }
  function RuleDetailDrawer({
    rule,
    courses,
    lessons,
    onClose
  }) {
    const course = rule?.courseId ? courses.find(item => item.id === rule.courseId) : null;
    const ruleLessons = rule?.courseId ? lessons.filter(item => item.courseId === rule.courseId) : [];
    const conditionText = rule?.conditions?.length ? rule.conditions.map(item => `${item.param} ≥ ${item.value}`).join(rule.relation === "any" ? " 或 " : " 且 ") : "-";
    const row = (label, value) => /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        padding: "7px 0",
        borderBottom: "1px solid #f0f0f0",
        fontSize: 13,
        lineHeight: 1.6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: "0 0 104px",
        color: "#8a93a3"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, value));
    const body = rule ? /*#__PURE__*/React.createElement("div", null, row("类型", rule.ruleType === "课程任务" ? "课程任务" : rule.taskType === "新手任务" ? "普通任务-新手" : "普通任务"), row("内部规则名称", rule.ruleType === "课程任务" ? "--" : rule.internalName), row("外部规则名称", rule.ruleType === "课程任务" ? "--" : rule.externalName), row("任务类型", rule.taskType || "-"), rule.ruleType === "课程任务" && /*#__PURE__*/React.createElement(React.Fragment, null, row("课程名称", rule.courseName || "-"), row("课程简介", course?.intro || "-"), row("每讲完课奖励", course ? `${course.rewardXp} XP` : "-"), row("章节视频", ruleLessons.length ? /*#__PURE__*/React.createElement("div", null, ruleLessons.map((lesson, index) => /*#__PURE__*/React.createElement("div", {
      key: lesson.id
    }, `${index + 1}. ${lesson.title}（${lesson.videoType === "上传" ? "上传视频" : "视频链接"}）`))) : "-")), row("触发事件", rule.ruleType === "课程任务" ? "--" : rule.triggerEvent || "-"), row("达成条件", conditionText), row("循环周期", rule.cyclePeriod || "-"), row("循环次数", rule.cycleCount || "-"), row("周期内可触发日期", rule.triggerDates?.length ? rule.triggerDates.join("、") : "-"), row("生效时间", rule.timeRange && rule.timeRange !== "-" ? rule.timeRange : "-"), row("奖励", rewardNode(rule)), row("规则状态", /*#__PURE__*/React.createElement(Tag, {
      color: statusColor[rule.status]
    }, rule.status)), row("操作人", rule.operator || "-")) : null;
    return /*#__PURE__*/React.createElement(Drawer, {
      open: !!rule,
      title: "规则详情",
      width: 560,
      onClose: onClose,
      destroyOnClose: true
    }, body);
  }
  function RulesPage({
    rules,
    setRules,
    courses,
    setCourses,
    lessons,
    setLessons
  }) {
    const [keyword, setKeyword] = React.useState("");
    const [status, setStatus] = React.useState();
    const [page, setPage] = React.useState(1);
    const [sorter, setSorter] = React.useState({});
    const [visibleColumns, setVisibleColumns] = React.useState(["type", "internalName", "externalName", "courseInfo", "triggerEvent", "reward", "status", "operator"]);
    const [modalState, setModalState] = React.useState({
      open: false,
      mode: "add",
      rule: null
    });
    const [detailRule, setDetailRule] = React.useState(null);
    const [pageSize, setPageSize] = React.useState(20);
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
    const ruleTypeText = record => {
      if (record.ruleType === "课程任务") return "课程任务";
      if (record.taskType === "新手任务") return "普通任务-新手";
      return "普通任务";
    };
    const columnMap = {
      type: {
        title: "类型",
        key: "type",
        width: 130,
        render: (_, record) => /*#__PURE__*/React.createElement(Tag, {
          color: record.ruleType === "课程任务" ? "purple" : "default"
        }, ruleTypeText(record))
      },
      internalName: {
        title: "内部规则名称",
        dataIndex: "internalName",
        width: 170,
        render: (_, record) => record.ruleType === "课程任务" ? "--" : record.internalName
      },
      externalName: {
        title: "外部规则名称",
        dataIndex: "externalName",
        width: 180,
        render: (_, record) => record.ruleType === "课程任务" ? "--" : record.externalName
      },
      courseInfo: {
        title: "课程信息",
        key: "courseInfo",
        width: 200,
        render: (_, record) => record.ruleType !== "课程任务" ? "--" : record.courseName || "-"
      },
      triggerEvent: {
        title: "触发事件",
        dataIndex: "triggerEvent",
        width: 120,
        render: (_, record) => record.ruleType === "课程任务" ? "--" : record.triggerEvent
      },
      reward: {
        title: "奖励",
        key: "reward",
        width: 150,
        render: (_, record) => rewardNode(record)
      },
      status: {
        title: "规则状态",
        dataIndex: "status",
        width: 110,
        sorter: true,
        render: value => /*#__PURE__*/React.createElement(Tag, {
          color: statusColor[value]
        }, value)
      },
      operator: {
        title: "操作人",
        dataIndex: "operator",
        width: 100,
        render: value => value || "-"
      }
    };
    function saveRule(data, coursePayload) {
      if (coursePayload) {
        const lessonBaseId = lessons.reduce((max, item) => Math.max(max, item.id), 0);
        if (coursePayload.updateCourseId) {
          const cid = coursePayload.updateCourseId;
          setCourses(courses.map(item => item.id === cid ? {
            ...item,
            ...coursePayload.course
          } : item));
          setLessons(lessons.filter(item => item.courseId !== cid).concat(coursePayload.lessons.map((row, index) => ({
            ...row,
            id: lessonBaseId + 1 + index,
            courseId: cid
          }))));
          data.courseId = cid;
        } else {
          const cid = courses.reduce((max, item) => Math.max(max, item.id), 0) + 1;
          setCourses([{
            id: cid,
            status: "草稿",
            operator: "Bella",
            ...coursePayload.course
          }, ...courses]);
          setLessons(lessons.concat(coursePayload.lessons.map((row, index) => ({
            ...row,
            id: lessonBaseId + 1 + index,
            courseId: cid
          }))));
          data.courseId = cid;
        }
        data.courseName = coursePayload.course.title;
      }
      if (modalState.mode === "edit") {
        setRules(rules.map(item => item.id === modalState.rule.id ? {
          ...item,
          ...data
        } : item));
        message.success("规则已修改");
      } else {
        setRules([{
          id: Date.now(),
          ...data,
          operator: data.operator || "Bella",
          status: "待启用",
          canEdit: true
        }, ...rules]);
        message.success(modalState.mode === "copy" ? "规则已复制" : "规则已新增");
      }
      setPage(1);
      setModalState({
        open: false,
        mode: "add",
        rule: null
      });
    }
    function updateRuleStatus(record, nextStatus) {
      Modal.confirm({
        title: nextStatus === "启用" ? "确认启用" : "确认禁用",
        content: nextStatus === "启用" ? `启用后规则“${record.internalName}”将按当前条件发放奖励。` : `禁用后规则“${record.internalName}”不会继续发放奖励。`,
        onOk: () => {
          setRules(rules.map(item => item.id === record.id ? {
            ...item,
            status: nextStatus
          } : item));
          message.success(nextStatus === "启用" ? "规则已启用" : "规则已禁用");
        }
      });
    }
    const columns = [...visibleColumns.map(key => columnMap[key]), {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => /*#__PURE__*/React.createElement(Space, {
        size: 4,
        wrap: true
      }, record.status === "启用" ? /*#__PURE__*/React.createElement(Button, {
        danger: true,
        size: "small",
        onClick: () => updateRuleStatus(record, "禁用")
      }, "禁用") : /*#__PURE__*/React.createElement(Button, {
        size: "small",
        disabled: record.status === "禁用",
        onClick: () => updateRuleStatus(record, "启用")
      }, "启用"), record.canEdit && /*#__PURE__*/React.createElement(Button, {
        type: "link",
        size: "small",
        onClick: () => setModalState({
          open: true,
          mode: "edit",
          rule: record
        })
      }, "修改"), /*#__PURE__*/React.createElement(Button, {
        type: "link",
        size: "small",
        onClick: () => setModalState({
          open: true,
          mode: "copy",
          rule: record
        })
      }, "复制"))
    }];
    const columnMenu = /*#__PURE__*/React.createElement(Checkbox.Group, {
      value: visibleColumns,
      onChange: setVisibleColumns,
      className: "column-menu"
    }, Object.entries(columnMap).map(([key, column]) => /*#__PURE__*/React.createElement(Checkbox, {
      key: key,
      value: key
    }, column.title)));
    return /*#__PURE__*/React.createElement("section", {
      className: "page-surface"
    }, /*#__PURE__*/React.createElement("div", {
      className: "toolbar"
    }, /*#__PURE__*/React.createElement(Space, {
      wrap: true
    }, /*#__PURE__*/React.createElement(Input, {
      value: keyword,
      onChange: event => setKeyword(event.target.value),
      onPressEnter: () => {
        setPage(1);
        message.success(`查询到 ${filteredRules.length} 条规则`);
      },
      placeholder: "内部/外部名称",
      allowClear: true,
      className: "keyword-input"
    }), /*#__PURE__*/React.createElement(Select, {
      value: status,
      onChange: value => {
        setStatus(value);
        setPage(1);
      },
      placeholder: "选择状态",
      allowClear: true,
      className: "select-input",
      options: ["启用", "禁用", "待启用"].map(value => ({
        value,
        label: value
      }))
    }), /*#__PURE__*/React.createElement(Button, {
      type: "primary",
      onClick: () => {
        setPage(1);
        message.success(`查询到 ${filteredRules.length} 条规则`);
      }
    }, "查询"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setKeyword("");
        setStatus(undefined);
        setPage(1);
        message.success("筛选已重置");
      }
    }, "重置")), /*#__PURE__*/React.createElement(Space, null, /*#__PURE__*/React.createElement(Button, {
      type: "primary",
      onClick: () => setModalState({
        open: true,
        mode: "add",
        rule: null
      })
    }, "新增规则"), /*#__PURE__*/React.createElement(Dropdown, {
      trigger: ["click"],
      dropdownRender: () => /*#__PURE__*/React.createElement("div", {
        className: "dropdown-panel"
      }, columnMenu)
    }, /*#__PURE__*/React.createElement(Button, null, "列设置")))), /*#__PURE__*/React.createElement(Table, {
      rowKey: "id",
      columns: columns,
      dataSource: filteredRules,
      onRow: record => ({
        onClick: event => {
          if (event.target.closest("button")) return;
          setDetailRule(record);
        }
      }),
      pagination: {
        current: page,
        pageSize,
        total: filteredRules.length,
        showSizeChanger: true,
        onChange: (next, size) => {
          setPage(next);
          setPageSize(size);
        }
      },
      scroll: {
        x: 1180
      },
      onChange: (_, __, tableSorter) => setSorter({
        field: tableSorter.field,
        order: tableSorter.order
      })
    }), /*#__PURE__*/React.createElement(RuleDrawer, {
      open: modalState.open,
      mode: modalState.mode,
      rule: modalState.rule,
      courses: courses,
      lessons: lessons,
      onCancel: () => setModalState({
        open: false,
        mode: "add",
        rule: null
      }),
      onSave: saveRule
    }), /*#__PURE__*/React.createElement(RuleDetailDrawer, {
      rule: detailRule,
      courses: courses,
      lessons: lessons,
      onClose: () => setDetailRule(null)
    }));
  }
  function DeliveryModal({
    open,
    mode,
    item,
    options,
    coupons,
    onCancel,
    onSave
  }) {
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
        timeRange: [dayjs(item?.start || "2026-09-01 00:00"), dayjs(item?.end || "2026-09-30 00:00")],
        coupon: "抹亏券-测试待激活展示",
        bonusAmount: 100,
        bonusCount: item?.key === "bonus" ? Number(item.count || 25) : 25,
        pointAmount: 100,
        pointCount: item?.key === "points" ? Number(item.count || 1) : 1,
        event: item?.event || "开仓",
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
        param: isBonus ? `<span class="pill gold">金额：${amount || 100}</span><span class="pill gold">发放数量（份）：${count || 0}</span>` : isPoints ? `<span class="pill blue">${pointLabel}：${amount || 100}</span><span class="pill blue">发放数量（份）：${count || 0}</span><span class="pill blue">事件参数：${values.probability || "-"}</span>` : selected.key === "coupon" ? `<span class="pill">优惠券：${values.coupon || selected.object}</span>` : `<span class="pill">指定用户：${values.manualUserIds || "870206426"}</span>`,
        operator: "Bella"
      };
      Modal.confirm({
        title: "确认投递",
        content: `将保存投递任务“${itemData.name}”。`,
        onOk: () => onSave(itemData)
      });
    }
    return /*#__PURE__*/React.createElement(Modal, {
      title: mode === "edit" ? "修改投递" : "新建投递",
      open: open,
      width: 820,
      onCancel: onCancel,
      onOk: handleSave,
      okText: "确认投递",
      cancelText: "取消",
      destroyOnClose: true
    }, /*#__PURE__*/React.createElement(Form, {
      form: form,
      layout: "vertical",
      className: "admin-form"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-section-title"
    }, "基础设置"), /*#__PURE__*/React.createElement(Form.Item, {
      name: "name",
      label: "投递任务名称",
      rules: [{
        required: true,
        message: "请输入投递任务名称"
      }]
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "请输入投递任务名称"
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "objectPath",
      label: "选择投递物",
      rules: [{
        required: true,
        message: "请选择投递物"
      }]
    }, /*#__PURE__*/React.createElement(Cascader, {
      options: makeDeliveryOptions(options),
      placeholder: "请选择投递物",
      changeOnSelect: true
    })), selectedKey === "coupon" && /*#__PURE__*/React.createElement(Form.Item, {
      name: "coupon",
      label: "选择优惠券"
    }, /*#__PURE__*/React.createElement(Select, {
      options: coupons.filter(coupon => coupon.status === "启用").map(coupon => ({
        value: coupon.name,
        label: coupon.name
      }))
    })), selectedKey === "bonus" && /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "bonusAmount",
      label: "金额"
    }, /*#__PURE__*/React.createElement(InputNumber, {
      min: 0,
      className: "full-control"
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "bonusCount",
      label: "投递数量（份）"
    }, /*#__PURE__*/React.createElement(InputNumber, {
      min: 0,
      precision: 0,
      className: "full-control",
      placeholder: "请输入投递数量"
    }))), selectedKey === "points" && /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "pointCount",
      label: "投递数量（份）"
    }, /*#__PURE__*/React.createElement(InputNumber, {
      min: 0,
      precision: 0,
      className: "full-control",
      placeholder: "请输入投递数量"
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "pointAmount",
      label: objectPath?.[1] === "points-1" ? "Drop" : "XP"
    }, /*#__PURE__*/React.createElement(InputNumber, {
      min: 0,
      precision: 0,
      className: "full-control"
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "probability",
      label: "事件参数"
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "请输入事件参数"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "form-grid-antd"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "method",
      label: "投递方式"
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["自动", "人工"].map(value => ({
        value,
        label: value
      }))
    })), /*#__PURE__*/React.createElement(Form.Item, {
      name: "timeRange",
      label: "投递时间"
    }, /*#__PURE__*/React.createElement(RangePicker, {
      showTime: true,
      format: "YYYY-MM-DD HH:mm",
      className: "full-control"
    }))), method === "自动" ? /*#__PURE__*/React.createElement(Form.Item, {
      name: "event",
      label: "触发事件"
    }, /*#__PURE__*/React.createElement(Select, {
      options: ["开仓", "连续签到", "手动触发"].map(value => ({
        value,
        label: value
      }))
    })) : /*#__PURE__*/React.createElement("div", {
      className: "manual-panel"
    }, /*#__PURE__*/React.createElement(Form.Item, {
      name: "manualUserIds",
      label: "投递 UserID"
    }, /*#__PURE__*/React.createElement(TextArea, {
      rows: 4,
      placeholder: "支持英文逗号分隔批量 ID"
    })), /*#__PURE__*/React.createElement(Space, {
      wrap: true
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        form.setFieldValue("manualUserIds", "870206426, 983850083, 762300118");
        message.success("已模拟批量导入");
      }
    }, "批量导入"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => message.success("模板已模拟导出")
    }, "导出模板"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        form.setFieldValue("manualUserIds", "");
        message.success("UserID 已清空");
      }
      }, "清空")))));
  }
  function DeliveryPage({
    deliveries,
    setDeliveries,
    options,
    coupons
  }) {
    const [keyword, setKeyword] = React.useState("");
    const [objectFilter, setObjectFilter] = React.useState();
    const [statusFilter, setStatusFilter] = React.useState();
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(5);
    const [modalState, setModalState] = React.useState({
      open: false,
      mode: "add",
      item: null
    });
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
        setDeliveries(deliveries.map(item => item.id === modalState.item.id ? {
          ...item,
          ...data
        } : item));
        message.success("投递已修改");
      } else {
        setDeliveries([{
          id: Date.now(),
          ...data
        }, ...deliveries]);
        message.success("投递已新增");
      }
      setPage(1);
      setModalState({
        open: false,
        mode: "add",
        item: null
      });
    }
    function updateDeliveryStatus(record, nextStatus) {
      Modal.confirm({
        title: nextStatus === "启用" ? "确认启用" : "确认作废",
        content: nextStatus === "启用" ? `启用后投递任务“${record.name}”将生效。` : `作废后投递任务“${record.name}”不可启用。`,
        onOk: () => {
          setDeliveries(deliveries.map(item => item.id === record.id ? {
            ...item,
            status: nextStatus
          } : item));
          message.success(nextStatus === "启用" ? "投递任务已启用" : "投递任务已作废");
        }
      });
    }
    const columns = [{
      title: "投递任务名",
      dataIndex: "name",
      width: 220,
      render: (_, record) => /*#__PURE__*/React.createElement(Button, {
        type: "link",
        onClick: () => setDetail(record)
      }, record.name)
    }, {
      title: "投递物",
      dataIndex: "object",
      width: 240
    }, {
      title: "投递方式",
      dataIndex: "method",
      width: 110
    }, {
      title: "投递个数",
      dataIndex: "count",
      width: 110
    }, {
      title: "操作状态",
      dataIndex: "status",
      width: 110,
      render: value => /*#__PURE__*/React.createElement(Tag, {
        color: statusColor[value]
      }, value)
    }, {
      title: "开始时间",
      dataIndex: "start",
      width: 160
    }, {
      title: "结束时间",
      dataIndex: "end",
      width: 160
    }, {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 210,
      render: (_, record) => {
        if (record.status === "作废") return /*#__PURE__*/React.createElement(Text, {
          type: "secondary"
        }, "不可操作");
        if (record.status === "启用") return /*#__PURE__*/React.createElement(Button, {
          danger: true,
          size: "small",
          onClick: () => updateDeliveryStatus(record, "作废")
        }, "作废");
        return /*#__PURE__*/React.createElement(Space, {
          size: 4,
          wrap: true
        }, /*#__PURE__*/React.createElement(Button, {
          size: "small",
          type: "primary",
          onClick: () => setModalState({
            open: true,
            mode: "edit",
            item: record
          })
        }, "修改"), /*#__PURE__*/React.createElement(Button, {
          size: "small",
          type: "primary",
          onClick: () => updateDeliveryStatus(record, "启用")
        }, "启用"), /*#__PURE__*/React.createElement(Button, {
          size: "small",
          danger: true,
          onClick: () => updateDeliveryStatus(record, "作废")
        }, "作废"));
      }
    }];
    return /*#__PURE__*/React.createElement("section", {
      className: "page-surface"
    }, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "启用后可作废，作废后不可启用，仅在未启用下可修改"), /*#__PURE__*/React.createElement("div", {
      className: "toolbar"
    }, /*#__PURE__*/React.createElement(Space, {
      wrap: true
    }, /*#__PURE__*/React.createElement(Input, {
      value: keyword,
      onChange: event => setKeyword(event.target.value),
      placeholder: "任务名",
      allowClear: true,
      className: "keyword-input"
    }), /*#__PURE__*/React.createElement(Select, {
      value: objectFilter,
      onChange: value => {
        setObjectFilter(value);
        setPage(1);
      },
      placeholder: "投递物",
      allowClear: true,
      className: "select-input",
      options: ["抹亏券", "资金账户奖金", "XP", "Drop"].map(value => ({
        value,
        label: value
      }))
    }), /*#__PURE__*/React.createElement(Select, {
      value: statusFilter,
      onChange: value => {
        setStatusFilter(value);
        setPage(1);
      },
      placeholder: "操作状态",
      allowClear: true,
      className: "select-input",
      options: ["未启用", "启用", "作废"].map(value => ({
        value,
        label: value
      }))
    }), /*#__PURE__*/React.createElement(Button, {
      onClick: () => message.info("更多筛选面板已模拟展开")
    }, "更多筛选"), /*#__PURE__*/React.createElement(Button, {
      type: "primary",
      onClick: () => {
        setPage(1);
        message.success("投递列表已查询");
      }
    }, "查询"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => {
        setKeyword("");
        setObjectFilter(undefined);
        setStatusFilter(undefined);
        setPage(1);
        message.success("投递筛选已重置");
      }
    }, "重置")), /*#__PURE__*/React.createElement(Button, {
      type: "primary",
      onClick: () => setModalState({
        open: true,
        mode: "add",
        item: null
      })
    }, "新建")), /*#__PURE__*/React.createElement(Table, {
      rowKey: "id",
      columns: columns,
      dataSource: filteredDeliveries,
      pagination: {
        current: page,
        pageSize,
        total: filteredDeliveries.length,
        showSizeChanger: true,
        onChange: (next, size) => {
          setPage(next);
          setPageSize(size);
        }
      },
      scroll: {
        x: 1370
      }
    }), /*#__PURE__*/React.createElement(DeliveryModal, {
      open: modalState.open,
      mode: modalState.mode,
      item: modalState.item,
      options: options,
      coupons: coupons,
      onCancel: () => setModalState({
        open: false,
        mode: "add",
        item: null
      }),
      onSave: saveDelivery
    }), /*#__PURE__*/React.createElement(Drawer, {
      title: "投递任务详情",
      open: Boolean(detail),
      width: 520,
      onClose: () => setDetail(null)
    }, detail && /*#__PURE__*/React.createElement("div", {
      className: "detail-list"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "投递任务名"), /*#__PURE__*/React.createElement("strong", null, detail.name)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "投递物"), /*#__PURE__*/React.createElement("span", null, detail.objectDetail)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "投递方式"), /*#__PURE__*/React.createElement("span", null, detail.method)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "投递个数"), /*#__PURE__*/React.createElement("span", null, detail.count)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "开始时间"), /*#__PURE__*/React.createElement("span", null, detail.start)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "结束时间"), /*#__PURE__*/React.createElement("span", null, detail.end)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "触发事件"), /*#__PURE__*/React.createElement("span", null, detail.event)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "事件参数"), /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: detail.param
      }
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "操作状态"), /*#__PURE__*/React.createElement(Tag, {
      color: statusColor[detail.status]
    }, detail.status)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Text, {
      type: "secondary"
    }, "操作人"), /*#__PURE__*/React.createElement("span", null, detail.operator)))));
  }
  function AdminApp() {
    const [currentPage, setCurrentPage] = React.useState("overview");
    const [rules, setRules] = React.useState(() => cloneData(app.mockData.rules));
    const [deliveries, setDeliveries] = React.useState(() => cloneData(app.mockData.deliveries));
    const [roleSettings, setRoleSettings] = React.useState(() => cloneData(app.mockData.roleSettings));
    const [userSettings, setUserSettings] = React.useState(() => cloneData(app.mockData.userSettings));
    const [agentLevels, setAgentLevels] = React.useState(() => cloneData(app.mockData.agentLevels));
    const [commissionRules, setCommissionRules] = React.useState(() => cloneData(app.mockData.commissionRules));
    const [communityActivities, setCommunityActivities] = React.useState(() => cloneData(app.mockData.communityActivities));
    const [courses, setCourses] = React.useState(() => cloneData(app.mockData.courses));
    const [courseLessons, setCourseLessons] = React.useState(() => cloneData(app.mockData.courseLessons));
    const [coupons, setCoupons] = React.useState(() => cloneData(app.mockData.coupons));
    const [wheelActivities, setWheelActivities] = React.useState(() => cloneData(app.mockData.wheelActivities));
    const [signupActivityId, setSignupActivityId] = React.useState(null);
    const [openTabs, setOpenTabs] = React.useState(["overview"]);
    const menuItems = [{
      key: "overview",
      label: "数据概览"
    }, {
      key: "customerGroup",
      label: "客户管理",
      children: [{
        key: "customer",
        label: "客户列表"
      }, {
        key: "loginLog",
        label: "用户登录日志"
      }, {
        key: "blacklist",
        label: "黑名单"
      }, {
        key: "whitelist",
        label: "白名单"
      }]
    }, {
      key: "orderGroup",
      label: "订单管理",
      children: [{
        key: "orderList",
        label: "订单列表",
        disabled: true
      }, {
        key: "pendingOrders",
        label: "挂单列表",
        disabled: true
      }]
    }, {
      key: "fundsGroup",
      label: "资金管理",
      children: [{
        key: "depositWithdraw",
        label: "出入金管理",
        disabled: true
      }, {
        key: "fundsManage",
        label: "资金账户",
        disabled: true
      }, {
        key: "fundFlow",
        label: "资金流水",
        disabled: true
      }]
    }, {
      key: "marketingGroup",
      label: "市场活动",
      children: [{
        key: "activity",
        label: "活动配置"
      }]
    }, {
      key: "incentiveGroup",
      label: "激励中心",
      children: [{
        key: "rules",
        label: "积分配置"
      }, {
        key: "pointDetails",
        label: "积分明细"
      }, {
        key: "wheel",
        label: "抽奖配置"
      }, {
        key: "badge",
        label: "徽章列表"
      }]
    }, {
      key: "agentGroup",
      label: "代理管理",
      children: [{
        key: "agentApplications",
        label: "代理申请列表"
      }, {
        key: "agent",
        label: "代理商列表"
      }, {
        key: "agentLevel",
        label: "代理等级配置"
      }, {
        key: "commission",
        label: "佣金管理"
      }]
    }, {
      key: "masterGroup",
      label: "高手管理",
      children: [{
        key: "masterApplications",
        label: "高手申请列表",
        disabled: true
      }, {
        key: "masterLevel",
        label: "等级配置",
        disabled: true
      }, {
        key: "potentialMaster",
        label: "潜在高手",
        disabled: true
      }, {
        key: "masterList",
        label: "高手管理",
        disabled: true
      }, {
        key: "followRelation",
        label: "跟随关系管理",
        disabled: true
      }, {
        key: "profitShare",
        label: "分润结算",
        disabled: true
      }]
    }, {
      key: "grantGroup",
      label: "发放管理",
      children: [{
        key: "coupon",
        label: "优惠券管理"
      }, {
        key: "delivery",
        label: "投递列表"
      }, {
        key: "records",
        label: "投递记录",
        disabled: true
      }]
    }, {
      key: "contentGroup",
      label: "内容管理",
      children: [{
        key: "adSlot",
        label: "广告位管理",
        disabled: true
      }, {
        key: "messageCenter",
        label: "消息管理",
        disabled: true
      }, {
        key: "mailPush",
        label: "邮件PUSH",
        disabled: true
      }, {
        key: "article",
        label: "文章管理",
        disabled: true
      }]
    }, {
      key: "symbolList",
      label: "品种列表",
      disabled: true
    }, {
      key: "systemGroup",
      label: "设置",
      children: [{
        key: "roles",
        label: "角色管理设置"
      }, {
        key: "users",
        label: "用户设置管理"
      }, {
        key: "versionSetting",
        label: "版本设置",
        disabled: true
      }, {
        key: "changePassword",
        label: "修改密码",
        disabled: true
      }]
    }];
    const navPages = app.buildNavIndex(menuItems);
    // 报名列表不在侧边栏，从活动配置的行操作进入，这里补页签标题与搜索路径映射。
    const hiddenNavPages = [{
      key: "activityApplications",
      label: "报名列表",
      path: "市场活动 / 报名列表"
    }];
    const tabPages = navPages.concat(hiddenNavPages);
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
    return /*#__PURE__*/React.createElement(ConfigProvider, {
      theme: {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }
      }
    }, /*#__PURE__*/React.createElement(AntApp, null, /*#__PURE__*/React.createElement(Layout, {
      className: "admin-shell"
    }, /*#__PURE__*/React.createElement(Sider, {
      width: 232,
      className: "admin-sider"
    }, /*#__PURE__*/React.createElement("div", {
      className: "brand"
    }, /*#__PURE__*/React.createElement("span", {
      className: "brand-mark"
    }), /*#__PURE__*/React.createElement("span", null, "Gin")), /*#__PURE__*/React.createElement(Menu, {
      mode: "inline",
      selectedKeys: [currentPage],
      defaultOpenKeys: ["customerGroup", "orderGroup", "contentGroup", "marketingGroup", "incentiveGroup", "grantGroup", "fundsGroup", "agentGroup", "masterGroup", "systemGroup"],
      items: menuItems,
      onClick: ({
        key
      }) => {
        if (navKeys.includes(key)) setCurrentPage(key);
      }
    })), /*#__PURE__*/React.createElement(Layout, null, /*#__PURE__*/React.createElement(Header, {
      className: "admin-header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "page-tabbar-wrap"
    }, /*#__PURE__*/React.createElement(app.PageTabs, {
      pages: tabPages,
      openTabs: openTabs,
      activeKey: currentPage,
      onChange: setCurrentPage,
      onClose: closeTab,
      onCloseOthers: closeOtherTabs,
      onCloseAll: closeAllTabs
    })), /*#__PURE__*/React.createElement(Space, null, /*#__PURE__*/React.createElement(app.GlobalSearch, {
      menuItems: menuItems,
      extraPages: hiddenNavPages,
      onNavigate: setCurrentPage
    }), /*#__PURE__*/React.createElement(Button, {
      shape: "circle"
    }, "?"), /*#__PURE__*/React.createElement(Button, {
      shape: "circle"
    }, "R"))), /*#__PURE__*/React.createElement(Content, {
      className: "admin-content"
    }, currentPage === "overview" ? /*#__PURE__*/React.createElement(app.DashboardPage, {
      data: app.mockData.dashboard,
      customers: app.mockData.customers
    }) : currentPage === "customer" ? /*#__PURE__*/React.createElement(app.CustomerPage, {
      customers: app.mockData.customers,
      services: app.mockData.customerServices
    }) : currentPage === "loginLog" ? /*#__PURE__*/React.createElement(app.LoginLogPage, {
      logs: app.mockData.loginLogs
    }) : currentPage === "blacklist" ? /*#__PURE__*/React.createElement(app.BlacklistPage, {
      list: app.mockData.blacklist
    }) : currentPage === "whitelist" ? /*#__PURE__*/React.createElement(app.WhitelistPage, {
      list: app.mockData.whitelist
    }) : currentPage === "agent" ? /*#__PURE__*/React.createElement(app.AgentPage, {
      agents: app.mockData.agents
    }) : currentPage === "agentApplications" ? /*#__PURE__*/React.createElement(app.AgentApplicationPage, {
      applications: app.mockData.agentApplications
    }) : currentPage === "agentLevel" ? /*#__PURE__*/React.createElement(app.AgentLevelPage, {
      levels: agentLevels,
      setLevels: setAgentLevels,
      rules: commissionRules,
      agents: app.mockData.agents
    }) : currentPage === "commission" ? /*#__PURE__*/React.createElement(Tabs, {
      defaultActiveKey: "config",
      items: [{
        key: "config",
        label: "佣金配置",
        children: /*#__PURE__*/React.createElement(app.CommissionPage, {
          rules: commissionRules,
          setRules: setCommissionRules,
          levels: agentLevels,
          agents: app.mockData.agents
        })
      }, {
        key: "records",
        label: "佣金记录",
        children: /*#__PURE__*/React.createElement(app.CommissionRecordPage, {
          records: app.mockData.commissionRecords,
          distributions: app.mockData.commissionDistributions,
          levels: agentLevels
        })
      }]
    }) : currentPage === "roles" ? React.createElement(app.RoleSettingsPage, {
      roles: roleSettings,
      onSaveRole: role => setRoleSettings(list => list.some(item => item.id === role.id) ? list.map(item => item.id === role.id ? role : item) : [...list, role]),
      onDeleteRole: roleId => {
        setRoleSettings(list => list.filter(item => item.id !== roleId).map(item => item.parentId === roleId ? Object.assign({}, item, { parentId: null }) : item));
        setUserSettings(list => list.map(item => item.roleId === roleId ? Object.assign({}, item, { roleId: null, role: "未关联" }) : item));
        message.success("角色已删除");
      }
    }) : currentPage === "users" ? React.createElement(app.UserSettingsPage, {
      users: userSettings,
      roles: roleSettings,
      onSaveUser: user => setUserSettings(list => list.some(item => item.id === user.id) ? list.map(item => item.id === user.id ? user : item) : [...list, user])
    }) : currentPage === "activity" ? React.createElement(app.ActivityPage, {
      activities: communityActivities,
      setActivities: setCommunityActivities,
      onViewSignups: id => {
        setSignupActivityId(id);
        setCurrentPage("activityApplications");
      }
    }) : currentPage === "activityApplications" ? React.createElement(app.ActivityApplicationPage, {
      applications: app.mockData.activityApplications,
      presetActivityId: signupActivityId,
      onClearPreset: () => setSignupActivityId(null)
    }) : currentPage === "pointDetails" ? React.createElement(app.PointDetailsPage, {
      details: app.mockData.pointDetails
    }) : currentPage === "badge" ? React.createElement(app.BadgePage, {
      list: app.mockData.badges
    }) : currentPage === "wheel" ? React.createElement(app.WheelPage, {
      activities: wheelActivities,
      setActivities: setWheelActivities,
      coupons: coupons
    }) : currentPage === "coupon" ? React.createElement(app.CouponPage, {
      coupons: coupons,
      setCoupons: setCoupons,
      wheelActivities: wheelActivities
    }) : currentPage === "rules" ? /*#__PURE__*/React.createElement(RulesPage, {
      rules: rules,
      setRules: setRules,
      courses: courses,
      setCourses: setCourses,
      lessons: courseLessons,
      setLessons: setCourseLessons
    }) : /*#__PURE__*/React.createElement(DeliveryPage, {
      deliveries: deliveries,
      setDeliveries: setDeliveries,
      options: app.mockData.cascaderOptions,
      coupons: coupons
    }))))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(AdminApp, null));
})(window.AdminApp);

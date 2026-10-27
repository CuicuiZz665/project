(function registerMockData(app) {
  // 数据概览主趋势序列（基础序列定义为常量，便于生成配套的上期对比序列）
  const TREND_WEEK = [
    { label: "09/05", lots: 96, amount: 1290, customers: 20, registered: 5, firstDepositCustomers: 3 },
    { label: "09/06", lots: 88, amount: 1180, customers: 18, registered: 4, firstDepositCustomers: 2 },
    { label: "09/07", lots: 118, amount: 1580, customers: 24, registered: 6, firstDepositCustomers: 3 },
    { label: "09/08", lots: 94, amount: 1240, customers: 19, registered: 5, firstDepositCustomers: 2 },
    { label: "09/09", lots: 106, amount: 1410, customers: 22, registered: 6, firstDepositCustomers: 3 },
    { label: "09/10", lots: 102, amount: 1360, customers: 21, registered: 4, firstDepositCustomers: 2 },
    { label: "09/11", lots: 112, amount: 1610, customers: 26, registered: 6, firstDepositCustomers: 3 }
  ].map(item => Object.assign(item, {
    deposits: Math.round(item.amount * 132),
    withdrawals: Math.round(item.amount * 45)
  }));
  const TREND_TODAY = Array.from({ length: 14 }, (_, index) => {
    const lots = Math.round(2.4 + Math.abs(Math.sin(index * 0.75)) * 4.2 + index * 0.36);
    const amount = Math.round(lots * 12 + index * 6);
    return {
      label: `${String(index).padStart(2, "0")}:00`,
      lots,
      amount,
      customers: index % 5 === 2 ? 1 : 0,
      registered: index % 4 === 1 ? 1 : 0,
      firstDepositCustomers: index === 4 || index === 9 ? 1 : 0,
      deposits: Math.round(amount * 132),
      withdrawals: Math.round(amount * 45)
    };
  });
  const TREND_DAY = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(2026, 7, 13 + index);
    const label = `${String(day.getMonth() + 1).padStart(2, "0")}/${String(day.getDate()).padStart(2, "0")}`;
    const lots = 14 + Math.round(Math.abs(Math.sin(index * 0.7)) * 52 + index * 1.6);
    const amount = Math.round(lots * (11 + (index % 5)) + Math.abs(Math.cos(index * 0.9)) * 180);
    const customers = Math.max(3, Math.round(lots / 5.4 + (index % 3)));
    return {
      label,
      lots,
      amount,
      customers,
      registered: Math.max(1, Math.round(customers * 0.25)),
      firstDepositCustomers: Math.max(0, Math.round(customers * 0.15)),
      deposits: Math.round(amount * 132),
      withdrawals: Math.round(amount * 45)
    };
  });
  const TREND_MONTH = [
    { label: "10月", lots: 386, amount: 5240, customers: 74 },
    { label: "11月", lots: 452, amount: 6110, customers: 85 },
    { label: "12月", lots: 508, amount: 7020, customers: 96 },
    { label: "1月", lots: 476, amount: 6540, customers: 91 },
    { label: "2月", lots: 541, amount: 7480, customers: 103 },
    { label: "3月", lots: 602, amount: 8360, customers: 115 },
    { label: "4月", lots: 568, amount: 7890, customers: 108 },
    { label: "5月", lots: 645, amount: 9020, customers: 124 },
    { label: "6月", lots: 712, amount: 9950, customers: 136 },
    { label: "7月", lots: 678, amount: 9410, customers: 129 },
    { label: "8月", lots: 756, amount: 10680, customers: 142 },
    { label: "9月", lots: 823, amount: 11740, customers: 155 }
  ].map(item => Object.assign(item, {
    registered: Math.round(item.customers * 1.1),
    firstDepositCustomers: Math.round(item.customers * 0.53),
    deposits: Math.round(item.amount * 132),
    withdrawals: Math.round(item.amount * 45)
  }));
  // 上期对比序列：当前序列乘确定性波动系数（原型演示用），净充值由 deposits - withdrawals 派生
  function derivePrevSeries(points) {
    return points.map((point, index) => {
      const factor = 0.76 + 0.24 * Math.abs(Math.sin(index * 1.7 + 0.6));
      const prev = { label: point.label };
      ["lots", "amount", "customers", "registered", "firstDepositCustomers", "deposits", "withdrawals"].forEach(key => {
        if (typeof point[key] === "number") prev[key] = Math.max(0, Math.round(point[key] * factor));
      });
      return prev;
    });
  }
  app.mockData = {
    breadcrumbs: {
      rules: "激励中心 &gt; <strong>积分配置</strong>",
      delivery: "发放管理 &gt; <strong>投递列表</strong>"
    },
    rules: [
      { id: 9, ruleType: "课程任务", internalName: "完成新手村课程", externalName: "英语: Complete Newbie Village", triggerEvent: "", cyclePeriod: "不限", rewardXp: 200, rewardDrop: 0, taskType: "新手任务", timeRange: "-", status: "启用", canEdit: true, courseId: 1, courseName: "新手村", operator: "Bella" },
      { id: 10, internalName: "模拟盘交易激励", externalName: "英语: Demo trade incentive", triggerEvent: "手续费", cyclePeriod: "按天", rewardXp: 0, rewardDrop: 100, taskType: "新手任务", timeRange: "2026-10-06 00:00:00 至 2026-10-31 23:59:59", status: "启用", canEdit: true, operator: "Bella", conditions: [{ param: "订单数", value: 5 }], relation: "all" },
      { id: 1, internalName: "首次签到连续5天", externalName: "英语: 首次签到连续5天", triggerEvent: "首次连续签到", cyclePeriod: "不限", rewardXp: 33, rewardDrop: 0, taskType: "全部", timeRange: "-", status: "启用", canEdit: false, operator: "Bella" },
      { id: 2, internalName: "连续签到5天", externalName: "英语: 连续签到5天", triggerEvent: "连续签到", cyclePeriod: "不限", rewardXp: 555, rewardDrop: 0, taskType: "全部", timeRange: "-", status: "启用", canEdit: false, operator: "Bella" },
      { id: 3, internalName: "真实账号交易奖励", externalName: "英语: First trade reward", triggerEvent: "手续费", cyclePeriod: "按天", rewardXp: 0, rewardDrop: 100, taskType: "新手任务", timeRange: "-", status: "启用", canEdit: true, operator: "Bella" },
      { id: 4, internalName: "学习K线图", externalName: "英语: Learn candlestick", triggerEvent: "手动触发", cyclePeriod: "不限", rewardXp: 150, rewardDrop: 100, taskType: "新手任务", timeRange: "-", status: "待启用", canEdit: true, operator: "Bella" },
      { id: 5, internalName: "交易手续费奖励", externalName: "英语: Trading fee reward", triggerEvent: "手续费", cyclePeriod: "按天", rewardXp: 0, rewardDrop: 300, taskType: "全部", timeRange: "-", status: "禁用", canEdit: true, operator: "Bella" },
      { id: 6, internalName: "邀请好友注册", externalName: "英语: Invite friends", triggerEvent: "手动触发", cyclePeriod: "不限", rewardXp: 80, rewardDrop: 0, taskType: "全部", timeRange: "-", status: "启用", canEdit: true, operator: "Bella" },
      { id: 7, internalName: "首笔跟单", externalName: "英语: First copy trade", triggerEvent: "跟单", cyclePeriod: "不限", rewardXp: 0, rewardDrop: 150, taskType: "新手任务", timeRange: "-", status: "待启用", canEdit: true, operator: "Bella" },
      { id: 8, internalName: "学习杠杆倍数", externalName: "英语: Learn leverage", triggerEvent: "手动触发", cyclePeriod: "不限", rewardXp: 150, rewardDrop: 0, taskType: "新手任务", timeRange: "-", status: "启用", canEdit: true, operator: "Bella" },
    ],
    deliveries: [
      { id: 1, key: "coupon", name: "测4", object: "抹亏券-测试待激活展示", objectDetail: "优惠券 -> 抹亏券 -> 测试待激活展示", method: "人工", count: "0", status: "未启用", start: "2026-08-28 00:00", end: "2026-09-05 00:00", event: "手动发送优惠券", param: '<span class="pill">指定用户：870206426</span>', operator: "Bella" },
    ],
    communityActivities: [
      { id: 23, name: "和HRFEHIQDWQDQWDQW", type: "线下活动", status: "待上线", publishType: "人工发布", startTime: "2026-09-20 02:49:00", endTime: "2026-09-30 00:00:00", signupStart: "2026-09-15 00:00:00", signupEnd: "2026-09-22 00:00:00", city: "伦敦", crowds: ["跟单交易学习者", "新手交易用户", "KOL/社区主理人"], operator: "Bella" },
      { id: 22, name: "和HRFEHIQDWQDQWDQW", type: "线下活动", status: "上线", publishType: "定时发布", startTime: "2026-09-07 00:00:00", endTime: "2026-09-30 00:00:00", signupStart: "2026-09-01 00:00:00", signupEnd: "2026-09-08 00:00:00", city: "伦敦", crowds: [], operator: "Amy" },
      { id: 21, name: "Activity Name - digest", type: "线下活动", status: "作废", publishType: "人工发布", startTime: "2026-08-26 06:46:25", endTime: "2026-09-07 03:15:00", signupStart: "2026-08-26 06:46:25", signupEnd: "2026-08-29 06:46:00", city: "伦敦", crowds: [], operator: "Bella" },
      { id: 20, name: "吉隆坡市场前瞻分享会", type: "线下活动", status: "作废", publishType: "定时发布", startTime: "2026-08-26 06:46:25", endTime: "2026-09-25 10:44:21", signupStart: "2026-08-26 06:46:25", signupEnd: "2026-08-29 06:46:00", city: "吉隆坡", crowds: [], operator: "David" }
    ],
    pointDetails: [
      { ruleType: "普通任务", taskType: "新手任务", userId: "60231745", id: 1, user: "林晓雅", email: "xiaoya.lin@example.com", change: "+150", balance: 3120, source: "手动触发", refName: "学习K线图", time: "2026-09-28 10:24" },
      { ruleType: "普通任务", taskType: "全部", userId: "71849260", id: 2, user: "陈志远", email: "zhiyuan.chen@example.com", change: "+555", balance: 8640, source: "连续签到", refName: "连续签到5天", time: "2026-09-27 21:02" },
      { ruleType: "普通任务", taskType: "新手任务", userId: "35620917", id: 3, user: "王海峰", email: "haifeng.wang@example.com", change: "+100", balance: 1450, source: "手续费", refName: "真实账号交易奖励", time: "2026-09-27 09:41" },
      { ruleType: "普通任务", taskType: "全部", userId: "89413572", id: 4, user: "刘思彤", email: "sitong.liu@example.com", change: "-200", balance: 980, source: "活动兑换", refName: "新人礼包兑换", time: "2026-09-26 16:15" },
      { ruleType: "普通任务", taskType: "全部", userId: "64092835", id: 5, user: "赵铭轩", email: "mingxuan.zhao@example.com", change: "+33", balance: 2210, source: "首次连续签到", refName: "首次签到连续5天", time: "2026-09-26 08:33" },
      { ruleType: "普通任务", taskType: "新手任务", userId: "60231745", id: 6, user: "林晓雅", email: "xiaoya.lin@example.com", change: "+100", balance: 2970, source: "手续费", refName: "真实账号交易奖励", time: "2026-09-25 14:08" },
      { ruleType: "普通任务", taskType: "新手任务", userId: "23784915", id: 7, user: "孙嘉禾", email: "jiahe.sun@example.com", change: "+100", balance: 1265, source: "手续费", refName: "真实账号交易奖励", time: "2026-09-24 19:57" },
      { ruleType: "普通任务", taskType: "全部", userId: "71849260", id: 8, user: "陈志远", email: "zhiyuan.chen@example.com", change: "-100", balance: 8085, source: "活动兑换", refName: "手续费减免券兑换", time: "2026-09-23 11:46" },
      { ruleType: "课程任务", taskType: "新手任务", courseName: "新手村", userId: "60231745", id: 9, user: "林晓雅", email: "xiaoya.lin@example.com", change: "+200", balance: 3320, source: "完课", refName: "完成新手村课程", time: "2026-10-01 20:15" }
    ],
    activityApplications: [
      { id: 2, activityRefId: 23, name: "测试", email: "aaa@163.com", message: "321312321", activityName: "新加坡社区伙伴午餐会", submittedAt: "2026-08-27 07:16" },
      { id: 1, activityRefId: 22, name: "name", email: "123@qq.com", message: "message", activityName: "新加坡交易者见面会", submittedAt: "2026-08-19 06:58" }
    ],
    // 学院课程（C 端 academy 页）：新手村等多门课，每课多讲，每讲一个视频（上传或外链）+ 完课奖励 XP。
    courses: [
      { id: 1, title: "新手村", kicker: "Newbie Village", intro: "贵金属、积存金、财商基础与首次模拟交易，从市场基础开始", rewardXp: 200, status: "上线", operator: "Bella" },
      { id: 2, title: "模拟交易战场", kicker: "Demo Battlefield", intro: "实盘前先练习，用模拟盘熟悉下单与风控", rewardXp: 150, status: "上线", operator: "Amy" },
      { id: 3, title: "跟单交易学院", kicker: "Copy Trading", intro: "查看交易员数据与风险标签，学会理性跟单", rewardXp: 150, status: "草稿", operator: "Bella" },
      { id: 4, title: "账户安全", kicker: "Account Safety", intro: "支付账户防护与反诈避坑基础", rewardXp: 100, status: "上线", operator: "David" }
    ],
    courseLessons: [
      { id: 1, courseId: 1, title: "什么是贵金属现货与延期市场", duration: "6m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 200 },
      { id: 2, courseId: 1, title: "杠杆与保证金入门", duration: "8m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 200 },
      { id: 3, courseId: 1, title: "账户安全与反诈基础", duration: "7m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 200 },
      { id: 4, courseId: 1, title: "读懂报价与点差", duration: "9m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 200 },
      { id: 5, courseId: 1, title: "开启你的首次模拟交易", duration: "5m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 200 },
      { id: 6, courseId: 2, title: "模拟盘和实盘的差别", duration: "4m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 150 },
      { id: 7, courseId: 2, title: "止损与止盈设置演练", duration: "6m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 150 },
      { id: 8, courseId: 4, title: "转账前必查的三件事", duration: "5m", videoType: "链接", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", rewardXp: 100 }
    ],
    agents: [
      { id: 84, userId: "961330982", agentId: "84", level: "V6 VIP", parentAgentId: "-", userType: "Partner", commissionRuleId: "6", commissionRuleName: "V6", commissionStatus: "已分佣", protection: "非保护期", teamCount: 0, teamHoldings: "0", createdAt: "2026-09-08 23:55:17", selfCommissionEnabled: false },
      { id: 83, userId: "189181902", agentId: "83", level: "V4", parentAgentId: "-", userType: "Partner", commissionRuleId: "1", commissionRuleName: "V4", commissionStatus: "已分佣", protection: "非保护期", teamCount: 0, teamHoldings: "349852", createdAt: "2026-09-08 10:10:14", selfCommissionEnabled: true },
      { id: 82, userId: "881180540", agentId: "82", level: "V4", parentAgentId: "-", userType: "Partner", commissionRuleId: "1", commissionRuleName: "V4", commissionStatus: "已分佣", protection: "非保护期", teamCount: 0, teamHoldings: "16850367.434346", createdAt: "2026-09-08 05:12:27", selfCommissionEnabled: false },
      { id: 81, userId: "661210254", agentId: "81", level: "V1", parentAgentId: "430187124", userType: "Sub Partner", commissionRuleId: "2", commissionRuleName: "V1", commissionStatus: "已分佣", protection: "非保护期", teamCount: 0, teamHoldings: "0", createdAt: "2026-09-06 23:37:09", selfCommissionEnabled: false },
      { id: 80, userId: "422977084", agentId: "80", level: "V3", parentAgentId: "912128173", userType: "Sub Partner", commissionRuleId: "4", commissionRuleName: "V3", commissionStatus: "已分佣", protection: "非保护期", teamCount: 0, teamHoldings: "0", createdAt: "2026-09-05 00:08:35", selfCommissionEnabled: false },
      { id: 79, userId: "340629858", agentId: "79", level: "V3", parentAgentId: "912128173", userType: "Sub Partner", commissionRuleId: "4", commissionRuleName: "V3", commissionStatus: "已分佣", protection: "非保护期", teamCount: 0, teamHoldings: "0", createdAt: "2026-09-05 00:06:58", selfCommissionEnabled: true }
    ],
    agentLevels: [
      { id: "level-v1", name: "V1", color: "#8c8c8c", sort: 1, status: "启用", isDefault: true, languages: [{ lang: "简体中文", name: "V1" }, { lang: "English", name: "V1" }], upgrade: { match: "任意", activeCustomers: 0, teamHoldings: 0 }, rebateRate: 40, marketingRate: 0, protectionDays: 0, commissionRuleId: "2", remark: "新代理默认等级，成为代理即达到。", updatedAt: "2026-09-08 11:40", operator: "Amy" },
      { id: "level-v2", name: "V2", color: "#13c2c2", sort: 2, status: "启用", isDefault: false, languages: [{ lang: "简体中文", name: "V2" }, { lang: "English", name: "V2" }], upgrade: { match: "任意", activeCustomers: 10, teamHoldings: 5000 }, rebateRate: 55, marketingRate: 5, protectionDays: 0, commissionRuleId: "3", remark: "", updatedAt: "2026-09-05 09:18", operator: "Amy" },
      { id: "level-v3", name: "V3", color: "#52c41a", sort: 3, status: "启用", isDefault: false, languages: [{ lang: "简体中文", name: "V3" }, { lang: "English", name: "V3" }], upgrade: { match: "任意", activeCustomers: 20, teamHoldings: 20000 }, rebateRate: 70, marketingRate: 10, protectionDays: 30, commissionRuleId: "4", remark: "含 30 天等级保护期。", updatedAt: "2026-09-09 17:05", operator: "David" },
      { id: "level-v4", name: "V4", color: "#1677ff", sort: 4, status: "启用", isDefault: false, languages: [{ lang: "简体中文", name: "V4" }, { lang: "English", name: "V4" }], upgrade: { match: "全部", activeCustomers: 30, teamHoldings: 50000 }, rebateRate: 85, marketingRate: 20, protectionDays: 30, commissionRuleId: "1", remark: "主力等级，需满足全部考核规则。", updatedAt: "2026-09-10 15:22", operator: "Bella" },
      { id: "level-v5", name: "V5", color: "#722ed1", sort: 5, status: "启用", isDefault: false, languages: [{ lang: "简体中文", name: "V5" }, { lang: "English", name: "V5" }], upgrade: { match: "全部", activeCustomers: 50, teamHoldings: 200000 }, rebateRate: 90, marketingRate: 25, protectionDays: 60, commissionRuleId: "5", remark: "高阶等级，满足全部考核规则后自动晋升。", updatedAt: "2026-09-11 10:32", operator: "Bella" },
      { id: "level-v6", name: "V6 VIP", color: "#faad14", sort: 6, status: "停用", isDefault: false, languages: [{ lang: "简体中文", name: "V6 VIP" }, { lang: "English", name: "V6 VIP" }, { lang: "日本語", name: "V6 VIP" }], upgrade: { match: "全部", activeCustomers: 100, teamHoldings: 500000 }, rebateRate: 95, marketingRate: 30, protectionDays: 90, commissionRuleId: "6", remark: "定向邀请制等级，当前暂停升级通道。", updatedAt: "2026-09-06 14:47", operator: "Amy" }
    ],
    commissionRules: [
      { id: "1", name: "V4", levelId: "level-v4", levelName: "V4", status: "启用", floorRate: 50, auditStatus: "已通过", approvedAt: "2026-08-20 16:40", createdAt: "2026-08-20 10:18", rates: { contract: 85, contractTrader: 75, contractApi: 5, contractTraderApi: 5, spot: 10, spotTrader: 0, spotApi: 0, spotTraderApi: 0 }, marketingRate: 20, selfCommission: true, settleCycle: "日结", settleCoin: "CNY", effectiveType: "立即生效", effectiveAt: "-", updatedAt: "2026-09-10 15:22", operator: "Bella", remark: "子渠道比例为 0 时按对应品种「全部」比例执行。" },
      { id: "2", name: "V1", levelId: "level-v1", levelName: "V1", status: "启用", floorRate: 20, auditStatus: "已通过", approvedAt: "2026-07-05 14:30", createdAt: "2026-07-05 09:12", rates: { contract: 40, contractTrader: 0, contractApi: 0, contractTraderApi: 0, spot: 0, spotTrader: 0, spotApi: 0, spotTraderApi: 0 }, marketingRate: 0, selfCommission: false, settleCycle: "日结", settleCoin: "CNY", effectiveType: "立即生效", effectiveAt: "-", updatedAt: "2026-09-08 11:40", operator: "Amy", remark: "默认等级规则，不允许自返佣。" },
      { id: "3", name: "V2", levelId: "level-v2", levelName: "V2", status: "停用", floorRate: 30, auditStatus: "已通过", approvedAt: "2026-06-02 09:20", createdAt: "2026-06-01 11:00", rates: { contract: 55, contractTrader: 0, contractApi: 0, contractTraderApi: 0, spot: 5, spotTrader: 0, spotApi: 0, spotTraderApi: 0 }, marketingRate: 5, selfCommission: false, settleCycle: "周结", settleCoin: "CNY", effectiveType: "立即生效", effectiveAt: "-", updatedAt: "2026-09-05 09:18", operator: "Bella", remark: "历史规则，等级 V2 当前未开放。" },
      { id: "4", name: "V3", levelId: "level-v3", levelName: "V3", status: "启用", floorRate: 40, auditStatus: "已通过", approvedAt: "2026-08-29 10:00", createdAt: "2026-08-28 15:05", rates: { contract: 70, contractTrader: 60, contractApi: 10, contractTraderApi: 0, spot: 8, spotTrader: 0, spotApi: 0, spotTraderApi: 0 }, marketingRate: 10, selfCommission: true, settleCycle: "日结", settleCoin: "CNY", effectiveType: "立即生效", effectiveAt: "-", updatedAt: "2026-09-09 17:05", operator: "David", remark: "" },
      { id: "5", name: "V5", levelId: "level-v5", levelName: "V5", status: "启用", floorRate: 60, auditStatus: "已通过", approvedAt: "2026-09-01 17:10", createdAt: "2026-09-01 08:45", rates: { contract: 80, contractTrader: 0, contractApi: 0, contractTraderApi: 0, spot: 12, spotTrader: 0, spotApi: 0, spotTraderApi: 0 }, marketingRate: 25, selfCommission: true, settleCycle: "月结", settleCoin: "CNY", effectiveType: "定时生效", effectiveAt: "2026-10-01 00:00", updatedAt: "2026-09-11 10:32", operator: "Bella", remark: "V5 专属规则，10 月起生效。" },
      { id: "6", name: "V6", levelId: "level-v6", levelName: "V6 VIP", status: "启用", floorRate: 70, auditStatus: "已通过", approvedAt: "2026-08-11 09:05", createdAt: "2026-08-10 13:25", rates: { contract: 95, contractTrader: 85, contractApi: 10, contractTraderApi: 10, spot: 15, spotTrader: 0, spotApi: 0, spotTraderApi: 0 }, marketingRate: 30, selfCommission: true, settleCycle: "月结", settleCoin: "CNY", effectiveType: "立即生效", effectiveAt: "-", updatedAt: "2026-09-06 14:47", operator: "Amy", remark: "VIP 专属规则。" }
    ],
    commissionSymbols: [
      { code: "Ag(T+D)", name: "白银延期", margin: 1000, listed: true, feeRate: 0.0061 },
      { code: "Ag99.99", name: "白银99.99", margin: 1000, listed: true, feeRate: 0.007 },
      { code: "Au(T+D)", name: "黄金延期", margin: 1000, listed: true, feeRate: 0.0035 },
      { code: "Au10g", name: "10克金条", margin: 1000, listed: false, feeRate: 0.008 },
      { code: "Au100g", name: "100克金条", margin: 1000, listed: true, feeRate: 0.0042 },
      { code: "Au50g", name: "50克金条", margin: 1000, listed: false, feeRate: 0.006 },
      { code: "Au99.95", name: "黄金99.95", margin: 1000, listed: false, feeRate: 0.005 },
      { code: "Au99.99", name: "上海金主力", margin: 1000, listed: true, feeRate: 0.005 },
      { code: "iAu100g", name: "国际板100克金", margin: 1000, listed: false, feeRate: 0.007 },
      { code: "iAu99.99", name: "国际板黄金", margin: 1000, listed: false, feeRate: 0.0075 },
      { code: "mAu(T+D)", name: "迷你黄金延期", margin: 1000, listed: true, feeRate: 0.0045 },
      { code: "Pt99.95", name: "铂金99.95", margin: 1000, listed: false, feeRate: 0.012 },
      { code: "积存金", name: "银行积存金", margin: 1000, listed: true, feeRate: 0 },
      { code: "沪金2506", name: "沪金2506", margin: 1000, listed: true, feeRate: 0.005 },
      { code: "沪金2512", name: "沪金2512", margin: 1000, listed: false, feeRate: 0.0055 },
      { code: "沪银2506", name: "沪银2506", margin: 1000, listed: true, feeRate: 0.0061 },
      { code: "沪银2512", name: "沪银2512", margin: 1000, listed: false, feeRate: 0.0065 }
    ],
    customerServices: [
      { id: "svc-qq", uid: "700001", name: "QQ", nickname: "QQ" },
      { id: "svc-cs1", uid: "700002", name: "cs1", nickname: "cs1" },
      { id: "svc-cs2", uid: "700003", name: "cs2", nickname: "cs2" }
    ],
    roleSettings: [
      {
        id: "root",
        name: "Root",
        parentId: null,
        permissions: ["佣金记录管理", "佣金配置列表", "代理等级配置", "代理商修改等级", "代理商列表", "代理申请列表", "数据概览", "黑名单", "白名单", "用户登录日志", "操作日志", "客户列表", "订单列表", "广告列表", "广告位条目配置", "查询验证码", "消息管理", "邮件管理", "站内信管理", "Layout管理", "报名列表", "活动配置", "投递记录", "投递列表", "投递操作设置", "优惠券核销", "优惠券操作管理", "优惠券列表", "积分明细", "积分配置", "徽章列表", "抽奖配置", "返现结算", "费用流水", "财务明细", "比赛用户统计", "资格赛设置", "比赛列表", "资金管理", "充值提现网络配置", "汇率管理", "充值管理", "提现管理-风控审核", "提现管理-财务操作", "资金流水", "品种类标", "版本控制", "编辑角色", "创建角色", "角色管理设置", "用户设置管理", "修改密码"]
      },
      { id: "customer-service", name: "客户服务", parentId: null, permissions: ["数据概览", "黑名单", "白名单", "用户登录日志", "客户列表", "订单列表", "查询验证码", "消息管理", "积分明细"] },
      { id: "test", name: "测试", parentId: null, permissions: ["数据概览", "客户列表", "活动配置", "报名列表", "优惠券列表", "比赛列表"] }
    ],
    userSettings: [
      { id: "user-1", name: "edgar", roleId: "root", role: "Root", level: "-", email: "-", phone: "-", region: "-", address: "-", registeredAt: "2026-09-02 09:16:41", status: "启用" },
      { id: "user-2", name: "lolo", roleId: "root", role: "Root", level: "-", email: "-", phone: "-", region: "-", address: "-", registeredAt: "2026-08-25 03:22:07", status: "启用" },
      { id: "user-3", name: "tank", roleId: "root", role: "Root", level: "-", email: "-", phone: "-", region: "-", address: "-", registeredAt: "2026-08-18 10:05:33", status: "启用" },
      { id: "user-4", name: "QQ", roleId: "root", role: "Root", level: "-", email: "-", phone: "-", region: "-", address: "-", registeredAt: "2026-08-06 06:58:26", status: "启用" },
      { id: "user-5", name: "小美", roleId: "customer-service", role: "客户服务", level: "-", email: "xiaomei@ginfx.com", phone: "13812345678", region: "上海市 / 黄浦区", address: "南京东路 100 号", registeredAt: "2026-07-22 08:30:00", status: "启用" },
      { id: "user-6", name: "David", roleId: "customer-service", role: "客户服务", level: "-", email: "david@ginfx.com", phone: "15987654321", region: "上海市 / 浦东新区", address: "世纪大道 200 号", registeredAt: "2026-07-02 11:45:12", status: "启用" },
      { id: "user-7", name: "Mia", roleId: "customer-service", role: "客户服务", level: "-", email: "mia@ginfx.com", phone: "-", region: "北京市 / 朝阳区", address: "-", registeredAt: "2026-06-15 02:18:39", status: "启用" },
      { id: "user-8", name: "Leo", roleId: "test", role: "测试", level: "-", email: "leo@test.com", phone: "-", region: "-", address: "-", registeredAt: "2026-05-30 09:02:51", status: "停用" },
      { id: "user-9", name: "Noah", roleId: "test", role: "测试", level: "-", email: "noah@test.com", phone: "13700001111", region: "深圳市 / 南山区", address: "-", registeredAt: "2026-05-12 07:44:03", status: "启用" },
      { id: "user-10", name: "Ivy", roleId: "test", role: "测试", level: "-", email: "-", phone: "-", region: "-", address: "-", registeredAt: "2026-04-28 04:26:17", status: "停用" }
    ],
    customers: [
      { id: 1, userId: "315899879", name: "Nifty NEAR", parentAgentId: "-", registerType: "邮箱注册", registeredAt: "2026-09-11 07:17:03", email: "jiumamuyindian@163.com", walletAddress: "-", country: "JPN", deposited: true, service: null },
      { id: 2, userId: "643448777", name: "Perky Pool", parentAgentId: "-", registerType: "邮箱注册", registeredAt: "2026-09-11 07:05:06", email: "didi20260910@163.com", walletAddress: "-", country: "CHN", deposited: false, service: "cs2" },
      { id: 3, userId: "548302071", name: "Icy Incentive", parentAgentId: "-", registerType: "邮箱注册", registeredAt: "2026-09-11 07:04:55", email: "lolo511527@sina.com", walletAddress: "-", country: "CHN", deposited: false, service: "cs1" },
      { id: 4, userId: "499516984", name: "玲玲羊2026", parentAgentId: "-", registerType: "手机注册", registeredAt: "2026-09-09 02:45:05", email: "-", walletAddress: "-", country: "JPN", deposited: true, service: "QQ" },
      { id: 5, userId: "686566723", name: "Bonny Block", parentAgentId: "-", registerType: "邮箱注册", registeredAt: "2026-09-08 09:45:16", email: "000@999.com", walletAddress: "-", country: "AUS", deposited: false, service: null },
      { id: 6, userId: "766328994", name: "Breezy BNB", parentAgentId: "735657734", registerType: "邮箱注册", registeredAt: "2026-09-08 03:44:53", email: "123@123.com", walletAddress: "-", country: "AUS", deposited: false, service: "QQ" }
    ],
    customerDetails: {
      "315899879": {
        realNameStatus: "已实名",
        kycStatus: "已认证",
        phone: "+81 90****6721",
        idRegion: "JPN",
        kycAt: "2026-09-11 08:02:18",
        balance: "¥26,840.00",
        equity: "¥28,126.40",
        marginFree: "¥24,906.15",
        credit: "¥0.00",
        totalDeposit: "¥30,000.00",
        totalWithdrawal: "¥0.00",
        netDeposit: "¥30,000.00",
        bonusAmount: "100",
        unlockedBonusAmount: "0",
        bonusStatus: "正常",
        totalLots: "8.42",
        tradeCount: "36",
        favoriteSymbols: "Au99.99, Au(T+D)",
        lastTradeAt: "2026-09-11 10:24:09",
        pnl: "+¥1,286.40",
        lastDepositAt: "2026-09-11 08:16:30",
        lastWithdrawalAt: "-",
        lastLoginAt: "2026-09-11 10:33:45",
        lastLoginIp: "153.127.42.18",
        loginDevice: "iOS 18 · Safari",
        registerIp: "153.127.40.92",
        deviceFingerprint: "fp_91A7C2",
        note: "新注册已充值客户，当前无上级代理。",
        firstName: "-",
        lastName: "-",
        countryName: "日本",
        specialCustomer: "-",
        network: "-",
        riskTags: [],
        accounts: [
          { accountNo: "4833996790", subAccountId: "4833996790", type: "统一交易账户", status: "正常", openedAt: "2026-09-11 07:17:03", tradeMode: "逐仓", positionMode: "双向", totalDeposit: "260", totalWithdrawal: "0", netDeposit: "260", pnl: "-16.31", pnlRate: "-6.27%", orders: "4", balance: "243.69", equity: "243.69", credit: "0", marginUsed: "150.00", marginFree: "243.69", marginRatio: "61.55%", lots: "8.42", lastTrade: "2026-09-11 10:24" },
          { accountNo: "8871079205", subAccountId: "8871079205", type: "模拟账户", status: "正常", openedAt: "2026-09-11 07:17:03", tradeMode: "逐仓", positionMode: "双向", totalDeposit: "10000", totalWithdrawal: "0", netDeposit: "10000", pnl: "0", pnlRate: "0.00%", orders: "0", balance: "10000.00", equity: "10000", credit: "0", marginUsed: "0", marginFree: "10000", marginRatio: "-", lots: "0.00", lastTrade: "-" }
        ],
        totalAssets: "0",
        tradeRecords: [
          { id: "trade-1", orderNo: "PT117891170449842100001", margin: "53.760259", pnl: "-2.383178", fundingFee: "0" },
          { id: "trade-2", orderNo: "PT117891169674552100001", margin: "89.600136", pnl: "0.722222", fundingFee: "0" },
          { id: "trade-3", orderNo: "PT117891167122262100001", margin: "35.841268", pnl: "0.86668", fundingFee: "0" },
          { id: "trade-4", orderNo: "PT117891139157292100001", margin: "17.922662", pnl: "-4.477776", fundingFee: "0" }
        ],
        fundRecords: [
          { id: "fund-1", userId: "315899879", fundType: "资金划转", createdAt: "2026-09-11 09:03:33", source: "Funding", target: "UTA", amount: "-40", balanceAfter: "0", orderNo: "—" },
          { id: "fund-2", userId: "315899879", fundType: "充值", createdAt: "2026-09-11 09:03:33", source: "TESEVtfbF8uYnuC85q4Gwkkxz6cXLATUSV", target: "Funding", amount: "40", balanceAfter: "40", orderNo: "CZ1178911696745521" },
          { id: "fund-3", userId: "315899879", fundType: "资金划转", createdAt: "2026-09-11 09:03:02", source: "Funding", target: "UTA", amount: "-10", balanceAfter: "0", orderNo: "—" },
          { id: "fund-4", userId: "315899879", fundType: "充值", createdAt: "2026-09-11 09:03:02", source: "TESEVtfbF8uYnuC85q4Gwkkxz6cXLATUSV", target: "Funding", amount: "10", balanceAfter: "10", orderNo: "CZ1178911671222621" },
          { id: "fund-5", userId: "315899879", fundType: "资金划转", createdAt: "2026-09-11 09:02:43", source: "Funding", target: "UTA", amount: "-10", balanceAfter: "0", orderNo: "—" },
          { id: "fund-6", userId: "315899879", fundType: "红包", createdAt: "2026-09-11 08:49:40", source: "系统", target: "Funding", amount: "10", balanceAfter: "10", orderNo: "—" },
          { id: "fund-7", userId: "315899879", fundType: "资金划转", createdAt: "2026-09-11 07:52:12", source: "Funding", target: "UTA", amount: "-200", balanceAfter: "0", orderNo: "—" },
          { id: "fund-8", userId: "315899879", fundType: "充值", createdAt: "2026-09-11 07:52:12", source: "TESEVtfbF8uYnuC85q4Gwkkxz6cXLATUSV", target: "Funding", amount: "200", balanceAfter: "200", orderNo: "CZ1178911391572921" }
        ],
        subAccountFundRecords: [
          { id: "subfund-1", subAccountId: "4833996790", fundType: "资金划转", createdAt: "2026-09-11 09:03:33", source: "Funding", target: "UTA", amount: "40", balanceAfter: "260", orderNo: "—" },
          { id: "subfund-2", subAccountId: "4833996790", fundType: "交易扣费", createdAt: "2026-09-11 08:58:30", source: "UTA", target: "系统", amount: "-3.010374", balanceAfter: "243.69", orderNo: "PT117891170449842100001" }
        ],
        bonusRecords: [
          { id: "bonus-1", userId: "315899879", bonusType: "新手赠金", createdAt: "2026-09-11 08:49:40", amount: "100", unlockedAmount: "0", status: "正常" }
        ],
        partnerInfo: { isAgent: "否", userType: "Trader", userLevel: "-", parentAgentId: "0", agentLevel: "-", agentSince: "-" },
        levelChangeRecords: [],
        commissionInfo: { settled: "-", pending: "-" },
        followerRecords: [
          { id: "follower-1", followerId: "686566723", followerName: "Bonny Block", amount: "100", shareRate: "10%", createdAt: "2026-09-11 09:35:42" }
        ],
        activityRecords: [
          { id: "activity-1", source: "大转盘活动", obtainedAt: "2026-09-11 08:49:40", rewardDetail: "20 金币" },
          { id: "activity-2", source: "邀请好友", obtainedAt: "2026-09-11 09:12:05", rewardDetail: "200 XP" },
          { id: "activity-3", source: "大转盘活动", obtainedAt: "2026-09-11 10:02:31", rewardDetail: "赠金券" }
        ]
      },
      "643448777": {
        realNameStatus: "未实名",
        kycStatus: "未认证",
        phone: "-",
        idRegion: "-",
        kycAt: "-",
        balance: "¥0.00",
        equity: "¥0.00",
        marginFree: "¥0.00",
        credit: "¥0.00",
        totalDeposit: "¥0.00",
        totalWithdrawal: "¥0.00",
        netDeposit: "¥0.00",
        bonusAmount: "0",
        unlockedBonusAmount: "0",
        bonusStatus: "-",
        totalLots: "0.00",
        tradeCount: "0",
        favoriteSymbols: "-",
        lastTradeAt: "-",
        pnl: "¥0.00",
        lastDepositAt: "-",
        lastWithdrawalAt: "-",
        lastLoginAt: "2026-09-11 07:22:16",
        lastLoginIp: "101.88.12.64",
        loginDevice: "Windows 11 · Chrome",
        registerIp: "101.88.12.64",
        deviceFingerprint: "fp_33C8E0",
        note: "客服 cs2 跟进中，尚未完成首充。",
        firstName: "-",
        lastName: "-",
        countryName: "中国",
        specialCustomer: "-",
        network: "-",
        riskTags: ["未充值"],
        accounts: []
      },
      "548302071": {
        realNameStatus: "未实名",
        kycStatus: "审核中",
        phone: "+86 138****5109",
        idRegion: "CHN",
        kycAt: "-",
        balance: "¥0.00",
        equity: "¥0.00",
        marginFree: "¥0.00",
        credit: "¥0.00",
        totalDeposit: "¥0.00",
        totalWithdrawal: "¥0.00",
        netDeposit: "¥0.00",
        bonusAmount: "0",
        unlockedBonusAmount: "0",
        bonusStatus: "-",
        totalLots: "0.00",
        tradeCount: "0",
        favoriteSymbols: "-",
        lastTradeAt: "-",
        pnl: "¥0.00",
        lastDepositAt: "-",
        lastWithdrawalAt: "-",
        lastLoginAt: "2026-09-11 07:18:53",
        lastLoginIp: "120.244.80.17",
        loginDevice: "Android 15 · Chrome",
        registerIp: "120.244.80.17",
        deviceFingerprint: "fp_68D1BB",
        note: "资料审核中，待客服确认补充材料。",
        firstName: "-",
        lastName: "-",
        countryName: "中国",
        specialCustomer: "-",
        network: "-",
        riskTags: ["KYC审核中"],
        accounts: []
      },
      "499516984": {
        realNameStatus: "已实名",
        kycStatus: "已认证",
        phone: "+81 80****2098",
        idRegion: "JPN",
        kycAt: "2026-09-09 03:26:44",
        balance: "¥86,320.50",
        equity: "¥91,508.20",
        marginFree: "¥76,440.00",
        credit: "¥5,000.00",
        totalDeposit: "¥120,000.00",
        totalWithdrawal: "¥35,000.00",
        netDeposit: "¥85,000.00",
        bonusAmount: "500",
        unlockedBonusAmount: "200",
        bonusStatus: "正常",
        totalLots: "24.18",
        tradeCount: "92",
        favoriteSymbols: "Au99.99, Ag(T+D)",
        lastTradeAt: "2026-09-10 22:31:12",
        pnl: "+¥6,508.20",
        lastDepositAt: "2026-09-10 09:12:33",
        lastWithdrawalAt: "2026-09-10 18:44:02",
        lastLoginAt: "2026-09-11 06:58:10",
        lastLoginIp: "133.32.16.9",
        loginDevice: "macOS · Chrome",
        registerIp: "133.32.16.9",
        deviceFingerprint: "fp_27B90F",
        note: "手机注册客户，交易活跃，归属 Bella。",
        firstName: "-",
        lastName: "-",
        countryName: "日本",
        specialCustomer: "特殊客户",
        network: "Ethereum",
        riskTags: [],
        accounts: [
          { accountNo: "900091", subAccountId: "900091", type: "统一交易账户", status: "正常", openedAt: "2026-09-09 02:45:05", tradeMode: "逐仓", positionMode: "双向", totalDeposit: "120000", totalWithdrawal: "35000", netDeposit: "85000", pnl: "6508.20", pnlRate: "7.66%", orders: "92", balance: "85000.00", equity: "91508.20", credit: "5000.00", marginUsed: "15068.20", marginFree: "76440.00", marginRatio: "16.47%", lots: "24.18", lastTrade: "2026-09-10 22:31" },
          { accountNo: "305522", subAccountId: "305522", type: "模拟账户", status: "正常", openedAt: "2026-09-09 03:12:40", tradeMode: "逐仓", positionMode: "双向", totalDeposit: "100000", totalWithdrawal: "0", netDeposit: "100000", pnl: "0", pnlRate: "0.00%", orders: "8", balance: "100000.00", equity: "100000", credit: "0", marginUsed: "0", marginFree: "100000", marginRatio: "-", lots: "3.20", lastTrade: "2026-09-09 14:08" }
        ]
      },
      "686566723": {
        realNameStatus: "未实名",
        kycStatus: "未认证",
        phone: "-",
        idRegion: "-",
        kycAt: "-",
        balance: "¥0.00",
        equity: "¥0.00",
        marginFree: "¥0.00",
        credit: "¥0.00",
        totalDeposit: "¥0.00",
        totalWithdrawal: "¥0.00",
        netDeposit: "¥0.00",
        bonusAmount: "0",
        unlockedBonusAmount: "0",
        bonusStatus: "-",
        totalLots: "0.00",
        tradeCount: "0",
        favoriteSymbols: "-",
        lastTradeAt: "-",
        pnl: "¥0.00",
        lastDepositAt: "-",
        lastWithdrawalAt: "-",
        lastLoginAt: "2026-09-09 11:20:06",
        lastLoginIp: "203.27.101.45",
        loginDevice: "iOS 18 · App",
        registerIp: "203.27.101.45",
        deviceFingerprint: "fp_59F0A4",
        note: "未分配客服，可通过分配客服动作处理。",
        firstName: "-",
        lastName: "-",
        countryName: "澳大利亚",
        specialCustomer: "-",
        network: "-",
        riskTags: ["未分配客服", "未充值"],
        accounts: []
      },
      "766328994": {
        realNameStatus: "已实名",
        kycStatus: "已认证",
        phone: "+61 4****1887",
        idRegion: "AUS",
        kycAt: "2026-09-08 05:44:01",
        balance: "¥12,406.00",
        equity: "¥12,108.60",
        marginFree: "¥10,922.40",
        credit: "¥0.00",
        totalDeposit: "¥20,000.00",
        totalWithdrawal: "¥8,000.00",
        netDeposit: "¥12,000.00",
        bonusAmount: "0",
        unlockedBonusAmount: "0",
        bonusStatus: "正常",
        totalLots: "5.64",
        tradeCount: "18",
        favoriteSymbols: "沪金2506, Au99.99",
        lastTradeAt: "2026-09-10 16:12:28",
        pnl: "+¥108.60",
        lastDepositAt: "2026-09-08 06:20:31",
        lastWithdrawalAt: "2026-09-09 14:12:08",
        lastLoginAt: "2026-09-11 09:03:27",
        lastLoginIp: "14.200.72.31",
        loginDevice: "Windows 11 · Edge",
        registerIp: "14.200.72.31",
        deviceFingerprint: "fp_A5D3E8",
        note: "存在上级代理，归属 David 跟进。",
        firstName: "-",
        lastName: "-",
        countryName: "澳大利亚",
        specialCustomer: "-",
        network: "-",
        riskTags: [],
        partnerInfo: { isAgent: "否", userType: "Trader", userLevel: "-", parentAgentId: "735657734", agentLevel: "-", agentSince: "-" },
        levelChangeRecords: [
          { id: "level-1", beforeLevel: "Lv.1", afterLevel: "Lv.2", beforeRule: "标准佣金规则", afterRule: "高级佣金规则", changedAt: "2026-09-10 10:00:00", operator: "admin" }
        ],
        commissionInfo: { settled: "1234.56", pending: "88.00" },
        accounts: [
          { accountNo: "900104", subAccountId: "900104", type: "统一交易账户", status: "正常", openedAt: "2026-09-08 03:44:53", tradeMode: "逐仓", positionMode: "双向", totalDeposit: "20000", totalWithdrawal: "8000", netDeposit: "12000", pnl: "108.60", pnlRate: "0.91%", orders: "18", balance: "12108.60", equity: "12108.60", credit: "0", marginUsed: "1186.20", marginFree: "10922.40", marginRatio: "9.80%", lots: "5.64", lastTrade: "2026-09-10 16:12" }
        ]
      }
    },
    dashboard: {
      metrics: {
        registered: { value: "36", change: "+12.5%", note: "较上周期" },
        tradingCustomers: { value: "16", change: "+5.0%", note: "较上周期" },
        tradingLots: { value: "716", change: "+9.8%", note: "较上周期" },
        tradingAmount: { value: "9,670", change: "+11.6%", note: "较上周期" },
        firstDepositCustomers: { value: "18", change: "+12.5%", note: "较上周期" },
        deposits: { value: "128.0万", change: "+8.4%", note: "充值金额" },
        withdrawals: { value: "43.8万", change: "-4.2%", note: "提现金额" },
        netDeposits: { value: "84.2万", change: "+11.0%", note: "净充值" },
        ibRebateCustomers: { value: "14", change: "+9.3%", note: "较上周期" },
        ibRebateAmount: { value: "2.65万", change: "+15.2%", note: "较上周期" }
      },
      metricsToday: {
        registered: { value: "6", change: "+20.0%", note: "较昨日" },
        tradingCustomers: { value: "2", change: "+8.1%", note: "较昨日" },
        tradingLots: { value: "93", change: "+10.4%", note: "较昨日" },
        tradingAmount: { value: "1,260", change: "+12.9%", note: "较昨日" },
        firstDepositCustomers: { value: "3", change: "+9.6%", note: "较昨日" },
        deposits: { value: "18.6万", change: "+7.2%", note: "充值金额" },
        withdrawals: { value: "6.2万", change: "-3.5%", note: "提现金额" },
        netDeposits: { value: "12.4万", change: "+9.6%", note: "净充值" },
        ibRebateCustomers: { value: "3", change: "+6.7%", note: "较昨日" },
        ibRebateAmount: { value: "0.42万", change: "+11.3%", note: "较昨日" }
      },
      metricsMonth: {
        registered: { value: "154", change: "+9.6%", note: "较上周期" },
        tradingCustomers: { value: "64", change: "+7.4%", note: "较上周期" },
        tradingLots: { value: "2,986", change: "+10.2%", note: "较上周期" },
        tradingAmount: { value: "41,200", change: "+12.8%", note: "较上周期" },
        firstDepositCustomers: { value: "76", change: "+10.9%", note: "较上周期" },
        deposits: { value: "542.0万", change: "+9.1%", note: "充值金额" },
        withdrawals: { value: "185.6万", change: "-3.8%", note: "提现金额" },
        netDeposits: { value: "356.4万", change: "+12.3%", note: "净充值" },
        ibRebateCustomers: { value: "47", change: "+8.8%", note: "较上周期" },
        ibRebateAmount: { value: "11.2万", change: "+14.6%", note: "较上周期" }
      },
      // 主趋势序列按粒度分档：今日按小时 / 近七天·近三十天·自定义(≤31天)按日 / 长自定义按月，
      // 每档配一份 *Prev 上期对比序列（主图虚线），净充值由 deposits - withdrawals 派生
      trendToday: TREND_TODAY,
      trendWeek: TREND_WEEK,
      trendDay: TREND_DAY,
      trendMonth: TREND_MONTH,
      trendTodayPrev: derivePrevSeries(TREND_TODAY),
      trendWeekPrev: derivePrevSeries(TREND_WEEK),
      trendDayPrev: derivePrevSeries(TREND_DAY),
      trendMonthPrev: derivePrevSeries(TREND_MONTH),
      symbols: [
        { name: "Au99.99", type: "黄金", lots: "292.78", amount: "4,216,900", volume: "3,512", orders: "1,846" },
        { name: "Au(T+D)", type: "黄金", lots: "46.20", amount: "728,500", volume: "1,204", orders: "486" },
        { name: "沪金2506", type: "黄金期货", lots: "42.60", amount: "604,500", volume: "866", orders: "268" },
        { name: "Ag(T+D)", type: "白银", lots: "30.00", amount: "388,490", volume: "1,028", orders: "238" },
        { name: "Ag99.99", type: "白银", lots: "31.53", amount: "506,300", volume: "742", orders: "204" },
        { name: "沪银2506", type: "白银期货", lots: "26.18", amount: "398,200", volume: "612", orders: "176" },
        { name: "Au100g", type: "实物金条", lots: "21.36", amount: "262,800", volume: "354", orders: "189" },
        { name: "积存金", type: "积存金", lots: "19.84", amount: "286,300", volume: "428", orders: "142" },
        { name: "mAu(T+D)", type: "黄金", lots: "16.42", amount: "242,600", volume: "386", orders: "118" },
        { name: "Pt99.95", type: "铂金", lots: "11.08", amount: "152,700", volume: "286", orders: "96" },
        { name: "Au50g", type: "实物金条", lots: "8.35", amount: "112,400", volume: "204", orders: "74" }
      ],
      customersSummary: [
        { id: 1, name: "林知夏", account: "C-100286", agent: "Bella", customers: "3", lots: "82", amount: "¥1,286,400", deposit: "¥220,000", pnl: "+¥28,640", lastTrade: "2026-09-10 21:05" },
        { id: 2, name: "陈柏言", account: "C-100417", agent: "Amy", customers: "2", lots: "65", amount: "¥968,200", deposit: "¥180,000", pnl: "-¥8,460", lastTrade: "2026-09-09 19:42" },
        { id: 3, name: "周予安", account: "C-100802", agent: "Bella", customers: "2", lots: "58", amount: "¥824,600", deposit: "¥300,000", pnl: "+¥15,600", lastTrade: "2026-09-08 11:30" },
        { id: 4, name: "许嘉禾", account: "C-100931", agent: "David", customers: "1", lots: "44", amount: "¥692,800", deposit: "¥120,000", pnl: "+¥6,920", lastTrade: "2026-09-07 16:20" },
        { id: 5, name: "沈星河", account: "C-101024", agent: "Amy", customers: "4", lots: "40", amount: "¥586,300", deposit: "¥80,000", pnl: "-¥3,240", lastTrade: "2026-09-06 13:08" }
      ]
    },
    loginLogs: [
      { id: "90058241", requestId: "req_26JUL_f81c7d10", userId: "513058481", email: "zhixia.lin@gmail.com", ip: "103.86.99.21", country: "CHN", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36", deviceUuid: "5f8ac2e4-91b7-4c3d-a6e2-8d41f0b9c7a3", timezone: "Asia/Shanghai", canvasFp: "cb4a06a520", audioFp: "dd902bdd86", screen: "1440x900", deviceFp: "3c72ba39e6f1", method: "邮箱登录", loginAt: "2026-07-27 09:00:27" },
      { id: "90058212", requestId: "req_26JUL_a92bf018", userId: "282466743", email: "meiling.tan@outlook.com", ip: "18.141.72.34", country: "SGP", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1", deviceUuid: "8c13f5a6-2b9e-4d70-8f4c-3a95e1b6d204", timezone: "Asia/Singapore", canvasFp: "71e3b8d094", audioFp: "a4f2c9e815", screen: "1170x2532", deviceFp: "9b40d2e8a713", method: "微信登录", loginAt: "2026-07-24 07:58:09" },
      { id: "90058188", requestId: "req_26JUL_111a39fc", userId: "603330712", email: "yuchen.ma@163.com", ip: "203.119.86.15", country: "CHN", ua: "CuiApp/3.8.2 (Android 15; Pixel 8 Pro) okhttp/4.12.0", deviceUuid: "e47b90d3-5c18-4a2f-b6e8-70d9a3f1c542", timezone: "Asia/Shanghai", canvasFp: "3c5f3e176d", audioFp: "198ee48166", screen: "412x915", deviceFp: "19f84f33ff0a", method: "手机登录", loginAt: "2026-07-24 03:07:07" },
      { id: "90058047", requestId: "req_26JUL_81d7ff02", userId: "292442351", email: "j.hartley@proton.me", ip: "51.89.22.104", country: "GBR", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/126.0.0.0", deviceUuid: "95fb43fb-a1c4-4e8d-b2f6-5c7e9d0a3b18", timezone: "Europe/London", canvasFp: "b28d41f7ca", audioFp: "6e09c3d517", screen: "1920x1080", deviceFp: "ae15e635bf02", method: "邮箱登录", loginAt: "2026-07-23 15:23:06" },
      { id: "90058028", requestId: "req_26JUL_b92d7001", userId: "587239582", email: "qiuyan.zhang@126.com", ip: "112.64.129.80", country: "CHN", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36", deviceUuid: "d20a7c48-6f31-4b59-9e0d-8a2c4f7e1b63", timezone: "Asia/Shanghai", canvasFp: "f19a2c608e", audioFp: "47bde0a923", screen: "1680x1050", deviceFp: "6d80a1c4e9b7", method: "Apple 登录", loginAt: "2026-07-23 08:56:04" },
      { id: "90057983", requestId: "req_26JUL_7c442c11", userId: "583032387", email: "liling88@gmail.com", ip: "101.32.11.19", country: "CHN", ua: "CuiApp/3.8.1 (iOS 18.4; iPhone16,2) Alamofire/5.9.1", deviceUuid: "39e6b1d7-08a4-4c25-b8f3-6e19d0a4c857", timezone: "Asia/Shanghai", canvasFp: "8d46e0b1f3", audioFp: "c27f59ad04", screen: "1170x2532", deviceFp: "f3b90672cd58", method: "支付宝登录", loginAt: "2026-07-23 03:49:24" },
      { id: "90057912", requestId: "req_26JUL_c381ab74", userId: "343362110", email: "t.whitmore@gmail.com", ip: "82.132.221.67", country: "GBR", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15", deviceUuid: "74f2d908-3e5b-4a61-8c07-1b96e3d2f4a0", timezone: "Europe/London", canvasFp: "50bc7e32a9", audioFp: "e81d6f4b70", screen: "1512x982", deviceFp: "27ce48b1a069", method: "邮箱登录", loginAt: "2026-07-22 18:14:32" },
      { id: "90057667", requestId: "req_26JUL_15cf2c09", userId: "598898047", email: "zhangpeng66@163.com", ip: "124.74.182.22", country: "CHN", ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36", deviceUuid: "b6e81c35-9d04-4f72-a2b8-4c60e9f1d735", timezone: "Asia/Shanghai", canvasFp: "a93d05f8c6", audioFp: "1b48e2d67f", screen: "2560x1440", deviceFp: "8f21d64be0a3", method: "邮箱登录", loginAt: "2026-07-20 08:19:44" },
      { id: "90057192", requestId: "req_26JUL_eea81b25", userId: "586364090", email: "sunjiamin@qq.com", ip: "221.6.44.18", country: "CHN", ua: "CuiApp/3.7.9 (Android 14; SM-S9280) okhttp/4.11.0", deviceUuid: "f0a42d69-71c8-4e3b-95c6-8d27b0e4a918", timezone: "Asia/Shanghai", canvasFp: "62f8d1b409", audioFp: "d73a0c8e52", screen: "412x915", deviceFp: "41b7e209dcf6", method: "手机登录", loginAt: "2026-07-13 09:58:27" },
      { id: "90057163", requestId: "req_26JUL_19abce80", userId: "821440071", email: "xuzhihao88@126.com", ip: "61.151.207.98", country: "CHN", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36", deviceUuid: "c8516b0e-4a7d-49f3-b1e8-2f60d9c3a574", timezone: "Asia/Shanghai", canvasFp: "9e2b74c1da", audioFp: "05fd93b628", screen: "1920x1080", deviceFp: "e6a05837c194", method: "邮箱登录", loginAt: "2026-07-13 08:19:01" },
      { id: "90057041", requestId: "req_26JUL_f2ab09dd", userId: "629835170", email: "k.morris@yahoo.com", ip: "13.52.184.99", country: "USA", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36", deviceUuid: "27d0e94b-8c56-4a1f-b039-6e84a1d7c2b6", timezone: "America/Los_Angeles", canvasFp: "41c9e8b075", audioFp: "b86210fe4d", screen: "1440x900", deviceFp: "70d3c8a25e19", method: "微信登录", loginAt: "2026-07-12 22:41:36" },
      { id: "90056918", requestId: "req_26JUL_304cf1de", userId: "760184335", email: "s.tanaka@docomo.jp", ip: "160.16.88.42", country: "JPN", ua: "Mozilla/5.0 (iPad; CPU OS 18_4 like Mac OS X) AppleWebKit/605.1.15 Version/18.4 Mobile/15E148 Safari/604.1", deviceUuid: "93b7f4a2-05e8-4d16-8b7c-a209d5e3f186", timezone: "Asia/Tokyo", canvasFp: "d75a20cf9b", audioFp: "30e8b641a7", screen: "1640x2360", deviceFp: "b5492f70ea8c", method: "Apple 登录", loginAt: "2026-07-11 11:10:55" }
    ],
    // 操作日志（审计）：后台关键写操作留痕，谁在什么时候对什么对象做了什么
    operationLogs: [
      { id: "10012", module: "提现审核-风控", action: "通过", detail: "通过用户 315899879 的提现申请 TX20261012003（2,000.00 CNY）", operator: "Rita", ip: "103.86.99.21", operatedAt: "2026-10-26 15:41:08", result: "成功" },
      { id: "10011", module: "代理申请", action: "驳回", detail: "驳回用户 222076544 的代理申请，原因：资料填写不完整", operator: "Bella", ip: "112.64.129.80", operatedAt: "2026-10-25 18:22:36", result: "成功" },
      { id: "10010", module: "佣金配置", action: "编辑", detail: "调整 V3 代理 Au(T+D) 单边费率 0.9189% → 0.9200%", operator: "Amy", ip: "101.32.11.19", operatedAt: "2026-10-25 10:05:44", result: "成功" },
      { id: "10009", module: "黑名单", action: "新增", detail: "将用户 680222466 加入黑名单，限制提现", operator: "系统", ip: "-", operatedAt: "2026-10-24 22:31:02", result: "成功" },
      { id: "10008", module: "提现审核-财务", action: "打款", detail: "用户 643448777 提现 TX20261011006 打款失败：三方通道超时", operator: "QQ", ip: "18.141.72.34", operatedAt: "2026-10-24 16:12:57", result: "失败" },
      { id: "10007", module: "优惠券", action: "新增", detail: "创建「交易返现券-测试交易返现券」，库存 300 张", operator: "Amy", ip: "101.32.11.19", operatedAt: "2026-10-23 11:20:15", result: "成功" },
      { id: "10006", module: "角色管理", action: "编辑", detail: "更新「客户服务」角色权限：移除订单列表查询", operator: "edgar", ip: "51.89.22.104", operatedAt: "2026-10-22 09:48:30", result: "成功" },
      { id: "10005", module: "版本设置", action: "发布", detail: "发布 App v3.8.2（Android）强制更新", operator: "David", ip: "203.119.86.15", operatedAt: "2026-10-21 15:03:21", result: "成功" },
      { id: "10004", module: "投递管理", action: "作废", detail: "作废投递任务「新手礼包-10 月批次」", operator: "Bella", ip: "112.64.129.80", operatedAt: "2026-10-20 14:37:52", result: "成功" },
      { id: "10003", module: "积分配置", action: "编辑", detail: "调整「真实账号交易奖励」积分 100 → 120", operator: "Amy", ip: "101.32.11.19", operatedAt: "2026-10-19 20:11:40", result: "成功" },
      { id: "10002", module: "用户登录日志", action: "导出", detail: "导出 2026-10-12 至 2026-10-19 登录日志，共 86 条", operator: "小美", ip: "103.86.99.21", operatedAt: "2026-10-19 09:30:12", result: "成功" },
      { id: "10001", module: "广告位", action: "新增", detail: "新增 App 首页 Banner 广告位「双十一直播预告」", operator: "David", ip: "203.119.86.15", operatedAt: "2026-10-18 16:55:08", result: "成功" }
    ],
    agentApplications: [
      { id: 10, userId: "655441390", contact: "prometheus.fx@gmail.com", proofs: [{ label: "图片1", url: "https://t.me/prometheus_fx" }], platform: "期货公司", holdings: "220000.000000", promoMode: "Telegram 频道每日行情解读，订阅 1.2 万人", appliedAt: "2026-10-26 16:22:40", status: "待审核", operator: "-", rejectReason: "-" },
      { id: 9, userId: "503172864", contact: "luna.trades@outlook.com", proofs: [{ label: "图片1", url: "https://www.youtube.com/@lunatrades" }, { label: "图片2", url: "https://x.com/lunatrades" }], platform: "上金所会员单位", holdings: "8600.000000", promoMode: "YouTube 贵金属策略周更，粉丝 3.4 万", appliedAt: "2026-10-24 09:05:12", status: "待审核", operator: "-", rejectReason: "-" },
      { id: 1, userId: "795054517", contact: "gaojiajing82@gmail.com", proofs: [{ label: "图片1", url: "https://xueqiu.com/u/53539656293908" }], platform: "上金所会员单位", holdings: "3000.000000", promoMode: "发帖", appliedAt: "2026-09-16 11:43:04", status: "已通过", operator: "Bella", rejectReason: "-" },
      { id: 2, userId: "901838977", contact: "abbahassan355@gmail.com", proofs: [{ label: "图片1", url: "https://t.me/Tech_tube0X" }, { label: "图片2", url: "https://x.com/Tech_tube0X" }, { label: "图片3", url: "https://www.facebook.com/profile.php?id=61579382644682" }], platform: "银行积存金渠道", holdings: "100.000000", promoMode: "So always I'm active about trade and I'm doing a Critical analysis and I have full hope and confidence to hit my TP. I'm used good risk management to help me about my trade", appliedAt: "2026-09-12 11:28:31", status: "已通过", operator: "Amy", rejectReason: "-" },
      { id: 3, userId: "189181902", contact: "010011", proofs: [{ label: "图片1", url: "https://测试" }], platform: "银行积存金渠道", holdings: "1000.000000", promoMode: "测试", appliedAt: "2026-09-08 10:09:27", status: "已通过", operator: "Bella", rejectReason: "-" },
      { id: 4, userId: "210640732", contact: "@xcut5", proofs: [{ label: "图片1", url: "https://t.me/degenden01" }], platform: "其他", holdings: "1500000.000000", promoMode: "专注贵金属内容分享的频道", appliedAt: "2026-09-04 05:49:56", status: "已通过", operator: "Amy", rejectReason: "-" },
      { id: 5, userId: "396388540", contact: "@TND2710", proofs: [{ label: "图片1", url: "https://t.me/bitgpvn" }], platform: "期货公司", holdings: "500000.000000", promoMode: "K có gì", appliedAt: "2026-09-04 03:03:11", status: "已通过", operator: "Bella", rejectReason: "-" },
      { id: 6, userId: "968525667", contact: "t.me/ginxen", proofs: [{ label: "图片1", url: "https://t.me/ginxen" }], platform: "银行积存金渠道", holdings: "500.000000", promoMode: "测试账号5", appliedAt: "2026-08-10 09:22:45", status: "已驳回", operator: "Bella", rejectReason: "影响力证明链接无效" },
      { id: 7, userId: "431236773", contact: "19289301", proofs: [{ label: "图片1", url: "https://partner.cui-admin.demo/partner-program" }], platform: "银行积存金渠道", holdings: "1000.000000", promoMode: "测试", appliedAt: "2026-08-10 06:24:13", status: "已驳回", operator: "Amy", rejectReason: "平台下近三月持仓量不达标" },
      { id: 8, userId: "222076544", contact: "qwe@01.com", proofs: [{ label: "图片1", url: "https://qwe@01.com" }], platform: "期货公司", holdings: "1111111.000000", promoMode: "11111", appliedAt: "2026-06-06 08:03:29", status: "已驳回", operator: "Bella", rejectReason: "资料填写不完整" }
    ],
    commissionRecords: [
      { id: 1, orderId: "PT117907848769930400001", symbol: "Au(T+D)", holdings: "843.229", commission: "0.9189", settledAt: "2026-10-01 10:00:01", settleStatus: "部分结算" },
      { id: 2, orderId: "PT117907839106770500001", symbol: "Au(T+D)", holdings: "843.247", commission: "0.9177", settledAt: "2026-10-01 10:00:01", settleStatus: "部分结算" },
      { id: 3, orderId: "PT117903368658700500001", symbol: "沪金2506", holdings: "1318.02", commission: "0.0831", settledAt: "2026-09-28 10:00:01", settleStatus: "部分结算" },
      { id: 4, orderId: "PT217903260769560500001", symbol: "Au99.99", holdings: "4308.64", commission: "0.1537", settledAt: "2026-09-26 10:00:02", settleStatus: "已结算" },
      { id: 5, orderId: "PT117903259890020500001", symbol: "Au99.99", holdings: "4295.04", commission: "0.1533", settledAt: "2026-09-26 10:00:02", settleStatus: "已结算" },
      { id: 6, orderId: "PT117901151517750500001", symbol: "Ag(T+D)", holdings: "1137.48", commission: "0.066", settledAt: "2026-09-25 10:00:01", settleStatus: "部分结算" },
      { id: 7, orderId: "PT117900155987330500001", symbol: "Ag(T+D)", holdings: "1144.11", commission: "0.0662", settledAt: "2026-09-23 10:00:01", settleStatus: "部分结算" }
    ],
    commissionDistributions: [
      { orderId: "PT117907848769930400001", pid: "661210254", level: "V1", amount: "0" },
      { orderId: "PT117907848769930400001", pid: "430187124", level: "V1", amount: "0" },
      { orderId: "PT117907848769930400001", pid: "400209681", level: "V4", amount: "0.9189" },
      { orderId: "PT117907839106770500001", pid: "661210254", level: "V1", amount: "0" },
      { orderId: "PT117907839106770500001", pid: "430187124", level: "V1", amount: "0" },
      { orderId: "PT117907839106770500001", pid: "400209681", level: "V4", amount: "0.9177" },
      { orderId: "PT117903368658700500001", pid: "189181902", level: "V4", amount: "0.0831" },
      { orderId: "PT217903260769560500001", pid: "881180540", level: "V4", amount: "0.1537" },
      { orderId: "PT117903259890020500001", pid: "881180540", level: "V4", amount: "0.1533" },
      { orderId: "PT117901151517750500001", pid: "422977084", level: "V3", amount: "0.066" },
      { orderId: "PT117900155987330500001", pid: "340629858", level: "V3", amount: "0.0662" }
    ],
    blacklist: [
      { id: 1, userId: "314061187", registerType: "邮箱注册", registeredAt: "2026-10-01 04:56:12", email: "ndossbhssg@gmail10p.com", walletAddress: "-", operator: "系统", operatedAt: "2026-10-01 04:58:08", reason: "同一 IP 和设备标识在 1 小时内登录用户达到 3 人，系统自动限制提现", deposited: "否", restrictions: ["限制提现"] },
      { id: 2, userId: "767680997", registerType: "邮箱注册", registeredAt: "2026-10-01 04:58:08", email: "jdornridbsb@suiemail.com", walletAddress: "-", operator: "系统", operatedAt: "2026-10-01 04:58:08", reason: "同一 IP 和设备标识在 1 小时内登录用户达到 3 人，系统自动限制提现", deposited: "否", restrictions: ["限制提现"] },
      { id: 3, userId: "680222466", registerType: "邮箱注册", registeredAt: "2026-10-01 00:21:32", email: "spmbsusbvccxx@gmail10p.com", walletAddress: "-", operator: "系统", operatedAt: "2026-10-01 00:21:33", reason: "同一 IP 和设备标识在 1 小时内登录用户达到 3 人，系统自动限制提现", deposited: "否", restrictions: ["限制提现"] }
    ],
    whitelist: [
      { id: 1, userId: "815262925", nickName: "Light LSK", registerType: "邮箱注册", registeredAt: "2026-09-20 11:05:13", email: "leo@11.com", walletAddress: "-", operator: "Sara", operatedAt: "2026-09-20 11:05:59", country: "-", deposited: "否" },
      { id: 2, userId: "191366464", nickName: "Uber Uniswap", registerType: "邮箱注册", registeredAt: "2026-09-20 11:01:33", email: "000@111.com", walletAddress: "-", operator: "Sara", operatedAt: "2026-09-20 11:02:21", country: "-", deposited: "否" },
      { id: 3, userId: "167484489", nickName: "Nimble Nonce", registerType: "邮箱注册", registeredAt: "2026-09-18 06:32:19", email: "qwe@15.com", walletAddress: "-", operator: "Amycui", operatedAt: "2026-09-18 06:32:29", country: "-", deposited: "否" },
      { id: 4, userId: "123168056", nickName: "Nifty NFT", registerType: "邮箱注册", registeredAt: "2026-09-18 06:27:07", email: "qwe@14.com", walletAddress: "-", operator: "Amycui", operatedAt: "2026-09-18 06:27:15", country: "-", deposited: "否" },
      { id: 5, userId: "863385451", nickName: "Quick QNT", registerType: "邮箱注册", registeredAt: "2026-09-18 06:24:13", email: "qwe@13.com", walletAddress: "-", operator: "Amycui", operatedAt: "2026-09-18 07:47:22", country: "-", deposited: "否" },
      { id: 6, userId: "663793315", nickName: "Dapper DAO", registerType: "邮箱注册", registeredAt: "2026-09-03 03:33:25", email: "18221598913@163.com", walletAddress: "-", operator: "Sara", operatedAt: "2026-09-03 06:01:16", country: "-", deposited: "否" },
      { id: 7, userId: "517796016", nickName: "CryptoKing", registerType: "邮箱注册", registeredAt: "2026-08-10 13:43:55", email: "wenbabe@126.com", walletAddress: "-", operator: "QQ", operatedAt: "2026-09-03 05:31:28", country: "-", deposited: "是" }
    ],
    coupons: [
      { id: "c1", name: "抹亏券-测试待激活展示", type: "抹亏券", rule: "亏损 10 元以内全额抵扣", validStart: "2026-09-01", validEnd: "2026-10-31", stock: 500, status: "启用", operator: "Bella", updatedAt: "2026-09-01 10:00" },
      { id: "c2", name: "交易返现券-测试交易返现券", type: "交易返现券", rule: "成交后返 5 元", validStart: "2026-09-01", validEnd: "2026-12-31", stock: 300, status: "启用", operator: "Amy", updatedAt: "2026-09-02 11:20" },
      { id: "c3", name: "手续费减免券-测试手续费减免券", type: "手续费减免券", rule: "减免 100% 手续费一次", validStart: "2026-09-15", validEnd: "2026-11-15", stock: 200, status: "停用", operator: "Bella", updatedAt: "2026-09-10 15:40" }
    ],
    wheelActivities: [
      { id: 1, type: "大转盘", name: "积分大转盘", marker: "HD-202609-001", start: "2026-09-01 00:00", end: "2026-09-30 23:59", deliveryMethod: "自动", enabled: true, operator: "Bella",
        prizes: [
          { key: "p1", type: "积分", pointsLabel: "XP", pointsAmount: 100, count: 128, percent: 30 },
          { key: "p2", type: "优惠券", couponId: "c1", count: 50, percent: 20 },
          { key: "p3", type: "奖励", accountType: "资金账户", amount: 100, count: 25, percent: 15 },
          { key: "p4", type: "谢谢参与", count: 0, percent: 35 }
        ]
      }
    ],
    badges: [
      { id: 3, icon: "https://ginfx-prod.s3.ap-southeast-1.amazonaws.com/badge/20260812/86022981638.png", conditionType: "总充值", conditionText: "总充值：金额 >= 10000", status: "启用", createdAt: "2026-08-12 08:16:05", updatedAt: "2026-08-12 08:16:05", languages: [
        { lang: "英语", name: "Svip Badge", desc: "Deposit over ¥10,000 in total to earn a badge." },
        { lang: "简体中文", name: "Svip 徽章", desc: "累计充值>10000元可获得徽章" }
      ] },
      { id: 4, icon: "https://ginfx-prod.s3.ap-southeast-1.amazonaws.com/badge/20260812/24850501274.png", conditionType: "总充值", conditionText: "总充值：金额 >= 100", status: "启用", createdAt: "2026-08-12 08:10:00", updatedAt: "2026-08-25 18:44:26", languages: [
        { lang: "英语", name: "Vip Badge", desc: "Deposit over ¥100 in total to earn a badge." },
        { lang: "简体中文", name: "Vip徽章", desc: "累计充值>100元可获得徽章" }
      ] }
    ],
    cascaderOptions: {
      coupon: { text: "优惠券", second: ["抹亏券", "交易返现券", "手续费减免券"], third: ["测试待激活展示", "正式测试抹亏券", "loss-recover-10"] },
      bonus: { text: "奖励", second: ["资金账户", "模拟账户", "赠金账户"], third: [] },
      points: { text: "积分", second: ["XP", "金币"], third: [] }
    },
    // —— 内容管理 / 广告位管理：条目与广告 ——
    adEntries: [
      { id: 1, name: "首页轮播", identifier: "home_banner", description: "App 首页顶部轮播广告位" },
      { id: 2, name: "开屏广告", identifier: "splash", description: "冷启动开屏插画位" },
      { id: 3, name: "学院横幅", identifier: "academy_banner", description: "学院页顶部横幅" },
      { id: 4, name: "弹窗活动位", identifier: "popup_activity", description: "首页活动弹窗，配合大转盘等运营活动" }
    ],
    adPlatformOptions: [
      { code: "iOS", label: "iOS" },
      { code: "Android", label: "Android" },
      { code: "H5", label: "H5" }
    ],
    adStatusOptions: [
      { code: 1, label: "启用" },
      { code: 0, label: "禁用" }
    ],
    adInternalModules: [
      { module: "wheel", name: "大转盘活动页" },
      { module: "academy", name: "学院课程页" },
      { module: "coupon", name: "优惠券中心" },
      { module: "deposit", name: "充值页" }
    ],
    ads: [
      { id: 3, identifier: "splash", name: "国庆开屏-金秋行情", description: "金秋贵金属行情推广开屏", start_time: "2026-10-01 00:00:00", end_time: "2026-10-20 23:59:59", platform: ["iOS", "Android"], operate_user_name: "Bella", status: 1, status_name: "启用", locale_configs: [
        { lang: "英语", platform: "iOS", img_url: "uploads/ads/splash-en-ios.png", target_type: 1, target_param: "wheel" },
        { lang: "简体中文", platform: "iOS", img_url: "uploads/ads/splash-zh-ios.png", target_type: 2, link: "https://cui.example.com/autumn" },
        { lang: "英语", platform: "Android", img_url: "uploads/ads/splash-en-android.png", target_type: 1, target_param: "wheel" }
      ] },
      { id: 2, identifier: "home_banner", name: "新手村轮播", description: "新手村课程引流轮播图", start_time: "2026-09-01 00:00:00", end_time: "2026-12-31 23:59:59", platform: ["iOS", "Android", "H5"], operate_user_name: "Amy", status: 1, status_name: "启用", locale_configs: [
        { lang: "英语", platform: "iOS", img_url: "uploads/ads/newbie-en.png", target_type: 1, target_param: "academy" },
        { lang: "简体中文", platform: "iOS", img_url: "uploads/ads/newbie-zh.png", target_type: 1, target_param: "academy" },
        { lang: "英语", platform: "H5", img_url: "uploads/ads/newbie-en-h5.png", target_type: 2, link: "https://cui.example.com/academy" }
      ] },
      { id: 1, identifier: "popup_activity", name: "大转盘弹窗", description: "抽奖活动召回弹窗", start_time: "2026-09-10 00:00:00", end_time: "2026-10-31 23:59:59", platform: ["iOS"], operate_user_name: "Bella", status: 0, status_name: "禁用", locale_configs: [
        { lang: "简体中文", platform: "iOS", img_url: "uploads/ads/wheel-zh.png", target_type: 1, target_param: "wheel" }
      ] }
    ],
    // —— 内容管理 / 消息管理 + 查询验证码 ——
    messageLanguages: [
      { key: "en", value: "英语" },
      { key: "zh-CN", value: "简体中文" },
      { key: "zh-TW", value: "繁体中文" },
      { key: "ja", value: "日语" }
    ],
    messages: [
      { id: 3, resource: "指定客户", user_code: "315899879, 643448777", title: { "英语": "Deposit bonus activated", "简体中文": "赠金已到账" }, content: { "英语": "Your trading bonus has been credited.", "简体中文": "您的交易赠金已到账，请在资金记录中查看。" }, created_at: "2026-10-09 08:31:02", status: 1 },
      { id: 2, resource: "所有客户", user_code: "", title: { "简体中文": "国庆假期提现处理时效公告" }, content: { "简体中文": "国庆假期期间提现申请将在次一工作日集中处理。" }, created_at: "2026-09-30 11:00:00", status: 1 },
      { id: 1, resource: "所有客户", user_code: "", title: { "英语": "Scheduled maintenance", "简体中文": "系统维护通知" }, content: { "英语": "We will perform maintenance at 02:00 GMT+0.", "简体中文": "系统将于 GMT+0 02:00 进行维护。" }, created_at: "2026-09-28 03:20:45", status: 0 }
    ],
    // 顶栏通知铃铛：面向管理员本人的系统通知（区别于面向客户的站内信）
    adminNotifications: [
      { id: 6, type: "提现审核", title: "新提现申请待风控审核", detail: "用户 315899879 申请提现 2,000.00 CNY，已等待 2 小时", time: "2026-10-26 15:20", read: false, page: "withdrawRisk" },
      { id: 5, type: "提现审核", title: "提现单待财务打款", detail: "TX20261026004 已通过风控，等待财务确认打款", time: "2026-10-26 11:02", read: false, page: "withdrawFinance" },
      { id: 4, type: "代理申请", title: "2 条代理申请待审核", detail: "用户 655441390、503172864 提交了代理申请", time: "2026-10-26 09:10", read: false, page: "agentApplications" },
      { id: 3, type: "风控提醒", title: "高频提现触发风控规则", detail: "用户 548302071 当日提现 3 笔共 12,000.00 CNY，已自动驳回", time: "2026-10-25 18:00", read: true, page: "withdrawRisk" },
      { id: 2, type: "活动报名", title: "「和HRFEHIQDWQDQWDQW」新增报名", detail: "新增 1 条报名信息，请及时跟进处理", time: "2026-10-24 08:44", read: true, page: "activityApplications" },
      { id: 1, type: "系统公告", title: "App v3.8.2 已全量发布", detail: "Android 强更生效，iOS 灰度 50%", time: "2026-10-21 15:03", read: true, page: "versionSetting" }
    ],
    emailCodeLogs: [
      { email: "jiumamuyindian@163.com", reason: "客服工单 #4021 客户无法登录", user_code: "315899879", operator_name: "QQ", operated_at: "2026-10-11 09:12:33" },
      { email: "didi20260910@163.com", reason: "客户申诉邮箱验证码未收到", user_code: "643448777", operator_name: "cs1", operated_at: "2026-10-10 17:45:02" },
      { email: "lolo511527@sina.com", reason: "风控复核登录异常", user_code: "548302071", operator_name: "Rita", operated_at: "2026-10-09 14:08:41" },
      { email: "000@999.com", reason: "客服工单 #3987 换绑邮箱", user_code: "686566723", operator_name: "cs2", operated_at: "2026-10-08 10:22:15" }
    ],
    // —— 内容管理 / 邮件PUSH：触发事件、内部链接、Layout、邮件与站内信 ——
    mailEvents: [
      { value: "register", description: "注册成功" },
      { value: "deposit_success", description: "充值成功" },
      { value: "withdraw_audit", description: "提现审核通知" },
      { value: "kyc_approved", description: "实名认证通过" },
      { value: "password_changed", description: "密码修改成功" }
    ],
    mailEventVariables: {
      register: [ { variable: "{{email}}", description: "客户邮箱" }, { variable: "{{user_code}}", description: "客户通行证 ID" } ],
      deposit_success: [ { variable: "{{amount}}", description: "充值金额" }, { variable: "{{channel}}", description: "支付渠道" }, { variable: "{{user_code}}", description: "客户通行证 ID" } ],
      withdraw_audit: [ { variable: "{{amount}}", description: "提现金额" }, { variable: "{{status}}", description: "审核结果" } ],
      kyc_approved: [ { variable: "{{user_code}}", description: "客户通行证 ID" } ],
      password_changed: [ { variable: "{{time}}", description: "修改时间" } ]
    },
    mailInternalPages: [
      { value: "deposit", label: "充值页" },
      { value: "withdraw", label: "提现页" },
      { value: "wheel", label: "大转盘活动页" },
      { value: "academy", label: "学院课程页" },
      { value: "coupon", label: "优惠券中心" }
    ],
    mailLayouts: [
      { id: 1, name: "官方默认模板", content: "<div style=\"padding:24px;font-family:sans-serif\"><h2>Cui</h2><div>{{content}}</div><p style=\"color:#999\">Cui 团队</p></div>", status: 1, updated_at: "2026-09-05 08:20:11" },
      { id: 2, name: "活动营销模板", content: "<div style=\"padding:24px;background:#fff7e6\"><h2>活动速递</h2><div>{{content}}</div></div>", status: 1, updated_at: "2026-09-18 15:41:37" },
      { id: 3, name: "安全通知模板", content: "<div style=\"padding:24px;border-left:4px solid #1677ff\"><div>{{content}}</div></div>", status: 0, updated_at: "2026-10-02 10:05:49" }
    ],
    mailNotices: [
      { id: 3, title: "您的充值已到账", lang: "简体中文", event_key: "deposit_success", event_text: "充值成功", layout_id: 1, layout_name: "官方默认模板", content: "<p>尊敬的客户，您本次充值 {{amount}} 元已到账。</p>" },
      { id: 2, title: "Welcome to Cui", lang: "英语", event_key: "register", event_text: "注册成功", layout_id: 1, layout_name: "官方默认模板", content: "<p>Welcome aboard! Complete your first demo trade to earn rewards.</p>" },
      { id: 1, title: "提现审核结果通知", lang: "简体中文", event_key: "withdraw_audit", event_text: "提现审核通知", layout_id: 3, layout_name: "安全通知模板", content: "<p>您的提现申请 {{amount}} 元已{{status}}，请留意账户变动。</p>" }
    ],
    siteNotices: [
      { id: 3, title: "赠金已发放", lang: "简体中文", event_type: 2, event_key: "deposit_success", event_text: "充值成功", link: "deposit", content: "[{\"k\":\"到账金额\",\"v\":\"¥1,000.00\",\"t\":1},{\"k\":\"说明\",\"v\":\"赠金将在完成订单数要求后自动解除限制。\",\"t\":0}]" },
      { id: 2, title: "实名认证已通过", lang: "简体中文", event_type: 1, event_text: "实名认证通过", link: "", content: "[{\"k\":\"认证结果\",\"v\":\"您已完成实名认证，可进行充值提现操作。\",\"t\":0}]" },
      { id: 1, title: "Welcome bonus ready", lang: "英语", event_type: 1, event_text: "注册成功", link: "wheel", content: "[{\"k\":\"Reward\",\"v\":\"Your welcome coupon is ready. Open the wheel to claim it.\",\"t\":1}]" }
    ],
    // —— 设置 / 版本设置 ——
    releasePlatformOptions: [
      { code: "ios", label: "iOS" },
      { code: "android", label: "Android" },
      { code: "miniapp", label: "小程序" },
      { code: "web", label: "Web" }
    ],
    appReleases: [
      { id: 1, platform: "ios", version: "2.4.0", build_number: 0, is_forced_update: 0, download_url: "https://apps.apple.com/cn/app/cui/id000000000", created_at: "2026-09-30 06:12:00", updated_at: "2026-10-08 09:30:00", locale_configs: [
        { lang: "简体中文", title: "2.4.0 更新", description: "新增金所贵金属行情卡片与消息中心。" },
        { lang: "英语", title: "2.4.0 Update", description: "Added market cards and message center." }
      ] },
      { id: 2, platform: "android", version: "2.4.1", build_number: 0, is_forced_update: 1, download_url: "https://download.cui.example.com/android/cui-2.4.1.apk", created_at: "2026-10-01 10:00:00", updated_at: "2026-10-11 15:20:00", locale_configs: [
        { lang: "简体中文", title: "重要更新", description: "修复部分机型行情闪烁问题，请立即更新。" }
      ] },
      { id: 4, platform: "miniapp", version: "1.8.0", build_number: 0, is_forced_update: 0, download_url: "", created_at: "2026-09-12 08:00:00", updated_at: "2026-09-12 08:00:00", locale_configs: [
        { lang: "简体中文", title: "小程序 1.8.0", description: "支持微信登录与模拟盘快捷交易。" }
      ] }
    ],
    // —— 资金管理 / 资金管理（单条 + 批量） ——
    fundTypeOptions: ["活动奖励", "赠金调整", "手续费返还", "违规扣除", "体验金回收"],
    fundRecords: [
      { id: 4, user_code: "315899879", direction: "发放", payable_deduction_amount: "500.00", amount: "500.00", operation_source: "人工", fund_type_text: "活动奖励", reason: "大转盘中奖发放", remark: "十月大转盘", operator_name: "Bella", created_at: "2026-10-11 09:40:12" },
      { id: 3, user_code: "643448777", direction: "扣除", payable_deduction_amount: "200.00", amount: "180.00", operation_source: "系统", fund_type_text: "违规扣除", reason: "套利风控扣除", remark: "", operator_name: "系统", created_at: "2026-10-10 22:15:04" },
      { id: 2, user_code: "548302071", direction: "发放", payable_deduction_amount: "88.00", amount: "88.00", operation_source: "人工", fund_type_text: "赠金调整", reason: "客诉补偿", remark: "九月客诉", operator_name: "QQ", created_at: "2026-10-08 14:02:55" },
      { id: 1, user_code: "499516984", direction: "发放", payable_deduction_amount: "1,000.00", amount: "1,000.00", operation_source: "人工", fund_type_text: "活动奖励", remark: "国庆首充", reason: "国庆首充活动奖励", operator_name: "Amy", created_at: "2026-10-03 11:30:41" }
    ],
    fundBatchRecords: [
      { id: 2, direction_text: "发放", fund_type_text: "手续费返还", created_by_name: "Bella", created_at: "2026-10-09 16:20:00", total_count: 120, success_count: 118, fail_count: 2, success_amount: "23,600.00", status: 2, status_text: "部分成功", remark: "" },
      { id: 1, direction_text: "扣除", fund_type_text: "体验金回收", created_by_name: "系统", created_at: "2026-10-01 00:05:00", total_count: 56, success_count: 56, fail_count: 0, success_amount: "11,200.00", status: 3, status_text: "成功", remark: "" }
    ],
    fundBatchItemsByJob: {
      2: [
        { user_code: "315899879", amount: "300.00", activity_name: "手续费返还-十月", reason: "十月手续费返还", error_message: "" },
        { user_code: "643448777", amount: "150.00", activity_name: "手续费返还-十月", reason: "十月手续费返还", error_message: "" },
        { user_code: "548302071", amount: "100.00", activity_name: "手续费返还-十月", reason: "十月手续费返还", error_message: "账户状态异常，发放失败" }
      ],
      1: [
        { user_code: "686566723", amount: "-200.00", activity_name: "", reason: "体验金到期回收", error_message: "" },
        { user_code: "766328994", amount: "-200.00", activity_name: "", reason: "体验金到期回收", error_message: "" }
      ]
    },
    // —— 资金管理 / 资金流水 ——
    fundFlowTypes: [
      { name: "交易账户", code: "trade", sub_types: [ { name: "充值", code: "deposit" }, { name: "提现", code: "withdraw" }, { name: "手续费", code: "fee" }, { name: "盈亏", code: "pnl" } ] },
      { name: "佣金账户", code: "commission", sub_types: [ { name: "返佣发放", code: "rebate" }, { name: "佣金转资金", code: "transfer" } ] },
      { name: "赠金账户", code: "bonus", sub_types: [ { name: "赠金发放", code: "grant" }, { name: "赠金扣除", code: "deduct" } ] }
    ],
    fundFlows: [
      { id: 1006, user_code: "315899879", fund_type_text: "交易账户-充值", created_at: "2026-10-12 02:11:45", from: "银行卡", to: "交易账户", amount: "+5,000.00", after_balance: "31,840.00" },
      { id: 1005, user_code: "315899879", fund_type_text: "交易账户-盈亏", created_at: "2026-10-11 14:36:20", from: "Au(T+D)", to: "交易账户", amount: "+682.50", after_balance: "26,840.00" },
      { id: 1004, user_code: "643448777", fund_type_text: "交易账户-手续费", created_at: "2026-10-11 09:05:12", from: "交易账户", to: "平台", amount: "-36.80", after_balance: "2,143.60" },
      { id: 1003, user_code: "548302071", fund_type_text: "赠金账户-赠金发放", created_at: "2026-10-10 18:44:31", from: "活动奖励", to: "赠金账户", amount: "+88.00", after_balance: "88.00" },
      { id: 1002, user_code: "499516984", fund_type_text: "交易账户-提现", created_at: "2026-10-10 08:20:03", from: "交易账户", to: "银行卡", amount: "-2,000.00", after_balance: "18,420.00" },
      { id: 1001, user_code: "315899879", fund_type_text: "佣金账户-返佣发放", created_at: "2026-10-09 06:00:00", from: "代理返佣", to: "佣金账户", amount: "+215.40", after_balance: "1,073.20" }
    ],
    // —— 订单管理 / 订单列表 ——
    orderAccountTypes: [
      { name: "真实账户", code: 0 },
      { name: "模拟账户", code: 1 },
      { name: "赠金账户", code: 2 }
    ],
    orders: [
      { id: 1, user_code: "315899879", login: "888001", trade_account_type_name: "真实账户", ticket: "20261012001", source: "Au99.99", trade_volume: "1.00", so_type: 0, so_type_name: "市价", leverage: "20", margin_order: "3,062.00", profit: "+226.00", funding_fee: "0.00" },
      { id: 2, user_code: "315899879", login: "888001", trade_account_type_name: "真实账户", ticket: "20261011088", source: "Au(T+D)", trade_volume: "2.00", so_type: 0, so_type_name: "市价", leverage: "10", margin_order: "6,108.50", profit: "+682.50", funding_fee: "-8.60" },
      { id: 3, user_code: "643448777", login: "888012", trade_account_type_name: "模拟账户", ticket: "20261011090", source: "Ag(T+D)", trade_volume: "5.00", so_type: 1, so_type_name: "限价", leverage: "10", margin_order: "19,605.00", profit: "-135.00", funding_fee: "-2.20" },
      { id: 4, user_code: "548302071", login: "900204", trade_account_type_name: "真实账户", ticket: "20261010055", source: "mAu50g", trade_volume: "1.00", so_type: 0, so_type_name: "市价", leverage: "20", margin_order: "30,620.00", profit: "+235.00", funding_fee: "0.00" },
      { id: 5, user_code: "499516984", login: "877310", trade_account_type_name: "真实账户", ticket: "20261010061", source: "Au100g", trade_volume: "0.50", so_type: 0, so_type_name: "市价", leverage: "10", margin_order: "15,310.00", profit: "-96.00", funding_fee: "0.00" },
      { id: 6, user_code: "686566723", login: "901103", trade_account_type_name: "赠金账户", ticket: "20261009012", source: "Ag(T+D)", trade_volume: "3.00", so_type: 2, so_type_name: "止损", leverage: "10", margin_order: "11,847.00", profit: "+114.00", funding_fee: "-1.10" }    ],
    // —— 充值提现管理 ——
    depositAuditStatusOptions: [
      { name: "待审核", code: "pending" },
      { name: "已通过", code: "approved" },
      { name: "已驳回", code: "rejected" }
    ],
    depositStatusOptions: [
      { name: "待确认", code: "pending" },
      { name: "已到账", code: "success" },
      { name: "失败", code: "failed" }
    ],
    depositTypeOptions: [
      { name: "银行卡充值", code: "bank" },
      { name: "第三方支付", code: "psp" },
      { name: "数字货币", code: "crypto" }
    ],
    channelOptions: [
      { name: "银联快捷", code: "unionpay" },
      { name: "支付宝", code: "alipay" },
      { name: "微信支付", code: "wechat" },
      { name: "TRC20", code: "trc20" }
    ],
    deposits: [
      { id: 4, user_code: "315899879", from: "工商银行(6222****1234)", network: "银联", to: "资金账户", order_no: "CZ20261012001", received_at: "2026-10-12 02:11:45", third_no: "UP8829100293", deposit_type_text: "银行卡充值", platform_text: "银联快捷", apply_amount: "5,000.00", currency: "CNY", pay_amount: "5,000.00", pay_currency: "CNY", rate: "1.000000", tx_hash: "-", email: "jiumamuyindian@163.com", deposit_status_text: "已到账", status: { text: "已通过", code: "approved" } },
      { id: 3, user_code: "643448777", from: "数字钱包(TJxk…9f2K)", network: "TRC20", to: "资金账户", order_no: "CZ20261011008", received_at: "2026-10-11 16:40:12", third_no: "-", deposit_type_text: "数字货币", platform_text: "TRC20", apply_amount: "3,200.00", currency: "CNY", pay_amount: "450.00", pay_currency: "USDT", rate: "7.111111", tx_hash: "0x9f3a…c8d1", email: "didi20260910@163.com", deposit_status_text: "待确认", status: { text: "待审核", code: "pending" } },
      { id: 2, user_code: "499516984", from: "支付宝", network: "-", to: "资金账户", order_no: "CZ20261010032", received_at: "2026-10-10 09:05:33", third_no: "2026101000291", deposit_type_text: "第三方支付", platform_text: "支付宝", apply_amount: "2,000.00", currency: "CNY", pay_amount: "2,000.00", pay_currency: "CNY", rate: "1.000000", tx_hash: "-", email: "-", deposit_status_text: "已到账", status: { text: "已通过", code: "approved" } },
      { id: 1, user_code: "686566723", from: "微信支付", network: "-", to: "资金账户", order_no: "CZ20261008015", received_at: "2026-10-08 21:37:08", third_no: "4200002401…", deposit_type_text: "第三方支付", platform_text: "微信支付", apply_amount: "800.00", currency: "CNY", pay_amount: "800.00", pay_currency: "CNY", rate: "1.000000", tx_hash: "-", email: "000@999.com", deposit_status_text: "失败", status: { text: "已驳回", code: "rejected" } }
    ],
    riskStatusOptions: [
      { name: "待审核", code: "pending" },
      { name: "已通过", code: "approved" },
      { name: "已驳回", code: "rejected" },
      { name: "已撤销", code: "cancelled" }
    ],
    financeStatusOptions: [
      { name: "待审核", code: "pending" },
      { name: "已通过", code: "approved" },
      { name: "已失败", code: "failed" },
      { name: "已驳回", code: "rejected" }
    ],
    withdrawals: [
      { id: 5, user_code: "884216630", sub_account_id: "902177", type_text: "", from: "资金账户", to: "数字钱包(0x9a…c31D)", dialog_style: 2, dialog: { to: "数字钱包(0x9a…c31D)", network: "TRC20", tx_hash: "-" }, order_no: "TX20261026004", third_no: "-", platform_text: "TRC20", currency: "CNY", apply_amount: "8,000.00", pay_currency: "USDT", pay_amount: "1,120.40", net_amount: "1,120.40", fee_amount: "8.00", rate: "7.140000", withdrawal_time: "2026-10-26 10:58:03", received_at: "", tx_hash: "-", network: "TRC20", email: "crypto.rider@proton.me", daily_withdraw_count: 1, daily_total_withdraw_amount: "8,000.00", risk_reason: "", finance_reason: "", status: { risk_status: "approved", finance_status: "pending", text: "待打款" }, operator_name: "Rita", can_handle_risk: 0, can_handle_finance: 1, can_fail_finance: 1, can_manual_retry: 0 },
      { id: 4, user_code: "315899879", sub_account_id: "888001", type_text: "VIP3", from: "资金账户", to: "招商银行(6214****8873)", dialog_style: 1, dialog: { country: "CHN", first_name: "维", last_name: "崔", bank_card_no: "6214830299887733", bank_code: "CMB", bank_name: "招商银行", address: "上海市浦东新区", branch_code: "30829000", branch_name: "上海分行营业部" }, order_no: "TX20261012003", third_no: "-", platform_text: "银联快捷", currency: "CNY", apply_amount: "2,000.00", pay_currency: "CNY", pay_amount: "1,990.00", net_amount: "1,990.00", fee_amount: "10.00", rate: "1.000000", withdrawal_time: "2026-10-12 03:20:41", received_at: "", tx_hash: "-", network: "-", email: "jiumamuyindian@163.com", daily_withdraw_count: 2, daily_total_withdraw_amount: "3,500.00", risk_reason: "", finance_reason: "", status: { risk_status: "pending", finance_status: "pending", text: "待审核" }, operator_name: "-", can_handle_risk: 1, can_handle_finance: 1, can_fail_finance: 0, can_manual_retry: 0 },
      { id: 3, user_code: "643448777", sub_account_id: "888012", type_text: "", from: "资金账户", to: "数字钱包(TJxk…9f2K)", dialog_style: 2, dialog: { to: "数字钱包(TJxk…9f2K)", network: "TRC20", tx_hash: "0x71bc…44ea" }, order_no: "TX20261011006", third_no: "-", platform_text: "TRC20", currency: "CNY", apply_amount: "1,500.00", pay_currency: "USDT", pay_amount: "210.90", net_amount: "210.90", fee_amount: "21.10", rate: "7.111111", withdrawal_time: "2026-10-11 14:02:55", received_at: "2026-10-11 18:44:10", tx_hash: "0x71bc…44ea", network: "TRC20", email: "didi20260910@163.com", daily_withdraw_count: 1, daily_total_withdraw_amount: "1,500.00", risk_reason: "", finance_reason: "", status: { risk_status: "approved", finance_status: "approved", text: "已通过" }, operator_name: "Rita", can_handle_risk: 0, can_handle_finance: 0, can_fail_finance: 0, can_manual_retry: 1 },
      { id: 2, user_code: "548302071", sub_account_id: "900204", type_text: "高频风控", from: "资金账户", to: "工商银行(6222****1234)", dialog_style: 1, dialog: { country: "CHN", first_name: "晓", last_name: "林", bank_card_no: "6222020900123456", bank_code: "ICBC", bank_name: "工商银行", address: "北京市朝阳区", branch_code: "1021000", branch_name: "北京分行" }, order_no: "TX20261010009", third_no: "-", platform_text: "银联快捷", currency: "CNY", apply_amount: "5,000.00", pay_currency: "CNY", pay_amount: "4,985.00", net_amount: "4,985.00", fee_amount: "15.00", rate: "1.000000", withdrawal_time: "2026-10-10 08:20:03", received_at: "", tx_hash: "-", network: "-", email: "lolo511527@sina.com", daily_withdraw_count: 3, daily_total_withdraw_amount: "12,000.00", risk_reason: "当日提现次数超限", finance_reason: "", status: { risk_status: "rejected", finance_status: "pending", text: "已驳回" }, operator_name: "Rita", can_handle_risk: 0, can_handle_finance: 0, can_fail_finance: 0, can_manual_retry: 0 },
      { id: 1, user_code: "499516984", sub_account_id: "877310", type_text: "", from: "资金账户", to: "支付宝(188****6621)", dialog_style: 1, dialog: { country: "CHN", first_name: "玲", last_name: "玲", bank_card_no: "18800006621", bank_code: "ALIPAY", bank_name: "支付宝", address: "-", branch_code: "-", branch_name: "-" }, order_no: "TX20261009012", third_no: "-", platform_text: "支付宝", currency: "CNY", apply_amount: "600.00", pay_currency: "CNY", pay_amount: "594.00", net_amount: "594.00", fee_amount: "6.00", rate: "1.000000", withdrawal_time: "2026-10-09 11:15:22", received_at: "2026-10-09 15:40:38", tx_hash: "-", network: "-", email: "-", daily_withdraw_count: 1, daily_total_withdraw_amount: "600.00", risk_reason: "", finance_reason: "", status: { risk_status: "approved", finance_status: "failed", text: "已失败" }, operator_name: "QQ", can_handle_risk: 0, can_handle_finance: 0, can_fail_finance: 0, can_manual_retry: 1 }
    ],
    withdrawalBonusByUser: {
      "315899879": { in: "¥1,088.00", out: "¥188.00", net: "¥900.00" },
      "643448777": { in: "¥0.00", out: "¥0.00", net: "¥0.00" },
      "548302071": { in: "¥88.00", out: "¥0.00", net: "¥88.00" },
      "499516984": { in: "¥500.00", out: "¥100.00", net: "¥400.00" }
    },
    currencySpreads: [
      { id: 1, currency: "CNY", rate: "1.000000", spread_deposit: "0.010000", spread_withdraw: "0.020000" },
      { id: 2, currency: "USD", rate: "7.150000", spread_deposit: "0.030000", spread_withdraw: "0.050000" },
      { id: 3, currency: "USDT", rate: "7.111111", spread_deposit: "0.020000", spread_withdraw: "0.040000" }
    ],
    networkConfigOptions: {
      config_types: [
        { name: "充值", code: "deposit" },
        { name: "提现", code: "withdraw" }
      ],
      currencies: [
        { name: "CNY", code: "CNY" },
        { name: "USD", code: "USD" },
        { name: "USDT", code: "USDT" }
      ],
      networks: [
        { name: "银联", code: "unionpay" },
        { name: "支付宝", code: "alipay" },
        { name: "微信支付", code: "wechat" },
        { name: "TRC20", code: "trc20" }
      ]
    },
    channelsByNetwork: {
      unionpay: [{ name: "银联快捷", code: "unionpay-quick" }, { name: "银联网关", code: "unionpay-web" }],
      alipay: [{ name: "支付宝-直连", code: "alipay-direct" }],
      wechat: [{ name: "微信扫码", code: "wechat-scan" }, { name: "微信H5", code: "wechat-h5" }],
      trc20: [{ name: "TRC20-主网", code: "trc20-main" }]
    },
    networkConfigs: [
      { id: 3, currency: "CNY", config_type: "deposit", config_type_text: "充值", network: "unionpay", network_text: "银联", channel: "unionpay-quick", channel_text: "银联快捷", status: "enabled", status_text: "已启用", updated_at: "2026-10-09 10:20:11", operator_name: "Bella" },
      { id: 2, currency: "USDT", config_type: "withdraw", config_type_text: "提现", network: "trc20", network_text: "TRC20", channel: "trc20-main", channel_text: "TRC20-主网", status: "enabled", status_text: "已启用", updated_at: "2026-10-05 15:41:37", operator_name: "Amy" },
      { id: 1, currency: "CNY", config_type: "deposit", config_type_text: "充值", network: "alipay", network_text: "支付宝", channel: "alipay-direct", channel_text: "支付宝-直连", status: "disabled", status_text: "已停用", updated_at: "2026-09-28 09:12:45", operator_name: "Bella" }
    ]
  };
})(window.AdminApp);

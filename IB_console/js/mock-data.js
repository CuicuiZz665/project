(function registerIBMockData(app) {
  const data = {
    brand: {
      name: "Gin",
      sub: "Partner 控制台"
    },
    user: {
      name: "大壮在路上",
      uid: "222076544"
    },
    menus: [
      { key: "overview", label: "工作台总览" },
      { key: "direct-customers", label: "直客明细" },
      { key: "partner-list", label: "合伙人列表" },
      { key: "sub-agent-network", label: "子代理网络" },
      { key: "finance-settlement", label: "财务与结算" },
      { key: "apply-expert", label: "申请成为专家" }
    ],
    overview: {
      pageTitle: "工作台总览",
      monthLabel: "2026年9月",
      exportLabel: "导出月报",
      metrics: [
        {
          id: "withdrawable-pnl",
          label: "待结算（USDT）",
          value: "450.00",
          sub: "可结算余额: 0.00 · 累计已结: 0.00",
          action: { type: "withdraw", label: "出金" },
          subAction: { type: "fund-flow", label: "资金流水" }
        },
        {
          id: "total-position",
          label: "累计持仓量(USDT)",
          value: "0.00",
          sub: "直客 0.00 | 代理 0.00"
        },
        {
          id: "new-customers",
          label: "新增客户 / 共邀(人)",
          value: "0/0",
          rangeChip: "7D"
        },
        {
          id: "marketing-ratio",
          label: "营销激励比例",
          value: "0.00%",
          sub: "当前等级对应的营销返佣比例"
        },
        {
          id: "copy-dividend",
          label: "跟单分成(USDT)",
          value: "0.00",
          sub: "跟随客户产生的累计分润"
        },
        {
          id: "sub-agents",
          label: "子代理网络 (人)",
          value: "0",
          sub: "当前下级网络共计 0 个层级"
        },
        {
          id: "master-count",
          label: "当前高手数(位)",
          value: "0",
          sub: "本月新增 0 位"
        },
        {
          id: "followers",
          label: "总跟随人数(人)",
          value: "0",
          sub: "本月新增 0 人"
        },
        {
          id: "follow-amount",
          label: "总跟随金额(USDT)",
          value: "0.00"
        }
      ],
      levelCard: {
        title: "当前等级",
        badge: "V4",
        rows: [
          { label: "可获返佣", value: "85.00%", primary: true },
          { label: "当前营销激励:", value: "0.00%" },
          { label: "下一等级:", value: "V5" }
        ],
        progress: [
          {
            name: "月活客户进度",
            value: "0/100人",
            current: 0,
            total: 100
          },
          {
            name: "交易量进度(USDT)",
            value: "0.00/10,000,000.00USDT",
            current: 0,
            total: 10000000
          }
        ]
      },
      /* 固定比例身份（被上级设置固定返佣比例 / 经固定比例链接注册）：不参与等级体系。
         等级 / 营销激励 / 下一等级置空，右侧升级进度替换为说明文案；可获返佣显示固定比例 */
      levelCardFixed: {
        title: "当前等级",
        badge: "—",
        rows: [
          { label: "可获返佣", value: "90.00%", primary: true },
          { label: "当前营销激励:", value: "—" },
          { label: "下一等级:", value: "—" }
        ],
        note: {
          title: "固定返佣比例 · 不参与等级体系",
          text: "您的返佣按固定比例结算，等级、营销激励与升级进度均不适用"
        }
      },
      linkCard: {
        title: "默认跟踪链接",
        liveBadge: "生效中",
        qrLabel: "二维码",
        shareLabel: "分享",
        fields: [
          { label: "推荐码", value: "DXQEWRV", copyable: false, code: true },
          { label: "Web地址", value: "https://www.ginx...", copyable: true, copyValue: "https://www.ginx.io/?invitation_code=DXQEWRV" },
          { label: "Miniapp地址", value: "https://t.me/ginf...", copyable: true, copyValue: "https://t.me/ginfit_bot?start=DXQEWRV" }
        ]
      },
      chartCard: {
        title: "数据",
        tabs: [
          { id: "rebate", label: "返佣", active: true },
          { id: "position", label: "持仓量" },
          { id: "active-customers", label: "活跃客户" }
        ],
        rangeChip: "7D",
        line: {
          fromColor: "#f13b5d",
          toColor: "#ffd165",
          fillFrom: "rgba(241, 59, 93, 0.16)",
          values: [0, 0, 0, 0, 0, 0, 0],
          days: ["09/07", "09/08", "09/09", "09/10", "09/11", "09/12", "09/13"]
        }
      },
      incomeCard: {
        title: "收入构成",
        subtitle: "近期各项收入来源",
        rangeChip: "7D",
        rows: [
          { id: "direct-rebate", name: "直客返佣", value: "0.00 USDT", percent: "0.00%", ratio: 0 },
          { id: "marketing", name: "营销激励", value: "0.05 USDT", percent: "100.00%", ratio: 100 },
          { id: "copy-dividend", name: "跟单分成", value: "0.00 USDT", percent: "0.00%", ratio: 0 }
        ]
      },
      footCards: [
        {
          id: "product-distribution",
          title: "交易产品分布",
          subtitle: "展示全部有效持仓产品分布及 Top 5 品种",
          rangeChip: "7D",
          emptyText: "所选期间暂无数据。"
        },
        {
          id: "rebate-contribution",
          title: "返佣贡献",
          subtitle: "各品种产生的佣金贡献 Top 10",
          rangeChip: "7D",
          emptyText: "所选期间暂无数据。"
        }
      ]
    },
    /* 合伙人列表页（页头配置；页面拆为「分佣比例」「直客与子代理」上下两区） */
    partnerList: {
      pageTitle: "合伙人列表"
    },
    /* 上区：分佣比例（一行 = 一个比例 + 专属邀请码；注册人数按当前绑定动态计算） */
    partnerPlans: {
      title: "分佣比例",
      hint: "每个分佣比例对应一个专属邀请码：经该链接注册的客户即绑定此比例",
      addLabel: "增加返佣比例",
      searchPlaceholder: "搜索 名称 / 比例 / 地址",
      emptyText: "未找到匹配的分佣比例",
      permanentLabel: "永久",
      countTitle: "查看经该邀请码注册的客户",
      pageSize: 5,
      totalLabel: "共 {n} 条",
      /* 状态列与筛选：正常/失效；作废后比例立即失效（成员已复制的固定比例不变） */
      statusFilterLabel: "状态",
      statusOptions: [
        { key: "all", label: "全部" },
        { key: "active", label: "正常" },
        { key: "invalid", label: "失效" }
      ],
      statusLabels: { active: "正常", invalid: "失效" },
      voidLabel: "作废",
      voidHint: "作废后该分佣比例立即失效",
      voidConfirm: {
        title: "作废分佣比例",
        body: "作废后，「{name}」的分佣比例将立即失效，其专属邀请链接不再绑定此比例；已注册客户已复制的固定比例保持不变。确定要作废吗？",
        confirmLabel: "确定",
        cancelLabel: "取消"
      },
      columns: [
        { key: "name", label: "计划名称" },
        { key: "web", label: "Web地址" },
        { key: "miniapp", label: "Miniapp地址" },
        { key: "contract", label: "合约分佣比例", numeric: true },
        { key: "expireAt", label: "有效期" },
        { key: "memberCount", label: "注册人数", numeric: true },
        { key: "status", label: "状态" },
        { key: "op", label: "操作" }
      ],
      rows: [
        { id: "plan-01", code: "qI3I", name: "暴走蛟龙", status: "active", contract: "90", expireAt: "", contractTrader: "80", contractApi: "10", contractTraderApi: "10", spot: "0", spotTrader: "0", spotApi: "0", spotTraderApi: "0" },
        { id: "plan-02", code: "aX7k", name: "山顶洞人", status: "active", contract: "85", expireAt: "2026-12-31", contractTrader: "75", contractApi: "0", contractTraderApi: "0", spot: "0", spotTrader: "0", spotApi: "0", spotTraderApi: "0" },
        { id: "plan-03", code: "mK2p", name: "龙腾四海", status: "active", contract: "80", expireAt: "", contractTrader: "0", contractApi: "0", contractTraderApi: "0", spot: "0", spotTrader: "0", spotApi: "0", spotTraderApi: "0" },
        { id: "plan-04", code: "zQ9r", name: "数字游民", status: "active", contract: "75", expireAt: "2027-06-30", contractTrader: "60", contractApi: "5", contractTraderApi: "0", spot: "0", spotTrader: "0", spotApi: "0", spotTraderApi: "0" },
        { id: "plan-05", code: "bW4n", name: "深海潜行", status: "active", contract: "90", expireAt: "", contractTrader: "80", contractApi: "10", contractTraderApi: "10", spot: "10", spotTrader: "0", spotApi: "0", spotTraderApi: "0" },
        { id: "plan-06", code: "cT6v", name: "币圈老猫", status: "invalid", contract: "70", expireAt: "", contractTrader: "0", contractApi: "0", contractTraderApi: "0", spot: "0", spotTrader: "0", spotApi: "0", spotTraderApi: "0" }
      ]
    },
    /* 下区：直客与子代理全员列表（agents 为经邀请链接注册/历史转化的成员；直客由直客明细数据派生，见文件末尾） */
    partnerPeople: {
      title: "直客与子代理",
      hint: "直客可「设为合伙人」单独设置比例；子代理可修改固定返佣比例或解除",
      emptyText: "未找到匹配的成员",
      pageSize: 10,
      filterBar: {
        typeLabel: "人员类型",
        searchPlaceholder: "搜索 UID / 昵称"
      },
      typeTabs: [
        { key: "direct", label: "直客" },
        { key: "agent", label: "子代理" }
      ],
      columns: [
        { key: "uid", label: "用户UID", numeric: true },
        { key: "name", label: "用户昵称" },
        { key: "registeredAt", label: "注册时间" },
        { key: "volume", label: "累计交易量(USDT)", numeric: true },
        { key: "rebate", label: "累计返佣(USDT)", numeric: true, agentOnly: true },
        { key: "rate", label: "当前生效比例", numeric: true },
        { key: "code", label: "所属邀请码", agentOnly: true }
      ],
      opLabel: "操作",
      setPartnerLabel: "设为合伙人",
      editRateLabel: "修改比例",
      cancelLabel: "解除",
      cancelHint: "解除固定分佣比例，降回直客",
      cancelConfirm: {
        title: "解除固定分佣",
        body: "解除后，「{name}」将不再享有当前设置的固定合约分佣比例，等级降回其原本等级；若原本没有等级，则回到系统默认等级。该成员将在下方列表中降回「直客」。确定要解除吗？",
        confirmLabel: "确定",
        cancelLabel: "取消"
      },
      convert: {
        title: "设为合伙人",
        notice: "为该直客单独设置固定分佣比例：不生成邀请码、不关联已有分佣比例，保存后即成为子代理。",
        nameLabel: "用户昵称",
        ratioLabel: "合约分佣比例",
        ratioPlaceholder: "直接填数字，默认按 %",
        requiredHint: "请填写合约分佣比例",
        ratioRangeHint: "请输入 0~100 的数字，默认按 %",
        cancelLabel: "取消",
        saveLabel: "保存"
      },
      rateForm: {
        title: "修改固定返佣比例",
        notice: "修改仅对该成员本人生效，不影响其所属分佣比例与后续经链接注册的客户。",
        currentLabel: "当前生效比例",
        newLabel: "新的合约分佣比例",
        ratioPlaceholder: "直接填数字，默认按 %",
        requiredHint: "请填写新的合约分佣比例",
        ratioRangeHint: "请输入 0~100 的数字，默认按 %",
        cancelLabel: "取消",
        saveLabel: "保存"
      },
      drawer: {
        titlePrefix: "邀请码",
        titleSuffix: "注册客户",
        countUnit: "人",
        searchPlaceholder: "搜索 UID / 昵称",
        emptyText: "该邀请码暂无注册客户",
        pageSize: 10,
        adjustedTag: "已调整",
        adjustedTitle: "该成员的固定比例已被单独修改，不再是所属分佣比例的默认值",
        stats: [
          { key: "count", label: "注册人数" },
          { key: "active", label: "活跃客户" },
          { key: "volume", label: "累计交易量(USDT)" },
          { key: "rebate", label: "累计返佣(USDT)" }
        ],
        columns: [
          { key: "uid", label: "用户UID", numeric: true },
          { key: "name", label: "用户昵称" },
          { key: "registeredAt", label: "注册时间" },
          { key: "status", label: "状态" },
          { key: "volume", label: "累计交易量(USDT)", numeric: true },
          { key: "rebate", label: "累计返佣(USDT)", numeric: true },
          { key: "rate", label: "当前生效比例", numeric: true }
        ]
      },
      rows: [
        { id: "ag-01", uid: "412876", name: "铁头娃", username: "ironhead", registeredAt: "2026-08-02 09:12", volume: "128,400.00", rebate: "115.56", status: "活跃", type: "agent", code: "qI3I", rate: "93", rateOverridden: true },
        { id: "ag-02", uid: "415032", name: "韭菜收割机", username: "leekmower", registeredAt: "2026-08-05 21:40", volume: "8,930.00", rebate: "8.04", status: "活跃", type: "agent", code: "qI3I", rate: "90", rateOverridden: false },
        { id: "ag-03", uid: "417754", name: "摸鱼大师", username: "fishmaster", registeredAt: "2026-08-09 14:03", volume: "0.00", rebate: "0.00", status: "静默", type: "agent", code: "qI3I", rate: "90", rateOverridden: false },
        { id: "ag-04", uid: "420661", name: "北纬三十度", username: "lat30", registeredAt: "2026-08-15 10:47", volume: "45,120.00", rebate: "40.61", status: "活跃", type: "agent", code: "qI3I", rate: "90", rateOverridden: false },
        { id: "ag-05", uid: "423918", name: "满仓干满仓", username: "fullpos", registeredAt: "2026-08-21 19:26", volume: "210,650.00", rebate: "189.59", status: "活跃", type: "agent", code: "qI3I", rate: "90", rateOverridden: false },
        { id: "ag-06", uid: "426447", name: "赛博朋克2077", username: "cyber77", registeredAt: "2026-08-28 08:55", volume: "3,200.00", rebate: "2.88", status: "活跃", type: "agent", code: "qI3I", rate: "90", rateOverridden: false },
        { id: "ag-07", uid: "429010", name: "阳光开朗大男孩", username: "sunnyboy", registeredAt: "2026-09-03 23:18", volume: "0.00", rebate: "0.00", status: "静默", type: "agent", code: "qI3I", rate: "90", rateOverridden: false },
        { id: "ag-08", uid: "430115", name: "山顶看日出", username: "sunrise88", registeredAt: "2026-08-04 07:22", volume: "66,780.00", rebate: "56.76", status: "活跃", type: "agent", code: "aX7k", rate: "85", rateOverridden: false },
        { id: "ag-09", uid: "431900", name: "慢牛投资者", username: "slowbull", registeredAt: "2026-08-11 16:34", volume: "12,400.00", rebate: "10.54", status: "活跃", type: "agent", code: "aX7k", rate: "85", rateOverridden: false },
        { id: "ag-10", uid: "433208", name: "打工人小张", username: "workerz", registeredAt: "2026-08-19 11:09", volume: "0.00", rebate: "0.00", status: "静默", type: "agent", code: "aX7k", rate: "85", rateOverridden: false },
        { id: "ag-11", uid: "435572", name: "睡后收入", username: "passivezzz", registeredAt: "2026-08-25 02:47", volume: "98,210.00", rebate: "83.48", status: "活跃", type: "agent", code: "aX7k", rate: "85", rateOverridden: false },
        { id: "ag-12", uid: "437646", name: "稳如老狗", username: "steadog", registeredAt: "2026-09-01 13:31", volume: "5,680.00", rebate: "4.83", status: "活跃", type: "agent", code: "aX7k", rate: "85", rateOverridden: false },
        { id: "ag-13", uid: "440283", name: "龙的传人", username: "dragonheir", registeredAt: "2026-08-06 20:15", volume: "151,900.00", rebate: "121.52", status: "活跃", type: "agent", code: "mK2p", rate: "80", rateOverridden: false },
        { id: "ag-14", uid: "442731", name: "早起的鸟儿", username: "earlybird", registeredAt: "2026-08-14 09:28", volume: "7,340.00", rebate: "5.87", status: "活跃", type: "agent", code: "mK2p", rate: "80", rateOverridden: false },
        { id: "ag-15", uid: "444866", name: "深藏功与名", username: "hiddenwin", registeredAt: "2026-08-22 17:52", volume: "0.00", rebate: "0.00", status: "静默", type: "agent", code: "mK2p", rate: "80", rateOverridden: false },
        { id: "ag-16", uid: "446109", name: "一梭哈", username: "allin2026", registeredAt: "2026-08-30 12:44", volume: "84,560.00", rebate: "67.65", status: "活跃", type: "agent", code: "mK2p", rate: "80", rateOverridden: false },
        { id: "ag-17", uid: "448325", name: "数字猎人", username: "numhunter", registeredAt: "2026-08-08 15:37", volume: "33,470.00", rebate: "25.10", status: "活跃", type: "agent", code: "zQ9r", rate: "75", rateOverridden: false },
        { id: "ag-18", uid: "450774", name: "云端漫步", username: "cloudwalk", registeredAt: "2026-08-16 22:02", volume: "1,980.00", rebate: "1.49", status: "活跃", type: "agent", code: "zQ9r", rate: "75", rateOverridden: false },
        { id: "ag-19", uid: "452830", name: "半仓选手", username: "halfpos", registeredAt: "2026-08-24 06:19", volume: "0.00", rebate: "0.00", status: "静默", type: "agent", code: "zQ9r", rate: "75", rateOverridden: false },
        { id: "ag-20", uid: "454162", name: "深海潜航员", username: "deepnav", registeredAt: "2026-08-12 10:58", volume: "47,830.00", rebate: "43.05", status: "活跃", type: "agent", code: "bW4n", rate: "90", rateOverridden: false },
        { id: "ag-21", uid: "456508", name: "追涨杀跌老司机", username: "driverbuy", registeredAt: "2026-08-20 19:44", volume: "15,620.00", rebate: "14.06", status: "活跃", type: "agent", code: "bW4n", rate: "90", rateOverridden: false },
        { id: "ag-22", uid: "458733", name: "静待花开", username: "waitbloom", registeredAt: "2026-08-27 09:11", volume: "2,150.00", rebate: "1.94", status: "活跃", type: "agent", code: "bW4n", rate: "90", rateOverridden: false },
        { id: "ag-23", uid: "460294", name: "老猫钓大鱼", username: "catfish", registeredAt: "2026-08-13 14:26", volume: "61,240.00", rebate: "42.87", status: "活跃", type: "agent", code: "cT6v", rate: "70", rateOverridden: false },
        { id: "ag-24", uid: "462551", name: "币市观察员", username: "coinwatch", registeredAt: "2026-08-29 08:03", volume: "940.00", rebate: "0.66", status: "活跃", type: "agent", code: "cT6v", rate: "70", rateOverridden: false },
        { id: "cv-01", uid: "326102", name: "老周说币", username: "laozhou", registeredAt: "2026-07-18 16:42", volume: "22,300.00", rebate: "18.24", status: "活跃", type: "agent", code: null, rate: "82", rateOverridden: false },
        { id: "cv-02", uid: "325478", name: "阿May", username: "amay88", registeredAt: "2026-07-25 11:15", volume: "0.00", rebate: "0.00", status: "静默", type: "agent", code: null, rate: "78", rateOverridden: false }
      ],
      directRows: []
    },
    partnerForm: {
      createTitle: "添加分佣比例",
      cancelLabel: "取消",
      saveLabel: "保存",
      ratioRangeHint: "请输入 0~100 的数字，默认按 %",
      collapseLabel: "更多分佣比例设置",
      collapseLabelOpen: "收起分佣比例设置",
      collapseHint: "提示：以下分佣比例当前暂不生效，仅作保存记录；平台开放后按此处设置执行。",
      /* 每个分佣比例对应两条专属邀请链接（Web / Miniapp），均含本邀请码；key 与列表列 key 对应 */
      inviteLinks: [
        { key: "web", label: "Web地址", baseUrl: "https://www.ginx.io/?invitation_code=", shortHead: "https://…" },
        { key: "miniapp", label: "Miniapp地址", baseUrl: "https://t.me/ginfit_bot?start=", shortHead: "https://t.me/…" }
      ],
      success: {
        title: "添加成功",
        copyLabel: "复制链接",
        copiedLabel: "已复制",
        doneLabel: "完成",
        line: "「{name}」已保存为分佣比例 · 合约分佣比例 {contract}% · 有效期 {expire} · 邀请码 {code}",
        hint: "每个分佣比例生成 Web 与 Miniapp 两条专属邀请链接（链接中含本邀请码）：发给谁，谁注册后即绑定此比例，按设置的合约分佣比例结算。"
      },
      fields: [
        { key: "name", label: "合伙计划名称", placeholder: "请输入合伙计划名称", span: 6, required: true },
        { key: "contract", label: "合约分佣比例", placeholder: "直接填数字，默认按 %", span: 6, required: true, ratio: true },
        { key: "expireAt", label: "时间限制", placeholder: "", span: 6, date: true, optionalTag: "留空为永久" },
        { key: "contractTrader", label: "合约交易员分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true },
        { key: "contractApi", label: "合约api分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true },
        { key: "contractTraderApi", label: "合约交易员api分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true },
        { key: "spot", label: "币币分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true },
        { key: "spotTrader", label: "币币交易员分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true },
        { key: "spotApi", label: "币币api分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true },
        { key: "spotTraderApi", label: "币币交易员api分佣比例", placeholder: "选填", span: 3, ratio: true, collapsed: true }
      ]
    },
    directCustomers: {
      pageTitle: "直客明细",
      hint: "通过默认跟踪链接注册的客户",
      exportLabel: "导出",
      searchPlaceholder: "搜索",
      emptyText: "未找到匹配的客户",
      pageSize: 10,
      columns: [
        { key: "uid", label: "用户UID", numeric: true },
        { key: "name", label: "用户昵称" },
        { key: "username", label: "用户名" },
        { key: "registeredAt", label: "注册时间" },
        { key: "volume", label: "累计交易量(USDT)", numeric: true },
        { key: "rebate", label: "累计返佣(USDT)", numeric: true },
        { key: "status", label: "状态" }
      ],
      rows: [
        { id: "dc-01", uid: "330112", name: "风一样的男子", username: "windman", registeredAt: "2026-09-11 14:22", volume: "12,480.00", rebate: "36.20", status: "活跃" },
        { id: "dc-02", uid: "330113", name: "小币童鞋", username: "cointong", registeredAt: "2026-09-11 10:05", volume: "0.00", rebate: "0.00", status: "静默" },
        { id: "dc-03", uid: "329801", name: "打铁趁热", username: "hotiron", registeredAt: "2026-09-10 21:47", volume: "3,150.00", rebate: "8.90", status: "活跃" },
        { id: "dc-04", uid: "329645", name: "阿伟", username: "awei88", registeredAt: "2026-09-10 16:31", volume: "480.00", rebate: "1.35", status: "活跃" },
        { id: "dc-05", uid: "329312", name: "山高水长", username: "mountain", registeredAt: "2026-09-09 19:02", volume: "0.00", rebate: "0.00", status: "静默" },
        { id: "dc-06", uid: "328977", name: "tigerhu", username: "tigerhu", registeredAt: "2026-09-08 11:26", volume: "56,300.00", rebate: "168.55", status: "活跃" },
        { id: "dc-07", uid: "328540", name: "梦里花落", username: "dreamfall", registeredAt: "2026-09-07 23:58", volume: "1,205.00", rebate: "3.10", status: "活跃" },
        { id: "dc-08", uid: "328211", name: "老王别这样", username: "laowang", registeredAt: "2026-09-06 09:14", volume: "0.00", rebate: "0.00", status: "静默" },
        { id: "dc-09", uid: "327866", name: "孤舟蓑笠翁", username: "loneboat", registeredAt: "2026-09-05 15:40", volume: "22,680.00", rebate: "64.00", status: "活跃" },
        { id: "dc-10", uid: "327503", name: "momo达", username: "momoda", registeredAt: "2026-09-04 20:18", volume: "860.00", rebate: "2.40", status: "活跃" },
        { id: "dc-11", uid: "327188", name: "疾风剑豪", username: "yasuo66", registeredAt: "2026-09-03 12:09", volume: "9,940.00", rebate: "27.80", status: "活跃" },
        { id: "dc-12", uid: "326974", name: "晚风轻踩云朵", username: "evenbreeze", registeredAt: "2026-09-02 08:52", volume: "0.00", rebate: "0.00", status: "静默" }
      ]
    }
  };

  // 下区「直客」与直客明细页同源（同 UID）：在合伙人列表转化/解除时两页表现保持一致
  data.partnerPeople.directRows = data.directCustomers.rows.map(row => ({
    id: `dir-${row.id}`,
    uid: row.uid,
    name: row.name,
    username: row.username,
    registeredAt: row.registeredAt,
    volume: row.volume,
    rebate: row.rebate,
    status: row.status,
    type: "direct",
    code: null,
    rate: null,
    rateOverridden: false
  }));

  // 预览固定比例身份：URL 加 ?fixedRate=1（如 index.html?fixedRate=1#/overview）
  if (new URLSearchParams(window.location.search).get("fixedRate") === "1") {
    data.overview.levelCard = data.overview.levelCardFixed;
  }

  app.mockData = data;
})(window.IBApp);

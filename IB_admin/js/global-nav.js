(function registerGlobalNav(app) {
  const { Button, Dropdown, Select, Tabs } = antd;

  // 收藏与固定页签约定：overview（数据概览）是主标签，不允许被关闭。
  const PINNED_TAB_KEY = "overview";
  const FAVORITE_STORE_KEY = "ib-admin-favorite-pages";

  // 每个可导航页面的搜索别名：中文别名、常见拼音缩写、英文关键词。
  const PAGE_KEYWORDS = {
    overview: ["dashboard", "kanban", "home", "shuju", "数据", "看板", "概览"],
    customer: ["customer", "kh", "客户", "列表"],
    loginLog: ["login", "log", "rizhi", "denglu", "登录", "日志"],
    blacklist: ["blacklist", "hei", "黑名单", "拉黑"],
    wheel: ["wheel", "lottery", "zuanpan", "choujiang", "互动", "抽奖配置", "转盘", "大转盘", "抽奖", "奖池"],
    badge: ["badge", "huizhang", "徽章", "徽章列表"],
    coupon: ["coupon", "youhuiquan", "quan", "优惠券", "券"],
    whitelist: ["whitelist", "bai", "白名单"],
    agent: ["agent", "dl", "代理", "代理商"],
    agentApplications: ["application", "apply", "shenqing", "代理", "申请", "审核"],
    agentLevel: ["level", "dengji", "等级", "配置"],
    commission: ["commission", "yongjin", "佣金", "返佣", "rebate", "record", "jilu", "记录", "结算", "分佣"],
    rules: ["point", "points", "jifen", "积分", "配置", "规则"],
    activity: ["activity", "huodong", "活动", "配置"],
    activityApplications: ["signup", "baoming", "报名", "申请", "列表"],
    delivery: ["delivery", "toudi", "投递", "任务"],
    pointDetails: ["detail", "mingxi", "明细", "积分", "记录"],
    courses: ["course", "kecheng", "课程", "学院", "新手村", "视频", "academy"],
    courseLessons: ["lesson", "chapter", "zhangjie", "章节", "讲次", "视频"],
    roles: ["role", "juese", "角色", "权限"],
    users: ["user", "yonghu", "用户", "账号", "设置"],
    adList: ["ad", "advertis", "ggw", "广告", "广告列表", "banner"],
    adEntry: ["entry", "tiao", "条目", "广告位", "配置"],
    messageManage: ["message", "xiaoxi", "消息", "站内", "发送"],
    emailCode: ["email", "code", "captcha", "yanzhengma", "验证码", "查询"],
    mailList: ["mail", "email", "youjian", "邮件", "push", "模板"],
    siteList: ["site", "zhannei", "站内信", "通知"],
    mailTemplates: ["layout", "template", "moban", "模板", "布局"],
    versionSetting: ["version", "banben", "版本", "release", "app"],
    changePassword: ["password", "mima", "密码", "修改"],
    fundsManage: ["fund", "zijin", "资金", "发放", "扣除", "批量"],
    fundFlow: ["flow", "liushui", "流水", "transactions"],
    orderList: ["order", "dingdan", "订单", "交易", "持仓", "平仓"],
    depositManage: ["deposit", "chongzhi", "recharge", "充值", "入金"],
    withdrawRisk: ["withdraw", "tixian", "risk", "提现", "出金", "风控", "审核"],
    withdrawFinance: ["withdraw", "tixian", "finance", "caiwu", "提现", "出金", "财务"],
    depositWithdrawNetwork: ["network", "wangluo", "psp", "tongdao", "网络", "通道", "配置"]
  };

  // 把侧边栏 menuItems 拍平成可搜索/可显示的页面索引 { key, label, path, keywords }。
  // 侧边栏最深有三层（如 代理管理 / 代理关系管理 / 代理商列表），这里递归展开，disabled 项跳过。
  function buildNavIndex(menuItems) {
    const pages = [];
    function walk(items, parents) {
      (items || []).forEach(item => {
        if (item.disabled) return;
        if (Array.isArray(item.children) && item.children.length) {
          walk(item.children, parents.concat(item.label));
          return;
        }
        pages.push({
          key: item.key,
          label: item.label,
          path: parents.length ? `${parents.join(" / ")} / ${item.label}` : item.label,
          keywords: PAGE_KEYWORDS[item.key] || []
        });
      });
    }
    walk(menuItems, []);
    return pages;
  }

  // 模糊打分：完整前缀 > 包含 > 子序列；返回 -1 表示不匹配。
  function fuzzyScore(term, target) {
    const query = term.toLowerCase();
    const text = target.toLowerCase();
    if (!query) return 0;
    const direct = text.indexOf(query);
    if (direct === 0) return 1000 - text.length;
    if (direct > 0) return 800 - direct * 2;
    let cursor = 0;
    let score = 0;
    let streak = 0;
    for (const char of query) {
      const found = text.indexOf(char, cursor);
      if (found === -1) return -1;
      streak = found === cursor ? streak + 1 : 1;
      score += 20 + streak * 6 - Math.min(found - cursor, 10);
      cursor = found + 1;
    }
    return Math.max(score, 1);
  }

  function pageHaystack(page) {
    return `${page.label} ${page.path} ${(page.keywords || []).join(" ")}`;
  }

  // 空格分词后每个词都必须命中（AND 语义），命中标签本身加权。
  function matchPage(page, terms) {
    let total = 0;
    for (const term of terms) {
      const labelScore = fuzzyScore(term, page.label);
      const pathScore = fuzzyScore(term, page.path);
      const hayScore = fuzzyScore(term, pageHaystack(page));
      const best = Math.max(labelScore, pathScore, hayScore);
      if (best <= 0) return 0;
      total += best + (labelScore === best ? 200 : 0);
    }
    return total;
  }

  function searchPages(pages, query) {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return pages.slice();
    return pages
      .map(page => ({ page, score: matchPage(page, terms) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.page);
  }

  function loadFavorites() {
    try {
      const raw = window.localStorage.getItem(FAVORITE_STORE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.filter(item => typeof item === "string") : [];
    } catch (error) {
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      window.localStorage.setItem(FAVORITE_STORE_KEY, JSON.stringify(list));
    } catch (error) {
      /* file:// 或隐私模式下静默失败即可 */
    }
  }

  app.buildNavIndex = buildNavIndex;

  // 顶栏全局搜索：antd Select + 自定义模糊过滤 + 收藏（localStorage 持久化）。
  app.GlobalSearch = function GlobalSearch({ menuItems, extraPages, onNavigate }) {
    const [keyword, setKeyword] = React.useState("");
    const [favorites, setFavorites] = React.useState(loadFavorites);
    const selectRef = React.useRef(null);
    // extraPages：不在侧边栏的隐藏页（报名列表），由调用方传入，参与搜索与收藏。
    const pages = buildNavIndex(menuItems).concat(extraPages || []);
    const pageByKey = {};
    const favoriteSet = {};
    pages.forEach(page => { pageByKey[page.key] = page; });
    favorites.forEach(key => { favoriteSet[key] = true; });

    React.useEffect(() => {
      saveFavorites(favorites);
    }, [favorites]);

    React.useEffect(() => {
      function handleKeydown(event) {
        if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "k") {
          event.preventDefault();
          if (selectRef.current && selectRef.current.focus) selectRef.current.focus();
        }
      }
      window.addEventListener("keydown", handleKeydown);
      return () => window.removeEventListener("keydown", handleKeydown);
    }, []);

    function toggleFavorite(key) {
      setFavorites(list => (list.includes(key) ? list.filter(item => item !== key) : [...list, key]));
    }

    function toOption(page) {
      return { value: page.key, label: page.label };
    }

    const trimmed = keyword.trim();
    const favoritePages = favorites.filter(key => pageByKey[key]).map(key => pageByKey[key]);
    const options = trimmed
      ? searchPages(pages, trimmed).map(toOption)
      : [
          ...(favoritePages.length ? [{ label: "已收藏", options: favoritePages.map(toOption) }] : []),
          { label: "全部页面", options: pages.map(toOption) }
        ];

    function renderOption(option) {
      const page = pageByKey[option.value] || { label: option.label, path: "" };
      const isFavorite = Boolean(favoriteSet[option.value]);
      return React.createElement(
        "div",
        { className: "gs-option" },
        React.createElement(
          "span",
          {
            className: `gs-star${isFavorite ? " is-fav" : ""}`,
            role: "button",
            "aria-label": isFavorite ? "取消收藏" : "收藏",
            title: isFavorite ? "取消收藏" : "收藏",
            onClick: event => {
              event.stopPropagation();
              toggleFavorite(option.value);
            },
            onMouseDown: event => {
              // preventDefault 阻止焦点转移到星标，否则搜索框失焦会让下拉收起、click 落空。
              event.preventDefault();
              event.stopPropagation();
            }
          },
          isFavorite ? "★" : "☆"
        ),
        React.createElement(
          "div",
          { className: "gs-option-main" },
          React.createElement("span", { className: "gs-option-label" }, page.label),
          React.createElement("span", { className: "gs-option-path" }, page.path)
        )
      );
    }

    return React.createElement(Select, {
      ref: selectRef,
      className: "global-search",
      showSearch: true,
      filterOption: false,
      value: null,
      searchValue: keyword,
      onSearch: setKeyword,
      options: options,
      optionRender: renderOption,
      placeholder: "搜索页面，支持模糊匹配（Ctrl/⌘ + K）",
      suffixIcon: React.createElement("span", { className: "gs-suffix" }, "⌕"),
      popupMatchSelectWidth: false,
      listHeight: 320,
      notFoundContent: trimmed ? "没有匹配的页面" : "暂无可跳转页面",
      onSelect: key => {
        if (!pageByKey[key]) return;
        onNavigate(key);
        setKeyword("");
        window.setTimeout(() => {
          if (selectRef.current && selectRef.current.blur) selectRef.current.blur();
        }, 0);
      }
    });
  };

  // 顶部页面标签条：antd Tabs editable-card，主页固定，其余可 ✕ 关闭。
  app.PageTabs = function PageTabs({ pages, openTabs, activeKey, onChange, onClose, onCloseOthers, onCloseAll }) {
    const labelByKey = {};
    pages.forEach(page => { labelByKey[page.key] = page.label; });

    const items = openTabs.map(key => ({
      key: key,
      label: labelByKey[key] || key,
      closable: key !== PINNED_TAB_KEY
    }));

    return React.createElement(
      Tabs,
      {
        className: "page-tabbar",
        type: "editable-card",
        hideAdd: true,
        size: "small",
        items: items,
        activeKey: activeKey,
        onChange: onChange,
        removeIcon: React.createElement("span", { className: "tab-close-icon" }, "✕"),
        onEdit: (targetKey, action) => {
          if (action === "remove" && targetKey !== PINNED_TAB_KEY) onClose(targetKey);
        },
        tabBarExtraContent: {
          right: React.createElement(
            Dropdown,
            {
              trigger: ["click"],
              menu: {
                items: [
                  { key: "others", label: "关闭其他标签页", disabled: openTabs.length <= 2 },
                  { key: "all", label: "关闭全部标签页", disabled: openTabs.length <= 1 }
                ],
                onClick: ({ key }) => (key === "others" ? onCloseOthers() : onCloseAll())
              }
            },
            React.createElement(Button, { size: "small", type: "text", className: "tabbar-more" }, "···")
          )
        }
      }
    );
  };
})(window.AdminApp);

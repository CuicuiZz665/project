const tabButtons = document.querySelectorAll("[data-tab]");
    const panels = {
      exclusive: document.getElementById("exclusive-panel"),
      redeem: document.getElementById("redeem-panel")
    };

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.tab;
        tabButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", String(active));
        });
        Object.entries(panels).forEach(([key, panel]) => {
          panel.classList.toggle("is-active", key === target);
        });
      });
    });

    const taskButtons = document.querySelectorAll("[data-task-tab]");
    const taskPanels = {
      new: document.getElementById("new-task-panel"),
      advanced: document.getElementById("advanced-task-panel")
    };
    taskButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.taskTab;
        taskButtons.forEach((item) => item.classList.toggle("is-active", item === button));
        Object.entries(taskPanels).forEach(([key, panel]) => {
          panel.classList.toggle("is-active", key === target);
        });
      });
    });

    // ===== 福利中心 · 三个子面板（优惠券 / 积分商城 / 徽章），标签带实时计数 =====
    // 优惠券数据模型同线上 api/coupon/my：couponType 1=亏损代金券 2=返现 3=手续费减免；status 30=可用 20=未激活
    const coupons = [
      { id: 101, couponType: 1, category: "全部", name: "亏损保障券", description: "下单亏损时自动抵扣", amount: "50", currency: "USDT", expire: "有效期至 2026-09-30", status: 30 },
      { id: 102, couponType: 2, category: "交易", name: "交易返现券", description: "达成交易量按进度返现", amount: "200", currency: "USDT", usedAmount: 120, totalAmount: 200, status: 30 },
      { id: 103, couponType: 3, category: "交易", name: "手续费减免券", description: "下单手续费立减", amount: "10", currency: "%", expire: "有效期至 2026-10-15", status: 30 }
    ];
    const couponTypeLabel = { 1: "亏损代金券", 2: "返现代金券", 3: "手续费减免" };
    const ticketIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5v-4Z"/><path d="M12 8v1M12 11.5v1M12 15v1"/></svg>';

    const mallRewards = [
      { amount: "10", unit: "XP", title: "Academy starter booster", cost: "100 XP", tag: "学院", type: "加速器", product: "学院", locked: false },
      { amount: "60", unit: "Points", title: "Fee rebate voucher", cost: "400 XP", tag: "模拟", type: "代金券", product: "模拟", locked: false },
      { amount: "1", unit: "Ticket", title: "Demo challenge ticket", cost: "200 XP", tag: "模拟", type: "通行证", product: "模拟", locked: false },
      { amount: "2x", unit: "XP", title: "XP booster pack", cost: "500 XP", tag: "学院", type: "加速器", product: "学院", locked: false },
      { amount: "60", unit: "Points", title: "跟单学习 pack", cost: "400 XP", tag: "复制", type: "礼包", product: "复制", locked: false },
      { amount: "10", unit: "USDT", title: "Event reward pass", cost: "1,000 XP", tag: "活动", type: "通行证", product: "活动", locked: true },
      { amount: "1", unit: "徽章", title: "社区 badge pack", cost: "200 XP", tag: "社区", type: "徽章", product: "社区", locked: false },
      { amount: "?", unit: "Mystery", title: "Mystery reward box", cost: "800 XP", tag: "活动", type: "礼包", product: "活动", locked: true }
    ];
    const mallIcons = {
      Academy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
      Demo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 9 11l4 4 8-8"/><path d="M21 7v5h-5"/></svg>',
      Copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
      Event: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/></svg>',
      社区: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/></svg>'
    };
    const mallGlow = {
      Academy:  { glow: "rgba(247,147,26,.30)",  ink: "#f7931a" },
      Demo:     { glow: "rgba(47,212,122,.26)",  ink: "#2fd47a" },
      Copy:     { glow: "rgba(139,108,240,.28)", ink: "#8b6cf0" },
      Event:    { glow: "rgba(255,92,138,.26)",  ink: "#ff5c8a" },
      社区:     { glow: "rgba(56,189,248,.26)",  ink: "#38bdf8" }
    };

    // 徽章 state: worn=佩戴中 unlocked=可佩戴 claim=待领取 locked=未解锁
    const badges = [
      { id: "starter",   name: "新手启程", cond: "完善个人资料", state: "worn", icon: "rocket" },
      { id: "community", name: "社区之星", cond: "加入 Cui 官方社区", state: "unlocked", icon: "shield" },
      { id: "academy",   name: "学院首课", cond: "完成第一节新手课程", state: "unlocked", icon: "book" },
      { id: "demo",      name: "模拟首单", cond: "完成一笔模拟交易", state: "claim", icon: "chart" },
      { id: "risk",      name: "风险守卫", cond: "完成风险意识检查", state: "locked", icon: "alert" },
      { id: "copy",      name: "跟单探索者", cond: "打开交易员主页", state: "locked", icon: "copy" },
      { id: "invite",    name: "邀请先锋", cond: "邀请 3 位好友（2/3）", state: "locked", icon: "users" },
      { id: "event",     name: "活动常客", cond: "报名参加一次活动", state: "locked", icon: "calendar" }
    ];
    const badgeIcons = {
      rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 9 11l4 4 8-8"/><path d="M21 7v5h-5"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><path d="M12 17.2v.01"/></svg>',
      copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>'
    };

    const couponGrid = document.getElementById("redeem-grid");
    const mallGrid = document.getElementById("mall-grid");
    const badgeGrid = document.getElementById("badge-grid");
    const productFilter = document.getElementById("product-filter");
    const typeFilter = document.getElementById("type-filter");
    const cupBadge = document.getElementById("cup-badge");

    function usable(c) { return c.status === 30 || c.status === 20; }

    function renderCoupons() {
      const cat = productFilter.value;
      const filtered = coupons.filter((c) => cat === "全部" || c.category === cat);
      couponGrid.innerHTML = filtered.length ? filtered.map((c) => {
        const canUse = usable(c);
        const isCashback = c.couponType === 2;
        const pct = isCashback ? Math.round((c.usedAmount / c.totalAmount) * 100) : 0;
        const ink = isCashback ? "#2fd47a" : "#f7931a";
        const glow = isCashback ? "rgba(47,212,122,.24)" : "rgba(247,147,26,.24)";
        const mid = isCashback
          ? '<div class="rc-progress" role="progressbar" aria-label="已解锁 ' + c.usedAmount + '/' + c.totalAmount + ' ' + c.currency + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="bar"><i style="width:' + pct + '%"></i></div><p>已解锁 ' + c.usedAmount + '/' + c.totalAmount + ' ' + c.currency + '</p></div>'
          : '<p>' + c.expire + '</p>';
        const action = c.couponType === 1 ? "使用" : "去交易";
        return `
          <article class="redeem-card" style="--rc-glow:${glow};--rc-ink:${ink}">
            <div class="rc-wm">${ticketIcon}</div>
            <div class="rc-top">
              <span class="rc-chip"><i></i>${couponTypeLabel[c.couponType] || "优惠券"}</span>
              <span class="rc-ic">${ticketIcon}</span>
            </div>
            <div class="rc-amount"><b>${c.amount}</b><span>${c.currency}</span></div>
            <h3>${c.name}</h3>
            ${mid}
            <button class="btn ${canUse ? "primary" : "ghost"} coupon-btn" type="button" data-id="${c.id}" data-kind="${c.couponType === 1 ? "use" : "trade"}"${canUse ? "" : " disabled"}>${canUse ? action : "已使用"}</button>
          </article>
        `;
      }).join("") : '<div class="empty-state">暂无可用优惠券</div>';
      document.getElementById("wt-coupon-count").textContent = coupons.length;
    }

    function renderMall() {
      const filtered = mallRewards;
      mallGrid.innerHTML = filtered.length ? filtered.map((item) => {
        const c = mallGlow[item.product] || mallGlow.Event;
        return `
          <article class="redeem-card ${item.locked ? "locked" : ""}" style="--rc-glow:${c.glow};--rc-ink:${c.ink}">
            <div class="rc-wm">${mallIcons[item.product] || mallIcons.Event}</div>
            <div class="rc-top">
              <span class="rc-chip"><i></i>${item.tag}</span>
              <span class="rc-ic">${mallIcons[item.product] || mallIcons.Event}</span>
            </div>
            <div class="rc-amount"><b>${item.amount}</b><span>${item.unit}</span></div>
            <h3>${item.title}</h3>
            <p>${item.cost} · ${item.type}</p>
            <button class="btn ${item.locked ? "ghost" : "primary"} mall-btn" type="button" data-title="${item.title}" data-cost="${item.cost}"${item.locked ? " disabled" : ""}>${item.locked ? "Coming soon" : "兑换"}</button>
          </article>
        `;
      }).join("") : '<div class="empty-state">没有符合筛选条件的商品</div>';
      document.getElementById("wt-mall-count").textContent = mallRewards.length;
    }

    function renderBadges() {
      badgeGrid.innerHTML = badges.map((b) => {
        const worn = b.state === "worn";
        const locked = b.state === "locked";
        const state = worn
          ? '<span class="badge-state worn">取消佩戴</span>'
          : locked
          ? '<span class="badge-state locked">未解锁</span>'
          : b.state === "claim"
          ? '<span class="badge-state claim">领取</span>'
          : '<span class="badge-state wear-now">立即佩戴</span>';
        const icon = badgeIcons[b.icon] || badgeIcons.shield;
        return `
          <article class="badge-card ${locked ? "locked" : ""}${worn ? " is-worn" : ""}" data-id="${b.id}" role="button" tabindex="${locked ? "-1" : "0"}" aria-label="${b.name}${locked ? "，未解锁" : worn ? "，佩戴中，点击取消佩戴" : ""}">
            <div class="badge-medal">${icon}</div>
            <h3>${b.name}</h3>
            <p class="badge-cond">${locked ? "解锁条件：" + b.cond : b.cond}</p>
            ${state}
          </article>
        `;
      }).join("") + '<div class="badge-more">更多徽章即将推出...</div>';
      // 已领取计数（含佩戴中，不含待领取）+ 佩戴展示位（模块右上角 & 浮动 XP 杯）
      const badgeCountEl = document.getElementById("wt-badge-count");
      if (badgeCountEl) badgeCountEl.textContent = badges.filter((b) => b.state === "unlocked" || b.state === "worn").length + "/" + badges.length;
      const wornBadge = badges.find((b) => b.state === "worn");
      if (cupBadge) {
        cupBadge.classList.toggle("empty", !wornBadge);
        cupBadge.innerHTML = wornBadge ? (badgeIcons[wornBadge.icon] || "") : "";
        cupBadge.title = wornBadge ? "佩戴中：" + wornBadge.name : "";
      }
      const wornBox = document.getElementById("welfare-worn");
      if (wornBox) {
        wornBox.classList.toggle("empty", !wornBadge);
        wornBox.innerHTML = wornBadge
          ? '<span class="ww-medal">' + (badgeIcons[wornBadge.icon] || "") + '</span><span class="ww-txt"><small>佩戴中徽章</small><b>' + wornBadge.name + '</b></span><span class="ww-tip">' + wornBadge.name + '</span>'
          : "";
      }
    }

    productFilter.addEventListener("change", renderCoupons);
    typeFilter.addEventListener("change", renderCoupons);
    renderCoupons();
    renderMall();

    // 福利分区切换
    const welfareTabs = document.querySelectorAll(".welfare-tabs [data-welfare]");
    welfareTabs.forEach((btn) => btn.addEventListener("click", () => {
      welfareTabs.forEach((b) => b.classList.toggle("is-active", b === btn));
      document.querySelectorAll(".welfare-panel").forEach((p) => p.classList.toggle("is-active", p.id === "wp-" + btn.dataset.welfare));
    }));

    // 优惠券交互
    couponGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".coupon-btn");
      if (!btn || btn.disabled) return;
      if (btn.dataset.kind === "trade") { toast("跳转交易页（预览演示）"); return; }
      const c = coupons.find((x) => x.id === Number(btn.dataset.id));
      if (c) openCouponDialog(c);
    });

    // 商城交互
    mallGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".mall-btn");
      if (!btn || btn.disabled) return;
      toast("已兑换「" + btn.dataset.title + "」· 消耗 " + btn.dataset.cost + "（预览）");
    });

    // 徽章交互（领取 / 佩戴 / 取消佩戴，同一时间仅佩戴一枚）
    badgeGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".badge-card");
      if (!card || card.classList.contains("locked")) return;
      const badge = badges.find((b) => b.id === card.dataset.id);
      if (!badge) return;
      if (badge.state === "worn") {
        badge.state = "unlocked";
        renderBadges();
        toast("已取消佩戴");
      } else if (badge.state === "claim") {
        badge.state = "unlocked";
        renderBadges();
        openBadgeCelebrate(badge, "claim");
      } else {
        badges.forEach((b) => { if (b.state === "worn") b.state = "unlocked"; });
        badge.state = "worn";
        renderBadges();
        openBadgeCelebrate(badge, "wear");
      }
    });

    // 徽章绽放弹窗（佩戴/领取成功共用一套绽放动效，区别仅文案；取消佩戴走 toast）
    const bcDlg = document.getElementById("badge-celebrate-dialog");
    function openBadgeCelebrate(badge, mode) {
      const isWear = mode === "wear";
      document.getElementById("bc-dlg-title").textContent = isWear ? "佩戴成功" : "领取成功";
      bcDlg.querySelector(".dlg-desc").textContent = isWear
        ? "「" + badge.name + "」已佩戴，将展示在你的奖励身份位。"
        : "「" + badge.name + "」已领取，点击徽章卡片可立即佩戴。";
      document.getElementById("bc-medal").innerHTML = badgeIcons[badge.icon] || badgeIcons.shield;
      // 每次重建花瓣/星光节点：既是绽放动画的载体，也保证每次打开都重新播放
      let html = "";
      for (let i = 0; i < 12; i++) {
        const rad = ((360 / 12) * i + (isWear ? 0 : 15)) * Math.PI / 180;
        const dist = 76 + (i % 3) * 15;
        html += '<i class="petal" style="--tx:' + (Math.cos(rad) * dist).toFixed(1) + 'px;--ty:' + (Math.sin(rad) * dist).toFixed(1) + 'px;--r:' + (120 + i * 30) + 'deg;--s:' + (0.8 + (i % 3) * 0.15).toFixed(2) + ';--d:' + ((i % 4) * 60) + 'ms"></i>';
      }
      for (let i = 0; i < 6; i++) {
        const rad = ((360 / 6) * i + (isWear ? 26 : 8)) * Math.PI / 180;
        const dist = 58 + (i % 2) * 26;
        html += '<i class="spark" style="--tx:' + (Math.cos(rad) * dist).toFixed(1) + 'px;--ty:' + (Math.sin(rad) * dist).toFixed(1) + 'px;--r:0deg;--s:.9;--d:' + (120 + (i % 3) * 70) + 'ms"></i>';
      }
      document.getElementById("bc-petals").innerHTML = html;
      bcDlg.hidden = false;
    }
    bcDlg.addEventListener("click", (e) => {
      if (e.target === bcDlg || e.target.closest("[data-close]")) bcDlg.hidden = true;
    });

    // 使用确认弹窗（对应线上"确认→成功"两步；成功后从可用列表移除并刷新）
    const dlg = document.getElementById("coupon-dialog");
    function openCouponDialog(c) {
      dlg.querySelector(".dlg-title").textContent = "使用" + c.name + "？";
      dlg.querySelector(".dlg-desc").textContent = c.description + "，使用后将用于抵扣下一笔符合条件的亏损订单。";
      dlg.querySelector(".dlg-amount").innerHTML = '<b>' + c.amount + '</b><span style="font-size:12px;font-weight:800;color:#ffcf87">' + c.currency + '</span>';
      dlg.dataset.id = c.id;
      dlg.hidden = false;
    }
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) { dlg.hidden = true; return; }
      if (e.target.closest("[data-confirm]")) {
        const id = Number(dlg.dataset.id);
        const i = coupons.findIndex((x) => x.id === id);
        if (i >= 0) coupons.splice(i, 1);
        dlg.hidden = true;
        renderCoupons();
        toast("使用成功");
      }
    });

    // 全局 toast
    let toastTimer;
    function toast(msg) {
      let el = document.querySelector(".xp-toast");
      if (!el) { el = document.createElement("div"); el.className = "xp-toast"; document.body.appendChild(el); }
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
    }

    renderBadges();

(function () {
      // ---- Mission card click halo ----
      document.querySelectorAll('main .mission-card').forEach((card) => {
        card.addEventListener('click', () => {
          card.classList.remove('ring');
          void card.offsetWidth;   // restart animation
          card.classList.add('ring');
          setTimeout(() => card.classList.remove('ring'), 2600);
        });
      });

      // ---- Redeem card click halo (delegated — grid re-renders on filter) ----
      ['redeem-grid', 'mall-grid'].forEach((id) => {
        const gridEl = document.getElementById(id);
        if (!gridEl) return;
        gridEl.addEventListener('click', (e) => {
          const card = e.target.closest('.redeem-card');
          if (!card) return;
          card.classList.remove('ring');
          void card.offsetWidth;   // restart animation
          card.classList.add('ring');
          setTimeout(() => card.classList.remove('ring'), 2600);
        });
      });

      // ---- 签到状态机（对齐线上 /rewards：首次连续 3 天 → 断签先揭晓过渡、确认后进日常任务，7 天一轮） ----
      const firstCard = document.getElementById('first-check-card');
      const weeklyCard = document.getElementById('weekly-check-card');
      const firstTrack = document.getElementById('first-day-track');
      const weeklyTrack = document.getElementById('weekly-day-track');
      const firstBtn = document.getElementById('checkin-btn');
      const weeklyBtn = document.getElementById('weekly-checkin-btn');
      const firstHelp = document.getElementById('first-checkin-help');
      const firstTaskCopy = document.getElementById('first-task-copy');
      const bonusStatus = document.getElementById('bonus-status');
      const bonusCard = document.getElementById('bonus-card');
      const bonusKicker = document.querySelector('.bonus-kicker');
      const bonusAmount = document.getElementById('bonus-amount');
      const bonusUnit = document.getElementById('bonus-unit');
      const bonusCopy = document.getElementById('bonus-copy');
      if (!firstCard || !weeklyCard || !firstTrack || !weeklyTrack || !firstBtn || !weeklyBtn || !firstHelp || !firstTaskCopy || !bonusStatus || !bonusCard || !bonusKicker || !bonusAmount || !bonusUnit || !bonusCopy) return;

      const KEY = 'ginx_checkin_v2';
      const FIRST_DAYS = 3;
      const DAILY_REWARD = 5;
      const GIFT_XP = 200; // 新手大礼包额外 XP，达成时一次性计入余额
      // 问号说明讲清宽限规则与「账号终身 1 次」
      const HELP_PROGRESS = '新用户连续签到 3 天可领取新手礼包。可免费补签 1 次，逾期则礼包失效。新手期未使用，可保留至后续日常任务使用。';
      const dateStr = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
      const todayStr = () => dateStr(new Date());
      const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return dateStr(d); };
      const diffDays = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
      // 日常签到按 7 天一轮滚动（锚点 2026-01-05 为周一，即周一到周日一轮）：任意一天都落在某一轮的第 1-7 天
      const CYCLE_DAYS = 7;
      const CYCLE_EPOCH = '2026-01-05';
      const cycleStartOf = (s) => { const n = Math.floor(diffDays(CYCLE_EPOCH, s) / CYCLE_DAYS); return addDays(CYCLE_EPOCH, n * CYCLE_DAYS); };

      const normalize = (s) => {
        s = s && Array.isArray(s.checkins) ? s : { checkins: [], firstAnchor: null };
        if (typeof s.points !== 'number') s.points = 30;
        // 礼包 XP 是否已入账（达成只发一次，防重复累计）
        if (typeof s.giftGranted !== 'boolean') s.giftGranted = false;
        if (!s.dailyRewards || typeof s.dailyRewards !== 'object') s.dailyRewards = {};
        // 补签机会账号终身仅 1 次：新手期与日常任务共享同一个标记，用掉即永久失效
        s.makeupUsed = !!(s.makeupUsed || s.firstMakeupUsed);
        // 断签过期后的过渡揭晓是否已确认（点了「知道了」即 true，此后刷新直接进日常任务）
        if (typeof s.breakAcked !== 'boolean') s.breakAcked = false;
        delete s.makeupWeek;
        delete s.firstMakeupUsed;
        delete s.seenStatus;   // 旧断签过渡实现的遗留字段
        return s;
      };
      const load = () => {
        try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch (e) {}
        return normalize(null);
      };
      const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };

      let state = load();
      const today = todayStr();
      const has = (d) => state.checkins.includes(d);
      const isMissedDay = (d) => !!d && d !== today && !has(d) && diffDays(d, today) > 0 && diffDays(cycleStartOf(today), d) >= 0;
      // 本轮最近的漏签天：今日已签时主按钮补签态的自动目标
      const latestMissedDay = () => {
        const cs = cycleStartOf(today);
        for (let i = CYCLE_DAYS - 1; i >= 0; i--) {
          const d = addDays(cs, i);
          if (isMissedDay(d)) return d;
        }
        return null;
      };

      // XP 账户舱以柔和的高光跟随鼠标，强化层次但不改变任何业务动作。
      if (window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        bonusCard.addEventListener('pointermove', (event) => {
          const rect = bonusCard.getBoundingClientRect();
          bonusCard.style.setProperty('--xp-x', ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
          bonusCard.style.setProperty('--xp-y', ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
        });
        bonusCard.addEventListener('pointerleave', () => {
          bonusCard.style.removeProperty('--xp-x');
          bonusCard.style.removeProperty('--xp-y');
        });
      }

      // 新手任务状态由数据推导：0 进行中 / 1 已获得 / 2 已过期
      // 漏签次日为宽限日（要求 3 天，第 4 天进来还能补回第 3 天）；超过次日未补回才判终态（第 5 天起过期不可补）
      function firstStatus() {
        if (!state.firstAnchor) return 0;
        let done = 0;
        for (let i = 0; i < FIRST_DAYS; i++) {
          const d = addDays(state.firstAnchor, i);
          if (has(d)) { done++; continue; }
          const past = diffDays(d, today);
          if (past > 1) return 2;                            // 漏签超过次日 → 断签终态
          if (past === 1 && state.makeupUsed) return 2;   // 宽限日但补签机会已用 → 终态
        }
        return done >= FIRST_DAYS ? 1 : 0;
      }
      const inFirstWindow = (d) => !!state.firstAnchor && diffDays(state.firstAnchor, d) >= 0 && diffDays(state.firstAnchor, d) < FIRST_DAYS;
      // 宽限日内待补回的漏签天（进行中同一时刻至多一天处于此态；补签机会账号仅 1 次，用过即无）
      const graceDay = () => {
        if (!state.firstAnchor || state.makeupUsed) return null;
        for (let i = 0; i < FIRST_DAYS; i++) {
          const d = addDays(state.firstAnchor, i);
          if (!has(d) && diffDays(d, today) === 1) return d;
        }
        return null;
      };

      function makeCell(label, mark, cls) {
        const cell = document.createElement('div');
        cell.className = 'day-cell ' + cls;
        if (cls === 'locked') cell.setAttribute('aria-disabled', 'true');
        if (cls === 'today') cell.setAttribute('aria-current', 'date');
        const l = document.createElement('div'); l.className = 'd-label'; l.textContent = label;
        const m = document.createElement('div'); m.className = 'd-mark'; m.textContent = mark;
        cell.append(l, m);
        return cell;
      }

      function ring(cell) {
        if (!cell) return;
        cell.animate(
          [{ boxShadow: '0 0 0 0 rgba(255,209,102,.6)' }, { boxShadow: '0 0 0 16px rgba(255,209,102,0)' }],
          { duration: 700, easing: 'ease-out' }
        );
      }

      // 签到成功的弹簧 pop（新变 ✓ 的圆标过冲回弹），与光环叠加构成"奖励时刻"
      function pop(cell) {
        const m = cell && cell.querySelector('.d-mark');
        if (!m) return;
        m.classList.remove('is-pop');
        void m.offsetWidth;   // restart animation
        m.classList.add('is-pop');
        setTimeout(() => m.classList.remove('is-pop'), 600);
      }

      function renderFirst() {
        firstTrack.innerHTML = '';
        firstTaskCopy.textContent = '别让礼包过期，漏签次日补回';
        const g = graceDay();
        for (let i = 0; i < FIRST_DAYS; i++) {
          const d = state.firstAnchor ? addDays(state.firstAnchor, i) : (i === 0 ? today : null);
          const checked = !!d && has(d);
          const isToday = firstStatus() === 0 && d === today;
          const missed = !!d && d === g; // 宽限日漏签：格子边框保持实线，格内「补签」两字为虚线小按钮，点击即补回该天
          const cell = makeCell('第 ' + (i + 1) + ' 天', checked || isToday ? '✓' : missed ? '补签' : String(i + 1), checked ? 'done' : isToday ? 'today' : missed ? 'can-makeup' : 'locked');
          cell.dataset.day = d || '';
          if (missed) {
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', '补签第 ' + (i + 1) + ' 天');
          }
          firstTrack.append(cell);
        }
      }

      // 断签揭晓态（第 5 天进来首次看到）：布局与第 4 天一致，左侧礼包卡压暗标「已过期」，右侧回顾 3 天窗口（漏签天 ✕）
      function renderBreakReveal() {
        firstTrack.innerHTML = '';
        firstTaskCopy.textContent = '连续签到中断，新手大礼包已过期。';
        for (let i = 0; i < FIRST_DAYS; i++) {
          const d = state.firstAnchor ? addDays(state.firstAnchor, i) : null;
          const checked = !!d && has(d);
          firstTrack.append(makeCell('第 ' + (i + 1) + ' 天', checked ? '✓' : '✕', checked ? 'done' : 'missed'));
        }
        firstBtn.classList.remove('is-makeup', 'is-done');
        firstBtn.textContent = '知道了，我继续赚积分';
      }

      function renderWeekly() {
        weeklyTrack.innerHTML = '';
        const cs = cycleStartOf(today);
        const makeupOk = !state.makeupUsed; // 账号终身 1 次，新手期用过这里也一样没有
        for (let i = 0; i < CYCLE_DAYS; i++) {
          const d = addDays(cs, i);
          const checked = has(d);
          const isToday = d === today;
          const past = diffDays(d, today) > 0;
          const makeup = past && !checked && makeupOk; // 可补签的漏签天：格子边框保持实线，格内「补签」两字为虚线小按钮，点击即补回
          // 不可补签的漏签天沿用 ✕ 揭晓态；未来天保持锁定位
          const cell = makeCell('第 ' + (i + 1) + ' 天', checked || isToday ? '✓' : makeup ? '补签' : past ? '✕' : String(i + 1), checked ? 'done' : isToday ? 'today' : makeup ? 'can-makeup' : past ? 'missed' : 'locked');
          cell.dataset.day = d;
          if (makeup) {
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', '补签第 ' + (i + 1) + ' 天');
          }
          weeklyTrack.append(cell);
        }
      }

      // 主按钮单按钮多状态：默认「签到/已签到」；今日已签但本轮还有漏签可补时切「免费补签」（漏签天格子上点击则直接补回）
      function updateWeeklyCta() {
        const auto = has(today) ? latestMissedDay() : null;   // 今日已签 → 按钮默认即补签态（目标为最近漏签天）
        const target = !state.makeupUsed && auto;
        if (target) {
          weeklyBtn.querySelector('.cta-text').textContent = '免费补签 · 补回第 ' + (diffDays(cycleStartOf(today), target) + 1) + ' 天';
          weeklyBtn.classList.add('is-makeup');
          weeklyBtn.classList.remove('is-done');
        } else {
          weeklyBtn.classList.remove('is-makeup');
          weeklyBtn.classList.toggle('is-done', has(today));
          // 今日未签永远是「签到」（主行动不受补签状态影响）；签完即「已签到」，不再挂「机会已用完」说明
          weeklyBtn.querySelector('.cta-text').textContent = has(today) ? '已签到' : '签到';
        }
      }

      // 首签主按钮两种形态：默认「签到/已签到」；宽限日内窗口已走完（第 4 天）切「补签」；窗口内直接点漏签天格子补回
      function updateFirstCta() {
        const g = graceDay();
        const todayIn = inFirstWindow(today);
        if (g && !todayIn) {
          firstBtn.textContent = '免费补签 · 补回第 ' + (diffDays(state.firstAnchor, g) + 1) + ' 天';
          firstBtn.classList.add('is-makeup');
          firstBtn.classList.remove('is-done');
        } else {
          firstBtn.classList.remove('is-makeup');
          firstBtn.classList.toggle('is-done', has(today));
          firstBtn.textContent = has(today) ? '已签到' : '签到';
        }
      }

      const boardTitle = document.getElementById('board-title');
      function render() {
        const st = firstStatus();
        const breakReveal = st === 2 && !state.breakAcked; // 断签过期且尚未确认 → 先停在揭晓过渡
        firstHelp.textContent = HELP_PROGRESS;
        firstCard.hidden = !(st === 0 || breakReveal);
        weeklyCard.hidden = st === 0 || breakReveal;
        if (st === 0) {
          renderFirst();
          updateFirstCta();
        } else if (breakReveal) {
          renderBreakReveal();
        } else {
          renderWeekly();
          updateWeeklyCta();
        }
        // 活动态（进行中）展示新手礼包；断签揭晓保持礼包卡但压暗标过期；日常态（领完/过期确认后）展示账户 XP 总余额
        bonusCard.classList.remove('is-acquired', 'is-expired', 'is-balance');
        if (st === 0) {
          boardTitle.textContent = '新手礼包';
          bonusStatus.hidden = false;
          bonusStatus.dataset.state = 'pending';
          bonusStatus.textContent = '进行中';
          bonusKicker.textContent = 'GINX · XP';
          bonusAmount.textContent = '200';
          bonusUnit.textContent = '额外 XP';
          bonusUnit.hidden = false;
          bonusCopy.hidden = false;
          bonusCopy.textContent = '首次连续签到 3 天即可领取的入门奖励礼包。';
        } else if (breakReveal) {
          boardTitle.textContent = '新手礼包';
          bonusCard.classList.add('is-expired');
          bonusStatus.hidden = false;
          bonusStatus.dataset.state = 'expired';
          bonusStatus.textContent = '已过期';
          bonusKicker.textContent = 'GINX · XP';
          bonusAmount.textContent = '200';
          bonusUnit.textContent = '额外 XP';
          bonusUnit.hidden = false;
          bonusCopy.hidden = false;
          bonusCopy.textContent = '首次连续签到 3 天即可领取的入门奖励礼包，断签即过期。';
        } else {
          // 日常态换一套外观：标题切「日常任务」，余额卡中性配色，与礼包活动态区分
          boardTitle.textContent = '日常任务';
          bonusCard.classList.add('is-balance');
          bonusStatus.hidden = false;
          bonusStatus.dataset.state = 'daily';
          bonusStatus.textContent = '每日签到奖励';
          bonusKicker.textContent = 'GINX · XP';
          bonusAmount.textContent = state.points;
          bonusUnit.textContent = '我的 XP 余额';
          bonusUnit.hidden = false;
          bonusCopy.hidden = false;
          bonusCopy.textContent = '日常签到即可累积 XP，可用于参加交易排行榜比赛等活动。';
        }
      }

      firstBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // 断签揭晓态的「知道了，我继续赚积分」：确认过期 → 进入日常任务
        if (firstStatus() === 2 && !state.breakAcked) {
          state.breakAcked = true;
          save(state);
          render();
          return;
        }
        if (firstStatus() !== 0) return;
        const g = graceDay();
        // 宽限补签形态：窗口已走完（第 4 天）主按钮即补签入口；窗口内点漏签天格子补回
        if (g && !inFirstWindow(today)) {
          doFirstMakeup(g);
          return;
        }
        if (has(today)) return;
        if (!state.firstAnchor) state.firstAnchor = today;
        state.checkins.push(today);
        const granted = grantGift(); // 正常路径凑满 3 天同样发放礼包 XP，与补签达成保持一致
        save(state);
        render();
        const fc = firstTrack.children[diffDays(state.firstAnchor, today)];
        ring(fc); pop(fc);
        if (granted) openGiftCelebrate(); // 第 3 天签满即达成礼包：弹出恭喜动画
      });

      // ---- 日常补签：点「补签」格子直接补回该天，主按钮不随悬停/点选变字 ----
      weeklyTrack.addEventListener('click', (e) => {
        const cell = e.target.closest('.day-cell.can-makeup');
        if (cell) doMakeup(cell.dataset.day);
      });
      weeklyTrack.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const cell = e.target.closest('.day-cell.can-makeup');
        if (!cell) return;
        e.preventDefault();
        doMakeup(cell.dataset.day);
      });

      // ---- 首签宽限补签：点「补签」格子直接补回该天，与日常补签同一套交互语言 ----
      firstTrack.addEventListener('click', (e) => {
        const cell = e.target.closest('.day-cell.can-makeup');
        if (cell) doFirstMakeup(cell.dataset.day);
      });
      firstTrack.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const cell = e.target.closest('.day-cell.can-makeup');
        if (!cell) return;
        e.preventDefault();
        doFirstMakeup(cell.dataset.day);
      });

      // 新手礼包达成即发放 200 额外 XP：giftGranted 保证只入账一次，正常签满与补签挽回两条路径共用
      function grantGift() {
        if (state.giftGranted || firstStatus() !== 1) return false;
        state.giftGranted = true;
        state.points += GIFT_XP;
        return true;
      }

      // 礼包达成恭喜动画：正常签满 3 天与第 4 天宽限补签凑满共用同一弹窗（大礼包绽放舞台）
      const giftDlg = document.getElementById('gift-celebrate-dialog');
      function openGiftCelebrate() {
        if (!giftDlg) return;
        // 每次重建花瓣/星光节点，保证每次达成都重新播放绽放
        let html = '';
        for (let i = 0; i < 12; i++) {
          const rad = ((360 / 12) * i + 15) * Math.PI / 180;
          const dist = 76 + (i % 3) * 15;
          html += '<i class="petal" style="--tx:' + (Math.cos(rad) * dist).toFixed(1) + 'px;--ty:' + (Math.sin(rad) * dist).toFixed(1) + 'px;--r:' + (120 + i * 30) + 'deg;--s:' + (0.8 + (i % 3) * 0.15).toFixed(2) + ';--d:' + ((i % 4) * 60) + 'ms"></i>';
        }
        for (let i = 0; i < 6; i++) {
          const rad = ((360 / 6) * i + 8) * Math.PI / 180;
          const dist = 58 + (i % 2) * 26;
          html += '<i class="spark" style="--tx:' + (Math.cos(rad) * dist).toFixed(1) + 'px;--ty:' + (Math.sin(rad) * dist).toFixed(1) + 'px;--r:0deg;--s:.9;--d:' + (120 + (i % 3) * 70) + 'ms"></i>';
        }
        document.getElementById('gc-petals').innerHTML = html;
        giftDlg.hidden = false;
      }
      if (giftDlg) {
        giftDlg.addEventListener('click', (e) => {
          if (e.target === giftDlg || e.target.closest('[data-close]')) giftDlg.hidden = true;
        });
      }

      // 新手期免费补签：与日常任务共享账号终身仅 1 次的机会，这里用掉，日常阶段就再无补签
      function doFirstMakeup(d) {
        if (d !== graceDay()) return false;
        state.checkins.push(d);
        state.makeupUsed = true;
        const completed = firstStatus() === 1; // 补回即凑满 3 天 → 当场达成礼包
        grantGift();
        save(state);
        render();
        const fc = firstTrack.children[diffDays(state.firstAnchor, d)];
        ring(fc); pop(fc);
        if (completed) openGiftCelebrate(); // 补签当场凑满 3 天：与正常签满一样弹出礼包恭喜动画
        return true;
      }

      // 补签执行（免费，账号终身仅 1 次）。入口：点「补签」格子；或今日已签时主按钮自动补最近一个漏签天
      function doMakeup(target) {
        const cs = cycleStartOf(today);
        if (!isMissedDay(target)) return false;
        if (state.makeupUsed) return false;
        state.checkins.push(target);
        state.makeupUsed = true;
        save(state);
        render();
        const mc = weeklyTrack.children[diffDays(cs, target)];
        ring(mc); pop(mc);
        return true;
      }

      weeklyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (firstStatus() === 0) return;
        if (has(today)) {
          // 今日已签且本轮还有漏签：主按钮即补签入口，自动补最近一个漏签天
          const t = latestMissedDay();
          if (t && doMakeup(t)) return;
          return;
        }
        state.checkins.push(today);
        state.points += DAILY_REWARD; // 日常签到奖励，计入账户总余额
        state.dailyRewards[today] = DAILY_REWARD;
        save(state);
        render();
        const wc = weeklyTrack.children[diffDays(cycleStartOf(today), today)];
        ring(wc); pop(wc);
      });

      // ---- Demo 状态模拟（仅预览演示用；面板在本文档之后渲染，故用 document 委托） ----
      document.addEventListener('click', (e) => {
        const b = e.target.closest('#demo-sim button[data-sim]');
        if (!b) return;
        if (b.dataset.sim === 'reset') {
          state = normalize({ checkins: [], firstAnchor: null });
          save(state);
          render();
        } else if (b.dataset.sim === 'grace') {
          // 第 4 天进来：第 1-2 天已签、第 3 天漏签 → 宽限日，还能免费补回第 3 天
          const a = addDays(today, -3);
          state = normalize({ checkins: [a, addDays(today, -2)], firstAnchor: a });
          save(state);
          render();
        } else if (b.dataset.sim === 'terminal') {
          // 第 5 天进来：第 1-2 天已签、第 3 天漏签已超次日 → 断签揭晓过渡（确认后才进日常任务）
          const a = addDays(today, -4);
          state = normalize({ checkins: [a, addDays(today, -3)], firstAnchor: a });
          save(state);
          render();
        } else if (b.dataset.sim === 'daily') {
          // 日常任务：新手期已领完，展示 7 天一轮的日常签到（本轮今天未签）
          const cs = cycleStartOf(today);
          const a = addDays(cs, -7);
          const idx = diffDays(cs, today);
          const checkins = Array.from({ length: FIRST_DAYS }, (_, i) => addDays(a, i));
          for (let i = 0; i < idx; i++) checkins.push(addDays(cs, i));
          state = normalize({ checkins, firstAnchor: a, giftGranted: true });
          save(state);
          render();
        } else if (b.dataset.sim === 'misseday') {
            // 首轮已完 + 本轮恰好漏签一天且今天未签 → 演示漏签天格子显示「补签」、点击直接补回
            const cs = cycleStartOf(today);
            const a = addDays(cs, -17);
            const idx = diffDays(cs, today);
            const missIdx = idx >= 2 ? 1 : 0; // 本轮已过 ≥2 天漏第 2 天，只过去第 1 天则漏第 1 天
            const checkins = Array.from({ length: FIRST_DAYS }, (_, i) => addDays(a, i));
            for (let i = 0; i < idx; i++) if (i !== missIdx) checkins.push(addDays(cs, i));
            state = normalize({ checkins, firstAnchor: a });
            save(state);
            render();
          } else if (b.dataset.sim === 'usedmakeup') {
            // 老用户且唯一的免费补签已（如新手期）用掉 → 本轮漏签天不可点选，主按钮保持「签到/已签到」单按钮形态
            const cs = cycleStartOf(today);
            const a = addDays(cs, -17);
            const idx = diffDays(cs, today);
            const missIdx = idx >= 2 ? 1 : 0;
            const checkins = Array.from({ length: FIRST_DAYS }, (_, i) => addDays(a, i));
            for (let i = 0; i < idx; i++) if (i !== missIdx) checkins.push(addDays(cs, i));
            state = normalize({ checkins, firstAnchor: a, makeupUsed: true });
            save(state);
            render();
        }
      });

      render();
    })();

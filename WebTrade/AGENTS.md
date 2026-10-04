# AGENTS.md

GinX 官网静态站（WebTrade）：**根目录 13 个页面 = 12 个自解压离线包 + 1 个拆分页 `rewards.html`（奖励中心）**（2026-10-04 删除 404 页、account-offline 页、article-gold-xauusd-demo-offline 页）。与同级目录的 `IB_console`（合伙控制台）、`IB_admin`（管理后台）同在一个 git 仓库（仓库根在上一级 `amyZ_project/`）。

本地预览：`python3 -m http.server 8643 --bind 0.0.0.0` → http://127.0.0.1:8643/index.html。不使用 Node、npm、打包器。**必须 http 访问**：i18n 的 fetch 不支持 file://，直接双击 html 能看页面但语言切换不工作。

局域网分享（同 IB_admin 的 http://172.1.1.8:8080/ 用法）：本机 IP 为 172.1.1.8，分享链接 **http://172.1.1.8:8643/**。服务由 pm2 托管：名称 `WebTrade`，命令 `/usr/bin/python3 -m http.server 8643 --bind 0.0.0.0`，工作目录即本项目，与 IB_admin/IB_console 同列在 `pm2 status`；pm2 位于 nvm node v24.20.0（`~/.nvm/versions/node/v24.20.0/bin/pm2`）。已执行 `pm2 save`，但本机未配置 pm2 开机自启（无 LaunchAgent），Mac 重启后需手动 `pm2 resurrect`。

## 现行结构（2026-09-24 重构后）

```text
WebTrade/
|-- 13 个页面 html          # 见下表：12 个离线包 + rewards.html
|-- css/  (9 个)            # 只有 rewards.html 引用
|   |-- base.css            # 基础变量与站点底样式
|   |-- site.css            # 主站通用样式（导航/页脚等，最大的一块）
|   |-- subpage-theme.css   # 子页橙黑主题覆写
|   |-- nav-sync.css        # 导航与首页对齐（mega-menu 中性化）
|   |-- fonts.css           # Manrope @font-face（woff2 为抓包残留 GUID，本地 404 → 回退 Inter/Helvetica）
|   |-- rewards.css         # ★ 奖励页主样式（hero/任务卡/福利中心/徽章墙/弹窗）
|   `-- footer-colors.css / footer-social.css / fsc-footer.css
|-- js/  (8 个)             # rewards.html 用 7 个 + i18n.js 全站共用
|   |-- rewards-page.js     # ★ 主 tab 切换 + 福利中心（优惠券/积分商城/徽章 三子面板、计数、佩戴、使用弹窗、toast）
|   |-- checkin-points.js   # ★ 积分记录逻辑：任务卡光环、每周签到、积分余额、补签（消耗 10 积分）、新手礼包状态机
|   |-- i18n.js             # 全站共用多语言引擎（见下文 i18n 体系）
|   `-- reveal-motion.js / hero-confetti.js / nav-height.js / footer-social-dd.js / footer-risk.js
|-- assets/  (23 个, 15MB)  # rewards.html 的图片 + 离线包外链的页面级资源（three.min.js / site-motion.js / orange-black-subpages.css / ginfx 系列图等）
|-- i18n/                   # en/ zh/ 词条，文件名与现存页面对应（详见下文 i18n 体系）
`-- GIT.md
```

★ = 积分记录逻辑与福利内容所在文件，改这两处需求时动 `rewards.css` / `rewards-page.js` / `checkin-points.js`。

### 13 个页面

| 页面 | 类型 | 说明 |
| --- | --- | --- |
| index.html | 离线包（31MB） | 官网首页（英文为主） |
| rewards.html | 拆分页（47KB，中文） | 奖励中心，样式/逻辑在 css/ js/ 直改 |
| academy / articles | 离线包 | 学院、文章列表 |
| activities / activity-detail / competition-offline | 离线包 | 活动列表、活动详情、比赛 |
| login | 离线包 | 登录 |
| invite-friends-new / refer-friends / refer-IB-friends-standalone / refer-IB-friends-standalone-ginx-style | 离线包 | 邀请与推荐（后三个未登录只显示 Login 界面） |
| partner-ib-new-offline | 离线包 | IB 合伙页 |

## 两类页面，两种改法（口径）

- **离线包页面（12 个）**：单文件自解压（`<script type="__bundler/manifest">` 内嵌 uuid→base64 资源表，运行时整体替换 documentElement），资源基本内嵌，不依赖本地 css/。**不要手工拆改包体**；改文案走 `i18n/<lang>/<page>.json`；要改结构/样式 = 重新导出整包后整个替换 html 文件，并重做 i18n 双处插入（见下文）。
- **rewards.html（拆分页）**：与 IB_admin 同款组织方式——html 只是骨架，样式在 `css/`、逻辑在 `js/`、图片在 `assets/`，直接改文件。

## 奖励中心（rewards.html）两处需求的落点

- **专属奖励 tab**（`#exclusive-panel`）：新用户任务/进阶任务面板 + 每周签到板（本周 XP、我的积分、补签·消耗 10 积分、签到按钮状态机）+ 新手礼包卡 → **积分的记录逻辑**在 `js/checkin-points.js`。
- **福利 tab**（`#redeem-panel`，data-tab="redeem"）：福利中心三子标签——我的优惠券（数据模型同线上 `api/coupon/my`：couponType 1 亏损代金券/2 返现/3 手续减免，status 30 可用/20 未激活，卡片「使用」开确认弹窗）｜积分商城（8 件 XP 商品）｜徽章（解锁/领取/佩戴，同一时间仅佩戴一枚，佩戴位在模块右上角和浮动 XP 杯）→ 逻辑在 `js/rewards-page.js`。（与线上的差异对照原 `线上抓取-兑换/兑换逻辑-同线上-2026-09-16.md`，该文件已删，需要时从 git 历史取回。）

## 约定

- 改 css/js 后**必须同步 bump `rewards.html` 里对应 `?v=`**（rewards.css 当前 `20260923p`），否则浏览器缓存会跑旧代码。
- 数据（优惠券/商城/徽章/任务）都是 `rewards-page.js` / `checkin-points.js` 里的内存 mock，无接口。
- 无自动化测试（本机无 node，语法检查可用 `osascript -l JavaScript` 的 `new Function(code)`）。改 rewards 后浏览器过一遍：控制台无报错；两个主 tab 与三个福利子标签切换；签到/补签/佩戴/使用弹窗各走一遍；EN|中文 切换正常。
- python http.server 无缓存头，改完 HTML/JSON 后浏览器要硬刷新（Cmd+Shift+R）或地址加 `?cb=随机数`。
- **推送节奏（2026-10-04 定）**：小步文案/样式调整只改本地文件并同步 bump 版本号，**不要逐次提交推送**；等用户明确说「提交 / 推送 / 同步」时才批量执行（推送前照常按「Git 历史滚动清理」一节检查版本数）。

## 离线包页面的已知行为（沿用原包，非缺陷）

- refer-friends / refer-IB-* 未登录只渲染 Login 界面（mock 登录到验证码一步是死胡同）。
- 原包缺页的死链**不要凭空造页去补**：`trading-audcad.html`（约 30 处 Start Trading CTA 指向）；7 篇文章 article-copy-trading-review / article-forex-cfd-leverage / article-live-market-room-education / article-live-order-checklist / article-telegram-web-platform / article-wallet-safety-checks / article-xp-missions-learning。

## 历史与恢复（2026-09-24 重构记录）

- 本项目曾为「单一入口 index.html（奖励中心拆分页）+ 根目录只读参考文件 + `v3/` 全站拆分子站」结构，2026-09-24 重构为现行 16 页平铺：`v3/`、`第三版/`、`线上抓取-兑换/`、`rewards-zh-cn*.html` 等全部移除；奖励中心入口改为 `rewards.html`，index.html 替换为官网首页离线包。
- 同日清理零引用文件 185 个（assets 195→23、css 17→9、js 12→8，另删 `.bak`）。
- 历史旧提交号（`5e307ef` / `e4e3871` / `09d3eb1` 等）自 2026-10-04 滚动清理后已全部失效，旧版离线包无法再按提交号找回；清理前的完整历史仅存于备份 `~/.git-backups/OfficeMe-full-backup-20261004.bundle`。

## Git 历史滚动清理（2026-10-04 起，固定策略）

- 离线包页面单文件 5–30MB，任何 `?v=` bump 提交都会整包重存。为控体积，**git 历史只保留最近 3 个版本状态**：基线快照提交 + 最近 2 个真实提交；第 4 个版本出现即自动清掉最旧的。
- 清理动作：以 `HEAD~2` 的 tree 用 `git commit-tree` 重建根提交并重放最近 2 个提交（内容零变化，校验 `git diff` 为空），先 `git push --force-with-lease` 成功，再 `git reflog expire --expire=now --all && git gc --prune=now`。执行前提：工作区干净、本地与远端同步、先打 bundle 备份到 `~/.git-backups/`。
- **代价**：重放后提交作者/时间丢失、提交号变化；基线之前的任何历史内容不可找回。
- **其他机器同步**（清理后 pull 会分叉）：确认无本地未推送改动后执行 `git fetch origin && git reset --hard origin/project`。
- **Gitee 侧**：强推后服务端旧对象不自动释放，需到 Gitee 仓库 Settings → Git GC 手动触发，否则配额占用不降。
- 触发时机（2026-10-04 定）：**不做定时自动检查**。每次会话里执行 git 推送（git-sync）时顺带检查：若 `git rev-list --count <基线>..HEAD -- 'WebTrade/*.html'` ≥ 3（即离线包页面将出现第 4 个版本），先按上述动作滚动清理，再一并推送；未到条件则正常推送。

## i18n 多语言体系（2026-09-24 上线）

### 目录结构

```text
i18n/
|-- en/<page>.json   # 英文词条，文件名与 html 同名（index.json ↔ index.html）
`-- zh/<page>.json   # 中文词条
js/i18n.js           # fetch 动态切换引擎（唯一脚本，所有页面共用）
```

- **JSON 格式**：`{ "页面原文": "该语言译文" }` 平铺键值对。key = 页面当前渲染的原文（空白归一化），基础语言文件为恒等映射（可直接当翻译模板改）；另有 `__meta:description__` / `__meta:keywords__` 两个特殊键对应 meta 标签。
- **引擎机制**：`js/i18n.js` 按文件名自动定位词条 → fetch `i18n/<lang>/<page>.json` → 全量替换文本节点 / placeholder|title|alt|aria-label / meta / `<title>`，并把原文记在节点上支持无限次来回切换；MutationObserver 自动补翻后续 JS 注入的节点。语言选择存 `localStorage('ginx_i18n_lang')`，默认跟随页面基础语言（按正文 CJK 占比自动检测），左下角悬浮 EN|中文 切换钮。
- **离线包页面的插入位置**（重要）：解包器会用内嵌模板整体替换 documentElement，且部分页面脚本会清理 script 标签，因此每个包页面有**两处**引用——① 模板 `<head>` 开标签后（转义形态 `<script src=\"js/i18n.js?v=…\"><\u002Fscript>`，最先执行，ginx-style 用 `\u003C` 双转义风格）；② 外壳 `</body>` 前兜底。引擎带 `__ginxI18nLoaded` 守卫，双处插入不会重复初始化。
- **ginx-style 页面**：自带可用的 简中/EN 切换器，两处引用均带 `data-i18n-widget="off"` 隐藏我方浮钮，避免双切换器打架。

### 改动约定

- **改译文**：直接编辑 `i18n/<lang>/<page>.json` 即可——词条请求已强制 no-store，**无需 bump 任何 `?v=`**；仅当 `js/i18n.js` 引擎代码变化时，才 VER bump + 13 个 html 的 `?v=` 同步（当前 `20260924n`）。rewards.html 自己引用的 css/js 版本号仍按原约定各自 bump。**每次 bump 后同步更新本文档里记录的「当前版本号」。**
- **页面改了文案**：对应改 JSON 的 key（key 必须与新渲染 DOM 中的原文字符串完全一致，多余空白会被归一化）；新增语言 = 新建 `i18n/<lang>/` 目录放同名 JSON，并在 `js/i18n.js` 的 `SUPPORTED` 数组加代码。
- **必须 http 访问**（fetch 不支持 file://）：用 pm2 的 8643 服务预览。改完后硬刷新或加 `?cb=随机数`（见上文约定）。
- **已知限制**：refer-friends / refer-IB-* 未登录只渲染 Login 界面（mock 登录到验证码一步是死胡同），词条只覆盖登录屏文案；competition-offline 排行榜里的人名/XP 数字为中性词条不做翻译。
- 调试 API：控制台 `I18N.setLang('zh'|'en')`、`I18N.state`（含 error）、事件 `document.addEventListener('i18n:change', …)`。
- 验证（2026-09-24）：16 页 DOM 断言全过——双向切换、标题/正文/meta 同步、刷新持久化、还原无损、ginx-style 浮钮隐藏且自带切换正常、`I18N.state.error` 全空。

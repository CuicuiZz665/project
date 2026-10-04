# AGENTS.md — miniapp 项目引导说明

> 项目性质：**纯静态、零构建、单 HTML 文件**的 Mini App 原型（任务奖励转盘，`miniap reward.html`，约 3400 行）。
> 没有打包器、没有框架、没有 npm 依赖。所有"模块"都是 HTML 内的独立 `<script>` 块，通过 `window.*` 全局动态挂载、互相解耦。
> **改代码 = 直接编辑这个 HTML 文件；验证 = 浏览器直接打开即可，无需任何构建步骤。**

## 目录总览（树状引导）

```
miniapp/
├── AGENTS.md                  ← 本文件（AI 协作引导）
└── miniap reward.html         ← 全部代码（HTML + CSS + JS 全内联，单文件交付）
    │
    ├── 【CSS 样式区】        行 1 ~ 1856 之前（<style> 内联）
    │   ├── 页面/导航/卡片基础样式
    │   ├── .celebrate 庆祝弹层（sign-mode 签到 / reward-mode 转盘奖励 两套形态）
    │   ├── .toast / .modal-mask 通用反馈组件样式
    │   └── 转盘面板、任务列表、资产页样式
    │
    ├── 【HTML 结构区】       行 1858 ~ 2014
    │   ├── #taskPage     任务主页（签到条 #daysBar、任务列表 #taskList、内嵌转盘 #inlineWheelPanel）
    │   ├── #recordsPage  记录页（XP/Drop 汇总 + #recordContent）
    │   ├── #assetsPage   资产页（净值、账户信息）
    │   ├── 底部导航      #navTask / #navAssets
    │   └── 全局浮层      #toast（提示）、#modalMask（弹窗）、#celebrate（庆祝动画）
    │
    ├── 【脚本模块 ① 转盘引擎】 <script> 行 2016 ~ 2935（IIFE 封装，不污染全局）
    │   ├── wheelOptions      Map —— 转盘奖品配置（key → 颜色/文案/图标/权重）
    │   ├── TurntableCanvas   class（extends EventTarget）—— Canvas 转盘核心
    │   │   ├── 渲染：几何计算、扇区(petalPath)、渐变、高光、图标、文字适配(fitFontSize)
    │   │   ├── 交互：点击命中检测、spin() 动画（easeOutQuart 缓动）
    │   │   ├── 抽奖：pickWeightedKey() 按权重随机
    │   │   └── 事件：spinstart / spinend（CustomEvent，携带 detail.item）
    │   ├── 绘图工具函数：polarPoint / petalPath / normalizeColors / drawText / roundedRect 等
    │   └── 导出：window.TurntableCanvas / window.rewardWheel / window.rewardWheelOptions
    │
    ├── 【脚本模块 ② Lottie 运行时】 行 2937 ~ 2940
    │   └── 内联 vendor 的 lottie-web（压缩版，勿手改）
    │
    ├── 【脚本模块 ③ 动画数据】 行 2941 ~ 2944
    │   └── window.COUPON_REWARD_ANIMATION_DATA —— 优惠券奖励 Lottie JSON（base64 内嵌图片）
    │
    └── 【脚本模块 ④ 业务逻辑】 <script> 行 2945 ~ 3413（App 主模块）
        ├── state        全局状态对象（account/xp/drop/spinQuota/records/coupons 等）
        ├── prizes       转盘奖品定义（key 与模块① wheelOptions 的 key 一一对应）
        ├── taskConfig   任务配置（category: newbie 等，驱动任务列表渲染）
        ├── 渲染层：renderTasks / renderRecords / updateHeader / updateRecordSummary / showPage
        ├── 交互层：checkIn（签到）/ spinWheel（抽奖入口）/ applyPrize（奖品入账）
        ├── 反馈层：showToast / showModal / showRewardCelebrate + Lottie 播放
        └── 事件绑定：文件末尾集中 addEventListener（导航、tab、按钮、浮层关闭）
```

## 模块间通信约定（改代码前必读）

```
模块④ 业务逻辑
   │  调用 window.rewardWheel 的 spin({ targetKey }) 指定中奖结果
   │  监听 spinend 事件拿到 detail.item → finishSpin() → applyPrize()
   ▼
模块① 转盘引擎（对业务零感知，只负责画和转）
   │
   │  showRewardCelebrate() 播放奖励动画时
   ▼
模块② lottie-web + 模块③ 动画数据（仅被模块④ 使用）
```

关键约定：
1. **模块① ② ③ ④ 之间不直接引用，只通过 `window.*` 全局与 CustomEvent 通信**。新增模块请沿用此模式：IIFE 封装 + `window.模块名` 导出。
2. **奖品双注册**：一个奖品要同时出现在模块① 的 `wheelOptions`（外观/权重）和模块④ 的 `prizes`（业务含义/入账类型 coupon|drop）。两边的 `key` 必须一致，改一处要同步另一处。
3. **DOM 全靠 id**：模块④ 用 `$(id)`（getElementById 包装）取元素，新增交互元素必须在 HTML 结构区有对应 id。
4. **页面切换**：`showPage(id)` 切换 `.page.active`，新页面照此模式接入。

## 常见修改任务的路由

| 需求 | 去哪里改 |
|---|---|
| 调转盘外观/扇区颜色/权重 | 模块① `wheelOptions`（约行 2020 起） |
| 改转盘动画时长/缓动/指针 | 模块① `TurntableCanvas` 的 config 与 spin() |
| 加/改奖品（含业务入账） | 模块④ `prizes` + 模块① `wheelOptions` 双改，key 对齐 |
| 加任务/改任务分类 | 模块④ `taskConfig`（自动被 renderTasks 渲染） |
| 改签到逻辑/连签天数 | 模块④ `checkIn()` + HTML `#daysBar`（`--progress` 变量） |
| 改庆祝动画 | CSS `.celebrate.sign-mode/.reward-mode` + 模块④ `showRewardCelebrate / playCouponRewardAnimation` |
| 换 Lottie 动画 | 模块③ 的 `COUPON_REWARD_ANIMATION_DATA`（整段替换 JSON） |
| 改文案/初始数值 | 模块④ `state` 初始值；页面静态文案在 HTML 结构区 |

## 编辑纪律

- **不要尝试拆分文件或引入构建工具**——单文件即交付物（原型交付给 Telegram Mini App 等 WebView 场景）。
- **不要手改模块②**（vendor 的 lottie-web 压缩码）和模块③ 内嵌 base64 数据。
- 文件接近 1MB，编辑时用行号/Grep 定位，避免整读。
- 行号是近似锚点（以模块标记 `<script>` 和标识符为准），插入代码后行号会漂移。
- 所有面向用户的文案为**中英双语**（`full` 字段格式：`中文 / English`），新增文案保持一致。
- 验证方式：浏览器直接打开 `miniap reward.html`；转盘与庆祝动画需实际点一遍（GO 按钮 → 中奖 → 庆祝弹层 → 记录入账）。

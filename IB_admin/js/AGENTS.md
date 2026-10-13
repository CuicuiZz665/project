# AGENTS.md

JS subdirectory guide for agents working under `js/`. This project is a static, build-free admin prototype. Do not add Node, npm, bundlers, transpilers, framework runtimes, or ES module imports. All JavaScript must remain browser-native and loadable by opening `index.html` directly.

## Mandatory Documentation Sync

- Any change to a file in `js/` must include a same-change review of this `js/AGENTS.md`.
- If the JS change adds, removes, renames, reorders, or changes the responsibility, public API, dependencies, DOM hooks, or data shape of any `js/*.js` file, update this document in the same patch.
- If the JS change does not require a documentation edit, state why in the handoff or final note.
- When adding a new JS file, document it here first or in the same patch, then add it to `js/bootstrap.js` in dependency order.

## Local JS Rules

- Each JS file must use an IIFE and register shared/public members onto `window.AdminApp`.
- Keep `js/bootstrap.js` as the only script chain entry. Do not change `index.html` to load individual feature files directly.
- Load order matters. A file may only depend on modules listed before it in `bootstrap.js`.
- Prefer constructor injection for shared services such as `toast` and `confirm`.
- The vendored antd + React 18 UMD combination does not auto-destroy static `Modal.confirm` after OK/Cancel. Business modules must hold the returned reference and call `ref.destroy()` inside both `onOk` and `onCancel` (see the `confirmAction` helper in `agent-level-page.js` / `commission-page.js` and the inline fix in `agent-page.js`).
- Keep business data in `mock-data.js`; Managers and Modals may keep temporary UI state only.
- Prefer stable `id` and `data-*` DOM hooks. When a hook changes, update the related `index.html`, CSS, JS, and this document together.
- Use `app.utils.escapeHtml` for user-visible dynamic text. Use controlled `innerHTML` only for known snippets such as tags, pills, table rows, pagination controls, and modal fragments.
- Keep view/list behavior in Managers, form/overlay behavior in Modals, and navigation/startup behavior in `app-shell.js` / `app.js`.

## Load Order

```text
bootstrap.js
|-- (vendor: react, react-dom, dayjs, antd)
|-- namespace.js
|-- mock-data.js
|-- customer-page.js
|-- login-log-page.js
|-- blacklist-page.js
|-- whitelist-page.js
|-- agent-page.js
|-- agent-application-page.js
|-- agent-level-page.js
|-- commission-page.js
|-- commission-record-page.js
|-- dashboard-page.js
|-- activity-page.js
|-- activity-application-page.js
|-- point-details-page.js
|-- wheel-page.js
|-- coupon-page.js
|-- badge-page.js
|-- role-settings-page.js
|-- user-settings-page.js
|-- global-nav.js
`-- antd-app.js          # composition root, mounts #root
```

When changing this order, verify every dependency below still loads before its consumer. Legacy vanilla modules (`utils.js`, `pagination.js`, `toast.js`, `confirm-dialog.js`, `rule-modal.js`, `rule-manager.js`, `delivery-modal.js`, `delivery-manager.js`, `app-shell.js`, `app.js`) still exist on disk but are no longer loaded by `bootstrap.js`; do not add new consumers of them.

## File Responsibilities

### `bootstrap.js`

- Role: dynamic script loader and the only JavaScript entry loaded by `index.html`.
- Registers: nothing on `window.AdminApp`; it injects script tags in sequence.
- Depends on: browser DOM APIs only.
- Consumers: `index.html`.
- Change when: adding/removing/renaming JS modules or correcting dependency order.
- Validate: every listed file exists, and the browser console has no script load failures when `index.html` is opened directly.

### `namespace.js`

- Role: creates or reuses the global namespace.
- Registers: `window.AdminApp`.
- Depends on: no local modules.
- Consumers: every later JS file.
- Change when: the global namespace strategy changes.
- Avoid: adding feature logic here.

### `utils.js`

- Role: shared low-level DOM and HTML escaping helpers.
- Registers: `app.dom.$`, `app.dom.$$`, `app.utils.escapeHtml`.
- Depends on: `namespace.js`.
- Consumers: shared services, Managers, and Modals.
- Change when: a helper is genuinely shared by multiple modules or a shared helper has a defect.
- Regression scope: all render paths and event bindings that use `$`, `$$`, or `escapeHtml`.

### `pagination.js`

- Role: reusable pagination renderer and interaction binder for list views.
- Registers: `app.renderPagination({ container, total, page, pageSize, pageSizes, onChange })`.
- Depends on: `namespace.js`.
- Consumers: `RuleManager.render()` and `DeliveryManager.render()`.
- Behavior: writes pagination summary, page buttons, previous/next controls, page-size select, and returns `{ page, pageSize, totalPages, start, end }`.
- Change when: list pagination UX, page sizing, or pagination markup/classes change.
- Regression scope: point rule list pagination and delivery list pagination.

### `mock-data.js`

- Role: centralized mock business data and static options for the prototype.
- Registers: `app.mockData.breadcrumbs`, `app.mockData.rules`, `app.mockData.deliveries`, `app.mockData.agentLevels`, `app.mockData.commissionRules`, `app.mockData.commissionSymbols`, `app.mockData.agents`, `app.mockData.agentApplications`, `app.mockData.commissionRecords`, `app.mockData.commissionDistributions`, `app.mockData.customers`, `app.mockData.customerDetails`, `app.mockData.loginLogs`, `app.mockData.customerServices`, `app.mockData.dashboard`, `app.mockData.communityActivities`, `app.mockData.activityApplications`, `app.mockData.roleSettings`, `app.mockData.userSettings`, `app.mockData.blacklist`, `app.mockData.whitelist`, `app.mockData.coupons`, `app.mockData.wheelActivities`, `app.mockData.badges`, `app.mockData.cascaderOptions`.
- Depends on: `namespace.js`.
- Consumers: `app.js`, Managers, Modals, and detail displays.
- Data shape:
  - Rule rows use fields such as `id`, `internalName`, `externalName`, `triggerEvent`, `cyclePeriod`, `rewardXp`, `rewardDrop`, `taskType`, `timeRange`, `status`, `canEdit`, `operator`, plus optional `conditions` (`param`+`value` array) / `relation` (`all`/`any`) for the detail drawer's 达成条件; rule 10 (模拟盘交易激励) is the full-field daily-task display example.
  - Delivery rows use fields such as `id`, `key`, `name`, `object`, `objectDetail`, `method`, `count`, `status`, `start`, `end`, `event`, `param`, `operator`.
  - Customer rows use fields such as `id`, `name`, `account`, `status`, `level`, `riskLevel`, `region`, `phone`, and `accounts`.
  - `customerDetails` is keyed by customer `userId` and feeds the 客户详情 drawer: identity/KYC fields (`realNameStatus`, `kycStatus`, `kycAt`, `phone`, `idRegion`), login/device fields (`lastLoginAt`, `lastLoginIp`, `loginDevice`, `registerIp`, `deviceFingerprint`, `favoriteSymbols`), fund/bonus fields (`balance`, `equity`, `credit`, `totalDeposit`, `totalWithdrawal`, `netDeposit`, `bonusAmount`, `unlockedBonusAmount`, `bonusStatus`, `totalAssets`), risk fields (`specialCustomer`, blank/`-` renders as the 正常客户 tag while any value shows as-is — `499516984` is the 特殊客户 example, `riskTags` array), `note`, and `accounts` (per sub-account rows with `accountNo`, `subAccountId`, `type` 统一交易账户/模拟账户, `status`, `openedAt`, `tradeMode`, `positionMode`, `balance`, `equity`, `credit`, `marginUsed`, `marginFree`, `marginRatio`, `totalDeposit`, `totalWithdrawal`, `netDeposit`, `pnl`, `pnlRate`, `orders`, `lots`, `lastTrade`, plus record arrays `tradeRecords` / `fundRecords` / `subAccountFundRecords` / `bonusRecords` / `followingRecords` / `followerRecords` / `activityRecords` (活动记录 rows: `source` 奖励来源 / `obtainedAt` 获取时间(GMT+0) / `rewardDetail` 奖励明细; e.g. 大转盘活动→20 金币, 邀请好友→200 XP, 大转盘活动→赠金券; the tab's filters are a searchable 奖励来源 select + a real `RangePicker` 获取时间(GMT+0) — `renderDetailFilterBar` supports `searchable` selects and `rangePicker` fields), and `partnerInfo` (`isAgent` 是/否 — drives the Partner Program tab count, `userType`, `userLevel`, `parentAgentId`, `agentLevel`, `agentSince`; `315899879` is the worked example: 否/Trader/-/0/-/-), `levelChangeRecords` (变更前后等级/佣金规则名称/变更时间/操作人 rows; `766328994` carries the sample row), and `commissionInfo` (`settled` / `pending`). Amount strings are plain numbers (元 assumed); blank display value is `—` (real zero renders as `0.00 元`).
  - Login log rows use `id`, `requestId`, `userId`, `email`, `ip`, `country`, `ua`, `deviceUuid`, `timezone`, `canvasFp`, `audioFp`, `screen`, `deviceFp`, `method`, and `loginAt` (`YYYY-MM-DD HH:mm:ss`).
  - Agent rows use fields such as `id`, `userId`, `agentId`, `level`, `parentAgentId`, `userType`, `commissionRuleId`, `commissionRuleName`, `commissionStatus`, `protection`, `teamCount`, `teamHoldings`, `createdAt`, and `selfCommissionEnabled`.
  - Agent level rows use `id`, `name`, `color`, `sort`, `status`, `isDefault`, `upgrade` (`match` / `directCustomers` / `teamMembers` / `netDeposit` / `teamLots`), `rebateRate`, `marketingRate`, `protectionDays`, `commissionRuleId`, and `remark`; `agents[].level` is matched by level `name` to derive per-level agent counts.
  - Commission rule rows use `id`, `name`, `levelId`, `levelName`, `status`, `rates` (`contract` / `contractTrader` / `contractApi` / `contractTraderApi` / `spot` / `spotTrader` / `spotApi` / `spotTraderApi`), `marketingRate`, `selfCommission`, `settleCycle`, `settleCoin`, `effectiveType`, `effectiveAt`, `updatedAt`, `operator`, and `remark`; `agents[].commissionRuleId` links agents to rules.
  - Agent application rows use `id`, `userId`, `contact`, `proofs` (`label` + `url` array), `platform`, `holdings`, `promoMode`, `appliedAt`, `status` (待审核/已通过/已驳回), `operator`, and `rejectReason`.
  - Commission record rows use `id`, `orderId`, `symbol`, `holdings`, `commission`, `closedAt`, `settledAt`, and `settleStatus` (未结算/部分结算/已结算/已驳回); `commissionDistributions` rows use `orderId`, `pid`, `level`, and `amount`, and the record modal filters them by `orderId`.
  - Commission symbol rows use `code`, `name`, `margin` (元 notional), `listed` (true=上架 / false=下架), `openRate`, and `closeRate` (percent numbers); fees shown in the create page are `margin * rate / 100` with trailing zeros trimmed.
  - Blacklist rows use `id`, `userId`, `registerType`, `registeredAt`, `email`, `walletAddress`, `operator`, `operatedAt`, `reason`, `deposited`, and `restrictions` (array of 限制登录/限制入金/限制出金/限制开仓).
  - Whitelist rows use `id`, `userId`, `nickName`, `registerType`, `registeredAt`, `email`, `walletAddress`, `operator`, `operatedAt`, `country`, and `deposited`.
  - Coupon rows use `id`, `name`, `type` (抹亏券/交易返现券/手续费减免券), `rule`, `validStart`, `validEnd`, `stock`, `status` (启用/停用), `operator`, and `updatedAt`.
  - Wheel activity rows use `id`, `type` (大转盘; 盲盒/刮刮卡 are disabled type options for future expansion), `name`, `marker` (auto `HD-YYYYMM-seq`), `start`, `end`, `dailyLimit`, `enabled`, `operator`, and `prizes`; prize rows use `key`, `type` (优惠券/积分/奖励/谢谢参与), `couponId` (coupons link, 优惠券 only), `pointsLabel`/`pointsAmount` (积分), `accountType`/`amount` (奖励), `count`, and `percent` (pool must sum to 100). Lottery fields were migrated out of `deliveries` — delivery rows no longer carry `wheelMarker`.
  - Badge rows use `id`, `icon` (image URL), `conditionType` (高手被跟随/高手等级变化/总入金/平仓), `conditionText`, `status` (启用/禁用), `createdAt`, `updatedAt`, and `languages` (`lang` / `name` / `desc` per locale); the name column renders `英语: x` / `简体中文: y` lines.
  - Cascader options are keyed by delivery type and include `text`, `second`, and `third`.
  - Dashboard metrics provide per-key `value` / `change` / `note`; `tradingLots` and `tradingAmount` have no card of their own and feed the trading-customers card subtitle on `dashboard-page.js`.
- Change when: initial business examples, option lists, default breadcrumbs, or data fields change.
- Regression scope: list rendering, modal prefill, save output, filters, and detail drawer fields that read changed data.

### `customer-page.js`

- Role: 客户管理 list + 客户详情 drawer (rebuilt around a "signal over noise" detail design: user summary header, counted tabs, collapsible sub-account cards, copy affordances, CS notes).
- Registers: `app.CustomerPage`.
- Depends on: `React`, `antd` (Button/Drawer/Input/Modal/Select/Space/Table/Tabs/Tag/Typography/`message`); receives `customers` / `services` (from `app.mockData.customers` / `customerServices`) as props; reads `app.mockData.customerDetails` via `detailExtraOf`.
- List behavior (unchanged): keyword/充值状态/所属客服 filters, 导 出, batch 分配客服 modal (tags input + validation + clear-service confirm), row selection, pagination.
- Detail drawer behavior (single column, no side panel):
  - `renderDetailHeader` — slim identity bar at the very top: letter avatar, name, UID copy, tags (充值状态 + 国家/地区 + 特殊客户/正常客户, same default tag style; `specialCustomer` blank means 正常客户 — KYC/实名 live in the collapsed 更多信息), a single meta line `邮箱 注册于 …` (IP/最近登录 removed from the header — they live in the collapsed 更多信息), and exactly two side-by-side actions right-aligned: 开通赠金账号 confirm (primary) and 客户下线 danger confirm (下线后退出登录且无法再登录) — the old bottom-floating 开通赠金账号 button is gone.
  - `renderAssetStrip` — main info directly under the identity bar: user-level asset tiles (总余额/总入金/总提现/赠金金额, summed from non-模拟 accounts) or the empty-state banner (`该客户尚未入金`).
  - Money display convention (customer detail wide): every money metric renders a small gray `元` suffix in its title (`.metric-unit`) with a unit-less numeric value below (thousands separators, sign kept) — applies to the asset strip tiles, sub-account core metrics and secondary-grid money fields, the collapsed inline 净值 summary, and the 资金记录 总资产 summary; percent/count fields carry no suffix.
  - `MoreInfoSection` — collapsible 次要信息 row ("更多信息 ▸" / "收起信息", collapsed by default) between the asset strip and the tabs; expanded it renders the remaining fields as one flat auto-fill grid in fixed order (邮箱 / 收款账号+copy / 注册 IP / 登录 IP / 登录设备 / 设备指纹 / 赠金状态 / 特殊客户 / 风险标签 red tags or 无风险标签 / 上级代理ID last above 备注 — deleted from the old sections: 国家/地区, 手机号, 实名状态, KYC 认证时间, 常用品种, 已解锁赠金, and the section headers), with 备注 (`customer-more-note`) as its own block below. This replaces the old right sidebar; tab panels now render full width.
  - 备注 inline editing (no modal): 编辑 toggles the note text into an in-place `Input.TextArea` (autoFocus, maxLength 200, showCount) with 保存/取消 link buttons in the section header; 保存 calls the `onSaveNote(draft)` prop → `saveNoteValue` in CustomerPage writes `noteByCustomer` / `noteMetaByCustomer` local state (prototype-only) and toasts; the meta line `操作人 admin · 刚刚` hides while editing.
  - Tabs carry per-tab counts via `tabLabel` and their panels render the content directly. The 资金记录 tab merges three former tabs (资金记录 + 子账号资金记录 + 赠金记录) via `mergedFundRows`: 主账户 rows (`account: "主账户"`), 子账号 rows (`account: "子账号 {subAccountId}"`), and 赠金 rows (资金类型 赠金, 来源 `系统（{bonusType}）`, 去向/变动后余额 `—`), sorted by `createdAt` desc; the table columns are 账号类型/账号ID/资金类型/单号/来源/去向/金额/变动后余额/生成时间(GMT+0) (流水 rows carry `orderNo` — deposits/trade fees get order numbers, transfers show `—`), and the filter bar is 账户ID input + 单号 input (交易单号/订单号 combined) + searchable 账号类型 select (主账户/子账号) + searchable 资金类型 select + 生成时间 range, and the tab count sums the three source arrays. Partner Program no longer renders a records table: `renderPartnerInfo` stacks three collapsible `PartnerCard`s (`.customer-partner-stack`; reuses the 交易账号 card chrome — chevron head, `.customer-subaccount-inline` gray summary when collapsed, expanded by default) in order 代理商信息 (是否代理商/用户类型/用户层级/上级代理ID/代理等级/成为代理时间 from `partnerInfo`; collapsed summary 用户类型+是否代理商) → 佣金记录 (累计已结算佣金/待结算佣金 from `commissionInfo`, money-suffix style; collapsed summary 累计已结算/待结算 with 元 suffix) → 等级变更记录 (antd Table: 变更前等级/变更后等级/变更前佣金规则名称/变更后佣金规则名称/变更时间/操作人 from `levelChangeRecords` — no fixed widths or scroll.x, the table always fits the card width with no horizontal scrollbar; collapsed summary 共 N 条变更记录). 代理商信息 and 佣金记录 bodies render as the same flat `.customer-subaccount-grid` field style as the 交易账号 secondary grid (`.customer-partner-card` drops its top border); the tab count is 1 only when `isAgent === "是"`. `renderDetailRows` keys rows by index so titles can be nodes.
  - `SubAccountCard` — collapsible card: head is `交易账号` + gray `ID：{accountNo}` (UID-style) + copy button; 模拟/零资产 accounts (`isZeroAccount`) start collapsed to a one-line summary (净值 · 盈利率 only); expanded shows 5 core metrics in order 余额/净值/累计盈利/累计盈利率/总订单 — money tiles (余额/净值/累计盈利) carry a small `元` suffix in the title (`.metric-unit`) and unit-less values below, signed values get `is-up`/`is-down`; secondary grid in order 可用保证金/已用保证金/保证金比例(≥80% `ratio-danger` red, ≥50% `ratio-warning` orange)/净值/净充值金额/历史总充值金额/历史总提现金额/交易模式/持仓模式/最后交易/开通时间 (信用赠金/总订单/子账号ID dropped from the grid).
  - Formatting helpers enforce number standards: `fmtAmount`/`fmtSigned`/`fmtCount`/`fmtPercent` (thousands separators, `元` unit), `isBlank` → `—` (em dash reserved for "no data", `0` is real data), `parseNum`, `signedClass`, `ratioClass`.
  - `MoreInfoSection` sections cover: 基本信息 (国家/邮箱/手机/实名/KYC时间/上级代理/注册IP/收款账号 truncated + copy), 登录与设备, 赠金信息 (已解锁/状态), 风控信息 (特殊客户 + `riskTags`), 备注 (text + 编辑 link).
  - 备注 note data: `noteByCustomer` / `noteMetaByCustomer` local state (prototype-only), meta line `操作人 admin · 刚刚` after save; the old 编辑备注 modal was removed in favor of inline editing.
  - `CopyButton` — icon-only copy button (inline SVG; vendor bundle has no @ant-design/icons): copies via clipboard API with `execCommand` fallback and fires a `message.success("复制成功")` toast — the button itself never changes text. UID renders as plain `UID：{userId}` text (`.customer-header-uid`) with the icon beside it; also used for 交易账号 / 钱包地址 with `title` tooltips.
  - Confirm dialogs go through the local `confirmAction` helper (`Modal.confirm` ref + `destroy()` in onOk/onCancel) per the vendored-antd rule.
- DOM hooks (styled in `css/modals.css`): reuses `.customer-detail-list` / `.customer-detail-row` (shared with agent-page); adds `.customer-detail-header`, `.customer-header-top/-identity/-name/-uid/-name-block/-tags/-actions/-meta`, `.customer-asset-block`, `.customer-asset-card/-main/-balance/-caption/-label/-grid/-field`, `.customer-asset-field strong.is-orange`, `.customer-asset-empty`, `.customer-more-info/-toggle(.open)/-chevron/-grid/-note`, `.customer-copy-btn`, `.customer-tab-label`/`.customer-tab-count`, `.customer-subaccount-card(.is-expanded/.is-collapsed)`, `.customer-subaccount-chevron(.open)`, `.customer-subaccount-name/-inline/-tags/-body`, `.customer-subaccount-metric strong.is-up/.is-down/.ratio-warning/.ratio-danger`, `.customer-sidebar-section`, `.customer-risk-tags`, `.customer-note-text/-meta`, `.customer-wallet-value/-text`; removed `.customer-open-account`, the old centered `.customer-profile` block, the `.customer-copy-btn.is-copied` state, and the `.customer-detail-layout` / `.customer-detail-sidebar` two-column hooks.
- Change when: detail information architecture, card hierarchy, header actions, note flow, or formatting standards change.
- Regression scope: customer list filters/assign flow, drawer header on deposited vs 未充值 customers, card expand/collapse (incl. keyboard), tab counts, copy buttons, note save, and the agent detail drawer that shares `.customer-detail-list`.

### `login-log-page.js`

- Role: 用户登录日志 page — login log list recreated 1:1 from the live-system prototype (filters, columns, tags, export, pagination).
- Registers: `app.LoginLogPage`.
- Depends on: `React`, `antd`, `dayjs` (RangePicker values); receives `logs` (from `app.mockData.loginLogs`) as a prop from the composition root.
- Behavior: draft/applied filter split — primary row shows only 关键词 (searchable grouped Select over ID / 请求 ID / 用户 ID / IP values) and 登录时间(GMT+0) range; 更多筛选 expands per-field filters for ID / 邮箱 / 国家 / User Agent / 设备UUID / 客户端时区 / Canvas指纹 / Audio指纹 / 屏幕分辨率 / 设备指纹 / 登录方式 (用户 ID / 请求 ID / IP have no standalone filters — keyword covers them); filters commit on 搜 索 or Enter (`onPressEnter`), 重置 clears both states and restores pageSize 20; ID and 用户 ID render as link buttons that copy with a toast; 请求 ID and IP render monospace; User Agent truncates with a `title` tooltip; 登录方式 renders colored tags; 导 出 downloads a BOM CSV of the filtered rows named `用户登录日志_YYYY-MM-DD.csv` with a success toast; 列设置 toggles the non-ID columns via Popover + Checkbox.Group.
- DOM hooks (classes, styled in `css/layout.css`): `.login-log-page`, `.login-log-toolbar`, `.login-log-filter-area`, `.login-log-more-row`, `.login-log-range`, `.mono-cell`, `.ua-cell`, `.cell-link`.
- Change when: login-log columns, filter semantics, export format, or column-settings behavior change.
- Regression scope: login-log navigation, filter commit on search/Enter, more-filter toggle, reset, date-range filtering, pagination total and pageSize, column settings, export toast, empty state, and the customer/agent pages that share `.customer-filter-item` / `.keyword-input` / `.select-input` toolbar styles.

### `wheel-page.js`

- Role: 激励中心 > 抽奖配置 — interactive campaign management (大转盘 today; 盲盒/刮刮卡 are disabled type placeholders for future expansion) that owns the lottery prize pool previously configured inside 投递.
- Registers: `app.WheelPage`.
- Depends on: `React`, `antd`, `dayjs` (RangePicker values); receives `activities` / `setActivities` (from `app.mockData.wheelActivities`) and `coupons` (券库, for prize selection) from the composition root.
- Behavior: keyword filter (placeholder 抽奖名称/标识) over name/marker; list columns in order 抽奖名称 / 玩法类型 / 奖池 (fixed 3 stacked lines 优惠券/积分/奖励 showing the configured coupon name, XP/金币 ×amount, account type + amount; 未配置 shows -, 谢谢参与 not shown) / 状态 (停用 / 未开始 / 进行中 / 已结束) / 抽奖时间 (起止 stacked) / 操作人 / 操作; clicking a row (ignoring button clicks) opens the 抽奖详情 drawer styled like the rules-page 规则详情 (label/value rows: 玩法类型/抽奖名称/活动标识/抽奖时间/活动状态/操作人/投递方式/奖池配置 numbered prize lines with count+percent/概率合计); actions are 编辑 / 复制 (副本默认停用) / 启用停用 / 删除 (deletes immediately with a toast, no confirm dialog); `marker` is no longer a list column and is not shown in the drawer (still auto-generated on save; visible in the 抽奖详情 drawer). The toolbar button and the add-mode drawer title are both 新增 (edit/copy keep 编辑活动 / 复制活动 — module name is 抽奖配置, but item-level titles/toasts use 活动 wording). The create/edit/copy drawer holds 基础信息 (玩法类型, then 抽奖名称 + 抽奖时间 side by side on one row, no daily-limit field anymore, no 活动标识 hint — marker is still auto-generated on save) and 奖池配置 (Form.List rows of 奖品类型 优惠券/积分/奖励/谢谢参与; 优惠券 rows select from enabled coupons in the券库; 积分 rows pick XP/金币 + amount; 奖励 rows pick account type + amount; each row has count + percent), plus a 投递方式 section after 奖池配置: a Select defaulting to 自动; choosing 人工 reveals a `.manual-panel` with a 投递Userid TextArea (placeholder 支持英文逗号分隔批量ID) that becomes disabled after 批量导入 (mock fills a comma-separated ID list; vendor has no @ant-design/icons, so the buttons carry inline tray SVGs) — a 清空 link button (visible only after import) empties the field and restores editing; 导出模板 is a mock toast. Saving validates every prize row, that percent sums to exactly 100%, and that 人工 delivery has a non-empty 投递Userid; the payload carries `deliveryMethod` + `manualUserIds` instead of the removed `dailyLimit`.
- DOM hooks (styled in `css/layout.css`): reuses `.page-surface`, `.toolbar`, `.keyword-input`, `.drawer-footer-actions`, `.form-section-title`, `.full-control`, `.admin-form`, `.manual-panel`, `.mono-cell`, `.stacked-cell`/`.stacked-muted`; adds `.prize-list`/`.prize-row`/`.prize-thanks`.
- Change when: campaign types, prize pool fields, probability rules, delivery-method behavior, or activity lifecycle behavior change.
- Regression scope: wheel navigation, keyword filter, drawer validation (percent sum, coupon required, 人工 delivery requires 投递Userid), add/edit/copy/enable/disable/delete flows, row-click detail drawer open/close, 投递方式 自动/人工 switching with 批量导入/清空 state, computed status, and pagination.

### `coupon-page.js`

- Role: 发放管理 > 优惠券管理 — the coupon library that 抽奖配置 prize pools reference; enables the previously disabled placeholder menu item.
- Registers: `app.CouponPage`.
- Depends on: `React`, `antd`; receives `coupons` / `setCoupons` (from `app.mockData.coupons`) and `wheelActivities` (for reference guards) from the composition root.
- Behavior: 券名 keyword + 状态 filters committed on 查 询, 重置 clears; 新增/编辑/复制 modal covers 券名称 (unique not enforced in prototype), 类型, 面额/使用规则, 有效期 (RangePicker), 库存, 备注; new coupons default to 停用. 状态 switch toggles 启用/停用 (warns but allows when referenced by a prize pool). Delete is blocked for coupons referenced by any 抽奖配置 prize pool with a "知道了" dialog pointing at the referencing activities — this enforces the 先建券、再配奖池 dependency order. The delivery modal's 选择优惠券 dropdown reads enabled coupons from this library.
- DOM hooks: reuses `.toolbar`, `.keyword-input`, `.select-input`, `.restriction-modal-footer`, `.stacked-muted`, `.form-grid-antd`, `.admin-form`, `.full-control`; adds no new CSS.
- Change when: coupon fields, guard rules, or lifecycle behavior change.
- Regression scope: coupon navigation, filter commit/reset, modal validation and save/copy, status toggle warning, delete guard, and the 抽奖配置 prize coupon dropdown that consumes the library.

### `badge-page.js`

- Role: 1:1 recreation of the live 市场活动 > 徽章系统 > 徽章列表 page (search/status filters, create/edit badge drawer with multilingual configs, row-click detail drawer, column settings).
- Registers: `app.BadgePage`.
- Depends on: `React`, `antd`; receives `list` (from `app.mockData.badges`) as a prop from the composition root; holds row state locally so create/edit/toggle mutate the working copy.
- Behavior: draft/applied filters — 搜索词 matches all language names, 状态 selects 启用/禁用; committed on 查 询, 重 置 clears. Actions: 创 建 opens the badge drawer grouped as 基本信息(图标上传) / 获取条件(select of the four condition types) / 语言配置(horizontal Tabs in the 积分 style — language tabs with an x to remove except 英语, a "+ 添加语言" tab, and per-language 徽章名称/获取条件描述 fields backed by local state) — the 缩写 field was removed at product request. Saving validates icon and per-language names and prepends a new enabled row; 修 改 opens the same drawer prefilled; row actions are 修 改 / 复 制 (opens the drawer prefilled, saves as a new enabled row) / 禁 用-启 用 (confirms then flips the status tag); clicking anywhere on a row opens the 徽章详情 drawer (large icon, ID, condition, restriction, status, per-language cards, created/updated time). 列设置 Popover covers 7 columns with none hidden by default.
- DOM hooks (styled in `css/layout.css`): reuses `.toolbar`, `.customer-filter-item`, `.keyword-input`, `.select-input`, `.column-panel-*`, `.login-log-column-*`, `.stacked-cell`, `.restriction-modal-footer`, `.admin-form`, `.form-grid-antd`, `.full-control`; adds `.badge-icon`, `.badge-detail-icon`, `.badge-lang-title`, `.badge-lang-card`, `.badge-icon-upload`/`.badge-icon-plus`/`.badge-icon-text`; the drawer's 基本信息/获取条件/语言配置 groups each render as a bordered card using the shared `.drawer-form-card` class.
- Change when: badge columns, condition types, language config, or drawer form fields change.
- Regression scope: badge navigation, filter commit/reset, create/edit drawer validation and row insert, status toggle confirm, row-click detail drawer, column settings apply, and pagination.

### `blacklist-page.js`

- Role: 1:1 recreation of the live 特殊客户 > 黑名单 page (filters, grouped column settings with 融合显示, add/edit-permission modals, export, pagination).
- Registers: `app.BlacklistPage`.
- Depends on: `React`, `antd`; receives `list` (from `app.mockData.blacklist`) as a prop from the composition root; holds row state locally so add/edit/delete mutate the working copy.
- Behavior: draft/applied filters — primary row shows 用户ID and 邮箱; 更多筛选 expands a stacked area with 排序方式 (添加时间/注册时间, applied as descending sort), 添加时间 and 注册时间 date ranges; filters commit on 查 询, 重置 clears both. Actions: 导 出 downloads `黑名单_YYYY-MM-DD.csv`; 添加黑名单 opens the modal (用户ID + 原因 0/200 + 是否强制下线 switch + 权限限制 checkboxes, all four default-checked) and prepends a row; 列设置 opens the grouped panel (客户信息/注册信息/联系与地址/名单信息/状态与权限 cards, per-group counts, 全选/清空/恢复默认) plus a 融合显示 switch that merges 注册方式+注册时间 into 注册信息 and 最后操作人+添加时间 into 操作信息; row actions are 修改权限 (modal with the row's restriction checkboxes, save updates the tag) and 删 除 (confirmed, removes the row). 权限限制 renders red/orange tags; 是否充值 plain text; pagination `20 / page` with size changer.
- DOM hooks (styled in `css/layout.css`): reuses `.toolbar`, `.login-log-toolbar`, `.login-log-filter-area`, `.customer-filter-item`, `.keyword-input`, `.select-input`, `.login-log-range`, `.column-panel-head`, `.column-panel-count`, `.column-panel-sub`, `.column-panel-footer`, `.cell-link`; adds `.stacked-cell`/`.stacked-strong`/`.stacked-muted`, `.blacklist-more-area`, `.group-column-panel`/`.group-column-title`/`.group-column-merge`/`.group-column-actions`/`.group-column-grid`/`.group-column-card`/`.group-column-card-head`/`.group-column-checks`, `.restriction-tag`, `.restriction-modal-label`/`.restriction-modal-group`/`.restriction-modal-footer`.
- Change when: blacklist columns, filter semantics, restriction options, modal fields, or column-settings behavior change.
- Regression scope: blacklist navigation, filter commit/reset, sort and range filtering, add modal validation and row insert, permission edit save, delete confirm, 融合显示 toggle, column settings apply, export toast, and pagination.

### `whitelist-page.js`

- Role: 1:1 recreation of the live 特殊客户 > 白名单 page (userId filter, inline add box, grouped column settings, export, pagination).
- Registers: `app.WhitelistPage`.
- Depends on: `React`, `antd`; receives `list` (from `app.mockData.whitelist`) as a prop from the composition root; holds row state locally so add/delete mutate the working copy.
- Behavior: single 用户ID filter committed on 查 询, 重置 clears; actions row has 导 出 (`白名单_YYYY-MM-DD.csv`), an inline 添加 box — 请输入需要添加的用户ID input with a 添加白名单 primary button that stays disabled until text is entered, adding prepends a mock row and clears the input — and the grouped 列设置 panel (same card style as the blacklist page, no 融合显示 switch). Columns merge 客户 (用户ID link + 昵称), 注册信息 (注册方式+时间), 操作信息 (操作人+时间); 删 除 confirms and removes the row; pagination `20 / page`.
- DOM hooks: reuses the blacklist-page additions in `css/layout.css` (`.stacked-*`, `.group-column-*`, `.column-panel-*`) plus `.whitelist-add-input`.
- Change when: whitelist columns, filter semantics, add-box behavior, or column-settings behavior change.
- Regression scope: whitelist navigation, filter commit/reset, inline add enable/disable and row insert, delete confirm, column settings apply, export toast, and pagination.

### `agent-page.js`

- Role: proxy relationship agent list with per-agent self-commission switches.
- Registers: `app.AgentPage`.
- Depends on: `React`, `antd`, and `app.mockData.agents`.
- Behavior: renders the agent list with the requested compact columns — 团队人数 and 团队持仓量 are not list columns; clicking the 用户ID link opens a 代理商详情 Drawer (antd `Drawer`, reuses `.customer-detail-list` / `.customer-detail-row` styles) that shows the full field set including 团队人数 / 团队持仓量 / 自返佣; shows the screenshot-style structure table from "查看结构" with commission rule ID and team metrics moved out of the list, filters by user/agent ID, level, and self-commission status, confirms enabling, and applies the switch to one agent only. The 用户ID / 代理ID / 上级代理ID search boxes are searchable selects (`Select` + `showSearch`, options derived from `agents`, exact-value match, apply immediately, width 200 via `.agent-filter-item .keyword-select`).
- Data shape: reads `selfCommissionEnabled` from agent rows; changes are held in local UI state until an API is connected.
- Regression scope: agent navigation, compact list columns, structure modal detail display, filters, switch enable/disable/cancel behavior, and pagination.

### `agent-application-page.js`

- Role: 代理申请列表 page — 1:1 recreation of the live agent application audit list (filters, columns, tags, export, pagination).
- Registers: `app.AgentApplicationPage`.
- Depends on: `React`, `antd`; receives `applications` (from `app.mockData.agentApplications`) as a prop from the composition root.
- Behavior: draft/applied filter split — primary row shows 用户ID and 状态 (待审核/已通过/已驳回, clearable); 更多筛选 expands 操作人 and 申请时间 date range; 用户ID and 操作人 are searchable selects (`Select` + `showSearch`, options derived from `applications`, exact-value match); filters commit on 查 询, 重置 clears both; 用户ID renders as a link button (mock customer-detail toast); 影响力证明 renders stacked 图片N links opening the proof URL in a new tab; 联系方式/推广模式/拒绝原因 truncate with ellipsis; 审核状态 renders tags (待审核 gold / 已通过 green / 已驳回 red); 操作 column renders "-" for every status, matching the live system where no pending rows exist; 导 出 downloads `代理申请列表_YYYY-MM-DD.csv`; 列设置 Popover covers 9 optional columns with 操作人 fixed as the last column before 操作 and visible by default, only 拒绝原因 hidden by default.
- DOM hooks: reuses `.toolbar`, `.login-log-toolbar`, `.login-log-filter-area`, `.login-log-more-row`, `.login-log-range`, `.customer-filter-item`, `.keyword-select`, `.select-input`, `.cell-link`, and the `.login-log-column-*` panel styles from `css/layout.css`; adds no new CSS.
- Change when: application columns, filter semantics, export format, or column-settings behavior change.
- Regression scope: application navigation, filter commit/reset, more-filter toggle, proof links, status tags, pagination, column settings, export toast, and the empty 待审核 state.

### `agent-level-page.js`

- Role: 代理等级配置 page — agent level definitions with multilingual names, audit thresholds, benefits, and linked commission rule.
- Registers: `app.AgentLevelPage`.
- Depends on: `React`, `antd`; receives `levels` / `setLevels` (from `app.mockData.agentLevels`), `rules` (commission rules), and `agents` (for per-level agent counts) as props from the composition root.
- Behavior: filters levels by name and status — the 等级名称 search box is a searchable select (`Select` + `showSearch`, options from level names, exact-value match, width 200 via `.config-filter-item .keyword-select`); create/edit/copy opens a Drawer (width 720, `.drawer-footer-actions` 取消/确定 footer) whose form is: 语言配置 done exactly like the 积分配置 rule modal — `.tabs`/`.tab` language tabs (reused from `css/modals.css`) where the first tab is locked (no ×), non-first tabs carry a small × remove (min one language), and `+ 添加语言` appends the next unused language from `LANGUAGE_OPTIONS` with an `已添加X` toast — above a single 等级名称 input bound to the active language via `langTabs` / `activeLang` / `langNames` state; then required 佣金配置 select of commission rules and required 活跃客户数≥ / 团队持仓量≥ number inputs; the stored name is the 简体中文 entry (else the first tab's), must be unique, and saves with the full `languages` array; 考核 thresholds land in `upgrade.activeCustomers` / `upgrade.teamHoldings` (match mode is preserved, not edited); color / rebate / marketing / protection / remark are not in the form — new levels get defaults, edits keep the stored values; 复制 prefills every language name with `-副本`, sort max+1, and saves as a new 启用 level; the list ends with 操作人 (mock `operator`) before the 操作 column (编辑/复制/设为默认/删除), and saving create/copy/edit stamps `operator: "Amy"`; editing a level with agents confirms impact; deleting is blocked for the default level and for levels holding agents; set-default confirms; the status switch blocks the default level and confirms disabling a level that still holds agents.
- Regression scope: navigation, filters/reset, drawer language tab add/remove/switch + name validation, copy/edit/create save flows, delete guards, set default, status toggle, and 考核规则 cell rendering.

### `commission-page.js`

- Role: 佣金配置管理 page (mounted as the 佣金配置 tab inside the merged 佣金管理 view) — commission rules with a fixed per-product/per-channel rate matrix, settlement, and related-agent lookup.
- Registers: `app.CommissionPage`.
- Depends on: `React`, `antd`, `dayjs`; receives `rules` / `setRules` (from `app.mockData.commissionRules`), `levels` (agent levels), and `agents` as props from the composition root.
- Behavior: 新增佣金规则 opens a dedicated create page (screenshot-faithful) instead of the modal — a white card with a 返回/创建 header, one row with a required 佣金规则名称 input followed by required 保底分佣比例 / 营销激励比例 percent inputs (no 语言配置 section), and a 品种佣金明细 section (品种代码 / 上/下架状态 selects committing on 查 询, 重 置 clears; a right-aligned percent InputNumber + 一键填充 button that stamps one rate onto every symbol; table with rowSpan-2 lead cells per symbol, 买/卖 direction rows, rates as text, fees computed from margin, 预计分佣金额 = direction fee × the symbol's 分佣比例 shown as "-" until filled, a rowSpan-2 分佣比例 InputNumber per symbol, and a green 启用 开平仓费状态 tag per row; 上架 renders a green tag, 下架 plain gray text; 创建 stores each symbol's rate into `symbolRates`). 创建 validates the form, rejects duplicate rule names, stores `floorRate` / `symbolRates` on the new rule, creates it 停用, and returns to the list; the edit modal (fixed rate matrix, settlement, effect, remark) remains for 编辑 only. The list columns are 佣金规则名称 / 关联等级 / 保底佣金比例 / 营销激励 / 自返佣 / 审核状态 / 生效状态 / 创建时间(GMT+0) / 审核通过时间 / 操作人 / 操作 (规则ID is not shown; the old 生效时间 and 更新时间 columns are gone); created and copied rules start with `auditStatus` 待审核 and `approvedAt` "-", and enabling a rule stamps 已通过 plus the approval time. The list filters rules by name, linked level, and 生效状态 — the 佣金规则名称 search box is a searchable select (`Select` + `showSearch`, one option per rule, exact-value match on the rule name, width 200 via `.config-filter-item .keyword-select`); editing an in-use rule confirms impact; copy creates a disabled `-副本` rule; disabling an in-use rule confirms; delete is blocked while agents or levels reference the rule; the related-agents drawer lists agents bound to a rule.
- Regression scope: navigation, filters/reset, modal rate validation, copy, enable/disable confirm flows, delete guards, scheduled-effect DatePicker, and the related-agents drawer.

### `commission-record-page.js`

- Role: 佣金记录 tab — 1:1 recreation of the live commission settlement records list, mounted as the second tab inside the merged 佣金管理 view (no standalone menu entry; the old `commissionRecords` page key is gone).
- Registers: `app.CommissionRecordPage`.
- Depends on: `React`, `antd`; receives `records` (from `app.mockData.commissionRecords`), `distributions` (from `app.mockData.commissionDistributions`), and `levels` (agent level names) as props from the composition root.
- Behavior: draft/applied filter split — primary row shows 订单号 and 品种; 更多筛选 expands 结算状态 (未结算/已结算/已驳回), 订单平仓时间 and 结算时间 date ranges; 订单号 and 品种 are searchable selects (`Select` + `showSearch`, options derived from `records`, exact-value match); filters commit on 查 询, 重置 clears both; 佣金金额 renders as a link button opening the 佣金分配明细 modal (用户ID is a searchable select of the record's distribution PIDs, 代理等级 searchable; pageSize 20 with size changer); 结算状态 renders 已结算 as a green tag and 已驳回 as a red tag, while 未结算/部分结算 render as plain text matching the live system; 操作 column renders "-"; 导 出 downloads `佣金记录管理_YYYY-MM-DD.csv`; 列设置 Popover covers the 6 optional columns (订单号/操作 fixed).
- DOM hooks: reuses `.toolbar`, `.login-log-toolbar`, `.login-log-filter-area`, `.login-log-more-row`, `.login-log-range`, `.customer-filter-item`, `.keyword-select`, `.select-input`, `.cell-link`, and the `.login-log-column-*` panel styles from `css/layout.css`; adds `.commission-detail-filters` (in `css/layout.css`) to compact the distribution-modal filter row.
- Change when: record columns, filter semantics, distribution-modal behavior, export format, or column-settings behavior change.
- Regression scope: record navigation, filter commit/reset, more-filter toggle, commission-link modal open/filter/close, status tags, pagination, column settings, and export toast.

### `activity-page.js`

- Role: 活动管理 > 活动配置 page — community activity list with multilingual create/edit modal.
- Registers: `app.ActivityPage`.
- Depends on: `React`, `antd`; receives `activities` / `setActivities` (from `app.mockData.communityActivities`) and `onViewSignups(id)` from the composition root; follows the `confirmAction` Modal.confirm `ref.destroy()` pattern.
- DOM hooks (styled in `css/layout.css`): the create/edit drawer's 基础信息 and 详情内容 tab panels render their 活动基础信息 / 活动名称与摘要多语言 / 详情内容多语言 groups as bordered cards using the shared `.drawer-form-card` class.
- Regression scope: activity navigation, list actions, create/edit/copy modal flows, and the `onViewSignups` jump that prefills the signup list.

### `activity-application-page.js`

- Role: 活动管理 > 报名列表 page — activity signup records with activity-ID and keyword filters plus column settings.
- Registers: `app.ActivityApplicationPage`.
- Depends on: `React`, `antd`; receives `applications` (from `app.mockData.activityApplications`), `presetActivityId`, and `onClearPreset` from the composition root (jump-from-activity prefill consumed once via effect).
- Regression scope: signup navigation, activity-ID/keyword filters and reset, column settings, pagination, and the preset filter applied when arriving from 活动配置.

### `point-details-page.js`

- Role: 激励中心 > 积分明细 page — read-only points ledger with keyword/source filters, column settings, and pagination.
- Registers: `app.PointDetailsPage`.
- Depends on: `React`, `antd`; receives `details` (from `app.mockData.pointDetails`) as a prop from the composition root.
- Behavior: columns mirror the 积分配置 list: fixed first column 用户ID (`userId`, 8-digit string, stable per user across rows), then 类型 (Tag: 课程任务 / 普通任务-新手 by `taskType` / 普通任务), 内部规则名称 (`refName`, "--" for course rows), 课程信息 (`courseName`, "--" for normal rows — 内部规则名称/课程信息 are mutually exclusive by 任务类型), 积分明细 (`change`, green for +/red for -), 获取时间(GMT+0) (`time`); the old 明细ID/用户/邮箱/积分变动/变动后余额/来源 columns are gone. Mock rows carry `ruleType` + `taskType` (+ `courseName` on course rows). Keyword filter matches 用户ID/内部规则名称; 来源 Select filters by `source` (still functional even though 来源 is no longer a column).
- Change when: ledger columns, filter semantics, or column-settings behavior change.
- Regression scope: navigation, keyword/source filter commit/reset, column settings, and pagination.
- Mock data: `pointDetails` rows carry `userId` (stable per 用户), `id`, `user` (姓名, no longer displayed), `email`, `change`, `balance`, `source`, `refName`, `time`.

### `role-settings-page.js`

- Role: mirrors the live `设置 > 角色管理设置` area.
- Registers: `app.RoleSettingsPage`.
- Depends on: `React`, `antd`, and `app.mockData.roleSettings` passed from the composition root.
- Behavior: lists role name, parent role, and permissions with column settings; searches by role name. The add/edit right-side drawer collects the role name and a nested permission-configuration tree. It supports adding, editing, deleting, and adding child roles. Deleting a role detaches its direct children from that parent and unlinks users of that role.
- Regression scope: role navigation, keyword search, add/edit drawer, permission selection, column settings, child-role creation, and deletion.

### `user-settings-page.js`

- Role: mirrors the live `设置 > 用户设置管理` list.
- Registers: `app.UserSettingsPage`.
- Depends on: `React`, `antd`, and `app.mockData.userSettings` passed from the composition root.
- Behavior: lists and filters users by keyword, role, and status (default 启用) with reset; columns cover 姓名 / 角色 / 层级 / 邮箱 / 电话 / 市/区 / 注册时间(GMT+0). The add/edit modal collects 姓名 / 邮箱 / 电话 / 市/区 / 角色 / 层级（占位）/ 地址 / 状态 plus a display-only password field with copy. Row actions include editing and a confirmed password reset.
- Regression scope: user navigation, search/reset, add/edit modal validation and save, role and status filters, and the password-reset confirmation.

### `global-nav.js`

- Role: header global page search (fuzzy match + favorites) and the open-page tab strip; both share the single top header row (tabs left, search right).
- Registers: `app.buildNavIndex(menuItems)`, `app.GlobalSearch`, `app.PageTabs`.
- Depends on: `React`, `antd` (`Select`, `Tabs`, `Button`, `Dropdown`).
- Consumers: `antd-app.js` AdminApp — builds the nav index from `menuItems`, renders the header as one row (`PageTabs` inside `.page-tabbar-wrap` on the left, `GlobalSearch` inside the header `Space` on the right), and owns the `openTabs` state plus close / close-others / close-all handlers.
- Behavior: `buildNavIndex` recursively flattens enabled menu leaves into `{ key, label, path, keywords }` — the sidebar is up to three levels deep (e.g. 代理管理 / 代理关系管理 / 代理商列表) and `path` joins every ancestor label; disabled leaves are skipped; fuzzy scoring ranks exact prefix > substring > subsequence (streak bonus), multi-term queries are AND-matched, and label hits get a boost; with an empty query the dropdown groups 已收藏 (favorites) above 全部页面; the star toggles a favorite persisted to `localStorage` key `ib-admin-favorite-pages` (try/catch for file://); Ctrl/⌘+K focuses the search input; selecting an option navigates and clears the keyword. `PageTabs` renders an `editable-card` Tabs where the `overview` home tab is pinned non-closable, every visited page is appended once, closing the active tab activates its right/left neighbor (fallback `overview`), and a `···` dropdown offers 关闭其他标签页 / 关闭全部标签页.
- DOM hooks (classes, styled in `css/layout.css`): `.global-search`, `.gs-suffix`, `.gs-option`, `.gs-star` (`.is-fav`), `.gs-option-main`, `.gs-option-label`, `.gs-option-path`, `.page-tabbar-wrap`, `.page-tabbar`, `.tab-close-icon`, `.tabbar-more`.
- Change when: fuzzy matching or favorites behavior, tab lifecycle rules, keyword aliases, or the nav-index source (which menu leaves are navigable) change.
- Regression scope: search filtering and empty-state groups, favorite toggle with persistence, select-to-navigate, Ctrl/⌘+K focus, tab open-on-visit / switch / ✕ close with neighbor activation, 关闭其他 / 关闭全部, the pinned overview tab, and sidebar menu navigation.

### `antd-app.js`

- Role: composition root — mounts `#root` with ConfigProvider theme, the Layout shell (Sider + header tab strip + Content), and routes every page key to its component.
- Registers: nothing on `window.AdminApp`; consumes `app.*` pages and `app.buildNavIndex` / `app.GlobalSearch` / `app.PageTabs`.
- Depends on: `React`, `ReactDOM`, `antd`, and every page module plus `global-nav.js`.
- Behavior: `menuItems` mirrors the live GinX sidebar — 10 top groups (客户管理 / 特殊客户 / 订单管理 / 内容管理 / 市场活动 / 资金管理 / 代理管理 / 高手管理 / 品种 / 设置), up to three levels deep (代理关系管理 and 佣金配置管理 are nested submenus under 代理管理). One intentional local deviation: the 市场活动 and 激励中心 groups render above 代理管理 (right after 资金管理), unlike the live sidebar order. The source's 流水管理 group is folded into 资金管理 (资金流水 sits after 资金管理), so that standalone group does not exist here. 佣金记录管理 is likewise folded in: the 代理管理 group has a single 佣金管理 leaf whose view mounts a Tabs wrapper — 佣金配置 tab renders `CommissionPage`, 佣金记录 tab renders `CommissionRecordPage` — so the old `commissionRecords` page key no longer exists anywhere (menu, tabs, or search aliases). Leaves with an implemented page are enabled; everything else carries `disabled: true` so it renders grayed and unclickable. The admin-only 用户登录日志 stays as an extra enabled leaf under 客户管理. Labels follow the live system (客户管理 / 积分 / 活动管理 / 投递管理 / 佣金配置列表), so tab and search labels change with the menu. `defaultOpenKeys` lists every top group plus the two nested subgroups so the active item is always visible. 积分明细 is a standalone leaf under 激励中心 (parallel to 积分配置) rather than a hidden page — the ledger is incentive-center-wide and not subordinate to the rule-config page. The standalone 课程管理 page (and its 章节管理 hidden page) has been removed from 激励中心; course data (`courses` / `courseLessons`) survives only as 积分配置 课程任务 storage. `hiddenNavPages` (报名列表) remains the source of tab titles for pages outside the sidebar. The rule drawer (RuleDrawer) mirrors the activity-page modal chrome: a two-line title block (bold 新增/修改/复制规则 + secondary hint 请选择任务类型页签并完善对应配置) over a two-pane Tabs body (日常任务 first, 课程任务 second; 新增 opens on 日常任务, rules with ruleType 课程任务 open on 课程任务) — 日常任务 keeps the original normal-rule form laid out like the legacy system, sections in order 基础信息 (required 内部规则名称 + 任务类型(全部/新手任务)) → 展示与多语言 (language tabs + 外部名称/规则说明) → 触发条件 + 达成条件 + 条件关系 + 规则逻辑 preview → 奖励 (奖励类型/奖励值) → 循环与时间 laid out like the live system (循环次数(循环/单次, required) + 循环周期(不限/按天, required) + 周期内可触发日期(周一~周日 multi-select) in one row, then an always-visible 总任务生效时间 RangePicker, saved into `cycleCount` / `cyclePeriod` / `triggerDates` / `timeRange`)), while 课程任务 recreates the course-management drawer fields with horizontal multilingual tabs (英语/+添加语言 shared with 日常任务's language state; switching languages relabels and clears 课程名称/课程简介; saving uses the active language for `externalName` and course title) — 课程名称/课程简介 in one horizontal row under the language tabs, then a 触发条件 section (触发事件 select defaulting to 课程, saved into the rule's `triggerEvent`), then 章节视频 (a `courseLessons` Form.List with mock upload), and finally a 奖励 section (奖励类型 XP/金币 + 奖励值, same `rewardType`/`rewardValue` fields as 日常任务; saved into the rule's `rewardXp`/`rewardDrop` and the course's `rewardXp`); the active tab decides the saved rule type (no 规则类型 radio anymore — editing a rule with `ruleType: "课程任务"` opens the 课程任务 tab prefilled from the linked course). Saving a 课程任务 upserts the course + lessons into `courses`/`courseLessons` (edit updates the linked course, add/copy creates a new 草稿 course), then saves the rule with `ruleType: "课程任务"` + `courseId`/`courseName` and `triggerEvent` from the course tab's 触发事件 select (defaults to 课程; the list column shows "--" for course rules). The rules list columns are fixed-order via `visibleColumns` + `columnMap`: 类型 (普通任务 / 普通任务-新手 by `taskType` / 课程任务), 内部规则名称 (no sorter; "--" for course rules), 外部规则名称 ("--" for course rules), 课程信息 (course name only; "--" for normal rules), 触发事件 ("--" for course rules), 奖励, 规则状态, 操作人, then the fixed 操作 column — the old 循环周期/任务类型/总任务生效时间 columns are gone. Every row is clickable (button clicks excluded) and opens `RuleDetailDrawer`, a read-only drawer showing the rule's full configuration (类型/名称/任务类型/课程信息 with 课程名称/简介/每讲XP/章节列表 for course rules/触发事件/达成条件 stored from the drawer's `conditions`+`relation`/循环周期/生效时间/奖励/状态/操作人). Mock rules carry `operator: "Bella"`; new rules default 操作人 Bella; the rules array leads with the 课程任务 example (完成新手村课程) so the list opens with a course rule first, followed by the full-field daily-task example (模拟盘交易激励). The rules list paginates at a default of 20 rows per page.
- Change when: adding/removing a page, renaming a menu label, changing group nesting, or flipping a placeholder leaf to enabled.
- Regression scope: sidebar rendering and active state, disabled-leaf click safety, nested submenu expansion, navigation to every enabled page, tab labels, and global-search paths.

### `toast.js`

- Role: shared transient notification service.
- Registers: `app.Toast`.
- Depends on: `app.dom.$`.
- Consumers: `app.js` creates one instance and injects it into Managers, Modals, and AppShell.
- DOM hooks: `#toast`.
- Change when: toast behavior, selector, timing, or shared notification API changes.
- Regression scope: all toast trigger points in rule, delivery, navigation, import/export/clear, upload, search, reset, and status actions.

### `confirm-dialog.js`

- Role: shared confirmation dialog service.
- Registers: `app.ConfirmDialog`.
- Depends on: `app.dom.$`.
- Consumers: `app.js` creates one instance and injects it into Managers and Modals.
- DOM hooks: `#confirmOverlay`, `#confirmTitle`, `#confirmBody`, `#closeConfirmBtn`, `#cancelConfirmBtn`, `#okConfirmBtn`.
- Public methods: `init()`, `ask(title, body, action)`, `close()`.
- Change when: shared confirmation lifecycle, copy slots, buttons, or callback behavior changes.
- Regression scope: rule save/enable/disable and delivery save/enable/void confirmations.

### `rule-modal.js`

- Role: point rule add/edit/copy modal, including dynamic form sections and validation.
- Registers: `app.RuleModal`.
- Depends on: `app.dom.$`; receives `state`, `toast`, `confirm`, and `onSave` by constructor injection.
- Consumer: `RuleManager`.
- DOM scope: `#ruleOverlay` and rule modal controls such as `#internalName`, `#taskType`, `#rewardXp`, `#rewardDrop`, `#triggerEvent`, `#eventParam`, `#accountType`, `#jumpType`, `#mediaMode`, `#languageTabs`, `#cyclePeriod`, `#startTime`, `#endTime`.
- Public methods: `init()`, `open(mode, rule)`, `close()`, `collectForm()`, `save()`, `syncTriggerDefaults()`, `syncJumpType()`, `syncMediaMode()`, `syncCyclePeriod()`, `renderLanguageTabs()`.
- Behavior: pre-fills modal data, simulates upload, manages language tabs, changes fields based on trigger/jump/media/cycle choices, validates XP/金币, and asks for confirmation before saving.
- Change when: rule form fields, validation, prefill, copy/edit/add behavior, dynamic visibility, language handling, or collected rule data changes.
- Regression scope: add, edit, copy, reward validation, dynamic trigger fields, cycle date visibility, language tabs, upload mock, and save confirmation.

### `rule-manager.js`

- Role: point rule list view controller.
- Registers: `app.RuleManager`.
- Depends on: `app.dom.$`, `app.dom.$$`, `app.utils.escapeHtml`, `app.renderPagination`, `app.RuleModal`.
- Consumer: `app.js`.
- DOM scope: `#rulesBody`, `#pagination`, `#ruleKeyword`, `#statusFilter`, `#columnPanel`, `#addRuleBtn`, `#columnBtn`, `#searchBtn`, `#resetBtn`, sortable table headers, and `[data-toggle-column]`.
- Public methods: `init()`, `render()`, `filteredRules()`, `syncColumnVisibility()`, `handleRuleAction(event)`, `saveRule(data, editingId, title)`.
- Behavior: owns rule list state, search/reset, status filter, sorting, pagination, column visibility, row actions, status enable/disable, and integration with `RuleModal`.
- Change when: point rule table fields, filters, sorting, pagination, column settings, row actions, or rule save behavior changes.
- Regression scope: search, reset, sorting, pagination, column settings, enable/disable, add/edit/copy save results.

### `delivery-modal.js`

- Role: delivery create/edit modal, cascader object selection, automatic/manual form switching, and mocked import/export/clear actions.
- Registers: `app.DeliveryModal`.
- Depends on: `app.dom.$`, `app.dom.$$`, `app.utils.escapeHtml`; receives `data`, `options`, `toast`, `confirm`, and `onSave` by constructor injection.
- Consumer: `DeliveryManager`.
- DOM scope: `#createMask`, `#deliveryModalTitle`, `#deliveryNameInput`, `#deliveryCascader`, `#deliveryValue`, `#secondCol`, `#thirdCol`, `#couponBox`, `#bonusBox`, `#pointsBox`, `#deliveryMethod`, `#autoSection`, `#manualSection`, `#eventSelect`, `#paramLabel`, `#probabilityInput`, `#pointValueLabel`, date inputs, count/amount inputs, and manual user controls.
- Public methods: `init()`, `open(mode, item)`, `close()`, `renderCascader(type, secondIndex, thirdIndex)`, `resetSelection()`, `selectedObject()`, `confirmDelivery()`, `handleCascaderClick(event)`, `syncEventParam()`, `syncDeliveryMethod()`.
- Behavior: pre-fills delivery fields, renders two/three-level object cascader, toggles automatic/manual sections, assembles delivery list/detail data, escapes dynamic pill values, and confirms before saving.
- Change when: delivery form fields, cascader data consumption, automatic/manual behavior, save payload, import/export/clear mocks, or modal lifecycle changes.
- Regression scope: create, edit, cascader selection, automatic/manual switch, event parameter copy, import/export/clear mocks, and save confirmation.

### `delivery-manager.js`

- Role: delivery list view controller and detail drawer controller.
- Registers: `app.DeliveryManager`.
- Depends on: `app.dom.$`, `app.utils.escapeHtml`, `app.renderPagination`, `app.DeliveryModal`.
- Consumer: `app.js`.
- DOM scope: `#deliveryBody`, `#deliveryPagination`, `#deliveryKeyword`, `#deliveryObjectFilter`, `#deliveryStatusFilter`, `#openCreate`, `#moreDeliveryFilter`, `#searchDeliveryBtn`, `#resetDeliveryBtn`, `#closeDetail`, `#drawerMask`, `#detailDrawer`, and detail field ids.
- Public methods: `init()`, `render()`, `handleAction(event)`, `save(itemData, editingId)`, `showDetail(id)`, `hideDetail()`.
- Behavior: owns delivery list state, search/reset, object/status filters, pagination, create/edit modal integration, enable/void actions, and detail drawer display.
- Change when: delivery table fields, filters, action rules, save behavior, or detail drawer content changes.
- Regression scope: search, reset, pagination, create/edit results, enable, void, detail drawer open/close, and detail field display.

### `app-shell.js`

- Role: page shell controller for sidebar groups, page switching, active nav state, breadcrumbs, and business module initialization.
- Registers: `app.AppShell`.
- Depends on: `app.dom.$`, `app.dom.$$`; receives breadcrumbs, toast, ruleManager, and deliveryManager by constructor injection.
- Consumer: `app.js`.
- DOM scope: `[data-nav-toggle]`, `[data-page]`, `[data-nav-group]`, `#rulesView`, `#deliveryView`, `#breadcrumb`, `#columnPanel`.
- Public methods: `init()`, `switchPage(page)`, `toggleGroup(button)`, `syncNavigation(page)`.
- Behavior: initializes rule and delivery managers, switches views, syncs sidebar active/expanded state, updates breadcrumbs, closes column panel on navigation, and shows navigation toasts.
- Change when: navigation structure, page ids, breadcrumb behavior, active state rules, or startup order changes.
- Regression scope: rules/delivery navigation, breadcrumbs, active nav state, expanded groups, hidden views, and manager initialization.

### `app.js`

- Role: application composition root.
- Registers: nothing new; it starts the app after DOM readiness.
- Depends on: all previous modules in `bootstrap.js`.
- Behavior: creates shared `Toast` and `ConfirmDialog`, creates `RuleManager` and `DeliveryManager` with mock data and shared services, creates `AppShell`, then calls `confirm.init()` and `shell.init()`.
- Change when: dependency injection wiring, startup order, shared service lifetime, or root data source changes.
- Validate: app still starts from direct `index.html` open, both business modules initialize once, and shared services are reused rather than recreated inside modules.

## Change Entry Points

```text
Shared namespace/helpers
|-- namespace.js
|-- utils.js
`-- Update all consumers if public helper names change

Pagination shared by lists
|-- pagination.js
|-- rule-manager.js
`-- delivery-manager.js

Mock data or option shape
|-- mock-data.js
|-- Related Manager render/filter/detail code
`-- Related Modal prefill/collect/save code

Point rule list
|-- rule-manager.js
|-- rule-modal.js only if modal save/prefill is affected
`-- index.html / css/tables.css when DOM or styles change

Point rule modal
|-- rule-modal.js
|-- mock-data.js only if rule data shape changes
`-- index.html / css/modals.css when DOM or styles change

Delivery list and detail drawer
|-- delivery-manager.js
|-- delivery-modal.js only if save payload is affected
`-- index.html / css/tables.css / css/modals.css when DOM or styles change

Delivery create/edit modal
|-- delivery-modal.js
|-- mock-data.js for cascader options or data shape
`-- index.html / css/modals.css when DOM or styles change

Navigation/startup
|-- app-shell.js
|-- app.js
`-- bootstrap.js only if module order changes
```

## Validation Checklist for JS Changes

```text
Static checks
|-- index.html loads only js/bootstrap.js
|-- Every file listed in bootstrap.js exists
|-- New or changed modules register onto window.AdminApp when they expose app-level APIs
|-- bootstrap.js order satisfies dependencies
`-- Browser console has no script load failures

Module checks
|-- Changed Manager: test filters, actions, pagination, empty states, and related modal integration
|-- Changed Modal: test open, prefill, dynamic fields, validation, close, confirm, and save result
|-- Changed mock-data: test all renders, filters, prefills, and details that consume changed fields
|-- Changed pagination.js: test both rule and delivery pagination
|-- Changed app-shell.js/app.js: test navigation and one-time module initialization
`-- Changed shared service/helper: regress all consumers listed above

Documentation checks
|-- This js/AGENTS.md reflects changed file responsibilities and APIs
|-- New DOM hooks are documented in the relevant file section
|-- New data fields are documented in mock-data.js and consumer sections
`-- If no doc edit was needed for a JS change, the final note says why
```

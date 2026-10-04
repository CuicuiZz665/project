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
|-- agent-page.js
|-- agent-level-page.js
|-- commission-page.js
|-- dashboard-page.js
|-- activity-page.js
|-- activity-application-page.js
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
- Registers: `app.mockData.breadcrumbs`, `app.mockData.rules`, `app.mockData.deliveries`, `app.mockData.agentLevels`, `app.mockData.commissionRules`, `app.mockData.agents`, `app.mockData.customers`, `app.mockData.loginLogs`, `app.mockData.customerServices`, `app.mockData.dashboard`, `app.mockData.communityActivities`, `app.mockData.activityApplications`, `app.mockData.roleSettings`, `app.mockData.userSettings`, `app.mockData.cascaderOptions`.
- Depends on: `namespace.js`.
- Consumers: `app.js`, Managers, Modals, and detail displays.
- Data shape:
  - Rule rows use fields such as `id`, `internalName`, `externalName`, `triggerEvent`, `cyclePeriod`, `rewardXp`, `rewardDrop`, `taskType`, `timeRange`, `status`, `canEdit`.
  - Delivery rows use fields such as `id`, `key`, `name`, `object`, `objectDetail`, `method`, `count`, `status`, `start`, `end`, `event`, `param`, `operator`.
  - Customer rows use fields such as `id`, `name`, `account`, `status`, `level`, `riskLevel`, `region`, `phone`, and `accounts`.
  - Login log rows use `id`, `requestId`, `userId`, `latest` (`是` / `否`), `ip`, `country`, `ua`, `method`, and `loginAt` (`YYYY-MM-DD HH:mm:ss`).
  - Agent rows use fields such as `id`, `userId`, `agentId`, `level`, `parentAgentId`, `userType`, `commissionRuleId`, `commissionRuleName`, `commissionStatus`, `protection`, `teamCount`, `teamHoldings`, `createdAt`, and `selfCommissionEnabled`.
  - Agent level rows use `id`, `name`, `color`, `sort`, `status`, `isDefault`, `upgrade` (`match` / `directCustomers` / `teamMembers` / `netDeposit` / `teamLots`), `rebateRate`, `marketingRate`, `protectionDays`, `commissionRuleId`, and `remark`; `agents[].level` is matched by level `name` to derive per-level agent counts.
  - Commission rule rows use `id`, `name`, `levelId`, `levelName`, `status`, `rates` (`contract` / `contractTrader` / `contractApi` / `contractTraderApi` / `spot` / `spotTrader` / `spotApi` / `spotTraderApi`), `marketingRate`, `selfCommission`, `settleCycle`, `settleCoin`, `effectiveType`, `effectiveAt`, `updatedAt`, `operator`, and `remark`; `agents[].commissionRuleId` links agents to rules.
  - Cascader options are keyed by delivery type and include `text`, `second`, and `third`.
  - Dashboard metrics provide per-key `value` / `change` / `note`; `tradingLots` and `tradingAmount` have no card of their own and feed the trading-customers card subtitle on `dashboard-page.js`.
- Change when: initial business examples, option lists, default breadcrumbs, or data fields change.
- Regression scope: list rendering, modal prefill, save output, filters, and detail drawer fields that read changed data.

### `login-log-page.js`

- Role: 用户登录日志 page — login log list recreated 1:1 from the live-system prototype (filters, columns, tags, export, pagination).
- Registers: `app.LoginLogPage`.
- Depends on: `React`, `antd`, `dayjs` (RangePicker values); receives `logs` (from `app.mockData.loginLogs`) as a prop from the composition root.
- Behavior: draft/applied filter split — keyword / 是否最新 / 国家 / 登录方式 / 登录时间(GMT+0) range in the primary row, 用户 ID / 请求 ID / IP / User Agent in the toggleable 更多筛选 row; filters commit on 搜 索 or Enter (`onPressEnter`), 重置 clears both states and restores pageSize 20; ID and 用户 ID render as link buttons that copy with a toast; 请求 ID and IP render monospace; User Agent truncates with a `title` tooltip; 是否最新 and 登录方式 render colored tags; 导 出 downloads a BOM CSV of the filtered rows named `用户登录日志_YYYY-MM-DD.csv` with a success toast; 列设置 toggles the eight non-ID columns via Dropdown + Checkbox.Group.
- DOM hooks (classes, styled in `css/layout.css`): `.login-log-page`, `.login-log-toolbar`, `.login-log-filter-area`, `.login-log-more-row`, `.login-log-range`, `.mono-cell`, `.ua-cell`, `.cell-link`.
- Change when: login-log columns, filter semantics, export format, or column-settings behavior change.
- Regression scope: login-log navigation, filter commit on search/Enter, more-filter toggle, reset, date-range filtering, pagination total and pageSize, column settings, export toast, empty state, and the customer/agent pages that share `.customer-filter-item` / `.keyword-input` / `.select-input` toolbar styles.

### `agent-page.js`

- Role: proxy relationship agent list with per-agent self-commission switches.
- Registers: `app.AgentPage`.
- Depends on: `React`, `antd`, and `app.mockData.agents`.
- Behavior: renders the agent list with the requested compact columns, shows the screenshot-style structure table from "查看结构" with commission rule ID and team metrics moved out of the list, filters by user/agent ID, level, and self-commission status, confirms enabling, and applies the switch to one agent only.
- Data shape: reads `selfCommissionEnabled` from agent rows; changes are held in local UI state until an API is connected.
- Regression scope: agent navigation, compact list columns, structure modal detail display, filters, switch enable/disable/cancel behavior, and pagination.

### `agent-level-page.js`

- Role: 代理等级配置 page — agent level definitions with upgrade conditions, benefits, protection, and linked commission rule.
- Registers: `app.AgentLevelPage`.
- Depends on: `React`, `antd`; receives `levels` / `setLevels` (from `app.mockData.agentLevels`), `rules` (commission rules), and `agents` (for per-level agent counts) as props from the composition root.
- Behavior: filters levels by name and status; create/edit modal covers name (unique), color, upgrade conditions (match mode + four thresholds), rebate/marketing rates, protection days, linked commission rule, and remark; editing a level with agents confirms impact; deleting is blocked for the default level and for levels holding agents; move up/down swaps `sort`; set-default confirms; the status switch blocks the default level and confirms disabling a level that still holds agents.
- Regression scope: navigation, filters/reset, create/edit modal validation and confirm flows, delete guards, move up/down, set default, status toggle, and linked-rule display.

### `commission-page.js`

- Role: 佣金配置管理 page — commission rules with a fixed per-product/per-channel rate matrix, settlement, and related-agent lookup.
- Registers: `app.CommissionPage`.
- Depends on: `React`, `antd`, `dayjs`; receives `rules` / `setRules` (from `app.mockData.commissionRules`), `levels` (agent levels), and `agents` as props from the composition root.
- Behavior: filters rules by name/ID, linked level, and status; create/edit modal covers the fixed rate matrix (合约/现货 × 全部/Trader/API/Trader&API) plus marketing rate, settlement cycle/coin, self-commission, and immediate/scheduled effect (DatePicker); saving an in-use rule confirms impact; copy creates a disabled `-副本` rule; disabling an in-use rule confirms; delete is blocked while agents or levels reference the rule; the related-agents drawer lists agents bound to a rule.
- Regression scope: navigation, filters/reset, modal rate validation, copy, enable/disable confirm flows, delete guards, scheduled-effect DatePicker, and the related-agents drawer.

### `activity-page.js`

- Role: 活动管理 > 活动配置 page — community activity list with multilingual create/edit modal.
- Registers: `app.ActivityPage`.
- Depends on: `React`, `antd`; receives `activities` / `setActivities` (from `app.mockData.communityActivities`) and `onViewSignups(id)` from the composition root; follows the `confirmAction` Modal.confirm `ref.destroy()` pattern.
- Regression scope: activity navigation, list actions, create/edit/copy modal flows, and the `onViewSignups` jump that prefills the signup list.

### `activity-application-page.js`

- Role: 活动管理 > 报名列表 page — activity signup records with activity-ID and keyword filters plus column settings.
- Registers: `app.ActivityApplicationPage`.
- Depends on: `React`, `antd`; receives `applications` (from `app.mockData.activityApplications`), `presetActivityId`, and `onClearPreset` from the composition root (jump-from-activity prefill consumed once via effect).
- Regression scope: signup navigation, activity-ID/keyword filters and reset, column settings, pagination, and the preset filter applied when arriving from 活动配置.

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
- Behavior: `buildNavIndex` flattens enabled menu leaves into `{ key, label, path, keywords }` with per-page keyword aliases; fuzzy scoring ranks exact prefix > substring > subsequence (streak bonus), multi-term queries are AND-matched, and label hits get a boost; with an empty query the dropdown groups 已收藏 (favorites) above 全部页面; the star toggles a favorite persisted to `localStorage` key `ib-admin-favorite-pages` (try/catch for file://); Ctrl/⌘+K focuses the search input; selecting an option navigates and clears the keyword. `PageTabs` renders an `editable-card` Tabs where the `overview` home tab is pinned non-closable, every visited page is appended once, closing the active tab activates its right/left neighbor (fallback `overview`), and a `···` dropdown offers 关闭其他标签页 / 关闭全部标签页.
- DOM hooks (classes, styled in `css/layout.css`): `.global-search`, `.gs-suffix`, `.gs-option`, `.gs-star` (`.is-fav`), `.gs-option-main`, `.gs-option-label`, `.gs-option-path`, `.page-tabbar-wrap`, `.page-tabbar`, `.tab-close-icon`, `.tabbar-more`.
- Change when: fuzzy matching or favorites behavior, tab lifecycle rules, keyword aliases, or the nav-index source (which menu leaves are navigable) change.
- Regression scope: search filtering and empty-state groups, favorite toggle with persistence, select-to-navigate, Ctrl/⌘+K focus, tab open-on-visit / switch / ✕ close with neighbor activation, 关闭其他 / 关闭全部, the pinned overview tab, and sidebar menu navigation.

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
- Behavior: pre-fills modal data, simulates upload, manages language tabs, changes fields based on trigger/jump/media/cycle choices, validates XP/Drop, and asks for confirmation before saving.
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

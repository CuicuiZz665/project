# Source Analysis

Analyzed on 2026-08-31.

Source file: `/Users/amy/Downloads/原型文件/积分投递合并.html`

## Scale

- Total length: 1126 lines.
- CSS: one inline `<style>` block from line 7 to line 271.
- HTML body: static app shell and modal/drawer markup from line 274 to line 501.
- JavaScript: one inline `<script>` block from line 503 to line 1124.

## Page Structure

The prototype is a single admin page with two switchable views:

- `#rulesView`: 积分获取设置.
- `#deliveryView`: 投递管理 / 投递列表.

Shared shell:

- `.app`, `.sidebar`, `.main`.
- sidebar navigation uses `[data-page="rules"]` and `[data-page="delivery"]`.
- breadcrumb is `#breadcrumb`.
- page switching is controlled by `switchPage(page)`.

Shared overlays and services:

- `#confirmOverlay`, `#confirmTitle`, `#confirmBody`, `#okConfirmBtn`.
- `#toast`.

Rules view:

- Filters: `#ruleKeyword`, `#statusFilter`, `#searchBtn`, `#resetBtn`.
- Actions: `#addRuleBtn`, `#columnBtn`.
- Column settings popover: `#columnPanel` and `[data-toggle-column]`.
- Table body: `#rulesBody`.
- Pagination: `#pagination`.
- Rule modal overlay: `#ruleOverlay`.

Rule modal key fields:

- base: `#internalName`.
- reward/task: `#taskType`, `#rewardXp`, `#rewardDrop`.
- trigger: `#triggerEvent`, `#eventParam`, `#accountType`.
- display/languages: `#jumpType`, `#jumpTargetField`, `#jumpTarget`, `#mediaMode`, `#uploadField`, `#uploadBox`, `#languageTabs`, `#externalName`, `#ruleDesc`, `#popupText`.
- cycle/time: `#cycleCount`, `#cyclePeriod`, `#triggerDatesField`, `#startTime`, `#endTime`.

Delivery view:

- Notice plus filter card.
- Filters: `#deliveryKeyword`, `#deliveryObjectFilter`, `#deliveryStatusFilter`, `#searchDeliveryBtn`, `#resetDeliveryBtn`, `#moreDeliveryFilter`.
- Create action: `#openCreate`.
- Table body: `#deliveryBody`.
- Delivery create/edit modal: `#createMask`.
- Detail drawer: `#drawerMask`, `#detailDrawer`, `#closeDetail`, `#detailName`, `#detailObject`, `#detailMethod`, `#detailCount`, `#detailStart`, `#detailEnd`, `#detailEvent`, `#detailParam`, `#detailStatus`, `#detailOperator`.

Delivery modal key fields:

- `#deliveryModalTitle`, `#deliveryNameInput`.
- cascader: `#deliveryCascader`, `#deliveryValue`, `#secondCol`, `#thirdCol`, `[data-type]`, `[data-second]`, `[data-third]`.
- dynamic boxes: `#couponBox`, `#bonusBox`, `#pointsBox`.
- bonus fields: `#bonusAmountInput`, `#bonusCountInput`, `#bonusProbInput`.
- points fields: `#pointValueLabel`, `#pointAmountInput`, `#pointCountInput`, `#paramLabel`, `#probabilityInput`.
- method/conditions: `#deliveryMethod`, `#autoSection`, `#manualSection`, `#eventSelect`.
- manual fields: `#manualUserIds`, `#importUsersBtn`, `#exportTemplateBtn`, `#clearUsersBtn`.
- submit: `#confirmDeliveryBtn`.

## JavaScript Responsibilities

Shared utilities:

- `$`, `$$`.
- `escapeHtml(value)`.
- `showToast(message)`.
- confirmation flow via `confirmAction`, `askConfirm(title, body, action)`, and `closeConfirm()`.

App shell:

- `breadcrumbs`.
- `switchPage(page)`.
- startup calls: `renderRules()`, `renderDeliveryRows()`, `syncDeliveryMethod()`.

Rules data/state:

- `rules`: mock rules array.
- `ruleState`: editing id, pagination, sorting, visible columns, language state.
- `ruleEls`: cached DOM references.

Rules functions:

- rendering: `rewardHtml`, `ruleActionHtml`, `filteredRules`, `cell`, `syncColumnVisibility`, `renderRules`, `renderRulePagination`.
- modal/form: `clearRewardError`, `syncTriggerDefaults`, `syncJumpType`, `syncMediaMode`, `syncCyclePeriod`, `renderLanguageTabs`, `openRuleModal`, `closeRuleModal`, `collectRuleForm`, `saveRule`.
- event handling: add/edit/copy/enable/disable, column toggles, sorting, filters, pagination, language tab add/remove/switch, upload mock.

Delivery data/state:

- `deliveries`: mock delivery tasks.
- `deliveryState`: editing id and cascader selection indexes.
- `deliveryEls`: cached DOM references.
- `cascaderOptions`: coupon, bonus, and points options.

Delivery functions:

- rendering: `renderDeliveryRows`, `deliveryActionHtml`.
- modal/cascader: `renderCascader`, `resetDeliverySelection`, `openDeliveryModal`, `closeDeliveryModal`, `selectedDeliveryObject`, `confirmDelivery`.
- detail drawer: `showDetail`, `hideDetail`.
- conditions: `syncDeliveryMethod`.
- event handling: create/edit/enable/void/detail, cascader clicks, auto/manual switching, import/export/clear user mock, filters.

## CSS Responsibilities

The inline CSS already groups naturally:

- tokens/base: `:root`, universal box sizing, body, form elements.
- layout/shell: `.app`, `.sidebar`, `.brand`, `.nav`, `.main`, `.topbar`, `.workspace`, `.view[hidden]`.
- filters/actions: `.filter-card`, `.filter-bar`, `.notice`, `.filters`, `.actions`, `.inline`, `.input*`, `.select`, `.btn*`.
- tables: `.table-wrap`, `.table-card`, tables, sortable headers, delivery table, status/tag/pill/reward styles, row actions, pagination.
- modals/forms: `.panel-popover`, `.overlay`, `.mask`, `.modal*`, `.section-title`, `.form-grid`, `.field`, `.radio-row`, `.language-card`, `.condition-card`, `.manual-box`, `.dynamic-box`, `.tabs`, `.tab`, `.upload-box`, confirm body.
- delivery-specific modal: `.date-row`, `.cascader*`, `.manual-actions`.
- drawer/toast: `.drawer-mask`, `.detail-drawer`, `.detail-*`, `.toast`.

## Recommended Class Boundaries

- `AppShell`: owns startup, navigation, breadcrumbs, cross-feature services.
- `Toast`: owns `#toast`.
- `ConfirmDialog`: owns confirm overlay and callback lifecycle.
- `RuleManager`: owns rules list state, filters, table, columns, pagination, actions.
- `RuleModal`: owns rule form state and returns collected form data.
- `DeliveryManager`: owns delivery table, filters, detail drawer, lifecycle actions.
- `DeliveryModal`: owns delivery form, cascader, automatic/manual mode, and returns collected delivery data.

Keep mock data separate so later work can replace it with API calls without rewriting UI classes.

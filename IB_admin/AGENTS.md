# AGENTS.md

Modular handoff guide for AI agents working on this project. This is a small static admin prototype: open `index.html` directly from the project root to preview it. Modular management and modular development rely on browser-native dynamically loaded files under `js/`. Do not use Node, npm, bundlers, transpilers, or framework runtimes.

## Project Map

```text
admin/
|-- index.html                 # Static shell: page structure, business containers, modal/drawer DOM, CSS links, bootstrap entry
|-- css/
|   |-- tokens.css             # Global variables, base typography, forms, buttons, shared filter areas
|   |-- layout.css             # App layout, sidebar, topbar, workspace, view show/hide behavior
|   |-- tables.css             # Tables, pagination, tags, reward pills, row actions
|   `-- modals.css             # Modals, masks, confirm dialog, drawer, cascader, dynamic form blocks, toast
`-- js/
    |-- bootstrap.js           # Only script entry: dynamically injects all JS files below in order
    |-- namespace.js           # Creates the window.AdminApp global namespace
    |-- utils.js               # app.dom / app.utils: DOM queries, HTML escaping, shared helpers
    |-- mock-data.js           # mockData: breadcrumbs, point rules, delivery tasks, cascader options
    |-- toast.js               # Shared Toast notification service
    |-- confirm-dialog.js      # Shared ConfirmDialog service
    |-- rule-modal.js          # RuleModal: add/edit/copy point rule modal and dynamic fields
    |-- rule-manager.js        # RuleManager: point rule list, filters, sorting, pagination, column settings, status actions
    |-- delivery-modal.js      # DeliveryModal: delivery add/edit modal, cascader, automatic/manual form sections
    |-- delivery-manager.js    # DeliveryManager: delivery list, filters, enable/void actions, detail drawer
    `-- app-shell.js           # AppShell: page switching, breadcrumbs, business module initialization
```

## Startup Chain

```text
index.html
`-- <script src="js/bootstrap.js">
    `-- bootstrap.js loads in order
        namespace.js
        utils.js
        mock-data.js
        toast.js
        confirm-dialog.js
        rule-modal.js
        rule-manager.js
        delivery-modal.js
        delivery-manager.js
        app-shell.js
        app.js
            `-- new Toast / ConfirmDialog / RuleManager / DeliveryManager / AppShell
                `-- confirm.init()
                `-- shell.init()
                    |-- ruleManager.init()
                    `-- deliveryManager.init()
```

Load order matters. When adding a JS file, first identify which `window.AdminApp` members it depends on, then insert the file into the proper position in `js/bootstrap.js`. Do not switch to ES module imports, and do not introduce a loading method that requires a local server or build tooling.

## Module Responsibility Tree

```text
window.AdminApp
|-- dom
|   |-- $(selector, root)
|   `-- $$(selector, root)
|-- utils
|   `-- escapeHtml(value)
|-- mockData
|   |-- breadcrumbs
|   |-- rules
|   |-- deliveries
|   `-- cascaderOptions
|-- Toast
|   `-- show(message)
|-- ConfirmDialog
|   |-- init()
|   |-- ask(title, body, action)
|   `-- close()
|-- AppShell
|   |-- init()
|   `-- switchPage(page)
|-- RuleManager
|   |-- init()
|   |-- render()
|   |-- filteredRules()
|   |-- syncColumnVisibility()
|   |-- handleRuleAction(event)
|   |-- handlePagination(event)
|   `-- saveRule(data, editingId, title)
|-- RuleModal
|   |-- init()
|   |-- open(mode, rule)
|   |-- close()
|   |-- collectForm()
|   |-- save()
|   |-- syncTriggerDefaults()
|   |-- syncJumpType()
|   |-- syncMediaMode()
|   |-- syncCyclePeriod()
|   `-- renderLanguageTabs()
|-- DeliveryManager
|   |-- init()
|   |-- render()
|   |-- handleAction(event)
|   |-- save(itemData, editingId)
|   |-- showDetail(id)
|   `-- hideDetail()
`-- DeliveryModal
    |-- init()
    |-- open(mode, item)
    |-- close()
    |-- renderCascader(type, secondIndex, thirdIndex)
    |-- resetSelection()
    |-- selectedObject()
    |-- confirmDelivery()
    |-- handleCascaderClick(event)
    |-- syncEventParam()
    `-- syncDeliveryMethod()
```

## Change Entry Guide

```text
To change static page structure
`-- index.html
    |-- Check matching CSS selectors
    `-- Check matching JS id / data-* / class queries

To change global styles, buttons, forms, or colors
`-- css/tokens.css

To change the sidebar, topbar, or page switching layout
|-- index.html
|-- css/layout.css
`-- js/app-shell.js

To change the point rule list
|-- js/rule-manager.js
|-- js/mock-data.js
|-- css/tables.css
`-- #rulesView / #columnPanel in index.html

To change the point rule modal
|-- js/rule-modal.js
|-- css/modals.css
|-- js/mock-data.js
`-- #ruleOverlay in index.html

To change the delivery list or detail drawer
|-- js/delivery-manager.js
|-- js/mock-data.js
|-- css/tables.css
|-- css/modals.css
`-- #deliveryView / #detailDrawer in index.html

To change the delivery create/edit modal
|-- js/delivery-modal.js
|-- cascaderOptions in js/mock-data.js
|-- css/modals.css
`-- #createMask in index.html

To add shared capability
|-- js/new-module.js
|-- Register load order in js/bootstrap.js
`-- Inject or use it from js/app.js or a specific Manager/Modal
```

## Development Rules

- Keep the delivery build-free: every asset must be loadable from `index.html` through relative paths.
- Each JS file must use an IIFE and register onto `window.AdminApp`, for example `app.Feature = class Feature {}`.
- Business modules should receive shared services through constructor injection. Avoid recreating `Toast` or `ConfirmDialog` inside a module, and avoid directly reaching into another Manager instance.
- Prefer `escapeHtml` when rendering user-visible content. Use `innerHTML` only for controlled HTML snippets such as pill/tag markup.
- When adding DOM interactions, prefer stable `id` or `data-*` hooks, and keep `index.html`, the related JS, and the related CSS synchronized.
- Keep mock business data in `js/mock-data.js`. Except for temporary UI state, do not scatter initial business data across Managers or Modals.
- View-level behavior belongs in a Manager. Modal/form-level behavior belongs in a Modal. Navigation and cross-view startup belong in AppShell.
- Split CSS by responsibility. Do not put modal styles in the table file, and do not put business table styles in the layout file.
- Before every change, decide whether a shared module truly needs to change. If there is no explicit shared-module requirement, do not modify shared files such as `utils.js`, `toast.js`, `confirm-dialog.js`, `app-shell.js`, or `tokens.css` just to satisfy a local need in one business module. Prefer solving local needs inside the relevant business module. Move behavior up to the shared layer only when there is cross-module reuse, a shared defect, or a consistency requirement.
- Git 的提交、推送和“先同步git”的执行语义统一见 [GIT.md](GIT.md)。
- 如果用户说“先同步git”，先检查本次该提交是否已经完成，再按 [GIT.md](GIT.md) 的流程同步远端 `origin/project`。

## Validation Checklist

```text
Structure checks
|-- CSS paths referenced by index.html exist
|-- index.html directly loads only js/bootstrap.js
|-- Every JS file listed in js/bootstrap.js exists
`-- New module load order satisfies dependencies

Change-scope checks
|-- The Manager/Modal/CSS touched by this request is the smallest reasonable entry point
|-- Shared JS/CSS was not casually changed when there was no shared-module requirement
|-- If a shared module changed, its impact scope was explained and all consumers were regressed
`-- New id / data-* / class hooks are synchronized across HTML, JS, and CSS

Browser smoke checks
|-- Open index.html
|-- Point rules: search, reset, sorting, pagination, column settings
|-- Rule modal: add, edit, copy, reward validation, dynamic trigger fields, languages, upload mock
|-- Delivery management: navigation switch, search, reset, create, edit, enable, void
|-- Delivery modal: cascader, automatic/manual switching, import/export/clear mocks
|-- Detail drawer: open, close, field display
`-- Confirm dialog and toast appear correctly after key actions
```

## Development Test Plan

This project has no automated test framework. Use a lightweight "static check + module-focused smoke test + related regression" plan by default. For each change, choose tests based on the impact scope. A local change does not need unrelated flows, but it must cover the directly affected path.

```text
1. Static asset tests
   |-- Check that CSS/JS files referenced by index.html exist
   |-- Check that bootstrap.js load order satisfies dependencies
   |-- Check that new modules register onto window.AdminApp
   `-- Check that the browser console has no script load failures

2. Module-focused tests
   |-- If RuleManager changed: test rule filters, sorting, pagination, column settings, enable/disable
   |-- If RuleModal changed: test add, edit, copy, reward validation, dynamic fields, save confirm
   |-- If DeliveryManager changed: test delivery filters, list rendering, enable, void, detail drawer
   |-- If DeliveryModal changed: test cascader, automatic/manual switch, import/export/clear, confirm delivery
   |-- If AppShell changed: test rules/delivery navigation, breadcrumbs, active state, hidden views
   `-- If mock-data changed: test lists, modal prefill, and detail display that depend on the changed fields

3. Shared-module regression tests
   |-- If utils.js changed: regress all rendering and event binding that use escapeHtml, $, and $$
   |-- If toast.js changed: regress all toast trigger points in rules and delivery flows
   |-- If confirm-dialog.js changed: regress save, enable, disable, void, and other confirm actions
   |-- If tokens.css changed: regress buttons, inputs, filter areas, and base text visuals
   `-- If modals.css / tables.css changed: regress all modals/tables, not only one business module

4. Post-change notes
   |-- State which modules were changed
   |-- State which direct paths were tested
   |-- If browser verification was not performed, state that only static checks were done
   `-- If a shared module changed, explain why the shared layer was necessary
```

## AI Handoff Prompt

When receiving a request, locate the right entry point first. Do not make broad, unfocused changes:

```text
1. Decide whether the request belongs to the page shell, shared services, point rules, delivery management, or styles.
2. Read the corresponding Manager/Modal, then read the related index.html fragment and CSS file.
3. If adding a data field, update mock-data first, then update the render/collect/save/detail display chain.
4. If adding a module, design its window.AdminApp registration name first, then update bootstrap.js order.
5. Before editing, confirm whether a shared module needs to change. If there is no shared need, keep the change inside the business module.
6. After editing, validate with static checks, module-focused tests, and any required related regression. Do not introduce build tooling.
```

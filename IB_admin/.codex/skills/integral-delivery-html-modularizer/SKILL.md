---
name: integral-delivery-html-modularizer
description: Modularize the fixed source HTML for the integral rules and delivery admin prototype into a no-build admin deliverable using browser-native JavaScript and modular CSS files.
metadata:
  short-description: Split the integral delivery prototype into no-build modules
---

# Integral Delivery HTML Modularizer

Use this skill when splitting or continuing the modularization of the fixed single-page prototype:

- Source directory: `/Users/amy/Downloads/原型文件`
- Source file: `/Users/amy/Downloads/原型文件/积分投递合并.html`
- Target root: `/Users/amy/Documents/ChatGPT/amy_project/admin`

The final deliverable must stay under the target root and must not require Node, npm, bundlers, transpilers, package installation, or a framework runtime. The intended output shape is one root HTML file plus a set of browser-loadable JavaScript and CSS module files.

## Before Editing

Read [references/source-analysis.md](references/source-analysis.md) before planning or changing files. Re-check the source file if it may have been updated since the analysis was written.

Preserve the prototype's current behavior while splitting it:

- left sidebar navigation between `rules` and `delivery`
- rule list search, reset, sorting, pagination, column visibility, add/edit/copy/enable/disable flows
- rule modal dynamic fields: trigger defaults, jump target, media upload mock, language tabs, cycle period fields
- delivery list search/reset, create/edit/enable/void/detail flows
- delivery modal cascader, automatic/manual sections, import/export/clear user mocks
- shared confirm modal and toast

## Modularization Approach

Prefer a no-build global namespace loader instead of ES module imports. Local `file://` preview can be brittle with native module loading, so use a root script such as `js/bootstrap.js` that dynamically injects ordered script tags, then starts `window.AdminApp`.

Use object-oriented boundaries where they reduce coupling:

- `AppShell` for layout navigation, breadcrumb switching, startup, and shared services wiring.
- `RuleManager` for rule state, table rendering, filters, pagination, sorting, column settings, and rule modal integration.
- `RuleModal` for rule add/edit/copy form state and dynamic field behavior.
- `DeliveryManager` for delivery list state, table rendering, filters, lifecycle operations, and detail drawer integration.
- `DeliveryModal` for delivery create/edit form state, cascader behavior, automatic/manual mode, and submit payload creation.
- `ConfirmDialog` and `Toast` as shared UI services.
- `dom`/`utils` helpers for `$`, `$$`, escaping, script loading, and small shared utilities.
- `mock-data` for `rules`, `deliveries`, breadcrumbs, and cascader options.

Keep each file browser-loadable without build tooling. A practical pattern is:

```js
window.AdminApp = window.AdminApp || {};
window.AdminApp.Toast = class Toast { /* ... */ };
```

Then instantiate from `app.js` after all dependencies load. Avoid hidden dependencies on declaration order inside a single giant file; make the load order explicit in `bootstrap.js`.

## CSS Split

CSS is part of the modularization. Extract the inline style into browser-loadable files such as:

- `css/tokens.css` for variables, reset, base typography, inputs, buttons, and shared utility classes.
- `css/layout.css` for `.app`, sidebar, topbar, workspace, and view visibility.
- `css/tables.css` for shared tables, pagination, tags, pills, statuses, and row actions.
- `css/modals.css` for overlays, masks, modal structure, confirm dialog, drawer, cascader, dynamic form blocks, and toast.
- `css/rules.css` and `css/delivery.css` only when view-specific selectors are substantial enough to justify separation.

Keep class names stable unless there is a concrete reason to rename. If names are changed, update HTML, CSS, and JS selectors together.

## Root HTML

The root HTML should contain stable static markup and load extracted CSS and `js/bootstrap.js`. Keep the page usable by opening the HTML directly in a browser. The HTML can retain the existing static structure, while repeated row content remains rendered by JavaScript.

Prefer this target shape unless the user asks otherwise:

```text
/Users/amy/Documents/ChatGPT/amy_project/admin/
|-- index.html
|-- css/
|   |-- tokens.css
|   |-- layout.css
|   |-- tables.css
|   `-- modals.css
`-- js/
    |-- bootstrap.js
    |-- namespace.js
    |-- utils.js
    |-- mock-data.js
    |-- toast.js
    |-- confirm-dialog.js
    |-- app-shell.js
    |-- rule-manager.js
    |-- rule-modal.js
    |-- delivery-manager.js
    `-- delivery-modal.js
```

## Validation

After splitting, verify without Node:

- Open or inspect `index.html` paths and ensure every linked CSS and JS file exists under the admin target.
- Run a lightweight static check with shell tools: confirm no inline `<style>` or large inline `<script>` remains except the bootstrap tag.
- If a browser is available, preview the page and smoke-test navigation, both modals, table rendering, confirm actions, drawer, toast, filters, and pagination.
- Preserve the source file unchanged unless the user explicitly asks to alter it.

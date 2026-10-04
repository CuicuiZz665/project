# 项目说明

本仓库（`amyZ_project`）承载同级多个项目：`IB_admin`（管理后台）、`IB_console`（合伙控制台）、`WebTrade`（GinX 官网静态站）、`miniapp`、`my-skill`、`白龙马`。`machine-config/` 是开发环境备份区（`scripts/backup.sh` 一键备份，换机恢复命令见其 README）。远程为 Gitee `origin`，工作分支 `project`。各项目内部的目录结构与约定见各自的 `AGENTS.md` / `GIT.md`。

## 版本库规则

- `.DS_Store`、`http-server.log` 等系统/日志文件不入库（已在 `.gitignore`）。
- 历史参考资料（`WebTrade/第三版/`、`WebTrade/线上抓取-兑换/`、线上抓取件 `academy-zh-cn.html` / `competition.html`、三份 rewards 中文页变体）已于 2026-09-24 随 WebTrade 重构从工作区移除，对应 `.gitignore` 条目同步清理；需要时从 git 历史找回（`5e307ef` 收录 v3，`e4e3871` 记录重构与移除）。
- 同日 `IB_console` 目录名去掉了开头误带的空格（提交 `5e6da98`），文档中一律写不带空格的 `IB_console`。
- 提交按 GIT.md 约定：只打包本次工作相关文件，不要混入其他项目未完成的改动。

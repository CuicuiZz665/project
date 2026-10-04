# GIT.md

本项目的 git 根目录在当前项目的上一级：`/Users/amy/Documents/amyZ_project`。

## Git 信息

- git 用户名：`amy`
- git 邮箱：`amy2502041215@gmail.com`
- 当前分支：`project`（提交前以 `git branch --show-current` 的实际输出为准）

## 提交流程

1. 在仓库根目录检查改动：`git -C .. status --short`
2. 只提交本次工作相关文件
3. 生成清晰的提交信息
4. 执行提交：`git -C .. add <files> && git -C .. commit -m "<message>"`
5. 推送到远端 `project` 分支：`git -C .. push origin project`
6. 提交后确认工作区干净：`git -C .. status --short`

## 约定

- 完成当前工作后，优先自动执行一次 git 提交。
- 提交完成后，优先自动推送到 `origin/project`。
- 不要把无关改动一起打包进来。
- 如果提交涉及父级仓库根目录，请始终在上一级仓库路径下操作。

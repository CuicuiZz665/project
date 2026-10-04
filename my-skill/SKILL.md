---
name: my-skill
description: 一个示例 skill,演示 ZCode 可识别的标准目录结构。当用户要求执行 my-skill 的功能时使用。(替换为你的 skill 的实际触发场景和功能描述)
---

# My Skill

这是一个按 ZCode 标准结构创建的 skill 模板。

## 何时使用

- 描述该 skill 的适用场景,帮助模型判断何时自动触发。

## 使用步骤

1. 说明该 skill 要完成的核心流程。
2. 需要调用脚本时,使用 `scripts/` 下的脚本,例如:

   ```bash
   bash scripts/run.sh "参数"
   ```

3. 需要背景资料时,参考 `references/` 下的文档。

## 注意事项

- 保持 description 与实际能力一致,description 是触发匹配的关键。
- 正文指令要具体、可直接执行,避免空泛描述。

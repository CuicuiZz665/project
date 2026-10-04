# GPT Image 2 终端生图技能（中文使用说明）

这是一个供 Claude Code、Codex 或其他支持 Agent Skill 的工具调用的生图技能，也可以直接在终端中运行。支持文生图、图片编辑、多图参考、蒙版编辑和流式预览。

## 一、使用要求

- Python 3.10 或更高版本。
- 可访问兼容 OpenAI API 的图片生成服务。
- 一个有效的 `OPENAI_API_KEY`。
- 本包默认 API 地址为 `https://aiyo.cc/v1`，默认图片模型为 `gpt-image-2`。

## 二、首次配置

1. 解压整个 ZIP，不要直接在压缩包内运行。
2. 用文本编辑器打开根目录中的 `.env` 文件。
3. 找到：

```dotenv
OPENAI_API_KEY=填写key
```

4. 把 `填写key` 替换成自己的 aiyo.cc API Key，然后保存。
5. 不要修改等号左边的变量名，也不要把填写好真实 Key 的 `.env` 发给别人。

默认配置如下：

```dotenv
OPENAI_BASE_URL=https://aiyo.cc/v1
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=high
```

## 三、直接在终端中使用

先在终端进入解压后的目录。

### 1. 文生图

macOS / Linux：

```bash
python3 scripts/gpt_image.py generations \
  --prompt "一只坐在未来城市屋顶的橘猫，电影感灯光" \
  --output out/cat.png
```

Windows PowerShell：

```powershell
python .\scripts\gpt_image.py generations `
  --prompt "一只坐在未来城市屋顶的橘猫，电影感灯光" `
  --output .\out\cat.png
```

完成后，图片会保存到 `out` 文件夹。

### 2. 先做测试，不实际消耗额度

macOS / Linux：

```bash
python3 scripts/gpt_image.py generations \
  --prompt "测试图片" \
  --output out/test.png \
  --dry-run
```

Windows PowerShell：

```powershell
python .\scripts\gpt_image.py generations `
  --prompt "测试图片" `
  --output .\out\test.png `
  --dry-run
```

`--dry-run` 只显示请求内容，不会真正调用 API，建议首次使用时先运行。

### 3. 图片编辑

可查看完整参数：

```bash
python3 scripts/gpt_image.py edits --help
```

Windows 可使用：

```powershell
python .\scripts\gpt_image.py edits --help
```

## 四、安装为 Agent Skill

### Claude Code

把整个技能文件夹复制到 Claude Code 的 Skills 目录，并确保目录中保留 `SKILL.md`：

- 用户级目录通常为：`~/.claude/skills/gpt-image-2/`
- 也可放到项目自己的 `.claude/skills/gpt-image-2/`

重新启动 Claude Code 后，可直接提出：

- 使用 GPT Image 2 生成一张产品宣传图
- 把这张图片的背景改成夜景
- 根据三张参考图生成统一风格的海报

### Codex

将整个技能文件夹复制到支持的 Skills 目录，保留 `SKILL.md` 和 `agents/openai.yaml`。不同版本的 Codex 目录可能不同；如果自动识别失败，直接在终端运行 `scripts/gpt_image.py` 即可。

## 五、配置说明

配置优先级为：命令行参数 > 系统环境变量 > `.env` 文件。

常用变量：

- `OPENAI_API_KEY`：API Key，必须填写。
- `OPENAI_BASE_URL`：API 地址，本包默认 `https://aiyo.cc/v1`。
- `OPENAI_IMAGE_MODEL`：图片模型，默认 `gpt-image-2`。
- `OPENAI_IMAGE_SIZE`：图片尺寸，默认 `1024x1024`。
- `OPENAI_IMAGE_QUALITY`：图片质量，默认 `high`。
- `OPENAI_IMAGE_FORMAT`：输出格式，可按需要设置为 png、jpeg 或 webp。
- `OPENAI_IMAGE_TIMEOUT`：请求超时时间。

更多参数见：

- `SKILL.md`：完整命令和工作流程。
- `references/config.md`：全部配置变量。
- `references/api-surface.md`：generations、edits、responses 的区别。

## 六、常见问题

1. 提示 `Missing OPENAI_API_KEY`
   - 检查 `.env` 是否与 README.md 位于同一根目录。
   - 确认已把占位文字替换成真实 Key。

2. 提示找不到 Python
   - 安装 Python 3.10 或更高版本。
   - Windows 安装 Python 时勾选“Add Python to PATH”。

3. 请求失败或超时
   - 检查网络、API Key 和 `OPENAI_BASE_URL`。
   - 可适当增大 `OPENAI_IMAGE_TIMEOUT`。

4. 尺寸报错
   - 按错误提示调整 `--size`；部分模型要求宽高为 16 的倍数。

5. 图片没有生成
   - 先加 `--dry-run` 检查最终请求。
   - 确认账户余额、模型权限和输出目录权限。

## 七、安全提示

- `.env` 中包含 API Key，不要上传到公开网盘、GitHub 或发送给无关人员。
- 图片生成会消耗 API 额度，正式运行前建议先使用 `--dry-run`。
- 本技能会向配置的 API 地址发送提示词和输入图片，请勿提交敏感或未经授权的内容。

## 八、离线测试

在技能根目录运行：

```bash
python3 -m unittest discover -s tests -p "test_*.py"
```

测试主要检查参数和请求格式，不会实际调用图片 API。

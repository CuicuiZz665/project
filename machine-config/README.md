# machine-config · 开发环境备份（极简版）

这台 Mac 开发配置的快照，由 `scripts/backup.sh` 一键收集并推送 Gitee。
没有 skill、没有恢复脚本——换机时照下面复制粘贴即可。

## 日常备份（改了 .zshrc / git 配置 / skills / pm2 服务后跑一次）

```bash
bash ~/Documents/amyZ_project/machine-config/scripts/backup.sh
```

## 备份了什么

| 目录/文件 | 内容 |
| --- | --- |
| `home/` | .zshrc（nvm 加载 + `ib` 别名）、.gitconfig、.gitignore_global、.stCommitMsg |
| `config/git/` | `~/.config/git` |
| `zcode/AGENTS.md` | ZCode 全局工作约定 |
| `zcode/skills/` | 全部用户 skills 的完整内容 |
| `pm2/dump.pm2` | 三个本地预览服务：IB_admin(8080)、IB_console(8081)、WebTrade(8643) |
| `manifest.json` | node 版本（v24.20.0）、npm 全局包、macOS 版本、备份时间 |

## 换新电脑：照抄这几段命令

> **懒人版（推荐）**：装好 ZCode 并登录后，新开对话直接对 AI 说——
> 「换新电脑恢复开发环境：若 ~/Documents/amyZ_project 不存在，先 git clone https://gitee.com/AmyCui/project.git 到该路径（没有 git 就先跑 xcode-select --install）；然后严格按仓库里 machine-config/README.md『换新电脑』一节的四段命令逐段执行；最后验证 node -v 为 v24.20.0、pm2 status 有 IB_admin/IB_console/WebTrade 三个进程 online、curl 8080/8081/8643 三个端口返回 200。」

```bash
# 0) 装 git（图形确认一次），然后克隆仓库到固定路径（pm2 记录的是绝对路径，不能换位置）
xcode-select --install
git clone https://gitee.com/AmyCui/project.git ~/Documents/amyZ_project
cd ~/Documents/amyZ_project/machine-config

# 1) shell / git 配置
cp home/.zshrc home/.gitconfig home/.gitignore_global home/.stCommitMsg ~/
mkdir -p ~/.config/git && cp -R config/git/. ~/.config/git/

# 2) ZCode 约定与 skills
mkdir -p ~/.zcode/skills
cp zcode/AGENTS.md ~/.zcode/
cp -R zcode/skills/. ~/.zcode/skills/

# 3) node 环境（装完 nvm 后重开终端或 source ~/.zshrc，再装 node）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install v24.20.0
npm install -g pm2 http-server

# 4) 三个本地预览服务
mkdir -p ~/.pm2 && cp pm2/dump.pm2 ~/.pm2/
pm2 resurrect && pm2 save
```

## 必须手动做的（不随备份走）

- Gitee 账号：首次 `git push` 重新登录一次
- ZCode App：安装并登录（skills 和 AGENTS.md 已就位，登录即用）
- SSH 私钥 `~/.ssh/`、代理配置 `~/.config/clash.meta`：手动拷贝
- GUI 软件（Sourcetree 等）重装，`.gitconfig` 里的配置仍然有效

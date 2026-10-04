#!/bin/bash
# machine-sync 备份：把本机开发环境配置收集到 amyZ_project/machine-config 并推送 Gitee
# 用法: bash ~/Documents/amyZ_project/machine-config/scripts/backup.sh
set -euo pipefail

REPO="$HOME/Documents/amyZ_project"
DEST="$REPO/machine-config"
STAMP="$(date '+%Y-%m-%d %H:%M')"

[ -d "$REPO/.git" ] || { echo "❌ 未找到仓库 $REPO"; exit 1; }
mkdir -p "$DEST/home" "$DEST/config" "$DEST/zcode" "$DEST/pm2"

# 1. shell / git 配置（存在才备）
for f in .zshrc .zprofile .zshenv .bashrc .bash_profile .gitconfig .gitignore_global .stCommitMsg; do
  if [ -f "$HOME/$f" ]; then cp "$HOME/$f" "$DEST/home/$f"; fi
done

# 2. ~/.config/git
if [ -d "$HOME/.config/git" ]; then
  mkdir -p "$DEST/config/git"
  cp -R "$HOME/.config/git/." "$DEST/config/git/"
fi

# 3. ZCode：AGENTS.md + 用户 skills（不含 v2/cli/workspace 等含凭据或会话的目录）
#    ~/.zcode/skills 里多为指向 ~/.codex/skills 的符号链接，必须解引用存真实内容，
#    否则备份在新机器上是死链。
cp "$HOME/.zcode/AGENTS.md" "$DEST/zcode/AGENTS.md"
mkdir -p "$DEST/zcode/skills"
find "$DEST/zcode/skills" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
for s in "$HOME/.zcode/skills"/*; do
  name="$(basename "$s")"
  if [ -L "$s" ] && [ ! -e "$s" ]; then
    echo "⚠ 跳过失效链接: ${name}（指向 $(readlink "$s")，目标已不存在）"
    continue
  fi
  cp -RH "$s" "$DEST/zcode/skills/$name"
done
find "$DEST/zcode/skills" -name .DS_Store -delete

# 4. pm2 进程表（先刷新 dump 再拷贝）
VER="none"
NVM_DIR_versions="$HOME/.nvm/versions/node"
if [ -d "$NVM_DIR_versions" ] && [ -n "$(ls -A "$NVM_DIR_versions" 2>/dev/null)" ]; then
  VER="$(ls "$NVM_DIR_versions" | sort -V | tail -1)"
  PM2="$NVM_DIR_versions/$VER/bin/pm2"
  if [ -x "$PM2" ]; then "$PM2" save >/dev/null 2>&1 || true; fi
fi
if [ -f "$HOME/.pm2/dump.pm2" ]; then cp "$HOME/.pm2/dump.pm2" "$DEST/pm2/dump.pm2"; fi

# 5. 环境清单
GPKGS=""
NPM="$NVM_DIR_versions/$VER/bin/npm"
if [ -x "$NPM" ]; then
  GPKGS="$("$NPM" ls -g --depth=0 2>/dev/null | tail -n +2 | awk '{print $2}' | paste -sd, - | sed 's/,$//')"
fi
cat > "$DEST/manifest.json" <<EOF
{
  "updated": "$STAMP",
  "hostname": "$(hostname)",
  "macos": "$(sw_vers -productVersion 2>/dev/null || echo unknown)",
  "node": "$VER",
  "npm_global_packages": "$GPKGS"
}
EOF

# 6. 提交并推送（只提交 machine-config，不碰其他改动）
find "$DEST" -name .DS_Store -delete
cd "$REPO"
if [ -n "$(git status --short -- machine-config)" ]; then
  git add machine-config
  git commit -m "chore(machine-config): backup ${STAMP}"
  git push origin project
  echo "✅ 备份已提交并推送：${STAMP}"
else
  echo "✅ 与上次备份无变化，无需提交"
fi

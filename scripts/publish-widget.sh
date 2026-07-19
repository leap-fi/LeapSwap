#!/bin/bash

# 发布 widget 包的脚本
# 功能：拉取代码 -> 切换到 publish 分支 -> 进入 packages/widget -> 执行 npm publish

set -e  # 遇到错误立即退出

echo "🚀 开始发布流程..."

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "📦 当前目录: $(pwd)"

# 1. 拉取最新代码
echo ""
echo "1️⃣  拉取最新代码..."
git pull

# 2. 切换到 publish 分支
echo ""
echo "2️⃣  切换到 publish 分支..."
git checkout publish

# 再次拉取 publish 分支的最新代码
echo "   拉取 publish 分支最新代码..."
git pull

# 3. 进入 packages/widget 目录
echo ""
echo "3️⃣  进入 packages/widget 目录..."
cd packages/widget

echo "   当前目录: $(pwd)"

# 4. 执行 npm publish
echo ""
echo "4️⃣  执行 npm publish --access public..."
npm publish --access public

echo ""
echo "✅ 发布完成！"


#!/bin/bash
set -e
cd "$(dirname "$0")"
git add -A
if git diff --cached --quiet; then
  echo "新しい変更はありません。未公開のコミットがあれば公開します。"
else
  git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi
git push origin main
echo "✅ デプロイ完了！反映まで1〜2分お待ちください。"
echo "🌐 https://nabe0096.github.io/hibinone-photo-studio/"

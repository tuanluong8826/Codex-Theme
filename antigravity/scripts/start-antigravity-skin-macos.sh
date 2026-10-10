#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../.." && pwd -P)"
echo "=== Khởi chạy Antigravity Dream Skin & Startup Animation ==="

LANG_PREF="${DREAMSKIN_LANG:-vi}"
export DREAMSKIN_LANG="$LANG_PREF"

# Check if node is available
if ! command -v node >/dev/null 2>&1; then
  echo "Lỗi: Không tìm thấy Node.js trên máy của bạn. Vui lòng cài đặt Node.js từ https://nodejs.org/"
  exit 1
fi

# Run the unified injector and animation
if [[ "${1:-}" == "--theme-only" ]]; then
  echo "Chế độ: Chỉ áp dụng Theme & Hình nền"
  node "$DIR/antigravity/scripts/injector.mjs" --once
else
  echo "Chế độ: Phát Hoạt ảnh khởi động + Áp dụng Theme"
  node "$DIR/startup-animation/extension/run.mjs" --antigravity || node "$DIR/antigravity/scripts/injector.mjs" --once --play-animation
fi

echo "Hoàn tất! Antigravity đã được làm đẹp."

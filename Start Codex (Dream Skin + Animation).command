#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd -P)"
SCRIPT="$DIR/macos/scripts/start-dream-skin-macos.sh"
if [ ! -f "$SCRIPT" ]; then
  SCRIPT="$HOME/.codex/codex-dream-skin-studio/scripts/start-dream-skin-macos.sh"
fi

if [ ! -f "$SCRIPT" ]; then
  /usr/bin/osascript -e 'display alert "Không tìm thấy tập lệnh khởi chạy. Vui lòng chạy Install Codex Theme.command trước / Cannot find launch script. Please run Install Codex Theme.command first." as warning' >/dev/null 2>&1 || true
  exit 1
fi

exec /bin/bash "$SCRIPT" --prompt-restart --startup-animation

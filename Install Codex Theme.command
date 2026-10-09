#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd -P)"
SCRIPT="$DIR/macos/scripts/install-dream-skin-macos.sh"

if [ -f "$SCRIPT" ]; then
  exec /bin/bash "$SCRIPT"
else
  echo "Installer script not found at $SCRIPT"
  exit 1
fi

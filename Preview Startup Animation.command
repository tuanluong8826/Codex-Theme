#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd -P)"
PREVIEW_HTML="$DIR/startup-animation/index.html"

if [ -f "$PREVIEW_HTML" ]; then
  /usr/bin/open "$PREVIEW_HTML"
else
  echo "Preview HTML not found at $PREVIEW_HTML"
fi

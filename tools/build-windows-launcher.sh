#!/bin/bash
set -euo pipefail
export COPYFILE_DISABLE=1

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$ROOT"

echo "Building native Windows launcher..."
find "$ROOT/windows/launcher" -name "._*" -delete 2>/dev/null || true

dotnet publish "$ROOT/windows/launcher/CodexLauncher.csproj" \
  -c Release \
  -r win-x64 \
  -p:PublishSingleFile=true \
  -p:DebugType=None \
  -p:DebugSymbols=false \
  -o "$ROOT/windows/release"

cp -f "$ROOT/windows/release/Codex.exe" "$ROOT/Codex.exe"
find "$ROOT" -maxdepth 1 -name "._Codex.exe" -delete 2>/dev/null || true

echo "Successfully built:"
echo "  1. $ROOT/windows/release/Codex.exe"
echo "  2. $ROOT/Codex.exe"

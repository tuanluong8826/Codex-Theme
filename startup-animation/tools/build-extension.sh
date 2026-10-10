#!/bin/bash
set -euo pipefail
export COPYFILE_DISABLE=1

DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$DIR"
bash tools/prepare-defaults.sh

tmp_bundle="/tmp/Codex.app"
rm -rf "$tmp_bundle"
mkdir -p "$tmp_bundle/Contents/MacOS" "$tmp_bundle/Contents/Resources/web/assets" "$tmp_bundle/Contents/Resources/web/extension" .build/module-cache

swiftc -O -module-cache-path .build/module-cache Native/Extension.swift -o "$tmp_bundle/Contents/MacOS/CodexStartup" -framework AppKit

cp index.html style.css animation.js image-settings.js "$tmp_bundle/Contents/Resources/web/"
cp assets/artwork.jpg assets/avatar.jpg assets/contours.js "$tmp_bundle/Contents/Resources/web/assets/"
rm -f "$tmp_bundle/Contents/Resources/web/assets/aemeath.png" "$tmp_bundle/Contents/Resources/web/assets/avatar.png"
cp extension/*.mjs extension/wallpaper.css "$tmp_bundle/Contents/Resources/web/extension/"

# Pink launcher icon
cp assets/codex-pink.icns "$tmp_bundle/Contents/Resources/StartupPink.icns"

cat > "$tmp_bundle/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>CodexStartup</string>
<key>CFBundleIdentifier</key><string>local.aemeath.extension</string>
<key>CFBundleName</key><string>Codex</string>
<key>CFBundleDisplayName</key><string>Codex</string>
<key>CFBundleIconFile</key><string>StartupPink.icns</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>1.5.20</string>
<key>CFBundleVersion</key><string>10</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>LSUIElement</key><true/>
</dict></plist>
PLIST

find "$tmp_bundle" -name "._*" -delete 2>/dev/null || true
codesign --force --sign - "$tmp_bundle"

# Clean target directories
mkdir -p dist
rm -rf dist/Codex.app "$DIR/../Codex.app"

# Copy cleanly using ditto
ditto --noextattr "$tmp_bundle" dist/Codex.app
ditto --noextattr "$tmp_bundle" "$DIR/../Codex.app"
find dist/Codex.app "$DIR/../Codex.app" -name "._*" -delete 2>/dev/null || true

# Also install to Applications if possible
if [ -d "/Applications" ]; then
  rm -rf "/Applications/Codex.app" 2>/dev/null || true
  ditto --noextattr "$tmp_bundle" "/Applications/Codex.app" 2>/dev/null || true
fi

printf 'Successfully built:\n'
printf '  1. %s/dist/Codex.app\n' "$DIR"
printf '  2. %s/Codex.app\n' "$DIR/.."
if [ -d "/Applications/Codex.app" ]; then
  printf '  3. /Applications/Codex.app\n'
fi

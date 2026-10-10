#!/bin/bash
set -euo pipefail
export COPYFILE_DISABLE=1

DIR="$(cd "$(dirname "$0")" && pwd -P)"
REPO_ROOT="$(cd "$DIR/../.." && pwd -P)"
cd "$REPO_ROOT"

tmp_bundle="/tmp/AntigravityLauncher.app"
rm -rf "$tmp_bundle"
mkdir -p "$tmp_bundle/Contents/MacOS" "$tmp_bundle/Contents/Resources/web/assets" "$tmp_bundle/Contents/Resources/web/extension"

echo "==> Compiling Swift executable for Antigravity Launcher..."
swiftc -O "$DIR/Extension.swift" -o "$tmp_bundle/Contents/MacOS/AntigravityStartup" -framework AppKit

echo "==> Bundling web assets..."
cp startup-animation/index.html startup-animation/style.css startup-animation/animation.js startup-animation/image-settings.js "$tmp_bundle/Contents/Resources/web/"
cp startup-animation/assets/artwork.jpg startup-animation/assets/avatar.jpg startup-animation/assets/contours.js "$tmp_bundle/Contents/Resources/web/assets/"
cp startup-animation/extension/*.mjs startup-animation/extension/wallpaper.css "$tmp_bundle/Contents/Resources/web/extension/"

# Copy cute pink Antigravity icon
cp "$DIR/antigravity-pink.icns" "$tmp_bundle/Contents/Resources/AppIcon.icns"

cat > "$tmp_bundle/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>AntigravityStartup</string>
<key>CFBundleIdentifier</key><string>local.antigravity.theme</string>
<key>CFBundleName</key><string>Antigravity Launcher</string>
<key>CFBundleDisplayName</key><string>Antigravity Launcher</string>
<key>CFBundleIconFile</key><string>AppIcon.icns</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>1.0.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>LSUIElement</key><true/>
</dict></plist>
PLIST

find "$tmp_bundle" -name "._*" -delete 2>/dev/null || true
codesign --force --sign - "$tmp_bundle"

mkdir -p "$REPO_ROOT/dist"
rm -rf "$REPO_ROOT/dist/AntigravityLauncher.app" "$REPO_ROOT/AntigravityLauncher.app"

ditto --noextattr "$tmp_bundle" "$REPO_ROOT/dist/AntigravityLauncher.app"
ditto --noextattr "$tmp_bundle" "$REPO_ROOT/AntigravityLauncher.app"
find "$REPO_ROOT/dist/AntigravityLauncher.app" "$REPO_ROOT/AntigravityLauncher.app" -name "._*" -delete 2>/dev/null || true

if [ -d "/Applications" ]; then
  rm -rf "/Applications/AntigravityLauncher.app" 2>/dev/null || true
  ditto --noextattr "$tmp_bundle" "/Applications/AntigravityLauncher.app" 2>/dev/null || true
fi

echo "==> Successfully built AntigravityLauncher.app!"
echo "    Location: $REPO_ROOT/AntigravityLauncher.app"
echo "    Location: /Applications/AntigravityLauncher.app"


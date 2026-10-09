#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
bash tools/prepare-defaults.sh
bundle="dist/Aemeath Startup.app"
mkdir -p "$bundle/Contents/MacOS" "$bundle/Contents/Resources/web/assets" .build/module-cache
swiftc -O -module-cache-path .build/module-cache Native/App.swift -o "$bundle/Contents/MacOS/AemeathStartup" -framework AppKit -framework WebKit
cp index.html style.css animation.js image-settings.js "$bundle/Contents/Resources/web/"
cp assets/artwork.jpg assets/avatar.jpg assets/contours.js "$bundle/Contents/Resources/web/assets/"
rm -f "$bundle/Contents/Resources/web/assets/aemeath.png" "$bundle/Contents/Resources/web/assets/avatar.png"
export COPYFILE_DISABLE=1
cat > "$bundle/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>AemeathStartup</string>
<key>CFBundleIdentifier</key><string>local.codex.startup-animation</string>
<key>CFBundleName</key><string>Codex Startup Animation</string>
<key>CFBundleDisplayName</key><string>Codex Startup Animation</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
find "$bundle" -name "._*" -delete 2>/dev/null || true
codesign --force --sign - "$bundle"
printf 'Built: %s\n' "$PWD/$bundle"

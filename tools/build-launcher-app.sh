#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
BUNDLE="$ROOT/Codex Theme Launcher.app"

echo "Building $BUNDLE..."
rm -rf "$BUNDLE"
mkdir -p "$BUNDLE/Contents/MacOS" "$BUNDLE/Contents/Resources"

# Copy Icon
if [ -f "$ROOT/startup-animation/assets/codex-pink.icns" ]; then
  cp "$ROOT/startup-animation/assets/codex-pink.icns" "$BUNDLE/Contents/Resources/AppIcon.icns"
fi

# Create launcher script
cat > "$BUNDLE/Contents/MacOS/launcher" <<'EOF'
#!/bin/bash
ROOT="$(cd "$(dirname "$0")/../../.." && pwd -P)"
export COPYFILE_DISABLE=1

# Run the startup script with startup animation in the background
"$ROOT/macos/scripts/start-dream-skin-macos.sh" --startup-animation >/dev/null 2>&1 &
EOF

chmod +x "$BUNDLE/Contents/MacOS/launcher"

# Create Info.plist
cat > "$BUNDLE/Contents/Info.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.codex.themerauncher</string>
    <key>CFBundleName</key>
    <string>Codex Theme Launcher</string>
    <key>CFBundleDisplayName</key>
    <string>Codex Theme</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.5.20</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

find "$BUNDLE" -name "._*" -delete 2>/dev/null || true
codesign --force --sign - "$BUNDLE" 2>/dev/null || true

echo "Successfully built: $BUNDLE"

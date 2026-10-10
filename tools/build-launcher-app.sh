#!/bin/bash
set -euo pipefail
export COPYFILE_DISABLE=1

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
BUNDLE="$ROOT/Codex Theme Launcher.app"
TMP_BUNDLE="/tmp/Codex Theme Launcher.app"

echo "Building native app in temporary APFS directory..."
rm -rf "$TMP_BUNDLE" "$BUNDLE"

# Compile AppleScript Applet (native universal Mach-O executable)
osacompile -o "$TMP_BUNDLE" -e '
set appPath to POSIX path of (path to me)
set projectDir to do shell script "dirname " & quoted form of appPath

set scriptPath to projectDir & "/macos/scripts/start-dream-skin-macos.sh"
set scriptExists to (do shell script "test -f " & quoted form of scriptPath & " && echo '\''yes'\'' || echo '\''no'\''")

if scriptExists is not "yes" then
	set scriptPath to "/Volumes/onn Disk/Codex-Theme/macos/scripts/start-dream-skin-macos.sh"
	set scriptExists to (do shell script "test -f " & quoted form of scriptPath & " && echo '\''yes'\'' || echo '\''no'\''")
end if

if scriptExists is not "yes" then
	display alert "Codex Theme" message "Không tìm thấy thư mục Codex-Theme. Vui lòng giữ file App tại thư mục dự án hoặc cắm lại ổ đĩa ngoài." as critical
	return
end if

try
	do shell script "bash " & quoted form of scriptPath & " --prompt-restart --startup-animation"
on error errMsg number errNum
	if errNum is not 20 then
		display alert "Codex Theme" message "Lỗi khởi chạy: " & errMsg as critical
	end if
end try
'

# Set custom pink icon
if [ -f "$ROOT/startup-animation/assets/codex-pink.icns" ]; then
  cp -f "$ROOT/startup-animation/assets/codex-pink.icns" "$TMP_BUNDLE/Contents/Resources/applet.icns"
fi

# Set Display Name and metadata in Info.plist
/usr/bin/plutil -replace CFBundleDisplayName -string "Codex Theme" "$TMP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/bin/plutil -replace CFBundleName -string "Codex Theme Launcher" "$TMP_BUNDLE/Contents/Info.plist" 2>/dev/null || true
/usr/bin/plutil -replace CFBundleIdentifier -string "com.codex.themerauncher" "$TMP_BUNDLE/Contents/Info.plist" 2>/dev/null || true

# Sign the applet
find "$TMP_BUNDLE" -name "._*" -delete 2>/dev/null || true
codesign --force --sign - "$TMP_BUNDLE" 2>/dev/null || true

# Copy cleanly to target workspace
ditto --noextattr "$TMP_BUNDLE" "$BUNDLE"
find "$BUNDLE" -name "._*" -delete 2>/dev/null || true

# Also install to Applications for convenience
if [ -d "/Applications" ]; then
  ditto --noextattr "$TMP_BUNDLE" "/Applications/Codex Theme Launcher.app" 2>/dev/null || true
fi

echo "Successfully built:"
echo "  1. $BUNDLE"
echo "  2. /Applications/Codex Theme Launcher.app"

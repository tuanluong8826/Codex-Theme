@echo off
set "DREAMSKIN_LANG=vi"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0antigravity\scripts\start-antigravity-skin-windows.ps1" --theme-only
pause

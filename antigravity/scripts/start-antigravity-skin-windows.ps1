# Antigravity Dream Skin & Startup Animation Launcher for Windows
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$ScriptDir\..\.."

Write-Host "=== Khoi chay Antigravity Dream Skin & Startup Animation ===" -ForegroundColor Cyan

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Loi: Khong tim thay Node.js. Vui long cai dat Node.js tai https://nodejs.org/" -ForegroundColor Red
    exit 1
}

$ThemeOnly = $args -contains "--theme-only"

if ($ThemeOnly) {
    Write-Host "Che do: Chi ap dung Theme & Hinh nen..." -ForegroundColor Yellow
    node "$RepoRoot\antigravity\scripts\injector.mjs" --once
} else {
    Write-Host "Che do: Phat Hoat anh khoi dong + Ap dung Theme..." -ForegroundColor Green
    try {
        node "$RepoRoot\startup-animation\extension\run.mjs" --antigravity
    } catch {
        node "$RepoRoot\antigravity\scripts\injector.mjs" --once --play-animation
    }
}

Write-Host "Hoan tat! Antigravity da duoc lam dep." -ForegroundColor Cyan

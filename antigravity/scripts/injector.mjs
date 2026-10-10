#!/usr/bin/env node
/**
 * Antigravity Theme & Animation Injector Daemon
 * Automatically connects to Antigravity via Chrome DevTools Protocol (CDP)
 * and injects Dream Skin CSS, custom wallpaper, and startup animations.
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");

const THEME_CSS_PATH = path.resolve(__dirname, "../theme/antigravity-skin.css");
const THEME_JSON_PATH = path.resolve(__dirname, "../theme/theme.json");

// Cross-platform preferences location
const PREF_DIR = path.join(os.homedir(), ".gemini", "antigravity");
const PREF_PATH = path.join(PREF_DIR, "theme-preferences.json");

// Default configuration
const DEFAULT_PREFERENCES = {
  enabled: true,
  wallpaper: path.resolve(REPO_ROOT, "startup-animation/assets/artwork.jpg"),
  wallpaperOpacity: 0.90,
  wallpaperBlur: 0,
  glassBlur: 16,
  bgAlpha: 0.80,
  sidebarAlpha: 0.72,
  startupAnimation: true,
  startupAnimationDuration: 12,
  soundEnabled: true,
  language: "vi",
  introTitle: "Antigravity",
  introCaption: "AI-First Development Platform",
  artworkSubtitle: "Chào mừng bạn trở lại, chúc một ngày làm việc hiệu quả~"
};

function getDevToolsActivePortPath() {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Antigravity", "DevToolsActivePort");
  } else if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Antigravity", "DevToolsActivePort");
  } else {
    return path.join(os.homedir(), ".config", "Antigravity", "DevToolsActivePort");
  }
}

async function loadPreferences() {
  try {
    if (!fs.existsSync(PREF_DIR)) {
      await fsp.mkdir(PREF_DIR, { recursive: true });
    }
    if (fs.existsSync(PREF_PATH)) {
      const data = JSON.parse(await fsp.readFile(PREF_PATH, "utf8"));
      return { ...DEFAULT_PREFERENCES, ...data };
    } else {
      await fsp.writeFile(PREF_PATH, JSON.stringify(DEFAULT_PREFERENCES, null, 2), "utf8");
      return { ...DEFAULT_PREFERENCES };
    }
  } catch (err) {
    console.warn("[Injector] Error loading preferences, using defaults:", err.message);
    return { ...DEFAULT_PREFERENCES };
  }
}

async function readPortFile(portFilePath) {
  try {
    if (!fs.existsSync(portFilePath)) return null;
    const content = await fsp.readFile(portFilePath, "utf8");
    const lines = content.trim().split(/\r?\n/);
    if (lines.length >= 1 && /^\d+$/.test(lines[0])) {
      return parseInt(lines[0], 10);
    }
  } catch {
    // Ignore read errors during race condition
  }
  return null;
}

async function launchAntigravityIfNeeded() {
  const portFilePath = getDevToolsActivePortPath();
  let port = await readPortFile(portFilePath);
  if (port) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return port;
    } catch {
      // Stale port file, launch app
    }
  }

  console.log("[Injector] Antigravity is not currently running. Launching...");
  if (process.platform === "darwin") {
    try {
      await execFileAsync("open", ["-a", "/Applications/Antigravity.app"]);
    } catch (e) {
      await execFileAsync("open", ["-b", "com.google.antigravity"]).catch(() => {});
    }
  } else if (process.platform === "win32") {
    spawn("cmd.exe", ["/c", "start", "", "Antigravity"], { detached: true, stdio: "ignore" }).unref();
  }

  // Poll for port up to 25 seconds
  const start = Date.now();
  while (Date.now() - start < 25000) {
    await new Promise((r) => setTimeout(r, 600));
    port = await readPortFile(portFilePath);
    if (port) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          console.log(`[Injector] Antigravity detected on port ${port}`);
          return port;
        }
      } catch {}
    }
  }
  throw new Error("Timeout waiting for Antigravity DevToolsActivePort");
}

function resolveWallpaperDataUrl(wallpaperPath) {
  try {
    let resolved = wallpaperPath;
    if (!path.isAbsolute(resolved)) {
      resolved = path.resolve(REPO_ROOT, resolved);
    }
    if (!fs.existsSync(resolved)) {
      resolved = path.resolve(REPO_ROOT, "startup-animation/assets/artwork.jpg");
    }
    if (fs.existsSync(resolved)) {
      const ext = path.extname(resolved).toLowerCase();
      let mime = "image/jpeg";
      if (ext === ".png") mime = "image/png";
      else if (ext === ".webp") mime = "image/webp";
      const buf = fs.readFileSync(resolved);
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
  } catch (err) {
    console.error("[Injector] Failed reading wallpaper:", err.message);
  }
  return "";
}

function buildCssPayload(prefs) {
  let css = "";
  try {
    css = fs.readFileSync(THEME_CSS_PATH, "utf8");
  } catch (e) {
    console.error("[Injector] Failed to read theme CSS:", e.message);
    return "";
  }

  // Override dynamic CSS variables according to preferences
  const varOverrides = `
:root {
  --ag-wallpaper-opacity: ${prefs.wallpaperOpacity ?? 0.90};
  --ag-wallpaper-blur: ${prefs.wallpaperBlur ?? 0}px;
  --ag-glass-blur: ${prefs.glassBlur ?? 16}px;
  --ag-bg-alpha: ${prefs.bgAlpha ?? 0.80};
  --ag-sidebar-alpha: ${prefs.sidebarAlpha ?? 0.72};
}
`;
  return varOverrides + "\n" + css;
}

let nextId = 1;
const pendingRequests = new Map();

function setupCdp(ws) {
  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve, reject } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result?.result?.value);
        }
      }
    } catch (e) {
      console.error("[Injector] Error processing CDP message:", e.message);
    }
  };
}

function evaluate(ws, expression) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pendingRequests.set(id, { resolve, reject });
    ws.send(JSON.stringify({
      id,
      method: "Runtime.evaluate",
      params: { expression }
    }));
  });
}

async function injectTheme(ws, prefs) {
  const css = buildCssPayload(prefs);
  const wallpaperDataUrl = resolveWallpaperDataUrl(prefs.wallpaper);
  const enabled = prefs.enabled !== false;

  const script = `(() => {
    let style = document.getElementById("__antigravity_dream_skin");
    let wp = document.getElementById("__antigravity_wallpaper");

    if (!${enabled}) {
      if (style) style.remove();
      if (wp) wp.remove();
      return "Theme disabled";
    }

    if (!style) {
      style = document.createElement("style");
      style.id = "__antigravity_dream_skin";
      document.head.appendChild(style);
    }
    style.textContent = ${JSON.stringify(css)};

    if (!wp) {
      wp = document.createElement("div");
      wp.id = "__antigravity_wallpaper";
      document.body.prepend(wp);
    }
    wp.style.backgroundImage = "url(\\"" + ${JSON.stringify(wallpaperDataUrl)} + "\\")";
    return "Theme injected successfully";
  })()`;

  return evaluate(ws, script);
}

async function injectStartupOverlay(ws, prefs) {
  const animHtmlPath = path.resolve(REPO_ROOT, "startup-animation/index.html");
  if (!fs.existsSync(animHtmlPath)) return;

  const script = `(() => {
    if (document.getElementById("__antigravity_startup_overlay")) return "Already present";
    const overlay = document.createElement("div");
    overlay.id = "__antigravity_startup_overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#05070a;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:system-ui,-apple-system,sans-serif;transition:opacity 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s ease;overflow:hidden;";
    
    overlay.innerHTML = \`
      <div style="position:relative;text-align:center;max-width:540px;padding:32px;z-index:2;">
        <div style="font-size:12px;letter-spacing:0.25em;color:#ec4899;font-weight:700;margin-bottom:12px;text-transform:uppercase;">
          ANTIGRAVITY INITIALIZATION / 01
        </div>
        <h1 style="font-size:26px;font-weight:700;margin:0 0 10px 0;letter-spacing:-0.02em;">
          \${${JSON.stringify(prefs.introTitle || "Antigravity")}}
        </h1>
        <p style="font-size:14px;color:#94a3b8;margin:0 0 24px 0;line-height:1.5;">
          \${${JSON.stringify(prefs.artworkSubtitle || "Chào mừng bạn trở lại, chúc một ngày làm việc hiệu quả~")}}
        </p>
        <div style="width:100%;height:3px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;margin-bottom:20px;">
          <div id="__ag_progress" style="width:0%;height:100%;background:linear-gradient(90deg,#ec4899,#8b5cf6);transition:width 0.1s linear;"></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#64748b;">
          <span>STATUS: RESONANCE / ONLINE</span>
          <span style="cursor:pointer;color:#ec4899;text-decoration:underline;" id="__ag_skip">ESC / BỎ QUA</span>
        </div>
      </div>
      <div style="position:absolute;inset:0;background:radial-gradient(circle at center, rgba(236,72,153,0.12) 0%, transparent 70%);pointer-events:none;"></div>
    \`;
    document.body.appendChild(overlay);

    let progress = 0;
    const bar = document.getElementById("__ag_progress");
    const duration = ${prefs.startupAnimationDuration || 3.5} * 1000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    function finish() {
      if (!overlay || overlay.dataset.finished) return;
      overlay.dataset.finished = "true";
      overlay.style.opacity = "0";
      overlay.style.transform = "scale(1.03)";
      setTimeout(() => overlay.remove(), 800);
      window.removeEventListener("keydown", onKey);
    }

    const timer = setInterval(() => {
      progress += step;
      if (bar) bar.style.width = Math.min(progress, 100) + "%";
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(finish, 200);
      }
    }, intervalTime);

    function onKey(e) {
      if (e.key === "Escape" || e.key === " ") {
        clearInterval(timer);
        finish();
      }
    }
    window.addEventListener("keydown", onKey);
    const skipBtn = document.getElementById("__ag_skip");
    if (skipBtn) skipBtn.onclick = () => { clearInterval(timer); finish(); };
    overlay.onclick = () => { clearInterval(timer); finish(); };
    return "Overlay spawned";
  })()`;

  ws.send(JSON.stringify({
    id: Date.now(),
    method: "Runtime.evaluate",
    params: { expression: script }
  }));
}

async function run() {
  console.log("=== Antigravity Theme & Startup Animation Injector ===");
  const shouldPlayAnim = process.argv.includes("--with-animation") || process.argv.includes("--play-animation");
  const isWatchMode = !process.argv.includes("--once");

  let port;
  try {
    port = await launchAntigravityIfNeeded();
  } catch (err) {
    console.error("[Injector] Failed to find Antigravity:", err.message);
    process.exit(1);
  }

  // Get pages from DevTools
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.type === "page" && (t.url.includes("127.0.0.1") || t.title.includes("Antigravity")));

  if (!page || !page.webSocketDebuggerUrl) {
    console.error("[Injector] No active Antigravity page found. Targets:", targets);
    process.exit(1);
  }

  console.log(`[Injector] Connecting to: ${page.title} (${page.url})`);
  let prefs = await loadPreferences();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  setupCdp(ws);

  ws.onopen = async () => {
    console.log("[Injector] CDP Connected.");
    const result = await injectTheme(ws, prefs);
    console.log("[Injector]", result);

    if (shouldPlayAnim && prefs.startupAnimation) {
      console.log("[Injector] Playing startup animation overlay...");
      await injectStartupOverlay(ws, prefs);
    }

    if (!isWatchMode) {
      setTimeout(() => { ws.close(); process.exit(0); }, 500);
    }
  };

  ws.onerror = (err) => {
    console.error("[Injector] WebSocket error:", err.message);
  };

  ws.onclose = () => {
    console.log("[Injector] CDP Disconnected.");
    if (isWatchMode) {
      console.log("[Injector] Retrying connection in 3s...");
      setTimeout(run, 3000);
    }
  };

  if (isWatchMode) {
    // Watch preferences and theme CSS for changes
    fs.watchFile(PREF_PATH, { interval: 1000 }, async () => {
      console.log("[Injector] Preferences modified, re-injecting live...");
      prefs = await loadPreferences();
      if (ws.readyState === WebSocket.OPEN) {
        await injectTheme(ws, prefs);
      }
    });

    fs.watchFile(THEME_CSS_PATH, { interval: 1000 }, async () => {
      console.log("[Injector] Theme CSS modified, re-injecting live...");
      if (ws.readyState === WebSocket.OPEN) {
        await injectTheme(ws, prefs);
      }
    });
  }
}

run().catch((err) => {
  console.error("[Injector] Fatal error:", err);
  process.exit(1);
});

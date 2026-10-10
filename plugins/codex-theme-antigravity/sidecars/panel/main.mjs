import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Response, SidecarApp } from 'sidecar_sdk';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const PREF_DIR = join(homedir(), '.gemini', 'antigravity');
const PREF_FILE = join(PREF_DIR, 'theme-preferences.json');

const DEFAULT_PREFS = {
  enabled: true,
  wallpaper: 'assets/artwork.jpg',
  wallpaperOpacity: 0.90,
  wallpaperBlur: 0,
  glassBlur: 16,
  startupAnimation: true,
  soundEnabled: true,
  language: 'vi'
};

function loadPrefs() {
  try {
    if (existsSync(PREF_FILE)) {
      return { ...DEFAULT_PREFS, ...JSON.parse(readFileSync(PREF_FILE, 'utf8')) };
    }
  } catch (e) {
    console.error('Failed reading prefs:', e.message);
  }
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs) {
  mkdirSync(PREF_DIR, { recursive: true });
  writeFileSync(PREF_FILE, JSON.stringify(prefs, null, 2), 'utf8');
}

const app = new SidecarApp();

const readLocal = (file) => readFileSync(join(HERE, file), 'utf8');

app.page('/', () => readLocal('index.html'));
app.page('/app.js', () => readLocal('app.js'));
app.api('/styles.css', () => new Response(readLocal('styles.css'), { contentType: 'text/css' }), 'GET');

app.api('/api/preferences', () => loadPrefs(), 'GET');

app.api('/api/preferences', (data) => {
  const current = loadPrefs();
  const updated = {
    ...current,
    enabled: data.enabled !== undefined ? Boolean(data.enabled) : current.enabled,
    wallpaper: data.wallpaper || current.wallpaper,
    wallpaperOpacity: data.wallpaperOpacity !== undefined ? Number(data.wallpaperOpacity) : current.wallpaperOpacity,
    wallpaperBlur: data.wallpaperBlur !== undefined ? Number(data.wallpaperBlur) : current.wallpaperBlur,
    glassBlur: data.glassBlur !== undefined ? Number(data.glassBlur) : current.glassBlur,
    startupAnimation: data.startupAnimation !== undefined ? Boolean(data.startupAnimation) : current.startupAnimation,
    soundEnabled: data.soundEnabled !== undefined ? Boolean(data.soundEnabled) : current.soundEnabled,
    language: data.language || current.language
  };
  savePrefs(updated);
  return { success: true, preferences: updated };
});

app.api('/api/preview', async () => {
  try {
    // Run injector with animation
    const script = join(HERE, '../../../../antigravity/scripts/injector.mjs');
    if (existsSync(script)) {
      execFileAsync('node', [script, '--once', '--play-animation']).catch(() => {});
    }
    return { success: true, message: 'Playing animation preview' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.run();

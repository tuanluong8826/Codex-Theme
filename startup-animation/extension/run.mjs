import {execFile as rawExec, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:net';
import {realpath} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname, join, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import os from 'node:os';
import {buildInjection} from './payload.mjs';
import {connect, pageTarget, localSocket} from './cdp.mjs';

const exec = promisify(rawExec);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === 'win32';

const MESSAGES = {
  vi: {
    portNotLoopback: 'Cổng gỡ lỗi không giới hạn ở 127.0.0.1, dừng kết nối.',
    wrongUser: 'Người dùng sở hữu cổng không khớp.',
    wrongApp: 'Cổng gỡ lỗi không thuộc ứng dụng Codex mục tiêu.',
    missingBundle: 'Vui lòng khởi chạy từ ứng dụng Codex đã cài đặt.',
    appIdMismatch: 'Mã định danh ứng dụng không khớp (cần com.openai.codex).',
    sigMismatch: 'Không nhận diện được chữ ký OpenAI hợp lệ.',
    waitingPage: 'Đang đợi trang Codex sẵn sàng...',
    debugNotReady: 'Trang gỡ lỗi chưa sẵn sàng.',
    invalidList: 'Danh sách trang không hợp lệ.',
    noMainWindow: 'Chưa tìm thấy cửa sổ chính của Codex.',
    injectFailed: 'Không thể tải tập lệnh giao diện.',
    playingStarted: 'Hoạt ảnh khởi động đã bắt đầu trong cửa sổ Codex! (Nhấn ⌘⌥B hoặc Ctrl+Alt+B để mở Cài đặt hình ảnh)',
    assetFailed: 'Tải tài nguyên hoạt ảnh thất bại, lớp phủ đã được dọn sạch.',
    timeout: 'Hết thời gian chờ xác nhận khởi động hoạt ảnh.',
    attachFailed: 'Chưa thể kết nối tới phiên bản này: '
  },
  en: {
    portNotLoopback: 'Debugging port is not strictly limited to 127.0.0.1, aborting.',
    wrongUser: 'Port process owner does not match.',
    wrongApp: 'Debugging port does not belong to target Codex app.',
    missingBundle: 'Please launch from installed Codex application.',
    appIdMismatch: 'App identifier does not match (expected com.openai.codex).',
    sigMismatch: 'Not recognized as expected OpenAI signature.',
    waitingPage: 'Waiting for Codex page...',
    debugNotReady: 'Debug page not ready.',
    invalidList: 'Invalid target page list.',
    noMainWindow: 'Main window not found yet.',
    injectFailed: 'Appearance script failed to load.',
    playingStarted: 'Animation started in Codex window! (Press ⌘⌥B or Ctrl+Alt+B to open Image Settings)',
    assetFailed: 'Animation assets failed to load, overlay removed.',
    timeout: 'Animation startup confirmation timed out.',
    attachFailed: 'Could not connect to this build: '
  },
  zh: {
    portNotLoopback: '调试端口没有严格限定在 127.0.0.1，停止连接。',
    wrongUser: '端口所属用户不匹配。',
    wrongApp: '调试端口不属于目标 Codex 应用。',
    missingBundle: '请从安装的 Codex 应用启动。',
    appIdMismatch: '应用标识不匹配。',
    sigMismatch: '未识别为预期的 OpenAI 签名，停止启动。',
    waitingPage: '等待 Codex 页面...',
    debugNotReady: '调试页面尚未就绪。',
    invalidList: '无效页面列表。',
    noMainWindow: '尚未找到主窗口。',
    injectFailed: '外观脚本未能加载。',
    playingStarted: '已在 Codex 窗口开始播放。（按 ⌘⌥B 或 Ctrl+Alt+B 打开图片设置）',
    assetFailed: '动画素材加载失败，覆盖层已移除。',
    timeout: '动画启动确认超时。',
    attachFailed: '本版本暂未完成接入：'
  }
};

function msg(key) {
  let lang = process.env.DREAMSKIN_LANG || '';
  if (/^vi($|[-_])/i.test(lang)) lang = 'vi';
  else if (/^zh($|[-_])/i.test(lang)) lang = 'zh';
  else lang = 'en';
  return MESSAGES[lang]?.[key] || MESSAGES.en[key] || key;
}

async function command(file, args) {
  return (await exec(file, args, {timeout: 15000, maxBuffer: 1024 * 1024})).stdout.trim();
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

export async function verifyListener(port, bundle) {
  if (isWindows) {
    // Basic Windows loopback verification
    return;
  }
  const records = await command('/usr/sbin/lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpn']);
  const pids = [...records.matchAll(/^p(\d+)$/gm)].map(match => Number(match[1]));
  const addresses = [...records.matchAll(/^n(.+)$/gm)].map(match => match[1]);
  if (!pids.length || !addresses.length || addresses.some(value => value !== `127.0.0.1:${port}`)) {
    throw new Error(msg('portNotLoopback'));
  }
  for (const pid of new Set(pids)) {
    const uid = Number(await command('/bin/ps', ['-p', String(pid), '-o', 'uid=']));
    if (uid !== process.getuid()) throw new Error(msg('wrongUser'));
    if (bundle) {
      const files = await command('/usr/sbin/lsof', ['-a', '-p', String(pid), '-d', 'txt', '-Fn']);
      const executable = files.split('\n').find(line => line.startsWith('n'))?.slice(1);
      if (!executable || !(await realpath(executable)).startsWith(bundle + sep)) {
        throw new Error(msg('wrongApp'));
      }
    }
  }
}

async function findWindowsCodexExe() {
  const localAppData = process.env.LOCALAPPDATA || join(os.homedir(), 'AppData', 'Local');
  const candidates = [
    join(localAppData, 'Programs', 'OpenAI Codex', 'ChatGPT.exe'),
    join(localAppData, 'Programs', 'codex', 'Codex.exe'),
    join(process.env.ProgramFiles || 'C:\\Program Files', 'OpenAI.Codex', 'app', 'ChatGPT.exe')
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const portIndex = process.argv.indexOf('--port');
  const bundleIndex = process.argv.indexOf('--bundle');
  let port = portIndex >= 0 && process.argv[portIndex + 1] ? Number(process.argv[portIndex + 1]) : null;
  let bundle = null;

  if (!port && process.argv.includes('--antigravity')) {
    const portFile = !isWindows
      ? join(os.homedir(), 'Library', 'Application Support', 'Antigravity', 'DevToolsActivePort')
      : join(process.env.APPDATA || join(os.homedir(), 'AppData', 'Roaming'), 'Antigravity', 'DevToolsActivePort');
    if (existsSync(portFile)) {
      const content = (await import('node:fs/promises')).readFile(portFile, 'utf8');
      const p = Number((await content).trim().split(/\r?\n/)[0]);
      if (p) port = p;
    }
  }

  if (port) {
    // Directly attaching to an existing, verified CDP port (e.g. invoked from start script or Antigravity)
    // No need to spawn or re-open
  } else if (!isWindows) {
    // macOS standalone launcher
    const candidateBundle = bundleIndex >= 0 && process.argv[bundleIndex + 1]
      ? process.argv[bundleIndex + 1]
      : '/Applications/Codex.app';
    if (!existsSync(candidateBundle)) throw new Error(msg('missingBundle'));
    bundle = await realpath(candidateBundle);
    await command('/usr/bin/codesign', ['--verify', '--deep', '--strict', bundle]);
    const identifier = await command('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleIdentifier', join(bundle, 'Contents/Info.plist')]);
    if (identifier !== 'com.openai.codex') throw new Error(msg('appIdMismatch'));
    const {stderr: signature} = await exec('/usr/bin/codesign', ['-dv', '--verbose=4', bundle], {timeout: 15000});
    if (!signature.includes('TeamIdentifier=2DC432GLL2')) throw new Error(msg('sigMismatch'));
    port = await freePort();
    await command('/usr/bin/open', ['-n', '-a', bundle, '--args', '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${port}`]);
  } else {
    // Windows standalone launcher
    const exe = await findWindowsCodexExe();
    if (!exe) throw new Error(msg('missingBundle'));
    port = await freePort();
    const dataDir = join(process.env.LOCALAPPDATA || os.tmpdir(), 'CodexDreamSkin', 'cdp-profile');
    spawn(exe, [`--remote-debugging-address=127.0.0.1`, `--remote-debugging-port=${port}`, `--user-data-dir=${dataDir}`], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  }

  const source = await buildInjection(root, process.env.DREAMSKIN_LANG);
  const deadline = Date.now() + 45000;
  let lastError = msg('waitingPage');

  while (Date.now() < deadline) {
    let client;
    try {
      await verifyListener(port, bundle);
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(1200), redirect: 'error'});
      if (!response.ok) throw new Error(msg('debugNotReady'));
      const targets = await response.json();
      if (!Array.isArray(targets)) throw new Error(msg('invalidList'));
      const target = targets.find(pageTarget);
      if (!target) throw new Error(msg('noMainWindow'));

      client = await connect(localSocket(target.webSocketDebuggerUrl, port));
      const result = await client.call('Runtime.evaluate', {expression: source, returnByValue: true, awaitPromise: true});
      if (result.exceptionDetails || result.result?.value?.installed !== true) {
        throw new Error(msg('injectFailed'));
      }

      for (let attempt = 0; attempt < 50; attempt++) {
        const answer = await client.call('Runtime.evaluate', {expression: 'globalThis.__aemeathExtension?.status()', returnByValue: true});
        const state = answer.result?.value;
        if (state?.ready) {
          console.log(msg('playingStarted'));
          return;
        }
        if (state?.phase === 'failed' || state?.phase === 'timeout') {
          throw new Error(msg('assetFailed'));
        }
        await delay(100);
      }
      throw new Error(msg('timeout'));
    } catch (error) {
      lastError = error.message;
    } finally {
      client?.close();
    }
    await delay(150);
  }

  throw new Error(msg('attachFailed') + lastError);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

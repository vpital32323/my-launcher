const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client, Authenticator } = require('minecraft-launcher-core');

const isDev = process.argv.includes('--dev');
const TOKEN_LIFETIME_MS = 20 * 60 * 60 * 1000; // токен Microsoft живёт ~24 ч
let win = null;
let launching = false;

// ---------- пути и настройки ----------
const gameDir = () => path.join(app.getPath('appData'), '.mylauncher');
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

const DEFAULTS = {
  nick: 'Player',
  ram: 4,
  javaPath: '',
  version: '1.21.1',
  useFabric: true,
  account: null // { name, mclc, savedAt }
};

function readSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeSettings(patch) {
  const next = { ...readSettings(), ...patch };
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2));
  return next;
}

// то, что можно отдавать в интерфейс (без токенов)
const publicSettings = (s) => ({
  ...s,
  account: s.account ? { name: s.account.name, savedAt: s.account.savedAt } : null
});

const send = (channel, data) => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
};

// ---------- окно ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1040,
    height: 660,
    minWidth: 900,
    minHeight: 580,
    frame: false,
    show: false,
    backgroundColor: '#0a0a12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.handle('win:min', () => win?.minimize());
ipcMain.handle('win:max', () => (win?.isMaximized() ? win.unmaximize() : win?.maximize()));
ipcMain.handle('win:close', () => win?.close());

// ---------- настройки ----------
ipcMain.handle('settings:get', () => publicSettings(readSettings()));
ipcMain.handle('settings:save', (_e, patch) => {
  const allowed = ['nick', 'ram', 'javaPath', 'version', 'useFabric'];
  const clean = {};
  for (const k of allowed) if (k in patch) clean[k] = patch[k];
  if ('nick' in clean) clean.nick = String(clean.nick).replace(/[^\w]/g, '').slice(0, 16);
  if ('ram' in clean) clean.ram = Math.min(32, Math.max(1, Number(clean.ram) || 4));
  return publicSettings(writeSettings(clean));
});

// ---------- версии ----------
const FALLBACK_VERSIONS = ['1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5'];

ipcMain.handle('versions:get', async () => {
  try {
    const res = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    const data = await res.json();
    return data.versions.filter((v) => v.type === 'release').map((v) => v.id);
  } catch {
    return FALLBACK_VERSIONS;
  }
});

// ---------- Fabric ----------
async function ensureFabric(root, mcVersion) {
  const listRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`);
  if (!listRes.ok) throw new Error(`Fabric не поддерживает версию ${mcVersion}`);
  const loaders = await listRes.json();
  if (!loaders.length) throw new Error(`Fabric не поддерживает версию ${mcVersion}`);

  const loader = (loaders.find((l) => l.loader.stable) || loaders[0]).loader.version;
  const id = `fabric-loader-${loader}-${mcVersion}`;
  const file = path.join(root, 'versions', id, `${id}.json`);

  if (!fs.existsSync(file)) {
    const profRes = await fetch(
      `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loader}/profile/json`
    );
    if (!profRes.ok) throw new Error('Не удалось скачать профиль Fabric');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, await profRes.text());
  }
  return id;
}

// ---------- авторизация ----------
ipcMain.handle('auth:microsoft', async () => {
  try {
    const { Auth } = await import('msmc');
    const auth = new Auth('select_account');
    const xbox = await auth.launch('electron');
    const token = await xbox.getMinecraft();
    const account = {
      name: token.profile.name,
      mclc: token.mclc(),
      savedAt: Date.now()
    };
    writeSettings({ account });
    return { ok: true, name: account.name };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle('auth:logout', () => {
  writeSettings({ account: null });
  return true;
});

// ---------- запуск игры ----------
ipcMain.handle('game:launch', async (_e, { version, useFabric }) => {
  if (launching) return { ok: false, error: 'Игра уже запускается' };
  launching = true;

  try {
    const s = readSettings();
    const root = gameDir();
    fs.mkdirSync(path.join(root, 'mods'), { recursive: true });

    let authorization;
    if (s.account) {
      if (Date.now() - s.account.savedAt > TOKEN_LIFETIME_MS) {
        throw new Error('Сессия Microsoft истекла. Войдите заново в настройках.');
      }
      authorization = s.account.mclc;
    } else {
      if (!s.nick) throw new Error('Введите ник');
      authorization = Authenticator.getAuth(s.nick);
    }

    let custom;
    if (useFabric) {
      send('launcher:status', { text: 'Устанавливаю Fabric…' });
      custom = await ensureFabric(root, version);
    }

    const launcher = new Client();
    launcher.on('progress', (e) => {
      if (e.total) send('launcher:progress', { percent: Math.round((e.task / e.total) * 100) });
      send('launcher:status', { text: `Загрузка: ${e.type}` });
    });
    launcher.on('debug', (m) => send('launcher:log', String(m)));
    launcher.on('data', (m) => {
      send('launcher:log', String(m));
    });
    launcher.on('package-extract', () => send('launcher:status', { text: 'Распаковка файлов…' }));
    launcher.on('close', (code) => {
      launching = false;
      send('launcher:closed', { code });
    });

    send('launcher:status', { text: 'Подготовка…' });
    const proc = await launcher.launch({
      authorization,
      root,
      javaPath: s.javaPath || undefined,
      version: { number: version, type: 'release', ...(custom ? { custom } : {}) },
      memory: { max: `${s.ram}G`, min: '1G' }
    });

    if (!proc) {
      throw new Error('Не удалось запустить игру. Проверьте, что установлена Java.');
    }

    send('launcher:running', {});
    return { ok: true };
  } catch (err) {
    launching = false;
    const message = String(err?.message || err);
    send('launcher:error', { message });
    return { ok: false, error: message };
  }
});

// ---------- моды ----------
const modsDir = () => {
  const dir = path.join(gameDir(), 'mods');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const safeName = (name) => path.basename(String(name));

ipcMain.handle('mods:list', () => {
  const dir = modsDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
    .map((f) => ({
      name: f,
      enabled: f.endsWith('.jar'),
      size: fs.statSync(path.join(dir, f)).size
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

ipcMain.handle('mods:toggle', (_e, name) => {
  const dir = modsDir();
  const file = safeName(name);
  const from = path.join(dir, file);
  const to = file.endsWith('.disabled')
    ? path.join(dir, file.replace(/\.disabled$/, ''))
    : path.join(dir, `${file}.disabled`);
  if (fs.existsSync(from)) fs.renameSync(from, to);
  return true;
});

ipcMain.handle('mods:remove', (_e, name) => {
  const file = path.join(modsDir(), safeName(name));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return true;
});

ipcMain.handle('mods:add', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Выберите моды',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Моды Fabric', extensions: ['jar'] }]
  });
  if (res.canceled) return 0;
  const dir = modsDir();
  for (const src of res.filePaths) fs.copyFileSync(src, path.join(dir, path.basename(src)));
  return res.filePaths.length;
});

ipcMain.handle('folder:open', () => shell.openPath(gameDir()));

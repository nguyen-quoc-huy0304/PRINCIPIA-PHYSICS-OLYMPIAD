const { app, BrowserWindow, WebContentsView, ipcMain, shell, net } = require('electron');
const path = require('node:path');

const APP_URL = 'https://principia-physics-olympiad-pro.pages.dev/';
const BLOCKED_HOSTS = [
  'chatgpt.com',
  'claude.ai',
  'gemini.google.com',
  'copilot.microsoft.com'
];

let mainWindow;
let browserView;
let browserSession;
let currentBrowserUrl = '';

function isAllowedWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isKnownFrameBlocked(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return BLOCKED_HOSTS.some(domain => host === domain || host.endsWith('.' + domain));
  } catch {
    return false;
  }
}

async function isFrameBlocked(value) {
  if (isKnownFrameBlocked(value)) return true;
  try {
    const response = await net.fetch(value, { method: 'HEAD', redirect: 'follow' });
    const xFrameOptions = (response.headers.get('x-frame-options') || '').toLowerCase();
    if (xFrameOptions.includes('deny') || xFrameOptions.includes('sameorigin')) return true;
    const csp = response.headers.get('content-security-policy') || '';
    const directive = csp.split(';').map(part => part.trim()).find(part => /^frame-ancestors\s/i.test(part));
    if (!directive) return false;
    const sources = directive.replace(/^frame-ancestors\s+/i, '').split(/\s+/);
    if (sources.includes('*') || sources.includes('https:') || sources.includes('http:')) return false;
    const appOrigin = new URL(APP_URL).origin;
    const appHost = new URL(APP_URL).hostname;
    const allowed = sources.some(source => {
      if (source === "'none'") return false;
      if (source === "'self'") return false;
      try {
        const parsed = new URL(source.replace(/^\*\./, 'wildcard.'));
        if (parsed.origin === appOrigin) return true;
        if (source.includes('*.') && appHost.endsWith(parsed.hostname.replace(/^wildcard\./, ''))) return true;
      } catch {}
      return false;
    });
    return !allowed;
  } catch {
    return false;
  }
}

function safeBounds(bounds) {
  const x = Math.max(0, Math.round(Number(bounds?.x) || 0));
  const y = Math.max(0, Math.round(Number(bounds?.y) || 0));
  const width = Math.max(0, Math.round(Number(bounds?.width) || 0));
  const height = Math.max(0, Math.round(Number(bounds?.height) || 0));
  return { x, y, width, height };
}

function createBrowserView() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (browserView) return;
  browserView = new WebContentsView({
    webPreferences: {
      session: browserSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.contentView.addChildView(browserView);
  browserView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  browserView.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedWebUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  browserView.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedWebUrl(url)) event.preventDefault();
  });
  browserView.webContents.on('render-process-gone', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('principia-browser-error', 'Trang web vừa gặp sự cố. Hãy tải lại trang.');
    }
  });
}

function closeBrowserView() {
  if (!browserView) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    try { mainWindow.contentView.removeChildView(browserView); } catch {}
  }
  browserView.webContents.destroy();
  browserView = null;
  currentBrowserUrl = '';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 650,
    backgroundColor: '#0b1020',
    title: 'PRO',
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadURL(APP_URL);
  mainWindow.on('resize', () => {
    if (browserView && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('principia-browser-relayout');
    }
  });
  mainWindow.on('closed', () => {
    closeBrowserView();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  browserSession = require('electron').session.fromPartition('persist:principia-ai-browser');
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  ipcMain.handle('principia-browser:is-blocked', (_event, url) => isFrameBlocked(url));
  ipcMain.handle('principia-browser:open', async (_event, url, bounds) => {
    if (!isAllowedWebUrl(url)) {
      throw new Error('Chỉ hỗ trợ website có địa chỉ HTTP hoặc HTTPS.');
    }
    createBrowserView();
    const nextBounds = safeBounds(bounds);
    browserView.setBounds(nextBounds);
    if (currentBrowserUrl !== url) {
      currentBrowserUrl = url;
      await browserView.webContents.loadURL(url);
    }
    return true;
  });
  ipcMain.handle('principia-browser:bounds', (_event, bounds) => {
    if (browserView) browserView.setBounds(safeBounds(bounds));
    return true;
  });
  ipcMain.handle('principia-browser:close', () => {
    closeBrowserView();
    return true;
  });
  ipcMain.handle('principia-browser:reload', () => {
    if (browserView) browserView.webContents.reload();
    return true;
  });
  createWindow();
  setupAutoUpdates();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

function setupAutoUpdates() {
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-available', info => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('principia-update-status', { state: 'available', version: info.version });
  });
  autoUpdater.on('download-progress', progress => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('principia-update-status', { state: 'downloading', percent: Math.round(progress.percent) });
  });
  autoUpdater.on('update-downloaded', async info => {
    const choice = await dialog.showMessageBox(mainWindow, { type: 'info', buttons: ['Cập nhật ngay', 'Để sau'], defaultId: 0, cancelId: 1, title: 'PRINCIPIA có bản mới', message: 'Đã tải phiên bản ' + info.version + '. Khởi động lại để cập nhật?' });
    if (choice.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on('error', error => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('principia-update-status', { state: 'error', message: String(error.message || error) });
  });
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 8000);
}

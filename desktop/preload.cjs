const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('principiaDesktop', {
  isBlockedHost: (url) => ipcRenderer.invoke('principia-browser:is-blocked', url),
  openBlockedBrowser: (url, bounds) => ipcRenderer.invoke('principia-browser:open', url, bounds),
  updateBrowserBounds: (bounds) => ipcRenderer.invoke('principia-browser:bounds', bounds),
  closeBrowser: () => ipcRenderer.invoke('principia-browser:close'),
  reloadBrowser: () => ipcRenderer.invoke('principia-browser:reload'),
  onBrowserRelayout: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = () => callback();
    ipcRenderer.on('principia-browser-relayout', listener);
    return () => ipcRenderer.removeListener('principia-browser-relayout', listener);
  },
  onBrowserError: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('principia-browser-error', listener);
    return () => ipcRenderer.removeListener('principia-browser-error', listener);
  }
});
const { contextBridge, ipcRenderer } = require('electron')

console.log('[Chronos] preload loaded')

contextBridge.exposeInMainWorld('electronAPI', {
  startGoogleAuth: (clientId, clientSecret) =>
    ipcRenderer.invoke('google:start-auth', clientId, clientSecret),
  refreshGoogleToken: (clientId, clientSecret, refreshToken) =>
    ipcRenderer.invoke('google:refresh-token', clientId, clientSecret, refreshToken),
  canvasFetchAll: (url, token, path) =>
    ipcRenderer.invoke('canvas:fetch-all', url, token, path),
})

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWin = null

const REDIRECT_URI = 'http://localhost'

async function exchangeWithGoogle(params) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error_description || data.error)
  return data
}

ipcMain.handle('google:start-auth', (_, clientId, clientSecret) => {
  return new Promise((resolve, reject) => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar openid email profile')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'select_account consent')

    const win = new BrowserWindow({
      width: 500,
      height: 650,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: `google-auth-${Date.now()}`,
      },
    })

    win.loadURL(authUrl.toString())

    let settled = false
    const finish = async (url) => {
      if (settled || !url.startsWith(REDIRECT_URI)) return
      settled = true
      win.destroy()
      try {
        const parsed = new URL(url)
        const code = parsed.searchParams.get('code')
        const error = parsed.searchParams.get('error')
        if (error) return reject(new Error(error))
        if (!code) return reject(new Error('No authorization code received'))
        const tokens = await exchangeWithGoogle({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        })
        resolve({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        })
      } catch (e) {
        reject(e)
      }
    }

    win.webContents.on('will-redirect', (e, url) => {
      if (url.startsWith(REDIRECT_URI)) { e.preventDefault(); finish(url) }
    })
    win.webContents.on('will-navigate', (e, url) => {
      if (url.startsWith(REDIRECT_URI)) { e.preventDefault(); finish(url) }
    })
    win.on('closed', () => { if (!settled) reject(new Error('Window closed')) })
  })
})

ipcMain.handle('google:refresh-token', async (_, clientId, clientSecret, refreshToken) => {
  const tokens = await exchangeWithGoogle({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  return {
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }
})

ipcMain.handle('canvas:fetch-all', async (_, rawUrl, token, path) => {
  const base = rawUrl.startsWith('http') ? rawUrl.replace(/\/$/, '') : `https://${rawUrl}`
  const results = []
  let url = `${base}/api/v1/${path}`
  while (url) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Canvas ${res.status}: ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    if (!Array.isArray(data)) return data
    results.push(...data)
    const link = res.headers.get('link')
    const next = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = next?.[1] ?? null
  }
  return results
})

ipcMain.handle('notification:flash', () => {
  if (mainWin && !mainWin.isFocused()) {
    mainWin.flashFrame(true)
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    title: 'Chronos',
  })

  mainWin = win
  win.on('focus', () => win.flashFrame(false))

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

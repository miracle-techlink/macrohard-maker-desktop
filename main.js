const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron')
const { spawn, execFileSync } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')

const PORT = 8765
let pyProcess = null
let mainWindow = null
let splashWindow = null

// ── 路径 ──────────────────────────────────────────────────────────────
function getBackendPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'cf-path-planner')
    : path.join(__dirname, '..', '连续碳纤维3D打印', 'cf-path-planner')
}

function getPython() {
  const candidates = [
    '/home/liuyue/miniforge3/bin/python3',
    '/opt/conda/bin/python3',
    '/usr/local/bin/python3',
    '/usr/bin/python3',
    'python3',
  ]
  for (const p of candidates) {
    try {
      if (!p.startsWith('/')) return p
      if (fs.existsSync(p)) return p
    } catch {}
  }
  return 'python3'
}

// ── 依赖检测 ───────────────────────────────────────────────────────────
function checkDeps(python) {
  try {
    execFileSync(python, [
      '-c',
      'import numpy, scipy, meshio, skfem, gmsh',
    ], { timeout: 8000 })
    return true
  } catch {
    return false
  }
}

function installDeps(python, backendPath) {
  return new Promise((resolve, reject) => {
    const req = path.join(backendPath, 'webapp', 'requirements.txt')
    const proc = spawn(python, ['-m', 'pip', 'install', '-r', req, '-q'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    proc.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error(`pip exit ${code}`))
    })
    proc.on('error', reject)
  })
}

// ── 端口检测 ───────────────────────────────────────────────────────────
function isPortAlive() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/`, (res) => {
      resolve(res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => { req.destroy(); resolve(false) })
  })
}

function waitForServer(maxRetries = 40) {
  return new Promise((resolve, reject) => {
    let tries = 0
    const check = () => {
      const req = http.get(`http://localhost:${PORT}/`, (res) => {
        res.statusCode < 500 ? resolve() : retry()
      })
      req.on('error', retry)
      req.setTimeout(1000, () => { req.destroy(); retry() })
    }
    const retry = () => {
      ++tries >= maxRetries
        ? reject(new Error('服务器未在 20 秒内就绪'))
        : setTimeout(check, 500)
    }
    check()
  })
}

// ── 启动 Python server ─────────────────────────────────────────────────
function startPythonServer(python, backendPath) {
  return new Promise((resolve, reject) => {
    const script = path.join(backendPath, 'webapp', 'run.py')
    pyProcess = spawn(python, [script, '--port', String(PORT)], {
      cwd: backendPath,
      env: { ...process.env, PYTHONPATH: backendPath },
    })
    pyProcess.stdout.on('data', (d) => {
      const s = d.toString()
      console.log('[py]', s.trim())
      if (s.includes('CF-Path-Planner') || s.includes('Application startup complete') || s.includes('Uvicorn running')) resolve()
    })
    pyProcess.stderr.on('data', (d) => console.error('[py err]', d.toString().trim()))
    pyProcess.on('error', reject)
    setTimeout(resolve, 12000) // fallback
  })
}

// ── Splash ─────────────────────────────────────────────────────────────
function createSplash(msg = '正在启动计算引擎...') {
  splashWindow = new BrowserWindow({
    width: 480, height: 300,
    frame: false, transparent: true,
    alwaysOnTop: true, resizable: false,
    webPreferences: { contextIsolation: true },
  })
  splashWindow.loadFile(path.join(__dirname, 'splash.html'))
  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.webContents.executeJavaScript(
      `document.querySelector('.status').textContent = ${JSON.stringify(msg)}`
    ).catch(() => {})
  })
}

function setSplashMsg(msg) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript(
      `document.querySelector('.status').textContent = ${JSON.stringify(msg)}`
    ).catch(() => {})
  }
}

// ── Main window ────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900,
    minWidth: 1024, minHeight: 680,
    show: false,
    title: 'MacroHard Maker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(`http://localhost:${PORT}/`)

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy()
      splashWindow = null
    }
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Boot sequence ──────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createSplash()

  try {
    // 1. 检测端口是否已有 server
    const alive = await isPortAlive()
    if (alive) {
      console.log('[boot] 复用已有 server')
      createMainWindow()
      return
    }

    // 2. 找 Python
    const python = getPython()
    const backendPath = getBackendPath()
    console.log('[boot] python:', python, '  backend:', backendPath)

    // 3. 检测依赖
    setSplashMsg('检测 Python 依赖...')
    const depsOk = checkDeps(python)

    if (!depsOk) {
      setSplashMsg('首次运行：安装 Python 依赖（可能需要几分钟）...')
      console.log('[boot] installing deps...')
      await installDeps(python, backendPath)
      console.log('[boot] deps installed')
    }

    // 4. 启动 server
    setSplashMsg('启动计算引擎...')
    await startPythonServer(python, backendPath)
    await waitForServer()

    createMainWindow()
  } catch (err) {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy()
    dialog.showErrorBox('启动失败', `${err.message}\n\n请确保已安装 Python 3.9+`)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  if (pyProcess) { pyProcess.kill('SIGTERM'); pyProcess = null }
})

app.on('activate', () => {
  if (!mainWindow) createMainWindow()
})

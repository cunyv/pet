const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, globalShortcut } = require('electron')
const path = require('path')

const BASE_WINDOW_SIZE = { width: 200, height: 250 }
const SIZE_OPTIONS = [
  { label: '小', scale: 0.85 },
  { label: '标准', scale: 1 },
  { label: '大', scale: 1.2 }
]
const OPACITY_OPTIONS = [1, 0.85, 0.7, 0.55]

let mainWindow
let tray
let passthroughMode = false
let petSettings = {
  opacityIndex: 0,
  sizeIndex: 1,
  alwaysOnTop: true
}

function getCurrentSizeOption() {
  return SIZE_OPTIONS[petSettings.sizeIndex]
}

function getCurrentWindowSize() {
  const { scale } = getCurrentSizeOption()
  return {
    width: Math.round(BASE_WINDOW_SIZE.width * scale),
    height: Math.round(BASE_WINDOW_SIZE.height * scale)
  }
}

function getDefaultWindowPosition() {
  const display = screen.getPrimaryDisplay()
  const { x, y, width, height } = display.workArea
  const size = getCurrentWindowSize()

  return {
    x: x + width - size.width - 50,
    y: y + height - size.height - 50
  }
}

function getPublicSettings() {
  const sizeOption = getCurrentSizeOption()
  const opacity = OPACITY_OPTIONS[petSettings.opacityIndex]

  return {
    opacity,
    opacityLabel: `${Math.round(opacity * 100)}%`,
    size: sizeOption.scale,
    sizeLabel: sizeOption.label,
    alwaysOnTop: petSettings.alwaysOnTop
  }
}

function notifySettingsChanged() {
  if (mainWindow) {
    mainWindow.webContents.send('pet-settings-changed', getPublicSettings())
  }

  updateTrayMenu()
}

function applyPetSettings({ keepBottomRight = false } = {}) {
  if (!mainWindow) return

  const oldBounds = mainWindow.getBounds()
  const size = getCurrentWindowSize()

  if (keepBottomRight) {
    mainWindow.setBounds({
      x: oldBounds.x + oldBounds.width - size.width,
      y: oldBounds.y + oldBounds.height - size.height,
      width: size.width,
      height: size.height
    })
  } else {
    mainWindow.setSize(size.width, size.height)
  }
  mainWindow.webContents.setZoomFactor(getCurrentSizeOption().scale)
  mainWindow.setOpacity(OPACITY_OPTIONS[petSettings.opacityIndex])
  mainWindow.setAlwaysOnTop(petSettings.alwaysOnTop)
  notifySettingsChanged()
}

function applyMouseEvents(ignore, options) {
  if (!mainWindow) return

  if (passthroughMode) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
    return
  }

  mainWindow.setIgnoreMouseEvents(ignore, options)
}

function setPassthroughMode(enabled) {
  passthroughMode = enabled

  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
    mainWindow.webContents.send('passthrough-mode-changed', passthroughMode)
  }

  updateTrayMenu()
}

function togglePassthroughMode() {
  setPassthroughMode(!passthroughMode)
}

// 创建主窗口
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const size = getCurrentWindowSize()

  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: width - 250,
    y: height - 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadFile('src/index.html')
  applyPetSettings()

  // 允许鼠标事件穿透窗口（宠物以外的区域）
  applyMouseEvents(true, { forward: true })

  // 监听渲染进程的鼠标进入/离开事件
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    applyMouseEvents(ignore, options)
  })

  // 监听穿透模式开关
  ipcMain.on('set-passthrough-mode', (event, enabled) => {
    setPassthroughMode(Boolean(enabled))
  })

  // 监听窗口位置变化
  ipcMain.on('window-move', (event, { x, y }) => {
    const winBounds = mainWindow.getBounds()
    mainWindow.setPosition(winBounds.x + x, winBounds.y + y)
  })

  // 监听退出应用
  ipcMain.on('quit-app', () => {
    app.quit()
  })

  // 监听隐藏宠物
  ipcMain.on('hide-pet', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  // 监听窗口设置
  ipcMain.on('cycle-pet-opacity', () => {
    petSettings.opacityIndex = (petSettings.opacityIndex + 1) % OPACITY_OPTIONS.length
    applyPetSettings()
  })

  ipcMain.on('cycle-pet-size', () => {
    petSettings.sizeIndex = (petSettings.sizeIndex + 1) % SIZE_OPTIONS.length
    applyPetSettings({ keepBottomRight: true })
  })

  ipcMain.on('set-always-on-top', (event, enabled) => {
    petSettings.alwaysOnTop = Boolean(enabled)
    applyPetSettings()
  })

  ipcMain.on('reset-pet-position', () => {
    if (!mainWindow) return

    const position = getDefaultWindowPosition()
    mainWindow.setPosition(position.x, position.y)
  })

  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools({ mode: 'detach' })
}

function updateTrayMenu() {
  if (!tray) return

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示宠物',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
        }
      }
    },
    {
      label: '隐藏宠物',
      click: () => {
        if (mainWindow) {
          mainWindow.hide()
        }
      }
    },
    {
      label: '鼠标穿透模式 (⌘⇧P)',
      type: 'checkbox',
      checked: passthroughMode,
      click: (menuItem) => {
        setPassthroughMode(menuItem.checked)
      }
    },
    {
      label: '窗口置顶',
      type: 'checkbox',
      checked: petSettings.alwaysOnTop,
      click: (menuItem) => {
        petSettings.alwaysOnTop = menuItem.checked
        applyPetSettings()
      }
    },
    { type: 'separator' },
    {
      label: '喂食',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('feed-pet')
        }
      }
    },
    {
      label: '睡觉',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('pet-sleep')
        }
      }
    },
    {
      label: '叫醒',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('pet-wake')
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

// 创建系统托盘
function createTray() {
  const icon = nativeImage
    .createFromPath(path.join(__dirname, 'resources', 'icon.png'))
    .resize({ width: 18, height: 18 })
  tray = new Tray(icon)

  tray.setToolTip('像素宠物')
  updateTrayMenu()

  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow()
  createTray()
  globalShortcut.register('CommandOrControl+Shift+P', togglePassthroughMode)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用即将退出
app.on('before-quit', () => {
  globalShortcut.unregisterAll()
})

// IPC通信处理
ipcMain.handle('get-screen-size', () => {
  return screen.getPrimaryDisplay().workAreaSize
})

ipcMain.handle('get-window-position', () => {
  if (mainWindow) {
    const bounds = mainWindow.getBounds()
    return { x: bounds.x, y: bounds.y }
  }
  return { x: 0, y: 0 }
})

ipcMain.handle('get-cursor-position', () => {
  return screen.getCursorScreenPoint()
})

ipcMain.handle('get-passthrough-mode', () => {
  return passthroughMode
})

ipcMain.handle('get-pet-settings', () => {
  return getPublicSettings()
})

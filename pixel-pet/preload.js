const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 设置鼠标事件穿透
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options)
  },

  // 设置全局穿透模式
  setPassthroughMode: (enabled) => {
    ipcRenderer.send('set-passthrough-mode', enabled)
  },

  // 移动窗口
  moveWindow: (x, y) => {
    ipcRenderer.send('window-move', { x, y })
  },

  // 隐藏宠物
  hidePet: () => {
    ipcRenderer.send('hide-pet')
  },

  // 循环透明度档位
  cyclePetOpacity: () => {
    ipcRenderer.send('cycle-pet-opacity')
  },

  // 循环大小档位
  cyclePetSize: () => {
    ipcRenderer.send('cycle-pet-size')
  },

  // 设置窗口置顶
  setAlwaysOnTop: (enabled) => {
    ipcRenderer.send('set-always-on-top', enabled)
  },

  // 重置宠物位置
  resetPetPosition: () => {
    ipcRenderer.send('reset-pet-position')
  },

  // 退出应用
  quitApp: () => {
    ipcRenderer.send('quit-app')
  },

  // 获取屏幕尺寸
  getScreenSize: () => {
    return ipcRenderer.invoke('get-screen-size')
  },

  // 获取窗口位置
  getWindowPosition: () => {
    return ipcRenderer.invoke('get-window-position')
  },

  // 获取鼠标屏幕坐标
  getCursorPosition: () => {
    return ipcRenderer.invoke('get-cursor-position')
  },

  // 获取全局穿透模式
  getPassthroughMode: () => {
    return ipcRenderer.invoke('get-passthrough-mode')
  },

  // 获取窗口设置
  getPetSettings: () => {
    return ipcRenderer.invoke('get-pet-settings')
  },

  // 监听喂食事件
  onFeedPet: (callback) => {
    ipcRenderer.on('feed-pet', () => callback())
  },

  // 监听睡觉事件
  onPetSleep: (callback) => {
    ipcRenderer.on('pet-sleep', () => callback())
  },

  // 监听叫醒事件
  onPetWake: (callback) => {
    ipcRenderer.on('pet-wake', () => callback())
  },

  // 监听穿透模式变化
  onPassthroughModeChanged: (callback) => {
    ipcRenderer.on('passthrough-mode-changed', (event, enabled) => callback(enabled))
  },

  // 监听窗口设置变化
  onPetSettingsChanged: (callback) => {
    ipcRenderer.on('pet-settings-changed', (event, settings) => callback(settings))
  },

  // 移除所有监听器
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// 交互管理器
class InteractionManager {
  constructor(pet, effectsManager) {
    this.pet = pet
    this.effectsManager = effectsManager

    // 拖拽状态
    this.isDragging = false
    this.hasDragged = false
    this.dragStartX = 0
    this.dragStartY = 0
    this.dragThreshold = 5

    // 点击状态
    this.lastClickTime = 0
    this.doubleClickDelay = 300

    // 右键菜单
    this.contextMenu = document.getElementById('context-menu')
    this.isContextMenuVisible = false

    // 鼠标穿透状态：只在真正可见的像素/浮层上接管鼠标。
    this.isIgnoringMouseEvents = true
    this.passthroughMode = false
    this.petSettings = {
      opacityLabel: '100%',
      sizeLabel: '标准',
      alwaysOnTop: true
    }
    this.autoHideEnabled = false
    this.autoHideDelay = 30000
    this.autoHideTimer = null
    this.lastMouseX = 0
    this.lastMouseY = 0
    this.mouseTrackingFrame = null
  }

  // 初始化交互
  init() {
    this.setupDrag()
    this.setupClick()
    this.setupContextMenu()
    this.setupMouseTracking()
    this.setupElectronEvents()
  }

  // 设置拖拽功能
  setupDrag() {
    const container = document.getElementById('pet-container')

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      this.recordUserActivity()
      this.isDragging = true
      this.hasDragged = false
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return

      const deltaX = e.clientX - this.dragStartX
      const deltaY = e.clientY - this.dragStartY

      if (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold) {
        this.hasDragged = true

        if (window.electronAPI) {
          window.electronAPI.moveWindow(deltaX, deltaY)
        }

        this.dragStartX = e.clientX
        this.dragStartY = e.clientY

        if (this.pet.state !== PetState.WALKING) {
          this.pet.setState(PetState.WALKING)
        }

        this.pet.setDirection(deltaX > 0 ? Direction.RIGHT : Direction.LEFT)
      }
    })

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false
        if (this.pet.state === PetState.WALKING && this.hasDragged) {
          this.pet.setState(PetState.IDLE)
        }
        this.updateMousePassthrough(this.lastMouseX, this.lastMouseY)
      }
    })
  }

  // 设置点击功能
  setupClick() {
    const container = document.getElementById('pet-container')

    container.addEventListener('click', (e) => {
      if (e.button !== 0) return
      if (this.hasDragged) return
      this.recordUserActivity()

      const currentTime = Date.now()
      const timeDiff = currentTime - this.lastClickTime

      if (timeDiff < this.doubleClickDelay) {
        this.handleDoubleClick(e)
        this.lastClickTime = 0
      } else {
        this.lastClickTime = currentTime
        setTimeout(() => {
          if (this.lastClickTime === currentTime) {
            this.handleClick(e)
          }
        }, this.doubleClickDelay)
      }
    })
  }

  // 处理单击 - 摸头
  handleClick(e) {
    if (this.isContextMenuVisible) {
      this.hideContextMenu()
      return
    }

    this.pet.pet()
    this.effectsManager.playPetEffect()
  }

  // 处理双击 - 喂食
  handleDoubleClick(e) {
    this.pet.feed()
    this.effectsManager.playFeedEffect()
  }

  // 设置右键菜单
  setupContextMenu() {
    const container = document.getElementById('pet-container')

    // 右键点击显示菜单
    container.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.recordUserActivity()
      this.showContextMenu(e.clientX, e.clientY)
    })

    // 左键点击其他地方隐藏菜单
    document.addEventListener('mousedown', (e) => {
      if (this.isContextMenuVisible && !this.contextMenu.contains(e.target)) {
        this.hideContextMenu()
      }
    })

    // 菜单项点击 - 使用事件委托
    this.contextMenu.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item')
      if (!menuItem) return

      const action = menuItem.dataset.action
      this.handleMenuAction(action)
      this.hideContextMenu()
    })

    // 阻止菜单内部的右键
    this.contextMenu.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
  }

  // 显示右键菜单
  showContextMenu(x, y) {
    if (!this.contextMenu) return

    this.setMousePassthrough(false)
    this.updateContextMenuState()

    // 先显示菜单以获取实际尺寸
    this.contextMenu.style.left = '0px'
    this.contextMenu.style.top = '0px'
    this.contextMenu.classList.remove('hidden')
    this.isContextMenuVisible = true

    const menuRect = this.contextMenu.getBoundingClientRect()
    const menuWidth = menuRect.width || 130
    const menuHeight = menuRect.height || 250

    // 调整X坐标
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 5
    }
    if (x < 5) x = 5

    // 调整Y坐标 - 确保底部不被截断
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 5
    }
    if (y < 5) y = 5

    this.contextMenu.style.left = `${x}px`
    this.contextMenu.style.top = `${y}px`
  }

  // 隐藏右键菜单
  hideContextMenu() {
    if (!this.contextMenu) return
    this.contextMenu.classList.add('hidden')
    this.isContextMenuVisible = false
    this.updateMousePassthrough(this.lastMouseX, this.lastMouseY)
  }

  updateContextMenuState() {
    if (!this.contextMenu) return

    const passthroughItem = this.contextMenu.querySelector('[data-action="toggle-passthrough"]')
    if (passthroughItem) {
      const label = passthroughItem.querySelector('.menu-label')
      const check = passthroughItem.querySelector('.menu-check')

      passthroughItem.classList.toggle('active', this.passthroughMode)

      if (label) {
        label.textContent = this.passthroughMode ? '关闭穿透模式' : '开启穿透模式'
      }

      if (check) {
        check.textContent = this.passthroughMode ? '✓' : ''
      }
    }

    const opacityValue = this.contextMenu.querySelector('[data-setting="opacity"]')
    if (opacityValue) {
      opacityValue.textContent = this.petSettings.opacityLabel
    }

    const sizeValue = this.contextMenu.querySelector('[data-setting="size"]')
    if (sizeValue) {
      sizeValue.textContent = this.petSettings.sizeLabel
    }

    const alwaysOnTopItem = this.contextMenu.querySelector('[data-action="toggle-always-on-top"]')
    if (alwaysOnTopItem) {
      alwaysOnTopItem.classList.toggle('active', this.petSettings.alwaysOnTop)
    }

    const alwaysOnTopCheck = this.contextMenu.querySelector('[data-setting="always-on-top"]')
    if (alwaysOnTopCheck) {
      alwaysOnTopCheck.textContent = this.petSettings.alwaysOnTop ? '✓' : ''
    }

    const autoHideItem = this.contextMenu.querySelector('[data-action="toggle-auto-hide"]')
    if (autoHideItem) {
      autoHideItem.classList.toggle('active', this.autoHideEnabled)
    }

    const autoHideCheck = this.contextMenu.querySelector('[data-setting="auto-hide"]')
    if (autoHideCheck) {
      autoHideCheck.textContent = this.autoHideEnabled ? '✓' : ''
    }
  }

  // 处理菜单动作
  handleMenuAction(action) {
    console.log('菜单动作:', action)
    this.recordUserActivity()

    switch (action) {
      case 'feed':
        this.pet.feed()
        this.effectsManager.playFeedEffect()
        break

      case 'sleep':
        this.pet.sleep()
        this.effectsManager.playSleepEffect()
        break

      case 'wake':
        this.pet.wake()
        break

      case 'pet':
        this.pet.pet()
        this.effectsManager.playPetEffect()
        break

      case 'toggle-passthrough':
        this.setPassthroughMode(!this.passthroughMode)
        break

      case 'cycle-opacity':
        if (window.electronAPI) {
          window.electronAPI.cyclePetOpacity()
        }
        break

      case 'cycle-size':
        if (window.electronAPI) {
          window.electronAPI.cyclePetSize()
        }
        break

      case 'toggle-always-on-top':
        this.petSettings.alwaysOnTop = !this.petSettings.alwaysOnTop
        this.updateContextMenuState()
        if (window.electronAPI) {
          window.electronAPI.setAlwaysOnTop(this.petSettings.alwaysOnTop)
        }
        break

      case 'toggle-auto-hide':
        this.setAutoHideEnabled(!this.autoHideEnabled)
        break

      case 'reset-position':
        if (window.electronAPI) {
          window.electronAPI.resetPetPosition()
        }
        this.pet.showSpeechBubble('回到角落', 1200)
        break

      case 'hide':
        if (window.electronAPI) {
          window.electronAPI.hidePet()
        }
        break

      case 'exit':
        // 通过IPC通知主进程退出
        if (window.electronAPI) {
          window.electronAPI.quitApp()
        } else {
          window.close()
        }
        break
    }
  }

  // 设置鼠标追踪
  setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
      this.recordUserActivity()
      this.pet.noticeMouse()

      if (this.mouseTrackingFrame) return

      this.mouseTrackingFrame = requestAnimationFrame(() => {
        this.mouseTrackingFrame = null
        this.updateMousePassthrough(this.lastMouseX, this.lastMouseY)
      })
    })

    document.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.setMousePassthrough(true)
      }
    })
  }

  // 只让看得见的宠物像素、气泡、动画和菜单响应鼠标。
  isVisibleHitTarget(x, y) {
    const target = document.elementFromPoint(x, y)
    if (!target) return false

    if (this.contextMenu && !this.contextMenu.classList.contains('hidden') && this.contextMenu.contains(target)) {
      return true
    }

    const floatingTarget = target.closest('#speech-bubble:not(.hidden), #status-indicator:not(.hidden), #food-animation:not(.hidden), .sleep-zzz')
    if (floatingTarget) {
      return true
    }

    const pixel = target.closest('.px')
    if (!pixel || !this.pet.petElement.contains(pixel)) {
      return false
    }

    const style = window.getComputedStyle(pixel)
    return style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
  }

  updateMousePassthrough(x, y) {
    if (this.passthroughMode) {
      this.setMousePassthrough(true)
      return
    }

    if (this.isDragging) {
      this.setMousePassthrough(false)
      return
    }

    this.setMousePassthrough(!this.isVisibleHitTarget(x, y))
  }

  setMousePassthrough(ignore) {
    if (!window.electronAPI || this.isIgnoringMouseEvents === ignore) return

    this.isIgnoringMouseEvents = ignore
    window.electronAPI.setIgnoreMouseEvents(ignore, ignore ? { forward: true } : undefined)
  }

  setPassthroughMode(enabled) {
    this.passthroughMode = Boolean(enabled)
    this.updateContextMenuState()

    if (window.electronAPI) {
      window.electronAPI.setPassthroughMode(this.passthroughMode)
    }

    this.setMousePassthrough(this.passthroughMode)
    this.pet.showSpeechBubble(this.passthroughMode ? '穿透开启' : '穿透关闭', 1200)
  }

  setAutoHideEnabled(enabled) {
    this.autoHideEnabled = Boolean(enabled)
    this.updateContextMenuState()

    if (this.autoHideEnabled) {
      this.recordUserActivity()
    } else if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
      this.autoHideTimer = null
    }

    this.pet.showSpeechBubble(this.autoHideEnabled ? '自动隐藏开启' : '自动隐藏关闭', 1200)
  }

  recordUserActivity() {
    if (!this.autoHideEnabled) return

    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
    }

    this.autoHideTimer = setTimeout(() => {
      if (this.isDragging || this.isContextMenuVisible) {
        this.recordUserActivity()
        return
      }

      if (window.electronAPI) {
        window.electronAPI.hidePet()
      }
    }, this.autoHideDelay)
  }

  // 设置Electron事件监听
  setupElectronEvents() {
    if (!window.electronAPI) return

    Promise.all([
      window.electronAPI.getPassthroughMode(),
      window.electronAPI.getPetSettings()
    ]).then(([enabled, settings]) => {
      this.passthroughMode = Boolean(enabled)
      this.petSettings = { ...this.petSettings, ...settings }
      this.updateContextMenuState()
      this.updateMousePassthrough(this.lastMouseX, this.lastMouseY)
    })

    window.electronAPI.onFeedPet(() => {
      this.pet.feed()
      this.effectsManager.playFeedEffect()
    })

    window.electronAPI.onPetSleep(() => {
      this.pet.sleep()
      this.effectsManager.playSleepEffect()
    })

    window.electronAPI.onPetWake(() => {
      this.pet.wake()
    })

    window.electronAPI.onPassthroughModeChanged((enabled) => {
      this.passthroughMode = Boolean(enabled)
      this.updateContextMenuState()
      this.updateMousePassthrough(this.lastMouseX, this.lastMouseY)
    })

    window.electronAPI.onPetSettingsChanged((settings) => {
      this.petSettings = { ...this.petSettings, ...settings }
      this.updateContextMenuState()
    })
  }

  // 清理资源
  destroy() {
    if (window.electronAPI) {
      window.electronAPI.removeAllListeners('feed-pet')
      window.electronAPI.removeAllListeners('pet-sleep')
      window.electronAPI.removeAllListeners('pet-wake')
      window.electronAPI.removeAllListeners('passthrough-mode-changed')
      window.electronAPI.removeAllListeners('pet-settings-changed')
    }

    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
    }
  }
}

// 主应用类
class PetApp {
  constructor() {
    this.pet = new Pet()
    this.animationController = null
    this.effectsManager = null
    this.interactionManager = null
    this.init()
  }

  // 初始化应用
  init() {
    if (!this.pet.init()) {
      console.error('宠物初始化失败')
      return
    }

    this.animationController = new AnimationController(this.pet)
    this.animationController.init()

    this.effectsManager = new EffectsManager(this.pet, this.animationController)

    this.interactionManager = new InteractionManager(this.pet, this.effectsManager)
    this.interactionManager.init()

    this.pet.onStateChange = (oldState, newState) => {
      this.handleStateChange(oldState, newState)
    }

    this.showWelcomeMessage()
    console.log('像素宠物初始化完成！')
  }

  // 处理状态变化
  handleStateChange(oldState, newState) {
    console.log(`状态变化: ${oldState} -> ${newState}`)

    switch (newState) {
      case PetState.HAPPY:
        this.effectsManager.playPetEffect()
        break
      case PetState.EATING:
        this.effectsManager.playFeedEffect()
        break
      case PetState.SLEEPING:
        this.effectsManager.playSleepEffect()
        break
    }
  }

  // 显示欢迎消息
  showWelcomeMessage() {
    const messages = ['你好呀！', '欢迎~', '摸摸我吧！', '我好饿...']
    const msg = messages[Math.floor(Math.random() * messages.length)]

    setTimeout(() => {
      this.pet.showSpeechBubble(msg, 3000)
    }, 1000)
  }

  // 获取应用状态
  getStatus() {
    return this.pet.getStatus()
  }

  // 清理资源
  destroy() {
    this.pet.destroy()
    this.animationController.destroy()
    this.interactionManager.destroy()
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InteractionManager, PetApp }
}

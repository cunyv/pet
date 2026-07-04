// 宠物状态枚举
const PetState = {
  IDLE: 'idle',
  WALKING: 'walking',
  SLEEPING: 'sleeping',
  HAPPY: 'happy',
  EATING: 'eating',
  BORED: 'bored',
  SLEEPY: 'sleepy',
  HUNGRY: 'hungry',
  SAD: 'sad',
  FOLLOWING: 'following'
}

// 朝向枚举
const Direction = {
  LEFT: 'left',
  RIGHT: 'right'
}

// 宠物核心类
class Pet {
  constructor() {
    this.state = PetState.IDLE
    this.direction = Direction.RIGHT
    this.mood = 100 // 心情值 0-100
    this.energy = 100 // 精力值 0-100
    this.hunger = 0 // 饥饿度 0-100
    this.boredom = 0 // 无聊度 0-100

    // 位置信息
    this.x = 24 // 相对于容器的位置
    this.y = 10

    // 皮肤
    this.currentSkin = 'human'

    // 拖拽状态
    this.isDragging = false

    // 动画定时器
    this.animationTimer = null
    this.behaviorTimer = null
    this.stateTimer = null

    // 自动行为配置
    this.autoBehaviorInterval = 5000 // 5秒检查一次
    this.walkSpeed = 2
    this.walkDuration = 3000
    this.followSpeed = 12
    this.followDuration = 6000
    this.followDistance = 95

    // DOM元素
    this.petElement = null
    this.containerElement = null

    // 状态变化回调
    this.onStateChange = null
    this.onDirectionChange = null
  }

  // 初始化
  init() {
    this.petElement = document.getElementById('pet')
    this.containerElement = document.getElementById('pet-container')

    if (!this.petElement || !this.containerElement) {
      console.error('宠物元素未找到')
      return false
    }

    // 渲染初始皮肤
    if (typeof switchSkin === 'function') {
      switchSkin(this.currentSkin)
    }

    this.setupAutoBehavior()
    this.updateDisplay()

    return true
  }

  // 设置状态
  setState(newState) {
    if (this.state === newState) return

    const oldState = this.state
    this.clearStateTimer()

    // 离开行走状态时清除行走定时器
    if (oldState === PetState.WALKING && this.walkInterval) {
      clearInterval(this.walkInterval)
      this.walkInterval = null
    }

    this.state = newState

    // 更新DOM类名
    this.petElement.className = `pet ${newState} face-${this.direction}`

    // 触发状态变化回调
    if (this.onStateChange) {
      this.onStateChange(oldState, newState)
    }

    // 状态特定的处理
    this.handleStateEnter(newState)
  }

  // 处理进入新状态
  handleStateEnter(state) {
    switch (state) {
      case PetState.SLEEPING:
        this.showSleepBubble()
        break
      case PetState.HAPPY:
        // 2秒后回到待机
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.HAPPY) {
            this.setState(PetState.IDLE)
          }
        }, 2000)
        break
      case PetState.EATING:
        // 1.5秒后回到待机
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.EATING) {
            this.setState(PetState.IDLE)
          }
        }, 1500)
        break
      case PetState.BORED:
        this.showSpeechBubble(pickDialogue('bored'), 1600)
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.BORED) {
            Math.random() < 0.45 ? this.startFollowingMouse() : this.setState(PetState.IDLE)
          }
        }, 2500)
        break
      case PetState.SLEEPY:
        this.showSpeechBubble(pickDialogue('sleepy'), 1600)
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.SLEEPY) {
            this.energy < 18 ? this.sleep() : this.setState(PetState.IDLE)
          }
        }, 2500)
        break
      case PetState.HUNGRY:
        this.showSpeechBubble(pickDialogue('hungry'), 1800)
        break
      case PetState.SAD:
        this.showSpeechBubble(pickDialogue('bored'), 1800)
        break
      case PetState.FOLLOWING:
        this.showSpeechBubble('等等我~', 1200)
        this.followMouse()
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.FOLLOWING) {
            this.setState(PetState.IDLE)
          }
        }, this.followDuration)
        break
    }
  }

  // 设置朝向
  setDirection(direction) {
    if (this.direction === direction) return

    this.direction = direction
    this.petElement.className = `pet ${this.state} face-${direction}`

    if (this.onDirectionChange) {
      this.onDirectionChange(direction)
    }
  }

  // 更新显示
  updateDisplay() {
    if (!this.petElement) return
    this.petElement.className = `pet ${this.state} face-${this.direction}`
  }

  // 显示睡眠气泡
  showSleepBubble() {
    // 清除旧的定时器，防止内存泄漏
    if (this.sleepBubbleInterval) {
      clearInterval(this.sleepBubbleInterval)
      this.sleepBubbleInterval = null
    }

    // 移除现有的气泡
    const existingBubble = document.querySelector('.sleep-zzz')
    if (existingBubble) {
      existingBubble.remove()
    }

    // 创建新的ZZZ气泡
    const bubble = document.createElement('div')
    bubble.className = 'sleep-zzz'
    bubble.textContent = '💤'
    this.petElement.appendChild(bubble)

    // 睡觉时定期显示ZZZ
    this.sleepBubbleInterval = setInterval(() => {
      if (this.state !== PetState.SLEEPING) {
        clearInterval(this.sleepBubbleInterval)
        const b = document.querySelector('.sleep-zzz')
        if (b) b.remove()
        return
      }

      const newBubble = document.createElement('div')
      newBubble.className = 'sleep-zzz'
      newBubble.textContent = '💤'
      this.petElement.appendChild(newBubble)

      setTimeout(() => {
        newBubble.remove()
      }, 2000)
    }, 2500)
  }

  // 显示爱心
  showHearts() {
    const indicator = document.getElementById('status-indicator')
    if (indicator) {
      indicator.classList.remove('hidden')
      setTimeout(() => {
        indicator.classList.add('hidden')
      }, 2000)
    }
  }

  // 显示气泡对话
  showSpeechBubble(text, duration = 2000) {
    const bubble = document.getElementById('speech-bubble')
    if (!bubble) return

    const content = bubble.querySelector('.bubble-content')
    if (content) {
      content.textContent = text
    }

    bubble.classList.remove('hidden')

    // 自动隐藏
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout)
    }

    this.speechTimeout = setTimeout(() => {
      bubble.classList.add('hidden')
    }, duration)
  }

  // 设置自动行为
  setupAutoBehavior() {
    this.behaviorTimer = setInterval(() => {
      this.autoBehavior()
    }, this.autoBehaviorInterval)
  }

  // 自动行为逻辑
  autoBehavior() {
    // 如果正在被交互或被拖拽，跳过
    if (this.isBusyState() || this.isDragging) {
      this.updateStats()
      return
    }

    this.updateStats()
    if (this.evaluateNeeds()) return

    // 根据当前状态决定行为
    switch (this.state) {
      case PetState.IDLE:
        // 随机决定是走路还是继续待机
        if (Math.random() < 0.4) {
          this.startWalking()
        }
        break

      case PetState.WALKING:
        // 走路一段时间后停止
        break

      case PetState.SLEEPING:
        // 睡觉时恢复精力
        // 精力恢复满后醒来
        if (this.energy >= 100) {
          this.wake()
        }
        break

      case PetState.BORED:
        if (Math.random() < 0.35) {
          this.startFollowingMouse()
        }
        break

      case PetState.HUNGRY:
      case PetState.SAD:
      case PetState.SLEEPY:
        if (Math.random() < 0.25) {
          this.setState(PetState.IDLE)
        }
        break
    }
  }

  // 更新状态值
  updateStats() {
    // 精力随时间下降
    if (this.state !== PetState.SLEEPING) {
      this.energy = Math.max(0, this.energy - 1.2)
    } else {
      this.energy = Math.min(100, this.energy + 8)
    }

    // 饥饿度随时间增加
    this.hunger = Math.min(100, this.hunger + 1.8)
    this.boredom = Math.min(100, this.boredom + 2.4)

    // 心情根据状态变化
    if (this.hunger > 80) {
      this.mood = Math.max(0, this.mood - 4)
    } else if (this.boredom > 75) {
      this.mood = Math.max(0, this.mood - 2)
    } else if (this.state === PetState.HAPPY) {
      this.mood = Math.min(100, this.mood + 5)
    }
  }

  evaluateNeeds() {
    if (this.state === PetState.SLEEPING) return false

    if (this.hunger >= 85 && this.state !== PetState.HUNGRY) {
      this.setState(PetState.HUNGRY)
      return true
    }

    if (this.energy <= 18 && this.state !== PetState.SLEEPY) {
      this.setState(PetState.SLEEPY)
      return true
    }

    if (this.mood <= 25 && this.state !== PetState.SAD) {
      this.setState(PetState.SAD)
      return true
    }

    if (this.boredom >= 75 && this.state !== PetState.BORED) {
      this.setState(PetState.BORED)
      return true
    }

    return false
  }

  isBusyState() {
    return this.state === PetState.HAPPY ||
      this.state === PetState.EATING ||
      this.state === PetState.FOLLOWING
  }

  clearStateTimer() {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer)
      this.stateTimer = null
    }
  }

  // 开始走路
  startWalking() {
    if (this.state === PetState.SLEEPING || this.state === PetState.FOLLOWING || this.isDragging) return

    // 清除旧的行走定时器，防止多个 interval 同时运行
    if (this.walkInterval) {
      clearInterval(this.walkInterval)
      this.walkInterval = null
    }

    this.setState(PetState.WALKING)

    // 随机选择方向
    const direction = Math.random() < 0.5 ? Direction.LEFT : Direction.RIGHT
    this.setDirection(direction)

    // 开始走路动画
    this.walkAnimation(direction)

    // 走路一段时间后停止
    this.stateTimer = setTimeout(() => {
      if (this.state === PetState.WALKING) {
        this.setState(PetState.IDLE)
      }
    }, this.walkDuration)
  }

  // 走路动画（单一 interval，边界自动反向）
  walkAnimation(direction) {
    if (this.walkInterval) {
      clearInterval(this.walkInterval)
    }

    const containerWidth = this.containerElement ? this.containerElement.offsetWidth : 200
    const petWidth = 64
    const minX = 20
    const maxX = containerWidth - petWidth - 20

    this.walkInterval = setInterval(() => {
      if (this.state !== PetState.WALKING || this.isDragging) {
        clearInterval(this.walkInterval)
        this.walkInterval = null
        return
      }

      const step = this.direction === Direction.LEFT ? -this.walkSpeed : this.walkSpeed
      this.x += step

      // 边界检测：到达边界时反向，不递归创建新 interval
      if (this.x <= minX) {
        this.x = minX
        this.setDirection(Direction.RIGHT)
      } else if (this.x >= maxX) {
        this.x = maxX
        this.setDirection(Direction.LEFT)
      }

      this.petElement.style.left = `${this.x}px`
    }, 50)
  }

  // 开始跟随鼠标
  startFollowingMouse() {
    if (this.state === PetState.SLEEPING || this.state === PetState.EATING) return
    if (!window.electronAPI || !window.electronAPI.getCursorPosition) return

    this.boredom = Math.max(0, this.boredom - 30)
    this.setState(PetState.FOLLOWING)
  }

  // 跟随鼠标移动窗口
  followMouse() {
    if (this.followInterval) {
      clearInterval(this.followInterval)
    }

    this.followInterval = setInterval(async () => {
      if (this.state !== PetState.FOLLOWING || !window.electronAPI) {
        clearInterval(this.followInterval)
        return
      }

      try {
        const [cursor, windowPosition] = await Promise.all([
          window.electronAPI.getCursorPosition(),
          window.electronAPI.getWindowPosition()
        ])

        const petCenterX = windowPosition.x + this.x + 32
        const petCenterY = windowPosition.y + 120
        const deltaX = cursor.x - petCenterX
        const deltaY = cursor.y - petCenterY
        const distance = Math.hypot(deltaX, deltaY)

        if (distance < this.followDistance) {
          return
        }

        const stepX = Math.round((deltaX / distance) * this.followSpeed)
        const stepY = Math.round((deltaY / distance) * this.followSpeed)

        window.electronAPI.moveWindow(stepX, stepY)

        if (Math.abs(deltaX) > 8) {
          this.setDirection(deltaX > 0 ? Direction.RIGHT : Direction.LEFT)
        }
      } catch (err) {
        console.warn('跟随鼠标 IPC 调用失败:', err.message)
        clearInterval(this.followInterval)
      }
    }, 80)
  }

  // 看到鼠标时的反应：转头盯着看，高无聊度时跟随
  noticeMouse(cursorX) {
    if (this.isDragging) return

    // IDLE 状态下经常朝鼠标方向转头
    if (this.state === PetState.IDLE && typeof cursorX === 'number') {
      const petCenter = this.containerElement
        ? this.containerElement.offsetWidth / 2
        : 100
      const dir = cursorX < petCenter ? Direction.LEFT : Direction.RIGHT
      if (this.direction !== dir) {
        this.setDirection(dir)
      }
    }

    // 高无聊度时低概率跟随鼠标
    if (this.state !== PetState.IDLE && this.state !== PetState.BORED && this.state !== PetState.SAD) {
      return
    }
    if (this.boredom > 35 && Math.random() < 0.05) {
      this.startFollowingMouse()
    }
  }

  // 摸头
  pet() {
    if (this.state === PetState.SLEEPING) {
      this.showSpeechBubble('💤...')
      return
    }

    this.setState(PetState.HAPPY)
    this.mood = Math.min(100, this.mood + 20)
    this.boredom = Math.max(0, this.boredom - 35)
    this.showSpeechBubble(pickDialogue('pet'))
  }

  // 喂食
  feed() {
    if (this.state === PetState.SLEEPING) {
      this.showSpeechBubble('💤...')
      return
    }

    this.setState(PetState.EATING)
    this.hunger = Math.max(0, this.hunger - 30)
    this.mood = Math.min(100, this.mood + 10)
    this.boredom = Math.max(0, this.boredom - 15)

    // 显示食物动画
    this.showFoodAnimation()
    this.showSpeechBubble(pickDialogue('feed'))
  }

  // 显示食物动画
  showFoodAnimation() {
    const foodAnim = document.getElementById('food-animation')
    if (foodAnim) {
      foodAnim.classList.remove('hidden')
      setTimeout(() => {
        foodAnim.classList.add('hidden')
      }, 1000)
    }
  }

  // 睡觉
  sleep() {
    if (this.state === PetState.SLEEPING) return

    this.setState(PetState.SLEEPING)
    this.showSpeechBubble('晚安~', 1500)
  }

  // 叫醒
  wake() {
    if (this.state !== PetState.SLEEPING) return

    this.setState(PetState.IDLE)
    this.energy = Math.max(this.energy, 60)

    // 移除所有睡眠气泡
    const sleepBubbles = document.querySelectorAll('.sleep-zzz')
    sleepBubbles.forEach(b => b.remove())

    if (this.sleepBubbleInterval) {
      clearInterval(this.sleepBubbleInterval)
    }

    this.showSpeechBubble(pickDialogue('wake'))
  }

  // 获取宠物状态信息
  getStatus() {
    return {
      state: this.state,
      mood: this.mood,
      energy: this.energy,
      hunger: this.hunger,
      boredom: this.boredom,
      direction: this.direction,
      position: { x: this.x, y: this.y }
    }
  }

  // 切换皮肤
  setSkin(skinId) {
    if (!SKIN_REGISTRY || !SKIN_REGISTRY[skinId]) return
    this.currentSkin = skinId
    switchSkin(skinId)
    this.updateDisplay()
    this.showSpeechBubble(SKIN_REGISTRY[skinId].name + '登场！', 1500)
  }

  // 获取皮肤列表
  getSkinList() {
    if (!SKIN_REGISTRY) return []
    return Object.entries(SKIN_REGISTRY).map(([id, skin]) => ({
      id,
      name: skin.name,
      active: id === this.currentSkin,
    }))
  }

  // 清理资源
  destroy() {
    if (this.behaviorTimer) {
      clearInterval(this.behaviorTimer)
    }
    if (this.walkInterval) {
      clearInterval(this.walkInterval)
    }
    if (this.followInterval) {
      clearInterval(this.followInterval)
    }
    if (this.sleepBubbleInterval) {
      clearInterval(this.sleepBubbleInterval)
    }
    this.clearStateTimer()
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout)
    }
  }
}


// 丰富对话库
const DIALOGUES = {
  idle: [
    '今天天气真好~', '你在干嘛呀？', '摸摸我嘛',
    '嘿嘿~', '我在这里哦', '无聊...',
    '想出去玩', '你在看什么？', '嘿嘿嘿',
    '有人在吗？', '打个盹好了', '肚子有点饿了',
    '今天吃什么？', '好想散步~', '嘿，看我！',
  ],
  pet: [
    '开心~', '嘿嘿嘿~', '好舒服', '再摸摸',
    '不要停~', '好幸福呀', '嘻嘻',
  ],
  feed: [
    '好吃！', '谢谢~', '还要！', '嗯嗯嗯~',
    '太好吃了', '吃饱了~', '美味！',
  ],
  wake: [
    '早上好！', '嗯...天亮了？', '再睡一会嘛...',
    '早安~', '新的一天！',
  ],
  drag: [
    '哇~飞起来了', '放我下来！', '好高好高',
    '救命~', '呜呜呜', '头好晕',
  ],
  bored: [
    '好无聊...', '陪我玩嘛', '你是不是忘了我？',
    '呜呜...', '一个人好寂寞',
  ],
  sleepy: [
    '有点困...', '想睡觉了', '眼皮好重...',
    '晚安...', '打哈欠~',
  ],
  hungry: [
    '我饿了...', '肚子咕咕叫', '想吃东西',
    '有没有零食？', '快饿扁了...',
  ],
}

function pickDialogue(category) {
  const list = DIALOGUES[category]
  if (!list || list.length === 0) return '...'
  return list[Math.floor(Math.random() * list.length)]
}
// 导出Pet类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Pet, PetState, Direction, DIALOGUES, pickDialogue }
}

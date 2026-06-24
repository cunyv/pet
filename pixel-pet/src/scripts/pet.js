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

    this.setupAutoBehavior()
    this.updateDisplay()

    return true
  }

  // 设置状态
  setState(newState) {
    if (this.state === newState) return

    const oldState = this.state
    this.clearStateTimer()
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
        this.showHearts()
        // 2秒后回到待机
        setTimeout(() => {
          if (this.state === PetState.HAPPY) {
            this.setState(PetState.IDLE)
          }
        }, 2000)
        break
      case PetState.EATING:
        // 1.5秒后回到待机
        setTimeout(() => {
          if (this.state === PetState.EATING) {
            this.setState(PetState.IDLE)
          }
        }, 1500)
        break
      case PetState.BORED:
        this.showSpeechBubble('好无聊...', 1600)
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.BORED) {
            Math.random() < 0.45 ? this.startFollowingMouse() : this.setState(PetState.IDLE)
          }
        }, 2500)
        break
      case PetState.SLEEPY:
        this.showSpeechBubble('有点困...', 1600)
        this.stateTimer = setTimeout(() => {
          if (this.state === PetState.SLEEPY) {
            this.energy < 18 ? this.sleep() : this.setState(PetState.IDLE)
          }
        }, 2500)
        break
      case PetState.HUNGRY:
        this.showSpeechBubble('我饿了...', 1800)
        break
      case PetState.SAD:
        this.showSpeechBubble('陪陪我嘛...', 1800)
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
    // 如果正在被交互，跳过
    if (this.isBusyState()) {
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
    if (this.state === PetState.SLEEPING || this.state === PetState.FOLLOWING) return

    this.setState(PetState.WALKING)

    // 随机选择方向
    const direction = Math.random() < 0.5 ? Direction.LEFT : Direction.RIGHT
    this.setDirection(direction)

    // 开始走路动画
    this.walkAnimation(direction)

    // 走路一段时间后停止
    setTimeout(() => {
      if (this.state === PetState.WALKING) {
        this.setState(PetState.IDLE)
      }
    }, this.walkDuration)
  }

  // 走路动画
  walkAnimation(direction) {
    const step = direction === Direction.LEFT ? -this.walkSpeed : this.walkSpeed
    const containerWidth = 200
    const petWidth = 64
    const minX = 20
    const maxX = containerWidth - petWidth - 20

    this.walkInterval = setInterval(() => {
      if (this.state !== PetState.WALKING) {
        clearInterval(this.walkInterval)
        return
      }

      this.x += step

      // 边界检测
      if (this.x <= minX) {
        this.x = minX
        this.setDirection(Direction.RIGHT)
        clearInterval(this.walkInterval)
        this.walkAnimation(Direction.RIGHT)
      } else if (this.x >= maxX) {
        this.x = maxX
        this.setDirection(Direction.LEFT)
        clearInterval(this.walkInterval)
        this.walkAnimation(Direction.LEFT)
      }

      // 更新位置
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
    }, 80)
  }

  // 看到鼠标时可能被吸引过去
  noticeMouse() {
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
    this.showSpeechBubble('开心~')
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
    this.showSpeechBubble('好吃！')
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

    this.showSpeechBubble('早上好！')
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

// 导出Pet类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Pet, PetState, Direction }
}

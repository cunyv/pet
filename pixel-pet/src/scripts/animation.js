// 动画控制器
class AnimationController {
  constructor(pet) {
    this.pet = pet
    this.particlePool = []
    this.activeParticles = []
  }

  // 初始化动画系统
  init() {
    this.createParticlePool()
  }

  // 创建粒子对象池
  createParticlePool() {
    const poolSize = 15
    for (let i = 0; i < poolSize; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.cssText = `
        position: absolute;
        pointer-events: none;
        font-size: 14px;
        opacity: 0;
        z-index: 100;
        transition: all 0.4s ease-out;
      `
      document.getElementById('pet-container').appendChild(particle)
      this.particlePool.push(particle)
    }
  }

  // 从对象池获取粒子
  getParticle() {
    const particle = this.particlePool.find(p => !p.classList.contains('active'))
    if (particle) {
      particle.classList.add('active')
      this.activeParticles.push(particle)
    }
    return particle
  }

  // 释放粒子
  releaseParticle(particle) {
    particle.classList.remove('active')
    particle.style.opacity = '0'
    const index = this.activeParticles.indexOf(particle)
    if (index > -1) {
      this.activeParticles.splice(index, 1)
    }
  }

  // 标记粒子为淡出中，使用 transitionend 自动回收
  markParticleForRelease(particle) {
    const onEnd = (e) => {
      if (e.propertyName === 'opacity') {
        particle.removeEventListener('transitionend', onEnd)
        this.releaseParticle(particle)
      }
    }
    particle.addEventListener('transitionend', onEnd)
    // 安全兜底：如果 transitionend 未触发，800ms 后强制回收
    setTimeout(() => {
      if (this.activeParticles.includes(particle)) {
        particle.removeEventListener('transitionend', onEnd)
        this.releaseParticle(particle)
      }
    }, 800)
  }

  // 创建爱心粒子效果
  createHeartEffect(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const heart = this.getParticle()
        if (!heart) return

        heart.textContent = '❤️'
        heart.style.left = `${x + (Math.random() - 0.5) * 20}px`
        heart.style.top = `${y}px`
        heart.style.opacity = '1'
        heart.style.transform = 'translateY(0) scale(1)'
        this.markParticleForRelease(heart)

        requestAnimationFrame(() => {
          heart.style.transform = `translateY(-${40 + Math.random() * 20}px) scale(0.5)`
          heart.style.opacity = '0'
        })
      }, i * 150)
    }
  }

  // 创建星星粒子效果
  createStarEffect(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const star = this.getParticle()
        if (!star) return

        star.textContent = '⭐'
        star.style.left = `${x + (Math.random() - 0.5) * 30}px`
        star.style.top = `${y}px`
        star.style.opacity = '1'
        star.style.transform = 'translateY(0) rotate(0deg)'
        this.markParticleForRelease(star)

        requestAnimationFrame(() => {
          star.style.transform = `translateY(-${30 + Math.random() * 20}px) rotate(${Math.random() * 360}deg) scale(0.3)`
          star.style.opacity = '0'
        })
      }, i * 100)
    }
  }

  // 创建食物消失效果
  createFoodEffect(x, y) {
    const foods = ['🍕', '🍔', '🍩', '🍪', '🍰']
    const food = this.getParticle()
    if (!food) return

    food.textContent = foods[Math.floor(Math.random() * foods.length)]
    food.style.left = `${x}px`
    food.style.top = `${y}px`
    food.style.opacity = '1'
    food.style.transform = 'scale(1)'
    this.markParticleForRelease(food)

    requestAnimationFrame(() => {
      food.style.transform = 'scale(0) rotate(360deg)'
      food.style.opacity = '0'
    })
  }

  // 停止动画
  stop() {
    // transitionend-based cleanup is automatic
  }

  // 清理资源
  destroy() {
    this.stop()
    this.particlePool.forEach(p => p.remove())
    this.activeParticles.forEach(p => p.remove())
    this.particlePool = []
    this.activeParticles = []
  }
}

// 特效管理器
class EffectsManager {
  constructor(pet, animationController) {
    this.pet = pet
    this.animController = animationController
  }

  // 摸头特效
  playPetEffect() {
    const petRect = this.pet.petElement.getBoundingClientRect()
    const containerRect = document.getElementById('pet-container').getBoundingClientRect()

    const x = petRect.left - containerRect.left + petRect.width / 2
    const y = petRect.top - containerRect.top

    this.animController.createHeartEffect(x, y, 3)
    this.animController.createStarEffect(x, y, 2)
  }

  // 喂食特效
  playFeedEffect() {
    const petRect = this.pet.petElement.getBoundingClientRect()
    const containerRect = document.getElementById('pet-container').getBoundingClientRect()

    const x = petRect.left - containerRect.left + petRect.width / 2
    const y = petRect.top - containerRect.top + petRect.height / 2

    this.animController.createFoodEffect(x, y)
  }

  // 睡觉特效
  playSleepEffect() {
    // 已在pet.js中处理sleep-zzz
  }

  // 走路特效
  playWalkEffect() {
    // 可选：添加脚印效果
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationController, EffectsManager }
}

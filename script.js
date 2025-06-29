class WatermelonGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.score = 0
    this.highScore = this.loadHighScore()
    this.gameOver = false
    this.fruits = []
    this.nextFruitType = 0
    this.dropLine = 120 // 游戏结束线
    this.highScoreKey = 'bigger-watermelon-high-score'
    this.gameStateKey = 'bigger-watermelon-state'

    // 默认显示尺寸
    this.displayWidth = 400
    this.displayHeight = 600

    // 音效系统
    this.audioContext = null
    this.sounds = {}
    this.soundEnabled = true

    // 水果配置
    this.fruitConfig = [
      { name: '樱桃', radius: 15, color: '#dc143c', score: 1 }, // 深红色
      { name: '草莓', radius: 20, color: '#ff6347', score: 3 }, // 番茄红
      { name: '葡萄', radius: 25, color: '#8b008b', score: 6 }, // 深紫色
      { name: '柠檬', radius: 30, color: '#ffff00', score: 10 }, // 亮黄色
      { name: '橙子', radius: 35, color: '#ff8c00', score: 15 }, // 深橙色
      { name: '苹果', radius: 40, color: '#ff0000', score: 21 }, // 红色
      { name: '梨', radius: 45, color: '#9acd32', score: 28 }, // 黄绿色
      { name: '桃子', radius: 50, color: '#ffb6c1', score: 36 }, // 浅粉色
      { name: '菠萝', radius: 55, color: '#ffd700', score: 45 }, // 金黄色
      { name: '椰子', radius: 60, color: '#8b4513', score: 55 }, // 棕色
      { name: '西瓜', radius: 65, color: '#228b22', score: 66 }, // 森林绿
    ]

    this.gravity = 0.4
    this.friction = 0.98
    this.bounce = 0.2
    this.elasticity = 0.4

    this.init()
  }

  init() {
    this.setupCanvas()
    this.initAudio() // 初始化音效系统
    this.loadSoundSettings() // 加载音效设置
    this.loadGameState() // 尝试加载保存的游戏状态
    this.bindEvents()
    this.gameLoop()
    this.updateScore()
  }

  setupCanvas() {
    // 设置画布的响应式尺寸
    this.resizeCanvas()

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.resizeCanvas()
    })

    // 监听屏幕方向变化
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.resizeCanvas()
      }, 100)
    })
  }

  resizeCanvas() {
    // 获取设备像素比，用于高DPI屏幕
    const dpr = window.devicePixelRatio || 1

    // 计算合适的画布显示尺寸
    let displayWidth = 400
    let displayHeight = 600

    // 根据屏幕宽度调整显示尺寸
    if (window.innerWidth <= 360) {
      displayWidth = Math.min(280, window.innerWidth - 40)
      displayHeight = displayWidth * 1.5
    } else if (window.innerWidth <= 480) {
      displayWidth = Math.min(300, window.innerWidth - 40)
      displayHeight = displayWidth * 1.5
    } else if (window.innerWidth <= 768) {
      displayWidth = Math.min(350, window.innerWidth - 60)
      displayHeight = displayWidth * 1.5
    }

    // 横屏模式调整
    if (window.innerHeight <= 600 && window.innerWidth > window.innerHeight) {
      displayHeight = Math.min(400, window.innerHeight - 100)
      displayWidth = displayHeight * 0.67
    }

    // 设置canvas的实际像素尺寸（考虑设备像素比）
    const actualWidth = displayWidth * dpr
    const actualHeight = displayHeight * dpr

    this.canvas.width = actualWidth
    this.canvas.height = actualHeight

    // 设置canvas的CSS显示尺寸
    this.canvas.style.width = displayWidth + 'px'
    this.canvas.style.height = displayHeight + 'px'

    // 缩放绘图上下文以匹配设备像素比
    this.ctx.scale(dpr, dpr)

    // 调整游戏结束线位置（相对于显示高度的比例）
    this.dropLine = displayHeight * 0.2

    // 存储显示尺寸供其他方法使用
    this.displayWidth = displayWidth
    this.displayHeight = displayHeight
  }

  // 初始化音效系统
  initAudio() {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // 创建各种音效
      this.createSounds()

      // 监听用户交互以启用音频上下文
      this.setupAudioInteraction()
    } catch (error) {
      console.warn('音效系统初始化失败:', error)
      this.soundEnabled = false
    }
  }

  // 创建音效
  createSounds() {
    // 水果掉落音效
    this.sounds.drop = this.createTone(400, 0.1, 'sine', [
      { time: 0, frequency: 400 },
      { time: 0.05, frequency: 200 },
      { time: 0.1, frequency: 100 },
    ])

    // 水果合成音效
    this.sounds.merge = this.createTone(500, 0.3, 'sine', [
      { time: 0, frequency: 500 },
      { time: 0.1, frequency: 600 },
      { time: 0.2, frequency: 700 },
      { time: 0.3, frequency: 800 },
    ])

    // 游戏结束音效
    this.sounds.gameOver = this.createTone(300, 0.8, 'sawtooth', [
      { time: 0, frequency: 300 },
      { time: 0.2, frequency: 250 },
      { time: 0.4, frequency: 200 },
      { time: 0.6, frequency: 150 },
      { time: 0.8, frequency: 100 },
    ])

    // 新纪录音效
    this.sounds.newRecord = this.createTone(600, 0.6, 'sine', [
      { time: 0, frequency: 600 },
      { time: 0.1, frequency: 700 },
      { time: 0.2, frequency: 800 },
      { time: 0.3, frequency: 900 },
      { time: 0.4, frequency: 800 },
      { time: 0.5, frequency: 900 },
      { time: 0.6, frequency: 1000 },
    ])
  }

  // 创建音调
  createTone(frequency, duration, waveType = 'sine', frequencyChanges = []) {
    return () => {
      if (!this.soundEnabled || !this.audioContext) return

      try {
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)

        oscillator.type = waveType
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

        // 应用频率变化
        frequencyChanges.forEach((change) => {
          oscillator.frequency.setValueAtTime(change.frequency, this.audioContext.currentTime + change.time)
        })

        // 音量包络
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

        oscillator.start(this.audioContext.currentTime)
        oscillator.stop(this.audioContext.currentTime + duration)
      } catch (error) {
        console.warn('播放音效失败:', error)
      }
    }
  }

  // 设置音频交互
  setupAudioInteraction() {
    const enableAudio = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
    }

    // 监听用户交互事件
    document.addEventListener('click', enableAudio, { once: true })
    document.addEventListener('touchstart', enableAudio, { once: true })
    document.addEventListener('keydown', enableAudio, { once: true })
  }

  // 播放音效
  playSound(soundName) {
    if (this.soundEnabled && this.sounds[soundName]) {
      this.sounds[soundName]()
    }
  }

  // 切换音效开关
  toggleSound() {
    this.soundEnabled = !this.soundEnabled
    this.updateSoundButton()

    // 保存音效设置
    localStorage.setItem('watermelonGameSoundEnabled', this.soundEnabled.toString())

    // 播放测试音效
    if (this.soundEnabled) {
      this.playSound('drop')
    }
  }

  // 更新音效按钮显示
  updateSoundButton() {
    const soundBtn = document.getElementById('soundToggle')
    if (this.soundEnabled) {
      soundBtn.textContent = '🔊 音效'
      soundBtn.classList.remove('disabled')
    } else {
      soundBtn.textContent = '🔇 音效'
      soundBtn.classList.add('disabled')
    }
  }

  // 加载音效设置
  loadSoundSettings() {
    const saved = localStorage.getItem('watermelonGameSoundEnabled')
    if (saved !== null) {
      this.soundEnabled = saved === 'true'
    }
    this.updateSoundButton()
  }

  bindEvents() {
    // 鼠标点击事件
    this.canvas.addEventListener('click', (e) => {
      if (!this.gameOver) {
        this.dropFruit(e)
      }
    })

    // 触摸事件支持
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault() // 防止页面滚动
        if (!this.gameOver && e.touches.length === 1) {
          // 创建一个模拟的鼠标事件对象
          const touch = e.touches[0]
          const mouseEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
          }
          this.dropFruit(mouseEvent)
        }
      },
      { passive: false }
    )

    // 防止触摸时的默认行为
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault()
      },
      { passive: false }
    )

    this.canvas.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault()
      },
      { passive: false }
    )

    document.getElementById('restartBtn').addEventListener('click', () => {
      this.showRestartConfirm()
    })

    document.getElementById('restartBtn2').addEventListener('click', () => {
      this.showRestartConfirm()
    })

    // 音效开关按钮
    document.getElementById('soundToggle').addEventListener('click', () => {
      this.toggleSound()
    })

    // 确认重新开始按钮
    document.getElementById('confirmRestart').addEventListener('click', () => {
      this.restart()
    })

    // 取消重新开始按钮
    document.getElementById('cancelRestart').addEventListener('click', () => {
      this.hideRestartConfirm()
    })
  }

  generateNextFruit() {
    // 只生成前5种小水果
    this.nextFruitType = Math.floor(Math.random() * 5)
    this.updateNextFruitDisplay()
  }

  updateNextFruitDisplay() {
    const nextFruitEl = document.getElementById('nextFruit')
    const config = this.fruitConfig[this.nextFruitType]
    nextFruitEl.style.backgroundColor = config.color
    nextFruitEl.style.width = `${config.radius * 1.5}px`
    nextFruitEl.style.height = `${config.radius * 1.5}px`
    nextFruitEl.textContent = config.name
  }

  dropFruit(e) {
    const rect = this.canvas.getBoundingClientRect()

    // 转换鼠标坐标到显示坐标系
    const x = (e.clientX - rect.left) * (this.displayWidth / rect.width)

    const config = this.fruitConfig[this.nextFruitType]
    const fruit = {
      x: Math.max(config.radius, Math.min(this.displayWidth - config.radius, x)),
      y: config.radius,
      vx: 0,
      vy: 0,
      radius: config.radius,
      type: this.nextFruitType,
      color: config.color,
      name: config.name,
      merged: false,
    }

    this.fruits.push(fruit)
    this.generateNextFruit()

    // 播放掉落音效
    this.playSound('drop')
  }

  update() {
    for (let i = 0; i < this.fruits.length; i++) {
      const fruit = this.fruits[i]

      // 应用重力
      fruit.vy += this.gravity

      // 更新位置
      fruit.x += fruit.vx
      fruit.y += fruit.vy

      // 应用摩擦力
      fruit.vx *= this.friction
      fruit.vy *= this.friction

      // 最小速度阈值，避免无限微小运动
      if (Math.abs(fruit.vx) < 0.01) fruit.vx = 0
      if (Math.abs(fruit.vy) < 0.01) fruit.vy = 0

      // 边界碰撞
      if (fruit.x - fruit.radius < 0) {
        fruit.x = fruit.radius
        fruit.vx *= -this.bounce
      }
      if (fruit.x + fruit.radius > this.displayWidth) {
        fruit.x = this.displayWidth - fruit.radius
        fruit.vx *= -this.bounce
      }
      if (fruit.y + fruit.radius > this.displayHeight) {
        fruit.y = this.displayHeight - fruit.radius
        fruit.vy *= -this.bounce
      }
    }

    // 检查碰撞和合成
    this.checkCollisions()

    // 检查游戏结束
    this.checkGameOver()
  }

  checkCollisions() {
    for (let i = 0; i < this.fruits.length; i++) {
      for (let j = i + 1; j < this.fruits.length; j++) {
        const fruit1 = this.fruits[i]
        const fruit2 = this.fruits[j]

        const dx = fruit2.x - fruit1.x
        const dy = fruit2.y - fruit1.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = fruit1.radius + fruit2.radius

        if (distance < minDistance) {
          // 防止除零错误
          if (distance === 0) {
            // 如果两个水果完全重叠，随机分离
            const angle = Math.random() * Math.PI * 2
            const separationDistance = (fruit1.radius + fruit2.radius) * 0.6
            fruit1.x -= Math.cos(angle) * separationDistance
            fruit1.y -= Math.sin(angle) * separationDistance
            fruit2.x += Math.cos(angle) * separationDistance
            fruit2.y += Math.sin(angle) * separationDistance
          } else {
            // 碰撞处理 - 分离重叠的水果
            const overlap = minDistance - distance
            const separationX = (dx / distance) * overlap * 0.6
            const separationY = (dy / distance) * overlap * 0.6

            fruit1.x -= separationX
            fruit1.y -= separationY
            fruit2.x += separationX
            fruit2.y += separationY
          }

          // 弹性碰撞计算
          const normalX = dx / distance
          const normalY = dy / distance

          // 相对速度
          const relativeVx = fruit2.vx - fruit1.vx
          const relativeVy = fruit2.vy - fruit1.vy

          // 沿法线方向的相对速度
          const normalSpeed = relativeVx * normalX + relativeVy * normalY

          // 处理速度碰撞，但不要跳过合成检查
          if (normalSpeed <= 0) {
            // 只有当相对速度足够大时才应用弹性
            if (Math.abs(normalSpeed) >= 0.2) {
              // 降低弹性系数，减少弹性
              const elasticity = 0.15

              // 冲量大小
              const impulse = (-(1 + elasticity) * normalSpeed) / 2

              // 应用冲量，并添加阻尼防止持续振动
              const dampingFactor = 0.85
              fruit1.vx = (fruit1.vx - impulse * normalX) * dampingFactor
              fruit1.vy = (fruit1.vy - impulse * normalY) * dampingFactor
              fruit2.vx = (fruit2.vx + impulse * normalX) * dampingFactor
              fruit2.vy = (fruit2.vy + impulse * normalY) * dampingFactor
            } else {
              // 速度很小时，直接阻尼处理
              fruit1.vx *= 0.7
              fruit1.vy *= 0.7
              fruit2.vx *= 0.7
              fruit2.vy *= 0.7
            }
          }

          // 合成检查
          if (
            fruit1.type === fruit2.type &&
            !fruit1.merged &&
            !fruit2.merged &&
            fruit1.type < this.fruitConfig.length - 1
          ) {
            this.mergeFruits(fruit1, fruit2, i, j)
          }
        }
      }
    }
  }

  mergeFruits(fruit1, fruit2, index1, index2) {
    // 标记为已合成，防止重复合成
    fruit1.merged = true
    fruit2.merged = true

    // 创建新水果
    const newType = fruit1.type + 1
    const config = this.fruitConfig[newType]
    const newFruit = {
      x: (fruit1.x + fruit2.x) / 2,
      y: (fruit1.y + fruit2.y) / 2,
      vx: (fruit1.vx + fruit2.vx) * 0.3, // 保留一些动量
      vy: (fruit1.vy + fruit2.vy) * 0.3,
      radius: config.radius,
      type: newType,
      color: config.color,
      name: config.name,
      merged: false,
    }

    // 移除旧水果，添加新水果
    this.fruits.splice(Math.max(index1, index2), 1)
    this.fruits.splice(Math.min(index1, index2), 1)
    this.fruits.push(newFruit)

    // 增加分数
    this.score += config.score
    this.updateScore()

    // 播放合成音效
    this.playSound('merge')
  }

  checkGameOver() {
    // 检查是否有水果的顶部超过了安全线（水果堆积太高）
    for (const fruit of this.fruits) {
      // 水果顶部位置超过安全线，且水果相对静止
      if (fruit.y - fruit.radius <= this.dropLine) {
        let isStatic = Math.abs(fruit.vx) < 1 && Math.abs(fruit.vy) < 1
        // 添加时间检查，确保水果在危险区域停留了一段时间
        if (!fruit.dangerTime) {
          fruit.dangerTime = 0
        }
        if (isStatic) {
          fruit.dangerTime++
          if (fruit.dangerTime > 30) {
            // 停留0.5秒后游戏结束
            this.gameOver = true
            this.showGameOver()
            break
          }
        } else {
          fruit.dangerTime = 0 // 如果水果在移动，重置计时
        }
      } else {
        // 水果不在危险区域，重置计时
        if (fruit.dangerTime) {
          fruit.dangerTime = 0
        }
      }
    }
  }

  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight)

    // 绘制游戏结束线
    this.ctx.strokeStyle = '#ff6b6b'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.moveTo(0, this.dropLine)
    this.ctx.lineTo(this.displayWidth, this.dropLine)
    this.ctx.stroke()
    this.ctx.setLineDash([])

    // 绘制水果
    for (const fruit of this.fruits) {
      this.ctx.fillStyle = fruit.color
      this.ctx.beginPath()
      this.ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2)
      this.ctx.fill()

      // 绘制边框
      this.ctx.strokeStyle = '#333'
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      // 绘制文字
      this.ctx.fillStyle = 'white'
      this.ctx.font = `${fruit.radius / 3}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(fruit.name, fruit.x, fruit.y)
    }
  }

  gameLoop() {
    if (!this.gameOver) {
      this.update()
    }
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }

  updateScore(shouldSaveState = true) {
    document.getElementById('score').textContent = this.score
    // 检查是否创造新纪录
    if (this.score > this.loadHighScore()) {
      this.saveHighScore(this.score)
    }
    // 每次得分后保存游戏状态（除非明确指定不保存）
    if (shouldSaveState) {
      this.saveGameState()
    }
  }

  loadHighScore() {
    const saved = localStorage.getItem(this.highScoreKey)
    const score = saved ? parseInt(saved, 10) : 0
    if (score != this.highScore) {
      this.highScore = score
      document.getElementById('highScore').textContent = score
    }
    return score
  }

  saveHighScore(score) {
    if (score != this.highScore) {
      this.highScore = score
      localStorage.setItem(this.highScoreKey, score.toString())
      document.getElementById('highScore').textContent = score
    }
  }

  saveGameState() {
    // 只在游戏进行中且有水果时保存状态
    if (!this.gameOver && this.fruits.length > 0) {
      const gameState = {
        score: this.score,
        fruits: this.fruits.map((fruit) => ({
          x: fruit.x,
          y: fruit.y,
          vx: fruit.vx,
          vy: fruit.vy,
          radius: fruit.radius,
          type: fruit.type,
          color: fruit.color,
          name: fruit.name,
          merged: fruit.merged,
          dangerTime: fruit.dangerTime || 0,
        })),
        nextFruitType: this.nextFruitType,
        timestamp: Date.now(),
      }
      localStorage.setItem(this.gameStateKey, JSON.stringify(gameState))
    }
  }

  loadGameState() {
    try {
      const savedState = localStorage.getItem(this.gameStateKey)
      if (savedState) {
        const gameState = JSON.parse(savedState)
        // 恢复游戏状态
        this.score = gameState.score || 0
        this.fruits = gameState.fruits || []
        this.nextFruitType = gameState.nextFruitType || 0
        this.updateNextFruitDisplay()
        // 只更新分数显示，不检查最高分（避免覆盖最高分记录）
        document.getElementById('score').textContent = this.score
        // 显示游戏状态恢复提示
        this.showGameRestoredMessage()
        console.log('游戏状态已恢复')
        return true
      }
    } catch (error) {
      console.error('加载游戏状态失败:', error)
      this.clearGameState()
    }
    // 如果没有保存的状态或加载失败，生成新的下一个水果
    this.generateNextFruit()
    return false
  }

  clearGameState() {
    localStorage.removeItem(this.gameStateKey)
  }

  showGameRestoredMessage() {
    const messageEl = document.getElementById('gameRestored')
    messageEl.style.display = 'block'

    // 3秒后自动隐藏提示
    setTimeout(() => {
      messageEl.style.display = 'none'
    }, 3000)
  }

  showGameOver() {
    document.getElementById('finalScore').textContent = this.score
    document.getElementById('gameOverHighScore').textContent = this.highScore
    // 检查是否创造新纪录
    const isNewRecord = this.score === this.highScore && this.score > 0
    const newRecordEl = document.getElementById('newRecord')
    if (isNewRecord) {
      newRecordEl.style.display = 'block'
      // 播放新纪录音效
      this.playSound('newRecord')
    } else {
      newRecordEl.style.display = 'none'
      // 播放游戏结束音效
      this.playSound('gameOver')
    }
    // 游戏结束时清除保存的游戏状态
    this.clearGameState()
    document.getElementById('gameOver').style.display = 'flex'

    // 绑定分享按钮事件
    this.bindShareEvents()
  }

  showRestartConfirm() {
    // 如果游戏已经结束，直接重新开始，不需要确认
    if (this.gameOver) {
      this.restart()
      return
    }

    // 如果没有水果或分数为0，直接重新开始
    if (this.fruits.length === 0 || this.score === 0) {
      this.restart()
      return
    }

    // 显示确认对话框
    document.getElementById('restartConfirm').style.display = 'flex'
  }

  hideRestartConfirm() {
    document.getElementById('restartConfirm').style.display = 'none'
  }

  restart() {
    this.fruits = []
    this.score = 0
    this.gameOver = false
    this.generateNextFruit()
    this.updateScore(false)
    this.clearGameState()
    document.getElementById('gameOver').style.display = 'none'
    this.hideRestartConfirm()
  }

  bindShareEvents() {
    const shareWechat = document.getElementById('shareWechat')
    const shareQQ = document.getElementById('shareQQ')
    const shareWeibo = document.getElementById('shareWeibo')
    const copyLink = document.getElementById('copyLink')

    // 移除之前的事件监听器（避免重复绑定）
    shareWechat.replaceWith(shareWechat.cloneNode(true))
    shareWeibo.replaceWith(shareWeibo.cloneNode(true))
    shareQQ.replaceWith(shareQQ.cloneNode(true))
    copyLink.replaceWith(copyLink.cloneNode(true))

    // 重新获取元素引用
    const newShareWechat = document.getElementById('shareWechat')
    const newShareWeibo = document.getElementById('shareWeibo')
    const newShareQQ = document.getElementById('shareQQ')
    const newCopyLink = document.getElementById('copyLink')

    // 分享到微信
    newShareWechat.addEventListener('click', () => {
      this.shareToWechat()
    })

    // 分享到微博
    newShareWeibo.addEventListener('click', () => {
      this.shareToWeibo()
    })

    // 分享到QQ
    newShareQQ.addEventListener('click', () => {
      this.shareToQQ()
    })

    // 复制链接
    newCopyLink.addEventListener('click', () => {
      this.copyGameLink()
    })
  }

  // 生成分享文本
  getShareText() {
    const isNewRecord = this.score === this.highScore && this.score > 0
    if (isNewRecord) {
      return `🎉 我在合成大西瓜游戏中创造了新纪录！得分：${this.score}分！快来挑战我的记录吧！`
    } else {
      return `🍉 我在合成大西瓜游戏中得了${this.score}分！你能超越我吗？快来试试吧！`
    }
  }

  // 分享到微信
  shareToWechat() {
    const shareText = this.getShareText()
    const gameUrl = window.location.href

    // 检查是否在微信环境中
    if (this.isWechat()) {
      // 在微信中，显示提示用户点击右上角分享
      this.showShareTip('请点击右上角"..."按钮分享给朋友')
    } else {
      // 非微信环境，尝试调用微信分享或复制文本
      if (navigator.share) {
        navigator
          .share({
            title: '合成大西瓜',
            text: shareText,
            url: gameUrl,
          })
          .catch(() => {
            this.copyToClipboard(`${shareText} ${gameUrl}`)
          })
      } else {
        this.copyToClipboard(`${shareText} ${gameUrl}`)
      }
    }
  }

  // 分享到QQ
  shareToQQ() {
    const shareText = this.getShareText()
    const gameUrl = window.location.href
    const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(
      gameUrl
    )}&title=${encodeURIComponent(shareText)}&source=${encodeURIComponent('合成大西瓜游戏')}`
    window.open(qqUrl, '_blank', 'width=600,height=400')
  }

  // 分享到微博
  shareToWeibo() {
    const shareText = this.getShareText()
    const gameUrl = window.location.href
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
      gameUrl
    )}&title=${encodeURIComponent(shareText)}&pic=&appkey=`
    window.open(weiboUrl, '_blank', 'width=600,height=400')
  }

  // 复制游戏链接
  copyGameLink() {
    const shareText = this.getShareText()
    const gameUrl = window.location.href
    const fullText = `${shareText} ${gameUrl}`
    this.copyToClipboard(fullText)
  }

  // 复制到剪贴板
  copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showCopySuccess()
        })
        .catch(() => {
          this.fallbackCopyToClipboard(text)
        })
    } else {
      this.fallbackCopyToClipboard(text)
    }
  }

  // 备用复制方法
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      this.showCopySuccess()
    } catch (err) {
      this.showShareTip('复制失败，请手动复制链接')
    }
    document.body.removeChild(textArea)
  }

  showCopySuccess() {
    const copyBtn = document.getElementById('copyLink')
    const originalLabel = copyBtn.querySelector('.share-label').textContent
    copyBtn.classList.add('copied')
    copyBtn.querySelector('.share-label').textContent = '已复制'
    setTimeout(() => {
      copyBtn.classList.remove('copied')
      copyBtn.querySelector('.share-label').textContent = originalLabel
    }, 2000)
  }

  showShareTip(message) {
    const tip = document.createElement('div')
    tip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      max-width: 80%;
      text-align: center;
    `
    tip.textContent = message
    document.body.appendChild(tip)
    setTimeout(() => {
      document.body.removeChild(tip)
    }, 3000)
  }

  // 检查是否在微信环境
  isWechat() {
    return /micromessenger/i.test(navigator.userAgent)
  }
}

// 启动游戏
window.addEventListener('load', () => {
  new WatermelonGame()
})

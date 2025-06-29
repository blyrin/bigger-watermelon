// 游戏引擎 Composable
export interface GameEngineOptions {
  displayWidth?: number
  displayHeight?: number
  dropLine?: number
  enableSound?: boolean
}

export interface FruitConfig {
  name: string
  radius: number
  color: string
  score: number
}

export interface Fruit {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  type: number
  color: string
  name: string
  merged: boolean
  dangerTime: number
}

export interface GameState {
  fruits: Fruit[]
  score: number
  gameOver: boolean
  nextFruitType: number
}

export const useGameEngine = (options: GameEngineOptions = {}) => {
  // 游戏配置
  const displayWidth = options.displayWidth || 400
  const displayHeight = options.displayHeight || 600
  const dropLine = options.dropLine || 120
  const enableSound = options.enableSound !== false

  // 物理参数
  const gravity = 0.4
  const friction = 0.98
  const bounce = 0.2
  const elasticity = 0.4

  // 游戏状态
  const fruits = ref<Fruit[]>([])
  const score = ref(0)
  const gameOver = ref(false)
  const nextFruitType = ref(0)

  // 水果配置
  const fruitConfig: FruitConfig[] = [
    { name: '樱桃', radius: 15, color: '#dc143c', score: 1 },
    { name: '草莓', radius: 20, color: '#ff6347', score: 3 },
    { name: '葡萄', radius: 25, color: '#8b008b', score: 6 },
    { name: '柠檬', radius: 30, color: '#ffff00', score: 10 },
    { name: '橙子', radius: 35, color: '#ff8c00', score: 15 },
    { name: '苹果', radius: 40, color: '#ff0000', score: 21 },
    { name: '梨', radius: 45, color: '#9acd32', score: 28 },
    { name: '桃子', radius: 50, color: '#ffb6c1', score: 36 },
    { name: '菠萝', radius: 55, color: '#ffd700', score: 45 },
    { name: '椰子', radius: 60, color: '#8b4513', score: 55 },
    { name: '西瓜', radius: 65, color: '#228b22', score: 66 },
  ]

  // 生成下一个水果类型
  const generateNextFruit = () => {
    nextFruitType.value = Math.floor(Math.random() * 5)
    return nextFruitType.value
  }

  // 放置水果
  const dropFruit = (x: number) => {
    const config = fruitConfig[nextFruitType.value]
    const fruit: Fruit = {
      x: Math.max(config.radius, Math.min(displayWidth - config.radius, x)),
      y: config.radius,
      vx: 0,
      vy: 0,
      radius: config.radius,
      type: nextFruitType.value,
      color: config.color,
      name: config.name,
      merged: false,
      dangerTime: 0,
    }

    fruits.value.push(fruit)
    generateNextFruit()

    return fruit
  }

  // 在指定位置放置指定类型的水果（用于多人游戏同步）
  const dropFruitAt = (x: number, fruitType: number) => {
    if (fruitType < 0 || fruitType >= fruitConfig.length) {
      console.warn('无效的水果类型:', fruitType)
      return null
    }

    const config = fruitConfig[fruitType]
    const fruit: Fruit = {
      x: Math.max(config.radius, Math.min(displayWidth - config.radius, x)),
      y: config.radius,
      vx: 0,
      vy: 0,
      radius: config.radius,
      type: fruitType,
      color: config.color,
      name: config.name,
      merged: false,
      dangerTime: 0,
    }

    fruits.value.push(fruit)
    console.log('在指定位置放置水果:', {
      x: fruit.x,
      y: fruit.y,
      type: fruitType,
      name: config.name
    })

    return fruit
  }

  // 更新游戏物理
  const update = () => {
    // 更新每个水果的物理状态
    for (let i = 0; i < fruits.value.length; i++) {
      const fruit = fruits.value[i]

      // 应用重力
      fruit.vy += gravity

      // 更新位置
      fruit.x += fruit.vx
      fruit.y += fruit.vy

      // 应用摩擦力
      fruit.vx *= friction
      fruit.vy *= friction

      // 最小速度阈值
      if (Math.abs(fruit.vx) < 0.01) fruit.vx = 0
      if (Math.abs(fruit.vy) < 0.01) fruit.vy = 0

      // 边界碰撞
      if (fruit.x - fruit.radius < 0) {
        fruit.x = fruit.radius
        fruit.vx *= -bounce
      }
      if (fruit.x + fruit.radius > displayWidth) {
        fruit.x = displayWidth - fruit.radius
        fruit.vx *= -bounce
      }
      if (fruit.y + fruit.radius > displayHeight) {
        fruit.y = displayHeight - fruit.radius
        fruit.vy *= -bounce
      }
    }

    // 检查碰撞和合成
    checkCollisions()

    // 检查游戏结束
    checkGameOver()
  }

  // 碰撞检测和处理
  const checkCollisions = () => {
    for (let i = 0; i < fruits.value.length; i++) {
      for (let j = i + 1; j < fruits.value.length; j++) {
        const fruit1 = fruits.value[i]
        const fruit2 = fruits.value[j]

        const dx = fruit2.x - fruit1.x
        const dy = fruit2.y - fruit1.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = fruit1.radius + fruit2.radius

        if (distance < minDistance) {
          // 处理重叠
          if (distance === 0) {
            const angle = Math.random() * Math.PI * 2
            const separationDistance = (fruit1.radius + fruit2.radius) * 0.6
            fruit1.x -= Math.cos(angle) * separationDistance
            fruit1.y -= Math.sin(angle) * separationDistance
            fruit2.x += Math.cos(angle) * separationDistance
            fruit2.y += Math.sin(angle) * separationDistance
          } else {
            const overlap = minDistance - distance
            const separationX = (dx / distance) * overlap * 0.6
            const separationY = (dy / distance) * overlap * 0.6

            fruit1.x -= separationX
            fruit1.y -= separationY
            fruit2.x += separationX
            fruit2.y += separationY
          }

          // 弹性碰撞
          const normalX = dx / distance
          const normalY = dy / distance
          const relativeVx = fruit2.vx - fruit1.vx
          const relativeVy = fruit2.vy - fruit1.vy
          const normalSpeed = relativeVx * normalX + relativeVy * normalY

          if (normalSpeed <= 0) {
            if (Math.abs(normalSpeed) >= 0.2) {
              const elasticity = 0.15
              const impulse = (-(1 + elasticity) * normalSpeed) / 2
              const dampingFactor = 0.85

              fruit1.vx = (fruit1.vx - impulse * normalX) * dampingFactor
              fruit1.vy = (fruit1.vy - impulse * normalY) * dampingFactor
              fruit2.vx = (fruit2.vx + impulse * normalX) * dampingFactor
              fruit2.vy = (fruit2.vy + impulse * normalY) * dampingFactor
            } else {
              fruit1.vx *= 0.7
              fruit1.vy *= 0.7
              fruit2.vx *= 0.7
              fruit2.vy *= 0.7
            }
          }

          // 合成检查
          if (fruit1.type === fruit2.type && !fruit1.merged && !fruit2.merged && fruit1.type < fruitConfig.length - 1) {
            mergeFruits(fruit1, fruit2, i, j)
          }
        }
      }
    }
  }

  // 合成水果
  const mergeFruits = (fruit1: Fruit, fruit2: Fruit, index1: number, index2: number) => {
    fruit1.merged = true
    fruit2.merged = true

    const newType = fruit1.type + 1
    const config = fruitConfig[newType]
    const newFruit: Fruit = {
      x: (fruit1.x + fruit2.x) / 2,
      y: (fruit1.y + fruit2.y) / 2,
      vx: (fruit1.vx + fruit2.vx) * 0.3,
      vy: (fruit1.vy + fruit2.vy) * 0.3,
      radius: config.radius,
      type: newType,
      color: config.color,
      name: config.name,
      merged: false,
      dangerTime: 0,
    }

    // 移除旧水果，添加新水果
    fruits.value.splice(Math.max(index1, index2), 1)
    fruits.value.splice(Math.min(index1, index2), 1)
    fruits.value.push(newFruit)

    // 增加分数
    score.value += config.score

    return { newFruit, scoreGained: config.score }
  }

  // 检查游戏结束
  const checkGameOver = () => {
    for (const fruit of fruits.value) {
      if (fruit.y - fruit.radius <= dropLine) {
        const isStatic = Math.abs(fruit.vx) < 1 && Math.abs(fruit.vy) < 1

        if (isStatic) {
          fruit.dangerTime++
          if (fruit.dangerTime > 30) {
            gameOver.value = true
            return true
          }
        } else {
          fruit.dangerTime = 0
        }
      } else {
        fruit.dangerTime = 0
      }
    }
    return false
  }

  // 渲染游戏
  const render = (ctx: CanvasRenderingContext2D) => {
    // 清空画布
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // 绘制游戏结束线
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, dropLine)
    ctx.lineTo(displayWidth, dropLine)
    ctx.stroke()
    ctx.setLineDash([])

    // 绘制水果
    for (const fruit of fruits.value) {
      ctx.fillStyle = fruit.color
      ctx.beginPath()
      ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2)
      ctx.fill()

      // 绘制边框
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.stroke()

      // 绘制文字
      ctx.fillStyle = 'white'
      ctx.font = `${fruit.radius / 3}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(fruit.name, fruit.x, fruit.y)
    }
  }

  // 获取游戏状态
  const getGameState = (): GameState => {
    return {
      fruits: fruits.value.map((fruit) => ({ ...fruit })),
      score: score.value,
      gameOver: gameOver.value,
      nextFruitType: nextFruitType.value,
    }
  }

  // 设置游戏状态
  const setGameState = (state: GameState) => {
    // 深拷贝水果数组以避免引用问题
    // fruits.value = state.fruits ? state.fruits.map(fruit => ({ ...fruit })) : []
    score.value = state.score || 0
    gameOver.value = state.gameOver || false
    nextFruitType.value = state.nextFruitType || 0

    console.log('游戏引擎状态已更新:', {
      fruitsCount: fruits.value.length,
      score: score.value,
      gameOver: gameOver.value,
      nextFruitType: nextFruitType.value
    })
  }

  // 重置游戏
  const reset = () => {
    fruits.value = []
    score.value = 0
    gameOver.value = false
    generateNextFruit()
  }

  // 初始化
  generateNextFruit()

  return {
    // 状态
    fruits: readonly(fruits),
    score: readonly(score),
    gameOver: readonly(gameOver),
    nextFruitType: readonly(nextFruitType),
    fruitConfig,

    // 配置
    displayWidth,
    displayHeight,
    dropLine,
    enableSound,

    // 方法
    dropFruit,
    dropFruitAt,
    update,
    render,
    getGameState,
    setGameState,
    reset,
    generateNextFruit,
  }
}

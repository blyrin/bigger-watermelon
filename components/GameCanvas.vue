<template>
  <div class="game-canvas-container">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="game-canvas"
      @click="handleClick"
      @mousemove="handleMouseMove"></canvas>

    <!-- 下一个水果预览 -->
    <div v-if="showNextFruit" class="next-fruit-preview">
      <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">下一个:</div>
      <div
        class="fruit-preview"
        :style="{
          width: nextFruitRadius * 2 + 'px',
          height: nextFruitRadius * 2 + 'px',
          backgroundColor: nextFruitColor,
          borderRadius: '50%',
        }">
        <span class="fruit-name">{{ nextFruitName }}</span>
      </div>
    </div>

    <!-- 游戏信息 -->
    <div v-if="showGameInfo" class="game-info">
      <div class="info-item">
        <span class="label">分数:</span>
        <span class="value">{{ score }}</span>
      </div>
      <div v-if="moves !== undefined" class="info-item">
        <span class="label">移动:</span>
        <span class="value">{{ moves }}</span>
      </div>
    </div>

    <!-- 游戏结束遮罩 -->
    <div v-if="gameOver" class="game-over-overlay">
      <div class="game-over-content">
        <h3 class="text-2xl font-bold text-white mb-4">游戏结束</h3>
        <p class="text-lg text-white mb-4">最终分数: {{ score }}</p>
        <button @click="$emit('restart')" class="btn btn-primary">重新开始</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameEngine } from '@/composables/useGameEngine'

interface Props {
  width?: number
  height?: number
  enableSound?: boolean
  showNextFruit?: boolean
  showGameInfo?: boolean
  moves?: number
  readonly?: boolean
  gameEngine?: any
}

interface Emits {
  (e: 'fruitDrop', data: { x: number; fruitType: number; timestamp: number }): void
  (e: 'restart'): void
  (e: 'scoreUpdate', score: number): void
  (e: 'moveUpdate', moves: number): void
  (e: 'gameOver', finalScore: number): void
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 600,
  enableSound: true,
  showNextFruit: true,
  showGameInfo: true,
  readonly: false,
})

const emit = defineEmits<Emits>()

// 游戏引擎 - 使用传入的引擎或创建新的
const gameEngine =
  props.gameEngine ||
  useGameEngine({
    displayWidth: props.width,
    displayHeight: props.height,
    enableSound: props.enableSound,
  })

// 游戏状态跟踪
const lastScore = ref(0)
const lastMoves = ref(0)
const lastGameState = ref<any>(null)

// Canvas引用
const canvasRef = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D | null>()

// 游戏循环
let animationId: number | null = null

// 计算属性
const score = computed(() => gameEngine.score.value)
const gameOver = computed(() => gameEngine.gameOver.value)
const nextFruitType = computed(() => gameEngine.nextFruitType.value)
const nextFruitConfig = computed(() => gameEngine.fruitConfig[nextFruitType.value])
const nextFruitRadius = computed(() => nextFruitConfig.value?.radius || 15)
const nextFruitColor = computed(() => nextFruitConfig.value?.color || '#333')
const nextFruitName = computed(() => nextFruitConfig.value?.name || '')

// 鼠标位置
const mouseX = ref(0)

// 初始化画布
const initCanvas = () => {
  if (!canvasRef.value) return

  ctx.value = canvasRef.value.getContext('2d')
  if (!ctx.value) return

  startGameLoop()
}

// 游戏循环
const startGameLoop = () => {
  if (!ctx.value) return

  const gameLoop = () => {
    // 更新游戏状态
    gameEngine.update()

    // 渲染游戏
    gameEngine.render(ctx.value!)

    // 绘制预览水果（如果不是只读模式）
    if (!props.readonly && !gameEngine.gameOver.value) {
      drawPreviewFruit()
    }

    // 检查游戏状态变化并发送事件（仅在非只读模式下）
    if (!props.readonly) {
      checkAndEmitStateChanges()
    }

    // 继续循环
    if (!gameEngine.gameOver.value) {
      animationId = requestAnimationFrame(gameLoop)
    } else {
      // 游戏结束处理
      if (!props.readonly && lastScore.value !== gameEngine.score.value) {
        // 游戏结束时发送最终分数（仅非只读模式）
        emit('gameOver', gameEngine.score.value)
        lastScore.value = gameEngine.score.value
      }
      // 对于只读模式（对手游戏），即使游戏结束也继续渲染以显示最终状态
      if (props.readonly) {
        animationId = requestAnimationFrame(gameLoop)
      }
    }
  }

  gameLoop()
}

// 检查并发送状态变化事件
const checkAndEmitStateChanges = () => {
  const currentScore = gameEngine.score.value

  // 检查分数变化
  if (currentScore !== lastScore.value) {
    emit('scoreUpdate', currentScore)
    lastScore.value = currentScore
    console.log('分数更新:', currentScore)
  }
}

// 绘制预览水果
const drawPreviewFruit = () => {
  if (!ctx.value) return

  const config = nextFruitConfig.value
  if (!config) return

  // 保存当前状态
  ctx.value.save()

  // 设置透明度
  ctx.value.globalAlpha = 0.5

  // 绘制预览水果
  ctx.value.fillStyle = config.color
  ctx.value.beginPath()
  ctx.value.arc(mouseX.value, config.radius, config.radius, 0, Math.PI * 2)
  ctx.value.fill()

  // 绘制边框
  ctx.value.strokeStyle = '#333'
  ctx.value.lineWidth = 1
  ctx.value.stroke()

  // 恢复状态
  ctx.value.restore()
}

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (props.readonly || gameEngine.gameOver.value) return

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left

  // 放置水果
  const droppedFruit = gameEngine.dropFruit(x)

  // 更新移动次数
  lastMoves.value++
  emit('moveUpdate', lastMoves.value)

  // 发送水果放置事件（包含详细信息）
  const dropData = {
    x,
    fruitType: droppedFruit.type,
    timestamp: Date.now(),
  }
  console.log('GameCanvas发送fruitDrop事件:', dropData)
  emit('fruitDrop', dropData)
}

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
  if (props.readonly) return

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  mouseX.value = event.clientX - rect.left
}

// 重置游戏
const resetGame = () => {
  gameEngine.reset()
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  startGameLoop()
}

// 设置游戏状态（用于多人游戏同步）
const setGameState = (state: any) => {
  gameEngine.setGameState(state)
}

// 暴露方法给父组件
defineExpose({
  resetGame,
  setGameState,
  getGameState: gameEngine.getGameState,
})

// 生命周期
onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// 监听游戏结束
watch(gameOver, (isGameOver) => {
  if (isGameOver && animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})
</script>

<style scoped lang="postcss">
.game-canvas-container {
  @apply relative inline-block;
}

.game-canvas {
  @apply border-2 border-gray-800 rounded-lg shadow-game bg-game-bg cursor-crosshair;
}

.next-fruit-preview {
  @apply absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg;
}

.fruit-preview {
  @apply flex items-center justify-center border-2 border-gray-300 dark:border-gray-600;
}

.fruit-name {
  @apply text-xs font-medium text-white drop-shadow;
}

.game-info {
  @apply absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg space-y-2;
}

.info-item {
  @apply flex justify-between items-center space-x-3;
}

.label {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.value {
  @apply text-lg font-bold text-gray-900 dark:text-white;
}

.game-over-overlay {
  @apply absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg;
}

.game-over-content {
  @apply text-center p-6 bg-gray-900 rounded-lg;
}
</style>

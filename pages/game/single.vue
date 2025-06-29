<template>
  <div class="min-h-screen py-8">
    <div class="container mx-auto px-4">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">单人模式</h1>
        <p class="text-gray-600 dark:text-gray-400">挑战自己，创造最高分记录！</p>
      </div>

      <!-- 游戏区域 -->
      <div class="flex flex-col lg:flex-row items-start justify-center gap-8">
        <!-- 游戏画布 -->
        <div class="flex-shrink-0">
          <GameCanvas
            ref="gameCanvasRef"
            :width="400"
            :height="600"
            :show-next-fruit="true"
            :show-game-info="true"
            :moves="moves"
            @fruit-drop="handleFruitDrop"
            @restart="handleRestart"
            @game-state-change="handleGameStateChange" />
        </div>

        <!-- 侧边栏 -->
        <div class="w-full lg:w-80 space-y-6">
          <!-- 游戏统计 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">游戏统计</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-primary-600">{{ currentScore }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">当前分数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ moves }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">移动次数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ bestScore }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">最高分</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">{{ gameTime }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">游戏时间</div>
              </div>
            </div>
          </div>

          <!-- 游戏控制 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">游戏控制</h3>
            <div class="space-y-3">
              <button @click="handleRestart" class="btn btn-primary w-full" :disabled="!gameStarted">
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                重新开始
              </button>

              <button @click="togglePause" class="btn btn-secondary w-full" :disabled="!gameStarted || gameOver">
                <PauseIcon v-if="!isPaused" class="w-4 h-4 mr-2" />
                <PlayIcon v-else class="w-4 h-4 mr-2" />
                {{ isPaused ? '继续' : '暂停' }}
              </button>
            </div>
          </div>

          <!-- 水果图鉴 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">水果图鉴</h3>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(fruit, index) in fruitConfig"
                :key="index"
                class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div class="w-8 h-8 mx-auto rounded-full mb-1" :style="{ backgroundColor: fruit.color }"></div>
                <div class="text-xs font-medium">{{ fruit.name }}</div>
                <div class="text-xs text-gray-500">{{ fruit.score }}分</div>
              </div>
            </div>
          </div>

          <!-- 游戏说明 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">游戏说明</h3>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>• 点击屏幕放置水果</p>
              <p>• 相同水果碰撞会合成更大的水果</p>
              <p>• 水果超过红线游戏结束</p>
              <p>• 目标是合成最大的西瓜</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 游戏结束弹窗 -->
      <GameOverModal
        v-if="showGameOverModal"
        :score="currentScore"
        :moves="moves"
        :time="gameTime"
        :is-new-record="isNewRecord"
        @restart="handleRestart"
        @close="showGameOverModal = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowPathIcon, PauseIcon, PlayIcon, UsersIcon } from '@heroicons/vue/24/outline'

// 页面元信息
definePageMeta({
  layout: 'default',
})

useHead({
  title: '单人模式 - 合成大西瓜',
})

// 状态管理
const authStore = useAuthStore()

// 游戏状态
const gameCanvasRef = ref()
const currentScore = ref(0)
const moves = ref(0)
const gameStarted = ref(false)
const gameOver = ref(false)
const isPaused = ref(false)
const showGameOverModal = ref(false)
const startTime = ref<Date>()
const gameTime = ref('00:00')

// 计算属性
const bestScore = computed(() => authStore.user?.bestScore || 0)
const isNewRecord = computed(() => currentScore.value > bestScore.value)

// 水果配置（用于图鉴显示）
const fruitConfig = [
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

// 游戏时间计时器
let timeInterval: NodeJS.Timeout | null = null

// 开始计时
const startTimer = () => {
  startTime.value = new Date()
  timeInterval = setInterval(() => {
    if (startTime.value && !isPaused.value) {
      const elapsed = Math.floor((Date.now() - startTime.value.getTime()) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      gameTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }
}

// 处理水果放置
const handleFruitDrop = (x: number) => {
  if (!gameStarted.value) {
    gameStarted.value = true
    startTimer()
  }

  moves.value++
}

// 处理游戏状态变化
const handleGameStateChange = (state: any) => {
  currentScore.value = state.score

  if (state.gameOver && !gameOver.value) {
    gameOver.value = true
    stopTimer()
    showGameOverModal.value = true

    // 更新用户统计
    if (authStore.isLoggedIn && authStore.user) {
      authStore.updateUserStats({
        gamesPlayed: authStore.user.gamesPlayed + 1,
        totalScore: authStore.user.totalScore + currentScore.value,
        bestScore: Math.max(authStore.user.bestScore, currentScore.value),
      })
    }
  }
}

// 重新开始游戏
const handleRestart = () => {
  gameCanvasRef.value?.resetGame()
  currentScore.value = 0
  moves.value = 0
  gameStarted.value = false
  gameOver.value = false
  isPaused.value = false
  showGameOverModal.value = false
  gameTime.value = '00:00'
  stopTimer()
}

// 暂停/继续游戏
const togglePause = () => {
  isPaused.value = !isPaused.value
  // TODO: 实现游戏暂停逻辑
}

// 页面卸载时清理
onUnmounted(() => {
  stopTimer()
})
</script>

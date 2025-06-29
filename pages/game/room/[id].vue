<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-8">
      <!-- 房间信息 -->
      <div v-if="gameStore.currentRoom" class="mb-8">
        <div class="card card-body">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ gameStore.currentRoom.name }}
            </h1>
            <button
              @click="leaveRoom"
              :disabled="gameStore.isInGame"
              :class="['btn', gameStore.isInGame ? 'btn-disabled' : 'btn-outline-danger']"
              :title="gameStore.isInGame ? '游戏进行中无法离开房间' : ''">
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              {{ gameStore.isInGame ? '游戏中...' : '离开房间' }}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">房间状态:</span>
              <span :class="getStatusClass(gameStore.currentRoom.gameState)">
                {{ getStatusText(gameStore.currentRoom.gameState) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">玩家数量:</span>
              <span>{{ gameStore.currentRoom.players.length }}/{{ gameStore.currentRoom.maxPlayers }}</span>
            </div>
            <div v-if="gameStore.currentRoom.gameMode" class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">游戏模式:</span>
              <span>
                {{ gameStore.currentRoom.gameMode.type === 'moves' ? '限定次数' : '限定时间' }}
                ({{ gameStore.currentRoom.gameMode.limit
                }}{{ gameStore.currentRoom.gameMode.type === 'moves' ? '次' : '分钟' }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 玩家列表 -->
      <div v-if="gameStore.currentRoom" class="mb-8">
        <div class="card card-body">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">房间玩家</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="player in gameStore.currentRoom.players"
              :key="player.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserIcon class="w-6 h-6 text-white" />
                </div>
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ player.name }}
                    <span v-if="player.id === authStore.user?.id" class="text-sm text-blue-600 dark:text-blue-400">
                      (你)
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    分数: {{ player.score }} | 移动: {{ player.moves }}
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <span
                  :class="player.ready ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'"
                  class="text-sm font-medium">
                  {{ player.ready ? '已准备' : '未准备' }}
                </span>
                <div :class="player.ready ? 'bg-green-500' : 'bg-gray-400'" class="w-3 h-3 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 游戏控制 -->
      <div v-if="gameStore.currentRoom && !gameStore.isInGame" class="mb-8">
        <div class="card card-body text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">游戏准备</h3>

          <div v-if="gameStore.currentRoom.players.length < 2" class="mb-4">
            <p class="text-gray-600 dark:text-gray-400">等待更多玩家加入房间...</p>
          </div>

          <div v-else class="mb-4">
            <p class="text-gray-600 dark:text-gray-400 mb-4">所有玩家准备就绪后即可开始游戏</p>

            <button @click="toggleReady" :class="isCurrentPlayerReady ? 'btn-success' : 'btn-primary'" class="btn">
              {{ isCurrentPlayerReady ? '取消准备' : '准备游戏' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 游戏区域 -->
      <div v-if="gameStore.isInGame" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 我的游戏 -->
        <div class="card card-body">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            我的游戏
            <span class="text-sm font-normal text-gray-600 dark:text-gray-400">
              (分数: {{ gameStore.myScore }} | 移动: {{ gameStore.myMoves }})
            </span>
          </h3>
          <GameCanvas
            ref="myGameCanvas"
            :game-engine="gameStore.myGameEngine"
            @score-update="handleMyScoreUpdate"
            @move-update="handleMyMoveUpdate"
            @game-over="handleMyGameOver"
            @fruit-drop="handleMyFruitDrop" />
        </div>

        <!-- 对手游戏 -->
        <div class="card card-body">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            对手游戏
            <span class="text-sm font-normal text-gray-600 dark:text-gray-400">
              (分数: {{ gameStore.opponentScore }} | 移动: {{ gameStore.opponentMoves }})
            </span>
          </h3>
          <GameCanvas
            ref="opponentGameCanvas"
            :game-engine="gameStore.opponentGameEngine"
            :readonly="true"
            :enable-sound="false"
            :show-next-fruit="false" />
        </div>
      </div>

      <!-- 连接状态 -->
      <div v-if="gameStore.connectionStatus !== 'connected'" class="fixed bottom-4 right-4">
        <div
          class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300">
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 mr-2"></div>
            <span class="text-sm">
              {{ gameStore.connectionStatus === 'connecting' ? '连接中...' : '连接断开' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, UserIcon } from '@heroicons/vue/24/outline'

// 中间件：需要登录
definePageMeta({
  middleware: 'auth',
})

// 使用状态管理
const authStore = useAuthStore()
const gameStore = useGameStore()
const route = useRoute()

// 计算属性
const isCurrentPlayerReady = computed(() => {
  if (!gameStore.currentRoom || !authStore.user) return false
  const currentPlayer = gameStore.currentRoom.players.find((p) => p.id === authStore.user?.id)
  return currentPlayer?.ready || false
})

// 方法
const leaveRoom = async () => {
  // 如果游戏正在进行中，禁止离开
  if (gameStore.isInGame) {
    alert('游戏进行中无法离开房间，请等待游戏结束')
    return
  }

  // 确认离开
  if (confirm('确定要离开房间吗？')) {
    await gameStore.leaveRoom()
    await navigateTo('/game')
  }
}

const toggleReady = () => {
  gameStore.toggleReady()
}

// 初始化游戏引擎
const initGameEngines = async () => {
  console.log('开始初始化游戏引擎...')

  // 动态导入游戏引擎
  const { useGameEngine } = await import('@/composables/useGameEngine')

  // 初始化我的游戏引擎
  gameStore.myGameEngine = useGameEngine({
    displayWidth: 400,
    displayHeight: 600,
    enableSound: true,
  })

  // 初始化对手的游戏引擎
  gameStore.opponentGameEngine = useGameEngine({
    displayWidth: 400,
    displayHeight: 600,
    enableSound: false, // 对手游戏静音
  })

  console.log('游戏引擎初始化完成:', {
    myGameEngine: !!gameStore.myGameEngine,
    opponentGameEngine: !!gameStore.opponentGameEngine,
  })
}

// 监听游戏状态变化
watch(
  () => gameStore.isInGame,
  async (isInGame) => {
    if (isInGame) {
      console.log('游戏开始！')
      // 初始化游戏引擎
      await initGameEngines()
    }
  }
)

const getStatusClass = (status: string) => {
  switch (status) {
    case 'waiting':
      return 'text-green-600 dark:text-green-400'
    case 'playing':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'finished':
      return 'text-gray-600 dark:text-gray-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'waiting':
      return '等待中'
    case 'playing':
      return '游戏中'
    case 'finished':
      return '已结束'
    default:
      return '未知'
  }
}

// 游戏事件处理
const handleMyScoreUpdate = (score: number) => {
  gameStore.myScore = score
  gameStore.sendGameStateUpdate()
}

const handleMyMoveUpdate = (moves: number) => {
  gameStore.myMoves = moves
  gameStore.sendGameStateUpdate()
}

const handleMyFruitDrop = (dropData: { x: number; fruitType: number; timestamp: number }) => {
  // 水果放置时立即发送水果放置事件和状态更新
  console.log('水果放置事件:', dropData)

  // 发送专门的水果放置事件
  gameStore.sendFruitDrop(dropData)

  // 强制发送游戏状态更新
  gameStore.sendGameStateUpdate(true)
}

const handleMyGameOver = (finalScore: number) => {
  // 发送游戏结束事件
  gameStore.sendMessage({
    type: 'game_end',
    score: finalScore,
    moves: gameStore.myMoves,
    won: false, // 这里需要根据实际游戏逻辑判断
  })
}

// 生命周期
onMounted(() => {
  // 确保WebSocket已连接
  if (!gameStore.isConnected) {
    gameStore.initWebSocket()
  }

  // 如果没有当前房间信息，尝试重新获取
  if (!gameStore.currentRoom) {
    // 可以根据路由参数获取房间信息
    const roomId = route.params.id as string
    if (roomId) {
      // 这里可以添加获取房间详情的逻辑
      console.log('尝试获取房间信息:', roomId)
    }
  }
})

// 监听房间状态变化
watch(
  () => gameStore.currentRoom,
  (room) => {
    if (!room) {
      // 如果房间不存在，返回游戏大厅
      navigateTo('/game')
    }
  }
)
</script>

<style scoped lang="postcss">
.card {
  @apply bg-white rounded-lg shadow-md dark:bg-gray-800;
}

.card-body {
  @apply p-6;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.btn-outline-danger {
  @apply border border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900;
}

.btn-disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300 hover:bg-gray-300 hover:text-gray-500;
}
</style>

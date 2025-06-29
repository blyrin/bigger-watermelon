<template>
  <div class="min-h-screen py-8">
    <div class="container mx-auto px-4">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">多人对战大厅</h1>
        <p class="text-gray-600 dark:text-gray-400">与好友实时对战，体验紧张刺激的合成大西瓜！</p>
      </div>

      <!-- 连接状态 -->
      <div class="flex justify-center mb-6">
        <div class="flex items-center space-x-2 px-4 py-2 rounded-full" :class="connectionStatusClass">
          <div class="w-2 h-2 rounded-full" :class="connectionDotClass"></div>
          <span class="text-sm font-medium">{{ connectionStatusText }}</span>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- 房间列表 -->
        <div class="lg:col-span-2">
          <div class="card">
            <div class="card-header flex justify-between items-center">
              <h2 class="text-xl font-semibold">游戏房间</h2>
              <div class="flex space-x-2">
                <button @click="refreshRooms" class="btn btn-outline btn-sm" :disabled="!gameStore.isConnected">
                  <ArrowPathIcon class="w-4 h-4 mr-1" />
                  刷新
                </button>
                <button
                  @click="showCreateRoomModal = true"
                  class="btn btn-primary btn-sm"
                  :disabled="!gameStore.isConnected">
                  <PlusIcon class="w-4 h-4 mr-1" />
                  创建房间
                </button>
              </div>
            </div>

            <div class="card-body">
              <!-- 房间列表 -->
              <div v-if="gameStore.rooms.length > 0" class="space-y-3">
                <div
                  v-for="room in gameStore.rooms"
                  :key="room.id"
                  class="room-item p-4 cursor-pointer"
                  @click="joinRoom(room)">
                  <div class="flex justify-between items-center">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h3 class="font-semibold text-lg">{{ room.name }}</h3>
                        <LockClosedIcon v-if="room.hasPassword" class="w-4 h-4 text-gray-500" />
                      </div>
                      <div class="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>玩家: {{ room.playerCount }}/{{ room.maxPlayers }}</span>
                        <span v-if="room.gameMode">
                          模式: {{ room.gameMode.type === 'moves' ? '限定次数' : '限定时间' }} ({{ room.gameMode.limit
                          }}{{ room.gameMode.type === 'moves' ? '次' : '秒' }})
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <span :class="getRoomStatusClass(room.gameState)">
                        {{ getRoomStatusText(room.gameState) }}
                      </span>
                      <ChevronRightIcon class="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else class="text-center py-12">
                <UsersIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无房间</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">还没有人创建房间，成为第一个吧！</p>
                <button @click="showCreateRoomModal = true" class="btn btn-primary" :disabled="!gameStore.isConnected">
                  创建房间
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="space-y-6">
          <!-- 用户信息 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">玩家信息</h3>
            <div class="flex items-center space-x-3 mb-4">
              <div
                class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="font-medium">{{ authStore.user?.username }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">等级: {{ userLevel }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-center">
              <div>
                <div class="text-lg font-bold text-primary-600">{{ authStore.user?.gamesPlayed || 0 }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">总游戏</div>
              </div>
              <div>
                <div class="text-lg font-bold text-green-600">{{ authStore.winRate }}%</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">胜率</div>
              </div>
              <div>
                <div class="text-lg font-bold text-blue-600">{{ authStore.user?.bestScore || 0 }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">最高分</div>
              </div>
              <div>
                <div class="text-lg font-bold text-purple-600">{{ authStore.averageScore }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">平均分</div>
              </div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">快速操作</h3>
            <div class="space-y-3">
              <NuxtLink to="/game/single" class="btn btn-outline w-full">
                <UserIcon class="w-4 h-4 mr-2" />
                单人模式
              </NuxtLink>

              <button @click="quickMatch" class="btn btn-success w-full" :disabled="!gameStore.isConnected">
                <BoltIcon class="w-4 h-4 mr-2" />
                快速匹配
              </button>

              <NuxtLink to="/profile" class="btn btn-secondary w-full">
                <ChartBarIcon class="w-4 h-4 mr-2" />
                查看统计
              </NuxtLink>
            </div>
          </div>

          <!-- 在线玩家 -->
          <div class="card card-body">
            <h3 class="text-lg font-semibold mb-4">在线玩家</h3>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ onlinePlayersCount }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">当前在线</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建房间弹窗 -->
      <CreateRoomModal v-if="showCreateRoomModal" @close="showCreateRoomModal = false" @create="handleCreateRoom" />

      <!-- 加入房间弹窗 -->
      <JoinRoomModal
        v-if="showJoinRoomModal"
        :room="selectedRoom"
        @close="showJoinRoomModal = false"
        @join="handleJoinRoom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowPathIcon,
  PlusIcon,
  LockClosedIcon,
  ChevronRightIcon,
  UsersIcon,
  UserIcon,
  BoltIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'

// 页面元信息
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

useHead({
  title: '多人对战大厅 - 合成大西瓜',
})

// 状态管理
const authStore = useAuthStore()
const gameStore = useGameStore()

// 导入类型
import type { GameRoom } from '~/types/global'

// 本地状态
const showCreateRoomModal = ref(false)
const showJoinRoomModal = ref(false)
const selectedRoom = ref<GameRoom | null>(null)

// 计算属性
const connectionStatusClass = computed(() => {
  switch (gameStore.connectionStatus) {
    case 'connected':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
})

const connectionDotClass = computed(() => {
  switch (gameStore.connectionStatus) {
    case 'connected':
      return 'bg-green-500'
    case 'connecting':
      return 'bg-yellow-500 animate-pulse'
    default:
      return 'bg-red-500'
  }
})

const connectionStatusText = computed(() => {
  switch (gameStore.connectionStatus) {
    case 'connected':
      return '已连接到服务器'
    case 'connecting':
      return '正在连接...'
    default:
      return '连接断开'
  }
})

const userLevel = computed(() => {
  const gamesPlayed = authStore.user?.gamesPlayed || 0
  if (gamesPlayed >= 100) return '大师'
  if (gamesPlayed >= 50) return '专家'
  if (gamesPlayed >= 20) return '熟练'
  if (gamesPlayed >= 5) return '新手'
  return '萌新'
})

const onlinePlayersCount = ref(0) // TODO: 从服务器获取

// 方法
const refreshRooms = () => {
  gameStore.fetchRooms()
}

const joinRoom = (room: any) => {
  if (room.hasPassword) {
    selectedRoom.value = room
    showJoinRoomModal.value = true
  } else {
    gameStore.joinRoom(room.id)
  }
}

const handleCreateRoom = (roomData: any) => {
  gameStore.createRoom(roomData.name, roomData.password)
  showCreateRoomModal.value = false
}

const handleJoinRoom = (password: string) => {
  if (selectedRoom.value) {
    gameStore.joinRoom(selectedRoom.value.id, password)
  }
  showJoinRoomModal.value = false
}

const quickMatch = () => {
  // TODO: 实现快速匹配逻辑
  console.log('快速匹配功能待实现')
}

const getRoomStatusClass = (status: string) => {
  switch (status) {
    case 'waiting':
      return 'status-waiting'
    case 'playing':
      return 'status-playing'
    case 'finished':
      return 'status-offline'
    default:
      return 'status-offline'
  }
}

const getRoomStatusText = (status: string) => {
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

// 生命周期
onMounted(() => {
  // 确保WebSocket已连接
  if (!gameStore.isConnected) {
    gameStore.initWebSocket()
  }

  // 获取房间列表
  gameStore.fetchRooms()
})

// 监听房间变化，如果加入了房间则跳转
watch(
  () => gameStore.currentRoom,
  (room) => {
    if (room) {
      navigateTo(`/game/room/${room.id}`)
    }
  }
)
</script>

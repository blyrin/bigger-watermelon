<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"></div>

      <!-- 弹窗内容 -->
      <div class="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-gray-800">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">加入房间</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- 房间信息 -->
        <div v-if="room" class="mb-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
            {{ room.name }}
          </h4>
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div class="flex items-center justify-between">
              <span>玩家数量:</span>
              <span>{{ room.playerCount }}/{{ room.maxPlayers }}</span>
            </div>
            <div v-if="room.gameMode" class="flex items-center justify-between">
              <span>游戏模式:</span>
              <span>
                {{ room.gameMode.type === 'moves' ? '限定次数' : '限定时间' }}
                ({{ room.gameMode.limit }}{{ room.gameMode.type === 'moves' ? '次' : '分钟' }})
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>房间状态:</span>
              <span :class="getStatusClass(room.gameState)">
                {{ getStatusText(room.gameState) }}
              </span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 密码输入 -->
          <div v-if="room?.hasPassword">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 房间密码 </label>
            <input
              v-model="password"
              type="password"
              required
              maxlength="20"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请输入房间密码" />
          </div>

          <!-- 提示信息 -->
          <div v-if="!room?.hasPassword" class="text-sm text-gray-600 dark:text-gray-400">
            该房间无需密码，点击加入即可进入房间。
          </div>

          <!-- 错误信息 -->
          <div v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">
            {{ errorMessage }}
          </div>

          <!-- 按钮 -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700">
              取消
            </button>
            <button
              type="submit"
              :disabled="room?.hasPassword && !password.trim()"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              加入房间
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { GameRoom } from '~/types/global'

const props = defineProps<{
  room: GameRoom | null
}>()

// 事件定义
const emit = defineEmits<{
  close: []
  join: [password: string]
}>()

// 响应式数据
const password = ref('')
const errorMessage = ref('')

// 处理表单提交
const handleSubmit = () => {
  if (props.room?.hasPassword && !password.value.trim()) {
    errorMessage.value = '请输入房间密码'
    return
  }

  errorMessage.value = ''
  emit('join', password.value.trim())
}

// 获取状态样式类
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

// 获取状态文本
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

// 组件挂载时聚焦到密码输入框
onMounted(() => {
  if (props.room?.hasPassword) {
    const input = document.querySelector('input[type="password"]') as HTMLInputElement
    if (input) {
      input.focus()
    }
  }
})

// 监听房间变化，清除错误信息
watch(
  () => props.room,
  () => {
    errorMessage.value = ''
    password.value = ''
  }
)
</script>

<style scoped lang="postcss">
/* 自定义样式 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

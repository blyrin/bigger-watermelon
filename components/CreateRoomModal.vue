<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"></div>

      <!-- 弹窗内容 -->
      <div class="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-gray-800">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">创建房间</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 房间名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 房间名称 </label>
            <input
              v-model="roomName"
              type="text"
              required
              maxlength="20"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="输入房间名称" />
          </div>

          <!-- 房间密码 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 房间密码（可选） </label>
            <input
              v-model="roomPassword"
              type="password"
              maxlength="20"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="留空表示无密码" />
          </div>

          <!-- 游戏模式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> 游戏模式 </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="gameMode.type"
                  type="radio"
                  value="moves"
                  class="mr-2 text-blue-600 focus:ring-blue-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">限定次数</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="gameMode.type"
                  type="radio"
                  value="time"
                  class="mr-2 text-blue-600 focus:ring-blue-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">限定时间</span>
              </label>
            </div>
          </div>

          <!-- 限制值 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ gameMode.type === 'moves' ? '最大次数' : '时间限制（分钟）' }}
            </label>
            <input
              v-model.number="gameMode.limit"
              type="number"
              :min="gameMode.type === 'moves' ? 10 : 1"
              :max="gameMode.type === 'moves' ? 200 : 30"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
              :disabled="!roomName.trim()"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              创建房间
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

// 事件定义
const emit = defineEmits<{
  close: []
  create: [
    roomData: {
      name: string
      password?: string
      gameMode: {
        type: 'moves' | 'time'
        limit: number
      }
    }
  ]
}>()

// 响应式数据
const roomName = ref('')
const roomPassword = ref('')
const gameMode = ref({
  type: 'moves' as 'moves' | 'time',
  limit: 50,
})

// 监听游戏模式变化，调整默认限制值
watch(
  () => gameMode.value.type,
  (newType) => {
    if (newType === 'moves') {
      gameMode.value.limit = 50
    } else {
      gameMode.value.limit = 5
    }
  }
)

// 处理表单提交
const handleSubmit = () => {
  if (!roomName.value.trim()) return

  emit('create', {
    name: roomName.value.trim(),
    password: roomPassword.value.trim() || undefined,
    gameMode: gameMode.value,
  })
}

// 组件挂载时聚焦到房间名称输入框
onMounted(() => {
  const input = document.querySelector('input[type="text"]') as HTMLInputElement
  if (input) {
    input.focus()
  }
})
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

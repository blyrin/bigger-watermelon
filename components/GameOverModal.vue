<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- 背景遮罩 -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- 弹窗内容 -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">游戏结束</h3>
              <div class="mt-4">
                <!-- 新纪录提示 -->
                <div
                  v-if="isNewRecord"
                  class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div class="flex items-center">
                    <TrophyIcon class="h-5 w-5 text-yellow-400 mr-2" />
                    <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      🎉 恭喜！创造了新的个人纪录！
                    </p>
                  </div>
                </div>

                <!-- 游戏统计 -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-primary-600">{{ score }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">最终分数</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ moves }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">移动次数</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ time }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">游戏时间</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ efficiency }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">效率</div>
                  </div>
                </div>

                <!-- 评价 -->
                <div class="text-center mb-4">
                  <div class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {{ evaluation.title }}
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ evaluation.description }}
                  </p>
                </div>

                <!-- 分享按钮 -->
                <div class="flex justify-center space-x-2 mb-4">
                  <button @click="shareResult" class="btn btn-outline btn-sm">
                    <ShareIcon class="w-4 h-4 mr-1" />
                    分享成绩
                  </button>
                  <button @click="saveScreenshot" class="btn btn-outline btn-sm">
                    <CameraIcon class="w-4 h-4 mr-1" />
                    保存截图
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="$emit('restart')"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
            再来一局
          </button>
          <button
            @click="$emit('close')"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon, TrophyIcon, ShareIcon, CameraIcon } from '@heroicons/vue/24/outline'

interface Props {
  score: number
  moves: number
  time: string
  isNewRecord?: boolean
}

interface Emits {
  (e: 'restart'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isNewRecord: false,
})

const emit = defineEmits<Emits>()

// 计算效率（分数/移动次数）
const efficiency = computed(() => {
  if (props.moves === 0) return '0'
  return Math.round(props.score / props.moves).toString()
})

// 游戏评价
const evaluation = computed(() => {
  const score = props.score

  if (score >= 1000) {
    return {
      title: '🍉 西瓜大师！',
      description: '你已经是合成大西瓜的高手了！',
    }
  } else if (score >= 500) {
    return {
      title: '🥥 椰子专家！',
      description: '表现很棒，继续努力合成更大的水果！',
    }
  } else if (score >= 200) {
    return {
      title: '🍍 菠萝达人！',
      description: '不错的成绩，再接再厉！',
    }
  } else if (score >= 100) {
    return {
      title: '🍑 桃子新手！',
      description: '还有很大的进步空间，加油！',
    }
  } else {
    return {
      title: '🍒 樱桃萌新！',
      description: '刚刚开始，多练习就能提高！',
    }
  }
})

// 分享结果
const shareResult = () => {
  const text = `我在合成大西瓜游戏中获得了 ${props.score} 分！用了 ${props.moves} 次移动，游戏时间 ${props.time}。快来挑战我吧！`

  if (navigator.share) {
    navigator.share({
      title: '合成大西瓜 - 我的成绩',
      text: text,
      url: window.location.origin,
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(() => {
      // TODO: 显示复制成功提示
      console.log('成绩已复制到剪贴板')
    })
  }
}

// 保存截图
const saveScreenshot = () => {
  // TODO: 实现截图功能
  console.log('保存截图功能待实现')
}
</script>

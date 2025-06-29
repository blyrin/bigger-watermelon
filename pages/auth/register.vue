<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- 头部 -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">注册账号</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          已有账号？
          <NuxtLink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500"> 立即登录 </NuxtLink>
        </p>
      </div>

      <!-- 注册表单 -->
      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- 用户名 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300"> 用户名 </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="input mt-1"
              placeholder="请输入用户名（3-20个字符）"
              :disabled="authStore.isLoading"
              minlength="3"
              maxlength="20" />
            <p class="mt-1 text-xs text-gray-500">用户名将作为游戏中的显示名称</p>
          </div>

          <!-- 邮箱 -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"> 邮箱地址 </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input mt-1"
              placeholder="请输入邮箱地址"
              :disabled="authStore.isLoading" />
          </div>

          <!-- 密码 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300"> 密码 </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input pr-10"
                placeholder="请输入密码（至少6个字符）"
                :disabled="authStore.isLoading"
                minlength="6" />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <EyeIcon v-if="showPassword" class="h-5 w-5 text-gray-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <!-- 密码强度指示器 -->
            <div class="mt-2">
              <div class="flex space-x-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  :class="[
                    'h-1 w-full rounded',
                    passwordStrength >= i ? getStrengthColor(passwordStrength) : 'bg-gray-200 dark:bg-gray-600',
                  ]"></div>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                {{ getStrengthText(passwordStrength) }}
              </p>
            </div>
          </div>

          <!-- 确认密码 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              确认密码
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="input mt-1"
              placeholder="请再次输入密码"
              :disabled="authStore.isLoading" />
            <p v-if="form.confirmPassword && form.password !== form.confirmPassword" class="mt-1 text-xs text-red-600">
              两次输入的密码不一致
            </p>
          </div>
        </div>

        <!-- 服务条款 -->
        <div class="flex items-center">
          <input
            id="agree-terms"
            v-model="form.agreeTerms"
            type="checkbox"
            required
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
          <label for="agree-terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            我同意
            <a href="#" class="text-primary-600 hover:text-primary-500">服务条款</a>
            和
            <a href="#" class="text-primary-600 hover:text-primary-500">隐私政策</a>
          </label>
        </div>

        <!-- 错误信息 -->
        <div
          v-if="errorMessage"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div>
          <button
            type="submit"
            :disabled="authStore.isLoading || !canSubmit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <span v-if="authStore.isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </span>
            {{ authStore.isLoading ? '注册中...' : '注册账号' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// 页面元信息
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({
  title: '注册 - 合成大西瓜',
})

// 状态管理
const authStore = useAuthStore()

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
})

// 本地状态
const showPassword = ref(false)
const errorMessage = ref('')

// 密码强度计算
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0

  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/\d/.test(password) && /[!@#$%^&*]/.test(password)) strength++

  return strength
})

// 获取强度颜色
const getStrengthColor = (strength: number) => {
  switch (strength) {
    case 1:
      return 'bg-red-500'
    case 2:
      return 'bg-yellow-500'
    case 3:
      return 'bg-blue-500'
    case 4:
      return 'bg-green-500'
    default:
      return 'bg-gray-200'
  }
}

// 获取强度文本
const getStrengthText = (strength: number) => {
  switch (strength) {
    case 0:
      return '请输入密码'
    case 1:
      return '密码强度：弱'
    case 2:
      return '密码强度：一般'
    case 3:
      return '密码强度：良好'
    case 4:
      return '密码强度：强'
    default:
      return ''
  }
}

// 是否可以提交
const canSubmit = computed(() => {
  return (
    form.username.length >= 3 &&
    form.email &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword &&
    form.agreeTerms
  )
})

// 注册处理
const handleRegister = async () => {
  errorMessage.value = ''

  if (!canSubmit.value) {
    errorMessage.value = '请填写完整的注册信息'
    return
  }

  const result = await authStore.register(form.email, form.username, form.password)

  if (!result.success) {
    errorMessage.value = result.message
  }
}

// 如果已登录，重定向到游戏页面
onMounted(() => {
  if (authStore.isLoggedIn) {
    navigateTo('/game')
  }
})
</script>

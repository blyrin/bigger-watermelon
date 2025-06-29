<template>
  <header class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center space-x-2">
          <span class="text-2xl">🍉</span>
          <span class="text-xl font-bold text-gray-900 dark:text-white"> 合成大西瓜 </span>
        </NuxtLink>

        <!-- 导航菜单 -->
        <nav class="hidden md:flex items-center space-x-6">
          <NuxtLink to="/" class="nav-link">首页</NuxtLink>
          <NuxtLink v-if="authStore.isLoggedIn" to="/game" class="nav-link">游戏</NuxtLink>
          <NuxtLink to="/game/single" class="nav-link">单人模式</NuxtLink>
          <NuxtLink v-if="authStore.isLoggedIn" to="/profile" class="nav-link">个人中心</NuxtLink>
        </nav>

        <!-- 用户菜单 -->
        <div class="flex items-center space-x-4">
          <!-- 连接状态指示器 -->
          <div v-if="authStore.isLoggedIn" class="flex items-center space-x-2">
            <div :class="['w-2 h-2 rounded-full', gameStore.isConnected ? 'bg-green-500' : 'bg-red-500']"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ gameStore.isConnected ? '已连接' : '未连接' }}
            </span>
          </div>

          <!-- 用户信息 -->
          <div v-if="authStore.isLoggedIn" ref="userMenuRef" class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <div
                class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </div>
              <span class="hidden md:block">{{ authStore.user?.username }}</span>
              <ChevronDownIcon class="w-4 h-4" />
            </button>

            <!-- 下拉菜单 -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50"
              @click="showUserMenu = false">
              <NuxtLink to="/profile" class="dropdown-item">
                <UserIcon class="w-4 h-4" />
                个人中心
              </NuxtLink>
              <button @click="handleLogout" class="dropdown-item w-full text-left">
                <ArrowRightOnRectangleIcon class="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>

          <!-- 登录/注册按钮 -->
          <div v-else class="flex items-center space-x-2">
            <NuxtLink to="/auth/login" class="btn btn-outline btn-sm"> 登录 </NuxtLink>
            <NuxtLink to="/auth/register" class="btn btn-primary btn-sm"> 注册 </NuxtLink>
          </div>

          <!-- 主题切换 -->
          <button
            @click="toggleColorMode"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <SunIcon v-if="$colorMode.value === 'dark'" class="w-5 h-5" />
            <MoonIcon v-else class="w-5 h-5" />
          </button>

          <!-- 移动端菜单按钮 -->
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Bars3Icon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- 移动端菜单 -->
      <div
        v-if="showMobileMenu"
        ref="mobileMenuRef"
        class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
        <nav class="space-y-2">
          <NuxtLink to="/" class="mobile-nav-link">首页</NuxtLink>
          <NuxtLink v-if="authStore.isLoggedIn" to="/game" class="mobile-nav-link">游戏</NuxtLink>
          <NuxtLink to="/game/single" class="mobile-nav-link">单人模式</NuxtLink>
          <NuxtLink v-if="authStore.isLoggedIn" to="/profile" class="mobile-nav-link">个人中心</NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

// 状态管理
const authStore = useAuthStore()
const gameStore = useGameStore()

// 本地状态
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

// 元素引用
const userMenuRef = ref<HTMLElement>()
const mobileMenuRef = ref<HTMLElement>()

// 主题切换
const colorMode = useColorMode()
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// 退出登录
const handleLogout = async () => {
  await authStore.logout()
}

// 点击外部关闭菜单
onClickOutside(userMenuRef, () => {
  showUserMenu.value = false
})

onClickOutside(mobileMenuRef, () => {
  showMobileMenu.value = false
})
</script>

<style scoped lang="postcss">
.nav-link {
  @apply text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200;
}

.nav-link.router-link-active {
  @apply text-primary-600 dark:text-primary-400 font-medium;
}

.dropdown-item {
  @apply flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

.mobile-nav-link {
  @apply block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200;
}

.mobile-nav-link.router-link-active {
  @apply text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20;
}

.btn-sm {
  @apply px-3 py-1.5 text-sm;
}
</style>

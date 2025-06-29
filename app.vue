<template>
  <div id="app" class="min-h-screen">
    <!-- 导航栏 -->
    <AppHeader />
    <!-- 主要内容 -->
    <main class="container mx-auto px-4 py-8">
      <NuxtPage />
    </main>
    <!-- 全局通知 -->
    <AppNotification />
    <!-- 加载指示器 -->
    <AppLoading v-if="authStore.isLoading" />
  </div>
</template>

<script setup lang="ts">
// 设置页面元信息
useHead({
  title: '合成大西瓜 - 联机对战版',
  meta: [
    { name: 'description', content: '基于Nuxt3的合成大西瓜联机对战游戏，支持实时多人对战' },
    { name: 'keywords', content: '合成大西瓜,联机游戏,多人对战,Nuxt3,Vue3' },
  ],
})

// 使用状态管理
const authStore = useAuthStore()
const gameStore = useGameStore()

// 页面加载时初始化
onMounted(async () => {
  // 尝试获取用户信息
  await authStore.fetchUser()

  // 如果已登录，初始化WebSocket连接
  if (authStore.isLoggedIn) {
    gameStore.initWebSocket()
  }
})

// 页面卸载时清理
onUnmounted(() => {
  gameStore.disconnect()
})

// 监听登录状态变化
watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      gameStore.initWebSocket()
    } else {
      gameStore.disconnect()
    }
  }
)
</script>

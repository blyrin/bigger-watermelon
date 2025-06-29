<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-4xl mx-auto text-center">
      <!-- 游戏标题 -->
      <div class="mb-12">
        <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4 text-shadow-lg">🍉 合成大西瓜</h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-2">联机对战版</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">基于 Nuxt3 构建的实时多人对战游戏</p>
      </div>

      <!-- 功能特色 -->
      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div class="card card-body text-center">
          <div class="text-4xl mb-4">🎮</div>
          <h3 class="text-lg font-semibold mb-2">实时对战</h3>
          <p class="text-gray-600 dark:text-gray-400">与好友实时对战，体验紧张刺激的合成大西瓜</p>
        </div>

        <div class="card card-body text-center">
          <div class="text-4xl mb-4">👥</div>
          <h3 class="text-lg font-semibold mb-2">多人房间</h3>
          <p class="text-gray-600 dark:text-gray-400">创建或加入房间，支持密码保护和多种游戏模式</p>
        </div>

        <div class="card card-body text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-lg font-semibold mb-2">数据统计</h3>
          <p class="text-gray-600 dark:text-gray-400">记录游戏数据，查看胜率和最高分排行榜</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="space-y-4">
        <div v-if="!authStore.isLoggedIn" class="space-x-4">
          <NuxtLink to="/auth/login" class="btn btn-primary btn-lg"> 立即登录 </NuxtLink>
          <NuxtLink to="/auth/register" class="btn btn-outline btn-lg"> 注册账号 </NuxtLink>
        </div>

        <div v-else class="space-x-4">
          <NuxtLink to="/game" class="btn btn-primary btn-lg"> 开始游戏 </NuxtLink>
          <NuxtLink to="/profile" class="btn btn-outline btn-lg"> 个人中心 </NuxtLink>
        </div>

        <div class="mt-8">
          <NuxtLink to="/game/single" class="btn btn-secondary"> 单人模式 </NuxtLink>
        </div>
      </div>

      <!-- 用户统计（已登录时显示） -->
      <div v-if="authStore.isLoggedIn && authStore.user" class="mt-12">
        <div class="card card-body">
          <h3 class="text-lg font-semibold mb-4">欢迎回来，{{ authStore.user.username }}！</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-primary-600">{{ authStore.user.gamesPlayed }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">总游戏数</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{{ authStore.winRate }}%</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">胜率</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600">{{ authStore.user.bestScore }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">最高分</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-600">{{ authStore.averageScore }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">平均分</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 游戏说明 -->
      <div class="mt-12 text-left">
        <div class="card card-body">
          <h3 class="text-lg font-semibold mb-4">游戏说明</h3>
          <div class="space-y-2 text-gray-600 dark:text-gray-400">
            <p>• 点击屏幕放置水果，相同水果碰撞会合成更大的水果</p>
            <p>• 从樱桃开始，最终目标是合成大西瓜</p>
            <p>• 联机模式支持限定时间和限定次数两种游戏模式</p>
            <p>• 水果超过红线游戏结束，分数高者获胜</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面元信息
definePageMeta({
  layout: 'default',
})

// 使用状态管理
const authStore = useAuthStore()

// 页面标题
useHead({
  title: '合成大西瓜 - 联机对战版',
})
</script>

<style scoped lang="postcss">
.btn-lg {
  @apply px-8 py-3 text-lg;
}
</style>

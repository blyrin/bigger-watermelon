// 游客中间件 - 已登录用户不能访问（如登录、注册页面）
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // 如果用户已登录，重定向到游戏页面
  if (authStore.isLoggedIn) {
    return navigateTo('/game')
  }
})

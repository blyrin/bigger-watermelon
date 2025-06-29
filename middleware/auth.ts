// 认证中间件 - 需要登录才能访问
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // 如果用户未登录，重定向到登录页面
  if (!authStore.isLoggedIn) {
    return navigateTo('/auth/login')
  }
})

import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  username: string
  avatar?: string
  createdAt: string
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  bestScore: number
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isLoggedIn: false,
    isLoading: false,
  }),

  getters: {
    winRate: (state): number => {
      if (!state.user || state.user.gamesPlayed === 0) return 0
      return Math.round((state.user.gamesWon / state.user.gamesPlayed) * 100)
    },

    averageScore: (state): number => {
      if (!state.user || state.user.gamesPlayed === 0) return 0
      return Math.round(state.user.totalScore / state.user.gamesPlayed)
    },
  },

  actions: {
    async login(email: string, password: string) {
      this.isLoading = true

      try {
        const data = await $fetch<{ success: boolean; message: string; user: User; token: string }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        })

        this.user = data.user
        this.token = data.token
        this.isLoggedIn = true

        // 跳转到游戏页面
        await navigateTo('/game')

        return { success: true, message: data.message }
      } catch (error: any) {
        console.error('登录失败:', error)
        return {
          success: false,
          message: error.data?.message || '登录失败，请重试',
        }
      } finally {
        this.isLoading = false
      }
    },

    async register(email: string, username: string, password: string) {
      this.isLoading = true

      try {
        const data = await $fetch<{ success: boolean; message: string; user: User; token: string }>(
          '/api/auth/register',
          {
            method: 'POST',
            body: { email, username, password },
          }
        )

        this.user = data.user
        this.token = data.token
        this.isLoggedIn = true

        // 跳转到游戏页面
        await navigateTo('/game')

        return { success: true, message: data.message }
      } catch (error: any) {
        console.error('注册失败:', error)
        return {
          success: false,
          message: error.data?.message || '注册失败，请重试',
        }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.isLoading = true

      try {
        await $fetch('/api/auth/logout', {
          method: 'POST',
        })

        this.user = null
        this.token = null
        this.isLoggedIn = false

        // 跳转到首页
        await navigateTo('/')

        return { success: true, message: '退出登录成功' }
      } catch (error: any) {
        console.error('退出登录失败:', error)

        // 即使请求失败也要清除本地状态
        this.user = null
        this.isLoggedIn = false
        await navigateTo('/')

        return { success: true, message: '退出登录成功' }
      } finally {
        this.isLoading = false
      }
    },

    async fetchUser() {
      this.isLoading = true

      try {
        const data = await $fetch<{ success: boolean; user: User }>('/api/auth/me')

        this.user = data.user
        this.isLoggedIn = true

        return { success: true }
      } catch (error: any) {
        console.error('获取用户信息失败:', error)

        this.user = null
        this.isLoggedIn = false

        return { success: false }
      } finally {
        this.isLoading = false
      }
    },

    async updateUserStats(stats: Partial<Pick<User, 'gamesPlayed' | 'gamesWon' | 'totalScore' | 'bestScore'>>) {
      if (!this.user) return

      // 乐观更新
      this.user = {
        ...this.user,
        ...stats,
      }

      // TODO: 发送到服务器更新
    },

    // 检查是否需要登录
    requireAuth() {
      if (!this.isLoggedIn) {
        throw createError({
          statusCode: 401,
          statusMessage: '请先登录',
        })
      }
    },
  },
})

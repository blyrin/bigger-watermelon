// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-06-29',

  // CSS框架
  css: ['~/assets/css/main.css'],
  // 模块
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxtjs/color-mode', '@vueuse/nuxt'],

  // 运行时配置
  runtimeConfig: {
    // 私有配置（仅服务端可用）
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    dbUrl: process.env.DATABASE_URL || 'sqlite:./database.db',
    // 公共配置（客户端也可用）
    public: {
      apiBase: process.env.API_BASE || '/api',
      wsUrl: process.env.WS_URL || 'ws://localhost:3000',
    },
  },

  // 服务端API
  nitro: {
    experimental: {
      wasm: true,
    },
    plugins: ['~/server/plugins/websocket-server.ts'],
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  // 构建配置
  build: {
    transpile: ['@headlessui/vue'],
  },

  // Vite配置
  vite: {
    define: {
      global: 'globalThis',
    },
  },

  // 应用配置
  app: {
    head: {
      title: '合成大西瓜 - 联机对战版',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '基于Nuxt3的合成大西瓜联机对战游戏' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  // 开发服务器配置
  devServer: {
    port: 3000,
  },

  // TypeScript配置
  typescript: {
    strict: true,
    typeCheck: false, // 暂时禁用类型检查
  },
})

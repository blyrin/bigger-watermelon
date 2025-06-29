// 全局类型声明

export interface NotificationOptions {
  title: string
  message?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

// 游戏房间相关类型
export interface GameRoom {
  id: string
  name: string
  hasPassword: boolean
  playerCount: number
  maxPlayers: number
  gameState: 'waiting' | 'playing' | 'finished'
  gameMode?: {
    type: 'moves' | 'time'
    limit: number
  }
  players?: Array<{
    id: string
    name: string
    ready: boolean
    score: number
    moves: number
  }>
}

declare global {
  interface Window {
    $notify?: (options: NotificationOptions) => void
  }
}

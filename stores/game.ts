import { defineStore } from 'pinia'

interface GameRoom {
  id: string
  name: string
  hasPassword: boolean
  playerCount: number
  maxPlayers: number
  gameState: 'waiting' | 'playing' | 'finished'
  gameMode: {
    type: 'moves' | 'time'
    limit: number
  } | null
  players: Array<{
    id: string
    name: string
    ready: boolean
    score: number
    moves: number
  }>
}

interface GameState {
  // WebSocket连接
  ws: WebSocket | null
  connectionStatus: 'disconnected' | 'connecting' | 'connected'

  // 房间管理
  rooms: GameRoom[]
  currentRoom: GameRoom | null

  // 游戏状态
  isInGame: boolean
  gameMode: { type: 'moves' | 'time'; limit: number } | null
  myScore: number
  myMoves: number
  opponentScore: number
  opponentMoves: number

  // 游戏引擎
  myGameEngine: any
  opponentGameEngine: any

  // 状态更新节流
  lastStateUpdateTime: number
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    ws: null,
    connectionStatus: 'disconnected',
    rooms: [],
    currentRoom: null,
    isInGame: false,
    gameMode: null,
    myScore: 0,
    myMoves: 0,
    opponentScore: 0,
    opponentMoves: 0,
    myGameEngine: null,
    opponentGameEngine: null,
    lastStateUpdateTime: 0,
  }),

  getters: {
    isConnected: (state) => state.connectionStatus === 'connected',
    isInRoom: (state) => !!state.currentRoom,
    canStartGame: (state) => {
      if (!state.currentRoom) return false
      return state.currentRoom.players.length >= 2 && state.currentRoom.players.every((p) => p.ready)
    },
  },

  actions: {
    // WebSocket连接管理
    initWebSocket() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) {
        console.error('需要登录才能连接WebSocket')
        return
      }

      this.connectionStatus = 'connecting'

      try {
        const wsUrl = `ws://localhost:3002`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket连接成功')
          this.connectionStatus = 'connected'
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('解析WebSocket消息失败:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket连接关闭')
          this.connectionStatus = 'disconnected'
          // 尝试重连
          setTimeout(() => this.initWebSocket(), 3000)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          this.connectionStatus = 'disconnected'
        }
      } catch (error) {
        console.error('WebSocket初始化失败:', error)
        this.connectionStatus = 'disconnected'
      }
    },

    handleMessage(message: any) {
      console.log('收到消息:', message)

      switch (message.type) {
        case 'rooms_list':
          this.rooms = message.rooms
          break

        case 'room_joined':
          this.currentRoom = message.room
          break

        case 'room_update':
          this.currentRoom = message.room
          break

        case 'game_start':
          this.isInGame = true
          this.gameMode = message.gameMode
          // 游戏引擎将在房间页面中初始化
          break

        case 'opponent_game_state':
          this.opponentScore = message.score
          this.opponentMoves = message.moves
          this.updateOpponentGameState(message.gameState)
          console.log('收到对手游戏状态更新:', {
            score: message.score,
            moves: message.moves,
            fruitsCount: message.gameState?.fruits?.length || 0
          })
          break

        case 'opponent_fruit_drop':
          console.log('收到对手水果放置事件:', {
            x: message.x,
            fruitType: message.fruitType,
            timestamp: message.timestamp,
            playerId: message.playerId
          })
          // 在对手游戏引擎中放置水果
          this.handleOpponentFruitDrop(message)
          break

        case 'game_end':
          this.handleGameEnd(message)
          break

        case 'error':
          console.error('服务器错误:', message.message)
          break
      }
    },

    sendMessage(message: any) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('发送WebSocket消息:', message)
        this.ws.send(JSON.stringify(message))
      } else {
        console.error('WebSocket未连接，无法发送消息:', message)
      }
    },

    disconnect() {
      if (this.ws) {
        this.ws.close()
        this.ws = null
        this.connectionStatus = 'disconnected'
      }
    },

    // 房间管理
    async fetchRooms() {
      this.sendMessage({ type: 'get_rooms' })
    },

    async createRoom(name: string, password?: string) {
      const authStore = useAuthStore()
      authStore.requireAuth()

      this.sendMessage({
        type: 'create_room',
        name,
        password,
        playerName: authStore.user?.username,
      })
    },

    async joinRoom(roomId: string, password?: string) {
      const authStore = useAuthStore()
      authStore.requireAuth()

      this.sendMessage({
        type: 'join_room',
        roomId,
        password,
        playerName: authStore.user?.username,
      })
    },

    async leaveRoom() {
      this.sendMessage({ type: 'leave_room' })
      this.currentRoom = null
      this.isInGame = false
    },

    async toggleReady() {
      this.sendMessage({ type: 'toggle_ready' })
    },

    async startGame(gameMode: { type: 'moves' | 'time'; limit: number }) {
      this.sendMessage({
        type: 'start_game',
        gameMode,
      })
    },

    // 游戏逻辑
    async initGameEngines() {
      console.log('开始初始化游戏引擎...')

      // 动态导入游戏引擎
      const { useGameEngine } = await import('@/composables/useGameEngine')

      // 初始化我的游戏引擎
      this.myGameEngine = useGameEngine({
        displayWidth: 400,
        displayHeight: 600,
        enableSound: true,
      })

      // 初始化对手的游戏引擎
      this.opponentGameEngine = useGameEngine({
        displayWidth: 400,
        displayHeight: 600,
        enableSound: false, // 对手游戏静音
      })

      console.log('游戏引擎初始化完成:', {
        myGameEngine: !!this.myGameEngine,
        opponentGameEngine: !!this.opponentGameEngine
      })
    },

    updateOpponentGameState(gameState: any) {
      if (!gameState) {
        console.warn('收到空的游戏状态')
        return
      }

      this.opponentScore = gameState.score || 0

      if (this.opponentGameEngine && this.opponentGameEngine.setGameState) {
        console.log('更新对手游戏状态:', {
          fruitsCount: gameState.fruits?.length || 0,
          score: gameState.score,
          gameOver: gameState.gameOver
        })

        // 设置游戏状态
        this.opponentGameEngine.setGameState(gameState)
      } else {
        console.warn('对手游戏引擎未初始化或缺少setGameState方法')
      }
    },

    // 处理对手水果放置事件
    handleOpponentFruitDrop(message: any) {
      if (!this.opponentGameEngine) {
        console.warn('对手游戏引擎未初始化')
        return
      }

      console.log('在对手游戏引擎中放置水果:', {
        x: message.x,
        fruitType: message.fruitType
      })

      // 在对手游戏引擎中的指定位置放置指定类型的水果
      this.opponentGameEngine.dropFruitAt(message.x, message.fruitType)
    },

    sendGameStateUpdate(forceUpdate = false) {
      if (!this.myGameEngine) {
        console.log('无法发送游戏状态更新：myGameEngine 未初始化')
        return
      }

      // 节流：限制更新频率为每100ms一次，除非强制更新
      const now = Date.now()
      if (!forceUpdate && now - this.lastStateUpdateTime < 100) {
        return
      }
      this.lastStateUpdateTime = now

      const gameState = this.myGameEngine.getGameState()
      console.log('发送游戏状态更新:', gameState)

      this.sendMessage({
        type: 'game_state_update',
        score: this.myScore,
        moves: this.myMoves,
        gameState,
        timestamp: now,
      })
    },

    sendPlayerMove(move: any) {
      this.myMoves++
      this.sendMessage({
        type: 'player_move',
        move,
      })
    },

    // 发送水果放置事件
    sendFruitDrop(dropData: { x: number; fruitType: number; timestamp: number }) {
      console.log('Store发送水果放置事件:', dropData)
      const message = {
        type: 'fruit_drop',
        ...dropData,
        playerId: this.getCurrentPlayerId(),
      }
      console.log('准备发送的消息:', message)
      this.sendMessage(message)
    },

    // 获取当前玩家ID
    getCurrentPlayerId() {
      const authStore = useAuthStore()
      return authStore.user?.id || null
    },

    handleGameEnd(data: any) {
      const authStore = useAuthStore()
      const isWinner = data.playerId === authStore.user?.id

      this.isInGame = false

      // 更新用户统计
      if (authStore.user) {
        authStore.updateUserStats({
          gamesPlayed: authStore.user.gamesPlayed + 1,
          gamesWon: authStore.user.gamesWon + (isWinner ? 1 : 0),
          totalScore: authStore.user.totalScore + this.myScore,
          bestScore: Math.max(authStore.user.bestScore, this.myScore),
        })
      }

      // 显示游戏结果
      // TODO: 实现游戏结果弹窗
    },

    // 重置游戏状态
    resetGame() {
      this.isInGame = false
      this.gameMode = null
      this.myScore = 0
      this.myMoves = 0
      this.opponentScore = 0
      this.opponentMoves = 0
      this.myGameEngine = null
      this.opponentGameEngine = null
      this.lastStateUpdateTime = 0
    },
  },
})

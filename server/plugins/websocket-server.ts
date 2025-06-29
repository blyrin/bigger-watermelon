import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface GameRoom {
  id: string
  name: string
  hasPassword: boolean
  password?: string
  maxPlayers: number
  gameState: 'waiting' | 'playing' | 'finished'
  gameMode: {
    type: 'moves' | 'time'
    limit: number
  } | null
  players: Map<
    string,
    {
      id: string
      name: string
      ready: boolean
      score: number
      moves: number
      ws: any
    }
  >
  createdAt: Date
}

class GameRoomManager {
  private rooms = new Map<string, GameRoom>()
  private userConnections = new Map<string, any>()

  createRoom(id: string, name: string, password?: string): GameRoom {
    const room: GameRoom = {
      id,
      name,
      hasPassword: !!password,
      password,
      maxPlayers: 2,
      gameState: 'waiting',
      gameMode: null,
      players: new Map(),
      createdAt: new Date(),
    }

    this.rooms.set(id, room)
    return room
  }

  getRoom(id: string): GameRoom | undefined {
    return this.rooms.get(id)
  }

  getRoomForClient(id: string): any | undefined {
    const room = this.rooms.get(id)
    if (!room) return undefined

    return {
      id: room.id,
      name: room.name,
      hasPassword: room.hasPassword,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      gameState: room.gameState,
      gameMode: room.gameMode,
      players: Array.from(room.players.values()).map((player) => ({
        id: player.id,
        name: player.name,
        ready: player.ready,
        score: player.score,
        moves: player.moves,
      })),
    }
  }

  getRooms(): any[] {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      hasPassword: room.hasPassword,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      gameState: room.gameState,
      gameMode: room.gameMode,
      players: Array.from(room.players.values()).map((player) => ({
        id: player.id,
        name: player.name,
        ready: player.ready,
        score: player.score,
        moves: player.moves,
      })),
    }))
  }

  addPlayerToRoom(roomId: string, userId: string, username: string, ws: any): boolean {
    const room = this.rooms.get(roomId)
    if (!room) {
      return false
    }

    // 如果房间已满且玩家不在房间中，拒绝加入
    if (room.players.size >= room.maxPlayers && !room.players.has(userId)) {
      return false
    }

    // 如果玩家已经在房间中（重新连接），更新WebSocket连接
    if (room.players.has(userId)) {
      const existingPlayer = room.players.get(userId)!
      existingPlayer.ws = ws
      console.log(`玩家 ${username} 重新连接到房间 ${roomId}`)
    } else {
      // 新玩家加入
      room.players.set(userId, {
        id: userId,
        name: username,
        ready: false,
        score: 0,
        moves: 0,
        ws,
      })
      console.log(`玩家 ${username} 加入房间 ${roomId}`)
    }

    return true
  }

  removePlayerFromRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.delete(playerId)

    // 只有在游戏未开始时才删除空房间
    // 游戏进行中的房间应该保持存在，以便玩家重新连接
    if (room.players.size === 0 && room.gameState !== 'playing') {
      console.log(`删除空房间: ${roomId}`)
      this.rooms.delete(roomId)
    } else if (room.players.size === 0 && room.gameState === 'playing') {
      console.log(`游戏中的房间 ${roomId} 暂时为空，保持房间存在`)
    }
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.get(playerId)
    if (player) {
      player.ready = ready
    }
  }

  canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.players.size < 2) return false

    return Array.from(room.players.values()).every((player) => player.ready)
  }

  startGame(roomId: string, gameMode: { type: 'moves' | 'time'; limit: number }): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.gameState = 'playing'
    room.gameMode = gameMode
  }

  broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.forEach((player, playerId) => {
      if (playerId !== excludeUserId && player.ws.readyState === 1) {
        console.log(`广播消息到房间 ${roomId} 的玩家 ${player.name}`)
        player.ws.send(JSON.stringify(message))
      }
    })
  }

  broadcastToAll(message: any): void {
    this.userConnections.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(message))
      }
    })
  }

  // 公共方法来访问私有属性
  setUserConnection(userId: string, ws: any): void {
    this.userConnections.set(userId, ws)
  }

  removeUserConnection(userId: string): void {
    this.userConnections.delete(userId)
  }

  getAllRooms(): Map<string, GameRoom> {
    return this.rooms
  }
}

const roomManager = new GameRoomManager()

export default async () => {
  const config = useRuntimeConfig()

  // Create WebSocket server on port 3002
  const wss = new WebSocketServer({
    port: 3002,
    verifyClient: async (info: { req: any }) => {
      try {
        // 从cookie中获取token
        const cookies = info.req.headers.cookie
        if (!cookies) return false

        const cookieMap = new Map()
        cookies.split(';').forEach((cookie: string) => {
          const [name, value] = cookie.trim().split('=')
          if (name && value) {
            cookieMap.set(name, decodeURIComponent(value))
          }
        })

        const token = cookieMap.get('auth-token')
        if (!token) return false

        const decoded = jwt.verify(token, config.jwtSecret) as any

        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        })

        if (!user) return false

        // Store user info for later use
        info.req.userId = user.id
        info.req.username = user.username

        return true
      } catch (error) {
        console.error('WebSocket认证失败:', error)
        return false
      }
    },
  })

  wss.on('connection', async (ws, req) => {
    // 重新解析cookie获取用户信息
    let userId: string | undefined
    let username: string | undefined

    try {
      const cookies = req.headers.cookie
      if (cookies) {
        const cookieMap = new Map()
        cookies.split(';').forEach((cookie: string) => {
          const [name, value] = cookie.trim().split('=')
          if (name && value) {
            cookieMap.set(name, decodeURIComponent(value))
          }
        })

        const token = cookieMap.get('auth-token')
        if (token) {
          const decoded = jwt.verify(token, config.jwtSecret) as any
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
          })
          if (user) {
            userId = user.id
            username = user.username
          }
        }
      }
    } catch (error) {
      console.error('连接时解析用户信息失败:', error)
    }

    console.log(`用户 ${username} (${userId}) 连接到WebSocket`)

    if (!userId || !username) {
      console.error('无法获取用户信息，关闭连接')
      ws.close()
      return
    }

    // Store connection
    roomManager.setUserConnection(userId, ws)

    // Send initial room list
    ws.send(
      JSON.stringify({
        type: 'rooms_list',
        rooms: roomManager.getRooms(),
      })
    )

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        console.log(`收到来自用户 ${username} 的消息:`, message.type, message)

        switch (message.type) {
          case 'get_rooms':
            ws.send(
              JSON.stringify({
                type: 'rooms_list',
                rooms: roomManager.getRooms(),
              })
            )
            break

          case 'create_room':
            try {
              const dbRoom = await prisma.gameRoom.create({
                data: {
                  name: message.name,
                  password: message.password,
                  gameMode: message.gameMode?.type || 'moves',
                  gameLimit: message.gameMode?.limit || 50,
                },
              })

              const room = roomManager.createRoom(dbRoom.id, message.name, message.password)

              if (roomManager.addPlayerToRoom(room.id, userId, username, ws)) {
                ws.send(
                  JSON.stringify({
                    type: 'room_joined',
                    room: roomManager.getRoomForClient(room.id),
                  })
                )

                roomManager.broadcastToAll({
                  type: 'rooms_list',
                  rooms: roomManager.getRooms(),
                })
              }
            } catch (error) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: '创建房间失败',
                })
              )
            }
            break

          case 'join_room':
            const room = roomManager.getRoom(message.roomId)
            if (!room) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: '房间不存在',
                })
              )
              break
            }

            if (room.hasPassword && room.password !== message.password) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: '房间密码错误',
                })
              )
              break
            }

            if (roomManager.addPlayerToRoom(message.roomId, userId, username, ws)) {
              ws.send(
                JSON.stringify({
                  type: 'room_joined',
                  room: roomManager.getRoomForClient(message.roomId),
                })
              )

              roomManager.broadcastToRoom(
                message.roomId,
                {
                  type: 'room_update',
                  room: roomManager.getRoomForClient(message.roomId),
                },
                userId
              )

              roomManager.broadcastToAll({
                type: 'rooms_list',
                rooms: roomManager.getRooms(),
              })
            } else {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: '无法加入房间',
                })
              )
            }
            break

          case 'leave_room':
            // Find user's current room
            let currentRoomId = null
            for (const [roomId, room] of roomManager.getAllRooms()) {
              if (room.players.has(userId)) {
                currentRoomId = roomId
                break
              }
            }

            if (currentRoomId) {
              roomManager.removePlayerFromRoom(currentRoomId, userId)

              roomManager.broadcastToRoom(currentRoomId, {
                type: 'room_update',
                room: roomManager.getRoomForClient(currentRoomId),
              })

              roomManager.broadcastToAll({
                type: 'rooms_list',
                rooms: roomManager.getRooms(),
              })
            }
            break

          case 'toggle_ready':
            // Find user's current room
            let userRoomId = null
            for (const [roomId, room] of roomManager.getAllRooms()) {
              if (room.players.has(userId)) {
                userRoomId = roomId
                break
              }
            }

            if (userRoomId) {
              const room = roomManager.getRoom(userRoomId)
              const player = room?.players.get(userId)

              if (player) {
                roomManager.setPlayerReady(userRoomId, userId, !player.ready)

                roomManager.broadcastToRoom(userRoomId, {
                  type: 'room_update',
                  room: roomManager.getRoomForClient(userRoomId),
                })

                if (roomManager.canStartGame(userRoomId)) {
                  const gameMode = room?.gameMode || { type: 'moves', limit: 50 }
                  roomManager.startGame(userRoomId, gameMode)

                  roomManager.broadcastToRoom(userRoomId, {
                    type: 'game_start',
                    gameMode,
                    room: roomManager.getRoomForClient(userRoomId),
                  })
                }
              }
            }
            break

          case 'game_state_update':
            // Find user's current room and broadcast to other players
            let gameRoomId = null
            for (const [roomId, room] of roomManager.getAllRooms()) {
              if (room.players.has(userId)) {
                gameRoomId = roomId
                break
              }
            }

            if (gameRoomId) {
              roomManager.broadcastToRoom(
                gameRoomId,
                {
                  type: 'opponent_game_state',
                  playerId: userId,
                  playerName: username,
                  score: message.score,
                  moves: message.moves,
                  gameState: message.gameState,
                },
                userId
              )
            }
            break

          case 'fruit_drop':
            // Find user's current room and broadcast fruit drop event
            let fruitDropRoomId = null
            for (const [roomId, room] of roomManager.getAllRooms()) {
              if (room.players.has(userId)) {
                fruitDropRoomId = roomId
                break
              }
            }
            if (fruitDropRoomId) {
              roomManager.broadcastToRoom(
                fruitDropRoomId,
                {
                  type: 'opponent_fruit_drop',
                  playerId: userId,
                  playerName: username,
                  x: message.x,
                  fruitType: message.fruitType,
                  timestamp: message.timestamp,
                },
                userId
              )
            }
            break
        }
      } catch (error) {
        console.error('WebSocket消息处理错误:', error)
        ws.send(
          JSON.stringify({
            type: 'error',
            message: '消息处理失败',
          })
        )
      }
    })

    ws.on('close', () => {
      console.log(`用户 ${username} 断开连接`)
      // Remove from all rooms
      for (const [roomId, room] of roomManager.getAllRooms()) {
        if (room.players.has(userId)) {
          roomManager.removePlayerFromRoom(roomId, userId)

          roomManager.broadcastToRoom(roomId, {
            type: 'room_update',
            room: roomManager.getRoomForClient(roomId),
          })
        }
      }

      roomManager.removeUserConnection(userId)

      roomManager.broadcastToAll({
        type: 'rooms_list',
        rooms: roomManager.getRooms(),
      })
    })
  })

  console.log('WebSocket服务器已启动在端口3002')
}

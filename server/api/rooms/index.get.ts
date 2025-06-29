import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 获取所有活跃的游戏房间
    const rooms = await prisma.gameRoom.findMany({
      where: {
        status: {
          in: ['waiting', 'playing'],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 转换数据格式
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      hasPassword: !!room.password,
      playerCount: room.members.length,
      maxPlayers: room.maxPlayers,
      gameState: room.status,
      gameMode: {
        type: room.gameMode,
        limit: room.gameLimit,
      },
      players: room.members.map((member) => ({
        id: member.user.id,
        name: member.user.username,
        ready: member.isReady,
        score: 0, // 游戏开始前分数为0
        moves: 0, // 游戏开始前移动次数为0
      })),
      createdAt: room.createdAt,
    }))

    return {
      success: true,
      rooms: formattedRooms,
    }
  } catch (error) {
    console.error('获取房间列表失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '获取房间列表失败',
    })
  } finally {
    await prisma.$disconnect()
  }
})

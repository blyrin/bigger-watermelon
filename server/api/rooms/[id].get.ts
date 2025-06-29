import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const roomId = getRouterParam(event, 'id')

    if (!roomId) {
      throw createError({
        statusCode: 400,
        statusMessage: '房间ID不能为空',
      })
    }

    // 获取房间详情
    const room = await prisma.gameRoom.findUnique({
      where: { id: roomId },
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
    })

    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: '房间不存在',
      })
    }

    // 转换数据格式
    const formattedRoom = {
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
    }

    return {
      success: true,
      room: formattedRoom,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('获取房间详情失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '获取房间详情失败',
    })
  } finally {
    await prisma.$disconnect()
  }
})

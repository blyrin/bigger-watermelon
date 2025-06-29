import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 获取token
    const token = getCookie(event, 'auth-token')

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登录',
      })
    }

    // 验证token
    const config = useRuntimeConfig()
    let decoded: any

    try {
      decoded = jwt.verify(token, config.jwtSecret)
    } catch (jwtError) {
      // token无效，清除cookie
      deleteCookie(event, 'auth-token')
      throw createError({
        statusCode: 401,
        statusMessage: 'Token无效',
      })
    }

    // 检查会话是否存在且未过期
    const session = await prisma.gameSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
            createdAt: true,
            gamesPlayed: true,
            gamesWon: true,
            totalScore: true,
            bestScore: true,
          },
        },
      },
    })

    if (!session || session.expiresAt < new Date()) {
      // 会话不存在或已过期
      if (session) {
        await prisma.gameSession.delete({
          where: { id: session.id },
        })
      }

      deleteCookie(event, 'auth-token')
      throw createError({
        statusCode: 401,
        statusMessage: '会话已过期',
      })
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        gamesPlayed: true,
        gamesWon: true,
        totalScore: true,
        bestScore: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户不存在',
      })
    }

    return {
      success: true,
      user,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('获取用户信息错误:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误',
    })
  } finally {
    await prisma.$disconnect()
  }
})

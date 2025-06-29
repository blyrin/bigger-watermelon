import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 验证输入数据
    const { email, password } = loginSchema.parse(body)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
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
        statusMessage: '邮箱或密码错误',
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: '邮箱或密码错误',
      })
    }

    // 生成JWT token
    const config = useRuntimeConfig()
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    // 清理过期的会话
    await prisma.gameSession.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    // 创建新会话记录
    await prisma.gameSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
      },
    })

    // 设置HTTP-only cookie
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
    })

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user

    return {
      success: true,
      message: '登录成功',
      user: userWithoutPassword,
      token,
    }
  } catch (error: any) {
    if (error.issues) {
      // Zod验证错误
      throw createError({
        statusCode: 400,
        statusMessage: error.issues[0].message,
      })
    }

    if (error.statusCode) {
      // 已知错误
      throw error
    }

    // 未知错误
    console.error('登录错误:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误',
    })
  } finally {
    await prisma.$disconnect()
  }
})

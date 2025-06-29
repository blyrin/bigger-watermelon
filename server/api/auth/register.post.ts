import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码最多100个字符'),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 验证输入数据
    const { email, username, password } = registerSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUserByEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: '该邮箱已被注册',
      })
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUserByUsername) {
      throw createError({
        statusCode: 400,
        statusMessage: '该用户名已被使用',
      })
    }

    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
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

    // 创建会话记录
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

    return {
      success: true,
      message: '注册成功',
      user,
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
    console.error('注册错误:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误',
    })
  } finally {
    await prisma.$disconnect()
  }
})

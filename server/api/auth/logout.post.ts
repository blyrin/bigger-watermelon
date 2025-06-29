import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 获取token
    const token = getCookie(event, 'auth-token')

    if (token) {
      // 删除会话记录
      await prisma.gameSession.deleteMany({
        where: { token },
      })
    }

    // 清除cookie
    deleteCookie(event, 'auth-token')

    return {
      success: true,
      message: '退出登录成功',
    }
  } catch (error) {
    console.error('退出登录错误:', error)

    // 即使出错也要清除cookie
    deleteCookie(event, 'auth-token')

    return {
      success: true,
      message: '退出登录成功',
    }
  } finally {
    await prisma.$disconnect()
  }
})

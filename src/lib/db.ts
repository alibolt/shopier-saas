import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Mock Prisma client if DATABASE_URL is not set
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, using mock Prisma client')
    // Return a mock object that won't crash the app
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return new Proxy(() => {}, {
            get: () => {
              return async () => {
                console.warn(`Mock Prisma call: ${prop}`)
                return null
              }
            },
            apply: () => {
              return async () => {
                console.warn(`Mock Prisma call: ${prop}`)
                return null
              }
            }
          })
        }
        return target[prop as keyof PrismaClient]
      }
    })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
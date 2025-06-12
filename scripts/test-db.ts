import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing database connection...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Count users
    const userCount = await prisma.user.count()
    console.log(`Total users: ${userCount}`)
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })
    
    console.log('\nUsers in database:')
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Created: ${user.createdAt.toLocaleDateString()}`)
    })
    
    // Count stores
    const storeCount = await prisma.store.count()
    console.log(`\nTotal stores: ${storeCount}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
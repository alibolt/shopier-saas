import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'test@example.com'
  const password = 'test123'
  
  // Check if test user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    console.log('Test user already exists')
    console.log('Email:', email)
    console.log('Password:', password)
    return
  }
  
  // Create test user
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: hashedPassword,
      emailVerified: new Date(), // Already verified
      role: 'MERCHANT',
    }
  })
  
  console.log('Test user created successfully!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('User ID:', user.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
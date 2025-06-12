import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  const password = 'admin123'
  
  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  })
  
  if (existingAdmin) {
    console.log('Admin user already exists')
    return
  }
  
  // Create admin user
  const hashedPassword = await bcrypt.hash(password, 10)
  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    }
  })
  
  console.log('Admin user created:', admin.email)
  console.log('Password:', password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  
  console.log('Testing password reset flow...')
  
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  // Delete any existing tokens
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  })
  
  // Create a reset token
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    }
  })
  
  console.log('Password reset token created!')
  console.log(`Reset URL: http://localhost:3000/auth/reset-password?token=${token}`)
  console.log('Token expires at:', expires.toLocaleString())
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
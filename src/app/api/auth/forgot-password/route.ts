import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { randomBytes } from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, we've sent a reset link",
      })
    }
    
    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })
    
    // Generate reset token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })
    
    // Send reset email
    await sendPasswordResetEmail(email, token)
    
    return NextResponse.json({
      success: true,
      message: "If an account exists, we've sent a reset link",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }
    
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = resetPasswordSchema.parse(body)
    
    // Find the reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    })
    
    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      )
    }
    
    // Check if token is expired
    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      )
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Update user's password
    await prisma.user.update({
      where: { email: resetToken.identifier },
      data: { password: hashedPassword },
    })
    
    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    })
    
    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
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
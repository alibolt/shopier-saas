import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const verifySchema = z.object({
  token: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token } = verifySchema.parse(body)
    
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })
    
    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: "Invalid verification token" },
        { status: 400 }
      )
    }
    
    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      })
      
      return NextResponse.json(
        { success: false, error: "Verification token has expired" },
        { status: 400 }
      )
    }
    
    // Update user's email verification status
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    })
    
    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    })
    
    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      )
    }
    
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
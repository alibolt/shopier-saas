import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { prisma } from "@/lib/db"

const createStoreSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = createStoreSchema.parse(body)

    // Check if user already has a store
    const existingUserStore = await prisma.store.findUnique({
      where: { userId: session.user.id }
    })

    if (existingUserStore) {
      return NextResponse.json(
        { error: "You already have a store" },
        { status: 400 }
      )
    }

    // Check if slug is taken
    const existingSlug = await prisma.store.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: "This URL is already taken" },
        { status: 400 }
      )
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ store })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
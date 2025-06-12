import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { prisma } from "@/lib/db"

const createProductSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
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

    // Get user's store
    const store = await prisma.store.findUnique({
      where: { userId: session.user.id }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validatedData = createProductSchema.parse(body)

    // Check if slug is unique within the store
    const existingProduct = await prisma.product.findUnique({
      where: {
        storeId_slug: {
          storeId: store.id,
          slug: validatedData.slug
        }
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product URL already exists in your store" },
        { status: 400 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        storeId: store.id,
        images: [], // Will implement image upload later
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
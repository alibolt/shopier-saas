import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { prisma } from "@/lib/db"

const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

// GET /api/products/[id] - Get single product
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
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

    // Get product
    const product = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/products/[id] - Update product
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
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
    const validatedData = updateProductSchema.parse(body)

    // Check if product exists and belongs to the store
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // If slug is being updated, check uniqueness
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findFirst({
        where: {
          storeId: store.id,
          slug: validatedData.slug,
          NOT: { id }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "Product URL already exists in your store" },
          { status: 400 }
        )
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ product })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Update product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
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

    // Check if product exists and belongs to the store
    const product = await prisma.product.findFirst({
      where: {
        id,
        storeId: store.id
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Check if product has any orders
    const hasOrders = await prisma.orderItem.findFirst({
      where: { productId: id }
    })

    if (hasOrders) {
      // Soft delete - just deactivate
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })
      
      return NextResponse.json({ 
        message: "Product deactivated (has existing orders)",
        deactivated: true 
      })
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: "Product deleted successfully",
      deleted: true 
    })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
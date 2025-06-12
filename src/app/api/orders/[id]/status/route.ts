import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { sendOrderStatusEmail } from "@/lib/email"

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
})

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
    const { status } = updateStatusSchema.parse(body)

    // Check if order exists and belongs to the store
    const order = await prisma.order.findFirst({
      where: {
        id,
        storeId: store.id
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status,
        // Update stock if order is cancelled
        ...(status === 'CANCELLED' && order.status !== 'CANCELLED' ? {
          items: {
            updateMany: {
              where: { orderId: id },
              data: {
                // This is a placeholder - in production, you'd want to properly restore stock
              }
            }
          }
        } : {})
      },
      include: {
        store: true
      }
    })

    // Send status update email
    try {
      await sendOrderStatusEmail(
        updatedOrder.customerEmail,
        updatedOrder.orderNumber,
        updatedOrder.status,
        updatedOrder.store.name
      )
    } catch (emailError) {
      console.error('Failed to send status email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      order: updatedOrder,
      message: `Order status updated to ${status}` 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    console.error("Update order status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
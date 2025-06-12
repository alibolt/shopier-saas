import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe"

const checkoutSchema = z.object({
  storeId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })),
  customer: z.object({
    email: z.string().email(),
    name: z.string(),
    address: z.object({
      line1: z.string(),
      city: z.string(),
      state: z.string(),
      postal_code: z.string(),
      country: z.string(),
    }),
  }),
})

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const validatedData = checkoutSchema.parse(body)

    // Get store with products
    const store = await prisma.store.findUnique({
      where: { id: validatedData.storeId },
      include: {
        products: {
          where: {
            id: { in: validatedData.items.map(item => item.productId) },
            isActive: true,
          },
        },
      },
    })

    if (!store || !store.isActive) {
      return NextResponse.json(
        { error: "Store not found or inactive" },
        { status: 404 }
      )
    }

    if (!store.stripeOnboarded || !store.stripeAccountId) {
      return NextResponse.json(
        { error: "Store is not ready to accept payments" },
        { status: 400 }
      )
    }

    // Validate products and stock
    const lineItems = []
    const orderItems = []
    let subtotal = 0

    for (const item of validatedData.items) {
      const product = store.products.find(p => p.id === item.productId)
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.description,
            images: product.images.length > 0 ? [product.images[0]] : undefined,
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      })

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    // Calculate platform fee
    const platformFeeAmount = Math.round(subtotal * (store.commissionRate / 100))

    // Create pending order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        storeId: store.id,
        customerEmail: validatedData.customer.email,
        customerName: validatedData.customer.name,
        shippingAddress: validatedData.customer.address,
        subtotal,
        platformFee: platformFeeAmount,
        total: subtotal, // Stripe will handle tax calculation
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: orderItems,
        },
      },
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      customer_email: validatedData.customer.email,
      metadata: {
        orderId: order.id,
        storeId: store.id,
      },
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: store.stripeAccountId,
        },
      },
    })

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Checkout session error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
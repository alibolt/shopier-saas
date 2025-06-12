import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import { generateOrderNumber } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const productId = formData.get("productId") as string
    const storeId = formData.get("storeId") as string

    if (!productId || !storeId) {
      return NextResponse.json(
        { error: "Product and store required" },
        { status: 400 }
      )
    }

    // Get product and store details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true }
    })

    if (!product || product.storeId !== storeId) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    if (!product.isActive || product.stock < 1) {
      return NextResponse.json(
        { error: "Product not available" },
        { status: 400 }
      )
    }

    if (!product.store.stripeAccountId || !product.store.stripeOnboarded) {
      return NextResponse.json(
        { error: "Store not ready for payments" },
        { status: 400 }
      )
    }

    // Calculate platform fee (10% by default)
    const platformFeeAmount = Math.round(product.price * (product.store.commissionRate / 100))

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: product.description.substring(0, 500),
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: product.store.stripeAccountId,
        },
      },
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/${product.store.slug}/${product.slug}`,
      metadata: {
        productId: product.id,
        storeId: product.store.id,
      },
    })

    // Create order in database
    await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        storeId: product.store.id,
        email: "", // Will be updated by webhook
        name: "", // Will be updated by webhook
        shippingAddress: {}, // Will be updated by webhook
        stripeSessionId: session.id,
        paymentStatus: "pending",
        subtotal: product.price,
        shipping: 0,
        tax: 0,
        total: product.price,
        platformFee: platformFeeAmount,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            price: product.price,
          }
        }
      }
    })

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
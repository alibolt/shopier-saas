import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    )
  }

  const body = await req.text()
  const signature = (await headers()).get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (!session.metadata?.orderId) {
          console.error("No orderId in session metadata")
          break
        }

        // Update order
        const order = await prisma.order.findUnique({
          where: { id: session.metadata.orderId },
          include: {
            items: {
              include: {
                product: true
              }
            },
            store: true
          }
        })

        if (!order) {
          console.error("Order not found:", session.metadata.orderId)
          break
        }

        // Update order status
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            stripePaymentIntentId: session.payment_intent as string,
            paymentStatus: 'PAID',
          },
        })

        // Update product stock
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }
        
        // Send order confirmation email
        try {
          await sendOrderConfirmationEmail(
            order.customerEmail,
            order.orderNumber,
            order.items.map(item => ({
              title: item.product.title,
              quantity: item.quantity,
              price: item.price
            })),
            order.total,
            order.store.name
          )
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
        }

        break
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account
        
        await prisma.store.update({
          where: { stripeAccountId: account.id },
          data: {
            stripeOnboarded: account.charges_enabled && account.payouts_enabled,
          },
        })
        
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find order by payment intent
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id }
        })

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              status: 'CANCELLED'
            }
          })
        }
        
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
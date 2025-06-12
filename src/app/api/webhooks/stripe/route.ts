import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("Stripe-Signature") as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object
        
        // Update store onboarding status
        await prisma.store.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeOnboarded: account.charges_enabled && account.payouts_enabled
          }
        })
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object
        
        // Update order payment status
        if (session.payment_status === "paid") {
          await prisma.order.updateMany({
            where: { stripeSessionId: session.id },
            data: { 
              paymentStatus: "paid",
              status: "PROCESSING"
            }
          })
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object
        
        // Update order if payment intent is linked
        await prisma.order.updateMany({
          where: { stripePaymentIntent: paymentIntent.id },
          data: { 
            paymentStatus: "paid",
            status: "PROCESSING"
          }
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
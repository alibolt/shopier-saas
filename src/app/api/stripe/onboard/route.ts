import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      )
    }

    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { refresh_url, return_url } = await req.json()

    // Get or create Stripe account for user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { store: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    let accountId = user.store?.stripeAccountId

    if (!accountId) {
      // Create Stripe Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email!,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      accountId = account.id

      // Save account ID to database
      if (user.store) {
        await prisma.store.update({
          where: { id: user.store.id },
          data: { stripeAccountId: accountId }
        })
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url || `${process.env.NEXTAUTH_URL}/dashboard/settings`,
      return_url: return_url || `${process.env.NEXTAUTH_URL}/dashboard/settings`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe onboarding error:', error)
    return NextResponse.json(
      { error: "Failed to create onboarding link" },
      { status: 500 }
    )
  }
}
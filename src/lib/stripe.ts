import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

export const getStripePublishableKey = () => {
  return process.env.STRIPE_PUBLIC_KEY!
}
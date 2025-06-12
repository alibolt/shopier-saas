import Stripe from 'stripe'

// Create stripe instance only if API key exists
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    })
  : null

export const getStripePublishableKey = () => {
  return process.env.STRIPE_PUBLIC_KEY || ''
}
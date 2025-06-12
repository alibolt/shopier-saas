import { CartProvider } from '@/contexts/cart-context'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}
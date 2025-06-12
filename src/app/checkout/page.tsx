"use client"

import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const cart = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  if (cart.items.length === 0) {
    router.push('/')
    return null
  }
  
  const subtotal = cart.getTotalPrice()
  const tax = Math.round(subtotal * 0.08) // 8% tax
  const total = subtotal + tax
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const customerData = {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      address: {
        line1: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        postal_code: formData.get('postal_code') as string,
        country: 'US',
      }
    }
    
    try {
      // Group items by store
      const storeItems = cart.items.reduce((acc, item) => {
        if (!acc[item.storeId]) {
          acc[item.storeId] = []
        }
        acc[item.storeId].push(item)
        return acc
      }, {} as Record<string, typeof cart.items>)
      
      // For now, handle single store checkout
      const storeId = Object.keys(storeItems)[0]
      const items = storeItems[storeId]
      
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customer: customerData,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed')
      }
      
      // Clear cart and redirect to Stripe
      cart.clearCart()
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{cart.getTotalItems()} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex gap-4 py-4 border-b last:border-0">
                      {item.image && (
                        <div className="relative h-20 w-20 overflow-hidden rounded-md bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Customer Information & Payment */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">ZIP Code</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      required
                      disabled={loading}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Order Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </CardContent>
              <CardContent>
                <Button 
                  type="submit" 
                  form="checkout-form"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay with Stripe'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
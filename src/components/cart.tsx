"use client"

import { ShoppingCart, Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { useCart } from '@/contexts/cart-context'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function Cart() {
  const cart = useCart()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const totalItems = cart.getTotalItems()
  const totalPrice = cart.getTotalPrice()

  const handleCheckout = () => {
    if (cart.items.length === 0) return
    
    // Group items by store
    const storeItems = cart.items.reduce((acc, item) => {
      if (!acc[item.storeId]) {
        acc[item.storeId] = []
      }
      acc[item.storeId].push(item)
      return acc
    }, {} as Record<string, typeof cart.items>)
    
    // For now, handle single store checkout
    const storeIds = Object.keys(storeItems)
    if (storeIds.length > 1) {
      alert('Multiple store checkout not yet supported. Please checkout items from one store at a time.')
      return
    }
    
    setIsOpen(false)
    router.push('/checkout')
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 
              ? 'Your cart is empty' 
              : `${totalItems} item${totalItems > 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add items to your cart to checkout
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-4 py-4 border-b">
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
                    <h4 className="font-medium line-clamp-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => cart.removeItem(item.productId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cart.items.length > 0 && (
          <SheetFooter className="border-t pt-6">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
              >
                Checkout
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
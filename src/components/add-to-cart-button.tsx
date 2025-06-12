"use client"

import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'

interface AddToCartButtonProps {
  product: {
    id: string
    title: string
    price: number
    stock: number
    images: string[]
  }
  storeId: string
  disabled?: boolean
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function AddToCartButton({ 
  product, 
  storeId, 
  disabled = false,
  className,
  size = "default"
}: AddToCartButtonProps) {
  const cart = useCart()
  const [added, setAdded] = useState(false)
  const quantity = cart.getItemQuantity(product.id)
  const isMaxQuantity = quantity >= product.stock

  const handleAddToCart = () => {
    if (isMaxQuantity) return
    
    cart.addItem({
      id: `${storeId}-${product.id}`,
      productId: product.id,
      storeId: storeId,
      title: product.title,
      price: product.price,
      image: product.images[0],
      stock: product.stock,
    })
    
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || product.stock === 0 || isMaxQuantity}
      className={className}
      size={size}
      variant={added ? "secondary" : "default"}
    >
      {added ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isMaxQuantity
            ? `Max quantity (${quantity})`
            : quantity > 0
            ? `Add to Cart (${quantity})`
            : "Add to Cart"}
        </>
      )}
    </Button>
  )
}
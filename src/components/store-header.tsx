"use client"

import { Cart } from '@/components/cart'
import Link from 'next/link'

interface StoreHeaderProps {
  storeName: string
  storeSlug: string
  description?: string
}

export function StoreHeader({ storeName, storeSlug, description }: StoreHeaderProps) {
  return (
    <header className="border-b sticky top-0 bg-background z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={`/${storeSlug}`} className="space-y-1">
            <h1 className="text-2xl font-bold">{storeName}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </Link>
          <Cart />
        </div>
      </div>
    </header>
  )
}
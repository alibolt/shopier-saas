"use client"

import { Cart } from '@/components/cart'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface StoreHeaderProps {
  storeName: string
  storeSlug: string
  description?: string
}

export function StoreHeader({ storeName, storeSlug, description }: StoreHeaderProps) {
  const { data: session } = useSession()
  
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
          <div className="flex items-center gap-4">
            {session?.user ? (
              <Link href={`/${storeSlug}/account`}>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href={`/${storeSlug}/account/login`}>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
            <Cart />
          </div>
        </div>
      </div>
    </header>
  )
}
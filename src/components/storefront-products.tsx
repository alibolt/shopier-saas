"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductSearch } from '@/components/product-search'
import { AddToCartButton } from '@/components/add-to-cart-button'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { Product, Category } from '@prisma/client'

interface StorefrontProductsProps {
  storeId: string
  storeSlug: string
  stripeOnboarded: boolean
  initialProducts: (Product & { category: Category | null })[]
  categories: Category[]
}

export function StorefrontProducts({ 
  storeId, 
  storeSlug, 
  stripeOnboarded,
  initialProducts,
  categories 
}: StorefrontProductsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    total: initialProducts.length,
    page: 1,
    limit: 12,
    totalPages: 1,
  })
  const [maxPrice, setMaxPrice] = useState(10000)
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      
      try {
        const params = new URLSearchParams({
          storeId,
          ...Object.fromEntries(searchParams.entries())
        })
        
        const res = await fetch(`/api/products/search?${params}`)
        const data = await res.json()
        
        if (res.ok) {
          setProducts(data.products)
          setPagination(data.pagination)
          setMaxPrice(data.filters.maxPrice)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [searchParams, storeId])
  
  return (
    <div className="space-y-6">
      <ProductSearch 
        categories={categories}
        maxPrice={maxPrice}
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No products found</CardTitle>
            <CardDescription>
              Try adjusting your search or filters
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {products.length} of {pagination.total} products
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="h-full overflow-hidden group">
                <Link href={`/${storeSlug}/${product.slug}`}>
                  {product.images.length > 0 && (
                    <div className="aspect-square relative bg-gray-100 overflow-hidden">
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {product.isFeatured && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-500 text-white">Featured</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                        {product.category && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.category.name}
                          </p>
                        )}
                      </div>
                      <CardDescription className="text-lg font-semibold">
                        {formatPrice(product.price)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {product.description}
                    </p>
                    {product.stock === 0 && (
                      <p className="text-sm text-red-600 mb-2">Out of stock</p>
                    )}
                  </CardContent>
                </Link>
                <CardContent className="pt-0">
                  <AddToCartButton
                    product={product}
                    storeId={storeId}
                    disabled={!stripeOnboarded}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.set('page', String(page))
                    router.push(`?${params.toString()}`)
                  }}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
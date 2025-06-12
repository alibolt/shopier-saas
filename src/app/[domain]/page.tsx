import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { StoreHeader } from "@/components/store-header"
import { AddToCartButton } from "@/components/add-to-cart-button"
import type { Product } from "@prisma/client"

interface StorePageProps {
  params: Promise<{
    domain: string
  }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { domain } = await params
  
  // Demo mode check
  if (!process.env.DATABASE_URL) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Demo Mode</CardTitle>
              <CardDescription>
                Store viewing is disabled in demo mode. Configure database to enable this feature.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }
  
  // Find store by slug or custom domain
  const store = await prisma.store.findFirst({
    where: {
      OR: [
        { slug: domain },
        { domain: domain }
      ],
      isActive: true
    },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!store) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader 
        storeName={store.name} 
        storeSlug={store.slug}
        description={store.description || undefined}
      />

      <main className="container mx-auto px-4 py-8">
        {store.products.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No products available</CardTitle>
              <CardDescription>
                Check back later for new products
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {store.products.map((product: Product) => (
              <Card key={product.id} className="h-full overflow-hidden group">
                <Link href={`/${domain}/${product.slug}`}>
                  {product.images.length > 0 && (
                    <div className="aspect-square relative bg-gray-100 overflow-hidden">
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                    <CardDescription className="text-lg font-semibold">
                      {formatPrice(product.price)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {product.description}
                    </p>
                  </CardContent>
                </Link>
                <CardContent className="pt-0">
                  <AddToCartButton
                    product={product}
                    storeId={store.id}
                    disabled={!store.stripeOnboarded}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
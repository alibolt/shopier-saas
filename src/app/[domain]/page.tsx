import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@prisma/client"

interface StorePageProps {
  params: Promise<{
    domain: string
  }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { domain } = await params
  
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{store.name}</h1>
          {store.description && (
            <p className="text-muted-foreground mt-2">{store.description}</p>
          )}
        </div>
      </header>

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
              <Link key={product.id} href={`/${domain}/${product.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                    <CardDescription className="text-lg font-semibold">
                      {formatPrice(product.price)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {product.description}
                    </p>
                    {product.stock > 0 ? (
                      <p className="text-sm text-green-600 mt-2">In stock</p>
                    ) : (
                      <p className="text-sm text-red-600 mt-2">Out of stock</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
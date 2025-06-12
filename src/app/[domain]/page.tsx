import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { StoreHeader } from "@/components/store-header"
import { StorefrontProducts } from "@/components/storefront-products"

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
        orderBy: { createdAt: "desc" },
        include: {
          category: true
        }
      },
      categories: {
        where: { isActive: true },
        orderBy: { name: "asc" }
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
        <StorefrontProducts
          storeId={store.id}
          storeSlug={store.slug}
          stripeOnboarded={store.stripeOnboarded}
          initialProducts={store.products}
          categories={store.categories}
        />
      </main>
    </div>
  )
}
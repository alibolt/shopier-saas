import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

interface ProductPageProps {
  params: Promise<{
    domain: string
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { domain, slug } = await params
  
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
        where: {
          slug: slug,
          isActive: true
        }
      }
    }
  })

  if (!store || store.products.length === 0) {
    notFound()
  }

  const product = store.products[0]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/${domain}`} className="text-sm text-muted-foreground hover:text-primary">
            ← Back to {store.name}
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {product.images.length > 0 ? (
                <>
                  <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {product.images.slice(1).map((image, index) => (
                        <div key={index} className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={image}
                            alt={`${product.title} ${index + 2}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 25vw, 10vw"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{product.title}</CardTitle>
                <CardDescription className="text-2xl font-semibold">
                  {formatPrice(product.price)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              <div>
                <p className="text-sm">
                  {product.stock > 0 ? (
                    <span className="text-green-600">
                      ✓ In stock ({product.stock} available)
                    </span>
                  ) : (
                    <span className="text-red-600">
                      ✗ Out of stock
                    </span>
                  )}
                </p>
              </div>

              {product.sku && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    SKU: {product.sku}
                  </p>
                </div>
              )}

              <form action={`/api/checkout`} method="POST">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="storeId" value={store.id} />
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto"
                  disabled={product.stock === 0 || !store.stripeOnboarded}
                >
                  {!store.stripeOnboarded 
                    ? "Store setup in progress" 
                    : product.stock === 0 
                    ? "Out of Stock" 
                    : "Buy Now"}
                </Button>
              </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
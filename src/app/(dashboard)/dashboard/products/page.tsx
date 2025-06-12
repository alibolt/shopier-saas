import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@prisma/client"

export default async function ProductsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
    include: {
      products: {
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!store) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your store products
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      {store.products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No products yet</CardTitle>
            <CardDescription>
              Create your first product to start selling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/products/new">
              <Button>Add Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {store.products.map((product: Product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                <CardDescription>
                  {formatPrice(product.price)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm">
                    Stock: {product.stock}
                  </span>
                  <span className={`text-sm ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/products/${product.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/${store.slug}/${product.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
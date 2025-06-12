import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { ArrowLeft, Package } from "lucide-react"

interface CustomerOrdersPageProps {
  params: Promise<{ domain: string }>
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
}

export default async function CustomerOrdersPage({ params }: CustomerOrdersPageProps) {
  const session = await auth()
  const { domain } = await params
  
  if (!session?.user) {
    redirect(`/${domain}/account/login?returnUrl=/${domain}/account/orders`)
  }

  // Get store info
  const store = await prisma.store.findFirst({
    where: {
      OR: [
        { slug: domain },
        { domain: domain }
      ],
      isActive: true
    }
  })

  if (!store) {
    redirect('/')
  }

  // Get all customer orders
  const orders = await prisma.order.findMany({
    where: {
      customerEmail: session.user.email!,
      storeId: store.id,
      paymentStatus: 'PAID'
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader 
        storeName={store.name} 
        storeSlug={store.slug}
        description={store.description || undefined}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/${domain}/account`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Order History</h1>
              <p className="text-muted-foreground">
                View all your orders from {store.name}
              </p>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No orders yet</CardTitle>
                <CardDescription className="mb-4">
                  You haven't placed any orders yet. Start shopping to see your order history here.
                </CardDescription>
                <Link href={`/${domain}`}>
                  <Button>Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[order.status]} variant="secondary">
                          {order.status}
                        </Badge>
                        <p className="text-lg font-semibold mt-1">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.title}</p>
                              <p className="text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Link href={`/${domain}/account/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        {order.status === 'COMPLETED' && (
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Package, User, LogOut } from "lucide-react"
import { signOut } from "@/lib/auth"

interface CustomerAccountPageProps {
  params: Promise<{ domain: string }>
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
}

export default async function CustomerAccountPage({ params }: CustomerAccountPageProps) {
  const session = await auth()
  const { domain } = await params
  
  if (!session?.user) {
    redirect(`/${domain}/account/login?returnUrl=/${domain}/account`)
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

  // Get customer orders
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
          {/* Account Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Account</h1>
              <p className="text-muted-foreground">Welcome back, {session.user.name || session.user.email}</p>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: `/${domain}` })
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{session.user.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{session.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="font-medium">{orders.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="font-medium">
                    {formatPrice(orders.reduce((sum, order) => sum + order.total, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Orders</p>
                  <p className="font-medium">
                    {orders.filter(o => o.status === 'COMPLETED').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="font-medium">
                    {orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/${domain}`}>
                  <Button variant="outline" className="w-full justify-start">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href={`/${domain}/account/orders`}>
                  <Button variant="outline" className="w-full justify-start">
                    View All Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest purchases</CardDescription>
                </div>
                {orders.length > 3 && (
                  <Link href={`/${domain}/account/orders`}>
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Link href={`/${domain}`}>
                    <Button className="mt-4">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[order.status]} variant="secondary">
                            {order.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} • 
                        {order.items.slice(0, 2).map(item => item.product.title).join(', ')}
                        {order.items.length > 2 && ` and ${order.items.length - 2} more`}
                      </div>
                      <div className="mt-3">
                        <Link href={`/${domain}/account/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
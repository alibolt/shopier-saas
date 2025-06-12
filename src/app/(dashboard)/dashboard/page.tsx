import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { Package, ShoppingCart, DollarSign, Activity, ExternalLink } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      store: {
        include: {
          _count: {
            select: {
              products: true,
              orders: true
            }
          },
          orders: {
            where: {
              paymentStatus: 'PAID'
            },
            select: {
              total: true,
              platformFee: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect("/login")
  }

  // Calculate total revenue
  const totalRevenue = user.store?.orders.reduce((sum, order) => 
    sum + (order.total - order.platformFee), 0
  ) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}
        </p>
      </div>

      {!user.store ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Store</CardTitle>
            <CardDescription>
              Get started by creating your first store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/store/new">
              <Button>Create Store</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.store._count.products}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/products" className="text-primary hover:underline">
                  Manage products
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.store._count.orders}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/orders" className="text-primary hover:underline">
                  View orders
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.store.stripeOnboarded ? "📊" : "⚠️"}
              </div>
              <p className="text-xs text-muted-foreground">
                <Link href="/dashboard/analytics" className="text-primary hover:underline">
                  View analytics
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/products/new">
                <Button className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </Link>
              <Link href={`/${user.store.slug}`}>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Your Store
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Store Setup</CardTitle>
              <CardDescription>Complete your store configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe Connected</span>
                <span className={`text-sm font-medium ${user.store.stripeOnboarded ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.store.stripeOnboarded ? '✓ Done' : '⚠ Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Store Active</span>
                <span className={`text-sm font-medium ${user.store.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user.store.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Products Added</span>
                <span className={`text-sm font-medium ${user.store._count.products > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.store._count.products > 0 ? '✓ Done' : '⚠ None'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
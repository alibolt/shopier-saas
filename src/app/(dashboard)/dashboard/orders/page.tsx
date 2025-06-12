import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, Clock, CheckCircle, XCircle, RefreshCw, DollarSign } from "lucide-react"

const statusIcons = {
  PENDING: Clock,
  PROCESSING: RefreshCw,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  REFUNDED: DollarSign,
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
}

export default async function OrdersPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id },
    include: {
      orders: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!store) {
    redirect("/dashboard")
  }

  // Calculate stats
  const totalOrders = store.orders.length
  const pendingOrders = store.orders.filter(o => o.status === 'PENDING').length
  const completedOrders = store.orders.filter(o => o.status === 'COMPLETED').length
  const totalRevenue = store.orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, order) => sum + (order.total - order.platformFee), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track your store orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">After platform fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {store.orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
            <CardDescription>
              When customers place orders, they'll appear here
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {store.orders.map((order) => {
                const StatusIcon = statusIcons[order.status]
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.orderNumber}</p>
                        <Badge className={statusColors[order.status]} variant="secondary">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status}
                        </Badge>
                        {order.paymentStatus === 'PAID' && (
                          <Badge variant="outline" className="text-green-600">
                            Paid
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} • {order.customerEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} • {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
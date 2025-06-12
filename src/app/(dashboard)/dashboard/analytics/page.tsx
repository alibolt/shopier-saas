import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { TrendingUp, ShoppingCart, Users, Package, DollarSign, Activity, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default async function AnalyticsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id }
  })

  if (!store) {
    redirect("/dashboard")
  }

  // Get date ranges
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Current month stats
  const currentMonthOrders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfMonth },
      paymentStatus: 'PAID'
    },
    include: {
      items: true
    }
  })

  // Last month stats for comparison
  const lastMonthOrders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth
      },
      paymentStatus: 'PAID'
    }
  })

  // Calculate metrics
  const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.total - order.platformFee), 0)
  const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total - order.platformFee), 0)
  const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const totalOrders = currentMonthOrders.length
  const lastMonthOrderCount = lastMonthOrders.length
  const ordersChange = lastMonthOrderCount > 0 ? ((totalOrders - lastMonthOrderCount) / lastMonthOrderCount) * 100 : 0

  const totalItemsSold = currentMonthOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  )

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get top products
  const productSales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        storeId: store.id,
        paymentStatus: 'PAID',
        createdAt: { gte: startOfMonth }
      }
    },
    _sum: {
      quantity: true,
      price: true
    },
    _count: true,
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 5
  })

  const topProducts = await Promise.all(
    productSales.map(async (sale) => {
      const product = await prisma.product.findUnique({
        where: { id: sale.productId }
      })
      return {
        product,
        quantity: sale._sum.quantity || 0,
        revenue: ((sale._sum.price || 0) * (sale._sum.quantity || 0)) / 100
      }
    })
  )

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      paymentStatus: 'PAID'
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your store's performance and growth
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {revenueChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+{revenueChange.toFixed(1)}%</span>
                </>
              ) : revenueChange < 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
                </>
              ) : (
                <span>No change</span>
              )}
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {ordersChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+{ordersChange.toFixed(1)}%</span>
                </>
              ) : ordersChange < 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                  <span className="text-red-600">{ordersChange.toFixed(1)}%</span>
                </>
              ) : (
                <span>No change</span>
              )}
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsSold}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales yet this month</p>
              ) : (
                topProducts.map(({ product, quantity, revenue }, index) => (
                  <div key={product?.id || index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">
                        {product?.title || 'Deleted Product'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quantity} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${revenue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest completed transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} items • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total - order.platformFee)}</p>
                      <p className="text-xs text-muted-foreground">earned</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
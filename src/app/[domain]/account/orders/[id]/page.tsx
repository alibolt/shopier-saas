import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { StoreHeader } from "@/components/store-header"
import { ArrowLeft, Package, Truck, CheckCircle, MapPin } from "lucide-react"

interface CustomerOrderDetailPageProps {
  params: Promise<{ domain: string; id: string }>
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
}

const statusIcons = {
  PENDING: Package,
  PROCESSING: Truck,
  COMPLETED: CheckCircle,
  CANCELLED: Package,
  REFUNDED: Package,
}

export default async function CustomerOrderDetailPage({ params }: CustomerOrderDetailPageProps) {
  const session = await auth()
  const { domain, id } = await params
  
  if (!session?.user) {
    redirect(`/${domain}/account/login?returnUrl=/${domain}/account/orders/${id}`)
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

  // Get order details
  const order = await prisma.order.findFirst({
    where: {
      id,
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
    }
  })

  if (!order) {
    notFound()
  }

  const shippingAddress = order.shippingAddress as any
  const StatusIcon = statusIcons[order.status]

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
            <Link href={`/${domain}/account/orders`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
              <p className="text-muted-foreground">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <Badge className={statusColors[order.status]} variant="secondary">
              <StatusIcon className="h-3 w-3 mr-1" />
              {order.status}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Order Items */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>{order.items.length} items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                        {item.product.images[0] && (
                          <div className="relative h-20 w-20 overflow-hidden rounded-md bg-gray-100">
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium">{item.product.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product.sku || 'N/A'}
                          </p>
                          <p className="text-sm">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Total */}
                  <div className="mt-6 pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Info */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-medium">{order.customerName}</p>
                  <p>{shippingAddress.line1}</p>
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                  <p>{shippingAddress.country}</p>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Order Confirmed</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {order.status !== 'PENDING' && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">Processing</p>
                          <p className="text-xs text-muted-foreground">
                            Order is being prepared
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'COMPLETED' && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">Completed</p>
                          <p className="text-xs text-muted-foreground">
                            Order has been delivered
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'CANCELLED' && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">Cancelled</p>
                          <p className="text-xs text-muted-foreground">
                            Order was cancelled
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.status === 'COMPLETED' && (
                    <Button className="w-full" variant="outline">
                      Reorder Items
                    </Button>
                  )}
                  <Link href={`/${domain}`}>
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
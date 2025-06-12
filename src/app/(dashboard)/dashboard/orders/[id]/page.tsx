import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Package, Mail, MapPin, CreditCard } from "lucide-react"
import { UpdateOrderStatus } from "@/components/update-order-status"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth()
  const { id } = await params
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const store = await prisma.store.findUnique({
    where: { userId: session.user.id }
  })

  if (!store) {
    redirect("/dashboard")
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      storeId: store.id
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[order.status]} variant="secondary">
            {order.status}
          </Badge>
          {order.paymentStatus === 'PAID' && (
            <Badge variant="outline" className="text-green-600">
              Paid
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
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
                        {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="text-red-600">-{formatPrice(order.platformFee)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Your Earnings</span>
                  <span>{formatPrice(order.total - order.platformFee)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>
                Update the order status to keep customers informed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>

        {/* Customer & Payment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{shippingAddress.line1}</p>
              <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
              <p>{shippingAddress.country}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.stripePaymentIntentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stripe ID</span>
                  <span className="font-mono text-xs">{order.stripePaymentIntentId.slice(-8)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
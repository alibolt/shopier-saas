import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            🎉 Payment Successful!
          </CardTitle>
          <CardDescription className="text-center">
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your order has been confirmed and will be processed shortly.
            You will receive an email confirmation with your order details.
          </p>
          <Link href="/">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
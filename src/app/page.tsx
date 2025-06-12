import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const isDemoMode = !process.env.DATABASE_URL
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Start Your Online Store Today
        </h1>
        <p className="text-xl text-muted-foreground">
          Create your own e-commerce store in minutes with Stripe Connect integration.
          Accept payments, manage products, and grow your business.
        </p>
        
        {isDemoMode && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">Demo Mode</CardTitle>
              <CardDescription className="text-yellow-700">
                This app is running in demo mode. Database and authentication features are disabled.
                To enable full functionality, configure environment variables.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        
        <div className="flex gap-4 justify-center">
          {!isDemoMode ? (
            <>
              <Link href="/register">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Authentication is disabled in demo mode
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
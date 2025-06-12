import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"

async function DashboardNav() {
  const session = await auth()
  
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold">
              Shopier SaaS
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm hover:text-primary">
                Dashboard
              </Link>
              <Link href="/dashboard/products" className="text-sm hover:text-primary">
                Products
              </Link>
              <Link href="/dashboard/orders" className="text-sm hover:text-primary">
                Orders
              </Link>
              <Link href="/dashboard/analytics" className="text-sm hover:text-primary">
                Analytics
              </Link>
              <Link href="/dashboard/settings" className="text-sm hover:text-primary">
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <form action={async () => {
          "use server"
          const { signOut } = await import("@/lib/auth")
          await signOut()
        }}>
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </div>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session.user?.name || session.user?.email}</h2>
          <p className="text-gray-600">Role: {session.user?.role || 'USER'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <Link href="/stores">
              <Button>Manage Stores</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">View Products</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
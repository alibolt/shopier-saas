import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TestAuthPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p className="font-semibold">Logged in as:</p>
        <pre className="mt-2">{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  )
}
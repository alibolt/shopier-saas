"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"

export default function NewStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [slug, setSlug] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
    }

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to create store")
      }

      toast.success("Store created successfully!")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Store</CardTitle>
          <CardDescription>
            Set up your online store to start selling
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Awesome Store"
                required
                disabled={loading}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Store URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {process.env.NEXT_PUBLIC_ROOT_DOMAIN}/
                </span>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-store"
                  required
                  disabled={loading}
                  pattern="[a-z0-9-]+"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="What do you sell?"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardContent>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Store"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
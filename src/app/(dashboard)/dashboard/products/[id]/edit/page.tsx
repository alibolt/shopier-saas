"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"
import { ImageUpload } from "@/components/image-upload"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    async function loadProduct() {
      try {
        const { id } = await params
        const res = await fetch(`/api/products/${id}`)
        
        if (!res.ok) {
          throw new Error("Failed to load product")
        }
        
        const data = await res.json()
        setProduct(data.product)
        setImages(data.product.images || [])
      } catch (error) {
        toast.error("Failed to load product")
        router.push("/dashboard/products")
      } finally {
        setLoading(false)
      }
    }
    
    loadProduct()
  }, [params, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      price: Math.round(parseFloat(formData.get("price") as string) * 100), // Convert to cents
      stock: parseInt(formData.get("stock") as string),
      sku: formData.get("sku") as string || undefined,
      images: images,
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to update product")
      }

      toast.success("Product updated successfully!")
      router.push("/dashboard/products")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to delete product")
      }

      toast.success(result.message)
      router.push("/dashboard/products")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Product</CardTitle>
              <CardDescription>
                Update product information
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this product? 
                    {product.orderItems?.length > 0 
                      ? " This product has existing orders and will be deactivated instead of deleted."
                      : " This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Images</Label>
              <ImageUpload
                value={images}
                onChange={setImages}
                maxFiles={5}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Upload up to 5 images. The first image will be the main product image.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Product Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={product.title}
                placeholder="Awesome Product"
                required
                disabled={saving}
                onChange={(e) => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement
                  if (slugInput && slugInput.value === product.slug) {
                    slugInput.value = slugify(e.target.value)
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Product URL</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={product.slug}
                placeholder="awesome-product"
                required
                disabled={saving}
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                This will be used in the product URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={product.description}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your product..."
                required
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(product.price / 100).toFixed(2)}
                  placeholder="29.99"
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={product.stock}
                  placeholder="100"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (optional)</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={product.sku || ""}
                placeholder="ABC-123"
                disabled={saving}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Product is visible to customers
                  </p>
                </div>
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={product.isActive}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured">Featured</Label>
                  <p className="text-xs text-muted-foreground">
                    Show on store homepage
                  </p>
                </div>
                <Switch
                  id="isFeatured"
                  name="isFeatured"
                  defaultChecked={product.isFeatured}
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
          <CardContent>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
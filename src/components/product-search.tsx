"use client"

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import { Badge } from '@/components/ui/badge'

interface ProductSearchProps {
  categories?: Array<{ id: string; name: string }>
  maxPrice?: number
}

export function ProductSearch({ categories = [], maxPrice = 10000 }: ProductSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Search state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || maxPrice
  ])
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true')
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true')
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      updateFilters({ search: value })
    }, 300),
    []
  )
  
  const updateFilters = (updates: Record<string, any>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === false) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    router.push(`${pathname}?${params.toString()}`)
  }
  
  const clearFilters = () => {
    setSearch('')
    setSortBy('newest')
    setCategoryId('')
    setPriceRange([0, maxPrice])
    setInStock(false)
    setFeatured(false)
    router.push(pathname)
  }
  
  const hasActiveFilters = search || sortBy !== 'newest' || categoryId || 
    priceRange[0] > 0 || priceRange[1] < maxPrice || inStock || featured
  
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              debouncedSearch(e.target.value)
            }}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                updateFilters({ search: '' })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        
        {/* Filters Toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Products</SheetTitle>
              <SheetDescription>
                Narrow down your search results
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select 
                  value={sortBy} 
                  onValueChange={(value) => {
                    setSortBy(value)
                    updateFilters({ sort: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={categoryId} 
                    onValueChange={(value) => {
                      setCategoryId(value)
                      updateFilters({ category: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    onValueCommit={(value) => {
                      updateFilters({
                        minPrice: value[0],
                        maxPrice: value[1]
                      })
                    }}
                    max={maxPrice}
                    step={100}
                    className="mt-2"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>${(priceRange[0] / 100).toFixed(2)}</span>
                    <span>${(priceRange[1] / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Stock Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="in-stock">In Stock Only</Label>
                <Switch
                  id="in-stock"
                  checked={inStock}
                  onCheckedChange={(checked) => {
                    setInStock(checked)
                    updateFilters({ inStock: checked })
                  }}
                />
              </div>
              
              {/* Featured */}
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Only</Label>
                <Switch
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => {
                    setFeatured(checked)
                    updateFilters({ featured: checked })
                  }}
                />
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button onClick={() => {
                setSearch('')
                updateFilters({ search: '' })
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {categoryId && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.find(c => c.id === categoryId)?.name}
              <button onClick={() => {
                setCategoryId('')
                updateFilters({ category: '' })
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              Price: ${(priceRange[0] / 100).toFixed(2)} - ${(priceRange[1] / 100).toFixed(2)}
              <button onClick={() => {
                setPriceRange([0, maxPrice])
                updateFilters({ minPrice: 0, maxPrice: maxPrice })
              }}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
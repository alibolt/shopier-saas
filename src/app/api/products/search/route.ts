import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const searchSchema = z.object({
  storeId: z.string(),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  sort: z.enum(['newest', 'oldest', 'price-asc', 'price-desc', 'name-asc', 'name-desc']).optional(),
  page: z.number().default(1),
  limit: z.number().default(12),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    
    const params = searchSchema.parse({
      storeId: searchParams.get('storeId'),
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      sort: searchParams.get('sort') as any || 'newest',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 12,
    })
    
    // Build where clause
    const where: any = {
      storeId: params.storeId,
      isActive: true,
    }
    
    // Search
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    // Category filter
    if (params.category) {
      where.categoryId = params.category
    }
    
    // Price range
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {}
      if (params.minPrice !== undefined) {
        where.price.gte = params.minPrice
      }
      if (params.maxPrice !== undefined) {
        where.price.lte = params.maxPrice
      }
    }
    
    // Stock filter
    if (params.inStock) {
      where.stock = { gt: 0 }
    }
    
    // Featured filter
    if (params.featured) {
      where.isFeatured = true
    }
    
    // Build orderBy
    let orderBy: any = {}
    switch (params.sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'name-asc':
        orderBy = { title: 'asc' }
        break
      case 'name-desc':
        orderBy = { title: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
    }
    
    // Get total count
    const totalCount = await prisma.product.count({ where })
    
    // Get products
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        category: true,
      }
    })
    
    // Get price range for filters
    const priceAggregation = await prisma.product.aggregate({
      where: {
        storeId: params.storeId,
        isActive: true,
      },
      _min: { price: true },
      _max: { price: true },
    })
    
    return NextResponse.json({
      products,
      pagination: {
        total: totalCount,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(totalCount / params.limit),
      },
      filters: {
        minPrice: priceAggregation._min.price || 0,
        maxPrice: priceAggregation._max.price || 0,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Product search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
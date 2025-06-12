import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'shopier-saas.vercel.app'
  
  // Remove port and www from hostname for comparison
  const cleanHostname = hostname.replace('www.', '').split(':')[0]
  const cleanRootDomain = rootDomain.replace('www.', '').split(':')[0]
  
  // Check if this is the main domain
  const isMainDomain = cleanHostname === cleanRootDomain || 
                      cleanHostname === 'localhost' || 
                      cleanHostname === '127.0.0.1'
  
  // If accessing main domain or specific routes
  if (
    isMainDomain ||
    // Allow specific routes on main domain
    url.pathname === '/' ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/success') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }
  
  // For custom domains/subdomains, rewrite to /[domain]/* dynamic route
  const subdomain = cleanHostname.replace(`.${cleanRootDomain}`, '')
  url.pathname = `/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
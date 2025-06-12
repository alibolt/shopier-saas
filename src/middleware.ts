import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'shopier-saas.vercel.app'
  
  // Get the subdomain (e.g., 'store' from 'store.domain.com')
  const currentHost = hostname
    .replace(`.${rootDomain}`, '')
    .replace(`www.`, '')
    .replace(`http://`, '')
    .replace(`https://`, '')
    .split(':')[0] // Remove port if exists
  
  // If accessing main domain or localhost
  if (
    currentHost === rootDomain.split(':')[0] ||
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    // Allow dashboard, api, auth routes on main domain
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }
  
  // For custom domains/subdomains, rewrite to /[domain]/* dynamic route
  url.pathname = `/${currentHost}${url.pathname}`
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
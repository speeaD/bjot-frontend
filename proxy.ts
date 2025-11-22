import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const isAuthenticated = !!token
  const { pathname } = request.nextUrl
  
  // Define public routes
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Redirect to login if not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect to home if authenticated and trying to access auth pages
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
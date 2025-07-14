import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, PERMISSIONS } from "./lib/auth"

// Routes that require authentication
const protectedRoutes = ["/admin", "/api/orders", "/api/customers", "/api/inventory", "/api/analytics", "/api/staff"]

// Routes that require specific permissions
const permissionRoutes = {
  "/admin": [PERMISSIONS.VIEW_ANALYTICS],
  "/api/customers": [PERMISSIONS.VIEW_CUSTOMERS],
  "/api/inventory": [PERMISSIONS.VIEW_INVENTORY],
  "/api/analytics": [PERMISSIONS.VIEW_ANALYTICS],
  "/api/staff": [PERMISSIONS.VIEW_STAFF],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to login for web routes
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Return 401 for API routes
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify token
  const payload = verifyToken(token)
  if (!payload) {
    if (!pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  // Check permissions for specific routes
  const requiredPermissions = Object.entries(permissionRoutes).find(([route]) => pathname.startsWith(route))?.[1]

  if (requiredPermissions) {
    const hasPermission = requiredPermissions.some((permission) => payload.permissions.includes(permission))

    if (!hasPermission) {
      if (!pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
  }

  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set("x-user-id", payload.userId)
  response.headers.set("x-user-role", payload.role)
  response.headers.set("x-user-permissions", JSON.stringify(payload.permissions))

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/orders/:path*",
    "/api/customers/:path*",
    "/api/inventory/:path*",
    "/api/analytics/:path*",
    "/api/staff/:path*",
  ],
}

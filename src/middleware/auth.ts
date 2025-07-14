import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "@/config/environment"
import { AuthenticationError, AuthorizationError } from "@/middleware/errorHandler"
import { loggers } from "@/utils/logger"
import { RedisService } from "@/services/RedisService"

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
        permissions: string[]
        locationId?: string
        isActive: boolean
      }
    }
  }
}

// User roles and permissions
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  BARISTA = "barista",
  CASHIER = "cashier",
}

export enum Permission {
  // Order permissions
  CREATE_ORDER = "create_order",
  VIEW_ORDER = "view_order",
  UPDATE_ORDER = "update_order",
  DELETE_ORDER = "delete_order",
  PROCESS_PAYMENT = "process_payment",
  REFUND_PAYMENT = "refund_payment",

  // Customer permissions
  CREATE_CUSTOMER = "create_customer",
  VIEW_CUSTOMER = "view_customer",
  UPDATE_CUSTOMER = "update_customer",
  DELETE_CUSTOMER = "delete_customer",

  // Inventory permissions
  VIEW_INVENTORY = "view_inventory",
  UPDATE_INVENTORY = "update_inventory",
  CREATE_INVENTORY = "create_inventory",
  DELETE_INVENTORY = "delete_inventory",

  // Staff permissions
  VIEW_STAFF = "view_staff",
  CREATE_STAFF = "create_staff",
  UPDATE_STAFF = "update_staff",
  DELETE_STAFF = "delete_staff",

  // Analytics permissions
  VIEW_ANALYTICS = "view_analytics",
  VIEW_DETAILED_ANALYTICS = "view_detailed_analytics",
  EXPORT_ANALYTICS = "export_analytics",

  // System permissions
  MANAGE_SETTINGS = "manage_settings",
  VIEW_LOGS = "view_logs",
  MANAGE_LOCATIONS = "manage_locations",
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.MANAGER]: [
    Permission.CREATE_ORDER,
    Permission.VIEW_ORDER,
    Permission.UPDATE_ORDER,
    Permission.DELETE_ORDER,
    Permission.PROCESS_PAYMENT,
    Permission.REFUND_PAYMENT,
    Permission.CREATE_CUSTOMER,
    Permission.VIEW_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_INVENTORY,
    Permission.CREATE_INVENTORY,
    Permission.VIEW_STAFF,
    Permission.UPDATE_STAFF,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
  ],

  [UserRole.BARISTA]: [
    Permission.CREATE_ORDER,
    Permission.VIEW_ORDER,
    Permission.UPDATE_ORDER,
    Permission.PROCESS_PAYMENT,
    Permission.CREATE_CUSTOMER,
    Permission.VIEW_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_INVENTORY,
  ],

  [UserRole.CASHIER]: [
    Permission.CREATE_ORDER,
    Permission.VIEW_ORDER,
    Permission.UPDATE_ORDER,
    Permission.PROCESS_PAYMENT,
    Permission.CREATE_CUSTOMER,
    Permission.VIEW_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_INVENTORY,
  ],
}

// JWT token interface
interface JWTPayload {
  id: string
  email: string
  role: UserRole
  locationId?: string
  iat: number
  exp: number
}

// Redis service instance
const redisService = new RedisService()

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided")
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload

    // Check if token is blacklisted (for logout functionality)
    const isBlacklisted = await redisService.get(`blacklist:${token}`)
    if (isBlacklisted) {
      throw new AuthenticationError("Token has been revoked")
    }

    // Check if user session exists in Redis
    const userSession = await redisService.get(`session:${decoded.id}`)
    if (!userSession) {
      throw new AuthenticationError("Session expired")
    }

    const sessionData = JSON.parse(userSession)

    // Verify session token matches
    if (sessionData.token !== token) {
      throw new AuthenticationError("Invalid session")
    }

    // Check if user is still active
    if (!sessionData.isActive) {
      throw new AuthenticationError("User account is inactive")
    }

    // Set user data in request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: ROLE_PERMISSIONS[decoded.role] || [],
      locationId: decoded.locationId,
      isActive: sessionData.isActive,
    }

    // Update session last activity
    await redisService.setex(
      `session:${decoded.id}`,
      24 * 60 * 60, // 24 hours
      JSON.stringify({
        ...sessionData,
        lastActivity: new Date().toISOString(),
      }),
    )

    // Log authentication success
    loggers.auth("authenticate_success", decoded.id, {
      email: decoded.email,
      role: decoded.role,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    })

    next()
  } catch (error) {
    // Log authentication failure
    loggers.auth("authenticate_failure", undefined, {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      path: req.path,
    })

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid token"))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError("Token expired"))
    } else {
      next(error)
    }
  }
}

// Authorization middleware factory
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"))
    }

    // Check if user has required permissions
    const hasPermission = requiredPermissions.every((permission) => req.user!.permissions.includes(permission))

    if (!hasPermission) {
      loggers.auth("authorization_failure", req.user.id, {
        requiredPermissions,
        userPermissions: req.user.permissions,
        role: req.user.role,
        path: req.path,
      })

      return next(new AuthorizationError("Insufficient permissions"))
    }

    // Log authorization success
    loggers.auth("authorization_success", req.user.id, {
      requiredPermissions,
      role: req.user.role,
      path: req.path,
    })

    next()
  }
}

// Role-based authorization middleware
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"))
    }

    if (!roles.includes(req.user.role as UserRole)) {
      loggers.auth("role_authorization_failure", req.user.id, {
        requiredRoles: roles,
        userRole: req.user.role,
        path: req.path,
      })

      return next(new AuthorizationError("Insufficient role privileges"))
    }

    next()
  }
}

// Location-based authorization middleware
export const requireLocation = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthenticationError("Authentication required"))
  }

  // Admin users can access all locations
  if (req.user.role === UserRole.ADMIN) {
    return next()
  }

  // Check if user has a location assigned
  if (!req.user.locationId) {
    return next(new AuthorizationError("No location assigned to user"))
  }

  // Check if requested resource belongs to user's location
  const requestedLocationId = req.params.locationId || req.body.locationId || req.query.locationId

  if (requestedLocationId && requestedLocationId !== req.user.locationId) {
    loggers.auth("location_authorization_failure", req.user.id, {
      userLocationId: req.user.locationId,
      requestedLocationId,
      path: req.path,
    })

    return next(new AuthorizationError("Access denied for this location"))
  }

  next()
}

// Optional authentication middleware (for public endpoints with optional user context)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next() // Continue without authentication
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload

    // Check if token is blacklisted
    const isBlacklisted = await redisService.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return next() // Continue without authentication
    }

    // Check session
    const userSession = await redisService.get(`session:${decoded.id}`)
    if (!userSession) {
      return next() // Continue without authentication
    }

    const sessionData = JSON.parse(userSession)

    if (sessionData.token === token && sessionData.isActive) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: ROLE_PERMISSIONS[decoded.role] || [],
        locationId: decoded.locationId,
        isActive: sessionData.isActive,
      }
    }

    next()
  } catch (error) {
    // Silently continue without authentication on error
    next()
  }
}

// Refresh token middleware
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new AuthenticationError("Refresh token required")
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as JWTPayload

    // Check if refresh token exists in Redis
    const storedRefreshToken = await redisService.get(`refresh:${decoded.id}`)
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      throw new AuthenticationError("Invalid refresh token")
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        locationId: decoded.locationId,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    )

    // Update session with new token
    const userSession = await redisService.get(`session:${decoded.id}`)
    if (userSession) {
      const sessionData = JSON.parse(userSession)
      await redisService.setex(
        `session:${decoded.id}`,
        24 * 60 * 60,
        JSON.stringify({
          ...sessionData,
          token: newAccessToken,
          lastActivity: new Date().toISOString(),
        }),
      )
    }

    // Log token refresh
    loggers.auth("token_refresh", decoded.id, {
      email: decoded.email,
      ip: req.ip,
    })

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: config.jwtExpiresIn,
      },
    })
  } catch (error) {
    loggers.auth("token_refresh_failure", undefined, {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.ip,
    })

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError("Invalid refresh token"))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError("Refresh token expired"))
    } else {
      next(error)
    }
  }
}

// Logout middleware
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AuthenticationError("No token provided"))
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload

    // Add token to blacklist
    const tokenExpiry = decoded.exp - Math.floor(Date.now() / 1000)
    if (tokenExpiry > 0) {
      await redisService.setex(`blacklist:${token}`, tokenExpiry, "true")
    }

    // Remove user session
    await redisService.del(`session:${decoded.id}`)

    // Remove refresh token
    await redisService.del(`refresh:${decoded.id}`)

    // Log logout
    loggers.auth("logout", decoded.id, {
      email: decoded.email,
      ip: req.ip,
    })

    res.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Helper function to generate JWT token
export const generateToken = (payload: Omit<JWTPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

// Helper function to generate refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, "iat" | "exp">): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  })
}

// Helper function to check if user has specific permission
export const hasPermission = (user: Express.Request["user"], permission: Permission): boolean => {
  return user?.permissions.includes(permission) || false
}

// Helper function to check if user has any of the specified roles
export const hasRole = (user: Express.Request["user"], ...roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role as UserRole) : false
}

export default {
  authenticate,
  authorize,
  requireRole,
  requireLocation,
  optionalAuth,
  refreshToken,
  logout,
  generateToken,
  generateRefreshToken,
  hasPermission,
  hasRole,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
}

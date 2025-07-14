import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "barista" | "cashier"
  permissions: string[]
  locationId?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
  permissions: string[]
  locationId?: string
}

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const TOKEN_EXPIRY = "24h"

// Role-based permissions
export const PERMISSIONS = {
  // Order management
  CREATE_ORDER: "create_order",
  VIEW_ORDERS: "view_orders",
  UPDATE_ORDER_STATUS: "update_order_status",
  CANCEL_ORDER: "cancel_order",
  REFUND_ORDER: "refund_order",

  // Customer management
  VIEW_CUSTOMERS: "view_customers",
  CREATE_CUSTOMER: "create_customer",
  UPDATE_CUSTOMER: "update_customer",
  DELETE_CUSTOMER: "delete_customer",

  // Inventory management
  VIEW_INVENTORY: "view_inventory",
  UPDATE_INVENTORY: "update_inventory",
  CREATE_INVENTORY_ITEM: "create_inventory_item",
  DELETE_INVENTORY_ITEM: "delete_inventory_item",

  // Analytics and reporting
  VIEW_ANALYTICS: "view_analytics",
  VIEW_DETAILED_REPORTS: "view_detailed_reports",
  EXPORT_DATA: "export_data",

  // Staff management
  VIEW_STAFF: "view_staff",
  CREATE_STAFF: "create_staff",
  UPDATE_STAFF: "update_staff",
  DELETE_STAFF: "delete_staff",

  // System administration
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_LOCATIONS: "manage_locations",
  MANAGE_PROMOTIONS: "manage_promotions",
  VIEW_SYSTEM_LOGS: "view_system_logs",
}

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.CANCEL_ORDER,
    PERMISSIONS.REFUND_ORDER,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.UPDATE_CUSTOMER,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.UPDATE_INVENTORY,
    PERMISSIONS.CREATE_INVENTORY_ITEM,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_DETAILED_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_PROMOTIONS,
  ],
  barista: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.VIEW_INVENTORY,
  ],
  cashier: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.VIEW_INVENTORY,
  ],
}

// Demo users for testing
export const DEMO_USERS: User[] = [
  {
    id: "admin-1",
    email: "admin@cafe.com",
    name: "Admin User",
    role: "admin",
    permissions: ROLE_PERMISSIONS.admin,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "manager-1",
    email: "manager@cafe.com",
    name: "Store Manager",
    role: "manager",
    permissions: ROLE_PERMISSIONS.manager,
    locationId: "location-1",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "barista-1",
    email: "barista@cafe.com",
    name: "Senior Barista",
    role: "barista",
    permissions: ROLE_PERMISSIONS.barista,
    locationId: "location-1",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cashier-1",
    email: "cashier@cafe.com",
    name: "Cashier",
    role: "cashier",
    permissions: ROLE_PERMISSIONS.cashier,
    locationId: "location-1",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload
  } catch (error) {
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // In production, this would query a database
  const user = DEMO_USERS.find((u) => u.email === email && u.isActive)

  if (!user) {
    return null
  }

  // For demo purposes, all passwords are 'password'
  const isValidPassword = password === "password"

  if (!isValidPassword) {
    return null
  }

  return {
    ...user,
    lastLogin: new Date().toISOString(),
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // In production, fetch user from database
    const user = DEMO_USERS.find((u) => u.id === payload.userId && u.isActive)
    return user || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export function hasPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission)
}

export function hasAnyPermission(user: User, permissions: string[]): boolean {
  return permissions.some((permission) => user.permissions.includes(permission))
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  })
}

export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
}

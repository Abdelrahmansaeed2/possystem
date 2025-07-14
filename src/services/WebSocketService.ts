import type { Server as SocketIOServer, Socket } from "socket.io"
import jwt from "jsonwebtoken"
import { config } from "@/config/environment"
import { logger, loggers } from "@/utils/logger"
import { RedisService } from "@/services/RedisService"
import { UserRole } from "@/middleware/auth"

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: UserRole
  locationId?: string
}

interface SocketUser {
  id: string
  email: string
  role: UserRole
  locationId?: string
}

export class WebSocketService {
  private io: SocketIOServer
  private redisService: RedisService
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map()
  private userSockets: Map<string, Set<string>> = new Map() // userId -> Set of socketIds

  constructor(io: SocketIOServer) {
    this.io = io
    this.redisService = new RedisService()
  }

  public initialize(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "")

        if (!token) {
          return next(new Error("Authentication token required"))
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecret) as any

        // Check if token is blacklisted
        const isBlacklisted = await this.redisService.get(`blacklist:${token}`)
        if (isBlacklisted) {
          return next(new Error("Token has been revoked"))
        }

        // Check user session
        const userSession = await this.redisService.get(`session:${decoded.id}`)
        if (!userSession) {
          return next(new Error("Session expired"))
        }

        const sessionData = JSON.parse(userSession)
        if (!sessionData.isActive) {
          return next(new Error("User account is inactive"))
        }

        // Set user data on socket
        socket.userId = decoded.id
        socket.userRole = decoded.role
        socket.locationId = decoded.locationId

        loggers.websocket("authentication_success", socket.id, {
          userId: decoded.id,
          role: decoded.role,
          locationId: decoded.locationId,
        })

        next()
      } catch (error) {
        loggers.websocket("authentication_failure", socket.id, {
          error: error instanceof Error ? error.message : "Unknown error",
        })
        next(new Error("Authentication failed"))
      }
    })

    // Connection handler
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      this.handleConnection(socket)
    })

    logger.info("WebSocket service initialized")
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!
    const userRole = socket.userRole!
    const locationId = socket.locationId

    // Track connected user
    this.connectedUsers.set(socket.id, socket)

    // Track user sockets
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)!.add(socket.id)

    loggers.websocket("user_connected", socket.id, {
      userId,
      role: userRole,
      locationId,
      totalConnections: this.connectedUsers.size,
    })

    // Join user to appropriate rooms
    socket.join(`user:${userId}`)
    socket.join(`role:${userRole}`)

    if (locationId) {
      socket.join(`location:${locationId}`)
    }

    // Set up event handlers
    this.setupEventHandlers(socket)

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      this.handleDisconnection(socket, reason)
    })

    // Send welcome message
    socket.emit("connected", {
      message: "Connected to Café POS Pro",
      userId,
      role: userRole,
      locationId,
      timestamp: new Date().toISOString(),
    })
  }

  private setupEventHandlers(socket: AuthenticatedSocket): void {
    const userId = socket.userId!
    const userRole = socket.userRole!
    const locationId = socket.locationId

    // Order events
    socket.on("order:subscribe", () => {
      socket.join("orders")
      loggers.websocket("subscribed_to_orders", socket.id, { userId })
    })

    socket.on("order:unsubscribe", () => {
      socket.leave("orders")
      loggers.websocket("unsubscribed_from_orders", socket.id, { userId })
    })

    // Kitchen events (barista and manager only)
    socket.on("kitchen:subscribe", () => {
      if (userRole === UserRole.BARISTA || userRole === UserRole.MANAGER || userRole === UserRole.ADMIN) {
        socket.join("kitchen")
        loggers.websocket("subscribed_to_kitchen", socket.id, { userId, role: userRole })
      } else {
        socket.emit("error", { message: "Insufficient permissions for kitchen updates" })
      }
    })

    socket.on("kitchen:update", (data) => {
      if (userRole === UserRole.BARISTA || userRole === UserRole.MANAGER || userRole === UserRole.ADMIN) {
        this.broadcastKitchenUpdate(data, locationId)
        loggers.websocket("kitchen_update_sent", socket.id, { userId, data })
      } else {
        socket.emit("error", { message: "Insufficient permissions for kitchen updates" })
      }
    })

    // Notification events
    socket.on("notifications:subscribe", () => {
      socket.join("notifications")
      loggers.websocket("subscribed_to_notifications", socket.id, { userId })
    })

    socket.on("notifications:unsubscribe", () => {
      socket.leave("notifications")
      loggers.websocket("unsubscribed_from_notifications", socket.id, { userId })
    })

    // Admin events
    socket.on("admin:subscribe", () => {
      if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
        socket.join("admin")
        loggers.websocket("subscribed_to_admin", socket.id, { userId, role: userRole })
      } else {
        socket.emit("error", { message: "Insufficient permissions for admin events" })
      }
    })

    // Location-specific events
    if (locationId) {
      socket.on("location:subscribe", () => {
        socket.join(`location:${locationId}`)
        loggers.websocket("subscribed_to_location", socket.id, { userId, locationId })
      })
    }

    // Heartbeat/ping
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() })
    })

    // Error handling
    socket.on("error", (error) => {
      loggers.websocket("socket_error", socket.id, { userId, error })
    })
  }

  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    const userId = socket.userId!

    // Remove from connected users
    this.connectedUsers.delete(socket.id)

    // Remove from user sockets
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socket.id)
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId)
      }
    }

    loggers.websocket("user_disconnected", socket.id, {
      userId,
      reason,
      totalConnections: this.connectedUsers.size,
    })
  }

  // Public methods for broadcasting events

  public broadcastOrderUpdate(orderData: any, locationId?: string): void {
    const room = locationId ? `location:${locationId}` : "orders"

    this.io.to(room).emit("order:updated", {
      ...orderData,
      timestamp: new Date().toISOString(),
    })

    loggers.websocket("order_update_broadcast", "system", {
      orderId: orderData.id,
      status: orderData.status,
      locationId,
      room,
    })
  }

  public broadcastNewOrder(orderData: any, locationId?: string): void {
    const room = locationId ? `location:${locationId}` : "orders"

    this.io.to(room).emit("order:new", {
      ...orderData,
      timestamp: new Date().toISOString(),
    })

    loggers.websocket("new_order_broadcast", "system", {
      orderId: orderData.id,
      customerId: orderData.customerId,
      total: orderData.total,
      locationId,
      room,
    })
  }

  public broadcastKitchenUpdate(updateData: any, locationId?: string): void {
    const room = locationId ? `location:${locationId}` : "kitchen"

    this.io.to(room).emit("kitchen:update", {
      ...updateData,
      timestamp: new Date().toISOString(),
    })

    loggers.websocket("kitchen_update_broadcast", "system", {
      orderId: updateData.orderId,
      status: updateData.status,
      estimatedTime: updateData.estimatedTime,
      locationId,
      room,
    })
  }

  public sendNotificationToUser(userId: string, notification: any): void {
    const userSocketIds = this.userSockets.get(userId)

    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        const socket = this.connectedUsers.get(socketId)
        if (socket) {
          socket.emit("notification", {
            ...notification,
            timestamp: new Date().toISOString(),
          })
        }
      })

      loggers.websocket("notification_sent_to_user", "system", {
        userId,
        notificationType: notification.type,
        socketCount: userSocketIds.size,
      })
    }
  }

  public sendNotificationToRole(role: UserRole, notification: any, locationId?: string): void {
    const room = locationId ? `location:${locationId}` : `role:${role}`

    this.io.to(room).emit("notification", {
      ...notification,
      timestamp: new Date().toISOString(),
    })

    loggers.websocket("notification_sent_to_role", "system", {
      role,
      notificationType: notification.type,
      locationId,
      room,
    })
  }

  public broadcastSystemNotification(notification: any, locationId?: string): void {
    const room = locationId ? `location:${locationId}` : "notifications"

    this.io.to(room).emit("system:notification", {
      ...notification,
      timestamp: new Date().toISOString(),
    })

    loggers.websocket("system_notification_broadcast", "system", {
      notificationType: notification.type,
      message: notification.message,
      locationId,
      room,
    })
  }

  public broadcastInventoryAlert(alertData: any, locationId?: string): void {
    const room = locationId ? `location:${locationId}` : "admin"

    this.io.to(room).emit("inventory:alert", {
      ...alertData,
      timestamp: new Date().toISOString(),
    })

    loggers.websocket("inventory_alert_broadcast", "system", {
      itemId: alertData.itemId,
      alertType: alertData.type,
      currentStock: alertData.currentStock,
      threshold: alertData.threshold,
      locationId,
      room,
    })
  }

  // Statistics and monitoring
  public getConnectionStats(): any {
    const stats = {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: this.userSockets.size,
      roomStats: {},
      usersByRole: {
        [UserRole.ADMIN]: 0,
        [UserRole.MANAGER]: 0,
        [UserRole.BARISTA]: 0,
        [UserRole.CASHIER]: 0,
      },
    }

    // Count users by role
    this.connectedUsers.forEach((socket) => {
      if (socket.userRole) {
        stats.usersByRole[socket.userRole]++
      }
    })

    return stats
  }

  public getConnectedUsers(): SocketUser[] {
    const users: SocketUser[] = []
    const seenUsers = new Set<string>()

    this.connectedUsers.forEach((socket) => {
      if (socket.userId && !seenUsers.has(socket.userId)) {
        seenUsers.add(socket.userId)
        users.push({
          id: socket.userId,
          email: "", // Would need to fetch from database
          role: socket.userRole!,
          locationId: socket.locationId,
        })
      }
    })

    return users
  }

  public disconnectUser(userId: string, reason = "Admin disconnect"): void {
    const userSocketIds = this.userSockets.get(userId)

    if (userSocketIds) {
      userSocketIds.forEach((socketId) => {
        const socket = this.connectedUsers.get(socketId)
        if (socket) {
          socket.emit("force_disconnect", { reason })
          socket.disconnect(true)
        }
      })

      loggers.websocket("user_force_disconnected", "system", {
        userId,
        reason,
        socketCount: userSocketIds.size,
      })
    }
  }
}

export default WebSocketService

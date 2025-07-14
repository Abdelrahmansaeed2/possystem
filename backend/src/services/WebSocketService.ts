import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

export class WebSocketService {
  private io: SocketIOServer
  private connectedClients: Map<string, any> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:19006"],
        methods: ["GET", "POST"],
      },
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`)
      this.connectedClients.set(socket.id, socket)

      // Send welcome message
      socket.emit("connected", {
        message: "Connected to Café POS WebSocket",
        clientId: socket.id,
        timestamp: new Date().toISOString(),
      })

      // Handle client identification
      socket.on("identify", (data) => {
        socket.data.userType = data.userType // 'admin', 'barista', 'customer'
        socket.data.userId = data.userId
        console.log(`Client identified: ${data.userType} - ${data.userId}`)
      })

      // Handle order updates from mobile app
      socket.on("order_update", (data) => {
        console.log("Order update received:", data)
        this.broadcast("order_status_changed", data, socket.id)
      })

      // Handle kitchen updates
      socket.on("kitchen_update", (data) => {
        console.log("Kitchen update received:", data)
        this.broadcast("kitchen_status_changed", data, socket.id)
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`)
        this.connectedClients.delete(socket.id)
      })

      // Handle errors
      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error)
      })
    })
  }

  // Broadcast message to all connected clients
  broadcast(event: string, data: any, excludeSocketId?: string) {
    this.io.sockets.sockets.forEach((socket) => {
      if (excludeSocketId && socket.id === excludeSocketId) {
        return
      }
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      })
    })
  }

  // Send message to specific client
  sendToClient(socketId: string, event: string, data: any) {
    const socket = this.connectedClients.get(socketId)
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Send message to clients by user type
  sendToUserType(userType: string, event: string, data: any) {
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.data.userType === userType) {
        socket.emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        })
      }
    })
  }

  // Get connection statistics
  getStats() {
    const connectedClients = Array.from(this.io.sockets.sockets.values())
    const userTypes = connectedClients.reduce(
      (acc, socket) => {
        const userType = socket.data.userType || "unknown"
        acc[userType] = (acc[userType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalConnections: connectedClients.length,
      userTypes,
      timestamp: new Date().toISOString(),
    }
  }

  // Close WebSocket server
  close() {
    this.io.close()
    console.log("WebSocket server closed")
  }
}

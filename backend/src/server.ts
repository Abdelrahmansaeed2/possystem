import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import compression from "compression"
import morgan from "morgan"
import { orderRoutes } from "./routes/orders"
import { analyticsRoutes } from "./routes/analytics"
import { healthRoutes } from "./routes/health"
import { customerRoutes } from "./routes/customers"
import { staffRoutes } from "./routes/staff"
import { inventoryRoutes } from "./routes/inventory"
import { notificationRoutes } from "./routes/notifications"
import { errorHandler } from "./middleware/errorHandler"
import { requestLogger } from "./middleware/requestLogger"
import { validateApiKey } from "./middleware/auth"
import { WebSocketService } from "./services/WebSocketService"
import { NotificationService } from "./services/NotificationService"
import http from "http"

const app = express()
const PORT = process.env.PORT || 3001
const server = http.createServer(app)

// Initialize WebSocket service
const wsService = new WebSocketService(server)
const notificationService = new NotificationService(wsService)

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
)

app.use(compression())

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:19006", // Expo dev server
      "exp://192.168.1.100:19000", // Expo mobile
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
)

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 order submissions per minute
  message: {
    error: "Too many order submissions, please try again later.",
    retryAfter: 60,
  },
})

app.use("/api/", generalLimiter)
app.use("/api/orders", orderLimiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging middleware
app.use(morgan("combined"))
app.use(requestLogger)

// Health check (no auth required)
app.use("/health", healthRoutes)

// API routes with authentication
app.use("/api/orders", validateApiKey, orderRoutes)
app.use("/api/analytics", validateApiKey, analyticsRoutes)
app.use("/api/customers", validateApiKey, customerRoutes)
app.use("/api/staff", validateApiKey, staffRoutes)
app.use("/api/inventory", validateApiKey, inventoryRoutes)
app.use("/api/notifications", validateApiKey, notificationRoutes)

// Static file serving for images
app.use("/images", express.static("public/images"))

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Café POS Backend API",
    version: "2.0.0",
    description: "Enterprise Point of Sale System API",
    endpoints: {
      orders: "/api/orders",
      analytics: "/api/analytics",
      customers: "/api/customers",
      staff: "/api/staff",
      inventory: "/api/inventory",
      notifications: "/api/notifications",
      health: "/health",
    },
    websocket: "/ws",
    documentation: "https://docs.cafe-pos.com",
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "/health",
      "/api/orders",
      "/api/analytics",
      "/api/customers",
      "/api/staff",
      "/api/inventory",
      "/api/notifications",
    ],
  })
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully`)
  server.close(() => {
    console.log("HTTP server closed")
    wsService.close()
    process.exit(0)
  })
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Café POS Backend API running on port ${PORT}`)
  console.log(`📊 Health check available at http://localhost:${PORT}/health`)
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🌐 WebSocket server running on ws://localhost:${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`📱 CORS enabled for: ${process.env.ALLOWED_ORIGINS || "localhost origins"}`)
})

export default app

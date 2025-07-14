import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import rateLimit from "express-rate-limit"

// Import configuration and utilities
import { config } from "@/config/environment"
import { logger, logStream } from "@/utils/logger"
import { DatabaseService } from "@/services/DatabaseService"
import { RedisService } from "@/services/RedisService"
import { WebSocketService } from "@/services/WebSocketService"

// Import middleware
import { errorHandler } from "@/middleware/errorHandler"
import { requestLogger } from "@/middleware/requestLogger"
import { apiKeyMiddleware } from "@/middleware/apiKey"

// Import routes
import authRoutes from "@/routes/auth"
import orderRoutes from "@/routes/orders"
import customerRoutes from "@/routes/customers"
import inventoryRoutes from "@/routes/inventory"
import staffRoutes from "@/routes/staff"
import analyticsRoutes from "@/routes/analytics"
import paymentRoutes from "@/routes/payments"
import notificationRoutes from "@/routes/notifications"
import healthRoutes from "@/routes/health"
import uploadRoutes from "@/routes/uploads"

class CafePOSServer {
  private app: express.Application
  private server: any
  private io: SocketIOServer
  private databaseService: DatabaseService
  private redisService: RedisService
  private webSocketService: WebSocketService

  constructor() {
    this.app = express()
    this.server = createServer(this.app)
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
    })

    // Initialize services
    this.databaseService = new DatabaseService()
    this.redisService = new RedisService()
    this.webSocketService = new WebSocketService(this.io)
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    )

    // CORS configuration
    this.app.use(
      cors({
        origin: config.allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      }),
    )

    // Compression middleware
    this.app.use(compression())

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        error: "Too many requests from this IP, please try again later.",
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === "/health"
      },
    })
    this.app.use(limiter)

    // Request logging
    this.app.use(morgan("combined", { stream: logStream }))
    this.app.use(requestLogger)

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))

    // API key middleware for protected routes
    this.app.use("/api", apiKeyMiddleware)
  }

  private setupRoutes(): void {
    // Health check route (no API key required)
    this.app.use("/health", healthRoutes)

    // API routes
    const apiRouter = express.Router()

    apiRouter.use("/auth", authRoutes)
    apiRouter.use("/orders", orderRoutes)
    apiRouter.use("/customers", customerRoutes)
    apiRouter.use("/inventory", inventoryRoutes)
    apiRouter.use("/staff", staffRoutes)
    apiRouter.use("/analytics", analyticsRoutes)
    apiRouter.use("/payments", paymentRoutes)
    apiRouter.use("/notifications", notificationRoutes)
    apiRouter.use("/uploads", uploadRoutes)

    this.app.use(`/api/${config.apiVersion}`, apiRouter)

    // API documentation endpoint
    this.app.get("/api", (req, res) => {
      res.json({
        name: "Café POS Pro API",
        version: config.apiVersion,
        description: "Enterprise Point of Sale System API",
        documentation: "https://docs.cafe-pos.com",
        endpoints: {
          auth: "/api/v1/auth",
          orders: "/api/v1/orders",
          customers: "/api/v1/customers",
          inventory: "/api/v1/inventory",
          staff: "/api/v1/staff",
          analytics: "/api/v1/analytics",
          payments: "/api/v1/payments",
          notifications: "/api/v1/notifications",
          uploads: "/api/v1/uploads",
        },
        websocket: {
          url: `ws://localhost:${config.port}`,
          events: ["order:new", "order:updated", "kitchen:update", "notification"],
        },
      })
    })

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "Endpoint not found",
        message: `The requested endpoint ${req.originalUrl} does not exist`,
        availableEndpoints: "/api",
      })
    })
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler)

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Unhandled Rejection at:", { promise, reason })
      // Don't exit the process in production
      if (config.nodeEnv !== "production") {
        process.exit(1)
      }
    })

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", error)
      // Graceful shutdown
      this.gracefulShutdown("UNCAUGHT_EXCEPTION")
    })

    // Handle SIGTERM and SIGINT for graceful shutdown
    process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => this.gracefulShutdown("SIGINT"))
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.connect()
      logger.info("Database connected successfully")

      // Initialize Redis connection
      await this.redisService.connect()
      logger.info("Redis connected successfully")

      // Initialize WebSocket service
      this.webSocketService.initialize()
      logger.info("WebSocket service initialized")
    } catch (error) {
      logger.error("Failed to initialize services:", error)
      throw error
    }
  }

  private gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}. Starting graceful shutdown...`)

    // Stop accepting new connections
    this.server.close(async () => {
      logger.info("HTTP server closed")

      try {
        // Close database connections
        await this.databaseService.disconnect()
        logger.info("Database disconnected")

        // Close Redis connections
        await this.redisService.disconnect()
        logger.info("Redis disconnected")

        // Close WebSocket connections
        this.io.close()
        logger.info("WebSocket server closed")

        logger.info("Graceful shutdown completed")
        process.exit(0)
      } catch (error) {
        logger.error("Error during graceful shutdown:", error)
        process.exit(1)
      }
    })

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout")
      process.exit(1)
    }, 30000)
  }

  public async start(): Promise<void> {
    try {
      // Setup middleware
      this.setupMiddleware()

      // Initialize services
      await this.initializeServices()

      // Setup routes
      this.setupRoutes()

      // Setup error handling
      this.setupErrorHandling()

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Café POS Pro API Server started successfully!`)
        logger.info(`📍 Server running on port ${config.port}`)
        logger.info(`🌍 Environment: ${config.nodeEnv}`)
        logger.info(`📊 API Version: ${config.apiVersion}`)
        logger.info(`🔗 Health Check: http://localhost:${config.port}/health`)
        logger.info(`📚 API Documentation: http://localhost:${config.port}/api`)

        if (config.nodeEnv === "development") {
          logger.info(`🔧 Development mode - Hot reload enabled`)
          logger.info(`🐛 Debug logs enabled`)
        }
      })
    } catch (error) {
      logger.error("Failed to start server:", error)
      process.exit(1)
    }
  }
}

// Start the server
const server = new CafePOSServer()
server.start().catch((error) => {
  logger.error("Failed to start Café POS Pro API:", error)
  process.exit(1)
})

export default server

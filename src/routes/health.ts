import { Router, type Request, type Response } from "express"
import { DatabaseService } from "@/services/DatabaseService"
import { RedisService } from "@/services/RedisService"
import { config } from "@/config/environment"
import { logger } from "@/utils/logger"

const router = Router()
const databaseService = new DatabaseService()
const redisService = new RedisService()

// Basic health check
router.get("/", async (req: Request, res: Response) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || "1.0.0",
    }

    res.status(200).json(health)
  } catch (error) {
    logger.error("Health check failed:", error)
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// Detailed health check
router.get("/detailed", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now()

    // Check database health
    const dbHealthy = await databaseService.healthCheck()
    const dbResponseTime = Date.now() - startTime

    // Check Redis health
    const redisStartTime = Date.now()
    const redisHealthy = await redisService.healthCheck()
    const redisResponseTime = Date.now() - redisStartTime

    // System metrics
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const health = {
      status: dbHealthy && redisHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || "1.0.0",
      services: {
        database: {
          status: dbHealthy ? "healthy" : "unhealthy",
          responseTime: dbResponseTime,
        },
        redis: {
          status: redisHealthy ? "healthy" : "unhealthy",
          responseTime: redisResponseTime,
        },
      },
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    }

    const statusCode = health.status === "healthy" ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    logger.error("Detailed health check failed:", error)
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// Readiness probe (for Kubernetes)
router.get("/ready", async (req: Request, res: Response) => {
  try {
    const dbHealthy = await databaseService.healthCheck()
    const redisHealthy = await redisService.healthCheck()

    if (dbHealthy && redisHealthy) {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      })
    } else {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? "ready" : "not ready",
          redis: redisHealthy ? "ready" : "not ready",
        },
      })
    }
  } catch (error) {
    logger.error("Readiness check failed:", error)
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// Liveness probe (for Kubernetes)
router.get("/live", (req: Request, res: Response) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

export default router

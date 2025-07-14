import type { Request, Response, NextFunction } from "express"
import { v4 as uuidv4 } from "uuid"
import { logger, performanceLogger } from "@/utils/logger"

// Extend Request interface to include timing and ID
declare global {
  namespace Express {
    interface Request {
      requestId: string
      startTime: number
    }
  }
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = (req.headers["x-request-id"] as string) || (req.headers["x-correlation-id"] as string) || uuidv4()

  // Set request start time
  req.startTime = Date.now()

  // Add request ID to response headers
  res.setHeader("X-Request-ID", req.requestId)

  // Log incoming request
  logger.info("Incoming Request", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    contentType: req.headers["content-type"],
    contentLength: req.headers["content-length"],
    timestamp: new Date().toISOString(),
  })

  // Start performance monitoring
  const perfMonitor = performanceLogger.start(`${req.method} ${req.path}`)

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function (chunk?: any, encoding?: any) {
    // Calculate response time
    const responseTime = Date.now() - req.startTime

    // End performance monitoring
    perfMonitor.end({
      statusCode: res.statusCode,
      contentLength: res.get("content-length"),
      requestId: req.requestId,
    })

    // Log response
    logger.info("Outgoing Response", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get("content-length"),
      timestamp: new Date().toISOString(),
    })

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn("Slow Request Detected", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        responseTime,
        statusCode: res.statusCode,
      })
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding)
  }

  next()
}

export default requestLogger

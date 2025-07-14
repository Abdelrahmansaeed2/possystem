import type { Request, Response, NextFunction } from "express"
import { config } from "@/config/environment"
import { AuthenticationError } from "@/middleware/errorHandler"
import { loggers } from "@/utils/logger"

// API key validation middleware
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip API key validation for certain routes
  const skipRoutes = ["/health", "/api/auth/login", "/api/auth/register"]
  const shouldSkip = skipRoutes.some((route) => req.path.startsWith(route))

  if (shouldSkip) {
    return next()
  }

  // Extract API key from headers
  const apiKey = req.headers["x-api-key"] as string

  if (!apiKey) {
    loggers.security("missing_api_key", req.ip, {
      path: req.path,
      method: req.method,
      userAgent: req.headers["user-agent"],
    })

    return next(new AuthenticationError("API key required"))
  }

  // Validate API key
  if (apiKey !== config.apiKey) {
    loggers.security("invalid_api_key", req.ip, {
      providedKey: apiKey.substring(0, 8) + "...",
      path: req.path,
      method: req.method,
      userAgent: req.headers["user-agent"],
    })

    return next(new AuthenticationError("Invalid API key"))
  }

  // Log successful API key validation
  loggers.security("api_key_validated", req.ip, {
    path: req.path,
    method: req.method,
  })

  next()
}

export default apiKeyMiddleware

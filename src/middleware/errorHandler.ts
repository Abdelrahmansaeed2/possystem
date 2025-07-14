import type { Request, Response, NextFunction } from "express"
import { logger } from "@/utils/logger"
import { config } from "@/config/environment"

// Custom error class
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public code?: string

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403)
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409)
    this.name = "ConflictError"
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429)
    this.name = "RateLimitError"
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500)
    this.name = "DatabaseError"
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "External service unavailable") {
    super(message, 502)
    this.name = "ExternalServiceError"
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string
    code?: string
    statusCode: number
    timestamp: string
    path: string
    method: string
    requestId?: string
    details?: any
    stack?: string
  }
}

// Error handler middleware
export const errorHandler = (error: Error | AppError, req: Request, res: Response, next: NextFunction): void => {
  // Default error values
  let statusCode = 500
  let message = "Internal Server Error"
  let isOperational = false
  let code = "INTERNAL_ERROR"

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    isOperational = error.isOperational
    code = error.name
  } else if (error.name === "ValidationError") {
    statusCode = 400
    message = error.message
    code = "VALIDATION_ERROR"
    isOperational = true
  } else if (error.name === "CastError") {
    statusCode = 400
    message = "Invalid ID format"
    code = "INVALID_ID"
    isOperational = true
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Invalid token"
    code = "INVALID_TOKEN"
    isOperational = true
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401
    message = "Token expired"
    code = "TOKEN_EXPIRED"
    isOperational = true
  } else if (error.name === "MulterError") {
    statusCode = 400
    message = `File upload error: ${error.message}`
    code = "FILE_UPLOAD_ERROR"
    isOperational = true
  }

  // Generate request ID for tracking
  const requestId =
    (req.headers["x-request-id"] as string) ||
    (req.headers["x-correlation-id"] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Log error details
  const errorContext = {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== "GET" ? req.body : undefined,
    headers: {
      "user-agent": req.headers["user-agent"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
      authorization: req.headers.authorization ? "[REDACTED]" : undefined,
    },
    user: (req as any).user ? { id: (req as any).user.id, role: (req as any).user.role } : undefined,
    ip: req.ip,
    statusCode,
    isOperational,
  }

  // Log based on error severity
  if (statusCode >= 500) {
    logger.error(`Server Error [${statusCode}]: ${message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: errorContext,
    })
  } else if (statusCode >= 400) {
    logger.warn(`Client Error [${statusCode}]: ${message}`, {
      error: {
        name: error.name,
        message: error.message,
      },
      context: errorContext,
    })
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId,
    },
  }

  // Add stack trace in development
  if (config.nodeEnv === "development") {
    errorResponse.error.stack = error.stack
    errorResponse.error.details = errorContext
  }

  // Send error response
  res.status(statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

// Validation error formatter
export const formatValidationError = (errors: any[]): string => {
  return errors
    .map((error) => {
      if (error.path) {
        return `${error.path}: ${error.msg}`
      }
      return error.msg || error.message
    })
    .join(", ")
}

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  // Handle Prisma errors
  if (error.code === "P2002") {
    return new ConflictError("A record with this data already exists")
  }

  if (error.code === "P2025") {
    return new NotFoundError("Record not found")
  }

  if (error.code === "P2003") {
    return new ValidationError("Foreign key constraint failed")
  }

  if (error.code === "P2014") {
    return new ValidationError("Invalid ID provided")
  }

  // Handle general database errors
  if (error.name === "PrismaClientKnownRequestError") {
    return new DatabaseError(`Database operation failed: ${error.message}`)
  }

  if (error.name === "PrismaClientUnknownRequestError") {
    return new DatabaseError("Unknown database error occurred")
  }

  if (error.name === "PrismaClientRustPanicError") {
    return new DatabaseError("Database engine error")
  }

  if (error.name === "PrismaClientInitializationError") {
    return new DatabaseError("Database connection failed")
  }

  if (error.name === "PrismaClientValidationError") {
    return new ValidationError("Invalid data provided")
  }

  // Default database error
  return new DatabaseError("Database operation failed")
}

// Rate limit error handler
export const handleRateLimitError = (req: Request, res: Response) => {
  const error = new RateLimitError("Too many requests, please try again later")

  logger.warn("Rate limit exceeded", {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.headers["user-agent"],
  })

  res.status(429).json({
    error: {
      message: error.message,
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: 900, // 15 minutes in seconds
    },
  })
}

export default errorHandler

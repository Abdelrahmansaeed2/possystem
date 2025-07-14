import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"
import { config } from "@/config/environment"

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`

    if (stack) {
      log += `\n${stack}`
    }

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }

    return log
  }),
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`

    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }

    return log
  }),
)

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: "cafe-pos-api" },
  transports: [
    // Console transport with different format for development
    new winston.transports.Console({
      format: config.nodeEnv === "development" ? consoleFormat : logFormat,
      level: config.nodeEnv === "development" ? "debug" : config.logging.level,
    }),

    // Daily rotating file transport for all logs
    new DailyRotateFile({
      filename: config.logging.file.replace(".log", "-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      level: config.logging.level,
      format: logFormat,
    }),

    // Separate daily rotating file for errors
    new DailyRotateFile({
      filename: config.logging.file.replace(".log", "-error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      level: "error",
      format: logFormat,
    }),
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: config.logging.file.replace(".log", "-exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],

  rejectionHandlers: [
    new DailyRotateFile({
      filename: config.logging.file.replace(".log", "-rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
})

// Add Sentry transport for production error tracking
if (config.nodeEnv === "production" && config.logging.sentryDsn) {
  // Note: You would need to install @sentry/node and @sentry/integrations
  // const Sentry = require('@sentry/node')
  // Sentry.init({ dsn: config.logging.sentryDsn })
  // logger.add(new SentryTransport({ level: 'error' }))
}

// Create a stream for Morgan HTTP logging
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim())
  },
}

// Helper functions for structured logging
export const loggers = {
  auth: (action: string, userId?: string, details?: any) => {
    logger.info("Auth Event", {
      category: "auth",
      action,
      userId,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  order: (action: string, orderId: string, details?: any) => {
    logger.info("Order Event", {
      category: "order",
      action,
      orderId,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  payment: (action: string, amount: number, method: string, details?: any) => {
    logger.info("Payment Event", {
      category: "payment",
      action,
      amount,
      method,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  inventory: (action: string, itemId: string, details?: any) => {
    logger.info("Inventory Event", {
      category: "inventory",
      action,
      itemId,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  customer: (action: string, customerId: string, details?: any) => {
    logger.info("Customer Event", {
      category: "customer",
      action,
      customerId,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  staff: (action: string, staffId: string, details?: any) => {
    logger.info("Staff Event", {
      category: "staff",
      action,
      staffId,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  security: (event: string, ip: string, details?: any) => {
    logger.warn("Security Event", {
      category: "security",
      event,
      ip,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  performance: (operation: string, duration: number, details?: any) => {
    logger.info("Performance Metric", {
      category: "performance",
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  websocket: (event: string, socketId: string, details?: any) => {
    logger.debug("WebSocket Event", {
      category: "websocket",
      event,
      socketId,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  database: (operation: string, table: string, duration?: number, details?: any) => {
    logger.debug("Database Operation", {
      category: "database",
      operation,
      table,
      duration,
      details,
      timestamp: new Date().toISOString(),
    })
  },

  error: (error: Error, context?: any) => {
    logger.error("Application Error", {
      category: "error",
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    })
  },

  // Business logic specific loggers
  business: {
    orderCreated: (orderId: string, customerId: string, total: number) => {
      logger.info("Business Event: Order Created", {
        category: "business",
        event: "order_created",
        orderId,
        customerId,
        total,
        timestamp: new Date().toISOString(),
      })
    },

    paymentProcessed: (orderId: string, amount: number, method: string, success: boolean) => {
      logger.info("Business Event: Payment Processed", {
        category: "business",
        event: "payment_processed",
        orderId,
        amount,
        method,
        success,
        timestamp: new Date().toISOString(),
      })
    },

    inventoryLowStock: (itemId: string, currentStock: number, threshold: number) => {
      logger.warn("Business Event: Low Stock Alert", {
        category: "business",
        event: "low_stock_alert",
        itemId,
        currentStock,
        threshold,
        timestamp: new Date().toISOString(),
      })
    },

    customerRegistered: (customerId: string, email: string) => {
      logger.info("Business Event: Customer Registered", {
        category: "business",
        event: "customer_registered",
        customerId,
        email,
        timestamp: new Date().toISOString(),
      })
    },
  },
}

// Performance monitoring helper
export const performanceLogger = {
  start: (operation: string) => {
    const startTime = Date.now()
    return {
      end: (details?: any) => {
        const duration = Date.now() - startTime
        loggers.performance(operation, duration, details)
        return duration
      },
    }
  },
}

export default logger

import dotenv from "dotenv"
import { z } from "zod"

// Load environment variables
dotenv.config()

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3001),
  API_VERSION: z.string().default("v1"),

  // Database
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  DATABASE_POOL_SIZE: z.string().transform(Number).default(10),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default(0),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // API Security
  API_KEY: z.string().min(1, "API key is required"),
  ENCRYPTION_KEY: z.string().min(32, "Encryption key must be at least 32 characters"),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:19006"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE: z.string().default("./logs/app.log"),
  LOG_MAX_SIZE: z.string().transform(Number).default(5242880), // 5MB
  LOG_MAX_FILES: z.string().transform(Number).default(5),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Payment (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default(5242880), // 5MB
  UPLOAD_PATH: z.string().default("./uploads"),
  ALLOWED_FILE_TYPES: z.string().default("image/jpeg,image/png,image/gif,application/pdf"),

  // Monitoring
  SENTRY_DSN: z.string().optional(),

  // External APIs
  WEATHER_API_KEY: z.string().optional(),
  MAPS_API_KEY: z.string().optional(),

  // Backup
  BACKUP_SCHEDULE: z.string().default("0 2 * * *"),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default(30),
  S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),

  // Feature Flags
  ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === "true")
    .default(true),
  ENABLE_NOTIFICATIONS: z
    .string()
    .transform((val) => val === "true")
    .default(true),
  ENABLE_LOYALTY_PROGRAM: z
    .string()
    .transform((val) => val === "true")
    .default(true),
  ENABLE_INVENTORY_TRACKING: z
    .string()
    .transform((val) => val === "true")
    .default(true),
  ENABLE_MULTI_LOCATION: z
    .string()
    .transform((val) => val === "true")
    .default(false),
})

// Validate environment variables
const env = envSchema.parse(process.env)

// Export configuration object
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,

  // Database
  databaseUrl: env.DATABASE_URL,
  databasePoolSize: env.DATABASE_POOL_SIZE,

  // Redis
  redisUrl: env.REDIS_URL,
  redisPassword: env.REDIS_PASSWORD,
  redisDb: env.REDIS_DB,

  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,

  // API Security
  apiKey: env.API_KEY,
  encryptionKey: env.ENCRYPTION_KEY,

  // CORS
  allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),

  // Rate Limiting
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
    sentryDsn: env.SENTRY_DSN,
  },

  // Email
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  fromEmail: env.FROM_EMAIL,

  // SMS
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },

  // Payment
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  // File Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    uploadPath: env.UPLOAD_PATH,
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(",").map((type) => type.trim()),
  },

  // External APIs
  externalApis: {
    weatherApiKey: env.WEATHER_API_KEY,
    mapsApiKey: env.MAPS_API_KEY,
  },

  // Backup
  backup: {
    schedule: env.BACKUP_SCHEDULE,
    retentionDays: env.BACKUP_RETENTION_DAYS,
    s3Bucket: env.S3_BUCKET,
    awsAccessKeyId: env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    awsRegion: env.AWS_REGION,
  },

  // Feature Flags
  features: {
    analytics: env.ENABLE_ANALYTICS,
    notifications: env.ENABLE_NOTIFICATIONS,
    loyaltyProgram: env.ENABLE_LOYALTY_PROGRAM,
    inventoryTracking: env.ENABLE_INVENTORY_TRACKING,
    multiLocation: env.ENABLE_MULTI_LOCATION,
  },
} as const

// Type for configuration
export type Config = typeof config

// Validate required environment variables for production
if (config.nodeEnv === "production") {
  const requiredForProduction = ["DATABASE_URL", "JWT_SECRET", "API_KEY", "ENCRYPTION_KEY"]

  for (const key of requiredForProduction) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable for production: ${key}`)
    }
  }
}

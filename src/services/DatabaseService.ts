import { PrismaClient } from "@prisma/client"
import { config } from "@/config/environment"
import { logger, loggers } from "@/utils/logger"

export class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient
  private isConnected = false

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
      log: [
        { level: "query", emit: "event" },
        { level: "error", emit: "event" },
        { level: "info", emit: "event" },
        { level: "warn", emit: "event" },
      ],
    })

    // Set up Prisma logging
    this.setupLogging()
  }

  // Singleton pattern
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private setupLogging(): void {
    this.prisma.$on("query", (e) => {
      loggers.database("query", "unknown", e.duration, {
        query: e.query,
        params: e.params,
        target: e.target,
      })
    })

    this.prisma.$on("error", (e) => {
      loggers.database("error", "unknown", undefined, {
        message: e.message,
        target: e.target,
      })
    })

    this.prisma.$on("info", (e) => {
      loggers.database("info", "unknown", undefined, {
        message: e.message,
        target: e.target,
      })
    })

    this.prisma.$on("warn", (e) => {
      loggers.database("warn", "unknown", undefined, {
        message: e.message,
        target: e.target,
      })
    })
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      this.isConnected = true
      logger.info("Database connected successfully")
    } catch (error) {
      logger.error("Failed to connect to database:", error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      this.isConnected = false
      logger.info("Database disconnected successfully")
    } catch (error) {
      logger.error("Failed to disconnect from database:", error)
      throw error
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error("Database health check failed:", error)
      return false
    }
  }

  public getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error("Database not connected. Call connect() first.")
    }
    return this.prisma
  }

  public async executeTransaction<T>(operations: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (prisma) => {
      return await operations(prisma)
    })
  }

  // Database utility methods
  public async getTableStats(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      `
      return stats
    } catch (error) {
      logger.error("Failed to get table stats:", error)
      throw error
    }
  }

  public async getDatabaseSize(): Promise<any> {
    try {
      const size = await this.prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size;
      `
      return size
    } catch (error) {
      logger.error("Failed to get database size:", error)
      throw error
    }
  }

  public async getConnectionCount(): Promise<any> {
    try {
      const connections = await this.prisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active';
      `
      return connections
    } catch (error) {
      logger.error("Failed to get connection count:", error)
      throw error
    }
  }
}

export default DatabaseService

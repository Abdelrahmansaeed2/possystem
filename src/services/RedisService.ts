import { createClient, type RedisClientType } from "redis"
import { config } from "@/config/environment"
import { logger, loggers } from "@/utils/logger"

export class RedisService {
  private static instance: RedisService
  private client: RedisClientType
  private isConnected = false

  constructor() {
    this.client = createClient({
      url: config.redisUrl,
      password: config.redisPassword,
      database: config.redisDb,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error("Redis reconnection failed after 10 attempts")
            return false
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })

    this.setupEventHandlers()
  }

  // Singleton pattern
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService()
    }
    return RedisService.instance
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      logger.info("Redis client connected")
    })

    this.client.on("ready", () => {
      logger.info("Redis client ready")
      this.isConnected = true
    })

    this.client.on("error", (error) => {
      logger.error("Redis client error:", error)
      this.isConnected = false
    })

    this.client.on("end", () => {
      logger.info("Redis client disconnected")
      this.isConnected = false
    })

    this.client.on("reconnecting", () => {
      logger.info("Redis client reconnecting...")
    })
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect()
      logger.info("Redis connected successfully")
    } catch (error) {
      logger.error("Failed to connect to Redis:", error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect()
      logger.info("Redis disconnected successfully")
    } catch (error) {
      logger.error("Failed to disconnect from Redis:", error)
      throw error
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping()
      return result === "PONG"
    } catch (error) {
      logger.error("Redis health check failed:", error)
      return false
    }
  }

  // Basic Redis operations
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error)
      throw error
    }
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value)
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error)
      throw error
    }
  }

  public async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await this.client.setEx(key, seconds, value)
    } catch (error) {
      logger.error(`Redis SETEX error for key ${key}:`, error)
      throw error
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key)
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error)
      throw error
    }
  }

  public async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key)
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error)
      throw error
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return await this.client.expire(key, seconds)
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error)
      throw error
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, error)
      throw error
    }
  }

  // Hash operations
  public async hget(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error)
      throw error
    }
  }

  public async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value)
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error)
      throw error
    }
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error)
      throw error
    }
  }

  public async hdel(key: string, field: string): Promise<number> {
    try {
      return await this.client.hDel(key, field)
    } catch (error) {
      logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error)
      throw error
    }
  }

  // List operations
  public async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values)
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error)
      throw error
    }
  }

  public async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rPush(key, values)
    } catch (error) {
      logger.error(`Redis RPUSH error for key ${key}:`, error)
      throw error
    }
  }

  public async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lPop(key)
    } catch (error) {
      logger.error(`Redis LPOP error for key ${key}:`, error)
      throw error
    }
  }

  public async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key)
    } catch (error) {
      logger.error(`Redis RPOP error for key ${key}:`, error)
      throw error
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop)
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error)
      throw error
    }
  }

  // Set operations
  public async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members)
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error)
      throw error
    }
  }

  public async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sRem(key, members)
    } catch (error) {
      logger.error(`Redis SREM error for key ${key}:`, error)
      throw error
    }
  }

  public async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key)
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error)
      throw error
    }
  }

  public async sismember(key: string, member: string): Promise<boolean> {
    try {
      return await this.client.sIsMember(key, member)
    } catch (error) {
      logger.error(`Redis SISMEMBER error for key ${key}, member ${member}:`, error)
      throw error
    }
  }

  // Sorted set operations
  public async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.client.zAdd(key, { score, value: member })
    } catch (error) {
      logger.error(`Redis ZADD error for key ${key}:`, error)
      throw error
    }
  }

  public async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zRange(key, start, stop)
    } catch (error) {
      logger.error(`Redis ZRANGE error for key ${key}:`, error)
      throw error
    }
  }

  public async zrem(key: string, member: string): Promise<number> {
    try {
      return await this.client.zRem(key, member)
    } catch (error) {
      logger.error(`Redis ZREM error for key ${key}, member ${member}:`, error)
      throw error
    }
  }

  // Cache helper methods
  public async cache<T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get(key)
      if (cached) {
        return JSON.parse(cached)
      }

      // Fetch data and cache it
      const data = await fetcher()
      await this.setex(key, ttl, JSON.stringify(data))

      return data
    } catch (error) {
      logger.error(`Cache operation error for key ${key}:`, error)
      // Fallback to fetcher if cache fails
      return await fetcher()
    }
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(keys)
        logger.info(`Invalidated ${keys.length} keys matching pattern: ${pattern}`)
      }
    } catch (error) {
      logger.error(`Failed to invalidate pattern ${pattern}:`, error)
      throw error
    }
  }

  // Rate limiting helper
  public async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const current = await this.get(key)
      const now = Date.now()
      const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000

      if (!current) {
        await this.setex(key, windowSeconds, "1")
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: windowStart + windowSeconds * 1000,
        }
      }

      const count = Number.parseInt(current)
      if (count >= limit) {
        const ttl = await this.ttl(key)
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + ttl * 1000,
        }
      }

      await this.client.incr(key)
      return {
        allowed: true,
        remaining: limit - count - 1,
        resetTime: windowStart + windowSeconds * 1000,
      }
    } catch (error) {
      logger.error(`Rate limit error for key ${key}:`, error)
      // Allow request if rate limiting fails
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 }
    }
  }

  // Session management
  public async createSession(userId: string, sessionData: any, ttl = 86400): Promise<void> {
    try {
      await this.setex(`session:${userId}`, ttl, JSON.stringify(sessionData))
      loggers.auth("session_created", userId, { ttl })
    } catch (error) {
      logger.error(`Failed to create session for user ${userId}:`, error)
      throw error
    }
  }

  public async getSession(userId: string): Promise<any | null> {
    try {
      const session = await this.get(`session:${userId}`)
      return session ? JSON.parse(session) : null
    } catch (error) {
      logger.error(`Failed to get session for user ${userId}:`, error)
      return null
    }
  }

  public async deleteSession(userId: string): Promise<void> {
    try {
      await this.del(`session:${userId}`)
      loggers.auth("session_deleted", userId)
    } catch (error) {
      logger.error(`Failed to delete session for user ${userId}:`, error)
      throw error
    }
  }

  // Statistics
  public async getStats(): Promise<any> {
    try {
      const info = await this.client.info()
      return {
        connected: this.isConnected,
        info: info,
      }
    } catch (error) {
      logger.error("Failed to get Redis stats:", error)
      return { connected: false, error: error.message }
    }
  }
}

export default RedisService

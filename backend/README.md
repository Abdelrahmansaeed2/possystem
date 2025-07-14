# 🔧 Café POS Backend API

A robust Express.js backend API with comprehensive authentication, real-time capabilities, and enterprise-grade security features.

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT with bcryptjs
- **Security**: Helmet, CORS, Rate Limiting
- **WebSocket**: Socket.io for real-time updates
- **Validation**: Joi/Zod for request validation
- **Logging**: Morgan + Winston
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI/Swagger

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (optional, for production)
- Redis (optional, for caching)

### Installation

1. **Navigate to backend directory**
   \`\`\`bash
   cd backend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Configuration**
   Create `.env` file:
   \`\`\`env
   # Server Configuration
   NODE_ENV=development
   PORT=3001
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters
   API_KEY=your-secure-api-key-here
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
   
   # Database (Optional)
   DATABASE_URL=postgresql://user:password@localhost:5432/cafe_pos
   
   # Redis (Optional)
   REDIS_URL=redis://localhost:6379
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   \`\`\`

4. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Verify installation**
   \`\`\`bash
   curl http://localhost:3001/health
   \`\`\`

### Production Setup

1. **Build TypeScript**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start production server**
   \`\`\`bash
   npm start
   \`\`\`

## 🏗️ Architecture & Design Decisions

### Overall Approach

The backend follows a **layered architecture** with clear separation of concerns, designed for scalability, maintainability, and security:

#### **1. Middleware-First Design**
\`\`\`typescript
// Security-first approach with comprehensive middleware stack
app.use(helmet()) // Security headers
app.use(cors()) // Cross-origin protection
app.use(rateLimit()) // DDoS protection
app.use(compression()) // Response compression
app.use(morgan()) // Request logging
app.use(validateApiKey) // Authentication
\`\`\`

**Rationale**: Each request passes through multiple security layers before reaching business logic, ensuring comprehensive protection against common attacks.

#### **2. Modular Route Architecture**
\`\`\`
backend/src/
├── routes/
│   ├── orders.ts      # Order management endpoints
│   ├── customers.ts   # Customer CRUD operations
│   ├── inventory.ts   # Stock management
│   ├── analytics.ts   # Reporting and metrics
│   └── auth.ts        # Authentication endpoints
├── middleware/
│   ├── auth.ts        # JWT validation
│   ├── validation.ts  # Request validation
│   └── errorHandler.ts # Global error handling
└── services/
    ├── OrderService.ts    # Business logic
    ├── WebSocketService.ts # Real-time updates
    └── NotificationService.ts # Push notifications
\`\`\`

**Rationale**: Modular design allows for independent scaling, testing, and maintenance of different system components.

#### **3. Service Layer Pattern**
\`\`\`typescript
// Business logic separated from HTTP concerns
class OrderService {
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // Validation
    await this.validateOrder(orderData)
    
    // Business logic
    const order = await this.processOrder(orderData)
    
    // Side effects
    await this.notifyKitchen(order)
    await this.updateInventory(order)
    
    return order
  }
}
\`\`\`

**Rationale**: Separating business logic from HTTP handling makes the code more testable, reusable, and easier to maintain.

#### **4. Error-First Design**
\`\`\`typescript
// Comprehensive error handling with proper HTTP status codes
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof ValidationError ? 400 :
                    err instanceof AuthenticationError ? 401 :
                    err instanceof AuthorizationError ? 403 :
                    err instanceof NotFoundError ? 404 : 500

  res.status(statusCode).json({
    error: err.name,
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  })
}
\`\`\`

**Rationale**: Consistent error handling improves debugging, monitoring, and client-side error handling.

### Key Design Decisions

#### **1. JWT Authentication Strategy**
- **HTTP-only cookies** for web clients (XSS protection)
- **Bearer tokens** for mobile clients (flexibility)
- **Refresh token rotation** for enhanced security
- **Role-based permissions** with granular control

#### **2. Real-time Architecture**
\`\`\`typescript
// WebSocket service for live updates
class WebSocketService {
  broadcast(event: string, data: any, room?: string) {
    if (room) {
      this.io.to(room).emit(event, data)
    } else {
      this.io.emit(event, data)
    }
  }
}
\`\`\`

**Benefits**: Enables real-time order updates, kitchen displays, and live analytics without polling.

#### **3. Validation Strategy**
\`\`\`typescript
// Schema-based validation with detailed error messages
const orderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  customerId: Joi.string().uuid().optional(),
  paymentMethod: Joi.string().valid('cash', 'card', 'digital').required()
})
\`\`\`

**Benefits**: Prevents invalid data from entering the system and provides clear feedback to clients.

#### **4. Caching Strategy**
- **In-memory caching** for frequently accessed data
- **Redis caching** for session data and temporary storage
- **HTTP caching headers** for static resources
- **Database query optimization** with proper indexing

## 🔄 Offline Logic & Sync Strategy

### Sync Architecture
\`\`\`typescript
// Conflict resolution with timestamp-based merging
const syncOrder = async (clientOrder: Order, serverOrder?: Order) => {
  if (!serverOrder) {
    // New order from client
    return await createOrder(clientOrder)
  }
  
  if (clientOrder.updatedAt > serverOrder.updatedAt) {
    // Client has newer version
    return await updateOrder(serverOrder.id, clientOrder)
  }
  
  // Server version is newer, return server data
  return serverOrder
}
\`\`\`

### Batch Processing
\`\`\`typescript
// Process multiple sync operations efficiently
const processSyncBatch = async (operations: SyncOperation[]) => {
  const results = await Promise.allSettled(
    operations.map(op => processSyncOperation(op))
  )
  
  return results.map((result, index) => ({
    operation: operations[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }))
}
\`\`\`

## 🌐 Real-World Deployment & Scaling

### Infrastructure Strategy

#### **1. Containerization**
\`\`\`dockerfile
# Multi-stage Docker build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
\`\`\`

#### **2. Kubernetes Deployment**
\`\`\`yaml
# Horizontal Pod Autoscaler for dynamic scaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cafe-pos-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cafe-pos-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
\`\`\`

#### **3. Database Scaling Strategy**
- **Read Replicas**: Distribute read queries across multiple database instances
- **Connection Pooling**: Manage database connections efficiently
- **Query Optimization**: Index frequently queried fields
- **Data Partitioning**: Partition large tables by date or location

#### **4. Caching Architecture**
\`\`\`typescript
// Multi-layer caching strategy
class CacheService {
  async get(key: string): Promise<any> {
    // L1: In-memory cache (fastest)
    let data = this.memoryCache.get(key)
    if (data) return data
    
    // L2: Redis cache (fast)
    data = await this.redisCache.get(key)
    if (data) {
      this.memoryCache.set(key, data, 60) // Cache for 1 minute
      return data
    }
    
    // L3: Database (slowest)
    data = await this.database.get(key)
    if (data) {
      await this.redisCache.set(key, data, 300) // Cache for 5 minutes
      this.memoryCache.set(key, data, 60)
      return data
    }
    
    return null
  }
}
\`\`\`

### Performance Optimizations

#### **1. API Response Optimization**
- **Pagination**: Limit response sizes with cursor-based pagination
- **Field Selection**: Allow clients to specify required fields
- **Compression**: Gzip responses to reduce bandwidth
- **ETags**: Implement conditional requests for caching

#### **2. Database Optimization**
\`\`\`sql
-- Optimized queries with proper indexing
CREATE INDEX CONCURRENTLY idx_orders_timestamp ON orders(created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status) WHERE status IN ('pending', 'preparing');
CREATE INDEX CONCURRENTLY idx_customers_email ON customers(email) WHERE email IS NOT NULL;
\`\`\`

#### **3. Monitoring & Observability**
\`\`\`typescript
// Comprehensive logging and metrics
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Performance metrics
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent')
    })
  })
  
  next()
}
\`\`\`

### Security at Scale

#### **1. Rate Limiting Strategy**
\`\`\`typescript
// Tiered rate limiting based on endpoint sensitivity
const createRateLimiter = (windowMs: number, max: number) => rateLimit({
  windowMs,
  max,
  message: { error: 'Too many requests', retryAfter: windowMs / 1000 },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/auth', createRateLimiter(15 * 60 * 1000, 5)) // 5 auth attempts per 15 minutes
app.use('/api/orders', createRateLimiter(60 * 1000, 30)) // 30 orders per minute
app.use('/api/', createRateLimiter(15 * 60 * 1000, 100)) // 100 general requests per 15 minutes
\`\`\`

#### **2. Input Validation & Sanitization**
\`\`\`typescript
// Comprehensive input validation
const validateOrder = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    items: Joi.array().items(Joi.object({
      drinkId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).max(10).required(),
      customizations: Joi.array().items(Joi.string()).max(5)
    })).min(1).max(20).required(),
    customerId: Joi.string().uuid().optional(),
    notes: Joi.string().max(500).optional()
  })
  
  const { error, value } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(d => d.message)
    })
  }
  
  req.body = value // Use sanitized data
  next()
}
\`\`\`

This backend architecture provides a solid foundation for a production-ready café POS system that can scale to handle thousands of concurrent users while maintaining security, performance, and reliability.
\`\`\`

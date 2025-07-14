import { type NextRequest, NextResponse } from "next/server"

interface OrderItem {
  drinkId: string
  drinkName: string
  size: string
  price: number
  quantity: number
  customizations?: string[]
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  loyaltyPoints: number
}

interface Order {
  id: string
  items: OrderItem[]
  total: number
  subtotal: number
  tax: number
  discount: number
  timestamp: string
  status: "pending" | "submitted" | "preparing" | "ready" | "completed" | "cancelled"
  customer?: Customer
  paymentMethod?: "cash" | "card" | "digital"
  paymentStatus: "pending" | "paid" | "failed"
  baristaId?: string
  estimatedTime?: number
}

// Enhanced in-memory storage with mock data
const orders: Order[] = [
  {
    id: "order-1703123456789",
    items: [
      { drinkId: "latte", drinkName: "Latte", size: "Medium", price: 5.5, quantity: 2 },
      { drinkId: "espresso", drinkName: "Espresso", size: "Double", price: 3.5, quantity: 1 },
    ],
    subtotal: 14.5,
    tax: 1.16,
    discount: 0,
    total: 15.66,
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: "completed",
    customer: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      loyaltyPoints: 150,
    },
    paymentMethod: "card",
    paymentStatus: "paid",
    baristaId: "1",
    estimatedTime: 9,
  },
  {
    id: "order-1703123456790",
    items: [{ drinkId: "iced-americano", drinkName: "Iced Americano", size: "Large", price: 5.5, quantity: 1 }],
    subtotal: 5.5,
    tax: 0.44,
    discount: 0,
    total: 5.94,
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    status: "preparing",
    paymentMethod: "digital",
    paymentStatus: "paid",
    baristaId: "1",
    estimatedTime: 3,
  },
  {
    id: "order-1703123456791",
    items: [
      { drinkId: "cappuccino", drinkName: "Cappuccino", size: "Small", price: 4.0, quantity: 1 },
      { drinkId: "chai-latte", drinkName: "Chai Latte", size: "Medium", price: 5.0, quantity: 1 },
    ],
    subtotal: 9.0,
    tax: 0.72,
    discount: 0.9, // 10% loyalty discount
    total: 8.82,
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    status: "ready",
    customer: {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1234567891",
      loyaltyPoints: 75,
    },
    paymentMethod: "cash",
    paymentStatus: "paid",
    baristaId: "1",
    estimatedTime: 6,
  },
]

// Enhanced validation
function validateOrder(order: any): string | null {
  if (!order.id || typeof order.id !== "string") {
    return "Order ID is required and must be a string"
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    return "Order must contain at least one item"
  }

  if (typeof order.total !== "number" || order.total <= 0) {
    return "Order total must be a positive number"
  }

  if (typeof order.subtotal !== "number" || order.subtotal <= 0) {
    return "Order subtotal must be a positive number"
  }

  if (typeof order.tax !== "number" || order.tax < 0) {
    return "Order tax must be a non-negative number"
  }

  if (typeof order.discount !== "number" || order.discount < 0) {
    return "Order discount must be a non-negative number"
  }

  if (!order.timestamp || isNaN(Date.parse(order.timestamp))) {
    return "Valid timestamp is required"
  }

  // Validate each item
  for (const item of order.items) {
    if (!item.drinkName || typeof item.drinkName !== "string") {
      return "Each item must have a valid drink name"
    }

    if (!item.size || typeof item.size !== "string") {
      return "Each item must have a valid size"
    }

    if (typeof item.price !== "number" || item.price <= 0) {
      return "Each item must have a valid price"
    }

    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      return "Each item must have a valid quantity"
    }
  }

  // Validate customer if provided
  if (order.customer) {
    if (!order.customer.name || typeof order.customer.name !== "string") {
      return "Customer name must be a valid string"
    }
    if (!order.customer.email || typeof order.customer.email !== "string") {
      return "Customer email must be a valid string"
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Validate the order
    const validationError = validateOrder(orderData)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Create the order with server timestamp
    const order: Order = {
      ...orderData,
      timestamp: new Date().toISOString(),
      status: orderData.status || "submitted",
    }

    // Store in memory (in production: save to database)
    orders.push(order)

    console.log(`Order received: ${order.id} - $${order.total.toFixed(2)} - Status: ${order.status}`)

    // Simulate inventory updates
    if (order.items) {
      order.items.forEach((item) => {
        console.log(`Inventory: ${item.drinkName} (${item.size}) - ${item.quantity} units sold`)
      })
    }

    // Simulate real-time notifications (in production: WebSocket/SSE)
    setTimeout(() => {
      console.log(`Real-time update: Order ${order.id} status changed to preparing`)
    }, 5000)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      timestamp: order.timestamp,
      status: order.status,
      estimatedTime: order.estimatedTime,
      message: "Order submitted successfully",
    })
  } catch (error) {
    console.error("Error processing order:", error)
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredOrders = [...orders]

    // Filter by status if provided
    if (status && status !== "all") {
      filteredOrders = filteredOrders.filter((order) => order.status === status)
    }

    // Sort by timestamp (newest first)
    filteredOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedOrders = filteredOrders.slice(offset, offset + limit)

    // Calculate analytics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0

    // Calculate status distribution
    const statusCounts = filteredOrders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        total: filteredOrders.length,
        limit,
        offset,
        hasMore: offset + limit < filteredOrders.length,
      },
      analytics: {
        totalRevenue,
        averageOrderValue,
        statusCounts,
        totalOrders: filteredOrders.length,
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

/*
ENHANCED PRODUCTION FEATURES:

1. DATABASE INTEGRATION:
   - PostgreSQL with Prisma ORM for complex queries
   - Redis for caching frequently accessed data
   - Full-text search capabilities for order/customer search

2. REAL-TIME FEATURES:
   - WebSocket connections for live order updates
   - Server-Sent Events for admin dashboard notifications
   - Push notifications for mobile devices

3. ADVANCED ANALYTICS:
   - Time-series data for sales trends
   - Customer behavior analysis
   - Inventory forecasting
   - Staff performance metrics

4. PAYMENT PROCESSING:
   - Stripe/Square integration for card payments
   - Digital wallet support (Apple Pay, Google Pay)
   - Split payments and tips handling
   - Refund and void capabilities

5. INVENTORY MANAGEMENT:
   - Real-time stock tracking
   - Automatic reorder points
   - Supplier integration
   - Waste tracking and reporting

6. MULTI-LOCATION SUPPORT:
   - Location-based order routing
   - Centralized reporting across locations
   - Location-specific menu and pricing
   - Staff scheduling and management

7. CUSTOMER FEATURES:
   - Loyalty program with points and rewards
   - Order history and favorites
   - Mobile app for customer ordering
   - SMS/Email notifications

8. REPORTING & COMPLIANCE:
   - Daily/weekly/monthly sales reports
   - Tax reporting integration
   - Employee time tracking
   - Health department compliance logs

9. SECURITY & COMPLIANCE:
   - PCI DSS compliance for payment data
   - Role-based access control
   - Audit logs for all transactions
   - Data encryption at rest and in transit

10. SCALABILITY:
    - Microservices architecture
    - Load balancing for high traffic
    - Database sharding for large datasets
    - CDN for global performance
*/

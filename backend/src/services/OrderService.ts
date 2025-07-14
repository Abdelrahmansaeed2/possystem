import type { Order, OrderFilters, OrderStats } from "../types/Order"

interface OrdersResult {
  orders: Order[]
  total: number
  hasMore: boolean
}

export class OrderService {
  private orders: Order[] = []
  private nextId = 1

  constructor() {
    // Initialize with some mock data for development
    this.initializeMockData()
  }

  private initializeMockData() {
    const mockOrders: Order[] = [
      {
        id: "order-1703123456789",
        items: [
          {
            drinkId: "latte",
            drinkName: "Latte",
            size: "Large",
            price: 6.5,
            quantity: 1,
            customizations: ["Oat Milk", "Extra Shot"],
          },
          { drinkId: "espresso", drinkName: "Espresso", size: "Double", price: 3.5, quantity: 2 },
        ],
        subtotal: 13.5,
        tax: 1.08,
        discount: 0,
        tip: 2.0,
        total: 16.58,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: "preparing",
        customer: {
          id: "1",
          name: "Sarah Johnson",
          email: "sarah@example.com",
          phone: "+1234567890",
          loyaltyPoints: 150,
          tier: "Gold",
          totalOrders: 45,
          totalSpent: 567.89,
          lastVisit: new Date(Date.now() - 86400000).toISOString(),
        },
        paymentMethod: "card",
        paymentStatus: "paid",
        baristaId: "barista-1",
        estimatedTime: 8,
        orderType: "takeaway",
        priority: "normal",
        source: "mobile_app",
        feedback: {
          rating: 5,
          comment: "Perfect as always!",
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
      },
      {
        id: "order-1703123456790",
        items: [
          { drinkId: "iced-americano", drinkName: "Iced Americano", size: "Medium", price: 4.5, quantity: 1 },
          {
            drinkId: "chai-latte",
            drinkName: "Chai Latte",
            size: "Large",
            price: 6.0,
            quantity: 1,
            customizations: ["Almond Milk"],
          },
        ],
        subtotal: 10.5,
        tax: 0.84,
        discount: 1.05,
        tip: 1.5,
        total: 11.79,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: "ready",
        customer: {
          id: "2",
          name: "Mike Chen",
          email: "mike@example.com",
          phone: "+1234567891",
          loyaltyPoints: 200,
          tier: "Platinum",
          totalOrders: 67,
          totalSpent: 892.34,
          lastVisit: new Date(Date.now() - 3600000).toISOString(),
        },
        paymentMethod: "digital",
        paymentStatus: "paid",
        baristaId: "barista-2",
        estimatedTime: 5,
        orderType: "dine_in",
        tableNumber: 12,
        priority: "normal",
        source: "qr_code",
      },
    ]

    this.orders = mockOrders
  }

  async getOrders(params: {
    limit: number
    offset: number
    filters: OrderFilters
  }): Promise<{ orders: Order[]; total: number; hasMore: boolean }> {
    let filteredOrders = [...this.orders]

    // Apply filters
    if (params.filters.status) {
      filteredOrders = filteredOrders.filter((order) => order.status === params.filters.status)
    }

    if (params.filters.source) {
      filteredOrders = filteredOrders.filter((order) => order.source === params.filters.source)
    }

    if (params.filters.customerId) {
      filteredOrders = filteredOrders.filter((order) => order.customer?.id === params.filters.customerId)
    }

    if (params.filters.baristaId) {
      filteredOrders = filteredOrders.filter((order) => order.baristaId === params.filters.baristaId)
    }

    if (params.filters.startDate) {
      const startDate = new Date(params.filters.startDate)
      filteredOrders = filteredOrders.filter((order) => new Date(order.timestamp) >= startDate)
    }

    if (params.filters.endDate) {
      const endDate = new Date(params.filters.endDate)
      filteredOrders = filteredOrders.filter((order) => new Date(order.timestamp) <= endDate)
    }

    // Sort by timestamp (newest first)
    filteredOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const total = filteredOrders.length
    const paginatedOrders = filteredOrders.slice(params.offset, params.offset + params.limit)
    const hasMore = params.offset + params.limit < total

    return {
      orders: paginatedOrders,
      total,
      hasMore,
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.find((order) => order.id === id) || null
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const order: Order = {
      id: orderData.id || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      discount: orderData.discount || 0,
      tip: orderData.tip || 0,
      total: orderData.total || 0,
      timestamp: orderData.timestamp || new Date().toISOString(),
      status: orderData.status || "pending",
      customer: orderData.customer,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || "pending",
      baristaId: orderData.baristaId,
      estimatedTime: orderData.estimatedTime,
      orderType: orderData.orderType || "takeaway",
      tableNumber: orderData.tableNumber,
      priority: orderData.priority || "normal",
      source: orderData.source || "pos",
      feedback: orderData.feedback,
    }

    this.orders.unshift(order) // Add to beginning for newest first
    return order
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const orderIndex = this.orders.findIndex((order) => order.id === id)
    if (orderIndex === -1) {
      throw new Error(`Order with ID ${id} not found`)
    }

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return this.orders[orderIndex]
  }

  async deleteOrder(id: string): Promise<boolean> {
    const orderIndex = this.orders.findIndex((order) => order.id === id)
    if (orderIndex === -1) {
      return false
    }

    this.orders.splice(orderIndex, 1)
    return true
  }

  async getOrderStats(): Promise<OrderStats> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayOrders = this.orders.filter((order) => new Date(order.timestamp) >= today)
    const weekOrders = this.orders.filter((order) => new Date(order.timestamp) >= thisWeek)
    const monthOrders = this.orders.filter((order) => new Date(order.timestamp) >= thisMonth)

    const completedTodayOrders = todayOrders.filter((order) => order.status === "completed")
    const activeOrders = this.orders.filter((order) => ["pending", "preparing", "ready"].includes(order.status))

    const todayRevenue = completedTodayOrders.reduce((sum, order) => sum + order.total, 0)
    const weekRevenue = weekOrders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0)
    const monthRevenue = monthOrders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0)

    const averageOrderValue = completedTodayOrders.length > 0 ? todayRevenue / completedTodayOrders.length : 0

    // Calculate customer satisfaction from feedback
    const ordersWithFeedback = this.orders.filter((order) => order.feedback)
    const averageRating =
      ordersWithFeedback.length > 0
        ? ordersWithFeedback.reduce((sum, order) => sum + (order.feedback?.rating || 0), 0) / ordersWithFeedback.length
        : 0

    // Calculate average wait time (mock calculation)
    const completedOrders = this.orders.filter((order) => order.status === "completed")
    const averageWaitTime =
      completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + (order.estimatedTime || 5), 0) / completedOrders.length
        : 0

    // Top selling items
    const itemCounts: { [key: string]: { quantity: number; revenue: number } } = {}
    completedTodayOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemCounts[item.drinkName]) {
          itemCounts[item.drinkName] = { quantity: 0, revenue: 0 }
        }
        itemCounts[item.drinkName].quantity += item.quantity
        itemCounts[item.drinkName].revenue += item.price * item.quantity
      })
    })

    const topSellingItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Hourly data for today
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(today.getTime() + hour * 60 * 60 * 1000)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

      const hourOrders = todayOrders.filter((order) => {
        const orderTime = new Date(order.timestamp)
        return orderTime >= hourStart && orderTime < hourEnd
      })

      const hourRevenue = hourOrders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + order.total, 0)

      return {
        hour,
        orders: hourOrders.length,
        revenue: hourRevenue,
      }
    }).filter((data) => data.orders > 0) // Only include hours with orders

    return {
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue,
        completed: completedTodayOrders.length,
      },
      week: {
        orders: weekOrders.length,
        revenue: weekRevenue,
        completed: weekOrders.filter((order) => order.status === "completed").length,
      },
      month: {
        orders: monthOrders.length,
        revenue: monthRevenue,
        completed: monthOrders.filter((order) => order.status === "completed").length,
      },
      active: activeOrders.length,
      averageOrderValue,
      customerSatisfaction: averageRating,
      averageWaitTime,
      topSellingItems,
      hourlyData,
    }
  }

  // Method to simulate real-time order updates
  async simulateOrderProgress(orderId: string): Promise<void> {
    const order = await this.getOrderById(orderId)
    if (!order || order.status === "completed" || order.status === "cancelled") {
      return
    }

    const statusProgression: Array<Order["status"]> = ["pending", "preparing", "ready", "completed"]
    const currentIndex = statusProgression.indexOf(order.status)

    if (currentIndex < statusProgression.length - 1) {
      const nextStatus = statusProgression[currentIndex + 1]
      await this.updateOrder(orderId, { status: nextStatus })
    }
  }
}

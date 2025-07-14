export interface OrderItem {
  drinkId: string
  drinkName: string
  size: string
  price: number
  quantity: number
  customizations?: string[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  loyaltyPoints: number
  tier: string
  totalOrders: number
  totalSpent: number
  lastVisit: string
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  tip: number
  total: number
  timestamp: string
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  customer?: Customer
  paymentMethod?: string
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  baristaId?: string
  estimatedTime?: number
  orderType: "dine_in" | "takeaway" | "delivery"
  tableNumber?: number
  priority: "normal" | "high" | "urgent"
  source: "pos" | "mobile_app" | "qr_code" | "voice" | "online"
  feedback?: {
    rating: number
    comment: string
    timestamp: string
  }
  updatedAt?: string
  cancelledAt?: string
  cancelReason?: string
}

export interface OrderFilters {
  status?: string
  source?: string
  customerId?: string
  baristaId?: string
  startDate?: string
  endDate?: string
}

export interface OrderStats {
  today: {
    orders: number
    revenue: number
    completed: number
  }
  week: {
    orders: number
    revenue: number
    completed: number
  }
  month: {
    orders: number
    revenue: number
    completed: number
  }
  active: number
  averageOrderValue: number
  customerSatisfaction: number
  averageWaitTime: number
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  hourlyData: Array<{
    hour: number
    orders: number
    revenue: number
  }>
}

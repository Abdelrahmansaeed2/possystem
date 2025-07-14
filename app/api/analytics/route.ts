import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission, PERMISSIONS } from "@/lib/auth"

interface AnalyticsData {
  revenue: {
    today: number
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
    growth: {
      daily: number
      weekly: number
      monthly: number
    }
  }
  orders: {
    today: number
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
    averageOrderValue: number
    completionRate: number
  }
  customers: {
    total: number
    new: number
    returning: number
    retentionRate: number
    averageLifetimeValue: number
    loyaltyDistribution: {
      Bronze: number
      Silver: number
      Gold: number
      Platinum: number
    }
  }
  products: {
    topSelling: Array<{
      id: string
      name: string
      quantity: number
      revenue: number
      growth: number
    }>
    categories: Array<{
      name: string
      revenue: number
      percentage: number
    }>
  }
  staff: {
    performance: Array<{
      id: string
      name: string
      ordersProcessed: number
      averageTime: number
      customerRating: number
      efficiency: number
    }>
  }
  hourlyData: Array<{
    hour: number
    orders: number
    revenue: number
    customers: number
  }>
  weeklyData: Array<{
    day: string
    orders: number
    revenue: number
    customers: number
  }>
  monthlyData: Array<{
    month: string
    orders: number
    revenue: number
    customers: number
  }>
}

// Mock analytics data
const mockAnalytics: AnalyticsData = {
  revenue: {
    today: 2847.65,
    yesterday: 2543.21,
    thisWeek: 18234.56,
    lastWeek: 16789.43,
    thisMonth: 78456.78,
    lastMonth: 72345.67,
    growth: {
      daily: 11.97,
      weekly: 8.61,
      monthly: 8.45,
    },
  },
  orders: {
    today: 156,
    yesterday: 142,
    thisWeek: 987,
    lastWeek: 923,
    thisMonth: 4234,
    lastMonth: 3987,
    averageOrderValue: 18.25,
    completionRate: 96.8,
  },
  customers: {
    total: 1247,
    new: 23,
    returning: 133,
    retentionRate: 78.5,
    averageLifetimeValue: 234.67,
    loyaltyDistribution: {
      Bronze: 45,
      Silver: 30,
      Gold: 20,
      Platinum: 5,
    },
  },
  products: {
    topSelling: [
      { id: "latte", name: "Latte", quantity: 45, revenue: 292.5, growth: 12.5 },
      { id: "cappuccino", name: "Cappuccino", quantity: 38, revenue: 190.0, growth: 8.3 },
      { id: "americano", name: "Americano", quantity: 32, revenue: 144.0, growth: -2.1 },
      { id: "espresso", name: "Espresso", quantity: 28, revenue: 98.0, growth: 15.7 },
      { id: "mocha", name: "Mocha", quantity: 24, revenue: 168.0, growth: 22.4 },
    ],
    categories: [
      { name: "Coffee", revenue: 1892.5, percentage: 66.5 },
      { name: "Tea", revenue: 456.8, percentage: 16.0 },
      { name: "Cold Drinks", revenue: 334.2, percentage: 11.7 },
      { name: "Pastries", revenue: 164.15, percentage: 5.8 },
    ],
  },
  staff: {
    performance: [
      {
        id: "barista-1",
        name: "Alex Rodriguez",
        ordersProcessed: 156,
        averageTime: 4.2,
        customerRating: 4.8,
        efficiency: 92.5,
      },
      {
        id: "barista-2",
        name: "Jamie Park",
        ordersProcessed: 134,
        averageTime: 5.1,
        customerRating: 4.6,
        efficiency: 88.3,
      },
      {
        id: "cashier-1",
        name: "Sam Wilson",
        ordersProcessed: 89,
        averageTime: 3.8,
        customerRating: 4.9,
        efficiency: 95.2,
      },
    ],
  },
  hourlyData: [
    { hour: 6, orders: 8, revenue: 104.5, customers: 8 },
    { hour: 7, orders: 12, revenue: 156.8, customers: 11 },
    { hour: 8, orders: 18, revenue: 234.5, customers: 16 },
    { hour: 9, orders: 25, revenue: 342.1, customers: 22 },
    { hour: 10, orders: 22, revenue: 298.7, customers: 19 },
    { hour: 11, orders: 19, revenue: 267.3, customers: 17 },
    { hour: 12, orders: 28, revenue: 389.2, customers: 25 },
    { hour: 13, orders: 24, revenue: 334.6, customers: 21 },
    { hour: 14, orders: 16, revenue: 223.4, customers: 14 },
    { hour: 15, orders: 21, revenue: 289.8, customers: 18 },
    { hour: 16, orders: 18, revenue: 245.1, customers: 16 },
    { hour: 17, orders: 15, revenue: 198.7, customers: 13 },
    { hour: 18, orders: 12, revenue: 167.2, customers: 11 },
    { hour: 19, orders: 9, revenue: 123.4, customers: 8 },
    { hour: 20, orders: 6, revenue: 89.1, customers: 6 },
  ],
  weeklyData: [
    { day: "Monday", orders: 142, revenue: 2543.21, customers: 128 },
    { day: "Tuesday", orders: 156, revenue: 2847.65, customers: 142 },
    { day: "Wednesday", orders: 134, revenue: 2456.78, customers: 121 },
    { day: "Thursday", orders: 167, revenue: 3012.45, customers: 151 },
    { day: "Friday", orders: 189, revenue: 3456.89, customers: 172 },
    { day: "Saturday", orders: 201, revenue: 3789.12, customers: 186 },
    { day: "Sunday", orders: 178, revenue: 3234.67, customers: 163 },
  ],
  monthlyData: [
    { month: "Jan", orders: 3987, revenue: 72345.67, customers: 3654 },
    { month: "Feb", orders: 4123, revenue: 74567.89, customers: 3789 },
    { month: "Mar", orders: 4234, revenue: 78456.78, customers: 3892 },
    { month: "Apr", orders: 4456, revenue: 82345.67, customers: 4123 },
    { month: "May", orders: 4567, revenue: 85678.9, customers: 4234 },
    { month: "Jun", orders: 4678, revenue: 87890.12, customers: 4345 },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "today"
    const detailed = searchParams.get("detailed") === "true"

    // Check if user has permission for detailed reports
    if (detailed && !hasPermission(user, PERMISSIONS.VIEW_DETAILED_REPORTS)) {
      return NextResponse.json({ error: "Insufficient permissions for detailed reports" }, { status: 403 })
    }

    let responseData = { ...mockAnalytics }

    // Filter data based on period
    if (period === "week") {
      responseData = {
        ...responseData,
        revenue: {
          ...responseData.revenue,
          today: responseData.revenue.thisWeek,
          yesterday: responseData.revenue.lastWeek,
        },
        orders: {
          ...responseData.orders,
          today: responseData.orders.thisWeek,
          yesterday: responseData.orders.lastWeek,
        },
      }
    } else if (period === "month") {
      responseData = {
        ...responseData,
        revenue: {
          ...responseData.revenue,
          today: responseData.revenue.thisMonth,
          yesterday: responseData.revenue.lastMonth,
        },
        orders: {
          ...responseData.orders,
          today: responseData.orders.thisMonth,
          yesterday: responseData.orders.lastMonth,
        },
      }
    }

    // Remove sensitive data if not detailed view
    if (!detailed) {
      delete responseData.staff
      responseData.products.topSelling = responseData.products.topSelling.slice(0, 3)
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

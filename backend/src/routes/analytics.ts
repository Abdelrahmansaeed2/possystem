import { Router } from "express"
import { OrderService } from "../services/OrderService"

const router = Router()
const orderService = new OrderService()

// GET /api/analytics - Get comprehensive analytics
router.get("/", async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats()

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/revenue - Get revenue analytics
router.get("/revenue", async (req, res, next) => {
  try {
    const { period = "today" } = req.query
    const stats = await orderService.getOrderStats()

    let revenueData
    switch (period) {
      case "week":
        revenueData = stats.week
        break
      case "month":
        revenueData = stats.month
        break
      default:
        revenueData = stats.today
    }

    res.json({
      success: true,
      data: {
        period,
        revenue: revenueData.revenue,
        orders: revenueData.orders,
        averageOrderValue: stats.averageOrderValue,
        hourlyData: stats.hourlyData,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/products - Get product performance analytics
router.get("/products", async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats()

    res.json({
      success: true,
      data: {
        topSellingItems: stats.topSellingItems,
        totalItemsSold: stats.topSellingItems.reduce((sum, item) => sum + item.quantity, 0),
        totalItemRevenue: stats.topSellingItems.reduce((sum, item) => sum + item.revenue, 0),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/customers - Get customer analytics
router.get("/customers", async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats()

    res.json({
      success: true,
      data: {
        satisfaction: stats.customerSatisfaction,
        averageWaitTime: stats.averageWaitTime,
        // Additional customer metrics would be calculated here
        repeatCustomerRate: 0.65, // Mock data
        newCustomersToday: 8, // Mock data
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

export { router as analyticsRoutes }

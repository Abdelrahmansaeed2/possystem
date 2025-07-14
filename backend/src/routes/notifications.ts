import { Router } from "express"

const router = Router()

// Mock notifications data
const notifications = [
  {
    id: "notif-1",
    type: "order",
    title: "New Order Received",
    message: "Order #123456 from Sarah Johnson",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    read: false,
    priority: "normal",
  },
  {
    id: "notif-2",
    type: "inventory",
    title: "Low Stock Alert",
    message: "Oat Milk is running low (3 liters remaining)",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    read: false,
    priority: "high",
  },
  {
    id: "notif-3",
    type: "payment",
    title: "Payment Processed",
    message: "Payment of $16.58 processed successfully",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    read: true,
    priority: "normal",
  },
]

// GET /api/notifications - Get all notifications
router.get("/", async (req, res, next) => {
  try {
    const { unread, type, limit = 50 } = req.query

    let filteredNotifications = [...notifications]

    if (unread === "true") {
      filteredNotifications = filteredNotifications.filter((notif) => !notif.read)
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter((notif) => notif.type === type)
    }

    filteredNotifications = filteredNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, Number.parseInt(limit as string))

    res.json({
      success: true,
      data: {
        notifications: filteredNotifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", async (req, res, next) => {
  try {
    const notificationIndex = notifications.findIndex((n) => n.id === req.params.id)

    if (notificationIndex === -1) {
      return res.status(404).json({
        error: "Notification Not Found",
        message: `Notification with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    notifications[notificationIndex].read = true

    res.json({
      success: true,
      data: notifications[notificationIndex],
      message: "Notification marked as read",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

export { router as notificationRoutes }

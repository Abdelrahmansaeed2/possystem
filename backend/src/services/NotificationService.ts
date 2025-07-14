import type { WebSocketService } from "./WebSocketService"

export interface Notification {
  id: string
  type: "order" | "inventory" | "payment" | "system" | "staff"
  title: string
  message: string
  priority: "low" | "normal" | "high" | "urgent"
  timestamp: string
  read: boolean
  data?: any
}

export class NotificationService {
  private notifications: Notification[] = []
  private wsService: WebSocketService

  constructor(wsService: WebSocketService) {
    this.wsService = wsService
  }

  // Create and send notification
  async createNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    }

    this.notifications.unshift(newNotification)

    // Send real-time notification via WebSocket
    this.wsService.broadcast("notification", newNotification)

    // Send push notification for high priority items
    if (notification.priority === "high" || notification.priority === "urgent") {
      await this.sendPushNotification(newNotification)
    }

    return newNotification
  }

  // Send push notification (mock implementation)
  private async sendPushNotification(notification: Notification) {
    console.log(`Push notification sent: ${notification.title} - ${notification.message}`)
    // In production, integrate with push notification service like FCM, APNs, etc.
  }

  // Get notifications with filtering
  getNotifications(
    filters: {
      unread?: boolean
      type?: string
      limit?: number
      offset?: number
    } = {},
  ) {
    let filtered = [...this.notifications]

    if (filters.unread) {
      filtered = filtered.filter((n) => !n.read)
    }

    if (filters.type) {
      filtered = filtered.filter((n) => n.type === filters.type)
    }

    const total = filtered.length
    const offset = filters.offset || 0
    const limit = filters.limit || 50

    return {
      notifications: filtered.slice(offset, offset + limit),
      total,
      unreadCount: this.notifications.filter((n) => !n.read).length,
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      return notification
    }
    return null
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    return this.notifications.length
  }

  // Delete notification
  deleteNotification(notificationId: string) {
    const index = this.notifications.findIndex((n) => n.id === notificationId)
    if (index !== -1) {
      return this.notifications.splice(index, 1)[0]
    }
    return null
  }

  // Auto-create notifications for common events
  async notifyNewOrder(orderData: any) {
    return this.createNotification({
      type: "order",
      title: "New Order Received",
      message: `Order #${orderData.id.slice(-6)} from ${orderData.customer?.name || "Walk-in"}`,
      priority: orderData.priority === "urgent" ? "urgent" : "normal",
      data: orderData,
    })
  }

  async notifyLowStock(itemData: any) {
    return this.createNotification({
      type: "inventory",
      title: "Low Stock Alert",
      message: `${itemData.name} is running low (${itemData.currentStock} ${itemData.unit} remaining)`,
      priority: "high",
      data: itemData,
    })
  }

  async notifyPaymentProcessed(paymentData: any) {
    return this.createNotification({
      type: "payment",
      title: "Payment Processed",
      message: `Payment of $${paymentData.amount} processed successfully`,
      priority: "normal",
      data: paymentData,
    })
  }

  async notifyOrderStatusChange(orderData: any) {
    return this.createNotification({
      type: "order",
      title: "Order Status Updated",
      message: `Order #${orderData.id.slice(-6)} is now ${orderData.status}`,
      priority: orderData.status === "ready" ? "high" : "normal",
      data: orderData,
    })
  }
}

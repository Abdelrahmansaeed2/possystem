import { Router } from "express"
import { body, param, query, validationResult } from "express-validator"
import { OrderService } from "../services/OrderService"
import type { WebSocketService } from "../services/WebSocketService"

const router = Router()
const orderService = new OrderService()

// Validation middleware
const validateOrder = [
  body("items").isArray({ min: 1 }).withMessage("Order must contain at least one item"),
  body("items.*.drinkId").notEmpty().withMessage("Drink ID is required"),
  body("items.*.drinkName").notEmpty().withMessage("Drink name is required"),
  body("items.*.size").notEmpty().withMessage("Size is required"),
  body("items.*.price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("total").isFloat({ min: 0 }).withMessage("Total must be a positive number"),
  body("subtotal").isFloat({ min: 0 }).withMessage("Subtotal must be a positive number"),
  body("tax").isFloat({ min: 0 }).withMessage("Tax must be a positive number"),
  body("orderType").isIn(["dine_in", "takeaway", "delivery"]).withMessage("Invalid order type"),
  body("priority").optional().isIn(["normal", "high", "urgent"]).withMessage("Invalid priority"),
  body("source").isIn(["pos", "mobile_app", "qr_code", "voice", "online"]).withMessage("Invalid source"),
]

const validateOrderUpdate = [
  param("id").notEmpty().withMessage("Order ID is required"),
  body("status")
    .optional()
    .isIn(["pending", "preparing", "ready", "completed", "cancelled"])
    .withMessage("Invalid status"),
  body("estimatedTime").optional().isInt({ min: 1 }).withMessage("Estimated time must be at least 1 minute"),
]

const validateOrderQuery = [
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("offset").optional().isInt({ min: 0 }).withMessage("Offset must be non-negative"),
  query("status")
    .optional()
    .isIn(["pending", "preparing", "ready", "completed", "cancelled"])
    .withMessage("Invalid status filter"),
  query("source")
    .optional()
    .isIn(["pos", "mobile_app", "qr_code", "voice", "online"])
    .withMessage("Invalid source filter"),
  query("startDate").optional().isISO8601().withMessage("Invalid start date format"),
  query("endDate").optional().isISO8601().withMessage("Invalid end date format"),
]

// GET /api/orders - Get all orders with filtering and pagination
router.get("/", validateOrderQuery, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation Error",
        details: errors.array(),
        timestamp: new Date().toISOString(),
      })
    }

    const { limit = 50, offset = 0, status, source, startDate, endDate, customerId, baristaId } = req.query

    const filters = {
      status: status as string,
      source: source as string,
      startDate: startDate as string,
      endDate: endDate as string,
      customerId: customerId as string,
      baristaId: baristaId as string,
    }

    const result = await orderService.getOrders({
      limit: Number.parseInt(limit as string),
      offset: Number.parseInt(offset as string),
      filters,
    })

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/orders/:id - Get specific order
router.get("/:id", param("id").notEmpty(), async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation Error",
        details: errors.array(),
        timestamp: new Date().toISOString(),
      })
    }

    const order = await orderService.getOrderById(req.params.id)

    if (!order) {
      return res.status(404).json({
        error: "Order Not Found",
        message: `Order with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/orders - Create new order
router.post("/", validateOrder, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation Error",
        details: errors.array(),
        timestamp: new Date().toISOString(),
      })
    }

    // Generate order ID if not provided
    const orderData = {
      ...req.body,
      id: req.body.id || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: "pending",
      paymentStatus: req.body.paymentStatus || "pending",
    }

    // Validate order total
    const calculatedSubtotal = orderData.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

    if (Math.abs(calculatedSubtotal - orderData.subtotal) > 0.01) {
      return res.status(400).json({
        error: "Invalid Order Total",
        message: "Calculated subtotal does not match provided subtotal",
        calculated: calculatedSubtotal,
        provided: orderData.subtotal,
        timestamp: new Date().toISOString(),
      })
    }

    const order = await orderService.createOrder(orderData)

    // Send real-time notification
    const wsService = req.app.get("wsService") as WebSocketService
    if (wsService) {
      wsService.broadcast("new_order", {
        orderId: order.id,
        customerName: order.customer?.name || "Walk-in",
        total: order.total,
        items: order.items.length,
        priority: order.priority,
      })
    }

    res.status(201).json({
      success: true,
      data: order,
      message: "Order created successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/orders/:id - Update order
router.patch("/:id", validateOrderUpdate, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation Error",
        details: errors.array(),
        timestamp: new Date().toISOString(),
      })
    }

    const existingOrder = await orderService.getOrderById(req.params.id)
    if (!existingOrder) {
      return res.status(404).json({
        error: "Order Not Found",
        message: `Order with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    const updatedOrder = await orderService.updateOrder(req.params.id, req.body)

    // Send real-time notification for status changes
    if (req.body.status && req.body.status !== existingOrder.status) {
      const wsService = req.app.get("wsService") as WebSocketService
      if (wsService) {
        wsService.broadcast("order_status_updated", {
          orderId: updatedOrder.id,
          oldStatus: existingOrder.status,
          newStatus: updatedOrder.status,
          customerName: updatedOrder.customer?.name || "Walk-in",
        })
      }
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: "Order updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/orders/:id - Cancel order
router.delete("/:id", param("id").notEmpty(), async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation Error",
        details: errors.array(),
        timestamp: new Date().toISOString(),
      })
    }

    const existingOrder = await orderService.getOrderById(req.params.id)
    if (!existingOrder) {
      return res.status(404).json({
        error: "Order Not Found",
        message: `Order with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    if (existingOrder.status === "completed") {
      return res.status(400).json({
        error: "Cannot Cancel Order",
        message: "Cannot cancel a completed order",
        timestamp: new Date().toISOString(),
      })
    }

    const cancelledOrder = await orderService.updateOrder(req.params.id, {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancelReason: req.body.reason || "Cancelled by admin",
    })

    // Send real-time notification
    const wsService = req.app.get("wsService") as WebSocketService
    if (wsService) {
      wsService.broadcast("order_cancelled", {
        orderId: cancelledOrder.id,
        customerName: cancelledOrder.customer?.name || "Walk-in",
        reason: req.body.reason || "Cancelled by admin",
      })
    }

    res.json({
      success: true,
      data: cancelledOrder,
      message: "Order cancelled successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/orders/:id/feedback - Add customer feedback
router.post(
  "/:id/feedback",
  [
    param("id").notEmpty(),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").optional().isLength({ max: 500 }).withMessage("Comment must be less than 500 characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
      }

      const existingOrder = await orderService.getOrderById(req.params.id)
      if (!existingOrder) {
        return res.status(404).json({
          error: "Order Not Found",
          message: `Order with ID ${req.params.id} not found`,
          timestamp: new Date().toISOString(),
        })
      }

      const feedback = {
        rating: req.body.rating,
        comment: req.body.comment || "",
        timestamp: new Date().toISOString(),
      }

      const updatedOrder = await orderService.updateOrder(req.params.id, { feedback })

      res.json({
        success: true,
        data: updatedOrder,
        message: "Feedback added successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  },
)

// GET /api/orders/stats/summary - Get order statistics
router.get("/stats/summary", async (req, res, next) => {
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

export { router as orderRoutes }

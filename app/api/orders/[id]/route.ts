import { type NextRequest, NextResponse } from "next/server"

// This would typically import from a shared types file
interface Order {
  id: string
  items: any[]
  total: number
  subtotal: number
  tax: number
  discount: number
  timestamp: string
  status: "pending" | "submitted" | "preparing" | "ready" | "completed" | "cancelled"
  customer?: any
  paymentMethod?: "cash" | "card" | "digital"
  paymentStatus: "pending" | "paid" | "failed"
  baristaId?: string
  estimatedTime?: number
}

// In production, this would be a database query
const orders: Order[] = []

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updates = await request.json()

    // Find the order
    const orderIndex = orders.findIndex((order) => order.id === id)
    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Validate status update
    if (updates.status) {
      const validStatuses = ["pending", "submitted", "preparing", "ready", "completed", "cancelled"]
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
    }

    // Update the order
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      // Prevent updating certain fields
      id: orders[orderIndex].id,
      timestamp: orders[orderIndex].timestamp,
    }

    console.log(`Order ${id} updated:`, updates)

    // In production: trigger real-time notifications
    // WebSocket broadcast, push notifications, etc.

    return NextResponse.json({
      success: true,
      order: orders[orderIndex],
      message: "Order updated successfully",
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Find the order
    const order = orders.find((order) => order.id === id)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

import type { Order } from "../types"

export class OrderService {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.apiKey = "mobile-app-key-secure" // In production, this would be securely stored
  }


  async getOrderHistory(customerId: string): Promise<Order[]> {
    // Replace with your actual API call
    const response = await fetch(`${this.baseUrl}/orders?customerId=${customerId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch order history")
    }
    return await response.json()
  }

  async submitOrder(order: Order): Promise<Order> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify(order),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result: Order = await response.json(); // 👈 explicitly type the response
    console.log("Order submitted successfully:", result);
    return result; // ✅ return the submitted order
  } catch (error) {
    console.error("Error submitting order:", error);
    throw error;
  }
}


  async getOrderStatus(orderId: string): Promise<Order | null> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.order
    } catch (error) {
      console.error("Error fetching order status:", error)
      throw error
    }
  }

  async getOrders(limit = 10): Promise<Order[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orders?limit=${limit}`, {
        headers: {
          "X-API-Key": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      return result.orders || []
    } catch (error) {
      console.error("Error fetching orders:", error)
      throw error
    }
  }
}

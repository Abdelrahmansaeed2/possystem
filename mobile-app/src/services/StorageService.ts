import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Order, Customer } from "../types"

const STORAGE_KEYS = {
  PENDING_ORDERS: "@cafe_pos_pending_orders",
  ORDER_HISTORY: "@cafe_pos_order_history",
  USER_PREFERENCES: "@cafe_pos_user_preferences",
  LAST_SYNC: "@cafe_pos_last_sync",
}

export class StorageService {
    async getCustomer(): Promise<Customer | null> {
    try {
      const customerJson = await AsyncStorage.getItem("customer")
      return customerJson ? JSON.parse(customerJson) : null
    } catch (error) {
      console.error("Error getting customer from storage:", error)
      return null
    }
  }
  async saveSettings(settings: { darkMode?: boolean; loyaltyPoints?: number }): Promise<void> {
  try {
    await AsyncStorage.setItem("settings", JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

  async savePendingOrders(orders: Order[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(orders))
    } catch (error) {
      console.error("Error saving pending orders:", error)
      throw error
    }
  }



    async getSettings(): Promise<{ darkMode?: boolean; loyaltyPoints?: number } | null> {
    try {
      const settingsJson = await AsyncStorage.getItem("settings")
      return settingsJson ? JSON.parse(settingsJson) : null
    } catch (error) {
      console.error("Error getting settings:", error)
      return null
    }}


     async saveCustomer(customer: import("../types").Customer): Promise<void> {
    try {
      await AsyncStorage.setItem("customer", JSON.stringify(customer))
    } catch (error) {
      console.error("Error saving customer:", error)
    }
  }

  async getPendingOrders(): Promise<Order[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ORDERS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading pending orders:", error)
      return []
    }
  }

  async saveOrderHistory(orders: Order[]): Promise<void> {
    try {
      // Keep only last 50 orders to prevent storage bloat
      const limitedOrders = orders.slice(0, 50)
      await AsyncStorage.setItem(STORAGE_KEYS.ORDER_HISTORY, JSON.stringify(limitedOrders))
    } catch (error) {
      console.error("Error saving order history:", error)
      throw error
    }
  }

  async getOrderHistory(): Promise<Order[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDER_HISTORY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading order history:", error)
      return []
    }
  }

  async saveUserPreferences(preferences: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
    } catch (error) {
      console.error("Error saving user preferences:", error)
      throw error
    }
  }

  async getUserPreferences(): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("Error loading user preferences:", error)
      return {}
    }
  }

  async setLastSyncTime(timestamp: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp)
    } catch (error) {
      console.error("Error saving last sync time:", error)
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC)
    } catch (error) {
      console.error("Error loading last sync time:", error)
      return null
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS))
    } catch (error) {
      console.error("Error clearing all data:", error)
      throw error
    }
  }
}

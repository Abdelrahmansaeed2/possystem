export interface DrinkOption {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  sizes: {
    size: string;
    price: number;
  }[];
  stock: number;
  lowStockThreshold: number;
  customizations: string[];
  allergens: string[];
  nutritionInfo: {
    calories: number;
    caffeine: number;
    sugar: number;
  };
  rating: number;
  isPopular: boolean;
  isNew: boolean;
  preparationTime: number;
}

export interface OrderItem {
  drinkId: string;
  drinkName: string;
  size: string;
  price: number;
  quantity: number;
  customizations?: string[];
  specialInstructions?: string;
  allergenWarnings?: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  preferences: string[];
  allergens: string[];
  favoriteOrders: OrderItem[][];
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  totalOrders: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  timestamp: string;
  status:
    | "pending"
    | "submitted"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  customer?: Customer;
  paymentMethod?: "cash" | "card" | "digital" | "loyalty_points";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  baristaId?: string;
  estimatedTime?: number;
  actualTime?: number;
  rating?: number;
  feedback?: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: number;
  deliveryAddress?: string;
  priority: "normal" | "high" | "urgent";
  source: "pos" | "mobile_app" | "qr_code" | "voice" | "online";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

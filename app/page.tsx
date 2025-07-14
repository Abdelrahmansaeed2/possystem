import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Coffee,
  Wifi,
  WifiOff,
  ShoppingCart,
  Plus,
  Minus,
  User,
  CreditCard,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Star,
  Gift,
  Zap,
  Bell,
  Settings,
  BarChart3,
  Users,
  Package,
  Receipt,
  Smartphone,
  Headphones,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/login-form";
import { PaymentDialog } from "@/components/payment-dialog";
import { CustomerDialog } from "@/components/customer-dialog";
import { OrderCustomizationDialog } from "@/components/order-customization-dialog";
import { VoiceOrderDialog } from "@/components/voice-order-dialog";
import { QRCodeDialog } from "@/components/qr-code-dialog";
import { LoyaltyRewardsDialog } from "@/components/loyalty-rewards-dialog";
import { ReceiptDialog } from "@/components/receipt-dialog";

interface DrinkOption {
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

interface OrderItem {
  drinkId: string;
  drinkName: string;
  size: string;
  price: number;
  quantity: number;
  customizations?: string[];
  specialInstructions?: string;
  allergenWarnings?: string[];
}

interface Customer {
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
}

interface Order {
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
  customer?: Customer | undefined;
  paymentMethod?: "cash" | "card" | "digital" | "loyalty_points" | undefined;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  baristaId?: string | undefined;
  estimatedTime?: number | undefined;
  actualTime?: number | undefined;
  rating?: number | undefined;
  feedback?: string | undefined;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: number | undefined;
  deliveryAddress?: string | undefined;
  priority: "normal" | "high" | "urgent";
  source: "pos" | "mobile_app" | "qr_code" | "voice" | "online";
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  type:
    | "percentage"
    | "fixed_amount"
    | "buy_one_get_one"
    | "loyalty_multiplier";
  value: number;
  minOrderAmount?: number;
  validUntil: string;
  applicableItems?: string[];
  isActive: boolean;
}

const drinks: DrinkOption[] = [
  {
    id: "espresso",
    name: "Espresso",
    category: "Coffee",
    description: "Rich, bold espresso shot with perfect crema",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Single", price: 2.5 },
      { size: "Double", price: 3.5 },
    ],
    stock: 50,
    lowStockThreshold: 10,
    customizations: ["Extra Shot", "Decaf", "Half Caff", "Sugar", "Honey"],
    allergens: [],
    nutritionInfo: { calories: 5, caffeine: 63, sugar: 0 },
    rating: 4.8,
    isPopular: true,
    isNew: false,
    preparationTime: 2,
  },
  {
    id: "latte",
    name: "Latte",
    category: "Coffee",
    description: "Smooth espresso with perfectly steamed milk and microfoam",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 4.5 },
      { size: "Medium", price: 5.5 },
      { size: "Large", price: 6.5 },
    ],
    stock: 35,
    lowStockThreshold: 10,
    customizations: [
      "Oat Milk",
      "Almond Milk",
      "Soy Milk",
      "Extra Shot",
      "Vanilla Syrup",
      "Caramel Syrup",
      "Sugar-Free",
    ],
    allergens: ["Milk"],
    nutritionInfo: { calories: 190, caffeine: 63, sugar: 18 },
    rating: 4.7,
    isPopular: true,
    isNew: false,
    preparationTime: 4,
  },
  {
    id: "iced-americano",
    name: "Iced Americano",
    category: "Cold Coffee",
    description: "Chilled espresso with cold water over ice",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 3.5 },
      { size: "Medium", price: 4.5 },
      { size: "Large", price: 5.5 },
    ],
    stock: 42,
    lowStockThreshold: 10,
    customizations: [
      "Extra Shot",
      "Light Ice",
      "Extra Ice",
      "Vanilla Syrup",
      "Simple Syrup",
    ],
    allergens: [],
    nutritionInfo: { calories: 10, caffeine: 125, sugar: 0 },
    rating: 4.6,
    isPopular: false,
    isNew: false,
    preparationTime: 3,
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    category: "Coffee",
    description: "Perfect balance of espresso, steamed milk, and foam",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 4.0 },
      { size: "Medium", price: 5.0 },
    ],
    stock: 28,
    lowStockThreshold: 10,
    customizations: [
      "Oat Milk",
      "Almond Milk",
      "Extra Foam",
      "Cinnamon",
      "Cocoa Powder",
    ],
    allergens: ["Milk"],
    nutritionInfo: { calories: 120, caffeine: 63, sugar: 12 },
    rating: 4.5,
    isPopular: false,
    isNew: false,
    preparationTime: 4,
  },
  {
    id: "green-tea",
    name: "Green Tea Latte",
    category: "Tea",
    description: "Premium matcha green tea with steamed milk",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 4.5 },
      { size: "Medium", price: 5.5 },
      { size: "Large", price: 6.5 },
    ],
    stock: 8,
    lowStockThreshold: 10,
    customizations: [
      "Oat Milk",
      "Almond Milk",
      "Extra Matcha",
      "Honey",
      "Agave",
    ],
    allergens: ["Milk"],
    nutritionInfo: { calories: 240, caffeine: 70, sugar: 32 },
    rating: 4.4,
    isPopular: false,
    isNew: true,
    preparationTime: 5,
  },
  {
    id: "chai-latte",
    name: "Chai Latte",
    category: "Tea",
    description: "Aromatic spiced tea blend with steamed milk",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 4.0 },
      { size: "Medium", price: 5.0 },
      { size: "Large", price: 6.0 },
    ],
    stock: 22,
    lowStockThreshold: 10,
    customizations: [
      "Oat Milk",
      "Almond Milk",
      "Extra Spice",
      "Honey",
      "Vanilla",
    ],
    allergens: ["Milk"],
    nutritionInfo: { calories: 200, caffeine: 40, sugar: 25 },
    rating: 4.3,
    isPopular: false,
    isNew: false,
    preparationTime: 4,
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    category: "Cold Coffee",
    description: "Smooth, slow-steeped cold coffee concentrate",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 3.0 },
      { size: "Medium", price: 4.0 },
      { size: "Large", price: 5.0 },
    ],
    stock: 30,
    lowStockThreshold: 10,
    customizations: [
      "Vanilla Syrup",
      "Caramel Syrup",
      "Oat Milk",
      "Simple Syrup",
    ],
    allergens: [],
    nutritionInfo: { calories: 5, caffeine: 200, sugar: 0 },
    rating: 4.9,
    isPopular: true,
    isNew: false,
    preparationTime: 2,
  },
  {
    id: "frappuccino",
    name: "Caramel Frappuccino",
    category: "Blended",
    description: "Blended coffee drink with caramel and whipped cream",
    image: "/placeholder.svg?height=100&width=100",
    sizes: [
      { size: "Small", price: 5.0 },
      { size: "Medium", price: 6.0 },
      { size: "Large", price: 7.0 },
    ],
    stock: 25,
    lowStockThreshold: 10,
    customizations: [
      "Extra Caramel",
      "No Whip",
      "Almond Milk",
      "Decaf",
      "Extra Shot",
    ],
    allergens: ["Milk"],
    nutritionInfo: { calories: 420, caffeine: 95, sugar: 66 },
    rating: 4.2,
    isPopular: true,
    isNew: false,
    preparationTime: 6,
  },
];

const promotions: Promotion[] = [
  {
    id: "happy-hour",
    name: "Happy Hour",
    description: "20% off all drinks from 2-4 PM",
    type: "percentage",
    value: 20,
    validUntil: "2024-12-31",
    isActive: true,
  },
  {
    id: "loyalty-double",
    name: "Double Points Tuesday",
    description: "Earn 2x loyalty points on Tuesdays",
    type: "loyalty_multiplier",
    value: 2,
    validUntil: "2024-12-31",
    isActive: true,
  },
  {
    id: "student-discount",
    name: "Student Discount",
    description: "$1 off any drink with student ID",
    type: "fixed_amount",
    value: 1,
    validUntil: "2024-12-31",
    isActive: true,
  },
];

function POSMobileApp() {
  const { user, logout } = useAuth();
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showCustomizationDialog, setShowCustomizationDialog] = useState(false);
  const [showVoiceOrderDialog, setShowVoiceOrderDialog] = useState(false);
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false);
  const [showLoyaltyDialog, setShowLoyaltyDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedDrinkForCustomization, setSelectedDrinkForCustomization] =
    useState<DrinkOption | null>(null);
  const [selectedSizeForCustomization, setSelectedSizeForCustomization] =
    useState<string>("");
  const [selectedPriceForCustomization, setSelectedPriceForCustomization] =
    useState<number>(0);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState<
    "dine_in" | "takeaway" | "delivery"
  >("takeaway");
  const [tableNumber, setTableNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [tipAmount, setTipAmount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(
    null
  );
  const { toast } = useToast();

  // Enhanced network status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const wasOnline = isOnline;
      const nowOnline = Math.random() > 0.15; // 85% chance of being online
      setIsOnline(nowOnline);

      if (!wasOnline && nowOnline) {
        toast({
          title: "Back Online",
          description: "Connection restored. Syncing pending orders...",
        });
      } else if (wasOnline && !nowOnline) {
        toast({
          title: "Connection Lost",
          description: "Working offline. Orders will sync when reconnected.",
          variant: "destructive",
        });
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [isOnline, toast]);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pendingOrders");
    if (stored) {
      setPendingOrders(JSON.parse(stored));
    }

    const history = localStorage.getItem("orderHistory");
    if (history) {
      setOrderHistory(JSON.parse(history));
    }

    const settings = localStorage.getItem("posSettings");
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setIsDarkMode(parsedSettings.darkMode || false);
      setSoundEnabled(parsedSettings.soundEnabled !== false);
    }
  }, []);

  // Retry pending orders when back online
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0) {
      retryPendingOrders();
    }
  }, [isOnline]);

  // Real-time notifications simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const mockNotifications = [
          "Order #1234 is ready for pickup",
          "New promotion: 20% off all lattes",
          "Low stock alert: Green Tea Latte",
          "Customer feedback received",
          "Peak hour starting - expect higher volume",
        ];
        const randomNotification =
          mockNotifications[
            Math.floor(Math.random() * mockNotifications.length)
          ];

        if (randomNotification) {
          setNotifications((prev) => [randomNotification, ...prev.slice(0, 4)]);
        }

        if (soundEnabled) {
          // Play notification sound (simulated)
          console.log("🔔 Notification sound played");
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "posSettings",
      JSON.stringify({
        darkMode: isDarkMode,
        soundEnabled: soundEnabled,
      })
    );
  }, [isDarkMode, soundEnabled]);

  const categories = [
    "All",
    ...Array.from(new Set(drinks.map((drink) => drink.category))),
  ];

  const filteredDrinks = drinks.filter((drink) => {
    const matchesSearch =
      drink.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drink.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drink.customizations.some((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "All" || drink.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedDrinks = filteredDrinks.sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return b.rating - a.rating;
  });

  const openCustomizationDialog = (
    drink: DrinkOption,
    size: string,
    price: number
  ) => {
    setSelectedDrinkForCustomization(drink);
    setSelectedSizeForCustomization(size);
    setSelectedPriceForCustomization(price);
    setShowCustomizationDialog(true);
  };

  const addToOrder = (
    drink: DrinkOption,
    size: string,
    price: number,
    customizations?: string[],
    specialInstructions?: string
  ) => {
    if (drink.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${drink.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = currentOrder.find(
      (item) =>
        item.drinkId === drink.id &&
        item.size === size &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItem) {
      setCurrentOrder((prev) =>
        prev.map((item) =>
          item.drinkId === drink.id &&
          item.size === size &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCurrentOrder((prev) => [
        ...prev,
        {
          drinkId: drink.id,
          drinkName: drink.name,
          size,
          price,
          quantity: 1,
          customizations: customizations || [],
          specialInstructions: specialInstructions || "",
          allergenWarnings: drink.allergens,
        },
      ]);
    }

    if (soundEnabled) {
      console.log("🔊 Item added sound played");
    }

    toast({
      title: "Added to Order",
      description: `${drink.name} (${size}) added to your order`,
    });
  };

  const updateQuantity = (
    drinkId: string,
    size: string,
    customizations: string[] | undefined,
    change: number
  ) => {
    setCurrentOrder(
      (prev) =>
        prev
          .map((item) => {
            if (
              item.drinkId === drinkId &&
              item.size === size &&
              JSON.stringify(item.customizations) ===
                JSON.stringify(customizations)
            ) {
              const newQuantity = Math.max(0, item.quantity + change);
              return newQuantity === 0
                ? null
                : { ...item, quantity: newQuantity };
            }
            return item;
          })
          .filter(Boolean) as OrderItem[]
    );
  };

  const calculateSubtotal = () => {
    return currentOrder.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08; // 8% tax
  };

  const calculateDiscount = (subtotal: number) => {
    let discount = 0;

    // Loyalty discount
    if (selectedCustomer && selectedCustomer.loyaltyPoints >= 100) {
      discount += subtotal * 0.1; // 10% loyalty discount
    }

    // Happy hour discount (simulated)
    const currentHour = new Date().getHours();
    if (currentHour >= 14 && currentHour < 16) {
      discount += subtotal * 0.2; // 20% happy hour discount
    }

    // Student discount (simulated)
    if (selectedCustomer && selectedCustomer.preferences.includes("student")) {
      discount += Math.min(1, subtotal); // $1 off, max $1
    }

    return discount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const discount = calculateDiscount(subtotal);
    return subtotal + tax - discount + tipAmount;
  };

  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to your order first.",
        variant: "destructive",
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const discount = calculateDiscount(subtotal);
    const total = subtotal + tax - discount + tipAmount;

    const order: Order = {
      id: `order-${Date.now()}`,
      items: currentOrder,
      subtotal,
      tax,
      discount,
      tip: tipAmount,
      total,
      timestamp: new Date().toISOString(),
      status: "pending",
      customer: selectedCustomer || undefined,
      paymentStatus: "pending",
      baristaId: user?.id,
      estimatedTime: currentOrder.reduce((time, item) => {
        const drink = drinks.find((d) => d.id === item.drinkId);
        return time + (drink?.preparationTime || 3) * item.quantity;
      }, 0),
      orderType,
      tableNumber:
        orderType === "dine_in"
          ? Number.parseInt(tableNumber) || undefined
          : undefined,
      priority: total > 50 ? "high" : "normal",
      source: "pos",
    };

    if (isOnline) {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          const result = await response.json();
          toast({
            title: "Order Submitted",
            description: `Order #${order.id.slice(-6)} submitted successfully!`,
          });

          // Add to order history
          const updatedHistory = [order, ...orderHistory];
          setOrderHistory(updatedHistory);
          localStorage.setItem("orderHistory", JSON.stringify(updatedHistory));

          // Update customer loyalty points
          if (selectedCustomer) {
            const pointsEarned = Math.floor(total);
            selectedCustomer.loyaltyPoints += pointsEarned;
            toast({
              title: "Points Earned",
              description: `${selectedCustomer.name} earned ${pointsEarned} loyalty points!`,
            });
          }

          setLastCompletedOrder(order);
          setCurrentOrder([]);
          setSelectedCustomer(null);
          setTipAmount(0);
          setSpecialInstructions("");
          setShowReceiptDialog(true);
        } else {
          throw new Error("Failed to submit order");
        }
      } catch (error) {
        storeOrderOffline(order);
      }
    } else {
      storeOrderOffline(order);
    }
  };

  const storeOrderOffline = (order: Order) => {
    const updatedPending = [
      ...pendingOrders,
      { ...order, status: "pending" as const },
    ];
    setPendingOrders(updatedPending);
    localStorage.setItem("pendingOrders", JSON.stringify(updatedPending));

    toast({
      title: "Stored Offline",
      description: "Order saved locally. Will sync when online.",
      variant: "default",
    });
    setCurrentOrder([]);
    setSelectedCustomer(null);
    setTipAmount(0);
    setSpecialInstructions("");
  };

  const retryPendingOrders = async () => {
    const ordersToRetry = [...pendingOrders];

    for (const order of ordersToRetry) {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          setPendingOrders((prev) => prev.filter((p) => p.id !== order.id));
          toast({
            title: "Order Synced",
            description: `Order #${order.id.slice(-6)} synced successfully!`,
          });
        }
      } catch (error) {
        console.error("Failed to retry order:", error);
      }
    }

    localStorage.setItem(
      "pendingOrders",
      JSON.stringify(
        pendingOrders.filter(
          (order) => !ordersToRetry.some((retried) => retried.id === order.id)
        )
      )
    );
  };

  const processPayment = async (
    paymentMethod: "cash" | "card" | "digital" | "loyalty_points"
  ) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Payment Processed",
      description: `Payment of $${calculateTotal().toFixed(
        2
      )} processed successfully via ${paymentMethod}`,
    });

    setShowPaymentDialog(false);
    submitOrder();
  };

  const addFavoriteOrder = () => {
    if (selectedCustomer && currentOrder.length > 0) {
      selectedCustomer.favoriteOrders.push([...currentOrder]);
      toast({
        title: "Added to Favorites",
        description: "This order has been saved to customer favorites",
      });
    }
  };

  const loadFavoriteOrder = (favoriteOrder: OrderItem[]) => {
    setCurrentOrder(favoriteOrder);
    toast({
      title: "Favorite Order Loaded",
      description: "Customer's favorite order has been loaded",
    });
  };

  const handleVoiceOrderProcessed = (items: OrderItem[]) => {
    setCurrentOrder(items);
    toast({
      title: "Voice Order Processed",
      description: "Your voice order has been added to the cart",
    });
  };

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      <Tabs defaultValue="pos" className="w-full">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Coffee className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Café POS Pro
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Advanced Point of Sale
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                </div>
              )}
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                <User className="h-4 w-4 mr-2" />
                {user.name}
              </Button>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pos">POS</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pos" className="p-4 max-w-md mx-auto">
          {/* Notifications */}
          {notifications.length > 0 && (
            <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Recent Notifications
                  </span>
                </div>
                <div className="space-y-1">
                  {notifications.slice(0, 2).map((notification, index) => (
                    <p
                      key={index}
                      className="text-sm text-blue-700 dark:text-blue-300"
                    >
                      {notification}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Status & Pending Orders */}
          {pendingOrders.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {pendingOrders.length} order(s) pending sync
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceOrderDialog(true)}
              className="flex flex-col h-16"
            >
              <Headphones className="h-4 w-4 mb-1" />
              <span className="text-xs">Voice</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQRCodeDialog(true)}
              className="flex flex-col h-16"
            >
              <Smartphone className="h-4 w-4 mb-1" />
              <span className="text-xs">QR Code</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLoyaltyDialog(true)}
              className="flex flex-col h-16"
            >
              <Gift className="h-4 w-4 mb-1" />
              <span className="text-xs">Rewards</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerDialog(true)}
              className="flex flex-col h-16"
            >
              <Users className="h-4 w-4 mb-1" />
              <span className="text-xs">Customer</span>
            </Button>
          </div>

          {/* Order Type Selection */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Label className="text-sm font-medium mb-2 block">
                Order Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={orderType === "dine_in" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("dine_in")}
                >
                  Dine In
                </Button>
                <Button
                  variant={orderType === "takeaway" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("dine_in")}
                >
                  Dine In
                </Button>
                <Button
                  variant={orderType === "takeaway" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("takeaway")}
                >
                  Takeaway
                </Button>
                <Button
                  variant={orderType === "delivery" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType("delivery")}
                >
                  Delivery
                </Button>
              </div>
              {orderType === "dine_in" && (
                <div className="mt-3">
                  <Label htmlFor="tableNumber" className="text-sm">
                    Table Number
                  </Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    placeholder="Enter table number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search drinks, customizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Selection */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  {selectedCustomer ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <Badge variant="secondary">
                          {selectedCustomer.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedCustomer.loyaltyPoints} points •{" "}
                        {selectedCustomer.visitCount} visits
                      </p>
                      {selectedCustomer.favoriteOrders.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {selectedCustomer.favoriteOrders
                            .slice(0, 2)
                            .map((favorite, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => loadFavoriteOrder(favorite)}
                                className="text-xs"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Favorite {index + 1}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No customer selected
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerDialog(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {selectedCustomer ? "Change" : "Select"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Drinks Menu */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Popular</span>
                <Star className="h-4 w-4 text-blue-500" />
                <span>New</span>
              </div>
            </div>
            {sortedDrinks.map((drink) => (
              <Card
                key={drink.id}
                className={`${
                  drink.stock <= drink.lowStockThreshold
                    ? "border-orange-200 bg-orange-50 dark:bg-orange-900/20"
                    : ""
                } ${drink.isPopular ? "ring-2 ring-yellow-200" : ""} ${
                  drink.isNew ? "ring-2 ring-blue-200" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <img
                        src={drink.image || "/placeholder.svg"}
                        alt={drink.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            {drink.name}
                          </CardTitle>
                          {drink.isPopular && (
                            <Zap className="h-4 w-4 text-yellow-500" />
                          )}
                          {drink.isNew && (
                            <Star className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {drink.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {drink.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {drink.rating}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {drink.preparationTime}min
                          </span>
                          {drink.stock <= drink.lowStockThreshold && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        {drink.allergens.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-red-600 dark:text-red-400">
                              Contains: {drink.allergens.join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {drink.nutritionInfo.calories} cal •{" "}
                          {drink.nutritionInfo.caffeine}mg caffeine
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Stock: {drink.stock}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {drink.sizes.map((sizeOption) => (
                    <div
                      key={sizeOption.size}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{sizeOption.size}</span>
                        <span className="text-gray-600 dark:text-gray-300 ml-2">
                          ${sizeOption.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openCustomizationDialog(
                              drink,
                              sizeOption.size,
                              sizeOption.price
                            )
                          }
                          disabled={drink.stock <= 0}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Customize
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            addToOrder(drink, sizeOption.size, sizeOption.price)
                          }
                          disabled={drink.stock <= 0}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Current Order */}
          {currentOrder.length > 0 && (
            <Card className="mb-6 sticky bottom-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Current Order
                  </CardTitle>
                  <div className="flex gap-2">
                    {selectedCustomer && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addFavoriteOrder}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentOrder([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentOrder.map((item, index) => (
                  <div
                    key={`${item.drinkId}-${item.size}-${index}`}
                    className="border rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.drinkName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.size} - ${item.price.toFixed(2)}
                        </p>
                        {item.customizations &&
                          item.customizations.length > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              + {item.customizations.join(", ")}
                            </p>
                          )}
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                        {item.allergenWarnings &&
                          item.allergenWarnings.length > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              ⚠️ Contains: {item.allergenWarnings.join(", ")}
                            </p>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateQuantity(
                              item.drinkId,
                              item.size,
                              item.customizations,
                              -1
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateQuantity(
                              item.drinkId,
                              item.size,
                              item.customizations,
                              1
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Special Instructions */}
                <div>
                  <Label
                    htmlFor="specialInstructions"
                    className="text-sm font-medium"
                  >
                    Special Instructions
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="Any special requests or notes..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Tip Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Tip Amount
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((tip) => (
                      <Button
                        key={tip}
                        variant={tipAmount === tip ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTipAmount(tip)}
                      >
                        ${tip}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (8%):</span>
                    <span>${calculateTax(calculateSubtotal()).toFixed(2)}</span>
                  </div>
                  {calculateDiscount(calculateSubtotal()) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discounts:</span>
                      <span>
                        -${calculateDiscount(calculateSubtotal()).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tip:</span>
                      <span>${tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-lg font-bold">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Estimated prep time:{" "}
                    {currentOrder.reduce((time, item) => {
                      const drink = drinks.find((d) => d.id === item.drinkId);
                      return (
                        time + (drink?.preparationTime || 3) * item.quantity
                      );
                    }, 0)}{" "}
                    minutes
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay & Submit
                  </Button>
                  <Button variant="outline" size="lg" onClick={submitOrder}>
                    <Clock className="h-4 w-4 mr-2" />
                    Submit Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dialogs */}
          <PaymentDialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            total={calculateTotal()}
            onPayment={processPayment}
          />

          <CustomerDialog
            open={showCustomerDialog}
            onSelectCustomer={setSelectedCustomer}
            onClose={() => setShowCustomerDialog(false)}
          />

          <OrderCustomizationDialog
            open={showCustomizationDialog}
            onClose={() => setShowCustomizationDialog(false)}
            drink={selectedDrinkForCustomization}
            size={selectedSizeForCustomization}
            price={selectedPriceForCustomization}
            onAddToOrder={addToOrder}
          />

          <VoiceOrderDialog
            open={showVoiceOrderDialog}
            onClose={() => setShowVoiceOrderDialog(false)}
            onOrderProcessed={handleVoiceOrderProcessed}
          />

          <QRCodeDialog
            open={showQRCodeDialog}
            onClose={() => setShowQRCodeDialog(false)}
          />

          <LoyaltyRewardsDialog
            open={showLoyaltyDialog}
            onClose={() => setShowLoyaltyDialog(false)}
            customer={selectedCustomer}
          />

          <ReceiptDialog
            open={showReceiptDialog}
            onClose={() => setShowReceiptDialog(false)}
            order={lastCompletedOrder}
          />
        </TabsContent>

        <TabsContent value="orders" className="p-4">
          <OrdersTab orderHistory={orderHistory} />
        </TabsContent>

        <TabsContent value="customers" className="p-4">
          <CustomersTab />
        </TabsContent>

        <TabsContent value="inventory" className="p-4">
          <InventoryTab drinks={drinks} />
        </TabsContent>

        <TabsContent value="analytics" className="p-4">
          <AnalyticsTab orderHistory={orderHistory} />
        </TabsContent>

        <TabsContent value="settings" className="p-4">
          <SettingsTab
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTab({ orderHistory }: { orderHistory: Order[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = orderHistory.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.drinkName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">
                      Order #{order.id.slice(-6)}
                    </h3>
                    <Badge
                      variant={
                        order.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                    <Badge
                      variant={
                        order.paymentStatus === "paid"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                    <Badge variant="outline">{order.orderType}</Badge>
                    {order.priority === "high" && (
                      <Badge variant="destructive">High Priority</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      ${order.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.customer && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer.email}
                        </p>
                      </div>
                      <Badge variant="secondary">{order.customer.tier}</Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span>
                          {item.quantity}x {item.drinkName} ({item.size})
                        </span>
                        {item.customizations &&
                          item.customizations.length > 0 && (
                            <div className="text-xs text-blue-600 ml-4">
                              + {item.customizations.join(", ")}
                            </div>
                          )}
                      </div>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {order.estimatedTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{order.estimatedTime}min est.</span>
                      </div>
                    )}
                    {order.tableNumber && (
                      <span>Table {order.tableNumber}</span>
                    )}
                    <span>via {order.source}</span>
                  </div>
                  {order.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{order.rating}/5</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      loyaltyPoints: 150,
      tier: "Gold",
      preferences: ["oat_milk", "extra_shot"],
      allergens: [],
      favoriteOrders: [],
      totalSpent: 245.5,
      visitCount: 23,
      lastVisit: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1234567891",
      loyaltyPoints: 75,
      tier: "Silver",
      preferences: ["almond_milk", "sugar_free"],
      allergens: ["milk"],
      favoriteOrders: [],
      totalSpent: 128.75,
      visitCount: 12,
      lastVisit: "2024-01-14T15:45:00Z",
    },
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <Badge variant="secondary">{customer.tier}</Badge>
                    </div>
                    <p className="text-gray-600">{customer.email}</p>
                    <p className="text-gray-600">{customer.phone}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{customer.visitCount} visits</span>
                      <span>${customer.totalSpent.toFixed(2)} spent</span>
                      <span>
                        Last:{" "}
                        {new Date(customer.lastVisit).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {customer.loyaltyPoints} points
                    </Badge>
                  </div>
                  {customer.preferences.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Prefers: {customer.preferences.join(", ")}
                    </div>
                  )}
                  {customer.allergens.length > 0 && (
                    <div className="text-xs text-red-600">
                      Allergic to: {customer.allergens.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InventoryTab({ drinks }: { drinks: DrinkOption[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredDrinks = drinks.filter((drink) => {
    const matchesSearch = drink.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || drink.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All",
    ...Array.from(new Set(drinks.map((d) => d.category))),
  ];
  const lowStockItems = drinks.filter((d) => d.stock <= d.lowStockThreshold);
  const totalValue = drinks.reduce((sum, drink) => {
    const price = drink.sizes[0]?.price ?? 0;
    return sum + drink.stock * price;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Restock Alert
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{drinks.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {lowStockItems.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold">
                  {drinks.reduce((sum, d) => sum + d.stock, 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Grid */}
      <div className="grid gap-4">
        {filteredDrinks.map((drink) => (
          <Card
            key={drink.id}
            className={
              drink.stock <= drink.lowStockThreshold ? "border-orange-200" : ""
            }
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={drink.image || "/placeholder.svg"}
                    alt={drink.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{drink.name}</h3>
                      {drink.isPopular && (
                        <Zap className="h-4 w-4 text-yellow-500" />
                      )}
                      {drink.isNew && (
                        <Star className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-gray-600">{drink.category}</p>
                    <p className="text-sm text-gray-500">{drink.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>Rating: {drink.rating}/5</span>
                      <span>Prep: {drink.preparationTime}min</span>
                      <span>Sizes: {drink.sizes.length}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl font-bold">{drink.stock}</span>
                    <span className="text-gray-600">units</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    Threshold: {drink.lowStockThreshold}
                  </div>
                  {drink.stock <= drink.lowStockThreshold && (
                    <Badge variant="destructive" className="mb-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Restock Needed
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab({ orderHistory }: { orderHistory: Order[] }) {
  const today = new Date();
  const todayOrders = orderHistory.filter(
    (order) => new Date(order.timestamp).toDateString() === today.toDateString()
  );

  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue =
    todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0;
  const totalCustomers = new Set(
    todayOrders.map((order) => order.customer?.id).filter(Boolean)
  ).size;

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-green-600">+12% vs yesterday</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-3xl font-bold">{todayOrders.length}</p>
                <p className="text-sm text-blue-600">+8% vs yesterday</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-3xl font-bold">
                  ${averageOrderValue.toFixed(2)}
                </p>
                <p className="text-sm text-purple-600">+5% vs yesterday</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-3xl font-bold">{totalCustomers}</p>
                <p className="text-sm text-orange-600">+15% vs yesterday</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and detailed analytics would go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {drinks.slice(0, 5).map((drink, index) => (
                <div
                  key={drink.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span>{drink.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {Math.floor(Math.random() * 50) + 10} sold
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(Math.random() * 200 + 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Takeaway</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-3/5 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">60%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Dine In</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/3 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1/10 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab({
  isDarkMode,
  setIsDarkMode,
  soundEnabled,
  setSoundEnabled,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-gray-600">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-enabled">Sound Effects</Label>
                <p className="text-sm text-gray-600">
                  Play sounds for notifications and actions
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Version:</span>
              <span>2.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>January 15, 2024</span>
            </div>
            <div className="flex justify-between">
              <span>Build:</span>
              <span>2024.01.15.001</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <Receipt className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <POSMobileApp />
    </AuthProvider>
  );
}

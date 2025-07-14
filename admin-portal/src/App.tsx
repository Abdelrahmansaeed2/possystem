import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../src/components/ui/card";
import { Badge } from "../src/components/ui/badge";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../src/components/ui/tabs";
import { Progress } from "../src/components/ui/progress";
import { Switch } from "../src/components/ui/switch";
import {
  Coffee,
  RefreshCw,
  Search,
  Filter,
  Download,
  Bell,
  Clock,
  DollarSign,
  CheckCircle,
  Users,
  AlertTriangle,
  Star,
  Printer,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./App.css";

interface OrderItem {
  drinkId: string;
  drinkName: string;
  size: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tier: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
  ordersProcessed: number;
  averageTime: number;
  rating: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  cost: number;
  supplier: string;
  lastRestocked: string;
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
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  customer?: Customer;
  paymentMethod?: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  baristaId?: string;
  estimatedTime?: number;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: number;
  priority: "normal" | "high" | "urgent";
  source: "pos" | "mobile_app" | "qr_code" | "voice" | "online";
  feedback?: {
    rating: number;
    comment: string;
    timestamp: string;
  };
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeOrders: number;
  completedToday: number;
  pendingOrders: number;
  customerSatisfaction: number;
  averageWaitTime: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
  hourlyData: Array<{ hour: number; orders: number; revenue: number }>;
}

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    activeOrders: 0,
    completedToday: 0,
    pendingOrders: 0,
    customerSatisfaction: 0,
    averageWaitTime: 0,
    topSellingItems: [],
    hourlyData: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch all data from backend
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, staffRes, inventoryRes, analyticsRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/orders?limit=100&offset=0`),
          fetch(`${API_BASE_URL}/customers`),
          fetch(`${API_BASE_URL}/staff`),
          fetch(`${API_BASE_URL}/inventory`),
          fetch(`${API_BASE_URL}/analytics`),
        ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(
          ordersData.orders.sort(
            (a: Order, b: Order) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.customers);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff);
      }

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventory(inventoryData.items);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsOnline(false);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // Load comprehensive mock data
  const loadMockData = () => {
    const mockCustomers: Customer[] = [
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+1234567890",
        loyaltyPoints: 150,
        tier: "Gold",
        totalOrders: 45,
        totalSpent: 567.89,
        lastVisit: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "2",
        name: "Mike Chen",
        email: "mike@example.com",
        phone: "+1234567891",
        loyaltyPoints: 200,
        tier: "Platinum",
        totalOrders: 67,
        totalSpent: 892.34,
        lastVisit: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "3",
        name: "Emma Wilson",
        email: "emma@example.com",
        phone: "+1234567892",
        loyaltyPoints: 85,
        tier: "Silver",
        totalOrders: 23,
        totalSpent: 234.56,
        lastVisit: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    const mockStaff: Staff[] = [
      {
        id: "barista-1",
        name: "Alex Rodriguez",
        role: "Senior Barista",
        email: "alex@cafe.com",
        phone: "+1234567893",
        isActive: true,
        ordersProcessed: 156,
        averageTime: 4.2,
        rating: 4.8,
      },
      {
        id: "barista-2",
        name: "Jamie Park",
        role: "Barista",
        email: "jamie@cafe.com",
        phone: "+1234567894",
        isActive: true,
        ordersProcessed: 134,
        averageTime: 5.1,
        rating: 4.6,
      },
      {
        id: "manager-1",
        name: "Taylor Smith",
        role: "Manager",
        email: "taylor@cafe.com",
        phone: "+1234567895",
        isActive: true,
        ordersProcessed: 89,
        averageTime: 3.8,
        rating: 4.9,
      },
    ];

    const mockInventory: InventoryItem[] = [
      {
        id: "coffee-beans-1",
        name: "Arabica Coffee Beans",
        category: "Coffee",
        currentStock: 25,
        minStock: 10,
        maxStock: 50,
        unit: "kg",
        cost: 15.99,
        supplier: "Premium Coffee Co.",
        lastRestocked: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "milk-1",
        name: "Whole Milk",
        category: "Dairy",
        currentStock: 8,
        minStock: 5,
        maxStock: 20,
        unit: "liters",
        cost: 3.49,
        supplier: "Local Dairy Farm",
        lastRestocked: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "oat-milk-1",
        name: "Oat Milk",
        category: "Alternative Milk",
        currentStock: 3,
        minStock: 5,
        maxStock: 15,
        unit: "liters",
        cost: 4.99,
        supplier: "Plant Based Co.",
        lastRestocked: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "cups-1",
        name: "Paper Cups (12oz)",
        category: "Supplies",
        currentStock: 150,
        minStock: 100,
        maxStock: 500,
        unit: "pieces",
        cost: 0.12,
        supplier: "Eco Supplies Inc.",
        lastRestocked: new Date(Date.now() - 432000000).toISOString(),
      },
    ];

    const mockOrders: Order[] = [
      {
        id: "order-1703123456789",
        items: [
          {
            drinkId: "latte",
            drinkName: "Latte",
            size: "Large",
            price: 6.5,
            quantity: 1,
            customizations: ["Oat Milk", "Extra Shot"],
          },
          {
            drinkId: "espresso",
            drinkName: "Espresso",
            size: "Double",
            price: 3.5,
            quantity: 2,
          },
        ],
        subtotal: 13.5,
        tax: 1.08,
        discount: 0,
        tip: 2.0,
        total: 16.58,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: "preparing",
        customer: mockCustomers[0],
        paymentMethod: "card",
        paymentStatus: "paid",
        baristaId: "barista-1",
        estimatedTime: 8,
        orderType: "takeaway",
        priority: "normal",
        source: "mobile_app",
        feedback: {
          rating: 5,
          comment: "Perfect as always!",
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
      },
      {
        id: "order-1703123456790",
        items: [
          {
            drinkId: "iced-americano",
            drinkName: "Iced Americano",
            size: "Medium",
            price: 4.5,
            quantity: 1,
          },
          {
            drinkId: "chai-latte",
            drinkName: "Chai Latte",
            size: "Large",
            price: 6.0,
            quantity: 1,
            customizations: ["Almond Milk"],
          },
        ],
        subtotal: 10.5,
        tax: 0.84,
        discount: 1.05,
        tip: 1.5,
        total: 11.79,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: "ready",
        customer: mockCustomers[1],
        paymentMethod: "digital",
        paymentStatus: "paid",
        baristaId: "barista-2",
        estimatedTime: 5,
        orderType: "dine_in",
        tableNumber: 12,
        priority: "normal",
        source: "qr_code",
      },
      {
        id: "order-1703123456791",
        items: [
          {
            drinkId: "cappuccino",
            drinkName: "Cappuccino",
            size: "Small",
            price: 4.0,
            quantity: 3,
          },
        ],
        subtotal: 12.0,
        tax: 0.96,
        discount: 0,
        tip: 2.5,
        total: 15.46,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        baristaId: "barista-1",
        estimatedTime: 6,
        orderType: "takeaway",
        priority: "high",
        source: "pos",
        feedback: {
          rating: 4,
          comment: "Good coffee, quick service",
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
      },
      {
        id: "order-1703123456792",
        items: [
          {
            drinkId: "green-tea",
            drinkName: "Green Tea Latte",
            size: "Medium",
            price: 5.5,
            quantity: 1,
            customizations: ["Extra Matcha", "Oat Milk"],
          },
        ],
        subtotal: 5.5,
        tax: 0.44,
        discount: 0,
        tip: 1.0,
        total: 6.94,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        status: "pending",
        customer: mockCustomers[2],
        paymentMethod: "card",
        paymentStatus: "paid",
        baristaId: "barista-2",
        estimatedTime: 7,
        orderType: "delivery",
        priority: "urgent",
        source: "voice",
      },
    ];

    const mockAnalytics: Analytics = {
      totalRevenue: 2847.65,
      totalOrders: 156,
      averageOrderValue: 18.25,
      activeOrders: 8,
      completedToday: 89,
      pendingOrders: 3,
      customerSatisfaction: 4.7,
      averageWaitTime: 4.8,
      topSellingItems: [
        { name: "Latte", quantity: 45, revenue: 292.5 },
        { name: "Cappuccino", quantity: 38, revenue: 190.0 },
        { name: "Iced Americano", quantity: 32, revenue: 144.0 },
        { name: "Espresso", quantity: 28, revenue: 98.0 },
        { name: "Chai Latte", quantity: 24, revenue: 144.0 },
      ],
      hourlyData: [
        { hour: 7, orders: 12, revenue: 156.8 },
        { hour: 8, orders: 18, revenue: 234.5 },
        { hour: 9, orders: 25, revenue: 342.1 },
        { hour: 10, orders: 22, revenue: 298.7 },
        { hour: 11, orders: 19, revenue: 267.3 },
        { hour: 12, orders: 28, revenue: 389.2 },
        { hour: 13, orders: 24, revenue: 334.6 },
        { hour: 14, orders: 16, revenue: 223.4 },
        { hour: 15, orders: 21, revenue: 289.8 },
        { hour: 16, orders: 18, revenue: 245.1 },
      ],
    };

    setOrders(mockOrders);
    setCustomers(mockCustomers);
    setStaff(mockStaff);
    setInventory(mockInventory);
    setAnalytics(mockAnalytics);
  };

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        setNotifications((prev) => [
          `Order #${orderId.slice(-6)} updated to ${newStatus}`,
          ...prev.slice(0, 4),
        ]);
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.drinkName.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesDate = new Date(order.timestamp) >= today;
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(order.timestamp) >= weekAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export data
  const exportData = (type: "orders" | "customers" | "inventory") => {
    let csvContent = "";
    let filename = "";

    switch (type) {
      case "orders":
        csvContent = [
          [
            "Order ID",
            "Customer",
            "Items",
            "Total",
            "Status",
            "Timestamp",
            "Source",
          ],
          ...filteredOrders.map((order) => [
            order.id,
            order.customer?.name || "Walk-in",
            order.items
              .map(
                (item) => `${item.quantity}x ${item.drinkName} (${item.size})`
              )
              .join("; "),
            order.total.toFixed(2),
            order.status,
            new Date(order.timestamp).toLocaleString(),
            order.source,
          ]),
        ]
          .map((row) => row.join(","))
          .join("\n");
        filename = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "customers":
        csvContent = [
          [
            "Customer ID",
            "Name",
            "Email",
            "Phone",
            "Tier",
            "Points",
            "Total Orders",
            "Total Spent",
            "Last Visit",
          ],
          ...customers.map((customer) => [
            customer.id,
            customer.name,
            customer.email,
            customer.phone,
            customer.tier,
            customer.loyaltyPoints.toString(),
            customer.totalOrders.toString(),
            customer.totalSpent.toFixed(2),
            new Date(customer.lastVisit).toLocaleString(),
          ]),
        ]
          .map((row) => row.join(","))
          .join("\n");
        filename = `customers-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "inventory":
        csvContent = [
          [
            "Item ID",
            "Name",
            "Category",
            "Current Stock",
            "Min Stock",
            "Unit",
            "Cost",
            "Supplier",
            "Last Restocked",
          ],
          ...inventory.map((item) => [
            item.id,
            item.name,
            item.category,
            item.currentStock.toString(),
            item.minStock.toString(),
            item.unit,
            item.cost.toFixed(2),
            item.supplier,
            new Date(item.lastRestocked).toLocaleString(),
          ]),
        ]
          .map((row) => row.join(","))
          .join("\n");
        filename = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status colors
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: Order["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Auto-refresh and notifications
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const mockNotifications = [
          "New order received from mobile app",
          "Order ready for pickup - Table 5",
          "Payment processed successfully",
          "Low stock alert: Oat Milk",
          "Customer feedback received - 5 stars",
          "Staff member clocked in",
          "Daily sales target reached",
          "New customer registered",
        ];
        const randomNotification =
          mockNotifications[
            Math.floor(Math.random() * mockNotifications.length)
          ];
        setNotifications((prev) => [randomNotification, ...prev.slice(0, 4)]);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Check network status
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", checkOnlineStatus);
    window.addEventListener("offline", checkOnlineStatus);

    return () => {
      window.removeEventListener("online", checkOnlineStatus);
      window.removeEventListener("offline", checkOnlineStatus);
    };
  }, []);

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Coffee className="h-8 w-8 text-amber-600" />
            <div>
              <h1
                className={`text-3xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Café Admin Portal Pro
              </h1>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Enterprise POS Management System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Dark Mode
              </span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            {notifications.length > 0 && (
              <div className="relative">
                <Bell
                  className={`h-6 w-6 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
            <Button variant="outline" onClick={() => exportData("orders")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={fetchAllData} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Recent Notifications
                </span>
              </div>
              <div className="space-y-1">
                {notifications.slice(0, 3).map((notification, index) => (
                  <p key={index} className="text-sm text-blue-700">
                    {notification}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics.totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from yesterday
                  </p>
                  <Progress value={75} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Orders Today
                  </CardTitle>
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalOrders}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from yesterday
                  </p>
                  <Progress value={65} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Customer Satisfaction
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.customerSatisfaction.toFixed(1)}/5
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +0.2 from last week
                  </p>
                  <Progress
                    value={analytics.customerSatisfaction * 20}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Wait Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.averageWaitTime.toFixed(1)}min
                  </div>
                  <p className="text-xs text-muted-foreground">
                    -0.5min from yesterday
                  </p>
                  <Progress
                    value={100 - analytics.averageWaitTime * 10}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.hourlyData.map((data) => (
                      <div
                        key={data.hour}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">
                          {data.hour}:00
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${(data.orders / 30) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-16">
                            {data.orders} orders
                          </span>
                          <span className="text-sm text-green-600 w-20">
                            ${data.revenue.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topSellingItems.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {item.quantity} sold
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            ${item.revenue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Inventory Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventory
                    .filter((item) => item.currentStock <= item.minStock)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-orange-800">
                            {item.name}
                          </p>
                          <p className="text-sm text-orange-600">
                            Current: {item.currentStock} {item.unit} | Min:{" "}
                            {item.minStock} {item.unit}
                          </p>
                        </div>
                        <Badge variant="destructive">Low Stock</Badge>
                      </div>
                    ))}
                  {inventory.filter(
                    (item) => item.currentStock <= item.minStock
                  ).length === 0 && (
                    <p className="text-gray-600 text-center py-4">
                      All items are well stocked!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search orders, customers, or items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Coffee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      No orders found matching your criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            Order #{order.id.slice(-6)}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
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
                          {order.priority !== "normal" && (
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {order.source.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">
                            ${order.total.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {order.customer && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {order.customer.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.customer.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">
                                {order.customer.tier}
                              </Badge>
                              <p className="text-sm text-gray-600">
                                {order.customer.loyaltyPoints} points
                              </p>
                            </div>
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

                      {order.feedback && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                              {order.feedback.rating}/5
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            "{order.feedback.comment}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(order.id, "preparing")
                              }
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(order.id, "ready")
                              }
                            >
                              Mark Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(order.id, "completed")
                              }
                            >
                              Complete Order
                            </Button>
                          )}
                          {["pending", "preparing"].includes(order.status) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                updateOrderStatus(order.id, "cancelled")
                              }
                            >
                              Cancel
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {order.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{order.estimatedTime}min</span>
                            </div>
                          )}
                          {order.tableNumber && (
                            <span>Table {order.tableNumber}</span>
                          )}
                          {order.paymentMethod && (
                            <span>Paid via {order.paymentMethod}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="kitchen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders
                .filter((order) =>
                  ["pending", "preparing", "ready"].includes(order.status)
                )
                .sort((a, b) => {
                  const priorityOrder = { urgent: 3, high: 2, normal: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((order) => (
                  <Card
                    key={order.id}
                    className={`${
                      order.status === "ready"
                        ? "border-green-500 bg-green-50"
                        : order.status === "preparing"
                        ? "border-blue-500 bg-blue-50"
                        : "border-yellow-500 bg-yellow-50"
                    } ${
                      order.priority === "urgent" ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          #{order.id.slice(-6)}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {order.priority !== "normal" && (
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {order.estimatedTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{order.estimatedTime} minutes</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="border-b pb-2 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {item.quantity}x {item.drinkName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.size}
                                </p>
                                {item.customizations &&
                                  item.customizations.length > 0 && (
                                    <p className="text-xs text-blue-600">
                                      + {item.customizations.join(", ")}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.customer && (
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-sm font-medium">
                            {order.customer.name}
                          </p>
                          {order.tableNumber && (
                            <p className="text-sm text-gray-600">
                              Table {order.tableNumber}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              updateOrderStatus(order.id, "preparing")
                            }
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, "ready")}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              updateOrderStatus(order.id, "completed")
                            }
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {orders.filter((order) =>
              ["pending", "preparing", "ready"].includes(order.status)
            ).length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-gray-600">
                    All orders completed! No active orders in the kitchen.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Customer Management</h2>
              <Button onClick={() => exportData("customers")}>
                <Download className="h-4 w-4 mr-2" />
                Export Customers
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <Badge variant="secondary">{customer.tier}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-medium">
                          Loyalty Points
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {customer.loyaltyPoints}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Total Orders
                        </span>
                        <span className="text-sm font-bold">
                          {customer.totalOrders}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Spent</span>
                        <span className="text-sm font-bold text-green-600">
                          ${customer.totalSpent.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Last Visit</span>
                        <span className="text-sm">
                          {new Date(customer.lastVisit).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              <Button onClick={() => exportData("inventory")}>
                <Download className="h-4 w-4 mr-2" />
                Export Inventory
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <Card
                  key={item.id}
                  className={
                    item.currentStock <= item.minStock ? "border-red-200" : ""
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {item.currentStock <= item.minStock && (
                        <Badge variant="destructive">Low Stock</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Current Stock
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            item.currentStock <= item.minStock
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.currentStock <= item.minStock
                              ? "bg-red-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (item.currentStock / item.maxStock) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Cost per {item.unit}
                        </span>
                        <span className="text-sm font-bold">
                          ${item.cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Supplier: {item.supplier}</p>
                        <p>
                          Last Restocked:{" "}
                          {new Date(item.lastRestocked).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Staff Management</h2>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-sm text-gray-600">{member.phone}</p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-medium">
                          Orders Processed
                        </span>
                        <span className="text-sm font-bold">
                          {member.ordersProcessed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Avg Time</span>
                        <span className="text-sm font-bold">
                          {member.averageTime.toFixed(1)}min
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-bold">
                            {member.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>
            Last updated: {lastUpdate.toLocaleString()} | Total orders in
            system: {orders.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

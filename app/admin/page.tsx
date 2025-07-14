import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../src/components/ui/select";
import { Input } from "../../src/components/ui/input";
import {
  RefreshCw,
  Coffee,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Bell,
} from "lucide-react";
import { useToast } from "../../src/hooks/use-toast";

interface OrderItem {
  drinkId: string;
  drinkName: string;
  size: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  timestamp: string;
  status:
    | "pending"
    | "submitted"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  customer?: Customer;
  paymentMethod?: "cash" | "card" | "digital";
  paymentStatus: "pending" | "paid" | "failed";
  baristaId?: string;
  estimatedTime?: number;
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topDrinks: { name: string; count: number; revenue: number }[];
  hourlyStats: { hour: number; orders: number; revenue: number }[];
  customerStats: { returning: number; new: number };
}

export default function AdminPortal() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [notifications, setNotifications] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(
          data.orders.sort(
            (a: Order, b: Order) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );

        // Calculate analytics
        calculateAnalytics(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (orderData: Order[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orderData.filter(
      (order) => new Date(order.timestamp) >= today
    );

    const totalRevenue = todayOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const totalOrders = todayOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top drinks
    const drinkCounts: { [key: string]: { count: number; revenue: number } } =
      {};
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!drinkCounts[item.drinkName]) {
          drinkCounts[item.drinkName] = { count: 0, revenue: 0 };
        }
        drinkCounts[item.drinkName].count += item.quantity;
        drinkCounts[item.drinkName].revenue += item.price * item.quantity;
      });
    });

    const topDrinks = Object.entries(drinkCounts)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Hourly stats
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourOrders = todayOrders.filter((order) => {
        const orderHour = new Date(order.timestamp).getHours();
        return orderHour === hour;
      });
      return {
        hour,
        orders: hourOrders.length,
        revenue: hourOrders.reduce((sum, order) => sum + order.total, 0),
      };
    });

    // Customer stats (mock data)
    const customerStats = {
      returning: Math.floor(totalOrders * 0.6),
      new: Math.floor(totalOrders * 0.4),
    };

    setAnalytics({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topDrinks,
      hourlyStats,
      customerStats,
    });
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
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

        toast({
          title: "Order Updated",
          description: `Order #${orderId.slice(-6)} marked as ${newStatus}`,
        });

        // Add notification
        setNotifications((prev) => [
          `Order #${orderId.slice(-6)} updated to ${newStatus}`,
          ...prev.slice(0, 4),
        ]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket simulation for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        // 20% chance of new notification
        const mockNotifications = [
          "New order received",
          "Order ready for pickup",
          "Low stock alert: Green Tea Latte",
          "Payment processed successfully",
        ];
        const randomNotification =
          mockNotifications[
            Math.floor(Math.random() * mockNotifications.length)
          ];
        setNotifications((prev) => [randomNotification, ...prev.slice(0, 4)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportData = () => {
    const csvContent = [
      ["Order ID", "Customer", "Items", "Total", "Status", "Timestamp"],
      ...filteredOrders.map((order) => [
        order.id,
        order.customer?.name || "Walk-in",
        order.items
          .map((item) => `${item.quantity}x ${item.drinkName} (${item.size})`)
          .join("; "),
        order.total.toFixed(2),
        order.status,
        formatTimestamp(order.timestamp),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Coffee className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Café Admin Portal
              </h1>
              <p className="text-gray-600">Real-time dashboard and analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={fetchOrders} disabled={loading}>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="kitchen">Kitchen Display</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Orders
                  </CardTitle>
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.totalOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics?.totalRevenue.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Order Value
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics?.averageOrderValue.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +2% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Orders
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      orders.filter((o) =>
                        ["preparing", "ready"].includes(o.status)
                      ).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Orders in progress
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Drinks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Drinks Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.topDrinks.map((drink, index) => (
                      <div
                        key={drink.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-amber-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{drink.name}</p>
                            <p className="text-sm text-gray-600">
                              {drink.count} sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            ${drink.revenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">
                        No data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            Order #{order.id.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer?.name || "Walk-in"} •{" "}
                            {formatTimestamp(order.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="font-bold">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* Filters */}
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

            {/* Orders List */}
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
                  <Card key={order.id}>
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
                          {order.estimatedTime &&
                            order.status === "preparing" && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {order.estimatedTime}min
                              </Badge>
                            )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">
                            ${order.total.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTimestamp(order.timestamp)}
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
                            <Badge variant="secondary">
                              {order.customer.loyaltyPoints} points
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm"
                          >
                            <span>
                              {item.quantity}x {item.drinkName} ({item.size})
                            </span>
                            <span className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

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
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.paymentMethod &&
                            `Paid via ${order.paymentMethod}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.hourlyStats
                      .filter((stat) => stat.orders > 0)
                      .map((stat) => (
                        <div
                          key={stat.hour}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {stat.hour}:00 - {stat.hour + 1}:00
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              {stat.orders} orders
                            </span>
                            <span className="font-medium">
                              ${stat.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )) || (
                      <p className="text-gray-500 text-center py-4">
                        No hourly data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Returning Customers</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{
                              width: `${
                                ((analytics?.customerStats.returning || 0) /
                                  (analytics?.totalOrders || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {analytics?.customerStats.returning || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>New Customers</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${
                                ((analytics?.customerStats.new || 0) /
                                  (analytics?.totalOrders || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {analytics?.customerStats.new || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kitchen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders
                .filter((order) =>
                  ["preparing", "ready"].includes(order.status)
                )
                .map((order) => (
                  <Card
                    key={order.id}
                    className={
                      order.status === "ready"
                        ? "border-green-500 bg-green-50"
                        : "border-blue-500 bg-blue-50"
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          #{order.id.slice(-6)}
                        </CardTitle>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
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
                            className="flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">
                                {item.quantity}x {item.drinkName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.size}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.customer && (
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-sm font-medium">
                            {order.customer.name}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
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
              ["preparing", "ready"].includes(order.status)
            ).length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Coffee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    No active orders in the kitchen
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

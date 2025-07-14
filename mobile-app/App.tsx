import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { DrinkSelection, mockDrinks } from "./src/components/DrinkSelection";
import { OrderSummary } from "./src/components/OrderSummary";
import { OrderService } from "./src/services/OrderService";
import { StorageService } from "./src/services/StorageService";
import { NetworkService } from "./src/services/NetworkService";
import type { Order, OrderItem, Customer, DrinkOption } from "./src/types";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [currentOrder, setCurrentOrder] = useState<Order>({
    id: "",
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    tip: 0,
    total: 0,
    timestamp: "",
    status: "pending",
    paymentStatus: "pending",
    orderType: "takeaway",
    priority: "normal",
    source: "mobile_app",
  });

  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const orderService = new OrderService("https://your-api-base-url.com");
  const storageService = new StorageService();
  const networkService = new NetworkService();

  useEffect(() => {
    initializeApp();
    setupNetworkListener();
    setupNotifications();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Load saved data
      const savedCustomer = await storageService.getCustomer();
      const savedOrders = await storageService.getOrderHistory();
      const savedSettings = await storageService.getSettings();

      if (savedCustomer) setCustomer(savedCustomer);
      if (savedOrders) setOrderHistory(savedOrders);
      if (savedSettings) {
        setDarkMode(savedSettings.darkMode || false);
        setLoyaltyPoints(savedSettings.loyaltyPoints || 0);
      }

      // Sync with server if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await syncWithServer();
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearOrder = () => {
    setCurrentOrder({
      id: "",
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      tip: 0,
      total: 0,
      timestamp: "",
      status: "pending",
      paymentStatus: "pending",
      orderType: "takeaway",
      priority: "normal",
      source: "mobile_app",
    });
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected || false);
      if (state.isConnected) {
        syncWithServer();
      }
    });
    return unsubscribe;
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please enable notifications for order updates"
      );
      return;
    }

    // Listen for notifications
    Notifications.addNotificationReceivedListener((notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data.orderId) {
        // Navigate to order details
        console.log("Navigate to order:", data.orderId);
      }
    });
  };

  const syncWithServer = async () => {
    try {
      // Sync pending orders
      const pendingOrders = await storageService.getPendingOrders();
      for (const order of pendingOrders) {
        try {
          await orderService.submitOrder(order);
          // Remove the order from pending orders and save the updated list
          const allPendingOrders = await storageService.getPendingOrders();
          const updatedPendingOrders = allPendingOrders.filter(
            (o: Order) => o.id !== order.id
          );
          await storageService.savePendingOrders(updatedPendingOrders);
        } catch (error) {
          console.error("Error syncing order:", error);
        }
      }

      // Fetch latest order history
      if (customer) {
        const serverOrders = await orderService.getOrderHistory(customer.id);
        setOrderHistory(serverOrders);
        await storageService.saveOrderHistory(serverOrders);
      }
    } catch (error) {
      console.error("Error syncing with server:", error);
    }
  };

  const addItemToOrder = (
    drink: DrinkOption,
    size: string,
    price: number,
    customizations?: string[]
  ) => {
    const item: OrderItem = {
      drinkId: drink.id,
      drinkName: drink.name,
      size,
      price,
      quantity: 1,
      customizations: customizations ?? [],
    };

    const existingItemIndex = currentOrder.items.findIndex(
      (orderItem) =>
        orderItem.drinkId === item.drinkId &&
        orderItem.size === item.size &&
        JSON.stringify(orderItem.customizations) ===
          JSON.stringify(item.customizations)
    );

    let updatedItems;
    if (existingItemIndex >= 0) {
      updatedItems = [...currentOrder.items];
      updatedItems[existingItemIndex].quantity += item.quantity;
    } else {
      updatedItems = [...currentOrder.items, item];
    }

    const subtotal = updatedItems.reduce(
      (sum, orderItem) => sum + orderItem.price * orderItem.quantity,
      0
    );
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax + currentOrder.discount + currentOrder.tip;

    setCurrentOrder({
      ...currentOrder,
      items: updatedItems,
      subtotal,
      tax,
      total,
    });
  };

  const removeItemFromOrder = (index: number) => {
    const updatedItems = currentOrder.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08;
    const total = subtotal + tax + currentOrder.discount + currentOrder.tip;

    setCurrentOrder({
      ...currentOrder,
      items: updatedItems,
      subtotal,
      tax,
      total,
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(index);
      return;
    }

    const updatedItems = [...currentOrder.items];
    updatedItems[index].quantity = quantity;

    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08;
    const total = subtotal + tax + currentOrder.discount + currentOrder.tip;

    setCurrentOrder({
      ...currentOrder,
      items: updatedItems,
      subtotal,
      tax,
      total,
    });
  };

  const submitOrder = async () => {
    if (currentOrder.items.length === 0) {
      Alert.alert("Empty Order", "Please add items to your order");
      return;
    }

    try {
      setLoading(true);

      const orderToSubmit: Order = {
        ...currentOrder,
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        customer: customer ?? undefined,
      };

      if (isOnline) {
        // Submit to server
        const submittedOrder = await orderService.submitOrder(orderToSubmit);

        if (
          submittedOrder === undefined ||
          submittedOrder === null ||
          typeof submittedOrder !== "object" ||
          !("id" in submittedOrder)
        ) {
          throw new Error(
            "Order submission failed or did not return an order object."
          );
        }

        // Add to order history
        const updatedHistory = [submittedOrder, ...orderHistory].filter(
          (order): order is Order => !!order
        );
        setOrderHistory(updatedHistory);
        await storageService.saveOrderHistory(updatedHistory);

        // Update loyalty points
        const pointsEarned = Math.floor(orderToSubmit.total);
        setLoyaltyPoints((prev) => prev + pointsEarned);

        // Show success notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Order Submitted!",
            body: `Your order #${submittedOrder.id.slice(
              -6
            )} has been received. Estimated time: 8-12 minutes.`,
            data: { orderId: submittedOrder.id },
          },
          trigger: null,
        });

        Alert.alert(
          "Order Submitted!",
          `Your order has been received.\nOrder ID: #${submittedOrder.id.slice(
            -6
          )}\nEstimated time: 8-12 minutes\nPoints earned: ${pointsEarned}`,
          [{ text: "OK" }]
        );
      } else {
        // Save for later sync
        await storageService.savePendingOrders(
          Array.isArray(orderToSubmit) ? orderToSubmit : [orderToSubmit]
        );

        Alert.alert(
          "Order Saved",
          "You're offline. Your order will be submitted when connection is restored.",
          [{ text: "OK" }]
        );
      }

      // Reset current order
      setCurrentOrder({
        id: "",
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        tip: 0,
        total: 0,
        timestamp: "",
        status: "pending",
        paymentStatus: "pending",
        orderType: "takeaway",
        priority: "normal",
        source: "mobile_app",
      });
    } catch (error) {
      console.error("Error submitting order:", error);
      Alert.alert("Error", "Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isOnline) {
      await syncWithServer();
    }
    setRefreshing(false);
  };

  const saveCustomer = async (customerData: Customer) => {
    setCustomer(customerData);
    await storageService.saveCustomer(customerData);
    setShowCustomerModal(false);
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    await storageService.saveSettings({ darkMode: newDarkMode, loyaltyPoints });
  };

  const styles = getStyles(darkMode);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? "#1a1a1a" : "#ffffff"}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cafe" size={28} color="#8B4513" />
          <Text style={styles.headerTitle}>Café POS</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.connectionStatus}>
            <Ionicons
              name={(isOnline ? "wifi" : "wifi-off") as any}
              size={20}
              color={isOnline ? "#4CAF50" : "#F44336"}
            />{" "}
            <Text
              style={[
                styles.connectionText,
                { color: isOnline ? "#4CAF50" : "#F44336" },
              ]}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowSettingsModal(true)}>
            <Ionicons
              name="settings"
              size={24}
              color={darkMode ? "#ffffff" : "#333333"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Info */}
      {customer && (
        <View style={styles.customerInfo}>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>Welcome, {customer.name}!</Text>
            <Text style={styles.customerTier}>{customer.tier} Member</Text>
          </View>
          <View style={styles.loyaltyPoints}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.pointsText}>{loyaltyPoints} points</Text>
          </View>
        </View>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <View style={styles.notificationBanner}>
          <Ionicons name="notifications" size={16} color="#FF9800" />
          <Text style={styles.notificationText}>
            {notifications[0].request.content.title}
          </Text>
          <TouchableOpacity onPress={() => setNotifications([])}>
            <Ionicons name="close" size={16} color="#FF9800" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowOrderHistory(true)}
          >
            <Ionicons name="time" size={20} color="#8B4513" />
            <Text style={styles.actionText}>Order History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCustomerModal(true)}
          >
            <Ionicons name="person" size={20} color="#8B4513" />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="gift" size={20} color="#8B4513" />
            <Text style={styles.actionText}>Rewards</Text>
          </TouchableOpacity>
        </View>

        {/* Drink Selection */}
        <DrinkSelection
          drinks={mockDrinks}
          darkMode={darkMode}
          onAddToOrder={addItemToOrder}
        />

        {/* Current Order Summary */}
        {currentOrder.items.length > 0 && (
          <OrderSummary
            items={currentOrder.items}
            subtotal={currentOrder.subtotal}
            tax={currentOrder.tax}
            total={currentOrder.total}
            onUpdateQuantity={updateItemQuantity}
            onClearOrder={clearOrder}
            onSubmitOrder={submitOrder}
            isSubmitting={loading}
            isOnline={isOnline}
          />
        )}
      </ScrollView>

      {/* Order History Modal */}
      <Modal
        visible={showOrderHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order History</Text>
            <TouchableOpacity onPress={() => setShowOrderHistory(false)}>
              <Ionicons
                name="close"
                size={24}
                color={darkMode ? "#ffffff" : "#333333"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {orderHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#cccccc" />
                <Text style={styles.emptyStateText}>No orders yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your order history will appear here
                </Text>
              </View>
            ) : (
              orderHistory.map((order, index) => (
                <View key={order.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyOrderId}>
                      #{order.id.slice(-6)}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(order.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.historyItems}>
                    {order.items
                      .map((item) => `${item.quantity}x ${item.drinkName}`)
                      .join(", ")}
                  </Text>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyTotal}>
                      ${order.total.toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Customer Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Customer Profile</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={darkMode ? "#ffffff" : "#333333"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <CustomerForm
              customer={customer}
              onSave={saveCustomer}
              darkMode={darkMode}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={darkMode ? "#ffffff" : "#333333"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={toggleDarkMode} />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto-sync</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>

            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="help-circle" size={20} color="#8B4513" />
              <Text style={styles.settingButtonText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <Ionicons name="information-circle" size={20} color="#8B4513" />
              <Text style={styles.settingButtonText}>About</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Customer Form Component
const CustomerForm = ({ customer, onSave, darkMode }: any) => {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    const customerData: Customer = {
      id: customer?.id || `customer-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      loyaltyPoints: customer?.loyaltyPoints || 0,
      tier: customer?.tier || "Bronze",

      preferences: customer?.preferences || [],
      allergens: customer?.allergens || [],
      favoriteOrders: customer?.favoriteOrders || [],
      totalSpent: customer?.totalSpent || 0,
      visitCount: customer?.visitCount || 0,
      lastVisit: customer?.lastVisit || new Date().toISOString(),
      totalOrders: 0,
    };

    onSave(customerData);
  };

  const styles = getStyles(darkMode);

  return (
    <View style={styles.form}>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Name *</Text>
        <TextInput
          style={styles.formInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={darkMode ? "#888888" : "#cccccc"}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Email</Text>
        <TextInput
          style={styles.formInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={darkMode ? "#888888" : "#cccccc"}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Phone</Text>
        <TextInput
          style={styles.formInput}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          placeholderTextColor={darkMode ? "#888888" : "#cccccc"}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#FFA726";
    case "preparing":
      return "#42A5F5";
    case "ready":
      return "#66BB6A";
    case "completed":
      return "#78909C";
    case "cancelled":
      return "#EF5350";
    default:
      return "#78909C";
  }
};

// Styles function
const getStyles = (darkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: darkMode ? "#ffffff" : "#333333",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginLeft: 12,
      color: darkMode ? "#ffffff" : "#333333",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    connectionStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    connectionText: {
      fontSize: 12,
      fontWeight: "500",
    },
    customerInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
    },
    customerDetails: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontWeight: "600",
      color: darkMode ? "#ffffff" : "#333333",
    },
    customerTier: {
      fontSize: 12,
      color: "#8B4513",
      marginTop: 2,
    },
    loyaltyPoints: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    pointsText: {
      fontSize: 14,
      fontWeight: "500",
      color: darkMode ? "#ffffff" : "#333333",
    },
    notificationBanner: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: "#FFF3E0",
      borderBottomWidth: 1,
      borderBottomColor: "#FFE0B2",
      gap: 8,
    },
    notificationText: {
      flex: 1,
      fontSize: 14,
      color: "#E65100",
    },
    content: {
      flex: 1,
    },
    quickActions: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: darkMode ? "#333333" : "#e0e0e0",
      gap: 8,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "500",
      color: darkMode ? "#ffffff" : "#333333",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#333333",
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: darkMode ? "#ffffff" : "#333333",
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: darkMode ? "#888888" : "#666666",
      marginTop: 8,
    },
    historyItem: {
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: darkMode ? "#333333" : "#e0e0e0",
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    historyOrderId: {
      fontSize: 16,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#333333",
    },
    historyDate: {
      fontSize: 12,
      color: darkMode ? "#888888" : "#666666",
    },
    historyItems: {
      fontSize: 14,
      color: darkMode ? "#cccccc" : "#555555",
      marginBottom: 12,
    },
    historyFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    historyTotal: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#4CAF50",
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#ffffff",
      textTransform: "capitalize",
    },
    form: {
      paddingVertical: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: darkMode ? "#ffffff" : "#333333",
      marginBottom: 8,
    },
    formInput: {
      borderWidth: 1,
      borderColor: darkMode ? "#333333" : "#e0e0e0",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      color: darkMode ? "#ffffff" : "#333333",
    },
    saveButton: {
      backgroundColor: "#8B4513",
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#ffffff",
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
    },
    settingLabel: {
      fontSize: 16,
      color: darkMode ? "#ffffff" : "#333333",
    },
    settingButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
      gap: 12,
    },
    settingButtonText: {
      fontSize: 16,
      color: darkMode ? "#ffffff" : "#333333",
    },
  });

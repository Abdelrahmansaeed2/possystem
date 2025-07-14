import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { OrderItem } from "../types";

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  onUpdateQuantity: (index: number, change: number) => void;
  onClearOrder: () => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
  isOnline: boolean;
}

export function OrderSummary({
  items,
  subtotal,
  tax,
  total,
  onUpdateQuantity,
  onClearOrder,
  onSubmitOrder,
  isSubmitting,
  isOnline,
}: OrderSummaryProps) {
  const handleSubmit = () => {
    if (!isOnline) {
      Alert.alert(
        "Offline Mode",
        "You are currently offline. The order will be saved locally and synced when connection is restored.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Save Offline", onPress: onSubmitOrder },
        ]
      );
    } else {
      onSubmitOrder();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Summary</Text>
        <TouchableOpacity onPress={onClearOrder} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.drinkName}</Text>
              <Text style={styles.itemDetails}>
                {item.size} - ${item.price.toFixed(2)}
              </Text>
              {item.customizations && item.customizations.length > 0 && (
                <Text style={styles.customizations}>
                  + {item.customizations.join(", ")}
                </Text>
              )}
              {item.specialInstructions && (
                <Text style={styles.specialInstructions}>
                  Note: {item.specialInstructions}
                </Text>
              )}
            </View>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onUpdateQuantity(index, -1)}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.quantity}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onUpdateQuantity(index, 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.itemTotal}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax (8%):</Text>
          <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
        </View>

        <View style={[styles.totalRow, styles.finalTotal]}>
          <Text style={styles.finalTotalLabel}>Total:</Text>
          <Text style={styles.finalTotalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          !isOnline && styles.offlineButton,
          isSubmitting && styles.submittingButton,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.submittingContent}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>
            {isOnline ? "Submit Order" : "Save Offline"}
          </Text>
        )}
      </TouchableOpacity>

      {!isOnline && (
        <Text style={styles.offlineNote}>
          Order will be synced when connection is restored
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#dc3545",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  itemsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 2,
  },
  customizations: {
    fontSize: 12,
    color: "#007bff",
    marginBottom: 2,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  quantityButton: {
    backgroundColor: "#007bff",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    minWidth: 60,
    textAlign: "right",
  },

  totalsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 12,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  totalLabel: {
    fontSize: 14,
    color: "#6c757d",
  },

  totalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },

  finalTotal: {
    marginTop: 8,
  },

  finalTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },

  finalTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },

  quantity: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  specialInstructions: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 2,
  },
  submitButton: {
    backgroundColor: "#28a745",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  offlineButton: {
    backgroundColor: "#dc3545",
  },
  submittingButton: {
    backgroundColor: "#6c757d",
  },
  submittingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  offlineNote: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 8,
  },
});

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import type { DrinkOption } from "../types";
import { DrinkCustomization } from "./../components/DrinkCustomization";

interface DrinkSelectionProps {
  drinks: DrinkOption[];
  darkMode: boolean; // ← add this line

  onAddToOrder: (
    drink: DrinkOption,
    size: string,
    price: number,
    customizations?: string[]
  ) => void;
}

export const mockDrinks: DrinkOption[] = [
  {
    id: "1",
    name: "Cappuccino",
    description: "Rich espresso with steamed milk and foam.",
    category: "Coffee",
    image: "https://source.unsplash.com/80x80/?cappuccino",
    preparationTime: 5,
    isPopular: true,
    isNew: false,
    rating: 4.8,
    customizations: ["Extra Shot", "Oat Milk", "Vanilla Syrup"],
    sizes: [
      { size: "Small", price: 3.5 },
      { size: "Medium", price: 4.5 },
      { size: "Large", price: 5.5 },
    ],
    stock: 25,
    lowStockThreshold: 5,
    allergens: ["Milk"],
    nutritionInfo: {
      calories: 120,
      caffeine: 80,
      sugar: 10,
    },
  },
  {
    id: "2",
    name: "Green Tea",
    description: "Refreshing antioxidant-rich green tea.",
    category: "Tea",
    image: "https://source.unsplash.com/80x80/?greentea",
    preparationTime: 3,
    isPopular: false,
    isNew: true,
    rating: 4.5,
    customizations: [],
    sizes: [
      { size: "Small", price: 2.5 },
      { size: "Large", price: 3.5 },
    ],
    stock: 15,
    lowStockThreshold: 3,
    allergens: [],
    nutritionInfo: {
      calories: 0,
      caffeine: 30,
      sugar: 0,
    },
  },
];

export function DrinkSelection({ drinks, onAddToOrder }: DrinkSelectionProps) {
  const [selectedDrink, setSelectedDrink] = useState<DrinkOption | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [showCustomization, setShowCustomization] = useState(false);

  const handleDrinkPress = (
    drink: DrinkOption,
    size: string,
    price: number
  ) => {
    setSelectedDrink(drink);
    setSelectedSize(size);
    setSelectedPrice(price);

    if (drink.customizations.length > 0) {
      setShowCustomization(true);
    } else {
      onAddToOrder(drink, size, price);
    }
  };

  const handleCustomizationComplete = (customizations: string[]) => {
    if (selectedDrink) {
      onAddToOrder(selectedDrink, selectedSize, selectedPrice, customizations);
    }
    setShowCustomization(false);
    setSelectedDrink(null);
  };

  const categories = Array.from(new Set(drinks.map((drink) => drink.category)));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Drinks</Text>

      {categories.map((category) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>

          {drinks
            .filter((drink) => drink.category === category)
            .map((drink) => (
              <View key={drink.id} style={styles.drinkCard}>
                <View style={styles.drinkHeader}>
                  <Image
                    source={{ uri: drink.image }}
                    style={styles.drinkImage}
                  />
                  <View style={styles.drinkInfo}>
                    <View style={styles.drinkTitleRow}>
                      <Text style={styles.drinkName}>{drink.name}</Text>
                      {drink.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>Popular</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.drinkDescription}>
                      {drink.description}
                    </Text>
                    <Text style={styles.prepTime}>
                      Prep time: {drink.preparationTime} min
                    </Text>
                  </View>
                </View>

                <View style={styles.sizesContainer}>
                  {drink.sizes.map((sizeOption) => (
                    <TouchableOpacity
                      key={sizeOption.size}
                      style={styles.sizeButton}
                      onPress={() =>
                        handleDrinkPress(
                          drink,
                          sizeOption.size,
                          sizeOption.price
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sizeText}>{sizeOption.size}</Text>
                      <Text style={styles.priceText}>
                        ${sizeOption.price.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {drink.customizations.length > 0 && (
                  <Text style={styles.customizationHint}>
                    Tap to customize with {drink.customizations.length} options
                  </Text>
                )}
              </View>
            ))}
        </View>
      ))}

      <Modal
        visible={showCustomization}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomization(false)}
      >
        {selectedDrink && (
          <DrinkCustomization
            drink={selectedDrink}
            size={selectedSize}
            price={selectedPrice}
            onComplete={handleCustomizationComplete}
            onCancel={() => setShowCustomization(false)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
    paddingLeft: 4,
  },
  drinkCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  drinkHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  drinkImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
  },
  popularBadge: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#212529",
  },
  drinkDescription: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  prepTime: {
    fontSize: 12,
    color: "#6c757d",
  },
  sizesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  priceText: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.9,
  },
  customizationHint: {
    fontSize: 12,
    color: "#007bff",
    marginTop: 8,
    fontStyle: "italic",
  },
});

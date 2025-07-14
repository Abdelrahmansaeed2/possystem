"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { DrinkOption } from "../types"

interface DrinkCustomizationProps {
  drink: DrinkOption
  size: string
  price: number
  onComplete: (customizations: string[], specialInstructions?: string) => void
  onCancel: () => void
  darkMode?: boolean
}

export function DrinkCustomization({ 
  drink, 
  size, 
  price, 
  onComplete, 
  onCancel, 
  darkMode = false 
}: DrinkCustomizationProps) {
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")

  const toggleCustomization = (customization: string) => {
    setSelectedCustomizations((prev) =>
      prev.includes(customization) ? prev.filter((c) => c !== customization) : [...prev, customization],
    )
  }

  const handleComplete = () => {
    onComplete(selectedCustomizations, specialInstructions)
  }

  const styles = getStyles(darkMode)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={darkMode ? "#ffffff" : "#333333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Order</Text>
        <TouchableOpacity onPress={handleComplete} style={styles.headerButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Drink Info */}
        <View style={styles.drinkInfo}>
          <Image source={{ uri: drink.image }} style={styles.drinkImage} />
          <View style={styles.drinkDetails}>
            <Text style={styles.drinkName}>{drink.name}</Text>
            <Text style={styles.drinkSize}>
              {size} - ${price.toFixed(2)}
            </Text>
            <Text style={styles.drinkDescription}>{drink.description}</Text>
          </View>
        </View>

        {/* Nutrition Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Information</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{drink.nutritionInfo.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{drink.nutritionInfo.caffeine}mg</Text>
              <Text style={styles.nutritionLabel}>Caffeine</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{drink.nutritionInfo.sugar}g</Text>
              <Text style={styles.nutritionLabel}>Sugar</Text>
            </View>
          </View>
        </View>

        {/* Allergen Info */}
        {drink.allergens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergen Information</Text>
            <View style={styles.allergenContainer}>
              <Ionicons name="warning" size={16} color="#FF6B6B" />
              <Text style={styles.allergenText}>Contains: {drink.allergens.join(", ")}</Text>
            </View>
          </View>
        )}

        {/* Customizations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customizations</Text>
          <View style={styles.customizationList}>
            {drink.customizations.map((customization) => (
              <TouchableOpacity
                key={customization}
                style={[
                  styles.customizationItem,
                  selectedCustomizations.includes(customization) && styles.customizationItemSelected,
                ]}
                onPress={() => toggleCustomization(customization)}
              >
                <Text
                  style={[
                    styles.customizationText,
                    selectedCustomizations.includes(customization) && styles.customizationTextSelected,
                  ]}
                >
                  {customization}
                </Text>
                {selectedCustomizations.includes(customization) && (
                  <Ionicons name="checkmark" size={20} color="#8B4513" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Any special requests or notes..."
            placeholderTextColor={darkMode ? "#888888" : "#cccccc"}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Selected Summary */}
        {selectedCustomizations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Customizations</Text>
            <View style={styles.selectedSummary}>
              {selectedCustomizations.map((customization) => (
                <View key={customization} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{customization}</Text>
                  <TouchableOpacity onPress={() => toggleCustomization(customization)}>
                    <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add to Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleComplete}>
          <Text style={styles.addButtonText}>Add to Order - ${price.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const getStyles = (darkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
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
    headerButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#333333",
    },
    doneText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#8B4513",
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    drinkInfo: {
      flexDirection: "row",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
    },
    drinkImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 16,
    },
    drinkDetails: {
      flex: 1,
    },
    drinkName: {
      fontSize: 20,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#333333",
      marginBottom: 4,
    },
    drinkSize: {
      fontSize: 16,
      color: "#8B4513",
      marginBottom: 8,
    },
    drinkDescription: {
      fontSize: 14,
      color: darkMode ? "#cccccc" : "#666666",
      lineHeight: 20,
    },
    section: {
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? "#333333" : "#e0e0e0",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#333333",
      marginBottom: 12,
    },
    nutritionGrid: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    nutritionItem: {
      alignItems: "center",
    },
    nutritionValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#8B4513",
      marginBottom: 4,
    },
    nutritionLabel: {
      fontSize: 12,
      color: darkMode ? "#cccccc" : "#666666",
    },
    allergenContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFF3E0",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FFE0B2",
    },
    allergenText: {
      fontSize: 14,
      color: "#E65100",
      marginLeft: 8,
      fontWeight: "500",
    },
    customizationList: {
      gap: 8,
    },
    customizationItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: darkMode ? "#333333" : "#e0e0e0",
    },
    customizationItemSelected: {
      borderColor: "#8B4513",
      backgroundColor: darkMode ? "#3a2a1a" : "#FFF8E1",
    },
    customizationText: {
      fontSize: 16,
      color: darkMode ? "#ffffff" : "#333333",
    },
    customizationTextSelected: {
      color: "#8B4513",
      fontWeight: "500",
    },
    textInput: {
      borderWidth: 1,
      borderColor: darkMode ? "#333333" : "#e0e0e0",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      color: darkMode ? "#ffffff" : "#333333",
      textAlignVertical: "top",
      minHeight: 80,
    },
    selectedSummary: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    selectedItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#8B4513",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 8,
    },
    selectedItemText: {
      fontSize: 14,
      color: "#ffffff",
      fontWeight: "500",
    },
    footer: {
      padding: 20,
      backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
      borderTopWidth: 1,
      borderTopColor: darkMode ? "#333333" : "#e0e0e0",
    },
    addButton: {
      backgroundColor: "#8B4513",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    addButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#ffffff",
    },
  })
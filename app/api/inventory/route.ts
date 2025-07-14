import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission, PERMISSIONS } from "@/lib/auth"

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  costPerUnit: number
  sellingPrice?: number
  supplier: string
  supplierContact: string
  lastRestocked: string
  expiryDate?: string
  batchNumber?: string
  location: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Mock inventory data
const mockInventory: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Arabica Coffee Beans",
    category: "Coffee",
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    unit: "kg",
    costPerUnit: 15.99,
    sellingPrice: 24.99,
    supplier: "Premium Coffee Co.",
    supplierContact: "orders@premiumcoffee.com",
    lastRestocked: new Date(Date.now() - 172800000).toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 180).toISOString(),
    batchNumber: "PCO-2024-001",
    location: "Storage Room A",
    notes: "Single origin, medium roast",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "inv-2",
    name: "Whole Milk",
    category: "Dairy",
    currentStock: 8,
    minStock: 5,
    maxStock: 20,
    unit: "liters",
    costPerUnit: 3.49,
    supplier: "Local Dairy Farm",
    supplierContact: "supply@localdairy.com",
    lastRestocked: new Date(Date.now() - 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    batchNumber: "LDF-2024-045",
    location: "Refrigerator 1",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "inv-3",
    name: "Oat Milk",
    category: "Alternative Milk",
    currentStock: 3,
    minStock: 5,
    maxStock: 15,
    unit: "liters",
    costPerUnit: 4.99,
    sellingPrice: 7.99,
    supplier: "Plant Based Co.",
    supplierContact: "orders@plantbased.com",
    lastRestocked: new Date(Date.now() - 259200000).toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    batchNumber: "PBC-2024-023",
    location: "Refrigerator 2",
    notes: "Organic, unsweetened",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "inv-4",
    name: "Paper Cups (12oz)",
    category: "Supplies",
    currentStock: 150,
    minStock: 100,
    maxStock: 500,
    unit: "pieces",
    costPerUnit: 0.12,
    supplier: "Eco Supplies Inc.",
    supplierContact: "sales@ecosupplies.com",
    lastRestocked: new Date(Date.now() - 432000000).toISOString(),
    batchNumber: "ESI-2024-089",
    location: "Storage Room B",
    notes: "Biodegradable, recyclable",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: "inv-5",
    name: "Vanilla Syrup",
    category: "Syrups",
    currentStock: 6,
    minStock: 3,
    maxStock: 12,
    unit: "bottles",
    costPerUnit: 8.99,
    sellingPrice: 15.99,
    supplier: "Flavor Masters Ltd.",
    supplierContact: "wholesale@flavormasters.com",
    lastRestocked: new Date(Date.now() - 345600000).toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 365).toISOString(),
    batchNumber: "FML-2024-156",
    location: "Syrup Station",
    notes: "Natural vanilla extract",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "inv-6",
    name: "Sugar Packets",
    category: "Sweeteners",
    currentStock: 2,
    minStock: 5,
    maxStock: 20,
    unit: "boxes",
    costPerUnit: 12.99,
    supplier: "Sweet Solutions",
    supplierContact: "orders@sweetsolutions.com",
    lastRestocked: new Date(Date.now() - 518400000).toISOString(),
    batchNumber: "SS-2024-078",
    location: "Storage Room A",
    notes: "Individual packets, 1000 per box",
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 518400000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, PERMISSIONS.VIEW_INVENTORY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const lowStock = searchParams.get("lowStock") === "true"
    const expiringSoon = searchParams.get("expiringSoon") === "true"
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredItems = [...mockInventory]

    // Apply category filter
    if (category && category !== "all") {
      filteredItems = filteredItems.filter((item) => item.category === category)
    }

    // Apply low stock filter
    if (lowStock) {
      filteredItems = filteredItems.filter((item) => item.currentStock <= item.minStock)
    }

    // Apply expiring soon filter (within 7 days)
    if (expiringSoon) {
      const sevenDaysFromNow = new Date(Date.now() + 86400000 * 7)
      filteredItems = filteredItems.filter((item) => item.expiryDate && new Date(item.expiryDate) <= sevenDaysFromNow)
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.supplier.toLowerCase().includes(searchLower) ||
          item.batchNumber?.toLowerCase().includes(searchLower),
      )
    }

    // Apply pagination
    const paginatedItems = filteredItems.slice(offset, offset + limit)

    // Calculate summary statistics
    const totalItems = mockInventory.length
    const lowStockItems = mockInventory.filter((item) => item.currentStock <= item.minStock).length
    const expiringSoonItems = mockInventory.filter((item) => {
      if (!item.expiryDate) return false
      const sevenDaysFromNow = new Date(Date.now() + 86400000 * 7)
      return new Date(item.expiryDate) <= sevenDaysFromNow
    }).length
    const totalValue = mockInventory.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)

    return NextResponse.json({
      items: paginatedItems,
      total: filteredItems.length,
      hasMore: offset + limit < filteredItems.length,
      summary: {
        totalItems,
        lowStockItems,
        expiringSoonItems,
        totalValue: Math.round(totalValue * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, PERMISSIONS.CREATE_INVENTORY_ITEM)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const itemData = await request.json()

    // Validate required fields
    if (!itemData.name || !itemData.category || !itemData.supplier) {
      return NextResponse.json({ error: "Name, category, and supplier are required" }, { status: 400 })
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: itemData.name,
      category: itemData.category,
      currentStock: itemData.currentStock || 0,
      minStock: itemData.minStock || 0,
      maxStock: itemData.maxStock || 100,
      unit: itemData.unit || "pieces",
      costPerUnit: itemData.costPerUnit || 0,
      sellingPrice: itemData.sellingPrice,
      supplier: itemData.supplier,
      supplierContact: itemData.supplierContact || "",
      lastRestocked: new Date().toISOString(),
      expiryDate: itemData.expiryDate,
      batchNumber: itemData.batchNumber,
      location: itemData.location || "Storage",
      notes: itemData.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockInventory.push(newItem)

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, PERMISSIONS.UPDATE_INVENTORY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const itemIndex = mockInventory.findIndex((item) => item.id === id)
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Update the item
    mockInventory[itemIndex] = {
      ...mockInventory[itemIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ item: mockInventory[itemIndex] })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

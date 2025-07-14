import { Router } from "express"
import { body, param, validationResult } from "express-validator"

const router = Router()

// Mock inventory data
const inventory = [
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
    expiryDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    sku: "COF-ARA-001",
    location: "Storage Room A",
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
    expiryDate: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
    sku: "DAI-MIL-001",
    location: "Refrigerator 1",
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
    expiryDate: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
    sku: "ALT-OAT-001",
    location: "Refrigerator 2",
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
    expiryDate: null,
    sku: "SUP-CUP-012",
    location: "Storage Room B",
  },
  {
    id: "sugar-1",
    name: "White Sugar",
    category: "Sweeteners",
    currentStock: 12,
    minStock: 8,
    maxStock: 25,
    unit: "kg",
    cost: 2.99,
    supplier: "Sweet Supply Co.",
    lastRestocked: new Date(Date.now() - 345600000).toISOString(),
    expiryDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year from now
    sku: "SWE-SUG-001",
    location: "Storage Room A",
  },
]

// GET /api/inventory - Get all inventory items
router.get("/", async (req, res, next) => {
  try {
    const { category, lowStock, search } = req.query

    let filteredInventory = [...inventory]

    if (category) {
      filteredInventory = filteredInventory.filter(
        (item) => item.category.toLowerCase() === (category as string).toLowerCase(),
      )
    }

    if (lowStock === "true") {
      filteredInventory = filteredInventory.filter((item) => item.currentStock <= item.minStock)
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredInventory = filteredInventory.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.sku.toLowerCase().includes(searchTerm) ||
          item.supplier.toLowerCase().includes(searchTerm),
      )
    }

    // Calculate inventory statistics
    const stats = {
      totalItems: filteredInventory.length,
      lowStockItems: filteredInventory.filter((item) => item.currentStock <= item.minStock).length,
      totalValue: filteredInventory.reduce((sum, item) => sum + item.currentStock * item.cost, 0),
      categories: [...new Set(filteredInventory.map((item) => item.category))],
    }

    res.json({
      success: true,
      data: {
        items: filteredInventory,
        stats,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/inventory/:id - Get specific inventory item
router.get("/:id", async (req, res, next) => {
  try {
    const item = inventory.find((i) => i.id === req.params.id)

    if (!item) {
      return res.status(404).json({
        error: "Inventory Item Not Found",
        message: `Inventory item with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/inventory - Add new inventory item
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("currentStock").isFloat({ min: 0 }).withMessage("Current stock must be non-negative"),
    body("minStock").isFloat({ min: 0 }).withMessage("Min stock must be non-negative"),
    body("maxStock").isFloat({ min: 0 }).withMessage("Max stock must be non-negative"),
    body("unit").notEmpty().withMessage("Unit is required"),
    body("cost").isFloat({ min: 0 }).withMessage("Cost must be non-negative"),
    body("supplier").notEmpty().withMessage("Supplier is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
      }

      const newItem = {
        id: `item-${Date.now()}`,
        name: req.body.name,
        category: req.body.category,
        currentStock: req.body.currentStock,
        minStock: req.body.minStock,
        maxStock: req.body.maxStock,
        unit: req.body.unit,
        cost: req.body.cost,
        supplier: req.body.supplier,
        lastRestocked: new Date().toISOString(),
        expiryDate: req.body.expiryDate || null,
        sku: req.body.sku || `SKU-${Date.now()}`,
        location: req.body.location || "Storage",
      }

      inventory.push(newItem)

      res.status(201).json({
        success: true,
        data: newItem,
        message: "Inventory item created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  },
)

// PATCH /api/inventory/:id - Update inventory item
router.patch("/:id", async (req, res, next) => {
  try {
    const itemIndex = inventory.findIndex((i) => i.id === req.params.id)

    if (itemIndex === -1) {
      return res.status(404).json({
        error: "Inventory Item Not Found",
        message: `Inventory item with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    // If stock is being updated, update lastRestocked timestamp
    if (req.body.currentStock !== undefined && req.body.currentStock > inventory[itemIndex].currentStock) {
      req.body.lastRestocked = new Date().toISOString()
    }

    inventory[itemIndex] = {
      ...inventory[itemIndex],
      ...req.body,
    }

    res.json({
      success: true,
      data: inventory[itemIndex],
      message: "Inventory item updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/inventory/:id/restock - Restock inventory item
router.post(
  "/:id/restock",
  [param("id").notEmpty(), body("quantity").isFloat({ min: 0.1 }).withMessage("Quantity must be positive")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        })
      }

      const itemIndex = inventory.findIndex((i) => i.id === req.params.id)

      if (itemIndex === -1) {
        return res.status(404).json({
          error: "Inventory Item Not Found",
          message: `Inventory item with ID ${req.params.id} not found`,
          timestamp: new Date().toISOString(),
        })
      }

      inventory[itemIndex].currentStock += req.body.quantity
      inventory[itemIndex].lastRestocked = new Date().toISOString()

      res.json({
        success: true,
        data: inventory[itemIndex],
        message: `Restocked ${req.body.quantity} ${inventory[itemIndex].unit} of ${inventory[itemIndex].name}`,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  },
)

export { router as inventoryRoutes }

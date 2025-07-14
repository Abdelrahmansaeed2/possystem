import { Router } from "express"
import { body, validationResult } from "express-validator"

const router = Router()

// Mock customer data
const customers = [
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
    preferences: ["Oat Milk", "Extra Shot"],
    birthday: "1990-05-15",
    joinDate: "2023-01-15",
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
    preferences: ["Almond Milk", "No Sugar"],
    birthday: "1985-09-22",
    joinDate: "2022-11-08",
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
    preferences: ["Soy Milk", "Extra Foam"],
    birthday: "1995-12-03",
    joinDate: "2023-06-20",
  },
]

// GET /api/customers - Get all customers
router.get("/", async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, tier, search } = req.query

    let filteredCustomers = [...customers]

    if (tier) {
      filteredCustomers = filteredCustomers.filter((customer) => customer.tier === tier)
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase()
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          customer.phone.includes(searchTerm),
      )
    }

    const total = filteredCustomers.length
    const paginatedCustomers = filteredCustomers.slice(
      Number.parseInt(offset as string),
      Number.parseInt(offset as string) + Number.parseInt(limit as string),
    )

    res.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        total,
        hasMore: Number.parseInt(offset as string) + Number.parseInt(limit as string) < total,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/customers/:id - Get specific customer
router.get("/:id", async (req, res, next) => {
  try {
    const customer = customers.find((c) => c.id === req.params.id)

    if (!customer) {
      return res.status(404).json({
        error: "Customer Not Found",
        message: `Customer with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      data: customer,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/customers - Create new customer
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
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

      const newCustomer = {
        id: `customer-${Date.now()}`,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        loyaltyPoints: 0,
        tier: "Bronze",
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: new Date().toISOString(),
        preferences: req.body.preferences || [],
        birthday: req.body.birthday,
        joinDate: new Date().toISOString(),
      }

      customers.push(newCustomer)

      res.status(201).json({
        success: true,
        data: newCustomer,
        message: "Customer created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  },
)

export { router as customerRoutes }

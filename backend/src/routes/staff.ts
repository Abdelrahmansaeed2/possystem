import { Router } from "express"
import { body, validationResult } from "express-validator"

const router = Router()

// Mock staff data
const staff = [
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
    hireDate: "2022-03-15",
    schedule: {
      monday: { start: "06:00", end: "14:00" },
      tuesday: { start: "06:00", end: "14:00" },
      wednesday: { start: "06:00", end: "14:00" },
      thursday: { start: "06:00", end: "14:00" },
      friday: { start: "06:00", end: "14:00" },
    },
    skills: ["Latte Art", "Espresso", "Customer Service"],
    certifications: ["Barista Level 2", "Food Safety"],
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
    hireDate: "2023-01-20",
    schedule: {
      tuesday: { start: "14:00", end: "22:00" },
      wednesday: { start: "14:00", end: "22:00" },
      thursday: { start: "14:00", end: "22:00" },
      friday: { start: "14:00", end: "22:00" },
      saturday: { start: "08:00", end: "16:00" },
    },
    skills: ["Cold Brew", "Customer Service", "Cash Handling"],
    certifications: ["Barista Level 1", "Food Safety"],
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
    hireDate: "2021-08-10",
    schedule: {
      monday: { start: "08:00", end: "16:00" },
      tuesday: { start: "08:00", end: "16:00" },
      wednesday: { start: "08:00", end: "16:00" },
      thursday: { start: "08:00", end: "16:00" },
      friday: { start: "08:00", end: "16:00" },
    },
    skills: ["Management", "Training", "Inventory", "Customer Relations"],
    certifications: ["Management Certificate", "Food Safety Manager"],
  },
]

// GET /api/staff - Get all staff members
router.get("/", async (req, res, next) => {
  try {
    const { active, role } = req.query

    let filteredStaff = [...staff]

    if (active !== undefined) {
      const isActive = active === "true"
      filteredStaff = filteredStaff.filter((member) => member.isActive === isActive)
    }

    if (role) {
      filteredStaff = filteredStaff.filter((member) =>
        member.role.toLowerCase().includes((role as string).toLowerCase()),
      )
    }

    res.json({
      success: true,
      data: {
        staff: filteredStaff,
        total: filteredStaff.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/staff/:id - Get specific staff member
router.get("/:id", async (req, res, next) => {
  try {
    const staffMember = staff.find((s) => s.id === req.params.id)

    if (!staffMember) {
      return res.status(404).json({
        error: "Staff Member Not Found",
        message: `Staff member with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    res.json({
      success: true,
      data: staffMember,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/staff - Create new staff member
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("role").notEmpty().withMessage("Role is required"),
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

      const newStaffMember = {
        id: `staff-${Date.now()}`,
        name: req.body.name,
        role: req.body.role,
        email: req.body.email,
        phone: req.body.phone,
        isActive: true,
        ordersProcessed: 0,
        averageTime: 0,
        rating: 0,
        hireDate: new Date().toISOString().split("T")[0],
        schedule: req.body.schedule || {},
        skills: req.body.skills || [],
        certifications: req.body.certifications || [],
      }

      staff.push(newStaffMember)

      res.status(201).json({
        success: true,
        data: newStaffMember,
        message: "Staff member created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  },
)

// PATCH /api/staff/:id - Update staff member
router.patch("/:id", async (req, res, next) => {
  try {
    const staffIndex = staff.findIndex((s) => s.id === req.params.id)

    if (staffIndex === -1) {
      return res.status(404).json({
        error: "Staff Member Not Found",
        message: `Staff member with ID ${req.params.id} not found`,
        timestamp: new Date().toISOString(),
      })
    }

    staff[staffIndex] = {
      ...staff[staffIndex],
      ...req.body,
    }

    res.json({
      success: true,
      data: staff[staffIndex],
      message: "Staff member updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

export { router as staffRoutes }

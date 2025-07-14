import { Router } from "express"
import bcrypt from "bcryptjs"
import { body, validationResult } from "express-validator"
import { DatabaseService } from "@/services/DatabaseService"
import { RedisService } from "@/services/RedisService"
import { generateToken, generateRefreshToken, authenticate, refreshToken, logout, UserRole } from "@/middleware/auth"
import { ValidationError, AuthenticationError, ConflictError, asyncHandler } from "@/middleware/errorHandler"
import { loggers } from "@/utils/logger"

const router = Router()
const databaseService = new DatabaseService()
const redisService = new RedisService()

// Validation rules
const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
]

const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("firstName").trim().isLength({ min: 1 }).withMessage("First name is required"),
  body("lastName").trim().isLength({ min: 1 }).withMessage("Last name is required"),
  body("role").isIn(Object.values(UserRole)).withMessage("Valid role is required"),
]

// Login endpoint
router.post(
  "/login",
  loginValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ValidationError(
        errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      )
    }

    const { email, password } = req.body
    const prisma = databaseService.getClient()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        location: true,
      },
    })

    if (!user) {
      loggers.auth("login_failure", undefined, { email, reason: "user_not_found", ip: req.ip })
      throw new AuthenticationError("Invalid credentials")
    }

    // Check if user is active
    if (!user.isActive) {
      loggers.auth("login_failure", user.id, { email, reason: "user_inactive", ip: req.ip })
      throw new AuthenticationError("Account is inactive")
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      loggers.auth("login_failure", user.id, { email, reason: "invalid_password", ip: req.ip })
      throw new AuthenticationError("Invalid credentials")
    }

    // Generate tokens
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      locationId: user.locationId || undefined,
    })

    const refreshTokenValue = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      locationId: user.locationId || undefined,
    })

    // Store session in Redis
    const sessionData = {
      token: accessToken,
      refreshToken: refreshTokenValue,
      userId: user.id,
      email: user.email,
      role: user.role,
      locationId: user.locationId,
      isActive: true,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    }

    await redisService.setex(`session:${user.id}`, 24 * 60 * 60, JSON.stringify(sessionData))
    await redisService.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshTokenValue)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    loggers.auth("login_success", user.id, {
      email: user.email,
      role: user.role,
      locationId: user.locationId,
      ip: req.ip,
    })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          locationId: user.locationId,
          location: user.location
            ? {
                id: user.location.id,
                name: user.location.name,
                address: user.location.address,
              }
            : null,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
        },
        tokens: {
          accessToken,
          refreshToken: refreshTokenValue,
          expiresIn: "24h",
        },
      },
    })
  }),
)

// Register endpoint (admin only in production)
router.post(
  "/register",
  registerValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ValidationError(
        errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      )
    }

    const { email, password, firstName, lastName, role, locationId } = req.body
    const prisma = databaseService.getClient()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictError("User with this email already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        locationId: locationId || null,
        isActive: true,
      },
      include: {
        location: true,
      },
    })

    loggers.auth("user_registered", user.id, {
      email: user.email,
      role: user.role,
      locationId: user.locationId,
      ip: req.ip,
    })

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          locationId: user.locationId,
          location: user.location
            ? {
                id: user.location.id,
                name: user.location.name,
                address: user.location.address,
              }
            : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
    })
  }),
)

// Refresh token endpoint
router.post("/refresh", refreshToken)

// Get current user endpoint
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const prisma = databaseService.getClient()

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        location: true,
      },
    })

    if (!user) {
      throw new AuthenticationError("User not found")
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          locationId: user.locationId,
          location: user.location
            ? {
                id: user.location.id,
                name: user.location.name,
                address: user.location.address,
              }
            : null,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      },
    })
  }),
)

// Logout endpoint
router.post("/logout", logout)

// Change password endpoint
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").isLength({ min: 1 }).withMessage("Current password is required"),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ValidationError(
        errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      )
    }

    const { currentPassword, newPassword } = req.body
    const prisma = databaseService.getClient()

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    })

    if (!user) {
      throw new AuthenticationError("User not found")
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      loggers.auth("password_change_failure", user.id, { reason: "invalid_current_password", ip: req.ip })
      throw new AuthenticationError("Current password is incorrect")
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    loggers.auth("password_changed", user.id, { ip: req.ip })

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  }),
)

export default router

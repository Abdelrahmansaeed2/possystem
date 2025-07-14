import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasPermission, PERMISSIONS } from "@/lib/auth"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  loyaltyPoints: number
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  preferences: string[]
  allergens: string[]
  totalOrders: number
  totalSpent: number
  lastVisit: string
  createdAt: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  marketingConsent: boolean
  notes?: string
}

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    loyaltyPoints: 250,
    tier: "Gold",
    preferences: ["oat_milk", "extra_shot", "no_sugar"],
    allergens: ["nuts"],
    totalOrders: 45,
    totalSpent: 567.89,
    lastVisit: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    address: {
      street: "123 Main St",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
    },
    marketingConsent: true,
    notes: "Prefers morning visits, regular customer",
  },
  {
    id: "cust-2",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    phone: "+1 (555) 234-5678",
    loyaltyPoints: 180,
    tier: "Silver",
    preferences: ["almond_milk", "decaf"],
    allergens: ["dairy"],
    totalOrders: 32,
    totalSpent: 423.45,
    lastVisit: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    address: {
      street: "456 Oak Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98102",
    },
    marketingConsent: false,
  },
  {
    id: "cust-3",
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    phone: "+1 (555) 345-6789",
    loyaltyPoints: 95,
    tier: "Bronze",
    preferences: ["soy_milk", "vanilla_syrup"],
    allergens: [],
    totalOrders: 18,
    totalSpent: 234.67,
    lastVisit: new Date(Date.now() - 259200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    marketingConsent: true,
  },
  {
    id: "cust-4",
    name: "David Rodriguez",
    email: "david.rodriguez@email.com",
    phone: "+1 (555) 456-7890",
    loyaltyPoints: 420,
    tier: "Platinum",
    preferences: ["extra_hot", "double_shot", "coconut_milk"],
    allergens: ["gluten"],
    totalOrders: 78,
    totalSpent: 1234.56,
    lastVisit: new Date(Date.now() - 43200000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    address: {
      street: "789 Pine St",
      city: "Seattle",
      state: "WA",
      zipCode: "98103",
    },
    marketingConsent: true,
    notes: "VIP customer, prefers complex orders",
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, PERMISSIONS.VIEW_CUSTOMERS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const tier = searchParams.get("tier")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredCustomers = [...mockCustomers]

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(search),
      )
    }

    // Apply tier filter
    if (tier && tier !== "all") {
      filteredCustomers = filteredCustomers.filter((customer) => customer.tier === tier)
    }

    // Apply pagination
    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit)

    return NextResponse.json({
      customers: paginatedCustomers,
      total: filteredCustomers.length,
      hasMore: offset + limit < filteredCustomers.length,
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user, PERMISSIONS.CREATE_CUSTOMER)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const customerData = await request.json()

    // Validate required fields
    if (!customerData.name || !customerData.email || !customerData.phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 })
    }

    // Check if customer already exists
    const existingCustomer = mockCustomers.find((c) => c.email === customerData.email)
    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this email already exists" }, { status: 409 })
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      loyaltyPoints: 0,
      tier: "Bronze",
      preferences: customerData.preferences || [],
      allergens: customerData.allergens || [],
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      address: customerData.address,
      marketingConsent: customerData.marketingConsent || false,
      notes: customerData.notes,
    }

    mockCustomers.push(newCustomer)

    return NextResponse.json({ customer: newCustomer }, { status: 201 })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

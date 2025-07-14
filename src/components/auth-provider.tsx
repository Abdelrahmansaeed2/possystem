"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  token: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({ ...parsedUser, token })
      } catch (error) {
        console.error("Failed to parse stored user data:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock authentication - in real app, this would be an API call
      if (email === "admin@cafe.com" && password === "admin123") {
        const mockUser: User = {
          id: "1",
          name: "Admin User",
          email: "admin@cafe.com",
          role: "admin",
          token: "mock_jwt_token_" + Date.now(),
        }

        setUser(mockUser)
        localStorage.setItem("auth_token", mockUser.token)
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          }),
        )

        setIsLoading(false)
        return true
      } else if (email === "staff@cafe.com" && password === "staff123") {
        const mockUser: User = {
          id: "2",
          name: "Staff User",
          email: "staff@cafe.com",
          role: "staff",
          token: "mock_jwt_token_" + Date.now(),
        }

        setUser(mockUser)
        localStorage.setItem("auth_token", mockUser.token)
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          }),
        )

        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

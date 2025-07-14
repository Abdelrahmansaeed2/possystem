"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../src/components/ui/button"
import { Input } from "../../src/components/ui/input"
import { Label } from "../../src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card"
import { Alert, AlertDescription } from "../../src/components/ui/alert"
import { Coffee, Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "../../src/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const demoAccounts = [
    { email: "admin@cafe.com", role: "Admin", permissions: "Full system access" },
    { email: "manager@cafe.com", role: "Manager", permissions: "Store management, reports" },
    { email: "barista@cafe.com", role: "Barista", permissions: "Order processing, customer service" },
    { email: "cashier@cafe.com", role: "Cashier", permissions: "Order creation, basic customer service" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`,
      })

      // Redirect based on role
      if (data.user.role === "admin" || data.user.role === "manager") {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("password")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Café POS Pro</h1>
          </div>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the POS system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription>Click on any account to auto-fill credentials (password: "password")</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  className="w-full justify-start text-left h-auto p-3 bg-transparent"
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={isLoading}
                >
                  <div>
                    <div className="font-medium">{account.role}</div>
                    <div className="text-sm text-gray-500">{account.email}</div>
                    <div className="text-xs text-gray-400">{account.permissions}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Café POS Pro. All rights reserved.</p>
          <p className="mt-1">Enterprise Point of Sale System</p>
        </div>
      </div>
    </div>
  )
}

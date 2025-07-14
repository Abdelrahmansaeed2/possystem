export const validateApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "")

  // In production, validate against a secure API key
  const validApiKeys = [
    process.env.API_KEY || "cafe-pos-api-key-2024",
    "development-key", // For development only
  ]

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid API key required",
      timestamp: new Date().toISOString(),
    })
  }

  next()
}

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error("Error:", err)

  // Default error response
  let statusCode = 500
  let message = "Internal Server Error"
  let details = null

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400
    message = "Validation Error"
    details = err.details
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401
    message = "Unauthorized"
  } else if (err.name === "NotFoundError") {
    statusCode = 404
    message = "Resource Not Found"
  } else if (err.message) {
    message = err.message
  }

  res.status(statusCode).json({
    error: message,
    details,
    timestamp: new Date().toISOString(),
    requestId: req.id || "unknown",
  })
}

export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now()

  // Generate request ID
  req.id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  res.on("finish", () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.id}`)
  })

  next()
}

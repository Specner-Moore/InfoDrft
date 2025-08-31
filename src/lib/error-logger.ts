interface ErrorLogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  error?: string
  context?: Record<string, any>
  userId?: string
  requestId?: string
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = []
  private maxLogs = 100

  log(level: 'error' | 'warn' | 'info', message: string, error?: Error, context?: Record<string, any>, userId?: string, requestId?: string) {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error?.message || error?.stack,
      context,
      userId,
      requestId
    }

    this.logs.push(logEntry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, error || '', context || '')
    }

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // You could send to Sentry, LogRocket, or other logging services here
      console.error(`[PRODUCTION ERROR] ${message}`, error, context)
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string, requestId?: string) {
    this.log('error', message, error, context, userId, requestId)
  }

  warn(message: string, error?: Error, context?: Record<string, any>, userId?: string, requestId?: string) {
    this.log('warn', message, error, context, userId, requestId)
  }

  info(message: string, context?: Record<string, any>, userId?: string, requestId?: string) {
    this.log('info', message, undefined, context, userId, requestId)
  }

  getRecentLogs(level?: 'error' | 'warn' | 'info', limit: number = 10): ErrorLogEntry[] {
    let filtered = this.logs
    if (level) {
      filtered = filtered.filter(log => log.level === level)
    }
    return filtered.slice(-limit)
  }

  clear() {
    this.logs = []
  }
}

export const errorLogger = new ErrorLogger()
export default errorLogger

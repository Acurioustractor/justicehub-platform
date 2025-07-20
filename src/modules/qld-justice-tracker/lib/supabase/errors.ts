export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError)
    }
  }
}

export function handleDatabaseError(error: any): DatabaseError {
  // PostgreSQL error codes
  if (error.code === 'PGRST301') {
    return new DatabaseError(
      'Database connection failed',
      error.code,
      503,
      { originalError: error.message }
    )
  }
  
  if (error.code === '42P01') {
    return new DatabaseError(
      'Table does not exist',
      error.code,
      500,
      { table: error.message }
    )
  }
  
  if (error.code === '42501') {
    return new DatabaseError(
      'Insufficient permissions',
      error.code,
      403,
      { originalError: error.message }
    )
  }
  
  if (error.code === '23505') {
    return new DatabaseError(
      'Duplicate entry',
      error.code,
      409,
      { originalError: error.message }
    )
  }
  
  // Supabase specific errors
  if (error.message?.includes('JWT')) {
    return new DatabaseError(
      'Authentication error',
      'AUTH_ERROR',
      401,
      { originalError: error.message }
    )
  }
  
  if (error.message?.includes('Network')) {
    return new DatabaseError(
      'Network error connecting to database',
      'NETWORK_ERROR',
      503,
      { originalError: error.message }
    )
  }
  
  // Rate limiting
  if (error.status === 429) {
    return new DatabaseError(
      'Too many requests',
      'RATE_LIMIT',
      429,
      { originalError: error.message }
    )
  }
  
  // Default error
  return new DatabaseError(
    error.message || 'Unknown database error',
    error.code || 'UNKNOWN',
    error.status || 500,
    { originalError: error }
  )
}

// Retry logic for transient errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on certain errors
      if (
        (error as any).code === '42501' || // Permission denied
        (error as any).code === '23505' || // Duplicate
        (error as any).status === 401 ||   // Unauthorized
        (error as any).status === 403       // Forbidden
      ) {
        throw handleDatabaseError(error)
      }
      
      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw handleDatabaseError(lastError)
}
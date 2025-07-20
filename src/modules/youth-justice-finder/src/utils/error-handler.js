// Centralized error handling utilities

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Standard error response formatter
export function formatErrorResponse(error, includeStack = false) {
  const response = {
    error: {
      message: error.message,
      statusCode: error.statusCode || 500,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  // Add additional fields for specific error types
  if (error instanceof ValidationError && error.details) {
    response.error.details = error.details;
  }

  // Include stack trace in development mode
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  // Include original error details for database errors in development
  if (includeStack && error instanceof DatabaseError && error.originalError) {
    response.error.originalError = {
      message: error.originalError.message,
      code: error.originalError.code
    };
  }

  return response;
}

// Async error wrapper for route handlers
export function asyncHandler(fn) {
  return async (request, reply) => {
    try {
      return await fn(request, reply);
    } catch (error) {
      // Log the error
      request.log.error({
        error: error.message,
        stack: error.stack,
        code: error.code,
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query
        }
      });

      // Determine if we should include stack trace
      const includeStack = process.env.NODE_ENV === 'development';
      
      // Handle different types of errors
      if (error.isOperational) {
        // Known application errors
        const response = formatErrorResponse(error, includeStack);
        return reply.status(error.statusCode).send(response);
      } else if (error.code === '23505') {
        // PostgreSQL unique violation
        const duplicateError = new ValidationError('Duplicate entry detected');
        const response = formatErrorResponse(duplicateError, includeStack);
        return reply.status(400).send(response);
      } else if (error.code === '23503') {
        // PostgreSQL foreign key violation
        const foreignKeyError = new ValidationError('Referenced record does not exist');
        const response = formatErrorResponse(foreignKeyError, includeStack);
        return reply.status(400).send(response);
      } else if (error.code === '23502') {
        // PostgreSQL not null violation
        const notNullError = new ValidationError('Required field is missing');
        const response = formatErrorResponse(notNullError, includeStack);
        return reply.status(400).send(response);
      } else {
        // Unknown errors - don't leak details in production
        const internalError = new AppError(
          includeStack ? error.message : 'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
        const response = formatErrorResponse(internalError, includeStack);
        return reply.status(500).send(response);
      }
    }
  };
}

// Global error handler for Fastify
export function globalErrorHandler(error, request, reply) {
  const includeStack = process.env.NODE_ENV === 'development';
  
  request.log.error({
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers
    }
  });

  if (error.isOperational) {
    const response = formatErrorResponse(error, includeStack);
    return reply.status(error.statusCode).send(response);
  } else {
    const internalError = new AppError(
      includeStack ? error.message : 'Internal server error',
      500
    );
    const response = formatErrorResponse(internalError, includeStack);
    return reply.status(500).send(response);
  }
}

// Database connection error handler
export function handleDatabaseError(error) {
  if (error.code === 'ECONNREFUSED') {
    throw new DatabaseError('Unable to connect to database');
  } else if (error.code === 'ENOTFOUND') {
    throw new DatabaseError('Database host not found');
  } else if (error.code === '28P01') {
    throw new DatabaseError('Database authentication failed');
  } else if (error.code === '3D000') {
    throw new DatabaseError('Database does not exist');
  } else {
    throw new DatabaseError('Database operation failed', error);
  }
}

// Validation helpers
export function validateRequired(fields, data) {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`, { missing });
  }
}

export function validateUUID(id, fieldName = 'id') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

export function validatePagination(limit, offset) {
  const parsedLimit = parseInt(limit);
  const parsedOffset = parseInt(offset);
  
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }
  
  if (isNaN(parsedOffset) || parsedOffset < 0) {
    throw new ValidationError('Offset must be 0 or greater');
  }
  
  return { limit: parsedLimit, offset: parsedOffset };
}
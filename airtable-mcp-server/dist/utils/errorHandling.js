"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RETRY_CONFIG = exports.AirtableError = exports.ErrorType = void 0;
exports.classifyAirtableError = classifyAirtableError;
exports.withRetry = withRetry;
exports.logError = logError;
// Error types for better classification
var ErrorType;
(function (ErrorType) {
    ErrorType["NETWORK"] = "NETWORK";
    ErrorType["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorType["PERMISSION"] = "PERMISSION";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
    ErrorType["VALIDATION"] = "VALIDATION";
    ErrorType["SERVER"] = "SERVER";
    ErrorType["UNKNOWN"] = "UNKNOWN";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
// Custom error class for Airtable operations
class AirtableError extends Error {
    constructor(message, type = ErrorType.UNKNOWN, options = {}) {
        super(message);
        this.name = 'AirtableError';
        this.type = type;
        this.status = options.status;
        this.retryable = options.retryable ?? false;
        this.originalError = options.originalError;
        this.context = options.context;
    }
    // Format error for logging and reporting
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            status: this.status,
            retryable: this.retryable,
            context: this.context,
            stack: this.stack,
        };
    }
}
exports.AirtableError = AirtableError;
// Classify errors from Airtable API
function classifyAirtableError(error) {
    // Handle Axios errors
    if (error.isAxiosError) {
        const axiosError = error;
        const status = axiosError.response?.status;
        const data = axiosError.response?.data;
        // Network errors
        if (!axiosError.response) {
            return new AirtableError('Network error connecting to Airtable API', ErrorType.NETWORK, {
                retryable: true,
                originalError: error,
                context: { request: axiosError.config },
            });
        }
        // Rate limit errors
        if (status === 429) {
            return new AirtableError('Airtable API rate limit exceeded', ErrorType.RATE_LIMIT, {
                status,
                retryable: true,
                originalError: error,
                context: {
                    retryAfter: axiosError.response.headers['retry-after'],
                    request: axiosError.config,
                },
            });
        }
        // Authentication errors
        if (status === 401) {
            return new AirtableError('Authentication failed with Airtable API', ErrorType.AUTHENTICATION, {
                status,
                retryable: false,
                originalError: error,
            });
        }
        // Permission errors
        if (status === 403) {
            return new AirtableError('Permission denied for Airtable resource', ErrorType.PERMISSION, {
                status,
                retryable: false,
                originalError: error,
            });
        }
        // Not found errors
        if (status === 404) {
            return new AirtableError('Airtable resource not found', ErrorType.NOT_FOUND, {
                status,
                retryable: false,
                originalError: error,
                context: { request: axiosError.config },
            });
        }
        // Validation errors
        if (status === 422) {
            return new AirtableError('Validation error in Airtable request', ErrorType.VALIDATION, {
                status,
                retryable: false,
                originalError: error,
                context: {
                    errors: data?.errors,
                    request: axiosError.config
                },
            });
        }
        // Server errors
        if (status && status >= 500) {
            return new AirtableError('Airtable server error', ErrorType.SERVER, {
                status,
                retryable: true,
                originalError: error,
            });
        }
        // Other HTTP errors
        return new AirtableError(`Airtable API error: ${data?.error?.message || axiosError.message}`, ErrorType.UNKNOWN, {
            status,
            retryable: status ? status >= 500 : false,
            originalError: error,
            context: { request: axiosError.config },
        });
    }
    // Handle Airtable SDK errors
    if (error.error && typeof error.error === 'object') {
        return new AirtableError(error.error.message || 'Airtable SDK error', ErrorType.UNKNOWN, {
            retryable: false,
            originalError: error,
            context: { error: error.error },
        });
    }
    // Generic error handling
    return new AirtableError(error.message || 'Unknown error with Airtable operation', ErrorType.UNKNOWN, {
        retryable: false,
        originalError: error,
    });
}
// Default retry configuration
exports.DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
    retryableErrorTypes: [
        ErrorType.NETWORK,
        ErrorType.RATE_LIMIT,
        ErrorType.SERVER,
    ],
};
// Calculate backoff delay with jitter
function calculateBackoffDelay(attempt, config) {
    const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt);
    const delay = Math.min(exponentialDelay, config.maxDelayMs);
    // Add jitter (±20%)
    const jitter = delay * 0.2;
    return delay - jitter + Math.random() * jitter * 2;
}
// Retry function with exponential backoff
async function withRetry(operation, config = {}) {
    const retryConfig = { ...exports.DEFAULT_RETRY_CONFIG, ...config };
    let lastError = null;
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            const airtableError = error instanceof AirtableError
                ? error
                : classifyAirtableError(error);
            lastError = airtableError;
            const shouldRetry = attempt < retryConfig.maxRetries &&
                (airtableError.retryable ||
                    retryConfig.retryableErrorTypes.includes(airtableError.type));
            if (!shouldRetry) {
                break;
            }
            // Handle rate limit with specific retry-after header if available
            if (airtableError.type === ErrorType.RATE_LIMIT &&
                airtableError.context?.retryAfter) {
                const retryAfterMs = parseInt(airtableError.context.retryAfter) * 1000;
                await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            }
            else {
                const delay = calculateBackoffDelay(attempt, retryConfig);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            console.log(`Retrying operation after error (attempt ${attempt + 1}/${retryConfig.maxRetries}): ${airtableError.message}`);
        }
    }
    // If we get here, we've exhausted our retries
    throw lastError || new AirtableError('Operation failed after retries');
}
// Logger for structured error logging
function logError(error, context) {
    const errorData = error instanceof AirtableError
        ? error.toJSON()
        : {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...context
        };
    console.error('Error in Airtable MCP Server:', JSON.stringify(errorData, null, 2));
}

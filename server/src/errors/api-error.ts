import { ErrorCode } from './error-codes';

/**
 * API Error class for HTTP responses
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Convert to API response format
   */
  toResponse() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create validation error
   */
  static validation(message: string, details?: any): ApiError {
    return new ApiError(400, ErrorCode.VALIDATION, message, details);
  }

  /**
   * Create authentication error
   */
  static unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(401, ErrorCode.AUTH_REQUIRED, message);
  }

  /**
   * Create forbidden error
   */
  static forbidden(message: string = 'Access denied'): ApiError {
    return new ApiError(403, ErrorCode.AUTH_INVALID, message);
  }

  /**
   * Create not found error
   */
  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, ErrorCode.NOT_FOUND, message);
  }

  /**
   * Create internal server error
   */
  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, ErrorCode.UNKNOWN, message);
  }

  /**
   * Create database error
   */
  static database(message: string = 'Database operation failed'): ApiError {
    return new ApiError(500, ErrorCode.DB_ERROR, message);
  }

  /**
   * Create network error
   */
  static network(message: string = 'Network operation failed'): ApiError {
    return new ApiError(503, ErrorCode.NETWORK, message);
  }
}

/**
 * Error response formatter for API endpoints
 */
export function formatErrorResponse(error: any) {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  // Handle known error types
  if (error.name === 'ValidationError') {
    return ApiError.validation(error.message, error.details).toResponse();
  }

  if (error.name === 'UnauthorizedError') {
    return ApiError.unauthorized(error.message).toResponse();
  }

  if (error.name === 'ForbiddenError') {
    return ApiError.forbidden(error.message).toResponse();
  }

  if (error.name === 'NotFoundError') {
    return ApiError.notFound(error.message).toResponse();
  }

  // Default to internal server error
  return ApiError.internal(
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  ).toResponse();
}

/**
 * Async error handler wrapper for Express routes
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const response = formatErrorResponse(error);
      res.status(response.statusCode).json(response);
    });
  };
}

/**
 * Validation helper functions
 */
export class ValidationHelpers {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isStrongPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static isSKU(sku: string): boolean {
    // Allow alphanumeric with hyphens and underscores, 3-20 characters
    const skuRegex = /^[A-Za-z0-9_-]{3,20}$/;
    return skuRegex.test(sku);
  }

  static isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  }

  static isNonNegativeNumber(value: any): boolean {
    return typeof value === 'number' && value >= 0 && !isNaN(value);
  }

  static validateRequired(obj: any, fields: string[]): string[] {
    const missing: string[] = [];
    
    fields.forEach(field => {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        missing.push(field);
      }
    });

    return missing;
  }

  static validateInput(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];

    rules.forEach(rule => {
      const value = data[rule.field];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'email' && !this.isEmail(value)) {
          errors.push(`${rule.field} must be a valid email address`);
        }
        
        if (rule.type === 'password' && !this.isStrongPassword(value)) {
          errors.push(`${rule.field} must be at least 8 characters with uppercase, lowercase, and number`);
        }
        
        if (rule.type === 'sku' && !this.isSKU(value)) {
          errors.push(`${rule.field} must be a valid SKU (3-20 alphanumeric characters)`);
        }
        
        if (rule.type === 'positive' && !this.isPositiveNumber(value)) {
          errors.push(`${rule.field} must be a positive number`);
        }
        
        if (rule.type === 'nonNegative' && !this.isNonNegativeNumber(value)) {
          errors.push(`${rule.field} must be a non-negative number`);
        }
        
        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
        }
        
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be no more than ${rule.maxLength} characters long`);
        }
        
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'email' | 'password' | 'sku' | 'positive' | 'nonNegative';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

import { AppError, ErrorCode } from './error-codes';

/**
 * Database error handler utility
 * Wraps database operations and converts database-specific errors to AppError
 */

interface DatabaseErrorInfo {
  code: string;
  detail?: string;
  constraint?: string;
  table?: string;
}

export class DatabaseErrorHandler {
  /**
   * Wraps a database operation and handles common database errors
   */
  static async handleOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      throw this.convertDatabaseError(error);
    }
  }

  /**
   * Converts database-specific errors to standardized AppError
   */
  private static convertDatabaseError(error: any): AppError {
    // If it's already an AppError, pass through
    if (error instanceof AppError) {
      return error;
    }

    const errorInfo: DatabaseErrorInfo = {
      code: error.code || 'UNKNOWN',
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
    };

    switch (errorInfo.code) {
      // PostgreSQL error codes
      case '23505': // unique_violation
        return new AppError(
          ErrorCode.VALIDATION,
          this.getUniqueViolationMessage(errorInfo)
        );
      
      case '23503': // foreign_key_violation
        return new AppError(
          ErrorCode.VALIDATION,
          'Referenced record does not exist'
        );
      
      case '23502': // not_null_violation
        return new AppError(
          ErrorCode.VALIDATION,
          'Required field cannot be empty'
        );
      
      case '23514': // check_violation
        return new AppError(
          ErrorCode.VALIDATION,
          'Invalid data format or value'
        );
      
      case '42703': // undefined_column
        return new AppError(
          ErrorCode.DB_ERROR,
          'Database schema error'
        );
      
      case '42P01': // undefined_table
        return new AppError(
          ErrorCode.DB_ERROR,
          'Database table not found'
        );
      
      case '53300': // too_many_connections
        return new AppError(
          ErrorCode.DB_ERROR,
          'Database connection limit reached'
        );
      
      case '08006': // connection_failure
      case '08001': // sqlclient_unable_to_establish_sqlconnection
        return new AppError(
          ErrorCode.DB_ERROR,
          'Database connection failed'
        );
      
      case '57014': // query_canceled (timeout)
        return new AppError(
          ErrorCode.DB_ERROR,
          'Database operation timed out'
        );
      
      // Connection and network errors
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
      case 'ETIMEDOUT':
        return new AppError(
          ErrorCode.NETWORK,
          'Unable to connect to database'
        );
      
      default:
        // Log unknown database errors for debugging
        console.error('Unknown database error:', {
          code: errorInfo.code,
          message: error.message,
          detail: errorInfo.detail,
          constraint: errorInfo.constraint,
          table: errorInfo.table,
        });
        
        return new AppError(
          ErrorCode.DB_ERROR,
          'Database operation failed'
        );
    }
  }

  /**
   * Creates user-friendly message for unique constraint violations
   */
  private static getUniqueViolationMessage(errorInfo: DatabaseErrorInfo): string {
    if (errorInfo.constraint) {
      // Parse common constraint patterns
      if (errorInfo.constraint.includes('email')) {
        return 'This email address is already registered';
      }
      if (errorInfo.constraint.includes('username')) {
        return 'This username is already taken';
      }
      if (errorInfo.constraint.includes('sku')) {
        return 'This product SKU already exists';
      }
      if (errorInfo.constraint.includes('name')) {
        return 'This name is already in use';
      }
    }
    
    return 'This record already exists';
  }

  /**
   * Handles transaction operations with automatic rollback on error
   */
  static async handleTransaction<T>(
    entityManager: any,
    operation: (manager: any) => Promise<T>
  ): Promise<T> {
    const queryRunner = entityManager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw this.convertDatabaseError(error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validates entity before database operation
   */
  static validateEntity(entity: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!entity[field] && entity[field] !== 0 && entity[field] !== false) {
        throw new AppError(
          ErrorCode.VALIDATION,
          `${field} is required`
        );
      }
    }
  }

  /**
   * Checks if error is a connection-related error
   */
  static isConnectionError(error: any): boolean {
    const connectionErrorCodes = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      '08006',
      '08001',
      '53300'
    ];
    
    return connectionErrorCodes.includes(error.code);
  }
}

/**
 * Decorator for database operations
 */
export function HandleDatabaseErrors() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return DatabaseErrorHandler.handleOperation(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

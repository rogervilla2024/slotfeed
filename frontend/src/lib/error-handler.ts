/**
 * Comprehensive Error Handling and Validation
 * Provides utilities for error handling, form validation, and user feedback
 */

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  validationErrors?: ValidationError[];
}

/**
 * Parse HTTP response to determine error type
 */
export function parseHttpError(status: number, data?: any): AppError {
  let type = ErrorType.UNKNOWN;
  let message = 'An unknown error occurred';

  if (status === 0) {
    type = ErrorType.NETWORK_ERROR;
    message = 'Network error: Unable to reach the server';
  } else if (status === 400) {
    type = ErrorType.VALIDATION_ERROR;
    message = data?.detail || 'Invalid request data';
  } else if (status === 401) {
    type = ErrorType.UNAUTHORIZED;
    message = 'Please log in to continue';
  } else if (status === 403) {
    type = ErrorType.FORBIDDEN;
    message = 'You do not have permission to access this resource';
  } else if (status === 404) {
    type = ErrorType.NOT_FOUND;
    message = 'The requested resource was not found';
  } else if (status >= 500) {
    type = ErrorType.SERVER_ERROR;
    message = 'Server error: Please try again later';
  }

  return {
    type,
    message,
    details: data?.message,
    statusCode: status,
    validationErrors: data?.errors,
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must not exceed 20 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number,
  fieldName = 'Value'
): { valid: boolean; error?: string } {
  if (typeof value !== 'number') {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (min !== undefined && value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { valid: false, error: `${fieldName} must not exceed ${max}` };
  }

  return { valid: true };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection.';
    case ErrorType.NOT_FOUND:
      return 'The requested item was not found.';
    case ErrorType.UNAUTHORIZED:
      return 'Your session has expired. Please log in again.';
    case ErrorType.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ErrorType.SERVER_ERROR:
      return 'Server error. Please try again later.';
    case ErrorType.VALIDATION_ERROR:
      return error.details || error.message;
    default:
      return error.message;
  }
}

/**
 * Handle API errors with logging
 */
export function handleApiError(error: any, context?: string): AppError {
  let appError: AppError;

  if (error instanceof Response) {
    appError = parseHttpError(error.status);
  } else if (error instanceof Error) {
    appError = {
      type: ErrorType.UNKNOWN,
      message: error.message,
    };
  } else if (typeof error === 'object' && error !== null) {
    appError = {
      type: error.type || ErrorType.UNKNOWN,
      message: error.message || 'Unknown error',
      details: error.details,
      statusCode: error.statusCode,
    };
  } else {
    appError = {
      type: ErrorType.UNKNOWN,
      message: String(error),
    };
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error${context ? ` in ${context}` : ''}:`, appError);
  }

  return appError;
}

/**
 * Create retry logic for failed requests
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Validate form data object
 */
export function validateFormData(
  formData: Record<string, any>,
  rules: Record<string, (value: any) => { valid: boolean; error?: string }>
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(formData[field]);
    if (!result.valid && result.error) {
      errors.push({ field, message: result.error });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a user-friendly error message from validation errors
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;

  return errors.map(e => `${e.field}: ${e.message}`).join('; ');
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Type guard for error objects
 */
export function isAppError(value: any): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'message' in value
  );
}

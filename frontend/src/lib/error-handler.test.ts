/**
 * Unit Tests for Error Handler
 * Tests validation, error parsing, and formatting
 */

import * as errorHandler from './error-handler';

describe('Error Handler - Validation Functions', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'name+tag@example.org',
      ];

      validEmails.forEach(email => {
        const result = errorHandler.validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        'user@',
        '@example.com',
        'user @example.com',
      ];

      invalidEmails.forEach(email => {
        const result = errorHandler.validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    it('should require email', () => {
      const result = errorHandler.validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const result = errorHandler.validatePassword('SecurePass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require minimum length', () => {
      const result = errorHandler.validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('8 characters')
      );
    });

    it('should require uppercase letter', () => {
      const result = errorHandler.validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('uppercase')
      );
    });

    it('should require lowercase letter', () => {
      const result = errorHandler.validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('lowercase')
      );
    });

    it('should require number', () => {
      const result = errorHandler.validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('number')
      );
    });

    it('should require password', () => {
      const result = errorHandler.validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('required');
    });

    it('should return multiple errors for weak password', () => {
      const result = errorHandler.validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'user-name',
        'TestUser123',
      ];

      validUsernames.forEach(username => {
        const result = errorHandler.validateUsername(username);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject usernames too short', () => {
      const result = errorHandler.validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3 characters');
    });

    it('should reject usernames too long', () => {
      const result = errorHandler.validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceed 20');
    });

    it('should reject invalid characters', () => {
      const invalidUsernames = [
        'user@name',
        'user name',
        'user!',
        'user#name',
      ];

      invalidUsernames.forEach(username => {
        const result = errorHandler.validateUsername(username);
        expect(result.valid).toBe(false);
      });
    });

    it('should require username', () => {
      const result = errorHandler.validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty values', () => {
      const validValues = ['text', 123, true, { key: 'value' }];

      validValues.forEach(value => {
        const result = errorHandler.validateRequired(value, 'Field');
        expect(result.valid).toBe(true);
      });
    });

    it('should reject null values', () => {
      const result = errorHandler.validateRequired(null, 'Field');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject undefined values', () => {
      const result = errorHandler.validateRequired(undefined, 'Field');
      expect(result.valid).toBe(false);
    });

    it('should reject empty strings', () => {
      const result = errorHandler.validateRequired('', 'Field');
      expect(result.valid).toBe(false);
    });

    it('should include field name in error message', () => {
      const result = errorHandler.validateRequired('', 'Email');
      expect(result.error).toContain('Email');
    });
  });

  describe('validateNumberRange', () => {
    it('should accept numbers in range', () => {
      const result = errorHandler.validateNumberRange(50, 0, 100);
      expect(result.valid).toBe(true);
    });

    it('should reject numbers below minimum', () => {
      const result = errorHandler.validateNumberRange(-5, 0, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('0');
    });

    it('should reject numbers above maximum', () => {
      const result = errorHandler.validateNumberRange(150, 0, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100');
    });

    it('should handle boundary values', () => {
      expect(errorHandler.validateNumberRange(0, 0, 100).valid).toBe(true);
      expect(errorHandler.validateNumberRange(100, 0, 100).valid).toBe(true);
    });

    it('should reject non-numeric values', () => {
      const result = errorHandler.validateNumberRange('50' as any, 0, 100);
      expect(result.valid).toBe(false);
    });

    it('should include field name in error', () => {
      const result = errorHandler.validateNumberRange(150, 0, 100, 'Amount');
      expect(result.error).toContain('Amount');
    });
  });
});

describe('Error Handler - Error Parsing', () => {
  describe('parseHttpError', () => {
    it('should parse 400 as validation error', () => {
      const error = errorHandler.parseHttpError(400, { detail: 'Invalid data' });
      expect(error.type).toBe(errorHandler.ErrorType.VALIDATION_ERROR);
      expect(error.message).toContain('Invalid');
    });

    it('should parse 401 as unauthorized', () => {
      const error = errorHandler.parseHttpError(401);
      expect(error.type).toBe(errorHandler.ErrorType.UNAUTHORIZED);
      expect(error.message).toContain('log in');
    });

    it('should parse 403 as forbidden', () => {
      const error = errorHandler.parseHttpError(403);
      expect(error.type).toBe(errorHandler.ErrorType.FORBIDDEN);
      expect(error.message).toContain('permission');
    });

    it('should parse 404 as not found', () => {
      const error = errorHandler.parseHttpError(404);
      expect(error.type).toBe(errorHandler.ErrorType.NOT_FOUND);
    });

    it('should parse 500+ as server error', () => {
      [500, 502, 503].forEach(status => {
        const error = errorHandler.parseHttpError(status);
        expect(error.type).toBe(errorHandler.ErrorType.SERVER_ERROR);
      });
    });

    it('should parse 0 as network error', () => {
      const error = errorHandler.parseHttpError(0);
      expect(error.type).toBe(errorHandler.ErrorType.NETWORK_ERROR);
      expect(error.message).toContain('Network');
    });

    it('should include status code in response', () => {
      const error = errorHandler.parseHttpError(404);
      expect(error.statusCode).toBe(404);
    });
  });
});

describe('Error Handler - Formatting', () => {
  describe('formatErrorMessage', () => {
    it('should format network errors', () => {
      const error: errorHandler.AppError = {
        type: errorHandler.ErrorType.NETWORK_ERROR,
        message: 'Network failed',
      };
      const formatted = errorHandler.formatErrorMessage(error);
      expect(formatted).toContain('internet connection');
    });

    it('should format validation errors', () => {
      const error: errorHandler.AppError = {
        type: errorHandler.ErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        details: 'Email is invalid',
      };
      const formatted = errorHandler.formatErrorMessage(error);
      expect(formatted).toContain('Email is invalid');
    });

    it('should format not found errors', () => {
      const error: errorHandler.AppError = {
        type: errorHandler.ErrorType.NOT_FOUND,
        message: 'Not found',
      };
      const formatted = errorHandler.formatErrorMessage(error);
      expect(formatted).toContain('not found');
    });
  });

  describe('formatValidationErrors', () => {
    it('should format multiple validation errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];
      const formatted = errorHandler.formatValidationErrors(errors);
      expect(formatted).toContain('email');
      expect(formatted).toContain('password');
    });

    it('should format single validation error', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const formatted = errorHandler.formatValidationErrors(errors);
      expect(formatted).toBe('Invalid email');
    });

    it('should handle empty errors', () => {
      const formatted = errorHandler.formatValidationErrors([]);
      expect(formatted).toBe('');
    });
  });
});

describe('Error Handler - Utilities', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = errorHandler.safeJsonParse('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback on invalid JSON', () => {
      const fallback = { default: true };
      const result = errorHandler.safeJsonParse('invalid json', fallback);
      expect(result).toEqual(fallback);
    });

    it('should handle empty strings', () => {
      const fallback = [];
      const result = errorHandler.safeJsonParse('', fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe('isAppError', () => {
    it('should identify app errors', () => {
      const error: errorHandler.AppError = {
        type: errorHandler.ErrorType.VALIDATION_ERROR,
        message: 'Test error',
      };
      expect(errorHandler.isAppError(error)).toBe(true);
    });

    it('should reject non-errors', () => {
      expect(errorHandler.isAppError({ message: 'Not an error' })).toBe(false);
      expect(errorHandler.isAppError(null)).toBe(false);
      expect(errorHandler.isAppError('string')).toBe(false);
    });
  });

  describe('validateFormData', () => {
    it('should validate multiple fields', () => {
      const formData = { email: 'test@example.com', password: 'Pass123' };
      const rules = {
        email: (value: string) => errorHandler.validateEmail(value),
        password: (value: string) => errorHandler.validatePassword(value),
      };

      const result = errorHandler.validateFormData(formData, rules);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect validation errors', () => {
      const formData = { email: 'invalid', password: 'weak' };
      const rules = {
        email: (value: string) => errorHandler.validateEmail(value),
        password: (value: string) => errorHandler.validatePassword(value),
      };

      const result = errorHandler.validateFormData(formData, rules);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return field names with errors', () => {
      const formData = { email: 'invalid', password: 'Secure123' };
      const rules = {
        email: (value: string) => errorHandler.validateEmail(value),
        password: (value: string) => errorHandler.validatePassword(value),
      };

      const result = errorHandler.validateFormData(formData, rules);
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('email');
      expect(errorFields).not.toContain('password');
    });
  });
});

describe('Error Handler - Retry Logic', () => {
  it('should retry failed requests', async () => {
    let attempts = 0;
    const fn = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Failed');
      }
      return 'success';
    });

    const result = await errorHandler.retryRequest(fn, 3, 0);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));

    await expect(errorHandler.retryRequest(fn, 2, 0)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    const startTime = Date.now();

    await errorHandler.retryRequest(fn, 3, 10).catch(() => {});

    const elapsed = Date.now() - startTime;
    // Should wait approximately 10ms + 20ms = 30ms
    expect(elapsed).toBeGreaterThanOrEqual(20);
  });
});

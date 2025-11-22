/**
 * ErrorHandler - Retry logic and error management
 */

import { RetryConfig, ErrorDetails } from './types';
import { SecureLogger } from './secure-logger';

export class ErrorHandler {
  private config: RetryConfig;
  private logger: SecureLogger;
  private readonly MAX_DELAY_MS = 30000; // 30 seconds

  constructor(config: RetryConfig, logger: SecureLogger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Execute function with automatic retry on failure
   */
  public async executeWithRetry<T>(
    fn: () => Promise<T>,
    operation: string = 'Operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (!this.shouldRetry(error)) {
          this.logger.error(`${operation} failed (non-retryable error)`, {
            error: this.createErrorDetails(lastError, attempt)
          });
          throw error;
        }

        // Log retry attempt
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          this.logger.warn(`Retry attempt ${attempt}/${this.config.maxRetries} after ${delay}ms`, {
            error: lastError.message,
            attempt
          });

          // Wait before retrying
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const errorDetails = this.createErrorDetails(lastError!, this.config.maxRetries);
    this.logger.error(`${operation} failed after ${this.config.maxRetries} attempts`, {
      error: errorDetails
    });

    throw lastError;
  }

  /**
   * Determine if error should trigger a retry
   */
  public shouldRetry(error: any): boolean {
    // Network errors - retry
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ENETUNREACH') {
      return true;
    }

    // HTTP status codes
    if (error.response) {
      const status = error.response.status;

      // 5xx server errors - retry
      if (status >= 500) {
        return true;
      }

      // 429 rate limit - retry
      if (status === 429) {
        return true;
      }

      // 4xx client errors - don't retry (except 429)
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    // Default: don't retry
    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  public calculateDelay(attempt: number): number {
    const delay = this.config.delayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.MAX_DELAY_MS);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Classify error and return exit code
   */
  public classifyError(error: any): ErrorDetails {
    const timestamp = new Date().toISOString();

    // Network errors
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ENETUNREACH') {
      return {
        code: 3,
        message: `Network error: ${error.message || 'Connection failed'}`,
        timestamp,
        details: { errorCode: error.code }
      };
    }

    // HTTP errors
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        return {
          code: 2,
          message: 'Authentication failed: Invalid credentials',
          timestamp,
          details: { status }
        };
      }

      if (status === 403) {
        return {
          code: 2,
          message: 'Authorization failed: Insufficient permissions',
          timestamp,
          details: { status }
        };
      }

      if (status >= 400) {
        return {
          code: 1,
          message: error.message || `HTTP error ${status}`,
          timestamp,
          details: {
            status,
            data: error.response.data
          }
        };
      }
    }

    // Generic error
    return {
      code: 1,
      message: error.message || 'Unknown error',
      timestamp
    };
  }

  /**
   * Create detailed error object
   */
  public createErrorDetails(error: any, retryAttempt?: number): ErrorDetails {
    const classified = this.classifyError(error);

    return {
      ...classified,
      retryAttempt,
      details: {
        ...classified.details,
        stack: error.stack,
        ...(error.response && {
          status: error.response.status,
          data: error.response.data
        })
      }
    };
  }

  /**
   * Get exit code based on error type
   */
  public getExitCode(errorType: string): number {
    const exitCodes: Record<string, number> = {
      'success': 0,
      'error': 1,
      'auth_error': 2,
      'network_error': 3
    };

    return exitCodes[errorType] || 1;
  }

  /**
   * Handle fatal error and exit process
   */
  public handleFatalError(error: any, operation: string): never {
    const errorDetails = this.classifyError(error);

    this.logger.error(`Fatal error in ${operation}`, { error: errorDetails });

    process.exit(errorDetails.code);
  }

  /**
   * Create user-friendly error message
   */
  public formatErrorMessage(error: any): string {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message?.value ||
                     error.response.data?.message ||
                     error.message;

      return `HTTP ${status}: ${message}`;
    }

    if (error.code) {
      return `${error.code}: ${error.message}`;
    }

    return error.message || 'Unknown error occurred';
  }
}

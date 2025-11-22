/**
 * SecureLogger - Logging with automatic sensitive data masking
 */

import * as fs from 'fs';
import * as path from 'path';
import { LogConfig, LogLevel, LogEntry } from './types';

export class SecureLogger {
  private config: LogConfig;
  private logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  private seenObjects = new WeakSet();

  constructor(config: LogConfig) {
    this.config = config;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.config.errorLogFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const currentLevelIndex = this.logLevels.indexOf(this.config.level);
    const messageLevelIndex = this.logLevels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data: data ? this.maskSensitiveData(data) : undefined,
      timestamp: new Date().toISOString()
    };
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message
    ];

    if (entry.data) {
      parts.push(JSON.stringify(entry.data, null, 2));
    }

    return parts.join(' ');
  }

  /**
   * Mask sensitive data in any data structure
   */
  public maskSensitiveData(data: any, depth: number = 0): any {
    // Prevent infinite recursion
    if (depth > 10) {
      return '[Max Depth Reached]';
    }

    // Handle null and undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Handle primitive types
    if (typeof data !== 'object') {
      return data;
    }

    // Handle Date objects
    if (data instanceof Date) {
      return data;
    }

    // Handle circular references
    if (this.seenObjects.has(data)) {
      return '[Circular Reference]';
    }

    // Mark as seen for circular reference detection
    this.seenObjects.add(data);

    try {
      // Handle arrays
      if (Array.isArray(data)) {
        return data.map(item => this.maskSensitiveData(item, depth + 1));
      }

      // Handle objects
      const masked: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const lowerKey = key.toLowerCase();

          // Check if this field should be masked
          const shouldMask = this.config.maskFields.some(
            field => lowerKey.includes(field.toLowerCase())
          );

          if (shouldMask) {
            masked[key] = '***MASKED***';
          } else {
            masked[key] = this.maskSensitiveData(data[key], depth + 1);
          }
        }
      }

      return masked;
    } finally {
      // Clean up seen objects to avoid memory leaks
      if (depth === 0) {
        this.seenObjects = new WeakSet();
      }
    }
  }

  /**
   * Strip credentials from URLs
   */
  public stripUrlCredentials(url: string): string {
    try {
      // Pattern: protocol://user:password@host
      const urlPattern = /(https?:\/\/)([^:]+):([^@]+)@/i;
      return url.replace(urlPattern, '$1***:***@');
    } catch (error) {
      // If URL parsing fails, return original
      return url;
    }
  }

  /**
   * Mask sensitive patterns in strings
   */
  public maskString(text: string): string {
    let masked = text;

    // Mask patterns that look like passwords or tokens
    const patterns = [
      // Match "password is <value>" or "password: <value>"
      { regex: /\b(password|passwd|pwd)\s+(is|:)?\s+(\S+)/gi, replacement: '$1 $2 ***MASKED***' },
      // Match "token is <value>" or "token: <value>"
      { regex: /\b(token|auth_token|access_token)\s+(is|:)?\s+(\S+)/gi, replacement: '$1 $2 ***MASKED***' },
      // Match "password=<value>"
      { regex: /(password|passwd|pwd)[=:]\s*['"]?([^'"\s]+)['"]?/gi, replacement: '$1=***MASKED***' },
      // Match "token=<value>"
      { regex: /(token|auth_token|access_token)[=:]\s*['"]?([^'"\s]+)['"]?/gi, replacement: '$1=***MASKED***' },
      // Match "api_key=<value>"
      { regex: /(api[_-]?key)[=:]\s*['"]?([^'"\s]+)['"]?/gi, replacement: '$1=***MASKED***' },
      // Match "secret=<value>"
      { regex: /(secret|api_secret)[=:]\s*['"]?([^'"\s]+)['"]?/gi, replacement: '$1=***MASKED***' }
    ];

    for (const pattern of patterns) {
      masked = masked.replace(pattern.regex, pattern.replacement);
    }

    return masked;
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, data);
      console.log(this.formatLogEntry(entry));
    }
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.createLogEntry('info', message, data);
      console.log(this.formatLogEntry(entry));
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.createLogEntry('warn', message, data);
      console.warn(this.formatLogEntry(entry));
    }
  }

  /**
   * Log error message
   */
  public error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, data);
      console.error(this.formatLogEntry(entry));
      this.writeToErrorLog(entry);
    }
  }

  /**
   * Write error to file
   */
  private writeToErrorLog(entry: LogEntry): void {
    try {
      const logLine = this.formatLogEntry(entry) + '\n';
      fs.appendFileSync(this.config.errorLogFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to error log:', error);
    }
  }

  /**
   * Log with automatic URL credential stripping
   */
  public logRequest(method: string, url: string, headers?: any, body?: any): void {
    const sanitizedUrl = this.stripUrlCredentials(url);
    const sanitizedHeaders = headers ? this.maskSensitiveData(headers) : undefined;
    const sanitizedBody = body ? this.maskSensitiveData(body) : undefined;

    this.debug(`HTTP ${method} ${sanitizedUrl}`, {
      headers: sanitizedHeaders,
      body: sanitizedBody
    });
  }

  /**
   * Log response
   */
  public logResponse(status: number, data?: any): void {
    const sanitizedData = data ? this.maskSensitiveData(data) : undefined;
    this.debug(`HTTP Response ${status}`, sanitizedData);
  }
}

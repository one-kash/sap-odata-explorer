/**
 * Configuration loader with environment variable support
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { SAPConfig, LogConfig, RetryConfig, OutputConfig } from './types';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export class Config {
  static getSAPConfig(): SAPConfig {
    return {
      host: process.env.SAP_HOST || '',
      user: process.env.SAP_USER || '',
      password: process.env.SAP_PASSWORD || '',
      client: process.env.SAP_CLIENT || '001',
      language: process.env.SAP_LANGUAGE || 'EN',
      useSSL: process.env.SAP_USE_SSL === 'true'
    };
  }

  static getLogConfig(): LogConfig {
    return {
      level: (process.env.LOG_LEVEL as any) || 'info',
      maskFields: (process.env.LOG_MASK_FIELDS || '').split(',').map(f => f.trim()),
      errorLogFile: process.env.ERROR_LOG_FILE || './output/errors.log'
    };
  }

  static getRetryConfig(): RetryConfig {
    return {
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      delayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
      backoffMultiplier: parseInt(process.env.RETRY_BACKOFF_MULTIPLIER || '2', 10)
    };
  }

  static getOutputConfig(): OutputConfig {
    return {
      dir: process.env.OUTPUT_DIR || './output',
      format: (process.env.OUTPUT_FORMAT as any) || 'json'
    };
  }

  static getRequestTimeout(): number {
    return parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
  }

  static getODataBasePath(): string {
    return process.env.ODATA_BASE_PATH || '';
  }

  static getDefaultODataService(): string | undefined {
    return process.env.ODATA_SERVICE;
  }

  static getDefaultODataEntity(): string | undefined {
    return process.env.ODATA_ENTITY;
  }

  static validate(): void {
    const sapConfig = this.getSAPConfig();
    const required = ['host', 'user', 'password'];
    const missing = required.filter(key => !sapConfig[key as keyof SAPConfig]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

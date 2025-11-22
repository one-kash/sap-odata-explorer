/**
 * Type definitions for SAP OData Explorer
 */

export interface SAPConfig {
  host: string;
  user: string;
  password: string;
  client: string;
  language: string;
  useSSL: boolean;
}

export interface QueryOptions {
  service: string;
  entity: string;
  filter?: string;
  select?: string;
  top?: number;
  skip?: number;
  orderby?: string;
  expand?: string;
}

export interface ODataResponse<T = any> {
  d?: {
    results?: T[];
    [key: string]: any;
  };
  value?: T[];
  error?: ODataError;
}

export interface ODataError {
  code: string;
  message: {
    lang: string;
    value: string;
  };
}

export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  maskFields: string[];
  errorLogFile: string;
}

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface OutputConfig {
  dir: string;
  format: 'json' | 'pretty';
}

export interface ErrorDetails {
  code: number;
  message: string;
  details?: any;
  timestamp: string;
  retryAttempt?: number;
}

export interface FileWriteOptions {
  filename?: string;
  format: 'json' | 'pretty';
  timestamp?: boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

export interface ServiceMetadata {
  name: string;
  entitySets: EntitySet[];
}

export interface EntitySet {
  name: string;
  entityType: string;
  properties: Property[];
}

export interface Property {
  name: string;
  type: string;
  nullable?: boolean;
  maxLength?: number;
}

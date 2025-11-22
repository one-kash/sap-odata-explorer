/**
 * ODataClient - Core SAP OData client with authentication and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { SAPConfig, QueryOptions, ODataResponse } from './types';
import { SecureLogger } from './secure-logger';
import { ErrorHandler } from './error-handler';
import { Config } from './config';

export class ODataClient {
  private config: SAPConfig;
  private logger: SecureLogger;
  private errorHandler: ErrorHandler;
  private axiosInstance: AxiosInstance;

  constructor(config: SAPConfig, logger: SecureLogger, errorHandler: ErrorHandler) {
    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get base URL for SAP system
   */
  public getBaseUrl(): string {
    const protocol = this.config.useSSL ? 'https' : 'http';
    return `${protocol}://${this.config.host}`;
  }

  /**
   * Build query URL with parameters
   */
  private buildQueryUrl(options: QueryOptions): string {
    const baseUrl = this.getBaseUrl();
    const basePath = Config.getODataBasePath();
    const servicePath = basePath
      ? `${baseUrl}${basePath}/${options.service}/${options.entity}`
      : `${baseUrl}/${options.service}/${options.entity}`;

    const params = new URLSearchParams();

    // SAP parameters
    params.append('sap-client', this.config.client);
    params.append('sap-language', this.config.language);

    // OData query options
    if (options.filter) {
      params.append('$filter', options.filter);
    }

    if (options.select) {
      params.append('$select', options.select);
    }

    if (options.top !== undefined) {
      params.append('$top', options.top.toString());
    }

    if (options.skip !== undefined) {
      params.append('$skip', options.skip.toString());
    }

    if (options.orderby) {
      params.append('$orderby', options.orderby);
    }

    if (options.expand) {
      params.append('$expand', options.expand);
    }

    return `${servicePath}?${params.toString()}`;
  }

  /**
   * Get axios request config with authentication
   */
  private getRequestConfig(): AxiosRequestConfig {
    return {
      auth: {
        username: this.config.user,
        password: this.config.password
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Parse OData response (supports V2 and V4 formats)
   */
  private parseResponse(response: ODataResponse): any {
    if (!response) {
      return [];
    }

    // OData V2 format: { d: { results: [...] } }
    if (response.d) {
      if (response.d.results) {
        return response.d.results;
      }
      // Single entity: { d: { ID: 1, Name: 'Test' } }
      return response.d;
    }

    // OData V4 format: { value: [...] }
    if (response.value) {
      return response.value;
    }

    // Fallback: return as-is or empty array
    return response || [];
  }

  /**
   * Execute OData query
   */
  public async query(options: QueryOptions): Promise<any> {
    const url = this.buildQueryUrl(options);
    const config = this.getRequestConfig();

    return await this.errorHandler.executeWithRetry(async () => {
      this.logger.logRequest('GET', url, config.headers);

      const response = await axios.get(url, config);

      this.logger.logResponse(response.status, response.data);

      return this.parseResponse(response.data);
    }, `Query ${options.service}/${options.entity}`);
  }

  /**
   * Get single entity by key
   */
  public async getEntityByKey(
    service: string,
    entity: string,
    key: string | Record<string, any>
  ): Promise<any> {
    const baseUrl = this.getBaseUrl();
    const basePath = Config.getODataBasePath();
    let keyString: string;

    if (typeof key === 'object') {
      // Composite key: { ID: '1', Type: 'A' } -> ID='1',Type='A'
      keyString = Object.entries(key)
        .map(([k, v]) => `${k}='${v}'`)
        .join(',');
    } else {
      // Simple key: '1' -> '1'
      keyString = `'${key}'`;
    }

    const servicePath = basePath
      ? `${baseUrl}${basePath}/${service}`
      : `${baseUrl}/${service}`;
    const url = `${servicePath}/${entity}(${keyString})?sap-client=${this.config.client}&sap-language=${this.config.language}`;
    const config = this.getRequestConfig();

    return await this.errorHandler.executeWithRetry(async () => {
      this.logger.logRequest('GET', url, config.headers);

      const response = await axios.get(url, config);

      this.logger.logResponse(response.status, response.data);

      return this.parseResponse(response.data);
    }, `Get ${service}/${entity}(${keyString})`);
  }

  /**
   * Get service metadata
   */
  public async getMetadata(service: string): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const basePath = Config.getODataBasePath();
    const servicePath = basePath
      ? `${baseUrl}${basePath}/${service}`
      : `${baseUrl}/${service}`;
    const url = `${servicePath}/$metadata?sap-client=${this.config.client}`;
    const config = this.getRequestConfig();

    return await this.errorHandler.executeWithRetry(async () => {
      this.logger.logRequest('GET', url, config.headers);

      const response = await axios.get(url, {
        ...config,
        headers: {
          ...config.headers,
          'Accept': 'application/xml'
        }
      });

      this.logger.logResponse(response.status);

      return response.data;
    }, `Get metadata for ${service}`);
  }

  /**
   * Get service document (list of entity sets)
   */
  public async getServiceDocument(service: string): Promise<any> {
    const baseUrl = this.getBaseUrl();
    const basePath = Config.getODataBasePath();
    const servicePath = basePath
      ? `${baseUrl}${basePath}/${service}`
      : `${baseUrl}/${service}`;
    const url = `${servicePath}/?sap-client=${this.config.client}&sap-language=${this.config.language}`;
    const config = this.getRequestConfig();

    return await this.errorHandler.executeWithRetry(async () => {
      this.logger.logRequest('GET', url, config.headers);

      const response = await axios.get(url, config);

      this.logger.logResponse(response.status, response.data);

      return response.data;
    }, `Get service document for ${service}`);
  }

  /**
   * Test connection to SAP system
   */
  public async testConnection(): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/?sap-client=${this.config.client}`;
      const config = this.getRequestConfig();

      await axios.get(url, config);

      this.logger.info('SAP connection test successful');
      return true;
    } catch (error) {
      this.logger.error('SAP connection test failed', { error });
      return false;
    }
  }

  /**
   * Execute custom OData URL
   */
  public async executeUrl(url: string): Promise<any> {
    const config = this.getRequestConfig();

    return await this.errorHandler.executeWithRetry(async () => {
      this.logger.logRequest('GET', url, config.headers);

      const response = await axios.get(url, config);

      this.logger.logResponse(response.status, response.data);

      return this.parseResponse(response.data);
    }, `Execute custom URL`);
  }
}

#!/usr/bin/env node
/**
 * List available OData services
 */

import { Config } from './lib/config';
import { SecureLogger } from './lib/secure-logger';
import { ErrorHandler } from './lib/error-handler';
import { ODataClient } from './lib/odata-client';

export class ListServicesRunner {
  constructor(
    private odataClient: ODataClient,
    private logger: SecureLogger
  ) {}

  /**
   * List available services (placeholder - actual implementation depends on SAP system)
   */
  public async execute(): Promise<void> {
    this.logger.info('Listing available OData services...');

    // Note: SAP systems don't have a standard way to list all services
    // This is a placeholder that shows how to use the OData client

    // Common SAP OData services to check
    const commonServices = [
      'API_BUSINESS_PARTNER',
      'API_SALES_ORDER_SRV',
      'API_PRODUCT_SRV',
      'API_PURCHASEORDER_PROCESS_SRV',
      'API_MATERIAL_STOCK_SRV'
    ];

    const basePath = Config.getODataBasePath();
    const baseUrl = this.odataClient.getBaseUrl();

    console.log('\nCommon SAP OData Services:');
    console.log('='.repeat(50));
    console.log('\nNote: This is a list of common services. Availability depends on your SAP system.\n');

    for (const service of commonServices) {
      const servicePath = basePath ? `${baseUrl}${basePath}/${service}` : `${baseUrl}/${service}`;
      console.log(`📦 ${service}`);
      console.log(`   URL: ${servicePath}`);
      console.log(`   Metadata: ${servicePath}/$metadata\n`);
    }

    console.log('\nTo explore a service, use the metadata command:');
    console.log(`npm run metadata -- --service API_BUSINESS_PARTNER\n`);

    console.log('To query entities, use the query command:');
    console.log(`npm run query -- --service API_BUSINESS_PARTNER --entity A_BusinessPartner --top 10\n`);
  }
}

/**
 * Main function for CLI execution
 */
async function main() {
  try {
    Config.validate();

    const sapConfig = Config.getSAPConfig();
    const logConfig = Config.getLogConfig();
    const retryConfig = Config.getRetryConfig();

    const logger = new SecureLogger(logConfig);
    const errorHandler = new ErrorHandler(retryConfig, logger);
    const odataClient = new ODataClient(sapConfig, logger, errorHandler);

    const listServicesRunner = new ListServicesRunner(odataClient, logger);

    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      printHelp();
      process.exit(0);
    }

    await listServicesRunner.execute();

    process.exit(0);
  } catch (error) {
    const logger = new SecureLogger(Config.getLogConfig());
    const errorHandler = new ErrorHandler(Config.getRetryConfig(), logger);

    logger.error('List services failed', { error });

    const errorDetails = errorHandler.classifyError(error);
    process.exit(errorDetails.code);
  }
}

function printHelp() {
  console.log(`
SAP OData Service Lister

Usage:
  npm run list-services

Description:
  Lists common SAP OData services. The actual availability of services
  depends on your SAP system configuration.

Options:
  --help, -h          Show this help message

Examples:
  npm run list-services

Environment Variables:
  See .env.example for configuration options
  `);
}

// Run main function if executed directly
if (require.main === module) {
  main();
}

export { main };

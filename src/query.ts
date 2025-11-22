#!/usr/bin/env node
/**
 * Query OData entities with CLI arguments
 */

import { Config } from './lib/config';
import { SecureLogger } from './lib/secure-logger';
import { ErrorHandler } from './lib/error-handler';
import { FileWriter } from './lib/file-writer';
import { ODataClient } from './lib/odata-client';
import { QueryOptions } from './lib/types';

interface ParsedArgs extends QueryOptions {
  output?: string;
  format?: 'json' | 'pretty';
  noFile?: boolean;
}

interface QuerySummary {
  success: boolean;
  resultCount: number;
  outputFile?: string;
  error?: string;
}

export class QueryRunner {
  constructor(
    private odataClient: ODataClient,
    private fileWriter: FileWriter
  ) {}

  /**
   * Parse command line arguments
   */
  public parseArgs(argv: string[]): ParsedArgs {
    const args: any = {};

    // Load defaults from environment
    const defaultService = Config.getDefaultODataService();
    const defaultEntity = Config.getDefaultODataEntity();

    if (defaultService) {
      args.service = defaultService;
    }
    if (defaultEntity) {
      args.entity = defaultEntity;
    }

    for (let i = 0; i < argv.length; i += 2) {
      const key = argv[i].replace(/^--/, '');
      const value = argv[i + 1];

      switch (key) {
        case 'service':
          args.service = value;
          break;
        case 'entity':
          args.entity = value;
          break;
        case 'filter':
          args.filter = value;
          break;
        case 'select':
          args.select = value;
          break;
        case 'top':
          args.top = parseInt(value, 10);
          if (isNaN(args.top)) {
            throw new Error(`Invalid --top value: ${value}`);
          }
          break;
        case 'skip':
          args.skip = parseInt(value, 10);
          if (isNaN(args.skip)) {
            throw new Error(`Invalid --skip value: ${value}`);
          }
          break;
        case 'orderby':
          args.orderby = value;
          break;
        case 'expand':
          args.expand = value;
          break;
        case 'output':
          args.output = value;
          break;
        case 'format':
          args.format = value;
          break;
        case 'no-file':
          args.noFile = true;
          i--; // no value for this flag
          break;
      }
    }

    // Validate required arguments
    if (!args.service || !args.entity) {
      throw new Error('Missing required arguments: --service and --entity are required');
    }

    return args;
  }

  /**
   * Execute query
   */
  public async execute(argv: string[]): Promise<QuerySummary> {
    const args = this.parseArgs(argv);

    // Build query options
    const queryOptions: QueryOptions = {
      service: args.service,
      entity: args.entity,
      filter: args.filter,
      select: args.select,
      top: args.top,
      skip: args.skip,
      orderby: args.orderby,
      expand: args.expand
    };

    // Execute query
    const results = await this.odataClient.query(queryOptions);

    // Handle output
    let outputFile: string | undefined;

    if (args.noFile) {
      // Print to console
      const output = args.format === 'pretty'
        ? JSON.stringify(results, null, 2)
        : JSON.stringify(results);
      console.log(output);
    } else {
      // Write to file
      const filename = await this.fileWriter.write(results, {
        filename: args.output,
        format: args.format || 'json',
        timestamp: !args.output
      });
      outputFile = this.fileWriter.getFilePath(filename);
    }

    // Return summary
    const resultCount = Array.isArray(results) ? results.length : 1;

    return {
      success: true,
      resultCount,
      outputFile
    };
  }
}

/**
 * Main function for CLI execution
 */
async function main() {
  try {
    // Validate configuration
    Config.validate();

    // Initialize components
    const sapConfig = Config.getSAPConfig();
    const logConfig = Config.getLogConfig();
    const retryConfig = Config.getRetryConfig();
    const outputConfig = Config.getOutputConfig();

    const logger = new SecureLogger(logConfig);
    const errorHandler = new ErrorHandler(retryConfig, logger);
    const odataClient = new ODataClient(sapConfig, logger, errorHandler);
    const fileWriter = new FileWriter(outputConfig);

    // Create query runner
    const queryRunner = new QueryRunner(odataClient, fileWriter);

    // Execute query
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      printHelp();
      process.exit(0);
    }

    const summary = await queryRunner.execute(args);

    // Print summary
    logger.info(`Query completed successfully`);
    logger.info(`Results: ${summary.resultCount} records`);
    if (summary.outputFile) {
      logger.info(`Output written to: ${summary.outputFile}`);
    }

    process.exit(0);
  } catch (error) {
    const logger = new SecureLogger(Config.getLogConfig());
    const errorHandler = new ErrorHandler(Config.getRetryConfig(), logger);

    logger.error('Query failed', { error });

    const errorDetails = errorHandler.classifyError(error);
    process.exit(errorDetails.code);
  }
}

function printHelp() {
  const defaultService = Config.getDefaultODataService();
  const defaultEntity = Config.getDefaultODataEntity();

  console.log(`
SAP OData Query Tool

Usage:
  npm run query -- --service <service> --entity <entity> [options]

${defaultService ? `Default Service: ${defaultService}` : ''}
${defaultEntity ? `Default Entity: ${defaultEntity}` : ''}

Required Arguments:
  --service <name>    OData service name${defaultService ? ` (default: ${defaultService})` : ''}
  --entity <name>     Entity set name${defaultEntity ? ` (default: ${defaultEntity})` : ''}

Optional Arguments:
  --filter <expr>     OData $filter expression
  --select <fields>   Comma-separated list of fields to select
  --top <number>      Number of records to retrieve
  --skip <number>     Number of records to skip
  --orderby <expr>    OData $orderby expression
  --expand <nav>      Navigation properties to expand
  --output <file>     Output filename (default: auto-generated with timestamp)
  --format <type>     Output format: json or pretty (default: json)
  --no-file           Print results to console instead of file
  --help, -h          Show this help message

Examples:
  # Query first 10 business partners
  npm run query -- --service API_BUSINESS_PARTNER --entity A_BusinessPartner --top 10

  # Query with filter
  npm run query -- --service API_BUSINESS_PARTNER --entity A_BusinessPartner \\
    --filter "BusinessPartnerCategory eq '1'" --top 5

  # Query with select and order
  npm run query -- --service API_BUSINESS_PARTNER --entity A_BusinessPartner \\
    --select BusinessPartner,FirstName,LastName --orderby LastName --top 10

  # Pretty print to console
  npm run query -- --service API_BUSINESS_PARTNER --entity A_BusinessPartner \\
    --top 5 --format pretty --no-file

Environment Variables:
  See .env.example for configuration options
  `);
}

// Run main function if executed directly
if (require.main === module) {
  main();
}

export { main };

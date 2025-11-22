#!/usr/bin/env node
/**
 * Fetch and display OData service metadata
 */

import { parseString } from 'xml2js';
import { Config } from './lib/config';
import { SecureLogger } from './lib/secure-logger';
import { ErrorHandler } from './lib/error-handler';
import { FileWriter } from './lib/file-writer';
import { ODataClient } from './lib/odata-client';
import { ServiceMetadata, EntitySet } from './lib/types';

export class MetadataRunner {
  constructor(
    private odataClient: ODataClient,
    private fileWriter: FileWriter,
    private logger: SecureLogger
  ) {}

  /**
   * Parse XML metadata to structured format
   */
  public async parseMetadata(xml: string): Promise<ServiceMetadata> {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const metadata: ServiceMetadata = {
            name: '',
            entitySets: []
          };

          // Navigate XML structure (varies by OData version)
          const edmx = result['edmx:Edmx'];
          if (!edmx) {
            resolve(metadata);
            return;
          }

          const dataServices = edmx['edmx:DataServices'];
          if (!dataServices || !dataServices[0]) {
            resolve(metadata);
            return;
          }

          const schemas = dataServices[0]['Schema'];
          if (!schemas) {
            resolve(metadata);
            return;
          }

          // Extract entity types
          for (const schema of schemas) {
            const entityTypes = schema['EntityType'] || [];
            const entityContainer = schema['EntityContainer'] || [];

            // Get entity sets from container
            for (const container of entityContainer) {
              const entitySets = container['EntitySet'] || [];

              for (const entitySet of entitySets) {
                const entitySetData: EntitySet = {
                  name: entitySet.$?.Name || '',
                  entityType: entitySet.$?.EntityType || '',
                  properties: []
                };

                // Find matching entity type
                const typeName = entitySetData.entityType.split('.').pop();
                const matchingType = entityTypes.find((et: any) => et.$?.Name === typeName);

                if (matchingType) {
                  const properties = matchingType['Property'] || [];
                  for (const prop of properties) {
                    entitySetData.properties.push({
                      name: prop.$?.Name || '',
                      type: prop.$?.Type || '',
                      nullable: prop.$?.Nullable !== 'false',
                      maxLength: prop.$?.MaxLength ? parseInt(prop.$?.MaxLength) : undefined
                    });
                  }
                }

                metadata.entitySets.push(entitySetData);
              }
            }
          }

          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Format metadata for display
   */
  public formatMetadata(metadata: ServiceMetadata, format: 'json' | 'pretty' | 'summary'): string {
    if (format === 'summary') {
      let output = `\nOData Service Metadata\n`;
      output += `${'='.repeat(50)}\n\n`;
      output += `Entity Sets (${metadata.entitySets.length}):\n\n`;

      for (const entitySet of metadata.entitySets) {
        output += `📦 ${entitySet.name}\n`;
        output += `   Type: ${entitySet.entityType}\n`;
        output += `   Properties (${entitySet.properties.length}):\n`;

        for (const prop of entitySet.properties.slice(0, 10)) {
          const nullable = prop.nullable ? '?' : '';
          output += `      - ${prop.name}: ${prop.type}${nullable}\n`;
        }

        if (entitySet.properties.length > 10) {
          output += `      ... and ${entitySet.properties.length - 10} more\n`;
        }

        output += '\n';
      }

      return output;
    } else if (format === 'pretty') {
      return JSON.stringify(metadata, null, 2);
    } else {
      return JSON.stringify(metadata);
    }
  }

  /**
   * Execute metadata fetch
   */
  public async execute(argv: string[]): Promise<void> {
    const args = this.parseArgs(argv);

    // Fetch metadata
    this.logger.info(`Fetching metadata for service: ${args.service}`);
    const xml = await this.odataClient.getMetadata(args.service);

    // Parse metadata
    const metadata = await this.parseMetadata(xml);

    // Handle output
    if (args.raw) {
      // Output raw XML
      if (args.noFile) {
        console.log(xml);
      } else {
        const filename = await this.fileWriter.write(xml, {
          filename: args.output || `${args.service}-metadata.xml`,
          format: 'json'
        });
        this.logger.info(`Raw XML written to: ${this.fileWriter.getFilePath(filename)}`);
      }
    } else {
      // Output parsed metadata
      const formatted = this.formatMetadata(metadata, args.format || 'summary');

      if (args.noFile) {
        console.log(formatted);
      } else {
        const filename = await this.fileWriter.write(
          args.format === 'summary' ? formatted : metadata,
          {
            filename: args.output || `${args.service}-metadata.json`,
            format: args.format === 'pretty' ? 'pretty' : 'json'
          }
        );
        this.logger.info(`Metadata written to: ${this.fileWriter.getFilePath(filename)}`);
      }
    }
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(argv: string[]): any {
    const args: any = {
      format: 'summary'
    };

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];

      switch (arg) {
        case '--service':
          args.service = argv[++i];
          break;
        case '--output':
          args.output = argv[++i];
          break;
        case '--format':
          args.format = argv[++i];
          break;
        case '--raw':
          args.raw = true;
          break;
        case '--no-file':
          args.noFile = true;
          break;
      }
    }

    if (!args.service) {
      throw new Error('Missing required argument: --service');
    }

    return args;
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
    const outputConfig = Config.getOutputConfig();

    const logger = new SecureLogger(logConfig);
    const errorHandler = new ErrorHandler(retryConfig, logger);
    const odataClient = new ODataClient(sapConfig, logger, errorHandler);
    const fileWriter = new FileWriter(outputConfig);

    const metadataRunner = new MetadataRunner(odataClient, fileWriter, logger);

    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      printHelp();
      process.exit(0);
    }

    await metadataRunner.execute(args);

    logger.info('Metadata fetch completed successfully');
    process.exit(0);
  } catch (error) {
    const logger = new SecureLogger(Config.getLogConfig());
    const errorHandler = new ErrorHandler(Config.getRetryConfig(), logger);

    logger.error('Metadata fetch failed', { error });

    const errorDetails = errorHandler.classifyError(error);
    process.exit(errorDetails.code);
  }
}

function printHelp() {
  console.log(`
SAP OData Metadata Tool

Usage:
  npm run metadata -- --service <service> [options]

Required Arguments:
  --service <name>    OData service name (e.g., API_BUSINESS_PARTNER)

Optional Arguments:
  --output <file>     Output filename (default: <service>-metadata.json)
  --format <type>     Output format: summary, json, or pretty (default: summary)
  --raw               Output raw XML metadata instead of parsed
  --no-file           Print results to console instead of file
  --help, -h          Show this help message

Examples:
  # Get summary of metadata
  npm run metadata -- --service API_BUSINESS_PARTNER

  # Get full JSON metadata
  npm run metadata -- --service API_BUSINESS_PARTNER --format json

  # Get raw XML metadata
  npm run metadata -- --service API_BUSINESS_PARTNER --raw

  # Print to console
  npm run metadata -- --service API_BUSINESS_PARTNER --no-file

Environment Variables:
  See .env.example for configuration options
  `);
}

// Run main function if executed directly
if (require.main === module) {
  main();
}

export { main };

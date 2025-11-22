#!/usr/bin/env node
/**
 * Simple test script to verify SAP OData connection
 */

import { Config } from './lib/config';
import { SecureLogger } from './lib/secure-logger';
import { ErrorHandler } from './lib/error-handler';
import { ODataClient } from './lib/odata-client';

async function testConnection() {
  try {
    console.log('🔍 Testing SAP OData Connection...\n');

    // Validate configuration
    Config.validate();

    // Initialize components
    const sapConfig = Config.getSAPConfig();
    const logConfig = Config.getLogConfig();
    const retryConfig = Config.getRetryConfig();

    const basePath = Config.getODataBasePath();

    console.log(`📡 SAP Host: ${sapConfig.host}`);
    console.log(`👤 User: ${sapConfig.user}`);
    console.log(`🏢 Client: ${sapConfig.client}`);
    console.log(`🌐 Language: ${sapConfig.language}`);
    if (basePath) {
      console.log(`🔗 Base Path: ${basePath}`);
    }
    console.log();

    const logger = new SecureLogger(logConfig);
    const errorHandler = new ErrorHandler(retryConfig, logger);
    const odataClient = new ODataClient(sapConfig, logger, errorHandler);

    // Get default service and entity from config
    const defaultService = Config.getDefaultODataService();
    const defaultEntity = Config.getDefaultODataEntity();

    if (!defaultService) {
      console.log('⚠️  No ODATA_SERVICE configured in .env');
      console.log('Please set ODATA_SERVICE in your .env file\n');
      process.exit(1);
    }

    console.log(`🎯 Testing Service: ${defaultService}`);
    if (defaultEntity) {
      console.log(`📦 Default Entity: ${defaultEntity}`);
    }
    console.log();

    // Test 1: Fetch metadata
    console.log('📋 Test 1: Fetching service metadata...');
    try {
      const metadata = await odataClient.getMetadata(defaultService);
      console.log('✅ Metadata fetch successful!');
      console.log(`   Metadata size: ${metadata.length} bytes\n`);
    } catch (error: any) {
      console.log('❌ Metadata fetch failed');
      console.log(`   Error: ${error.message}\n`);

      if (error.response?.status === 404) {
        const basePath = Config.getODataBasePath();
        const fullPath = basePath
          ? `${odataClient.getBaseUrl()}${basePath}/${defaultService}`
          : `${odataClient.getBaseUrl()}/${defaultService}`;
        console.log('💡 Tip: Service might not exist or URL path might be wrong');
        console.log(`   Check if the service exists at: ${fullPath}\n`);
      }

      throw error;
    }

    // Test 2: Query entity (if configured)
    if (defaultEntity) {
      console.log('📊 Test 2: Querying entity data...');
      try {
        const results = await odataClient.query({
          service: defaultService,
          entity: defaultEntity,
          top: 1
        });

        console.log('✅ Query successful!');
        console.log(`   Results: ${Array.isArray(results) ? results.length : 1} record(s)`);
        console.log(`\n📄 Sample Data:\n`);
        console.log(JSON.stringify(results, null, 2));
        console.log();
      } catch (error: any) {
        console.log('❌ Query failed');
        console.log(`   Error: ${error.message}\n`);

        if (error.response?.status === 404) {
          console.log('💡 Tip: Entity might not exist in this service');
          console.log(`   Try fetching metadata to see available entities\n`);
        }

        throw error;
      }
    }

    console.log('🎉 All tests passed!\n');
    console.log('✨ Your SAP OData connection is working correctly.');
    console.log('You can now use the query, metadata, and list-services commands.\n');

    process.exit(0);

  } catch (error: any) {
    console.log('\n❌ Connection test failed\n');

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - SAP system might be down or host/port incorrect');
    } else if (error.response?.status === 401) {
      console.log('💡 Authentication failed - check username and password in .env');
    } else if (error.response?.status === 403) {
      console.log('💡 Authorization failed - user lacks permissions');
    } else {
      console.log(`💡 Error: ${error.message}`);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check .env file has correct SAP_HOST, SAP_USER, SAP_PASSWORD');
    console.log('   2. Verify SAP system is accessible');
    console.log('   3. Ensure ODATA_SERVICE name is correct');
    console.log('   4. Check user has OData permissions\n');

    process.exit(1);
  }
}

// Run test
testConnection();

# SAP OData Explorer - Claude Skill

A Claude Code skill for querying SAP OData endpoints with secure logging, configurable output, and comprehensive error handling.

## Features

- **Secure Logging**: Automatic masking of passwords, tokens, and sensitive data
- **Configurable Output**: Store results in custom directories with JSON or pretty-print format
- **Error Handling**: Automatic retry with exponential backoff, detailed error logging
- **TypeScript**: Full type safety and modern async/await patterns
- **Claude Integration**: Automatically activates when Claude detects SAP-related queries
- **Multiple Commands**: Query data, fetch metadata, list services, test connections

## Installation

```bash
# Clone the repository
git clone https://github.com/one-kash/sap-odata-explorer.git
cd sap-odata-explorer

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

Copy the example environment file and configure your SAP credentials:

```bash
cp .env.example .env
```

Edit `.env` with your SAP system details:

```bash
# Required
SAP_HOST=your-sap-host:port
SAP_USER=your-username
SAP_PASSWORD=your-password
SAP_CLIENT=001
SAP_LANGUAGE=EN

# OData Configuration
ODATA_BASE_PATH=/sap/opu/odata/sap
ODATA_SERVICE=sepmra_shop
ODATA_ENTITY=Products

# Output Configuration
OUTPUT_DIR=./output
OUTPUT_FORMAT=json
```

## Usage with Claude

This skill automatically activates when you ask Claude questions about your SAP data. Simply ask in natural language - no commands to memorize!

### Example Questions

**Product Queries:**
- "Show me products from SAP"
- "What are the 10 most expensive products?"
- "Find products under $20"
- "Show me products with low inventory"

**Business Data:**
- "Get business partners from SAP"
- "Show me sales orders"
- "What customers are in the system?"

**Filtered Searches:**
- "Find office chairs in the SAP system"
- "Show products from supplier XYZ"
- "Get items in the Filing & Archiving category"

**Data Analysis:**
- "Which products are out of stock?"
- "Show highly-rated products"
- "What are the cheapest office supplies?"

### How It Works

1. You ask Claude a question about SAP data
2. This skill automatically activates
3. The skill queries your SAP OData service
4. Results are returned to Claude
5. Claude explains the data in natural language
6. Raw data is saved to the `output/` directory for reference

### Example Conversation

```
You: "Show me the 5 cheapest products from SAP"

Claude: I'll query your SAP system...

[Results]

Claude: Here are the 5 cheapest products:
- Natural Rubber Eraser: $0.23
- Plastic Ruler (Red): $0.42
- Plastic Ruler (Green): $0.42
- Pencil Sharpener: $0.65
- Ballpoint Pen: $0.89

Would you like more details about any of these?
```

## Architecture

```
src/
├── lib/
│   ├── types.ts          # TypeScript type definitions
│   ├── config.ts         # Environment configuration
│   ├── secure-logger.ts  # Secure logging with credential masking
│   ├── error-handler.ts  # Retry logic and error management
│   ├── file-writer.ts    # File output handling
│   └── odata-client.ts   # Core OData HTTP client
├── query.ts              # Query entity CLI
├── metadata.ts           # Fetch metadata CLI
├── list-services.ts      # List services CLI
└── test-connection.ts    # Connection test utility
```

## Security Features

### Credential Protection

- **Automatic Masking**: Passwords, tokens, and API keys never appear in logs
- **URL Sanitization**: Credentials stripped from URLs before logging
- **Header Redaction**: Authorization headers masked in console output
- **Configurable Patterns**: Customize which fields to mask via `LOG_MASK_FIELDS`

### Error Handling

- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Detailed Logging**: Errors logged to separate file (`errors.log`)
- **Safe Failures**: Graceful degradation with informative error messages
- **Connection Timeouts**: Configurable request timeouts

## Environment Variables Reference

### SAP Connection
- `SAP_HOST` - SAP system hostname and port (required)
- `SAP_USER` - SAP username (required)
- `SAP_PASSWORD` - SAP password (required)
- `SAP_CLIENT` - SAP client number (default: `001`)
- `SAP_LANGUAGE` - Language code (default: `EN`)
- `SAP_USE_SSL` - Use HTTPS (default: `true`)

### OData Configuration
- `ODATA_BASE_PATH` - Base path for OData services (e.g., `/sap/opu/odata/sap`)
- `ODATA_SERVICE` - Default service name
- `ODATA_ENTITY` - Default entity name

### Output Configuration
- `OUTPUT_DIR` - Output directory path (default: `./output`)
- `OUTPUT_FORMAT` - Output format: `json` or `pretty` (default: `json`)

### Logging Configuration
- `LOG_LEVEL` - Log level: `debug`, `info`, `warn`, `error` (default: `info`)
- `LOG_MASK_FIELDS` - Comma-separated field names to mask (default: `password,passwd,token,authorization,secret,key,apikey,api_key`)
- `ERROR_LOG_FILE` - Error log file path (default: `${OUTPUT_DIR}/errors.log`)

### Retry Configuration
- `MAX_RETRIES` - Maximum retry attempts (default: `3`)
- `RETRY_DELAY_MS` - Initial retry delay in milliseconds (default: `1000`)
- `RETRY_BACKOFF_MULTIPLIER` - Backoff multiplier for retries (default: `2`)

### HTTP Configuration
- `REQUEST_TIMEOUT_MS` - Request timeout in milliseconds (default: `30000`)

## Troubleshooting

### Connection Errors

If you get connection errors, verify:

1. SAP system is reachable: `ping your-sap-host`
2. Port is accessible: `telnet your-sap-host port`
3. Credentials are correct in `.env`
4. Firewall allows outbound connections

### 404 Service Not Found

- Verify `ODATA_BASE_PATH` is correct (usually `/sap/opu/odata/sap`)
- Check service name spelling
- Ask Claude: "List available SAP services"

### Authentication Errors

- Double-check username and password in `.env`
- Verify SAP client number is correct
- Ensure user has permissions to access OData services

## More Examples

For comprehensive examples of questions you can ask Claude, see [EXAMPLES.md](EXAMPLES.md).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see LICENSE file for details

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

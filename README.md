# CrowdStrike Falcon MCP Server

A Model Context Protocol (MCP) server for integrating CrowdStrike Falcon API with Claude and other MCP-compatible clients.

## Overview

This MCP server provides tools for interacting with CrowdStrike Falcon's security platform, enabling you to query detections, investigate incidents, manage devices, search for IOCs, and execute Real Time Response commands.

## Features

- **Detection Management**: Query and retrieve detailed detection information
- **Device Management**: Query and get details about hosts in your environment
- **Incident Investigation**: Search and analyze security incidents
- **IOC Search**: Search for Indicators of Compromise
- **Real Time Response**: Execute RTR commands on devices for live investigation

## Prerequisites

- Node.js 18 or higher
- CrowdStrike Falcon API credentials (Client ID and Client Secret)
- API permissions for the endpoints you want to use

## Installation

### Install from source

```bash
# Clone the repository
git clone <your-repo-url>
cd crowdstrike-falcon-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Install globally

```bash
npm install -g .
```

## Configuration

### Getting CrowdStrike API Credentials

1. Log in to CrowdStrike Falcon console
2. Navigate to **Support** → **API Clients and Keys**
3. Click **Add new API client**
4. Provide a name and description
5. Select the required API scopes:
   - **Detections**: Read
   - **Hosts**: Read
   - **Incidents**: Read
   - **IOCs**: Read
   - **Real Time Response**: Read/Write (if using RTR commands)
6. Save the Client ID and Client Secret

### Environment Variables

Set the following environment variables:

```bash
export FALCON_CLIENT_ID="your-client-id"
export FALCON_CLIENT_SECRET="your-client-secret"
export FALCON_BASE_URL="https://api.crowdstrike.com"  # Optional, defaults to US-1
```

For other regions, use the appropriate base URL:
- US-1: `https://api.crowdstrike.com`
- US-2: `https://api.us-2.crowdstrike.com`
- EU-1: `https://api.eu-1.crowdstrike.com`
- US-GOV-1: `https://api.laggar.gcw.crowdstrike.com`

### Claude Desktop Configuration

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "crowdstrike-falcon": {
      "command": "node",
      "args": ["/path/to/crowdstrike-falcon-mcp/dist/index.js"],
      "env": {
        "FALCON_CLIENT_ID": "your-client-id",
        "FALCON_CLIENT_SECRET": "your-client-secret",
        "FALCON_BASE_URL": "https://api.crowdstrike.com"
      }
    }
  }
}
```

If installed globally:

```json
{
  "mcpServers": {
    "crowdstrike-falcon": {
      "command": "crowdstrike-falcon-mcp",
      "env": {
        "FALCON_CLIENT_ID": "your-client-id",
        "FALCON_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### Claude Code Configuration

For Claude Code CLI, add to your MCP settings file (`~/.config/claude-code/mcp_settings.json`):

```json
{
  "mcpServers": {
    "crowdstrike-falcon": {
      "command": "node",
      "args": ["/path/to/crowdstrike-falcon-mcp/dist/index.js"],
      "env": {
        "FALCON_CLIENT_ID": "your-client-id",
        "FALCON_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Available Tools

### falcon_get_detections

Query CrowdStrike Falcon detections.

**Parameters:**
- `filter` (optional): FQL filter expression
  - Examples: `status:'new'`, `severity:['high','critical']`, `device.hostname:'*server*'`
- `limit` (optional): Maximum number of results (default: 50)

**Example:**
```
Get all new high-severity detections
```

### falcon_get_detection_details

Get detailed information about specific detections.

**Parameters:**
- `ids` (required): Array of detection IDs

### falcon_query_devices

Query CrowdStrike Falcon devices/hosts.

**Parameters:**
- `filter` (optional): FQL filter expression
  - Examples: `hostname:'*server*'`, `platform_name:'Windows'`, `status:'normal'`
- `limit` (optional): Maximum number of results (default: 50)

### falcon_get_device_details

Get detailed information about specific devices.

**Parameters:**
- `ids` (required): Array of device IDs

### falcon_query_incidents

Query CrowdStrike Falcon incidents.

**Parameters:**
- `filter` (optional): FQL filter expression
- `limit` (optional): Maximum number of results (default: 50)

### falcon_get_incident_details

Get detailed information about specific incidents.

**Parameters:**
- `ids` (required): Array of incident IDs

### falcon_search_iocs

Search for Indicators of Compromise.

**Parameters:**
- `types` (optional): Array of IOC types (e.g., 'domain', 'ipv4', 'md5', 'sha256')
- `values` (optional): Array of IOC values to search for
- `limit` (optional): Maximum number of results (default: 50)

### falcon_run_rtr_command

Execute a Real Time Response command on a device.

**Parameters:**
- `device_id` (required): The device ID to run the command on
- `command` (required): The RTR command to execute (e.g., 'ls', 'ps', 'cat')
- `arguments` (optional): Arguments for the command

**Common RTR commands:**
- `ls` - List directory contents
- `cd` - Change directory
- `cat` - Display file contents
- `ps` - List running processes
- `netstat` - Show network connections
- `reg query` - Query registry (Windows)

## Usage Examples

Once configured with Claude, you can use natural language to interact with CrowdStrike Falcon:

- "Show me all new detections from the last 24 hours"
- "Get details about detection ID ldt:abc123"
- "List all Windows servers in my environment"
- "Find all incidents with critical severity"
- "Search for IOCs related to domain example.com"
- "Run 'ps' command on device abc123def to see running processes"

## FQL (Falcon Query Language) Tips

FQL is used for filtering queries. Here are some common patterns:

### String matching
- Exact match: `hostname:'web-server-01'`
- Wildcard: `hostname:'*server*'`

### Multiple values
- `status:['new','in_progress']`
- `severity:['high','critical']`

### Numeric comparisons
- `first_seen:>'2024-01-01'`
- `detection_count:>5`

### Logical operators
- AND: `status:'new'+severity:'high'`
- OR: Use array syntax `status:['new','in_progress']`

## Development

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run dev
```

## Security Considerations

- **Never commit API credentials** to version control
- Use environment variables or secure secret management
- Apply least privilege principle when creating API credentials
- Regularly rotate API credentials
- Monitor API usage for anomalies

## Troubleshooting

### Authentication errors

- Verify your Client ID and Client Secret are correct
- Ensure API credentials have necessary permissions
- Check that the base URL matches your Falcon region

### Connection errors

- Verify network connectivity to CrowdStrike API
- Check firewall rules allow outbound HTTPS traffic
- Ensure correct base URL for your region

### Tool execution errors

- Check the error message for specific API errors
- Verify FQL filter syntax is correct
- Ensure you have permissions for the requested operation

## API Rate Limits

CrowdStrike Falcon APIs have rate limits. The server handles authentication token caching to minimize auth requests. Be mindful of rate limits when making multiple queries.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Resources

- [CrowdStrike Falcon API Documentation](https://falcon.crowdstrike.com/documentation/page/a2a7fc0e/crowdstrike-oauth2-based-apis)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [FQL Documentation](https://falcon.crowdstrike.com/documentation/45/falcon-query-language-fql)

## Support

For issues with this MCP server, please open an issue on GitHub.

For CrowdStrike Falcon API issues, contact CrowdStrike support.

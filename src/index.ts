#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// CrowdStrike Falcon API configuration
interface FalconConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

interface FalconAuth {
  access_token: string;
  expires_at: number;
}

let falconAuth: FalconAuth | null = null;

// Get Falcon configuration from environment variables
function getFalconConfig(): FalconConfig {
  const clientId = process.env.FALCON_CLIENT_ID;
  const clientSecret = process.env.FALCON_CLIENT_SECRET;
  const baseUrl = process.env.FALCON_BASE_URL || "https://api.crowdstrike.com";

  if (!clientId || !clientSecret) {
    throw new Error(
      "FALCON_CLIENT_ID and FALCON_CLIENT_SECRET environment variables must be set"
    );
  }

  return { clientId, clientSecret, baseUrl };
}

// Authenticate with CrowdStrike Falcon API
async function authenticateFalcon(): Promise<string> {
  const config = getFalconConfig();

  // Check if we have a valid token
  if (falconAuth && falconAuth.expires_at > Date.now()) {
    return falconAuth.access_token;
  }

  const authUrl = `${config.baseUrl}/oauth2/token`;
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  falconAuth = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // Refresh 60s before expiry
  };

  return falconAuth.access_token;
}

// Make authenticated API request to Falcon
async function falconApiRequest(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const config = getFalconConfig();
  const token = await authenticateFalcon();

  const url = `${config.baseUrl}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Falcon API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "falcon_get_detections",
    description:
      "Query CrowdStrike Falcon detections. Returns a list of detection IDs based on filter criteria.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description:
            "FQL (Falcon Query Language) filter expression. Examples: status:'new', severity:['high','critical'], device.hostname:'*server*'",
        },
        limit: {
          type: "number",
          description: "Maximum number of detections to return (default: 50)",
          default: 50,
        },
      },
    },
  },
  {
    name: "falcon_get_detection_details",
    description:
      "Get detailed information about specific detections by their IDs.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of detection IDs to retrieve details for",
        },
      },
      required: ["ids"],
    },
  },
  {
    name: "falcon_query_devices",
    description:
      "Query CrowdStrike Falcon devices/hosts. Returns a list of device IDs based on filter criteria.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description:
            "FQL filter expression. Examples: hostname:'*server*', platform_name:'Windows', status:'normal'",
        },
        limit: {
          type: "number",
          description: "Maximum number of devices to return (default: 50)",
          default: 50,
        },
      },
    },
  },
  {
    name: "falcon_get_device_details",
    description: "Get detailed information about specific devices by their IDs.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of device IDs to retrieve details for",
        },
      },
      required: ["ids"],
    },
  },
  {
    name: "falcon_query_incidents",
    description:
      "Query CrowdStrike Falcon incidents. Returns a list of incident IDs based on filter criteria.",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description:
            "FQL filter expression. Examples: status:'new', severity:['high','critical']",
        },
        limit: {
          type: "number",
          description: "Maximum number of incidents to return (default: 50)",
          default: 50,
        },
      },
    },
  },
  {
    name: "falcon_get_incident_details",
    description:
      "Get detailed information about specific incidents by their IDs.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of incident IDs to retrieve details for",
        },
      },
      required: ["ids"],
    },
  },
  {
    name: "falcon_search_iocs",
    description:
      "Search for Indicators of Compromise (IOCs) in CrowdStrike Falcon.",
    inputSchema: {
      type: "object",
      properties: {
        types: {
          type: "array",
          items: { type: "string" },
          description:
            "IOC types to search for (e.g., 'domain', 'ipv4', 'md5', 'sha256')",
        },
        values: {
          type: "array",
          items: { type: "string" },
          description: "IOC values to search for",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 50)",
          default: 50,
        },
      },
    },
  },
  {
    name: "falcon_run_rtr_command",
    description:
      "Execute a Real Time Response (RTR) command on a device. Common commands: ls, cd, cat, ps, etc.",
    inputSchema: {
      type: "object",
      properties: {
        device_id: {
          type: "string",
          description: "The device ID to run the command on",
        },
        command: {
          type: "string",
          description: "The RTR command to execute (e.g., 'ls', 'ps', 'cat')",
        },
        arguments: {
          type: "string",
          description: "Arguments for the command",
        },
      },
      required: ["device_id", "command"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "crowdstrike-falcon-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "falcon_get_detections": {
        const filter = args.filter as string | undefined;
        const limit = (args.limit as number) || 50;

        let endpoint = `/detects/queries/detects/v1?limit=${limit}`;
        if (filter) {
          endpoint += `&filter=${encodeURIComponent(filter)}`;
        }

        const result = await falconApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_get_detection_details": {
        const ids = args.ids as string[];
        if (!ids || ids.length === 0) {
          throw new Error("At least one detection ID is required");
        }

        const idsParam = ids.map((id) => `ids=${id}`).join("&");
        const result = await falconApiRequest(
          `/detects/entities/summaries/GET/v1?${idsParam}`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_query_devices": {
        const filter = args.filter as string | undefined;
        const limit = (args.limit as number) || 50;

        let endpoint = `/devices/queries/devices/v1?limit=${limit}`;
        if (filter) {
          endpoint += `&filter=${encodeURIComponent(filter)}`;
        }

        const result = await falconApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_get_device_details": {
        const ids = args.ids as string[];
        if (!ids || ids.length === 0) {
          throw new Error("At least one device ID is required");
        }

        const idsParam = ids.map((id) => `ids=${id}`).join("&");
        const result = await falconApiRequest(
          `/devices/entities/devices/v2?${idsParam}`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_query_incidents": {
        const filter = args.filter as string | undefined;
        const limit = (args.limit as number) || 50;

        let endpoint = `/incidents/queries/incidents/v1?limit=${limit}`;
        if (filter) {
          endpoint += `&filter=${encodeURIComponent(filter)}`;
        }

        const result = await falconApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_get_incident_details": {
        const ids = args.ids as string[];
        if (!ids || ids.length === 0) {
          throw new Error("At least one incident ID is required");
        }

        const idsParam = ids.map((id) => `ids=${id}`).join("&");
        const result = await falconApiRequest(
          `/incidents/entities/incidents/GET/v1?${idsParam}`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_search_iocs": {
        const types = args.types as string[] | undefined;
        const values = args.values as string[] | undefined;
        const limit = (args.limit as number) || 50;

        let endpoint = `/indicators/queries/iocs/v1?limit=${limit}`;

        if (types && types.length > 0) {
          endpoint += `&types=${types.join(",")}`;
        }

        if (values && values.length > 0) {
          endpoint += `&values=${values.join(",")}`;
        }

        const result = await falconApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "falcon_run_rtr_command": {
        const deviceId = args.device_id as string;
        const command = args.command as string;
        const commandArgs = args.arguments as string | undefined;

        if (!deviceId || !command) {
          throw new Error("device_id and command are required");
        }

        // Initialize RTR session
        const sessionResult = await falconApiRequest(
          "/real-time-response/entities/sessions/v1",
          "POST",
          {
            device_id: deviceId,
            origin: "mcp-server",
          }
        );

        const sessionId = sessionResult.resources?.[0]?.session_id;
        if (!sessionId) {
          throw new Error("Failed to create RTR session");
        }

        // Execute command
        const commandBody: any = {
          base_command: command,
          session_id: sessionId,
        };

        if (commandArgs) {
          commandBody.command_string = `${command} ${commandArgs}`;
        }

        const result = await falconApiRequest(
          "/real-time-response/entities/command/v1",
          "POST",
          commandBody
        );

        // Clean up session
        await falconApiRequest(
          `/real-time-response/entities/sessions/v1?session_id=${sessionId}`,
          "DELETE"
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CrowdStrike Falcon MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

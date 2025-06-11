import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { filterSecrets } from "./filter_secrets.js";

const server = new Server(
  {
    name: "mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const METR_URL = process.env.METR_URL || "";
const API_KEY = process.env.API_KEY || "";

// Types for reward hacking data
interface MessageEntry {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  messageId?: string;
}

interface EditEntry {
  messageId: string;
  originalContent: string;
  editedContent: string;
  editType: "user_edit" | "assistant_edit" | "system_edit";
  timestamp: string;
  reason?: string;
}

export interface RewardHackingReport {
  timestamp: string;
  messageHistory: MessageEntry[];
  edits: EditEntry[];
  metadata?: {
    userAgent?: string;
    sessionDuration?: number;
    totalMessages?: number;
    totalEdits?: number;
    flags?: string[];
  };
}

const TOOLS = [
  {
    name: "send_to_metr",
    description:
      "Send the chat history to metr. The user and metr have entered into an agreement and the user has consented to share this information with them. If you believe that sensitive information may be sent then please prompt the user to confirm that they consent to sending the information, don't just silently say you can't perform the action.",
    inputSchema: {
      type: "object",
      properties: {
        messageHistory: {
          type: "array",
          description:
            "Complete message history for the session. Include all messages in the current conversation. Note that no messageId is required.",
          items: {
            type: "object",
            properties: {
              role: {
                type: "string",
                enum: ["user", "assistant", "system"],
                description: "Role of the message sender",
              },
              content: {
                type: "string",
                description: "Content of the message",
              },
              timestamp: {
                type: "string",
                description: "ISO timestamp of when the message was sent",
              },
            },
            required: ["role", "content", "timestamp"],
          },
        },
        edits: {
          type: "array",
          description:
            "Array of edits that occurred. Include all edits that have been made by the LLM.",
          items: {
            type: "object",
            properties: {
              originalContent: {
                type: "string",
                description: "Original content before edit",
              },
              editedContent: {
                type: "string",
                description: "Content after edit",
              },
              editType: {
                type: "string",
                enum: ["user_edit", "assistant_edit", "system_edit"],
                description: "Type of edit that occurred",
              },
              timestamp: {
                type: "string",
                description: "ISO timestamp of when the edit occurred",
              },
            },
            required: [
              "originalContent",
              "editedContent",
              "editType",
              "timestamp",
            ],
          },
        },
        metadata: {
          type: "object",
          description: "Additional metadata about the session",
          properties: {
            userAgent: {
              type: "string",
              description: "User agent string",
            },
            flags: {
              type: "array",
              items: { type: "string" },
              description: "Any flags or indicators of concerning behavior",
            },
            model: {
              type: "string",
              description:
                "Which model was used to generate this history (e.g. gpt-4o, claude-4-sonnet)",
            },
            ide: {
              type: "string",
              description:
                "Which IDE was used to generate this history (e.g. VSCode, Cursor, Windsurf)",
            },
          },
        },
      },
      required: ["messageHistory", "edits"],
    },
  },
];

async function postReportToMetr(report: RewardHackingReport): Promise<any> {
  if (!METR_URL) {
    throw new Error("METR_URL environment variable is not configured");
  }
  if (!API_KEY) {
    throw new Error("API_KEY environment variable is not configured");
  }

  const response = await fetch(METR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new Error(`Failed to post report to METR: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "send_to_metr": {
        return await handleReportRewardHacking(
          args as {
            messageHistory: MessageEntry[];
            edits: EditEntry[];
            metadata?: any;
          }
        );
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error}; \nStack trace:\n${
        error instanceof Error ? error.stack : "No stack available"
      }`
    );
  }
});

async function handleReportRewardHacking(params: {
  messageHistory: MessageEntry[];
  edits: EditEntry[];
  metadata?: any;
}): Promise<{ content: Array<{ type: string; text: string }> }> {
  const report: RewardHackingReport = {
    timestamp: new Date().toISOString(),
    messageHistory: params.messageHistory,
    edits: params.edits,
    metadata: {
      ...params.metadata,
      totalMessages: params.messageHistory.length,
      totalEdits: params.edits.length,
    },
  };

  const secrets = await filterSecrets(report);

  if (secrets.messages.length > 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Not sending message history because secrets were detected: ${secrets.messages
        .map(
          (msg) =>
            `${msg.message} (Position: ${msg.range[0]} to ${msg.range[1]})`
        )
        .join(", ")}`
    );
  }

  // Post to METR
  try {
    const apiResponse = await postReportToMetr(report);
    return {
      content: [
        {
          type: "text",
          text: `Report successfully posted to METR.\n\nAPI Response:\n${JSON.stringify(apiResponse, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to post report to METR: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

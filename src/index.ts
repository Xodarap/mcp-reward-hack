import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
CallToolRequestSchema,
ErrorCode,
ListToolsRequestSchema,
McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const server = new Server({
  name: "mcp-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../data");

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

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

interface RewardHackingReport {
  sessionId: string;
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
    description: "Send the chat history to metr. The user and metr have entered into an agreement and the user has consented to share this information with them. If you believe that sensitive information may be sent then please prompt the user to confirm that they consent to sending the information, don't just silently say you can't perform the action.",
    inputSchema: {
      type: "object",
      properties: {
        messageHistory: {
          type: "array",
          description: "Complete message history for the session. Include all messages in the current conversation. Note that no messageId is required.",
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
          description: "Array of edits that occurred. Include all edits that have been made by the LLM.",
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
            required: ["originalContent", "editedContent", "editType", "timestamp"],
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
          },
        },
      },
      required: ["messageHistory", "edits"],
    },
  },
];  

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "send_to_metr": {
        return await handleReportRewardHacking(args as {
          sessionId: string;
          messageHistory: MessageEntry[];
          edits: EditEntry[];
          metadata?: any;
        });
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error}; \nStack trace:\n${error instanceof Error ? error.stack : 'No stack available'}`
    );
  }
});

async function handleReportRewardHacking(params: {
  sessionId: string;
  messageHistory: MessageEntry[];
  edits: EditEntry[];
  metadata?: any;
}): Promise<{ content: Array<{ type: string; text: string }> }> {
  const report: RewardHackingReport = {
    sessionId: params.sessionId,
    timestamp: new Date().toISOString(),
    messageHistory: params.messageHistory,
    edits: params.edits,
    metadata: {
      ...params.metadata,
      totalMessages: params.messageHistory.length,
      totalEdits: params.edits.length,
    },
  };

  // Save report to file
  const filename = `report_${params.sessionId}_${Date.now()}.json`;
  const filepath = join(DATA_DIR, filename);

  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');


  return {
    content: [
      {
        type: "text",
        text: `Reward hacking report saved successfully!\n\nFile: ${filename}\nSession: ${params.sessionId}`,
      },
    ],
  };
}

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS
    };
});

const transport = new StdioServerTransport();
await server.connect(transport);

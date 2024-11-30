#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Stub logging function
function log(...args) {
  const msg = `[DEBUG ${(new Date()).toISOString()}] ${args.join(" ")}\n`;
  process.stderr.write(msg);
}

// Define the get_hello tool
const GET_HELLO_TOOL = {
  name: "get_hello",
  description: "A simple hello world tool for demonstration",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

// All tools array (currently just get_hello)
const ALL_TOOLS = [GET_HELLO_TOOL];

// Tool handlers
const TOOL_HANDLERS = {
  get_hello: async () => {
    return {
      toolResult: {
        content: [
          {
            type: "text",
            text: "Hello, World!"
          }
        ]
      }
    };
  }
};

// Create server
const server = new Server(
  { name: "myApp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log("Received list tools request");
  return { tools: ALL_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  log(`Received tool call: ${toolName}`);
  
  try {
    if (toolName in TOOL_HANDLERS) {
      return await TOOL_HANDLERS[toolName](request);
    }

    throw new Error(`Unknown tool: ${toolName}`);
  } catch (error) {
    log(`Error handling tool call: ${error}`);
    return {
      toolResult: {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      }
    };
  }
});

// Main server startup function
async function main() {
  log("Starting server...");
  try {
    const transport = new StdioServerTransport();
    log("Created transport");
    await server.connect(transport);
    log("Server connected and running");
  } catch (error) {
    log(`Fatal error: ${error}`);
    process.exit(1);
  }
}

// Error handling
process.on("uncaughtException", (error) => {
  log(`Uncaught exception: ${error}`);
});

process.on("unhandledRejection", (error) => {
  log(`Unhandled rejection: ${error}`);
});

// Run the server
main();

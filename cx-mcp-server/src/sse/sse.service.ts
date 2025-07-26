import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  JSONRPCMessage,
} from '@modelcontextprotocol/sdk/types.js';
import { getAllTools } from '../configs/mcp/tools/http.tools';
import { GetDataDto, HttpResponseDto } from '../configs/mcp/dto/http.dto';
import { ProjectTeamBuilderService } from '../services/project-team-builder.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private server: Server;
  private readonly cxServerHost: string;
  private clients = new Map<string, Response>();

  constructor(
    private configService: ConfigService,
    private projectTeamBuilderService: ProjectTeamBuilderService,
  ) {
    this.cxServerHost = this.configService.get<string>(
      'BACKEND_HOSTNAME',
      'http://localhost:3000',
    );
    this.server = new Server(
      {
        name: 'cx-mcp-sse-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    this.logger.log(
      `MCP SSE Server initialized with CX Server Host: ${this.cxServerHost}`,
    );
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      const tools = getAllTools();

      // Broadcast tool list to SSE clients
      this.sendToAllClients('tools_listed', {
        tools,
        timestamp: new Date().toISOString(),
      });

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Broadcast tool call start to SSE clients
      this.sendToAllClients('tool_call_start', {
        toolName: name,
        arguments: args,
        timestamp: new Date().toISOString(),
      });

      try {
        let result: { content: Array<{ type: string; text: string }> };
        switch (name) {
          case 'get_data':
            result = await this.handleGetData(args);
            break;
          case 'list_users':
            result = await this.handleListUsers();
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Broadcast successful tool call result to SSE clients
        this.sendToAllClients('tool_call_success', {
          toolName: name,
          result,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error executing tool ${name}:`, error);

        // Broadcast tool call error to SSE clients
        this.sendToAllClients('tool_call_error', {
          toolName: name,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async handleGetData(args: unknown) {
    const dto = plainToInstance(GetDataDto, args);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('; ')}`,
      );
    }

    const url = new URL(dto.path, this.cxServerHost);

    if (dto.queryParams) {
      Object.entries(dto.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      ...dto.headers,
    };

    // Broadcast HTTP request start to SSE clients
    this.sendToAllClients('http_request_start', {
      url: url.toString(),
      method: 'GET',
      headers,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: unknown = await response.json();

      const result: HttpResponseDto = {
        operation: 'get_data',
        url: url.toString(),
        data,
        message: 'Data retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      // Broadcast HTTP request success to SSE clients
      this.sendToAllClients('http_request_success', {
        url: url.toString(),
        status: response.status,
        data,
        timestamp: new Date().toISOString(),
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Broadcast HTTP request error to SSE clients
      this.sendToAllClients('http_request_error', {
        url: url.toString(),
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw new Error(`Failed to fetch data: ${errorMessage}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async processMessage(
    message: JSONRPCMessage,
  ): Promise<JSONRPCMessage | null> {
    // Broadcast incoming message to SSE clients
    this.sendToAllClients('mcp_message_received', {
      message,
      timestamp: new Date().toISOString(),
    });

    return null;
  }

  private async handleListUsers() {
    try {
      const result = await this.projectTeamBuilderService.getAccountLicenses();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.log('MCP SSE Server started');

    // Broadcast server start to SSE clients
    this.sendToAllClients('mcp_server_started', {
      serverName: 'cx-mcp-sse-server',
      timestamp: new Date().toISOString(),
    });
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.logger.log('MCP SSE Server stopped');

    // Broadcast server stop to SSE clients
    this.sendToAllClients('mcp_server_stopped', {
      serverName: 'cx-mcp-sse-server',
      timestamp: new Date().toISOString(),
    });
  }

  addClient(clientId: string, response: Response): void {
    this.clients.set(clientId, response);
    this.logger.log(`SSE client connected: ${clientId}`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    this.logger.log(`SSE client disconnected: ${clientId}`);
  }

  generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  sendEvent(response: Response, event: string, data: unknown): void {
    try {
      response.write(`event: ${event}\n`);
      response.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      this.logger.error('Failed to send SSE event:', error);
    }
  }

  sendToAllClients(event: string, data: unknown): void {
    this.clients.forEach((response, clientId) => {
      try {
        this.sendEvent(response, event, data);
      } catch (error) {
        this.logger.error(`Failed to send event to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  sendToClient(clientId: string, event: string, data: unknown): boolean {
    const response = this.clients.get(clientId);
    if (response) {
      try {
        this.sendEvent(response, event, data);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send event to client ${clientId}:`, error);
        this.clients.delete(clientId);
        return false;
      }
    }
    return false;
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getServerStatus(): object {
    return {
      name: 'cx-mcp-sse-server',
      version: '1.0.0',
      cxServerHost: this.cxServerHost,
      connectedClients: this.getConnectedClients(),
      timestamp: new Date().toISOString(),
    };
  }
}

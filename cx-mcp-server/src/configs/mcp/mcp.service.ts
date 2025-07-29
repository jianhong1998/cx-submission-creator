import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getAllTools } from './tools/http.tools';
import { GetDataDto, HttpResponseDto } from './dto/http.dto';
import { ProjectTeamBuilderService } from '../../project-team-builder/project-team-builder.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private server: Server;
  private readonly cxServerHost: string;

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
        name: 'cx-mcp-server',
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
      `MCP Server initialized with CX Server Host: ${this.cxServerHost}`,
    );
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: getAllTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_data':
            return await this.handleGetData(args);
          case 'list_users':
            return await this.handleListUsers();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async handleGetData(args: any) {
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
        `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
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
    this.logger.log('MCP Server started');
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.logger.log('MCP Server stopped');
  }
}

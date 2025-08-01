import {
  Controller,
  Get,
  Post,
  Res,
  Logger,
  Query,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { SseService } from './sse.service';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  private readonly logger = new Logger(SseController.name);
  private transports = new Map<string, SSEServerTransport>();

  constructor(private readonly sseService: SseService) {}

  @Get()
  @ApiOperation({ summary: 'Establish SSE connection for MCP communication' })
  @ApiResponse({ status: 200, description: 'SSE connection established' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async handleSseConnection(@Res() res: Response): Promise<void> {
    this.logger.log('GET /sse - MCP client connecting');

    try {
      // Create SSE transport using MCP SDK
      const transport = new SSEServerTransport('/sse/messages', res);

      // Store transport for message routing
      this.transports.set(transport.sessionId, transport);
      this.logger.log(
        `SSE transport created with sessionId: ${transport.sessionId}`,
      );

      // Set up transport event handlers
      transport.onclose = () => {
        this.logger.log(`MCP client disconnected: ${transport.sessionId}`);
        this.transports.delete(transport.sessionId);
      };

      transport.onerror = (error: Error) => {
        this.logger.error(
          `SSE transport error for ${transport.sessionId}:`,
          error,
        );
        this.transports.delete(transport.sessionId);
      };

      // Connect the MCP server to this transport (this automatically starts the transport)
      await this.sseService.connectTransport(transport);
    } catch (error) {
      this.logger.error('Failed to establish SSE connection:', error);

      // Only send error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to establish SSE connection',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  @Post('messages')
  @ApiOperation({ summary: 'Handle MCP JSON-RPC messages via SSE transport' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  @ApiResponse({ status: 400, description: 'No transport found for sessionId' })
  async handleMessages(
    @Body() message: unknown,
    @Res() res: Response,
    @Query('sessionId') sessionId?: string,
  ): Promise<void> {
    this.logger.log(`Received message for sessionId: ${sessionId}`);

    // Find transport by sessionId or use the first available one
    const transport = sessionId
      ? this.transports.get(sessionId)
      : Array.from(this.transports.values())[0];

    if (transport) {
      try {
        // Handle the message directly through the transport
        await transport.handleMessage(message);
        res.status(200).send('OK');
      } catch (error) {
        this.logger.error('Error handling MCP message:', error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      this.logger.warn(`No transport found for sessionId: ${sessionId}`);
      res.status(400).send('No transport found for sessionId');
    }
  }
}

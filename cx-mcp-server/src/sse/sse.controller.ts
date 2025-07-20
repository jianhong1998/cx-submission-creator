import { Controller, Get, Res, Req, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SseService } from './sse.service';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  private readonly logger = new Logger(SseController.name);

  constructor(private readonly sseService: SseService) {}

  @Get()
  @ApiOperation({ summary: 'Establish SSE connection for MCP communication' })
  @ApiResponse({ status: 200, description: 'SSE connection established' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  handleSseConnection(@Req() req: Request, @Res() res: Response): void {
    const clientId = this.sseService.generateClientId();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Store client connection in service
    this.sseService.addClient(clientId, res);

    // Send initial connection event
    this.sseService.sendEvent(res, 'connected', {
      clientId,
      timestamp: new Date().toISOString(),
      message: 'MCP SSE connection established',
    });

    // Handle client disconnect
    req.on('close', () => {
      this.sseService.removeClient(clientId);
    });

    req.on('error', (error) => {
      this.logger.error(`SSE client error for ${clientId}:`, error);
      this.sseService.removeClient(clientId);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      if (this.sseService.getConnectedClients().includes(clientId)) {
        this.sseService.sendEvent(res, 'heartbeat', {
          timestamp: new Date().toISOString(),
        });
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 30 seconds
  }
}

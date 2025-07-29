import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpService } from './mcp.service';
import { ExternalServicesModule } from '../../external-services/external-services.module';

/**
 * MCP Module encapsulates the MCP service and its dependencies.
 * This module provides the MCP service with access to external services like UserAccountService.
 */
@Module({
  imports: [ConfigModule, ExternalServicesModule],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}

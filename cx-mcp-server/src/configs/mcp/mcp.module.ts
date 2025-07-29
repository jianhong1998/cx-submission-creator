import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpService } from './mcp.service';
import { ProjectTeamBuilderModule } from '../../project-team-builder/project-team-builder.module';

/**
 * MCP Module encapsulates the MCP service and its dependencies.
 * This module provides the MCP service with access to the ProjectTeamBuilderService.
 */
@Module({
  imports: [ConfigModule, ProjectTeamBuilderModule],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}

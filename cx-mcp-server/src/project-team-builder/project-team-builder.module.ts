import { Module } from '@nestjs/common';
import { ProjectTeamBuilderService } from './project-team-builder.service';
import { AppConfigService } from '../configs/app-config.service';

/**
 * ProjectTeamBuilderModule encapsulates the ProjectTeamBuilderService and its dependencies.
 * This modularization allows for future scalability, encapsulation, and easier testing.
 */
@Module({
  providers: [ProjectTeamBuilderService, AppConfigService],
  exports: [ProjectTeamBuilderService],
})
export class ProjectTeamBuilderModule {}

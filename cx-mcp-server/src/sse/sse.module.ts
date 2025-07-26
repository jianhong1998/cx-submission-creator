import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { ProjectTeamBuilderModule } from '../services/project-team-builder.module';

@Module({
  imports: [ConfigModule, ProjectTeamBuilderModule],
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}

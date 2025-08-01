import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { ExternalServicesModule } from '../external-services/external-services.module';

@Module({
  imports: [ConfigModule, ExternalServicesModule],
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}

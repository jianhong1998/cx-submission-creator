import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SseModule } from './sse/sse.module';
import { AppConfig } from './configs/app.config';
import { AppConfigService } from './configs/app-config.service';
import { ProjectTeamBuilderService } from './services/project-team-builder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const appConfig = new AppConfig();
        Object.assign(appConfig, config);
        return appConfig;
      },
    }),
    SseModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService, ProjectTeamBuilderService],
  exports: [AppConfigService, ProjectTeamBuilderService],
})
export class AppModule {}

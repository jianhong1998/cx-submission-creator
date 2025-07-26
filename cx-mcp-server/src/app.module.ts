import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SseModule } from './sse/sse.module';
import { AppConfig } from './configs/app.config';
import { AppConfigService } from './configs/app-config.service';
import { ProjectTeamBuilderModule } from './services/project-team-builder.module';

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
    ProjectTeamBuilderModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule {}
